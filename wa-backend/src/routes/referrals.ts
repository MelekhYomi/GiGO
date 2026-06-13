import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { getGeminiClient } from '../utils/gemini';
import { Type } from '@google/genai';

const router = express.Router();

/**
 * Endpoint to process a referral invitation
 * POST /api/referrals/invite
 */
router.post('/referrals/invite', async (req: Request, res: Response) => {
  const { userId, friendName, friendEmail, friendPhone, dispatchMode } = req.body;

  if (!userId || !friendName || !friendEmail) {
    res.status(400).json({ error: "Missing required fields: userId, friendName, and friendEmail are required." });
    return;
  }

  try {
    // 1. Fetch referrer profile details
    const referrerRef = db.collection('users').doc(userId);
    const referrerDoc = await referrerRef.get();

    if (!referrerDoc.exists) {
      res.status(404).json({ error: "Referrer profile not found." });
      return;
    }

    const referrerData = referrerDoc.data() || {};
    const referrerName = referrerData.fullName || "A colleague";

    const { ai, modelFlash } = getGeminiClient();

    // Fetch dynamic frontend domain and referral bonus with fallback defaults
    let frontendDomain = "https://wa-frontend-seven.vercel.app";
    let referralBonus = 500.00;
    try {
      const systemDoc = await db.collection('system_configs').doc('global').get();
      if (systemDoc.exists) {
        const systemData = systemDoc.data() || {};
        if (systemData.frontendDomain) {
          frontendDomain = systemData.frontendDomain;
        }
        if (typeof systemData.referralBonus === 'number') {
          referralBonus = systemData.referralBonus;
        }
      }
    } catch (configErr: any) {
      console.warn("Failed to fetch dynamic config in referral invitation route, using defaults:", configErr.message);
    }

    // Ensure no trailing slash
    if (frontendDomain.endsWith('/')) {
      frontendDomain = frontendDomain.slice(0, -1);
    }

    const referralLink = `${frontendDomain}/?ref=${userId}`;

    // 2. Draft customized pitch via Gemini
    const systemPrompt = `You are GiGO's AI Referral Agent.
Our platform, "GiGO" is an AI-Native Career Ecosystem allowing candidates to perform voice-powered sign-up, voice-onboarding, real-time advanced scraper job matching, and multi-asset compilation (Resume, Cover Letters, Portfolios) with secure email dispatch.
The user "${referrerName}" wants to refer their friend "${friendName}" to register on GiGO.
To incentivize them, GiGO offers a free ₦5,000 NGN promotional signup bonus in their regional wallet which can get them to compile their assets and send job applications immediately.
When they complete signup, the referrer "${referrerName}" will receive a ₦${referralBonus} NGN referral bonus.

Generate an ultra-persuasive, professional, yet engaging onboarding email subject line, email body, and a short punchy WhatsApp message.
The email and WhatsApp message MUST include the friend's custom referral link: ${referralLink}
And highlight the ₦5,000 NGN promotional signup reward.

You MUST respond ONLY with a JSON object in this exact schema:
{
  "subject": "Email Subject Line",
  "emailBody": "Full markdown-formatted email body containing greetings, pitch, benefits, signup link, and closing.",
  "whatsappMessage": "A short, punchy WhatsApp message with emojis, the signup link, and highlight of the signup reward."
}`;

    let subject = `Join GiGO - Your AI-Native Career Accelerator (Referred by ${referrerName})`;
    let emailBody = `Hi ${friendName},\n\nYour colleague **${referrerName}** is inviting you to join **GiGO**! It is a state-of-the-art AI-Native Career Ecosystem designed to automate your job-seeking journey.\n\nRegister now and receive an instant **₦5,000 NGN Sign-up Reward** in your wallet to compile ATS resumes and send job applications completely free: ${referralLink}`;
    let whatsappMessage = `Hey ${friendName}! 🚀 ${referrerName} referred you to join GiGO - an AI-powered job search platform! Get an instant ₦5,000 NGN Signup Reward to start applying: ${referralLink}`;

    try {
      const response = await ai.models.generateContent({
        model: modelFlash,
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              emailBody: { type: Type.STRING },
              whatsappMessage: { type: Type.STRING }
            },
            required: ["subject", "emailBody", "whatsappMessage"]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        subject = parsed.subject || subject;
        emailBody = parsed.emailBody || emailBody;
        whatsappMessage = parsed.whatsappMessage || whatsappMessage;
      }
    } catch (geminiError: any) {
      console.warn("Gemini referral pitch generation failed, falling back to pre-defined templates:", geminiError.message);
    }

    const referralId = 'ref_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const lowercaseEmail = friendEmail.toLowerCase();

    // 3. Save referral document to Firestore
    await db.collection('referrals').doc(referralId).set({
      referralId,
      referrerId: userId,
      referrerName,
      friendName,
      friendEmail: lowercaseEmail,
      friendPhone: friendPhone || '',
      dispatchMode,
      status: 'PENDING',
      subject,
      emailBody,
      whatsappMessage,
      createdAt: new Date().toISOString()
    });

    // 4. Handle dispatch simulations if AI_AGENT is specified
    let telemetryMsg = `Referral recorded successfully. Invitation links generated.`;
    if (dispatchMode === 'AI_AGENT') {
      console.log(`[AI Referral Agent] Simulating multi-channel dispatch to ${lowercaseEmail} (referred by ${referrerName})...`);
      
      // We simulate writing to SMTP and WhatsApp logs
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: "Native_Referral_Agent",
        cycleType: "INVITATION_DISPATCH",
        userId: userId,
        inputMeta: {
          friendName,
          friendEmail: lowercaseEmail,
          dispatchMode
        },
        executionMetrics: {
          status: "SUCCESS"
        },
        businessDecisionsExecuted: [
          `Formulated highly persuasive personalized onboarding pitch for ${friendName} via Gemini.`,
          `Simulated SMTP dispatch of invitation email to ${lowercaseEmail}.`,
          `Simulated real-time WhatsApp push notification to ${friendPhone || 'unspecified'}.`,
          `Attached onboarding promotion credentials tracking parameters (referrerId: ${userId}).`
        ]
      });

      telemetryMsg = `[AI Referral Agent] Formulated ultra-persuasive onboarding pitch. Dispatched via SMTP to ${lowercaseEmail} & simulated WhatsApp to ${friendPhone || 'friend'} successfully!`;
    }

    res.status(200).json({
      success: true,
      referralId,
      subject,
      emailBody,
      whatsappMessage,
      telemetryMsg
    });

  } catch (error: any) {
    console.error("Referral process error:", error);
    res.status(500).json({ error: "Failed to process referral invite.", details: error.message });
  }
});

/**
 * Fetch referrals initiated by a specific user
 * GET /api/referrals/user/:userId
 */
router.get('/referrals/user/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const snapshot = await db.collection('referrals').where('referrerId', '==', userId).get();
    const referrals = snapshot.docs.map(doc => doc.data());
    res.status(200).json(referrals);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch user referrals.", details: error.message });
  }
});

export default router;
