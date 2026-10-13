import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Users,
    MapPin,
    Trophy,
    Award,
    Star,
    ArrowLeft,
    ArrowRight,
    Clock,
    ExternalLink,
    Target,
    Zap,
    Rocket,
    Crown,
    Medal,
    Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const InnovateForImpact = () => {
    const [certificateEnabled, setCertificateEnabled] = useState(false);

    useEffect(() => {
        fetch('/api/certificate?eventId=innovate-for-impact')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.config?.enabled) setCertificateEnabled(true); })
            .catch(() => { });
    }, []);

    const eventDetails = {
        title: 'INNOVATE FOR IMPACT',
        subtitle: 'E-SUMMIT 2026 ZONALS',
        date: '01 February 2026',
        time: '6 Hours',
        location: 'DYPIU, Akurdi, Pune',
        teamSize: '1–5 Members',
        category: 'Hackathon',
        image: '/innovate-completed.png',
        description: 'Our university is proud to host Innovate for Impact, a flagship Zonal Qualifier event for E-Summit 2026, organized by IIIT-Delhi in collaboration with DYPIU, Pune.',
        longDescription: 'This is a 6-hour high-intensity ideation + buildathon where teams will identify real-world problems, build innovative solutions under time pressure, pitch directly to judges, and compete for national-level recognition and prizes. This is a rare opportunity to compete at a national level, showcase your skills, and represent our college on a bigger stage.',
        highlights: [
            '₹10,000 Cash Prize for Zonal Winners',
            'Direct qualification to E-Summit’26 National Grand Finale | 13–14 March',
            'National Prize Pool Worth ₹3 Lakhs',
            'Participation Certificates (IIIT-Delhi × DYPIU)',
            'Massive value for resumes, internships, and startup exposure'
        ],
        process: [
            { title: 'Identify', desc: 'Identify real-world problems', icon: Target },
            { title: 'Build', desc: 'Build innovative solutions under time pressure', icon: Zap },
            { title: 'Pitch', desc: 'Pitch directly to judges', icon: Users },
            { title: 'Compete', desc: 'Compete for national-level recognition', icon: Trophy }
        ]
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-[var(--text-on-brand)] font-sans">
            {/* Hero Section */}
            <section className="min-h-[80vh] flex flex-col justify-center pt-32 pb-12 relative border-b-4 border-white bg-black">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="mb-8">
                        <Link to="/events" className="inline-flex items-center text-white hover:text-brand-yellow transition-colors font-mono uppercase tracking-widest border-2 border-white/20 px-4 py-2 rounded-full hover:border-brand-yellow hover:bg-white/5">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Events
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="grid lg:grid-cols-2 gap-12 items-center"
                    >
                        <div>
                            <div className="inline-block bg-brand-yellow text-[var(--text-on-brand)] font-black px-4 py-1 mb-6 text-xl transform -rotate-1 rounded-sm">
                                BIG ANNOUNCEMENT
                            </div>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 uppercase tracking-tighter leading-[0.9]">
                                {eventDetails.title}
                            </h1>
                            <p className="text-2xl md:text-4xl font-bold text-brand-yellow mb-8 tracking-tight">
                                {eventDetails.subtitle}
                            </p>

                            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed border-l-4 border-brand-yellow pl-8 mb-12">
                                {eventDetails.description}
                            </p>

                            <div className="flex flex-wrap gap-6 mb-12 items-center">
                                <button
                                    onClick={() => document.getElementById('hall-of-fame-results')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-brand-yellow text-[var(--text-on-brand)] text-xl md:text-2xl font-black px-8 py-4 rounded-full border-4 border-white transform hover:-translate-y-1 transition-all shadow-[8px_8px_0px_white] hover:shadow-[12px_12px_0px_white] flex items-center gap-3 group"
                                >
                                    <Trophy className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                                    WINNERS ANNOUNCED
                                </button>
                                <div className="bg-red-600 text-white text-lg md:text-xl font-black px-6 py-3 rounded-full border-4 border-white transform rotate-2 cursor-default shadow-[6px_6px_0px_white] opacity-80 scale-90">
                                    EVENT CLOSED
                                </div>
                                {certificateEnabled && (
                                    <Link
                                        to="/events/innovate-for-impact/certificate"
                                        className="bg-white text-black text-lg md:text-2xl font-black px-8 py-4 rounded-full border-4 border-brand-yellow transform hover:-translate-y-1 transition-all shadow-[8px_8px_0px_#FFB22C] hover:shadow-[12px_12px_0px_#FFB22C] flex items-center gap-3 group no-underline"
                                    >
                                        <Award className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                                        GET CERTIFICATE
                                    </Link>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: Calendar, label: "DATE", value: eventDetails.date },
                                    { icon: Clock, label: "DURATION", value: eventDetails.time },
                                    { icon: MapPin, label: "VENUE", value: eventDetails.location },
                                    { icon: Users, label: "TEAM SIZE", value: eventDetails.teamSize }
                                ].map((item, i) => (
                                    <div key={i} className="bg-zinc-900 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                                        <div className="bg-black p-2 rounded-lg border border-white/20">
                                            <item.icon className="w-5 h-5 text-brand-yellow" />
                                        </div>
                                        <div>
                                            <span className="text-zinc-500 font-mono text-xs tracking-widest block">{item.label}</span>
                                            <span className="text-lg font-bold uppercase">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="border-4 border-white bg-zinc-900 p-2 rounded-[2rem] rotate-3 hover:rotate-0 transition-transform duration-500 shadow-[20px_20px_0px_#FFB22C]">
                                <img src={eventDetails.image} alt={eventDetails.title} className="w-full h-auto rounded-[1.5rem]" />
                            </div>

                            <div className="absolute -bottom-10 -left-10 bg-black border-4 border-white p-6 rounded-xl shadow-[8px_8px_0px_white] hidden md:block">
                                <p className="text-brand-yellow font-black text-4xl mb-1">₹10,000</p>
                                <p className="text-white font-bold uppercase tracking-wide text-sm">Zonal Cash Prize</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Process / What you'll do */}
            <section className="py-20 border-b-4 border-white bg-zinc-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl md:text-6xl font-black mb-16 uppercase tracking-tighter text-center">
                        WHAT YOU WILL <span className="text-brand-yellow">DO</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {eventDetails.process.map((step, i) => (
                            <div key={i} className="bg-black border-2 border-zinc-800 p-8 rounded-[2rem] hover:border-brand-yellow transition-all group">
                                <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mb-6 border-4 border-black group-hover:scale-110 transition-transform">
                                    <step.icon className="w-8 h-8 text-black" />
                                </div>
                                <h3 className="text-2xl font-black uppercase mb-4 text-white">{step.title}</h3>
                                <p className="text-gray-400 font-medium">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Highlights / Why Join */}
            <section className="py-20 border-b-4 border-white bg-brand-yellow text-[var(--text-on-brand)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-5xl md:text-7xl font-black mb-12 uppercase tracking-tighter text-center leading-[0.9]">
                            WHY YOU SHOULD <br /> NOT MISS THIS
                        </h2>

                        <div className="space-y-4">
                            {eventDetails.highlights.map((highlight, index) => (
                                <div key={index} className="bg-white border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default flex items-center gap-6">
                                    <Star className="w-8 h-8 min-w-[2rem] text-black fill-brand-yellow" />
                                    <p className="text-xl md:text-2xl font-bold uppercase font-mono tracking-tight">{highlight}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section id="hall-of-fame-results" className="py-20 bg-black text-white border-t-4 border-white/10 overflow-hidden relative">
                {/* Background Decorations */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-10 left-10 text-brand-yellow animate-pulse">
                        <Sparkles className="w-12 h-12" />
                    </div>
                    <div className="absolute bottom-10 right-10 text-zinc-500 animate-pulse delay-700">
                        <Sparkles className="w-16 h-16" />
                    </div>
                </div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="inline-block mb-4">
                        <div className="flex items-center gap-2 text-brand-yellow border border-brand-yellow/30 px-4 py-1 rounded-full bg-brand-yellow/10">
                            <Crown className="w-5 h-5" />
                            <span className="font-mono uppercase tracking-widest text-sm font-bold">Hall of Fame</span>
                        </div>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black mb-24 uppercase tracking-tighter leading-none">
                        CHAMPIONS <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-white">REVEALED</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20 items-end">
                        {/* 2nd Place - Silver */}
                        <div className="order-2 md:order-1 relative group">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col items-center"
                            >
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center border-4 border-white shadow-[0_0_30px_rgba(192,192,192,0.3)] z-10 relative group-hover:scale-110 transition-transform duration-300">
                                        <Medal className="w-16 h-16 text-white" />
                                    </div>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gray-200 text-gray-800 font-black px-4 py-1 rounded-full border-2 border-white shadow-lg whitespace-nowrap z-20">
                                        2ND PLACE
                                    </div>
                                    {/* Ribbon Tail */}
                                    <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-20 h-40 bg-gray-800/50 clip-path-ribbon opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-black uppercase mb-2 text-gray-300">CODE AND FIRE</h3>
                                <div className="h-1 w-20 bg-gray-500 rounded-full mb-4"></div>
                            </motion.div>
                        </div>

                        {/* 1st Place - Gold */}
                        <div className="order-1 md:order-2 relative group">
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="flex flex-col items-center"
                            >
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-brand-yellow blur-[60px] opacity-40 rounded-full animate-pulse"></div>
                                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center border-8 border-white shadow-[0_0_50px_rgba(255,215,0,0.5)] z-10 relative group-hover:scale-110 transition-transform duration-300">
                                        <Trophy className="w-24 h-24 text-black drop-shadow-lg" />
                                        <div className="absolute -top-6 -right-6 animate-bounce delay-100">
                                            <Crown className="w-12 h-12 text-white fill-white drop-shadow-md" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-black font-black text-xl px-8 py-2 rounded-full border-4 border-[#FFD700] shadow-xl whitespace-nowrap z-20 tracking-wider">
                                        WINNER
                                    </div>
                                </div>

                                <h3 className="text-4xl md:text-6xl font-black uppercase mb-4 text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-center leading-[0.9]">
                                    GATISUTRA
                                </h3>
                                <div className="h-2 w-32 bg-brand-yellow rounded-full mb-6"></div>
                                <p className="text-brand-yellow font-bold tracking-widest uppercase text-sm border border-brand-yellow/30 px-4 py-1 rounded-full bg-brand-yellow/5">
                                    Grand Prize Winner
                                </p>
                            </motion.div>
                        </div>

                        {/* 3rd Place - Bronze */}
                        <div className="order-3 md:order-3 relative group">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col items-center"
                            >
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#CD7F32] to-[#8B4513] flex items-center justify-center border-4 border-white shadow-[0_0_30px_rgba(205,127,50,0.3)] z-10 relative group-hover:scale-110 transition-transform duration-300">
                                        <Medal className="w-16 h-16 text-white" />
                                    </div>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#572b09] text-[#CD7F32] font-black px-4 py-1 rounded-full border-2 border-[#CD7F32] shadow-lg whitespace-nowrap z-20">
                                        3RD PLACE
                                    </div>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-black uppercase mb-2 text-[#CD7F32]">NEON LOGIC</h3>
                                <div className="h-1 w-20 bg-[#CD7F32] rounded-full mb-4"></div>
                            </motion.div>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden group hover:border-brand-yellow/30 transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow"></div>
                        <h4 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Award className="w-6 h-6 text-brand-yellow" />
                            Judges' Note
                        </h4>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            "The level of innovation shown by <span className="text-white font-bold">Gatisutra</span> in solving real-world logistics was unparalleled. <span className="text-white font-bold">Code and Fire</span> impressed with their rapid execution, while <span className="text-white font-bold">Neon Logic</span> brought a unique creative angle that stood out."
                        </p>
                    </div>

                    <div className="mt-20 flex flex-col items-center gap-6">
                        <div className="bg-red-600 text-white text-3xl font-black px-12 py-6 rounded-full border-4 border-white transform -rotate-1 cursor-default shadow-[0_0_40px_rgba(220,38,38,0.6)]">
                            EVENT CLOSED
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest mb-2">For Further Queries</p>
                            <p className="text-2xl font-bold text-white">9021479745</p>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px white;
          color: transparent;
        }
       `}</style>
        </div>
    );
};

export default InnovateForImpact;
