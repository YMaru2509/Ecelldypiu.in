

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FunkyMarquee from '../components/FunkyMarquee';
import RollingText from '../components/ui/RollingText';
import {
  Target,
  Eye,
  Users,
  Award,
  Lightbulb,
  TrendingUp,
  Globe,
  Star,
  Rocket
} from 'lucide-react';

const CustomRocket = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Rocket Body */}
    <path d="M12 2.5C12 2.5 15.5 6 15.5 12C15.5 18 12 21.5 12 21.5C12 21.5 8.5 18 8.5 12C8.5 6 12 2.5 12 2.5Z" fill="var(--illustration-light)" stroke="var(--illustration-outline)" strokeWidth="1" />
    {/* Red Tip */}
    <path d="M12 2.5C12 2.5 14 4.5 14.5 7H9.5C10 4.5 12 2.5 12 2.5Z" fill="var(--accent-red)" />
    {/* Blue Middle Band */}
    <path d="M8.7 12H15.3V14H8.7V12Z" fill="var(--illustration-blue)" />
    {/* Red Fins */}
    <path d="M8.5 16C8.5 16 5 17.5 4 21C4 21 7.5 21 8.5 19V16Z" fill="var(--accent-red)" stroke="var(--illustration-outline)" strokeWidth="0.5" />
    <path d="M15.5 16C15.5 16 19 17.5 20 21C20 21 16.5 21 15.5 19V16Z" fill="var(--accent-red)" stroke="var(--illustration-outline)" strokeWidth="0.5" />
    {/* Porthole */}
    <circle cx="12" cy="10" r="1.5" fill="var(--illustration-blue-light)" stroke="var(--illustration-outline)" strokeWidth="0.5" />
  </svg>
);

const VisionIcon = ({ className }) => (
  <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="200" cy="200" r="180" fill="var(--illustration-cream)" />
    {/* Bulb Frame */}
    <path d="M200 100C165 100 135 128 135 165C135 188 147 208 165 220V260H235V220C253 208 265 188 265 165C265 128 235 100 200 100Z" stroke="var(--secondary-color)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M175 280H225M180 300H220" stroke="var(--secondary-color)" strokeWidth="16" strokeLinecap="round" />
    {/* Paper Plane */}
    <path d="M220 150L300 110L260 190L250 160L220 150Z" fill="var(--secondary-color)" stroke="var(--secondary-color)" strokeWidth="8" />
    <path d="M250 160L300 110" stroke="var(--secondary-color)" strokeWidth="4" />
    {/* Spark Lines */}
    <path d="M200 60V80M275 90L260 105M125 90L140 105" stroke="var(--secondary-color)" strokeWidth="12" strokeLinecap="round" />
  </svg>
);

const MissionIcon = ({ className }) => (
  <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="200" cy="200" r="180" fill="var(--illustration-sky)" />
    <g transform="translate(100, 100) scale(0.5)">
      {/* Target Rings */}
      <circle cx="200" cy="200" r="180" stroke="var(--illustration-blue)" strokeWidth="24" />
      <circle cx="200" cy="200" r="120" stroke="var(--illustration-blue)" strokeWidth="24" />
      <circle cx="200" cy="200" r="60" stroke="var(--illustration-blue)" strokeWidth="24" />
      {/* Arrow */}
      <path d="M40 360L180 220" stroke="var(--illustration-blue)" strokeWidth="24" strokeLinecap="round" />
      <path d="M160 220L185 195L210 220" stroke="var(--illustration-blue)" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" transform="rotate(45 185 195) translate(0, -15)" />
      {/* Fletching */}
      <path d="M40 360L20 380M55 375L35 395M70 390L50 410" stroke="var(--illustration-blue)" strokeWidth="16" strokeLinecap="round" />
    </g>
  </svg>
);

