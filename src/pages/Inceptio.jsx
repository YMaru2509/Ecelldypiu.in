import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  MapPin,
  Trophy,
  Award,
  Star,
  ArrowLeft,
  Linkedin,
  Medal
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Inceptio = () => {
  const eventDetails = {
    title: 'Inceptio\'25',
    subtitle: 'Showcasing the Next Generation of Innovators',
    date: 'August 2025',
    time: 'Two Day Event',
    location: 'DYPIU Campus',
    participants: '21 Teams',
    category: 'Competition',
    image: '/INCEPTIO.png',
    description: 'A distinguished startup pitching competition, drawing inspiration from the dynamic, investor-style pitching approach of Shark Tank, designed to foster innovation, creativity, and entrepreneurial thinking among students.',
    longDescription: 'In August, the Entrepreneurship Cell (E-Cell) of D Y Patil International University (DYPIU), in collaboration with CIIE (Centre of Innovation and Incubation), successfully organized INCEPTIO 2025. This distinguished startup pitching competition provided participants the opportunity to present their ideas to a panel of experienced mentors and industry professionals, simulating a real-world entrepreneurial pitching environment.',
    highlights: [
      '21 student teams participated in the competition',
      'Grand Finale with 9 finalist teams',
      'Esteemed jury of accomplished industry professionals',
      'Real-world entrepreneurial pitching environment',
      'Platform to demonstrate entrepreneurial potential',
      'Networking opportunities with industry leaders'
    ],
    schedule: [
      {
        day: 'Day 1 - 19th August',
        events: [
          { time: '9:00 AM', activity: 'Registration & Welcome' },
          { time: '10:00 AM', activity: 'Opening Ceremony' },
          { time: '11:00 AM', activity: 'Keynote Speech by Industry Expert' },
          { time: '2:00 PM', activity: 'Startup Pitch Round 1' },
          { time: '4:00 PM', activity: 'Workshop: Business Model Canvas' },
          { time: '6:00 PM', activity: 'Networking Session' }
        ]
      },
      {
        day: 'Day 2 - 20th August',
        events: [
          { time: '9:00 AM', activity: 'Startup Pitch Finals' },
          { time: '11:00 AM', activity: 'Panel Discussion: Future of Entrepreneurship' },
          { time: '2:00 PM', activity: 'Mentorship Sessions' },
          { time: '4:00 PM', activity: 'Innovation Showcase' },
          { time: '5:30 PM', activity: 'Award Ceremony' },
          { time: '6:30 PM', activity: 'Closing & Networking' }
        ]
      }
    ],
    prizes: [
      { position: 'Winner', amount: '₹5,000', description: 'Ventura - Outstanding Innovation' },
      { position: '1st Runner-Up', amount: '₹3,000', description: 'Wheyvolution - Excellent Execution' },
      { position: '2nd Runner-Up (Tie)', amount: '₹2,000', description: 'Skyshift - Creative Solution' },
      { position: '2nd Runner-Up (Tie)', amount: '₹2,000', description: 'The Copilots - Technical Excellence' }
    ],
    judges: [
      { name: 'Mr. Santosh Ranjan', role: 'Industry Expert', image: '/Santosh Ranjan.png', linkedin: 'https://www.linkedin.com/in/santoshranjan/' },
      { name: 'Mr. Sanjay Jagtap', role: 'Industry Professional', image: '/Sanjay Jagtap.png', linkedin: 'https://www.linkedin.com/in/sanjay-jagtap-06775a151/' }
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
              COMPLETED
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black mb-8 uppercase tracking-tighter leading-[0.8]">
              {eventDetails.title}
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
                    { icon: Award, label: "TYPE", value: eventDetails.category }
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
                  <img src={eventDetails.image} alt="Inceptio" className="w-full h-auto rounded-xl transition-all duration-500" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Winners (Moved) */}
      <section className="py-20 border-b-4 border-white bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-5xl md:text-8xl font-black mb-20 uppercase tracking-tighter text-center">
            <span className="text-brand-yellow">WIN</span>NERS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {eventDetails.prizes.map((prize, i) => {
              let medalColor = "bg-orange-700 border-orange-500";
              let iconColor = "text-orange-200";
              let label = "3RD PLACE";

              if (i === 0) {
                medalColor = "bg-yellow-500 border-yellow-300";
                iconColor = "text-yellow-100";
                label = "1ST PLACE";
              } else if (i === 1) {
                medalColor = "bg-gray-400 border-gray-300";
                iconColor = "text-gray-100";
                label = "2ND PLACE";
              }

              return (
                <div key={i} className={`group relative bg-zinc-900 border-4 ${i === 0 ? 'border-brand-yellow scale-105 z-10 shadow-[0_0_20px_rgba(255,178,44,0.3)]' : 'border-zinc-700'} p-8 rounded-[2rem] hover:border-brand-yellow transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center`}>
                  <div className={`w-24 h-24 rounded-full border-4 ${medalColor} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Medal className={`w-12 h-12 ${iconColor}`} />
                  </div>

                  <div className="bg-black px-4 py-1 rounded-full border border-zinc-700 mb-6">
                    <span className={`font-mono font-bold text-sm tracking-widest ${i === 0 ? 'text-brand-yellow' : 'text-gray-400'}`}>{label}</span>
                  </div>

                  <h3 className="text-2xl font-black uppercase text-white mb-2 leading-tight">{prize.description.split(' - ')[0]}</h3>
                  <p className="text-sm font-mono text-gray-400 mb-8">{prize.description.split(' - ')[1]}</p>

                  <div className="mt-auto w-full pt-6 border-t border-zinc-800">
                    <p className="text-4xl font-black text-brand-yellow">{prize.amount}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
              <div key={index} className="bg-white border-4 border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default">
                <Star className="w-12 h-12 mb-6 text-black fill-brand-yellow" />
                <p className="text-2xl font-bold leading-tight uppercase font-mono tracking-tight">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-20 bg-black text-white border-b-4 border-white">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl md:text-8xl font-black mb-20 uppercase tracking-tighter text-center text-transparent stroke-text hover:text-white transition-colors cursor-default">
            TIMELINE
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {eventDetails.schedule.map((day, i) => (
              <div key={i} className="bg-zinc-900 border-4 border-white rounded-[2rem] overflow-hidden h-full">
                <div className="bg-brand-yellow text-[var(--text-on-brand)] p-6 border-b-4 border-white">
                  <h3 className="text-3xl font-black uppercase text-center">{day.day.split(' - ')[0]}</h3>
                  <p className="text-black text-center font-mono font-bold">{day.day.split(' - ')[1]}</p>
                </div>
                <div className="p-0">
                  {day.events.map((event, j) => (
                    <div key={j} className="flex border-b border-zinc-700 last:border-0 p-6 hover:bg-white/5 transition-colors">
                      <div className="w-24 shrink-0 font-mono text-brand-yellow text-sm pt-1">{event.time}</div>
                      <div>
                        <p className="font-bold text-lg leading-tight">{event.activity}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <div className="w-24 h-24 shrink-0 rounded-full border-4 border-brand-yellow overflow-hidden flex justify-center items-center bg-zinc-800">
                    <img src={judge.image} alt={judge.name} className="w-full h-full object-cover object-top transition-transform duration-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase mb-1">{judge.name}</h3>
                    <p className="text-brand-yellow font-mono text-sm tracking-wider uppercase border-l-2 border-brand-yellow pl-2 mb-2">{judge.role}</p>
                    {judge.linkedin && (
                      <a href={judge.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-yellow transition-colors text-sm font-mono uppercase tracking-wide">
                        <Linkedin className="w-4 h-4" />
                        <span>Connect</span>
                      </a>
                    )}
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

export default Inceptio;