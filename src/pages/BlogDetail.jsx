import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Tag, ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try API endpoint first
      try {
        const response = await fetch(`/api/blog?slug=${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.blog) {
            setBlog(data.blog);
            setLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('API fetch failed, falling back to Firestore client:', apiErr);
      }

      // Direct Firestore client fallback
      const q = query(
        collection(db, 'BLOGS'),
        where('slug', '==', slug),
        where('published', '==', true)
      );
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const docSnap = querySnap.docs[0];
        setBlog({ id: docSnap.id, ...docSnap.data() });
        return;
      }

      throw new Error('Blog not found');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (blog?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % blog.images.length);
    }
  };

  const prevImage = () => {
    if (blog?.images?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + blog.images.length) % blog.images.length);
    }
  };

  // Auto slide for images
  useEffect(() => {
    if (blog?.images?.length > 1) {
      const interval = setInterval(() => {
        nextImage();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentImageIndex, blog]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-yellow" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-black mb-4">Blog Not Found</h1>
        <p className="text-gray-400 mb-8">{error || 'The blog you are looking for does not exist.'}</p>
        <Link
          to="/blogs"
          className="inline-flex items-center text-brand-yellow hover:text-white transition-colors font-bold uppercase"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-black font-sans pt-32 pb-20">
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

          {/* Image Slider */}
          {blog.images && blog.images.length > 0 && (
            <div className="mb-12">
              <div className="relative border-4 border-white bg-black p-2 rounded-xl mb-4 overflow-hidden group">
                <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden">
                  <img
                    src={blog.images[currentImageIndex]}
                    alt={`${blog.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {blog.images.length > 1 && (
                  <>
                    <div className="absolute bottom-4 right-4 bg-brand-yellow text-black font-black px-3 py-1 text-sm border-2 border-black shadow-[4px_4px_0px_black]">
                      {currentImageIndex + 1} / {blog.images.length}
                    </div>

                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full border-2 border-white hover:bg-brand-yellow hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full border-2 border-white hover:bg-brand-yellow hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {blog.images.length > 1 && (
                <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
                  {blog.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex
                          ? 'border-brand-yellow scale-105'
                          : 'border-white/30 hover:border-white'
                        }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg prose-invert max-w-none">
            {blog.content.split('\n\n').map((paragraph, idx) => {
              // Check if it's a heading (short line followed by content)
              const isHeading = paragraph.length < 100 && !paragraph.includes('.') && idx > 0;

              if (isHeading) {
                return (
                  <h2 key={idx} className="text-2xl md:text-3xl font-black text-brand-yellow mt-12 mb-6 uppercase">
                    {paragraph}
                  </h2>
                );
              }

              return (
                <p key={idx} className="text-gray-300 mb-6 leading-relaxed font-sans text-lg">
                  {idx === 0 && (
                    <span className="text-brand-yellow font-black text-2xl float-left mr-2 leading-none mt-1">
                      {paragraph.charAt(0)}
                    </span>
                  )}
                  {idx === 0 ? paragraph.slice(1) : paragraph}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
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
          )}
        </motion.article>
      </div>
    </div>
  );
};

export default BlogDetail;
