import { Link } from 'react-router-dom';
import PanelShell from './PanelShell';
import { PANEL_MODULES } from '../../utils/panelModules';
import { usePanelAccess } from '../../context/panelAccessContext';

const PanelHome = () => {
    const { mode, name, profile } = usePanelAccess();
    const modules = PANEL_MODULES.filter((m) => m.key !== 'dashboard' && m.access(profile));

    return (
        <PanelShell>
            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 md:p-8 mb-6">
                <h1 className="text-2xl md:text-4xl font-black uppercase mb-2">
                    {mode === 'member' ? `Welcome, ${name?.split(' ')[0] || 'Staff'}` : 'Attendance Management'}
                </h1>
                <p className="text-[var(--text-secondary)]">
                    {mode === 'member'
                        ? 'You’re signed in with your own account. Only the modules you’ve been given access to are shown.'
                        : 'Manage member roles, E-Cell verticals, and attendance request approvals. Everything here is gated by your admin panel login.'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {modules.map((m) => {
                    const Icon = m.icon;
                    return (
                        <Link
                            key={m.key}
                            to={m.path}
                            className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] hover:border-brand-yellow rounded-2xl p-5 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Icon className="w-5 h-5 text-brand-yellow" />
                                <p className="font-black uppercase text-sm">{m.label}</p>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">{m.description}</p>
                        </Link>
                    );
                })}
            </div>
        </PanelShell>
    );
};

export default PanelHome;
