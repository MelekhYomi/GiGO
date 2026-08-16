import { db } from '../firebase-config';

// Tracks whether the last real Gemini document-generation call succeeded or
// failed, so the "upload your own CV/cover letter" fallback button can turn
// itself on automatically when Gemini is struggling and off again once it's
// healthy - without anyone having to notice and flip a switch by hand.
const CONFIG_REF = () => db.collection('system_configs').doc('global');

export async function recordGeminiSuccess(): Promise<void> {
  try {
    await CONFIG_REF().set({ geminiHealth: { lastSuccessAt: new Date().toISOString() } }, { merge: true });
  } catch { /* best-effort telemetry, never block the real request on this */ }
}

export async function recordGeminiFailure(): Promise<void> {
  try {
    await CONFIG_REF().set({ geminiHealth: { lastFailureAt: new Date().toISOString() } }, { merge: true });
  } catch { /* best-effort telemetry, never block the real request on this */ }
}

export interface DocumentUploadStatus {
  enabled: boolean;
  reason: 'admin_forced_on' | 'admin_forced_off' | 'gemini_down' | 'gemini_healthy';
}

export async function computeDocumentUploadStatus(): Promise<DocumentUploadStatus> {
  try {
    const doc = await CONFIG_REF().get();
    const data = doc.data() || {};
    const forced = data.documentUploadForceMode; // 'on' | 'off' | undefined (auto)

    if (forced === 'on') return { enabled: true, reason: 'admin_forced_on' };
    if (forced === 'off') return { enabled: false, reason: 'admin_forced_off' };

    const health = data.geminiHealth || {};
    const lastSuccess = health.lastSuccessAt ? new Date(health.lastSuccessAt).getTime() : 0;
    const lastFailure = health.lastFailureAt ? new Date(health.lastFailureAt).getTime() : 0;

    // Gemini is considered down if its most recent outcome was a failure (or it
    // has failed at least once and never yet succeeded).
    const isDown = lastFailure > 0 && lastFailure > lastSuccess;
    return isDown ? { enabled: true, reason: 'gemini_down' } : { enabled: false, reason: 'gemini_healthy' };
  } catch {
    return { enabled: false, reason: 'gemini_healthy' };
  }
}
