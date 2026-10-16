import { LayoutDashboard, Users, UserRound, QrCode, ScanLine, ClipboardCheck, Layers } from 'lucide-react';
import { hasPermission, hasRole, isSystemOwner } from './rbac';

// Everything the staff panel can show, and who may open each screen. This is
// the client's view only (what to display) — the server re-checks the same
// rules on every request, so hiding a link here is never the security boundary.
// Approvals are role-based on the server (vertical heads / board members), the
// rest are permission-based.
export const PANEL_MODULES = [
    {
        key: 'dashboard', label: 'Dashboard', path: '/panel', icon: LayoutDashboard,
        description: 'Overview of what you can manage.',
        access: () => true,
    },
    {
        key: 'team', label: 'Team Members', path: '/panel/team', icon: Users,
        description: 'Invite, organise and manage core team members and their access.',
        access: (p) => hasPermission(p, 'users', 'view'),
    },
    {
        key: 'members', label: 'Members', path: '/panel/members', icon: UserRound,
        description: 'Registered student members.',
        access: (p) => hasPermission(p, 'users', 'view'),
    },
    {
        key: 'events', label: 'Event Attendance', path: '/panel/events', icon: QrCode,
        description: 'Run QR check-in for the core team at an event.',
        access: (p) => hasPermission(p, 'events', 'view'),
    },
    {
        key: 'door-checkin', label: 'Door Check-In', path: '/panel/door-checkin', icon: ScanLine,
        description: 'Scan registrants’ passes at the door.',
        access: (p) => hasPermission(p, 'registrations', 'view'),
    },
    {
        key: 'attendance-queue', label: 'Attendance Approvals', path: '/panel/attendance', icon: ClipboardCheck,
        description: 'Review and approve attendance requests.',
        access: (p) => isSystemOwner(p) || hasRole(p, 'vertical_head') || hasRole(p, 'board_member'),
    },
    {
        key: 'verticals', label: 'E-Cell Verticals', path: '/panel/verticals', icon: Layers,
        description: 'Create verticals and assign their heads.',
        access: (p) => hasPermission(p, 'attendance', 'view'),
    },
];

export const getAccessibleModules = (profile) => PANEL_MODULES.filter((m) => m.access(profile));

// True when the member can open at least one real screen (the dashboard alone
// doesn't count) — decides whether the navbar shows the Staff Panel button.
export const hasStaffAccess = (profile) =>
    !!profile && PANEL_MODULES.some((m) => m.key !== 'dashboard' && m.access(profile));
