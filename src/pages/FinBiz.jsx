import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Award,
  Star,
  TrendingUp,
  Target,
  Lightbulb,
  Users,
  DollarSign,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FinBiz = () => {
  const eventDetails = {
    title: 'FinBiz\'25 Powered by Surya Electronics',
    subtitle: 'Finance & Business Innovation Festival',
    date: '8th & 9th November 2025',
    time: '24+ Hour Marathon',
    location: 'DYPIU Campus',
    participants: 'Open for All',
    category: 'Finance & Trading Competition',
    description: 'A 24-hour flagship finance and business innovation festival designed to empower students with real-world trading experience, financial literacy, and strategic entrepreneurship skills. The event bridges the gap between market theory and hands-on finance practice.',
    highlights: [
      {
        title: 'Live Market Simulation',
        description: 'Experience real-time trading across equities, forex, and commodities using live simulation platforms',
        icon: 'TrendingUp'
      },
      {
        title: 'Expert Mentorship',
        description: 'Learn from industry leaders including experts from IIT Bombay and DYPIU\'s entrepreneurial ecosystem',
        icon: 'Users'
      },
      {
        title: 'Business Model Building',
        description: 'Develop scalable business models grounded in real financial logic and market dynamics',
        icon: 'Target'
      },
      {
        title: 'Strategic Innovation',
        description: 'Combine financial literacy with entrepreneurship through interactive workshops and live simulations',
        icon: 'Lightbulb'
      }
    ],
    zones: [
      {
        zone: 'Zone A',
        name: 'FinBiz Trading Arena',
        duration: '24+ Hours (Day 1 – Day 2)',
        focus: 'Live market simulation, fund management, algo-based trading strategies',
        description: 'Immersive exposure to trading across different markets with real-time analytics and strategy formulation'
      },
      {
        zone: 'Zone B',
        name: 'Illuminate Workshop Series',
        duration: '6 Hours (Day 1)',
        focus: 'Financial literacy, business model innovation, mentorship from IIT Bombay & DYPIU',
        description: 'Curated high-energy sessions for aspiring entrepreneurs who want to merge finance with innovation'
      }
    ],
    schedule: {
      day1Morning: [
        { time: '12:00 PM', event: 'Registration & Orientation' },
        { time: '1:00 PM', event: 'Opening Ceremony with IIT Bombay Keynote' },
        { time: '2:00 PM', event: 'Workshop 1: Financial Markets Decoded' },
        { time: '3:30 PM', event: 'Workshop 2: Mind of a Trader' },
        { time: '5:00 PM', event: 'Workshop 3: Hands-on with Algo & Strategy' },
      ],
      day1Night: [
        { time: '6:00 PM', event: 'TradeStorm Begins - Real-time Simulated Trading' },
        { time: '9:00 PM', event: 'Dynamic Market Rounds & Policy Shocks' },
        { time: '12:00 AM', event: 'Financial Trivia & Networking Lounge' },
        { time: '3:00 AM', event: 'Finance Unplugged Session' },
      ],
      day2: [
        { time: '6:00 AM', event: 'Morning Trading Rounds' },
        { time: '9:00 AM', event: 'Workshop 4: Entrepreneurial Finance & Fund Management' },
        { time: '12:00 PM', event: 'Final Portfolio Submission & Performance Review' },
        { time: '2:00 PM', event: 'Mock Investor Pitch Session' },
        { time: '4:00 PM', event: 'Final Investor Round & Jury Evaluation' },
        { time: '6:00 PM', event: 'Closing Ceremony & Awards Night' },
      ]
    },
    workshops: [
      'Financial Literacy 101 — Understanding capital flow and investment logic',
      'Building a Business on Market Trends',
      'Business Model Canvas Workshop',
      'Fund Management & Scaling',
      'Mentorship Talk — IIT Bombay & DYPIU leaders',
      'Pitch & Q&A Session'
    ],
    awards: [
      { title: 'Best Trading Strategist', icon: 'TrendingUp' },
      { title: 'Best Fund Management Model', icon: 'DollarSign' },
      { title: 'Best Financial Startup Pitch', icon: 'Award' }
    ]
  };

  const getIcon = (iconName) => {
    const icons = {
      TrendingUp: TrendingUp,
      Users: Users,
      Target: Target,
      Lightbulb: Lightbulb,
      DollarSign: DollarSign,
      Award: Award,
      BarChart3: BarChart3
    };
    return icons[iconName] || Star;
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
              UPCOMING ... JUST KIDDING, COMPLETED
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-[8rem] font-black mb-8 uppercase tracking-tighter leading-[0.9] break-words">
              FINBIZ '25
            </h1>
            <p className="text-3xl md:text-5xl font-bold text-transparent stroke-text mb-12 max-w-4xl tracking-tight">
              POWERED BY SURYA ELECTRONICS
            </p>

            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <div className="flex-1">
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed border-l-4 border-brand-yellow pl-8 mb-12">
                  {eventDetails.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: Calendar, label: "DATE", value: eventDetails.date },
                    { icon: Clock, label: "DURATION", value: eventDetails.time },
                    { icon: MapPin, label: "LOCATION", value: eventDetails.location },
                    { icon: Users, label: "ELIGIBILITY", value: eventDetails.participants }
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* Registration CTA - Brutalist Style */}
      <section id="registration" className="py-20 border-b-4 border-white bg-brand-yellow text-[var(--text-on-brand)] overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-8 uppercase tracking-tighter">
            REGISTRATION CLOSED
          </h2>
          <p className="text-2xl font-bold mb-12 max-w-2xl mx-auto">
            The event has successfully concluded. Stay tuned for FinBiz'26!
          </p>

          <div className="inline-block bg-black text-white p-8 rounded-[2rem] border-4 border-white shadow-[12px_12px_0px_white] transform rotate-1 hover:rotate-0 transition-transform cursor-default">
            <p className="text-xl font-mono mb-2 text-gray-400 uppercase">Total Participation</p>
            <p className="text-6xl font-black text-brand-yellow">500+</p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 bg-black text-white border-b-4 border-white">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl md:text-7xl font-black mb-16 uppercase tracking-tighter text-center">
            HIGHLIGHTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {eventDetails.highlights.map((highlight, index) => {
              const IconComponent = getIcon(highlight.icon);
              return (
                <div key={index} className="bg-zinc-900 border-4 border-zinc-700 p-8 rounded-[2rem] hover:border-brand-yellow hover:bg-zinc-800 transition-all group">
                  <IconComponent className="w-12 h-12 text-brand-yellow mb-6 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-black uppercase mb-4 leading-none">{highlight.title}</h3>
                  <p className="text-gray-400 font-mono text-sm leading-relaxed group-hover:text-gray-300">{highlight.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Zones */}
      <section className="py-20 bg-white text-black border-b-4 border-black">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl md:text-7xl font-black mb-16 uppercase tracking-tighter text-center">
            EVENT ZONES
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {eventDetails.zones.map((zone, index) => (
              <div key={index} className="bg-brand-yellow border-4 border-black p-8 rounded-[2rem] shadow-[12px_12px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className="bg-black text-white inline-block px-4 py-1 font-mono font-bold uppercase mb-4 rounded-sm">{zone.zone}</div>
                <h3 className="text-4xl font-black uppercase mb-2 leading-none">{zone.name}</h3>
                <div className="flex items-center gap-2 mb-6 font-mono font-bold">
                  <Clock className="w-5 h-5" />
                  {zone.duration}
                </div>
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm border-2 border-black/10">
                  <p className="font-bold uppercase text-sm mb-1 opacity-70">Focus Areas</p>
                  <p className="font-black leading-tight">{zone.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-20 bg-black text-white border-b-4 border-white">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl md:text-7xl font-black mb-16 uppercase tracking-tighter text-center text-transparent stroke-text hover:text-white transition-colors cursor-default">
            AGENDA
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Day 1 */}
            <div className="bg-zinc-900 border-4 border-white rounded-[2rem] overflow-hidden">
              <div className="bg-brand-yellow p-6 border-b-4 border-white">
                <h3 className="text-3xl font-black text-black uppercase text-center">DAY 1</h3>
                <p className="text-black text-center font-mono font-bold">EVENING & OVERNIGHT</p>
              </div>
              <div className="p-0">
                {eventDetails.schedule.day1Night.map((item, i) => (
                  <div key={i} className="flex border-b border-zinc-700 last:border-0 p-6 hover:bg-white/5 transition-colors">
                    <div className="w-24 shrink-0 font-mono text-brand-yellow text-sm pt-1">{item.time.split(' ')[0]}</div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day 2 */}
            <div className="bg-zinc-900 border-4 border-white rounded-[2rem] overflow-hidden">
              <div className="bg-white p-6 border-b-4 border-white">
                <h3 className="text-3xl font-black text-black uppercase text-center">DAY 2</h3>
                <p className="text-black text-center font-mono font-bold">SIMULATION & PITCH</p>
              </div>
              <div className="p-0">
                {eventDetails.schedule.day2.map((item, i) => (
                  <div key={i} className="flex border-b border-zinc-700 last:border-0 p-6 hover:bg-white/5 transition-colors">
                    <div className="w-24 shrink-0 font-mono text-brand-yellow text-sm pt-1">{item.time.split(' ')[0]}</div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workshops */}
      <section className="py-20 bg-zinc-900">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl md:text-7xl font-black mb-16 uppercase tracking-tighter text-center">
            WORKSHOPS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {eventDetails.workshops.map((workshop, index) => (
              <div key={index} className="bg-black border-2 border-zinc-700 p-6 rounded-xl flex items-start gap-4 hover:border-brand-yellow transition-colors">
                <Lightbulb className="w-6 h-6 text-brand-yellow shrink-0 mt-1" />
                <p className="font-bold text-lg leading-tight">{workshop}</p>
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

export default FinBiz;
