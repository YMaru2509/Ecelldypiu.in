// Sweeps requests stuck in "Sync Failed" and retries them. Triggered by Vercel
// Cron (sends Authorization: Bearer ${CRON_SECRET} automatically when
// CRON_SECRET is set in env — see vercel.json) or manually by a system_owner.
import { db } from './_lib/firebaseAdmin.js';
import { STATUS } from './_lib/stateMachine.js';
import { attemptSync } from './_lib/attendanceSync.js';
import { getCallerMember, isSystemOwner } from './_lib/rbac.js';

async function isAuthorized(req) {
    const authHeader = req.headers.authorization || '';
    if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    try {
        const member = await getCallerMember(req);
        return isSystemOwner(member);
    } catch {
        return false;
    }
}

export default async function handler(req, res) {
    if (!(await isAuthorized(req))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const snap = await db.collection('attendance_requests').where('status', '==', STATUS.SYNC_FAILED).limit(25).get();
    const results = [];
    for (const doc of snap.docs) {
        const result = await attemptSync(doc.id);
        results.push({ requestId: doc.id, ...result });
    }

    return res.status(200).json({ success: true, attempted: results.length, results });
}
