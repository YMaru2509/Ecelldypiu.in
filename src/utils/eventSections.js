// Single source of truth for the data-driven event page: which headings
// (sections) an event page can show, what data each one needs, and which of
// the old hand-built pages (Inceptio, Elevate, SIH, FinBiz, Innovate For
// Impact) it was modelled on. The creation wizard, the editor, the AI prompt
// and the public page renderer all read from this catalog so they never drift.
//
// Headings are plain strings; wrap the word that should be highlighted in
// *stars* (e.g. "HOW IT *UNFOLDED*"), mirroring the accent word the old pages
// colour in brand-yellow.

export const HERO_STYLES = [
    {
        id: 'poster',
        label: 'Poster Hero',
        description: 'Title and stat tiles on the left, tilted poster on the right.',
        modelledOn: 'Inceptio · Innovate For Impact',
    },
    {
        id: 'giant',
        label: 'Giant Title',
        description: 'Oversized title with an outlined subtitle and big stat tiles.',
        modelledOn: 'Elevate · SIH',
    },
    {
        id: 'stats',
        label: 'Stats First',
        description: 'Compact title with a strip of stat tiles — works without a poster.',
        modelledOn: 'FinBiz',
    },
];

export const EVENT_TYPES = [
    'Hackathon',
    'Pitch Competition',
    'Summit',
    'Workshop',
    'Seminar / Talk',
    'Training / FDP',
    'Networking',
    'Awareness Drive',
    'Festival',
    'Other',
];

export const SECTION_CATALOG = [
    {
        key: 'highlights',
        label: 'Highlights',
        heading: 'KEY EVENT *HIGHLIGHTS*',
        usedBy: 'Inceptio, Elevate, SIH, FinBiz',
        description: 'Cards for what makes the event special.',
        kind: 'list',
        legacy: true,
    },
    {
        key: 'process',
        label: 'How It Works',
        heading: 'HOW IT *UNFOLDED*',
        usedBy: 'Inceptio, Innovate For Impact',
        description: 'Numbered steps or rounds, in order.',
        kind: 'list',
        fields: [
            { key: 'title', label: 'Step title' },
            { key: 'description', label: 'What happens', type: 'textarea' },
            { key: 'icon', label: 'Icon name (e.g. Rocket)' },
        ],
        blank: { title: '', description: '', icon: 'Rocket' },
    },
    {
        key: 'zones',
        label: 'Zones / Tracks',
        heading: 'EVENT *ZONES*',
        usedBy: 'FinBiz',
        description: 'Named zones or tracks with duration and focus.',
        kind: 'list',
        legacy: true,
    },
    {
        key: 'schedule',
        label: 'Agenda / Schedule',
        heading: '*AGENDA*',
        usedBy: 'FinBiz',
        description: 'Day-wise timeline.',
        kind: 'schedule',
        legacy: true,
    },
    {
        key: 'workshops',
        label: 'Workshops & Sessions',
        heading: '*WORKSHOPS*',
        usedBy: 'FinBiz',
        description: 'Short list of workshops or sessions.',
        kind: 'strings',
        legacy: true,
    },
    {
        key: 'challenges',
        label: 'Problem Statements',
        heading: 'PROBLEM *STATEMENTS*',
        usedBy: 'SIH',
        description: 'Challenges participants can pick from.',
        kind: 'list',
        fields: [
            { key: 'category', label: 'Category' },
            { key: 'title', label: 'Problem title' },
            { key: 'description', label: 'Description', type: 'textarea' },
        ],
        blank: { category: '', title: '', description: '' },
    },
    {
        key: 'people',
        label: 'Guests, Judges & Speakers',
        heading: 'GUESTS & *JUDGES*',
        usedBy: 'Elevate, SIH',
        description: 'Round headshot cards with name and role.',
        kind: 'list',
        fields: [
            { key: 'name', label: 'Name' },
            { key: 'role', label: 'Role / designation' },
            { key: 'image', label: 'Photo path or URL (optional)' },
        ],
        blank: { name: '', role: '', image: '' },
    },
    {
        key: 'outcomes',
        label: 'Impact & Outcomes',
        heading: 'IMPACT & *OUTCOMES*',
        usedBy: 'Elevate',
        description: 'What the event achieved.',
        kind: 'list',
        fields: [
            { key: 'title', label: 'Outcome title' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'icon', label: 'Icon name (e.g. TrendingUp)' },
        ],
        blank: { title: '', description: '', icon: 'TrendingUp' },
    },
    {
        key: 'awards',
        label: 'Prizes & Awards',
        heading: 'PRIZES & *AWARDS*',
        usedBy: 'FinBiz',
        description: 'Award categories and prizes.',
        kind: 'list',
        legacy: true,
    },
    {
        key: 'winners',
        label: 'Winners / Hall of Fame',
        heading: 'CHAMPIONS *REVEALED*',
        usedBy: 'Inceptio, Inceptio\'26, Innovate For Impact',
        description: 'Podium for the top teams (add after the event).',
        kind: 'list',
        fields: [
            { key: 'place', label: 'Place (1st / 2nd / 3rd)' },
            { key: 'team', label: 'Team or winner' },
            { key: 'prize', label: 'Prize (optional)' },
            { key: 'members', label: 'Members / lead (optional)' },
        ],
        blank: { place: '1st', team: '', prize: '', members: '' },
    },
    {
        key: 'callout',
        label: "What's Next Banner",
        heading: '',
        usedBy: "Inceptio'26",
        description: 'A highlighted announcement banner (next phase, next round).',
        kind: 'object',
        fields: [
            { key: 'tag', label: 'Tag (e.g. PHASE 2 UNLOCKED)' },
            { key: 'title', label: 'Headline' },
            { key: 'body', label: 'Details', type: 'textarea' },
        ],
    },
    {
        key: 'gallery',
        label: 'Photo Gallery',
        heading: 'EVENT *GALLERY*',
        usedBy: "Inceptio, Inceptio'26",
        description: 'Photo grid with a full-screen viewer.',
        kind: 'list',
        fields: [
            { key: 'src', label: 'Image path or URL' },
            { key: 'caption', label: 'Caption (optional)' },
        ],
        blank: { src: '', caption: '' },
    },
    {
        key: 'register',
        label: 'Registration',
        heading: 'REGISTER *NOW*',
        usedBy: 'FinBiz',
        description: 'Sign-up form that emails each registrant a QR pass.',
        kind: 'form',
    },
];

