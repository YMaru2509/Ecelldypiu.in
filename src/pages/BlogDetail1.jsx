import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Tag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogDetail1 = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const blog = {
    title: 'E-Cell DYPIU Blog: Where Ideas Meet Impact',
    author: 'E-Cell DYPIU',
    date: 'September 20, 2025',
    readTime: '5 min read',
    tags: ['E-Cell', 'Innovation', 'Impact'],
    content: `Welcome to the E-Cell DYPIU Blog — a space where entrepreneurial energy meets powerful stories, insights, and innovation. This is more than just a collection of articles; it's a platform that celebrates curiosity, creativity, and the courage to build something meaningful from scratch. Every post here is designed to spark ideas, share real experiences, and help young minds turn inspiration into action.

Startup Stories and Insights

Every great business begins with an idea — but it's the journey that defines its success. In this section, we explore the stories behind student startups, campus ventures, and innovators who dared to think differently. From dorm rooms to digital boardrooms, discover how college students are shaping the startup ecosystem with bold ideas and fearless execution.

We also share practical insights on idea validation, building minimum viable products, pitching to investors, and surviving the rollercoaster of entrepreneurship. Whether you're dreaming of your first startup or already managing your second, this is where real-world lessons meet student ambition.`
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
          {/* Decor */}
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

export default BlogDetail1;
