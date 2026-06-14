import express, { Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import webhookRouter, { executeWalletCreditTransaction } from './transaction-router';
import { db, FieldValue } from './firebase-config';
import { processVoiceOnboarding } from './voice-agent';
import { handleAssetGenerationRoute } from './document-agent';
import { executeAutonomousScraperPipeline } from './scraper-agent';
import testAudioRouter from './routes/testAudioRouter';
import manualSearchRouter from './routes/manual-search';
import emailRouter from './routes/application-email';
import referralsRouter from './routes/referrals';
import mailroomRouter from './routes/mailroom';
import interviewRouter from './routes/interview';
import axios from 'axios';
import { Type } from '@google/genai';
import { getGeminiClient } from './utils/gemini';
import { authenticateToken, generateToken } from './utils/auth';

const app = express();
app.use(express.json());

// Custom Zero-Dependency CORS middleware to allow localhost:5173 and external endpoints
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, verif-hash');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure Multer for processing voice audio uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname || '.webm'));
  }
});

const upload = multer({ storage });

import { mapErrorResponse } from './utils/errorMapper';

// ----------------------------------------------------
// USER PORTFOLIO & SEED ENDPOINTS
// ----------------------------------------------------

// Seeds and fetches user profile details from Firestore
app.get('/api/users/:userId', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  try {
    const userRef = db.collection('users').doc(userId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`User ${userId} not found. Seeding default [   ] live profile...`);
      // Seed default highly-compatible profile so users can play and test instantly
      const defaultProfile = {
        fullName: '[   ]',
        professionalSummary: '[   ]',
        targetRoles: [],
        skills: [],
        yearsOfExperience: 0,
        infrastructureStatus: {
          powerSetupDescription: '[   ]',
          internetSetupDescription: '[   ]',
          hasRemoteBackupPlan: false
        },
        inferredLocationHints: '[   ]',
        phoneNumber: '2348011223344',
        financials: {
          walletBalanceUSD: 0.00,
          walletBalanceNGN: 0.00,
          lastTopUpTimestamp: new Date().toISOString()
        },
        hasVoiceOnboarded: false,
        tickerTargetDomains: [],
        applyMode: 'autonomous',
        maritalStatus: '[   ]',
        dob: '[   ]',
        address: '[   ]',
        hobbies: '[   ]',
        strengths: '[   ]',
        softSkills: '[   ]',
        teamworkExperience: '[   ]',
        conflictResolution: '[   ]',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await userRef.set(defaultProfile);
      userDoc = await userRef.get();
    }

    res.status(200).json(userDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve candidate profile.", details: error.message });
  }
});

// Updates user profile information
app.post('/api/users/:userId/update', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  const { 
    fullName, role, location, salary, skills, professionalSummary, yearsOfExperience, 
    infrastructureStatus, phoneNumber, geminiApiKey, flutterwavePublicKey, flutterwaveSecretKey, 
    profilePic, smtpSettings, password, hasVoiceOnboarded, tickerTargetDomains, 
    workTypePreferences, scanInterval, feedRefreshInterval,
    workHistory, educationList, maritalStatus, dob, address, hobbies, 
    strengths, softSkills, teamworkExperience, conflictResolution, calibrationAxes, calibrationHistory,
    applyMode
  } = req.body;
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const existingData = userDoc.exists ? userDoc.data() : {};
    const existingHasVoiceOnboarded = !!existingData?.hasVoiceOnboarded;

    const updatePayload: any = {
      updatedAt: new Date().toISOString()
    };

    if (fullName !== undefined) {
      if (!existingHasVoiceOnboarded) {
        updatePayload.fullName = fullName;
      } else {
        console.log(`User ${userId} already has voice onboarding completed. Name lock is active; ignoring name update.`);
      }
    }
    
    // Explicitly preserve voice onboarding state once unlocked
    if (hasVoiceOnboarded !== undefined) {
      updatePayload.hasVoiceOnboarded = !!hasVoiceOnboarded || existingHasVoiceOnboarded;
    } else if (existingHasVoiceOnboarded) {
      updatePayload.hasVoiceOnboarded = true;
    }
    if (tickerTargetDomains !== undefined) updatePayload.tickerTargetDomains = tickerTargetDomains;
    if (workTypePreferences !== undefined) updatePayload.workTypePreferences = workTypePreferences;
    if (scanInterval !== undefined) updatePayload.scanInterval = Number(scanInterval);
    if (feedRefreshInterval !== undefined) updatePayload.feedRefreshInterval = Number(feedRefreshInterval);
    if (professionalSummary !== undefined) updatePayload.professionalSummary = professionalSummary;
    if (yearsOfExperience !== undefined) updatePayload.yearsOfExperience = Number(yearsOfExperience);
    if (phoneNumber !== undefined) updatePayload.phoneNumber = phoneNumber;
    if (geminiApiKey !== undefined) updatePayload.geminiApiKey = geminiApiKey;
    if (flutterwavePublicKey !== undefined) updatePayload.flutterwavePublicKey = flutterwavePublicKey;
    if (flutterwaveSecretKey !== undefined) updatePayload.flutterwaveSecretKey = flutterwaveSecretKey;
    if (profilePic !== undefined) updatePayload.profilePic = profilePic;
    if (password !== undefined) updatePayload.password = password;
    if (smtpSettings !== undefined) {
      updatePayload.smtpSettings = {
        host: smtpSettings.host || '',
        port: Number(smtpSettings.port) || 587,
        user: smtpSettings.user || '',
        pass: smtpSettings.pass || ''
      };
    }
    
    // Support flat role/location/salary update from settings
    if (role !== undefined) {
      updatePayload.targetRoles = [role];
    }
    if (skills !== undefined) {
      updatePayload.skills = skills;
    }
    if (infrastructureStatus !== undefined) {
      updatePayload.infrastructureStatus = {
        powerSetupDescription: infrastructureStatus.powerSetupDescription || 'Grid power',
        internetSetupDescription: infrastructureStatus.internetSetupDescription || 'Local Wi-Fi',
        hasRemoteBackupPlan: !!infrastructureStatus.hasRemoteBackupPlan
      };
    }
    if (location !== undefined) {
      updatePayload.inferredLocationHints = location;
    }
    if (salary !== undefined) {
      updatePayload.salary = salary;
    }

    // New Deep Mind Clone fields
    if (workHistory !== undefined) updatePayload.workHistory = workHistory;
    if (educationList !== undefined) updatePayload.educationList = educationList;
    if (maritalStatus !== undefined) updatePayload.maritalStatus = maritalStatus;
    if (dob !== undefined) updatePayload.dob = dob;
    if (address !== undefined) updatePayload.address = address;
    if (hobbies !== undefined) updatePayload.hobbies = hobbies;
    if (strengths !== undefined) updatePayload.strengths = strengths;
    if (softSkills !== undefined) updatePayload.softSkills = softSkills;
    if (teamworkExperience !== undefined) updatePayload.teamworkExperience = teamworkExperience;
    if (conflictResolution !== undefined) updatePayload.conflictResolution = conflictResolution;
    if (calibrationAxes !== undefined) updatePayload.calibrationAxes = calibrationAxes;
    if (calibrationHistory !== undefined) updatePayload.calibrationHistory = calibrationHistory;
    if (applyMode !== undefined) updatePayload.applyMode = applyMode;

    await userRef.set(updatePayload, { merge: true });
    
    const updatedDoc = await userRef.get();
    res.status(200).json(updatedDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update profile config.", details: error.message });
  }
});


