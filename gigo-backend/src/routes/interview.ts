import { Router, Request, Response } from 'express';
import { db } from '../firebase-config';
import { getGeminiClient } from '../utils/gemini';
import { authenticateToken } from '../utils/auth';
import { Type } from '@google/genai';

const router = Router();

// =========================================================================
// 1. GENERATE CUSTOMIZED INTERVIEW QUESTIONS BASED ON JOB & STYLE
// =========================================================================
/**
 * Helper function to scrape real-world interview questions from LeetCode, Glassdoor, etc.,
 * and prepare custom prep guidance for a candidate.
 */
export async function scrapeAndPrepareInterviewQuestions(
  userId: string,
  jobTitle: string,
  company: string,
  description: string,
  jobStyle: string
): Promise<any> {
  // A. Fetch candidate profile
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new Error("Candidate profile not found.");
  }
  const profile = userDoc.data() || {};

  // B. Get Gemini client
  const { ai, modelFlash } = getGeminiClient(profile.geminiApiKey);

  console.log(`🎙️ Mock Interview Agent: Scraping custom interview questions for ${profile.fullName || userId}...`);
  console.log(`💼 Target Role: ${jobTitle} at ${company} (${jobStyle})`);

  const prompt = `
You are the Lead Recruitment Intelligence Scraper and ATS Interview Design Agent at GiGO.
Your user is preparing for a highly targeted interview for the following role:
- Target Role: ${jobTitle}
- Company: ${company}
- Job Style/Arrangement: ${jobStyle}
- Job Details: ${description}

CRITICAL REQUIREMENT:
You must perform a real-time internet search to scrape and look up actual, active, or popular interview questions, technical assessments, behavioral questions, or coding challenges on the web that are specific to this exact job title and company (from sites like Glassdoor, LeetCode, GitHub, LinkedIn, company careers pages, or technical blogs).

Using the live search grounding results, synthesize a highly specific, high-fidelity set of EXACTLY 5 interview questions.
Ensure that:
1. Every question is highly relevant to this exact job title and company, grounded in real questions found on the web.
2. Incorporate the JOB STYLE and workplace expectations directly:
   - On-Site: Emphasize physical collaboration, face-to-face team synergy, site presence, daily routine, or in-person problem-solving.
   - Remote: Focus on extreme self-direction, remote tool stack proficiency (Slack, Linear, Zoom), async communication depth, and self-organization.
   - Hybrid: Address the coordination challenge of working across office days and home days, aligning scheduled tasks, and managing mixed-synergy schedules.
3. Group the 5 questions into distinct, standard professional categories:
   - "Domain Competency": Core technical or operational competence required for this specific role.
   - "Workplace Adaptability (On-Site/Remote/Hybrid specific)": Specific scenarios addressing On-Site, Remote, or Hybrid workflow parameters.
   - "Behavioral/Culture Fit": Aligning team dynamics, handling feedback, or stakeholder alignment.
   - "Problem Solving": A hypothetical high-fidelity challenge specific to this company and role.
   - "Modern Industry Adaptation": Dynamic thinking, learning new tools, or keeping up with modern industry trends.
4. For EACH question, you MUST generate personalized, high-fidelity MVIP preparation guidance:
   - focusArea: A detailed explanation of what the interviewer is looking out for and expecting to hear in the response (e.g., "The interviewer is assessing whether you can proactively prevent scope creep...").
   - keyPoints: An array of exactly 3 exact key points, benchmarks, or professional concepts the candidate should make sure to mention or reference in their answer.
   - communicationGuidance: Direct recommendations on the tone, language style, and communication approach to use (e.g., "Adopt an authoritative yet collaborative tone. Use words like 'milestones', 'alignment', and 'mitigate'").
`;

  const result = await ai.models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        description: "List of exactly 5 customized interview questions sourced in real time",
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

  const responseText = result.text?.trim() || '';

  let cleanJson = responseText;
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }

  const questionSet = JSON.parse(cleanJson);

  // Save active interview questions list into database for tracking
  await userRef.update({
    activeInterviewQuestionSet: questionSet,
    activeInterviewJobContext: {
      jobTitle: jobTitle,
      company: company,
      jobStyle: jobStyle
    }
  });

  // Log to agent execution logs for telemetry/audit
  await db.collection('agent_execution_logs').add({
    timestamp: new Date().toISOString(),
    agentName: "InterviewPrepAgent",
    userId: userId,
    cycleType: "INTERVIEW_PREP_SCRAPING",
    executionMetrics: {
      jobTitle,
      company,
      jobStyle,
      status: "SUCCESS"
    },
    businessDecisionsExecuted: [
      `Scraped and prepared 5 custom questions for ${jobTitle} at ${company} with ${jobStyle} arrangements.`
    ]
  });

  return questionSet;
}

