import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Tag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogDetail3 = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    '/blog/3/1ST.JPG',
    '/blog/3/2ND.JPG',
    '/blog/3/3RD.JPG',
    '/blog/3/4TH.png',
    '/blog/3/5TH.JPG',
    '/blog/3/6TH.JPG',
    '/blog/3/7TH.png',
    '/blog/3/8TH.png',
    '/blog/3/10.JPG'
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  const blog = {
    title: 'E-Cell DYPIU at Entrepreneurship Awareness Drive, Pune – A Step Toward a Stronger Startup Ecosystem',
    author: 'E-Cell DYPIU',
    date: 'October 1, 2025',
    readTime: '7 min read',
    tags: ['Awareness', 'Startup Ecosystem', 'Pune'],
    content: `In the journey of entrepreneurship, awareness and exposure are as essential as innovation and execution. Team E-Cell DYPIU had the privilege of being invited to the Entrepreneurship Awareness Drive (EAD) Pune 2025, hosted by VIT Pune's VEDC in collaboration with IIT Kharagpur — one of India's most influential platforms for fostering startup culture among students.

The event brought together some of the most dynamic Entrepreneurship Cells, mentors, and budding founders from across reputed institutions, creating an ecosystem buzzing with ideas, collaboration, and learning.

A Gathering of Vision and Ambition

The Entrepreneurship Awareness Drive (EAD) is a nationwide initiative by IIT Kharagpur that aims to inspire and educate young minds about the world of entrepreneurship. Each year, it connects aspiring founders, student innovators, and industry experts through a series of sessions, discussions, and networking opportunities.

This year, the Pune chapter, hosted by VIT's VEDC, witnessed an incredible confluence of ideas — where curiosity met experience, and students from across institutions came together to reimagine what entrepreneurship in India can look like.

From keynote sessions by successful founders to interactive discussions on startup ecosystems, funding, and innovation, the event served as a platform for collaboration and learning. The collective enthusiasm in the hall reflected one thing clearly — India's next generation of entrepreneurs is not waiting; they are building.

E-Cell DYPIU's Participation

Representing the innovative spirit of DYPIU, E-Cell DYPIU proudly participated in this remarkable gathering. Our team engaged with founders, mentors, and fellow E-Cell leaders to exchange perspectives on nurturing entrepreneurial mindsets at the college level.

We also shared our recent initiatives — including Illuminate and FinBiz'25 — highlighting how student-led events can bridge the gap between learning and real-world application. Through these discussions, our members gained valuable insights into the latest trends, challenges, and opportunities in India's startup ecosystem.

The interactions not only strengthened our understanding but also opened doors for potential collaborations with other institutions and networks under IIT Kharagpur's EAD initiative.

Building Networks, Creating Impact

The event was a reminder that the true strength of the startup community lies in its collaboration. Beyond individual projects and college initiatives, what truly drives growth is the shared mission to build together.

At EAD Pune, our team connected with representatives from various E-Cells across the city, learning how each institution is tackling the challenges of spreading entrepreneurial awareness. The sessions on innovation, leadership, and real-world execution gave our members actionable takeaways to implement in future E-Cell activities at DYPIU.

We believe these connections will pave the way for joint workshops, mentorship programs, and inter-college startup challenges — initiatives that strengthen the overall entrepreneurial landscape of Pune's student community.`
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-[var(--text-on-brand)] font-sans pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          to="/blogs"
          className="inline-flex items-center text-white hover:text-brand-yellow mb-12 transition-colors font-mono uppercase tracking-widest border-2 border-white/20 px-4 py-2 rounded-full hover:border-brand-yellow hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Blogs
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-zinc-900 border-4 border-white rounded-[2rem] p-8 md:p-12 shadow-[12px_12px_0px_#FFB22C] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4">
            <div className="w-4 h-4 rounded-full bg-brand-yellow border-2 border-white"></div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tighter leading-none">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 mb-12 pb-8 border-b-4 border-white/10 font-mono text-sm md:text-base text-gray-400">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-brand-yellow" />
              <span>{blog.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-brand-yellow" />
              <span>{blog.readTime}</span>
            </div>
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2 text-brand-yellow" />
              <span>{blog.author}</span>
            </div>
          </div>

          {/* Image Slider */}
          <div className="mb-12">
            <div className="relative border-4 border-white bg-black p-2 rounded-xl mb-4 overflow-hidden group">
              <div className="relative w-full h-[500px] flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden">
                <img
                  src={images[currentImageIndex]}
                  alt={`Event photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute bottom-4 right-4 bg-brand-yellow text-[var(--text-on-brand)] font-black px-3 py-1 text-sm border-2 border-black shadow-[4px_4px_0px_black]">
                {currentImageIndex + 1} / {images.length}
              </div>

              <button
                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full border-2 border-white hover:bg-brand-yellow hover:text-[var(--text-on-brand)] transition-colors opacity-0 group-hover:opacity-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full border-2 border-white hover:bg-brand-yellow hover:text-[var(--text-on-brand)] transition-colors opacity-0 group-hover:opacity-100"
              >
                <ArrowLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>

            <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex
                      ? 'border-brand-yellow opacity-100 scale-105'
                      : 'border-zinc-700 opacity-50 hover:opacity-100 hover:border-white'
                    }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            {blog.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-gray-300 mb-6 leading-relaxed font-sans text-lg">
                <span className="text-brand-yellow font-black text-2xl float-left mr-2 leading-none mt-1">{idx === 0 ? paragraph.charAt(0) : ''}</span>
                {idx === 0 ? paragraph.slice(1) : paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t-4 border-white/10">
            <p className="font-mono text-gray-500 uppercase tracking-widest mb-4 text-xs">Tags</p>
            <div className="flex flex-wrap gap-3">
              {blog.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center bg-black border-2 border-white text-white px-4 py-2 rounded-xl text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors cursor-default"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default BlogDetail3;
