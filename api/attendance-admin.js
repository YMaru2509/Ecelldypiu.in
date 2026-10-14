// Manage E-Cell verticals (name + assigned Vertical Head) — gated on the
// 'attendance' module permission, same rbac.js chokepoint as everything else.
import { db } from './_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { requirePermission, sendRbacError, isSystemOwner } from './_lib/rbac.js';
import { writeAuditLog } from './_lib/auditLog.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const action = req.query?.action;
        // Public, unauthenticated — the only data the Team page may read from here.
        if (req.method === 'GET' && action === 'public') return await handlePublicVerticals(req, res);

        if (req.method === 'GET') return await handleList(req, res);
        if (req.method === 'POST') return await handleCreate(req, res);
        if (req.method === 'PATCH') return await handleUpdate(req, res);
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return sendRbacError(res, error);
    }
}

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

async function handleList(req, res) {
    // Any member with at least 'view' on attendance can see the vertical list
    // (needed just to populate the "which vertical" dropdown on the request form).
    await requirePermission(req, 'attendance', 'view');

    const snap = await db.collection('ecell_verticals').orderBy('name').get();
    const verticals = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json({ success: true, verticals });
}

async function handleCreate(req, res) {
    const caller = await requirePermission(req, 'attendance', 'manage');

    const { name, headUid } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Vertical name is required' });

    let headNameSnapshot = null;
    if (headUid) {
        const headSnap = await db.collection('members').doc(headUid).get();
        if (!headSnap.exists) return res.status(400).json({ error: 'headUid does not match an existing member' });
        headNameSnapshot = headSnap.data().name || null;
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const docRef = await db.collection('ecell_verticals').add({
        name: name.trim(),
        slug,
        active: true,
        headUid: headUid || null,
        headNameSnapshot,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: caller.uid,
        updatedAt: FieldValue.serverTimestamp(),
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

async function handleUpdate(req, res) {
    const caller = await requirePermission(req, 'attendance', 'manage');

    const { id, name, headUid, active } = req.body || {};
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
