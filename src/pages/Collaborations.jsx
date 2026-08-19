import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, ArrowRight, Loader2, AlertCircle, FileText, CheckCircle2, User, Mail, Link } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Collaborations = () => {
    const [activeTab, setActiveTab] = useState('past'); // 'past' or 'apply'
    const [collaborations, setCollaborations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [coreAnswers, setCoreAnswers] = useState({
        organization: '',
        contactName: '',
        email: '',
        website: '',
        proposal: ''
    });
    const [dynamicQuestions, setDynamicQuestions] = useState([]);
    const [dynamicAnswers, setDynamicAnswers] = useState({});
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchCollaborations();
        fetchDynamicQuestions();
    }, []);

    const fetchDynamicQuestions = async () => {
        setLoadingQuestions(true);
        try {
            const response = await fetch('/api/collaboration?action=questions');
            const data = await response.json();
            if (data.questions) {
                setDynamicQuestions(data.questions);
                // Initialize answers state based on retrieved questions
                const initialAnswers = {};
                data.questions.forEach(q => {
                    initialAnswers[q.label] = '';
                });
                setDynamicAnswers(initialAnswers);
            }
        } catch (err) {
            console.error('Failed to fetch collab questions:', err);
        } finally {
            setLoadingQuestions(false);
        }
    };

    const fetchCollaborations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/collaboration');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch collaborations');
            }

            if (data.collaborations) {
                setCollaborations(data.collaborations);
            }
        } catch (err) {
            console.error('Error fetching collaborations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Change handlers
    const handleCoreInputChange = (field, value) => {
        setCoreAnswers(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDynamicInputChange = (label, value) => {
        setDynamicAnswers(prev => ({
            ...prev,
            [label]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setSubmitResult(null);

        try {
            // Combine core answers and dynamic answers
            const submissionData = { ...coreAnswers, ...dynamicAnswers };

            const response = await fetch('/api/collaboration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit application');
            }

            setSubmitResult({
                type: 'success',
                message: 'Application submitted successfully! Our team will review it and get back to you soon.'
            });
            // Reset forms
            setCoreAnswers({
                organization: '',
                contactName: '',
                email: '',
                website: '',
                proposal: ''
            });
            setDynamicAnswers({});
            // Reset dynamic answers based on questions
            const resetDynamicAnswers = {};
            dynamicQuestions.forEach(q => {
                resetDynamicAnswers[q.label] = '';
            });
            setDynamicAnswers(resetDynamicAnswers);

        } catch (err) {
            setSubmitResult({
                type: 'error',
                message: err.message || 'Something went wrong. Please try again.'
            });
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-20 selection:bg-brand-yellow selection:text-[var(--text-on-brand)]">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
                        OUR <span className="text-brand-yellow">COLLABORATIONS</span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl">
                        Building strong partnerships to foster an ecosystem of innovation and entrepreneurship.
                    </p>
                </motion.div>

                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="bg-zinc-900 p-2 rounded-full border-2 border-zinc-700 flex gap-2">
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`px-8 py-3 rounded-full font-bold uppercase transition-all duration-300 ${activeTab === 'past'
                                ? 'bg-brand-yellow text-[var(--text-on-brand)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Partnerships
                        </button>
                        <button
                            onClick={() => setActiveTab('apply')}
                            className={`px-8 py-3 rounded-full font-bold uppercase transition-all duration-300 ${activeTab === 'apply'
                                ? 'bg-brand-yellow text-[var(--text-on-brand)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Apply Now
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-5xl mx-auto">
                    {activeTab === 'past' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-10 h-10 animate-spin text-brand-yellow" />
                                </div>
                            ) : error ? (
                                <div className="bg-red-900/20 border-2 border-red-500 text-red-400 p-6 rounded-2xl text-center">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-3" />
                                    <p className="font-bold">{error}</p>
                                </div>
                            ) : collaborations.length === 0 ? (
                                <div className="text-center py-20 border-4 border-dashed border-zinc-800 rounded-[2rem] bg-zinc-900/50">
                                    <h3 className="text-2xl font-black uppercase text-gray-500 mb-2">No Collaborations Yet</h3>
                                    <p className="text-gray-400">Be the first to partner with us!</p>
                                    <button
                                        onClick={() => setActiveTab('apply')}
                                        className="mt-6 px-6 py-3 bg-white text-black font-bold uppercase rounded-full hover:bg-brand-yellow transition-colors"
                                    >
                                        Apply for Collaboration
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {collaborations.map((collab) => (
                                        <motion.div
                                            key={collab.id}
                                            whileHover={{ y: -5 }}
                                            className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 hover:border-brand-yellow transition-colors flex flex-col h-full"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Building className="w-6 h-6 text-brand-yellow" />
                                                </div>
                                            </div>
                                            {(() => {
                                                const keys = Object.keys(collab).filter(k => k !== 'id' && k !== 'status' && k !== 'createdAt');

                                                let titleKey = keys.find(k => k.toLowerCase().includes('organization') || k.toLowerCase().includes('company'));
                                                if (!titleKey) titleKey = keys.find(k => k.toLowerCase().includes('name'));
                                                if (!titleKey && keys.length > 0) titleKey = keys[0];

                                                let descKey = keys.find(k => k.toLowerCase().includes('proposal') || k.toLowerCase().includes('description') || k.toLowerCase().includes('details'));
                                                if (!descKey && keys.length > 1) {
                                                    descKey = keys.find(k => k !== titleKey && typeof collab[k] === 'string' && collab[k].length > 20);
                                                }

                                                const titleValue = titleKey && collab[titleKey] ? collab[titleKey] : 'Application #' + collab.id.substring(0, 6);
                                                const descValue = descKey && collab[descKey] ? collab[descKey] : 'Details unavailable';

                                                return (
                                                    <>
                                                        <h3 className="text-xl font-bold mb-2">{titleValue}</h3>
                                                        <p className="text-gray-400 text-sm mb-6 flex-grow">
                                                            {descValue.length > 100 ? `${descValue.substring(0, 100)}...` : descValue}
                                                        </p>
                                                    </>
                                                );
                                            })()}
                                            {collab.externalLink && (
                                                <a
                                                    href={collab.externalLink.startsWith('http') ? collab.externalLink : `https://${collab.externalLink}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-sm font-bold text-brand-yellow hover:text-white transition-colors mt-auto"
                                                >
                                                    Visit Website <ArrowRight className="w-4 h-4" />
                                                </a>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'apply' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-zinc-900 border-4 border-zinc-800 rounded-[2rem] p-8 md:p-12 max-w-3xl mx-auto relative overflow-hidden"
                        >
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                            <h2 className="text-3xl font-black uppercase mb-2">Partner with Us</h2>
                            <p className="text-gray-400 mb-8">Fill out the form below to propose a collaboration with E-Cell DYPIU. We evaluate proposals on a rolling basis.</p>

                            {submitResult && (
                                <div className={`mb-8 p-4 rounded-xl flex items-start gap-3 border-2 ${submitResult.type === 'success'
                                    ? 'bg-green-900/20 border-green-500 text-green-400'
                                    : 'bg-red-900/20 border-red-500 text-red-400'
                                    }`}>
                                    {submitResult.type === 'success' ? (
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className="font-bold">{submitResult.message}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                {/* Core Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                            <Building className="w-4 h-4 text-brand-yellow" />
                                            Organization Name <span className="text-brand-yellow">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={coreAnswers.organization}
                                            onChange={(e) => handleCoreInputChange('organization', e.target.value)}
                                            required
                                            placeholder="Your Company / Institution"
                                            className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4 text-brand-yellow" />
                                            Primary Contact <span className="text-brand-yellow">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={coreAnswers.contactName}
                                            onChange={(e) => handleCoreInputChange('contactName', e.target.value)}
                                            required
                                            placeholder="Full Name"
                                            className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-brand-yellow" />
                                            Email Address <span className="text-brand-yellow">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={coreAnswers.email}
                                            onChange={(e) => handleCoreInputChange('email', e.target.value)}
                                            required
                                            placeholder="work@company.com"
                                            className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                            <Link className="w-4 h-4 text-brand-yellow" />
                                            Website Link
                                        </label>
                                        <input
                                            type="url"
                                            value={coreAnswers.website}
                                            onChange={(e) => handleCoreInputChange('website', e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-brand-yellow" />
                                        Collaboration Proposal <span className="text-brand-yellow">*</span>
                                    </label>
                                    <textarea
                                        value={coreAnswers.proposal}
                                        onChange={(e) => handleCoreInputChange('proposal', e.target.value)}
                                        required
                                        rows="4"
                                        placeholder="Tell us how you would like to collaborate with E-Cell DYPIU. Be specific about goals, timeline, and mutual benefits."
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors resize-none"
                                    ></textarea>
                                </div>

                                {/* Dynamic Questions Form */}
                                {loadingQuestions ? (
                                    <div className="flex justify-center py-10 border-t border-zinc-800 pt-8 mt-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                                    </div>
                                ) : dynamicQuestions.length > 0 && (
                                    <div className="border-t border-zinc-800 pt-8 mt-8">
                                        <h3 className="text-xl font-bold uppercase text-brand-yellow mb-6">Additional Details</h3>
                                        <div className="space-y-6">
                                            {dynamicQuestions.map((q) => (
                                                <div key={q.id}>
                                                    <label className="block text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-brand-yellow" />
                                                        {q.label} {q.required && <span className="text-brand-yellow">*</span>}
                                                    </label>
                                                    {q.type === 'textarea' ? (
                                                        <textarea
                                                            value={dynamicAnswers[q.label] || ''}
                                                            onChange={(e) => handleDynamicInputChange(q.label, e.target.value)}
                                                            required={q.required}
                                                            rows="4"
                                                            placeholder="Your answer..."
                                                            className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors resize-none"
                                                        ></textarea>
                                                    ) : (
                                                        <input
                                                            type={q.type || 'text'}
                                                            value={dynamicAnswers[q.label] || ''}
                                                            onChange={(e) => handleDynamicInputChange(q.label, e.target.value)}
                                                            required={q.required}
                                                            placeholder={
                                                                q.type === 'email' ? 'work@company.com' :
                                                                    q.type === 'url' ? 'https://example.com' :
                                                                        q.type === 'tel' ? 'Phone Number' : 'Your answer...'
                                                            }
                                                            className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitLoading || loadingQuestions || dynamicQuestions.length === 0}
                                    className="w-full bg-brand-yellow text-[var(--text-on-brand)] font-black py-4 rounded-xl uppercase hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Application'
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Collaborations;