const FlyingRocket = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1 }}
      className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none drop-shadow-[var(--shadow-md)]"
    >
      <CustomRocket className="w-14 h-14" />

      {/* Persistent subtle thrust trail */}
      <motion.div
        animate={{
          scaleY: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3],
          filter: ["blur(1px)", "blur(2px)", "blur(1px)"]
        }}
        transition={{ duration: 0.2, repeat: Infinity }}
        className="absolute top-[85%] left-1/2 -translate-x-1/2 w-2 h-8 origin-top"
      >
        <div className="w-full h-full bg-gradient-to-t from-transparent via-[var(--accent-orange)] to-[var(--accent-red)] rounded-full shadow-[var(--shadow-sm)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-5 bg-[color-mix(in_srgb,var(--text-inverse)_70%,transparent)] rounded-full blur-[0.5px]" />
      </motion.div>
    </motion.div>
  );
};

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [hoverStates, setHoverStates] = useState({
    join: false,
    events: false,
    rocket: false
  });

  const toggleHover = (key, value) => {
    setHoverStates(prev => ({ ...prev, [key]: value }));
  };

  const values = [
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We foster creative thinking and encourage innovative solutions to real-world problems.',
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'We believe in the power of teamwork and building strong entrepreneurial communities.',
    },
    {
      icon: TrendingUp,
      title: 'Growth',
      description: 'We are committed to continuous learning and personal development of our members.',
    },
    {
      icon: Globe,
      title: 'Impact',
      description: 'We strive to create positive change in society through entrepreneurial ventures.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-brand-yellow selection:text-[var(--text-on-brand)] overflow-x-hidden font-sans">
      {/* Hero Section */}
      <section className="min-h-[60vh] md:min-h-screen flex flex-col justify-center pt-32 md:pt-32 pb-12 relative border-b-2 border-[var(--border-subtle)]">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            <h1 className="text-7xl md:text-[12vw] leading-[0.8] font-black tracking-tighter text-transparent stroke-text hover:text-brand-yellow transition-colors duration-500 cursor-default">
              ABOUT<br /><span className="text-[var(--text-primary)]">US</span>
            </h1>
            <div className="flex flex-col md:flex-row justify-between items-end mt-12 gap-8">
              <p className="text-xl md:text-3xl font-bold max-w-2xl leading-relaxed">
                EMPOWERING <span className="text-brand-yellow underline decoration-wavy underline-offset-4 md:underline-offset-8">STUDENTS</span> TO BECOME SUCCESSFUL ENTREPRENEURS.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <FunkyMarquee text="INNOVATION" speed={15} className="bg-brand-yellow text-[var(--text-on-brand)] border-y-4 border-[var(--bg-inverse)] -rotate-1 scale-105 z-20" />

      {/* Overview Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="border-4 border-[var(--border-color)] rounded-[2rem] p-8 md:p-12 relative overflow-hidden bg-[var(--bg-card)] shadow-[var(--shadow-md)]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow rounded-full blur-[100px] opacity-20 pointer-events-none" />

            <h2 className="text-3xl md:text-6xl font-black mb-8 tracking-tighter uppercase">
              DYPIU <span className="text-brand-yellow">E-CELL</span>
            </h2>

            <div className="prose prose-xl prose-invert max-w-none">
              <p className="text-[var(--text-secondary)] font-bold leading-relaxed mb-12">
                A dynamic, student-led platform dedicated to cultivating entrepreneurship and innovation. Our mission is to inspire and support students to explore their entrepreneurial ambitions, develop their ideas, and build sustainable ventures.
              </p>

              <h4 className="text-3xl font-black text-[var(--text-primary)] mb-6 uppercase border-b-4 border-brand-yellow inline-block pb-2">What We Do</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {[
                  { title: "Startup Pitches & Competitions", desc: "We organize pitch events where students showcase their startup ideas to investors and industry leaders." },
                  { title: "Workshops & Mentorship", desc: "We conduct hands-on workshops and connect students with experienced mentors to help refine their business models and strategies." },
                  { title: "Networking Opportunities", desc: "We create spaces for students to meet industry professionals, investors, and fellow entrepreneurs." },
                  { title: "Incubation & Acceleration", desc: "Through strategic partnerships with incubators and accelerators, we support startups in scaling and growth." }
                ].map((item, index) => (
                  <div key={index} className="bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] p-6 rounded-xl hover:border-brand-yellow transition-all hover:shadow-[var(--shadow-md)]">
                    <h5 className="font-black text-brand-yellow mb-2 text-xl uppercase">// {item.title}</h5>
                    <p className="text-[var(--text-secondary)] font-bold">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CIIE Section */}
      <section className="py-12 md:py-20 px-4 bg-[var(--bg-primary)]">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-brand-yellow rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 border-8 border-[var(--bg-inverse)] shadow-[var(--shadow-lg)]"
          >
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-[var(--text-inverse)] rounded-full blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
                <img
                  src="/ciie-logo.png"
                  alt="CIIE Logo"
                  className="relative w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl antialiased"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300?text=CIIE+LOGO";
                  }}
                />
              </div>
            </div>
            <div className="w-full md:w-2/3 text-[var(--text-on-brand)]">
              <h3 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tight">Our Foundation & Mentorship</h3>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-none uppercase tracking-tighter">
                CENTRE FOR INNOVATION <br />
                <span className="text-[var(--text-on-brand)] drop-shadow-[var(--shadow-sm)]">INCUBATION & </span>
                <span className="relative inline-block text-[var(--text-inverse)] drop-shadow-[var(--shadow-sm)] bg-[var(--bg-inverse)] px-4 py-1 -rotate-1 ml-2 mt-2 md:mt-0">
                  ENTREPRENEURSH
                  <span className="relative">
                    I
                    <FlyingRocket />
                  </span>
                  P
                </span>
              </h2>
              <div className="space-y-6">
                <p className="text-xl md:text-2xl font-bold leading-tight">
                  The E-Cell at DYPIU owes its vibrant existence and strategic direction to the Centre for Innovation Incubation and Entrepreneurship (CIIE).
                </p>
                <p className="text-lg md:text-xl font-medium border-l-4 border-[var(--bg-inverse)] pl-6 italic">
                  "CIIE has played the most crucial role in moulding the E-Cell, providing the foundational support, expert mentorship, and the ecosystem necessary for student-led innovation to thrive."
                </p>
                <p className="text-lg md:text-xl font-bold">
                  As our parent body, CIIE continues to bridge the gap between academic learning and real-world entrepreneurial success, empowering us to build a future of innovators.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-[var(--bg-primary)] relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              { title: "MISSION", icon: MissionIcon, desc: "To empower students with knowledge, skills, and mentorship to become future entrepreneurs and job creators." },
              { title: "VISION", icon: VisionIcon, desc: "To create a vibrant ecosystem that nurtures entrepreneurial talent and transforms innovative ideas into successful ventures." }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="bg-[var(--bg-card)] border-4 border-[var(--border-color)] p-10 rounded-[3rem] hover:rotate-2 transition-transform duration-300 group relative overflow-hidden shadow-[var(--shadow-sm)]"
              >
                <div className="w-24 h-24 mb-6 relative z-10">
                  <item.icon className="w-full h-full drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="text-5xl font-black text-[var(--text-primary)] mb-6 uppercase tracking-tighter">{item.title}</h3>
                <p className="text-xl text-[var(--text-secondary)] font-bold leading-relaxed border-l-4 border-brand-yellow pl-6">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FunkyMarquee text="VALUES" direction="right" speed={20} className="bg-[var(--bg-card)] text-[var(--text-primary)] border-y-4 border-[var(--border-color)] rotate-1 scale-105 z-20" />

      {/* Values Section */}
      <section className="py-32 px-4 bg-[var(--bg-primary)]">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-8 rounded-2xl hover:bg-brand-yellow hover:text-[var(--text-on-brand)] transition-colors group"
              >
                <value.icon className="w-12 h-12 text-brand-yellow group-hover:text-[var(--text-on-brand)] mb-6" />
                <h3 className="text-2xl font-black uppercase mb-4">{value.title}</h3>
                <p className="text-[var(--text-secondary)] font-bold group-hover:text-[color-mix(in_srgb,var(--text-on-brand)_80%,transparent)]">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-16 md:py-24 bg-[var(--bg-secondary)] border-t-4 border-[var(--border-color)] relative overflow-hidden text-center">
        <div className="container mx-auto relative z-10 px-4">
          <h2 className="text-6xl md:text-9xl font-black text-[var(--text-primary)] mb-12 tracking-tighter leading-none">
            JOIN THE<br /><span className="text-brand-yellow">REVOLUTION</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/apply">
              <button
                className="w-full sm:w-auto text-xl md:text-2xl font-black bg-brand-yellow text-[var(--text-on-brand)] px-10 py-5 rounded-full border-4 border-[var(--bg-inverse)] hover:bg-[var(--bg-hover)] hover:scale-105 transition-all shadow-[var(--shadow-md)] flex items-center justify-center"
                onMouseEnter={() => toggleHover('join', true)}
                onMouseLeave={() => toggleHover('join', false)}
              >
                <RollingText text="JOIN E-CELL" hover={hoverStates.join} />
              </button>
            </Link>
            <Link to="/events">
              <button
                className="w-full sm:w-auto text-xl md:text-2xl font-black bg-transparent text-[var(--text-primary)] px-10 py-5 rounded-full border-4 border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:scale-105 transition-all shadow-[var(--shadow-md)] flex items-center justify-center"
                onMouseEnter={() => toggleHover('events', true)}
                onMouseLeave={() => toggleHover('events', false)}
              >
                <RollingText text="VIEW EVENTS" hover={hoverStates.events} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default About;
