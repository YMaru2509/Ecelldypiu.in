import {
    Lightbulb, Users, Rocket, TrendingUp, Trophy, Award, Medal, Target, Shield,
    Star, Info, Zap, BookOpen, Mic, Handshake,
} from 'lucide-react';

const ICONS = { Lightbulb, Users, Rocket, TrendingUp, Trophy, Award, Medal, Target, Shield, Star, Info, Zap, BookOpen, Mic, Handshake };

// Icons are stored by name (JSON-safe). Old pages sometimes used a literal
// emoji instead, so a short non-name string renders as-is.
export const EventIcon = ({ name, className = 'w-6 h-6' }) => {
    const Icon = ICONS[name];
    if (Icon) return <Icon className={className} />;
    if (typeof name === 'string' && name.length > 0 && name.length <= 4) return <span className="text-2xl leading-none">{name}</span>;
    return <Star className={className} />;
};

// Headings mark their highlighted word with *stars* (see utils/eventSections.js).
// On a brand-colour section the accent is a solid chip instead of coloured text,
// since brand-coloured text would vanish against the brand background.
export const Heading = ({ text, onBrand = false, className = '' }) => {
    const parts = text.split(/\*([^*]+)\*/g);
    return (
        <h2 className={`text-3xl md:text-6xl font-black mb-8 md:mb-16 uppercase tracking-tighter text-center ${className}`}>
            {parts.map((part, i) => (i % 2 === 1
                ? <span key={i} className={onBrand ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 inline-block -rotate-1' : 'text-brand-yellow'}>{part}</span>
                : <span key={i}>{part}</span>))}
        </h2>
    );
};

// Every section is a full-width band; `tone` picks the old pages' alternating
// backgrounds (black / zinc / brand). Brand bands add the noise overlay.
export const SectionShell = ({ id, tone, children }) => {
    const base = 'py-12 md:py-20 border-b-4 border-white relative';
    const tones = {
        black: 'bg-black text-white',
        zinc: 'bg-zinc-900 text-white',
        brand: 'bg-brand-yellow text-[var(--text-on-brand)]',
    };
    return (
        <section id={id} className={`${base} ${tones[tone]}`}>
            {tone === 'brand' && <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 pointer-events-none" />}
            <div className="container mx-auto px-4 relative z-10">{children}</div>
        </section>
    );
};
