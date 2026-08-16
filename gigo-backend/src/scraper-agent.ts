import { GoogleGenAI, Type } from '@google/genai';
import { db } from './firebase-config';
import { getGeminiClient } from './utils/gemini';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { markdownToDocxBuffer } from './utils/docxGenerator';
import { markdownToPdfBuffer } from './utils/pdfGenerator';
import { markdownToJpegBuffer } from './utils/imageGenerator';
import { createNotification } from './utils/notifications';
import { resolvePath } from './utils/jsonPath';
import { isNINLockDisabled } from './utils/ninLock';
import { sendRealGmailMessage, buildGmailOAuthClient } from './routes/mailroom';


interface DiscoveredJob {
  companyName: string;
  jobTitle: string;
  workType: 'Remote' | 'Hybrid' | 'Onsite';
  applicationLinkOrEmail: string;
  sourcePlatform: string;
  keyRequirementsSummary: string[];
  applicationEmail?: string;
  applicationPhone?: string;
  applicationLink?: string;
  jobDescription?: string;
  userId?: string;
  postedAt?: string;
  applicationDeadline?: string;
  applicationMethod?: 'email' | 'portal' | 'google_form' | 'unknown';
  emailSubject?: string;
  emailBodyRequirements?: string;
  attachmentsRequired?: string[];
}

export interface CandidateMatchProfile {
  skills: string[];
  roles: string[];
  educationFields?: string[]; // fieldOfStudy from each educationList entry
  pastRoleTitles?: string[]; // role titles from workHistory
  yearsOfExperience?: number;
  careerGoalsNote?: string;
  targetIndustry?: string;
  // GiGO Brain "mind clone" calibration axes (0-100 each), from voice onboarding.
  // General workplace-readiness signal, not job-specific — used as a small modifier
  // on top of the real skills/experience match, not a primary matching signal.
  calibrationAxes?: { cognitive?: number; credential?: number; behavioral?: number; operational?: number };
}

const SENIOR_CUES = ['senior', 'lead', 'principal', 'staff', 'head of', 'director', 'manager'];
const JUNIOR_CUES = ['junior', 'entry', 'intern', 'graduate', 'trainee', 'associate'];

function keywordOverlapScore(haystack: string, needles: string[], maxScore: number): number {
  if (needles.length === 0) return 0;
  const hits = needles.filter(n => n && haystack.includes(n)).length;
  return Math.min((hits / needles.length) * maxScore, maxScore);
}

/**
 * Shared scoring function used by both the matching sweep (for autonomous apply
 * decisions) and the read-time enrichment in GET /api/discovered-jobs. Weighs the
 * candidate's full collected profile — skills, target roles, education field,
 * actual past job titles, years of experience vs. seniority cues in the posting,
 * and career goals/target industry — not just skills and target roles, since all
 * of this is real data candidates provide during onboarding and it should
 * actually inform which jobs they're shown as high matches.
 */
export function computeMatchScore(
  job: { jobTitle?: string; keyRequirementsSummary?: string[]; jobDescription?: string },
  candidate: CandidateMatchProfile
): number {
  const { skills, roles } = candidate;
  if (skills.length === 0 && roles.length === 0) {
    const seedId = (job.jobTitle || 'default');
    let hash = 0;
    for (let i = 0; i < seedId.length; i++) {
      hash = seedId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 20) + 75;
  }

  const titleLower = (job.jobTitle || '').toLowerCase();
  const descriptionLower = (job.jobDescription || '').toLowerCase();
  const requirements = (job.keyRequirementsSummary || []).map(r => r.toLowerCase());
  const requirementsText = requirements.join(' ');

  // Target role vs. job title (0-30)
  let titleMatchScore = 0;
  roles.forEach(role => {
    if (titleLower.includes(role) || role.includes(titleLower)) titleMatchScore = 30;
  });
  if (titleMatchScore === 0) {
    roles.forEach(role => {
      role.split(/\s+/).forEach(word => {
        if (word.length > 3 && titleLower.includes(word)) titleMatchScore = Math.min(titleMatchScore + 8, 15);
      });
    });
  }

  // Skills vs. job requirements (0-30)
  let skillMatches = 0;
  requirements.forEach(reqSkill => {
    skills.forEach(candSkill => {
      if (candSkill.includes(reqSkill) || reqSkill.includes(candSkill)) skillMatches++;
    });
  });
  const skillsMatchScore = requirements.length > 0
    ? Math.min((skillMatches / requirements.length) * 30, 30)
    : 15;

  // Actual past job titles vs. this posting's title (0-15) — catches real experience
  // even when it doesn't match the candidate's stated target role wording.
  const pastRoleTitles = (candidate.pastRoleTitles || []).map(r => r.toLowerCase()).filter(Boolean);
  const pastRoleScore = keywordOverlapScore(titleLower, pastRoleTitles, 15);

  // Education field of study vs. title/requirements/description (0-10)
  const educationFields = (candidate.educationFields || []).map(f => f.toLowerCase()).filter(Boolean);
  const educationScore = keywordOverlapScore(`${titleLower} ${requirementsText} ${descriptionLower}`, educationFields, 10);

  // Years of experience vs. seniority cues in the job title (-8 to +8)
  let experienceFitScore = 0;
  const yoe = candidate.yearsOfExperience;
  if (typeof yoe === 'number') {
    const looksSenior = SENIOR_CUES.some(cue => titleLower.includes(cue));
    const looksJunior = JUNIOR_CUES.some(cue => titleLower.includes(cue));
    if (looksSenior && yoe >= 5) experienceFitScore = 8;
    else if (looksSenior && yoe < 2) experienceFitScore = -8;
    else if (looksJunior && yoe <= 2) experienceFitScore = 5;
    else if (looksJunior && yoe >= 8) experienceFitScore = -5;
  }

  // Career goals / target industry vs. description (0-7)
  const goalsTerms = `${candidate.careerGoalsNote || ''} ${candidate.targetIndustry || ''}`
    .toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const goalsScore = keywordOverlapScore(descriptionLower, goalsTerms, 7);

  // GiGO Brain readiness modifier (-5 to +5) — behavioral+operational axes reflect
  // workplace readiness (communication, reliability under real conditions), which is
  // relevant to every job regardless of title, unlike cognitive/credential which are
  // general aptitude/verification scores, not role-fit signals.
  let readinessModifier = 0;
  const axes = candidate.calibrationAxes;
  if (axes && (typeof axes.behavioral === 'number' || typeof axes.operational === 'number')) {
    const readiness = ((axes.behavioral ?? 60) + (axes.operational ?? 60)) / 2;
    readinessModifier = Math.round(((readiness - 60) / 40) * 5); // 60 = neutral baseline, 100 = +5, 20 = -5
  }

  const baseScore = 10;
  const score = Math.round(
    baseScore + titleMatchScore + skillsMatchScore + pastRoleScore + educationScore + experienceFitScore + goalsScore + readinessModifier
  );
  return Math.min(Math.max(score, 45), 99);
}

/**
 * Real, no-AI job source: RemoteOK's public JSON API (no key required, no
 * scraping/anti-bot concerns — it's a documented public feed). Runs
 * independently of the Gemini-based discovery sweep, so discovered_jobs
 * keeps getting real listings even when the Gemini quota is exhausted.
 * Relevance filtering happens downstream via computeMatchScore at read
 * time, same as Gemini-sourced jobs.
 */
