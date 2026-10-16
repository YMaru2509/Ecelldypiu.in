// Cards that must read on both a dark/light page and a brand band: the
// "inverse" card flips the page colours so it keeps contrast in either theme.
export const cardClass = 'bg-black border-2 border-zinc-800 p-5 md:p-8 rounded-3xl md:rounded-[2rem] hover:border-brand-yellow transition-all group';
export const inverseCardClass = 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-4 border-[var(--bg-primary)] p-5 md:p-8 rounded-3xl md:rounded-[2rem] shadow-[5px_5px_0px_var(--bg-primary)] md:shadow-[8px_8px_0px_var(--bg-primary)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col h-full';

export const asItem = (item, field) => (typeof item === 'string' ? { [field]: item } : (item || {}));
