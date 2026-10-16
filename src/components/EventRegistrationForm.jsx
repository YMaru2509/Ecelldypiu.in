import { useState } from 'react';
import { Loader2, CheckCircle2, Ticket } from 'lucide-react';

const EventRegistrationForm = ({ eventId }) => {
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/event?action=register-for-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, ...form }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            setDone(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="bg-[var(--bg-card)] border-4 border-brand-yellow rounded-[2rem] p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase mb-2">You're Registered!</h3>
                <p className="text-[var(--text-secondary)]">Check your email for your pass — show it at the door to check in.</p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="bg-[var(--bg-card)] border-4 border-[var(--border-color)] rounded-[2rem] p-8">
            <div className="flex items-center gap-2 mb-6">
                <Ticket className="w-5 h-5 text-brand-yellow" />
                <h3 className="text-2xl font-black uppercase">Register</h3>
            </div>
            {error && <p className="text-sm font-bold text-[var(--danger-color)] mb-4">{error}</p>}
            <div className="space-y-4">
                <input
                    type="text" required placeholder="Full Name" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] p-3 rounded-xl text-[var(--text-primary)]"
                />
                <input
                    type="email" required placeholder="Email" value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] p-3 rounded-xl text-[var(--text-primary)]"
                />
                <input
                    type="tel" placeholder="Phone (optional)" value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] p-3 rounded-xl text-[var(--text-primary)]"
                />
                <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-6 py-3 rounded-xl font-black uppercase disabled:opacity-50">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Get My Pass
                </button>
            </div>
        </form>
    );
};

export default EventRegistrationForm;
