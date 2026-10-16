import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Search, X, RefreshCw } from 'lucide-react';
import PanelShell from './PanelShell';
import { adminAuthHeaders } from '../../utils/adminAuth';

const ACTION_LABELS = {
    invite_member: 'Invited a member',
    kick_member: 'Removed a member (banned)',
    unban_member: 'Unbanned a member',
    mark_member_left: 'Marked a member as left',
    delete_member_permanently: 'Permanently deleted a member',
    update_member_access: 'Changed a member’s access',
    reorder_members: 'Reordered the team',
    create_vertical: 'Created a vertical',
    update_vertical: 'Updated a vertical',
    submit_attendance_request: 'Submitted an attendance request',
    edit_attendance_request: 'Edited an attendance request',
    team_roster_go_live: 'Switched the Team page to the real roster',
    team_roster_revert_to_static: 'Switched the Team page back to the static roster',
};

const labelFor = (action) => ACTION_LABELS[action] || action.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const fmt = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Metadata can hold anything an action chose to record — show it as short
// key: value pairs, never raw JSON, and skip objects too big to read inline.
const summarise = (metadata) => Object.entries(metadata || {})
    .filter(([, v]) => v !== null && v !== '' && typeof v !== 'object')
    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${v}`)
    .join(' · ');

const AuditPanel = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/panel-users?action=audit-logs&limit=300', { headers: adminAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load the audit log');
            setLogs(data.logs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return logs;
        return logs.filter((l) => [labelFor(l.action), l.action, l.actorName, l.targetName, l.targetId, l.actorRole].some((f) => (f || '').toLowerCase().includes(q)));
    }, [logs, query]);

    return (
        <PanelShell>
            <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black uppercase">Audit Log</h1>
                <button type="button" onClick={load} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase border-2 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-6">The most recent 300 privileged actions, newest first. This record can’t be edited.</p>

            <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by action, person or role" aria-label="Search audit log"
                    className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] pl-9 pr-10 py-3 text-[var(--text-primary)] rounded-xl text-sm" />
                {query && (
                    <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {error && <div className="mb-4 p-4 rounded-xl bg-red-900/20 border-2 border-red-500 text-red-400 font-bold text-sm">{error}</div>}

            {loading && logs.length === 0 ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
            ) : (
                <div className="space-y-2">
                    {query && <p className="text-xs text-[var(--text-secondary)]">Showing {visible.length} of {logs.length}</p>}
                    {visible.map((l) => {
                        const detail = summarise(l.metadata);
                        return (
                            <div key={l.id} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <p className="font-bold text-sm">{labelFor(l.action)}</p>
                                    <p className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">{fmt(l.createdAt)}</p>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    By <strong>{l.actorName}</strong>{l.actorRole ? ` (${l.actorRole.replace(/_/g, ' ')})` : ''}
                                    {l.targetName ? <> · on <strong>{l.targetName}</strong></> : l.targetType && l.targetId ? ` · ${l.targetType} ${l.targetId}` : ''}
                                </p>
                                {detail && <p className="text-[11px] text-[var(--text-muted)] mt-1 break-words">{detail}</p>}
                            </div>
                        );
                    })}
                    {visible.length === 0 && (
                        <p className="text-sm text-[var(--text-secondary)] text-center py-10">{query ? `Nothing matches “${query.trim()}”.` : 'No audit entries yet.'}</p>
                    )}
                </div>
            )}
        </PanelShell>
    );
};

export default AuditPanel;
