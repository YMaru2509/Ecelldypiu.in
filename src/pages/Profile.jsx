import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getMembershipDuration, getMilestone } from '../utils/membershipDuration';
import { renderCertificateToCanvas, downloadCanvasAsPng, memberToFieldValues, appreciationFieldValues } from '../utils/certificateCanvas';
import { resizeImageWithBudget } from '../utils/imageResize';
import {
    User, Phone, GraduationCap, Calendar, Building, Edit2, LogOut,
    CheckCircle2, Award, CalendarDays, Sparkles, Clock, Save, X, Loader2,
    AlertCircle, ArrowRight, History, Camera
} from 'lucide-react';

const PROGRAM_GROUPS = [
    {
        school: "School of Commerce and Management (SoCM)",
        programs: [
            "BBA (Hons.)",
            "M.B.A. - Digital Business",
            "M.B.A. - Executive"
        ]
    },
    {
        school: "School of Design (SoD)",
        programs: [
            "B. Design"
        ]
    },
    {
        school: "School of Computer Science Engineering & Applications (SoCSEA)",
        programs: [
            "B.Tech (CSE)",
            "B.Tech (CSE) - AI & ML (in association with IBM)",
            "B.Tech (CSE) - Cyber Security & Forensics (in association with IBM)",
            "M.Tech (CSE) - Quantum Computing",
            "BCA (Hons.)",
            "MCA",
            "M.Sc. - Computational Mathematics"
        ]
    },
    {
        school: "School of Biosciences and Bioengineering (SoBB)",
        programs: [
            "B.Tech - Bioengineering",
            "B.Sc. - Forensic Sciences (Hons.)",
            "M.Sc. - Medical Biotechnology",
            "M.Sc. - Medicinal Chemistry"
        ]
    },
    {
        school: "School of Humanities and Social Sciences",
        programs: [
            "B.A. - Liberal Arts (Hons.)",
            "B.Sc. - Economics (Hons.)"
        ]
    },
    {
        school: "School of Continuing Education (For Working Professionals)",
        programs: [
            "B.Tech - Mechanical Engg.",
            "B.Tech - Electrical Engg.",
            "M.Tech - Electric Vehicles"
        ]
    },
    {
        school: "School of Media and Communication Studies (SoMCS)",
        programs: [
            "B.A. - Journalism & Mass Communication (Hons.)",
            "M.A. - Journalism & Mass Communication"
        ]
    },
    {
        school: "School of Applied Arts & Crafts (SoAAC)",
        programs: [
            "Bachelor of Fine Arts (BFA)"
        ]
    },
    {
        school: "School of Engineering, Management & Research (SoEMR)",
        programs: [
            "B.Tech - Chemical Engineering (CE)",
            "B.Tech - Civil Engineering (CE)",
            "B.Tech - Mechanical Engineering (ME)",
            "B.Tech - Semiconductor Engineering (SCE)",
            "B.Tech - Mechanical Engineering (AI & ML)"
        ]
    },
    {
        school: "Centre for Interdisciplinary Studies and Research",
        programs: [
            "PhD",
            "Postdoctoral Research"
        ]
    }
];

const ALL_PROGRAM_NAMES = PROGRAM_GROUPS.flatMap(g => g.programs);
const YEAR_OPTIONS = ['1st', '2nd', '3rd', '4th'];

