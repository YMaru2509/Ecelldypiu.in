// Vertical Head / Board Member approval queues + decide (approve / reject /
// request_correction). All status transitions go through stateMachine.js;
// this file only resolves "is this caller actually allowed to decide this
// particular request" and records the decision.
import { db } from './_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { getCallerMember, isSystemOwner, hasRole, sendRbacError, RbacError } from './_lib/rbac.js';
import { applyApprovalAction, stageForStatus, STATUS } from './_lib/stateMachine.js';
import { writeAuditLog } from './_lib/auditLog.js';
import { sendEmail } from './_lib/emailTransport.js';
import { attemptSync } from './_lib/attendanceSync.js';

async function sendEmailBestEffort(to, subject, html) {
    try {
        await sendEmail(to, subject, html);
    } catch (err) {
        console.error(`Attendance approval email send failed: ${err.message}`);
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { action } = req.query;

        if (req.method === 'GET' && action === 'queue') return await handleQueue(req, res);
        if (req.method === 'POST' && action === 'decide') return await handleDecide(req, res);

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return sendRbacError(res, error);
    }
}

async function headedVerticalIds(uid) {
    const snap = await db.collection('ecell_verticals').where('headUid', '==', uid).get();
    return snap.docs.map((doc) => doc.id);
}

async function handleQueue(req, res) {
    const member = await getCallerMember(req);
    const stage = req.query.stage; // 'vertical_head' | 'board_member'
    if (!['vertical_head', 'board_member'].includes(stage)) {
        return res.status(400).json({ error: 'stage must be vertical_head or board_member' });
    }

    const status = stage === 'vertical_head' ? STATUS.PENDING_VH : STATUS.PENDING_BOARD;

    if (stage === 'vertical_head' && !isSystemOwner(member)) {
        const verticalIds = await headedVerticalIds(member.uid);
        if (verticalIds.length === 0) return res.status(200).json({ success: true, requests: [] });

        const snap = await db.collection('attendance_requests')
            .where('status', '==', status)
            .where('verticalId', 'in', verticalIds.slice(0, 10))
            .orderBy('createdAt', 'asc')
            .get();
        return res.status(200).json({ success: true, requests: snap.docs.map((d) => d.data()) });
    }

    if (stage === 'board_member' && !isSystemOwner(member) && !hasRole(member, 'board_member')) {
        throw new RbacError(403, 'Only a Board Member can view this queue');
    }

    const snap = await db.collection('attendance_requests').where('status', '==', status).orderBy('createdAt', 'asc').get();
    return res.status(200).json({ success: true, requests: snap.docs.map((d) => d.data()) });
}

async function handleDecide(req, res) {
    const member = await getCallerMember(req);
    const { requestId, action, remarks } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    const docRef = db.collection('attendance_requests').doc(requestId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Request not found' });
    const request = snap.data();

    const stage = stageForStatus(request.status);
    if (!stage) return res.status(400).json({ error: `Request is not awaiting approval (status: ${request.status})` });

    // Self-approval guard: applies to every actor, system_owner included.
    if (request.memberUid === member.uid) {
        throw new RbacError(403, "You can't act on your own request");
    }

    if (stage === 'vertical_head') {
        const vertSnap = await db.collection('ecell_verticals').doc(request.verticalId).get();
        const vertical = vertSnap.exists ? vertSnap.data() : null;
        const isHead = vertical && vertical.headUid === member.uid;
        if (!isHead && !isSystemOwner(member)) {
            throw new RbacError(403, "You aren't the Vertical Head for this request's vertical");
        }
    } else {
        // board_member stage
        if (!isSystemOwner(member) && !hasRole(member, 'board_member')) {
            throw new RbacError(403, 'Only a Board Member can decide this request');
        }
        if (request.vhApproverUid && request.vhApproverUid === member.uid) {
            throw new RbacError(403, "You can't give final approval on a request you already approved as Vertical Head");
        }
    }

    const { nextStatus } = applyApprovalAction({ currentStatus: request.status, action, remarks });
    const now = FieldValue.serverTimestamp();

    const update = {
        status: nextStatus,
        updatedAt: now,
        currentApproverRole: nextStatus === STATUS.PENDING_BOARD ? 'board_member' : null,
    };
    if (stage === 'vertical_head' && action === 'approve') {
        update.vhApproverUid = member.uid;
    }

    await docRef.update(update);

    await docRef.collection('approval_history').add({
        stage,
        action,
        actorUid: member.uid,
        actorNameSnapshot: member.name || '',
        actorRole: isSystemOwner(member) ? 'system_owner' : stage,
        decidedAt: now,
        remarks: remarks || null,
        previousStatus: request.status,
        newStatus: nextStatus,
    });

    await writeAuditLog({
        actorUid: member.uid,
        actorRole: isSystemOwner(member) ? 'system_owner' : stage,
        action: `attendance_${action}`,
        targetType: 'attendance_request',
        targetId: requestId,
        metadata: { previousStatus: request.status, nextStatus },
    });

    const ownerEmail = request.memberSnapshot?.email;
    if (ownerEmail) {
        const verb = action === 'approve' ? 'moved forward' : action === 'reject' ? 'was rejected' : 'needs a correction';
        await sendEmailBestEffort(
            ownerEmail,
            `Attendance request ${requestId} ${verb}`,
            `<p>Your attendance request <strong>${requestId}</strong> is now: <strong>${nextStatus}</strong>.</p>${remarks ? `<p>Remarks: ${remarks}</p>` : ''}`
        );
    }

    // Both approvals complete — attempt the Sheets sync immediately. Best-effort:
    // if Sheets isn't configured yet or the API call fails, attemptSync records
    // Sync Failed and the retry-sweep cron (or an admin) picks it up later; the
    // approval itself is already durable regardless of sync outcome.
    let finalStatus = nextStatus;
    if (nextStatus === STATUS.APPROVED_SYNC_PENDING) {
        const syncResult = await attemptSync(requestId);
        if (syncResult.ok) finalStatus = STATUS.APPROVED_SYNCED;
        else finalStatus = STATUS.SYNC_FAILED;
    }

    return res.status(200).json({ success: true, status: finalStatus });
}
