// Client-side mirror of api/_lib/rbac.js, used only to decide what the UI shows.
// The server re-checks everything independently on every request — this file is
// never a security boundary by itself.
export const MODULES = [
    'blogs', 'events', 'subscribers', 'certificates',
    'passes', 'collaborations', 'mass-mail', 'registrations',
    'team', 'users', 'links', 'settings', 'attendance', 'audit'
];

export const PERMISSION_LEVELS = ['none', 'view', 'manage'];

export function isSystemOwner(profile) {
    return Array.isArray(profile?.roles) && profile.roles.includes('system_owner');
}

export function hasRole(profile, role) {
    return Array.isArray(profile?.roles) && profile.roles.includes(role);
}

export function hasPermission(profile, moduleKey, level = 'view') {
    if (isSystemOwner(profile)) return true;
    const granted = profile?.permissions?.[moduleKey];
    if (!granted || granted === 'none') return false;
    if (level === 'view') return granted === 'view' || granted === 'manage';
    return granted === 'manage';
}

