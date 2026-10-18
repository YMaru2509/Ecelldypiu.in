import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PHRASES = [
    "Your next stop is loading...",
    "Taking you where the good stuff is...",
    "Almost there — your destination is ready.",
    "Fast-tracking you to the right place...",
    "Your shortcut is doing its thing...",
    "Buckle up — we're taking off..."
];

const Redirect = () => {
    const { slug } = useParams();
    const [destinationName, setDestinationName] = useState('');
    const [error, setError] = useState(false);
    const redirectReadyRef = useRef(false);
    const redirectCompletedRef = useRef(false);
    const wentBackTrackedRef = useRef(false);

    // Pick random phrase ONCE on mount so it does not change on re-renders
    const randomPhrase = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * PHRASES.length);
        return PHRASES[randomIndex];
    }, []);

    const trackEvent = useCallback((eventName) => {
        if (!slug) return;
        try {
            const payload = JSON.stringify({
                action: 'track_event',
                slug: slug.trim().toLowerCase(),
                event: eventName,
                clientUa: navigator.userAgent,
                clientRef: document.referrer
            });

            if (navigator.sendBeacon) {
                const blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon('/api/shortlink', blob);
            } else {
                fetch('/api/shortlink', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                }).catch(() => {});
            }
        } catch (err) {
            console.error('Track event error:', err);
        }
    }, [slug]);

    // A visitor can leave by closing the tab, pressing the browser Back button,
    // switching away, or navigating somewhere else. Those paths do not click
    // the visible Back button, so page lifecycle events are the reliable signal
    // that the redirect was abandoned before completion.
    const trackWentBack = useCallback(() => {
        if (!redirectReadyRef.current || redirectCompletedRef.current || wentBackTrackedRef.current) return;
        wentBackTrackedRef.current = true;
        trackEvent('went_back');
    }, [trackEvent]);

    const performRedirect = useCallback(async (isRetry = false) => {
        if (isRetry) {
            setError(false);
        }

        if (!slug) {
            setError(true);
            return;
        }

        try {
            const response = await fetch('/api/shortlink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'redirect',
                    slug: slug.trim().toLowerCase(),
                    clientUa: navigator.userAgent,
                    clientRef: document.referrer
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.originalUrl) {
                setError(true);
                return;
            }

            const name = data.destinationName && data.destinationName.trim()
                ? data.destinationName.trim()
                : 'your destination';

            setDestinationName(name);
            redirectReadyRef.current = true;
            redirectCompletedRef.current = false;
            wentBackTrackedRef.current = false;

            // Wait ~900ms before replacing window location for smooth branded feedback
            const timer = setTimeout(() => {
                redirectCompletedRef.current = true;
                trackEvent('redirect_completed');
                window.location.replace(data.originalUrl);
            }, 900);

            return () => clearTimeout(timer);
        } catch (err) {
            console.error('Redirection error:', err);
            setError(true);
        }
    }, [slug, trackEvent]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') trackWentBack();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', trackWentBack);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', trackWentBack);
        };
    }, [trackWentBack]);

    useEffect(() => {
        let cleanupTimer;
        const execute = async () => {
            cleanupTimer = await performRedirect();
        };
        execute();

        return () => {
            if (typeof cleanupTimer === 'function') {
                cleanupTimer();
            }
        };
    }, [performRedirect]);

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[9999] min-h-screen min-h-[100dvh] w-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden selection:bg-brand-yellow selection:text-[var(--text-on-brand)]"
        >
            {/* Ambient Background Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-yellow/10 rounded-full blur-[120px] pointer-events-none motion-reduce:hidden" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[90px] pointer-events-none motion-reduce:hidden" />

            {/* Main Container Card */}
            <div className="relative z-10 w-full max-w-md">
                {/* E-Cell Logo */}
                <div className="mb-8 flex items-center justify-center space-x-3 select-none">
                    <img
                        src="/logonew.png"
                        alt="E-Cell DYPIU"
                        className="h-12 md:h-14 w-auto object-contain"
                    />
                    <span className="text-white font-bold text-2xl md:text-3xl tracking-wide">
                        ECELL DYPIU
                    </span>
                </div>

                {!error ? (
                    <div className="bg-zinc-900/90 backdrop-blur-xl border-4 border-zinc-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(255,178,44,0.12),8px_8px_0px_#FFB22C] flex flex-col items-center">
                        {/* Catchy Phrase */}
                        <p className="text-gray-400 text-xs md:text-sm font-medium tracking-wide mb-6 italic">
                            "{randomPhrase}"
                        </p>

                        {/* Section Header */}
                        <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">
                            REDIRECTING YOU TO
                        </p>

                        {/* Destination Name */}
                        <h1 className="text-2xl md:text-3xl font-black text-brand-yellow mb-6 break-words max-w-full leading-tight">
                            {destinationName || 'your destination'}
                        </h1>

                        {/* Animated Progress Indicator */}
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-6 relative">
                            <div className="bg-gradient-to-r from-brand-yellow via-amber-400 to-yellow-200 h-full w-full animate-[pulse_1.5s_ease-in-out_infinite] motion-reduce:animate-none" />
                        </div>

                        {/* Spinner */}
                        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin mb-4 motion-reduce:animate-none" />

                        {/* Small Helper Text */}
                        <p className="text-gray-400 text-xs font-medium">
                            Please wait a moment while we open your destination.
                        </p>
                    </div>
                ) : (
                    /* Error State Card - Strictly NO Slug or URL display */
                    <div className="bg-zinc-900/90 backdrop-blur-xl border-4 border-red-500/80 rounded-3xl p-8 shadow-[8px_8px_0px_#EF4444] flex flex-col items-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-black uppercase text-white mb-2">Destination unavailable</h2>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                            This link may have expired or is no longer active.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                            <Link
                                to="/"
                                onClick={trackWentBack}
                                className="w-full inline-flex items-center justify-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] font-black px-5 py-3 rounded-xl uppercase text-xs hover:bg-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Return to Homepage
                            </Link>
                            <button
                                onClick={() => performRedirect(true)}
                                className="w-full inline-flex items-center justify-center gap-2 bg-zinc-800 text-gray-300 hover:text-white font-bold px-5 py-3 rounded-xl uppercase text-xs transition-colors hover:bg-zinc-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Redirect;