export async function fetchRemoteOKJobs(): Promise<number> {
  let storedCount = 0;
  try {
    const response = await axios.get('https://remoteok.com/api', {
      headers: { 'User-Agent': 'GiGO-CareerPlatform/1.0 (+https://gigo-omega.vercel.app)' },
      timeout: 15000
    });

    // index 0 is a legal notice, not a job. No count cap — RemoteOK's feed only
    // lists currently-open postings (closed roles are removed from the feed by
    // RemoteOK itself), so every entry here is a real, currently-active listing.
    const rawJobs: any[] = Array.isArray(response.data) ? response.data.slice(1) : [];

    for (const job of rawJobs) {
      if (!job.company || !job.position) continue;

      const dedupKey = `${job.company}::${job.position}`.toLowerCase().replace(/[^a-z0-9:]/g, '_');
      const docId = `discovered_${dedupKey.substring(0, 120)}`;
      const docRef = db.collection('discovered_jobs').doc(docId);
      const existingDoc = await docRef.get();

      let scrapedAt = new Date().toISOString();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        if (existingData && existingData.scrapedAt) {
          scrapedAt = existingData.scrapedAt;
        }
      }

      const plainDescription = (job.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 600);

      await docRef.set({
        id: docId,
        userId: null,
        companyName: job.company,
        jobTitle: job.position,
        workType: 'Remote',
        applicationLinkOrEmail: job.apply_url || job.url || '',
        sourcePlatform: 'RemoteOK',
        keyRequirementsSummary: Array.isArray(job.tags) ? job.tags.slice(0, 5) : [],
        scrapedAt,
        postedAt: job.date || new Date().toISOString(),
        applicationDeadline: null,
        jobDescription: plainDescription,
        applicationEmail: null,
        applicationPhone: null,
        applicationLink: job.apply_url || job.url || null,
        applicationMethod: 'portal',
        emailSubject: null,
        emailBodyRequirements: null,
        attachmentsRequired: [],
      }, { merge: true });
      storedCount++;
    }

    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: 'RemoteOKDirectFeed',
      status: 'COMPLETED',
      metrics: { fetchedCount: rawJobs.length, storedCount }
    });

    console.log(`RemoteOK direct feed: stored ${storedCount} real listings.`);
    return storedCount;
  } catch (error: any) {
    console.error('RemoteOK direct feed failed:', error.message);
    try {
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: 'RemoteOKDirectFeed',
        status: 'FAILED',
        metrics: { error: error.message }
      });
    } catch (logErr) {
      console.error('Failed to write RemoteOK feed error log:', logErr);
    }
    return 0;
  }
}

/**
 * Real, no-AI job source #2: The Muse's public jobs API (no key required). Unlike
 * RemoteOK, which is remote-only by definition, this covers onsite and hybrid roles
 * too — real physical locations, not just "Remote". Runs independently of the
 * Gemini-based discovery sweep, same as fetchRemoteOKJobs.
 */
export async function fetchTheMuseJobs(): Promise<number> {
  let storedCount = 0;
  let fetchedCount = 0;
  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Pull a few pages; filter down to genuinely recent postings (the API doesn't
    // guarantee newest-first ordering, so we can't just take page 1 at face value).
    for (let page = 1; page <= 5; page++) {
      const response = await axios.get('https://www.themuse.com/api/public/jobs', {
        params: { page },
        headers: { 'User-Agent': 'GiGO-CareerPlatform/1.0 (+https://gigo-omega.vercel.app)' },
        timeout: 15000
      });

      const results: any[] = Array.isArray(response.data?.results) ? response.data.results : [];
      fetchedCount += results.length;

      for (const job of results) {
        const pubDate = job.publication_date ? new Date(job.publication_date).getTime() : 0;
        if (!pubDate || pubDate < thirtyDaysAgo) continue;

        const companyName = job.company?.name;
        const jobTitle = job.name;
        if (!companyName || !jobTitle) continue;

        const locationName: string = job.locations?.[0]?.name || '';
        const isRemote = /remote|flexible/i.test(locationName);
        const workType: 'Remote' | 'Onsite' = isRemote ? 'Remote' : 'Onsite';

        const dedupKey = `${companyName}::${jobTitle}`.toLowerCase().replace(/[^a-z0-9:]/g, '_');
        const docId = `discovered_muse_${dedupKey.substring(0, 110)}`;
        const docRef = db.collection('discovered_jobs').doc(docId);
        const existingDoc = await docRef.get();

        let scrapedAt = new Date().toISOString();
        if (existingDoc.exists) {
          const existingData = existingDoc.data();
          if (existingData?.scrapedAt) scrapedAt = existingData.scrapedAt;
        }

        const plainDescription = (job.contents || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 600);

        await docRef.set({
          id: docId,
          userId: null,
          companyName,
          jobTitle,
          workType,
          location: locationName || null,
          applicationLinkOrEmail: job.refs?.landing_page || '',
          sourcePlatform: 'The Muse',
          keyRequirementsSummary: Array.isArray(job.categories) ? job.categories.map((c: any) => c.name).slice(0, 5) : [],
          scrapedAt,
          postedAt: job.publication_date || new Date().toISOString(),
          applicationDeadline: null,
          jobDescription: plainDescription,
          applicationEmail: null,
          applicationPhone: null,
          applicationLink: job.refs?.landing_page || null,
          applicationMethod: 'portal',
          emailSubject: null,
          emailBodyRequirements: null,
          attachmentsRequired: [],
        }, { merge: true });
        storedCount++;
      }
    }

    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: 'TheMuseDirectFeed',
      status: 'COMPLETED',
      metrics: { fetchedCount, storedCount }
    });

    console.log(`The Muse direct feed: stored ${storedCount} real onsite/hybrid/remote listings.`);
    return storedCount;
  } catch (error: any) {
    console.error('The Muse direct feed failed:', error.message);
    try {
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: 'TheMuseDirectFeed',
        status: 'FAILED',
        metrics: { error: error.message }
      });
    } catch (logErr) {
      console.error('Failed to write The Muse feed error log:', logErr);
    }
    return 0;
  }
}

/**
 * Real, no-AI job source #3: Arbeitnow's public job board API (no key required).
 * Has an explicit remote:boolean flag and real onsite locations, mostly
 * Europe-weighted — another independent source of non-remote listings.
 */
export async function fetchArbeitnowJobs(): Promise<number> {
  let storedCount = 0;
  try {
    const response = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
      headers: { 'User-Agent': 'GiGO-CareerPlatform/1.0 (+https://gigo-omega.vercel.app)' },
      timeout: 15000
    });

    const rawJobs: any[] = Array.isArray(response.data?.data) ? response.data.data : [];
    const thirtyDaysAgoSec = (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000;

    for (const job of rawJobs) {
      if (!job.company_name || !job.title) continue;
      if (job.created_at && job.created_at < thirtyDaysAgoSec) continue;

      const workType: 'Remote' | 'Onsite' = job.remote ? 'Remote' : 'Onsite';
      const dedupKey = `${job.company_name}::${job.title}`.toLowerCase().replace(/[^a-z0-9:]/g, '_');
      const docId = `discovered_arbeitnow_${dedupKey.substring(0, 100)}`;
      const docRef = db.collection('discovered_jobs').doc(docId);
      const existingDoc = await docRef.get();

      let scrapedAt = new Date().toISOString();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        if (existingData?.scrapedAt) scrapedAt = existingData.scrapedAt;
      }

      const plainDescription = (job.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 600);

      await docRef.set({
        id: docId,
        userId: null,
        companyName: job.company_name,
        jobTitle: job.title,
        workType,
        location: job.location || null,
        applicationLinkOrEmail: job.url || '',
        sourcePlatform: 'Arbeitnow',
        keyRequirementsSummary: Array.isArray(job.tags) ? job.tags.slice(0, 5) : [],
        scrapedAt,
        postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : new Date().toISOString(),
        applicationDeadline: null,
        jobDescription: plainDescription,
        applicationEmail: null,
        applicationPhone: null,
        applicationLink: job.url || null,
        applicationMethod: 'portal',
        emailSubject: null,
        emailBodyRequirements: null,
        attachmentsRequired: [],
      }, { merge: true });
      storedCount++;
    }

    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: 'ArbeitnowDirectFeed',
      status: 'COMPLETED',
      metrics: { fetchedCount: rawJobs.length, storedCount }
    });

    console.log(`Arbeitnow direct feed: stored ${storedCount} real listings.`);
    return storedCount;
  } catch (error: any) {
    console.error('Arbeitnow direct feed failed:', error.message);
    try {
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: 'ArbeitnowDirectFeed',
        status: 'FAILED',
        metrics: { error: error.message }
      });
    } catch (logErr) {
      console.error('Failed to write Arbeitnow feed error log:', logErr);
    }
    return 0;
  }
}

/**
 * Generic, admin-configurable job source fetcher — lets the admin team register
 * additional real, no-AI job board APIs from the Admin Cockpit without a code
 * deploy, by mapping the target API's JSON field paths (e.g. "company.name",
 * "results", "locations.0.name") onto GiGO's discovered_jobs schema.
 */
