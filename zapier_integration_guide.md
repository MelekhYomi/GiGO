# Setup Guide: Closed-Loop Zapier & Gmail Automation on GiGO

This guide walks you through setting up the automated email loops so that **GiGO Mailroom becomes your primary career communication center**. You will send job applications and receive recruiter replies directly inside GiGO, powered under the hood by your actual Gmail account via **Zapier**.

---

## ⚡ Architectural Concept

When you trigger a job application (or let the GiGO Autopilot Scraper run in the background), GiGO compiles your custom ATS-optimized resume, bespoke cover letter, and recruiters' contact information, and hands them off to Zapier. 

Zapier then dispatches the email directly from your personal Gmail address. When a recruiter replies, Zapier intercepts the reply and posts it back to GiGO, which classifies the message sentiment, logs it inside your Mailroom thread, and triggers verbal practice interview prep.

```
       🌐 GiGO COCKPIT
      ┌────────────────────────┐
      │  Mailroom Tab / Inbox  │◄──────────────┐
      └───────────┬────────────┘               │
                  │                            │
                  │ (1) Outbound Webhook       │ (4) Inbound Webhook
                  ▼                            │
      ┌────────────────────────┐      ┌────────┴───────────────┐
      │  Zapier Outbound Zap   │      │   Zapier Inbound Zap   │
      └───────────┬────────────┘      └────────▲───────────────┘
                  │                            │
                  │ (2) Real Gmail Dispatch    │ (3) Recruiter Reply
                  ▼                            │
      ┌────────────────────────┐      ┌────────┴───────────────┐
      │   Recruiter Inbox      │──────►│  Candidate Gmail Inbox │
      └────────────────────────┘      └────────────────────────┘
```

---

## 📤 Part 1: Setting up Outbound Applications (GiGO ➔ Zapier ➔ Gmail)

This Zap captures job applications generated on GiGO (both manual clicks and autopilot background dispatches) and sends them using your real Gmail address.

### Step 1: Create a New Zap
1. Log in to [Zapier](https://zapier.com) and click **Create Zap**.
2. Name your Zap: `GiGO Outbound Application Dispatcher`.

### Step 2: Configure the Trigger
1. Select **Webhooks by Zapier** as the trigger app.
2. Choose **Catch Hook** as the Event. Click **Continue**.
3. Skip the "Child Key" setting and click **Continue**.
4. Zapier will provide a unique **Webhook URL** (e.g. `https://hooks.zapier.com/hooks/catch/...`).
5. **Copy this URL**.

### Step 3: Connect to GiGO Settings
1. Go to your **GiGO Platform Dashboard** Settings section.
2. Change your **Email Delivery Preference** to **Zapier Setup**.
3. Paste the copied URL into the **Zapier Catch Webhook URL** field and click **Save Settings**.
4. To test, trigger an application write-up on GiGO (e.g., click *"✨ Write Cover Letter"* on an inbox job and proceed to send). GiGO will dispatch a high-fidelity test payload to your webhook.
5. In Zapier, click **Test trigger** to verify the payload is successfully captured.

### Step 4: Configure the Action
1. Select **Gmail** as the action app.
2. Choose **Send Email** as the Event. Click **Continue**.
3. Connect and authorize your personal Gmail account.
4. Set up the email template fields by mapping them to the captured Webhook data:
   - **To**: Select `to` (the recruiter's email).
   - **Subject**: Select `subject` (the generated ATS email subject).
   - **Body Type**: Choose `Plain`.
   - **Body**: Select `body` (the compiled email body containing your cover letter and signature).
   - **From Name**: Map to `candidateName`.
   - **Attachments**: Map to `attachments` ➔ `content` (Zapier Gmail action accepts files sent in the attachments array automatically).
5. Click **Test & Continue**, verify the test email is delivered, and then **Publish the Zap**!

---

## 📥 Part 2: Setting up Inbound Replies (Recruiter ➔ Gmail ➔ Zapier ➔ GiGO)

This Zap listens for recruiter responses in your Gmail account and syncs them instantly back into your GiGO Mailroom threads.

### Step 1: Create a New Zap
1. Click **Create Zap** in Zapier.
2. Name your Zap: `GiGO Inbound Recruiter Reply Sync`.

### Step 2: Configure the Trigger
1. Select **Gmail** as the trigger app.
2. Choose **New Reply in Thread** or **New Email Matching Search** as the Event. Click **Continue**.
3. Connect your Gmail account.
4. (Optional) For **Search String**, enter query terms to limit triggers to recruiter threads, such as: `subject:(application OR interview OR recruiter OR hiring OR job)`.
5. Click **Test trigger** to fetch a recent email reply.

### Step 3: Configure the Action
1. Select **Webhooks by Zapier** as the action app.
2. Choose **POST** as the Event. Click **Continue**.
3. Configure the webhook parameters:
   - **URL**: Paste GiGO's inbound endpoint (visible in the Mailroom setup tab once you're logged in — it's `<your-gigo-backend-url>/api/zapier/inbound-reply`):
     ```text
     https://<your-gigo-backend-url>/api/zapier/inbound-reply
     ```
   - **Payload Type**: Choose `json`.
   - **Data**: Map the matching keys exactly:
     - `recipientEmail`: Map to the recipient address of the email (your own Gmail address). *GiGO will automatically use this to find your profile and verify your account.*
     - `senderEmail`: Map to the recruiter's email address (from `From` field).
     - `senderName`: Map to the recruiter's name (or `From` name).
     - `subject`: Map to the email subject.
     - `body`: Map to the plain or HTML body of the recruiter's email.
   - **Headers**: Leave blank (no custom authentication headers are required).
4. Click **Test action** and send the request.
5. In your GiGO dashboard, refresh your Mailroom. You will see the incoming thread update, the AI agent classify the sentiment, and if an interview is offered, a custom practice session is created instantly!
6. **Publish the Zap** to complete the automation!

---

> [!TIP]
> **Why this Closed Loop is powerful:**
> Under this model, you bypass all browser-extension automation restrictions. Your applications are delivered natively via Google's secure APIs, maximizing deliverability, while keeping your entire job search centralized in one gorgeous, unified, zero-overhead cockpit.
