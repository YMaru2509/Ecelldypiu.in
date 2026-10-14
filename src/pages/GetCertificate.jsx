import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Mail, CheckCircle, Download,
    Loader2, AlertCircle, Award, ChevronRight, User,
    Search, XCircle, Linkedin, Share2, Copy, Check
} from 'lucide-react';
import { renderCertificateToCanvas, downloadCanvasAsPng } from '../utils/certificateCanvas';

const GetCertificate = () => {
    const { eventSlug } = useParams();
    const [searchParams] = useSearchParams();
    const emailParam = searchParams.get('email');
    const canvasRef = useRef(null);

    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showLinkedInGuide, setShowLinkedInGuide] = useState(false);

    // Flow state: 1 = Enter name/email, 2 = Ineligible, 3 = View certificate
    const [step, setStep] = useState(1);
    const [identifier, setIdentifier] = useState('');
    const [attendee, setAttendee] = useState(null);
    const [stepLoading, setStepLoading] = useState(false);
    const [stepError, setStepError] = useState('');
    const [certificateReady, setCertificateReady] = useState(false);
    const [denialReason, setDenialReason] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopyId = () => {
        if (attendee?.id) {
            navigator.clipboard.writeText(attendee.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Fetch certificate config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`/api/certificate?eventId=${eventSlug}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Certificate not available');
                setConfig(data.config);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [eventSlug]);

    // Step 1: Look up attendee by name or email
    const performLookup = async (lookupId) => {
        if (!lookupId.trim()) return;
        setStepLoading(true);
        setStepError('');
        setIdentifier(lookupId);

        try {
            const res = await fetch('/api/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'lookup-attendee', eventId: eventSlug, identifier: lookupId.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Lookup failed');

            setAttendee({ ...data.attendee, id: data.attendeeId });

            // Check eligibility
            if (data.eligible === false) {
                setDenialReason(data.reason || 'You are not eligible for this certificate.');
                setStep(2); // Ineligible step
            } else {
                setStep(3); // Certificate step
            }
        } catch (err) {
            setStepError(err.message);
        } finally {
            setStepLoading(false);
        }
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        performLookup(identifier);
    };

    // Auto-lookup if email parameter is present
    useEffect(() => {
        if (emailParam && step === 1 && !loading) {
            performLookup(emailParam);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emailParam, loading]);

    // Generate certificate on canvas
    const generateCertificate = useCallback(async (retryCount = 0) => {
        if (!config || !attendee) return;

        // If canvas isn't ready yet, retry a few times (React ref timing)
        if (!canvasRef.current) {
            if (retryCount < 5) {
                setTimeout(() => generateCertificate(retryCount + 1), 200);
                return;
            } else {
                setStepError('Canvas failed to initialize. Please try refreshing.');
                return;
            }
        }

        try {
            await renderCertificateToCanvas(canvasRef.current, config, attendee);
            setCertificateReady(true);
        } catch (err) {
            console.error('Certificate generation error:', err);
            setStepError('Failed to generate certificate: ' + err.message);
        }
    }, [config, attendee]);

    useEffect(() => {
        if (step === 3 && attendee && !certificateReady) {
            // Small delay to allow enter animation to start
            const t = setTimeout(() => generateCertificate(), 100);
            return () => clearTimeout(t);
        }
    }, [step, attendee, certificateReady, generateCertificate]);

    // Download certificate
    const handleDownload = () => {
        downloadCanvasAsPng(canvasRef.current, `Certificate_${attendee?.name || 'attendee'}_${config?.eventName || 'event'}.png`);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-yellow mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Loading certificate...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black uppercase mb-4">Certificate Not Available</h2>
                    <p className="text-gray-400 mb-8">{error}</p>
                    <Link to="/" className="inline-flex items-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] font-black px-6 py-3 rounded-full hover:scale-105 transition-transform">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const steps = [
        { num: 1, label: 'Enter Details', icon: Search },
        { num: 3, label: 'Certificate', icon: Award },
    ];

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-yellow selection:text-[var(--text-on-brand)]">
            {/* Header */}
            <section className="pt-32 pb-8 px-4 border-b-4 border-white/10">
                <div className="container mx-auto max-w-4xl">
                    <Link to={`/events/${eventSlug}`} className="inline-flex items-center text-white hover:text-brand-yellow transition-colors font-mono uppercase tracking-widest border-2 border-white/20 px-4 py-2 rounded-full hover:border-brand-yellow hover:bg-white/5 mb-8">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Event
                    </Link>

                    <div className="text-center">
                        <div className="inline-block bg-brand-yellow text-[var(--text-on-brand)] font-black px-4 py-1 mb-4 text-sm transform -rotate-1 rounded-sm uppercase tracking-widest">
                            Get Your Certificate
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2">
                            {config?.eventName || 'Event Certificate'}
                        </h1>
                    </div>
                </div>
            </section>

            {/* Progress Steps */}
            <div className="container mx-auto max-w-3xl px-4 py-8">
                <div className="flex items-center justify-center mb-12 gap-4">
                    {steps.map((s, i) => (
                        <div key={s.num} className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-300 ${step >= s.num
                                ? 'bg-brand-yellow border-brand-yellow text-[var(--text-on-brand)]'
                                : 'border-zinc-700 text-zinc-600'
                                }`}>
                                {step > s.num ? (
                                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                                ) : (
                                    <s.icon className="w-4 h-4 md:w-5 md:h-5" />
                                )}
                            </div>
                            <span className={`hidden md:block ml-3 text-sm font-bold uppercase tracking-wider ${step >= s.num ? 'text-white' : 'text-zinc-600'
                                }`}>
                                {s.label}
                            </span>
                            {i < steps.length - 1 && (
                                <div className={`w-16 md:w-24 h-0.5 mx-3 transition-all duration-300 ${step > s.num ? 'bg-brand-yellow' : 'bg-zinc-800'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Enter Name / Email */}
                    {step === 1 && (!emailParam || stepError) && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-zinc-900 border-4 border-zinc-700 rounded-[2rem] p-8 md:p-12"
                        >
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-brand-yellow/10 border-2 border-brand-yellow/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="w-10 h-10 text-brand-yellow" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black uppercase mb-2">Find Your Certificate</h2>
                                <p className="text-gray-400">Enter your email address or name used during registration</p>
                            </div>

                            <form onSubmit={handleLookup} className="max-w-lg mx-auto">
                                <div className="mb-6">
                                    <input
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="Email address or full name"
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white text-lg rounded-xl focus:border-brand-yellow focus:outline-none transition-colors placeholder:text-zinc-600"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {stepError && (
                                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 text-red-400">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm">{stepError}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={stepLoading || !identifier.trim()}
                                    className="w-full bg-brand-yellow text-[var(--text-on-brand)] font-black text-lg py-4 rounded-xl border-4 border-white hover:shadow-[6px_6px_0px_white] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wider"
                                >
                                    {stepLoading ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
                                    ) : (
                                        <>Find My Certificate <ChevronRight className="w-5 h-5" /></>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 1 && emailParam && !stepError && (
                        <motion.div
                            key="step1-auto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-zinc-900 border-4 border-zinc-700 rounded-[2rem] p-8 md:p-12 text-center"
                        >
                            <div className="w-20 h-20 bg-brand-yellow/10 border-2 border-brand-yellow/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black uppercase text-white mb-4">
                                Verifying Your <span className="text-brand-yellow">Certificate</span>
                            </h3>
                            <p className="text-gray-400">Please wait while we fetch your certificate securely...</p>
                        </motion.div>
                    )}

                    {/* Step 2: Ineligible */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-zinc-900 border-4 border-red-500/30 rounded-[2rem] p-8 md:p-12"
                        >
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <XCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black uppercase mb-4">Not Eligible</h2>
                                <p className="text-gray-300 text-lg mb-2">
                                    Sorry, <span className="text-brand-yellow font-bold">{attendee?.name}</span>.
                                </p>
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto mt-6">
                                    <p className="text-red-300 text-lg">{denialReason}</p>
                                </div>
                            </div>

                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setAttendee(null);
                                        setIdentifier('');
                                        setDenialReason('');
                                        setStepError('');
                                    }}
                                    className="text-gray-400 hover:text-white font-bold py-3 px-6 flex items-center gap-2 transition-colors border-2 border-zinc-700 rounded-full hover:border-white"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Try Different Details
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: View & Download Certificate */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center"
                        >
                            <div className="mb-8">
                                <div className="w-20 h-20 bg-brand-yellow/10 border-2 border-brand-yellow/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Award className="w-10 h-10 text-brand-yellow" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black uppercase mb-2">
                                    🎉 Your Certificate is Ready!
                                </h2>
                                <p className="text-gray-400">Congratulations, <span className="text-brand-yellow font-bold">{attendee?.name}</span>!</p>
                            </div>

                            {stepError && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 text-red-400 max-w-md mx-auto">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{stepError}</span>
                                </div>
                            )}

                            {/* Certificate Canvas */}
                            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-[2rem] p-4 md:p-8 mb-8 overflow-hidden">
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-auto rounded-xl shadow-2xl"
                                    style={{ maxWidth: '100%' }}
                                />
                                {!certificateReady && (
                                    <div className="py-20 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow mr-3" />
                                        <span className="text-gray-400">Generating your certificate...</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                {certificateReady && (
                                    <button
                                        onClick={handleDownload}
                                        className="bg-brand-yellow text-[var(--text-on-brand)] font-black text-xl py-4 px-8 rounded-full border-4 border-white hover:shadow-[8px_8px_0px_white] transition-all flex items-center gap-3 uppercase tracking-wider group"
                                    >
                                        <Download className="w-6 h-6 group-hover:animate-bounce" />
                                        Download
                                    </button>
                                )}

                                {certificateReady && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setShowLinkedInGuide(true)}
                                            className="bg-[#0077b5] text-white font-bold py-4 px-6 rounded-full border-4 border-white hover:shadow-[8px_8px_0px_white] transition-all flex items-center gap-2"
                                            title="Add to LinkedIn Profile"
                                        >
                                            <Linkedin className="w-6 h-6" />
                                            <span className="hidden sm:inline">Add to Profile</span>
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setAttendee(null);
                                        setIdentifier('');
                                        setCertificateReady(false);
                                        setStepError('');
                                        setShowLinkedInGuide(false);
                                    }}
                                    className="text-gray-400 hover:text-white font-bold py-3 px-6 flex items-center gap-2 transition-colors border-2 border-zinc-700 rounded-full hover:border-white"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Search Again
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* LinkedIn Guide Modal */}
                <AnimatePresence>
                    {showLinkedInGuide && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl max-w-md w-full p-6 relative shadow-2xl"
                            >
                                <button
                                    onClick={() => setShowLinkedInGuide(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>

                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-[#0077b5]/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#0077b5]/50">
                                        <Linkedin className="w-8 h-8 text-[#0077b5]" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase">Add to LinkedIn</h3>
                                    <p className="text-gray-400 text-sm mt-2">Follow these 2 steps to feature this on your profile</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Step 1 */}
                                    <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-brand-yellow text-[var(--text-on-brand)] font-bold flex items-center justify-center text-sm">1</div>
                                            <h4 className="font-bold text-white">Download Certificate</h4>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-3 pl-9">Save the image to your device first.</p>
                                        <button
                                            onClick={handleDownload}
                                            className="w-full bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500"
                                        >
                                            <Download className="w-4 h-4" /> Download Image
                                        </button>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-[#0077b5] text-white font-bold flex items-center justify-center text-sm">2</div>
                                            <h4 className="font-bold text-white">Add & Upload</h4>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-3 pl-9 leading-relaxed">
                                            <span className="text-brand-yellow font-black">IMPORTANT:</span> The form will auto-fill your details. Just scroll down to the <b>"Media"</b> section and <span className="text-white font-bold underline decoration-brand-yellow/50">upload the image</span> yourself.
                                        </p>
                                        <a
                                            href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(config?.eventName || 'Event Certificate')}&organizationName=E-Cell%20DYPIU&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certId=${encodeURIComponent(attendee?.id || '')}&certUrl=${encodeURIComponent(window.location.href)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full bg-[#0077b5] text-white font-bold py-3 rounded-lg hover:bg-[#006097] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Linkedin className="w-4 h-4" /> Continue to LinkedIn
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GetCertificate;
