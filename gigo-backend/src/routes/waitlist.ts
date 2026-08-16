import express, { Request, Response } from 'express';
import { db } from '../firebase-config';

const router = express.Router();

// Real subscription tiers offered to waitlist candidates — a candidate's selection
// here is a genuine, self-reported willingness-to-pay signal, not revenue. This
// data must never be merged into the real P&L (financials.ts computes revenue
// exclusively from confirmed Paystack ledger entries).
export const WAITLIST_TIERS = [
  { id: 'starter', label: 'Starter', priceNGN: 5000, applicationsPerMonth: 50 },
  { id: 'growth', label: 'Growth', priceNGN: 10000, applicationsPerMonth: 120 },
  { id: 'unlimited', label: 'Unlimited', priceNGN: 20000, applicationsPerMonth: 999 },
];

// Records a waitlist candidate's real, explicit commitment: which tier they'd pay
// for once GiGO is fully live, plus honest feedback on the voice-onboarding
// experience they just went through. Called once, right after a waitlist-tagged
// candidate finishes real onboarding (voice interview + profile wizard).
router.post('/users/:userId/waitlist-commitment', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { committedTierId, voiceOnboardingFeedback, voiceOnboardingRating, isRelatedParty } = req.body;

  if (!committedTierId || !WAITLIST_TIERS.some(t => t.id === committedTierId)) {
    res.status(400).json({ error: "committedTierId must be one of: " + WAITLIST_TIERS.map(t => t.id).join(', ') });
    return;
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const tier = WAITLIST_TIERS.find(t => t.id === committedTierId)!;
    await userRef.update({
      waitlistCommittedTierId: committedTierId,
      waitlistCommittedPriceNGN: tier.priceNGN,
      voiceOnboardingFeedback: voiceOnboardingFeedback || '',
      voiceOnboardingRating: typeof voiceOnboardingRating === 'number' ? voiceOnboardingRating : null,
      // Same field the real P&L (financials.ts) already reads to split Independent
      // vs. Related Party revenue - self-reported here at the moment of signup,
      // rather than relying on an admin to notice and correct it later.
      isRelatedParty: !!isRelatedParty,
      waitlistCommittedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, tier });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to record waitlist commitment.", details: error.message });
  }
});

// Real, aggregated waitlist evidence for the Admin Cockpit — every number here is
// computed directly from actual waitlist signups, nothing simulated.
router.get('/admin/waitlist', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('users').where('isWaitlist', '==', true).get();
    const candidates = snapshot.docs.map(d => {
      const data = d.data();
      return {
        userId: d.id,
        fullName: data.fullName,
        email: data.email,
        skills: data.skills || [],
        yearsOfExperience: data.yearsOfExperience || 0,
        waitlistCommittedTierId: data.waitlistCommittedTierId || null,
        waitlistCommittedPriceNGN: data.waitlistCommittedPriceNGN || null,
        voiceOnboardingFeedback: data.voiceOnboardingFeedback || '',
        voiceOnboardingRating: data.voiceOnboardingRating ?? null,
        joinedAt: data.createdAt || null,
        committedAt: data.waitlistCommittedAt || null
      };
    });

    const withCommitment = candidates.filter(c => c.waitlistCommittedPriceNGN);
    const totalCommittedMonthlyNGN = withCommitment.reduce((sum, c) => sum + (c.waitlistCommittedPriceNGN || 0), 0);
    const avgCommittedPriceNGN = withCommitment.length ? Math.round(totalCommittedMonthlyNGN / withCommitment.length) : 0;

    const tierBreakdown: Record<string, number> = {};
    for (const c of withCommitment) {
      if (c.waitlistCommittedTierId) {
        tierBreakdown[c.waitlistCommittedTierId] = (tierBreakdown[c.waitlistCommittedTierId] || 0) + 1;
      }
    }

    const ratings = candidates.map(c => c.voiceOnboardingRating).filter((r): r is number => r !== null);
    const avgVoiceRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

    res.status(200).json({
      totalSignups: candidates.length,
      totalWithCommitment: withCommitment.length,
      totalCommittedMonthlyNGN,
      avgCommittedPriceNGN,
      tierBreakdown,
      avgVoiceRating,
      candidates
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch waitlist data.", details: error.message });
  }
});

router.get('/waitlist/tiers', (req: Request, res: Response) => {
  res.status(200).json(WAITLIST_TIERS);
});

// Public, aggregate-only stats for the landing page — real counts, but never any
// PII. Uses count() aggregation so it doesn't read full documents.
router.get('/public/stats', async (req: Request, res: Response) => {
  try {
    const [waitlistCount, jobsCount, documentsCount] = await Promise.all([
      db.collection('users').where('isWaitlist', '==', true).count().get(),
      db.collection('discovered_jobs').count().get(),
      db.collectionGroup('documents').count().get()
    ]);

    res.status(200).json({
      waitlistSignups: waitlistCount.data().count,
      jobsDiscovered: jobsCount.data().count,
      documentsGenerated: documentsCount.data().count
    });
  } catch (error: any) {
    console.error("Failed to compute public stats:", error);
    res.status(200).json({ waitlistSignups: 0, jobsDiscovered: 0, documentsGenerated: 0 });
  }
});

export default router;
