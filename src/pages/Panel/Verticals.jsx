import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import PanelShell from './PanelShell';
import { adminAuthHeaders } from '../../utils/adminAuth';

const Verticals = () => {
    const [verticals, setVerticals] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [draft, setDraft] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [vRes, mRes] = await Promise.all([
                fetch('/api/attendance?action=verticals', { headers: adminAuthHeaders() }),
                fetch('/api/panel-users?action=member-directory', { headers: adminAuthHeaders() }),
            ]);
            const vData = await vRes.json();
            const mData = await mRes.json();
            if (!vRes.ok) throw new Error(vData.error || 'Failed to load verticals');
            setVerticals(vData.verticals || []);
            if (mRes.ok) setMembers(mData.members || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const createVertical = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        setError('');
        try {
            const res = await fetch('/api/attendance?action=verticals-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ name: newName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create vertical');
            setNewName('');
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const saveVertical = async (vertical) => {
        const current = draft[vertical.id] || {};
        setSavingId(vertical.id);
        setError('');
        try {
            const res = await fetch('/api/attendance?action=verticals-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({
                    id: vertical.id,
                    name: current.name ?? vertical.name,
                    headUid: (current.headUid ?? vertical.headUid) || null,
                    active: current.active ?? vertical.active !== false,
                    memberUids: current.memberUids ?? vertical.memberUids ?? [],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update vertical');
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingId(null);
        }
    };

    const deleteVertical = async (vertical) => {
        if (!window.confirm(`Delete the ${vertical.name} vertical? Its member assignments will be removed.`)) return;
        setSavingId(vertical.id);
        try {
            const res = await fetch('/api/attendance?action=verticals-delete', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ id: vertical.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete vertical');
            await load();
        } catch (err) { setError(err.message); } finally { setSavingId(null); }
    };

    return (
        <PanelShell>
            <h1 className="text-2xl md:text-3xl font-black uppercase mb-6">E-Cell Verticals</h1>

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] border-2 border-red-500 text-[var(--danger-color)] font-bold text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={createVertical} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New vertical name (e.g. Technical and Development)"
                    className="flex-1 bg-black border-2 border-zinc-700 p-3 text-white rounded-xl text-sm"
                />
                <button type="submit" disabled={creating} className="flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] px-4 rounded-xl font-black uppercase text-xs disabled:opacity-50">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                </button>
            </form>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                </div>
            ) : (
                <div className="space-y-3">
                    {verticals.map((v) => {
                        const current = draft[v.id] || {};
                        const memberUids = current.memberUids ?? v.memberUids ?? members.filter((m) => (m.verticals || []).includes(v.id)).map((m) => m.uid);
                        return <div key={v.id} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <input value={current.name ?? v.name} onChange={(e) => setDraft((p) => ({ ...p, [v.id]: { ...p[v.id], name: e.target.value } }))} className="w-full max-w-md bg-black border-2 border-zinc-700 p-2 text-white rounded-lg font-bold" />
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">Current head: {v.headNameSnapshot || 'Unassigned'} · {memberUids.length} assigned member{memberUids.length === 1 ? '' : 's'}</p>
                                </div>
                                <button type="button" onClick={() => deleteVertical(v)} disabled={savingId === v.id} className="text-[var(--danger-color)] p-2 rounded-lg hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={current.headUid ?? v.headUid ?? ''}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, [v.id]: { ...prev[v.id], headUid: e.target.value } }))}
                                    className="bg-black border-2 border-zinc-700 rounded-lg px-2 py-1.5 text-xs"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((m) => (
                                        <option key={m.uid} value={m.uid}>{m.name || m.email}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => saveVertical(v)}
                                    disabled={savingId === v.id}
                                    className="flex items-center gap-1 bg-brand-yellow text-[var(--text-on-brand)] px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50"
                                >
                                    {savingId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2">Assigned members</p>
                                <div data-scroll-container className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto overscroll-contain pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                                    {members.map((m) => <label key={m.uid} className="flex items-center gap-2 text-xs p-2 rounded-lg border border-[var(--border-color)]"><input type="checkbox" checked={memberUids.includes(m.uid)} onChange={(e) => setDraft((p) => ({ ...p, [v.id]: { ...p[v.id], memberUids: e.target.checked ? [...new Set([...memberUids, m.uid])] : memberUids.filter((uid) => uid !== m.uid) } }))} className="accent-brand-yellow" />{m.name || m.email}</label>)}
                                </div>
                            </div>
                        </div>;
                    })}
                </div>
            )}

            <p className="mt-6 text-xs text-[var(--text-secondary)]">
                To add a member to a vertical so they can submit requests for it, use Users & Roles — vertical membership is assigned there alongside roles and permissions.
            </p>
        </PanelShell>
    );
};

export default Verticals;
