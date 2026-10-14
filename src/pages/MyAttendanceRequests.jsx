import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Clock } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const STATUS_STYLES = {
    'Pending Vertical Head Approval': 'bg-[color-mix(in_srgb,var(--primary-color)_20%,transparent)] text-[var(--primary-color)] border-[var(--primary-color)]',
    'Pending Board Member Approval': 'bg-[color-mix(in_srgb,var(--primary-color)_20%,transparent)] text-[var(--primary-color)] border-[var(--primary-color)]',
    'Correction Requested': 'bg-[color-mix(in_srgb,#f59e0b_20%,transparent)] text-[#f59e0b] border-[#f59e0b]',
    'Rejected by Vertical Head': 'bg-[color-mix(in_srgb,var(--danger-bg)_30%,transparent)] text-[var(--danger-color)] border-red-500',
    'Rejected by Board Member': 'bg-[color-mix(in_srgb,var(--danger-bg)_30%,transparent)] text-[var(--danger-color)] border-red-500',
    'Approved – Sync Pending': 'bg-[color-mix(in_srgb,var(--success-bg)_25%,transparent)] text-[var(--success-color)] border-green-500',
    'Approved – Synced': 'bg-[color-mix(in_srgb,var(--success-bg)_25%,transparent)] text-[var(--success-color)] border-green-500',
    'Sync Failed': 'bg-[color-mix(in_srgb,var(--danger-bg)_30%,transparent)] text-[var(--danger-color)] border-red-500',
};

const StatusBadge = ({ status }) => (
    <span className={`inline-block px-3 py-1 rounded-full border-2 text-[10px] font-black uppercase ${STATUS_STYLES[status] || ''}`}>
        {status}
    </span>
);

const MyAttendanceRequests = () => {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch('/api/attendance?action=my-requests', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load requests');
            setRequests(data.requests || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => { load(); }, [load]);

    const canEdit = (status) => ['Correction Requested', 'Rejected by Vertical Head', 'Rejected by Board Member'].includes(status);

    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
                    <h1 className="text-2xl md:text-4xl font-black uppercase">My Attendance Requests</h1>
                    <Link to="/attendance/new" className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2.5 rounded-xl font-black uppercase text-xs hover:bg-white transition-colors">
                        <Plus className="w-4 h-4" /> New Request
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] border-2 border-red-500 text-[var(--danger-color)] font-bold text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-10 text-center">
                        <Clock className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
                        <p className="font-bold">No attendance requests yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((r) => (
                            <div key={r.requestId} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5">
                                <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                                    <div>
                                        <p className="font-mono text-xs text-[var(--text-muted)]">{r.requestId}</p>
                                        <p className="font-bold">{r.subject} — {r.lectureDate} ({r.lectureStartTime}–{r.lectureEndTime})</p>
                                        <p className="text-xs text-[var(--text-secondary)]">{r.verticalNameSnapshot} • {r.facultyName} • {r.classroom}</p>
                                    </div>
                                    <StatusBadge status={r.status} />
                                </div>
                                {canEdit(r.status) && (
                                    <Link to={`/attendance/new?edit=${r.requestId}`} className="text-xs font-bold text-brand-yellow hover:underline">
                                        Edit & resubmit
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAttendanceRequests;
