import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Events can define their own tiles (event.stats = [{label, value}]) — e.g.
// "Organised by" — otherwise they're built from the standard fields.
const statTiles = (event) => (Array.isArray(event.stats) && event.stats.length > 0
    ? event.stats.map((t) => [String(t.label || '').toUpperCase(), t.value])
    : [
        ['DATE', event.date],
        ['DURATION', event.time],
        ['VENUE', event.location],
        ['PARTICIPANTS', event.participants],
    ]).filter(([, value]) => value);

const Tag = ({ children }) => (
    <span className="inline-block bg-brand-yellow text-[var(--text-on-brand)] font-black px-3 md:px-4 py-1 mb-4 md:mb-6 text-sm md:text-xl transform -rotate-1 rounded-sm">
        {children}
    </span>
);

const BackLink = () => (
    <Link
        to="/events"
        className="inline-flex items-center text-white hover:text-brand-yellow transition-colors mb-5 md:mb-8 text-sm md:text-base font-mono uppercase tracking-widest border-2 border-white/20 px-4 py-2 rounded-full hover:border-brand-yellow hover:bg-white/5"
    >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
    </Link>
);

const StatTile = ({ label, value, big = false }) => (
    <div className={`bg-zinc-900 border-2 border-white/20 rounded-xl hover:border-brand-yellow transition-colors ${big ? 'p-3 md:p-6' : 'p-3 md:p-4'}`}>
        <p className="text-gray-500 font-mono text-xs tracking-widest mb-1">{label}</p>
        <p className={`font-bold uppercase break-words ${big ? 'text-sm md:text-xl' : 'text-sm md:text-lg'}`}>{value}</p>
    </div>
);

const RegisterButton = ({ to }) => (
    <Link
        to={to}
        className="bg-brand-yellow text-[var(--text-on-brand)] text-lg md:text-xl font-black px-6 md:px-8 py-3 md:py-4 rounded-full border-4 border-white transform hover:-translate-y-1 transition-all shadow-[8px_8px_0px_var(--text-primary)] hover:shadow-[12px_12px_0px_var(--text-primary)] inline-flex items-center gap-3 no-underline"
    >
        Register Now <ArrowRight className="w-5 h-5" />
    </Link>
);

const Poster = ({ src, alt, className = '' }) => (
    <div className={`border-4 border-white bg-zinc-900 p-2 rounded-[2rem] rotate-3 hover:rotate-0 transition-transform duration-500 shadow-[20px_20px_0px_var(--primary-color)] ${className}`}>
        <img src={src} alt={alt} className="w-full h-auto rounded-[1.5rem] object-contain" />
    </div>
);

const EventHero = ({ event, showRegister }) => {
    const image = event.image || event.thumbnail;
    const tiles = statTiles(event);
    const tag = event.heroTag || event.category;
    // A poster layout with no poster would leave a hole — fall back to the stat strip.
    const style = event.heroStyle === 'poster' && !image ? 'stats' : (event.heroStyle || 'poster');

    const intro = (titleClass, subtitle, posterOnPhone = false) => (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <BackLink />
            <div className={posterOnPhone ? 'sr-only md:not-sr-only' : ''}>
                {tag && <div><Tag>{String(tag).toUpperCase()}</Tag></div>}
                <h1 className={`${titleClass} font-black uppercase tracking-tighter`}>{event.title}</h1>
                {subtitle}
            </div>
            {event.description && (
                <p className="text-sm md:text-xl text-gray-300 font-mono leading-relaxed border-l-4 border-brand-yellow pl-4 md:pl-6 mb-6 md:mb-8 max-w-2xl whitespace-pre-wrap">
                    {event.description}
                </p>
            )}
            {showRegister && <div className="mb-6 md:mb-10"><RegisterButton to={`/events/${event.slug || event.id}/register`} /></div>}
        </motion.div>
    );

    if (style === 'giant') {
        return (
            <section className="min-h-[80vh] flex flex-col justify-center pt-32 pb-16 relative border-b-4 border-white bg-black">
                <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-12 items-center">
                    <div className="flex-1 min-w-0">
                        {intro(
                            'text-6xl md:text-8xl lg:text-[9rem] mb-8 leading-[0.8] break-words',
                            event.subtitle && <h2 className="text-3xl md:text-6xl font-black uppercase mb-8 text-stroke break-words">{event.subtitle}</h2>,
                        )}
                        {tiles.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 max-w-2xl">
                                {tiles.map(([label, value]) => <StatTile key={label} label={label} value={value} big />)}
                            </div>
                        )}
                    </div>
                    {image && <Poster src={image} alt={event.title} className="lg:w-1/3 w-full max-w-md" />}
                </div>
            </section>
        );
    }

    if (style === 'stats') {
        // Phones get their own portrait poster (event.mobileImage) — a landscape
        // one would be cropped to a sliver there.
        const mobileImage = event.mobileImage || image;
        return (
            <section className="md:pt-32 pb-10 md:pb-16 relative border-b-4 border-white bg-black overflow-hidden">
                {image && (
                    <>
                        {/* Desktop: the poster sits behind the heading and copy; the gradient keeps the text readable. */}
                        <img src={image} alt="" aria-hidden="true" className="hidden md:block absolute inset-0 w-full h-full object-cover object-center" />
                        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/5" />
                        <div className="hidden md:block absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black to-transparent" />
                        {/* Phone: the whole portrait poster on top, fading into the copy below it. */}
                        <div className="md:hidden relative pt-[76px] bg-black">
                            <img src={mobileImage} alt={event.title} className="block w-full h-auto" />
                        </div>
                    </>
                )}
                <div className={`container mx-auto px-4 relative z-10 ${image ? 'pt-5 md:pt-0' : 'pt-28 md:pt-0'}`}>
                    {intro(
                        'text-4xl md:text-7xl lg:text-8xl mb-3 md:mb-4 leading-[0.9]',
                        event.subtitle && <h2 className="text-xl md:text-3xl font-bold text-brand-yellow mb-5 md:mb-8 uppercase">{event.subtitle}</h2>,
                        Boolean(image),
                    )}
                    {tiles.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {tiles.map(([label, value]) => <StatTile key={label} label={label} value={value} big />)}
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-[80vh] flex flex-col justify-center pt-32 pb-12 relative border-b-4 border-white bg-black">
            <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
                <div className="min-w-0">
                    {intro(
                        'text-5xl md:text-7xl lg:text-8xl mb-4 leading-[0.9] break-words',
                        event.subtitle && <h2 className="text-2xl md:text-3xl font-bold text-brand-yellow mb-8 uppercase">{event.subtitle}</h2>,
                    )}
                    {tiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            {tiles.map(([label, value]) => <StatTile key={label} label={label} value={value} />)}
                        </div>
                    )}
                </div>
                <div className="flex justify-center lg:justify-end">
                    <Poster src={image} alt={event.title} className="w-full max-w-lg" />
                </div>
            </div>
        </section>
    );
};

export default EventHero;
