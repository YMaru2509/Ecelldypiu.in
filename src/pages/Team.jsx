import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Sparkles,
  Briefcase,
  Shield,
  Code2,
  Megaphone,
  Palette,
  Share2,
  DollarSign,
  Award,
  Instagram,
  ExternalLink,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Marquee Component
const Marquee = ({ text, direction = 'left', speed = 50, className = "" }) => {
  return (
    <div className={`relative flex overflow-hidden py-4 group ${className}`}>
      <div
        className={`flex whitespace-nowrap group-hover:[animation-play-state:paused] ${direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {[...Array(10)].map((_, i) => (
          <span key={i} className="text-6xl md:text-8xl font-black mx-8 uppercase tracking-tighter">
            {text} <span className="text-brand-yellow">•</span>
          </span>
        ))}
      </div>
      <div
        className={`flex whitespace-nowrap group-hover:[animation-play-state:paused] ${direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'} absolute top-4 left-0`}
        style={{ animationDuration: `${speed}s` }}
      >
        {[...Array(10)].map((_, i) => (
          <span key={i} className="text-6xl md:text-8xl font-black mx-8 uppercase tracking-tighter">
            {text} <span className="text-brand-yellow">•</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const departments = [
  { id: 'all', name: 'All Members', icon: Users },
  { id: 'Executive Board', name: 'Executive Board', icon: Award },
  { id: 'Technical Team', name: 'Technical', icon: Code2 },
  { id: 'Corporate Relations Team', name: 'Corporate Relations', icon: Briefcase },
  { id: 'Management Team', name: 'Management', icon: Shield },
  { id: 'Design Team', name: 'Design', icon: Palette },
  { id: 'Social Media Team', name: 'Social Media', icon: Share2 },
  { id: 'Public Relations Team', name: 'PR', icon: Megaphone },
  { id: 'Marketing Team', name: 'Marketing', icon: Sparkles },
  { id: 'Finance Team', name: 'Finance', icon: DollarSign },
];

const teamData = [
  // EXECUTIVE BOARD
  {
    name: 'Yash Maru',
    position: 'President',
    department: 'Executive Board',
    image: '/team/yash-maru.jpeg',
    priority: 1
  },
  {
    name: 'Preet Sonar',
    position: 'Vice-President',
    department: 'Executive Board',
    image: '/team/preet-sonar.jpg',
    priority: 2
  },
  {
    name: 'D Disha Shree',
    position: 'General Secretary',
    department: 'Executive Board',
    image: '/team/d-disha-shree.png',
    priority: 3
  },

  // FINANCE TEAM
  {
    name: 'Shantanu Patil',
    position: 'Treasurer',
    department: 'Finance Team',
    image: '/team/shantanu-patil.jpg',
    priority: 1
  },

  // TECHNICAL TEAM
  {
    name: 'Rigved Aherrao',
    position: 'Tech Lead',
    department: 'Technical Team',
    image: '/team/rigved-aherrao.jpeg',
    priority: 1
  },
  {
    name: 'Yash Tripathi',
    position: 'Tech Secretary',
    department: 'Technical Team',
    image: '/team/yash-tripathi.png',
    priority: 2
  },
  {
    name: 'Diya Rathod',
    position: 'Tech Team Member',
    department: 'Technical Team',
    image: '/team/diya-rathod.jpg',
    priority: 3
  },
  {
    name: 'Krushna Nirmalkar',
    position: 'Tech Team Member',
    department: 'Technical Team',
    image: '/team/krushna-nirmalkar.jpg',
    priority: 4
  },
  {
    name: 'Riya Petle',
    position: 'Tech Team Member',
    department: 'Technical Team',
    image: '/team/riya-petle.jpg',
    priority: 5
  },
  {
    name: 'Aadi Rohankar',
    position: 'Tech Team Member',
    department: 'Technical Team',
    image: '/team/aadi-rohankar.jpeg',
    priority: 6
  },

  // CORPORATE RELATIONS TEAM
  {
    name: 'Ram Mittal',
    position: 'CR Lead',
    department: 'Corporate Relations Team',
    image: '/team/ram-mittal.jpg',
    priority: 1
  },
  {
    name: 'Abhishek Ghate',
    position: 'CR Team Member',
    department: 'Corporate Relations Team',
    image: '/team/abhishek-ghate.jpeg',
    priority: 2
  },
  {
    name: 'Aviraj Raut',
    position: 'CR Team Member',
    department: 'Corporate Relations Team',
    image: '/team/aviraj-raut.png',
    priority: 3
  },
  {
    name: 'Koushal Pratap Singh',
    position: 'CR Team Member',
    department: 'Corporate Relations Team',
    image: '/team/koushal-pratap-singh.jpg',
    priority: 4
  },
  {
    name: 'Ketaki',
    position: 'CR Team Member',
    department: 'Corporate Relations Team',
    image: '/team/ketaki.jpg',
    priority: 5
  },
  {
    name: 'Aaryan Thole',
    position: 'CR Team Member',
    department: 'Corporate Relations Team',
    image: '/team/aaryan-thole.jpg',
    priority: 6
  },

  // MANAGEMENT TEAM
  {
    name: 'Yash Jain',
    position: 'Ops Lead',
    department: 'Management Team',
    image: '/team/yash-jain.jpg',
    priority: 1
  },
  {
    name: 'Nishant Kumar',
    position: 'Ops Secretary',
    department: 'Management Team',
    image: '/team/nishant-kumar.jpg',
    priority: 2
  },
  {
    name: 'Vyom Singhai',
    position: 'Hospitality Lead',
    department: 'Management Team',
    image: '/team/vyom-singhai.jpg',
    priority: 3
  },
  {
    name: 'Krushna Patil',
    position: 'Hospitality Secretary',
    department: 'Management Team',
    image: '/team/krushna-patil.png',
    priority: 4
  },
  {
    name: 'Israr Sheikh',
    position: 'Security Joint-Lead',
    department: 'Management Team',
    image: '/team/israr-sheikh.jpg',
    priority: 5
  },
  {
    name: 'Amey Mode',
    position: 'Security Joint-Lead',
    department: 'Management Team',
    image: '/team/amey-mode.png',
    priority: 6
  },
  {
    name: 'Soham Raut',
    position: 'Management Team Member',
    department: 'Management Team',
    image: '/team/soham-raut.jpg',
    priority: 7
  },
  {
    name: 'Harshit Barde',
    position: 'Management Team Member',
    department: 'Management Team',
    image: '/team/harshit-barde.png',
    priority: 8
  },
  {
    name: 'Rohan Rijhwani',
    position: 'Management Team Member',
    department: 'Management Team',
    image: '/team/rohan-rijhwani.jpg',
    priority: 9
  },
  {
    name: 'Suman',
    position: 'Management Team Member',
    department: 'Management Team',
    image: '/team/suman.jpg',
    priority: 10
  },
  {
    name: 'Prince Jha',
    position: 'Management Team Member',
    department: 'Management Team',
    image: '/team/prince-jha.jpg',
    priority: 11
  },
  {
    name: 'Sarthak Saoji',
    position: 'Management Team Member',
    department: 'Management Team',
    image: '/team/sarthak-saoji.png',
    priority: 12
  },
  {
    name: 'Sharvari Burle',
    position: 'Management Team Member',
    department: 'Management Team',
    image: '/team/sharvari-burle.jpg',
    priority: 13
  },
  {
    name: 'Madhura Joshi',
    position: 'Management Team Member',
    department: 'Management Team',
    image: '/team/madhura-joshi.jpg',
    priority: 14
  },
  {
    name: 'Sneha Kelzarkar',
    position: 'Anchor',
    department: 'Management Team',
    image: '/team/sneha-kelzarkar.jpeg',
    priority: 15
  },

  // DESIGN TEAM
  {
    name: 'Bhavika Deshmukh',
    position: 'Design Lead',
    department: 'Design Team',
    image: '/team/bhavika-deshmukh.png',
    priority: 1
  },
  {
    name: 'Om Joshi',
    position: 'Design Secretary',
    department: 'Design Team',
    image: '/team/om-joshi.jpg',
    priority: 2
  },
  {
    name: 'Aarushi Jain',
    position: 'Design Team Member',
    department: 'Design Team',
    image: '/team/aarushi-jain.jpg',
    priority: 3
  },
  {
    name: 'Diya Bagul',
    position: 'Design Team Member',
    department: 'Design Team',
    image: '/team/diya-bagul.jpg',
    priority: 4
  },
  {
    name: 'Krutika Ashapure',
    position: 'Design Team Member',
    department: 'Design Team',
    image: '/team/krutika-ashapure.jpg',
    priority: 5
  },
  {
    name: 'Pranjal',
    position: 'Design Team Member',
    department: 'Design Team',
    image: '/team/pranjal.jpg',
    priority: 6
  },
  {
    name: 'Palak Kariya',
    position: 'Design Team Member',
    department: 'Design Team',
    image: '/team/palak-kariya.jpg',
    priority: 7
  },

  // SOCIAL MEDIA TEAM
  {
    name: 'Sharvari Khandait',
    position: 'Social Media Lead',
    department: 'Social Media Team',
    image: '/team/sharvari-khandait.jpg',
    priority: 1
  },
  {
    name: 'Samikshit Ghule',
    position: 'Social Media Secretary',
    department: 'Social Media Team',
    image: '/team/samikshit-ghule.jpg',
    priority: 2
  },
  {
    name: 'Almeer Khan',
    position: 'Social Media Team Member',
    department: 'Social Media Team',
    image: '/team/almeer-khan.jpg',
    priority: 3
  },
  {
    name: 'Pawani Sharma',
    position: 'Social Media Team Member',
    department: 'Social Media Team',
    image: '/team/pawani-sharma.jpg',
    priority: 4
  },
  {
    name: 'Viral Babariya',
    position: 'Social Media Team Member',
    department: 'Social Media Team',
    image: '/team/viral-babariya.jpg',
    priority: 5
  },
  {
    name: 'Sankalp',
    position: 'Social Media Team Member',
    department: 'Social Media Team',
    image: '/team/sankalp.png',
    priority: 6
  },

  // PUBLIC RELATIONS TEAM
  {
    name: 'Yash Pawar',
    position: 'PR Lead',
    department: 'Public Relations Team',
    image: '/team/yash-pawar.jpeg',
    priority: 1
  },
  {
    name: 'Swara Pusalkar',
    position: 'PR Joint-Secretary',
    department: 'Public Relations Team',
    image: '/team/swara-pusalkar.jpg',
    priority: 2
  },
  {
    name: 'Kali Kanungo',
    position: 'PR Joint-Secretary',
    department: 'Public Relations Team',
    image: '/team/kali-kanungo.jpg',
    priority: 3
  },
  {
    name: 'Shravani Sakunde',
    position: 'PR Team Member',
    department: 'Public Relations Team',
    image: '/team/shravani-sakunde.jpeg',
    priority: 4
  },

  // MARKETING TEAM
  {
    name: 'Pranav Batheja',
    position: 'Marketing Lead',
    department: 'Marketing Team',
    image: '/team/pranav-batheja.jpeg',
    priority: 1
  },
  {
    name: 'Sanskruti Amdare',
    position: 'Marketing Secretary',
    department: 'Marketing Team',
    image: '/team/sanskruti-amdare.png',
    priority: 2
  },
  {
    name: 'Anwesha Sahay',
    position: 'Marketing Team Member',
    department: 'Marketing Team',
    image: '/team/anwesha-sahay.jpg',
    priority: 3
  },
  {
    name: 'Disha Sachdev',
    position: 'Marketing Team Member',
    department: 'Marketing Team',
    image: '/team/disha-sachdev.jpg',
    priority: 4
  },
  {
    name: 'Priyal Bisen',
    position: 'Marketing Team Member',
    department: 'Marketing Team',
    image: '/team/priyal-bisen.jpg',
    priority: 5
  },
  {
    name: 'Mitali Lodh',
    position: 'Marketing Team Member',
    department: 'Marketing Team',
    image: '/team/mitali-lodh.jpeg',
    priority: 6
  },
  {
    name: 'Devesh Sankhla',
    position: 'Marketing Team Member',
    department: 'Marketing Team',
    image: '/team/devesh-sankhla.jpg',
    priority: 7
  },
  {
    name: 'Vanshika Kanojiya',
    position: 'Marketing Team Member',
    department: 'Marketing Team',
    image: '/team/vanshika-kanojiya.jpg',
    priority: 8
  }
];

const mentor = {
  name: 'Dr. Sandhya Ingale',
  position: 'Experienced Mentor',
  department: 'Faculty Advisor',
  bio: 'Distinguished academic and industry expert guiding the next generation of leaders.',
  image: '/SANDHYA INGLE.jpeg',
  achievements: [
    'Academic Leadership', 'Innovation Expert', 'Visionary', 'Student Mentor'
  ]
};

// Team Member Card Component
const MemberCard = ({ member, index }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [member.image]);

  // Get initials for fallback avatar
  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -8 }}
      className="group relative"
    >
      {/* Card Box with Neo-brutalist Shadow and Border */}
      <div className="bg-[var(--bg-card)] border-2 md:border-4 border-[var(--border-color)] rounded-2xl md:rounded-[2rem] overflow-hidden relative shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-brand-yellow transition-all duration-300 flex flex-col h-full">
        
        {/* Image / Avatar Container */}
        <div className="flex-1 aspect-[4/5] relative overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center">
          {member.image && !imgError ? (
            <>
              <img
                src={member.image}
                alt={member.name}
                onError={() => setImgError(true)}
                loading="lazy"
                style={{ objectPosition: `${member.avatarPosition?.x ?? 50}% ${member.avatarPosition?.y ?? 50}%` }}
                className="w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-105 filter group-hover:contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-inverse)] via-[color-mix(in_srgb,var(--bg-inverse)_30%,transparent)] to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-300 z-10" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--bg-hover)] via-[var(--bg-card)] to-[var(--bg-primary)] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--primary-color)_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-brand-yellow text-[var(--text-on-brand)] flex items-center justify-center text-xl md:text-3xl font-black font-mono border-2 md:border-4 border-[var(--bg-inverse)] shadow-[var(--shadow-sm)] mb-2 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                {getInitials(member.name)}
              </div>
              <Users className="w-5 h-5 text-brand-yellow opacity-40" />
            </div>
          )}
          {member.instagramUrl && (
            <a
              href={member.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 z-20 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-pink-600/90 text-white flex items-center justify-center border border-white/40 hover:bg-pink-500 hover:scale-110 transition-all shadow-lg"
              title="Instagram Profile"
            >
              <Instagram className="w-4 h-4 md:w-5 md:h-5" />
            </a>
          )}
        </div>

        {/* Info Banner at Bottom */}
        <div className="p-2.5 sm:p-4 md:p-5 z-20 bg-[color-mix(in_srgb,var(--bg-card)_90%,transparent)] backdrop-blur-md border-t-2 md:border-t-4 border-[var(--border-color)] group-hover:border-brand-yellow transition-colors duration-300 flex flex-col justify-center">
          <h3 className="text-xs sm:text-lg md:text-2xl font-black uppercase italic tracking-tight text-[var(--text-primary)] mb-0.5 md:mb-1 group-hover:text-brand-yellow transition-colors duration-300 line-clamp-2 leading-tight sm:leading-snug">
            {member.name}
          </h3>
          <p className="text-brand-yellow font-mono font-bold tracking-tight sm:tracking-wider text-[9px] sm:text-xs md:text-sm uppercase flex items-start gap-1 leading-tight">
            <span className="inline-block w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-yellow rounded-full animate-pulse flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{member.position}</span>
          </p>
          {member.joiningDate && (
            <p className="text-zinc-400 font-mono text-[9px] sm:text-xs flex items-center gap-1 mt-1 font-semibold">
              <Calendar className="w-3 h-3 text-brand-yellow flex-shrink-0" />
              <span>Joined {member.joiningDate}</span>
            </p>
          )}
        </div>

      </div>
    </motion.div>
  );
};

const staticImageMap = teamData.reduce((acc, m) => {
  if (m.name && m.image) {
    acc[m.name.toLowerCase().trim()] = m.image;
  }
  return acc;
}, {});

const BOARD_TAB = { id: 'board', name: 'Board', icon: ShieldCheck };

const Team = () => {
  const containerRef = useRef(null);
  const [selectedDept, setSelectedDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Starts as the static roster (never empty) and legacy department tabs; both get
  // replaced automatically, once, if real onboarded core members exist — no manual
  // switch needed. This also means every member's own uploaded profile photo
  // (avatarUrl) becomes their Team page image the moment they're live.
  const [teamMembers, setTeamMembers] = useState(teamData.map((m) => ({ ...m, tabIds: [m.department] })));
  const [activeTabs, setActiveTabs] = useState(departments);
  // Keys the member grid so switching from the static fallback to the live
  // roster (or vice versa) is a clean remount instead of an AnimatePresence
  // item-by-item diff — the two datasets share no stable keys, so diffing
  // them as "56 exits + 1 enter" is both meaningless and, under CSS grid
  // `layout` animations, prone to never fully settling.
  const [dataSource, setDataSource] = useState('static');

  useEffect(() => {
    // React StrictMode double-invokes effects in dev (mount → cleanup → mount),
    // and with two unguarded async branches racing on setState, the slower one
    // can win regardless of which was correct. `cancelled` makes the cleanup
    // from the first invocation void its own in-flight writes.
    let cancelled = false;

    const fetchDynamicRoster = async () => {
      const rosterRes = await fetch('/api/panel-users?action=public-roster');
      const rosterData = await rosterRes.json();
      const dynamicMembers = rosterRes.ok ? (rosterData.members || []) : [];
      if (dynamicMembers.length === 0) return false; // not ready yet — caller falls back to legacy

      const verticalsRes = await fetch('/api/attendance?action=verticals-public');
      const verticalsData = await verticalsRes.json();
      const verticals = verticalsRes.ok ? (verticalsData.verticals || []) : [];

      if (cancelled) return true;
      setActiveTabs([
        { id: 'all', name: 'All Members', icon: Users },
        BOARD_TAB,
        ...verticals.map((v) => ({ id: v.id, name: v.name, icon: Users })),
      ]);
      setTeamMembers(dynamicMembers.map((m) => ({
        uid: m.uid,
        name: m.name,
        position: m.publicTitle,
        image: m.avatarUrl, // the member's own onboarding-uploaded profile photo
        avatarPosition: m.avatarPosition || { x: 50, y: 50 },
        tabIds: [
          ...(m.verticals || []),
          ...((m.roles || []).includes('board_member') || (m.roles || []).includes('system_owner') ? ['board'] : []),
        ],
      })));
      setDataSource('dynamic');
      return true;
    };

    const fetchLegacyRoster = async () => {
      try {
        const response = await fetch('/api/team');
        const data = await response.json();
        if (cancelled) return;
        if (data.team && data.team.length > 0) {
          const enriched = data.team.map((m) => ({
            ...m,
            tabIds: [m.department],
            image: (m.image && m.image.trim() && !m.image.includes('placeholder'))
              ? m.image
              : staticImageMap[(m.name || '').toLowerCase().trim()] || ''
          }));

          if (enriched.length < teamData.length) {
            const dbNames = new Set(enriched.map((m) => (m.name || '').toLowerCase().trim()));
            const missingStatic = teamData
              .filter((m) => !dbNames.has(m.name.toLowerCase().trim()))
              .map((m) => ({ ...m, tabIds: [m.department] }));
            setTeamMembers([...enriched, ...missingStatic]);
          } else {
            setTeamMembers(enriched);
          }
          setDataSource('legacy');
        }
      } catch (err) {
        console.warn('Falling back to default team members:', err);
      }
    };

    (async () => {
      const switchedToDynamic = await fetchDynamicRoster().catch(() => false);
      if (!switchedToDynamic && !cancelled) await fetchLegacyRoster();
    })();

    return () => { cancelled = true; };
  }, []);

  // Filter members based on department/vertical/board tab and search query
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesDept = selectedDept === 'all' || member.tabIds.includes(selectedDept);
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesDept;

      const nameMatch = (member.name || '').toLowerCase().includes(query);
      const posMatch = (member.position || '').toLowerCase().includes(query);

      return matchesDept && (nameMatch || posMatch);
    });
  }, [teamMembers, selectedDept, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-brand-yellow selection:text-[var(--text-on-brand)] overflow-x-hidden" ref={containerRef}>

      {/* 1. HERO SECTION */}
      <section className="min-h-[50vh] md:min-h-[65vh] flex flex-col justify-center pt-32 pb-12 relative border-b-2 border-[var(--border-subtle)]">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "circOut" }}
          >
            <h1 className="text-7xl md:text-[11vw] leading-[0.85] font-black tracking-tighter text-transparent stroke-text hover:text-brand-yellow transition-colors duration-500 cursor-default">
              THE<br /><span className="text-[var(--text-primary)]">SQUAD</span>
            </h1>

            <div className="mt-8 md:mt-12">
              <p className="text-xl md:text-4xl font-bold max-w-2xl leading-tight">
                WE ARE THE <span className="text-brand-yellow underline decoration-wavy underline-offset-8">ARCHITECTS</span> OF INNOVATION AT DYPIU.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. MARQUEE SEPARATOR */}
      <section className="theme-marquee bg-brand-yellow text-[var(--text-on-brand)] border-y-4 border-[var(--bg-inverse)] -rotate-1 scale-105 z-20 relative shadow-[var(--shadow-lg)]">
        <Marquee text="LEADERS • INNOVATORS • BUILDERS • VISIONARIES" speed={50} />
      </section>

      {/* 3. MENTOR SECTION */}
      <section className="py-8 md:py-28 px-4 relative">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-stretch border-2 md:border-4 border-[var(--border-color)] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-[var(--shadow-lg)]">
            {/* Image Side */}
            <div className="md:w-1/2 relative h-64 sm:h-80 md:h-auto md:min-h-[500px] border-b-2 md:border-b-0 md:border-r-4 border-[var(--border-color)] overflow-hidden group bg-[var(--bg-card)]">
              <img
                src={mentor.image}
                alt={mentor.name}
                className="w-full h-full object-cover object-top transition-all duration-500 scale-100 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 md:top-auto md:bottom-6 md:left-6 z-20">
                <span className="inline-block bg-brand-yellow text-[var(--text-on-brand)] px-3.5 py-1.5 md:px-8 md:py-4 text-xs md:text-3xl font-black font-mono uppercase rounded-xl md:rounded-2xl border-2 md:border-4 border-[var(--bg-inverse)] shadow-[var(--shadow-md)]">
                  THE MENTOR
                </span>
              </div>
            </div>

            {/* Content Side */}
            <div className="md:w-1/2 p-5 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-[var(--bg-card)] overflow-hidden">
              <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-3 sm:mb-6 tracking-tighter leading-tight md:leading-[0.9]">
                DR. SANDHYA <span className="text-stroke-yellow text-transparent">INGALE</span>
              </h2>
              <p className="text-xs sm:text-base md:text-2xl font-bold text-[var(--text-secondary)] mb-4 sm:mb-8 border-l-3 sm:border-l-4 border-brand-yellow pl-3 sm:pl-6 leading-relaxed">
                {mentor.bio}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {mentor.achievements.map((tag, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer bg-[color-mix(in_srgb,var(--bg-secondary)_50%,transparent)] border border-[var(--border-color)] p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:border-brand-yellow transition-all">
                    <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-brand-yellow rotate-45 group-hover:scale-125 transition-transform flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-wide font-bold text-[var(--text-secondary)] group-hover:text-brand-yellow transition-colors">{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE TEAM SECTION */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto">
          
          {/* Section Header */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center text-center mb-12"
          >
            <h2 className="bg-brand-yellow text-[var(--text-on-brand)] px-8 md:px-14 py-4 md:py-6 text-3xl md:text-6xl font-black tracking-tighter uppercase rounded-2xl border-4 border-[var(--bg-inverse)] shadow-[var(--shadow-md)] mb-6">
              CORE MEMBERS
            </h2>
            <p className="text-[var(--text-secondary)] font-bold max-w-xl text-base md:text-lg">
              Meet the dynamic minds leading teams across Executive, Tech, CR, Management, Design, Media, PR, and Marketing.
            </p>
          </motion.div>

          {/* Search & Department Filter Tabs */}
          <div className="mb-12 space-y-6">
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <Search className="w-5 h-5 text-[var(--text-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, role, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] focus:border-brand-yellow text-[var(--text-primary)] pl-12 pr-4 py-3.5 rounded-full outline-none font-medium transition-all shadow-[var(--shadow-sm)] focus:shadow-[var(--shadow-md)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono uppercase bg-[var(--bg-hover)] hover:bg-brand-yellow hover:text-[var(--text-on-brand)] px-2.5 py-1 rounded-full transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Department Filter Pills */}
            <div className="hidden md:flex flex-wrap justify-center gap-2 md:gap-3 max-w-5xl mx-auto">
              {activeTabs.map((dept) => {
                const isSelected = selectedDept === dept.id;
                const count = dept.id === 'all'
                  ? teamMembers.length
                  : teamMembers.filter(m => m.tabIds.includes(dept.id)).length;

                return (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs md:text-sm font-bold uppercase transition-all duration-300 border-2 ${
                      isSelected
                        ? 'bg-brand-yellow text-[var(--text-on-brand)] border-[var(--bg-inverse)] shadow-[var(--shadow-sm)] scale-105'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-brand-yellow hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <dept.icon className="w-3.5 h-3.5" />
                    <span>{dept.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isSelected ? 'theme-brand-on-inverse bg-[var(--bg-inverse)] text-brand-yellow' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex justify-between items-center mb-8 px-2 border-b border-[var(--border-color)] pb-4">
            <div className="text-sm font-mono uppercase text-[var(--text-muted)]">
              Showing <span className="text-brand-yellow font-bold">{filteredMembers.length}</span> members
              {selectedDept !== 'all' && (
                <span> in <span className="text-[var(--text-primary)] font-bold">{activeTabs.find((d) => d.id === selectedDept)?.name}</span></span>
              )}
              {searchQuery && (
                <span> matching "<span className="text-brand-yellow font-bold">{searchQuery}</span>"</span>
              )}
            </div>
            {(selectedDept !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedDept('all');
                  setSearchQuery('');
                }}
                className="text-xs font-mono uppercase text-brand-yellow hover:underline flex items-center gap-1"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Members Grid */}
          {filteredMembers.length > 0 ? (
            <motion.div
              key={dataSource}
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member, index) => (
                  <MemberCard key={member.uid || member.name} member={member} index={index} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-[color-mix(in_srgb,var(--bg-card)_50%,transparent)] border-2 border-dashed border-[var(--border-color)] rounded-3xl p-8">
              <Users className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase mb-2">No Members Found</h3>
              <p className="text-[var(--text-secondary)] mb-6">Try searching with a different keyword or resetting filters.</p>
              <button
                onClick={() => {
                  setSelectedDept('all');
                  setSearchQuery('');
                }}
                className="bg-brand-yellow text-[var(--text-on-brand)] font-black font-mono uppercase px-6 py-3 rounded-full border-2 border-[var(--bg-inverse)] shadow-[var(--shadow-sm)] hover:scale-105 transition-all"
              >
                Show All Members
              </button>
            </div>
          )}

        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-16 md:py-24 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-center relative overflow-hidden">
        <Marquee text="JOIN US " direction="right" speed={40} className="absolute top-4 opacity-20" />
        <Marquee text="BECOME A LEADER " direction="left" speed={50} className="absolute bottom-4 opacity-20" />

        <div className="container mx-auto relative z-10 px-4">
          <h2 className="text-5xl md:text-8xl font-black mb-8 md:mb-10 tracking-tighter">
            READY TO <span className="outline-text">LEAD?</span>
          </h2>
          <p className="text-lg md:text-2xl font-bold max-w-xl mx-auto mb-8 text-[var(--text-secondary)]">
            Be a part of the vibrant entrepreneurial ecosystem at DYPIU and shape tomorrow's innovators.
          </p>
          <Link to="/apply">
            <button className="text-xl md:text-3xl font-black bg-brand-yellow text-[var(--text-on-brand)] px-10 md:px-16 py-5 md:py-7 rounded-full border-4 border-[var(--bg-inverse)] hover:bg-[var(--bg-inverse)] hover:text-[var(--text-inverse)] hover:scale-105 transition-all duration-300 shadow-[var(--shadow-lg)]">
              APPLY NOW!
            </button>
          </Link>
        </div>
      </section>

      {/* Custom Styles for Stroke Text */}
      <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px var(--text-primary);
        }
        .text-stroke-yellow {
          -webkit-text-stroke: 2px var(--primary-color);
        }
        .outline-text {
          -webkit-text-stroke: 2px var(--text-primary);
          color: transparent;
        }
      `}</style>

    </div>
  );
};

export default Team;
