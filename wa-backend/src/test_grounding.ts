import { GoogleGenAI, Type } from '@google/genai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "None");

  const ai = new GoogleGenAI({ apiKey });
  const modelFlash = 'gemini-2.5-flash';

  const prompt = `
You are the Lead Recruitment Intelligence Scraper and ATS Interview Design Agent at GiGO.
Your user is preparing for a highly targeted interview for the following role:
- Target Role: LLM Fine-Tuning Specialist
- Company: Anthropic
- Job Style/Arrangement: Remote
- Job Details: Custom target role

You must perform a real-time internet search to scrape and look up actual, active, or popular interview questions on the web that are specific to this exact job title and company.
Synthesize a highly specific, high-fidelity set of EXACTLY 2 interview questions in JSON array format.
`;

  try {
    console.log("Calling generateContent with googleSearch tool and schema...");
    const result = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: "List of exactly 2 customized interview questions",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              category: { type: Type.STRING },
              question: { type: Type.STRING },
              focusArea: { type: Type.STRING },
              keyPoints: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              communicationGuidance: { type: Type.STRING }
            },
            required: ['id', 'category', 'question', 'focusArea', 'keyPoints', 'communicationGuidance']
          }
        }
      }
    });

    console.log("SUCCESS! Result text:");
    console.log(result.text);
  } catch (err: any) {
    console.error("FAILED! Error details:");
    if (err instanceof Error) {
      console.error("Error Message:", err.message);
      console.error("Error Stack:", err.stack);
    } else {
      console.error("Raw Error:", err);
      try {
        console.error("JSON Error:", JSON.stringify(err, null, 2));
      } catch (jsonErr) {
        console.error("Could not stringify error:", jsonErr);
      }
    }
  }
}

test();