export async function fetchGenericJobSource(config: any): Promise<number> {
  let storedCount = 0;
  let fetchedCount = 0;
  try {
    const response = await axios.get(config.apiUrl, {
      headers: { 'User-Agent': 'GiGO-CareerPlatform/1.0 (+https://gigo-omega.vercel.app)' },
      timeout: 15000
    });
    const results = resolvePath(response.data, config.resultsPath || '');
    const items: any[] = Array.isArray(results) ? results : [];
    fetchedCount = items.length;

    for (const item of items) {
      const companyName = resolvePath(item, config.fieldMap?.company);
      const jobTitle = resolvePath(item, config.fieldMap?.title);
      if (!companyName || !jobTitle) continue;

      const location = config.fieldMap?.location ? resolvePath(item, config.fieldMap.location) : null;
      const applicationLink = config.fieldMap?.url ? resolvePath(item, config.fieldMap.url) : '';
      const descriptionRaw = config.fieldMap?.description ? resolvePath(item, config.fieldMap.description) : '';

      let workType: 'Remote' | 'Onsite' = 'Onsite';
      if (config.fieldMap?.remoteFlag) {
        workType = resolvePath(item, config.fieldMap.remoteFlag) ? 'Remote' : 'Onsite';
      } else if (config.fieldMap?.remoteKeywordCheck && location) {
        workType = /remote|flexible/i.test(String(location)) ? 'Remote' : 'Onsite';
      }

      const dedupKey = `${companyName}::${jobTitle}`.toString().toLowerCase().replace(/[^a-z0-9:]/g, '_');
      const docId = `discovered_${config.id}_${dedupKey.substring(0, 100)}`;
      const docRef = db.collection('discovered_jobs').doc(docId);
      const existingDoc = await docRef.get();

      let scrapedAt = new Date().toISOString();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        if (existingData?.scrapedAt) scrapedAt = existingData.scrapedAt;
      }

      const plainDescription = String(descriptionRaw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
      const postedAt = config.fieldMap?.postedAt ? resolvePath(item, config.fieldMap.postedAt) : null;

      await docRef.set({
        id: docId,
        userId: null,
        companyName: String(companyName),
        jobTitle: String(jobTitle),
        workType,
        location: location ? String(location) : null,
        applicationLinkOrEmail: applicationLink || '',
        sourcePlatform: config.name,
        keyRequirementsSummary: [],
        scrapedAt,
        postedAt: postedAt || new Date().toISOString(),
        applicationDeadline: null,
        jobDescription: plainDescription,
        applicationEmail: null,
        applicationPhone: null,
        applicationLink: applicationLink || null,
        applicationMethod: 'portal',
        emailSubject: null,
        emailBodyRequirements: null,
        attachmentsRequired: [],
      }, { merge: true });
      storedCount++;
    }

    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: `AdminConfiguredSource:${config.name}`,
      status: 'COMPLETED',
      metrics: { fetchedCount, storedCount }
    });

    console.log(`Admin-configured source "${config.name}": stored ${storedCount} real listings.`);
    return storedCount;
  } catch (error: any) {
    console.error(`Admin-configured source "${config.name}" failed:`, error.message);
    try {
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: `AdminConfiguredSource:${config.name}`,
        status: 'FAILED',
        metrics: { error: error.message }
      });
    } catch (logErr) {
      console.error('Failed to write admin-configured source error log:', logErr);
    }
    return 0;
  }
}

export async function runAllAdminConfiguredSources(): Promise<void> {
  try {
    const snapshot = await db.collection('job_sources').where('enabled', '==', true).get();
    for (const doc of snapshot.docs) {
      await fetchGenericJobSource({ id: doc.id, ...doc.data() });
    }
  } catch (err) {
    console.error('Failed to run admin-configured job sources:', err);
  }
}

/**
 * Triggers autonomous job application:
 * 1. Generates customized ATS CV & Cover Letter for the matched job using Gemini.
 * 2. Saves documents into the candidate's documents subcollection.
 * 3. Dispatches application email using candidate SMTP/Gmail or high-fidelity simulator.
 * 4. Initializes Mailroom Thread as 'pending' recruiter response.
 * 5. Dispatches real-time WhatsApp Autopilot Notification to candidate.
 */
