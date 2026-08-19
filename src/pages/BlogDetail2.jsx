import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Tag, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogDetail2 = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    '/blog/2/1ST  COEP.JPG',
    '/blog/2/2ND COEP.JPG',
    '/blog/2/3RD COEP.JPG',
    '/blog/2/4TH COEP.JPG',
    '/blog/2/5TH COEP.JPG',
    '/blog/2/6TH COEP.JPG'
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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
    title: 'E-Cell DYPIU at COEP Pune E-Cell Meetup: Uniting Entrepreneurial Minds Across Pune',
    author: 'E-Cell Team',
    date: 'September 27, 2025',
    readTime: '6 min read',
    tags: ['Meetup', 'Networking', 'COEP Pune'],
    content: `Entrepreneurship begins with collaboration — and when some of the brightest young innovators gather under one roof, powerful ideas take shape. Team E-Cell DYPIU was recently invited to the COEP Pune E-Cell Meetup, an exclusive convergence of Entrepreneurship Cells from leading institutions across Pune. The event served as a melting pot of ideas, strategies, and partnerships, all centered around one shared mission — strengthening the startup ecosystem among students.

A Gathering of Visionaries

The meetup brought together E-Cell representatives from renowned universities and colleges across Pune, creating an atmosphere buzzing with creativity and leadership. It wasn't just another networking event — it was a meaningful exchange of thoughts, experiences, and initiatives that each E-Cell has been driving in their campuses.

From discussions on how to foster entrepreneurial thinking at the grassroots level to exploring collaboration models for inter-college events and startup programs, the sessions reflected the enthusiasm and dedication of every participant. Each E-Cell brought its own perspective, adding value to the collective vision of nurturing innovation and entrepreneurship in the student community.

E-Cell DYPIU's Presence and Contribution

Representing DYPIU's spirit of innovation and collaboration, E-Cell DYPIU actively engaged in discussions, shared insights from its flagship events like Illuminate and FinBiz'25, and presented ideas on how joint initiatives between Pune E-Cells can amplify student opportunities.

Our representatives emphasized the importance of experiential learning — how workshops, startup challenges, and mentorship sessions play a crucial role in converting ideas into sustainable ventures. The interaction also opened doors for future partnerships with other E-Cells, aiming to co-create platforms where student founders can learn, compete, and grow together.

Learning, Collaboration, and Future Opportunities

The meetup wasn't only about showcasing what each E-Cell has achieved — it was about what we can build together. Through brainstorming sessions, idea exchanges, and panel discussions, the event highlighted the need for stronger collaboration channels between colleges.

Some of the key takeaways from the discussions included:

Establishing a Pune E-Cell Network for shared resources and event collaborations.

Initiating inter-college startup challenges to discover and support new ideas.

Hosting cross-campus speaker sessions to make entrepreneurial learning more accessible.

Building joint mentorship databases to connect student startups with the right guidance.

Each of these ideas aligns with E-Cell DYPIU's vision — to create an ecosystem that goes beyond boundaries and encourages young entrepreneurs to build, innovate, and impact.`
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
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full border-2 border-white hover:bg-brand-yellow hover:text-[var(--text-on-brand)] transition-colors opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full border-2 border-white hover:bg-brand-yellow hover:text-[var(--text-on-brand)] transition-colors opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6" />
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

export default BlogDetail2;
