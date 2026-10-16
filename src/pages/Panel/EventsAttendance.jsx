import { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import QRCode from 'qrcode';
import { Loader2, QrCode, Users, Clock, CheckCircle2, Search, UserPlus, ArrowLeft, Calendar, Power, History, Download, Table2, ExternalLink } from 'lucide-react';
import PanelShell from './PanelShell';
import MailProviderSelect from '../../components/MailProviderSelect';
import { adminAuthHeaders } from '../../utils/adminAuth';
import { db } from '../../firebaseConfig';
import { downloadAuthenticatedFile } from '../../utils/download';
import { usePanelAccess } from '../../context/panelAccessContext';
import { hasPermission } from '../../utils/rbac';

const fmtTime = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

// Countdown from the raw windowEnd ISO — recomputed every second while a
// session is active, purely client-side display (the server is the actual
// source of truth for whether the window is still open).
const useCountdown = (windowEnd, active) => {
    const [remaining, setRemaining] = useState(0);
    useEffect(() => {
        if (!active || !windowEnd) { setRemaining(0); return; }
        const tick = () => setRemaining(Math.max(0, Math.floor((new Date(windowEnd).getTime() - Date.now()) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [windowEnd, active]);
    return remaining;
};

const AttendanceToggle = ({ event, enabled, onChanged }) => {
    const [loading, setLoading] = useState(false);

    const toggle = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/event?action=toggle-attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ eventId: event.id, enabled: !enabled }),
            });
            const data = await res.json();
            if (res.ok) onChanged(data.attendanceEnabled);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex items-center justify-between gap-3 bg-[var(--bg-card)] border-2 rounded-2xl p-4 ${enabled ? 'border-[var(--success-color)]' : 'border-[var(--border-color)]'}`}>
            <div>
                <p className="font-black uppercase text-xs">Team Attendance</p>
                <p className="text-[10px] text-[var(--text-secondary)]">
                    {enabled ? 'Enabled — check-in windows can be opened for this event.' : 'Disabled — enable before opening a check-in window.'}
                </p>
            </div>
            <button type="button" disabled={loading} onClick={toggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase disabled:opacity-50 flex-shrink-0 ${enabled ? 'bg-[var(--success-color)] text-white' : 'bg-zinc-700 text-white'}`}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                {enabled ? 'On' : 'Off'}
            </button>
        </div>
    );
};

const downloadAttendanceCsv = (eventId, windowId) => {
    const params = new URLSearchParams({ action: 'export-checkins', eventId });
    if (windowId) params.set('windowId', windowId);
    return downloadAuthenticatedFile(`/api/event?${params}`, 'attendance.csv');
};

