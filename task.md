# Task List: Zapier Custom Email Automation & Inbound Thread Matching

- `[x]` **Phase 1: Support Zapier in Autopilot Agent (`scraper-agent.ts`)**
  - `[x]` Add a check for `mailBackend === 'zapier'` during the background apply phase.
  - `[x]` Construct and POST the complete candidate payload, cover letter, and tailored CV to `zapierWebhookUrl`.
  - `[x]` Update internal state logs to log successful Zapier autopilot dispatch.
- `[x]` **Phase 2: Dynamic Email-based Profile Lookup in Inbound Webhook (`mailroom.ts`)**
  - `[x]` Refactor the `/api/zapier/inbound-reply` route to accept `recipientEmail` as an alternative identifier.
  - `[x]` Query the Firestore `users` collection by the `recipientEmail` field to resolve the corresponding `userId` automatically.
  - `[x]` Maintain absolute backward compatibility for clients passing explicit `userId`.
- `[x]` **Phase 3: Verification & Compilation**
  - `[x]` Run `npm run build` inside `gigo-backend` to ensure type-safety and compiling success.
  - `[x]` Validate and test the integration to ensure perfect execution flow.
