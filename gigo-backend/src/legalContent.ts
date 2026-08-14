// Default legal document text, seeded into system_configs/legal on first read and
// editable thereafter from the Admin Cockpit's System Control tab without a
// redeploy. Drafted to reflect what GiGO actually does — reviewed for accuracy
// against real features, not boilerplate — but this is an AI-assisted draft and
// should get a real legal review (particularly for NDPR/GDPR-equivalent
// obligations) before being relied on as a final compliance document.

export const DEFAULT_TERMS_OF_SERVICE = `# GiGO Terms of Service

**Last updated: August 14, 2026**

## 1. Acceptance of Terms
By creating a GiGO account, you agree to these Terms of Service ("Terms"). If you do not agree, do not use GiGO.

## 2. What GiGO Is
GiGO is an AI-native career platform. Depending on the features you use, GiGO may:
- Discover job listings from third-party job boards and other public sources.
- Use AI (including Google's Gemini API) to generate CVs, cover letters, and portfolios tailored to specific job postings, based on the career information you provide.
- With "Autopilot" enabled, automatically send job application emails to employers **on your behalf, without your manual review of each individual application**.
- Process voice recordings you provide during onboarding to extract profile information.
- Maintain a wallet funded via Paystack for platform fees.
- Provide an AI chat assistant ("AI Coach" / "Mind Clone") that references your profile data to answer career questions.

## 3. Eligibility
You must be of legal working age in your country of residence to use GiGO. By registering, you certify that this is true.

## 4. Your Account
You are responsible for keeping your login credentials secure and for all activity under your account. Notify us immediately if you suspect unauthorized access.

## 5. Autonomous Application Agent — Please Read Carefully
If you enable Autopilot / automatic application mode, GiGO's AI agent will independently:
- Select job postings it determines match your profile.
- Generate a CV, cover letter, and (where required) a portfolio using your real profile data.
- Send these directly to the employer's application email address or contact, using your name and identity.

This happens **without a human at GiGO, or you, reviewing each individual application before it is sent.** You can review everything the agent has generated and sent from your Documents archive and Mailroom at any time. You are responsible for keeping your profile information accurate, since the agent uses it verbatim. You can switch to manual mode at any time in Settings, which requires your explicit approval before any application is sent.

## 6. Fees and Payments
Certain features (AI-generated CVs, cover letters, portfolios, and automated applications) consume wallet balance funded via Paystack. Prices are shown before you incur a charge. New accounts may receive a promotional signup credit; some promotional credit may be locked until identity verification (NIN) is completed. Wallet charges for services already rendered (e.g., a document that has been generated) are non-refundable, since the AI generation work has already been performed.

## 7. Your Content
You retain ownership of the personal, career, and profile information you provide. You grant GiGO a license to use this information solely to provide the Service (matching, document generation, sending applications, chat responses). See our Privacy Policy for how this data is handled.

## 8. Third-Party Job Listings
Job listings are sourced from third-party job boards and APIs. GiGO does not control, verify, or guarantee the accuracy, legitimacy, or continued availability of any listing. You apply to positions at your own discretion.

## 9. Prohibited Conduct
You agree not to: provide false identity or credential information; use GiGO's automated application agent to spam employers with irrelevant or bad-faith applications; attempt to access another user's account or GiGO's internal systems without authorization; or use the Service for any unlawful purpose.

## 10. Disclaimers
GiGO does not guarantee that you will receive interviews, offers, or employment. AI-generated content (CVs, cover letters, portfolios, chat responses) is provided "as is" — while GiGO's agents are instructed to ground all generated content in your real, verified profile data and never invent employers, degrees, or achievements, you should review generated documents for accuracy before relying on them.

## 11. Limitation of Liability
To the maximum extent permitted by law, GiGO is not liable for indirect, incidental, or consequential damages arising from your use of the Service, including outcomes of job applications sent by the autonomous agent.

## 12. Termination
You may close your account at any time from Settings. GiGO may suspend or terminate accounts that violate these Terms.

## 13. Changes to These Terms
We may update these Terms from time to time. Material changes will be reflected in the "Last updated" date above. Continued use of GiGO after changes take effect constitutes acceptance.

## 14. Governing Law
These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles, except where local law requires otherwise for users located elsewhere.

## 15. Contact
Questions about these Terms can be directed to the GiGO support channel listed in the app.`;