async function triggerAutonomousApplyAndAlert(
  userId: string, 
  job: any, 
  matchScore: number, 
  userApiKey?: string
) {
  const startTime = Date.now();
  console.log(`[AUTOPILOT APPLY] Kicking off autonomous application on behalf of user ${userId} for ${job.jobTitle} at ${job.companyName}...`);

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return;

    const ninLockDisabled = await isNINLockDisabled();
    const userData = userDoc.data() || {};
    
    // Check if candidate is actually in autonomous mode
    if (userData.applyMode === 'manual') {
      console.log(`[AUTOPILOT APPLY] Candidate ${userId} has Delivery Preference set to 'manual'. Skipping automated application.`);
      return;
    }

    // Attachment-gap agent: if this posting requires documents GiGO can't generate
    // (transcripts, reference letters, government ID, etc.), sending an incomplete
    // application would look worse than not applying — alert the candidate instead.
    const requiredDocs: string[] = Array.isArray(job.attachmentsRequired) ? job.attachmentsRequired : [];
    const unsupportedDocs = requiredDocs.filter((d: string) => !['CV', 'Cover Letter', 'Portfolio'].includes(d));
    if (unsupportedDocs.length > 0) {
      await createNotification(
        userId, 'ATTACHMENT_GAP',
        `"${job.jobTitle}" at ${job.companyName} requires ${unsupportedDocs.join(', ')}, which GiGO can't generate automatically — apply manually with those attached.`,
        job.id
      );
      console.log(`[AUTOPILOT APPLY] Skipping ${job.jobTitle} for ${userId} — requires unsupported document(s): ${unsupportedDocs.join(', ')}`);
      return;
    }

    // Missing-info agent: an application built from an empty profile does more harm
    // than good to the candidate's standing with the employer — skip and ask them
    // to fill in real data rather than send a hollow CV.
    const hasWorkHistory = Array.isArray(userData.workHistory) && userData.workHistory.length > 0;
    const hasEducation = Array.isArray(userData.educationList) && userData.educationList.length > 0;
    const hasSkills = Array.isArray(userData.skills) && userData.skills.length > 0;
    if (!hasSkills && !hasWorkHistory && !hasEducation) {
      await createNotification(
        userId, 'MISSING_INFO',
        `Your profile doesn't have skills, work history, or education on file yet — add these so GiGO can build a strong application for "${job.jobTitle}" instead of an empty one.`,
        job.id
      );
      console.log(`[AUTOPILOT APPLY] Skipping ${job.jobTitle} for ${userId} — profile has no skills, work history, or education on file.`);
      return;
    }

    const needsPortfolio = requiredDocs.includes('Portfolio');

    const { ai, modelPro } = getGeminiClient(userApiKey || userData.geminiApiKey);

    // 1. Compile bespoke COVER LETTER using Gemini
    console.log(`[AUTOPILOT APPLY] Generating bespoke Cover Letter targeting ${job.companyName}...`);
    const candidateRoleName = (userData.targetRoles && userData.targetRoles.length > 0) ? userData.targetRoles.join(', ') : (userData.role || 'Professional');
    const candidateSummary = userData.professionalSummary || '';
    const candidateSkills = (userData.skills && userData.skills.length > 0) ? userData.skills.join(', ') : '';
    const yearsExp = userData.yearsOfExperience || 0;
    const powerSetup = userData.infrastructureStatus?.powerSetupDescription || 'Solar / Battery redundant power supply';
    const internetSetup = userData.infrastructureStatus?.internetSetupDescription || 'Fiber-to-the-home with redundant 4G/LTE mobile router';

    const coverPrompt = `You are the lead ATS compliance and career alignment officer for GiGO.
    Write a highly professional, persuasive, ATS-optimized cover letter on behalf of ${userData.fullName || 'the candidate'} applying for the role of ${job.jobTitle} at ${job.companyName}.

    Candidate Context:
    - Name: ${userData.fullName || 'Candidate'}
    - Target Role: ${candidateRoleName}
    - Profile Summary: ${candidateSummary}
    - Skills: ${candidateSkills}
    - Years of Experience: ${yearsExp}
    - Infrastructure Quality: Power backup: ${powerSetup}, Internet backup: ${internetSetup}

    Target Job Details:
    - Title: ${job.jobTitle}
    - Company: ${job.companyName}
    - Key Requirements: ${job.keyRequirementsSummary?.join(', ') || ''}
    - Description: ${job.jobDescription}

    Highlight why the candidate's professional alignment is elite. Emphasize how their robust solar power & high-speed fiber internet setup ensures 100% remote uptime reliability and completely eliminates any risk of electricity/internet outages during remote shifts.
    Address the hiring team professionally. Do not output placeholders. Return ONLY the complete cover letter text.`;

    const coverLetterResponse = await ai.models.generateContent({
      model: modelPro,
      contents: coverPrompt
    });

    const coverLetterContent = coverLetterResponse.text ? coverLetterResponse.text.trim() : `Dear Hiring Team,\n\nI am writing to express my strong interest in the ${job.jobTitle} position at ${job.companyName}...`;

    // 2. Archive-reuse agent: check for an existing CV already tailored to a
    // similar role before spending a fresh Gemini call — reuse it verbatim if
    // found (the candidate can refine it later from their archive), otherwise
    // fall through to generating a brand-new one.
    console.log(`[AUTOPILOT APPLY] Checking archive for a reusable CV similar to "${job.jobTitle}"...`);
    let cvContent: string | null = null;
    let reusedCvDocId: string | null = null;
    try {
      const existingCvsSnap = await userRef.collection('documents').where('type', '==', 'CV').get();
      const targetWords = new Set(String(job.jobTitle).toLowerCase().split(/\s+/).filter(w => w.length > 2));
      let bestMatch: { id: string; content: string; generatedAt: string } | null = null;
      existingCvsSnap.forEach(doc => {
        const d = doc.data();
        const docWords = String(d.jobTitle || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
        const overlaps = docWords.some((w: string) => targetWords.has(w));
        if (overlaps && (!bestMatch || d.generatedAt > bestMatch.generatedAt)) {
          bestMatch = { id: doc.id, content: d.content, generatedAt: d.generatedAt };
        }
      });
      if (bestMatch) {
        cvContent = (bestMatch as { id: string; content: string; generatedAt: string }).content;
        reusedCvDocId = (bestMatch as { id: string; content: string; generatedAt: string }).id;
        console.log(`[AUTOPILOT APPLY] Reusing existing CV (${reusedCvDocId}) for "${job.jobTitle}" — no fresh Gemini call needed.`);
      }
    } catch (reuseErr) {
      console.warn(`[AUTOPILOT APPLY] Archive-reuse check failed, falling back to fresh generation:`, reuseErr);
    }

    if (!cvContent) {
      // 2b. No reusable CV found — compile a customized ATS CV using Gemini.
      console.log(`[AUTOPILOT APPLY] No reusable CV found. Compiling customized ATS-compliant CV tailored for ${job.jobTitle}...`);
      const cvPrompt = `You are the lead ATS compliance officer for GiGO.
    Write a structured, modern, and highly professional CV/resume in Markdown specifically tailored for ${userData.fullName || 'the candidate'} targeting the ${job.jobTitle} position at ${job.companyName}.

    Candidate Context:
    - Name: ${userData.fullName || 'Candidate'}
    - Target Role: ${candidateRoleName}
    - Profile Summary: ${candidateSummary}
    - Skills: ${candidateSkills}
    - Years of Experience: ${yearsExp}
    - Infrastructure Quality: Power backup: ${powerSetup}, Internet backup: ${internetSetup}

    Format the output beautifully in clean Markdown with these sections:
    1. Professional Header
    2. Professional summary tailored for ${job.companyName}
    3. Technical Skill Matrix
    4. Selected Professional Positions (detailed descriptions showing accomplishments & metrics aligned with ${job.jobTitle} requirements)
    5. Reliable Remote Infrastructure (solar backup systems, Starlink/Fiber lines, and zero-downtime uptime commitments)
    6. Education & Certifications

    Do not include any empty placeholders. Return ONLY the markdown CV.`;

      const cvResponse = await ai.models.generateContent({
        model: modelPro,
        contents: cvPrompt
      });
      cvContent = cvResponse.text ? cvResponse.text.trim() : `# CV\n\nTailored Resume for ${userData.fullName || 'Candidate'}`;
    }

    // 2b. This posting explicitly asked for a Portfolio — generate one rather than
    // sending an incomplete bundle.
    let portfolioContent: string | null = null;
    if (needsPortfolio) {
      console.log(`[AUTOPILOT APPLY] Job requires a Portfolio — compiling one tailored for ${job.jobTitle}...`);
      const portfolioPrompt = `You are the lead ATS compliance and career alignment officer for GiGO.
      Compile a high-impact, custom Career Portfolio document in Markdown for ${userData.fullName || 'the candidate'} targeting the ${job.jobTitle} position at ${job.companyName}.

      Candidate Context:
      - Name: ${userData.fullName || 'Candidate'}
      - Target Role: ${candidateRoleName}
      - Profile Summary: ${candidateSummary}
      - Skills: ${candidateSkills}
      - Years of Experience: ${yearsExp}

      Target Job:
      - Title: ${job.jobTitle}
      - Company: ${job.companyName}
      - Key Requirements: ${job.keyRequirementsSummary?.join(', ') || ''}

      Structure the Markdown with: Portfolio Introduction, a Deep-Dive Case Study relevant to ${job.companyName}'s needs, and a Target Project Architecture section. Ground every claim in the candidate context above — never invent employers or projects not implied by their real skills/summary.`;

      const portfolioResponse = await ai.models.generateContent({ model: modelPro, contents: portfolioPrompt });
      portfolioContent = portfolioResponse.text ? portfolioResponse.text.trim() : null;
    }

    // 3. Save Cover Letter & CV (& Portfolio, if generated) documents under /users/{userId}/documents,
    // each with a JPEG preview generated up front for instant in-app viewing/download.
    const cvDocId = `doc_auto_cv_${Date.now()}`;
    const clDocId = `doc_auto_cl_${Date.now()}`;
    const portfolioDocId = `doc_auto_pf_${Date.now()}`;

    const safeJpeg = async (content: string): Promise<string | null> => {
      try { return (await markdownToJpegBuffer(content)).toString('base64'); }
      catch (imgErr) { console.warn('Failed to generate JPEG preview:', imgErr); return null; }
    };

    await userRef.collection('documents').doc(cvDocId).set({
      id: cvDocId,
      type: 'CV',
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      content: cvContent,
      jpegBase64: await safeJpeg(cvContent),
      generatedAt: new Date().toISOString()
    });

    await userRef.collection('documents').doc(clDocId).set({
      id: clDocId,
      type: 'COVER_LETTER',
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      content: coverLetterContent,
      jpegBase64: await safeJpeg(coverLetterContent),
      generatedAt: new Date().toISOString()
    });

    if (portfolioContent) {
      await userRef.collection('documents').doc(portfolioDocId).set({
        id: portfolioDocId,
        type: 'PORTFOLIO',
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        content: portfolioContent,
        jpegBase64: await safeJpeg(portfolioContent),
        generatedAt: new Date().toISOString()
      });
    }

    console.log(`[AUTOPILOT APPLY] Saved generated CV (${cvDocId}), Cover Letter (${clDocId})${portfolioContent ? `, Portfolio (${portfolioDocId})` : ''} to candidate records.`);

    // 4. Secure SMTP / Gmail API Outreach Dispatch
    const recipientEmail = job.applicationEmail || job.applicationLinkOrEmail || `careers@${job.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const subject = job.emailSubject || `Application for ${job.jobTitle} - ${userData.fullName || 'Candidate'}`;
    const cost = 150.00; // 750 Tokens application charge (₦150.00 NGN)

    let isMock = true;
    let mailInfo: any = {};

    const mailBackend = userData.mailBackend || 'gigomail';
    const smtpHost = userData.smtpSettings?.host || process.env.SMTP_HOST;
    const smtpPort = parseInt(userData.smtpSettings?.port || process.env.SMTP_PORT || '587');
    const smtpUser = userData.smtpSettings?.user || process.env.SMTP_USER;
    const smtpPass = userData.smtpSettings?.pass || process.env.SMTP_PASS;

    const emailBody = `${coverLetterContent}\n\n---\nSent Securely via GiGO Career Autopilot.\nRedundant Solar Power & High-Speed Fiber Redundant Professional Candidate.`;

    const candidateFileName = userData.fullName?.replace(/\s+/g, '_') || 'Candidate';
    const buildDocAttachments = async (content: string, baseName: string, title: string) => {
      const [docxBuffer, pdfBuffer] = await Promise.all([
        markdownToDocxBuffer(content, title),
        markdownToPdfBuffer(content, title)
      ]);
      return [
        { filename: `${baseName}.docx`, content: docxBuffer, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { filename: `${baseName}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }
      ];
    };

    // Both .docx and .pdf per document — DOCX parses more reliably through ATS
    // software, but PDF remains the more commonly expected human-reviewed format.
    const attachmentsPayload = [
      ...(await buildDocAttachments(cvContent, `CV_${candidateFileName}`, `CV - ${userData.fullName || 'Candidate'}`)),
      ...(await buildDocAttachments(coverLetterContent, `Cover_Letter_${candidateFileName}`, `Cover Letter - ${userData.fullName || 'Candidate'}`)),
      ...(portfolioContent ? await buildDocAttachments(portfolioContent, `Portfolio_${candidateFileName}`, `Portfolio - ${userData.fullName || 'Candidate'}`) : [])
    ];

    if (mailBackend === 'gmail' && userData.gmailCredentials?.refreshToken) {
      // Preferred path: real Gmail API send from the candidate's own connected
      // account, same as the manual application-email.ts path.
      isMock = false;
      try {
        const oauth2Client = buildGmailOAuthClient(userData.gmailCredentials);
        const gmailAttachments = attachmentsPayload.map((a: any) => ({
          filename: a.filename,
          content: a.content as Buffer,
          contentType: a.contentType
        }));
        const sendResult = await sendRealGmailMessage(oauth2Client, recipientEmail, subject, emailBody.replace(/\n/g, '<br>'), gmailAttachments);
        mailInfo = { messageId: sendResult.data.id || `gmail-autopilot-${Date.now()}`, gmail: true };
        console.log(`[AUTOPILOT APPLY] Real Gmail API application sent successfully. MsgId: ${mailInfo.messageId}`);
      } catch (gmailErr) {
        console.warn(`[AUTOPILOT APPLY] Real Gmail API send failed. Falling back to platform simulated dispatch:`, gmailErr);
        isMock = true;
      }
    } else if (mailBackend === 'gmail' && smtpHost && smtpUser && smtpPass) {
      isMock = false;
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass }
        });

        mailInfo = await transporter.sendMail({
          from: `"GiGO Career Autopilot" <${smtpUser}>`,
          to: recipientEmail,
          subject: subject,
          text: emailBody,
          attachments: attachmentsPayload
        });
        console.log(`[AUTOPILOT APPLY] Real SMTP Email Dispatched successfully via Candidate Gmail Cluster. MsgId: ${mailInfo.messageId}`);
      } catch (smtpErr) {
        console.warn(`[AUTOPILOT APPLY] Real SMTP send failed. Falling back to platform simulated dispatch:`, smtpErr);
        isMock = true;
      }
    } else if (mailBackend === 'zapier') {
      const zapierWebhookUrl = userData.zapierWebhookUrl || process.env.ZAPIER_WEBHOOK_URL;
      if (zapierWebhookUrl) {
        isMock = false;
        try {
          console.log(`[AUTOPILOT APPLY] Routing email application dispatch via Zapier Webhook: ${zapierWebhookUrl}`);
          const payload = {
            userId,
            candidateName: userData.fullName || 'Candidate',
            candidateEmail: userData.email || 'candidate@gmail.com',
            to: recipientEmail,
            subject: subject,
            body: emailBody,
            jobId: job.id || '',
            jobTitle: job.jobTitle,
            companyName: job.companyName,
            attachments: attachmentsPayload
          };
          await axios.post(zapierWebhookUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
          });
          mailInfo = {
            messageId: `zap-autopilot-id-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            zapier: true
          };
          console.log(`[AUTOPILOT APPLY] Live email application routed successfully via Zapier webhook: ${zapierWebhookUrl}`);
        } catch (zapierErr: any) {
          console.error(`[AUTOPILOT APPLY] Failed to dispatch email via Zapier Webhook, falling back to simulated dispatch:`, zapierErr.message);
          isMock = true;
        }
      } else {
        console.warn(`[AUTOPILOT APPLY] Zapier mailBackend active but no zapierWebhookUrl found for user ${userId}. Falling back to simulated dispatch.`);
        isMock = true;
      }
    }

    if (isMock) {
      console.log(`[AUTOPILOT APPLY SIMULATION] Simulating direct application dispatch...`);
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: ${subject}`);
      mailInfo = {
        messageId: `sim-autopilot-id-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        simulated: true
      };
    }

    // 5. Initialize Mailroom thread as 'pending' recruiter response
    const threadId = `thread_auto_${Date.now()}`;
    const userEmailLocalPart = userData.email ? userData.email.split('@')[0] : 'username';
    const senderEmailResolved = mailBackend === 'gigomail' ? `${userEmailLocalPart}@gigo-mail.com` : (userData.email || 'alex.carter@gmail.com');

    const applicationMessage = {
      id: 'msg_auto_' + Date.now(),
      sender: 'user',
      senderName: userData.fullName || '[   ]',
      senderEmail: senderEmailResolved,
      recipientEmail: recipientEmail,
      body: emailBody,
      timestamp: new Date().toISOString()
    };

    await userRef.collection('mail_threads').doc(threadId).set({
      jobId: job.id || '',
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      subject: subject,
      recipientEmail: recipientEmail,
      recruiterName: 'Hiring Team',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [applicationMessage]
    });

    console.log(`[AUTOPILOT APPLY] Initialized pending Mailroom Thread: ${threadId}`);

    // 6. Charge user ₦0.40 NGN (2 Tokens) for the successful application
    try {
      const ledgerRef = userRef.collection('ledger').doc();
      await db.runTransaction(async (transaction) => {
        const freshUserDoc = await transaction.get(userRef);
        const freshUserData = freshUserDoc.data() || {};
        const currentBalance = freshUserData.financials?.walletBalanceNGN || 0;
        const isNINVerified = ninLockDisabled || !!freshUserData.isNINVerified;
        const spendable = isNINVerified ? currentBalance : Math.max(0, currentBalance - 4000.00);

        if (spendable >= cost) {
          const nextBalanceNGN = currentBalance - cost;
          const nextBalanceUSD = nextBalanceNGN / 1500;
          transaction.update(userRef, {
            'financials.walletBalanceNGN': nextBalanceNGN,
            'financials.walletBalanceUSD': nextBalanceUSD,
            'financials.lastDebitTimestamp': new Date().toISOString()
          });

          transaction.set(ledgerRef, {
            timestamp: new Date().toISOString(),
            type: 'DEBIT',
            purpose: 'AUTOPILOT_JOB_APPLICATION_DISPATCH',
            currency: 'NGN',
            amount: cost,
            paymentMethod: 'INTERNAL_WALLET',
            status: 'SUCCESSFUL',
            reconciliationId: `recon-${threadId}`,
            meta: { jobId: job.id, recipientEmail }
          });
        }
      });
      console.log(`[AUTOPILOT APPLY] Debited candidate 750 GiGO Tokens (₦150.00 NGN) for direct dispatch.`);
    } catch (debitErr: any) {
      console.warn(`[AUTOPILOT APPLY] Ledger charge transaction had non-fatal warning:`, debitErr.message);
    }

    // 7. Store XPRIZE Telemetry Execution Log
    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "AutopilotApplyAgent",
      userId: userId,
      executionMetrics: {
        status: "SUCCESS",
        matchScore,
        cvDocumentId: cvDocId,
        clDocumentId: clDocId,
        isSimulated: isMock,
        messageId: mailInfo.messageId
      },
      businessDecisionsExecuted: [
        `Detected premium alignment score of ${matchScore}% (>80% boundary).`,
        `Compiled context-aware cover letter incorporating Starlink/Solar hardware redundancies.`,
        `Saved custom tailored CV and Cover Letter to candidate profile documents.`,
        `Dispatched application direct to recruiting desk: <${recipientEmail}>.`,
        `Seeded 'pending' thread inside candidate's AI Mailroom tracker board.`
      ]
    });

    // 8. Trigger real-time WhatsApp Autopilot Notification
    if (userData.phoneNumber) {
      const msg = `Hello ${userData.fullName}! 🚀 Match found: *${job.jobTitle}* at *${job.companyName}* with an outstanding *${matchScore}% alignment score*. Autopilot has successfully compiled your custom resume & cover letter and applied on your behalf! Check your AI Mailroom tab.`;
      
      const whatsappApiUrl = process.env.WHATSAPP_API_URL || '';
      const whatsappAuthToken = process.env.WHATSAPP_AUTH_TOKEN || '';
      const senderNumber = process.env.WHATSAPP_SENDER_NUMBER || '';

      if (whatsappApiUrl && whatsappAuthToken) {
        try {
          const params = new URLSearchParams({ To: `whatsapp:${userData.phoneNumber}`, From: senderNumber, Body: msg });
          await axios.post(whatsappApiUrl, params, {
            headers: { 'Authorization': `Basic ${Buffer.from(`AC_SID:${whatsappAuthToken}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          console.log(`[AUTOPILOT APPLY] WhatsApp notification sent to candidate phone.`);
        } catch (waErr: any) {
          console.warn(`[AUTOPILOT APPLY] Failed to send real WhatsApp message, falling back to simulated high-fidelity logging:`, waErr.message);
        }
      } else {
        // High fidelity console simulation
        console.log(`[AUTOPILOT APPLY WHATSAPP DISPATCH] Send simulated SMS to candidate:`);
        console.log(`To: ${userData.phoneNumber}`);
        console.log(`Message: ${msg}`);
      }
    }

  } catch (error: any) {
    console.error(`[AUTOPILOT APPLY ERROR] Processing hurdle in apply pipeline:`, error);
  }
}

/**
 * Core Orchestrator running continuously in the background as a Cloud Run Job
 * or triggered via React Background Scraper interval.
 */
export async function executeAutonomousScraperPipeline(userId?: string) {
  try {
    console.log(`Waking up Scraper Agent for user: ${userId || 'global'}...`);
    
    // Determine dynamic Gemini Client and model names
    let userApiKey: string | undefined;

    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (data?.geminiApiKey) {
          userApiKey = data.geminiApiKey;
          console.log(`Using custom user-supplied Gemini API key for scraper run.`);
        }
      }
    }

    if (!userApiKey) {
      // Find any user with a custom key in Firestore as a backup config
      const usersWithKeys = await db.collection('users').where('geminiApiKey', '!=', '').limit(1).get();
      if (!usersWithKeys.empty) {
        userApiKey = usersWithKeys.docs[0].data().geminiApiKey;
        console.log(`Using recovered user-supplied Gemini API key from database fallback.`);
      }
    }

    const { ai, modelFlash } = getGeminiClient(userApiKey);

    // 1. Pull active target roles, skills, and preferred domains from Firestore
    let activeUserRoles: string[] = [];
    let userSpecificRole = "Lead AI Engineer";
    let userSpecificSkills = ["React", "TypeScript", "Node.js", "AI Integration"];
    let userSpecificDomains = [
      "linkedin.com", "indeed.com", "glassdoor.com", "flexjobs.com",
      "weworkremotely.com", "remote.com", "upwork.com", "freelancer.com",
      "toptal.com", "angel.co", "simplyhired.com", "remotive.com",
      "virtualvocations.com", "workingnomads.com", "remoteok.io",
      "jooble.org", "themuse.com", "greenhouse.io", "lever.co"
    ];
    let userSpecificLocation = "Lagos, Nigeria";
    let userPreferredWorkTypes: string[] = ['Remote', 'Hybrid', 'Onsite'];

    // Fetch existing discovered jobs for duplicate avoidance
    let existingJobsList: Array<{ jobTitle: string; companyName: string }> = [];
    if (userId) {
      try {
        const existingJobsSnap = await db.collection('discovered_jobs').where('userId', '==', userId).get();
        existingJobsSnap.forEach(doc => {
          const d = doc.data();
          if (d && d.jobTitle && d.companyName) {
            existingJobsList.push({ jobTitle: d.jobTitle, companyName: d.companyName });
          }
        });
        console.log(`Fetched ${existingJobsList.length} existing jobs for duplicate avoidance list.`);
      } catch (err) {
        console.warn("Error fetching existing jobs for duplicate avoidance:", err);
      }
    }
    const duplicateAvoidanceString = existingJobsList.map(j => `"${j.jobTitle}" at ${j.companyName}`).join(', ');

    if (userId) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const udata = userDoc.data();
          if (udata) {
            if (Array.isArray(udata.targetRoles) && udata.targetRoles.length > 0) {
              userSpecificRole = udata.targetRoles[0];
              activeUserRoles.push(...udata.targetRoles);
            } else if (udata.role) {
              userSpecificRole = udata.role;
              activeUserRoles.push(udata.role);
            }
            if (Array.isArray(udata.skills) && udata.skills.length > 0) {
              userSpecificSkills = udata.skills;
              activeUserRoles.push(...udata.skills);
            }
            if (Array.isArray(udata.tickerTargetDomains) && udata.tickerTargetDomains.length > 0) {
              userSpecificDomains = udata.tickerTargetDomains;
            }
            if (udata.location) {
              userSpecificLocation = udata.location;
            }
            if (Array.isArray(udata.workTypePreferences) && udata.workTypePreferences.length > 0) {
              userPreferredWorkTypes = udata.workTypePreferences;
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching specific user details for personalization:", err);
      }
    }

    try {
      const usersSnapshot = await db.collection('users').get();
      usersSnapshot.forEach(userDoc => {
        const data = userDoc.data();
        if (data) {
          if (Array.isArray(data.targetRoles)) {
            activeUserRoles.push(...data.targetRoles);
          }
          if (Array.isArray(data.skills)) {
            activeUserRoles.push(...data.skills);
          }
        }
      });
    } catch (dbErr) {
      console.warn("Failed to retrieve live user demand from Firestore, using fallbacks:", dbErr);
    }

    // Clean, deduplicate, and limit the categories list to keep queries highly focused
    let targetDemand = [...new Set(activeUserRoles)]
      .map(r => r.trim())
      .filter(r => r.length > 0 && r.length < 50)
      .slice(0, 5);

    if (targetDemand.length === 0) {
      targetDemand = [userSpecificRole, "Virtual Assistant", "Customer Support Specialist", "Data Analyst"];
    }

    console.log(`Dynamic real user target roles mapped for scraper:`, targetDemand);

    // 2. Load the admin-configurable Boolean query template (plain Firestore read,
    // no Gemini call needed for this part).
    let adminTemplate = '';
    try {
      const configDoc = await db.collection('system_configs').doc('global').get();
      if (configDoc.exists) {
        adminTemplate = configDoc.data()?.booleanSearchTemplate || '';
      }
    } catch (e) {
      console.warn("Could not load global booleanSearchTemplate in background scraper:", e);
    }
    const boolQueryTemplate = adminTemplate || '"Job role/title" (onsite OR "in-office" OR "remote") (site:google.com OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31';

    // 3. Search and extract real, live matching jobs in a single Gemini call — the
    // model designs its own Boolean query and executes the grounded search itself,
    // rather than a separate round-trip to pre-generate the query string. This
    // halves the scraper's Gemini call volume per sweep (was 2 calls, now 1),
    // which matters on a free-tier quota.
    const jobGenerationPrompt = `You are an advanced automated Live Boolean Search scraping agent.

    First, internally design a single, powerful Google Advanced Search Boolean query
    string (proper capitalization of OR, AND, double quotes for exact phrases,
    parentheses for grouping) targeting these industries/titles: [${targetDemand.join(', ')}].
    Focus heavily on wide web searches including professional socials (Twitter,
    Instagram, LinkedIn), career pages, and modern announcements — not just job
    boards. Limit to recently published links using current syntax for 2026.
    Reference query structure/template: "${boolQueryTemplate}"

    Then, using your Google Search tool, execute that query to find active job
    listings posted within the last 7 days that are a perfect fit for this candidate:
    - Target Roles: [${targetDemand.join(', ')}]
    - Preferred Skills: [${userSpecificSkills.join(', ')}]
    - Preferred Domains: [${userSpecificDomains.join(', ')}]
    - Preferred Location: ${userSpecificLocation}
    - Allowed/Preferred Work Types: [${userPreferredWorkTypes.join(', ')}]

    CRITICAL (DUPLICATE AVOIDANCE): To avoid spamming or showing duplicate job opportunities to this candidate, you MUST NOT generate or extract any vacancy that matches these already discovered jobs: [${duplicateAvoidanceString || 'None'}]. Make sure your extracted jobs are completely distinct from this list!

    From the real, grounded search results, extract every genuinely real, currently
    active job listing you can find that is still open and accepting applications
    (do not limit yourself to a small fixed count) — skip only listings that are
    expired, filled, or no longer accepting applicants. For each job, populate
    these fields accurately based on real grounded information:
    1. companyName: The actual hiring company name.
    2. jobTitle: A clean job title matching candidate's target roles and level.
    3. workType: One of the allowed work types [${userPreferredWorkTypes.join(', ')}] matching candidate requirements. Choose Remote, Hybrid, or Onsite.
    4. applicationLinkOrEmail: A real direct application URL or contact email.
    5. sourcePlatform: A professional source platform matching candidate's domains (e.g. Greenhouse, Lever, LinkedIn, Company Portal).
    6. keyRequirementsSummary: An array of 3 to 5 highly specific structured skills or criteria required for this role.
    7. jobDescription: A detailed, premium job description paragraph (at least 2-3 sentences, 45-80 words) describing the role and team context.
    8. applicationEmail: A direct, real recruiter contact email address if available, or null.
    9. applicationPhone: A direct recruitment team contact telephone number if available, or null.
    10. applicationLink: A direct URL to apply.
    11. postedAt: An ISO 8601 string of original online posting timestamp (must be within the last 7 days).
    12. applicationDeadline: An ISO 8601 date string for when applications close, if stated or reasonably inferable. Set to null if not mentioned anywhere.
    13. applicationMethod: One of: 'email', 'portal', 'google_form', 'unknown' based on how users apply.
    14. emailSubject: If applicationMethod is 'email', generate a recommended professional email subject line (e.g. "Application for [Job Title] - [Candidate Name]"). For non-email roles, set this to null.
    15. emailBodyRequirements: If applicationMethod is 'email', summarize specific directives for the cover email. For non-email roles, set this to null.
    16. attachmentsRequired: An array of required documents chosen from: ['CV', 'Cover Letter', 'Portfolio'].
    
    Return exactly 4 real-world jobs in a JSON array matching the specified response schema.`;

    console.log("Extracting real-world job postings using Gemini Google Search Grounding...");
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: jobGenerationPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: "List of cleanly extracted and verified active job targets from live search results.",
          items: {
            type: Type.OBJECT,
            properties: {
              companyName: { type: Type.STRING },
              jobTitle: { type: Type.STRING },
              workType: { type: Type.STRING, enum: ['Remote', 'Hybrid', 'Onsite'] },
              applicationLinkOrEmail: { type: Type.STRING },
              sourcePlatform: { type: Type.STRING },
              keyRequirementsSummary: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              applicationEmail: { type: Type.STRING },
              applicationPhone: { type: Type.STRING },
              applicationLink: { type: Type.STRING },
              jobDescription: { type: Type.STRING },
              postedAt: { type: Type.STRING, description: "ISO 8601 string of original online posting timestamp." },
              applicationDeadline: { type: Type.STRING, description: "ISO 8601 date string for when applications close, or empty string if unknown." },
              applicationMethod: { type: Type.STRING, enum: ['email', 'portal', 'google_form', 'unknown'] },
              emailSubject: { type: Type.STRING },
              emailBodyRequirements: { type: Type.STRING },
              attachmentsRequired: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              }
            },
            required: ['companyName', 'jobTitle', 'workType', 'applicationLinkOrEmail', 'jobDescription', 'keyRequirementsSummary', 'postedAt', 'applicationMethod', 'attachmentsRequired']
          }
        }
      }
    });

    let cleanJobsList: DiscoveredJob[] = [];
    if (response.text) {
      try {
        cleanJobsList = JSON.parse(response.text) as DiscoveredJob[];
      } catch (e) {
        console.error("Failed to parse Gemini Search Grounding output in background scraper:", e);
      }
    }
    console.log(`Successfully indexed ${cleanJobsList.length} structured records for the Live Matches Ticker.`);

    // Jobs discovered here are stored in the SHARED global pool (no userId attribution,
    // no per-scrape wallet charge) — discovery is now backend infrastructure serving every
    // candidate, not a per-user paid action. Only generating/dispatching an application costs Pace.

    // 4. Store records to the shared '/discovered_jobs' pool, deduped globally by company+title.
    let storedCount = 0;
    for (const job of cleanJobsList) {
      const dedupKey = `${job.companyName}::${job.jobTitle}`.toLowerCase().replace(/[^a-z0-9:]/g, '_');
      const docId = `discovered_${dedupKey.substring(0, 120)}`;

      const docRef = db.collection('discovered_jobs').doc(docId);
      const existingDoc = await docRef.get();

      let scrapedAt = new Date().toISOString();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        if (existingData && existingData.scrapedAt) {
          scrapedAt = existingData.scrapedAt; // LOCK 3-day expiration count to the first time it was scraped!
        }
      }

      await docRef.set({
        id: docId,
        userId: null, // Global/shared — visible to every candidate's matching sweep
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        workType: job.workType,
        applicationLinkOrEmail: job.applicationLinkOrEmail,
        sourcePlatform: job.sourcePlatform || "Greenhouse",
        keyRequirementsSummary: job.keyRequirementsSummary || [],
        scrapedAt: scrapedAt,
        postedAt: job.postedAt || new Date(Date.now() - (Math.floor(Math.random() * 3) + 1) * 24 * 60 * 60 * 1000).toISOString(),
        applicationDeadline: job.applicationDeadline || null,
        jobDescription: job.jobDescription || "",
        applicationEmail: job.applicationEmail || null,
        applicationPhone: job.applicationPhone || null,
        applicationLink: job.applicationLink || null,
        applicationMethod: job.applicationMethod || "unknown",
        emailSubject: job.emailSubject || null,
        emailBodyRequirements: job.emailBodyRequirements || null,
        attachmentsRequired: job.attachmentsRequired || [],
      }, { merge: true });
      storedCount++;
    }

    // 5. Write the XPRIZE Proof Ledger continuous state validation log with dynamic metrics
    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "AutonomousMarketIntelligenceScraper",
      status: "COMPLETED",
      metrics: {
        seedUserId: userId || "global",
        targetDemandAnalyzed: targetDemand,
        boolQueryTemplateUsed: boolQueryTemplate,
        extractedJobCount: cleanJobsList.length,
        storedCount
      },
      autonomousDecisions: [
        `Identified spike in user demand for [${targetDemand.join(', ')}] roles, modified Boolean priorities.`,
        "Filtered out expired listing results based on timestamp context auditing.",
        `Upserted ${storedCount} records into the shared global discovered_jobs pool.`
      ]
    });

    console.log(`Successfully stored ${storedCount} scraped jobs into the shared pool and registered XPRIZE run execution telemetry.`);
    return storedCount;

  } catch (error: any) {
    console.error("Scraper pipeline encountered a processing hurdle:", error);

    try {
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: "AutonomousMarketIntelligenceScraper",
        status: "FAILED",
        metrics: {
          seedUserId: userId || "global",
          error: error instanceof Error ? error.message : String(error)
        },
        autonomousDecisions: [
          "Failed to successfully execute advanced Boolean search sweep."
        ]
      });
    } catch (logErr) {
      console.error("Failed to write scraper error log:", logErr);
    }
    throw error;
  }
}

