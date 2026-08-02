import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

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
      modelFlash: 'gemini-flash-latest',
      modelPro: 'gemini-2.5-pro'
    };
  }

  // Try to load from local .env if process.env is empty
  let envKey = process.env.GEMINI_API_KEY;
  if (!envKey || envKey.trim() === '') {
    try {
      const envPath = path.resolve(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/^GEMINI_API_KEY\s*=\s*(.*)$/m);
        if (match && match[1]) {
          envKey = match[1].trim().replace(/^['"]|['"]$/g, ''); // strip optional quotes
          console.log('Successfully loaded GEMINI_API_KEY from backend local .env file.');
        }
      }
    } catch (err) {
      console.warn('Failed to parse local .env file:', err);
    }
  }

  // 2. If global process.env.GEMINI_API_KEY or our parsed envKey is available and is NOT the depleted system default key
  if (envKey && envKey.trim() !== '' && envKey !== 'AIzaSyDb0H-lJapcJrHTOkddZNJaohxbnOvOzZ0') {
    console.log('Utilizing system environment Gemini API key for AI Studio...');
    return {
      ai: new GoogleGenAI({ apiKey: envKey }),
      modelFlash: 'gemini-flash-latest',
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
    modelFlash: 'gemini-flash-latest',
    modelPro: 'gemini-2.5-pro'
  };
}
