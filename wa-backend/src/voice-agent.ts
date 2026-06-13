import { GoogleGenAI, Type } from '@google/genai';
import * as fs from 'fs';
import { db } from './firebase-config';
import { getGeminiClient } from './utils/gemini';


/**
 * Interface representing our structured user profile
 */
interface JobSeekerProfile {
  fullName: string;
  professionalSummary: string;
  targetRoles: string[];
  skills: string[];
  yearsOfExperience: number;
  infrastructureStatus: {
    powerSetupDescription: string;
    internetSetupDescription: string;
    hasRemoteBackupPlan: boolean;
  };
  inferredLocationHints?: string;
  vocalCommand?: string;
}

/**
 * Processes raw user onboarding audio and extracts a structured job seeker profile
 * @param userId ID of the user being onboarded
 * @param audioFilePath Path to the local audio recording file
 * @param originalMimeType Mime type of the audio file (e.g., 'audio/mp3', 'audio/wav', 'audio/webm')
 * @param durationSeconds Estimated duration of the audio in seconds
 */
export async function processVoiceOnboarding(
  userId: string,
  audioFilePath: string,
  originalMimeType: string,
  durationSeconds?: number
): Promise<JobSeekerProfile | null> {
  const startTime = Date.now();
  let audioSizeBytes = 0;
  try {
    if (fs.existsSync(audioFilePath)) {
      audioSizeBytes = fs.statSync(audioFilePath).size;
    }
  } catch (err) {
    console.warn("Failed to get audio file size:", err);
  }

  let modelPro = 'gemini-2.5-pro';
  try {
    // 1. Fetch user credentials dynamically from Firestore to prevent global environment locks
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const client = getGeminiClient(userData?.geminiApiKey);
    const ai = client.ai;
    modelPro = client.modelPro;

    // Read the raw audio file into a buffer and convert to base64 for inline transmission
    const audioBuffer = fs.readFileSync(audioFilePath);
    const base64Audio = audioBuffer.toString('base64');

    console.log(`Sending raw audio natively to ${modelPro} for user ${userId}...`);

    // 2. Call the Gemini API using the official Google Gen AI SDK
    const response = await ai.models.generateContent({
      model: modelPro,
      contents: [
        {
          inlineData: {
            mimeType: originalMimeType,
            data: base64Audio
          }
        },
        {
          text: `You are the core operational onboarding agent for WA (Workforce Anywhere). 
          Listen carefully to this user's voice recording where they describe their background, professional history, target roles, skills, and regional infrastructure.
          
          Extract their professional profile and structure it exactly matching the schema. 
          Analyze their power and internet setup descriptions (e.g. solar, inverter, generator, fiber, Starlink) and set hasRemoteBackupPlan to true if they have a reliable backup setup to handle electricity/internet outages during remote work shifts.`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING, description: "Full name of the candidate. If the candidate does not explicitly state their name in the audio recording, return an empty string (\"\"). Do not use placeholders like [   ]." },
            professionalSummary: { type: Type.STRING, description: "A high-impact summary of their background and value proposition." },
            targetRoles: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Target job titles they are suited for."
            },
            skills: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Technical or soft skills extracted or logically inferred from their spoken experience."
            },
            yearsOfExperience: { 
              type: Type.INTEGER, 
              description: "Total years of professional experience mentioned or estimated based on timeline." 
            },
            infrastructureStatus: {
              type: Type.OBJECT,
              properties: {
                powerSetupDescription: { 
                  type: Type.STRING, 
                  description: "Details about their electricity or power situation and backup plans (e.g., Solar, Generator, Inverter)." 
                },
                internetSetupDescription: { 
                  type: Type.STRING, 
                  description: "Details about their internet or connectivity solutions (e.g., Fiber, Starlink, 4G LTE router)." 
                },
                hasRemoteBackupPlan: { 
                  type: Type.BOOLEAN, 
                  description: "True if they actively express a clear mitigation strategy for handling power/internet outages during remote work shifts." 
                }
              },
              required: ['powerSetupDescription', 'internetSetupDescription', 'hasRemoteBackupPlan']
            },
            inferredLocationHints: { 
              type: Type.STRING, 
              description: "Any geographical clues or locations mentioned (e.g., Lagos, Nigeria)." 
            },
            vocalCommand: {
              type: Type.STRING,
              description: "Detect if the user spoke any of the following specific commands in their recording: 'clear skills', 'clear experience', 'toggle settings', 'clear logs', 'toggle theme' or 'toggle dark mode'. If they did, return the exact matched command (e.g. 'clear skills'). Otherwise, return an empty string (\"\")."
            }
          },
          required: ['fullName', 'professionalSummary', 'targetRoles', 'skills', 'yearsOfExperience', 'infrastructureStatus']
        }
      }
    });

    // 3. Parse and return the structured object returned from the model
    if (response.text) {
      const parsedProfile: JobSeekerProfile = JSON.parse(response.text);

      console.log(`Successfully parsed structured profile for user ${userId}:`, parsedProfile);

      // Keep existing name if it exists and is not empty, and prevent resetting it to blank if parsed is empty
      const existingName = userData?.fullName;
      const finalName = (existingName && existingName !== 'Alex Carter' && existingName !== '[   ]') ? existingName : (parsedProfile.fullName || existingName || '');

      // 4. Save profile details directly to the Firestore user document
      await db.collection('users').doc(userId).set({
        fullName: finalName,
        professionalSummary: parsedProfile.professionalSummary,
        targetRoles: parsedProfile.targetRoles,
        skills: parsedProfile.skills,
        yearsOfExperience: parsedProfile.yearsOfExperience,
        infrastructureStatus: parsedProfile.infrastructureStatus,
        inferredLocationHints: parsedProfile.inferredLocationHints || "",
        hasVoiceOnboarded: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 5. Store the required XPRIZE execution log with real-time telemetry metrics
      const latencyMs = Date.now() - startTime;
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: "Native_Voice_Parsing_Agent",
        cycleType: "PROFILE_INGESTION",
        userId: userId,
        inputMeta: {
          fileType: originalMimeType,
          durationSeconds: durationSeconds || 45
        },
        executionMetrics: {
          latencyMs,
          audioPayloadSizeBytes: audioSizeBytes,
          modelUsed: modelPro,
          status: "SUCCESS"
        },
        businessDecisionsExecuted: [
          "Analyzed raw audio payload natively without intermediate transcription provider.",
          "Mapped regional infrastructure status variables to determine baseline workplace validation.",
          "Generated standardized JSON payload and committed record to candidate database schema."
        ]
      });

      return parsedProfile;
    }
    
    return null;

  } catch (error) {
    console.error('Error running Voice-to-Profile Agent execution:', error);
    
    // Log failure log to Firestore
    try {
      const latencyMs = Date.now() - startTime;
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: "Native_Voice_Parsing_Agent",
        cycleType: "PROFILE_INGESTION",
        userId: userId,
        inputMeta: {
          fileType: originalMimeType,
          durationSeconds: durationSeconds || 45
        },
        executionMetrics: {
          latencyMs,
          audioPayloadSizeBytes: audioSizeBytes,
          modelUsed: modelPro,
          status: "FAILED"
        },
        businessDecisionsExecuted: [
          `Encountered processing hurdle: ${error instanceof Error ? error.message : String(error)}`
        ]
      });
    } catch (logErr) {
      console.error('Failed to write failure log to Firestore:', logErr);
    }

    throw error;
  }
}
