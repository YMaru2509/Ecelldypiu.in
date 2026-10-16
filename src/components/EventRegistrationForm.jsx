import { useState } from 'react';
import { Loader2, CheckCircle2, Ticket, AlertTriangle } from 'lucide-react';

// What an event gets when it doesn't define its own form.
const DEFAULT_FIELDS = [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone (optional)', type: 'tel', required: false },
];

const wordCount = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const inputClass = 'w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] p-3 rounded-xl text-[var(--text-primary)]';

// Renders an event's own registration form (event.registrationFields) — text,
// email, phone, dropdown (optionally with an "Other" write-in) and long-answer
// fields with a word limit — or the simple default. `notice` is a highlighted
// requirement shown above the form.
const EventRegistrationForm = ({ eventId, fields, notice }) => {
    const formFields = fields?.length ? fields : DEFAULT_FIELDS;
    const [values, setValues] = useState({});
    const [otherText, setOtherText] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

    const submit = async (e) => {
        e.preventDefault();
        setError('');

        const answers = {};
        for (const field of formFields) {
            let value = (values[field.key] || '').trim();
            if (field.type === 'select' && value === 'Other') {
                const typed = (otherText[field.key] || '').trim();
                value = typed ? `Other: ${typed}` : '';
            }
            if (!value && field.required) return setError(`${field.label} is required`);
            if (field.maxWords && wordCount(value) > field.maxWords) return setError(`${field.label} must be ${field.maxWords} words or fewer`);
            if (value) answers[field.key] = value;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/event?action=register-for-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, answers, name: answers.name, email: answers.email, phone: answers.phone }),
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
            <div className="bg-[var(--bg-card)] text-[var(--text-primary)] border-4 border-brand-yellow rounded-[2rem] p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-brand-yellow mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase mb-2">You're Registered!</h3>
                <p className="text-[var(--text-secondary)]">Check your email for your pass — show it at the door to check in.</p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="bg-[var(--bg-card)] text-[var(--text-primary)] border-4 border-[var(--border-color)] rounded-[2rem] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-5">
                <Ticket className="w-5 h-5 text-brand-yellow" />
                <h3 className="text-2xl font-black uppercase">Register</h3>
            </div>

            {notice && (
                <div className="flex gap-3 items-start border-2 border-brand-yellow bg-brand-yellow/10 rounded-xl p-4 mb-5">
                    <AlertTriangle className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-bold uppercase leading-relaxed">{notice}</p>
                </div>
            )}

            {error && <p className="text-sm font-bold text-[var(--danger-color)] mb-4">{error}</p>}

            <div className="space-y-4">
                {formFields.map((field) => {
                    const value = values[field.key] || '';
                    const label = (
                        <label htmlFor={`reg-${field.key}`} className="block text-xs font-black uppercase mb-1.5">
                            {field.label}{field.required && <span className="text-[var(--danger-color)]"> *</span>}
                        </label>
                    );

                    if (field.type === 'select') {
                        return (
                            <div key={field.key}>
                                {label}
                                <select id={`reg-${field.key}`} value={value} onChange={(e) => set(field.key, e.target.value)} required={field.required} className={inputClass}>
                                    <option value="">Select…</option>
                                    {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                    {field.allowOther && <option value="Other">Other</option>}
                                </select>
                                {field.allowOther && value === 'Other' && (
                                    <input type="text" required placeholder="Please specify" value={otherText[field.key] || ''}
                                        onChange={(e) => setOtherText((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                        className={`${inputClass} mt-2`} />
                                )}
                            </div>
                        );
                    }

                    if (field.type === 'textarea') {
                        const words = wordCount(value);
                        const over = field.maxWords && words > field.maxWords;
                        return (
                            <div key={field.key}>
                                {label}
                                {field.helper && <p className="text-[11px] text-[var(--text-secondary)] mb-2">{field.helper}</p>}
                                <textarea id={`reg-${field.key}`} rows={5} value={value} onChange={(e) => set(field.key, e.target.value)} required={field.required} className={inputClass} />
                                {field.maxWords && (
                                    <p className={`text-[11px] font-bold mt-1 text-right ${over ? 'text-[var(--danger-color)]' : 'text-[var(--text-muted)]'}`}>
                                        {words} / {field.maxWords} words
                                    </p>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={field.key}>
                            {label}
                            <input id={`reg-${field.key}`} type={field.type || 'text'} value={value} onChange={(e) => set(field.key, e.target.value)}
                                required={field.required} placeholder={field.placeholder || ''} className={inputClass} />
                        </div>
                    );
                })}

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
