import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import PanelShell from './PanelShell';
import TeamRosterControl from '../../components/TeamRosterControl';
import { adminAuthHeaders } from '../../utils/adminAuth';
import { usePanelAccess } from '../../context/panelAccessContext';
import { hasPermission } from '../../utils/rbac';

// Site-wide switches. Today that's one: whether the public Team page shows the
// real, panel-managed roster or still the old hardcoded one.
const SettingsPanel = () => {
    const { profile } = usePanelAccess();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/panel-users?action=roster-status', { headers: adminAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load settings');
            setStatus(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <PanelShell>
            <h1 className="text-2xl md:text-3xl font-black uppercase mb-1">Settings</h1>
            <p className="text-xs text-[var(--text-secondary)] mb-6">Site-wide switches that change what every visitor sees.</p>

            {error && <div className="mb-4 p-4 rounded-xl bg-red-900/20 border-2 border-red-500 text-red-400 font-bold text-sm">{error}</div>}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
            ) : (
                <TeamRosterControl status={status} onRefresh={load} canToggle={hasPermission(profile, 'settings', 'manage')} />
            )}
        </PanelShell>
    );
};

export default SettingsPanel;