const ExportPanel = ({ event, canManage }) => {
    const [busy, setBusy] = useState('');
    const [message, setMessage] = useState(null);

    const downloadCsv = async () => {
        setBusy('csv');
        setMessage(null);
        try {
            await downloadAttendanceCsv(event.id);
        } catch (err) {
            setMessage({ ok: false, text: err.message });
        } finally {
            setBusy('');
        }
    };

    const openSheet = async () => {
        setBusy('sheet');
        setMessage(null);
        try {
            const res = await fetch('/api/event?action=export-checkins-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ eventId: event.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not export to Google Sheets');
            window.open(data.url, '_blank', 'noopener');
            setMessage({ ok: true, text: `Sent to the “${data.tabName}” tab.`, url: data.url });
        } catch (err) {
            setMessage({ ok: false, text: err.message });
        } finally {
            setBusy('');
        }
    };

    return (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5">
            <h3 className="font-black uppercase text-xs mb-1 flex items-center gap-2">
                <Table2 className="w-4 h-4 text-brand-yellow" /> Export Attendance
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mb-4">
                One row per active core member and one column per day, so absentees show too.
            </p>
            <div className="flex flex-wrap gap-3">
                <button type="button" onClick={downloadCsv} disabled={!!busy}
                    className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-50">
                    {busy === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download CSV
                </button>
                {canManage && (
                    <button type="button" onClick={openSheet} disabled={!!busy}
                        className="flex items-center gap-2 border-2 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-[var(--text-on-brand)] px-4 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-50 transition-colors">
                        {busy === 'sheet' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                        Open in Google Sheets
                    </button>
                )}
            </div>
            {message && (
                <p className={`text-xs font-bold mt-3 ${message.ok ? 'text-[var(--success-color)]' : 'text-[var(--danger-color)]'}`}>
                    {message.text}{' '}
                    {message.url && <a href={message.url} target="_blank" rel="noopener noreferrer" className="underline">Open sheet</a>}
                </p>
            )}
        </div>
    );
};

const WindowHistory = ({ windows, eventId }) => {
    const [downloadingId, setDownloadingId] = useState(null);
    const [error, setError] = useState('');
    if (!windows || windows.length === 0) return null;

    const download = async (windowId) => {
        setDownloadingId(windowId);
        setError('');
        try {
            await downloadAttendanceCsv(eventId, windowId);
        } catch (err) {
            setError(err.message);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5">
            <h3 className="font-black uppercase text-xs mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-yellow" /> Attendance Window History
            </h3>
            {error && <p className="text-xs font-bold text-[var(--danger-color)] mb-2">{error}</p>}
            <div className="space-y-1 max-h-56 overflow-y-auto">
                {windows.map((w) => (
                    <div key={w.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--bg-secondary)]">
                        <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{w.dayLabel || fmtTime(w.windowStart)} · {w.room}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">{fmtTime(w.windowStart)} – {fmtTime(w.windowEnd)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">
                                {w.active ? <span className="text-brand-yellow">Open</span> : `${w.attendeeCount} checked in`}
                            </span>
                            <button type="button" onClick={() => download(w.id)} disabled={downloadingId === w.id}
                                title="Download this day as CSV" aria-label={`Download ${w.dayLabel || 'this day'} as CSV`}
                                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50">
                                {downloadingId === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ActivateForm = ({ event, onActivated }) => {
    const [room, setRoom] = useState('');
    const [minutes, setMinutes] = useState(15);
    const [provider, setProvider] = useState('zeptomail');
    const [loading, setLoading] = useState('');
    const [error, setError] = useState('');

    // `loading` records which button was pressed so only that one spins.
    const activate = async (notify) => {
        if (!room.trim()) return;
        setLoading(notify ? 'notify' : 'silent');
        setError('');
        try {
            const res = await fetch('/api/event?action=create-checkin-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ eventId: event.id, room: room.trim(), windowMinutes: Number(minutes), provider, notify }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to open check-in');
            onActivated(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading('');
        }
    };

    // Pressing Enter in a field submits the form, so the default action is the
    // silent one — nobody gets emailed by accident.
    const submit = (e) => {
        e.preventDefault();
        activate(false);
    };

    return (
        <form onSubmit={submit} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 space-y-4">
            <h3 className="font-black uppercase text-sm">Open Attendance Check-In</h3>
            <p className="text-xs text-[var(--text-secondary)]">
                <strong>Activate</strong> opens the window and shows the QR code without emailing anyone. <strong>Activate &amp; Notify</strong> also emails every active core member — only use it when you're ready for them to head to the room.
            </p>
            {error && <p className="text-xs font-bold text-[var(--danger-color)]">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">Room / Location</label>
                    <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room 506" required
                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-2.5 text-[var(--text-primary)] rounded-xl text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">Window (minutes)</label>
                    <input type="number" min="1" max="120" value={minutes} onChange={(e) => setMinutes(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-2.5 text-[var(--text-primary)] rounded-xl text-sm" />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">Notify via (Activate &amp; Notify only)</label>
                <MailProviderSelect value={provider} onChange={setProvider} className="w-full sm:w-auto" />
            </div>
            <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={!!loading || !room.trim()}
                    className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-5 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-50">
                    {loading === 'silent' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                    Activate
                </button>
                <button type="button" onClick={() => activate(true)} disabled={!!loading || !room.trim()}
                    className="flex items-center gap-2 border-2 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-[var(--text-on-brand)] px-5 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-50 transition-colors">
                    {loading === 'notify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    Activate &amp; Notify
                </button>
            </div>
        </form>
    );
};

const ManualCheckin = ({ event, allMembers, checkedInUids, onMarked }) => {
    const [query, setQuery] = useState('');
    const [markingUid, setMarkingUid] = useState(null);
    const [error, setError] = useState('');

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        return allMembers
            .filter((m) => !checkedInUids.has(m.uid))
            .filter((m) => !q || (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q));
    }, [allMembers, checkedInUids, query]);

    const mark = async (uid) => {
        setMarkingUid(uid);
        setError('');
        try {
            const res = await fetch('/api/event?action=manual-checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ eventId: event.id, uid }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to mark present');
            onMarked();
        } catch (err) {
            setError(err.message);
        } finally {
            setMarkingUid(null);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5">
            <h3 className="font-black uppercase text-xs mb-1">Manual Fallback</h3>
            <p className="text-[10px] text-[var(--text-secondary)] mb-3">For someone genuinely present who couldn't scan — marked as unverified, not a real scan.</p>
            {error && <p className="text-xs font-bold text-[var(--danger-color)] mb-2">{error}</p>}
            <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input type="text" placeholder="Search remaining members" value={query} onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 pl-9 pr-3 py-2 text-[var(--text-primary)] rounded-xl text-sm" />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1">
                {results.map((m) => (
                    <div key={m.uid} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                        <span className="text-xs font-bold truncate">{m.name || m.email}</span>
                        <button type="button" disabled={markingUid === m.uid} onClick={() => mark(m.uid)}
                            className="flex items-center gap-1 text-[10px] font-black uppercase bg-zinc-700 text-white px-2.5 py-1 rounded-lg disabled:opacity-50 flex-shrink-0">
                            {markingUid === m.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                            Mark Present
                        </button>
                    </div>
                ))}
                {results.length === 0 && <p className="text-xs text-[var(--text-secondary)] text-center py-4">Everyone's checked in.</p>}
            </div>
        </div>
    );
};

const EventDetail = ({ event, onBack }) => {
    // Viewing attendance needs events:view; opening/closing windows, toggling
    // the feature, manual marks and the Sheets export need events:manage. The
    // server enforces it — this just avoids showing buttons that would 403.
    const { profile } = usePanelAccess();
    const canManage = hasPermission(profile, 'events', 'manage');
    const [checkinData, setCheckinData] = useState(null);
    const [liveAttendees, setLiveAttendees] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allMembers, setAllMembers] = useState([]);
    const [closing, setClosing] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [activationNote, setActivationNote] = useState(null);

    const attendanceEnabled = checkinData?.attendanceEnabled || false;
    const activeWindow = checkinData?.activeWindow || null;
    const remaining = useCountdown(activeWindow?.windowEnd, !!activeWindow);

    const fetchStatus = useCallback(async () => {
        const res = await fetch(`/api/event?action=checkin-status&eventId=${event.id}`, { headers: adminAuthHeaders() });
        const data = await res.json();
        if (res.ok) setCheckinData(data);
        setLoading(false);
    }, [event.id]);

    useEffect(() => {
        fetchStatus();
        fetch('/api/panel-users?action=member-directory', { headers: adminAuthHeaders() })
            .then((r) => r.json())
            .then((d) => setAllMembers((d.members || []).filter((m) => m.memberType === 'ecell_member' && m.membershipStatus === 'active')))
            .catch(() => {});
    }, [fetchStatus]);

    // Live attendee list via a direct Firestore listener (event_checkins is
    // publicly readable, see firestore.rules) instead of polling the API —
    // updates the instant anyone scans, across every admin viewing this page.
    useEffect(() => {
        const q = query(collection(db, 'event_checkins'), where('eventId', '==', event.id));
        const unsub = onSnapshot(q, (snap) => {
            setLiveAttendees(snap.docs.map((d) => d.data()));
        }, () => {});
        return unsub;
    }, [event.id]);

    const attendees = useMemo(() => {
        const all = liveAttendees ?? checkinData?.attendees ?? [];
        if (!activeWindow) return liveAttendees == null ? (checkinData?.attendees || []) : [];
        return all.filter((a) => a.windowId === activeWindow.id);
    }, [liveAttendees, checkinData, activeWindow]);

    const windowsWithLiveCounts = useMemo(() => {
        const list = checkinData?.windows || [];
        if (!liveAttendees) return list;
        const countByWindow = {};
        liveAttendees.forEach((a) => { countByWindow[a.windowId] = (countByWindow[a.windowId] || 0) + 1; });
        return list.map((w) => ({ ...w, attendeeCount: countByWindow[w.id] || 0 }));
    }, [checkinData, liveAttendees]);

    useEffect(() => {
        if (!activeWindow?.token) { setQrDataUrl(''); return; }
        const url = `${window.location.origin}/checkin?eventId=${encodeURIComponent(event.id)}&token=${encodeURIComponent(activeWindow.token)}`;
        QRCode.toDataURL(url, { width: 360, margin: 2, errorCorrectionLevel: 'H' }).then(setQrDataUrl).catch(() => {});
    }, [activeWindow?.token, event.id]);

    const closeWindow = async () => {
        setClosing(true);
        try {
            await fetch('/api/event?action=close-checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ eventId: event.id }),
            });
            setActivationNote(null);
            await fetchStatus();
        } finally {
            setClosing(false);
        }
    };

    const checkedInUids = useMemo(() => new Set(attendees.map((a) => a.uid)), [attendees]);
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');

    return (
        <div>
            <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs font-bold uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4">
                <ArrowLeft className="w-4 h-4" /> All Events
            </button>
            <h2 className="text-xl font-black uppercase mb-1">{event.title}</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-6">{event.date}</p>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-brand-yellow" /></div>
            ) : (
                <div className="space-y-6">
                    {canManage && (
                        <AttendanceToggle event={event} enabled={attendanceEnabled}
                            onChanged={(next) => setCheckinData((prev) => ({ ...prev, attendanceEnabled: next }))} />
                    )}

                    {!attendanceEnabled && (
                        <p className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4">
                            {canManage
                                ? 'Turn on Team Attendance above before opening a check-in window for this event.'
                                : 'Team Attendance isn\'t enabled for this event.'}
                        </p>
                    )}

                    {canManage && attendanceEnabled && !activeWindow && (
                        <ActivateForm event={event} onActivated={(result) => { setActivationNote(result); fetchStatus(); }} />
                    )}

                    {activeWindow && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[var(--bg-card)] border-2 border-brand-yellow rounded-2xl p-6 text-center">
                                <div className="flex items-center justify-center gap-2 text-xs font-black uppercase text-brand-yellow mb-3">
                                    <Clock className="w-4 h-4" /> Closes in {mins}:{secs}
                                </div>
                                {qrDataUrl && <img src={qrDataUrl} alt="Check-in QR code" className="mx-auto rounded-xl border-4 border-[var(--border-color)]" />}
                                {activationNote && (
                                    <p className="text-[11px] font-bold text-[var(--success-color)] mt-3">
                                        {activationNote.notifyRequested === false
                                            ? 'Opened without emailing anyone.'
                                            : `Emailed ${activationNote.notified} of ${activationNote.totalMembers} core members.`}
                                    </p>
                                )}
                                <p className="text-xs font-bold mt-3">{activeWindow.room}</p>
                                <p className="text-[10px] text-[var(--text-secondary)]">Open {fmtTime(activeWindow.windowStart)} – {fmtTime(activeWindow.windowEnd)}</p>
                                {canManage && (
                                    <button type="button" disabled={closing} onClick={closeWindow}
                                        className="mt-4 flex items-center gap-2 mx-auto bg-[var(--danger-color)] text-white px-4 py-2 rounded-xl text-xs font-black uppercase disabled:opacity-50">
                                        {closing && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Close Window Now
                                    </button>
                                )}
                            </div>

                            {canManage && <ManualCheckin event={event} allMembers={allMembers} checkedInUids={checkedInUids} onMarked={fetchStatus} />}
                        </div>
                    )}

                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5">
                        <h3 className="font-black uppercase text-xs mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-brand-yellow" /> Checked In — {attendees.length} of {allMembers.length}
                        </h3>
                        <div className="space-y-1 max-h-72 overflow-y-auto">
                            {attendees.map((a) => (
                                <div key={`${a.windowId}_${a.uid}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--bg-secondary)]">
                                    <span className="text-xs font-bold truncate">{a.memberName || a.uid}</span>
                                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase flex-shrink-0 ${a.verified ? 'text-[var(--success-color)]' : 'text-[var(--text-muted)]'}`}>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> {a.verified ? 'Scanned' : 'Manual'}
                                    </span>
                                </div>
                            ))}
                            {attendees.length === 0 && <p className="text-xs text-[var(--text-secondary)] text-center py-6">No check-ins yet.</p>}
                        </div>
                    </div>

                    {windowsWithLiveCounts.length > 0 && <ExportPanel event={event} canManage={canManage} />}

                    <WindowHistory windows={windowsWithLiveCounts} eventId={event.id} />
                </div>
            )}
        </div>
    );
};

const EventsAttendance = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch('/api/event?action=get-events', { headers: adminAuthHeaders() });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load events');
                setEvents(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <PanelShell>
            {selected ? (
                <EventDetail event={selected} onBack={() => setSelected(null)} />
            ) : (
                <>
                    <h1 className="text-2xl md:text-3xl font-black uppercase mb-6">Event Attendance</h1>
                    {error && <div className="mb-4 p-4 rounded-xl bg-red-900/20 border-2 border-red-500 text-red-400 font-bold text-sm">{error}</div>}
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
                    ) : (
                        <div className="space-y-2">
                            {events.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-12">No events found.</p>}
                            {events.map((ev) => (
                                <button
                                    key={ev.id}
                                    type="button"
                                    onClick={() => setSelected(ev)}
                                    className="w-full flex items-center justify-between gap-3 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4 text-left hover:border-brand-yellow transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Calendar className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{ev.title}</p>
                                            <p className="text-xs text-[var(--text-secondary)] truncate">{ev.date}</p>
                                        </div>
                                    </div>
                                    {ev.attendanceEnabled && (
                                        <span className="text-[10px] font-black uppercase text-[var(--success-color)] whitespace-nowrap">Attendance Enabled</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </PanelShell>
    );
};

export default EventsAttendance;
