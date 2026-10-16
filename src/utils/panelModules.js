import {
    LayoutDashboard, Users, UserRound, QrCode, ScanLine, ClipboardCheck, Layers, Newspaper, Mail,
    PenSquare, CalendarPlus, Ticket, Award, Handshake, Send, Link2, ScrollText, Settings,
} from 'lucide-react';
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
        description: 'The core team roster — view it, and manage it if you have permission.',
        access: (p) => hasPermission(p, 'users', 'view') || hasPermission(p, 'team', 'view'),
    },
    {
        key: 'members', label: 'Members', path: '/panel/members', icon: UserRound,
        description: 'Registered student members.',
        access: (p) => hasPermission(p, 'users', 'view'),
    },
    {
        key: 'blogs', label: 'Blogs', path: '/panel/blogs', icon: Newspaper,
        description: 'See every blog post and its publish status.',
        access: (p) => hasPermission(p, 'blogs', 'view'),
    },
    {
        key: 'subscribers', label: 'Subscribers', path: '/panel/subscribers', icon: Mail,
        description: 'Newsletter subscribers and their contact details.',
        access: (p) => hasPermission(p, 'subscribers', 'view'),
    },
    {
        key: 'blog-editor', label: 'Write Blog', path: '/panel/write-blog', icon: PenSquare,
        description: 'Write and publish a blog post.',
        access: (p) => hasPermission(p, 'blogs', 'manage'),
    },
    {
        key: 'event-manager', label: 'Manage Events', path: '/panel/manage-events', icon: CalendarPlus,
        description: 'Create, edit and delete events — start from an approval document.',
        access: (p) => hasPermission(p, 'events', 'manage'),
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
        key: 'passes', label: 'Event Passes', path: '/panel/passes', icon: Ticket,
        description: 'Public registrations, check-in status and re-sending passes.',
        access: (p) => hasPermission(p, 'passes', 'view'),
    },
    {
        key: 'certificates', label: 'Certificates', path: '/panel/certificates', icon: Award,
        description: 'Design certificate templates and send them to attendees.',
        access: (p) => hasPermission(p, 'certificates', 'view'),
    },
    {
        key: 'collaborations', label: 'Collaborations', path: '/panel/collaborations', icon: Handshake,
        description: 'Review partnership proposals and edit the proposal form.',
        access: (p) => hasPermission(p, 'collaborations', 'view'),
    },
    {
        key: 'mass-mail', label: 'Mass Mail', path: '/panel/mass-mail', icon: Send,
        description: 'Send announcements and event mail, and review the send log.',
        access: (p) => hasPermission(p, 'mass-mail', 'view'),
    },
    {
        key: 'links', label: 'Short Links', path: '/panel/links', icon: Link2,
        description: 'Create short links and QR codes, and track clicks.',
        access: (p) => hasPermission(p, 'links', 'view'),
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
    {
        key: 'audit', label: 'Audit Log', path: '/panel/audit', icon: ScrollText,
        description: 'See who did what — an uneditable record of privileged actions.',
        access: (p) => hasPermission(p, 'audit', 'view'),
    },
    {
        key: 'settings', label: 'Settings', path: '/panel/settings', icon: Settings,
        description: 'Site-wide switches, like which roster the Team page shows.',
        access: (p) => hasPermission(p, 'settings', 'view'),
    },
];

export const getAccessibleModules = (profile) => PANEL_MODULES.filter((m) => m.access(profile));

// True when the member can open at least one real screen (the dashboard alone
// doesn't count) — decides whether the navbar shows the Staff Panel button.
export const hasStaffAccess = (profile) =>
    !!profile && PANEL_MODULES.some((m) => m.key !== 'dashboard' && m.access(profile));