const Profile = () => {
    const { currentUser, userProfile, logout, updateProfileData } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Inline edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        phone: '',
        branch: 'B.Tech (CSE)',
        customBranch: '',
        year: '1st',
        bio: ''
    });
    const [editPhotoDataUrl, setEditPhotoDataUrl] = useState('');
    const [photoError, setPhotoError] = useState('');

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');
    const [saveError, setSaveError] = useState('');

    // Calculate live membership duration — prefer the real E-Cell join date
    // captured during onboarding over the account-creation timestamp.
    const membership = useMemo(() => {
        return getMembershipDuration(userProfile?.ecellJoinDate || userProfile?.joinedAt);
    }, [userProfile?.ecellJoinDate, userProfile?.joinedAt]);

    // Calculate milestone
    const milestone = useMemo(() => {
        return getMilestone(membership.totalDays);
    }, [membership.totalDays]);

    const isPastMember = userProfile?.membershipStatus === 'past_member';

    // Resolve event IDs (stored on the profile) into real event titles for display.
    const [eventsById, setEventsById] = useState({});
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/event?action=get-events');
                const data = await res.json();
                if (res.ok && Array.isArray(data)) {
                    setEventsById(Object.fromEntries(data.map((e) => [e.id, e])));
                }
            } catch {
                // Non-critical — falls back to showing raw event ids.
            }
        })();
    }, []);

    // Certificates eligible for auto-issuance: union of events attended/organised/
    // participated in, each checked against its certificateConfigs doc for
    // enabled + autoIssueToProfile. Plus the default appreciation certificate
    // for past members.
    const [eligibleCerts, setEligibleCerts] = useState([]);
    const [certsLoading, setCertsLoading] = useState(true);
    const [downloadingCertId, setDownloadingCertId] = useState(null);

    useEffect(() => {
        (async () => {
            setCertsLoading(true);
            const eventIds = [...new Set([
                ...(userProfile?.eventsAttended || []),
                ...(userProfile?.certificatesAsOrganiser || []),
                ...(userProfile?.certificatesAsParticipant || []),
            ])];

            const found = [];
            await Promise.all(eventIds.map(async (eventId) => {
                try {
                    const res = await fetch(`/api/certificate?eventId=${encodeURIComponent(eventId)}`);
                    if (!res.ok) return;
                    const { config } = await res.json();
                    if (config?.enabled && config?.autoIssueToProfile) {
                        found.push({ kind: 'event', eventId, config, label: eventsById[eventId]?.title || config.eventName || eventId });
                    }
                } catch {
                    // Skip events whose config isn't reachable rather than failing the whole page.
                }
            }));

            if (isPastMember && userProfile?.pastMemberCertificateEligible) {
                try {
                    const res = await fetch('/api/certificate?eventId=_appreciation_default');
                    if (res.ok) {
                        const { config } = await res.json();
                        if (config?.enabled) {
                            found.push({ kind: 'appreciation', eventId: '_appreciation_default', config, label: 'Certificate of Appreciation' });
                        }
                    }
                } catch {
                    // Non-critical.
                }
            }

            setEligibleCerts(found);
            setCertsLoading(false);
        })();
    }, [userProfile?.eventsAttended, userProfile?.certificatesAsOrganiser, userProfile?.certificatesAsParticipant, isPastMember, userProfile?.pastMemberCertificateEligible, eventsById]);

    const handleDownloadCert = useCallback(async (cert) => {
        setDownloadingCertId(cert.eventId);
        try {
            const canvas = document.createElement('canvas');
            const fieldValues = cert.kind === 'appreciation' ? appreciationFieldValues(userProfile) : memberToFieldValues(userProfile);
            await renderCertificateToCanvas(canvas, cert.config, fieldValues);
            downloadCanvasAsPng(canvas, `Certificate_${userProfile?.name || 'member'}_${cert.label}.png`);
        } catch (err) {
            console.error('Certificate download failed:', err);
        } finally {
            setDownloadingCertId(null);
        }
    }, [userProfile]);

    const handleStartEditing = () => {
        const currentBranch = userProfile?.branch || 'B.Tech (CSE)';
        const isStandard = ALL_PROGRAM_NAMES.includes(currentBranch);

        setEditForm({
            phone: userProfile?.phone || '',
            branch: isStandard ? currentBranch : 'Other',
            customBranch: isStandard ? '' : currentBranch,
            year: userProfile?.year || '1st',
            bio: userProfile?.bio || ''
        });
        setEditPhotoDataUrl('');
        setPhotoError('');
        setIsEditing(true);
        setSaveSuccess('');
        setSaveError('');
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoError('');
        try {
            setEditPhotoDataUrl(await resizeImageWithBudget(file));
        } catch (err) {
            setPhotoError(err.message || 'Could not process that image. Try a different file.');
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveSuccess('');
        setSaveError('');

        const finalBranch = editForm.branch === 'Other'
            ? editForm.customBranch.trim()
            : editForm.branch;

        if (editForm.branch === 'Other' && !finalBranch) {
            setSaveError('Please specify your degree or program name.');
            setSaving(false);
            return;
        }

        try {
            const payload = {
                phone: editForm.phone.replace(/\D/g, ''),
                branch: finalBranch,
                year: editForm.year,
                bio: editForm.bio.trim()
            };
            if (editPhotoDataUrl) payload.avatarUrl = editPhotoDataUrl;

            await updateProfileData(payload);

            setSaveSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            console.error('Update profile error:', err);
            setSaveError(err.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    // User avatar fallback (initial letter)
    const userInitial = useMemo(() => {
        if (userProfile?.name) return userProfile.name.charAt(0).toUpperCase();
        if (currentUser?.email) return currentUser.email.charAt(0).toUpperCase();
        return 'U';
    }, [userProfile?.name, currentUser?.email]);

    if (!userProfile) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-10 h-10 text-brand-yellow animate-spin mb-4" />
                <p className="font-bold text-[var(--text-primary)] uppercase text-sm tracking-wider">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-24 pb-16 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Success/Error Alerts */}
                {saveSuccess && (
                    <div className="bg-[color-mix(in_srgb,var(--success-bg)_40%,transparent)] border-2 border-green-500 text-[var(--success-color)] p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[var(--success-color)]" />
                            <span className="font-bold text-sm">{saveSuccess}</span>
                        </div>
                        <button onClick={() => setSaveSuccess('')} className="text-[var(--success-color)] hover:text-[var(--text-primary)]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {saveError && (
                    <div className="bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] border-2 border-red-500 text-[var(--danger-color)] p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-[var(--danger-color)]" />
                            <span className="font-bold text-sm">{saveError}</span>
                        </div>
                        <button onClick={() => setSaveError('')} className="text-[var(--danger-color)] hover:text-[var(--text-primary)]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* SECTION 1: HERO CARD */}
                <div className="bg-[var(--bg-card)] border-4 border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#FFB22C] relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        {/* Left: Avatar & Basic Info */}
                        <div className="flex items-center gap-5">
                            {userProfile.avatarUrl ? (
                                <img
                                    src={userProfile.avatarUrl}
                                    alt={userProfile.name}
                                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-brand-yellow object-cover"
                                />
                            ) : (
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-brand-yellow bg-[var(--bg-secondary)] text-brand-yellow font-black text-4xl flex items-center justify-center shadow-[4px_4px_0px_#FFB22C]">
                                    {userInitial}
                                </div>
                            )}

                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                                    {userProfile.name || 'E-Cell Member'}
                                </h1>
                                <p className="text-gray-400 text-sm font-medium mb-3">
                                    {userProfile.email}
                                </p>
                                {isPastMember ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-gray-300 font-bold text-xs uppercase tracking-wider">
                                        <History className="w-3.5 h-3.5" />
                                        Past E-Cell Member
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-yellow/10 border border-brand-yellow/50 rounded-full text-brand-yellow font-bold text-xs uppercase tracking-wider">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {userProfile.memberType === 'ecell_member' ? 'Core Team Member' : 'E-Cell DYPIU Member'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                            {!isEditing && (
                                <button
                                    onClick={handleStartEditing}
                                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-[var(--text-primary)] font-bold px-4 py-2.5 rounded-xl border-2 border-zinc-700 text-xs uppercase transition-colors"
                                >
                                    <Edit2 className="w-4 h-4 text-brand-yellow" />
                                    Edit Profile
                                </button>
                            )}

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-[color-mix(in_srgb,var(--danger-bg)_30%,transparent)] hover:bg-red-600 border-2 border-red-500/50 hover:border-red-600 text-[var(--danger-color)] hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: MEMBERSHIP DURATION CARD */}
                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#FFB22C] relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase font-bold tracking-widest mb-1">
                                <Sparkles className="w-4 h-4 text-brand-yellow" />
                                Your Journey with E-Cell
                            </div>

                            {/* Line 1: Member since date */}
                            <p className="text-xl md:text-2xl font-bold text-gray-200">
                                Member since <span className="text-[var(--text-primary)] font-black">{membership.joinedDate}</span>
                            </p>

                            {/* Line 2: Live formatted duration */}
                            <h2 className="text-3xl md:text-5xl font-black text-brand-yellow tracking-tight py-1 font-mono">
                                {membership.formattedString}
                            </h2>

                            {/* Line 3: Muted subtitle */}
                            <p className="text-gray-400 text-xs md:text-sm">
                                You've been part of the E-Cell DYPIU entrepreneurial community.
                            </p>
                        </div>

                        {/* Milestone Badge if achieved */}
                        {milestone && (
                            <div className="bg-[var(--bg-secondary)] border-2 border-brand-yellow p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_#FFB22C] min-w-[160px]">
                                <span className="text-4xl mb-1">{milestone.emoji}</span>
                                <span className="text-brand-yellow font-black text-sm uppercase tracking-wider">
                                    {milestone.label}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 3: PROFILE INFORMATION */}
                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <h3 className="text-xl font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
                            <User className="w-5 h-5 text-brand-yellow" />
                            Personal Details
                        </h3>

                        {isEditing && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-gray-300 text-xs font-bold uppercase hover:bg-zinc-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        /* Edit Mode Form */
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                                    Profile Photo
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-[var(--bg-secondary)] border-2 border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {editPhotoDataUrl || userProfile.avatarUrl ? (
                                            <img src={editPhotoDataUrl || userProfile.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-zinc-600" />
                                        )}
                                    </div>
                                    <div>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-[var(--text-primary)] font-bold px-4 py-2 rounded-xl border-2 border-zinc-700 text-xs uppercase transition-colors"
                                        >
                                            {editPhotoDataUrl || userProfile.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                                        </button>
                                        {photoError && <p className="text-xs text-[var(--danger-color)] mt-1">{photoError}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="9876543210"
                                        required
                                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                                        Branch / Program
                                    </label>
                                    <select
                                        value={editForm.branch}
                                        onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm truncate"
                                    >
                                        {PROGRAM_GROUPS.map((group) => (
                                            <optgroup key={group.school} label={group.school} className="bg-zinc-900 text-brand-yellow font-bold">
                                                {group.programs.map((program) => (
                                                    <option key={program} value={program} className="bg-black text-white font-normal">
                                                        {program}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                        <optgroup label="Other Options" className="bg-zinc-900 text-brand-yellow font-bold">
                                            <option value="Other" className="bg-black text-white font-normal">
                                                Other (please specify)
                                            </option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                                        Year of Study
                                    </label>
                                    <select
                                        value={editForm.year}
                                        onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                                    >
                                        {YEAR_OPTIONS.map(y => (
                                            <option key={y} value={y}>{y} Year</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                                        College (Immutable)
                                    </label>
                                    <input
                                        type="text"
                                        value={userProfile.college || 'DYPIU'}
                                        disabled
                                        className="w-full bg-zinc-800 border-2 border-zinc-700 p-3 text-gray-400 rounded-xl text-sm cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Custom Branch Input for Edit Mode */}
                            {editForm.branch === 'Other' && (
                                <div className="bg-[color-mix(in_srgb,var(--bg-secondary)_60%,transparent)] border-2 border-brand-yellow/50 p-4 rounded-xl space-y-2">
                                    <label className="block text-xs font-bold uppercase text-brand-yellow mb-1">
                                        Please specify your program <span className="text-[var(--text-primary)]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.customBranch}
                                        onChange={(e) => setEditForm({ ...editForm, customBranch: e.target.value })}
                                        placeholder="Enter your degree or program name"
                                        required
                                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 px-4 py-2.5 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                                    Bio / Entrepreneurial Goals
                                </label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    rows={3}
                                    placeholder="Tell us about yourself or your startup ideas..."
                                    className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-3 text-[var(--text-primary)] rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-xl bg-zinc-800 text-gray-300 font-bold uppercase text-xs hover:bg-zinc-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 rounded-xl bg-brand-yellow text-[var(--text-on-brand)] font-black uppercase text-xs hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Read-Only Details Grid */
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border-2 border-zinc-800 p-4 rounded-2xl">
                                    <Phone className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Phone Number</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{userProfile.phone || 'Not provided'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border-2 border-zinc-800 p-4 rounded-2xl min-w-0">
                                    <GraduationCap className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Branch / Program</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)] break-words" title={userProfile.branch}>{userProfile.branch || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border-2 border-zinc-800 p-4 rounded-2xl">
                                    <Calendar className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Year of Study</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{userProfile.year ? `${userProfile.year} Year` : 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-[var(--bg-secondary)] border-2 border-zinc-800 p-4 rounded-2xl">
                                    <Building className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Institution</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{userProfile.college || 'DYPIU'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bio Section */}
                            <div className="bg-[var(--bg-secondary)] border-2 border-zinc-800 p-4 rounded-2xl">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Bio / Entrepreneurial Goals</p>
                                <p className="text-sm text-gray-300 leading-relaxed italic">
                                    {userProfile.bio || 'No bio added yet. Click "Edit Profile" to add one!'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 4: EVENTS ATTENDED */}
                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
                    <h3 className="text-xl font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-brand-yellow" />
                        Events You've Attended
                    </h3>

                    {userProfile.eventsAttended && userProfile.eventsAttended.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {userProfile.eventsAttended.map((eventId, idx) => {
                                const event = typeof eventId === 'string' ? eventsById[eventId] : null;
                                const title = event?.title || (typeof eventId === 'object' ? (eventId.name || eventId.id) : eventId);
                                const date = event?.date || (typeof eventId === 'object' ? eventId.date : null) || 'Attended';
                                return (
                                    <div key={idx} className="bg-[var(--bg-secondary)] border-2 border-zinc-800 p-4 rounded-2xl space-y-2">
                                        <h4 className="font-bold text-[var(--text-primary)] text-sm">{title}</h4>
                                        <p className="text-xs text-gray-400">{date}</p>
                                        <span className="inline-block px-2 py-0.5 bg-[color-mix(in_srgb,var(--success-bg)_40%,transparent)] text-[var(--success-color)] border border-green-500/50 rounded-full text-[10px] font-bold uppercase">
                                            Verified Attendee
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 bg-[color-mix(in_srgb,var(--bg-secondary)_40%,transparent)] rounded-2xl border-2 border-dashed border-zinc-800 p-6 flex flex-col items-center justify-center">
                            <CalendarDays className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                            <p className="text-[var(--text-primary)] font-bold text-base mb-1">No events yet</p>
                            <p className="text-xs text-gray-400 mb-4 max-w-sm">
                                Your entrepreneurial journey starts with your first event!
                            </p>
                            <Link
                                to="/events"
                                className="inline-flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] font-black px-4 py-2 rounded-xl text-xs uppercase hover:bg-white transition-colors"
                            >
                                Browse Upcoming Events
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* SECTION 5: CERTIFICATES */}
                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
                    <h3 className="text-xl font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
                        <Award className="w-5 h-5 text-brand-yellow" />
                        Your Certificates
                    </h3>

                    {certsLoading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /></div>
                    ) : eligibleCerts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {eligibleCerts.map((cert) => (
                                <div key={cert.eventId} className="bg-[var(--bg-secondary)] border-2 border-zinc-800 p-4 rounded-2xl space-y-2">
                                    <Award className="w-6 h-6 text-brand-yellow" />
                                    <h4 className="font-bold text-[var(--text-primary)] text-sm">{cert.label}</h4>
                                    <button
                                        onClick={() => handleDownloadCert(cert)}
                                        disabled={downloadingCertId === cert.eventId}
                                        className="text-xs text-brand-yellow hover:underline font-bold disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {downloadingCertId === cert.eventId && <Loader2 className="w-3 h-3 animate-spin" />}
                                        Download Certificate
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 bg-[color-mix(in_srgb,var(--bg-secondary)_40%,transparent)] rounded-2xl border-2 border-dashed border-zinc-800 p-6 flex flex-col items-center justify-center">
                            <Award className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                            <p className="text-[var(--text-primary)] font-bold text-base mb-1">No certificates unlocked</p>
                            <p className="text-xs text-gray-400 max-w-sm">
                                Certificates appear here automatically once an admin uploads a template and turns on auto-issue for an event you attended.
                            </p>
                        </div>
                    )}
                </div>

                {/* SECTION 6: ACTIVITY TIMELINE */}
                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
                    <h3 className="text-xl font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-brand-yellow" />
                        Activity Timeline
                    </h3>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                        {/* Timeline Item: Joined */}
                        <div className="relative flex items-start gap-4">
                            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-brand-yellow ring-4 ring-[var(--bg-card)]" />
                            <div>
                                <h4 className="font-bold text-[var(--text-primary)] text-sm">Joined E-Cell DYPIU</h4>
                                <p className="text-xs text-gray-400">{membership.joinedDate}</p>
                            </div>
                        </div>

                        {/* Timeline Item: Events */}
                        {userProfile.eventsAttended && userProfile.eventsAttended.map((eventId, idx) => {
                            const event = typeof eventId === 'string' ? eventsById[eventId] : null;
                            const title = event?.title || (typeof eventId === 'object' ? (eventId.name || eventId.id) : eventId);
                            const date = event?.date || (typeof eventId === 'object' ? eventId.date : null) || 'Event Day';
                            return (
                                <div key={idx} className="relative flex items-start gap-4">
                                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-green-500 ring-4 ring-[var(--bg-card)]" />
                                    <div>
                                        <h4 className="font-bold text-[var(--text-primary)] text-sm">Attended {title}</h4>
                                        <p className="text-xs text-gray-400">{date}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
