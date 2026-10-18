import crypto from 'crypto';
import { db, auth } from './_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { requirePermission, requireAnyPermission, requireSystemOwner, getCallerMember, hasPermission, isSystemOwner, MODULES, PERMISSION_LEVELS, sendRbacError, RbacError } from './_lib/rbac.js';
import { writeAuditLog } from './_lib/auditLog.js';
import { sendEmail } from './_lib/emailTransport.js';

const ASSIGNABLE_ROLES = ['system_owner', 'vertical_head', 'board_member'];
// system_owner is permanently capped to these two accounts — no one else may ever
// be granted it, even by another system_owner or the admin-panel key. Hardcoded
// deliberately rather than made configurable.
const PERMANENT_SYSTEM_OWNER_UIDS = ['SPWSYZ3Ggid0rosU2cJ76CGIovY2', 'DjWLl7JtX9Ynxtg3sRsrzBJMqlp2'];
const LEVEL_RANK = { none: 0, view: 1, manage: 2 };
// Mirrors MailProviderSelect.jsx's options — the "mail bridge" an invite's
// credential email is sent through.
const MAIL_PROVIDERS = ['zeptomail', 'bridge1', 'bridge2'];
// Single doc holding whether the public Team page shows the live `members`
// roster yet, or still the old hardcoded fallback — flipped once from the
// panel by a system owner when the real roster is ready, not automatically.
const TEAM_ROSTER_CONFIG_REF = db.collection('site_config').doc('team_roster');

function getActiveEcellMembersSnap() {
    return db.collection('members')
        .where('memberType', '==', 'ecell_member')
        .where('membershipStatus', '==', 'active')
        .get();
}

// What's still missing before a core member can appear on the public Team
// page: the invite's temporary password replaced, the onboarding questions
// finished, and the profile fields onboarding requires of core members
// (photo, phone, branch, year) actually filled in. Empty array = ready.
// Members who signed up before onboarding existed have no onboardingComplete
// field at all and are treated as having finished it (same as handleList),
// but still need the profile fields to count.
function profileMissing(data) {
    const missing = [];
    if (data.mustChangePassword === true) missing.push('password not changed');
    if (data.onboardingComplete === false) missing.push('onboarding not finished');
    if (!data.avatarUrl) missing.push('photo');
    if (!data.phone) missing.push('phone');
    if (!data.branch) missing.push('branch');
    if (!data.year) missing.push('year');
    return missing;
}

async function getReadyEcellMembersDocs() {
    const snap = await getActiveEcellMembersSnap();
    const ready = snap.docs.filter((doc) => {
        const data = doc.data();
        return data.displayStatus !== 'inactive' && profileMissing(data).length === 0;
    });
    return { ready, totalActive: snap.size };
}

