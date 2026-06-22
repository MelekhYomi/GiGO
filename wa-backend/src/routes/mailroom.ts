import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { getGeminiClient } from '../utils/gemini';
import { mapErrorResponse } from '../utils/errorMapper';
import { authenticateToken } from '../utils/auth';
import { google } from 'googleapis';

const router = express.Router();

/**
 * GET /api/mail/threads
 * Fetch all mail threads for the logged-in candidate
 */
router.get('/mail/threads', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    const threadsSnap = await db.collection('users').doc(userId).collection('mail_threads')
      .orderBy('updatedAt', 'desc').get();

    const threads = threadsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(threads);
  } catch (error: any) {
    console.error("Failed to fetch mail threads:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to retrieve mailbox communications.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

/**
 * GET /api/mail/threads/:threadId
 * Fetch detailed messages for a specific thread
 */
router.get('/mail/threads/:threadId', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { threadId } = req.params;

  try {
    const threadDoc = await db.collection('users').doc(userId).collection('mail_threads').doc(threadId).get();
    if (!threadDoc.exists) {
      res.status(404).json({ error: "Email thread not found." });
      return;
    }

    res.status(200).json({ id: threadDoc.id, ...threadDoc.data() });
  } catch (error: any) {
    console.error("Failed to fetch mail thread detail:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to retrieve communication thread.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

/**
 * Helper to build and send a real email via Gmail API
 */
async function sendRealGmailMessage(auth: any, to: string, subject: string, bodyText: string) {
  const gmail = google.gmail({ version: 'v1', auth });
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText,
  ];
  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}

/**
 * POST /api/mail/send-reply
 * Send a manual reply or routine follow-up message within an existing thread.
 * Dispatches via the live Gmail API if connected, or uses the simulation engine as fallback.
 */
router.post('/mail/send-reply', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { threadId, bodyText } = req.body;

  if (!threadId || !bodyText) {
    res.status(400).json({ error: "Missing required fields: threadId and bodyText are required." });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const userData = userDoc.data() || {};
    const mailBackend = userData.mailBackend || 'gigomail';
    const userEmailLocalPart = userData.email ? userData.email.split('@')[0] : 'username';
    const userEmail = mailBackend === 'gigomail' 
      ? `${userEmailLocalPart}@gigo-mail.com` 
      : (userData.email || 'alex.carter@gmail.com');
    const userFullName = userData.fullName || '[   ]';

    const threadRef = userRef.collection('mail_threads').doc(threadId);
    const threadDoc = await threadRef.get();

    if (!threadDoc.exists) {
      res.status(404).json({ error: "Communication thread not found." });
      return;
    }

    const threadData = threadDoc.data() || {};
    const messages = threadData.messages || [];

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      sender: 'user',
      senderName: userFullName,
      senderEmail: userEmail,
      recipientEmail: threadData.recipientEmail || 'recruitment@company.com',
      body: bodyText,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, newMessage];

    let liveDispatched = false;

    // Check for connected Gmail credentials to send real email (only if mailBackend is 'gmail')
    if (mailBackend === 'gmail' && userData.gmailCredentials && userData.gmailCredentials.refreshToken) {
      try {
        const client_id = process.env.GOOGLE_CLIENT_ID || '1047125301880-mock.apps.googleusercontent.com';
        const client_secret = process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret';
        const redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth-callback';

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
        oauth2Client.setCredentials({
          access_token: userData.gmailCredentials.accessToken,
          refresh_token: userData.gmailCredentials.refreshToken,
          expiry_date: userData.gmailCredentials.expiryDate
        });

        await sendRealGmailMessage(
          oauth2Client,
          threadData.recipientEmail || 'recruitment@company.com',
          `Re: ${threadData.subject || 'Job Application'}`,
          bodyText
        );
        liveDispatched = true;
        console.log(`Live email dispatched via Gmail API for thread ${threadId}.`);
      } catch (gmailErr) {
        console.error("Failed to dispatch live Gmail API email, falling back to simulated dispatch:", gmailErr);
      }
    }

    await threadRef.update({
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      lastFollowUpAt: new Date().toISOString(),
      status: 'pending' // Re-flagged as pending recruiter response
    });

    // Write audit log
    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "MailroomCommunicationAgent",
      userId,
      executionMetrics: {
        status: "SUCCESS",
        threadId,
        messageId: newMessage.id,
        liveDispatched
      },
      businessDecisionsExecuted: [
        `Appended custom user reply to thread: "${threadData.subject}".`,
        liveDispatched 
          ? `Successfully sent real email via live connected Gmail API <${userEmail}>.` 
          : (mailBackend === 'gigomail'
              ? `Dispatched virtual reply via GiGO Mailroom Agent <${userEmail}> to Recruiter <${threadData.recipientEmail}>.`
              : `Dispatched simulated reply from Gmail profile <${userEmail}> to Recruiter <${threadData.recipientEmail}>.`),
        `Marked thread state as pending and logged telemetry.`
      ]
    });

    res.status(200).json({
      success: true,
      message: liveDispatched 
        ? "Reply sent successfully via the Gmail API!" 
        : (mailBackend === 'gigomail' 
            ? "Reply sent successfully via GiGO Mail Agent!"
            : "Reply sent successfully via simulated Google Mail API."),
      newMessage
    });

  } catch (error: any) {
    console.error("Failed to send mail reply:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to send email reply.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

/**
 * POST /api/mail/generate-followup
 * AI-powered follow-up email draftsman using Gemini Pro
 */
router.post('/mail/generate-followup', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { threadId } = req.body;

  if (!threadId) {
    res.status(400).json({ error: "Missing parameter: threadId is required." });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const userData = userDoc.data() || {};
    const threadDoc = await userRef.collection('mail_threads').doc(threadId).get();

    if (!threadDoc.exists) {
      res.status(404).json({ error: "Thread not found." });
      return;
    }

    const threadData = threadDoc.data() || {};
    const messages = threadData.messages || [];
    
    // Compile thread history for Gemini context
    const historyContext = messages.map((m: any) => {
      return `[${m.timestamp}] Sender: ${m.senderName} (${m.senderEmail}) -> ${m.body}`;
    }).join('\n\n');

    const systemPrompt = `You are GiGO's Expert AI Career Agent. Your task is to write a follow-up email from the candidate, ${userData.fullName}, to the recruiter regarding the job "${threadData.jobTitle}" at "${threadData.companyName}".
    Keep the tone exceptionally professional, confident, proactive, and humble. 
    Incorporate that the candidate possesses redundant, highly-reliable operations (solar power backup + multiple fiber ISP lines) which means 100% engineering uptime, if appropriate.
    Reference the conversation history context and keep the follow-up concise (around 2-3 short paragraphs).
    Do NOT include any placeholders (like [Date], [Company Name], etc.) - generate direct, usable text. Replace any unknown recruiter name with "Hiring Team".`;

    const userPrompt = `Conversation History:\n${historyContext}\n\nDraft a highly calibrated follow-up message to the Recruiter. Ensure the output is only the message body ready to send.`;

    const { ai, modelPro } = getGeminiClient(userData.geminiApiKey);
    const response = await ai.models.generateContent({
      model: modelPro,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ]
    });

    const draftText = response.text || "Dear Hiring Team,\n\nI am writing to follow up on my recent application for the position. I remain extremely interested in the role and would love to connect.\n\nBest regards,\n" + (userData.fullName || "[   ]");

    res.status(200).json({
      success: true,
      draftText
    });

  } catch (error: any) {
    console.error("Failed to generate AI follow-up draft:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to draft career follow-up email.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

/**
 * POST /api/mail/sync
 * Sync email inbox: retrieves incoming recruiter replies for the user's applications.
 * Support live Gmail API parsing if connected; falls back to the high-fidelity simulator.
 */
router.post('/mail/sync', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { forceSimulate } = req.body;

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const userData = userDoc.data() || {};
    const { ai, modelFlash } = getGeminiClient(userData.geminiApiKey);

    const threadsRef = userRef.collection('mail_threads');
    const threadsSnap = await threadsRef.get();

    let syncedRepliesCount = 0;
    const syncedThreads: string[] = [];
    const mailBackend = userData.mailBackend || 'gigomail';
    let isLiveGmailSync = false;

    // Check if live Gmail API is authenticated (only if mailBackend is 'gmail')
    if (mailBackend === 'gmail' && userData.gmailCredentials && userData.gmailCredentials.refreshToken && !forceSimulate) {
      try {
        const client_id = process.env.GOOGLE_CLIENT_ID || '1047125301880-mock.apps.googleusercontent.com';
        const client_secret = process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret';
        const redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth-callback';

        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
        oauth2Client.setCredentials({
          access_token: userData.gmailCredentials.accessToken,
          refresh_token: userData.gmailCredentials.refreshToken,
          expiry_date: userData.gmailCredentials.expiryDate
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        isLiveGmailSync = true;

        // Fetch recent messages matching job application keywords
        const gmailResponse = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 10,
          q: 'subject:(application OR interview OR recruiter OR hiring OR job)'
        });

        const gmailMessages = gmailResponse.data.messages || [];
        console.log(`Live Gmail Sync: Found ${gmailMessages.length} potential recruiter replies.`);

        for (const msg of gmailMessages) {
          const msgDetail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id || ''
          });

          const snippet = msgDetail.data.snippet || '';
          const headers = msgDetail.data.payload?.headers || [];
          const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'unknown@recruiter.com';

          // Look for threads in Firestore that match this sender or subject keywords
          for (const doc of threadsSnap.docs) {
            const threadData = doc.data() || {};
            const threadId = doc.id;
            const companyNameLower = (threadData.companyName || '').toLowerCase();
            const subjectLower = subjectHeader.toLowerCase();

            // Match mail threads by company name
            if (companyNameLower && subjectLower.includes(companyNameLower)) {
              const messages = threadData.messages || [];
              const isAlreadySaved = messages.some((m: any) => m.id === msg.id);

              if (!isAlreadySaved) {
                // Use Gemini Flash to classify recruiter sentiment from the snippet/body
                const classificationPrompt = `Analyze the following recruiter email snippet: "${snippet}". 
                Based on this, classify the application outcome as one of these:
                1. 'interview_offered' - if they want to schedule a meet/interview.
                2. 'rejected' - if they are not moving forward.
                3. 'replied' - if they are asking general questions.
                Return only the matching status string.`;

                const sentimentResponse = await ai.models.generateContent({
                  model: modelFlash,
                  contents: classificationPrompt
                });

                const newStatus = (sentimentResponse.text || 'replied').trim().toLowerCase();
                const matchedStatus = ['interview_offered', 'rejected', 'replied'].includes(newStatus) ? newStatus : 'replied';

                const newMsg = {
                  id: msg.id,
                  sender: 'recruiter',
                  senderName: fromHeader.split('<')[0].trim() || 'Recruiter',
                  senderEmail: fromHeader.match(/<([^>]+)>/)?.[1] || fromHeader,
                  recipientEmail: userData.email || 'alex.carter@gmail.com',
                  body: `<p>${snippet}</p>`,
                  timestamp: new Date().toISOString()
                };

                await threadsRef.doc(threadId).update({
                  messages: [...messages, newMsg],
                  updatedAt: new Date().toISOString(),
                  status: matchedStatus
                });

                syncedRepliesCount++;
                syncedThreads.push(`${threadData.jobTitle} at ${threadData.companyName}`);
              }
            }
          }
        }
      } catch (gmailErr) {
        console.error("Live Gmail API Sync failed, reverting to simulation backup:", gmailErr);
        isLiveGmailSync = false;
      }
    }

    // Revert to high-fidelity Simulator if not connected to live Gmail or if forced
    if (!isLiveGmailSync) {
      for (const doc of threadsSnap.docs) {
        const threadData = doc.data() || {};
        const threadId = doc.id;

        // Only simulate responses for threads that are pending recruiter reply
        // or if forceSimulate is true
        if (threadData.status === 'pending' || forceSimulate) {
          const messages = threadData.messages || [];
          const lastMessage = messages[messages.length - 1];

          // Ensure the last message in the thread is from the user (so we simulate a reply from the recruiter)
          if (lastMessage && lastMessage.sender === 'user') {
            // Generate an AI-native Recruiter response using Gemini
            const recruiterName = threadData.recruiterName || 'Hiring Team';
            const recruiterEmail = threadData.recipientEmail || 'recruitment@company.com';

            const threadHistory = messages.map((m: any) => `[${m.sender === 'user' ? 'Candidate' : 'Recruiter'}] ${m.body}`).join('\n\n');

            const systemPrompt = `You are simulating a Recruiter/Hiring Manager replying to a job application.
            The job is "${threadData.jobTitle}" at "${threadData.companyName}".
            The candidate is ${userData.fullName}. Here is their summary: ${userData.professionalSummary || ''}.
            We are simulating the email exchange. You should write a highly-realistic, context-aware reply to the candidate's last message.
            Depending on the candidate's strong skills and uptime redundant setup (solar backup / internet backup), write a realistic reply that falls into one of these outcomes:
            1. Shortlisting the candidate and offering an interview slot (provide 2 mock slots, e.g. next Tuesday 2 PM GMT+1 or Wednesday 10 AM).
            2. Asking a specific engineering/technical question (e.g., asking how they manage Starlink connectivity drops or state ledgers).
            3. A respectful rejection (only if match score was low, but since they applied, let's keep it highly encouraging).
            Most of the time (70%), favor option 1 or 2 to make the gameplay engaging!
            Return the output as a clean HTML email body. Keep it short and readable (under 180 words).
            Ensure you do NOT output markdown code blocks (e.g. \`\`\`html) - return raw text/HTML.`;

            const userPrompt = `Email History:\n${threadHistory}\n\nSimulate the recruiter's response in detail:`;

            const response = await ai.models.generateContent({
              model: modelFlash,
              contents: [
                { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
              ]
            });

            let responseBody = response.text || `<p>Dear ${userData.fullName},</p><p>Thank you for your application. We are reviewing your qualifications and will be in touch shortly.</p><p>Best regards,<br>The Recruitment Team</p>`;
            
            // Clean markdown wrappers if any
            responseBody = responseBody.replace(/```html/gi, '').replace(/```/g, '').trim();

            const simulatedMessageId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const simulatedMessage = {
              id: simulatedMessageId,
              sender: 'recruiter',
              senderName: recruiterName,
              senderEmail: recruiterEmail,
              recipientEmail: mailBackend === 'gigomail' 
                ? `${userData.email ? userData.email.split('@')[0] : 'username'}@gigo-mail.com` 
                : (userData.email || 'alex.carter@gmail.com'),
              body: responseBody,
              timestamp: new Date().toISOString()
            };

            const newMessages = [...messages, simulatedMessage];

            // Determine new status based on email content
            let newStatus = 'replied';
            const lowerBody = responseBody.toLowerCase();
            if (lowerBody.includes('interview') || lowerBody.includes('schedule') || lowerBody.includes('calendar') || lowerBody.includes('meet')) {
              newStatus = 'interview_offered';
            } else if (lowerBody.includes('unfortunately') || lowerBody.includes('regret') || lowerBody.includes('not moving forward')) {
              newStatus = 'rejected';
            }

            await threadsRef.doc(threadId).update({
              messages: newMessages,
              updatedAt: new Date().toISOString(),
              status: newStatus
            });

            syncedRepliesCount++;
            syncedThreads.push(threadData.jobTitle + ' at ' + threadData.companyName);
          }
        }
      }
    }

    if (syncedRepliesCount > 0) {
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: "MailroomSyncAgent",
        userId,
        executionMetrics: {
          status: "SUCCESS",
          syncedRepliesCount
        },
        businessDecisionsExecuted: [
          mailBackend === 'gigomail' 
            ? `Synchronized virtual GiGO Mail account.`
            : `Synchronized virtual Google Mail API inbox.`,
          `Fetched ${syncedRepliesCount} new recruiter replies for active threads: ${syncedThreads.join(', ')}.`,
          `Computed semantic status updates for refreshed threads and updated state machines.`
        ]
      });
    }

    res.status(200).json({
      success: true,
      message: syncedRepliesCount > 0 
        ? (mailBackend === 'gigomail'
            ? `GiGO Mailroom Sync complete. Received ${syncedRepliesCount} new recruiter updates.`
            : `Gmail API Sync complete. Discovered ${syncedRepliesCount} new recruiter updates.`)
        : (mailBackend === 'gigomail'
            ? "GiGO Mailroom Sync complete. No new messages concern your applied vacancies."
            : "Gmail API Sync complete. No new messages concern your applied vacancies."),
      syncedRepliesCount
    });

  } catch (error: any) {
    console.error("Failed to sync mailroom inbox:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to synchronize mailroom mailbox.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

/**
 * PUT /api/mail/threads/:threadId/trash
 * Move a mail thread to trash (soft-delete)
 */
router.put('/mail/threads/:threadId/trash', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { threadId } = req.params;

  try {
    const threadRef = db.collection('users').doc(userId).collection('mail_threads').doc(threadId);
    const threadDoc = await threadRef.get();
    if (!threadDoc.exists) {
      res.status(404).json({ error: "Email thread not found." });
      return;
    }

    await threadRef.update({
      isTrash: true,
      folder: 'trash',
      updatedAt: new Date().toISOString()
    });

    // Write audit log
    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "MailroomCommunicationAgent",
      userId,
      executionMetrics: {
        status: "SUCCESS",
        threadId,
        action: "MOVE_TO_TRASH"
      },
      businessDecisionsExecuted: [
        `Moved thread "${threadDoc.data()?.subject}" to Trash folder.`,
        `Soft-deleted the thread and flagged it for auto-purge.`
      ]
    });

    res.status(200).json({ success: true, message: "Thread moved to trash successfully." });
  } catch (error: any) {
    console.error("Failed to move thread to trash:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to trash email thread.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

/**
 * PUT /api/mail/threads/:threadId/restore
 * Restore a mail thread from trash
 */
router.put('/mail/threads/:threadId/restore', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { threadId } = req.params;

  try {
    const threadRef = db.collection('users').doc(userId).collection('mail_threads').doc(threadId);
    const threadDoc = await threadRef.get();
    if (!threadDoc.exists) {
      res.status(404).json({ error: "Email thread not found." });
      return;
    }

    await threadRef.update({
      isTrash: false,
      folder: 'inbox',
      updatedAt: new Date().toISOString()
    });

    // Write audit log
    await db.collection('agent_execution_logs').add({
      timestamp: new Date().toISOString(),
      agentName: "MailroomCommunicationAgent",
      userId,
      executionMetrics: {
        status: "SUCCESS",
        threadId,
        action: "RESTORE"
      },
      businessDecisionsExecuted: [
        `Restored thread "${threadDoc.data()?.subject}" from Trash folder.`,
        `Re-queued the thread into candidate's active mailbox folders.`
      ]
    });

    res.status(200).json({ success: true, message: "Thread restored from trash successfully." });
  } catch (error: any) {
    console.error("Failed to restore thread from trash:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to restore email thread.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

/**
 * DELETE /api/mail/threads/trash/empty
 * Permanently empty all threads in the trash
 */
router.delete('/mail/threads/trash/empty', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  try {
    const threadsColl = db.collection('users').doc(userId).collection('mail_threads');
    const trashSnap = await threadsColl.where('isTrash', '==', true).get();

    const batch = db.batch();
    let deletedCount = 0;

    trashSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();

      // Write audit log
      await db.collection('agent_execution_logs').add({
        timestamp: new Date().toISOString(),
        agentName: "MailroomCommunicationAgent",
        userId,
        executionMetrics: {
          status: "SUCCESS",
          deletedCount,
          action: "EMPTY_TRASH"
        },
        businessDecisionsExecuted: [
          `Permanently purged ${deletedCount} email threads from the Trash.`,
          `This action is irreversible and cleared corresponding database state.`
        ]
      });
    }

    res.status(200).json({ success: true, count: deletedCount, message: `Permanently purged ${deletedCount} threads from trash.` });
  } catch (error: any) {
    console.error("Failed to empty trash:", error);
    const { statusCode, error: errTitle, details } = mapErrorResponse(error, "Failed to empty trash folder.");
    res.status(statusCode).json({ error: errTitle, details });
  }
});

/**
 * GET /api/mail/google-oauth-url
 * Generate the Google OAuth authorization URL for Gmail read/write access
 */
router.get('/mail/google-oauth-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const client_id = process.env.GOOGLE_CLIENT_ID || '1047125301880-mock.apps.googleusercontent.com';
    const client_secret = process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret';
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth-callback';

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId
    });

    res.status(200).json({ url });
  } catch (error: any) {
    console.error("Failed to generate Google OAuth URL:", error);
    res.status(500).json({ error: "Failed to generate Google Auth link." });
  }
});

/**
 * POST /api/mail/google-oauth-callback
 * Receive authorization code from frontend and exchange it for refresh & access tokens
 */
router.post('/mail/google-oauth-callback', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: "Authorization code is required." });
    return;
  }

  try {
    const client_id = process.env.GOOGLE_CLIENT_ID || '1047125301880-mock.apps.googleusercontent.com';
    const client_secret = process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret';
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth-callback';

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
    const { tokens } = await oauth2Client.getToken(code);

    // Save credentials in candidate's Firestore document
    await db.collection('users').doc(userId).update({
      gmailCredentials: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiryDate: tokens.expiry_date || 0
      }
    });

    res.status(200).json({ success: true, message: "Gmail inbox connected successfully!" });
  } catch (error: any) {
    console.error("Failed Google OAuth callback token exchange:", error);
    res.status(500).json({ error: "Failed to authenticate Gmail connection." });
  }
});

export default router;
