import nodemailer from 'nodemailer';

/**
 * GiGO Mail: a single system-owned mailbox (Gmail App Password or any SMTP account)
 * that sends on behalf of every candidate using the default "GiGO Mail" backend.
 * Requires zero per-user setup (no Zapier Zap, no OAuth consent screen) — just one
 * credential configured once by the GiGO operator.
 *
 * Configure via env vars:
 *   GIGO_SYSTEM_SMTP_HOST (default smtp.gmail.com)
 *   GIGO_SYSTEM_SMTP_PORT (default 587)
 *   GIGO_SYSTEM_SMTP_USER (the sending mailbox address)
 *   GIGO_SYSTEM_SMTP_PASS (a Gmail "App Password", or the account's SMTP password)
 */
export function getSystemMailTransport(): { transporter: import('nodemailer').Transporter; fromAddress: string } | null {
  const host = process.env.GIGO_SYSTEM_SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.GIGO_SYSTEM_SMTP_PORT || '587', 10);
  const user = process.env.GIGO_SYSTEM_SMTP_USER;
  const pass = process.env.GIGO_SYSTEM_SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return { transporter, fromAddress: user };
}

export interface SendGigoMailParams {
  candidateName: string;
  candidateEmail: string;
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: string }[];
}

/**
 * Sends an email through the shared GiGO system mailbox, with Reply-To set to the
 * candidate's own address so recruiter replies land in the candidate's real inbox.
 * Returns null if no system mailbox is configured (caller should fall back to simulation).
 */
export async function sendViaGigoSystemMail(params: SendGigoMailParams) {
  const system = getSystemMailTransport();
  if (!system) return null;

  const { transporter, fromAddress } = system;
  return transporter.sendMail({
    from: `"${params.candidateName} via GiGO" <${fromAddress}>`,
    replyTo: params.candidateEmail || fromAddress,
    to: params.to,
    subject: params.subject,
    text: params.text,
    attachments: params.attachments
  });
}
