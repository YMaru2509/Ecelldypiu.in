import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Loader2, Save, ShieldCheck, UserPlus, UserMinus, UserCheck2, History, Ban, Search, X, Settings2, Upload, GripVertical, Award, CalendarDays } from 'lucide-react';
import PanelShell from './PanelShell';
import MailProviderSelect from '../../components/MailProviderSelect';
import RemoveMemberFlow from './RemoveMemberFlow';
import { MODULES, PERMISSION_LEVELS, isSystemOwner, hasPermission } from '../../utils/rbac';
import { usePanelAccess } from '../../context/panelAccessContext';
import TeamRosterControl from '../../components/TeamRosterControl';
import { adminAuthHeaders } from '../../utils/adminAuth';
import PhotoEditor from '../../components/PhotoEditor';

// Permanently capped to these two accounts — mirrors api/panel-users.js's
// PERMANENT_SYSTEM_OWNER_UIDS. The server is the real enforcement point; this
// just keeps the option from being offered in the UI at all.
const PERMANENT_SYSTEM_OWNER_UIDS = ['SPWSYZ3Ggid0rosU2cJ76CGIovY2', 'DjWLl7JtX9Ynxtg3sRsrzBJMqlp2'];
const ASSIGNABLE_ROLES = ['vertical_head', 'board_member'];

const STATUS_BADGE = {
    banned: { label: 'Banned', icon: Ban, className: 'bg-[color-mix(in_srgb,var(--danger-bg)_30%,transparent)] text-[var(--danger-color)] border-red-500' },
    past_member: { label: 'Past Member', icon: History, className: 'border-[var(--border-color)] text-[var(--text-secondary)]' },
};

const DISPLAY_STATUS_BADGE = {
    inactive: { label: 'Hidden from Team', className: 'border-zinc-600 text-zinc-400' },
};

// CSV parser for the "name,email,title" format (title is optional, a 2-column
// name,email CSV still works) — no library needed. Handles an optional header
// row, quoted fields, and skips blank lines.
function parseCsv(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const splitRow = (line) => {
        const cells = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                cells.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        cells.push(current.trim());
        return cells;
    };

    const rows = lines.map(splitRow).filter((r) => r.length >= 2);
    if (rows.length === 0) return [];

    const looksLikeHeader = /name/i.test(rows[0][0]) && /email/i.test(rows[0][1]);
    const dataRows = looksLikeHeader ? rows.slice(1) : rows;

    return dataRows.map(([name, email, title]) => ({ name: name || '', email: email || '', title: title || '' }));
}