export const SECTION_KEYS = SECTION_CATALOG.map((s) => s.key);
export const getSection = (key) => SECTION_CATALOG.find((s) => s.key === key);

// Fallback suggestions per event type, used when the AI doesn't return its own.
export const TYPE_RECOMMENDATIONS = {
    Hackathon: ['highlights', 'zones', 'schedule', 'challenges', 'people', 'awards', 'winners', 'gallery', 'register'],
    'Pitch Competition': ['process', 'highlights', 'people', 'awards', 'winners', 'gallery', 'register'],
    Summit: ['highlights', 'schedule', 'people', 'outcomes', 'gallery', 'register'],
    Workshop: ['highlights', 'schedule', 'workshops', 'people', 'outcomes', 'register'],
    'Seminar / Talk': ['highlights', 'schedule', 'people', 'outcomes', 'register'],
    'Training / FDP': ['highlights', 'schedule', 'workshops', 'people', 'outcomes', 'register'],
    Networking: ['highlights', 'schedule', 'people', 'gallery', 'register'],
    'Awareness Drive': ['highlights', 'outcomes', 'gallery', 'register'],
    Festival: ['highlights', 'zones', 'schedule', 'awards', 'gallery', 'register'],
    Other: ['highlights', 'schedule', 'register'],
};

// Legacy events (created before this catalog) have no new section keys: the
// original five default on, registration stays on (the page always showed it),
// everything newer is opt-in.
const defaultOn = (key) => key === 'register' || !!getSection(key)?.legacy;

export const defaultActiveSections = () =>
    Object.fromEntries(SECTION_KEYS.map((key) => [key, defaultOn(key)]));

export const sectionHasData = (event, key) => {
    const section = getSection(key);
    if (!section) return false;
    if (section.kind === 'form') return true;
    const value = event?.[key];
    if (section.kind === 'schedule') {
        return !!value && typeof value === 'object'
            && Object.values(value).some((items) => Array.isArray(items) && items.length > 0);
    }
    if (section.kind === 'object') {
        return !!value && typeof value === 'object' && !!(value.title || value.body);
    }
    return Array.isArray(value) && value.length > 0;
};

export const isSectionOn = (event, key) => {
    const flags = event?.activeSections;
    const on = flags && key in flags ? !!flags[key] : defaultOn(key);
    return on && sectionHasData(event, key);
};

export const getHeading = (event, key) =>
    (event?.sectionTitles?.[key] || getSection(key)?.heading || '').trim();

// Sections the document actually produced data for.
export const sectionsWithData = (content) =>
    SECTION_KEYS.filter((key) => key !== 'register' && sectionHasData(content, key));

const DAY_LABELS = {
    day1Night: 'Day 1 · Evening & Overnight',
    day1: 'Day 1',
    day2: 'Day 2',
    day3: 'Day 3',
};

export const prettyDayLabel = (key) =>
    DAY_LABELS[key] || key.replace(/([A-Z0-9])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
