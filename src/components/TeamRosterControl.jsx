import { useState } from 'react';
import { Loader2, Globe } from 'lucide-react';
import { adminAuthHeaders } from '../utils/adminAuth';

// Controls the one-way-feeling (but reversible) switch between the old
// hardcoded Team page roster and the real, panel-managed one. Starts the
// Team page off on the static fallback regardless of how many real members
// exist — a system owner has to explicitly press "Go Live" once the roster
// is actually ready, not whenever the first person happens to onboard.
const TeamRosterControl = ({ status, onRefresh, canToggle = true }) => {
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!status) return null;

    const setLive = async (live) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/panel-users?action=set-roster-live', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ live }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            setConfirming(false);
            onRefresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const canGoLive = status.live || status.readyCount > 0;

    return (
        <div className={`border-2 rounded-2xl p-5 mb-6 ${status.live ? 'border-green-500' : 'border-brand-yellow'}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="font-black text-sm uppercase flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Public Team Page:{' '}
                        {status.live ? <span className="text-green-500">Live (real roster)</span> : <span className="text-brand-yellow">Static fallback (old hardcoded roster)</span>}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {status.readyCount} core member{status.readyCount === 1 ? '' : 's'} with a completed profile ready to show live.
                        {status.pendingCount > 0 && (
                            <span className="text-[var(--text-muted)]"> {status.pendingCount} more still need to set a password, finish onboarding or complete their profile.</span>
                        )}
                    </p>
                </div>

                {!canToggle ? (
                    <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Changing this needs Settings access</p>
                ) : !confirming ? (
                    <button
                        type="button"
                        disabled={!canGoLive}
                        onClick={() => setConfirming(true)}
                        title={!canGoLive ? 'No core members have a completed profile yet' : undefined}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase disabled:opacity-40 ${status.live ? 'bg-zinc-700 text-white' : 'bg-brand-yellow text-[var(--text-on-brand)]'}`}
                    >
                        {status.live ? 'Revert to Static Roster' : 'Go Live With Real Team Data'}
                    </button>
                ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[var(--text-secondary)]">
                            {status.live
                                ? 'Bring back the old hardcoded roster?'
                                : `Flush the hardcoded roster and show ${status.readyCount} real member(s) instead?`}
                        </span>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setLive(!status.live)}
                            className="flex items-center gap-1 bg-[var(--danger-color)] text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirm
                        </button>
                        <button type="button" onClick={() => setConfirming(false)} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase text-[var(--text-secondary)]">
                            Cancel
                        </button>
                    </div>
                )}
            </div>
            {error && <p className="text-xs font-bold text-[var(--danger-color)] mt-3">{error}</p>}
        </div>
    );
};

export default TeamRosterControl;
