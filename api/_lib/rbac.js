// Single chokepoint for "who can do what" across every panel module (new or migrated
// from the legacy shared-secret /admin). Every privileged endpoint verifies the caller's
// real Firebase ID token here instead of comparing against a shared ADMIN_API_KEY.
import { auth, db } from './firebaseAdmin.js';

export const MODULES = [
    'blogs', 'events', 'subscribers', 'certificates',
    'passes', 'collaborations', 'mass-mail', 'registrations',
    'team', 'users', 'links', 'settings', 'attendance', 'audit'
];

export const PERMISSION_LEVELS = ['none', 'view', 'manage'];

export class RbacError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Synthetic actor used when the caller presents the shared /admin panel key
// instead of a personal Firebase session — deliberate: Attendance Management is
// reached from /admin now and is gated by the same admin credentials as the
// rest of it, by explicit choice. Carries full system_owner-equivalent access.
// There is no individual identity behind this key, so actions taken this way
// are attributed to "Admin" generically in audit logs/approval history, not to
// a specific person — that tradeoff was confirmed deliberately, not an oversight.
const ADMIN_PANEL_ACTOR = {
    uid: 'admin-panel',
    name: 'Admin',
    email: 'admin@ecelldypiu.in',
    roles: ['system_owner'],
    permissions: {},
    verticals: [],
    isAdminPanelActor: true,
};

// Verifies the bearer credential and loads the caller's members/{uid} doc —
// or, if the bearer token is the shared ADMIN_API_KEY, returns the synthetic
// admin-panel actor instead. Throws RbacError(401) if the token is missing/
// invalid, RbacError(403) if there's no member profile or the account is disabled.
export async function getCallerMember(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new RbacError(401, 'Missing or invalid Authorization header');
    }
    const token = authHeader.slice('Bearer '.length);

    if (process.env.ADMIN_API_KEY && token === process.env.ADMIN_API_KEY) {
        return ADMIN_PANEL_ACTOR;
    }

    let decoded;
    try {
        decoded = await auth.verifyIdToken(token);
    } catch {
        throw new RbacError(401, 'Invalid or expired session');
    }

    const uid = decoded.uid;
    const snap = await db.collection('members').doc(uid).get();
    if (!snap.exists) {
        throw new RbacError(403, 'No member profile found for this account');
    }

    const member = { uid, ...snap.data() };
    if (member.disabled) {
        throw new RbacError(403, 'This account has been disabled');
    }
    return member;
}

export function isSystemOwner(member) {
    return Array.isArray(member?.roles) && member.roles.includes('system_owner');
}

export function hasRole(member, role) {
    return Array.isArray(member?.roles) && member.roles.includes(role);
}

// system_owner always passes. Otherwise checks the per-module permission map:
// 'manage' satisfies both 'view' and 'manage' checks; 'view' only satisfies 'view'.
export function hasPermission(member, moduleKey, level = 'view') {
    if (isSystemOwner(member)) return true;
    const granted = member?.permissions?.[moduleKey];
    if (!granted || granted === 'none') return false;
    if (level === 'view') return granted === 'view' || granted === 'manage';
    return granted === 'manage';
}

// Verifies the caller and enforces the permission in one call. Returns the
// member doc (with uid) on success so handlers can use it for attribution.
export async function requirePermission(req, moduleKey, level = 'view') {
    const member = await getCallerMember(req);
    if (!hasPermission(member, moduleKey, level)) {
        throw new RbacError(403, `You don't have ${level} access to ${moduleKey}`);
    }
    return member;
}

// Verifies the caller and requires system_owner specifically (used for
// role/permission assignment, which only system_owner may perform).
export async function requireSystemOwner(req) {
    const member = await getCallerMember(req);
    if (!isSystemOwner(member)) {
        throw new RbacError(403, 'Only a system owner can perform this action');
    }
    return member;
}

export function sendRbacError(res, error) {
    if (error instanceof RbacError) {
        return res.status(error.status).json({ error: error.message });
    }
    console.error('Unexpected RBAC error:', error);
    return res.status(500).json({ error: 'Internal server error' });
}
