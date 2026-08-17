import express, { Request, Response } from 'express';
import { Type } from '@google/genai';
import { getGeminiClient } from '../utils/gemini';

const router = express.Router();

// Real Gemini-based resume/career-summary parsing for the onboarding "Parse &
// Auto-Fill" button. Replaces what used to be a fake stub that just ran a
// setTimeout progress bar and picked from five hardcoded role templates via
// crude keyword matching (ignoring whatever the candidate actually pasted).
// Fails honestly on error instead of returning invented data, so the frontend
// can fall back to manual entry.
router.post('/users/:userId/parse-resume-text', async (req: Request, res: Response) => {
  const { resumeText } = req.body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) {
    res.status(400).json({ error: "Please paste at least a few sentences of real resume or career summary text." });
    return;
  }

  try {
    const { ai, modelFlash } = getGeminiClient();
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: [
        {
          text: `Extract structured career profile fields from this resume or career summary text. Only use what's actually written - do not invent skills, roles, or experience that aren't supported by the text.

TEXT:
"""
${resumeText.slice(0, 8000)}
"""

Extract:
1. The candidate's most recent or most senior job title / target role.
2. A list of concrete technical or professional skills actually mentioned (tools, languages, frameworks, methodologies).
3. Total years of professional experience, estimated from dates/roles mentioned (0 if unclear).
4. A 1-2 sentence professional summary written in third person, grounded only in what's in the text.`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            yearsOfExperience: { type: Type.NUMBER },
            professionalSummary: { type: Type.STRING }
          },
          required: ['role', 'skills', 'yearsOfExperience', 'professionalSummary']
        }
      }
    });

    if (!response.text) throw new Error("Empty response from Gemini resume parsing.");
    const parsed = JSON.parse(response.text);

    res.status(200).json({ success: true, parsed });
  } catch (error: any) {
    console.error("Real resume parsing failed:", error.message);
    res.status(200).json({
      success: false,
      error: "AI parsing is unavailable right now — please fill in the fields manually below instead."
    });
  }
});

export default router;
