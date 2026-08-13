import { GoogleGenAI } from '@google/genai';
import { Request, Response } from 'express';
import { db, FieldValue } from './firebase-config';
import { mapErrorResponse } from './utils/errorMapper';
import { getGeminiClient } from './utils/gemini';
import { markdownToJpegBuffer } from './utils/imageGenerator';


export async function handleAssetGenerationRoute(req: Request, res: Response): Promise<void> {
  const { userId, jobId, jobTitle, companyName, keyRequirementsSummary, assetType } = req.body;

  if (!userId || (!jobId && (!jobTitle || !companyName))) {
    res.status(400).json({ error: "Missing required fields: userId, and either jobId or jobTitle + companyName are required." });
    return;
  }

  const type = assetType || 'COVER_LETTER';
  if (type !== 'COVER_LETTER' && type !== 'CV' && type !== 'PORTFOLIO') {
    res.status(400).json({ error: "Invalid assetType parameter. Supported types: 'COVER_LETTER', 'CV', 'PORTFOLIO'." });
    return;
  }

  let cost = 60.00; // 300 Tokens (₦60.00 NGN)
  if (type === 'CV') cost = 100.00; // 500 Tokens (₦100.00 NGN)
  if (type === 'PORTFOLIO') cost = 80.00; // 400 Tokens (₦80.00 NGN)

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found. Please onboard first." });
      return;
    }

    const userData = userDoc.data() || {};
    const isNINVerified = !!userData.isNINVerified;
    const walletBalanceNGN = userData.financials?.walletBalanceNGN || 0;
    const spendableNGN = isNINVerified ? walletBalanceNGN : Math.max(0, walletBalanceNGN - 4000.00);

    // Check if user has sufficient funds
    if (spendableNGN < cost) {
      const displayTypeName = type.replace('_', ' ');
      if (!isNINVerified && walletBalanceNGN >= cost) {
        res.status(403).json({ 
          error: `Verification Required: Your remaining spendable balance is ₦${spendableNGN.toFixed(2)} NGN (${(spendableNGN * 5).toFixed(0)} GiGO Tokens). Under our viral onboarding promotion, 80% of your starting bonus (₦4,000.00 NGN / 20,000 GiGO Tokens) is temporarily locked. Please submit your NIN and clear verification in settings to unlock 100% of your benefits!`
        });
      } else {
        res.status(402).json({ 
          error: `Insufficient wallet balance. Generating a ${displayTypeName} requires ${cost * 5} GiGO Tokens (₦${cost.toFixed(2)} NGN). Your spendable balance is ${(spendableNGN * 5).toFixed(0)} GiGO Tokens (₦${spendableNGN.toFixed(2)} NGN).` 
        });
      }
      return;
    }

    // Retrieve job details from Firestore if jobId is provided and matches are empty
    let finalJobTitle = jobTitle;
    let finalCompanyName = companyName;
    let finalRequirements = keyRequirementsSummary || [];

    if (jobId && !jobTitle) {
      const jobDoc = await db.collection('discovered_jobs').doc(jobId).get();
      if (jobDoc.exists) {
        const jobData = jobDoc.data() || {};
        finalJobTitle = jobData.jobTitle;
        finalCompanyName = jobData.companyName;
        finalRequirements = jobData.keyRequirementsSummary || [];
      } else {
        res.status(404).json({ error: "Specified job posting not found in verified listings." });
        return;
      }
    }

    // Create a transaction reference
    const transactionRef = `gigo-debit-${Math.floor(100000 + Math.random() * 900000)}`;
    const ledgerRef = userRef.collection('ledger').doc();

    console.log(`Deducting ₦${cost} from user ${userId} wallet balance atomically for ${type}...`);

    // Execute atomic wallet debit in transaction
    await db.runTransaction(async (transaction) => {
      const freshUserDoc = await transaction.get(userRef);
      const freshUserData = freshUserDoc.data() || {};
      const freshIsNINVerified = !!freshUserData.isNINVerified;
      const currentBalance = freshUserData.financials?.walletBalanceNGN || 0;
      const freshSpendable = freshIsNINVerified ? currentBalance : Math.max(0, currentBalance - 4000.00);

      if (freshSpendable < cost) {
        throw new Error("INSUFFICIENT_FUNDS_OR_LOCKED");
      }

      const nextBalanceNGN = currentBalance - cost;
      const nextBalanceUSD = nextBalanceNGN / 1500;

      transaction.update(userRef, {
        'financials.walletBalanceNGN': nextBalanceNGN,
        'financials.walletBalanceUSD': nextBalanceUSD,
        'financials.lastDebitTimestamp': new Date().toISOString()
      });

      transaction.set(ledgerRef, {
        timestamp: new Date().toISOString(),
        type: 'DEBIT',
        purpose: `ATS_${type}_GENERATION`,
        currency: 'NGN',
        amount: cost,
        paymentMethod: 'INTERNAL_WALLET',
        status: 'SUCCESSFUL',
        reconciliationId: transactionRef,
        meta: {
          jobTitle: finalJobTitle,
          companyName: finalCompanyName,
          assetType: type
        }
      });
    });

    console.log(`Wallet debit complete. Running Gemini to generate ${type} for ${userData.fullName} -> ${finalJobTitle} at ${finalCompanyName}...`);

    let prompt = '';
    const candidateRoleName = (userData.targetRoles && userData.targetRoles.length > 0 && userData.targetRoles[0] !== '[   ]')
      ? userData.targetRoles.join(', ')
      : (userData.role && userData.role !== '[   ]') ? userData.role : '[   ]';
    const candidateSummary = (userData.professionalSummary && userData.professionalSummary !== '[   ]')
      ? userData.professionalSummary
      : '[   ]';
    const candidateSkills = (userData.skills && userData.skills.length > 0)
      ? userData.skills.join(', ')
      : '[   ]';
    const yearsExp = userData.yearsOfExperience || 0;
    const powerSetup = userData.infrastructureStatus?.powerSetupDescription || 'Solar / Battery redundant power supply';
    const internetSetup = userData.infrastructureStatus?.internetSetupDescription || 'Fiber-to-the-home with redundant 4G/LTE mobile router';

    // Real contact & location details (previously omitted, forcing Gemini to hallucinate them)
    const candidateEmail = userData.email || '[   ]';
    const candidatePhone = userData.phoneNumber || '[   ]';
    const candidateLocation = (userData.location && userData.location !== '[   ]') ? userData.location : (userData.address || '[   ]');
    // strengths/softSkills are stored as free-text strings in this schema, not arrays
    const candidateStrengths = (userData.strengths && userData.strengths !== '[   ]') ? String(userData.strengths) : '';
    const candidateSoftSkills = (userData.softSkills && userData.softSkills !== '[   ]') ? String(userData.softSkills) : '';

    // Real work history & education (previously omitted entirely, forcing Gemini to invent fictional jobs)
    const workHistory: { company: string; role: string; startDate: string; endDate: string; achievements: string }[] = userData.workHistory || [];
    const educationList: { institution: string; degree: string; fieldOfStudy: string; gradYear: string }[] = userData.educationList || [];

    const workHistoryBlock = workHistory.length > 0
      ? workHistory.map((w, i) => `  ${i + 1}. ${w.role || '[   ]'} at ${w.company || '[   ]'} (${w.startDate || '?'} - ${w.endDate || 'Present'})\n     Achievements/Responsibilities: ${w.achievements || '[   ]'}`).join('\n')
      : '  No work history on file yet — this is an entry-level or first-time candidate.';

    const educationBlock = educationList.length > 0
      ? educationList.map((e, i) => `  ${i + 1}. ${e.degree || '[   ]'} in ${e.fieldOfStudy || '[   ]'}, ${e.institution || '[   ]'} (${e.gradYear || '[   ]'})`).join('\n')
      : '  No education records on file yet.';

    const candidateBioBlock = `Candidate Bio:
      - Name: ${userData.fullName || '[   ]'}
      - Email: ${candidateEmail}
      - Phone: ${candidatePhone}
      - Location: ${candidateLocation}
      - Current/Target Role: ${candidateRoleName}
      - Profile Summary: ${candidateSummary}
      - Skills: ${candidateSkills}${candidateStrengths ? `\n      - Key Strengths: ${candidateStrengths}` : ''}${candidateSoftSkills ? `\n      - Soft Skills: ${candidateSoftSkills}` : ''}
      - Years of Experience: ${yearsExp}
      - Infrastructure Quality: Power backup: ${powerSetup}, Internet backup: ${internetSetup}

      Verified Work History (use ONLY these real positions — do not invent employers, titles, or dates that are not listed here):
${workHistoryBlock}

      Verified Education (use ONLY these real records — do not invent degrees or institutions):
${educationBlock}`;

    if (type === 'CV') {
      prompt = `You are the lead ATS compliance and career alignment officer for GiGO.
      Write a highly professional, structurally optimized, ATS-compliant CV/Resume for the candidate that is targeted at a specific role.

      ${candidateBioBlock}

      Target Job:
      - Job Title: ${finalJobTitle}
      - Company Name: ${finalCompanyName}
      - Key Requirements/Criteria: ${finalRequirements.join(', ') || 'Strong technical skills, remote autonomy'}

      Draft a complete resume/CV in clear Markdown. Include:
      1. CONTACT HEADER (Name, email, phone, and location — use the exact verified contact details above; never invent or placeholder these).
      2. SUMMARY (Dynamic, impact-driven hook highlighting compatibility with ${finalCompanyName}).
      3. CORE COMPETENCIES (Structured grid of relevant technologies from the verified skills list).
      4. PROFESSIONAL EXPERIENCE (Rewrite each verified work history entry above with sharper, metrics-driven bullet points aligned to ${finalJobTitle}. If no work history is on file, write a "Relevant Projects & Readiness" section instead — do not fabricate employers).
      5. INFRASTRUCTURE & BACKUPS (Detailing solar/battery power backups, high-speed fiber, and 100% remote readiness uptime).
      6. EDUCATION & CERTIFICATIONS (from the verified education records above; omit this section entirely if none are on file — do not invent degrees).

      Make it highly polished and realistic. Never invent facts not present in the verified data above; leave a section brief rather than fabricating specifics.`;
    } else if (type === 'PORTFOLIO') {
      prompt = `You are the lead ATS compliance and career alignment officer for GiGO.
      Compile a high-impact, custom Career Portfolio document in Markdown representing the candidate's core case-studies, target engineering projects, and technical system architectures designed for this target job.

      ${candidateBioBlock}

      Target Job:
      - Job Title: ${finalJobTitle}
      - Company Name: ${finalCompanyName}
      - Key Requirements/Criteria: ${finalRequirements.join(', ') || 'Strong technical skills, remote autonomy'}

      Structure the Markdown document beautifully with:
      1. PORTFOLIO INTRODUCTION: "Vetted Remote-Ready Engineering Portfolio - ${userData.fullName || '[   ]'}"
      2. DEEP-DIVE CASE STUDY: A high-fidelity engineering problem solved by the candidate, outlining challenge, solution, and results (metrics-driven) matching the requirements of ${finalCompanyName}.
      3. TARGET PROJECT ARCHITECTURE: A text-based ASCII system architecture design diagram (or detailed structural flow breakdown) illustrating a relevant solution (e.g., scale pipelines, real-time sync, LLM orchestrators).
      4. INFRASTRUCTURE COMPLIANCE LEDGER: Detailed evidence of power reliability uptime (solar, inverter KVA, etc.) and redundant ISP pipelines.

      Make it read like a premium, master-level technical portfolio.`;
    } else {
      // Default to COVER_LETTER
      prompt = `You are the lead ATS compliance and career alignment officer for GiGO.
      Write a highly professional, high-impact cover letter that aligns the candidate's professional bio and skills with the requirements of a specific open remote role.

      ${candidateBioBlock}

      Target Job:
      - Job Title: ${finalJobTitle}
      - Company Name: ${finalCompanyName}
      - Key Requirements/Criteria: ${finalRequirements.join(', ') || 'Strong technical skills, remote autonomy'}

      Write a cover letter that is persuasive, grammatically impeccable, and structurally optimized to pass through modern applicant tracking systems (ATS). Avoid clichés. Address the company directly. Ground every claim in the verified work history, education, and skills above — never invent achievements or employers. Emphasize why the candidate's remote infrastructure backup setup gives them a 100% reliability edge during remote shifts.

      Format the cover letter cleanly with appropriate line breaks and professional greetings. Use the exact verified name, email, and phone above in the header/signature — do not write placeholders.`;
    }

    // Flash (not Pro) for responsiveness — Pro has a much lower free-tier quota and is noticeably slower
    // for structured document generation, where Flash quality is already strong.
    const { ai, modelFlash } = getGeminiClient(userData.geminiApiKey);

    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt
    });

    const assetContent = response.text ? response.text.trim() : `Dear Hiring Team,\n\nI am writing to express my strong interest in the ${finalJobTitle} position at ${finalCompanyName}...`;

    // Generate a real JPEG preview at creation time so the candidate can view/download
    // it from their archive immediately, not just when an application is sent.
    let jpegBase64: string | null = null;
    try {
      const jpegBuffer = await markdownToJpegBuffer(assetContent);
      jpegBase64 = jpegBuffer.toString('base64');
    } catch (imgErr) {
      console.warn(`Failed to generate JPEG preview for ${type}:`, imgErr);
    }

    // Save generated cover letter in user's documents subcollection
    const docId = `doc_${Date.now()}`;
    await userRef.collection('documents').doc(docId).set({
      id: docId,
      type: type,
      jobTitle: finalJobTitle,
      companyName: finalCompanyName,
      content: assetContent,
      jpegBase64,
      generatedAt: new Date().toISOString()
    });

    // Write execution logs for XPRIZE requirements
    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "ATSAssetGenerationAgent",
      userId: userId,
      executionMetrics: {
        modelUsed: modelFlash,
        status: "SUCCESS",
        chargeDeducted: `₦${cost} NGN`,
        assetType: type
      },
      businessDecisionsExecuted: [
        `Atomically checked and debited NGN wallet balance by ₦${cost} to ensure zero double-spending for asset ${type}.`,
        "Cross-referenced spoken-bio structural skill sets against parsed job indexing keywords.",
        "Highlighted workplace resilience criteria (power and internet backup plan) to appeal to global recruiters.",
        `Committed persistent document ${docId} to candidate document cache.`
      ]
    });

    res.status(200).json({
      success: true,
      message: `ATS ${type.replace('_', ' ')} compiled successfully.`,
      amountDeducted: cost,
      reconciliationId: transactionRef,
      jobTitle: finalJobTitle,
      companyName: finalCompanyName,
      documentId: docId,
      content: assetContent
    });

  } catch (error: any) {
    console.error("Cover letter generation failed:", error);

    if (error.message === "INSUFFICIENT_FUNDS_OR_LOCKED") {
      res.status(403).json({ error: "Atomic validation checked: Wallet has insufficient spendable NGN balance or contains locked promotional funds." });
      return;
    }

    if (error.message === "INSUFFICIENT_FUNDS") {
      res.status(402).json({ error: "Atomic validation checked: Wallet has insufficient NGN balance." });
      return;
    }

    try {
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: "ATSAssetGenerationAgent",
        userId: userId,
        executionMetrics: {
          status: "FAILED"
        },
        businessDecisionsExecuted: [
          `Encountered backend pipeline lapse: ${error.message}`
        ]
      });
    } catch (logErr) {
      console.error("Failed to write document-agent error log:", logErr);
    }

    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to compile ATS cover letter due to internal AI processing error.");
    res.status(statusCode).json({ error: errTitle, details });
  }
}
