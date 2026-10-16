import { useRef, useState } from 'react';
import { FileUp, FileText, Loader2, X, ArrowRight, ArrowLeft, Wand2, LayoutTemplate, CheckCircle2, AlertCircle, ScanSearch } from 'lucide-react';
import { parseApprovalDocument } from '../utils/aiService';
import { EVENT_CREATION_TEMPLATES, createBlankEventForm } from '../utils/eventTemplates';
import {
    SECTION_CATALOG, HERO_STYLES, EVENT_TYPES, TYPE_RECOMMENDATIONS,
    SECTION_KEYS, sectionHasData, sectionsWithData,
} from '../utils/eventSections';

const STEPS = ['Approval document', 'Choose headings', 'Review & publish'];

const StepDots = ({ step }) => (
    <div className="flex items-center gap-2 mt-3">
        {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${i <= step ? 'bg-brand-yellow text-[var(--text-on-brand)]' : 'bg-zinc-800 text-gray-500'}`}>
                    {i + 1}
                </span>
                <span className={`text-xs font-bold uppercase hidden sm:inline ${i === step ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                {i < STEPS.length - 1 && <span className="w-6 h-px bg-zinc-700" />}
            </div>
        ))}
    </div>
);

const EventCreationWizard = ({ onClose, onComplete, onStartAI, onSelectTemplate }) => {
    const inputRef = useRef(null);
    const [step, setStep] = useState(0);
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [selected, setSelected] = useState(() => new Set());
    const [heroStyle, setHeroStyle] = useState('poster');
    const [eventType, setEventType] = useState('Other');

    const pickFile = (e) => {
        const next = e.target.files?.[0];
        e.target.value = '';
        if (!next) return;
        setError('');
        setFile(next);
    };

    const analyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setError('');
        try {
            const { content, meta } = await parseApprovalDocument(file);
            const initial = new Set([...(meta.recommendedSections || []), ...sectionsWithData(content)]);
            setAnalysis(content);
            setEventType(meta.eventType || 'Other');
            setHeroStyle(meta.heroStyle || 'poster');
            setSelected(initial);
            setStep(1);
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const changeType = (type) => {
        setEventType(type);
        setSelected(new Set([...(TYPE_RECOMMENDATIONS[type] || []), ...sectionsWithData(analysis)]));
    };

    const toggle = (key) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
    });

    const finish = () => {
        const draft = {
            ...createBlankEventForm(),
            ...analysis,
            eventType,
            heroStyle,
            thumbnail: '',
            image: '',
            activeSections: Object.fromEntries(SECTION_KEYS.map((key) => [key, selected.has(key)])),
        };
        onComplete(draft);
    };

    return (
        <div className="fixed inset-0 z-[180] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden bg-zinc-950 border-2 border-white rounded-2xl shadow-[12px_12px_0px_#FFB22C] flex flex-col">
                <div className="p-6 border-b-2 border-zinc-800 flex items-start justify-between bg-black">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black uppercase flex items-center gap-3">
                            <FileUp className="w-7 h-7 text-brand-yellow" />
                            Create New Event
                        </h3>
                        <StepDots step={step} />
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2" aria-label="Close">
                        <X className="w-7 h-7" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto" data-lenis-prevent>
                    {step === 0 && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xl font-black uppercase">Upload the approval document</h4>
                                <p className="text-sm text-gray-400 mt-1">
                                    AI reads the letter, identifies the event, and drafts the whole event page from it. You review everything before it goes live.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="w-full border-4 border-dashed border-zinc-700 hover:border-brand-yellow rounded-2xl p-10 flex flex-col items-center gap-3 transition-colors"
                            >
                                {file ? <FileText className="w-12 h-12 text-brand-yellow" /> : <FileUp className="w-12 h-12 text-gray-500" />}
                                <span className="font-black uppercase text-lg">{file ? file.name : 'Choose a PDF or image'}</span>
                                <span className="text-xs text-gray-500">
                                    {file ? `${(file.size / 1024).toFixed(0)} KB — click to change` : 'PDF, PNG or JPG · up to 3 MB'}
                                </span>
                            </button>
                            <input ref={inputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={pickFile} className="hidden" />

                            {error && (
                                <div className="bg-red-900/40 border-2 border-red-500 p-4 rounded-xl flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-sm font-bold">{error}</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={analyze}
                                disabled={!file || analyzing}
                                className="w-full bg-brand-yellow text-[var(--text-on-brand)] py-4 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-3 disabled:opacity-40"
                            >
                                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanSearch className="w-5 h-5" />}
                                {analyzing ? 'Reading document…' : 'Analyze & Continue'}
                            </button>

                            <div className="border-t-2 border-zinc-800 pt-5">
                                <h5 className="text-xs font-black uppercase text-gray-500 mb-3">No approval document? Start another way</h5>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={onStartAI} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border-2 border-zinc-800 hover:border-brand-yellow text-sm font-bold">
                                        <Wand2 className="w-4 h-4 text-brand-yellow" /> Draft from an idea (AI)
                                    </button>
                                    {EVENT_CREATION_TEMPLATES.map((template) => (
                                        <button key={template.id} type="button" onClick={() => onSelectTemplate(template)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border-2 border-zinc-800 hover:border-brand-yellow text-sm font-bold">
                                            <LayoutTemplate className="w-4 h-4 text-brand-yellow" /> {template.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && analysis && (
                        <div className="space-y-8">
                            <div className="bg-zinc-900 border-2 border-brand-yellow rounded-2xl p-5">
                                <div className="flex items-center gap-2 text-xs font-black uppercase text-brand-yellow mb-2">
                                    <CheckCircle2 className="w-4 h-4" /> Event identified
                                </div>
                                <h4 className="text-2xl font-black uppercase">{analysis.title || 'Untitled event'}</h4>
                                <p className="text-sm text-gray-400 mt-1">
                                    {[analysis.date, analysis.location, analysis.participants].filter(Boolean).join(' · ') || 'No date or venue found — you can add them next.'}
                                </p>
                                <label className="block mt-4 max-w-xs">
                                    <span className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Event type (change to re-suggest headings)</span>
                                    <select value={eventType} onChange={(e) => changeType(e.target.value)} className="w-full bg-zinc-800 p-2.5 rounded-lg text-white text-sm font-bold">
                                        {EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </label>
                            </div>

                            <div>
                                <h4 className="text-xl font-black uppercase">Which headings should the page show?</h4>
                                <p className="text-sm text-gray-400 mt-1 mb-4">
                                    Built from every past E-Cell event page. Ticked headings that the document had nothing for stay hidden until you add content.
                                </p>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {SECTION_CATALOG.map((section) => {
                                        const on = selected.has(section.key);
                                        const found = section.key !== 'register' && sectionHasData(analysis, section.key);
                                        return (
                                            <button
                                                key={section.key}
                                                type="button"
                                                onClick={() => toggle(section.key)}
                                                className={`text-left rounded-xl border-2 p-4 transition-colors ${on ? 'border-brand-yellow bg-brand-yellow/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-black uppercase text-sm">{section.label}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{section.description}</p>
                                                        <p className="text-[10px] text-gray-600 mt-2 uppercase font-bold">Used on: {section.usedBy}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[11px] font-black ${on ? 'bg-brand-yellow border-brand-yellow text-[var(--text-on-brand)]' : 'border-zinc-600'}`}>
                                                            {on ? '✓' : ''}
                                                        </span>
                                                        {found && <span className="text-[9px] font-black uppercase text-[var(--success-color)]">In document</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xl font-black uppercase">Page style</h4>
                                <p className="text-sm text-gray-400 mt-1 mb-4">All three keep the classic E-Cell look and work in dark and light mode.</p>
                                <div className="grid md:grid-cols-3 gap-3">
                                    {HERO_STYLES.map((style) => (
                                        <button
                                            key={style.id}
                                            type="button"
                                            onClick={() => setHeroStyle(style.id)}
                                            className={`text-left rounded-xl border-2 p-4 transition-colors ${heroStyle === style.id ? 'border-brand-yellow bg-brand-yellow/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
                                        >
                                            <p className="font-black uppercase text-sm">{style.label}</p>
                                            <p className="text-xs text-gray-400 mt-1">{style.description}</p>
                                            <p className="text-[10px] text-gray-600 mt-2 uppercase font-bold">Like: {style.modelledOn}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {step === 1 && (
                    <div className="p-6 border-t-2 border-zinc-800 bg-black flex items-center justify-between gap-4">
                        <button type="button" onClick={() => setStep(0)} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 text-white font-bold">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <p className="text-xs text-gray-500 hidden md:block">Next opens the editor with everything pre-filled. Nothing is published until you save.</p>
                        <button type="button" onClick={finish} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-yellow text-[var(--text-on-brand)] font-black uppercase">
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCreationWizard;
