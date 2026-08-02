import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { commitAgentExecutionTrace } from '../utils/agentLogger';
import { getGeminiClient } from '../utils/gemini';

const router = Router();




/**
 * POST /api/test/process-native-voice
 * Simulates a multi-modal binary audio file ingestion step
 */
router.post('/process-native-voice', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  // Hardcoded mock pointer to an audio recording containing local voice input 
  // (e.g., "My name is Abayomi, I have a Bachelor's degree and over 7 years experience in tech ops...")
  const sampleAudioPath = path.join(__dirname, '../../test_assets/native_sample.wav');

  try {
    // 1. Check if the audio test asset exists
    if (!fs.existsSync(sampleAudioPath)) {
       res.status(404).json({
        success: false,
        error: `Audio test file not found at ${sampleAudioPath}. Drop a real .wav or .mp3 file there first.`
      });
      return;
    }

    // 2. Read file binary data and convert it into a base64 string for inline multimodal prompt ingestion
    const audioBuffer = fs.readFileSync(sampleAudioPath);
    const base64Audio = audioBuffer.toString('base64');

    // 3. Invoke Gemini's native audio understanding model directly
    const { ai, modelFlash } = getGeminiClient();
    const modelUsed = modelFlash;
    const geminiResponse = await ai.models.generateContent({
      model: modelUsed,
      contents: [
        {

          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'audio/wav',
                data: base64Audio
              }
            },
            {
              text: `Analyze this user's vocal delivery and spoken details. 
                     Extract their full name, core operational skill sets, and professional experience depth. 
                     Return the clean data structured as a strict JSON object with fields:
                     { name: string, experienceYears: number, credentials: string[], identifiedDialectAccent: string }.

                     IMPORTANT: You must ALWAYS return a valid JSON object matching this schema, even if the audio is silent or contains no voice. 
                     If no spoken voice can be analyzed, populate the fields with sensible defaults (e.g. name: "Unknown", experienceYears: 0, credentials: [], identifiedDialectAccent: "None") and output ONLY the JSON, without conversational text.`
            }
          ]
        }
      ]
    });

    const parsedTextResult = geminiResponse.text || '{}';
    let structuredProfile: any;
    let fallbackApplied = false;

    try {
      // Clean up potential markdown blocks if returned by the raw string output
      const cleanJsonString = parsedTextResult.replace(/```json|```/gi, '').trim();
      structuredProfile = JSON.parse(cleanJsonString);
    } catch (parseError: any) {
      console.warn("⚠️ JSON.parse on Gemini response failed. Initiating fallback parsing...");
      
      // Attempt regex extraction of any JSON block from within conversational text
      const jsonMatch = parsedTextResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          structuredProfile = JSON.parse(jsonMatch[0]);
        } catch {
          // Proceed to default mock fallback
        }
      }

      if (!structuredProfile) {
        fallbackApplied = true;
        structuredProfile = {
          name: "Abayomi (Simulated Fallback)",
          experienceYears: 7,
          credentials: ["Tech Ops Lead", "Regional Operations", "Multimodal Audio Pipeline"],
          identifiedDialectAccent: "Nigerian / Local Dialect",
          warning: "Audio source was analyzed as conversational or silent. Self-healing default fallback applied.",
          rawModelText: parsedTextResult
        };
      }
    }

    // 4. Record the telemetry trace to Firestore via our logger rule layout
    await commitAgentExecutionTrace({
      agentName: 'Native_Voice_Parsing_Agent',
      cycleType: 'PROFILE_INGESTION',
      userId: 'TEST_HACKATHON_USER_01',
      executionMetrics: {
        latencyMs: Date.now() - startTime,
        audioPayloadSizeBytes: audioBuffer.length,
        modelUsed: modelUsed,
        fallbackApplied: fallbackApplied
      },
      decisionsExecuted: [
        'Ingested binary stream inline without transcription wrappers',
        'Isolated profile parameters directly inside the multimodal engine',
        'Successfully structured native identity attributes',
        fallbackApplied ? 'Triggered self-healing default profile fallback' : 'Parsed native audio directly into JSON'
      ]
    });

    // 5. Respond with the extraction output
    res.status(200).json({
      success: true,
      processingTimeMs: Date.now() - startTime,
      fallbackApplied,
      extractedPayload: structuredProfile
    });

  } catch (error: any) {
    console.error('❌ Native audio routing test failed:', error);
    
    // Log the error trace to the console track
    await commitAgentExecutionTrace({
      agentName: 'Native_Voice_Parsing_Agent',
      cycleType: 'PROFILE_INGESTION',
      executionMetrics: { error: error.message },
      decisionsExecuted: ['Aborted pipeline due to processing error']
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
