import { db } from '../firebase-config';

// The one permanent, hardcoded super admin — cannot be removed or toggled off.
export const PRIMARY_ADMIN_EMAIL = 'admin@gigo.com';

// Checks the primary admin email plus any admin emails the primary admin has
// granted via system_configs/global.additionalAdminEmails (e.g. a judges@gigo.com
// account for hackathon review) - toggleable/removable by the primary admin at
// any time from the Admin Cockpit, without a code deploy.
export async function isAuthorizedAdminEmail(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase();
  if (normalized === PRIMARY_ADMIN_EMAIL) return true;
  try {
    const doc = await db.collection('system_configs').doc('global').get();
    const additionalAdmins: string[] = (doc.data()?.additionalAdminEmails || []).map((e: string) => e.toLowerCase());
    return additionalAdmins.includes(normalized);
  } catch {
    return false;
  }
}
