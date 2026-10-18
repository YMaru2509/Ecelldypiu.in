import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const lenisRef = useRef(null);

  useEffect(() => {
    // Prevent browser from restoring scroll position automatically
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      // Let native scrolling take over inside dialogs and nested list boxes.
      // Without this, Lenis consumes the wheel/touch event before the child
      // overflow container can move.
      prevent: (node) => Boolean(node?.closest?.('[data-lenis-prevent], [data-modal-scroll], [data-scroll-container]')),
    });

    lenisRef.current = lenis;
    window.lenis = lenis; // Expose for other components if needed

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      window.lenis = null;
    };
  }, []);

  useEffect(() => {
    // Handle navigation scroll reset
    const handleScroll = () => {
      if (!hash) {
        // Immediate scroll to top
        window.scrollTo(0, 0);

        // Force Lenis to update its internal state
        if (lenisRef.current) {
          lenisRef.current.scrollTo(0, { immediate: true });
        }
      }
    };

    handleScroll();

    // Fallback delay to ensure it catches any late renderings or browser restorations
    const timeoutId = setTimeout(handleScroll, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