async function sendEmailBestEffort(to, subject, html, provider) {
    try {
        await sendEmail(to, subject, html, provider || 'zeptomail');
    } catch (err) {
        console.error(`panel-users email send failed: ${err.message}`);
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const action = req.query?.action;

        // Public, unauthenticated — the only action the live Team page may call.
        if (req.method === 'GET' && action === 'public-roster') return await handlePublicRoster(req, res);
        if (req.method === 'GET' && action === 'roster-status') return await handleRosterStatus(req, res);
        if (req.method === 'GET' && action === 'whoami') return await handleWhoami(req, res);
        if (req.method === 'GET' && action === 'member-directory') return await handleMemberDirectory(req, res);
        if (req.method === 'GET' && action === 'audit-logs') return await handleAuditLogs(req, res);

        if (req.method === 'GET') return await handleList(req, res);

        if (req.method === 'POST') {
            if (action === 'invite') return await handleInvite(req, res);
            if (action === 'bulk-invite') return await handleBulkInvite(req, res);
            if (action === 'kick') return await handleKick(req, res);
            if (action === 'unban') return await handleUnban(req, res);
            if (action === 'mark-left') return await handleMarkLeft(req, res);
            if (action === 'delete') return await handleDeletePermanently(req, res);
            if (action === 'reorder') return await handleReorder(req, res);
            if (action === 'set-roster-live') return await handleSetRosterLive(req, res);
            return await handleUpdateAccess(req, res);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return sendRbacError(res, error);
    }
}

// audit:view — the append-only trail of privileged actions, newest first, with
// actor and member-target names resolved so it reads as people, not uids.
async function handleAuditLogs(req, res) {
    await requirePermission(req, 'audit', 'view');

    const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || 100, 1), 300);
    const snap = await db.collection('audit_logs').orderBy('createdAt', 'desc').limit(limit).get();
    const entries = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const uids = new Set();
    entries.forEach((e) => {
        if (e.actorUid && e.actorUid !== 'admin-panel') uids.add(e.actorUid);
        if (e.targetType === 'member' && e.targetId) uids.add(e.targetId);
    });
    const names = new Map();
    if (uids.size > 0) {
        const docs = await db.getAll(...[...uids].map((uid) => db.collection('members').doc(uid)));
        docs.forEach((d) => { if (d.exists) names.set(d.id, d.data().name || d.data().email || d.id); });
    }

    const logs = entries.map((e) => ({
        id: e.id,
        action: e.action || '',
        actorUid: e.actorUid || '',
        actorName: e.actorUid === 'admin-panel' ? 'Admin (shared password)' : (names.get(e.actorUid) || e.actorUid || 'Unknown'),
        actorRole: e.actorRole || '',
        targetType: e.targetType || '',
        targetId: e.targetId || '',
        targetName: e.targetType === 'member' ? (names.get(e.targetId) || '') : '',
        metadata: e.metadata || {},
        createdAt: e.createdAt?.toDate ? e.createdAt.toDate().toISOString() : null,
    }));
    return res.status(200).json({ success: true, logs });
}

// Staff panel entry check: validates the caller's own login (or the shared
// admin key) on the server and returns exactly what the panel needs to decide
// which modules to show. Informational only — every module's endpoints still
// enforce their own permission on every request.
async function handleWhoami(req, res) {
    const caller = await getCallerMember(req);
    if (caller.membershipStatus !== 'active') {
        throw new RbacError(403, 'Your membership is no longer active');
    }
    const verticalIds = Array.isArray(caller.verticals) ? caller.verticals : [];
    const verticalSnaps = await Promise.all(verticalIds.map((id) => db.collection('ecell_verticals').doc(id).get()));
    const verticalNames = verticalSnaps.filter((snap) => snap.exists).map((snap) => snap.data().name).filter(Boolean);
    return res.status(200).json({
        success: true,
        member: {
            uid: caller.uid,
            name: caller.name || '',
            email: caller.email || '',
            roles: Array.isArray(caller.roles) ? caller.roles : [],
            permissions: caller.permissions || {},
            verticals: verticalIds,
            verticalNames,
            publicTitle: caller.publicTitle || '',
            isAdminPanel: false,
        },
    });
}

// Name/email/status only — enough for the panel's pickers (event manual
// check-in, vertical head assignment) without exposing phone numbers or
// profile details. Open to anyone holding a permission that needs such a
// picker, so those screens work without the broader 'users' permission.
async function handleMemberDirectory(req, res) {
    const caller = await getCallerMember(req);
    const allowed = [['users', 'view'], ['attendance', 'view'], ['events', 'view']]
        .some(([module, level]) => hasPermission(caller, module, level));
    if (!allowed) throw new RbacError(403, "You don't have access to the member directory");

    const snap = await db.collection('members').orderBy('name').get();
    const members = snap.docs.map((doc) => {
        const data = doc.data();
        return {
            uid: doc.id,
            name: data.name || '',
            email: data.email || '',
            memberType: data.memberType || 'normal_member',
            membershipStatus: data.membershipStatus || 'active',
            verticals: Array.isArray(data.verticals) ? data.verticals : [],
        };
    });
    return res.status(200).json({ success: true, members });
}

