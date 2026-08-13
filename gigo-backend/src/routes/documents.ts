import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { markdownToJpegBuffer } from '../utils/imageGenerator';

const router = express.Router();

router.get('/users/:userId/documents', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('users').doc(req.params.userId).collection('documents')
      .orderBy('generatedAt', 'desc').get();
    // jpegBase64 is large — omit from the list response, fetched separately per-document.
    const docs = snapshot.docs.map(d => {
      const data = d.data();
      const { jpegBase64, ...rest } = data;
      return { ...rest, hasPreview: !!jpegBase64 };
    });
    res.status(200).json(docs);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch documents.", details: error.message });
  }
});

// Real, existing archive documents that could be reused for a new, similarly-titled
// role — matched on shared keywords in the job title, not exact string equality.
router.get('/users/:userId/documents/similar', async (req: Request, res: Response) => {
  const { type, jobTitle } = req.query as { type?: string; jobTitle?: string };
  if (!type || !jobTitle) {
    res.status(400).json({ error: "type and jobTitle query params are required." });
    return;
  }
  try {
    const snapshot = await db.collection('users').doc(req.params.userId).collection('documents')
      .where('type', '==', type).orderBy('generatedAt', 'desc').get();

    const targetWords = new Set(jobTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const matches = snapshot.docs
      .map(d => { const { jpegBase64, ...rest } = d.data(); return rest; })
      .filter((doc: any) => {
        const docWords = (doc.jobTitle || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
        return docWords.some((w: string) => targetWords.has(w));
      })
      .slice(0, 5);

    res.status(200).json(matches);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to search similar documents.", details: error.message });
  }
});

// Clones an existing document's content for a new job — no AI call, no charge.
// The user can then edit it to fit the new role via PUT below.
router.post('/users/:userId/documents/:docId/reuse', async (req: Request, res: Response) => {
  const { userId, docId } = req.params;
  const { newJobTitle, newCompanyName, newJobId } = req.body;
  if (!newJobTitle || !newCompanyName) {
    res.status(400).json({ error: "newJobTitle and newCompanyName are required." });
    return;
  }
  try {
    const userRef = db.collection('users').doc(userId);
    const sourceDoc = await userRef.collection('documents').doc(docId).get();
    if (!sourceDoc.exists) {
      res.status(404).json({ error: "Source document not found." });
      return;
    }
    const sourceData = sourceDoc.data() || {};
    const newDocId = `doc_reuse_${Date.now()}`;
    await userRef.collection('documents').doc(newDocId).set({
      id: newDocId,
      type: sourceData.type,
      jobTitle: newJobTitle,
      companyName: newCompanyName,
      jobId: newJobId || null,
      content: sourceData.content,
      jpegBase64: sourceData.jpegBase64 || null,
      reusedFrom: docId,
      generatedAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, documentId: newDocId });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to reuse document.", details: error.message });
  }
});

// Edits a document's content (after reuse, or freehand) and regenerates its JPEG
// preview to match.
router.put('/users/:userId/documents/:docId', async (req: Request, res: Response) => {
  const { userId, docId } = req.params;
  const { content } = req.body;
  if (typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: "content is required." });
    return;
  }
  try {
    const docRef = db.collection('users').doc(userId).collection('documents').doc(docId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    let jpegBase64: string | null = null;
    try {
      jpegBase64 = (await markdownToJpegBuffer(content)).toString('base64');
    } catch (imgErr) {
      console.warn(`Failed to regenerate JPEG preview for ${docId}:`, imgErr);
    }
    await docRef.update({ content, jpegBase64, editedAt: new Date().toISOString() });
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update document.", details: error.message });
  }
});

// Users can only download the JPEG preview directly from their archive — the real
// .docx/.pdf files are generated and attached at actual application-send time.
router.get('/users/:userId/documents/:docId/download-jpeg', async (req: Request, res: Response) => {
  const { userId, docId } = req.params;
  try {
    const docSnap = await db.collection('users').doc(userId).collection('documents').doc(docId).get();
    if (!docSnap.exists) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    const data = docSnap.data() || {};
    if (!data.jpegBase64) {
      res.status(404).json({ error: "No JPEG preview available for this document yet." });
      return;
    }
    const buffer = Buffer.from(data.jpegBase64, 'base64');
    const filename = `${data.type || 'Document'}_${(data.jobTitle || 'GiGO').replace(/\s+/g, '_')}.jpg`;
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to download JPEG.", details: error.message });
  }
});

export default router;