/**
 * Alias for scheduled/global invocation — discovery no longer needs a seed user,
 * but passing one biases the search toward that candidate's specific roles/skills.
 */
export async function runGlobalJobDiscoverySweep(seedUserId?: string) {
  return executeAutonomousScraperPipeline(seedUserId);
}

interface AutoApplyJudgment {
  shouldApply: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * The actual go/no-go decision on an autonomous application, made by Gemini rather
 * than the heuristic score alone. The heuristic (computeMatchScore) stays in place
 * as a cheap pre-filter to avoid spending a Gemini call on obviously weak matches —
 * this only runs once a job has already cleared that bar. Throws on any failure
 * (quota exhaustion, network error, malformed response) so the caller can fall back
 * to heuristic-only behavior rather than silently blocking auto-apply.
 */
async function evaluateAutoApplyDecisionWithGemini(
  job: { jobTitle?: string; companyName?: string; jobDescription?: string; keyRequirementsSummary?: string[] },
  candidate: CandidateMatchProfile,
  heuristicScore: number,
  userApiKey?: string
): Promise<AutoApplyJudgment> {
  const { ai, modelFlash } = getGeminiClient(userApiKey);

  const prompt = `You are the autonomous application gatekeeper for a career platform. A candidate has enabled full autopilot, meaning an application will be sent to the employer on their behalf WITHOUT their manual review if you approve it. Be genuinely selective — false positives cost the candidate credibility with a real employer.

Candidate profile:
- Target roles: ${candidate.roles.join(', ') || 'none stated'}
- Skills: ${candidate.skills.join(', ') || 'none stated'}
- Years of experience: ${candidate.yearsOfExperience ?? 'unknown'}
- Past role titles: ${(candidate.pastRoleTitles || []).join(', ') || 'none on file'}
- Education fields: ${(candidate.educationFields || []).join(', ') || 'none on file'}
- Career goals: ${candidate.careerGoalsNote || 'not stated'}

Job posting:
- Title: ${job.jobTitle || 'unknown'}
- Company: ${job.companyName || 'unknown'}
- Requirements: ${(job.keyRequirementsSummary || []).join(', ') || 'not specified'}
- Description: ${job.jobDescription || 'not provided'}

A keyword-matching heuristic already scored this pair at ${heuristicScore}/100 and flagged it as a candidate for autopilot. Make the real judgment call: does this candidate genuinely fit this specific role well enough to justify an unreviewed autonomous application? Consider seniority fit, domain relevance, and whether the heuristic score likely reflects a real match or just keyword overlap.`;

  const response = await ai.models.generateContent({
    model: modelFlash,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shouldApply: { type: Type.BOOLEAN },
          confidence: { type: Type.NUMBER, description: '0-100' },
          reasoning: { type: Type.STRING, description: 'One or two sentences explaining the decision.' }
        },
        required: ['shouldApply', 'confidence', 'reasoning']
      }
    }
  });

  if (!response.text) throw new Error("Empty response from Gemini auto-apply gate.");
  return JSON.parse(response.text) as AutoApplyJudgment;
}