async function handleList(req, res) {
    // The Team page may be viewed with either permission; managing it is still
    // 'users' (or 'team' for reordering only) — see the individual handlers.
    const caller = await requireAnyPermission(req, [['users', 'view'], ['team', 'view']]);

    const snap = await db.collection('members').orderBy('name').get();
    const members = snap.docs.map((doc) => {
        const data = doc.data();
        return {
            uid: doc.id,
            name: data.name || '',
            email: data.email || '',
            roles: Array.isArray(data.roles) ? data.roles : [],
            permissions: data.permissions || {},
            verticals: Array.isArray(data.verticals) ? data.verticals : [],
            memberType: data.memberType || 'normal_member',
            membershipStatus: data.membershipStatus || 'active',
            bannedReason: data.bannedReason || null,
            leftAt: data.leftAt || null,
            onboardingComplete: data.onboardingComplete !== false,
            mustChangePassword: data.mustChangePassword === true,
            profileMissing: profileMissing(data),
            avatarUrl: data.avatarUrl || '',
            avatarPosition: data.avatarPosition || { x: 50, y: 50 },
            phone: data.phone || '',
            branch: data.branch || '',
            year: data.year || '',
            bio: data.bio || '',
            ecellJoinDate: data.ecellJoinDate || null,
            joinedAt: data.joinedAt || null,
            eventsAttended: Array.isArray(data.eventsAttended) ? data.eventsAttended : [],
            certificatesAsOrganiser: Array.isArray(data.certificatesAsOrganiser) ? data.certificatesAsOrganiser : [],
            certificatesAsParticipant: Array.isArray(data.certificatesAsParticipant) ? data.certificatesAsParticipant : [],
            publicTitle: data.publicTitle || '',
            displayStatus: data.displayStatus || 'active',
            priority: typeof data.priority === 'number' ? data.priority : 9999,
        };
    });

    return res.status(200).json({ success: true, members, callerIsSystemOwner: isSystemOwner(caller) });
}

function generateTempPassword() {
    return `Ecell${crypto.randomBytes(4).toString('hex')}!`;
}

