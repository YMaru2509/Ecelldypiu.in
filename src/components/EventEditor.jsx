import { useEffect, useState } from 'react';
import { X, Trash2, ChevronDown, ChevronUp, Sparkles, Wand2, Settings2, Loader2, AlertCircle } from 'lucide-react';
import { generateEventContent, AI_MODELS, VIBES } from '../utils/aiService';
import { DEFAULT_EVENT_FORM } from '../utils/eventTemplates';
import { SECTION_CATALOG, HERO_STYLES, EVENT_TYPES, getSection, defaultActiveSections, sectionHasData } from '../utils/eventSections';

const TEAM_EVENT_KEYWORDS = ['hackathon', 'competition', 'contest', 'challenge', 'pitch', 'ideathon'];

const inferTeamBasedEvent = (event = {}) => {
  if (typeof event.teamBased === 'boolean') return event.teamBased;
  const searchable = [event.category, event.title, event.name, event.slug]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return TEAM_EVENT_KEYWORDS.some(keyword => searchable.includes(keyword));
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeEventForm = (event = {}) => ({
  ...DEFAULT_EVENT_FORM,
  ...event,
  title: event.title || '',
  slug: event.slug || '',
  subtitle: event.subtitle || '',
  heroTag: event.heroTag || '',
  heroStyle: HERO_STYLES.some(s => s.id === event.heroStyle) ? event.heroStyle : 'poster',
  eventType: event.eventType || '',
  date: event.date || '',
  time: event.time || '',
  location: event.location || '',
  description: event.description || '',
  thumbnail: event.thumbnail || '',
  image: event.image || '',
  participants: event.participants || '',
  category: event.category || 'Workshop',
  highlights: asArray(event.highlights),
  process: asArray(event.process),
  zones: asArray(event.zones),
  schedule: event.schedule && typeof event.schedule === 'object' ? event.schedule : {},
  workshops: asArray(event.workshops),
  challenges: asArray(event.challenges),
  people: asArray(event.people),
  outcomes: asArray(event.outcomes),
  awards: asArray(event.awards),
  winners: asArray(event.winners),
  callout: { tag: '', title: '', body: '', ...(event.callout || {}) },
  gallery: asArray(event.gallery),
  sectionTitles: event.sectionTitles && typeof event.sectionTitles === 'object' ? event.sectionTitles : {},
  featured: !!event.featured,
  teamBased: inferTeamBasedEvent(event),
  internalOnly: event.internalOnly === true,
  upcoming: event.upcoming === true,
  requiresShortlisting: event.requiresShortlisting === true,
  activeSections: {
    ...defaultActiveSections(),
    ...(event.activeSections || {})
  }
});

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// After the AI drafts content, switch on exactly the sections it produced
// data for (and off the content sections it left empty); registration is a
// page-level choice the AI doesn't decide, so it keeps its current state.
const getSectionStateFromContent = (content, fallback) => {
  const next = { ...fallback };
  SECTION_CATALOG.forEach(({ key }) => {
    if (key === 'register') return;
    if (key in content) next[key] = sectionHasData(content, key);
  });
  return next;
};

const EditorSection = ({ title, section, expanded, onToggle, children }) => (
  <div className="border border-zinc-700 rounded-lg overflow-hidden mb-4">
    <button
      type="button"
      onClick={() => onToggle(section)}
      className="w-full flex items-center justify-between bg-zinc-800 p-4 hover:bg-zinc-700 transition-colors"
    >
      <h3 className="font-bold text-lg">{title}</h3>
      {expanded[section] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
    </button>
    {expanded[section] && <div className="p-4 bg-zinc-900 border-t border-zinc-700">{children}</div>}
  </div>
);

const EventEditor = ({ event, onSave, onClose, loading, openMediaBrowser, initialAIOpen = false }) => {
  const [form, setForm] = useState(() => normalizeEventForm(event));
  const [expanded, setExpanded] = useState({
    basic: true,
    ...Object.fromEntries(SECTION_CATALOG.map(({ key }) => [key, false]))
  });

  // Section Manager State
  const [activeSections, setActiveSections] = useState(normalizeEventForm(event).activeSections);

  // AI Assistant State
  const [showAIHub, setShowAIHub] = useState(false);
  const [aiTheme, setAiTheme] = useState('');
  const [aiVibe, setAiVibe] = useState(VIBES[0]);
  const [aiModel, setAiModel] = useState(AI_MODELS.THINKING);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Merges AI-drafted content into the form: text fields only overwrite when
  // the AI actually produced a value, list sections only when it produced
  // items (so a theme draft never wipes hand-entered winners/people), and the
  // admin's own images are always kept.
  const applyAIContent = (content, fallbackTitle = '') => {
    const pick = (value, prev) => (value ? value : prev);
    const pickList = (value, prev) => (Array.isArray(value) && value.length > 0 ? value : prev);
    setForm(prev => ({
      ...prev,
      title: pick(content.title, prev.title || fallbackTitle),
      slug: content.slug || prev.slug || slugify(content.title || prev.title || fallbackTitle),
      subtitle: pick(content.subtitle, prev.subtitle),
      heroTag: pick(content.heroTag, prev.heroTag),
      heroStyle: HERO_STYLES.some(s => s.id === content.heroStyle) ? content.heroStyle : prev.heroStyle,
      eventType: pick(content.eventType, prev.eventType),
      date: pick(content.date, prev.date),
      time: pick(content.time, prev.time),
      location: pick(content.location, prev.location),
      participants: pick(content.participants, prev.participants),
      category: pick(content.category, prev.category),
      teamBased: typeof content.teamBased === 'boolean' ? content.teamBased : inferTeamBasedEvent(content),
      description: pick(content.description, prev.description),
      thumbnail: prev.thumbnail,
      image: prev.image,
      highlights: pickList(content.highlights, prev.highlights),
      process: pickList(content.process, prev.process),
      zones: pickList(content.zones, prev.zones),
      schedule: sectionHasData(content, 'schedule') ? { ...prev.schedule, ...content.schedule } : prev.schedule,
      workshops: pickList(content.workshops, prev.workshops),
      challenges: pickList(content.challenges, prev.challenges),
      people: pickList(content.people, prev.people),
      outcomes: pickList(content.outcomes, prev.outcomes),
      awards: pickList(content.awards, prev.awards),
      winners: pickList(content.winners, prev.winners),
      callout: sectionHasData(content, 'callout') ? { ...prev.callout, ...content.callout } : prev.callout
    }));
    setActiveSections(prev => getSectionStateFromContent(
      Object.fromEntries(Object.entries(content).filter(([, v]) => !(Array.isArray(v) && v.length === 0))),
      prev
    ));
  };

  useEffect(() => {
    const normalized = normalizeEventForm(event);
    setForm(normalized);
    setActiveSections(normalized.activeSections);
  }, [event]);

  useEffect(() => {
    if (initialAIOpen) {
      setShowAIHub(true);
      setAiError(null);
    }
  }, [initialAIOpen]);

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addHighlight = () => {
    setForm(prev => ({
      ...prev,
      highlights: [...prev.highlights, { title: '', description: '', icon: 'Star' }]
    }));
  };

  const removeHighlight = (idx) => {
    setForm(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== idx)
    }));
  };

  const updateHighlight = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => i === idx ? { ...h, [field]: value } : h)
    }));
  };

  const addZone = () => {
    setForm(prev => ({
      ...prev,
      zones: [...prev.zones, { zone: '', name: '', duration: '', focus: '', description: '' }]
    }));
  };

  const removeZone = (idx) => {
    setForm(prev => ({
      ...prev,
      zones: prev.zones.filter((_, i) => i !== idx)
    }));
  };

  const updateZone = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      zones: prev.zones.map((z, i) => i === idx ? { ...z, [field]: value } : z)
    }));
  };

  const addScheduleItem = (day) => {
    setForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: [...(prev.schedule[day] || []), { time: '', event: '' }]
      }
    }));
  };

  const removeScheduleItem = (day, idx) => {
    setForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: prev.schedule[day].filter((_, i) => i !== idx)
      }
    }));
  };

  const updateScheduleItem = (day, idx, field, value) => {
    setForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: prev.schedule[day].map((item, i) => i === idx ? { ...item, [field]: value } : item)
      }
    }));
  };

  const addWorkshop = () => {
    setForm(prev => ({
      ...prev,
      workshops: [...prev.workshops, '']
    }));
  };

  const removeWorkshop = (idx) => {
    setForm(prev => ({
      ...prev,
      workshops: prev.workshops.filter((_, i) => i !== idx)
    }));
  };

  const updateWorkshop = (idx, value) => {
    setForm(prev => ({
      ...prev,
      workshops: prev.workshops.map((w, i) => i === idx ? value : w)
    }));
  };

  const addAward = () => {
    setForm(prev => ({
      ...prev,
      awards: [...prev.awards, { title: '', icon: 'Award' }]
    }));
  };

  const removeAward = (idx) => {
    setForm(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== idx)
    }));
  };

  const updateAward = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      awards: prev.awards.map((a, i) => i === idx ? { ...a, [field]: value } : a)
    }));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-900 flex flex-col overflow-hidden" style={{ touchAction: 'auto' }}>
      <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, activeSections }); }} className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-8 border-b border-zinc-700 flex-shrink-0 bg-black">
          <div className="flex items-center gap-6">
            <h3 className="text-4xl font-black">📝 Event Editor</h3>
            <button
              type="button"
              onClick={() => setShowAIHub(true)}
              className="flex items-center gap-3 bg-brand-yellow text-[var(--text-on-brand)] px-6 py-2 rounded-full font-black uppercase hover:bg-white transition-all transform hover:scale-105 shadow-[4px_4px_0px_white]"
            >
              <Sparkles className="w-5 h-5" />
              Magic AI Assistant
            </button>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-8 space-y-4 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }} data-lenis-prevent>

          {/* Section Manager */}
          <div className="bg-zinc-800 border-2 border-zinc-700 p-6 rounded-2xl mb-8">
            <h3 className="text-sm font-black uppercase text-gray-500 mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Display Sections
            </h3>
            <div className="flex flex-wrap gap-3">
              {SECTION_CATALOG.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSections(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`px-4 py-2 rounded-lg font-bold border-2 transition-all uppercase text-xs ${activeSections[key] ? 'bg-brand-yellow/20 border-brand-yellow text-brand-yellow' : 'bg-black border-zinc-800 text-gray-600'}`}
                >
                  {label} {activeSections[key] ? '✓' : '✗'}
                </button>
              ))}
            </div>
            {SECTION_CATALOG.some(({ key, heading }) => heading && activeSections[key]) && (
              <div className="mt-6 border-t border-zinc-700 pt-5">
                <h4 className="text-xs font-black uppercase text-gray-500 mb-1">Heading text</h4>
                <p className="text-[11px] text-gray-500 mb-3">Wrap the highlighted word in *stars*, e.g. HOW IT *UNFOLDED*.</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {SECTION_CATALOG.filter(({ key, heading }) => heading && activeSections[key]).map(({ key, label, heading }) => (
                    <label key={key} className="block">
                      <span className="block text-[10px] font-bold uppercase text-gray-500 mb-1">{label}</span>
                      <input
                        value={form.sectionTitles[key] ?? heading}
                        onChange={(e) => setForm(prev => ({ ...prev, sectionTitles: { ...prev.sectionTitles, [key]: e.target.value } }))}
                        className="w-full bg-zinc-700 p-2 rounded text-white text-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Basic Info */}
          <EditorSection title="📋 Basic Info" section="basic" expanded={expanded} onToggle={toggleSection}>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Event Title" className="bg-zinc-800 p-3 rounded text-white" required />
              <input value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="Slug (e.g., finbiz)" className="bg-zinc-800 p-3 rounded text-white" required />
              <input value={form.date} onChange={(e) => updateField('date', e.target.value)} placeholder="Date (e.g., 8th & 9th November 2025)" className="bg-zinc-800 p-3 rounded text-white" />
              <input value={form.time} onChange={(e) => updateField('time', e.target.value)} placeholder="Duration (e.g., 24+ Hour Marathon)" className="bg-zinc-800 p-3 rounded text-white" />
              <input value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="Location" className="bg-zinc-800 p-3 rounded text-white" />
              <input value={form.participants} onChange={(e) => updateField('participants', e.target.value)} placeholder="Participants (e.g., 500+)" className="bg-zinc-800 p-3 rounded text-white" />
              <input value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Category" className="bg-zinc-800 p-3 rounded text-white" />
              <input value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} placeholder="Tagline shown under the title" className="bg-zinc-800 p-3 rounded text-white" />
              <input value={form.heroTag} onChange={(e) => updateField('heroTag', e.target.value)} placeholder="Badge text (e.g. FLAGSHIP CHALLENGE)" className="bg-zinc-800 p-3 rounded text-white" />
              <select value={form.eventType} onChange={(e) => updateField('eventType', e.target.value)} className="bg-zinc-800 p-3 rounded text-white">
                <option value="">Event type…</option>
                {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <select value={form.heroStyle} onChange={(e) => updateField('heroStyle', e.target.value)} className="bg-zinc-800 p-3 rounded text-white">
                {HERO_STYLES.map(style => <option key={style.id} value={style.id}>Page style: {style.label} ({style.modelledOn})</option>)}
              </select>
              <div className="flex gap-2">
                <input value={form.thumbnail} onChange={(e) => updateField('thumbnail', e.target.value)} placeholder="Thumbnail path" className="flex-1 bg-zinc-800 p-3 rounded text-white" />
                <button type="button" onClick={openMediaBrowser} className="px-3 py-2 bg-zinc-700 rounded text-xs">Browse</button>
              </div>
              <div className="flex gap-2">
                <input value={form.image} onChange={(e) => updateField('image', e.target.value)} placeholder="Main image path" className="flex-1 bg-zinc-800 p-3 rounded text-white" />
                <button type="button" onClick={openMediaBrowser} className="px-3 py-2 bg-zinc-700 rounded text-xs">Browse</button>
              </div>
              <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded text-white">
                <input type="checkbox" checked={form.featured || false} onChange={(e) => updateField('featured', e.target.checked)} className="w-5 h-5 accent-brand-yellow" id="featured-checkbox" />
                <label htmlFor="featured-checkbox" className="font-bold cursor-pointer">Featured Event</label>
              </div>
              <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded text-white">
                <input type="checkbox" checked={form.teamBased || false} onChange={(e) => updateField('teamBased', e.target.checked)} className="w-5 h-5 accent-brand-yellow" id="team-based-checkbox" />
                <label htmlFor="team-based-checkbox" className="font-bold cursor-pointer">Team-based Event</label>
              </div>
              <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded text-white border border-brand-yellow/30">
                <input type="checkbox" checked={form.upcoming || false} onChange={(e) => updateField('upcoming', e.target.checked)} className="w-5 h-5 accent-brand-yellow" id="upcoming-checkbox" />
                <label htmlFor="upcoming-checkbox" className="font-bold cursor-pointer">Upcoming — show under "What's Next"</label>
              </div>
              <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded text-white border border-brand-yellow/30">
                <input type="checkbox" checked={form.requiresShortlisting || false} onChange={(e) => updateField('requiresShortlisting', e.target.checked)} className="w-5 h-5 accent-brand-yellow" id="shortlisting-checkbox" />
                <label htmlFor="shortlisting-checkbox" className="font-bold cursor-pointer">Applications need shortlisting — passes go only to shortlisted people</label>
              </div>
              <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded text-white border border-brand-yellow/30">
                <input type="checkbox" checked={form.internalOnly || false} onChange={(e) => updateField('internalOnly', e.target.checked)} className="w-5 h-5 accent-brand-yellow" id="internal-only-checkbox" />
                <label htmlFor="internal-only-checkbox" className="font-bold cursor-pointer">Internal / Private Event</label>
              </div>
            </div>
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Description" rows={4} className="w-full bg-zinc-800 p-3 rounded text-white mt-4" />
          </EditorSection>

          {/* Highlights */}
          <EditorSection title="✨ Highlights" section="highlights" expanded={expanded} onToggle={toggleSection}>
            <button type="button" onClick={addHighlight} className="px-4 py-2 bg-brand-yellow text-[var(--text-on-brand)] rounded font-bold mb-4">+ Add Highlight</button>
            <div className="space-y-4">
              {form.highlights.map((h, idx) => (
                <div key={idx} className="bg-zinc-800 p-4 rounded border border-zinc-700 relative">
                  <button type="button" onClick={() => removeHighlight(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <input value={h.title} onChange={(e) => updateHighlight(idx, 'title', e.target.value)} placeholder="Highlight Title" className="w-full bg-zinc-700 p-2 rounded text-white mb-2" />
                  <textarea value={h.description} onChange={(e) => updateHighlight(idx, 'description', e.target.value)} placeholder="Description" rows={2} className="w-full bg-zinc-700 p-2 rounded text-white mb-2" />
                  <input value={h.icon} onChange={(e) => updateHighlight(idx, 'icon', e.target.value)} placeholder="Icon name (e.g., TrendingUp, Users, Lightbulb)" className="w-full bg-zinc-700 p-2 rounded text-white text-sm" />
                </div>
              ))}
            </div>
          </EditorSection>

          {/* Zones */}
          <EditorSection title="🎯 Zones" section="zones" expanded={expanded} onToggle={toggleSection}>
            <button type="button" onClick={addZone} className="px-4 py-2 bg-brand-yellow text-[var(--text-on-brand)] rounded font-bold mb-4">+ Add Zone</button>
            <div className="space-y-4">
              {form.zones.map((z, idx) => (
                <div key={idx} className="bg-zinc-800 p-4 rounded border border-zinc-700 relative">
                  <button type="button" onClick={() => removeZone(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="grid md:grid-cols-2 gap-2 mb-2">
                    <input value={z.zone} onChange={(e) => updateZone(idx, 'zone', e.target.value)} placeholder="Zone (e.g., Zone A)" className="bg-zinc-700 p-2 rounded text-white" />
                    <input value={z.name} onChange={(e) => updateZone(idx, 'name', e.target.value)} placeholder="Zone Name" className="bg-zinc-700 p-2 rounded text-white" />
                  </div>
                  <input value={z.duration} onChange={(e) => updateZone(idx, 'duration', e.target.value)} placeholder="Duration" className="w-full bg-zinc-700 p-2 rounded text-white mb-2" />
                  <input value={z.focus} onChange={(e) => updateZone(idx, 'focus', e.target.value)} placeholder="Focus Areas" className="w-full bg-zinc-700 p-2 rounded text-white mb-2" />
                  <textarea value={z.description} onChange={(e) => updateZone(idx, 'description', e.target.value)} placeholder="Zone Description" rows={2} className="w-full bg-zinc-700 p-2 rounded text-white" />
                </div>
              ))}
            </div>
          </EditorSection>

          {/* Schedule */}
          <EditorSection title="📅 Schedule" section="schedule" expanded={expanded} onToggle={toggleSection}>
            <div className="space-y-6">
              {['day1Night', 'day2'].map(day => (
                <div key={day}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-lg">{day === 'day1Night' ? 'Day 1 Night' : 'Day 2'}</h4>
                    <button type="button" onClick={() => addScheduleItem(day)} className="px-3 py-1 bg-brand-yellow text-[var(--text-on-brand)] rounded text-sm font-bold">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {(form.schedule[day] || []).map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input value={item.time} onChange={(e) => updateScheduleItem(day, idx, 'time', e.target.value)} placeholder="Time" className="w-24 bg-zinc-700 p-2 rounded text-white text-sm" />
                        <textarea value={item.event} onChange={(e) => updateScheduleItem(day, idx, 'event', e.target.value)} placeholder="Event" rows={1} className="flex-1 bg-zinc-700 p-2 rounded text-white text-sm" />
                        <button type="button" onClick={() => removeScheduleItem(day, idx)} className="text-red-400 hover:text-red-300 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </EditorSection>

          {/* Workshops */}
          <EditorSection title="🎓 Workshops" section="workshops" expanded={expanded} onToggle={toggleSection}>
            <button type="button" onClick={addWorkshop} className="px-4 py-2 bg-brand-yellow text-[var(--text-on-brand)] rounded font-bold mb-4">+ Add Workshop</button>
            <div className="space-y-2">
              {form.workshops.map((w, idx) => (
                <div key={idx} className="flex gap-2">
                  <textarea value={w} onChange={(e) => updateWorkshop(idx, e.target.value)} placeholder="Workshop description" rows={2} className="flex-1 bg-zinc-700 p-2 rounded text-white text-sm" />
                  <button type="button" onClick={() => removeWorkshop(idx)} className="text-red-400 hover:text-red-300 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </EditorSection>

          {/* Awards */}
          <EditorSection title="🏆 Awards" section="awards" expanded={expanded} onToggle={toggleSection}>
            <button type="button" onClick={addAward} className="px-4 py-2 bg-brand-yellow text-[var(--text-on-brand)] rounded font-bold mb-4">+ Add Award</button>
            <div className="space-y-3">
              {form.awards.map((a, idx) => (
                <div key={idx} className="flex gap-2 relative bg-zinc-800 p-3 rounded border border-zinc-700">
                  <button type="button" onClick={() => removeAward(idx)} className="absolute top-2 right-2 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <input value={a.title} onChange={(e) => updateAward(idx, 'title', e.target.value)} placeholder="Award Title" className="flex-1 bg-zinc-700 p-2 rounded text-white" />
                  <input value={a.icon} onChange={(e) => updateAward(idx, 'icon', e.target.value)} placeholder="Icon" className="w-32 bg-zinc-700 p-2 rounded text-white text-sm" />
                </div>
              ))}
            </div>
          </EditorSection>

          {/* Catalog-driven sections: steps, problem statements, people, outcomes, winners, gallery */}
          {SECTION_CATALOG.filter(({ kind, fields }) => kind === 'list' && fields).map(section => (
            <EditorSection key={section.key} title={`${section.label} (${(form[section.key] || []).length})`} section={section.key} expanded={expanded} onToggle={toggleSection}>
              <p className="text-xs text-gray-500 mb-4">{section.description} Modelled on: {section.usedBy}.</p>
              <button
                type="button"
                onClick={() => updateField(section.key, [...form[section.key], { ...section.blank }])}
                className="px-4 py-2 bg-brand-yellow text-[var(--text-on-brand)] rounded font-bold mb-4"
              >
                + Add
              </button>
              <div className="space-y-3">
                {form[section.key].map((item, idx) => (
                  <div key={idx} className="bg-zinc-800 p-4 rounded border border-zinc-700 relative">
                    <button
                      type="button"
                      onClick={() => updateField(section.key, form[section.key].filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="grid md:grid-cols-2 gap-2 pr-8">
                      {section.fields.map(field => {
                        const common = {
                          value: item[field.key] || '',
                          onChange: (e) => updateField(section.key, form[section.key].map((it, i) => i === idx ? { ...it, [field.key]: e.target.value } : it)),
                          placeholder: field.label,
                          className: `bg-zinc-700 p-2 rounded text-white text-sm ${field.type === 'textarea' ? 'md:col-span-2' : ''}`
                        };
                        return field.type === 'textarea'
                          ? <textarea key={field.key} rows={2} {...common} />
                          : <input key={field.key} {...common} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </EditorSection>
          ))}

          {/* What's Next banner */}
          <EditorSection title="📣 What's Next Banner" section="callout" expanded={expanded} onToggle={toggleSection}>
            <p className="text-xs text-gray-500 mb-4">{getSection('callout').description} Modelled on: {getSection('callout').usedBy}.</p>
            <div className="space-y-2">
              {getSection('callout').fields.map(field => {
                const common = {
                  value: form.callout[field.key] || '',
                  onChange: (e) => setForm(prev => ({ ...prev, callout: { ...prev.callout, [field.key]: e.target.value } })),
                  placeholder: field.label,
                  className: 'w-full bg-zinc-700 p-2 rounded text-white text-sm'
                };
                return field.type === 'textarea'
                  ? <textarea key={field.key} rows={3} {...common} />
                  : <input key={field.key} {...common} />;
              })}
            </div>
          </EditorSection>
        </div>

        <div className="flex gap-4 p-8 border-t border-zinc-700 flex-shrink-0 bg-black">
          <button type="submit" disabled={loading} className="px-8 py-4 bg-brand-yellow text-[var(--text-on-brand)] font-black text-lg rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? '⏳ Saving...' : '✓ Save Event'}
          </button>
          <button type="button" onClick={onClose} className="px-8 py-4 bg-zinc-800 text-white font-bold text-lg rounded-lg hover:bg-zinc-700 transition-colors">Cancel</button>
        </div>
      </form>

      {/* AI Assistant Hub Modal */}
      {showAIHub && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-4 border-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-[20px_20px_0px_#FFB22C]">
            <div className="p-8 border-b-4 border-white flex justify-between items-center bg-brand-yellow">
              <h3 className="text-3xl font-black text-black flex items-center gap-3 uppercase">
                <Wand2 className="w-8 h-8" />
                AI Content Engine
              </h3>
              <button onClick={() => setShowAIHub(false)} className="text-black hover:scale-110 transition-transform">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-black uppercase text-gray-500 mb-2">Event Goal / Theme</label>
                <textarea
                  value={aiTheme}
                  onChange={(e) => setAiTheme(e.target.value)}
                  placeholder="e.g., A 2-day national hackathon for startup founders focusing on FinTech..."
                  className="w-full bg-black border-2 border-zinc-700 p-4 rounded-xl text-white focus:border-brand-yellow outline-none h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black uppercase text-gray-500 mb-2">Visual Vibe</label>
                  <select
                    value={aiVibe}
                    onChange={(e) => setAiVibe(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-700 p-3 rounded-xl text-white focus:border-brand-yellow outline-none"
                  >
                    {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black uppercase text-gray-500 mb-2">Intelligence Level</label>
                  <div className="flex bg-black border-2 border-zinc-700 rounded-xl overflow-hidden p-1">
                    <button
                      type="button"
                      onClick={() => setAiModel(AI_MODELS.FLASH)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${aiModel === AI_MODELS.FLASH ? 'bg-brand-yellow text-[var(--text-on-brand)]' : 'text-gray-500 hover:text-white'}`}
                    >
                      FAST
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiModel(AI_MODELS.THINKING)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${aiModel === AI_MODELS.THINKING ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                      THINKING
                    </button>
                  </div>
                </div>
              </div>

              {aiError && (
                <div className="bg-red-900/40 border-2 border-red-500 p-4 rounded-xl flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-bold">{aiError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  if (!aiTheme.trim()) return setAiError('Please enter a theme first!');
                  setAiLoading(true);
                  setAiError(null);
                  try {
                    const content = await generateEventContent(aiTheme, aiVibe, aiModel);
                    applyAIContent(content, aiTheme.trim());
                    setShowAIHub(false);
                  } catch (err) {
                    setAiError(err.message);
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading}
                className="w-full bg-black border-4 border-brand-yellow text-brand-yellow py-5 rounded-2xl font-black text-xl uppercase flex items-center justify-center gap-3 hover:bg-brand-yellow hover:text-[var(--text-on-brand)] transition-all group"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    AI is thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                    Generate Event Content
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-gray-600 font-bold uppercase">
                Note: This will overwrite current text fields but keep your images.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventEditor;
