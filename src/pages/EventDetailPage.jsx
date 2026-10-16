import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Loader2, Award, Sparkles, LayoutGrid } from 'lucide-react';
import FunkyMarquee from '../components/FunkyMarquee';
import EventRegistrationForm from '../components/EventRegistrationForm';

const Section = ({ icon: Icon, title, children }) => (
    <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
            <Icon className="w-5 h-5 text-brand-yellow" />
            <h2 className="text-2xl md:text-3xl font-black uppercase">{title}</h2>
        </div>
        {children}
    </div>
);

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
                const data = await res.json();
                setEvent(data);
            } catch {
                navigate('/', { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [slug, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
            </div>
        );
    }

    if (!event) return null;

    const scheduleDays = event.schedule && typeof event.schedule === 'object' ? Object.entries(event.schedule) : [];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-x-hidden">
            <section className="pt-32 md:pt-40 pb-12 px-4 border-b-4 border-[var(--border-color)]">
                <div className="container mx-auto">
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-6">{event.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm font-bold uppercase">
                            {event.date && (
                                <span className="flex items-center gap-2 px-4 py-2 border-2 border-[var(--border-color)] rounded-full">
                                    <Calendar className="w-4 h-4 text-brand-yellow" /> {event.date}
                                </span>
                            )}
                            {event.time && (
                                <span className="flex items-center gap-2 px-4 py-2 border-2 border-[var(--border-color)] rounded-full">
                                    <Clock className="w-4 h-4 text-brand-yellow" /> {event.time}
                                </span>
                            )}
                            {event.location && (
                                <span className="flex items-center gap-2 px-4 py-2 border-2 border-[var(--border-color)] rounded-full">
                                    <MapPin className="w-4 h-4 text-brand-yellow" /> {event.location}
                                </span>
                            )}
                            {event.participants && (
                                <span className="flex items-center gap-2 px-4 py-2 border-2 border-[var(--border-color)] rounded-full">
                                    <Users className="w-4 h-4 text-brand-yellow" /> {event.participants}
                                </span>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {(event.image || event.thumbnail) && (
                <div className="w-full max-h-[480px] overflow-hidden border-b-4 border-[var(--border-color)] bg-[var(--bg-secondary)]">
                    <img src={event.image || event.thumbnail} alt={event.title} className="w-full h-full object-cover" />
                </div>
            )}

            <FunkyMarquee text={event.category || 'EVENT'} direction="left" speed={20} className="bg-brand-yellow text-[var(--text-on-brand)] border-b-4 border-[var(--bg-inverse)]" />

            <section className="py-16 px-4">
                <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        {event.description && (
                            <Section icon={Sparkles} title="About">
                                <p className="text-[var(--text-secondary)] text-lg leading-relaxed whitespace-pre-wrap">{event.description}</p>
                            </Section>
                        )}

                        {Array.isArray(event.highlights) && event.highlights.length > 0 && (
                            <Section icon={Sparkles} title="Highlights">
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {event.highlights.map((h, i) => (
                                        <li key={i} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl p-4 text-sm font-bold">{h}</li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {Array.isArray(event.zones) && event.zones.length > 0 && (
                            <Section icon={LayoutGrid} title="Zones">
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {event.zones.map((z, i) => (
                                        <li key={i} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl p-4 text-sm font-bold">{z}</li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {scheduleDays.length > 0 && (
                            <Section icon={Clock} title="Schedule">
                                {scheduleDays.map(([day, items]) => (
                                    <div key={day} className="mb-6">
                                        <h3 className="text-sm font-black uppercase text-brand-yellow mb-3">{day.replace(/([A-Z])/g, ' $1').trim()}</h3>
                                        <div className="space-y-2">
                                            {(items || []).map((item, i) => (
                                                <div key={i} className="flex gap-4 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl p-3">
                                                    <span className="font-mono text-xs text-[var(--text-muted)] whitespace-nowrap">{item.time}</span>
                                                    <span className="text-sm font-bold">{item.event}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </Section>
                        )}

                        {Array.isArray(event.workshops) && event.workshops.length > 0 && (
                            <Section icon={Sparkles} title="Workshops">
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {event.workshops.map((w, i) => (
                                        <li key={i} className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-xl p-4 text-sm font-bold">{w}</li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {Array.isArray(event.awards) && event.awards.length > 0 && (
                            <Section icon={Award} title="Awards">
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {event.awards.map((a, i) => (
                                        <li key={i} className="bg-[var(--bg-card)] border-2 border-brand-yellow rounded-xl p-4 text-sm font-bold">{a}</li>
                                    ))}
                                </ul>
                            </Section>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-28">
                            <EventRegistrationForm eventId={event.id} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default EventDetailPage;
