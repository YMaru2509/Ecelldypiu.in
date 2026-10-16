import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Lightbulb, Star, ArrowRight } from 'lucide-react';
import { prettyDayLabel } from '../../utils/eventSections';
import EventRegistrationForm from '../EventRegistrationForm';
import { EventIcon, Heading } from './shared';
import { asItem, cardClass, inverseCardClass } from './helpers';

// Each renderer returns the inside of a section band (see SectionShell); the
// page decides the band's background tone and order.

export const HighlightsSection = ({ event, heading }) => (
    <>
        <Heading text={heading} onBrand />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.highlights.map((raw, i) => {
                const item = asItem(raw, 'title');
                return (
                    <div key={i} className={inverseCardClass}>
                        <div className="w-12 h-12 rounded-xl bg-brand-yellow text-[var(--text-on-brand)] flex items-center justify-center mb-5 flex-shrink-0">
                            <EventIcon name={item.icon} />
                        </div>
                        <h3 className="text-2xl font-black uppercase mb-2 leading-tight">{item.title}</h3>
                        {item.description && <p className="font-mono text-sm opacity-80">{item.description}</p>}
                    </div>
                );
            })}
        </div>
    </>
);

export const ProcessSection = ({ event, heading }) => (
    <>
        <Heading text={heading} className={event.sectionIntros?.process ? '!mb-6' : ''} />
        {event.sectionIntros?.process && (
            <p className="max-w-3xl mx-auto text-center text-gray-300 font-mono leading-relaxed mb-12 whitespace-pre-wrap">{event.sectionIntros.process}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {event.process.map((raw, i) => {
                const item = asItem(raw, 'title');
                return (
                    <div key={i} className={cardClass}>
                        <div className="flex items-start gap-5">
                            <span className="text-6xl font-black text-stroke leading-none">{String(i + 1).padStart(2, '0')}</span>
                            <div>
                                <div className="text-brand-yellow mb-2"><EventIcon name={item.icon} /></div>
                                <h3 className="text-2xl font-black uppercase mb-2">{item.title}</h3>
                                {item.description && <p className="text-gray-400 font-mono text-sm">{item.description}</p>}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </>
);

export const ZonesSection = ({ event, heading }) => (
    <>
        <Heading text={heading} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {event.zones.map((raw, i) => {
                const zone = asItem(raw, 'name');
                return (
                    <div key={i} className="bg-black border-4 border-zinc-700 hover:border-brand-yellow p-8 rounded-[2rem] transition-all">
                        {zone.zone && (
                            <span className="inline-block text-brand-yellow border border-brand-yellow/30 px-4 py-1 rounded-full bg-brand-yellow/10 text-xs font-black uppercase mb-4">{zone.zone}</span>
                        )}
                        <h3 className="text-3xl font-black uppercase mb-3">{zone.name}</h3>
                        {zone.duration && <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">{zone.duration}</p>}
                        {zone.focus && <p className="font-bold text-sm mb-3">{zone.focus}</p>}
                        {zone.description && <p className="text-gray-400 font-mono text-sm">{zone.description}</p>}
                    </div>
                );
            })}
        </div>
    </>
);

export const ScheduleSection = ({ event, heading }) => {
    const days = Object.entries(event.schedule).filter(([, items]) => Array.isArray(items) && items.length > 0);
    return (
        <>
            <Heading text={heading} />
            <div className={`grid gap-10 max-w-5xl mx-auto ${days.length > 1 ? 'md:grid-cols-2' : ''}`}>
                {days.map(([day, items]) => (
                    <div key={day}>
                        <h3 className="text-xl font-black uppercase text-brand-yellow mb-5 border-b-4 border-white pb-3">{prettyDayLabel(day)}</h3>
                        <div className="space-y-3">
                            {items.map((item, i) => (
                                <div key={i} className="flex gap-4 items-start bg-black border-2 border-zinc-800 rounded-xl p-4 hover:border-brand-yellow transition-colors">
                                    <span className="font-mono font-bold text-brand-yellow text-sm whitespace-nowrap pt-0.5 min-w-[5.5rem]">{item.time}</span>
                                    <span className="font-bold">{item.event}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export const WorkshopsSection = ({ event, heading }) => (
    <>
        <Heading text={heading} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {event.workshops.map((text, i) => (
                <div key={i} className="flex gap-4 items-start bg-black border-2 border-zinc-800 hover:border-brand-yellow rounded-2xl p-6 transition-colors">
                    <Lightbulb className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-0.5" />
                    <p className="font-mono text-sm leading-relaxed">{typeof text === 'string' ? text : text?.title}</p>
                </div>
            ))}
        </div>
    </>
);

export const ChallengesSection = ({ event, heading }) => (
    <>
        <Heading text={heading} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.challenges.map((raw, i) => {
                const item = asItem(raw, 'title');
                return (
                    <div key={i} className="group bg-black border-4 border-zinc-700 hover:border-brand-yellow p-8 rounded-[2rem] transition-all duration-300">
                        {item.category && (
                            <span className="inline-block text-brand-yellow border border-brand-yellow/30 px-4 py-1 rounded-full bg-brand-yellow/10 text-xs font-black uppercase mb-4">{item.category}</span>
                        )}
                        <h3 className="text-2xl font-black uppercase mb-3">{item.title}</h3>
                        {item.description && <p className="text-gray-400 font-mono text-sm">{item.description}</p>}
                    </div>
                );
            })}
        </div>
    </>
);

export const PeopleSection = ({ event, heading }) => (
    <>
        <Heading text={heading} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {event.people.map((raw, i) => {
                const person = asItem(raw, 'name');
                return (
                    <div key={i} className="text-center">
                        <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 rounded-full border-4 border-brand-yellow bg-black overflow-hidden flex items-center justify-center">
                            {person.image
                                ? <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                                : <Star className="w-10 h-10 text-brand-yellow" />}
                        </div>
                        <h3 className="text-lg font-black uppercase leading-tight">{person.name}</h3>
                        {person.role && <p className="text-xs font-mono text-gray-400 mt-1">{person.role}</p>}
                    </div>
                );
            })}
        </div>
    </>
);

export const OutcomesSection = ({ event, heading }) => (
    <>
        <Heading text={heading} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {event.outcomes.map((raw, i) => {
                const item = asItem(raw, 'title');
                return (
                    <div key={i} className="flex gap-5 items-start bg-black border-2 border-zinc-800 hover:border-brand-yellow p-6 rounded-[2rem] transition-colors">
                        <div className="w-14 h-14 rounded-xl bg-brand-yellow text-[var(--text-on-brand)] flex items-center justify-center flex-shrink-0">
                            <EventIcon name={item.icon} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase mb-1">{item.title}</h3>
                            {item.description && <p className="text-gray-400 font-mono text-sm">{item.description}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    </>
);

export const AwardsSection = ({ event, heading }) => (
    <>
        <Heading text={heading} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {event.awards.map((raw, i) => {
                const item = asItem(raw, 'title');
                return (
                    <div key={i} className="bg-black border-4 border-brand-yellow rounded-[2rem] p-8 text-center shadow-[8px_8px_0px_var(--primary-color)]">
                        <div className="text-brand-yellow flex justify-center mb-4"><EventIcon name={item.icon || 'Trophy'} className="w-10 h-10" /></div>
                        <h3 className="text-xl font-black uppercase">{item.title}</h3>
                    </div>
                );
            })}
        </div>
    </>
);

const PLACE_ORDER = { '1st': 1, '2nd': 2, '3rd': 3 };

export const WinnersSection = ({ event, heading }) => {
    const sorted = [...event.winners].sort((a, b) => (PLACE_ORDER[a.place] || 9) - (PLACE_ORDER[b.place] || 9));
    // Classic podium order (2nd, 1st, 3rd) only when there are exactly those three.
    const podium = sorted.length === 3 ? [sorted[1], sorted[0], sorted[2]] : sorted;
    return (
        <>
            <Heading text={heading} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-end">
                {podium.map((winner, i) => {
                    const first = winner.place === '1st';
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            className={`bg-black rounded-[2rem] p-8 text-center border-4 ${first ? 'border-brand-yellow md:-translate-y-6 shadow-[10px_10px_0px_var(--primary-color)]' : 'border-zinc-700'}`}
                        >
                            <span className={`inline-flex w-14 h-14 rounded-full items-center justify-center font-black mb-4 ${first ? 'bg-brand-yellow text-[var(--text-on-brand)] text-xl' : 'bg-zinc-800 text-white'}`}>
                                {winner.place || '—'}
                            </span>
                            <h3 className="text-2xl font-black uppercase leading-tight mb-2">{winner.team}</h3>
                            {winner.prize && <p className="text-brand-yellow font-black mb-2">{winner.prize}</p>}
                            {winner.members && <p className="text-xs font-mono text-gray-400">{winner.members}</p>}
                        </motion.div>
                    );
                })}
            </div>
        </>
    );
};

export const CalloutSection = ({ event }) => {
    const { tag, title, body } = event.callout;
    return (
        <div className="max-w-4xl mx-auto border-4 border-brand-yellow rounded-[2.5rem] p-8 md:p-12 bg-black shadow-[10px_10px_0px_var(--primary-color)]">
            {tag && <span className="inline-block bg-brand-yellow text-[var(--text-on-brand)] font-black px-4 py-1 mb-5 text-sm uppercase rounded-sm -rotate-1">{tag}</span>}
            {title && <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">{title}</h3>}
            {body && <p className="text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">{body}</p>}
        </div>
    );
};

export const GallerySection = ({ event, heading }) => {
    const [open, setOpen] = useState(null);
    const images = event.gallery.filter((g) => g?.src);
    return (
        <>
            <Heading text={heading} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, i) => (
                    <motion.button
                        key={i}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setOpen(img)}
                        className="group relative h-60 rounded-2xl overflow-hidden border-4 border-zinc-700 hover:border-brand-yellow transition-colors"
                    >
                        <img src={img.src} alt={img.caption || event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </motion.button>
                ))}
            </div>
            {open && (
                <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
                    <button type="button" className="absolute top-6 right-6 text-white" aria-label="Close"><X className="w-8 h-8" /></button>
                    <figure className="max-w-5xl" onClick={(e) => e.stopPropagation()}>
                        <img src={open.src} alt={open.caption || event.title} className="max-h-[80vh] mx-auto rounded-xl border-4 border-white" />
                        {open.caption && <figcaption className="text-center text-white font-mono mt-4">{open.caption}</figcaption>}
                    </figure>
                </div>
            )}
        </>
    );
};

export const RegisterSection = ({ event, heading }) => (
    <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
        <div>
            <Heading text={heading} onBrand className="!text-left !mb-6" />
            <p className="font-mono text-lg mb-4">
                Reserve your spot for <strong>{event.title}</strong>. We'll email you a personal QR pass — show it at the door to check in.
            </p>
            <p className="font-mono text-sm opacity-70">One pass per email address. Check your spam folder if it doesn't arrive within a few minutes.</p>
        </div>
        <EventRegistrationForm eventId={event.id} fields={event.registrationFields} notice={event.registrationNotice} />
    </div>
);

// On the event page the register band is just a doorway: the form itself lives
// at /events/<slug>/register.
export const RegisterCtaSection = ({ event, heading }) => (
    <div className="max-w-3xl mx-auto text-center">
        <Heading text={heading} onBrand className="!mb-6" />
        <p className="font-mono text-lg mb-8">
            Reserve your spot for <strong>{event.title}</strong>. We'll email you a personal QR pass — show it at the door to check in.
        </p>
        <Link
            to={`/events/${event.slug || event.id}/register`}
            className="bg-black text-brand-yellow text-xl font-black px-8 py-4 rounded-full border-4 border-black transform hover:-translate-y-1 transition-all shadow-[8px_8px_0px_rgba(0,0,0,0.35)] inline-flex items-center gap-3 no-underline"
        >
            Register Now <ArrowRight className="w-5 h-5" />
        </Link>
    </div>
);
