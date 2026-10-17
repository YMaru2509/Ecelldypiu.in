import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Search, X, Download, Send, CheckCircle2, Ticket, Calendar, Trash2, UserCheck, UserX, RotateCcw } from 'lucide-react';
import PanelShell from './PanelShell';
import { adminAuthHeaders } from '../../utils/adminAuth';
import { downloadAuthenticatedFile } from '../../utils/download';
import { usePanelAccess } from '../../context/panelAccessContext';
import { hasPermission } from '../../utils/rbac';

const fmt = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const STATUS_STYLE = {
    pending: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
    shortlisted: 'text-[var(--success-color)] border-[var(--success-color)]/40 bg-[var(--success-bg)]',
    rejected: 'text-red-400 border-red-400/40 bg-red-900/20',
};
const STATUS_LABEL = { pending: 'Pending review', shortlisted: 'Shortlisted', rejected: 'Rejected' };
const BATCH = 8; // the server takes at most 10 per request (each shortlist sends an email)

// Registrations for an event. Open events: who signed up, who has been checked in
// at the door, re-send a lost pass. Shortlisting events (event.requiresShortlisting):
// applications are reviewed here — shortlisting someone emails them their pass, and
// only shortlisted people are admitted at the door. (Scanning is the separate Door
// Check-In screen.)
const PassesPanel = () => {
    const { profile } = usePanelAccess();
    const canManage = hasPermission(profile, 'passes', 'manage');

    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState('');
    const [registrations, setRegistrations] = useState([]);
    const [fields, setFields] = useState([]);
    const [gated, setGated] = useState(false);
    const [openId, setOpenId] = useState(null);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(() => new Set());
    const [sendingId, setSendingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [reviewing, setReviewing] = useState('');
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetch('/api/event?action=get-events', { headers: adminAuthHeaders() })
            .then((r) => r.json())
            .then((d) => {
                const list = (Array.isArray(d) ? d.filter((e) => !e.internalOnly) : [])
                    .sort((a, b) => Number(b.upcoming === true) - Number(a.upcoming === true));
                setEvents(list);
                if (list[0]?.upcoming) setEventId((current) => current || list[0].id);
            })
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
            setGated(data.requiresShortlisting === true);
            setFields((data.fields || []).filter((f) => !['name', 'email', 'phone'].includes(f.key)));
            setSelected(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    const counts = useMemo(() => {
        const c = { all: registrations.length, pending: 0, shortlisted: 0, rejected: 0 };
        registrations.forEach((r) => { if (c[r.status] !== undefined) c[r.status] += 1; });
        return c;
    }, [registrations]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return registrations.filter((r) => {
            if (gated && statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (!q) return true;
            return [r.name, r.email, r.phone, ...Object.values(r.answers || {})].some((f) => (f || '').toLowerCase().includes(q));
        });
    }, [registrations, query, statusFilter, gated]);

    const checkedIn = registrations.filter((r) => r.checkedIn && (!gated || r.status === 'shortlisted')).length;
    const allShownSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

    const toggle = (id) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const toggleAllShown = () => setSelected(allShownSelected ? new Set() : new Set(visible.map((r) => r.id)));

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
            setRegistrations((prev) => prev.map((r) => (r.id === reg.id ? { ...r, passSentAt: new Date().toISOString() } : r)));
        } catch (err) {
            setError(err.message);
        } finally {
            setSendingId(null);
        }
    };

    // Shortlist / reject / reset one or many. Shortlisting emails each person their
    // pass, so it goes in small batches with a running tally.
    const review = async (ids, status) => {
        if (ids.length === 0) return;
        const who = ids.length === 1 ? registrations.find((r) => r.id === ids[0])?.name || 'this person' : `${ids.length} people`;
        const prompt = {
            shortlisted: `Shortlist ${who}? Each will be emailed their pass right away.`,
            rejected: `Mark ${who} as not shortlisted? Nothing is emailed, and they won't be admitted at the door.`,
            pending: `Move ${who} back to pending review?`,
        }[status];
        if (!window.confirm(prompt)) return;

        setError('');
        setNotice('');
        let done = 0; const failedEmails = []; const failed = [];
        try {
            for (let i = 0; i < ids.length; i += BATCH) {
                const chunk = ids.slice(i, i + BATCH);
                setReviewing(`${status === 'shortlisted' ? 'Shortlisting and emailing' : 'Updating'} ${Math.min(i + BATCH, ids.length)} of ${ids.length}…`);
                const res = await fetch('/api/event?action=set-registration-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                    body: JSON.stringify({ eventId, registrationIds: chunk, status }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to update the registrations');
                (data.results || []).forEach((r) => {
                    if (!r.ok) { failed.push(r.id); return; }
                    done += 1;
                    if (r.emailError) failedEmails.push(`${registrations.find((x) => x.id === r.id)?.name || r.id} (${r.emailError})`);
                });
            }
            const verb = { shortlisted: 'Shortlisted', rejected: 'Marked as not shortlisted:', pending: 'Moved to pending:' }[status];
            const parts = [`${verb} ${done}${status === 'shortlisted' ? ` — passes emailed to ${done - failedEmails.length}` : ''}.`];
            if (failedEmails.length) parts.push(`Shortlisted but the pass email failed for: ${failedEmails.join('; ')}. Use Resend pass on them.`);
            if (failed.length) parts.push(`${failed.length} not found.`);
            (failedEmails.length || failed.length ? setError : setNotice)(parts.join(' '));
        } catch (err) {
            setError(`${err.message}${done ? ` (${done} updated before the error)` : ''}`);
        } finally {
            setReviewing('');
            await load();
        }
    };

    const remove = async (reg) => {
        if (!window.confirm(`Delete the registration for ${reg.name} (${reg.email})? Their pass will stop working. This can't be undone.`)) return;
        setDeletingId(reg.id);
        setError('');
        setNotice('');
        try {
            const res = await fetch('/api/event?action=delete-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ eventId, registrationId: reg.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete the registration');
            setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
            setSelected((prev) => { const next = new Set(prev); next.delete(reg.id); return next; });
            if (openId === reg.id) setOpenId(null);
            setNotice(`Deleted the registration for ${reg.name}.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
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

    const actionBtn = 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50';

    return (
        <PanelShell>
            <h1 className="text-2xl md:text-3xl font-black uppercase mb-1">{gated ? 'Applications & Passes' : 'Event Passes'}</h1>
            <p className="text-xs text-[var(--text-secondary)] mb-6">
                {gated
                    ? `Review applications, then shortlist: shortlisted people are emailed their pass and are the only ones admitted at the door. ${canManage ? '' : 'View-only access.'}`
                    : `Public registrations and the QR passes emailed to them. ${canManage ? 'You can re-send a pass.' : 'View-only access.'}`}
            </p>

            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5 mb-6">
                <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Event
                </label>
                {loadingEvents ? (
                    <Loader2 className="w-5 h-5 animate-spin text-brand-yellow" />
                ) : (
                    <select value={eventId} onChange={(e) => { setEventId(e.target.value); setQuery(''); setNotice(''); setStatusFilter('all'); }}
                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-2.5 text-[var(--text-primary)] rounded-xl text-sm">
                        <option value="">Select an event…</option>
                        {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                )}
                {eventId && !loading && (
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                        <p className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2">
                            <Ticket className="w-3.5 h-3.5 text-brand-yellow" />
                            {gated
                                ? `${counts.all} applications · ${counts.shortlisted} shortlisted · ${counts.pending} pending · ${counts.rejected} rejected · ${checkedIn} checked in`
                                : `${registrations.length} registered · ${checkedIn} checked in`}
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
            {reviewing && (
                <div className="mb-4 p-4 rounded-xl border-2 border-brand-yellow text-brand-yellow font-bold text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {reviewing}
                </div>
            )}

            {eventId && (
                loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
                ) : (
                    <>
                        {gated && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['all', 'pending', 'shortlisted', 'rejected'].map((key) => (
                                    <button key={key} type="button" onClick={() => setStatusFilter(key)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-black uppercase border-2 ${statusFilter === key ? 'bg-brand-yellow text-[var(--text-on-brand)] border-brand-yellow' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-brand-yellow'}`}>
                                        {key === 'all' ? 'All' : STATUS_LABEL[key].split(' ')[0]} ({counts[key]})
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name, email, phone, PRN or anything they answered" aria-label="Search registrations"
                                className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] pl-9 pr-10 py-3 text-[var(--text-primary)] rounded-xl text-sm" />
                            {query && (
                                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {gated && canManage && visible.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase cursor-pointer">
                                    <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} className="w-4 h-4 accent-brand-yellow" />
                                    {selected.size > 0 ? `${selected.size} selected` : `Select all ${visible.length} shown`}
                                </label>
                                {selected.size > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" disabled={!!reviewing} onClick={() => review([...selected], 'shortlisted')}
                                            className={`${actionBtn} bg-[var(--success-color)] text-black`}><UserCheck className="w-3.5 h-3.5" /> Shortlist &amp; email passes</button>
                                        <button type="button" disabled={!!reviewing} onClick={() => review([...selected], 'rejected')}
                                            className={`${actionBtn} text-red-400 border-2 border-red-400/40 hover:bg-red-900/20`}><UserX className="w-3.5 h-3.5" /> Not shortlisted</button>
                                        <button type="button" disabled={!!reviewing} onClick={() => review([...selected], 'pending')}
                                            className={`${actionBtn} text-[var(--text-secondary)] border-2 border-[var(--border-color)]`}><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            {visible.map((r) => {
                                const admitted = !gated || r.status === 'shortlisted';
                                return (
                                    <div key={r.id} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex items-start gap-3 min-w-0">
                                            {gated && canManage && (
                                                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name}`}
                                                    className="w-4 h-4 mt-1.5 accent-brand-yellow flex-shrink-0" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold truncate flex items-center gap-2 flex-wrap">
                                                    {r.name}
                                                    {gated && (
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status] || STATUS_STYLE.pending}`}>
                                                            {STATUS_LABEL[r.status] || r.status}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)] truncate">{[r.email, r.phone].filter(Boolean).join(' · ')}</p>
                                                <p className="text-[11px] text-[var(--text-muted)]">
                                                    Registered {fmt(r.registeredAt)}
                                                    {gated && r.status === 'shortlisted' && (r.passSentAt ? ` · Pass sent ${fmt(r.passSentAt)}` : ' · Pass email not sent yet')}
                                                </p>
                                                {fields.length > 0 && (
                                                    <button type="button" onClick={() => setOpenId(openId === r.id ? null : r.id)}
                                                        className="text-[11px] font-black uppercase text-brand-yellow mt-1 hover:underline">
                                                        {openId === r.id ? 'Hide answers' : 'View answers'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                            {admitted && (r.checkedIn ? (
                                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-[var(--success-color)]">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Checked in {fmt(r.checkedInAt)}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Not checked in</span>
                                            ))}
                                            {gated && canManage && r.status !== 'shortlisted' && (
                                                <button type="button" disabled={!!reviewing} onClick={() => review([r.id], 'shortlisted')}
                                                    className={`${actionBtn} bg-[var(--success-color)] text-black`}><UserCheck className="w-3.5 h-3.5" /> Shortlist</button>
                                            )}
                                            {gated && canManage && r.status === 'pending' && (
                                                <button type="button" disabled={!!reviewing} onClick={() => review([r.id], 'rejected')}
                                                    className={`${actionBtn} text-red-400 hover:bg-red-900/20`}><UserX className="w-3.5 h-3.5" /> Reject</button>
                                            )}
                                            {gated && canManage && r.status !== 'pending' && (
                                                <button type="button" disabled={!!reviewing} onClick={() => review([r.id], 'pending')}
                                                    className={`${actionBtn} text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]`}><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
                                            )}
                                            {canManage && admitted && (
                                                <button type="button" disabled={sendingId === r.id} onClick={() => resend(r)}
                                                    className={`${actionBtn} text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}>
                                                    {sendingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Resend pass
                                                </button>
                                            )}
                                            {canManage && (
                                                <button type="button" disabled={deletingId === r.id} onClick={() => remove(r)} aria-label={`Delete registration for ${r.name}`}
                                                    className={`${actionBtn} text-red-400 hover:text-red-300 hover:bg-red-900/20`}>
                                                    {deletingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                                                </button>
                                            )}
                                        </div>
                                        {openId === r.id && (
                                            <dl className="basis-full grid sm:grid-cols-2 gap-x-6 gap-y-3 border-t-2 border-[var(--border-color)] pt-4 mt-1">
                                                {fields.map((f) => (
                                                    <div key={f.key} className={f.type === 'textarea' || (r.answers?.[f.key] || '').length > 80 ? 'sm:col-span-2' : ''}>
                                                        <dt className="text-[10px] font-black uppercase text-[var(--text-muted)]">{f.label}</dt>
                                                        <dd className="text-sm whitespace-pre-wrap break-words">{r.answers?.[f.key] || '—'}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        )}
                                    </div>
                                );
                            })}
                            {visible.length === 0 && (
                                <p className="text-sm text-[var(--text-secondary)] text-center py-10">
                                    {query ? `No registrations match “${query.trim()}”.` : statusFilter !== 'all' ? `Nobody is ${statusFilter} yet.` : 'Nobody has registered for this event yet.'}
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
