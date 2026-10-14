// Shared "attempt to sync this request to the Master Attendance Sheet" routine,
// used both right after Board Member approval and by the retry-sweep cron.
// Keeps spreadsheet_sync_jobs (the idempotency/retry record) and the request's
// own status/syncStatus in sync with the outcome.
import { db } from './firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { STATUS } from './stateMachine.js';
import { syncRequestToSheet } from './sheetsSync.js';

export async function attemptSync(requestId) {
    const requestRef = db.collection('attendance_requests').doc(requestId);
    const jobRef = db.collection('spreadsheet_sync_jobs').doc(requestId);

    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) return { ok: false, error: 'Request not found' };
    const request = requestSnap.data();

    if (request.status !== STATUS.APPROVED_SYNC_PENDING && request.status !== STATUS.SYNC_FAILED) {
        return { ok: false, error: `Request is not in a syncable state (${request.status})` };
    }

    const historySnap = await requestRef.collection('approval_history').orderBy('decidedAt', 'asc').get();
    const history = historySnap.docs.map((d) => d.data());

    const now = FieldValue.serverTimestamp();

    try {
        const { rowNumber } = await syncRequestToSheet(request, history);

        await jobRef.set({
            status: 'success',
            attempts: FieldValue.increment(1),
            lastAttemptAt: now,
            lastError: null,
            sheetRowId: rowNumber,
            createdAt: FieldValue.serverTimestamp(),
            completedAt: now,
        }, { merge: true });

        await requestRef.update({ status: STATUS.APPROVED_SYNCED, syncStatus: 'synced', updatedAt: now });

        return { ok: true };
    } catch (err) {
        await jobRef.set({
            status: 'failed',
            attempts: FieldValue.increment(1),
            lastAttemptAt: now,
            lastError: err.message,
            nextRetryAt: null, // populated by the retry-sweep cron, not here
            createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        await requestRef.update({ status: STATUS.SYNC_FAILED, syncStatus: 'failed', updatedAt: now });

        return { ok: false, error: err.message };
    }
}