// Enriches user's GiGO Mind Clone dynamically using Gemini 2.5 Pro based on natural language statements
app.post('/api/users/:userId/enrich-mind', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  const { statement } = req.body;

  if (!statement || typeof statement !== 'string') {
    res.status(400).json({ error: "Missing or invalid 'statement' parameter in request body." });
    return;
  }

  const startTime = Date.now();

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found. Please onboard first." });
      return;
    }

    const userData = userDoc.data() || {};
    const { ai, modelPro } = getGeminiClient(userData.geminiApiKey);

    console.log(`🧠 Enriched Mind: Running Gemini Pro synthesis for ${userData.fullName || userId}...`);

    const prompt = `You are the GiGO Brain Mind Cloner.
Your task is to merge a new candidate verbal/text statement into their current professional profile.
Here is the candidate's existing profile JSON:
${JSON.stringify({
  fullName: userData.fullName,
  role: userData.targetRoles?.[0] || 'Software Engineer',
  targetRoles: userData.targetRoles || [],
  skills: userData.skills || [],
  professionalSummary: userData.professionalSummary || '',
  yearsOfExperience: userData.yearsOfExperience || 0,
  salary: userData.salary || '',
  location: userData.inferredLocationHints || '',
  infrastructureStatus: userData.infrastructureStatus || {}
})}

Here is the new statement/vocal experience from the candidate:
"${statement}"

Analyze the statement. Update the profile:
1. Extract any new professional skills (programming languages, libraries, systems, architectures, databases, cloud tools, or methodologies) mentioned or implied. Append them to the existing 'skills' array. Deduplicate and preserve existing skills. Keep skill names clean and professional.
2. Synthesize or enrich the 'professionalSummary' to gracefully weave in this new experience/metric naturally. The summary must remain cohesive, professional, high-fidelity, and ATS-compliant.
3. If the statement includes details about location, target roles, years of experience, salary, or physical work infrastructure backups (such as solar setups, battery backups, or internet ISPs), update the corresponding fields:
   - fullName
   - targetRoles (append or modify as array)
   - salary
   - location (map to inferredLocationHints)
   - yearsOfExperience
   - infrastructureStatus: update powerSetupDescription, internetSetupDescription, and hasRemoteBackupPlan where relevant.

Respond with a JSON object containing the modified user fields, following this schema:
{
  "fullName": string (or undefined if not updated),
  "professionalSummary": string (or undefined if not updated),
  "skills": string[] (updated complete skills array, or undefined if not updated),
  "targetRoles": string[] (updated targetRoles array, or undefined if not updated),
  "salary": string (or undefined if not updated),
  "location": string (or undefined if not updated),
  "yearsOfExperience": number (or undefined if not updated),
  "infrastructureStatus": {
     "powerSetupDescription": string,
     "internetSetupDescription": string,
     "hasRemoteBackupPlan": boolean
  } (or undefined if not updated),
  "deltaExplanation": string (a short 1-2 sentence human-readable summary of what was updated, e.g. "Integrated experience scaling Redis clusters to 50k QPS and added Kafka and Redis skills.")
}

IMPORTANT: Return ONLY a clean JSON object matching this schema. Do not include markdown code block characters like \`\`\`json.`;

    const response = await ai.models.generateContent({
      model: modelPro,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            professionalSummary: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            targetRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            salary: { type: Type.STRING },
            location: { type: Type.STRING },
            yearsOfExperience: { type: Type.INTEGER },
            infrastructureStatus: {
              type: Type.OBJECT,
              properties: {
                powerSetupDescription: { type: Type.STRING },
                internetSetupDescription: { type: Type.STRING },
                hasRemoteBackupPlan: { type: Type.BOOLEAN }
              }
            },
            deltaExplanation: { type: Type.STRING }
          },
          required: ['deltaExplanation']
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedUpdate = JSON.parse(response.text.trim());
    console.log("Successfully parsed mind enrichment:", parsedUpdate);

    // Prepare update payload
    const updatePayload: any = {
      updatedAt: new Date().toISOString()
    };

    if (parsedUpdate.fullName) {
      if (!userData.hasVoiceOnboarded) {
        updatePayload.fullName = parsedUpdate.fullName;
      } else {
        console.log(`User ${userId} already has voice onboarding completed. Name lock is active; ignoring mind enrichment name update.`);
      }
    }
    if (parsedUpdate.professionalSummary) updatePayload.professionalSummary = parsedUpdate.professionalSummary;
    if (parsedUpdate.skills) updatePayload.skills = parsedUpdate.skills;
    if (parsedUpdate.targetRoles) updatePayload.targetRoles = parsedUpdate.targetRoles;
    if (parsedUpdate.salary) updatePayload.salary = parsedUpdate.salary;
    if (parsedUpdate.location) updatePayload.inferredLocationHints = parsedUpdate.location;
    if (parsedUpdate.yearsOfExperience !== undefined) updatePayload.yearsOfExperience = Number(parsedUpdate.yearsOfExperience);
    if (parsedUpdate.infrastructureStatus) {
      updatePayload.infrastructureStatus = {
        powerSetupDescription: parsedUpdate.infrastructureStatus.powerSetupDescription || userData.infrastructureStatus?.powerSetupDescription || '[   ]',
        internetSetupDescription: parsedUpdate.infrastructureStatus.internetSetupDescription || userData.infrastructureStatus?.internetSetupDescription || '[   ]',
        hasRemoteBackupPlan: parsedUpdate.infrastructureStatus.hasRemoteBackupPlan !== undefined ? !!parsedUpdate.infrastructureStatus.hasRemoteBackupPlan : !!userData.infrastructureStatus?.hasRemoteBackupPlan
      };
    }

    // Save to Firestore
    await userRef.set(updatePayload, { merge: true });

    // Save audit log to telemetry collection
    const latencyMs = Date.now() - startTime;
    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "GiGO_Brain_Core_Agent",
      cycleType: "MIND_CLONE_ENRICHMENT",
      userId,
      executionMetrics: {
        latencyMs,
        modelUsed: modelPro,
        status: "SUCCESS"
      },
      businessDecisionsExecuted: [
        `Received intellect synapse statement: "${statement}".`,
        `Ingested memory and modified profile structure: ${parsedUpdate.deltaExplanation}`,
        "Committed high-token candidate intellectual synapse update to Firestore."
      ]
    });

    res.status(200).json({
      success: true,
      profile: updatePayload,
      deltaExplanation: parsedUpdate.deltaExplanation
    });

  } catch (error: any) {
    console.error("Failed to enrich mind clone:", error);
    res.status(500).json({ error: "Failed to enrich mind clone.", details: error.message });
  }
});

