import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Save } from 'lucide-react';
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
    const [draft, setDraft] = useState({}); // verticalId -> headUid

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [vRes, mRes] = await Promise.all([
                fetch('/api/attendance-admin', { headers: adminAuthHeaders() }),
                fetch('/api/panel-users', { headers: adminAuthHeaders() }),
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
            const res = await fetch('/api/attendance-admin', {
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

    const saveHead = async (vertical) => {
        const headUid = draft[vertical.id] ?? vertical.headUid ?? '';
        setSavingId(vertical.id);
        setError('');
        try {
            const res = await fetch('/api/attendance-admin', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
                body: JSON.stringify({ id: vertical.id, headUid: headUid || null }),
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
                    {verticals.map((v) => (
                        <div key={v.id} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <p className="font-bold">{v.name}</p>
                                <p className="text-xs text-[var(--text-secondary)]">Current head: {v.headNameSnapshot || 'Unassigned'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={draft[v.id] ?? v.headUid ?? ''}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, [v.id]: e.target.value }))}
                                    className="bg-black border-2 border-zinc-700 rounded-lg px-2 py-1.5 text-xs"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((m) => (
                                        <option key={m.uid} value={m.uid}>{m.name || m.email}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => saveHead(v)}
                                    disabled={savingId === v.id}
                                    className="flex items-center gap-1 bg-brand-yellow text-[var(--text-on-brand)] px-3 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50"
                                >
                                    {savingId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="mt-6 text-xs text-[var(--text-secondary)]">
                To add a member to a vertical so they can submit requests for it, use Users & Roles — vertical membership is assigned there alongside roles and permissions.
            </p>
        </PanelShell>
    );
};

export default Verticals;