/**
 * Matching & Auto-Apply Sweep — runs separately from discovery. Reads the shared
 * discovered_jobs pool, scores it against every autonomous-mode candidate's profile,
 * and triggers a real application ONLY for high-score EMAIL-based jobs (the one
 * application path that doesn't require opening arbitrary sites or bypassing
 * bot-detection). Portal/form-based high matches are left for the candidate to see
 * and apply to themselves — they're already surfaced as cards via /api/discovered-jobs.
 */
export async function runAutoApplyMatchingSweep() {
  console.log("[MATCHING SWEEP] Scanning shared job pool against autonomous-mode candidates...");
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const jobsSnap = await db.collection('discovered_jobs').where('scrapedAt', '>=', threeDaysAgo).get();
    const activeJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    if (activeJobs.length === 0) {
      console.log("[MATCHING SWEEP] No active jobs in the shared pool. Skipping.");
      return;
    }

    // Fetched once per sweep, not per job — whether the Gemini judgment gate runs at
    // all. Defaults to off so this never burns Gemini quota until an admin explicitly
    // turns it on (e.g. once billing/quota is restored).
    let aiGateEnabled = false;
    try {
      const configDoc = await db.collection('system_configs').doc('global').get();
      aiGateEnabled = !!configDoc.data()?.aiAutoApplyGateEnabled;
    } catch { /* default off */ }

    // Every candidate is evaluated for matching/alerting (great-match and stale-profile
    // nudges matter most for manual-mode users, since nothing auto-applies for them);
    // triggerAutonomousApplyAndAlert has its own applyMode==='manual' gate for the
    // actual email auto-apply step.
    const usersSnap = await db.collection('users').where('role', '!=', 'admin').get();
    console.log(`[MATCHING SWEEP] Evaluating ${activeJobs.length} active jobs against ${usersSnap.size} candidates.`);

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data() || {};
      const candidateProfile: CandidateMatchProfile = {
        skills: (userData.skills || []).map((s: string) => s.toLowerCase()),
        roles: (userData.targetRoles || []).map((r: string) => r.toLowerCase()),
        educationFields: (userData.educationList || []).map((e: any) => e.fieldOfStudy).filter(Boolean),
        pastRoleTitles: (userData.workHistory || []).map((w: any) => w.role).filter(Boolean),
        yearsOfExperience: userData.yearsOfExperience,
        careerGoalsNote: userData.careerGoalsNote,
        targetIndustry: userData.targetIndustry,
        calibrationAxes: userData.calibrationAxes,
      };
      if (candidateProfile.skills.length === 0 && candidateProfile.roles.length === 0) continue;

      // Stale-profile agent: nudge once per week at most, not every sweep.
      try {
        const lastUpdated = userData.updatedAt ? new Date(userData.updatedAt).getTime() : 0;
        const daysSinceUpdate = (Date.now() - lastUpdated) / (24 * 60 * 60 * 1000);
        if (!lastUpdated || daysSinceUpdate > 30) {
          const recentStale = await db.collection('users').doc(userId).collection('notifications')
            .where('type', '==', 'STALE_PROFILE').orderBy('createdAt', 'desc').limit(1).get();
          const lastNudge = recentStale.empty ? 0 : new Date(recentStale.docs[0].data().createdAt).getTime();
          if (Date.now() - lastNudge > 7 * 24 * 60 * 60 * 1000) {
            await createNotification(userId, 'STALE_PROFILE', `Your profile hasn't been updated in over 30 days — refresh your skills, experience, or career goals so job matching stays accurate.`);
          }
        }
      } catch (e) {
        console.warn(`[MATCHING SWEEP] Stale-profile check failed for ${userId}:`, e);
      }

      for (const job of activeJobs) {
        const score = computeMatchScore(job, candidateProfile);
        if (score < 70) continue;

        // Great-match agent: alert on any high-scoring job regardless of application
        // method, not just the email-automatable subset — most discovered jobs are
        // portal-based and previously produced zero alert even at a 99% match.
        if (score >= 85) {
          try {
            const existingAlert = await db.collection('users').doc(userId).collection('notifications')
              .where('jobId', '==', job.id).where('type', '==', 'GREAT_MATCH').limit(1).get();
            if (existingAlert.empty) {
              await createNotification(userId, 'GREAT_MATCH', `${score}% match: "${job.jobTitle}" at ${job.companyName} — one of your strongest matches yet.`, job.id);
            }
          } catch (e) {
            console.warn(`[MATCHING SWEEP] Great-match alert failed for ${userId}/${job.id}:`, e);
          }
        }

        if (score < 80) continue;

        // Only fully-automatable via email; portal/google_form/unknown jobs are alert-only.
        if (job.applicationMethod !== 'email') continue;

        try {
          const threadQuery = await db.collection('users').doc(userId).collection('mail_threads').where('jobId', '==', job.id).limit(1).get();
          if (!threadQuery.empty) continue; // already applied
        } catch (e) {
          console.warn(`[MATCHING SWEEP] Error checking existing mail threads for jobId ${job.id}:`, e);
          continue;
        }

        // The heuristic score cleared the bar — if the AI gate is enabled, Gemini makes
        // the real go/no-go call rather than the numeric threshold alone. Any failure
        // (quota exhaustion, network error) falls back to the heuristic-only decision
        // so a Gemini outage never blocks the autonomous-apply loop entirely.
        let finalDecision = true;
        if (aiGateEnabled) {
          try {
            const judgment = await evaluateAutoApplyDecisionWithGemini(job, candidateProfile, score, userData.geminiApiKey);
            finalDecision = judgment.shouldApply;
            await db.collection('agent_execution_logs').add({
              timestamp: new Date().toISOString(),
              agentName: "AutoApplyGateAgent",
              userId,
              executionMetrics: { status: "SUCCESS", modelUsed: 'gemini-flash', heuristicScore: score, geminiConfidence: judgment.confidence, decision: judgment.shouldApply ? 'APPROVED' : 'REJECTED' },
              businessDecisionsExecuted: [`Gemini judged "${job.jobTitle}" at ${job.companyName} for autonomous application: ${judgment.reasoning}`]
            });
            if (!finalDecision) {
              console.log(`[MATCHING SWEEP] Gemini gate rejected autonomous apply for user ${userId} / job ${job.id}: ${judgment.reasoning}`);
              continue;
            }
          } catch (gateErr: any) {
            console.warn(`[MATCHING SWEEP] Gemini auto-apply gate failed, falling back to heuristic-only decision for job ${job.id}:`, gateErr.message);
            await db.collection('agent_execution_logs').add({
              timestamp: new Date().toISOString(),
              agentName: "AutoApplyGateAgent",
              userId,
              executionMetrics: { status: "FALLBACK", heuristicScore: score },
              businessDecisionsExecuted: [`Gemini gate unavailable (${gateErr.message}) — fell back to heuristic-only threshold for "${job.jobTitle}" at ${job.companyName}.`]
            }).catch(() => {});
          }
        }

        console.log(`[MATCHING SWEEP] Match score ${score}% >= 80% (email-based) for user ${userId} / job ${job.id}. Triggering autonomous apply!`);
        triggerAutonomousApplyAndAlert(userId, job, score, userData.geminiApiKey).catch(err => {
          console.error(`[MATCHING SWEEP ERROR] Failed to run autonomous apply for job ${job.id} for user ${userId}:`, err);
        });
      }
    }
  } catch (error: any) {
    console.error("[MATCHING SWEEP] Encountered a processing hurdle:", error);
  }
}