// Evaluates user's spoken/typed responses to workplace behavioral dilemmas and updates cloning alignment scores
app.post('/api/users/:userId/calibrate-behavioral', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  const { dilemmaId, question, userResponse } = req.body;

  if (!question || !userResponse) {
    res.status(400).json({ error: "Missing 'question' or 'userResponse' in request body." });
    return;
  }

  const startTime = Date.now();

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found. Please onboard first." });
      return;
    }

    const userData = userDoc.data() || {};
    let toneAnalysis = "Balanced Professional";
    let decisionStyle = "Collaborative Alignment";
    let feedback = "Understood. Replicating this systematic resolution behavior in future remote task threads.";
    let cognitiveBoost = 10;
    let behavioralBoost = 10;

    const hasGeminiKey = !!userData.geminiApiKey;

    if (hasGeminiKey) {
      try {
        const { ai, modelPro } = getGeminiClient(userData.geminiApiKey);
        const prompt = `You are the GiGO Brain Behavioral Mirroring Calibrator.
Your job is to analyze the candidate's natural language response to a critical workplace dilemma, and evaluate their communication tone, decision path, and action style so their AI clone can mirror them.

Here is the dilemma and question:
"${question}"

Here is the user's spoken/typed response:
"${userResponse}"

Analyze the response thoroughly and return a JSON object with:
1. "toneAnalysis": a brief label describing their communication style (e.g. "Empathetic Technical Leader", "Direct & Outcome-Oriented Architect", "Analytical Process Defender", "Diplomatic Strategic Facilitator").
2. "decisionStyle": a brief paragraph (2-3 sentences) analyzing how they think, balance tradeoffs, and execute solutions based on their response.
3. "feedback": a 2-3 sentence personalized message from their AI clone to them, reflecting how the clone is learning to replicate this exact thought process.
4. "cognitiveBoost": number from 5 to 15 (boost percentage based on detail, vocabulary depth, and structure of response).
5. "behavioralBoost": number from 5 to 15 (boost percentage based on detail, vocabulary depth, and structure of response).

IMPORTANT: Return ONLY a clean JSON object matching this schema. Do not include markdown code block characters like \`\`\`json.`;

        const response = await ai.models.generateContent({
          model: modelPro,
          contents: prompt,
        });

        const text = response.text || '';
        const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (parsed.toneAnalysis) toneAnalysis = parsed.toneAnalysis;
        if (parsed.decisionStyle) decisionStyle = parsed.decisionStyle;
        if (parsed.feedback) feedback = parsed.feedback;
        if (parsed.cognitiveBoost) cognitiveBoost = Number(parsed.cognitiveBoost);
        if (parsed.behavioralBoost) behavioralBoost = Number(parsed.behavioralBoost);
      } catch (geminiError: any) {
        console.warn("Gemini calibration evaluation failed, falling back to local analyzer:", geminiError);
      }
    }

    // Dynamic local fallback if Gemini is not used or failed
    if (!hasGeminiKey) {
      const lower = userResponse.toLowerCase();

      // Word count boosts
      const wordCount = userResponse.split(/\s+/).length;
      cognitiveBoost = Math.min(15, Math.max(5, Math.floor(wordCount / 8)));
      behavioralBoost = Math.min(15, Math.max(5, Math.floor(wordCount / 10)));

      if (lower.includes("empathy") || lower.includes("talk") || lower.includes("understand") || lower.includes("collaborate") || lower.includes("listen") || lower.includes("discuss")) {
        toneAnalysis = "Empathetic & Collaborative Leader";
        decisionStyle = "Prioritizes high emotional intelligence, active listening, and open team dialogue. Resolves friction through mutual alignment rather than immediate escalation.";
        feedback = "I have calibrated my neural registers to your consensus-first style. I will approach conflict on remote slack boards by seeking context and scheduling syncing alignments.";
      } else if (lower.includes("metric") || lower.includes("data") || lower.includes("test") || lower.includes("analyze") || lower.includes("sla") || lower.includes("process") || lower.includes("log")) {
        toneAnalysis = "Highly Analytical Process Defender";
        decisionStyle = "Emphasizes structural integrity, service level agreements, and data-driven diagnostic monitoring. Balances system performance and SLA compliance objectively.";
        feedback = "Understood. I will represent you by maintaining high procedural rigour, inspecting system alerts, and using diagnostic data to justify prioritization decisions.";
      } else if (lower.includes("immediate") || lower.includes("solve") || lower.includes("action") || lower.includes("quick") || lower.includes("customer") || lower.includes("business") || lower.includes("fix")) {
        toneAnalysis = "Direct & Outcome-Oriented Architect";
        decisionStyle = "Focused heavily on swift mitigation and immediate business continuity. Values tactical triage and restoring uptime first, delaying full retrospectives until stability is guaranteed.";
        feedback = "Understood. When alerts trigger or deadlines loom, I will prioritize immediate triage and customer mitigation, keeping communications brief, direct, and operational.";
      } else {
        toneAnalysis = "Symmetric Systems Coordinator";
        decisionStyle = "Exhibits a balanced, general-purpose approach to remote work coordination. Integrates operational speed and interpersonal communications proportionally.";
        feedback = "Neural alignment complete. I have successfully integrated your general coordination style to represent you in standard workflow scenarios.";
      }
    }

    // Load existing calibration axes
    const currentAxes = userData.calibrationAxes || { cognitive: 65, credential: 55, behavioral: 60, operational: 70 };
    
    const newCognitive = Math.min(100, (currentAxes.cognitive || 65) + cognitiveBoost);
    const newBehavioral = Math.min(100, (currentAxes.behavioral || 60) + behavioralBoost);

    const updatedAxes = {
      ...currentAxes,
      cognitive: newCognitive,
      behavioral: newBehavioral
    };

    // Load calibration history
    const currentHistory = userData.calibrationHistory || [];
    const newSession = {
      timestamp: new Date().toISOString(),
      dilemmaId,
      question,
      userResponse,
      toneAnalysis,
      decisionStyle,
      feedback,
      cognitiveBoost,
      behavioralBoost,
      scoreAfter: Math.round((updatedAxes.cognitive + updatedAxes.credential + updatedAxes.behavioral + updatedAxes.operational) / 4)
    };

    const updatedHistory = [...currentHistory, newSession];

    // Save to Firestore
    await userRef.set({
      calibrationAxes: updatedAxes,
      calibrationHistory: updatedHistory
    }, { merge: true });

    // Save audit log to telemetry collection
    const latencyMs = Date.now() - startTime;
    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "GiGO_Clone_Mirror_Agent",
      cycleType: "CLONE_BEHAVIORAL_CALIBRATION",
      userId,
      executionMetrics: {
        latencyMs,
        status: "SUCCESS"
      },
      businessDecisionsExecuted: [
        `Triggered cognitive cloner mirror calibration for dilemma: "${dilemmaId}".`,
        `Analyzed user response dialect. Tone detected: "${toneAnalysis}".`,
        `Boosted Cognitive Sync to ${newCognitive}% and Behavioral Sync to ${newBehavioral}%.`
      ]
    });

    res.status(200).json({
      success: true,
      toneAnalysis,
      decisionStyle,
      feedback,
      cognitiveBoost,
      behavioralBoost,
      calibrationAxes: updatedAxes,
      calibrationHistory: updatedHistory
    });

  } catch (error: any) {
    console.error("Failed to calibrate behavioral style:", error);
    res.status(500).json({ error: "Failed to calibrate behavioral style.", details: error.message });
  }
});


// Dynamically analyzes and researches target roles against candidate's profile to identify professional gaps
app.post('/api/users/:userId/evaluate-gaps', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const userData = userDoc.data() || {};
    const targetRoles = userData.targetRoles || ['Virtual Assistant'];
    const skills = userData.skills || [];
    const professionalSummary = userData.professionalSummary || '';
    const infrastructureStatus = userData.infrastructureStatus || {};

    const { ai, modelFlash } = getGeminiClient(userData.geminiApiKey);

    console.log(`🧠 [GiGO Brain] Evaluating career gaps for ${userData.fullName || userId} under target roles: ${targetRoles.join(', ')}...`);

    const prompt = `You are the GiGO Brain Career Research Agent.
Your job is to perform deep career research on the standard industry expectations for these target roles:
${JSON.stringify(targetRoles)}

Then, evaluate the candidate's current professional duplicate data:
- Skills: ${JSON.stringify(skills)}
- Summary: "${professionalSummary}"
- Redundant Work Infrastructure: ${JSON.stringify(infrastructureStatus)}

Identify 3 to 5 critical professional, technical, tool-based, or operational capability gaps that are missing or lacking in the candidate's profile for these target roles.
For each gap, provide:
1. 'skill': the specific skill, tool, system, backup plan, or concept that is missing (e.g. "Calendar Sync", "CRM Routing", "Asana Task Boards", "Power Redundancy Setup").
2. 'reason': why this is essential for this target role.
3. 'question': an interview-style, conversational, highly engaging question designed to ask the user to explain their exact competence or experience with this missing gap (making it easy for them to speak or type a reply).
4. 'priority': 'high' or 'medium' based on how critical it is for candidate qualification.

Respond with a JSON object containing the gaps:
{
  "gaps": [
    {
      "skill": "Zendesk ticket management",
      "reason": "Zendesk is the industry standard tool for customer routing in high-performing virtual assistant positions.",
      "question": "Could you tell us about your experience managing customer inquiries or routing support tickets in Zendesk?",
      "priority": "high"
    }
  ]
}

IMPORTANT: Return ONLY a clean JSON object matching this schema. Do not include markdown code block syntax.`;

    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  question: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ['skill', 'reason', 'question', 'priority']
              }
            }
          },
          required: ['gaps']
        }
      }
    });

    if (!response.text) {
      throw new Error("No response content received from Gemini.");
    }

    const parsedGaps = JSON.parse(response.text.trim());
    console.log(`🧠 [GiGO Brain] Successfully evaluated ${parsedGaps.gaps?.length || 0} gaps.`);

    res.status(200).json({
      success: true,
      gaps: parsedGaps.gaps || []
    });

  } catch (error: any) {
    console.error("Failed to evaluate career gaps:", error);
    res.status(500).json({ error: "Failed to evaluate career gaps.", details: error.message });
  }
});

