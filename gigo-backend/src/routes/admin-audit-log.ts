import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { isAuthorizedAdminEmail } from '../utils/adminAuth';

const router = express.Router();

// Real, persisted admin action audit log — replaces what used to be purely
// client-side React state seeded with fabricated example entries and a
// Math.random()-generated fake IP on every new entry (labeled "Non-repudiable
// logs" in the UI despite resetting on every page refresh). Real IP is
// captured server-side from the actual request.
router.post('/admin/audit-log', async (req: Request, res: Response) => {
  const { adminEmail, action, details } = req.body;
  if (!(await isAuthorizedAdminEmail(adminEmail))) {
    res.status(403).json({ error: "Unauthorized." });
    return;
  }
  if (!action || !details) {
    res.status(400).json({ error: "action and details are required." });
    return;
  }

  try {
    const realIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'unknown';
    const docRef = await db.collection('admin_audit_logs').add({
      timestamp: new Date().toISOString(),
      adminEmail,
      action,
      details,
      ip: realIp
    });
    res.status(201).json({ success: true, id: docRef.id });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to record audit log entry.", details: error.message });
  }
});

router.get('/admin/audit-log', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('admin_audit_logs').orderBy('timestamp', 'desc').limit(200).get();
    res.status(200).json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch audit log.", details: error.message });
  }
});

export default router;
