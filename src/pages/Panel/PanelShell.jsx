import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LogOut, ArrowLeft } from 'lucide-react';
import { adminLogout } from '../../utils/adminAuth';
import { PANEL_MODULES } from '../../utils/panelModules';
import { usePanelAccess } from '../../context/panelAccessContext';
import { hasRole, isSystemOwner } from '../../utils/rbac';

const panelIdentity = (profile, name) => {
    if (isSystemOwner(profile)) return `Owner · ${name || 'Account'}`;
    if (hasRole(profile, 'vertical_head')) return `Vertical Head · ${(profile?.verticalNames || []).join(', ') || 'Assigned domain'}`;
    if (hasRole(profile, 'board_member')) return `Board Member · ${(profile?.verticalNames || []).join(', ') || 'Board'}`;
    return `Staff · ${(profile?.verticalNames || []).join(', ') || 'E-Cell'}`;
};

const panelTitle = (profile) => {
    if (isSystemOwner(profile)) return 'Owner Dashboard';
    if (hasRole(profile, 'vertical_head')) return 'Vertical Head Dashboard';
    if (hasRole(profile, 'board_member')) return 'Board Dashboard';
    return 'Staff Dashboard';
};

const PanelShell = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { mode, name, profile } = usePanelAccess();
    const isMember = mode === 'member';
    const items = PANEL_MODULES.filter((m) => m.access(profile));

    const handleLogout = () => {
        adminLogout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-28 pb-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row gap-6">
                <aside className="md:w-64 flex-shrink-0">
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4 md:sticky md:top-28">
                        <div className="flex items-center gap-2 px-2 pb-4 mb-2 border-b border-[var(--border-color)]">
                            <Shield className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-black uppercase text-sm leading-tight">{isMember ? panelTitle(profile) : 'Owner Console'}</p>
                                <p className="text-[10px] font-bold uppercase text-brand-yellow truncate">
                                    {isMember ? panelIdentity(profile, name) : 'Owner Console'}
                                </p>
                            </div>
                        </div>
                        <nav className="flex flex-col gap-1">
                            {items.map((item) => {
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
                            {isMember ? (
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors mt-2"
                                >
                                    <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                                    Exit Staff Panel
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase text-[var(--danger-color)] hover:bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] transition-colors mt-2"
                                >
                                    <LogOut className="w-4 h-4 flex-shrink-0" />
                                    Logout
                                </button>
                            )}
                        </nav>
                    </div>
                </aside>
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
};

export default PanelShell;
