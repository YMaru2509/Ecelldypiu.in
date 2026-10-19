import { useEffect, useMemo, useState, useCallback } from 'react';
import { createElement } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Search, X, Download, Send, CheckCircle2, Ticket, Calendar, Trash2, UserCheck, UserX, RotateCcw, ChevronLeft, ChevronRight, Maximize2, AlertTriangle } from 'lucide-react';
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
// Keep requests comfortably below the function timeout. The server also processes
// the emails concurrently, but smaller batches make a lost mobile connection cheap
// to retry and prevent one slow mail provider call from holding up the whole action.
const BATCH = 4;
const POST_RETRIES = 3;
const actionBtn = 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50';

// JSON POST that always explains itself: a non-JSON or non-2xx answer becomes a
// readable error instead of a silent failure.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function postJson(url, body) {
    let lastError;
    for (let attempt = 0; attempt < POST_RETRIES; attempt += 1) {
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() }, body: JSON.stringify(body) });
            const text = await res.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch { /* not JSON */ }
            if (!res.ok) {
                if (res.status === 405 || /invalid action/i.test(data.error || '')) {
                    throw new Error('The server doesn\'t have this action yet — the latest backend hasn\'t been deployed (or the dev server needs a restart).');
                }
                const error = new Error(data.error || `The server answered ${res.status}${text && !data.error ? ` (${text.slice(0, 120).replace(/\s+/g, ' ')})` : ''}.`);
                if (![502, 503, 504].includes(res.status)) throw error;
                lastError = error;
            } else {
                return data;
            }
        } catch (error) {
            lastError = error instanceof TypeError
                ? new Error('The connection was interrupted while contacting the server.')
                : error;
            if (!/interrupted|network|fetch|failed to fetch/i.test(lastError.message)) throw lastError;
        }
        if (attempt < POST_RETRIES - 1) await wait(800 * (attempt + 1));
    }
    throw lastError || new Error('The server did not respond.');
}

// Rendered into <body> so no ancestor (transforms, overflow) can clip a full-screen layer.
const Layer = ({ children }) => createPortal(children, document.body);

