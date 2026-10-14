import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const emptyForm = {
    verticalId: '',
    lectureDate: '',
    lectureStartTime: '',
    lectureEndTime: '',
    facultyName: '',
    subject: '',
    classroom: '',
    lectureNumber: '',
    workDescription: '',
    workLocation: '',
};

const AttendanceRequestForm = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    const [verticals, setVerticals] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const myVerticals = verticals.filter((v) => (userProfile?.verticals || []).includes(v.id));

    const loadVerticals = useCallback(async () => {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/attendance-admin', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setVerticals(data.verticals || []);
    }, [currentUser]);

    const loadExisting = useCallback(async () => {
        if (!editId) return;
        const token = await currentUser.getIdToken();
        const res = await fetch(`/api/attendance?id=${editId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) {
            const r = data.request;
            setForm({
                verticalId: r.verticalId,
                lectureDate: r.lectureDate,
                lectureStartTime: r.lectureStartTime,
                lectureEndTime: r.lectureEndTime,
                facultyName: r.facultyName,
                subject: r.subject,
                classroom: r.classroom,
                lectureNumber: r.lectureNumber || '',
                workDescription: r.workDescription,
                workLocation: r.workLocation || '',
            });
        }
    }, [editId, currentUser]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([loadVerticals(), loadExisting()]);
            setLoading(false);
        })();
    }, [loadVerticals, loadExisting]);

    const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const token = await currentUser.getIdToken();
            const url = editId ? '/api/attendance?action=edit' : '/api/attendance?action=submit';
            const body = editId ? { ...form, requestId: editId } : form;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit request');
            navigate('/attendance/mine');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-16">
            <div className="container mx-auto px-4 max-w-2xl">
                <h1 className="text-2xl md:text-4xl font-black uppercase mb-2">
                    {editId ? 'Edit Attendance Request' : 'New Attendance Request'}
                </h1>
                <p className="text-[var(--text-secondary)] mb-8">
                    Request attendance consideration for a lecture you missed due to authorized E-Cell work.
                </p>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] border-2 border-red-500 text-[var(--danger-color)] font-bold text-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                    </div>
                ) : myVerticals.length === 0 ? (
                    <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 text-center">
                        <p className="font-bold">You aren't assigned to any E-Cell vertical yet.</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">Ask a system owner to assign you to a vertical before submitting a request.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 md:p-8 space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-2">E-Cell Vertical *</label>
                            <select
                                value={form.verticalId}
                                onChange={(e) => update('verticalId', e.target.value)}
                                required
                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                            >
                                <option value="">Select a vertical</option>
                                {myVerticals.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Lecture Date *</label>
                                <input type="date" required value={form.lectureDate} onChange={(e) => update('lectureDate', e.target.value)}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Start Time *</label>
                                <input type="time" required value={form.lectureStartTime} onChange={(e) => update('lectureStartTime', e.target.value)}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">End Time *</label>
                                <input type="time" required value={form.lectureEndTime} onChange={(e) => update('lectureEndTime', e.target.value)}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Faculty Name *</label>
                                <input type="text" required value={form.facultyName} onChange={(e) => update('facultyName', e.target.value)}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Subject / Course *</label>
                                <input type="text" required value={form.subject} onChange={(e) => update('subject', e.target.value)}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Classroom *</label>
                                <input type="text" required value={form.classroom} onChange={(e) => update('classroom', e.target.value)}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Lecture Number (optional)</label>
                                <input type="text" value={form.lectureNumber} onChange={(e) => update('lectureNumber', e.target.value)}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase mb-2">E-Cell Activity / Work Description *</label>
                            <textarea required rows="4" value={form.workDescription} onChange={(e) => update('workDescription', e.target.value)}
                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm resize-none" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase mb-2">Work Location (optional)</label>
                            <input type="text" value={form.workLocation} onChange={(e) => update('workLocation', e.target.value)}
                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                        </div>

                        <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                            <input type="checkbox" required className="mt-0.5" />
                            I confirm the information above is accurate to the best of my knowledge.
                        </label>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-brand-yellow text-[var(--text-on-brand)] font-black py-4 rounded-xl uppercase hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {editId ? 'Resubmit Request' : 'Submit Request'}
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center">
                    <Link to="/attendance/mine" className="text-brand-yellow font-bold text-sm hover:underline">View my requests</Link>
                </p>
            </div>
        </div>
    );
};

export default AttendanceRequestForm;