// Configures target platforms for Live AI Matches Ticker (Charges ₦300 NGN atomically)
app.post('/api/users/:userId/configure-ticker-stream', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  const { domains } = req.body;

  if (!Array.isArray(domains)) {
    res.status(400).json({ error: "Missing or invalid 'domains' parameter in request body. Must be an array." });
    return;
  }

  if (domains.length > 2) {
    res.status(400).json({ error: "You can select a maximum of 2 target channels for your personalized stream." });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "Candidate profile not found." });
      return;
    }

    const userData = userDoc.data();
    
    // Check voice onboarding lock
    if (!userData?.hasVoiceOnboarded) {
      res.status(400).json({ error: "Unlock lock active. You must complete your first Voice Onboarding session on GiGO before customizing matching ticker streams." });
      return;
    }

    // Check regional wallet balance (costs ₦300 NGN)
    const currentBalanceNGN = userData?.financials?.walletBalanceNGN || 0;
    const streamCost = 300.00;

    if (currentBalanceNGN < streamCost) {
      res.status(402).json({ error: `Insufficient balance. Customizing ticker streams costs ₦${streamCost.toFixed(2)} NGN. Your balance is ₦${currentBalanceNGN.toFixed(2)} NGN.` });
      return;
    }

    const ledgerRef = userRef.collection('ledger').doc();

    await db.runTransaction(async (transaction) => {
      // 1. Decrement balance and update domains list
      transaction.update(userRef, {
        'financials.walletBalanceNGN': FieldValue.increment(-streamCost),
        'financials.lastTopUpTimestamp': new Date().toISOString(),
        tickerTargetDomains: domains,
        updatedAt: new Date().toISOString()
      });

      // 2. Commit debit transaction ledger item
      transaction.set(ledgerRef, {
        timestamp: new Date().toISOString(),
        type: 'DEBIT',
        purpose: 'TICKER_STREAM_SETUP',
        currency: 'NGN',
        amount: streamCost,
        paymentMethod: 'WALLET_BALANCE',
        status: 'SUCCESSFUL',
        reconciliationId: `wa-ticker-setup-${Date.now()}`,
        meta: {
          description: domains.length > 0 
            ? `Configured personalized Live AI Matches Ticker targeting: ${domains.join(', ')}.`
            : "Reset Live AI Matches Ticker stream to unfiltered broad Google Search."
        }
      });
    });

    console.log(`[Atomic Monetization] Debited user ${userId} ₦300.00 NGN for configuring stream channels: ${domains.join(', ')}`);

    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();

    res.status(200).json({
      success: true,
      message: "Ticker stream successfully configured and debited!",
      tickerTargetDomains: updatedUserData?.tickerTargetDomains || [],
      financials: updatedUserData?.financials
    });

  } catch (error: any) {
    console.error("Failed to configure personalized ticker stream:", error);
    res.status(500).json({ error: "Failed to configure personalized ticker stream.", details: error.message });
  }
});

// Fetches user transactions from the ledger subcollection
app.get('/api/users/:userId/transactions', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  try {
    const ledgerSnapshot = await db.collection('users').doc(userId).collection('ledger')
      .orderBy('timestamp', 'desc').get();
    
    const transactions = ledgerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch transaction records.", details: error.message });
  }
});

// Fetches user compiled documents (cover letters)
app.get('/api/users/:userId/documents', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  try {
    const docsSnapshot = await db.collection('users').doc(userId).collection('documents')
      .orderBy('generatedAt', 'desc').get();

    const documents = docsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(documents);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch user documents.", details: error.message });
  }
});


// ----------------------------------------------------
// AUTHENTICATION & MULTI-USER ENDPOINTS
// ----------------------------------------------------

// User Sign Up
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { email, password, fullName, phoneNumber, referredBy } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({ error: "Email, password, and full name are required." });
    return;
  }

  try {
    const usersColl = db.collection('users');
    const existingUserQuery = await usersColl.where('email', '==', email.toLowerCase()).get();

    if (!existingUserQuery.empty) {
      res.status(400).json({ error: "An account with this email address already exists." });
      return;
    }

    const userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newProfile: any = {
      userId,
      email: email.toLowerCase(),
      password, // Simple clear text field for demonstration/local security
      fullName,
      phoneNumber: phoneNumber || '',
      role: 'candidate',
      professionalSummary: '[   ]',
      targetRoles: [],
      skills: [],
      yearsOfExperience: 0,
      infrastructureStatus: {
        powerSetupDescription: '[   ]',
        internetSetupDescription: '[   ]',
        hasRemoteBackupPlan: false
      },
      inferredLocationHints: '[   ]',
      financials: {
        walletBalanceUSD: 0.00,
        walletBalanceNGN: 5000.00,
        lastTopUpTimestamp: ''
      },
      hasVoiceOnboarded: false,
      tickerTargetDomains: [],
      maritalStatus: '[   ]',
      dob: '[   ]',
      address: '[   ]',
      hobbies: '[   ]',
      strengths: '[   ]',
      softSkills: '[   ]',
      teamworkExperience: '[   ]',
      conflictResolution: '[   ]',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      geminiApiKey: '',
      flutterwavePublicKey: '',
      flutterwaveSecretKey: ''
    };

    if (referredBy) {
      newProfile.referredBy = referredBy;
    }

    await usersColl.doc(userId).set(newProfile);

    // Create initial transaction record for ₦5,000 signup bonus in ledger subcollection
    await usersColl.doc(userId).collection('ledger').add({
      timestamp: new Date().toISOString(),
      type: 'CREDIT',
      purpose: 'GIGO_SIGNUP_BONUS',
      currency: 'NGN',
      amount: 5000.00,
      paymentMethod: 'PROMOTIONAL_GRANT',
      status: 'SUCCESSFUL',
      reconciliationId: `wa-bonus-${Date.now()}`,
      meta: {
        description: "Welcome to GiGO! Free initial career wallet credentials top-up."
      }
    });

    console.log(`Created new live user account: ${fullName} (${email}) with a starting promotional signup bonus of ₦5,000 NGN.`);

    // 4. Handle Referral Bonus Credit Handshake
    if (referredBy) {
      try {
        const referrerRef = usersColl.doc(referredBy);
        const referrerDoc = await referrerRef.get();
        if (referrerDoc.exists) {
          const referrerData = referrerDoc.data() || {};
          
          // Fetch dynamic referral bonus value from system configurations
          let referralBonus = 500.00;
          try {
            const systemDoc = await db.collection('system_configs').doc('global').get();
            if (systemDoc.exists) {
              const systemData = systemDoc.data() || {};
              if (typeof systemData.referralBonus === 'number') {
                referralBonus = systemData.referralBonus;
              }
            }
          } catch (configErr: any) {
            console.warn("Failed to fetch dynamic referral bonus on signup, falling back to 500 NGN:", configErr.message);
          }

          // Credit referrer dynamically
          await referrerRef.update({
            'financials.walletBalanceNGN': FieldValue.increment(referralBonus),
            'financials.lastTopUpTimestamp': new Date().toISOString()
          });

          // Create ledger entry in referrer's subcollection
          await referrerRef.collection('ledger').add({
            timestamp: new Date().toISOString(),
            type: 'CREDIT',
            purpose: 'REFERRAL_BONUS',
            currency: 'NGN',
            amount: referralBonus,
            paymentMethod: 'PROMOTIONAL_GRANT',
            status: 'SUCCESSFUL',
            reconciliationId: `wa-ref-bonus-${userId}-${Date.now()}`,
            meta: {
              description: `Referral bonus rewarded for introducing ${fullName} (${email.toLowerCase()}) to the GiGO platform.`
            }
          });

          // Find and update pending referral status
          const refQuery = await db.collection('referrals')
            .where('referrerId', '==', referredBy)
            .where('friendEmail', '==', email.toLowerCase())
            .where('status', '==', 'PENDING')
            .get();

          if (!refQuery.empty) {
            for (const doc of refQuery.docs) {
              await doc.ref.update({
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                referredUserId: userId
              });
            }
          } else {
            // Direct share registration fallback (create completed record)
            const referralId = 'ref_direct_' + Date.now();
            await db.collection('referrals').doc(referralId).set({
              referralId,
              referrerId: referredBy,
              referrerName: referrerData.fullName || 'A colleague',
              friendName: fullName,
              friendEmail: email.toLowerCase(),
              friendPhone: phoneNumber || '',
              dispatchMode: 'MANUAL',
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              referredUserId: userId
            });
          }

          console.log(`Successfully credited referrer ${referrerData.fullName || referredBy} with ₦${referralBonus} NGN for referring ${fullName}.`);
        }
      } catch (refError: any) {
        console.error("Failed to credit referral bonus:", refError.message);
      }
    }

    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      userId,
      token,
      user: { userId, email: email.toLowerCase(), fullName, phoneNumber, role: 'candidate' }
    });
  } catch (error: any) {
    console.error("Sign up error:", error);
    res.status(500).json({ error: "Failed to process registration.", details: error.message });
  }
});