const ConfirmDialog = ({ dialog, onClose }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    const danger = dialog.tone === 'danger';
    return (
        <Layer>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70" role="dialog" aria-modal="true" aria-label={dialog.title} onClick={onClose}>
                <div className="w-full max-w-md bg-[var(--bg-card)] text-[var(--text-primary)] border-2 border-[var(--border-color)] rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start gap-3 mb-3">
                        {danger && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                        <h3 className="text-lg font-black uppercase leading-tight">{dialog.title}</h3>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">{dialog.body}</p>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className={`${actionBtn} text-[var(--text-secondary)] border-2 border-[var(--border-color)]`}>Cancel</button>
                        <button type="button" autoFocus onClick={() => { const run = dialog.onConfirm; onClose(); run(); }}
                            className={`${actionBtn} ${danger ? 'bg-red-500 text-white' : 'bg-[var(--success-color)] text-black'}`}>{dialog.confirmLabel}</button>
                    </div>
                </div>
            </div>
        </Layer>
    );
};

// Full-screen view of one application: every answer in a readable layout, with
// previous/next to move through the list and the review actions at hand.
const AnswersModal = ({ reg, index, total, fields, gated, canManage, busy, onClose, onPrev, onNext, onAction }) => {
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowLeft') onPrev();
            else if (e.key === 'ArrowRight') onNext();
        };
        window.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey); };
    }, [onClose, onPrev, onNext]);

    return (
        <Layer>
            <div className="fixed inset-0 z-[200] bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col" role="dialog" aria-modal="true" aria-label={`Answers from ${reg.name}`}>
                <header className="flex items-center justify-between gap-3 px-4 md:px-8 py-4 border-b-2 border-[var(--border-color)] bg-[var(--bg-card)]">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Application {index + 1} of {total}</p>
                        <h2 className="text-xl md:text-2xl font-black uppercase truncate flex items-center gap-3 flex-wrap">
                            {reg.name}
                            {gated && (
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLE[reg.status] || STATUS_STYLE.pending}`}>{STATUS_LABEL[reg.status] || reg.status}</span>
                            )}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-xl border-2 border-[var(--border-color)] hover:border-brand-yellow flex-shrink-0">
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                    <div className="max-w-3xl mx-auto space-y-5">
                        <div className="grid sm:grid-cols-3 gap-3">
                            {[['Email', reg.email], ['Phone', reg.phone], ['Applied', fmt(reg.registeredAt)]].map(([label, value]) => (
                                <div key={label} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl p-3 min-w-0">
                                    <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">{label}</p>
                                    <p className="text-sm font-bold break-words">{value || '—'}</p>
                                </div>
                            ))}
                        </div>
                        {fields.map((f) => {
                            const long = f.type === 'textarea';
                            return (
                                <div key={f.key} className={`bg-[var(--bg-card)] border-2 rounded-2xl ${long ? 'p-5 md:p-6 border-brand-yellow/40' : 'p-4 border-[var(--border-color)]'}`}>
                                    <p className="text-[11px] font-black uppercase text-brand-yellow mb-2">{f.label}</p>
                                    <p className={`whitespace-pre-wrap break-words ${long ? 'text-base md:text-lg leading-relaxed' : 'text-base font-bold'}`}>{reg.answers?.[f.key] || '—'}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 py-4 border-t-2 border-[var(--border-color)] bg-[var(--bg-card)]">
                    <div className="flex gap-2">
                        <button type="button" onClick={onPrev} disabled={index === 0} className={`${actionBtn} border-2 border-[var(--border-color)]`}><ChevronLeft className="w-4 h-4" /> Previous</button>
                        <button type="button" onClick={onNext} disabled={index >= total - 1} className={`${actionBtn} border-2 border-[var(--border-color)]`}>Next <ChevronRight className="w-4 h-4" /></button>
                    </div>
                    {gated && canManage && (
                        <div className="flex flex-wrap gap-2">
                            {reg.status !== 'shortlisted' && (
                                <button type="button" disabled={!!busy} onClick={() => onAction([reg.id], 'shortlisted')} className={`${actionBtn} bg-[var(--success-color)] text-black`}>
                                    {busy === `${reg.id}:shortlisted` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />} Shortlist
                                </button>
                            )}
                            {reg.status === 'pending' && (
                                <button type="button" disabled={!!busy} onClick={() => onAction([reg.id], 'rejected')} className={`${actionBtn} text-red-400 border-2 border-red-400/40 hover:bg-red-900/20`}>
                                    {busy === `${reg.id}:rejected` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />} Reject
                                </button>
                            )}
                            {reg.status !== 'pending' && (
                                <button type="button" disabled={!!busy} onClick={() => onAction([reg.id], 'pending')} className={`${actionBtn} text-[var(--text-secondary)] border-2 border-[var(--border-color)]`}>
                                    {busy === `${reg.id}:pending` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Reset
                                </button>
                            )}
                        </div>
                    )}
                </footer>
            </div>
        </Layer>
    );
};

// Registrations for an event. Open events: who signed up, who has been checked in
// at the door, re-send a lost pass. Shortlisting events (event.requiresShortlisting):
// applications are reviewed here — shortlisting someone emails them their pass, and
// only shortlisted people are admitted at the door. (Scanning passes at the door is
// the separate Door Check-In screen.)
const PassesPanel = () => {
    const { profile } = usePanelAccess();
    const canManage = hasPermission(profile, 'passes', 'manage');

    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState('');
    const [registrations, setRegistrations] = useState([]);
    const [fields, setFields] = useState([]);
    const [gated, setGated] = useState(false);
    const [viewId, setViewId] = useState(null);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'progress', text }
    const [dialog, setDialog] = useState(null);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(() => new Set());
    const [busy, setBusy] = useState(''); // `${id}:${action}` for single actions, 'bulk' for batches
    const [downloading, setDownloading] = useState(false);

    const flash = useCallback((type, text) => setToast({ type, text }), []);

    // Success messages fade on their own; errors and progress stay until dismissed or replaced.
    useEffect(() => {
        if (toast?.type !== 'success') return undefined;
        const t = setTimeout(() => setToast(null), 9000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        fetch('/api/event?action=get-events', { headers: adminAuthHeaders() })
            .then((r) => r.json())
            .then((d) => {
                const list = (Array.isArray(d) ? d.filter((e) => !e.internalOnly) : [])
                    .sort((a, b) => Number(b.upcoming === true) - Number(a.upcoming === true));
                setEvents(list);
                if (list[0]?.upcoming) setEventId((current) => current || list[0].id);
            })
            .catch(() => flash('error', 'Could not load events'))
            .finally(() => setLoadingEvents(false));
    }, [flash]);

    // `silent` refreshes in place (no spinner, no scroll jump, messages kept).
    const load = useCallback(async (silent = false) => {
        if (!eventId) { setRegistrations([]); return; }
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`/api/event?action=list-registrations&eventId=${encodeURIComponent(eventId)}`, { headers: adminAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load registrations');
            setRegistrations(data.registrations || []);
            setGated(data.requiresShortlisting === true);
            setFields((data.fields || []).filter((f) => !['name', 'email', 'phone'].includes(f.key)));
            if (!silent) setSelected(new Set());
        } catch (err) {
            flash('error', err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [eventId, flash]);

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

    const viewIndex = viewId ? visible.findIndex((r) => r.id === viewId) : -1;
    const viewReg = viewIndex >= 0 ? visible[viewIndex] : null;
    // If the open application drops out of the filtered list (e.g. it was just shortlisted
    // while viewing "Pending"), fall back to the registration itself so the screen doesn't vanish.
    const modalReg = viewReg || (viewId ? registrations.find((r) => r.id === viewId) : null);
    const modalIndex = viewReg ? viewIndex : 0;
    const modalList = viewReg ? visible : modalReg ? [modalReg] : [];
    const closeView = useCallback(() => setViewId(null), []);
    const goPrev = useCallback(() => { if (viewIndex > 0) setViewId(visible[viewIndex - 1].id); }, [viewIndex, visible]);
    const goNext = useCallback(() => { if (viewIndex >= 0 && viewIndex < visible.length - 1) setViewId(visible[viewIndex + 1].id); }, [viewIndex, visible]);

    const toggle = (id) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const toggleAllShown = () => setSelected(allShownSelected ? new Set() : new Set(visible.map((r) => r.id)));

    const resend = async (reg) => {
        setBusy(`${reg.id}:resend`);
        try {
            const data = await postJson('/api/event?action=resend-pass', { eventId, registrationId: reg.id });
            flash('success', `Pass re-sent to ${data.email}.`);
            setRegistrations((prev) => prev.map((r) => (r.id === reg.id ? { ...r, passSentAt: new Date().toISOString() } : r)));
        } catch (err) {
            flash('error', err.message);
        } finally {
            setBusy('');
        }
    };

    // Shortlist / reject / reset one or many. Shortlisting emails each person their
    // pass, so it goes in small batches with a running tally.
    const runReview = async (ids, status) => {
        const single = ids.length === 1;
        setBusy(single ? `${ids[0]}:${status}` : 'bulk');
        let done = 0; const failedEmails = []; const notFound = [];
        try {
            for (let i = 0; i < ids.length; i += BATCH) {
                const chunk = ids.slice(i, i + BATCH);
                flash('progress', `${status === 'shortlisted' ? 'Shortlisting and emailing' : 'Updating'} ${Math.min(i + BATCH, ids.length)} of ${ids.length}…`);
                const data = await postJson('/api/event?action=set-registration-status', { eventId, registrationIds: chunk, status });
                (data.results || []).forEach((r) => {
                    if (!r.ok) { notFound.push(r.id); return; }
                    done += 1;
                    if (r.emailError) failedEmails.push(`${registrations.find((x) => x.id === r.id)?.name || r.id} (${r.emailError})`);
                });
            }
            const verb = { shortlisted: 'Shortlisted', rejected: 'Marked as not shortlisted:', pending: 'Moved back to pending:' }[status];
            const parts = [`${verb} ${done}${status === 'shortlisted' ? ` — passes emailed to ${done - failedEmails.length}` : ''}.`];
            if (failedEmails.length) parts.push(`The pass email failed for: ${failedEmails.join('; ')}. They are shortlisted — use Resend pass.`);
            if (notFound.length) parts.push(`${notFound.length} not found.`);
            flash(failedEmails.length || notFound.length ? 'error' : 'success', parts.join(' '));
            if (!single) setSelected(new Set());
        } catch (err) {
            flash('error', `${err.message}${done ? ` (${done} updated before the error)` : ''}`);
        } finally {
            setBusy('');
            await load(true);
        }
    };

    const askReview = (ids, status) => {
        if (ids.length === 0) return;
        const who = ids.length === 1 ? registrations.find((r) => r.id === ids[0])?.name || 'this person' : `${ids.length} people`;
        const copy = {
            shortlisted: { title: `Shortlist ${who}?`, body: 'Each person is emailed their pass right away and will be admitted at the door.', confirmLabel: 'Shortlist & email pass' },
            rejected: { title: `Mark ${who} as not shortlisted?`, body: "Nothing is emailed. They won't be admitted at the door.", confirmLabel: 'Not shortlisted', tone: 'danger' },
            pending: { title: `Move ${who} back to pending?`, body: 'They stay on the list for review. Any pass already sent stops working at the door until they are shortlisted again.', confirmLabel: 'Move to pending' },
        }[status];
        setDialog({ ...copy, onConfirm: () => runReview(ids, status) });
    };

    const askRemove = (reg) => setDialog({
        title: `Delete ${reg.name}'s registration?`,
        body: `${reg.email} — their pass will stop working. This can't be undone.`,
        confirmLabel: 'Delete', tone: 'danger',
        onConfirm: async () => {
            setBusy(`${reg.id}:delete`);
            try {
                await postJson('/api/event?action=delete-registration', { eventId, registrationId: reg.id });
                setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
                setSelected((prev) => { const next = new Set(prev); next.delete(reg.id); return next; });
                if (viewId === reg.id) setViewId(null);
                flash('success', `Deleted the registration for ${reg.name}.`);
            } catch (err) {
                flash('error', err.message);
            } finally {
                setBusy('');
            }
        },
    });

    const download = async () => {
        setDownloading(true);
        try {
            await downloadAuthenticatedFile(`/api/event?action=export-registrations&eventId=${encodeURIComponent(eventId)}`, 'registrations.csv');
        } catch (err) {
            flash('error', err.message);
        } finally {
            setDownloading(false);
        }
    };

    const spin = (key, IconComponent) => (busy === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : createElement(IconComponent, { className: 'w-3.5 h-3.5' }));
    const anyBusy = !!busy;

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
                    <select value={eventId} onChange={(e) => { setEventId(e.target.value); setQuery(''); setToast(null); setStatusFilter('all'); setViewId(null); }}
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
                                        <button type="button" disabled={anyBusy} onClick={() => askReview([...selected], 'shortlisted')}
                                            className={`${actionBtn} bg-[var(--success-color)] text-black`}>{spin('bulk', UserCheck)} Shortlist &amp; email passes</button>
                                        <button type="button" disabled={anyBusy} onClick={() => askReview([...selected], 'rejected')}
                                            className={`${actionBtn} text-red-400 border-2 border-red-400/40 hover:bg-red-900/20`}><UserX className="w-3.5 h-3.5" /> Not shortlisted</button>
                                        <button type="button" disabled={anyBusy} onClick={() => askReview([...selected], 'pending')}
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
                                                    <button type="button" onClick={() => setViewId(r.id)}
                                                        className="flex items-center gap-1 text-[11px] font-black uppercase text-brand-yellow mt-1 hover:underline">
                                                        <Maximize2 className="w-3 h-3" /> View answers
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
                                                <button type="button" disabled={anyBusy} onClick={() => askReview([r.id], 'shortlisted')}
                                                    className={`${actionBtn} bg-[var(--success-color)] text-black`}>{spin(`${r.id}:shortlisted`, UserCheck)} Shortlist</button>
                                            )}
                                            {gated && canManage && r.status === 'pending' && (
                                                <button type="button" disabled={anyBusy} onClick={() => askReview([r.id], 'rejected')}
                                                    className={`${actionBtn} text-red-400 hover:bg-red-900/20`}>{spin(`${r.id}:rejected`, UserX)} Reject</button>
                                            )}
                                            {gated && canManage && r.status !== 'pending' && (
                                                <button type="button" disabled={anyBusy} onClick={() => askReview([r.id], 'pending')}
                                                    className={`${actionBtn} text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]`}>{spin(`${r.id}:pending`, RotateCcw)} Reset</button>
                                            )}
                                            {canManage && admitted && (
                                                <button type="button" disabled={anyBusy} onClick={() => resend(r)}
                                                    className={`${actionBtn} text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]`}>
                                                    {spin(`${r.id}:resend`, Send)} Resend pass
                                                </button>
                                            )}
                                            {canManage && (
                                                <button type="button" disabled={anyBusy} onClick={() => askRemove(r)} aria-label={`Delete registration for ${r.name}`}
                                                    className={`${actionBtn} text-red-400 hover:text-red-300 hover:bg-red-900/20`}>
                                                    {spin(`${r.id}:delete`, Trash2)} Delete
                                                </button>
                                            )}
                                        </div>
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

            {modalReg && (
                <AnswersModal
                    reg={modalReg} index={modalIndex} total={modalList.length} fields={fields} gated={gated} canManage={canManage} busy={busy}
                    onClose={closeView} onPrev={goPrev} onNext={goNext} onAction={askReview}
                />
            )}
            {dialog && <ConfirmDialog dialog={dialog} onClose={() => setDialog(null)} />}

            {toast && (
                <Layer>
                    <div role="status" aria-live="polite"
                        className={`fixed ${modalReg ? 'bottom-24' : 'bottom-4'} left-1/2 -translate-x-1/2 z-[400] w-[calc(100%-2rem)] max-w-xl flex items-start gap-3 rounded-2xl border-2 px-4 py-3 shadow-2xl text-sm font-bold bg-[var(--bg-card)] ${
                            toast.type === 'error' ? 'border-red-500 text-red-400' : toast.type === 'progress' ? 'border-brand-yellow text-brand-yellow' : 'border-[var(--success-color)] text-[var(--success-color)]'}`}>
                        {toast.type === 'progress' && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" />}
                        <p className="flex-1 min-w-0 break-words">{toast.text}</p>
                        {toast.type !== 'progress' && (
                            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="flex-shrink-0 opacity-80 hover:opacity-100"><X className="w-4 h-4" /></button>
                        )}
                    </div>
                </Layer>
            )}
        </PanelShell>
    );
};

export default PassesPanel;