function inviteEmailHtml(name, normalizedEmail, tempPassword) {
    return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2>Welcome to the E-Cell DYPIU team portal</h2>
        <p>Hi ${name},</p>
        <p>An account has been created for you. Log in with the credentials below — you'll be asked to set your own password immediately, then fill in your profile:</p>
        <p><strong>Email:</strong> ${normalizedEmail}<br/><strong>Temporary password:</strong> ${tempPassword}</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ecelldypiu.in'}/login">Log in here</a>.</p>
    </div>`;
}

// Shared by the single-invite and CSV bulk-invite actions so both paths always
// create accounts the same way. Throws { code: 'exists' } for a duplicate email
// (caller decides whether that's a hard error or a skip) — anything else is a
// real failure and propagates normally.
async function createInvitedMember({ name, email, title, priority, actorUid }) {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const tempPassword = generateTempPassword();

    let userRecord;
    try {
        userRecord = await auth.createUser({
            email: normalizedEmail,
            password: tempPassword,
            displayName: trimmedName,
            emailVerified: false,
        });
    } catch (err) {
        if (err.code === 'auth/email-already-exists') {
            const dupError = new Error('An account with this email already exists');
            dupError.code = 'exists';
            throw dupError;
        }
        throw err;
    }

    await db.collection('members').doc(userRecord.uid).set({
        uid: userRecord.uid,
        name: trimmedName,
        email: normalizedEmail,
        phone: '',
        college: 'DYPIU',
        branch: '',
        year: '1st',
        bio: '',
        avatarUrl: '',
        publicTitle: (title || '').trim(),
        priority: typeof priority === 'number' ? priority : 9999,
        joinedAt: FieldValue.serverTimestamp(),
        profileComplete: false,
        eventsAttended: [],
        certificatesEarned: [],
        memberType: 'ecell_member',
        onboardingComplete: false,
        membershipStatus: 'active',
        mustChangePassword: true,
        lastUpdated: FieldValue.serverTimestamp(),
    });

    await writeAuditLog({
        actorUid,
        actorRole: 'users:manage',
        action: 'invite_member',
        targetType: 'member',
        targetId: userRecord.uid,
        metadata: { email: normalizedEmail },
    });

    return { uid: userRecord.uid, name: trimmedName, email: normalizedEmail, tempPassword };
}

async function handleInvite(req, res) {
    const caller = await requirePermission(req, 'users', 'manage');

    const { name, email, title, provider } = req.body || {};
    if (!name?.trim() || !email?.trim()) {
        return res.status(400).json({ error: 'name and email are required' });
    }
    if (provider && !MAIL_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: `Unknown mail provider "${provider}"` });
    }

    let created;
    try {
        created = await createInvitedMember({ name, email, title, actorUid: caller.uid });
    } catch (err) {
        if (err.code === 'exists') return res.status(409).json({ error: err.message });
        throw err;
    }

    await sendEmailBestEffort(created.email, 'Your E-Cell DYPIU account is ready', inviteEmailHtml(created.name, created.email, created.tempPassword), provider);

    return res.status(200).json({ success: true, uid: created.uid });
}

// Body: { members: [{ name, email, title? }, ...], provider? }. Never fails the
// whole batch for one bad row — each row succeeds, is skipped (duplicate email),
// or fails independently. Rows without an explicit priority are numbered in
// upload order, so a CSV ordered by department/seniority keeps that order on
// the public Team page without the admin having to set it by hand afterward.
async function handleBulkInvite(req, res) {
    const caller = await requirePermission(req, 'users', 'manage');

    const { members: rows, provider } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'members must be a non-empty array of { name, email }' });
    }
    if (rows.length > 300) {
        return res.status(400).json({ error: 'Too many rows in one upload (max 300) — split the CSV into smaller batches' });
    }
    if (provider && !MAIL_PROVIDERS.includes(provider)) {
        return res.status(400).json({ error: `Unknown mail provider "${provider}"` });
    }

    const created = [];
    const skipped = [];
    const failed = [];

    let priority = 1;
    for (const row of rows) {
        const name = (row?.name || '').trim();
        const email = (row?.email || '').trim();
        const title = (row?.title || '').trim();
        if (!name || !email) {
            failed.push({ name, email, error: 'Missing name or email' });
            continue;
        }
        try {
            const result = await createInvitedMember({ name, email, title, priority, actorUid: caller.uid });
            created.push(result);
        } catch (err) {
            if (err.code === 'exists') {
                skipped.push({ name, email, reason: 'Account already exists' });
            } else {
                failed.push({ name, email, error: err.message });
            }
        }
        priority += 1;
    }

    // Best-effort, sequential — bulk rosters for a college club are small enough
    // (capped at 300 rows above) that this doesn't need a queue/worker.
    for (const member of created) {
        await sendEmailBestEffort(member.email, 'Your E-Cell DYPIU account is ready', inviteEmailHtml(member.name, member.email, member.tempPassword), provider);
    }

    return res.status(200).json({
        success: true,
        createdCount: created.length,
        skipped,
        failed,
    });
}

async function handleKick(req, res) {
    const caller = await requirePermission(req, 'users', 'manage');
    const { uid, reason } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'Target uid is required' });
    if (!reason?.trim()) return res.status(400).json({ error: 'A reason is required to remove a member' });
    if (uid === caller.uid) return res.status(400).json({ error: "You can't remove your own account" });
    if (PERMANENT_SYSTEM_OWNER_UIDS.includes(uid)) {
        return res.status(403).json({ error: 'System owner accounts can never be kicked, by anyone' });
    }

    const targetRef = db.collection('members').doc(uid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) return res.status(404).json({ error: 'Member not found' });

    await auth.updateUser(uid, { disabled: true });
    const now = FieldValue.serverTimestamp();
    await targetRef.update({
        membershipStatus: 'banned',
        bannedReason: reason.trim(),
        bannedAt: now,
        bannedBy: caller.uid,
        lastUpdated: now,
    });

    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: isSystemOwner(caller) ? 'system_owner' : 'users:manage',
        action: 'kick_member',
        targetType: 'member',
        targetId: uid,
        metadata: { reason: reason.trim() },
    });

    return res.status(200).json({ success: true });
}

async function handleUnban(req, res) {
    const caller = await requirePermission(req, 'users', 'manage');
    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'Target uid is required' });

    const targetRef = db.collection('members').doc(uid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) return res.status(404).json({ error: 'Member not found' });

    await auth.updateUser(uid, { disabled: false });
    const now = FieldValue.serverTimestamp();
    await targetRef.update({
        membershipStatus: 'active',
        unbannedAt: now,
        unbannedBy: caller.uid,
        lastUpdated: now,
    });

    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: isSystemOwner(caller) ? 'system_owner' : 'users:manage',
        action: 'unban_member',
        targetType: 'member',
        targetId: uid,
        metadata: {},
    });

    return res.status(200).json({ success: true });
}

async function handleMarkLeft(req, res) {
    const caller = await requirePermission(req, 'users', 'manage');
    const { uid, leftAt } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'Target uid is required' });
    if (!leftAt) return res.status(400).json({ error: 'An ending date is required' });
    if (uid === caller.uid) return res.status(400).json({ error: "You can't remove your own account" });
    if (PERMANENT_SYSTEM_OWNER_UIDS.includes(uid)) {
        return res.status(403).json({ error: 'System owner accounts can never be marked as left, by anyone' });
    }

    const targetRef = db.collection('members').doc(uid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) return res.status(404).json({ error: 'Member not found' });
    const targetData = targetSnap.data();

    const startRaw = targetData.ecellJoinDate || targetData.joinedAt;
    const startDate = startRaw?.toDate ? startRaw.toDate() : new Date(startRaw);
    const endDate = new Date(leftAt);
    const durationDays = isNaN(startDate.getTime()) ? 0 : Math.max(0, Math.round((endDate - startDate) / 86400000));

    const now = FieldValue.serverTimestamp();
    await targetRef.update({
        membershipStatus: 'past_member',
        leftAt,
        membershipDurationDays: durationDays,
        pastMemberCertificateEligible: true,
        lastUpdated: now,
    });

    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: isSystemOwner(caller) ? 'system_owner' : 'users:manage',
        action: 'mark_member_left',
        targetType: 'member',
        targetId: uid,
        metadata: { leftAt, durationDays },
    });

    return res.status(200).json({ success: true, durationDays });
}

// "Other" in the removal flow — permanently wipes the account instead of
// banning (kick) or marking past (leave). Deliberately held to system_owner
// only (stricter than the 'users:manage' bar everywhere else in this file):
// unlike kick/leave, there is no undo and nothing left to look at afterward.
// The audit log keeps only the uid for admin accountability, not the
// member's name/email/profile data — that's what "no record" means here.
async function handleDeletePermanently(req, res) {
    const caller = await requireSystemOwner(req);
    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'Target uid is required' });
    if (uid === caller.uid) return res.status(400).json({ error: "You can't remove your own account" });
    if (PERMANENT_SYSTEM_OWNER_UIDS.includes(uid)) {
        return res.status(403).json({ error: 'System owner accounts can never be removed, by anyone' });
    }

    const targetRef = db.collection('members').doc(uid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) return res.status(404).json({ error: 'Member not found' });

    await targetRef.delete();
    await auth.deleteUser(uid).catch((err) => {
        // Firestore doc is already gone; don't fail the request over an auth-side
        // cleanup issue (e.g. the auth user was already removed separately).
        console.error(`handleDeletePermanently: auth.deleteUser(${uid}) failed: ${err.message}`);
    });

    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: 'system_owner',
        action: 'delete_member_permanently',
        targetType: 'member',
        targetId: uid,
        metadata: {},
    });

    return res.status(200).json({ success: true });
}

async function handleUpdateAccess(req, res) {
    const caller = await requirePermission(req, 'users', 'manage');

    const { uid, roles, permissions, verticals, publicTitle, avatarUrl, avatarPosition, ecellJoinDate, membershipStatus, displayStatus } = req.body || {};
    if (!uid) return res.status(400).json({ error: 'Target uid is required' });
    if (uid === caller.uid && !isSystemOwner(caller)) {
        return res.status(400).json({ error: "You can't change your own access" });
    }

    const targetRef = db.collection('members').doc(uid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) return res.status(404).json({ error: 'Member not found' });
    const targetData = targetSnap.data();

    const update = { lastUpdated: FieldValue.serverTimestamp() };
    const changes = {};

    if (roles !== undefined) {
        // Only a system owner may grant/revoke roles — a users:manage delegate cannot,
        // which prevents them from promoting themselves or anyone else to system_owner.
        if (!isSystemOwner(caller)) {
            throw new RbacError(403, 'Only a system owner can change roles');
        }
        if (!Array.isArray(roles) || roles.some((r) => !ASSIGNABLE_ROLES.includes(r))) {
            return res.status(400).json({ error: `roles must only contain: ${ASSIGNABLE_ROLES.join(', ')}` });
        }
        if (roles.includes('system_owner') && !PERMANENT_SYSTEM_OWNER_UIDS.includes(uid)) {
            throw new RbacError(403, 'system_owner is permanently limited to the two founding accounts and cannot be granted to anyone else');
        }
        update.roles = roles;
        changes.roles = { from: targetData.roles || [], to: roles };
    }

    if (permissions !== undefined) {
        if (typeof permissions !== 'object' || permissions === null || Array.isArray(permissions)) {
            return res.status(400).json({ error: 'permissions must be an object' });
        }
        const callerPermissions = caller.permissions || {};
        const nextPermissions = { ...(targetData.permissions || {}) };

        for (const [moduleKey, level] of Object.entries(permissions)) {
            if (!MODULES.includes(moduleKey)) {
                return res.status(400).json({ error: `Unknown module: ${moduleKey}` });
            }
            if (!PERMISSION_LEVELS.includes(level)) {
                return res.status(400).json({ error: `Invalid level "${level}" for ${moduleKey}` });
            }
            // A non-system_owner delegate can never grant a level higher than their own
            // (standard RBAC delegation safety: can't hand out more than you have).
            if (!isSystemOwner(caller)) {
                const callerLevel = callerPermissions[moduleKey] || 'none';
                if (LEVEL_RANK[level] > LEVEL_RANK[callerLevel]) {
                    throw new RbacError(403, `You can't grant ${level} on ${moduleKey} without having it yourself`);
                }
            }
            nextPermissions[moduleKey] = level;
        }

        update.permissions = nextPermissions;
        changes.permissions = { to: permissions };
    }

    if (verticals !== undefined) {
        if (!Array.isArray(verticals) || verticals.some((v) => typeof v !== 'string')) {
            return res.status(400).json({ error: 'verticals must be an array of vertical ids' });
        }
        update.verticals = verticals;
        changes.verticals = { from: targetData.verticals || [], to: verticals };
    }

    if (publicTitle !== undefined) {
        if (typeof publicTitle !== 'string' || publicTitle.length > 80) {
            return res.status(400).json({ error: 'publicTitle must be a string up to 80 characters' });
        }
        update.publicTitle = publicTitle.trim();
        changes.publicTitle = { from: targetData.publicTitle || '', to: update.publicTitle };
    }

    if (avatarUrl !== undefined) {
        if (typeof avatarUrl !== 'string' || avatarUrl.length > 2_000_000) {
            return res.status(400).json({ error: 'avatarUrl must be a valid image under 2 MB' });
        }
        update.avatarUrl = avatarUrl.trim();
        changes.avatarUrl = { changed: true };
    }

    if (avatarPosition !== undefined) {
        const x = Number(avatarPosition?.x);
        const y = Number(avatarPosition?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
            return res.status(400).json({ error: 'avatarPosition x and y must be between 0 and 100' });
        }
        update.avatarPosition = { x, y };
        changes.avatarPosition = update.avatarPosition;
    }

    if (ecellJoinDate !== undefined) {
        if (ecellJoinDate !== null && (!/^\\d{4}-\\d{2}-\\d{2}$/.test(ecellJoinDate) || Number.isNaN(new Date(`${ecellJoinDate}T00:00:00Z`).getTime()))) {
            return res.status(400).json({ error: 'ecellJoinDate must be a valid date' });
        }
        update.ecellJoinDate = ecellJoinDate || null;
        changes.ecellJoinDate = update.ecellJoinDate;
    }

    if (membershipStatus !== undefined) {
        if (!['active', 'inactive', 'banned', 'past_member'].includes(membershipStatus)) {
            return res.status(400).json({ error: 'membershipStatus must be active, inactive, banned, or past_member' });
        }
        update.membershipStatus = membershipStatus;
        changes.membershipStatus = membershipStatus;
    }

    if (displayStatus !== undefined) {
        if (!['active', 'inactive'].includes(displayStatus)) {
            return res.status(400).json({ error: 'displayStatus must be active or inactive' });
        }
        update.displayStatus = displayStatus;
        changes.displayStatus = displayStatus;
    }

    if (Object.keys(changes).length === 0) {
        return res.status(400).json({ error: 'Nothing to update — provide roles, permissions, verticals and/or publicTitle' });
    }

    await targetRef.update(update);
    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: isSystemOwner(caller) ? 'system_owner' : 'users:manage',
        action: 'update_member_access',
        targetType: 'member',
        targetId: uid,
        metadata: changes,
    });

    return res.status(200).json({ success: true });
}

