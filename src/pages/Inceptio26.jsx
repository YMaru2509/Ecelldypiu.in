import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Users,
    MapPin,
    Trophy,
    Award,
    Star,
    ArrowLeft,
    Clock,
    Target,
    Zap,
    Crown,
    Medal,
    Sparkles,
    Maximize2,
    X,
    ChevronLeft,
    ChevronRight,
    Building2,
    ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Inceptio26 = () => {
    const [certificateEnabled, setCertificateEnabled] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    useEffect(() => {
        fetch('/api/certificate?eventId=inceptio-26')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.config?.enabled !== false) setCertificateEnabled(true); })
            .catch(() => { });
    }, []);

    const galleryImages = [
        { src: '/INCEPTIO26.png', title: 'Official INCEPTIO \'26 Event Poster' },
        { src: '/inceptio26/inceptio26-1.jpg', title: 'Certificate Presentation Ceremony' },
        { src: '/inceptio26/inceptio26-2.jpg', title: 'Participants and Jury Group Photo' },
        { src: '/inceptio26/inceptio26-3.jpg', title: 'Grand Finale Award Felicitation' },
        { src: '/inceptio26/inceptio26-4.jpg', title: 'Organizing Committee and Student Delegations' },
        { src: '/inceptio26/inceptio26-5.jpg', title: 'Felicitation of Top Performing Teams' }
    ];

    const eventDetails = {
        title: 'INCEPTIO\'26',
        subtitle: 'STARTUP PITCHING CHALLENGE',
        organizedBy: 'E-Cell × CIIE, DYPIU',
        date: '23 August 2026',
        time: 'Screening & Pitching Challenge',
        location: 'DYPIU Campus, Akurdi, Pune',
        teamSize: '40 Pitching Teams',
        category: 'Startup Challenge',
        image: '/INCEPTIO26.png',
        description: 'INCEPTIO\'26, the flagship startup pitching and business challenge by E-Cell DYPIU in collaboration with CIIE, brought together aspiring entrepreneurs to pitch their ideas, test their business thinking, and take their first step toward building real-world ventures.',
        longDescription: 'The competition began with an online screening round on 22 August, followed by an offline pitching round where 40 shortlisted teams presented their startups through 5-minute pitches and 2-minute Q&A sessions. After a rigorous evaluation, the Top 10 teams advanced to the final stage on 23 August.',
        phase2: {
            title: 'Phase 2 — The One-Week Startup Challenge',
            desc1: 'The Top 10 qualified teams will now move forward to Phase 2: a one-week Startup Challenge, where they will take their ideas beyond the pitch deck and work on developing and validating their ventures.',
            desc2: 'The challenge will put their entrepreneurial thinking, execution, problem-solving, and ability to turn an idea into something tangible to the test.'
        },
        highlights: [
            '₹5,000 Cash Prize for 1st Place Winner (CampusBites)',
            '₹3,000 for 2nd Place (The Method Studio) & ₹2,000 for 3rd Place (Swaraj Saathi)',
            'Phase 2: 1-Week Startup Challenge for Top 10 Qualified Teams',
            'Direct Entry to Eureka! 2026 Zonals at IIT Bombay for Top 3 Teams',
            'Access to Advanced Startup Bootcamp & Incubation Support through CIIE'
        ],
        process: [
            { title: 'Screening', desc: 'Online screening round on 22 August evaluating business ideas', icon: Target },
            { title: 'Offline Pitch', desc: '40 shortlisted teams delivered 5-min pitches & 2-min Q&A', icon: Zap },
            { title: 'Top 10 Final', desc: 'Top 10 teams advanced to the final stage on 23 August', icon: Users },
            { title: 'Phase 2 Challenge', desc: '1-Week Startup Challenge to build & validate real ventures', icon: Trophy }
        ],
        winners: {
            first: {
                team: 'CAMPUSBITES',
                prize: '₹5,000',
                members: 'Yash Maru & Aviraj Raut'
            },
            second: {
                team: 'THE METHOD STUDIO',
                prize: '₹3,000',
                members: 'Drashti Tushar Bhatt, Shivani Rakshasbhuwankar, Siddharth Maind, Shreya Tiwari & Keyur Nartam'
            },
            third: {
                team: 'SWARAJ SAATHI',
                prize: '₹2,000',
                members: 'Swaraj Saathi'
            }
        }
    };

    const openLightbox = (index) => setSelectedImageIndex(index);
    const closeLightbox = () => setSelectedImageIndex(null);
    const nextImage = () => setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
    const prevImage = () => setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-black font-sans">
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
                            <div className="inline-block bg-brand-yellow text-black font-black px-4 py-1 mb-6 text-xl transform -rotate-1 rounded-sm">
                                FLAGSHIP CHALLENGE
                            </div>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 uppercase tracking-tighter leading-[0.9]">
                                {eventDetails.title}
                            </h1>
                            <p className="text-2xl md:text-4xl font-bold text-brand-yellow mb-8 tracking-tight">
                                {eventDetails.subtitle}
                            </p>

                            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed border-l-4 border-brand-yellow pl-8 mb-12">
                                {eventDetails.description}
                                <br /><br />
                                <span className="text-gray-400 text-lg md:text-xl font-mono">
                                    {eventDetails.longDescription}
                                </span>
                            </p>

                            <div className="flex flex-wrap gap-6 mb-12 items-center">
                                <button
                                    onClick={() => document.getElementById('hall-of-fame-results')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-brand-yellow text-black text-xl md:text-2xl font-black px-8 py-4 rounded-full border-4 border-white transform hover:-translate-y-1 transition-all shadow-[8px_8px_0px_white] hover:shadow-[12px_12px_0px_white] flex items-center gap-3 group"
                                >
                                    <Trophy className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                                    WINNERS ANNOUNCED
                                </button>
                                <div className="bg-red-600 text-white text-lg md:text-xl font-black px-6 py-3 rounded-full border-4 border-white transform rotate-2 cursor-default shadow-[6px_6px_0px_white] opacity-80 scale-90">
                                    EVENT CONCLUDED
                                </div>
                                {certificateEnabled && (
                                    <Link
                                        to="/events/inceptio-26/certificate"
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
                                    { icon: Users, label: "ORGANIZED BY", value: eventDetails.organizedBy }
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
                                <p className="text-brand-yellow font-black text-4xl mb-1">₹5,000</p>
                                <p className="text-white font-bold uppercase tracking-wide text-sm">1st Place Prize</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Process / How it unfolded */}
            <section className="py-20 border-b-4 border-white bg-zinc-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl md:text-6xl font-black mb-16 uppercase tracking-tighter text-center">
                        HOW IT <span className="text-brand-yellow">UNFOLDED</span>
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

            {/* Phase 2 — The One-Week Startup Challenge */}
            <section className="py-20 border-b-4 border-white bg-black relative overflow-hidden">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="bg-zinc-900 border-4 border-brand-yellow p-8 md:p-12 rounded-[2.5rem] shadow-[12px_12px_0px_#FFB22C] relative overflow-hidden">
                        <div className="inline-flex items-center gap-2 bg-brand-yellow text-black font-black px-4 py-1.5 mb-6 text-sm md:text-base rounded-md uppercase tracking-wider">
                            <Zap className="w-5 h-5 text-black" /> PHASE 2 UNLOCKED
                        </div>

                        <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 text-white leading-tight">
                            {eventDetails.phase2.title}
                        </h3>

                        <p className="text-lg md:text-2xl text-gray-200 leading-relaxed mb-6 font-medium border-l-4 border-brand-yellow pl-6">
                            {eventDetails.phase2.desc1}
                        </p>

                        <p className="text-base md:text-xl text-gray-400 leading-relaxed font-mono">
                            {eventDetails.phase2.desc2}
                        </p>
                    </div>
                </div>
            </section>

            {/* Highlights Section */}
            <section className="py-20 border-b-4 border-white bg-brand-yellow text-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-5xl md:text-7xl font-black mb-12 uppercase tracking-tighter text-center leading-[0.9]">
                            KEY EVENT <br /> HIGHLIGHTS
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

            {/* Hall of Fame / Results Section */}
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
                                        2ND PLACE (₹3,000)
                                    </div>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-black uppercase mb-2 text-gray-300">{eventDetails.winners.second.team}</h3>
                                <div className="h-1 w-20 bg-gray-500 rounded-full mb-4"></div>
                                <p className="text-sm font-mono text-gray-400 max-w-xs text-center">{eventDetails.winners.second.members}</p>
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
                                        WINNER (₹5,000)
                                    </div>
                                </div>

                                <h3 className="text-4xl md:text-6xl font-black uppercase mb-2 text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-center leading-[0.9]">
                                    {eventDetails.winners.first.team}
                                </h3>
                                <div className="h-2 w-32 bg-brand-yellow rounded-full mb-4"></div>
                                <p className="text-base font-mono text-gray-200 font-bold max-w-xs text-center mb-4">{eventDetails.winners.first.members}</p>
                                <p className="text-brand-yellow font-bold tracking-widest uppercase text-xs border border-brand-yellow/30 px-4 py-1 rounded-full bg-brand-yellow/5">
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
                                        3RD PLACE (₹2,000)
                                    </div>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-black uppercase mb-2 text-[#CD7F32]">{eventDetails.winners.third.team}</h3>
                                <div className="h-1 w-20 bg-[#CD7F32] rounded-full mb-4"></div>
                            </motion.div>
                        </div>
                    </div>

                    {/* What's Next for Winners Banner */}
                    <div className="max-w-4xl mx-auto bg-zinc-900 border-4 border-white p-8 md:p-12 rounded-[2.5rem] shadow-[12px_12px_0px_#FFB22C] text-left mb-20 relative overflow-hidden">
                        <div className="inline-flex items-center gap-2 bg-brand-yellow text-black font-black px-4 py-1 mb-6 text-sm rounded-sm uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-black" /> EUREKA! 2026 ZONALS
                        </div>

                        <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">
                            WHAT'S NEXT
                        </h3>

                        <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6 font-medium">
                            The Top 3 teams will continue their entrepreneurial journey at <strong className="text-brand-yellow">Eureka! 2026 Zonals</strong>, IIT Bombay's flagship business plan competition. They will also receive access to an advanced startup bootcamp and incubation support through CIIE.
                        </p>
                    </div>

                    {/* Thank You & Concluding Note */}
                    <div className="max-w-4xl mx-auto bg-zinc-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-sm text-left mb-20">
                        <h4 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Award className="w-6 h-6 text-brand-yellow" />
                            Beyond The Pitch Deck
                        </h4>
                        <p className="text-zinc-300 text-lg leading-relaxed mb-4">
                            INCEPTIO'26 was more than a pitching competition — it was a platform for students to transform ideas into opportunities, challenge assumptions, and experience what it takes to build.
                        </p>
                        <p className="text-zinc-300 text-lg leading-relaxed mb-6">
                            Congratulations to <strong className="text-brand-yellow">CampusBites, The Method Studio, and Swaraj Saathi</strong>, and a sincere thank you to every team that registered, built, pitched, and brought their ideas to the stage.
                        </p>
                        <p className="text-brand-yellow font-mono text-lg font-black uppercase tracking-wider border-l-4 border-brand-yellow pl-4">
                            The pitch was only Phase 1. The real challenge starts now.
                        </p>
                    </div>

                    {/* Event Gallery */}
                    <div className="max-w-6xl mx-auto mb-20 text-left">
                        <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-center text-white">
                            EVENT <span className="text-brand-yellow">GALLERY</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {galleryImages.map((img, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => openLightbox(idx)}
                                    className="group bg-zinc-900 border-2 border-zinc-800 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-yellow transition-all"
                                >
                                    <div className="h-60 overflow-hidden">
                                        <img
                                            src={img.src}
                                            alt={img.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center">
                                        <span className="text-xs font-mono font-bold text-gray-300 uppercase truncate">
                                            {img.title}
                                        </span>
                                        <Maximize2 className="w-4 h-4 text-brand-yellow shrink-0 ml-2 group-hover:scale-110 transition-transform" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-6">
                        <div className="bg-red-600 text-white text-3xl font-black px-12 py-6 rounded-full border-4 border-white transform -rotate-1 cursor-default shadow-[0_0_40px_rgba(220,38,38,0.6)]">
                            EVENT CONCLUDED
                        </div>

                        <div className="text-center mt-6">
                            <p className="text-gray-500 font-mono text-sm uppercase tracking-widest mb-2">Organized By</p>
                            <p className="text-xl font-bold text-white uppercase">E-Cell × CIIE, DYPIU</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImageIndex !== null && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <button
                            onClick={closeLightbox}
                            className="absolute top-6 right-6 text-white hover:text-brand-yellow p-2 rounded-full bg-zinc-800/80 border border-white/20 transition-colors z-50"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-brand-yellow p-3 rounded-full bg-zinc-800/80 border border-white/20 transition-colors z-50"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-brand-yellow p-3 rounded-full bg-zinc-800/80 border border-white/20 transition-colors z-50"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        <div className="max-w-5xl w-full flex flex-col items-center">
                            <img
                                src={galleryImages[selectedImageIndex].src}
                                alt={galleryImages[selectedImageIndex].title}
                                className="max-h-[80vh] w-auto object-contain rounded-2xl border-4 border-white shadow-2xl"
                            />
                            <p className="mt-4 font-mono font-bold text-sm text-brand-yellow bg-zinc-900 px-6 py-2 rounded-full border border-zinc-700">
                                {galleryImages[selectedImageIndex].title} ({selectedImageIndex + 1} / {galleryImages.length})
                            </p>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px white;
          color: transparent;
        }
       `}</style>
        </div>
    );
};

export default Inceptio26;
