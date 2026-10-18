// All attendance-system endpoints in one file: member-facing submit/edit/list,
// Vertical Head / Board Member approval queues + decisions, E-Cell verticals
// admin CRUD, and the Sheets-sync retry sweep (cron). Merged from four
// previously-separate files (attendance.js, attendance-admin.js,
// attendance-approvals.js, attendance-sync-retry.js) — each top-level file
// under api/ counts as its own Vercel Serverless Function, and the Hobby plan
// caps a deployment at 12; keeping this one feature's endpoints together
// under a single `?action=` dispatch avoids burning through that budget as
// the attendance feature grows. Routing is unchanged in spirit — only the
// path and the explicit `action` values changed (see each frontend call site
// for the corresponding update).
import { db } from './_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { getCallerMember, isSystemOwner, hasRole, requirePermission, sendRbacError, RbacError } from './_lib/rbac.js';
import { generateRequestId } from './_lib/attendanceIds.js';
import { canResubmit, applyApprovalAction, stageForStatus, STATUS } from './_lib/stateMachine.js';
import { writeAuditLog } from './_lib/auditLog.js';
import { sendEmail } from './_lib/emailTransport.js';
import { attemptSync } from './_lib/attendanceSync.js';

const REQUIRED_FIELDS = ['verticalId', 'lectureDate', 'lectureStartTime', 'lectureEndTime', 'facultyName', 'subject', 'classroom', 'workDescription'];

