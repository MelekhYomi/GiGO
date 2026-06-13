import { GoogleGenAI } from '@google/genai';
import { db } from './firebase-config';
import axios from 'axios';
import { getGeminiClient } from './utils/gemini';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || '';
const WHATSAPP_AUTH_TOKEN = process.env.WHATSAPP_AUTH_TOKEN || '';
const SENDER_NUMBER = process.env.WHATSAPP_SENDER_NUMBER || '';

export async function processRealTimeJobMatchingNotifications(newJob: any) {
  const usersSnapshot = await db.collection('users').where('financials.walletBalanceNGN', '>', 0).get();
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const { ai, modelFlash } = getGeminiClient(userData?.geminiApiKey);
    const matchAnalysis = await ai.models.generateContent({
      model: modelFlash,
      contents: `Evaluate job: ${newJob.jobTitle} against Candidate Context: ${JSON.stringify(userData)}. Respond ONLY with a confidence number between 0 and 100.`
    });
    const matchScore = parseInt(matchAnalysis.text?.trim() || '0', 10);
    if (matchScore >= 75) {
      const msg = `Hello ${userData.fullName}! 🚀 Match found: *${newJob.jobTitle}* at *${newJob.companyName}* (${matchScore}% alignment). Apply instantly: https://wa-app-demo-xyz.web.app/dashboard`;
      const params = new URLSearchParams({ To: `whatsapp:${userData.phoneNumber}`, From: SENDER_NUMBER, Body: msg });
      await axios.post(WHATSAPP_API_URL, params, {
        headers: { 'Authorization': `Basic ${Buffer.from(`AC_SID:${WHATSAPP_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    }
  }
}
