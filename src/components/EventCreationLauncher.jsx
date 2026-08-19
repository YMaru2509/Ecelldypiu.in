import { FilePlus2, LayoutTemplate, Sparkles, Wand2, X } from 'lucide-react';
import { EVENT_CREATION_TEMPLATES } from '../utils/eventTemplates';

const EventCreationLauncher = ({ onClose, onSelectTemplate, onStartAI }) => {
    return (
        <div className="fixed inset-0 z-[180] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-zinc-950 border-2 border-white rounded-2xl shadow-[12px_12px_0px_#FFB22C] flex flex-col">
                <div className="p-6 border-b-2 border-zinc-800 flex items-center justify-between bg-black">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black uppercase flex items-center gap-3">
                            <FilePlus2 className="w-7 h-7 text-brand-yellow" />
                            Create New Event
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Start from a custom structure or let AI draft a complete event.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        aria-label="Close creation options"
                    >
                        <X className="w-7 h-7" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6" data-lenis-prevent>
                    <button
                        type="button"
                        onClick={onStartAI}
                        className="w-full text-left bg-brand-yellow text-[var(--text-on-brand)] border-2 border-brand-yellow rounded-xl p-5 md:p-6 hover:bg-white hover:border-white transition-colors"
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-5">
                            <div className="w-14 h-14 rounded-lg bg-black text-brand-yellow flex items-center justify-center shrink-0">
                                <Wand2 className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-xl font-black uppercase">
                                    Create Completely With AI
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-bold mt-1 opacity-80">
                                    Generate title, slug, description, sections, schedule, workshops, and awards from one event idea.
                                </p>
                            </div>
                            <span className="text-xs font-black uppercase bg-black text-white px-3 py-2 rounded-lg w-fit">
                                Fastest Start
                            </span>
                        </div>
                    </button>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <LayoutTemplate className="w-5 h-5 text-brand-yellow" />
                            <h4 className="text-sm font-black uppercase text-gray-400">Custom Templates</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {EVENT_CREATION_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => onSelectTemplate(template)}
                                    className="text-left bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5 hover:border-brand-yellow hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h5 className="text-lg font-black text-white">{template.name}</h5>
                                            <p className="text-sm text-gray-400 mt-1">{template.label}</p>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-brand-yellow border border-brand-yellow/40 rounded px-2 py-1 shrink-0">
                                            Use
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventCreationLauncher;