const CsvUploadForm = ({ onImported }) => {
    const fileInputRef = useRef(null);
    const [rows, setRows] = useState(null); // null = nothing picked yet
    const [provider, setProvider] = useState('zeptomail');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState(null);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setSummary(null);
        const text = await file.text();
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
            setError('No valid rows found — expected one "name,email" per line.');
            setRows(null);
            return;
        }
        setRows(parsed);
    };

    const submit = async () => {
        if (!rows?.length) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/panel-users?action=bulk-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ members: rows, provider }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Bulk import failed');
            setSummary(data);
            setRows(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            onImported();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const duplicateEmails = useMemo(() => {
        if (!rows) return new Set();
        const counts = {};
        rows.forEach((r) => {
            const e = r.email.toLowerCase();
            if (e) counts[e] = (counts[e] || 0) + 1;
        });
        return new Set(Object.keys(counts).filter((e) => counts[e] > 1));
    }, [rows]);

    return (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="font-bold text-sm uppercase">Bulk Invite from CSV</p>
                    <p className="text-xs text-[var(--text-secondary)]">Columns: name, email, title (title optional). One row per core member.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <MailProviderSelect value={provider} onChange={setProvider} />
                    <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" id="csv-upload-input" />
                    <label htmlFor="csv-upload-input" className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-zinc-700">
                        <Upload className="w-4 h-4" /> Choose CSV
                    </label>
                    {rows?.length > 0 && (
                        <button
                            type="button"
                            disabled={loading}
                            onClick={submit}
                            className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Import {rows.length}
                        </button>
                    )}
                </div>
            </div>

            {error && <p className="text-xs font-bold text-[var(--danger-color)] mt-3">{error}</p>}

            {duplicateEmails.size > 0 && (
                <p className="text-xs font-bold text-[var(--danger-color)] mt-3">
                    {duplicateEmails.size} email(s) appear more than once in this file — only the first row for each will get an account. Fix the CSV and re-upload if that's not intended.
                </p>
            )}

            {rows?.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto border-2 border-[var(--border-color)] rounded-xl">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[var(--bg-hover)]">
                            <tr>
                                <th className="text-left px-3 py-2 font-bold uppercase">Name</th>
                                <th className="text-left px-3 py-2 font-bold uppercase">Email</th>
                                <th className="text-left px-3 py-2 font-bold uppercase">Title</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => {
                                const isDup = duplicateEmails.has(r.email.toLowerCase());
                                return (
                                    <tr key={i} className={`border-t border-[var(--border-color)] ${isDup ? 'bg-[color-mix(in_srgb,var(--danger-bg)_20%,transparent)]' : ''}`}>
                                        <td className="px-3 py-1.5">{r.name || <span className="text-[var(--danger-color)]">missing</span>}</td>
                                        <td className="px-3 py-1.5">
                                            {r.email || <span className="text-[var(--danger-color)]">missing</span>}
                                            {isDup && <span className="text-[var(--danger-color)] font-bold ml-1">(duplicate)</span>}
                                        </td>
                                        <td className="px-3 py-1.5 text-[var(--text-secondary)]">{r.title || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {summary && (
                <div className="mt-4 p-3 rounded-xl bg-[color-mix(in_srgb,var(--success-bg)_25%,transparent)] border-2 border-green-500 text-[var(--success-color)] text-xs font-bold space-y-1">
                    <p>{summary.createdCount} account(s) created and emailed.</p>
                    {summary.skipped?.length > 0 && <p className="text-[var(--text-secondary)]">{summary.skipped.length} skipped (already existed): {summary.skipped.map((s) => s.email).join(', ')}</p>}
                    {summary.failed?.length > 0 && <p className="text-[var(--danger-color)]">{summary.failed.length} failed: {summary.failed.map((f) => `${f.email || f.name} (${f.error})`).join(', ')}</p>}
                </div>
            )}
        </div>
    );
};

const InviteMemberForm = ({ onInvited }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/panel-users?action=invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ name, email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to invite member');
            setSuccess(`Invited ${email} — credentials emailed.`);
            setName('');
            setEmail('');
            onInvited();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-3">
            <input type="text" required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-black border-2 border-zinc-700 p-2.5 text-white rounded-xl text-sm" />
            <input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-black border-2 border-zinc-700 p-2.5 text-white rounded-xl text-sm" />
            <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-50 whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Invite Member
            </button>
            {(error || success) && (
                <p className={`text-xs font-bold sm:basis-full ${error ? 'text-[var(--danger-color)]' : 'text-[var(--success-color)]'}`}>{error || success}</p>
            )}
        </form>
    );
};

const fmtDate = (value) => {
    if (!value) return '';
    // A Firestore Timestamp survives the API's JSON response as a plain
    // { _seconds, _nanoseconds } object, not a Date or a .toDate()-capable
    // instance — new Date(value) silently produces an Invalid Date for that
    // shape, so it needs its own branch.
    const d = value?.toDate ? value.toDate()
        : (value._seconds || value.seconds) ? new Date((value._seconds ?? value.seconds) * 1000)
            : new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Read-only summary of everything the member filled in themselves (onboarding +
// subsequent Profile edits) — so "Manage" is also where you see what they answered,
// not just where you edit their access.
const FilledProfileSummary = ({ member, eventsById }) => {
    const resolveTitles = (ids) => (ids || []).map((id) => eventsById[id]?.title || id);

    return (
        <div className="mb-5 p-4 bg-black/30 rounded-xl border-2 border-[var(--border-color)] space-y-3">
            <div className="flex items-center gap-3">
                {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-14 h-14 rounded-xl object-cover border-2 border-brand-yellow" />
                ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 border-2 border-brand-yellow flex items-center justify-center text-brand-yellow font-black">
                        {(member.name || '?').charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs flex-1">
                    <p><span className="text-[var(--text-muted)]">Phone:</span> {member.phone || '—'}</p>
                    <p><span className="text-[var(--text-muted)]">Branch:</span> {member.branch || '—'}</p>
                    <p><span className="text-[var(--text-muted)]">Year:</span> {member.year || '—'}</p>
                    <p><span className="text-[var(--text-muted)]">Joined E-Cell:</span> {fmtDate(member.ecellJoinDate) || '—'}</p>
                    <p className="col-span-2"><span className="text-[var(--text-muted)]">Onboarding:</span> {member.onboardingComplete ? 'Complete' : 'Not yet completed'}</p>
                </div>
            </div>
            {member.bio && <p className="text-xs text-[var(--text-secondary)] italic">"{member.bio}"</p>}
            {member.eventsAttended?.length > 0 && (
                <p className="text-xs flex items-start gap-1.5"><CalendarDays className="w-3.5 h-3.5 mt-0.5 text-brand-yellow flex-shrink-0" /> Attended: {resolveTitles(member.eventsAttended).join(', ')}</p>
            )}
            {member.certificatesAsOrganiser?.length > 0 && (
                <p className="text-xs flex items-start gap-1.5"><Award className="w-3.5 h-3.5 mt-0.5 text-brand-yellow flex-shrink-0" /> Organised: {resolveTitles(member.certificatesAsOrganiser).join(', ')}</p>
            )}
            {member.certificatesAsParticipant?.length > 0 && (
                <p className="text-xs flex items-start gap-1.5"><Award className="w-3.5 h-3.5 mt-0.5 text-brand-yellow flex-shrink-0" /> Participated: {resolveTitles(member.certificatesAsParticipant).join(', ')}</p>
            )}
        </div>
    );
};

// The focused role/permission editor for a single member — only ever shown for
// one person at a time, reached via search, instead of every member rendering
// its own full grid inline.
const AssignAccessModal = ({ member, verticals, eventsById, onClose, onSaved }) => {
    const [roles, setRoles] = useState(member.roles || []);
    const [permissions, setPermissions] = useState(member.permissions || {});
    const [memberVerticals, setMemberVerticals] = useState(member.verticals || []);
    const [publicTitle, setPublicTitle] = useState(member.publicTitle || '');
    const [avatarUrl, setAvatarUrl] = useState(member.avatarUrl || '');
    const [avatarPosition, setAvatarPosition] = useState({ x: Number(member.avatarPosition?.x) || 50, y: Number(member.avatarPosition?.y) || 50 });
    const [photoEditorSrc, setPhotoEditorSrc] = useState('');
    const [ecellJoinDate, setEcellJoinDate] = useState(member.ecellJoinDate?.slice?.(0, 10) || '');
    const [membershipStatus, setMembershipStatus] = useState(member.membershipStatus || 'active');
    const [displayStatus, setDisplayStatus] = useState(member.displayStatus || 'active');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const canHaveSystemOwner = PERMANENT_SYSTEM_OWNER_UIDS.includes(member.uid);
    const roleOptions = canHaveSystemOwner ? ['system_owner', ...ASSIGNABLE_ROLES] : ASSIGNABLE_ROLES;

    const toggleRole = (role) => {
        setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
    };
    const toggleVertical = (id) => {
        setMemberVerticals((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };
    const setModuleLevel = (moduleKey, level) => {
        setPermissions((prev) => ({ ...prev, [moduleKey]: level }));
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const reader = new FileReader();
            reader.onload = () => setPhotoEditorSrc(reader.result);
            reader.readAsDataURL(file);
        } catch (err) {
            setError(err.message || 'Could not process that image.');
        }
    };

    const save = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/panel-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ uid: member.uid, roles, permissions, verticals: memberVerticals, publicTitle, avatarUrl, avatarPosition, ecellJoinDate: ecellJoinDate || null, membershipStatus, displayStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div
                className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 w-full max-w-2xl my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <p className="font-bold text-lg">{member.name || 'Unnamed'}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{member.email}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] border-2 border-red-500 text-[var(--danger-color)] font-bold text-xs">
                        {error}
                    </div>
                )}

                <FilledProfileSummary member={member} eventsById={eventsById} />

                <div className="mb-5 p-4 rounded-xl border-2 border-[var(--border-color)] bg-black/20">
                    <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2">Profile photo and display position</p>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-brand-yellow bg-zinc-800 flex items-center justify-center">
                            {avatarUrl ? <img src={avatarUrl} alt="Member preview" style={{ objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%` }} className="w-full h-full object-cover" /> : <span className="text-brand-yellow font-black">{(member.name || '?')[0]}</span>}
                        </div>
                        <div className="space-y-2 flex-1">
                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="block w-full text-xs text-[var(--text-secondary)]" />
                            <p className="text-[10px] text-[var(--text-muted)]">The photo editor opens after selecting an image.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                    <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">E-Cell join date
                        <input type="date" value={ecellJoinDate} onChange={(e) => setEcellJoinDate(e.target.value)} className="mt-1 w-full bg-black border-2 border-zinc-700 p-2.5 text-white rounded-xl text-sm" />
                    </label>
                    <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Membership status
                        <select value={membershipStatus} onChange={(e) => setMembershipStatus(e.target.value)} className="mt-1 w-full bg-black border-2 border-zinc-700 p-2.5 text-white rounded-xl text-sm">
                            <option value="active">Active member</option><option value="inactive">Inactive member</option><option value="past_member">Past member</option><option value="banned">Banned</option>
                        </select>
                    </label>
                    <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Team display status
                        <select value={displayStatus} onChange={(e) => setDisplayStatus(e.target.value)} className="mt-1 w-full bg-black border-2 border-zinc-700 p-2.5 text-white rounded-xl text-sm">
                            <option value="active">Visible on Team page</option><option value="inactive">Hidden from Team page</option>
                        </select>
                    </label>
                </div>

                <div className="mb-4">
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1.5">Public Title (shown on Team page)</label>
                    <input
                        type="text"
                        value={publicTitle}
                        onChange={(e) => setPublicTitle(e.target.value)}
                        placeholder="e.g. Operations Head"
                        maxLength={80}
                        className="w-full bg-black border-2 border-zinc-700 p-2.5 text-white rounded-xl text-sm"
                    />
                </div>

                <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1.5">Roles</p>
                    <div className="flex flex-wrap gap-2">
                        {roleOptions.map((role) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border-2 transition-colors ${roles.includes(role)
                                        ? 'bg-brand-yellow text-[var(--text-on-brand)] border-brand-yellow'
                                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                {role.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    {!canHaveSystemOwner && (
                        <p className="text-[10px] text-[var(--text-muted)] mt-1.5">system_owner is permanently limited to the two founding accounts.</p>
                    )}
                </div>

                {verticals.length > 0 && (
                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1.5">E-Cell verticals (for attendance requests)</p>
                        <div className="flex flex-wrap gap-2">
                            {verticals.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => toggleVertical(v.id)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border-2 transition-colors ${memberVerticals.includes(v.id)
                                            ? 'bg-brand-yellow text-[var(--text-on-brand)] border-brand-yellow'
                                            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-5">
                    <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1.5">Module permissions</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {MODULES.map((moduleKey) => (
                            <div key={moduleKey} className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] truncate" title={moduleKey}>
                                    {moduleKey}
                                </label>
                                <select
                                    value={permissions?.[moduleKey] || 'none'}
                                    onChange={(e) => setModuleLevel(moduleKey, e.target.value)}
                                    disabled={roles.includes('system_owner')}
                                    className="bg-black border-2 border-zinc-700 rounded-lg px-2 py-1 text-xs disabled:opacity-40"
                                >
                                    {PERMISSION_LEVELS.map((level) => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-black uppercase text-[var(--text-secondary)]">Cancel</button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={save}
                        className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2 rounded-xl text-xs font-black uppercase disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </div>
            </div>
            {photoEditorSrc && (
                <PhotoEditor
                    src={photoEditorSrc}
                    onCancel={() => setPhotoEditorSrc('')}
                    onSave={(dataUrl) => { setAvatarUrl(dataUrl); setAvatarPosition({ x: 50, y: 50 }); setPhotoEditorSrc(''); }}
                />
            )}
        </div>
    );
};

const AssignStaffSearch = ({ members, onPick, onClose }) => {
    const [query, setQuery] = useState('');

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q));
    }, [members, query]);

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <p className="font-black uppercase">Assign Staff</p>
                    <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search by name or email"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-black border-2 border-zinc-700 pl-9 pr-3 py-2.5 text-white rounded-xl text-sm"
                    />
                </div>
                <div className="max-h-80 overflow-y-auto space-y-1">
                    {results.length === 0 && <p className="text-xs text-[var(--text-secondary)] text-center py-6">No members match.</p>}
                    {results.map((m) => (
                        <button
                            key={m.uid}
                            type="button"
                            onClick={() => onPick(m)}
                            className="w-full flex items-center justify-between gap-2 p-3 rounded-xl hover:bg-[var(--bg-hover)] text-left transition-colors"
                        >
                            <div>
                                <p className="font-bold text-sm">{m.name || 'Unnamed'}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{m.email}</p>
                            </div>
                            {m.roles?.length > 0 && (
                                <span className="text-[10px] font-bold uppercase text-brand-yellow whitespace-nowrap">{m.roles.join(', ')}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Reorder mode: drag-and-drop list that only shows active core members (who
// appear on the Team page), ported from TeamManager.jsx's exact drag logic.
const ReorderList = ({ members, onSaved }) => {
    const orderable = useMemo(
        () => members
            .filter((m) => m.memberType === 'ecell_member' && m.membershipStatus === 'active')
            .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name)),
        [members]
    );
    const [order, setOrder] = useState(orderable);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { setOrder(orderable); }, [orderable]);

    const handleDragStart = (index) => setDraggedIndex(index);
    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (dragOverIndex !== index) setDragOverIndex(index);
    };
    const handleDrop = async (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        const updated = [...order];
        const [moved] = updated.splice(draggedIndex, 1);
        updated.splice(targetIndex, 0, moved);
        const reordered = updated.map((m, i) => ({ ...m, priority: i + 1 }));
        setOrder(reordered);
        setDraggedIndex(null);
        setDragOverIndex(null);

        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/panel-users?action=reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ order: reordered.map((m) => ({ uid: m.uid, priority: m.priority })) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save order');
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mb-6">
            <p className="text-xs text-[var(--text-secondary)] mb-3">Drag to set the display order on the public Team page. Only active core members are listed here.</p>
            {error && <p className="text-xs font-bold text-[var(--danger-color)] mb-3">{error}</p>}
            {saving && <p className="text-xs text-brand-yellow mb-3 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving order...</p>}
            <div className="space-y-1">
                {order.map((m, i) => (
                    <div
                        key={m.uid}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={(e) => handleDrop(e, i)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-move transition-colors ${dragOverIndex === i ? 'border-brand-yellow bg-[var(--bg-hover)]' : 'border-[var(--border-color)] bg-[var(--bg-card)]'}`}
                    >
                        <GripVertical className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                        <span className="text-xs font-bold text-[var(--text-muted)] w-6">{i + 1}</span>
                        <p className="font-bold text-sm">{m.name || 'Unnamed'}</p>
                        {m.publicTitle && <span className="text-xs text-[var(--text-secondary)]">— {m.publicTitle}</span>}
                    </div>
                ))}
                {order.length === 0 && <p className="text-xs text-[var(--text-secondary)] text-center py-6">No active core members yet.</p>}
            </div>
        </div>
    );
};

const UsersRoles = () => {
    // Viewing the team needs 'users' or 'team' view; changing anything needs
    // 'users' manage (display order alone can also be changed with 'team' manage).
    // The server enforces this — hiding the controls just avoids dead buttons.
    const { profile } = usePanelAccess();
    const canManage = hasPermission(profile, 'users', 'manage');
    const canReorder = canManage || hasPermission(profile, 'team', 'manage');

    const [members, setMembers] = useState([]);
    const [verticals, setVerticals] = useState([]);
    const [eventsById, setEventsById] = useState({});
    const [rosterStatus, setRosterStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [removeFlowUid, setRemoveFlowUid] = useState(null);
    const [unbanningUid, setUnbanningUid] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [reorderMode, setReorderMode] = useState(false);
    const [query, setQuery] = useState('');

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [mRes, vRes, eRes, rRes] = await Promise.all([
                fetch('/api/panel-users', { headers: adminAuthHeaders() }),
                fetch('/api/attendance?action=verticals', { headers: adminAuthHeaders() }),
                fetch('/api/event?action=get-events'),
                fetch('/api/panel-users?action=roster-status', { headers: adminAuthHeaders() }),
            ]);
            const data = await mRes.json();
            if (!mRes.ok) throw new Error(data.error || 'Failed to load members');
            // Team page only — regular students who just registered (memberType
            // 'normal_member') live on the separate Members page instead.
            setMembers((data.members || []).filter((m) => m.memberType !== 'normal_member'));
            const vData = await vRes.json();
            if (vRes.ok) setVerticals(vData.verticals || []);
            const eData = await eRes.json();
            if (eRes.ok && Array.isArray(eData)) setEventsById(Object.fromEntries(eData.map((ev) => [ev.id, ev])));
            const rData = await rRes.json();
            if (rRes.ok) setRosterStatus(rData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const visibleMembers = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) => [
            m.name, m.email, m.publicTitle, m.branch, m.phone,
            (m.roles || []).join(' ').replace(/_/g, ' '),
            (m.verticals || []).join(' '),
        ].some((field) => (field || '').toString().toLowerCase().includes(q)));
    }, [members, query]);

    const unban = async (member) => {
        setUnbanningUid(member.uid);
        setError('');
        try {
            const res = await fetch('/api/panel-users?action=unban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ uid: member.uid }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to unban');
            await fetchMembers();
        } catch (err) {
            setError(err.message);
        } finally {
            setUnbanningUid(null);
        }
    };

    return (
        <PanelShell>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <h1 className="text-2xl md:text-3xl font-black uppercase">Team Members</h1>
                <div className="flex items-center gap-2">
                    {canReorder && <button
                        type="button"
                        onClick={() => setReorderMode((v) => !v)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase border-2 ${reorderMode ? 'bg-brand-yellow text-[var(--text-on-brand)] border-brand-yellow' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
                    >
                        <GripVertical className="w-4 h-4" /> {reorderMode ? 'Done Reordering' : 'Reorder Team'}
                    </button>}
                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2.5 rounded-xl text-xs font-black uppercase"
                        >
                            <Settings2 className="w-4 h-4" /> Assign Staff
                        </button>
                    )}
                </div>
            </div>

            {canManage && <TeamRosterControl status={rosterStatus} onRefresh={fetchMembers} canToggle={hasPermission(profile, 'settings', 'manage')} />}

            {canManage && !reorderMode && (
                <>
                    <CsvUploadForm onImported={fetchMembers} />
                    <InviteMemberForm onInvited={fetchMembers} />
                </>
            )}

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-900/20 border-2 border-red-500 text-red-400 font-bold text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                </div>
            ) : reorderMode ? (
                <ReorderList members={members} onSaved={fetchMembers} />
            ) : (
                <div className="space-y-2">
                    <div className="relative mb-4">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search team members by name, email, title, role or vertical"
                            aria-label="Search team members"
                            className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] pl-9 pr-10 py-3 text-[var(--text-primary)] rounded-xl text-sm"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {query && (
                        <p className="text-xs text-[var(--text-secondary)] mb-2">
                            Showing {visibleMembers.length} of {members.length} member{members.length === 1 ? '' : 's'}
                        </p>
                    )}
                    {query && visibleMembers.length === 0 && (
                        <p className="text-sm text-[var(--text-secondary)] text-center py-10">No team members match &ldquo;{query.trim()}&rdquo;.</p>
                    )}
                    {visibleMembers.map((member) => (
                        <div key={member.uid} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{member.name || 'Unnamed'}</p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate">{member.email}</p>
                                    </div>
                                    {member.roles?.length > 0 && (
                                        <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)] whitespace-nowrap">
                                            {member.roles.join(', ').replace(/_/g, ' ')}
                                        </span>
                                    )}
                                    {member.mustChangePassword && (
                                        <span className="text-[10px] font-black uppercase text-brand-yellow whitespace-nowrap">Temp Password</span>
                                    )}
                                    {member.membershipStatus === 'active' && member.profileMissing?.length > 0 && (
                                        <span
                                            title={`Not shown on the Team page yet — missing: ${member.profileMissing.join(', ')}`}
                                            className="text-[10px] font-black uppercase text-[var(--text-secondary)] border border-[var(--border-color)] rounded-full px-2 py-0.5 whitespace-nowrap cursor-help"
                                        >
                                            Profile incomplete
                                        </span>
                                    )}
                                    {STATUS_BADGE[member.membershipStatus] && (() => {
                                        const badge = STATUS_BADGE[member.membershipStatus];
                                        const Icon = badge.icon;
                                        return (
                                            <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full border-2 whitespace-nowrap ${badge.className}`}>
                                                <Icon className="w-3.5 h-3.5" /> {badge.label}
                                            </span>
                                        );
                                    })()}
                                    {DISPLAY_STATUS_BADGE[member.displayStatus] && (
                                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full border-2 whitespace-nowrap border-zinc-600 text-zinc-400">
                                            Hidden from Team
                                        </span>
                                    )}
                                    {isSystemOwner(member) && (
                                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-yellow whitespace-nowrap">
                                            <ShieldCheck className="w-3.5 h-3.5" /> System Owner
                                        </span>
                                    )}
                                </div>

                                {canManage && <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setEditingMember(member)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                                    >
                                        <Settings2 className="w-3.5 h-3.5" /> Manage
                                    </button>
                                    {!isSystemOwner(member) && (
                                        member.membershipStatus === 'banned' ? (
                                            <button
                                                type="button"
                                                disabled={unbanningUid === member.uid}
                                                onClick={() => unban(member)}
                                                className="flex items-center gap-1 bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50"
                                            >
                                                {unbanningUid === member.uid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck2 className="w-3.5 h-3.5" />}
                                                Unban
                                            </button>
                                        ) : member.membershipStatus !== 'past_member' ? (
                                            <button
                                                type="button"
                                                onClick={() => setRemoveFlowUid(removeFlowUid === member.uid ? null : member.uid)}
                                                className="flex items-center gap-1 text-[var(--danger-color)] px-3 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-[color-mix(in_srgb,var(--danger-bg)_20%,transparent)]"
                                            >
                                                <UserMinus className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        ) : null
                                    )}
                                </div>}
                            </div>

                            {member.membershipStatus === 'banned' && member.bannedReason && (
                                <p className="text-xs text-[var(--text-secondary)] mt-2">Reason: {member.bannedReason}</p>
                            )}

                            {removeFlowUid === member.uid && (
                                <RemoveMemberFlow member={member} onDone={() => { setRemoveFlowUid(null); fetchMembers(); }} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {searchOpen && (
                <AssignStaffSearch
                    members={members}
                    onClose={() => setSearchOpen(false)}
                    onPick={(member) => { setSearchOpen(false); setEditingMember(member); }}
                />
            )}

            {editingMember && (
                <AssignAccessModal
                    member={editingMember}
                    verticals={verticals}
                    eventsById={eventsById}
                    onClose={() => setEditingMember(null)}
                    onSaved={() => { setEditingMember(null); fetchMembers(); }}
                />
            )}
        </PanelShell>
    );
};

export default UsersRoles;
