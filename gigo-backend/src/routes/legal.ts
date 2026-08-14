import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { DEFAULT_TERMS_OF_SERVICE, DEFAULT_PRIVACY_POLICY } from '../legalContent';

const router = express.Router();

// Public — anyone (including logged-out visitors on the signup form) can read
// the current legal text.
router.get('/legal', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('system_configs').doc('legal').get();
    const data = doc.data() || {};
    res.status(200).json({
      termsOfService: data.termsOfService || DEFAULT_TERMS_OF_SERVICE,
      privacyPolicy: data.privacyPolicy || DEFAULT_PRIVACY_POLICY,
      lastUpdated: data.lastUpdated || null
    });
  } catch (error: any) {
    // Even if Firestore is briefly unreachable, real users mid-signup should
    // still be able to read the terms they're agreeing to.
    res.status(200).json({
      termsOfService: DEFAULT_TERMS_OF_SERVICE,
      privacyPolicy: DEFAULT_PRIVACY_POLICY,
      lastUpdated: null
    });
  }
});

router.put('/admin/legal', async (req: Request, res: Response) => {
  const { adminEmail, termsOfService, privacyPolicy } = req.body;
  if (adminEmail !== 'admin@gigo.com') {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can edit legal documents." });
    return;
  }
  if (typeof termsOfService !== 'string' || typeof privacyPolicy !== 'string') {
    res.status(400).json({ error: "termsOfService and privacyPolicy (strings) are required." });
    return;
  }
  try {
    await db.collection('system_configs').doc('legal').set({
      termsOfService,
      privacyPolicy,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminEmail
    }, { merge: true });
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save legal documents.", details: error.message });
  }
});

export default router;