// Body: { order: [{ uid, priority }, ...] }. Mirrors api/team.js's existing
// reorder action (batch-update just the priority field) applied to members
// instead of the legacy TEAM_MEMBERS collection.
async function handleReorder(req, res) {
    // Display order is the one Team page action the 'team' permission may manage.
    const caller = await requireAnyPermission(req, [['users', 'manage'], ['team', 'manage']]);

    const { order } = req.body || {};
    if (!Array.isArray(order) || order.length === 0) {
        return res.status(400).json({ error: 'order must be a non-empty array of { uid, priority }' });
    }

    const batch = db.batch();
    for (const entry of order) {
        if (!entry?.uid || typeof entry.priority !== 'number') continue;
        batch.update(db.collection('members').doc(entry.uid), {
            priority: entry.priority,
            lastUpdated: FieldValue.serverTimestamp(),
        });
    }
    await batch.commit();

    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: isSystemOwner(caller) ? 'system_owner' : 'users:manage',
        action: 'reorder_members',
        targetType: 'member',
        targetId: null,
        metadata: { count: order.length },
    });

    return res.status(200).json({ success: true });
}

// Public, unauthenticated — the only data the live Team page may read. Only
// members whose profile is complete (see profileMissing) are listed. Never
// return email/phone/PRN/permissions here, only what's safe to show visitors.
// Returns no members at all until a system owner explicitly flips the roster
// live (see handleSetRosterLive) — the Team page's existing fallback logic
// then shows the old hardcoded roster on its own, with no client-side change
// needed here.
async function handlePublicRoster(req, res) {
    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');

    const configSnap = await TEAM_ROSTER_CONFIG_REF.get();
    const live = configSnap.exists && configSnap.data().live === true;
    if (!live) {
        return res.status(200).json({ success: true, members: [], live: false });
    }

    const { ready } = await getReadyEcellMembersDocs();

    const members = ready
        .map((doc) => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name || '',
                avatarUrl: data.avatarUrl || '',
                publicTitle: data.publicTitle || '',
                roles: Array.isArray(data.roles) ? data.roles : [],
                verticals: Array.isArray(data.verticals) ? data.verticals : [],
                priority: typeof data.priority === 'number' ? data.priority : 9999,
            };
        })
        .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));

    return res.status(200).json({ success: true, members, live: true });
}

