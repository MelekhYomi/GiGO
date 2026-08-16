import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { fetchGenericJobSource } from '../scraper-agent';
import { isAuthorizedAdminEmail } from '../utils/adminAuth';

const router = express.Router();

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const adminEmail = req.body?.adminEmail || req.query?.adminEmail;
  if (!(await isAuthorizedAdminEmail(adminEmail))) {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can manage job sources." });
    return false;
  }
  return true;
}

// Built-in sources are hardcoded in scraper-agent.ts (RemoteOK, The Muse, Arbeitnow)
// since they need source-specific parsing quirks; shown here as read-only reference
// alongside the admin-configurable ones so the Cockpit shows the full real picture.
const BUILT_IN_SOURCES = [
  { id: 'remoteok', name: 'RemoteOK', apiUrl: 'https://remoteok.com/api', builtIn: true, coverage: 'Remote only' },
  { id: 'themuse', name: 'The Muse', apiUrl: 'https://www.themuse.com/api/public/jobs', builtIn: true, coverage: 'Remote, Onsite' },
  { id: 'arbeitnow', name: 'Arbeitnow', apiUrl: 'https://www.arbeitnow.com/api/job-board-api', builtIn: true, coverage: 'Remote, Onsite' },
];

router.get('/admin/job-sources', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('job_sources').orderBy('createdAt', 'desc').get();
    const configured = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.status(200).json({ builtIn: BUILT_IN_SOURCES, configured });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch job sources.", details: error.message });
  }
});

router.post('/admin/job-sources', async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const { name, apiUrl, resultsPath, fieldMap } = req.body;

  if (!name || !apiUrl || !fieldMap?.company || !fieldMap?.title) {
    res.status(400).json({ error: "name, apiUrl, fieldMap.company, and fieldMap.title are required." });
    return;
  }

  try {
    const docRef = await db.collection('job_sources').add({
      name,
      apiUrl,
      resultsPath: resultsPath || '',
      fieldMap: {
        company: fieldMap.company,
        title: fieldMap.title,
        location: fieldMap.location || null,
        url: fieldMap.url || null,
        description: fieldMap.description || null,
        postedAt: fieldMap.postedAt || null,
        remoteFlag: fieldMap.remoteFlag || null,
        remoteKeywordCheck: !!fieldMap.remoteKeywordCheck,
      },
      enabled: true,
      createdAt: new Date().toISOString(),
      createdBy: req.body.adminEmail
    });
    res.status(201).json({ success: true, id: docRef.id });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add job source.", details: error.message });
  }
});

router.post('/admin/job-sources/:id/toggle', async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  const { enabled } = req.body;
  try {
    await db.collection('job_sources').doc(req.params.id).update({ enabled: !!enabled });
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to toggle job source.", details: error.message });
  }
});

router.delete('/admin/job-sources/:id', async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    await db.collection('job_sources').doc(req.params.id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete job source.", details: error.message });
  }
});

// Lets the admin test a new source's field mapping immediately instead of waiting
// for the next scheduled sweep.
router.post('/admin/job-sources/:id/run-now', async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;
  try {
    const docSnap = await db.collection('job_sources').doc(req.params.id).get();
    if (!docSnap.exists) {
      res.status(404).json({ error: "Job source not found." });
      return;
    }
    const storedCount = await fetchGenericJobSource({ id: docSnap.id, ...docSnap.data() });
    res.status(200).json({ success: true, storedCount });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to run job source.", details: error.message });
  }
});

export default router;
