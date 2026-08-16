import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { markdownToJpegBuffer } from '../utils/imageGenerator';
import { isAuthorizedAdminEmail } from '../utils/adminAuth';

const router = express.Router();

// Public — the frontend checks this before offering the "write it yourself" option.
router.get('/manual-fallback/status', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('system_configs').doc('global').get();
    res.status(200).json({ enabled: !!doc.data()?.manualFallbackEnabled });
  } catch (error: any) {
    res.status(200).json({ enabled: false });
  }
});

router.put('/admin/manual-fallback/toggle', async (req: Request, res: Response) => {
  const { adminEmail, enabled } = req.body;
  if (!(await isAuthorizedAdminEmail(adminEmail))) {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can change this setting." });
    return;
  }
  try {
    await db.collection('system_configs').doc('global').set({ manualFallbackEnabled: !!enabled }, { merge: true });
    res.status(200).json({ success: true, enabled: !!enabled });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update manual fallback setting.", details: error.message });
  }
});

// Lets a candidate submit their own hand-written CV/cover letter/portfolio when
// AI generation is unavailable (quota exhausted, admin disabled it, etc). No
// Gemini call, no wallet charge — the candidate did the work themselves.
router.post('/users/:userId/documents/manual', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { assetType, content, jobTitle, companyName, jobId } = req.body;

  const type = assetType || 'COVER_LETTER';
  if (!['COVER_LETTER', 'CV', 'PORTFOLIO'].includes(type)) {
    res.status(400).json({ error: "Invalid assetType. Supported types: 'COVER_LETTER', 'CV', 'PORTFOLIO'." });
    return;
  }
  if (!content || typeof content !== 'string' || content.trim().length < 20) {
    res.status(400).json({ error: "Document content is required and must be at least 20 characters." });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    let jpegBase64: string | null = null;
    try {
      const jpegBuffer = await markdownToJpegBuffer(content);
      jpegBase64 = jpegBuffer.toString('base64');
    } catch (imgErr) {
      console.warn(`Failed to generate JPEG preview for manual ${type}:`, imgErr);
    }

    const docId = `doc_${Date.now()}`;
    await userRef.collection('documents').doc(docId).set({
      id: docId,
      type,
      jobTitle: jobTitle || '',
      companyName: companyName || '',
      jobId: jobId || null,
      content,
      jpegBase64,
      source: 'manual',
      generatedAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, documentId: docId, message: `${type.replace('_', ' ')} saved to your archive.` });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save manual document.", details: error.message });
  }
});

// Same admin-toggle pattern as manual fallback above, for the Gemini-powered
// auto-apply decision gate in scraper-agent.ts. Kept in this file rather than a new
// one since it's the same tiny shape (public status read + admin-gated toggle).
router.get('/ai-auto-apply-gate/status', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('system_configs').doc('global').get();
    res.status(200).json({ enabled: !!doc.data()?.aiAutoApplyGateEnabled });
  } catch (error: any) {
    res.status(200).json({ enabled: false });
  }
});

router.put('/admin/ai-auto-apply-gate/toggle', async (req: Request, res: Response) => {
  const { adminEmail, enabled } = req.body;
  if (!(await isAuthorizedAdminEmail(adminEmail))) {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can change this setting." });
    return;
  }
  try {
    await db.collection('system_configs').doc('global').set({ aiAutoApplyGateEnabled: !!enabled }, { merge: true });
    res.status(200).json({ success: true, enabled: !!enabled });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update AI auto-apply gate setting.", details: error.message });
  }
});

// Same toggle pattern again, for bypassing the NIN-verification 80%-of-bonus
// wallet lock platform-wide (see utils/ninLock.ts for why).
router.get('/nin-lock/status', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('system_configs').doc('global').get();
    res.status(200).json({ disabled: !!doc.data()?.ninLockDisabled });
  } catch (error: any) {
    res.status(200).json({ disabled: false });
  }
});

router.put('/admin/nin-lock/toggle', async (req: Request, res: Response) => {
  const { adminEmail, disabled } = req.body;
  if (!(await isAuthorizedAdminEmail(adminEmail))) {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can change this setting." });
    return;
  }
  try {
    await db.collection('system_configs').doc('global').set({ ninLockDisabled: !!disabled }, { merge: true });
    res.status(200).json({ success: true, disabled: !!disabled });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update NIN lock setting.", details: error.message });
  }
});

export default router;