// Authenticated — tells the admin panel whether the public page is live yet
// and how many real core members are ready, so "Go Live" isn't a blind leap.
async function handleRosterStatus(req, res) {
    await requireAnyPermission(req, [['users', 'view'], ['settings', 'view']]);

    const [configSnap, { ready, totalActive }] = await Promise.all([
        TEAM_ROSTER_CONFIG_REF.get(),
        getReadyEcellMembersDocs(),
    ]);

    return res.status(200).json({
        success: true,
        live: configSnap.exists && configSnap.data().live === true,
        readyCount: ready.length,
        pendingCount: totalActive - ready.length,
    });
}

// System owner only — this flips what every visitor to the public site sees,
// so it's deliberately held to a higher bar than the general 'users:manage'
// permission used elsewhere in this file.
async function handleSetRosterLive(req, res) {
    // Flips what every visitor sees, so it needs the 'settings' permission
    // (system owners and the admin-panel key always hold it) — not merely
    // the general 'users' one.
    const caller = await requireAnyPermission(req, [['settings', 'manage']]);
    const { live } = req.body || {};
    if (typeof live !== 'boolean') {
        return res.status(400).json({ error: 'live must be true or false' });
    }

    await TEAM_ROSTER_CONFIG_REF.set({
        live,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: caller.uid,
    }, { merge: true });

    await writeAuditLog({
        actorUid: caller.uid,
        actorRole: isSystemOwner(caller) ? 'system_owner' : 'settings:manage',
        action: live ? 'team_roster_go_live' : 'team_roster_revert_to_static',
        targetType: 'site_config',
        targetId: 'team_roster',
        metadata: { live },
    });

    return res.status(200).json({ success: true, live });
}
