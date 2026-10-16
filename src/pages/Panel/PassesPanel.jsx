import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Search, X, Download, Send, CheckCircle2, Ticket, Calendar } from 'lucide-react';
import PanelShell from './PanelShell';
import { adminAuthHeaders } from '../../utils/adminAuth';
import { downloadAuthenticatedFile } from '../../utils/download';
import { usePanelAccess } from '../../context/panelAccessContext';
import { hasPermission } from '../../utils/rbac';

const fmt = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// Public registrations for an event: who signed up for a pass, who has been
// checked in at the door, and a way to re-send a lost pass. (Scanning passes at
// the door is the separate Door Check-In screen.)
const PassesPanel = () => {
    const { profile } = usePanelAccess();
    const canManage = hasPermission(profile, 'passes', 'manage');

    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState('');
    const [registrations, setRegistrations] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [query, setQuery] = useState('');
    const [sendingId, setSendingId] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetch('/api/event?action=get-events', { headers: adminAuthHeaders() })
            .then((r) => r.json())
            .then((d) => setEvents(Array.isArray(d) ? d.filter((e) => !e.internalOnly) : []))
            .catch(() => setError('Could not load events'))
            .finally(() => setLoadingEvents(false));
    }, []);

    const load = useCallback(async () => {
        if (!eventId) { setRegistrations([]); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/event?action=list-registrations&eventId=${encodeURIComponent(eventId)}`, { headers: adminAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load registrations');
            setRegistrations(data.registrations || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return registrations;
        return registrations.filter((r) => [r.name, r.email, r.phone].some((f) => (f || '').toLowerCase().includes(q)));
    }, [registrations, query]);

    const checkedIn = registrations.filter((r) => r.checkedIn).length;

    const resend = async (reg) => {
        setSendingId(reg.id);
        setError('');
        setNotice('');
        try {
            const res = await fetch('/api/event?action=resend-pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ eventId, registrationId: reg.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to resend the pass');
            setNotice(`Pass re-sent to ${data.email}.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSendingId(null);
        }
    };

    const download = async () => {
        setDownloading(true);
        setError('');
        try {
            await downloadAuthenticatedFile(`/api/event?action=export-registrations&eventId=${encodeURIComponent(eventId)}`, 'registrations.csv');
        } catch (err) {
            setError(err.message);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <PanelShell>
            <h1 className="text-2xl md:text-3xl font-black uppercase mb-1">Event Passes</h1>
            <p className="text-xs text-[var(--text-secondary)] mb-6">
                Public registrations and the QR passes emailed to them. {canManage ? 'You can re-send a pass.' : 'View-only access.'}
            </p>

            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5 mb-6">
                <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Event
                </label>
                {loadingEvents ? (
                    <Loader2 className="w-5 h-5 animate-spin text-brand-yellow" />
                ) : (
                    <select value={eventId} onChange={(e) => { setEventId(e.target.value); setQuery(''); setNotice(''); }}
                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-2.5 text-[var(--text-primary)] rounded-xl text-sm">
                        <option value="">Select an event…</option>
                        {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                )}
                {eventId && !loading && (
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                        <p className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2">
                            <Ticket className="w-3.5 h-3.5 text-brand-yellow" />
                            {registrations.length} registered · {checkedIn} checked in
                        </p>
                        <button type="button" onClick={download} disabled={downloading || registrations.length === 0}
                            className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2 rounded-xl text-xs font-black uppercase disabled:opacity-50">
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download CSV
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="mb-4 p-4 rounded-xl bg-red-900/20 border-2 border-red-500 text-red-400 font-bold text-sm">{error}</div>}
            {notice && <div className="mb-4 p-4 rounded-xl border-2 border-[var(--success-color)] text-[var(--success-color)] font-bold text-sm">{notice}</div>}

            {eventId && (
                loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
                ) : (
                    <>
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name, email or phone" aria-label="Search registrations"
                                className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] pl-9 pr-10 py-3 text-[var(--text-primary)] rounded-xl text-sm" />
                            {query && (
                                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {visible.map((r) => (
                                <div key={r.id} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{r.name}</p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate">{[r.email, r.phone].filter(Boolean).join(' · ')}</p>
                                        <p className="text-[11px] text-[var(--text-muted)]">Registered {fmt(r.registeredAt)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {r.checkedIn ? (
                                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-[var(--success-color)]">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Checked in {fmt(r.checkedInAt)}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Not checked in</span>
                                        )}
                                        {canManage && (
                                            <button type="button" disabled={sendingId === r.id} onClick={() => resend(r)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50">
                                                {sendingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Resend pass
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {visible.length === 0 && (
                                <p className="text-sm text-[var(--text-secondary)] text-center py-10">
                                    {query ? `No registrations match “${query.trim()}”.` : 'Nobody has registered for this event yet.'}
                                </p>
                            )}
                        </div>
                    </>
                )
            )}
        </PanelShell>
    );
};

export default PassesPanel;