async function sendEmailBestEffort(to, subject, html) {
    try {
        await sendEmail(to, subject, html);
    } catch (err) {
        console.error(`Attendance email send failed: ${err.message}`);
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { action, id } = req.query;

        if (req.method === 'GET') {
            if (action === 'verticals-public') return await handlePublicVerticals(req, res);
            if (action === 'verticals') return await handleListVerticals(req, res);
            if (action === 'queue') return await handleQueue(req, res);
            if (action === 'sync-retry') return await handleSyncRetry(req, res);
            if (action === 'my-requests') return await handleMyRequests(req, res);
            if (id) return await handleGetOne(req, res, id);
            return res.status(400).json({ error: 'Specify ?id= or a valid ?action=' });
        }

        if (req.method === 'POST') {
            if (action === 'submit') return await handleSubmit(req, res);
            if (action === 'edit') return await handleEdit(req, res);
            if (action === 'decide') return await handleDecide(req, res);
            if (action === 'verticals-create') return await handleCreateVertical(req, res);
            if (action === 'verticals-delete') return await handleDeleteVertical(req, res);
            if (action === 'sync-retry') return await handleSyncRetry(req, res);
            return res.status(400).json({ error: 'Unknown action' });
        }

        if (req.method === 'PATCH') {
            if (action === 'verticals-update') return await handleUpdateVertical(req, res);
            return res.status(400).json({ error: 'Unknown action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return sendRbacError(res, error);
    }
}

// ---------------------------------------------------------------------------
// Member-facing: submit / edit / list own requests
// ---------------------------------------------------------------------------

function validateFields(body) {
    for (const field of REQUIRED_FIELDS) {
        if (!body?.[field] || !String(body[field]).trim()) {
            throw new RbacError(400, `Field "${field}" is required`);
        }
    }
    if (body.lectureEndTime <= body.lectureStartTime) {
        throw new RbacError(400, 'Lecture end time must be after the start time');
    }
}

function buildDuplicateKey(memberUid, body) {
    return `${memberUid}_${body.lectureDate}_${body.lectureStartTime}-${body.lectureEndTime}`;
}

async function handleSubmit(req, res) {
    const member = await getCallerMember(req);
    const body = req.body || {};
    validateFields(body);

    const memberVerticals = Array.isArray(member.verticals) ? member.verticals : [];
    if (!isSystemOwner(member) && !memberVerticals.includes(body.verticalId)) {
        throw new RbacError(403, "You can't submit a request for a vertical you don't belong to");
    }

    const verticalSnap = await db.collection('ecell_verticals').doc(body.verticalId).get();
    if (!verticalSnap.exists) throw new RbacError(400, 'Selected vertical does not exist');
    const vertical = verticalSnap.data();

    const duplicateKey = buildDuplicateKey(member.uid, body);
    const dupSnap = await db.collection('attendance_requests').where('duplicateKey', '==', duplicateKey).limit(1).get();
    if (!dupSnap.empty) {
        throw new RbacError(409, 'A request for this member, date and lecture period already exists');
    }

    const requestId = await generateRequestId();
    const now = FieldValue.serverTimestamp();

    await db.collection('attendance_requests').doc(requestId).set({
        requestId,
        memberUid: member.uid,
        memberSnapshot: {
            name: member.name || '',
            email: member.email || '',
            phone: member.phone || '',
            college: member.college || '',
            branch: member.branch || '',
            year: member.year || '',
        },
        verticalId: body.verticalId,
        verticalNameSnapshot: vertical.name,
        lectureDate: body.lectureDate,
        lectureStartTime: body.lectureStartTime,
        lectureEndTime: body.lectureEndTime,
        facultyName: body.facultyName.trim(),
        subject: body.subject.trim(),
        classroom: body.classroom.trim(),
        lectureNumber: body.lectureNumber?.trim() || null,
        workDescription: body.workDescription.trim(),
        workLocation: body.workLocation?.trim() || null,
        status: STATUS.PENDING_VH,
        duplicateKey,
        currentApproverRole: 'vertical_head',
        createdAt: now,
        updatedAt: now,
        submittedAt: now,
        editCount: 0,
        lastEditedAt: null,
        syncStatus: 'not_synced',
    });

    await db.collection('attendance_requests').doc(requestId).collection('approval_history').add({
        stage: 'submission',
        action: 'submit',
        actorUid: member.uid,
        actorNameSnapshot: member.name || '',
        actorRole: 'core_member',
        decidedAt: now,
        remarks: null,
        previousStatus: null,
        newStatus: STATUS.PENDING_VH,
    });

    await writeAuditLog({
        actorUid: member.uid,
        actorRole: 'core_member',
        action: 'submit_attendance_request',
        targetType: 'attendance_request',
        targetId: requestId,
        metadata: { verticalId: body.verticalId },
    });

    if (vertical.headUid) {
        const headSnap = await db.collection('members').doc(vertical.headUid).get();
        const headEmail = headSnap.exists ? headSnap.data().email : null;
        if (headEmail) {
            await sendEmailBestEffort(
                headEmail,
                `New attendance request ${requestId} awaiting your approval`,
                `<p>${member.name || 'A member'} submitted attendance request <strong>${requestId}</strong> for ${vertical.name} on ${body.lectureDate}, requiring your review.</p>`
            );
        }
    }

    return res.status(200).json({ success: true, requestId });
}

async function handleEdit(req, res) {
    const member = await getCallerMember(req);
    const body = req.body || {};
    const { requestId } = body;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    const docRef = db.collection('attendance_requests').doc(requestId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Request not found' });
    const existing = snap.data();

    if (existing.memberUid !== member.uid) {
        throw new RbacError(403, 'You can only edit your own requests');
    }
    if (!canResubmit(existing.status)) {
        throw new RbacError(400, `Request in status "${existing.status}" can't be edited`);
    }

    validateFields(body);

    const memberVerticals = Array.isArray(member.verticals) ? member.verticals : [];
    if (!isSystemOwner(member) && !memberVerticals.includes(body.verticalId)) {
        throw new RbacError(403, "You can't submit a request for a vertical you don't belong to");
    }
    const verticalSnap = await db.collection('ecell_verticals').doc(body.verticalId).get();
    if (!verticalSnap.exists) throw new RbacError(400, 'Selected vertical does not exist');
    const vertical = verticalSnap.data();

    const duplicateKey = buildDuplicateKey(member.uid, body);
    if (duplicateKey !== existing.duplicateKey) {
        const dupSnap = await db.collection('attendance_requests').where('duplicateKey', '==', duplicateKey).limit(1).get();
        if (!dupSnap.empty) throw new RbacError(409, 'A request for this member, date and lecture period already exists');
    }

    const now = FieldValue.serverTimestamp();
    const previousStatus = existing.status;

    await docRef.update({
        verticalId: body.verticalId,
        verticalNameSnapshot: vertical.name,
        lectureDate: body.lectureDate,
        lectureStartTime: body.lectureStartTime,
        lectureEndTime: body.lectureEndTime,
        facultyName: body.facultyName.trim(),
        subject: body.subject.trim(),
        classroom: body.classroom.trim(),
        lectureNumber: body.lectureNumber?.trim() || null,
        workDescription: body.workDescription.trim(),
        workLocation: body.workLocation?.trim() || null,
        status: STATUS.PENDING_VH,
        duplicateKey,
        currentApproverRole: 'vertical_head',
        updatedAt: now,
        editCount: FieldValue.increment(1),
        lastEditedAt: now,
    });

    await docRef.collection('approval_history').add({
        stage: 'edit',
        action: 'edit_resubmit',
        actorUid: member.uid,
        actorNameSnapshot: member.name || '',
        actorRole: 'core_member',
        decidedAt: now,
        remarks: 'Edited and resubmitted by member; prior approvals, if any, are invalidated.',
        previousStatus,
        newStatus: STATUS.PENDING_VH,
    });

    await writeAuditLog({
        actorUid: member.uid,
        actorRole: 'core_member',
        action: 'edit_attendance_request',
        targetType: 'attendance_request',
        targetId: requestId,
        metadata: { previousStatus },
    });

    return res.status(200).json({ success: true });
}

async function handleMyRequests(req, res) {
    const member = await getCallerMember(req);
    const snap = await db.collection('attendance_requests').where('memberUid', '==', member.uid).orderBy('createdAt', 'desc').get();
    const requests = snap.docs.map((doc) => doc.data());
    return res.status(200).json({ success: true, requests });
}

async function handleGetOne(req, res, id) {
    const member = await getCallerMember(req);
    const docRef = db.collection('attendance_requests').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Request not found' });
    const data = snap.data();

    const isOwner = data.memberUid === member.uid;
    const isApprover = hasRole(member, 'vertical_head') || hasRole(member, 'board_member');
    if (!isOwner && !isApprover && !isSystemOwner(member)) {
        throw new RbacError(403, "You don't have access to this request");
    }

    const historySnap = await docRef.collection('approval_history').orderBy('decidedAt', 'asc').get();
    const history = historySnap.docs.map((doc) => doc.data());

    return res.status(200).json({ success: true, request: data, history });
}

// ---------------------------------------------------------------------------
// Vertical Head / Board Member approval queues + decisions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// E-Cell verticals admin CRUD
// ---------------------------------------------------------------------------

async function handlePublicVerticals(req, res) {
    // Pure equality filter only (no orderBy) — Firestore serves this from automatic
    // indexes with no composite index needed; sort client-side in code instead.
    const snap = await db.collection('ecell_verticals').where('active', '==', true).get();
    const verticals = snap.docs
        .map((doc) => ({ id: doc.id, name: doc.data().name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.status(200).json({ success: true, verticals });
}

async function handleListVerticals(req, res) {
    // Any member with at least 'view' on attendance can see the vertical list
    // (needed just to populate the "which vertical" dropdown on the request form).
    await requirePermission(req, 'attendance', 'view');

    const snap = await db.collection('ecell_verticals').orderBy('name').get();
    const verticals = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json({ success: true, verticals });
}

async function handleCreateVertical(req, res) {
    const caller = await requirePermission(req, 'attendance', 'manage');

    const { name, headUid, memberUids = [] } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Vertical name is required' });

    let headNameSnapshot = null;
    if (headUid) {
        const headSnap = await db.collection('members').doc(headUid).get();
        if (!headSnap.exists) return res.status(400).json({ error: 'headUid does not match an existing member' });
        headNameSnapshot = headSnap.data().name || null;
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cleanMemberUids = Array.isArray(memberUids) ? [...new Set(memberUids.filter(Boolean))] : [];
    const docRef = await db.collection('ecell_verticals').add({
        name: name.trim(),
        slug,
        active: true,
        headUid: headUid || null,
        headNameSnapshot,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: caller.uid,
        updatedAt: FieldValue.serverTimestamp(),
        memberUids: cleanMemberUids,
    });

    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: isSystemOwner(caller) ? 'system_owner' : 'attendance:manage',
        action: 'create_vertical',
        targetType: 'ecell_vertical',
        targetId: docRef.id,
        metadata: { name: name.trim(), headUid: headUid || null },
    });

    return res.status(200).json({ success: true, id: docRef.id });
}

async function handleUpdateVertical(req, res) {
    const caller = await requirePermission(req, 'attendance', 'manage');

    const { id, name, headUid, active, memberUids } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Vertical id is required' });

    const docRef = db.collection('ecell_verticals').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Vertical not found' });

    const update = { updatedAt: FieldValue.serverTimestamp() };
    if (name !== undefined) update.name = name.trim();
    if (active !== undefined) update.active = !!active;
    if (headUid !== undefined) {
        if (headUid) {
            const headSnap = await db.collection('members').doc(headUid).get();
            if (!headSnap.exists) return res.status(400).json({ error: 'headUid does not match an existing member' });
            update.headUid = headUid;
            update.headNameSnapshot = headSnap.data().name || null;
        } else {
            update.headUid = null;
            update.headNameSnapshot = null;
        }
    }

    if (memberUids !== undefined) {
        if (!Array.isArray(memberUids) || memberUids.some((uid) => typeof uid !== 'string')) {
            return res.status(400).json({ error: 'memberUids must be an array of member ids' });
        }
        const cleanMemberUids = [...new Set(memberUids.filter(Boolean))];
        update.memberUids = cleanMemberUids;
        const memberSnap = await db.collection('members').get();
        const batch = db.batch();
        memberSnap.docs.forEach((memberDoc) => {
            const data = memberDoc.data();
            const current = Array.isArray(data.verticals) ? data.verticals : [];
            const has = current.includes(id);
            const shouldHave = cleanMemberUids.includes(memberDoc.id);
            if (has !== shouldHave) {
                batch.update(memberDoc.ref, {
                    verticals: shouldHave ? [...new Set([...current, id])] : current.filter((verticalId) => verticalId !== id),
                    lastUpdated: FieldValue.serverTimestamp(),
                });
            }
        });
        await batch.commit();
    }

    await docRef.update(update);
    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: isSystemOwner(caller) ? 'system_owner' : 'attendance:manage',
        action: 'update_vertical',
        targetType: 'ecell_vertical',
        targetId: id,
        metadata: update,
    });

    return res.status(200).json({ success: true });
}

async function handleDeleteVertical(req, res) {
    const caller = await requirePermission(req, 'attendance', 'manage');
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Vertical id is required' });
    const verticalRef = db.collection('ecell_verticals').doc(id);
    const verticalSnap = await verticalRef.get();
    if (!verticalSnap.exists) return res.status(404).json({ error: 'Vertical not found' });

    const memberSnap = await db.collection('members').get();
    const batch = db.batch();
    memberSnap.docs.forEach((memberDoc) => {
        const data = memberDoc.data();
        const current = Array.isArray(data.verticals) ? data.verticals : [];
        if (current.includes(id)) batch.update(memberDoc.ref, { verticals: current.filter((verticalId) => verticalId !== id), lastUpdated: FieldValue.serverTimestamp() });
    });
    batch.delete(verticalRef);
    await batch.commit();
    await writeAuditLog({ actorUid: caller.uid, actorRole: isSystemOwner(caller) ? 'system_owner' : 'attendance:manage', action: 'delete_vertical', targetType: 'ecell_vertical', targetId: id, metadata: {} });
    return res.status(200).json({ success: true });
}

// ---------------------------------------------------------------------------
// Sheets-sync retry sweep — triggered by Vercel Cron (sends
// Authorization: Bearer ${CRON_SECRET} automatically when CRON_SECRET is set
// in env — see vercel.json) or manually by a system_owner.
// ---------------------------------------------------------------------------

async function isSyncRetryAuthorized(req) {
    const authHeader = req.headers.authorization || '';
    if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;
    try {
        const member = await getCallerMember(req);
        return isSystemOwner(member);
    } catch {
        return false;
    }
}

async function handleSyncRetry(req, res) {
    if (!(await isSyncRetryAuthorized(req))) {
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
