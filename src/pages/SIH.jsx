import { motion } from 'framer-motion';
import {
    Calendar,
    Users,
    Trophy,
    Star,
    ArrowLeft,
    Brain,
    Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SIH = () => {
    const eventDetails = {
        title: 'Smart India Hackathon 2025',
        subtitle: 'Internal Round',
        date: 'September 2025',
        time: 'Intensive Competition',
        location: 'DYPIU Campus',
        participants: '21 Teams',
        category: 'Hackathon',
        image: '/SIH.png',
        description: 'A prestigious national initiative aimed at fostering innovation and problem-solving among young technologists.',
        longDescription: 'D Y Patil International University (DYPIU) successfully organized the Internal Round of the Smart India Hackathon (SIH) 2025 — a prestigious national initiative aimed at fostering innovation and problem-solving among young technologists. The event provided a vibrant platform for students to present their innovative ideas and technological solutions addressing real-world challenges.',
        highlights: [
            {
                title: 'Student Participation',
                description: '21 student teams showcased exceptional creativity, teamwork, and technical acumen across diverse problem statements',
                icon: 'Users'
            },
            {
                title: 'Real-World Impact',
                description: 'Participants worked intensively to propose impactful solutions addressing genuine societal and industrial challenges',
                icon: 'Brain'
            },
            {
                title: 'Expert Evaluation',
                description: 'Comprehensive assessment by external panel of 5 industry experts ensuring transparent and rigorous evaluation',
                icon: 'Star'
            },
            {
                title: 'National Qualification',
                description: 'Top performing teams qualified to represent DYPIU at the Smart India Hackathon 2025 Grand Finale',
                icon: 'Trophy'
            },
            {
                title: 'Innovation Platform',
                description: 'Vibrant platform for students to present innovative technological solutions and foster problem-solving skills',
                icon: 'Code'
            },
            {
                title: 'Excellence Culture',
                description: 'Event reflects DYPIU\'s culture of excellence, practical innovation, and commitment to producing future-ready innovators',
                icon: 'Target'
            }
        ],

        problemStatements: [
            {
                category: 'Healthcare',
                title: 'Digital Health Monitoring System',
                description: 'Develop a comprehensive health monitoring solution for rural areas'
            },
            {
                category: 'Education',
                title: 'AI-Powered Learning Assistant',
                description: 'Create an intelligent tutoring system for personalized learning'
            },
            {
                category: 'Environment',
                title: 'Smart Waste Management',
                description: 'Design an IoT-based waste collection and recycling system'
            },
            {
                category: 'Agriculture',
                title: 'Precision Farming Solution',
                description: 'Build a data-driven platform for optimizing crop yields'
            }
        ],
        judges: [
            { name: 'Mr. Prasad Tarapure', role: 'Industry Expert', image: '/Php SIH Jury/Prasad Tarapure.png' },
            { name: 'Mr. Santosh Ranjan', role: 'Technology Specialist', image: '/Php SIH Jury/Santosh Ranjan.png' },
            { name: 'Ms. Megha Soneji', role: 'Innovation Consultant', image: '/Php SIH Jury/megha soneji.png' },
            { name: 'Mr. Vishal Pillai', role: 'Technical Advisor', image: '/Php SIH Jury/Vishal Pillai.png' },
            { name: 'Mr. Anand Karyekar', role: 'Business Development Expert', image: '/Php SIH Jury/Anand Karyekar.png' }
        ]
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-[var(--text-on-brand)] font-sans">
            {/* Hero Section */}
            <section className="min-h-[60vh] md:min-h-screen flex flex-col justify-center pt-32 pb-12 relative border-b-4 border-white bg-black">
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
                        className="max-w-6xl"
                    >
                        <div className="inline-block bg-brand-yellow text-[var(--text-on-brand)] font-black px-4 py-1 mb-6 text-xl transform -rotate-1 rounded-sm">
                            INTERNAL ROUND
                        </div>
                        <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black mb-8 uppercase tracking-tighter leading-[0.8] break-words">
                            SIH 2025
                        </h1>
                        <p className="text-3xl md:text-5xl font-bold text-transparent stroke-text mb-12 max-w-4xl tracking-tight">
                            {eventDetails.subtitle.toUpperCase()}
                        </p>

                        <div className="flex flex-col lg:flex-row gap-12 items-start">
                            <div className="flex-1">
                                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed border-l-4 border-brand-yellow pl-8 mb-12">
                                    {eventDetails.longDescription}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {[
                                        { icon: Calendar, label: "DATE", value: eventDetails.date },
                                        { icon: Users, label: "PARTICIPANTS", value: eventDetails.participants },
                                        { icon: Timer, label: "DURATION", value: eventDetails.time },
                                        { icon: Trophy, label: "STATUS", value: "COMPLETED" }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-zinc-900 border-2 border-white/20 p-6 rounded-xl hover:border-brand-yellow transition-colors group">
                                            <div className="flex items-center gap-3 mb-2">
                                                <item.icon className="w-6 h-6 text-brand-yellow group-hover:scale-110 transition-transform" />
                                                <span className="text-gray-500 font-mono text-xs tracking-widest">{item.label}</span>
                                            </div>
                                            <p className="text-xl font-bold uppercase">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:w-1/3">
                                <div className="border-4 border-white bg-zinc-900 p-4 rounded-[2rem] rotate-3 hover:rotate-0 transition-transform duration-500 shadow-[12px_12px_0px_#FFB22C]">
                                    <img src={eventDetails.image} alt="SIH" className="w-full h-auto rounded-xl transition-all duration-500" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Highlights */}
            <section className="py-20 border-b-4 border-white bg-brand-yellow text-[var(--text-on-brand)]">
                <div className="container mx-auto px-4">
                    <h2 className="text-5xl md:text-8xl font-black mb-16 uppercase tracking-tighter text-center">
                        HIGHLIGHTS
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {eventDetails.highlights.map((highlight, index) => (
                            <div key={index} className="bg-white border-4 border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default flex flex-col h-full">
                                <div className="bg-black w-14 h-14 rounded-full flex items-center justify-center mb-6">
                                    <Star className="w-8 h-8 text-brand-yellow" />
                                </div>
                                <h3 className="text-2xl font-black uppercase mb-4 leading-tight">{highlight.title}</h3>
                                <p className="font-bold text-gray-800 leading-relaxed font-mono text-sm">{highlight.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Problem Statements */}
            <section className="py-20 bg-black text-white border-b-4 border-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-5xl md:text-8xl font-black mb-20 uppercase tracking-tighter text-center text-transparent stroke-text hover:text-white transition-colors cursor-default">
                        CHALLENGES
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {eventDetails.problemStatements.map((problem, i) => (
                            <div key={i} className="group bg-zinc-900 border-4 border-zinc-700 hover:border-brand-yellow p-8 rounded-[2rem] transition-all duration-300">
                                <span className="inline-block bg-brand-yellow text-[var(--text-on-brand)] font-black px-3 py-1 rounded text-sm uppercase tracking-wider mb-6">
                                    {problem.category}
                                </span>
                                <h3 className="text-2xl md:text-3xl font-black uppercase mb-4 group-hover:text-brand-yellow transition-colors">{problem.title}</h3>
                                <p className="text-gray-400 font-mono text-lg">{problem.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Judges */}
            <section className="py-20 bg-zinc-900 border-b-4 border-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <h2 className="text-5xl md:text-8xl font-black mb-20 uppercase tracking-tighter text-center">
                        JUDGES
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 max-w-4xl mx-auto">
                        {eventDetails.judges.map((judge, i) => (
                            <div key={i} className="group relative">
                                <div className="bg-black border-4 border-white p-8 rounded-[2rem] flex items-center gap-8 shadow-[12px_12px_0px_#fff] group-hover:shadow-[8px_8px_0px_#fff] group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                                    <div className="w-24 h-24 shrink-0 rounded-full border-4 border-brand-yellow overflow-hidden">
                                        <img src={judge.image} alt={judge.name} className="w-full h-full object-cover transition-all" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase mb-1">{judge.name}</h3>
                                        <p className="text-brand-yellow font-mono text-sm tracking-wider uppercase border-l-2 border-brand-yellow pl-2">{judge.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
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

export default SIH;