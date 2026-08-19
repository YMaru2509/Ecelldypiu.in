import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  MapPin,
  Trophy,
  Star,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Elevate = () => {
  const eventDetails = {
    title: 'Elevate\'25',
    subtitle: 'Celebrating World Entrepreneurship Day',
    date: '21st August 2025',
    time: 'Special Initiative',
    location: 'DYPIU Campus',
    participants: 'Students & Faculty',
    category: 'Workshop',
    image: '/ELEVATE.jpeg',
    description: 'A special initiative dedicated to fostering entrepreneurial thinking, innovation, and leadership skills among students.',
    longDescription: 'On August 21, D Y Patil International University (DYPIU) proudly celebrated World Entrepreneurship Day with Elevate\'25, a special initiative dedicated to fostering entrepreneurial thinking, innovation, and leadership skills among students. The event was graced by distinguished industry leaders and university leadership.',
    highlights: [
      {
        title: 'Distinguished Keynote',
        description: 'Keynote address by distinguished industry leader Mr. Shailendra Goswami sharing valuable insights',
        icon: '🎤'
      },
      {
        title: 'Entrepreneurship Landscape',
        description: 'Deep insights into the evolving landscape of entrepreneurship and emerging market trends',
        icon: '🌟'
      },
      {
        title: 'Idea Transformation',
        description: 'Expert guidance on transforming innovative ideas into sustainable and scalable ventures',
        icon: '💡'
      },
      {
        title: 'Academic-Business Bridge',
        description: 'Bridging academic knowledge with real-world business practices and industry applications',
        icon: '🌉'
      },
      {
        title: 'Creative Exploration',
        description: 'Encouraging creative thinking and exploration of opportunities beyond conventional boundaries',
        icon: '🚀'
      },
      {
        title: 'Practical Innovation',
        description: 'Emphasis on innovation in practical settings and real-world implementation strategies',
        icon: '⚡'
      }
    ],

    guests: [
      { name: 'Dr. Manish Bhalla', role: 'Honorable Vice-Chancellor, DYPIU', image: '/Manish Bhalla.png' },
      { name: 'Dr. Prabhat Ranjan', role: 'Pro Vice-Chancellor, DYPIU', image: '/Prabhat Ranjan.png' },
      { name: 'Mr. Shailendra Goswami', role: 'Chief Guest & Industry Leader', image: null }
    ],
    outcomes: [
      {
        title: 'Business Model Refinement',
        description: 'Participating students refined their business models with expert guidance and structured frameworks',
        icon: '📊'
      },
      {
        title: 'Professional Development',
        description: 'Students gained professional insights and developed enhanced presentation and communication skills',
        icon: '🎯'
      },
      {
        title: 'Strategic Validation',
        description: 'Market validation strategies and techniques were implemented for better business understanding',
        icon: '✅'
      },
      {
        title: 'Industry Connections',
        description: 'Valuable mentor connections and industry networking opportunities were established',
        icon: '🤝'
      },
      {
        title: 'Ongoing Support',
        description: 'Follow-up support program initiated to continue nurturing entrepreneurial development',
        icon: '🔄'
      }
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
              COMPLETED INITIATIVE
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black mb-8 uppercase tracking-tighter leading-[0.8] break-words">
              {eventDetails.title.toUpperCase()}
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
                    { icon: MapPin, label: "LOCATION", value: eventDetails.location },
                    { icon: Star, label: "TYPE", value: eventDetails.category }
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
                  <img src={eventDetails.image} alt="Elevate" className="w-full h-auto rounded-xl transition-all duration-500" />
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
            EXCELLENCE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eventDetails.highlights.map((highlight, index) => (
              <div key={index} className="bg-white border-4 border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default flex flex-col h-full">
                <div className="text-4xl mb-6">{highlight.icon}</div>
                <h3 className="text-2xl font-black uppercase mb-4 leading-tight">{highlight.title}</h3>
                <p className="font-bold text-gray-800 leading-relaxed font-mono text-sm">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guests */}
      <section className="py-20 bg-zinc-900 border-b-4 border-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-5xl md:text-8xl font-black mb-20 uppercase tracking-tighter text-center">
            LEADERSHIP
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {eventDetails.guests.map((guest, i) => (
              <div key={i} className="group relative">
                <div className="bg-black border-4 border-white p-8 rounded-[2rem] flex flex-col items-center gap-6 shadow-[12px_12px_0px_#fff] group-hover:shadow-[8px_8px_0px_#fff] group-hover:translate-x-1 group-hover:translate-y-1 transition-all text-center h-full">
                  <div className="w-32 h-32 shrink-0 rounded-full border-4 border-brand-yellow overflow-hidden bg-zinc-800 flex items-center justify-center">
                    {guest.image ? (
                      <img src={guest.image} alt={guest.name} className="w-full h-full object-cover transition-all" />
                    ) : (
                      <Star className="w-12 h-12 text-brand-yellow" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase mb-2">{guest.name}</h3>
                    <p className="text-brand-yellow font-mono text-xs tracking-wider uppercase border-b-2 border-brand-yellow pb-1 inline-block">{guest.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl md:text-8xl font-black mb-20 uppercase tracking-tighter text-center text-transparent stroke-text hover:text-white transition-colors cursor-default">
            IMPACT
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {eventDetails.outcomes.map((outcome, i) => (
              <div key={i} className="group bg-zinc-900 border-4 border-zinc-700 p-8 rounded-[2rem] hover:border-brand-yellow transition-all duration-300 flex items-start gap-6">
                <div className="text-4xl shrink-0 bg-black w-16 h-16 flex items-center justify-center rounded-xl border border-white/20 group-hover:scale-110 transition-transform">
                  {outcome.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase text-white mb-2 group-hover:text-brand-yellow transition-colors">{outcome.title}</h3>
                  <p className="font-mono text-sm text-gray-400 group-hover:text-gray-300 transition-colors uppercase">{outcome.description}</p>
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

export default Elevate;