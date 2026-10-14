// Generates ATT-{year}-{seq} request IDs (e.g. ATT-2026-0007) inside a Firestore
// transaction against a shared counter doc, so IDs are collision-free under
// concurrent submissions without needing a separate locking mechanism.
import { db } from './firebaseAdmin.js';

export async function generateRequestId() {
    const year = new Date().getFullYear();
    const counterRef = db.collection('CONFIG').doc('attendanceCounters');

    const seq = await db.runTransaction(async (tx) => {
        const snap = await tx.get(counterRef);
        const counters = snap.exists ? snap.data() : {};
        const next = (counters[String(year)] || 0) + 1;
        tx.set(counterRef, { ...counters, [String(year)]: next }, { merge: true });
        return next;
    });

    return `ATT-${year}-${String(seq).padStart(4, '0')}`;
}
