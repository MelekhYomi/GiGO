import express, { Request, Response } from 'express';
import { checkSystemMailHealth } from '../utils/mailer';
import { isAuthorizedAdminEmail } from '../utils/adminAuth';

const router = express.Router();

// Real, live check of whether GiGO's email infrastructure can actually deliver
// mail right now - not just whether env vars exist. Answers the question "is
// the default mail path actually working in production" without needing
// Render dashboard access.
router.get('/admin/mail-diagnostics', async (req: Request, res: Response) => {
  const adminEmail = req.query.adminEmail as string | undefined;
  if (!(await isAuthorizedAdminEmail(adminEmail))) {
    res.status(403).json({ error: "Unauthorized." });
    return;
  }

  const systemMail = await checkSystemMailHealth();

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleOAuthConfigured = !!googleClientId && !!googleClientSecret
    && !googleClientId.includes('mock') && !googleClientSecret.includes('mock');

  const zapierConfigured = !!process.env.ZAPIER_WEBHOOK_URL;

  res.status(200).json({
    gigoSystemMailbox: {
      configured: systemMail.configured,
      verified: systemMail.verified,
      fromAddress: systemMail.fromAddress,
      error: systemMail.error,
      summary: systemMail.verified
        ? `Working — real emails send from ${systemMail.fromAddress}.`
        : systemMail.configured
          ? `Credentials are set but authentication failed: ${systemMail.error}`
          : 'Not configured — GIGO_SYSTEM_SMTP_USER/PASS are unset. Every candidate who has not connected their own Gmail is currently falling back to simulated (non-delivered) dispatch.'
    },
    googleOAuth: {
      configured: googleOAuthConfigured,
      summary: googleOAuthConfigured
        ? 'Real Google OAuth credentials are set — candidates can connect their own Gmail.'
        : 'GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are missing or still the mock placeholder — the "Connect Gmail" flow cannot work for any candidate right now.'
    },
    platformDefaultZapierWebhook: {
      configured: zapierConfigured,
      summary: zapierConfigured
        ? 'A platform-level ZAPIER_WEBHOOK_URL fallback is set.'
        : 'No platform-level Zapier webhook set — this is fine, since Zapier is meant to be configured per-candidate in Settings, not platform-wide.'
    }
  });
});

export default router;
