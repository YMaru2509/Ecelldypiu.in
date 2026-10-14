import { useEffect, useState, useCallback } from 'react';
import { Loader2, Check, X, MessageSquareWarning } from 'lucide-react';
import PanelShell from './PanelShell';
import { adminAuthHeaders } from '../../utils/adminAuth';

const STAGES = [
    { key: 'vertical_head', label: 'Vertical Head Queue' },
    { key: 'board_member', label: 'Board Member Queue' },
];

const AttendanceQueue = () => {
    const [stage, setStage] = useState('vertical_head');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actingId, setActingId] = useState(null);
    const [remarksById, setRemarksById] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/attendance?action=queue&stage=${stage}`, { headers: adminAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load queue');
            setRequests(data.requests || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [stage]);

    useEffect(() => { load(); }, [load]);

    const decide = async (requestId, action) => {
        const remarks = remarksById[requestId] || '';
        if (action !== 'approve' && !remarks.trim()) {
            setError('Remarks are required to reject or request a correction.');
            return;
        }
        setActingId(requestId);
        setError('');
        try {
            const res = await fetch('/api/attendance?action=decide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ requestId, action, remarks }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to record decision');
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setActingId(null);
        }
    };

    return (
        <PanelShell>
            <h1 className="text-2xl md:text-3xl font-black uppercase mb-6">Attendance Approvals</h1>

            <div className="flex gap-2 mb-6">
                {STAGES.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        onClick={() => setStage(s.key)}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase border-2 ${stage === s.key ? 'bg-brand-yellow text-[var(--text-on-brand)] border-brand-yellow' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] border-2 border-red-500 text-[var(--danger-color)] font-bold text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-10 text-center font-bold">
                    Nothing waiting in this queue.
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((r) => (
                        <div key={r.requestId} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5">
                            <p className="font-mono text-xs text-[var(--text-muted)]">{r.requestId}</p>
                            <p className="font-bold">{r.memberSnapshot?.name} — {r.subject} ({r.verticalNameSnapshot})</p>
                            <p className="text-xs text-[var(--text-secondary)] mb-2">
                                {r.lectureDate}, {r.lectureStartTime}–{r.lectureEndTime} • Faculty: {r.facultyName} • Room: {r.classroom}
                            </p>
                            <p className="text-sm mb-3">{r.workDescription}</p>

                            <textarea
                                placeholder="Remarks (required for reject / request correction)"
                                value={remarksById[r.requestId] || ''}
                                onChange={(e) => setRemarksById((prev) => ({ ...prev, [r.requestId]: e.target.value }))}
                                rows="2"
                                className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg text-xs mb-3 resize-none"
                            />

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={actingId === r.requestId}
                                    onClick={() => decide(r.requestId, 'approve')}
                                    className="flex items-center gap-1 bg-[var(--success-color)] text-black px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50"
                                >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                    type="button"
                                    disabled={actingId === r.requestId}
                                    onClick={() => decide(r.requestId, 'request_correction')}
                                    className="flex items-center gap-1 bg-[#f59e0b] text-black px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50"
                                >
                                    <MessageSquareWarning className="w-3.5 h-3.5" /> Request Correction
                                </button>
                                <button
                                    type="button"
                                    disabled={actingId === r.requestId}
                                    onClick={() => decide(r.requestId, 'reject')}
                                    className="flex items-center gap-1 bg-[var(--danger-color)] text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50"
                                >
                                    <X className="w-3.5 h-3.5" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PanelShell>
    );
};

export default AttendanceQueue;
