import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { PRIMARY_ADMIN_EMAIL } from '../utils/adminAuth';

const router = express.Router();

// Only the one permanent, hardcoded super admin can grant or revoke additional
// admin access — deliberately not extended to additional admins themselves, so a
// granted account (e.g. judges@gigo.com) can never grant further admin access.
function requirePrimaryAdmin(req: Request, res: Response): boolean {
  const adminEmail = req.body?.adminEmail || req.query?.adminEmail;
  if (adminEmail !== PRIMARY_ADMIN_EMAIL) {
    res.status(403).json({ error: `Unauthorized. Only the primary super admin (${PRIMARY_ADMIN_EMAIL}) can manage admin access.` });
    return false;
  }
  return true;
}

router.get('/admin/additional-admins', async (req: Request, res: Response) => {
  if (!requirePrimaryAdmin(req, res)) return;
  try {
    const doc = await db.collection('system_configs').doc('global').get();
    res.status(200).json({ additionalAdminEmails: doc.data()?.additionalAdminEmails || [] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch additional admins.", details: error.message });
  }
});

router.post('/admin/additional-admins', async (req: Request, res: Response) => {
  if (!requirePrimaryAdmin(req, res)) return;
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: "email is required." });
    return;
  }
  const normalized = email.toLowerCase();
  if (normalized === PRIMARY_ADMIN_EMAIL) {
    res.status(400).json({ error: "That's already the primary super admin." });
    return;
  }
  try {
    const configRef = db.collection('system_configs').doc('global');
    const doc = await configRef.get();
    const current: string[] = doc.data()?.additionalAdminEmails || [];
    if (!current.includes(normalized)) {
      await configRef.set({ additionalAdminEmails: [...current, normalized] }, { merge: true });
    }
    res.status(200).json({ success: true, additionalAdminEmails: [...new Set([...current, normalized])] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to grant admin access.", details: error.message });
  }
});

router.delete('/admin/additional-admins/:email', async (req: Request, res: Response) => {
  if (!requirePrimaryAdmin(req, res)) return;
  const normalized = decodeURIComponent(req.params.email).toLowerCase();
  try {
    const configRef = db.collection('system_configs').doc('global');
    const doc = await configRef.get();
    const current: string[] = doc.data()?.additionalAdminEmails || [];
    await configRef.set({ additionalAdminEmails: current.filter(e => e !== normalized) }, { merge: true });
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to revoke admin access.", details: error.message });
  }
});

// Deletes a user account entirely (used for e.g. removing the judges@gigo.com or
// users_judges@gigo.com demo accounts after the judging period). Also strips the
// email from additionalAdminEmails if present, so a stale grant can't linger.
router.delete('/admin/users/:userId/full-delete', async (req: Request, res: Response) => {
  if (!requirePrimaryAdmin(req, res)) return;
  const { userId } = req.params;
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const email = (userDoc.data()?.email || '').toLowerCase();

    const configRef = db.collection('system_configs').doc('global');
    const configDoc = await configRef.get();
    const current: string[] = configDoc.data()?.additionalAdminEmails || [];
    if (current.includes(email)) {
      await configRef.set({ additionalAdminEmails: current.filter(e => e !== email) }, { merge: true });
    }

    await userRef.delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete user account.", details: error.message });
  }
});

export default router;
