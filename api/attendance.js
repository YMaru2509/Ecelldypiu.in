// Member-facing attendance request endpoints: submit, edit/resubmit, list my own
// requests, and fetch one by id (owner, any approver, or system_owner).
import { db } from './_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { getCallerMember, isSystemOwner, hasRole, sendRbacError, RbacError } from './_lib/rbac.js';
import { generateRequestId } from './_lib/attendanceIds.js';
import { canResubmit, STATUS } from './_lib/stateMachine.js';
import { writeAuditLog } from './_lib/auditLog.js';
import { sendEmail } from './_lib/emailTransport.js';

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { action, id } = req.query;

        if (req.method === 'GET') {
            if (id) return await handleGetOne(req, res, id);
            if (action === 'my-requests') return await handleMyRequests(req, res);
            return res.status(400).json({ error: 'Specify ?id= or ?action=my-requests' });
        }

        if (req.method === 'POST') {
            if (action === 'submit') return await handleSubmit(req, res);
            if (action === 'edit') return await handleEdit(req, res);
            return res.status(400).json({ error: 'Unknown action' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return sendRbacError(res, error);
    }
}

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