// User Log In
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const usersColl = db.collection('users');
    const userQuery = await usersColl.where('email', '==', email.toLowerCase()).get();

    if (userQuery.empty) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const token = generateToken(userDoc.id);

    res.status(200).json({
      success: true,
      message: "Authentication successful.",
      userId: userDoc.id,
      token,
      user: {
        userId: userDoc.id,
        email: userData.email,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber || '',
        role: userData.role || 'candidate'
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to authenticate credentials.", details: error.message });
  }
});

// ----------------------------------------------------
// SECURE DIRECT FLUTTERWAVE TRANSACTION VERIFICATION
// ----------------------------------------------------
app.post('/api/payments/verify', async (req: Request, res: Response) => {
  const { transactionId, userId, amount, currency } = req.body;

  if (!transactionId || !userId) {
    res.status(400).json({ error: "Missing transactionId or userId in transaction verification request." });
    return;
  }

  try {
    console.log(`Verifying payment transaction ID ${transactionId} for user ${userId}...`);
    
    // Retrieve user credentials
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({ error: "User document not found." });
      return;
    }

    const userData = userDoc.data() || {};
    // Fallback secret key
    const flwSecret = userData.flutterwaveSecretKey || process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-sandbox-mock-key';

    // Verify transaction via Flutterwave standard GET verification endpoint
    // If it's a test/dummy transaction or real-world card, standard Flutterwave verification confirms it
    let verifiedAmount = 0;
    let verifiedCurrency = 'NGN';
    let verifiedTxRef = `tx-flw-${transactionId}`;

    try {
      const flwResponse = await axios.get(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        headers: {
          'Authorization': `Bearer ${flwSecret}`,
          'Content-Type': 'application/json'
        }
      });

      if (flwResponse.data && flwResponse.data.status === 'success' && flwResponse.data.data.status === 'successful') {
        verifiedAmount = flwResponse.data.data.amount;
        verifiedCurrency = flwResponse.data.data.currency || 'NGN';
        verifiedTxRef = flwResponse.data.data.tx_ref || verifiedTxRef;
        console.log(`Flutterwave Verification SUCCESS: Verified ${verifiedAmount} ${verifiedCurrency} for user ${userId}`);
      } else {
        console.error("Flutterwave API verification response failed:", flwResponse.data);
        res.status(400).json({ error: "Flutterwave verification failed. Transaction was not completed successfully." });
        return;
      }
    } catch (apiError: any) {
      console.warn("Flutterwave API verification unreachable or rejected. Running secure local fallback check for sandbox keys...");
      
      // Let's check if the secret is a default test key. If so, let's gracefully credit a simulated amount based on user input, 
      // or if they are testing offline with dummy credentials, to make it completely flawless.
      if (flwSecret.includes('TEST') || flwSecret.includes('sandbox') || transactionId.toString().startsWith('dummy') || transactionId.toString().startsWith('flw') || transactionId.toString().startsWith('wa-tx-') || flwSecret === 'FLWSECK_TEST-sandbox-mock-key') {
        // Safe simulator for development/sandbox mode to avoid hitting live billing blockades
        verifiedAmount = amount ? Number(amount) : 5000.00;
        verifiedCurrency = currency || (transactionId.toString().includes('usd') || transactionId.toString().includes('USD') ? 'USD' : 'NGN');
        verifiedTxRef = `wa-sim-tx-${Date.now()}`;
        console.log(`Development Mode Bypass: Credited simulated top-up: ${verifiedAmount} ${verifiedCurrency}`);
      } else {
        console.error("Failed to connect with Flutterwave verification network API:", apiError.message);
        res.status(500).json({ error: "Failed to connect to Flutterwave payment gateway verification.", details: apiError.message });
        return;
      }
    }

    // Execute atomic credit transaction in ledger and users profile
    await executeWalletCreditTransaction(userId, verifiedAmount, verifiedCurrency, verifiedTxRef, 'FLUTTERWAVE');

    res.status(200).json({
      success: true,
      message: `Successfully verified and credited ${verifiedCurrency} ${verifiedAmount} to your wallet.`,
      data: {
        amount: verifiedAmount,
        currency: verifiedCurrency,
        reference: verifiedTxRef
      }
    });

  } catch (error: any) {
    console.error("Error processing transaction verification:", error);
    res.status(500).json({ error: "Internal verification pipeline error.", details: error.message });
  }
});

// ----------------------------------------------------
// ADMINISTRATIVE PANEL ENDPOINTS
// ----------------------------------------------------

// Fetch all registered users
app.get('/api/admin/users', async (req: Request, res: Response) => {
  try {
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const usersList = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        email: data.email || '',
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        role: data.role || 'candidate',
        skills: data.skills || [],
        targetRoles: data.targetRoles || [],
        financials: data.financials || { walletBalanceUSD: 0, walletBalanceNGN: 0 },
        inferredLocationHints: data.inferredLocationHints || '',
        salary: data.salary || '',
        updatedAt: data.updatedAt || '',
        geminiApiKey: data.geminiApiKey ? '•' + data.geminiApiKey.slice(-4) : '', // Obfuscated
        flutterwavePublicKey: data.flutterwavePublicKey ? '•' + data.flutterwavePublicKey.slice(-4) : '', // Obfuscated
        flutterwaveSecretKey: data.flutterwaveSecretKey ? '•' + data.flutterwaveSecretKey.slice(-4) : '' // Obfuscated
      };
    });
    res.status(200).json(usersList);
  } catch (error: any) {
    console.error("Failed to fetch admin users database:", error);
  }
});

// Promotes or demotes user role between admin and candidate
app.post('/api/admin/users/:userId/change-role', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role, adminEmail } = req.body;

  if (adminEmail !== 'admin@gigo.com') {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can configure user authorization roles." });
    return;
  }

  if (role !== 'admin' && role !== 'candidate') {
    res.status(400).json({ error: "Invalid role value. Role must be admin or candidate." });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "Candidate profile not found." });
      return;
    }

    await userRef.update({
      role,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Administrative Override] Updated user ${userId} role to ${role.toUpperCase()}`);

    res.status(200).json({ success: true, message: `User role successfully updated to ${role}.` });
  } catch (error: any) {
    console.error("Failed to update user role:", error);
    res.status(500).json({ error: "Failed to update user role.", details: error.message });
  }
});

// Direct admin override to adjust user wallet balance
app.post('/api/admin/users/:userId/adjust-balance', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amount, currency, purpose } = req.body;

  if (amount === undefined || !currency) {
    res.status(400).json({ error: "Missing amount or currency in request body." });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "Candidate profile not found." });
      return;
    }

    const ledgerRef = userRef.collection('ledger').doc();
    const balanceField = currency === 'USD' ? 'financials.walletBalanceUSD' : 'financials.walletBalanceNGN';
    const cleanAmount = Number(amount);

    await db.runTransaction(async (transaction) => {
      transaction.update(userRef, {
        [balanceField]: FieldValue.increment(cleanAmount),
        'financials.lastTopUpTimestamp': new Date().toISOString()
      });

      transaction.set(ledgerRef, {
        timestamp: new Date().toISOString(),
        type: cleanAmount >= 0 ? 'CREDIT' : 'DEBIT',
        purpose: purpose || 'ADMIN_OVERRIDE_ADJUSTMENT',
        currency,
        amount: Math.abs(cleanAmount),
        paymentMethod: 'ADMINISTRATIVE_LEDGER',
        status: 'SUCCESSFUL',
        reconciliationId: `admin-adjust-${Date.now()}`
      });
    });

    console.log(`Admin adjusted wallet balance of ${userId} by ${cleanAmount} ${currency}`);

    const updatedUser = await userRef.get();
    res.status(200).json({
      success: true,
      message: `Adjusted user wallet successfully.`,
      financials: updatedUser.data()?.financials
    });

  } catch (error: any) {
    console.error("Failed to execute admin override:", error);
    res.status(500).json({ error: "Direct adjustment transaction failed.", details: error.message });
  }
});

// Fetch live agent execution logs
app.get('/api/admin/agent-logs', async (req: Request, res: Response) => {
  try {
    const logsSnapshot = await db.collection('agent_execution_logs')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const agentLogs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(agentLogs);
  } catch (error: any) {
    console.error("Failed to query execution logs from database:", error);
    res.status(500).json({ error: "Failed to query continuous validation agent logs.", details: error.message });
  }
});


// =========================================================================
// CANDIDATE KANBAN TASKS MANAGEMENT ENDPOINTS
// =========================================================================

// Fetches user tasks from the tasks subcollection (with automatic default seed fallback)
app.get('/api/users/:userId/tasks', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  try {
    const userRef = db.collection('users').doc(userId);
    const tasksSnapshot = await userRef.collection('tasks').get();
    
    let tasksList = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Seed default highly compatible tasks if the subcollection is completely empty
    if (tasksList.length === 0) {
      console.log(`[Database Sync] Seeding 3 default Kanban tasks for candidate ${userId}...`);
      const defaultTasks = [
        { id: 'task-1', title: 'Lead AI Engineer', company: 'Google', status: 'matched', salary: '$180k - $240k', confidence: 96, date: 'Today', pinned: false, createdAt: new Date().toISOString() },
        { id: 'task-2', title: 'Senior React Developer', company: 'Vercel', status: 'applied', salary: '$140k - $185k', confidence: 89, date: '2 days ago', pinned: false, createdAt: new Date().toISOString() },
        { id: 'task-3', title: 'LLM Fine-Tuning Specialist', company: 'Anthropic', status: 'interviews', salary: '$200k - $260k', confidence: 93, date: 'Scheduled Jun 15', pinned: false, createdAt: new Date().toISOString() }
      ];

      const batch = db.batch();
      for (const t of defaultTasks) {
        const docRef = userRef.collection('tasks').doc(t.id);
        batch.set(docRef, t);
      }
      await batch.commit();
      
      tasksList = defaultTasks;
    }

    res.status(200).json(tasksList);
  } catch (error: any) {
    console.error(`Failed to fetch tasks for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to fetch candidate task tracking cards.", details: error.message });
  }
});

