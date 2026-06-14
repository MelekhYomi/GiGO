import { Router, Request, Response } from 'express';
import { db } from '../firebase-config';
import { getGeminiClient } from '../utils/gemini';
import { authenticateToken } from '../utils/auth';

const router = Router();

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

    console.log(`🎙️ Mock Interview Agent: Constructing customized question set for ${profile.fullName || userId}...`);
    console.log(`💼 Target Role: ${targetJobTitle} at ${targetCompany} (${targetJobStyle})`);

    // C. Invoke Gemini 2.5 Flash to synthesize tailored question sets
    const { ai, modelFlash } = getGeminiClient(profile.geminiApiKey);

    const prompt = `
You are the Lead Technical Recruiter and ATS Interview Design Agent at GiGO.
Your goal is to design exactly 5 high-fidelity, core interview questions tailored specifically to a candidate's background, their target role, and the unique constraints of the job style (Remote, Hybrid, or On-site, and sub-genres like NGO, corporate, or shift/part-time).

Candidate Profile Context:
- Full Name: ${profile.fullName || 'Candidate'}
- Target Role: ${profile.role || 'Professional'}
- Experience Level: ${profile.yearsOfExperience || 0} years
- Summary: ${profile.professionalSummary || 'No summary available'}
- Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || ''}

Target Job Details:
- Job Title: ${targetJobTitle}
- Company: ${targetCompany}
- Style: ${targetJobStyle} (e.g., Remote, Hybrid, Onsite, Part-Time, NGO, NGO Hybrid, Hotel Reception, etc.)
- Description/Requirements: ${targetDescription}

CRITICAL RULES FOR DESIGNING QUESTIONS:
1. Every question MUST be highly specific to this exact job title and company. Avoid generic boilerplates.
2. Incorporate the JOB STYLE and workplace expectations directly:
   - On-Site: Emphasize physical collaboration, face-to-face team synergy, site presence, daily routine, or in-person problem-solving.
   - Remote: Focus on extreme self-direction, remote tool stack proficiency (Slack, Linear, Zoom), async communication depth, and self-organization.
   - Hybrid: Address the coordination challenge of working across office days and home days, aligning scheduled tasks, and managing mixed-synergy schedules.
3. Group the 5 questions into distinct, standard professional categories:
   - "Technical Core Domain": Core technical or operational competence required for this specific role.
   - "Workplace Environment Adaptability": Specific scenarios addressing On-Site, Remote, or Hybrid workflow parameters.
   - "Behavioral & Communication": Aligning team dynamics, handling feedback, or stakeholder alignment.
   - "Scenario Problem Solving": A hypothetical high-fidelity challenge specific to this company and role.
   - "Growth & Industry Adaptability": Dynamic thinking, learning new tools, or keeping up with modern industry trends.
4. For EACH question, you MUST generate personalized, high-fidelity MVIP preparation guidance:
   - focusArea: A detailed explanation of what the interviewer is looking out for and expecting to hear in the response (e.g., "The interviewer is assessing whether you can proactively prevent scope creep...").
   - keyPoints: An array of 3 exact key points, benchmarks, or professional concepts the candidate should make sure to mention or reference in their answer.
   - communicationGuidance: Direct recommendations on the tone, language style, and communication approach to use (e.g., "Adopt an authoritative yet collaborative tone. Use words like 'milestones', 'alignment', and 'mitigate'").

Return the response as a JSON array of exactly 5 objects. Do NOT wrap in markdown formatting (like \`\`\`json). Return raw JSON only.
Format:
[
  {
    "id": 1,
    "category": "Technical Core Domain",
    "question": "Question text here...",
    "focusArea": "Detailed explanation of what interviewer expects...",
    "keyPoints": ["key point 1 to mention", "key point 2 to mention", "key point 3 to mention"],
    "communicationGuidance": "Tone and language guidelines..."
  },
  ...
]
`;

    const result = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt
    });
    const responseText = result.text?.trim() || '';

    // Strip markdown code block wrappers if Gemini accidentally included them
    let cleanJson = responseText;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    const questionSet = JSON.parse(cleanJson);

    // Save active interview questions list into database for tracking (optional)
    await userRef.update({
      activeInterviewQuestionSet: questionSet,
      activeInterviewJobContext: {
        jobTitle: targetJobTitle,
        company: targetCompany,
        jobStyle: targetJobStyle
      }
    });

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
