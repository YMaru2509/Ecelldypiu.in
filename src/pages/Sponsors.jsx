
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import FunkyMarquee from '../components/FunkyMarquee';

const Sponsors = () => {
  const sponsors = [
    {
      name: 'Wet N Joy',
      logo: '/wetnjoy-logo.png',
      website: 'https://www.lonavala.wetnjoy.in/'
    },
    {
      name: 'Surya Electronics',
      logo: '/Surya Logo web.png',
      website: 'https://www.suryaelectronics.in/'
    },
    {
      name: 'Campus Times',
      logo: '/SPONSORS/campustimes logo.jpg',
      website: 'https://www.campustimespune.com/'
    },
    {
      name: 'Deccan Spice',
      logo: '/SPONSORS/deccan logo.jpeg.jpg',
      website: 'https://www.google.com/maps?s=web&lqi=CgxkZWNjYW4gc3BpY2UiA4gBAUiRio_Zw72AgAhaFhAAEAEYABgBIgxkZWNjYW4gc3BpY2WSARFpbmRpYW5fcmVzdGF1cmFudKoBVgoNL2cvMTFma3l5YmIyeRABKhAiDGRlY2NhbiBzcGljZSgAMh8QASIb5spV6LKgvGErouzAXEX61Egks9hGKEq1n-2vMhAQAiIMZGVjY2FuIHNwaWNl&vet=12ahUKEwiK7IDU1t2QAxVeUGwGHXD9AIcQ1YkKegQIGxAB..i&cs=1&um=1&ie=UTF-8&fb=1&gl=in&sa=X&geocode=KZOybEcAscI7Mfq-Yx9k4hrY&daddr=Shop+No+14,+K-Town+Flow,+Kiwale,+Pune,+Dehu+Road,+Maharashtra+412101'
    },
    {
      name: 'URUS',
      logo: '/SPONSORS/urus.png',
      website: 'https://www.google.com/maps?sca_esv=45af21cbca4aa7f8&gs_lp=Egxnd3Mtd2l6LXNlcnAiCVVSVVMgTUFIQSoCCAAyDhAuGIAEGMcBGI4FGK8BMgYQABgWGB4yBhAAGBYYHjIGEAAYFhgeMggQABgWGAoYHjIGEAAYFhgeMgYQABgWGB4yBhAAGBYYHjICECYyAhAmMh0QLhiABBjHARiOBRivARiXBRjcBBjeBBjgBNgBAUiGKFDqGli4IHABeAGQAQCYAZQBoAGNBaoBAzAuNbgBA8gBAPgBAZgCBqACoAXCAgoQABiwAxjWBBhHwgINEAAYgAQYsAMYQxiKBcICDRAAGIAEGLEDGEMYigXCAgoQABiABBhDGIoFwgIFEAAYgATCAgsQABiABBiRAhiKBZgDAIgGAZAGCroGBggBEAEYFJIHAzEuNaAHki2yBwMwLjW4B54FwgcFMC4zLjPIBw4&um=1&ie=UTF-8&fb=1&gl=in&sa=X&geocode=KZsASzjbucI7MUY7BLHyIqPB&daddr=Suvery+no.+173/1,+Opp+Raaga+Imperio,+Aundh-Ravet,+BRT+Road,+Tathawade,+Pune,+Maharashtra+411033'
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-[var(--text-on-brand)] font-sans overflow-x-hidden">

      {/* Hero Section */}
      <section className="min-h-[60vh] md:min-h-screen flex flex-col justify-center pt-32 md:pt-32 pb-12 relative border-b-2 border-white/10">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          >
            <h1 className="text-7xl md:text-[12vw] leading-[0.8] font-black tracking-tighter text-transparent stroke-text hover:text-brand-yellow transition-colors duration-500 cursor-default">
              OUR<br /><span className="text-white">PARTNERS</span>
            </h1>

            <p className="text-xl md:text-3xl font-bold max-w-3xl mt-12 leading-tight">
              POWERING <span className="text-brand-yellow underline decoration-wavy underline-offset-8">INNOVATION</span> TOGETHER.
            </p>
          </motion.div>
        </div>
      </section>

      <FunkyMarquee text="SPONSORS" speed={20} className="bg-brand-yellow text-[var(--text-on-brand)] border-y-4 border-black -rotate-1 scale-105 z-20" />

      {/* Sponsors Grid */}
      <section className="py-12 md:py-32 px-4 bg-zinc-900 border-t-4 border-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {sponsors.map((sponsor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10, rotate: index % 2 === 0 ? 2 : -2 }}
                transition={{ duration: 0.4 }}
                className="bg-black p-8 rounded-[2rem] border-4 border-white shadow-[10px_10px_0px_#FFB22C] group"
              >
                <a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full flex flex-col items-center"
                >
                  <div className="w-full h-48 bg-white rounded-xl flex items-center justify-center p-6 border-4 border-black mb-6 group-hover:bg-brand-yellow transition-colors duration-300">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <span className="hidden w-full h-full flex items-center justify-center font-black text-2xl text-black">
                      {sponsor.name}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black uppercase text-center group-hover:text-brand-yellow transition-colors">
                    {sponsor.name}
                  </h3>
                  <div className="mt-4 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                    <span className="font-bold mr-2">VISIT WEBSITE</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white text-black text-center relative overflow-hidden">
        <div className="container mx-auto relative z-10 px-4">
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
            BECOME A <span className="text-brand-yellow stroke-black">SPONSOR</span>
          </h2>
          <Link
            to="/contact"
            className="text-xl md:text-3xl font-black bg-black text-white px-12 py-6 rounded-full border-4 border-transparent hover:bg-brand-yellow hover:text-[var(--text-on-brand)] hover:border-black transition-all shadow-[8px_8px_0px_#FFB22C] inline-flex items-center gap-4"
          >
            GET IN TOUCH
            <Star className="w-8 h-8 fill-current" />
          </Link>
        </div>
      </section>

      <style>{`
        .stroke-text {
          -webkit-text-stroke: 2px white;
        }
        .stroke-black {
           -webkit-text-stroke: 2px black;
           color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Sponsors;