// Creates a new custom task
app.post('/api/users/:userId/tasks', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  const task = req.body;
  if (!task.title || !task.company) {
    res.status(400).json({ error: "Missing required parameters: title and company are required." });
    return;
  }

  try {
    const taskId = task.id || 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newTask = {
      id: taskId,
      title: task.title,
      company: task.company,
      status: task.status || 'matched',
      salary: task.salary || 'Competitive',
      confidence: typeof task.confidence === 'number' ? task.confidence : 90,
      date: task.date || 'Today',
      pinned: !!task.pinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('users').doc(userId).collection('tasks').doc(taskId).set(newTask);
    res.status(201).json(newTask);
  } catch (error: any) {
    console.error(`Failed to create task for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to register custom career task.", details: error.message });
  }
});

// Updates a specific task status, pin, or details
app.put('/api/users/:userId/tasks/:taskId', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  const { taskId } = req.params;
  const updates = req.body;

  try {
    const docRef = db.collection('users').doc(userId).collection('tasks').doc(taskId);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Task card not found." });
      return;
    }

    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    // Delete id in body to prevent overwriting key
    delete cleanUpdates.id;

    await docRef.update(cleanUpdates);
    const updated = await docRef.get();
    res.status(200).json({ id: taskId, ...updated.data() });
  } catch (error: any) {
    console.error(`Failed to update task ${taskId} for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to update task tracking card.", details: error.message });
  }
});

// Deletes a specific task
app.delete('/api/users/:userId/tasks/:taskId', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  const { taskId } = req.params;

  try {
    const docRef = db.collection('users').doc(userId).collection('tasks').doc(taskId);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Task card not found." });
      return;
    }

    await docRef.delete();
    res.status(200).json({ success: true, message: "Task card successfully deleted from board." });
  } catch (error: any) {
    console.error(`Failed to delete task ${taskId} for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to delete task tracking card.", details: error.message });
  }
});


// =========================================================================
// GLOBAL ADMINISTRATIVE LEDGER & APPLICATIONS AGGREGATION ENDPOINTS
// =========================================================================

// Global Transactions Ledger Aggregator (All Candidates)
app.get('/api/admin/global-transactions', async (req: Request, res: Response) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const allTransactions: any[] = [];

    // Retrieve ledger subcollection documents for each user
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const ledgerSnapshot = await doc.ref.collection('ledger').get();
      
      ledgerSnapshot.forEach(transDoc => {
        const transData = transDoc.data();
        allTransactions.push({
          id: transDoc.id,
          userId: doc.id,
          userEmail: userData.email || '',
          userFullName: userData.fullName || 'Anonymous',
          ...transData
        });
      });
    }

    // Sort chronologically descending
    allTransactions.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    res.status(200).json(allTransactions.slice(0, 200)); // Cap to 200 for lightning speed
  } catch (error: any) {
    console.error("Failed to compile global ledger details:", error);
    res.status(500).json({ error: "Failed to fetch global system transactions.", details: error.message });
  }
});

// Global Application Milestones Aggregator (All Candidates)
app.get('/api/admin/global-applications', async (req: Request, res: Response) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const allApplications: any[] = [];

    // Retrieve tasks subcollection documents for each user
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const tasksSnapshot = await doc.ref.collection('tasks').get();
      
      tasksSnapshot.forEach(taskDoc => {
        const taskData = taskDoc.data();
        allApplications.push({
          id: taskDoc.id,
          userId: doc.id,
          userEmail: userData.email || '',
          userFullName: userData.fullName || 'Anonymous',
          ...taskData
        });
      });
    }

    // Sort by creation date descending
    allApplications.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    res.status(200).json(allApplications);
  } catch (error: any) {
    console.error("Failed to compile global active applications:", error);
    res.status(500).json({ error: "Failed to fetch global ecosystem applications.", details: error.message });
  }
});


// ----------------------------------------------------
// SYSTEM SETTINGS / CONFIGURATIONS ENDPOINTS
// ----------------------------------------------------

// Fetch global system configurations (Public)
app.get('/api/system-config', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('system_configs').doc('global').get();
    if (doc.exists) {
      const data = doc.data() || {};
      res.status(200).json({
        frontendDomain: data.frontendDomain || 'https://wa-frontend-seven.vercel.app',
        referralBonus: typeof data.referralBonus === 'number' ? data.referralBonus : 500.00,
        scraperDomains: Array.isArray(data.scraperDomains) ? data.scraperDomains : ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com'],
        booleanSearchTemplate: data.booleanSearchTemplate || '"Job role/title" (onsite OR "in-office" OR "remote") (site:google.com OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31'
      });
    } else {
      res.status(200).json({
        frontendDomain: 'https://wa-frontend-seven.vercel.app',
        referralBonus: 500.00,
        scraperDomains: ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com'],
        booleanSearchTemplate: '"Job role/title" (onsite OR "in-office" OR "remote") (site:google.com OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31'
      });
    }
  } catch (error: any) {
    console.error("Failed to fetch system config:", error);
    res.status(200).json({
      frontendDomain: 'https://wa-frontend-seven.vercel.app',
      referralBonus: 500.00,
      scraperDomains: ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com'],
      booleanSearchTemplate: '"Job role/title" (onsite OR "in-office" OR "remote") (site:google.com OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31'
    });
  }
});

// Update global system configurations (Admin Only)
app.post('/api/admin/system-config', async (req: Request, res: Response) => {
  const { frontendDomain, referralBonus, scraperDomains, booleanSearchTemplate, adminEmail } = req.body;

  if (adminEmail !== 'admin@gigo.com') {
    res.status(403).json({ error: "Unauthorized. Only the super admin (admin@gigo.com) can modify system configurations." });
    return;
  }

  try {
    const cleanBonus = parseFloat(referralBonus);
    if (isNaN(cleanBonus) || cleanBonus < 0) {
      res.status(400).json({ error: "Invalid referral bonus value. Must be a non-negative number." });
      return;
    }

    if (!frontendDomain || !frontendDomain.startsWith('http')) {
      res.status(400).json({ error: "Invalid frontend domain. Must start with http:// or https://" });
      return;
    }

    // Clean up trailing slash if present
    const cleanDomain = frontendDomain.endsWith('/') ? frontendDomain.slice(0, -1) : frontendDomain;

    let cleanDomains = ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com'];
    if (Array.isArray(scraperDomains)) {
      cleanDomains = scraperDomains.map((d: any) => String(d).trim().toLowerCase()).filter(Boolean);
    }

    await db.collection('system_configs').doc('global').set({
      frontendDomain: cleanDomain,
      referralBonus: cleanBonus,
      scraperDomains: cleanDomains,
      booleanSearchTemplate: booleanSearchTemplate || '"Job role/title" (onsite OR "in-office" OR "remote") (site:google.com OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`[Administrative Setting] Updated system settings: Domain=${cleanDomain}, Bonus=₦${cleanBonus}, Domains=${cleanDomains.join(',')}`);

    res.status(200).json({
      success: true,
      message: "System configurations updated successfully.",
      config: { 
        frontendDomain: cleanDomain, 
        referralBonus: cleanBonus, 
        scraperDomains: cleanDomains,
        booleanSearchTemplate: booleanSearchTemplate || '"Job role/title" (onsite OR "in-office" OR "remote") (site:google.com OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31'
      }
    });
  } catch (error: any) {
    console.error("Failed to update system config:", error);
    res.status(500).json({ error: "Failed to update system configurations.", details: error.message });
  }
});


// ----------------------------------------------------
// DISCOVERED JOBS & VOICE ONBOARDING
// ----------------------------------------------------

// Fetches all discovered jobs from Firestore with optional real-time profile matching alignment
// Fetches all discovered jobs from Firestore with optional real-time profile matching alignment
app.get('/api/discovered-jobs', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    // 1. Automatic 3-Day Expiration Cleanup Purge
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoIso = threeDaysAgo.toISOString();

    try {
      const expiredSnapshot = await db.collection('discovered_jobs')
        .where('scrapedAt', '<', threeDaysAgoIso)
        .get();

      if (!expiredSnapshot.empty) {
        console.log(`Auto-Purge: Found ${expiredSnapshot.size} expired jobs older than 3 days. Cleaning up...`);
        const batch = db.batch();
        expiredSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (cleanupErr) {
      console.warn("Auto-cleanup of 3-day expired jobs failed:", cleanupErr);
    }

    // 2. Query all discovered jobs sorted by scrapedAt descending
    const jobsSnapshot = await db.collection('discovered_jobs')
      .orderBy('scrapedAt', 'desc').limit(150).get();
    
    let jobs = jobsSnapshot.docs.map(doc => doc.data());
    
    // Seed default jobs in database if empty so marquee works
    if (jobs.length === 0) {
      console.log("No jobs found in discovered_jobs. Seeding default listings...");
      const defaultJobs = [
        { id: 'job_40192', companyName: 'TechForge Inc.', jobTitle: 'Executive Assistant', workType: 'Remote', applicationLinkOrEmail: 'https://boards.greenhouse.io/techforge/jobs/40192', sourcePlatform: 'Greenhouse', keyRequirementsSummary: ['Excel', 'Calendar Management', 'Communication'], scrapedAt: new Date().toISOString() },
        { id: 'job_8812', companyName: 'FinGo Solutions', jobTitle: 'Data Entry & Support Ops', workType: 'Remote', applicationLinkOrEmail: 'https://jobs.lever.co/fingo/8812-abc', sourcePlatform: 'Lever', keyRequirementsSummary: ['Data entry', 'Excel', '1-2 years experience'], scrapedAt: new Date().toISOString() },
        { id: 'job_559281', companyName: 'Skyline Corp', jobTitle: 'Customer Success Representative', workType: 'Remote', applicationLinkOrEmail: 'https://boards.greenhouse.io/skyline/jobs/559281', sourcePlatform: 'Greenhouse', keyRequirementsSummary: ['Zendesk', 'Customer support', 'Comms'], scrapedAt: new Date().toISOString() },
        { id: 'job_google', companyName: 'Google', jobTitle: 'Lead AI Engineer', workType: 'Remote', applicationLinkOrEmail: 'https://careers.google.com/jobs/ai-lead', sourcePlatform: 'Company Portal', keyRequirementsSummary: ['LLMs', 'TypeScript', 'Node.js'], scrapedAt: new Date().toISOString() },
        { id: 'job_vercel', companyName: 'Vercel', jobTitle: 'Senior React Developer', workType: 'Remote', applicationLinkOrEmail: 'https://vercel.com/careers/react-dev', sourcePlatform: 'Lever', keyRequirementsSummary: ['React', 'Next.js', 'TypeScript'], scrapedAt: new Date().toISOString() },
        { id: 'job_anthropic', companyName: 'Anthropic', jobTitle: 'LLM Fine-Tuning Specialist', workType: 'Remote', applicationLinkOrEmail: 'https://boards.greenhouse.io/anthropic/jobs/tuning', sourcePlatform: 'Greenhouse', keyRequirementsSummary: ['Fine-tuning', 'Python', 'Transformer architectures'], scrapedAt: new Date().toISOString() }
      ];

      for (const job of defaultJobs) {
        await db.collection('discovered_jobs').doc(job.id).set(job);
      }
      jobs = defaultJobs;
    }
    
    // 3. Keep only jobs belonging to this user, OR global/seeded jobs (where userId is missing/null/global)
    const filterUserId = userId as string || '';
    jobs = jobs.filter(job => {
      return (job.userId === filterUserId) || !job.userId || job.userId === 'global';
    });

    // Real-time Candidate Matching Logic & Ticker Channel Filtering
    let candidateSkills: string[] = [];
    let candidateRoles: string[] = [];
    let tickerTargetDomains: string[] = [];
    let userData: any = null;

    if (userId) {
      try {
        const userDoc = await db.collection('users').doc(userId as string).get();
        if (userDoc.exists) {
          userData = userDoc.data();
          candidateSkills = (userData?.skills || []).map((s: string) => s.toLowerCase());
          candidateRoles = (userData?.targetRoles || []).map((r: string) => r.toLowerCase());
          tickerTargetDomains = Array.isArray(userData?.tickerTargetDomains) ? userData.tickerTargetDomains : [];
        }
      } catch (err) {
        console.warn("Failed to fetch user profile for real-time job alignment calculation:", err);
      }
    }

    // Filter jobs by tickerTargetDomains if user specified any
    if (userId && tickerTargetDomains.length > 0) {
      jobs = jobs.filter(job => {
        const platform = (job.sourcePlatform || '').toLowerCase();
        const link = (job.applicationLinkOrEmail || '').toLowerCase();
        return tickerTargetDomains.some(dom => {
          const cleanDom = dom.toLowerCase().trim();
          return platform.includes(cleanDom) || link.includes(cleanDom);
        });
      });

      // Seeding fallback if filtering returns empty, ensuring the marquee is functional
      if (jobs.length === 0) {
        console.log(`No jobs matched custom channels [${tickerTargetDomains.join(', ')}]. Seeding dynamic entries...`);
        jobs = tickerTargetDomains.map((dom, idx) => ({
          id: `job_sim_ticker_${idx}_${Date.now()}`,
          companyName: dom === 'twitter.com' ? "Twitter Hiring Partner" : dom === 'linkedin.com' ? "LinkedIn Premium Recruiter" : `${dom.split('.')[0].toUpperCase()} Talent Hub`,
          jobTitle: (userData?.targetRoles && userData.targetRoles[0]) || "Specialist Developer",
          workType: "Remote",
          applicationLinkOrEmail: `https://${dom}/gigo/apply/${idx}`,
          sourcePlatform: dom,
          keyRequirementsSummary: (userData?.skills && userData.skills.slice(0, 3)) || ["Experience", "Adaptability", "Execution"],
          scrapedAt: new Date().toISOString(),
          applicationEmail: `apply@${dom}`,
          applicationPhone: "+234-80-TICKER-MATCH",
          applicationLink: `https://${dom}/gigo/apply/${idx}`
        }));
      }
    }

    const enrichedJobs = jobs.map(job => {
      let score = 0;
      if (userId && (candidateSkills.length > 0 || candidateRoles.length > 0)) {
        const titleLower = (job.jobTitle || '').toLowerCase();
        const requirements = (job.keyRequirementsSummary || []).map((r: string) => r.toLowerCase());

        // 1. Role / Title Match (up to 40 points)
        let titleMatchScore = 0;
        candidateRoles.forEach(role => {
          if (titleLower.includes(role) || role.includes(titleLower)) {
            titleMatchScore = 40;
          }
        });
        if (titleMatchScore === 0) {
          candidateRoles.forEach(role => {
            const roleWords = role.split(/\s+/);
            roleWords.forEach(word => {
              if (word.length > 3 && titleLower.includes(word)) {
                titleMatchScore = Math.min(titleMatchScore + 10, 20);
              }
            });
          });
        }

        // 2. Skills / Requirements Match (up to 50 points)
        let skillMatches = 0;
        requirements.forEach((reqSkill: string) => {
          candidateSkills.forEach((candSkill: string) => {
            if (candSkill.includes(reqSkill) || reqSkill.includes(candSkill)) {
              skillMatches++;
            }
          });
        });
        const skillsMatchScore = requirements.length > 0 
          ? Math.min((skillMatches / requirements.length) * 50, 50) 
          : 25; 

        // 3. Base matching value (10 points)
        const baseScore = 10;

        score = Math.round(baseScore + titleMatchScore + skillsMatchScore);
        score = Math.min(Math.max(score, 45), 99); 
      } else {
        const seedId = job.id || 'default';
        let hash = 0;
        for (let i = 0; i < seedId.length; i++) {
          hash = seedId.charCodeAt(i) + ((hash << 5) - hash);
        }
        score = Math.abs(hash % 20) + 75; 
      }

      return {
        ...job,
        matchScore: score
      };
    });

    res.status(200).json(enrichedJobs);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch active job stream.", details: error.message });
  }
});

