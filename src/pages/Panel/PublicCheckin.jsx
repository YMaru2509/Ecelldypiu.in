import { useEffect, useState, useCallback, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Loader2, ScanLine, CheckCircle2, XCircle, Calendar, Users } from 'lucide-react';
import PanelShell from './PanelShell';
import { adminAuthHeaders } from '../../utils/adminAuth';

const PublicCheckin = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState('');
    const [counts, setCounts] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [scanning, setScanning] = useState(false);
    const lastScanRef = useRef('');

    useEffect(() => {
        fetch('/api/event?action=get-events', { headers: adminAuthHeaders() })
            .then((r) => r.json())
            .then((d) => {
                // Only events that take public registrations (not team-internal ones), upcoming first.
                const list = (Array.isArray(d) ? d : []).filter((e) => !e.internalOnly)
                    .sort((a, b) => Number(b.upcoming === true) - Number(a.upcoming === true));
                setEvents(list);
                if (list[0]?.upcoming) setSelectedId((current) => current || list[0].id);
            })
            .finally(() => setLoading(false));
    }, []);

    const fetchCounts = useCallback(async () => {
        if (!selectedId) return;
        const res = await fetch(`/api/event?action=list-registrations&eventId=${selectedId}`, { headers: adminAuthHeaders() });
        const data = await res.json();
        if (res.ok) setCounts({ total: data.total, checkedIn: data.checkedIn, gated: data.requiresShortlisting === true });
    }, [selectedId]);

    useEffect(() => { fetchCounts(); }, [fetchCounts]);

    const handleScan = async (codes) => {
        const raw = codes?.[0]?.rawValue;
        if (!raw || raw === lastScanRef.current) return;
        lastScanRef.current = raw;
        setTimeout(() => { if (lastScanRef.current === raw) lastScanRef.current = ''; }, 3000);

        let payload;
        try {
            payload = JSON.parse(raw);
        } catch {
            setFeedback({ ok: false, message: 'Not a valid pass QR code' });
            return;
        }
        if (payload.eventId !== selectedId) {
            setFeedback({ ok: false, message: "This pass is for a different event" });
            return;
        }

        try {
            const res = await fetch('/api/event?action=checkin-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ eventId: payload.eventId, registrationId: payload.registrationId, token: payload.token }),
            });
            const data = await res.json();
            if (!res.ok) {
                setFeedback({ ok: false, message: data.error || 'Check-in failed' });
                return;
            }
            setFeedback({ ok: true, message: data.alreadyCheckedIn ? `${data.name} — already checked in` : `${data.name} — checked in!`, alreadyCheckedIn: data.alreadyCheckedIn });
            fetchCounts();
        } catch {
            setFeedback({ ok: false, message: 'Network error — try again' });
        }
    };

    return (
        <PanelShell>
            <h1 className="text-2xl md:text-3xl font-black uppercase mb-6">Door Check-In</h1>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5">
                        <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Event
                        </label>
                        <select
                            value={selectedId}
                            onChange={(e) => { setSelectedId(e.target.value); setScanning(false); setFeedback(null); setCounts(null); }}
                            className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-2.5 text-[var(--text-primary)] rounded-xl text-sm"
                        >
                            <option value="">Select an event…</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                        </select>
                        {counts && (
                            <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
                                <Users className="w-3.5 h-3.5 text-brand-yellow" /> {counts.checkedIn} of {counts.total} {counts.gated ? 'shortlisted' : 'registered'} guests checked in
                            </p>
                        )}
                    </div>

                    {selectedId && (
                        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5">
                            {!scanning ? (
                                <button type="button" onClick={() => setScanning(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-5 py-3 rounded-xl text-sm font-black uppercase">
                                    <ScanLine className="w-5 h-5" /> Start Scanning
                                </button>
                            ) : (
                                <div>
                                    <div className="rounded-xl overflow-hidden border-2 border-[var(--border-color)] max-w-sm mx-auto">
                                        <Scanner onScan={handleScan} onError={() => setFeedback({ ok: false, message: 'Camera error — check permissions' })} formats={['qr_code']} />
                                    </div>
                                    <button type="button" onClick={() => setScanning(false)}
                                        className="mt-4 w-full bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase">
                                        Stop Scanning
                                    </button>
                                </div>
                            )}

                            {feedback && (
                                <div className={`mt-4 flex items-center gap-2 p-4 rounded-xl text-sm font-bold ${feedback.ok ? (feedback.alreadyCheckedIn ? 'bg-amber-500/10 text-amber-400' : 'bg-[var(--success-bg)] text-[var(--success-color)]') : 'bg-red-900/20 text-[var(--danger-color)]'}`}>
                                    {feedback.ok ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
                                    {feedback.message}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </PanelShell>
    );
};

export default PublicCheckin;