export const DEFAULT_PRIVACY_POLICY = `# GiGO Privacy Policy

**Last updated: August 14, 2026**

## 1. Introduction
This Privacy Policy explains what personal data GiGO collects, why, and how it's used. GiGO acts as the data controller for the information described here.

## 2. What We Collect
- **Identity data**: full name, email, phone number, and (optionally) National Identification Number (NIN) for account verification.
- **Career data**: education history, work history, skills, target roles, career goals, professional summary, and any documents you upload.
- **Voice recordings**: audio you provide during voice onboarding and calibration, used to extract profile information via Google's Gemini API. Recordings are processed for transcription/extraction; we do not use them for any purpose beyond building and refining your profile.
- **Financial data**: wallet balance and transaction history. Card and payment details are handled directly by Paystack — GiGO does not store your raw card information.
- **Generated content**: CVs, cover letters, and portfolios GiGO's AI creates on your behalf, which necessarily contain the career data above.
- **Uploaded identity documents**: e.g., a photo of your NIN card, used solely for verification.
- **Usage data**: standard technical data (device, browser, approximate access times) needed to operate and secure the Service.

## 3. How We Use Your Data
- To match you with relevant job opportunities.
- To generate tailored CVs, cover letters, and portfolios for specific job applications.
- To send job applications on your behalf when Autopilot is enabled.
- To power the AI Coach / Mind Clone chat, which references your profile to answer your questions.
- To process wallet top-ups and service charges via Paystack.
- To send you account and application-related notifications.
- With your separate, explicit consent: to use testimonials, reviews, or feedback you provide in GiGO's own marketing materials. This consent is optional, off by default, and can be withdrawn at any time in Settings.

## 4. AI Processing and Third Parties
To provide the Service, relevant parts of your data are shared with:
- **Google (Gemini API)**: career data, job posting data, and voice recordings are sent to Google's Gemini API to generate documents, extract profile information, and power chat features, subject to Google's own API terms.
- **Paystack**: payment information necessary to process wallet top-ups.
- **Email providers (SMTP/Gmail, or GiGO's own system mailbox)**: used to send job applications on your behalf, once you've enabled that feature.
- **Job board APIs** (e.g., RemoteOK, The Muse, Arbeitnow, and any sources an administrator has added): we pull public job listing data *from* these sources. We do not send your personal data *to* them — the only place your identity reaches a third party is the specific employer you (or Autopilot, on your instruction) apply to.
- **WhatsApp Business API**, if configured, for notifications.

We do not sell your personal data.

## 5. Data Security
Passwords are hashed and never stored in plain text. Data is transmitted over HTTPS. Access to administrative functions is restricted to authorized GiGO personnel. As with any online service, no system is completely immune to risk, and we continue to improve our security practices as the platform matures.

## 6. Data Retention
We retain your data while your account is active. Generated documents and transaction history are kept for your own reference and for legitimate business record-keeping. You may request deletion of your account and associated data at any time; some records may be retained where required for legal, financial, or audit purposes.

## 7. Your Rights
Depending on your jurisdiction (including under Nigeria's Data Protection Act/NDPR, and comparable rights recognized elsewhere), you may have the right to: access the personal data we hold about you; correct inaccurate data; request deletion; object to or restrict certain processing; withdraw consent (e.g., for marketing use) at any time; and request a copy of your data in a portable format. To exercise these rights, contact us through the support channel listed in the app.

## 8. Children's Privacy
GiGO is not directed at individuals under the legal working age in their jurisdiction, and we do not knowingly collect data from them.

## 9. International Data Transfers
Because we use providers such as Google and Paystack, your data may be processed in countries other than your own. These providers maintain their own data protection safeguards under their respective terms.

## 10. Changes to This Policy
We may update this Privacy Policy from time to time. The "Last updated" date above reflects the most recent revision. Significant changes will be highlighted in-app.

## 11. Contact
Questions about this Privacy Policy, or requests to exercise your data rights, can be directed to the GiGO support channel listed in the app.`;
