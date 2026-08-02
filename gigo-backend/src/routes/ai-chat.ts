import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { getGeminiClient } from '../utils/gemini';

const router = express.Router();

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

function buildProfileContext(userData: any): string {
  if (!userData) return "No profile data on file yet — this candidate hasn't completed onboarding.";
  const skills = Array.isArray(userData.skills) && userData.skills.length > 0 ? userData.skills.join(', ') : 'not listed yet';
  const summary = userData.professionalSummary && userData.professionalSummary !== '[   ]' ? userData.professionalSummary : 'not written yet';
  const role = userData.role || 'not specified';
  const years = userData.yearsOfExperience || 'unspecified';
  return `Candidate name: ${userData.fullName || userData.name || 'Unknown'}
Target role: ${role}
Years of experience: ${years}
Skills: ${skills}
Professional summary: ${summary}`;
}

function historyToPrompt(history: ChatTurn[]): string {
  if (!Array.isArray(history) || history.length === 0) return '';
  return history.slice(-10).map(turn => `${turn.role === 'user' ? 'Candidate' : 'You'}: ${turn.text}`).join('\n') + '\n';
}

// POST /api/users/:userId/coach-chat — general-purpose AI career coach chat.
router.post('/users/:userId/coach-chat', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { message, history } = req.body as { message: string; history?: ChatTurn[] };

  if (!message || !message.trim()) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const { ai, modelFlash } = getGeminiClient(userData?.geminiApiKey);

    const systemPrompt = `You are GiGO's AI Coach — a warm, direct career advisor helping a job-seeking candidate with career advice, salary negotiation, resume help, and networking.

Candidate profile:
${buildProfileContext(userData)}

Conversation so far:
${historyToPrompt(history || [])}
Candidate: ${message}

Reply as "You" — give concrete, actionable advice tailored to this candidate's real profile above. Keep it conversational, under 200 words unless the question genuinely needs more detail. Do not fabricate specifics about the candidate that weren't given to you.`;

    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: systemPrompt
    });

    const reply = response.text?.trim() || "I couldn't generate a response just now — please try again.";
    res.status(200).json({ reply });
  } catch (error: any) {
    console.error("AI Coach chat failed:", error);
    res.status(500).json({ error: "AI Coach is temporarily unavailable.", details: error.message });
  }
});

// POST /api/users/:userId/mind-clone-chat — chat with the candidate's own AI Mind Clone
// (speaks in the context of their profile/calibration data, from GiGO Brain page).
router.post('/users/:userId/mind-clone-chat', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { message, history } = req.body as { message: string; history?: ChatTurn[] };

  if (!message || !message.trim()) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const { ai, modelFlash } = getGeminiClient(userData?.geminiApiKey);

    const axes = userData?.calibrationAxes || { cognitive: 0, credential: 0, behavioral: 0, operational: 0 };

    const systemPrompt = `You are this candidate's "AI Mind Clone" inside GiGO — a personalized AI model trained on their real profile, work history, and calibration answers. You speak with self-awareness about your own training state (e.g. "I'm still learning your work history" if data is thin).

Candidate profile:
${buildProfileContext(userData)}

Current sync levels: Speaking style ${axes.cognitive}%, Experience & education ${axes.credential}%, Workplace decisions ${axes.behavioral}%, Account setup ${axes.operational}%.

Conversation so far:
${historyToPrompt(history || [])}
Candidate: ${message}

Reply as their Mind Clone — helpful, personal, referencing their actual data above where relevant, honest about gaps in what you know about them. Keep it under 200 words.`;

    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: systemPrompt
    });

    const reply = response.text?.trim() || "I couldn't generate a response just now — please try again.";
    res.status(200).json({ reply });
  } catch (error: any) {
    console.error("Mind Clone chat failed:", error);
    res.status(500).json({ error: "Mind Clone chat is temporarily unavailable.", details: error.message });
  }
});

export default router;
