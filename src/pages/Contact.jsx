
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import FunkyMarquee from '../components/FunkyMarquee';
import {
  Mail,
  MapPin,
  Instagram,
  Linkedin,
  MessageCircle,
  ArrowUpRight
} from 'lucide-react';

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      details: 'Ecell@dypiu.ac.in',
      link: 'mailto:Ecell@dypiu.ac.in',
      button: 'SEND MAIL'
    },
    {
      icon: Instagram,
      title: 'Follow Us',
      details: '@ecell.dypiu',
      link: 'https://www.instagram.com/ecell.dypiu?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
      button: 'FOLLOW'
    },
    {
      icon: Linkedin,
      title: 'Connect',
      details: 'E-Cell DYPIU',
      link: 'https://www.linkedin.com/company/ecell-dypiu/posts/?feedView=all',
      button: 'CONNECT'
    },
    {
      icon: MessageCircle,
      title: 'Join Community',
      details: 'WhatsApp Group',
      link: 'https://chat.whatsapp.com/LlZrAibpCEdBrnpDwrGaQT?mode=wwt',
      button: 'JOIN NOW'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-black font-sans overflow-x-hidden">

      {/* Hero Section */}
      <section className="min-h-[60vh] md:min-h-screen flex flex-col justify-center pt-32 md:pt-32 pb-12 relative border-b-4 border-white">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            <h1 className="text-7xl md:text-[12vw] leading-[0.8] font-black tracking-tighter text-transparent stroke-text hover:text-brand-yellow transition-colors duration-500 cursor-default">
              GET IN<br /><span className="text-white">TOUCH</span>
            </h1>
            <div className="mt-12 pl-4 border-l-8 border-brand-yellow flex flex-col md:flex-row md:items-center gap-8">
              <p className="text-xl md:text-3xl font-bold uppercase">
                Ready to start something <span className="text-brand-yellow underline decoration-wavy">BIG?</span>
              </p>
              <Link to="/apply">
                <button className="text-lg md:text-xl font-black bg-brand-yellow text-black px-8 py-4 rounded-full border-4 border-black hover:bg-white hover:scale-105 transition-all shadow-[4px_4px_0px_white] whitespace-nowrap">
                  APPLY NOW
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <FunkyMarquee text="CONNECT" direction="right" speed={20} className="bg-white text-black border-y-4 border-black rotate-1 scale-105 z-20" />

      {/* Info Grid */}
      <section className="py-12 md:py-20 px-4 bg-zinc-900 border-t-4 border-black">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="bg-black border-4 border-zinc-800 p-8 rounded-[2rem] hover:border-brand-yellow hover:shadow-[8px_8px_0px_#FFB22C] transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 border-4 border-black group-hover:bg-brand-yellow transition-colors">
                  <info.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-2">{info.title}</h3>
                <p className="text-gray-400 font-mono mb-8 font-bold">{info.details}</p>

                <a href={info.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-lg font-black uppercase hover:text-brand-yellow transition-colors">
                  {info.button} <ArrowUpRight className="ml-2 w-5 h-5" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section - Brutalist Map Card */}
      <section className="py-12 md:py-20 px-4 bg-black">
        <div className="container mx-auto">
          <div className="bg-zinc-900 border-4 border-white p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1">
                <h2 className="text-4xl md:text-6xl font-black mb-8 uppercase tracking-tighter">
                  VISIT <span className="text-brand-yellow">HQ</span>
                </h2>
                <p className="text-xl md:text-2xl font-bold text-gray-300 mb-8 leading-relaxed">
                  D Y Patil International University<br />
                  Sector 29, Pradhikaran, Nigdi,<br />
                  Akurdi, Pune 411044
                </p>
                <a href="https://maps.app.goo.gl/Hqh4zbbnfpexfRpc8" target="_blank" rel="noopener noreferrer" className="bg-brand-yellow text-black text-xl font-black px-8 py-4 border-4 border-black hover:bg-white transition-colors inline-block">
                  GET DIRECTIONS
                </a>
              </div>
              <div className="flex-1 w-full h-80 bg-zinc-800 border-4 border-zinc-600 rounded-3xl overflow-hidden relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4484.3036780073235!2d73.75667057579898!3d18.645997365329716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b9f02f4b8f47%3A0x994b7c247d09fde!2sD.%20Y.%20Patil%20International%20University!5e1!3m2!1sen!2sin!4v1769798073225!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px white;
        }
      `}</style>
    </div>
  );
};

export default Contact;