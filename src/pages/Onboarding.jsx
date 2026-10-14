import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, Check, Camera, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';

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
// Firestore caps a whole document at 1MiB including every other field on the
// member doc, so the avatar (already base64-encoded, ~37% bigger than raw
// bytes) gets a conservative budget, not the full 1MiB.
const MAX_PHOTO_DATA_URL_LENGTH = 700 * 1024;

function resizeImageToDataUrl(file, maxDim = 320) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => { img.src = reader.result; };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        img.onload = () => {
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        reader.readAsDataURL(file);
    });
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

    const [ecellJoinDate, setEcellJoinDate] = useState('');
    const [eventsAttended, setEventsAttended] = useState([]);
    const [certificatesAsOrganiser, setCertificatesAsOrganiser] = useState([]);
    const [certificatesAsParticipant, setCertificatesAsParticipant] = useState([]);
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

    const steps = isEcellMember
        ? ['joinDate', 'eventsAttended', 'organiser', 'participant', 'personal']
        : ['eventsAttended', 'personal'];
    const stepKey = steps[step];
    const isLastStep = step === steps.length - 1;

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoError('');
        try {
            let dataUrl = await resizeImageToDataUrl(file, 320);
            if (dataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
                // Retry once, smaller and more compressed, before giving up.
                dataUrl = await resizeImageToDataUrl(file, 220);
            }
            if (dataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
                setPhotoError('Photo is too large even after compression — try a different image.');
                return;
            }
            setPhotoDataUrl(dataUrl);
        } catch {
            setPhotoError('Could not process that image. Try a different file.');
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
            const payload = {
                phone: personal.phone.replace(/\D/g, ''),
                branch: finalBranch,
                year: personal.year,
                bio: personal.bio?.trim() || '',
                onboardingComplete: true,
            };
            if (photoDataUrl) payload.avatarUrl = photoDataUrl;

            if (isEcellMember) {
                payload.ecellJoinDate = ecellJoinDate;
                payload.eventsAttended = eventsAttended;
                payload.certificatesAsOrganiser = certificatesAsOrganiser;
                payload.certificatesAsParticipant = certificatesAsParticipant;
            } else {
                payload.eventsAttended = eventsAttended;
                payload.certificatesAsParticipant = eventsAttended;
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
        <div className="min-h-screen bg-black text-white pt-28 pb-16">
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
                    {stepKey === 'joinDate' && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-2">When did you join E-Cell?</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">This sets your real membership start date, separate from your account creation date.</p>
                            <input
                                type="date"
                                value={ecellJoinDate}
                                onChange={(e) => setEcellJoinDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                            />
                        </div>
                    )}

                    {stepKey === 'eventsAttended' && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-2">Events You've Attended</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">Select every past E-Cell event you took part in.</p>
                            {loadingEvents ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : (
                                <MultiSelectEvents events={events} selected={eventsAttended} onToggle={toggle(setEventsAttended)} />
                            )}
                        </div>
                    )}

                    {stepKey === 'organiser' && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-2">Certificates as Organiser</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">Events where you helped organise, on behalf of E-Cell.</p>
                            {loadingEvents ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : (
                                <MultiSelectEvents events={events} selected={certificatesAsOrganiser} onToggle={toggle(setCertificatesAsOrganiser)} />
                            )}
                        </div>
                    )}

                    {stepKey === 'participant' && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-2">Certificates as Participant</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">Events where you took part as a participant.</p>
                            {loadingEvents ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : (
                                <MultiSelectEvents events={events} selected={certificatesAsParticipant} onToggle={toggle(setCertificatesAsParticipant)} />
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
                                        <div className="w-20 h-20 rounded-full bg-black border-2 border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                                    placeholder="9876543210" className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2">Branch / Program *</label>
                                    <select value={personal.branch} onChange={(e) => setPersonal((p) => ({ ...p, branch: e.target.value }))}
                                        className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm">
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
                                        className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm">
                                        {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y} Year</option>)}
                                    </select>
                                </div>
                            </div>

                            {personal.branch === 'Other' && (
                                <input type="text" placeholder="Specify your program" value={personal.customBranch || ''}
                                    onChange={(e) => setPersonal((p) => ({ ...p, customBranch: e.target.value }))}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm" />
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Bio (optional)</label>
                                <textarea rows="3" value={personal.bio} onChange={(e) => setPersonal((p) => ({ ...p, bio: e.target.value }))}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm resize-none" />
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