// =========================================================================
// 1. GENERATE CUSTOMIZED INTERVIEW QUESTIONS BASED ON JOB & STYLE
// =========================================================================
router.post('/interview/generate-questions', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.body.userId;
  const { jobId, customJob } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ error: "Missing required parameter: userId" });
    }

    // A. Fetch candidate profile
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Candidate profile not found." });
    }
    const profile = userDoc.data() || {};

    // B. Identify active target Job & Style details
    let targetJobTitle = customJob?.jobTitle || profile.role || 'General Professional';
    let targetCompany = customJob?.company || 'Target Organization';
    let targetDescription = customJob?.description || 'Standard professional requirements';
    let targetJobStyle = customJob?.jobStyle || 'Remote'; // default style

    if (jobId) {
      const jobDoc = await db.collection('discovered_jobs').doc(jobId).get();
      if (jobDoc.exists) {
        const jobData = jobDoc.data() || {};
        targetJobTitle = jobData.jobTitle || jobData.title || targetJobTitle;
        targetCompany = jobData.companyName || jobData.company || targetCompany;
        targetDescription = jobData.jobDescription || jobData.description || jobData.snippet || targetDescription;
        targetJobStyle = jobData.workType || jobData.locationType || jobData.jobStyle || targetJobStyle;
      }
    }

    console.log(`🎙️ Mock Interview Agent: Delegating interview prep generation to helper...`);
    const questionSet = await scrapeAndPrepareInterviewQuestions(
      userId,
      targetJobTitle,
      targetCompany,
      targetDescription,
      targetJobStyle
    );

    return res.json({
      status: "ok",
      jobContext: {
        jobTitle: targetJobTitle,
        company: targetCompany,
        jobStyle: targetJobStyle
      },
      questions: questionSet
    });

  } catch (err: any) {
    console.error("Error generating customized interview questions:", err);
    return res.status(500).json({
      error: "Failed to generate customized interview questions.",
      details: err.message
    });
  }
});
// =========================================================================
// 2. ANALYZE CANDIDATE'S VERBAL RESPONSE AGAINST SELECTED QUESTION
// =========================================================================
router.post('/interview/analyze-response', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.body.userId;
  const { question, answer } = req.body;

  try {
    if (!userId || !question || !answer) {
      return res.status(400).json({ error: "Missing required parameters: userId, question, and answer." });
    }

    // A. Fetch candidate profile
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Candidate profile not found." });
    }
    const profile = userDoc.data() || {};
    const jobContext = profile.activeInterviewJobContext || {};

    console.log(`🎙️ Mock Interview Agent: Evaluating response transcript for ${profile.fullName || userId}...`);

    // B. Invoke Gemini 2.5 Pro to conduct a rigorous, professional evaluation
    const { ai, modelPro } = getGeminiClient(profile.geminiApiKey);

    const prompt = `
You are the Senior Executive Interview Examiner at GiGO, evaluating candidate answers against world-class ATS standards.
Analyze the candidate's answer to the interview question below, taking into account their profile and the target job context.

Candidate context:
- Target Role: ${jobContext.jobTitle || profile.role || 'Professional'}
- Company context: ${jobContext.company || 'Target Organization'}
- Job Style context: ${jobContext.jobStyle || 'Remote'}

Interview Question:
"${question}"

Candidate's Answer Response Transcript:
"${answer}"

YOUR TASKS:
1. Score the response from 0 to 100 on three metrics:
   - "depth": Technical mastery and depth of content.
   - "vocal": Vocal formatting, logical narrative flow, vocabulary level, and professional confidence.
   - "ats": Keyword resonance and relevance alignment to standard recruiters.
2. Match and extract a list of professional keywords/phrases they used in their answer.
3. Provide exactly 3 detailed, constructive feedback points (bullet items focusing on strengths, missing details, or tone recommendations).
4. Compose an elite-level, flawless **"Master Class Model Answer"** showing how a top-tier industry expert would answer this exact question for this job style. Keep it structured (e.g., using the STAR method if behavioral).

Return the response as a raw, single-line JSON string without markdown blocks or wrapper elements.
Format:
{
  "depth": 85,
  "vocal": 90,
  "ats": 80,
  "matchedKeywords": ["keyword1", "keyword2"],
  "feedbackPoints": [
    "Feedback point 1 detailing a clear strength...",
    "Feedback point 2 detailing what was missing...",
    "Feedback point 3 with actionable tone advice..."
  ],
  "modelAnswer": "STAR structured perfect model response text..."
}
`;

    const result = await ai.models.generateContent({
      model: modelPro,
      contents: prompt
    });
    const responseText = result.text?.trim() || '';

    let cleanJson = responseText;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    const evaluation = JSON.parse(cleanJson);

    // Save evaluation to logs
    await db.collection('agent_execution_logs').add({
      userId,
      type: "interview_evaluation",
      jobTitle: jobContext.jobTitle || "",
      jobStyle: jobContext.jobStyle || "",
      question,
      timestamp: new Date().toISOString(),
      scorecard: {
        depth: evaluation.depth,
        vocal: evaluation.vocal,
        ats: evaluation.ats
      }
    });

    return res.json({
      status: "ok",
      scorecard: evaluation
    });

  } catch (err: any) {
    console.error("Error analyzing interview response:", err);
    return res.status(500).json({
      error: "Failed to analyze interview response.",
      details: err.message
    });
  }
});

export default router;
