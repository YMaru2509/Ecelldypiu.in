import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Search, X, Trash2 } from 'lucide-react';
import PanelShell from './PanelShell';
import { adminAuthHeaders } from '../../utils/adminAuth';
import { usePanelAccess } from '../../context/panelAccessContext';
import { hasPermission } from '../../utils/rbac';

const fmtDate = (value) => {
    const d = new Date(value?._seconds ? value._seconds * 1000 : value?.seconds ? value.seconds * 1000 : value);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SubscribersPanel = () => {
    const { profile } = usePanelAccess();
    const canManage = hasPermission(profile, 'subscribers', 'manage');
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/subscriber', { headers: adminAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load subscribers');
            setSubscribers(data.subscribers || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return subscribers;
        return subscribers.filter((s) => [s.name, s.email, s.phone, s.college].some((f) => (f || '').toLowerCase().includes(q)));
    }, [subscribers, query]);

    const remove = async (sub) => {
        if (!window.confirm(`Remove ${sub.email} from the subscriber list?`)) return;
        setDeletingId(sub.id);
        setError('');
        try {
            const res = await fetch('/api/subscriber', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ id: sub.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove subscriber');
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <PanelShell>
            <h1 className="text-2xl md:text-3xl font-black uppercase mb-1">Subscribers</h1>
            <p className="text-xs text-[var(--text-secondary)] mb-6">
                {canManage ? 'You can view and remove subscribers here.' : 'View-only access.'} Sending mail to subscribers happens in the admin portal.
            </p>

            <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, phone or college" aria-label="Search subscribers"
                    className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] pl-9 pr-10 py-3 text-[var(--text-primary)] rounded-xl text-sm"
                />
                {query && (
                    <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {error && <div className="mb-4 p-4 rounded-xl bg-red-900/20 border-2 border-red-500 text-red-400 font-bold text-sm">{error}</div>}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-[var(--text-secondary)]">
                        {query ? `Showing ${visible.length} of ${subscribers.length}` : `${subscribers.length} subscriber${subscribers.length === 1 ? '' : 's'}`}
                    </p>
                    {visible.map((sub) => (
                        <div key={sub.id} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                                <p className="font-bold truncate">{sub.name}</p>
                                <p className="text-xs text-[var(--text-secondary)] truncate">{sub.email}</p>
                                <p className="text-[11px] text-[var(--text-muted)] truncate">
                                    {[sub.phone, sub.college, fmtDate(sub.subscribedAt) && `Joined ${fmtDate(sub.subscribedAt)}`].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            {canManage && (
                                <button type="button" disabled={deletingId === sub.id} onClick={() => remove(sub)}
                                    className="flex items-center gap-1 text-[var(--danger-color)] px-3 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-[color-mix(in_srgb,var(--danger-bg)_20%,transparent)] disabled:opacity-50 flex-shrink-0">
                                    {deletingId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Remove
                                </button>
                            )}
                        </div>
                    ))}
                    {visible.length === 0 && (
                        <p className="text-sm text-[var(--text-secondary)] text-center py-10">{query ? `No subscribers match “${query.trim()}”.` : 'No subscribers yet.'}</p>
                    )}
                </div>
            )}
        </PanelShell>
    );
};

export default SubscribersPanel;
