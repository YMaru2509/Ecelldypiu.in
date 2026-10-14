import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminAuthHeaders } from '../../utils/adminAuth';

// Shared by Users & Roles (team) and Members — the three ways a system owner
// can remove someone: Kicked (banned, record kept), Leaving (marked past
// member, record kept, certificate-eligible), or Other (permanently deletes
// the account and its data with nothing retained — no undo, confirm only).
const RemoveMemberFlow = ({ member, onDone }) => {
    const [mode, setMode] = useState(null); // 'kick' | 'leave' | 'other'
    const [reason, setReason] = useState('');
    const [leftAt, setLeftAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        setLoading(true);
        setError('');
        try {
            const action = mode === 'kick' ? 'kick' : mode === 'leave' ? 'mark-left' : 'delete';
            const body = mode === 'kick' ? { uid: member.uid, reason }
                : mode === 'leave' ? { uid: member.uid, leftAt }
                    : { uid: member.uid };
            const res = await fetch(`/api/panel-users?action=${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update member');
            onDone();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mode) {
        return (
            <div className="mt-3 p-4 bg-[color-mix(in_srgb,var(--bg-secondary)_60%,transparent)] border-2 border-dashed border-zinc-700 rounded-xl">
                <p className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-3">How is this member being removed?</p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setMode('kick')} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase bg-[var(--danger-color)] text-white">Kicked</button>
                    <button type="button" onClick={() => setMode('leave')} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase bg-zinc-700 text-white">Leaving</button>
                    <button type="button" onClick={() => setMode('other')} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase bg-black text-white border-2 border-[var(--danger-color)]">Other</button>
                    <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase text-[var(--text-secondary)]">Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3 p-4 bg-[color-mix(in_srgb,var(--bg-secondary)_60%,transparent)] border-2 border-dashed border-zinc-700 rounded-xl space-y-3">
            {error && <p className="text-xs font-bold text-[var(--danger-color)]">{error}</p>}
            {mode === 'kick' && (
                <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">Reason (required)</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="2"
                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-2 text-[var(--text-primary)] rounded-lg text-xs resize-none" />
                </div>
            )}
            {mode === 'leave' && (
                <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">Ending date (required)</label>
                    <input type="date" value={leftAt} onChange={(e) => setLeftAt(e.target.value)} max={new Date().toISOString().split('T')[0]}
                        className="w-full bg-[var(--bg-secondary)] border-2 border-zinc-700 p-2 text-[var(--text-primary)] rounded-lg text-xs" />
                </div>
            )}
            {mode === 'other' && (
                <div className="p-3 rounded-lg bg-[color-mix(in_srgb,var(--danger-bg)_25%,transparent)] border border-red-500/50">
                    <p className="text-xs font-bold text-[var(--danger-color)]">
                        This permanently deletes {member.name || 'this member'}'s account and all their data — no record is kept, and this can't be undone.
                    </p>
                </div>
            )}
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={loading || (mode === 'kick' ? !reason.trim() : mode === 'leave' ? !leftAt : false)}
                    onClick={submit}
                    className="flex items-center gap-1 bg-[var(--danger-color)] text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50"
                >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm
                </button>
                <button type="button" onClick={onDone} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase text-[var(--text-secondary)]">Cancel</button>
            </div>
        </div>
    );
};

export default RemoveMemberFlow;
