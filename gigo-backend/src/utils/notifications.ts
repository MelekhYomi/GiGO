import { db } from '../firebase-config';

export type NotificationType = 'MISSING_INFO' | 'STALE_PROFILE' | 'GREAT_MATCH' | 'ATTACHMENT_GAP';

// Real, persisted per-user alerts written by the missing-info, stale-profile,
// great-match, and attachment-gap agents — not simulated activity log lines.
export async function createNotification(userId: string, type: NotificationType, message: string, jobId?: string) {
  await db.collection('users').doc(userId).collection('notifications').add({
    type,
    message,
    jobId: jobId || null,
    createdAt: new Date().toISOString(),
    read: false
  });
}