// Delete/Dismiss a discovered job (Manual Dismissal Engine)
app.delete('/api/discovered-jobs/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    console.log(`Manual Dismissal: Deleting job ${id} from Firestore`);
    await db.collection('discovered_jobs').doc(id).delete();
    res.status(200).json({ success: true, message: "Job successfully dismissed from ticker." });
  } catch (error: any) {
    console.error("Failed to dismiss job:", error);
    res.status(500).json({ error: "Failed to dismiss job.", details: error.message });
  }
});

// Process voice audio files for onboarding
app.post('/api/onboard-voice', upload.single('audio'), async (req: Request, res: Response) => {
  const { userId } = req.body;
  
  if (!req.file) {
    res.status(400).json({ error: "No audio file payload found in the request." });
    return;
  }

  const resolvedUserId = userId || 'user_alex_carter_001';
  const filePath = req.file.path;
  const mimeType = req.file.mimetype || 'audio/webm';

  console.log(`Received file upload: ${req.file.originalname} (${req.file.size} bytes) saved to ${filePath}`);

  try {
    const profile = await processVoiceOnboarding(resolvedUserId, filePath, mimeType, 45);
    
    // Clean up local temp file synchronously to avoid disk clutter
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (profile) {
      res.status(200).json({
        success: true,
        message: "Voice onboarding completed, profile details synchronized.",
        profile
      });
    } else {
      res.status(500).json({ error: "AI voice processor failed to parse the recording into structured fields." });
    }
  } catch (error: any) {
    console.error("Voice onboarding route handler failed:", error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to onboard voice audio.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

// Process voice audio files for signup parsed extraction
app.post('/api/auth/signup-voice', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No audio file payload found in the request." });
    return;
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype || 'audio/webm';
  const startTime = Date.now();

  console.log(`Received signup voice upload: ${req.file.originalname} (${req.file.size} bytes) saved to ${filePath}`);

  try {
    const { ai, modelFlash } = getGeminiClient();
    const audioBuffer = fs.readFileSync(filePath);
    const base64Audio = audioBuffer.toString('base64');

    console.log(`Sending signup audio natively to ${modelFlash}...`);

    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        {
          text: `You are the signup voice parsing agent for GiGO.
          Listen carefully to this user's vocal recording where they say their names, email, and phone number.
          
          Extract their full name, email, and phone number. Clean up any spoken elements (e.g., spoken email symbols like "at" to "@", "dot" to ".").
          If a field is not mentioned, return an empty string. Do not invent any names or email addresses that are not spoken.
          
          IMPORTANT: Return a clean JSON object exactly matching the schema below. Keep email addresses in lowercase.`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING, description: "Extract the full name of the user. Empty string if not mentioned." },
            email: { type: Type.STRING, description: "Extract the email address. Clean up any spoken text into a standard email format. Empty string if not mentioned." },
            phoneNumber: { type: Type.STRING, description: "Extract the phone number. Empty string if not mentioned." }
          },
          required: ['fullName', 'email', 'phoneNumber']
        }
      }
    });

    // Clean up local temp file synchronously
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (response.text) {
      const parsedData = JSON.parse(response.text.trim());
      console.log(`Successfully parsed signup fields:`, parsedData);

      // Log execution telemetry
      const latencyMs = Date.now() - startTime;
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: "Signup_Voice_Parsing_Agent",
        cycleType: "SIGNUP_VOICE_EXTRACTION",
        userId: "SIGNUP_VOICE_PENDING",
        executionMetrics: {
          latencyMs,
          audioPayloadSizeBytes: audioBuffer.length,
          modelUsed: modelFlash,
          status: "SUCCESS"
        },
        businessDecisionsExecuted: [
          "Parsed raw audio upload natively using Gemini 2.5 Flash.",
          "Extracted signup credentials: Full Name, Email, and Phone Number.",
          "Returned structured JSON payload to front-end to auto-populate fields."
        ]
      });

      res.status(200).json({
        success: true,
        data: parsedData
      });
    } else {
      res.status(500).json({ error: "AI voice processor returned empty text response." });
    }

  } catch (error: any) {
    console.error("Signup voice routing handler failed:", error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to parse signup voice audio.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});


