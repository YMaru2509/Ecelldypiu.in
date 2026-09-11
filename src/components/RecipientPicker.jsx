import { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gmail-style "To" field: shows chosen recipients as removable chips, with a live
// autocomplete dropdown searching a merged list of candidates (subscribers, applicants, ...).
// Typing a full email not present in the candidate list adds it directly as a manual chip.
export default function RecipientPicker({ recipients, onChange, candidates }) {
    const [query, setQuery] = useState('');

    const selectedEmails = useMemo(
        () => new Set(recipients.map(r => r.email.toLowerCase())),
        [recipients]
    );

    const suggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return candidates
            .filter(c => !selectedEmails.has(c.email.toLowerCase()))
            .filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
            .slice(0, 8);
    }, [query, candidates, selectedEmails]);

    const addRecipient = (candidate) => {
        if (selectedEmails.has(candidate.email.toLowerCase())) return;
        onChange([...recipients, candidate]);
        setQuery('');
    };

    const addManualEmail = (raw) => {
        const email = raw.trim().replace(/,$/, '');
        if (!email || !EMAIL_RE.test(email)) return;
        addRecipient({ name: email.split('@')[0], email, source: 'manual' });
    };

    const removeRecipient = (email) => {
        onChange(recipients.filter(r => r.email.toLowerCase() !== email.toLowerCase()));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (suggestions.length > 0) {
                addRecipient(suggestions[0]);
            } else {
                addManualEmail(query);
            }
        } else if (e.key === 'Backspace' && !query && recipients.length > 0) {
            removeRecipient(recipients[recipients.length - 1].email);
        }
    };

    const sourceLabel = { subscriber: 'Subscriber', applicant: 'Applicant', manual: 'Manual' };

    return (
        <div>
            <div className="w-full bg-black border-2 border-zinc-700 rounded-lg p-2 flex flex-wrap gap-1.5 items-center focus-within:border-brand-yellow transition-colors">
                {recipients.map(r => (
                    <span
                        key={r.email}
                        title={r.email}
                        className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-white text-xs font-medium rounded-full pl-3 pr-1.5 py-1"
                    >
                        {r.name}
                        {r.source && (
                            <span className="text-[9px] uppercase text-brand-yellow/80 font-bold">{sourceLabel[r.source] || ''}</span>
                        )}
                        <button
                            type="button"
                            onClick={() => removeRecipient(r.email)}
                            className="text-zinc-500 hover:text-red-400"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </span>
                ))}
                <div className="flex items-center flex-1 min-w-[160px]">
                    <Search className="w-4 h-4 text-gray-500 mr-1.5 flex-shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={recipients.length === 0 ? 'Search subscribers/applicants by name or email, or type an address...' : 'Add another...'}
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none py-1 min-w-0"
                    />
                </div>
            </div>

            {query.trim() && (
                <div className="mt-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                    {suggestions.length > 0 ? (
                        suggestions.map(c => (
                            <button
                                type="button"
                                key={c.email}
                                onClick={() => addRecipient(c)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-zinc-800 flex items-center justify-between gap-3"
                            >
                                <span className="truncate">
                                    <span className="font-medium">{c.name}</span>{' '}
                                    <span className="text-zinc-500">{c.email}</span>
                                </span>
                                <span className="text-[10px] uppercase text-brand-yellow/80 font-bold flex-shrink-0">
                                    {sourceLabel[c.source] || ''}
                                </span>
                            </button>
                        ))
                    ) : EMAIL_RE.test(query.trim()) ? (
                        <button
                            type="button"
                            onClick={() => addManualEmail(query)}
                            className="w-full text-left px-3 py-2 text-sm text-brand-yellow hover:bg-zinc-800"
                        >
                            Add "{query.trim()}" as a recipient
                        </button>
                    ) : (
                        <div className="px-3 py-2 text-xs text-zinc-500">No matches. Type a full email address to add it directly.</div>
                    )}
                </div>
            )}
        </div>
    );
}
