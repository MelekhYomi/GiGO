const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} users to seed...`);
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const userEmail = userData.email || 'alex.carter@gmail.com';
    const userFullName = userData.fullName || 'Alex Carter';

    console.log(`Seeding data for user ${userFullName} (${userId})...`);

    // 1. Seed or update wallet balance so they have funds to test emails/document compilations
    await db.collection('users').doc(userId).set({
      financials: {
        walletBalanceNGN: 15000.00,
        walletBalanceUSD: 150.00,
        lastTopUpTimestamp: new Date().toISOString()
      }
    }, { merge: true });

    // 2. Seed a couple of beautiful, realistic mail threads
    const threadsRef = db.collection('users').doc(userId).collection('mail_threads');
    
    // Check if threads already exist, if so we don't overwrite completely unless specified
    const existingThreads = await threadsRef.get();
    if (existingThreads.size === 0) {
      console.log(`  -> Seeding 3 rich mail threads...`);

      // Thread 1: Pending response (perfect for "Force Reply" testing!)
      const thread1Id = `thread_innovate_ai_${Date.now()}`;
      await threadsRef.doc(thread1Id).set({
        jobId: `discovered_${userId}_InnovateAISolutions_Careers_linkedin_com`,
        jobTitle: 'Lead AI Engineer, LLM & Prompt Engineering',
        companyName: 'InnovateAI Solutions',
        subject: 'Application: Lead AI Engineer - ' + userFullName,
        recipientEmail: 'careers@innovateaisolutions.com',
        recruiterName: 'Sarah Jenkins',
        status: 'pending', // Pending recruiter response
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        messages: [
          {
            id: 'msg_t1_1',
            sender: 'user',
            senderName: userFullName,
            senderEmail: userEmail,
            recipientEmail: 'careers@innovateaisolutions.com',
            body: `Dear Sarah Jenkins,\n\nI am writing to express my strong interest in the Lead AI Engineer position at InnovateAI Solutions. With over 6 years of experience building scalable AI telemetry and LLM pipelines, I am excited about the opportunity to contribute to your generative AI initiatives.\n\nAs a candidate from a remote workspace setup with high operational resilience—featuring a hybrid solar power backup and redundant Starlink + 4G LTE connections—I ensure 100% development uptime.\n\nI have attached my ATS-compiled CV and cover letter for your review. I look forward to your thoughts!\n\nBest regards,\n${userFullName}`,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      });

      // Thread 2: Replied (perfect for "AI Follow-Up" testing!)
      const thread2Id = `thread_cognito_${Date.now()}`;
      await threadsRef.doc(thread2Id).set({
        jobId: `discovered_${userId}_ai_careers_cognitodynamics_com`,
        jobTitle: 'Lead AI/ML Engineer, Generative AI',
        companyName: 'Cognito Dynamics',
        subject: 'Inquiry: Lead AI/ML Engineer Position - ' + userFullName,
        recipientEmail: 'ai-careers@cognitodynamics.com',
        recruiterName: 'David Vance',
        status: 'replied', // Recruiter replied
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        messages: [
          {
            id: 'msg_t2_1',
            sender: 'user',
            senderName: userFullName,
            senderEmail: userEmail,
            recipientEmail: 'ai-careers@cognitodynamics.com',
            body: `Dear David Vance,\n\nI hope this email finds you well. I recently submitted my application for the Lead AI/ML Engineer position. I wanted to highlight that I have extensively integrated Gemini 2.5 models and built state-ledger systems that match Cognito Dynamics' roadmap.\n\nThank you for your time,\n${userFullName}`,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg_t2_2',
            sender: 'recruiter',
            senderName: 'David Vance',
            senderEmail: 'ai-careers@cognitodynamics.com',
            recipientEmail: userEmail,
            body: `<p>Hi ${userFullName},</p><p>Thank you for reaching out! Your background scaling generative AI pipelines looks very relevant to what we are building at Cognito Dynamics.</p><p>Quick question for you: How do you handle transient latency issues or API rate limits when deploying Gemini Pro models in high-throughput enterprise systems? We deal with millions of daily API transactions and are keen to understand your diagnostic approach.</p><p>Best regards,<br>David Vance<br>Principal Recruiter</p>`,
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      });

      // Thread 3: Interview Offered (testing status milestone rendering!)
      const thread3Id = `thread_meta_${Date.now()}`;
      await threadsRef.doc(thread3Id).set({
        jobId: `discovered_${userId}_meta_careers`,
        jobTitle: 'Senior Fullstack Specialist',
        companyName: 'Meta Solutions Inc.',
        subject: 'Interview Scheduling - Senior Fullstack Specialist',
        recipientEmail: 'hiring-team@metasolutions.com',
        recruiterName: 'Meta Recruiting',
        status: 'interview_offered', // Interview offered
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        messages: [
          {
            id: 'msg_t3_1',
            sender: 'user',
            senderName: userFullName,
            senderEmail: userEmail,
            recipientEmail: 'hiring-team@metasolutions.com',
            body: `Hello Meta Recruiting Team,\n\nI am writing to apply for the Senior Fullstack Specialist vacancy. My core skills include React, TypeScript, Express, and distributed architectures.\n\nRegards,\n${userFullName}`,
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg_t3_2',
            sender: 'recruiter',
            senderName: 'Meta Recruiting',
            senderEmail: 'hiring-team@metasolutions.com',
            recipientEmail: userEmail,
            body: `<p>Hi ${userFullName},</p><p>Thanks for applying! We are incredibly impressed by your profile and your setup specs. We'd love to schedule a 30-minute virtual technical panel next week.</p><p>Please let us know if either of these slots works for you:</p><ul><li>Option A: next Tuesday at 2:00 PM GMT+1</li><li>Option B: next Wednesday at 10:00 AM GMT+1</li></ul><p>We look forward to connecting!</p><p>Best,<br>The Meta Solutions Hiring Team</p>`,
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      });

      // 3. Seed corresponding Kanban tasks in the user's ledger or Kanban collection!
      // Wait, where are Kanban tasks stored? Let's check how they are stored in Firestore or if they are fetched from 'ledger'.
      // Actually, let's look at where Kanban tasks are defined. The code in mailroom.ts mentions:
      // // Find kanban card matching job title and company
      // // const kanbanSnap = await db.collection('users').doc(userId).collection('ledger').get();
      // Let's write a quick script or check what subcollections exist for a user.
    } else {
      console.log(`  -> User already has threads. Skipping thread seeding.`);
    }
  }
}
run().catch(console.error);
