import { db } from '../firebase-config';

// The NIN "scan" itself is currently pure client-side theater (fake progress bar,
// no real OCR/verification call) - but the 80%-of-bonus lock it gates is real. When
// this global toggle is on, every candidate's full wallet balance is spendable
// regardless of isNINVerified, so friction in that flow (or the underlying Gemini
// issues motivating the toggle) never blocks a real paying candidate.
export async function isNINLockDisabled(): Promise<boolean> {
  try {
    const doc = await db.collection('system_configs').doc('global').get();
    return !!doc.data()?.ninLockDisabled;
  } catch {
    return false;
  }
}
