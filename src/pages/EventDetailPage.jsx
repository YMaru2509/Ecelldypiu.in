import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SECTION_CATALOG, isSectionOn, getHeading } from '../utils/eventSections';
import EventHero from '../components/eventPage/EventHero';
import { SectionShell } from '../components/eventPage/shared';
import { SECTION_RENDERERS } from '../components/eventPage/renderers';

const asArray = (value) => (Array.isArray(value) ? value : []);

// Events saved before the section catalog existed (or by older editor builds)
// may lack any of these keys — give the renderers a predictable shape.
const normalizeEvent = (event) => ({
    ...event,
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
    gallery: asArray(event.gallery),
    callout: { tag: '', title: '', body: '', ...(event.callout || {}) },
});

const EventDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        (async () => {
            try {
                const res = await fetch(`/api/event?action=get-events&slug=${encodeURIComponent(slug)}`);
                if (!res.ok) throw new Error('Not found');
                setEvent(normalizeEvent(await res.json()));
            } catch {
                navigate('/', { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [slug, navigate]);

    // Sections in catalog order, alternating zinc/black bands between the
    // brand-coloured ones — the same rhythm the hand-built event pages use.
    const bands = useMemo(() => {
        if (!event) return [];
        let alternate = 0;
        return SECTION_CATALOG
            .filter(({ key }) => isSectionOn(event, key))
            .map(({ key }) => {
                const { Component, tone } = SECTION_RENDERERS[key];
                const resolved = tone || (alternate++ % 2 === 0 ? 'zinc' : 'black');
                return { key, Component, tone: resolved, heading: getHeading(event, key) };
            });
    }, [event]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-[var(--text-on-brand)] font-sans overflow-x-hidden">
            <EventHero event={event} showRegister={bands.some(({ key }) => key === 'register')} />
            {bands.map(({ key, Component, tone, heading }) => (
                <SectionShell key={key} id={key === 'register' ? 'register' : key} tone={tone}>
                    <Component event={event} heading={heading} />
                </SectionShell>
            ))}
        </div>
    );
};

export default EventDetailPage;
