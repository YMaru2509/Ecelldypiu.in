import ReCAPTCHA from "react-google-recaptcha";
import { useState, useEffect, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Check, Loader2, ArrowRight, ArrowLeft, Star } from 'lucide-react';

const ApplyNow = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [captchaToken, setCaptchaToken] = useState(null);
    const recaptchaRef = useRef(null);

    const onCaptchaChange = (token) => {
        setCaptchaToken(token);
    };

    const [formData, setFormData] = useState({
        // Step 1: Personal Details
        fullName: '',
        prn: '',
        division: '',
        email: '',
        contactNumber: '',

        // Step 2: Compatibility & Role
        timeManagementRating: '',
        role: '',

        // Step 3: Role Specific Answers
        pr_why: '',
        pr_experience: '',
        pr_scenario: '',

        marketing_promotion: '',
        marketing_strategy: '',
        marketing_adapt: '',

        sm_experience: '',
        sm_skills: '',
        sm_brand: '',

        ops_jugaad: '',
        ops_prioritize: '',
        ops_crisis: '',

        tech_project: '',
        tech_experience: '',

        cr_why: '',
        cr_pitch: '',

        design_portfolio: '',
        design_software: '',

        aesthetics_ideas: '',
        aesthetics_experience: ''
    });

    const roles = [
        { id: 'pr', label: 'PR (Public Relations)', color: 'bg-pink-500' },
        { id: 'marketing', label: 'Marketing', color: 'bg-blue-500' },
        { id: 'social_media', label: 'Social Media', color: 'bg-purple-500' },
        { id: 'operations', label: 'Operations', color: 'bg-green-500' },
        { id: 'technical', label: 'Technical', color: 'bg-cyan-500' },
        { id: 'corporate_relations', label: 'Corporate Relations', color: 'bg-orange-500' },
        { id: 'design', label: 'Design', color: 'bg-red-500' },
        { id: 'aesthetics', label: 'Aesthetics (Creatives)', color: 'bg-yellow-500' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validation Logic
        if (name === 'fullName') {
            // Only allow letters and spaces
            if (value && !/^[A-Za-z\s]+$/.test(value)) return;
        }

        if (name === 'prn' || name === 'contactNumber') {
            // Only allow numbers
            if (value && !/^\d+$/.test(value)) return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [step]);

    const handleNext = () => {
        let requiredFields = [];
        if (step === 1) {
            requiredFields = ['fullName', 'prn', 'division', 'email', 'contactNumber'];
        } else if (step === 2) {
            requiredFields = ['timeManagementRating', 'role'];
        }

        const missing = requiredFields.find(field => !formData[field]);
        if (missing) {
            setError(`Please fill in ${missing.replace(/([A-Z])/g, ' $1').toLowerCase()} `);
            return;
        }

        setError(null);
        setStep(prev => prev + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🚀 Form submission started');
        console.log('📝 Form data:', formData);
        console.log('🔐 Captcha token:', captchaToken ? 'Present' : 'Missing');

        if (!captchaToken) {
            console.error('❌ No captcha token');
            setError('Please complete the reCAPTCHA verification');
            return;
        }

        console.log('✅ Captcha validated, starting submission...');
        setLoading(true);
        setError(null);

        try {
            console.log('📤 Attempting to submit via API...');

            // Use fetch API instead of Firestore SDK (better mobile compatibility)
            const response = await fetch('/api/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, action: 'submit-application' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Submission failed');
            }

            const result = await response.json();
            console.log('✅ Successfully submitted, response:', result);
            setShowSuccess(true);
        } catch (err) {
            console.error("❌ Submission Error:", err);
            console.error('Error message:', err.message);
            setError(`Error: ${err.message}`);
            // Reset reCAPTCHA on error
            if (recaptchaRef.current) {
                console.log('🔄 Resetting reCAPTCHA...');
                recaptchaRef.current.reset();
            }
            setCaptchaToken(null);
        } finally {
            console.log('🏁 Submission complete, setting loading to false');
            setLoading(false);
        }
    };

    const renderField = (name, label, type = 'text', placeholder = '') => (
        <div className="mb-6">
            <label className="block text-lg md:text-xl font-bold uppercase mb-2 text-white">
                {label} <span className="text-brand-yellow text-lg align-top">*</span>
            </label>
            {type === 'textarea' ? (
                <textarea
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    rows="4"
                    className="w-full bg-zinc-900 border-b-4 border-zinc-700 p-3 md:p-4 text-base md:text-lg text-white focus:border-brand-yellow focus:outline-none transition-colors placeholder-gray-600 resize-none font-medium rounded-lg"
                    placeholder={placeholder}
                    required
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border-b-4 border-zinc-700 p-3 md:p-4 text-base md:text-lg text-white focus:border-brand-yellow focus:outline-none transition-colors placeholder-gray-600 font-bold rounded-lg"
                    placeholder={placeholder}
                    required
                />
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-[var(--text-on-brand)] font-sans">
            <section className="min-h-[25vh] md:min-h-[35vh] flex flex-col justify-center pt-28 md:pt-32 pb-8 relative border-b-4 border-white bg-black">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div>
                        <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase mb-2 md:mb-4">
                            Want to join <span className="text-brand-yellow">US</span>?
                        </h1>
                        <p className="text-gray-400 text-sm md:text-xl max-w-2xl mx-auto font-mono px-4">
                            Keep it <span className="text-white font-bold">honest</span>, <span className="text-white font-bold">creative</span>, and <span className="text-white font-bold">YOU</span>.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-8 md:py-12 px-4">
                <div className="container mx-auto max-w-3xl">
                    <div
                        className="bg-zinc-900 border-2 md:border-4 border-white p-6 md:p-12 rounded-[1.5rem] md:rounded-[2rem] shadow-[8px_8px_0px_#FFB22C] md:shadow-[12px_12px_0px_#FFB22C] relative"
                    >
                        {/* Progress Bar */}
                        <div className="mb-8 md:mb-10">
                            <div className="flex justify-between text-[10px] md:text-sm uppercase font-black tracking-widest mb-3 text-gray-500">
                                <span className={step >= 1 ? "text-brand-yellow" : ""}>01. Basic</span>
                                <span className={step >= 2 ? "text-brand-yellow" : ""}>02. Role</span>
                                <span className={step >= 3 ? "text-brand-yellow" : ""}>03. Questions</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                                <div
                                    className="h-full bg-brand-yellow transition-all duration-500 ease-in-out"
                                    style={{ width: `${(step / 3) * 100}% ` }}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 md:mb-8 bg-red-900/20 border-2 border-red-500 text-red-500 p-3 md:p-4 rounded-xl font-bold uppercase text-center animate-pulse text-sm md:text-base">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 && (
                                <div
                                    className="space-y-4 md:space-y-6"
                                >
                                    {renderField('fullName', 'Your Name', 'text', 'John Doe')}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        {renderField('prn', 'PRN', 'text', '202XXXXXXXX')}
                                        {renderField('division', 'Division', 'text', 'A / B / C...')}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        {renderField('email', 'E-Mail ID', 'email', 'you@example.com')}
                                        {renderField('contactNumber', 'Contact Number', 'tel', '9999999999')}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-full bg-white text-black text-xl md:text-2xl font-black uppercase py-4 md:py-5 border-4 border-transparent hover:bg-brand-yellow hover:border-black transition-all flex items-center justify-center gap-3 rounded-xl mt-4"
                                    >
                                        Next Step <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div
                                    className="space-y-6"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="border-2 border-white text-white px-5 py-2 rounded-xl font-bold uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2 text-xs md:text-sm mb-8"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>

                                    <div className="mb-8 md:mb-12">
                                        <label className="block text-lg md:text-xl font-bold uppercase mb-4 md:mb-6 text-white">
                                            Rate yourself in Time Management (1-10) <span className="text-brand-yellow text-lg">*</span>
                                        </label>
                                        <div className="bg-zinc-800/50 p-6 rounded-xl border-2 border-zinc-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="font-mono text-gray-500 text-xs md:text-sm">NOT EFFICIENT</span>
                                                <span className="text-4xl font-black text-brand-yellow">{formData.timeManagementRating || 5}</span>
                                                <span className="font-mono text-gray-500 text-xs md:text-sm">VERY EFFICIENT</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                step="1"
                                                name="timeManagementRating"
                                                value={formData.timeManagementRating || 5}
                                                onChange={handleChange}
                                                className="w-full h-3 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-brand-yellow hover:bg-zinc-500 transition-colors"
                                            />
                                            <div className="flex justify-between mt-3 text-[10px] md:text-xs text-zinc-500 font-mono">
                                                <span>1</span>
                                                <span>2</span>
                                                <span>3</span>
                                                <span>4</span>
                                                <span>5</span>
                                                <span>6</span>
                                                <span>7</span>
                                                <span>8</span>
                                                <span>9</span>
                                                <span>10</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-8 md:mb-10">
                                        <label className="block text-xl md:text-2xl font-black uppercase mb-4 md:mb-6 text-white border-t-4 border-zinc-800 pt-6 md:pt-8">
                                            Pick your superpower! 💪 <br /><span className="text-brand-yellow text-base md:text-lg font-mono font-normal">Which role excites you the most?</span>
                                        </label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {roles.map((roleObj) => (
                                                <div
                                                    key={roleObj.id}
                                                    onClick={() => handleChange({ target: { name: 'role', value: roleObj.id } })}
                                                    className={`cursor - pointer border - 2 p - 4 md: p - 5 rounded - xl flex items - center justify - between transition - all active: scale - [0.98] ${formData.role === roleObj.id
                                                        ? `bg-zinc-800 border-white text-white shadow-[4px_4px_0px_#FFB22C]`
                                                        : 'bg-black/50 border-zinc-800 text-gray-400 hover:border-zinc-500'
                                                        } `}
                                                >
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className={`w - 5 h - 5 md: w - 6 md: h - 6 rounded - full border - 2 flex items - center justify - center ${formData.role === roleObj.id ? 'border-brand-yellow' : 'border-zinc-600'
                                                            } `}>
                                                            {formData.role === roleObj.id && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-brand-yellow rounded-full" />}
                                                        </div>
                                                        <span className={`font - bold uppercase tracking - wider text - sm md: text - base ${formData.role === roleObj.id ? 'text-white' : ''} `}>
                                                            {roleObj.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-full bg-white text-black text-xl md:text-2xl font-black uppercase py-4 md:py-5 border-4 border-transparent hover:bg-brand-yellow hover:border-black transition-all flex items-center justify-center gap-3 rounded-xl"
                                    >
                                        Next Step <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                </div>
                            )}

                            {step === 3 && (
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="border-2 border-white text-white px-5 py-2 rounded-xl font-bold uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2 text-xs md:text-sm mb-8"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back to Role Selection
                                    </button>

                                    <div className="mb-6 md:mb-8">
                                        <h2 className="text-2xl md:text-3xl font-black uppercase text-brand-yellow mb-2">
                                            {roles.find(r => r.id === formData.role)?.label}
                                        </h2>
                                        <p className="text-gray-400 text-sm md:text-base">Answer the following questions to show us what you've got.</p>
                                    </div>

                                    {formData.role === 'pr' && (
                                        <>
                                            {renderField('pr_why', 'Why PR?', 'textarea')}
                                            {renderField('pr_experience', 'Describe a past experience where you had to promote or convince people efficiently.', 'textarea')}
                                            {renderField('pr_scenario', 'Posters/social media fail — how do you still attract a crowd?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'marketing' && (
                                        <>
                                            {renderField('marketing_promotion', 'How would you promote a college event to maximize participation?', 'textarea')}
                                            {renderField('marketing_strategy', 'Event registrations are low 2 days before the deadline. What quick marketing strategies do you implement?', 'textarea')}
                                            {renderField('marketing_adapt', 'You notice the marketing plan you created isn\'t working. How do you adapt in real-time?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'social_media' && (
                                        <>
                                            {renderField('sm_experience', 'Any prior experience of handling social media?', 'textarea')}
                                            {renderField('sm_skills', 'What skills you think are important for this role?', 'textarea')}
                                            {renderField('sm_brand', 'Can you name one brand or page you follow that has great social media presence? What do you like about it?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'operations' && (
                                        <>
                                            {renderField('ops_jugaad', 'What’s the most “jugaad” thing you’ve ever pulled off?', 'textarea')}
                                            {renderField('ops_prioritize', 'How do you prioritize tasks when multiple things need to be done at once?', 'textarea')}
                                            {renderField('ops_crisis', 'On event day, food is late, chief guest is missing, and students are restless. What’s your plan?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'technical' && (
                                        <>
                                            {renderField('tech_project', 'Have you ever built something fun (even small) with code? Describe it in 2 lines.', 'textarea')}
                                            {renderField('tech_experience', 'Have you worked on websites, apps, or any event tech before?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'corporate_relations' && (
                                        <>
                                            {renderField('cr_why', 'Why would you be good at Corporate Relations?', 'textarea')}
                                            {renderField('cr_pitch', 'How would you pitch an event to a sponsor in 2 sentences?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'design' && (
                                        <>
                                            {renderField('design_portfolio', 'Do you have a portfolio? Paste link here (Drive/Behance/etc).', 'text')}
                                            {renderField('design_software', 'Which design software are you most proficient in?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'aesthetics' && (
                                        <>
                                            {renderField('aesthetics_ideas', 'Describe a theme idea for a tech event decoration.', 'textarea')}
                                            {renderField('aesthetics_experience', 'Have you worked on venue decoration or stage setup before?', 'textarea')}
                                        </>
                                    )}

                                    <div className="flex justify-center mb-6">
                                        <ReCAPTCHA
                                            ref={recaptchaRef}
                                            sitekey="6LfkAWAsAAAAANtYBVUELWkoCVaCWCpbvhC_s6rv"
                                            onChange={onCaptchaChange}
                                            theme="dark"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !captchaToken}
                                        className="w-full bg-brand-yellow text-[var(--text-on-brand)] text-xl md:text-2xl font-black uppercase py-4 md:py-6 border-4 border-black hover:bg-white hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-[4px_4px_0px_#fff]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin w-6 h-6 md:w-8 md:h-8" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Application <Star className="w-6 h-6 md:w-8 md:h-8 fill-black" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            {/* Success Modal */}
            {showSuccess && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/95 backdrop-blur-md"
                >
                    <div
                        className="bg-zinc-900 border-4 border-brand-yellow p-8 md:p-12 rounded-[2rem] max-w-lg w-full text-center shadow-[0_0_100px_rgba(255,178,44,0.3)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-brand-yellow to-transparent" />

                        <div className="w-20 h-20 md:w-24 md:h-24 bg-black text-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <Check className="w-10 h-10 md:w-12 md:h-12" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase mb-4 text-white italic tracking-tighter">
                            APPLICATION <span className="text-brand-yellow">SENT!</span>
                        </h2>
                        <p className="text-gray-400 font-bold mb-8 text-base md:text-xl">
                            We've received your application. We'll be in touch soon!
                        </p>

                        <button
                            onClick={() => {
                                setShowSuccess(false);
                                window.location.href = '/';
                            }}
                            className="w-full bg-white text-black px-6 md:px-8 py-3 md:py-4 rounded-xl font-black uppercase text-lg md:text-xl hover:bg-brand-yellow border-4 border-transparent hover:border-black transition-all"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplyNow;
