import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Users, UserRound, LayoutDashboard, LogOut, ClipboardCheck, Layers } from 'lucide-react';
import { adminLogout } from '../../utils/adminAuth';

const NAV_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', path: '/panel', icon: LayoutDashboard },
    { key: 'team', label: 'Team Members', path: '/panel/team', icon: Users },
    { key: 'members', label: 'Members', path: '/panel/members', icon: UserRound },
    { key: 'attendance-queue', label: 'Attendance Approvals', path: '/panel/attendance', icon: ClipboardCheck },
    { key: 'verticals', label: 'E-Cell Verticals', path: '/panel/verticals', icon: Layers },
];

const PanelShell = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        adminLogout();
        navigate('/admin', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-28 pb-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row gap-6">
                <aside className="md:w-64 flex-shrink-0">
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4 md:sticky md:top-28">
                        <div className="flex items-center gap-2 px-2 pb-4 mb-2 border-b border-[var(--border-color)]">
                            <Shield className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                            <div>
                                <p className="font-black uppercase text-sm leading-tight">Attendance Management</p>
                                <p className="text-[10px] font-bold uppercase text-brand-yellow">Admin Console</p>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-1">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const active = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.key}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${active
                                                ? 'bg-brand-yellow text-[var(--text-on-brand)]'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase text-[var(--danger-color)] hover:bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] transition-colors mt-2"
                            >
                                <LogOut className="w-4 h-4 flex-shrink-0" />
                                Logout
                            </button>
                        </nav>
                    </div>
                </aside>
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
};

export default PanelShell;