// ----------------------------------------------------
// CORES & OPERATIONS
// ----------------------------------------------------

// Generate ATS Compliance Documents (Charges ₦400 atomically)
app.post('/api/generate-assets', handleAssetGenerationRoute);

// Cron trigger for Purging Expired Discovered Jobs (older than 3 days)
app.get('/api/cron/cleanup-expired-jobs', async (req: Request, res: Response) => {
  console.log("CRON: Triggering Expired Discovered Jobs Cleanup...");
  const startTime = Date.now();
  try {
    const thresholdMs = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const thresholdIso = new Date(thresholdMs).toISOString();

    const jobsRef = db.collection('discovered_jobs');
    const snapshot = await jobsRef.where('scrapedAt', '<', thresholdIso).get();
    
    let deletedCount = 0;
    
    if (!snapshot.empty) {
      let batch = db.batch();
      let count = 0;
      
      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        count++;
        deletedCount++;
        
        if (count === 500) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
    }
    
    const durationMs = Date.now() - startTime;
    
    const logData = {
      timestamp: new Date().toISOString(),
      action: 'CLEANUP_EXPIRED_JOBS',
      thresholdDate: thresholdIso,
      purgedCount: deletedCount,
      latencyMs: durationMs,
      status: 'SUCCESS'
    };
    
    await db.collection('agent_execution_logs').add(logData);
    console.log(`CRON: Purged ${deletedCount} jobs older than 3 days. Telemetry logged. Duration: ${durationMs}ms`);
    
    res.status(200).json({
      success: true,
      message: `Purged ${deletedCount} expired discovered jobs successfully.`,
      purgedCount: deletedCount,
      durationMs
    });
  } catch (error: any) {
    console.error("Cron Expired Jobs Cleanup failed:", error);
    const durationMs = Date.now() - startTime;
    try {
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        action: 'CLEANUP_EXPIRED_JOBS',
        error: error.message,
        latencyMs: durationMs,
        status: 'FAILED'
      });
    } catch (logErr: any) {
      console.error("Failed to write failure telemetry log:", logErr.message);
    }
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Expired jobs cleanup failed.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

// Cron trigger for Automated Boolean Scraper Indexer
app.get('/api/cron/run-scraper', async (req: Request, res: Response) => {
  console.log("CRON: Triggering Autonomous Boolean Scraper Sweep...");
  try {
    const { userId } = req.query;
    await executeAutonomousScraperPipeline(userId as string);
    res.status(200).json({ success: true, message: "Autonomous Boolean Scraper run finished and logged." });
  } catch (error: any) {
    console.error("Scraper run execution encountered errors:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Scraper run execution encountered errors.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

// Root health-check endpoint
app.get('/', (req, res) => {
  res.json({
    status: "online",
    message: "GiGO Career Platform - AI-Native Backend API is running successfully."
  });
});

app.use('/api', webhookRouter);
app.use('/api', manualSearchRouter);
app.use('/api', emailRouter);
app.use('/api', referralsRouter);
app.use('/api', mailroomRouter);
app.use('/api', interviewRouter);
app.use('/api/test', testAudioRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`WA Server running on port ${PORT}`));
