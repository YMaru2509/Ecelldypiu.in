import { defaultActiveSections } from './eventSections';

export const DEFAULT_EVENT_FORM = {
    title: '',
    slug: '',
    subtitle: '',
    heroTag: '',
    heroStyle: 'poster',
    eventType: '',
    date: '',
    time: '',
    location: '',
    description: '',
    thumbnail: '',
    image: '',
    participants: '',
    category: 'Workshop',
    highlights: [],
    process: [],
    zones: [],
    schedule: {},
    workshops: [],
    challenges: [],
    people: [],
    outcomes: [],
    awards: [],
    winners: [],
    callout: { tag: '', title: '', body: '' },
    gallery: [],
    sectionTitles: {},
    featured: false,
    teamBased: false,
    internalOnly: false,
    activeSections: defaultActiveSections()
};

export const EVENT_CREATION_TEMPLATES = [
    {
        id: 'blank-custom',
        name: 'Blank Custom',
        label: 'Build every section manually',
        draft: {}
    },
    {
        id: 'hackathon',
        name: 'Hackathon',
        label: 'Problem statements, zones, schedule, prizes',
        draft: {
            category: 'Hackathon',
            teamBased: true,
            time: '24+ Hour Hackathon',
            participants: '200+',
            highlights: [
                { title: 'Problem Solving', description: 'Teams build working solutions around real-world challenges.', icon: 'Lightbulb' },
                { title: 'Mentor Checkpoints', description: 'Industry and startup mentors guide teams through validation and execution.', icon: 'Users' },
                { title: 'Final Pitch', description: 'Top teams present their prototypes to judges and partners.', icon: 'Rocket' }
            ],
            zones: [
                { zone: 'Zone A', name: 'Ideation', duration: '2 Hours', focus: 'Problem framing, research, validation', description: 'Teams define the challenge, identify users, and lock their execution plan.' },
                { zone: 'Zone B', name: 'Build Sprint', duration: '18 Hours', focus: 'Prototype, testing, mentor reviews', description: 'Participants turn ideas into working demos with scheduled mentor feedback.' },
                { zone: 'Zone C', name: 'Pitch Arena', duration: '4 Hours', focus: 'Demo, judging, awards', description: 'Teams refine their story, present live, and compete for recognition.' }
            ],
            schedule: {
                day1Night: [
                    { time: '6:00 PM', event: 'Opening ceremony and problem statement briefing' },
                    { time: '8:00 PM', event: 'Team formation and ideation sprint' },
                    { time: '11:00 PM', event: 'Prototype build begins' }
                ],
                day2: [
                    { time: '9:00 AM', event: 'Mentor review round' },
                    { time: '2:00 PM', event: 'Prototype submission' },
                    { time: '4:00 PM', event: 'Final pitches and awards' }
                ]
            },
            workshops: [
                'Rapid prototyping: move from idea to testable demo',
                'Pitch clinic: sharpen the story behind the solution'
            ],
            awards: [
                { title: 'Best Prototype', icon: 'Trophy' },
                { title: 'Most Innovative Solution', icon: 'Award' },
                { title: 'Best Pitch', icon: 'Medal' }
            ]
        }
    },
    {
        id: 'summit',
        name: 'Startup Summit',
        label: 'Keynotes, panels, founder sessions',
        draft: {
            category: 'Summit',
            time: 'Full Day Event',
            participants: '300+',
            highlights: [
                { title: 'Founder Keynotes', description: 'High-signal talks from builders, operators, and ecosystem leaders.', icon: 'Rocket' },
                { title: 'Networking Floor', description: 'Curated spaces for students, startups, mentors, and partners to connect.', icon: 'Users' },
                { title: 'Startup Showcase', description: 'Selected student ventures demonstrate ideas and traction.', icon: 'TrendingUp' }
            ],
            schedule: {
                day1Night: [
                    { time: '10:00 AM', event: 'Inauguration and keynote' },
                    { time: '12:00 PM', event: 'Founder panel' },
                    { time: '3:00 PM', event: 'Startup showcase' }
                ],
                day2: []
            },
            workshops: [
                'Founder playbook: finding the first customer',
                'Fundraising fundamentals for student startups'
            ],
            awards: [
                { title: 'Best Student Venture', icon: 'Trophy' },
                { title: 'Audience Choice', icon: 'Award' }
            ]
        }
    },
    {
        id: 'workshop',
        name: 'Workshop Series',
        label: 'Hands-on learning with clear outcomes',
        draft: {
            category: 'Workshop',
            time: '3 Hour Workshop',
            participants: '100+',
            highlights: [
                { title: 'Hands-On Format', description: 'Participants learn by building, testing, and applying concepts live.', icon: 'Target' },
                { title: 'Takeaway Toolkit', description: 'Every attendee leaves with templates, frameworks, and next steps.', icon: 'Info' },
                { title: 'Mentor Support', description: 'Focused guidance helps participants turn learning into action.', icon: 'Users' }
            ],
            schedule: {
                day1Night: [
                    { time: '10:00 AM', event: 'Welcome and context setting' },
                    { time: '10:30 AM', event: 'Core workshop module' },
                    { time: '12:00 PM', event: 'Hands-on build activity' },
                    { time: '1:00 PM', event: 'Showcase and closing' }
                ],
                day2: []
            },
            workshops: [
                'Main workshop: guided practical learning',
                'Peer review: apply feedback before closing'
            ],
            awards: []
        }
    },
    {
        id: 'pitch-competition',
        name: 'Pitch Competition',
        label: 'Applications, judging, pitches, winners',
        draft: {
            category: 'Competition',
            teamBased: true,
            time: 'Full Day Event',
            participants: '150+',
            highlights: [
                { title: 'Startup Pitches', description: 'Teams present venture ideas with business models and execution plans.', icon: 'Rocket' },
                { title: 'Expert Jury', description: 'Judges evaluate clarity, feasibility, market insight, and impact.', icon: 'Shield' },
                { title: 'Live Feedback', description: 'Participants receive practical feedback to improve their ventures.', icon: 'Lightbulb' }
            ],
            schedule: {
                day1Night: [
                    { time: '10:00 AM', event: 'Registration and briefing' },
                    { time: '11:00 AM', event: 'Pitch round one' },
                    { time: '2:00 PM', event: 'Finalist pitches' },
                    { time: '4:00 PM', event: 'Results and awards' }
                ],
                day2: []
            },
            workshops: [
                'Pitch deck basics: problem, solution, market, traction',
                'Jury prep: handling questions with confidence'
            ],
            awards: [
                { title: 'Winner', icon: 'Trophy' },
                { title: 'Runner Up', icon: 'Medal' },
                { title: 'Best Business Model', icon: 'Award' }
            ]
        }
    }
];

export const createBlankEventForm = () => ({
    ...DEFAULT_EVENT_FORM,
    activeSections: { ...DEFAULT_EVENT_FORM.activeSections }
});

export const createEventDraftFromTemplate = (template) => ({
    ...createBlankEventForm(),
    ...(template?.draft || {}),
    title: '',
    slug: '',
    thumbnail: '',
    image: '',
    activeSections: {
        ...DEFAULT_EVENT_FORM.activeSections,
        ...(template?.draft?.activeSections || {})
    }
});
