import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { isAuthorizedAdminEmail } from '../utils/adminAuth';
import { computeDocumentUploadStatus } from '../utils/geminiHealth';

const router = express.Router();

// Public — the frontend checks this to decide whether to show the "Upload your
// own CV/cover letter" button, either because the admin forced it on/off, or
// (in auto mode) because Gemini's last document-generation attempt failed.
router.get('/document-upload/status', async (req: Request, res: Response) => {
  const status = await computeDocumentUploadStatus();
  res.status(200).json(status);
});

// mode: 'auto' (default - follows Gemini health automatically), 'on' (always
// show, regardless of Gemini health), or 'off' (always hide).
router.put('/admin/document-upload/force-mode', async (req: Request, res: Response) => {
  const { adminEmail, mode } = req.body;
  if (!(await isAuthorizedAdminEmail(adminEmail))) {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can change this setting." });
    return;
  }
  if (!['auto', 'on', 'off'].includes(mode)) {
    res.status(400).json({ error: "mode must be one of: auto, on, off." });
    return;
  }
  try {
    await db.collection('system_configs').doc('global').set({
      documentUploadForceMode: mode === 'auto' ? null : mode
    }, { merge: true });
    const status = await computeDocumentUploadStatus();
    res.status(200).json({ success: true, mode, status });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update document upload setting.", details: error.message });
  }
});

// Lets a candidate upload a CV/cover letter/portfolio file they already have,
// instead of generating one with AI - for when Gemini is down, or the admin
// just wants this available. No Gemini call, no wallet charge, stored exactly
// like a generated document (JPEG preview is skipped since the source file is
// already whatever format the candidate uploaded).
router.post('/users/:userId/documents/upload', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { assetType, fileBase64, fileName, mimeType, jobTitle, companyName, jobId } = req.body;

  const type = assetType || 'CV';
  if (!['COVER_LETTER', 'CV', 'PORTFOLIO'].includes(type)) {
    res.status(400).json({ error: "Invalid assetType. Supported types: 'COVER_LETTER', 'CV', 'PORTFOLIO'." });
    return;
  }
  if (!fileBase64 || !fileName) {
    res.status(400).json({ error: "fileBase64 and fileName are required." });
    return;
  }
  // Roughly caps at ~5.5MB decoded, generous for a CV/cover letter/portfolio PDF.
  if (fileBase64.length > 7_500_000) {
    res.status(400).json({ error: "File is too large — please upload a file under 5MB." });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const docId = `doc_${Date.now()}`;
    await userRef.collection('documents').doc(docId).set({
      id: docId,
      type,
      jobTitle: jobTitle || '',
      companyName: companyName || '',
      jobId: jobId || null,
      fileBase64,
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      source: 'uploaded',
      generatedAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, documentId: docId, message: `${type.replace('_', ' ')} uploaded to your archive.` });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save uploaded document.", details: error.message });
  }
});

export default router;
