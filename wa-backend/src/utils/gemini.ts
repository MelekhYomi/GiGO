import { GoogleGenAI } from '@google/genai';

/**
 * Returns a configured GoogleGenAI instance and the proper model names to use.
 * If a custom key is provided, it uses Google AI Studio (API key).
 * Otherwise, it falls back to native Vertex AI integration using the GCP Service Account ADC.
 *
 * @param customApiKey Optional user-supplied Gemini API key from the database
 */
export function getGeminiClient(customApiKey?: string): { ai: GoogleGenAI; modelFlash: string; modelPro: string } {
  // 1. If custom key is provided and is NOT the depleted system default key, use it with AI Studio
  if (customApiKey && customApiKey.trim() !== '' && customApiKey !== 'AIzaSyDb0H-lJapcJrHTOkddZNJaohxbnOvOzZ0') {
    console.log('Utilizing custom user-supplied Gemini API key for AI Studio...');
    return {
      ai: new GoogleGenAI({ apiKey: customApiKey }),
      modelFlash: 'gemini-2.5-flash',
      modelPro: 'gemini-2.5-pro'
    };
  }

  // 2. If global process.env.GEMINI_API_KEY is available and is NOT the depleted system default key
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim() !== '' && envKey !== 'AIzaSyDb0H-lJapcJrHTOkddZNJaohxbnOvOzZ0') {
    console.log('Utilizing system environment Gemini API key for AI Studio...');
    return {
      ai: new GoogleGenAI({ apiKey: envKey }),
      modelFlash: 'gemini-2.5-flash',
      modelPro: 'gemini-2.5-pro'
    };
  }

  // 3. Otherwise, fallback completely to Vertex AI using Application Default Credentials (ADC)
  // This avoids depletion or key rotation problems entirely for consumer platform exploration.
  console.log('Falling back to platform-native Vertex AI integration via Service Account ADC...');
  return {
    ai: new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || 'project-ce78d47a-1bfa-42ef-8ae',
      location: 'us-central1'
    }),
    modelFlash: 'gemini-2.5-flash',
    modelPro: 'gemini-2.5-pro'
  };
}
