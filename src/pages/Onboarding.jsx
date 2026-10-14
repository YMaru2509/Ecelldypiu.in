import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, Check, Camera, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { resizeImageWithBudget } from '../utils/imageResize';

const PROGRAM_GROUPS = [
    { school: 'School of Commerce and Management (SoCM)', programs: ['BBA (Hons.)', 'M.B.A. - Digital Business', 'M.B.A. - Executive'] },
    { school: 'School of Design (SoD)', programs: ['B. Design'] },
    { school: 'School of Computer Science Engineering & Applications (SoCSEA)', programs: ['B.Tech (CSE)', 'B.Tech (CSE) - AI & ML (in association with IBM)', 'B.Tech (CSE) - Cyber Security & Forensics (in association with IBM)', 'M.Tech (CSE) - Quantum Computing', 'BCA (Hons.)', 'MCA', 'M.Sc. - Computational Mathematics'] },
    { school: 'School of Biosciences and Bioengineering (SoBB)', programs: ['B.Tech - Bioengineering', 'B.Sc. - Forensic Sciences (Hons.)', 'M.Sc. - Medical Biotechnology', 'M.Sc. - Medicinal Chemistry'] },
    { school: 'School of Humanities and Social Sciences', programs: ['B.A. - Liberal Arts (Hons.)', 'B.Sc. - Economics (Hons.)'] },
    { school: 'School of Continuing Education (For Working Professionals)', programs: ['B.Tech - Mechanical Engg.', 'B.Tech - Electrical Engg.', 'M.Tech - Electric Vehicles'] },
    { school: 'School of Media and Communication Studies (SoMCS)', programs: ['B.A. - Journalism & Mass Communication (Hons.)', 'M.A. - Journalism & Mass Communication'] },
    { school: 'School of Applied Arts & Crafts (SoAAC)', programs: ['Bachelor of Fine Arts (BFA)'] },
    { school: 'School of Engineering, Management & Research (SoEMR)', programs: ['B.Tech - Chemical Engineering (CE)', 'B.Tech - Civil Engineering (CE)', 'B.Tech - Mechanical Engineering (ME)', 'B.Tech - Semiconductor Engineering (SCE)', 'B.Tech - Mechanical Engineering (AI & ML)'] },
    { school: 'Centre for Interdisciplinary Studies and Research', programs: ['PhD', 'Postdoctoral Research'] },
];
const YEAR_OPTIONS = ['1st', '2nd', '3rd', '4th'];

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// A join date is a pure calendar date with no time-of-day meaning, so this
// stays entirely in local-date terms — never round-trips through
// toISOString(), which converts to UTC and silently shifts the date back a
// day for any timezone ahead of UTC (e.g. local midnight Aug 20 in IST
// becomes 18:30 UTC on Aug 19).
const pad2 = (n) => String(n).padStart(2, '0');
const toDateOnlyString = (year, monthIndex, day) => `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

// Event "date" fields are free-form admin-entered strings (e.g. "23rd and 24th
// September 2025", "01 Feb 2026"), not a machine date — this pulls the first
// "<day> <Month> <year>" it can find out of one, best-effort, for deriving a
// member's E-Cell join date from the event they actually joined at. Returns
// null (never a broken/partial date) if nothing recognizable is found.
function parseEventDateString(raw) {
    if (!raw) return null;
    const cleaned = raw.replace(/(\d+)(st|nd|rd|th)\b/gi, '$1');
    const match = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (match) {
        const monthIndex = MONTH_NAMES.findIndex((m) => m.startsWith(match[2].toLowerCase()) || match[2].toLowerCase().startsWith(m.slice(0, 3)));
        if (monthIndex !== -1) {
            const d = new Date(Number(match[3]), monthIndex, Number(match[1]));
            if (!isNaN(d.getTime())) return toDateOnlyString(d.getFullYear(), d.getMonth(), d.getDate());
        }
    }
    const fallback = new Date(cleaned);
    return isNaN(fallback.getTime()) ? null : toDateOnlyString(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

const MultiSelectEvents = ({ events, selected, onToggle }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        {events.length === 0 && <p className="text-sm text-[var(--text-secondary)] col-span-2">No events found.</p>}
        {events.map((ev) => (
            <button
                key={ev.id}
                type="button"
                onClick={() => onToggle(ev.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-colors ${selected.includes(ev.id)
                        ? 'bg-brand-yellow text-[var(--text-on-brand)] border-brand-yellow font-bold'
                        : 'border-zinc-700 text-[var(--text-secondary)] hover:border-brand-yellow'
                    }`}
            >
                <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${selected.includes(ev.id) ? 'border-[var(--text-on-brand)] bg-[var(--text-on-brand)]/20' : 'border-current'}`}>
                    {selected.includes(ev.id) && <Check className="w-3 h-3" />}
                </span>
                {ev.title || ev.id}
            </button>
        ))}
    </div>
);

// Asks "which was the first one" (a single anchor event — used to derive a
// real date, e.g. the member's E-Cell join date) before "any others" (a
// plain multi-select of everything else). Used for both events attended and
// events organised, since both need the same "first, then the rest" shape.
const FirstThenRestEvents = ({ events, firstId, onFirstChange, otherIds, onToggleOther, firstLabel, firstHint, restLabel }) => {
    const remaining = events.filter((ev) => ev.id !== firstId);
    return (
        <div className="space-y-5">
            <div>
                <label className="block text-xs font-bold uppercase mb-2">{firstLabel}</label>
                {firstHint && <p className="text-xs text-[var(--text-secondary)] mb-2">{firstHint}</p>}
                <select
                    value={firstId}
                    onChange={(e) => onFirstChange(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                >
                    <option value="">— I haven't yet / not sure —</option>
                    {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title || ev.id}{ev.date ? ` (${ev.date})` : ''}</option>
                    ))}
                </select>
            </div>

            {remaining.length > 0 && (
                <div>
                    <label className="block text-xs font-bold uppercase mb-2">{restLabel}</label>
                    <MultiSelectEvents events={remaining} selected={otherIds} onToggle={onToggleOther} />
                </div>
            )}
        </div>
    );
};

const Onboarding = () => {
    const { userProfile, updateProfileData, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const memberType = userProfile?.memberType || 'normal_member';
    const isEcellMember = memberType === 'ecell_member';

    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [firstEventAttendedId, setFirstEventAttendedId] = useState('');
    const [otherEventsAttended, setOtherEventsAttended] = useState([]);
    const [firstEventOrganisedId, setFirstEventOrganisedId] = useState('');
    const [otherEventsOrganised, setOtherEventsOrganised] = useState([]);
    const [photoDataUrl, setPhotoDataUrl] = useState('');
    const [photoError, setPhotoError] = useState('');
    const [personal, setPersonal] = useState({ phone: '', branch: 'B.Tech (CSE)', year: '1st', bio: '' });

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/event?action=get-events');
                const data = await res.json();
                if (res.ok && Array.isArray(data)) setEvents(data);
            } finally {
                setLoadingEvents(false);
            }
        })();
    }, []);

    const toggle = (setFn) => (id) => setFn((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    // Picking a new "first event" removes it from whichever "other events" list
    // it was sitting in, so the same event is never double-counted.
    const handleFirstAttendedChange = (id) => {
        setFirstEventAttendedId(id);
        setOtherEventsAttended((prev) => prev.filter((x) => x !== id));
    };
    const handleFirstOrganisedChange = (id) => {
        setFirstEventOrganisedId(id);
        setOtherEventsOrganised((prev) => prev.filter((x) => x !== id));
    };

    // 'participant' was previously its own step asking the same question as
    // 'eventsAttended' a second time — dropped; attended events already cover it
    // (certificatesAsParticipant is derived from eventsAttended on save, for both
    // tracks, same as normal_member always did).
    const steps = isEcellMember
        ? ['eventsAttended', 'organiser', 'personal']
        : ['eventsAttended', 'personal'];
    const stepKey = steps[step];
    const isLastStep = step === steps.length - 1;

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoError('');
        try {
            setPhotoDataUrl(await resizeImageWithBudget(file));
        } catch (err) {
            setPhotoError(err.message || 'Could not process that image. Try a different file.');
        }
    };

    const canProceed = useCallback(() => {
        if (stepKey === 'personal') {
            const base = personal.phone.trim().length >= 10 && personal.branch && personal.year;
            if (isEcellMember) return base && !!photoDataUrl;
            return base;
        }
        return true;
    }, [stepKey, personal, isEcellMember, photoDataUrl]);

    const handleFinish = async () => {
        setSaving(true);
        setError('');
        try {
            const finalBranch = personal.branch === 'Other' ? personal.customBranch?.trim() : personal.branch;
            const eventsAttended = firstEventAttendedId ? [firstEventAttendedId, ...otherEventsAttended] : otherEventsAttended;

            const payload = {
                phone: personal.phone.replace(/\D/g, ''),
                branch: finalBranch,
                year: personal.year,
                bio: personal.bio?.trim() || '',
                onboardingComplete: true,
                eventsAttended,
                // Attending and participating are the same real-world fact — never
                // ask for this twice, for either member track.
                certificatesAsParticipant: eventsAttended,
            };
            if (photoDataUrl) payload.avatarUrl = photoDataUrl;

            // Derived from the actual first event picked above, not typed in by
            // hand — falls back to account-creation date (Profile.jsx's existing
            // behavior) if no first event was picked or its date can't be parsed.
            const firstEvent = events.find((ev) => ev.id === firstEventAttendedId);
            const derivedJoinDate = firstEvent ? parseEventDateString(firstEvent.date) : null;
            if (derivedJoinDate) payload.ecellJoinDate = derivedJoinDate;

            if (isEcellMember) {
                payload.certificatesAsOrganiser = firstEventOrganisedId
                    ? [firstEventOrganisedId, ...otherEventsOrganised]
                    : otherEventsOrganised;
            }

            await updateProfileData(payload);
            navigate('/profile', { replace: true });
        } catch (err) {
            setError(err.message || 'Failed to save your profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = () => {
        if (!canProceed()) return;
        if (isLastStep) {
            handleFinish();
        } else {
            setStep((s) => s + 1);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-28 pb-16">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl md:text-4xl font-black uppercase">Set Up Your Profile</h1>
                    <button onClick={logout} className="text-xs font-bold uppercase text-[var(--text-secondary)] hover:text-[var(--danger-color)]">Log out</button>
                </div>

                <div className="flex gap-1.5 mb-8">
                    {steps.map((s, i) => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-yellow' : 'bg-zinc-800'}`} />
                    ))}
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] border-2 border-red-500 text-[var(--danger-color)] font-bold text-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                    </div>
                )}

                <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 md:p-8">
                    {stepKey === 'eventsAttended' && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-2">Your E-Cell / CIIE Events</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                The first event you pick also sets your E-Cell join date — no need to enter it separately.
                            </p>
                            {loadingEvents ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : (
                                <FirstThenRestEvents
                                    events={events}
                                    firstId={firstEventAttendedId}
                                    onFirstChange={handleFirstAttendedChange}
                                    otherIds={otherEventsAttended}
                                    onToggleOther={toggle(setOtherEventsAttended)}
                                    firstLabel="What was the first E-Cell / CIIE event you attended?"
                                    restLabel="Any other events you attended?"
                                />
                            )}
                        </div>
                    )}

                    {stepKey === 'organiser' && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-2">Events You Organised</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">Only events where you helped organise on behalf of E-Cell — leave blank if none yet.</p>
                            {loadingEvents ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : (
                                <FirstThenRestEvents
                                    events={events}
                                    firstId={firstEventOrganisedId}
                                    onFirstChange={handleFirstOrganisedChange}
                                    otherIds={otherEventsOrganised}
                                    onToggleOther={toggle(setOtherEventsOrganised)}
                                    firstLabel="What was the first event you organised or helped organise?"
                                    restLabel="Any other events you organised or helped organise?"
                                />
                            )}
                        </div>
                    )}

                    {stepKey === 'personal' && (
                        <div className="space-y-5">
                            <h2 className="text-xl font-black uppercase mb-1">Personal Details</h2>

                            {isEcellMember && (
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2">Profile Photo <span className="text-brand-yellow">* required</span></label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] border-2 border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {photoDataUrl ? <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" /> : <Camera className="w-7 h-7 text-zinc-600" />}
                                        </div>
                                        <div>
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2 rounded-xl text-xs font-black uppercase">
                                                {photoDataUrl ? 'Change Photo' : 'Upload Photo'}
                                            </button>
                                            {photoError && <p className="text-xs text-[var(--danger-color)] mt-1">{photoError}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Phone Number *</label>
                                <input type="tel" value={personal.phone} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))}
                                    placeholder="9876543210" className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2">Branch / Program *</label>
                                    <select value={personal.branch} onChange={(e) => setPersonal((p) => ({ ...p, branch: e.target.value }))}
                                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm">
                                        {PROGRAM_GROUPS.map((g) => (
                                            <optgroup key={g.school} label={g.school}>
                                                {g.programs.map((p) => <option key={p} value={p}>{p}</option>)}
                                            </optgroup>
                                        ))}
                                        <option value="Other">Other (please specify)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2">Year of Study *</label>
                                    <select value={personal.year} onChange={(e) => setPersonal((p) => ({ ...p, year: e.target.value }))}
                                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm">
                                        {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y} Year</option>)}
                                    </select>
                                </div>
                            </div>

                            {personal.branch === 'Other' && (
                                <input type="text" placeholder="Specify your program" value={personal.customBranch || ''}
                                    onChange={(e) => setPersonal((p) => ({ ...p, customBranch: e.target.value }))}
                                    className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Bio (optional)</label>
                                <textarea rows="3" value={personal.bio} onChange={(e) => setPersonal((p) => ({ ...p, bio: e.target.value }))}
                                    className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm resize-none" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-6">
                    <button
                        type="button"
                        onClick={() => setStep((s) => Math.max(0, s - 1))}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase text-[var(--text-secondary)] disabled:opacity-30"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceed() || saving}
                        className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-6 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isLastStep ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        {isLastStep ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
