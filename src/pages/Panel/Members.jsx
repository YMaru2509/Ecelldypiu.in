import { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, Search, UserMinus, UserCheck2, History, Ban } from 'lucide-react';
import PanelShell from './PanelShell';
import RemoveMemberFlow from './RemoveMemberFlow';
import { adminAuthHeaders } from '../../utils/adminAuth';

const STATUS_BADGE = {
    banned: { label: 'Banned', icon: Ban, className: 'bg-[color-mix(in_srgb,var(--danger-bg)_30%,transparent)] text-[var(--danger-color)] border-red-500' },
    past_member: { label: 'Past Member', icon: History, className: 'border-[var(--border-color)] text-[var(--text-secondary)]' },
};

const fmtDate = (value) => {
    if (!value) return '—';
    // A Firestore Timestamp survives the API's JSON response as a plain
    // { _seconds, _nanoseconds } object, not a Date or a .toDate()-capable
    // instance — new Date(value) silently produces an Invalid Date for that
    // shape, so it needs its own branch.
    const d = value?.toDate ? value.toDate()
        : (value._seconds || value.seconds) ? new Date((value._seconds ?? value.seconds) * 1000)
            : new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Regular students who registered through /register (memberType
// 'normal_member') — kept separate from Team Members (ecell_member, with
// roles/permissions/CSV invite/reorder), since none of that applies here.
// These accounts self-register; this page is for finding and, when needed,
// removing one, not managing access.
const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [removeFlowUid, setRemoveFlowUid] = useState(null);
    const [unbanningUid, setUnbanningUid] = useState(null);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/panel-users', { headers: adminAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load members');
            setMembers((data.members || []).filter((m) => m.memberType === 'normal_member'));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return members;
        return members.filter((m) => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q));
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
                <h1 className="text-2xl md:text-3xl font-black uppercase">Members</h1>
                <span className="text-xs font-bold uppercase text-[var(--text-secondary)]">{members.length} registered</span>
            </div>

            <div className="relative mb-6">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search by name or email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] pl-10 pr-4 py-2.5 text-[var(--text-primary)] rounded-xl text-sm focus:border-brand-yellow focus:outline-none"
                />
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-900/20 border-2 border-red-500 text-red-400 font-bold text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.length === 0 && (
                        <p className="text-sm text-[var(--text-secondary)] text-center py-12">
                            {members.length === 0 ? 'No registered members yet.' : 'No members match that search.'}
                        </p>
                    )}
                    {filtered.map((member) => (
                        <div key={member.uid} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{member.name || 'Unnamed'}</p>
                                        <p className="text-xs text-[var(--text-secondary)] truncate">{member.email}</p>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)] whitespace-nowrap">
                                        {member.branch || 'N/A'}{member.year ? ` · ${member.year} Year` : ''}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] whitespace-nowrap">
                                        Joined {fmtDate(member.ecellJoinDate || member.joinedAt)}
                                    </span>
                                    {member.onboardingComplete === false && (
                                        <span className="text-[10px] font-black uppercase text-brand-yellow whitespace-nowrap">Onboarding Incomplete</span>
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
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {member.membershipStatus === 'banned' ? (
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
                                    ) : null}
                                </div>
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
        </PanelShell>
    );
};

export default Members;
