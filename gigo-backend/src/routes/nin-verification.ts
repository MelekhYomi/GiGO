import express, { Request, Response } from 'express';
import { Type } from '@google/genai';
import { db } from '../firebase-config';
import { getGeminiClient } from '../utils/gemini';

const router = express.Router();

// Real Gemini-vision-based NIN card verification. Replaces what used to be a
// fake simulated progress bar that always succeeded regardless of the image or
// number entered. This makes an actual judgment call — does the uploaded image
// look like a genuine NIN card/slip, does the NIN printed on it match what the
// candidate typed, does the name on it reasonably match their profile - and
// isNINVerified is set from that real result, not a hardcoded true.
router.post('/users/:userId/verify-nin-real', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { ninValue, ninCardImageBase64, mimeType } = req.body;

  if (!ninValue || !/^\d{11}$/.test(ninValue)) {
    res.status(400).json({ error: "A valid 11-digit NIN is required." });
    return;
  }
  if (!ninCardImageBase64) {
    res.status(400).json({ error: "A NIN card/slip image is required." });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }
    const profileName = userDoc.data()?.fullName || '';

    const { ai, modelFlash } = getGeminiClient();
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: [
        { inlineData: { mimeType: mimeType || 'image/jpeg', data: ninCardImageBase64 } },
        {
          text: `You are verifying a Nigerian National Identification Number (NIN) slip or card image for identity verification. Be genuinely skeptical - this gates real account privileges, so do not assume validity.

The candidate claims their NIN is: ${ninValue}
The candidate's registered full name is: ${profileName || '(not provided)'}

Look carefully at the image and determine:
1. Does this actually look like a real Nigerian NIN card or NIMC slip (has the right layout, header, format)? Not a random unrelated photo, screenshot, or blank/edited image.
2. What NIN number (if any) is visible printed on the document? Extract exactly what you see.
3. What full name (if any) is visible printed on the document? Extract exactly what you see.
4. Does the visible NIN number match ${ninValue} exactly?
5. Does the visible name reasonably match "${profileName}" (allowing for minor formatting/order differences, but not a clearly different person)?

Be honest if the image is blurry, cropped, unrelated, or clearly fake - do not give the benefit of the doubt.`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            looksLikeValidNINDocument: { type: Type.BOOLEAN },
            ninNumberVisible: { type: Type.STRING },
            nameVisible: { type: Type.STRING },
            ninMatches: { type: Type.BOOLEAN },
            nameMatches: { type: Type.BOOLEAN },
            reasoning: { type: Type.STRING, description: "Brief explanation of the verdict, mentioning anything suspicious." }
          },
          required: ['looksLikeValidNINDocument', 'ninNumberVisible', 'nameVisible', 'ninMatches', 'nameMatches', 'reasoning']
        }
      }
    });

    if (!response.text) throw new Error("Empty response from Gemini NIN verification.");
    const verdict = JSON.parse(response.text);

    const isVerified = !!(verdict.looksLikeValidNINDocument && verdict.ninMatches && verdict.nameMatches);

    await userRef.update({
      isNINVerified: isVerified,
      ninValue,
      ninVerificationVerdict: verdict,
      ninVerifiedAt: isVerified ? new Date().toISOString() : null
    });

    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "NINVerificationAgent",
      userId,
      executionMetrics: { modelUsed: modelFlash, status: isVerified ? 'VERIFIED' : 'REJECTED' },
      businessDecisionsExecuted: [
        `Real Gemini-vision NIN check: ${verdict.reasoning}`,
        isVerified ? 'Wallet lock lifted.' : 'Wallet lock remains in place - verification did not pass.'
      ]
    });

    res.status(200).json({ success: true, isNINVerified: isVerified, verdict });
  } catch (error: any) {
    console.error("Real NIN verification failed:", error.message);
    res.status(200).json({
      success: false,
      isNINVerified: false,
      error: "Verification service unavailable right now — please try again shortly. Your wallet lock status hasn't changed."
    });
  }
});

export default router;
