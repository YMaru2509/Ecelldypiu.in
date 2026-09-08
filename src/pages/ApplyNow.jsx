import ReCAPTCHA from "react-google-recaptcha";
import { useState, useEffect, useRef } from 'react';
import { Check, Loader2, ArrowRight, ArrowLeft, Star, Briefcase, Palette, Megaphone, Rocket, Clapperboard, Wrench } from 'lucide-react';

const ApplyNow = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [missingField, setMissingField] = useState(null);
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
        timeManagementRating: '5',
        role: '',

        // Step 3: Role Specific Answers
        pr_experience: '',
        pr_campaign: '',
        pr_collab: '',

        marketing_urgency: '',
        marketing_strategy: '',
        marketing_adapt: '',

        sm_format: '',
        sm_complex: '',
        sm_low_footage: '',
        sm_low_reach: '',

        ops_jugaad: '',
        ops_chaos: '',
        ops_forgot: '',

        cr_why: '',
        cr_first_message: '',
        cr_benefit: '',
        cr_gameplan: '',

        design_why: '',
        design_poster: '',
        design_software: '',
        design_portfolio: ''
    });

    const roles = [
        {
            id: 'corporate_relations',
            label: 'Corporate Relations',
            badge: 'High Chances 🔥',
            desc: 'Hunt down sponsorships, close brand deals, and build lasting corporate partnerships.',
            icon: Briefcase,
            borderHover: 'hover:border-orange-500/60'
        },
        {
            id: 'design',
            label: 'Design',
            badge: 'High Chances 🔥',
            desc: 'Craft killer posters, visual branding, and cool merch that define E-Cell’s visual vibe.',
            icon: Palette,
            borderHover: 'hover:border-red-500/60'
        },
        {
            id: 'pr',
            label: 'PR (Public Relations)',
            badge: 'Campus Voice 📣',
            desc: 'Be E-Cell’s campus face, lead speaker outreach, and build inter-college community ties.',
            icon: Megaphone,
            borderHover: 'hover:border-pink-500/60'
        },
        {
            id: 'marketing',
            label: 'Marketing',
            badge: 'Hype Squad 🚀',
            desc: 'Make E-Cell the hottest topic on campus, spark hype, and pack auditoriums for events.',
            icon: Rocket,
            borderHover: 'hover:border-blue-500/60'
        },
        {
            id: 'social_media',
            label: 'Social Media',
            badge: 'Content & Trends 📱',
            desc: 'Brainstorm viral creatives, run our social handles, and keep our feeds buzzing.',
            icon: Clapperboard,
            borderHover: 'hover:border-purple-500/60'
        },
        {
            id: 'operations',
            label: 'Operations',
            badge: 'Masterminds ⚡',
            desc: 'Run the show backstage, manage event chaos, master logistics, and pull off epic jugaad.',
            icon: Wrench,
            borderHover: 'hover:border-green-500/60'
        }
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
        if (missingField === name) {
            setMissingField(null);
            setError(null);
        }
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
            setMissingField(missing);
            const errorMsg = missing === 'role'
                ? 'Please select a role to proceed'
                : missing === 'timeManagementRating'
                    ? 'Please rate yourself in Time Management'
                    : `Please fill in ${missing.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
            setError(errorMsg);

            setTimeout(() => {
                const targetElement = document.getElementById(`field-container-${missing}`) ||
                    document.getElementById(`field-${missing}`) ||
                    document.querySelector(`[name="${missing}"]`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const inputElement = document.getElementById(`field-${missing}`) || targetElement.querySelector('input, textarea');
                    if (inputElement) {
                        inputElement.focus();
                    }
                }
            }, 50);
            return;
        }

        setMissingField(null);
        setError(null);
        setStep(prev => prev + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('🚀 Form submission started');
        console.log('📝 Form data:', formData);

        // Validate Step 3 fields before proceeding
        let step3Fields = [];
        if (formData.role === 'corporate_relations') step3Fields = ['cr_why', 'cr_first_message', 'cr_gameplan'];
        else if (formData.role === 'design') step3Fields = ['design_why', 'design_poster', 'design_software'];
        else if (formData.role === 'pr') step3Fields = ['pr_experience', 'pr_campaign', 'pr_collab'];
        else if (formData.role === 'marketing') step3Fields = ['marketing_urgency', 'marketing_strategy', 'marketing_adapt'];
        else if (formData.role === 'social_media') step3Fields = ['sm_format', 'sm_complex', 'sm_low_footage', 'sm_low_reach'];
        else if (formData.role === 'operations') step3Fields = ['ops_jugaad', 'ops_chaos', 'ops_forgot'];

        const missing = step3Fields.find(f => !formData[f]?.trim());
        if (missing) {
            setMissingField(missing);
            setError('Please answer all role-specific questions');
            setTimeout(() => {
                const el = document.getElementById(`field-container-${missing}`) || document.getElementById(`field-${missing}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const inputEl = document.getElementById(`field-${missing}`) || el.querySelector('input, textarea');
                    inputEl?.focus();
                }
            }, 50);
            return;
        }

        if (!captchaToken) {
            console.error('❌ No captcha token');
            setError('Please complete the reCAPTCHA verification');
            const recaptchaEl = document.getElementById('recaptcha-container');
            if (recaptchaEl) {
                recaptchaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
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

    const renderField = (name, label, type = 'text', placeholder = '') => {
        const hasError = missingField === name;
        return (
            <div id={`field-container-${name}`} className="mb-6 transition-all">
                <label className="block text-lg md:text-xl font-bold uppercase mb-2 text-white flex items-center justify-between">
                    <span>{label} <span className="text-brand-yellow text-lg align-top">*</span></span>
                    {hasError && (
                        <span className="text-red-400 text-xs font-bold uppercase tracking-wider animate-bounce">
                            ⚠️ Required Field
                        </span>
                    )}
                </label>
                {type === 'textarea' ? (
                    <textarea
                        id={`field-${name}`}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        rows="4"
                        className={`w-full bg-zinc-900 border-b-4 p-3 md:p-4 text-base md:text-lg text-white focus:border-brand-yellow focus:outline-none transition-all placeholder-gray-600 resize-none font-medium rounded-lg ${
                            hasError
                                ? 'border-red-500 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                                : 'border-zinc-700'
                        }`}
                        placeholder={placeholder}
                        required
                    />
                ) : (
                    <input
                        id={`field-${name}`}
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        className={`w-full bg-zinc-900 border-b-4 p-3 md:p-4 text-base md:text-lg text-white focus:border-brand-yellow focus:outline-none transition-all placeholder-gray-600 font-bold rounded-lg ${
                            hasError
                                ? 'border-red-500 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                                : 'border-zinc-700'
                        }`}
                        placeholder={placeholder}
                        required
                    />
                )}
                {hasError && (
                    <p className="text-red-400 text-xs md:text-sm font-bold mt-2 flex items-center gap-1.5">
                        ⚠️ Please fill in this field to continue
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-black font-sans">
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

                                    <div id="field-container-timeManagementRating" className="mb-8 md:mb-12 transition-all">
                                        <div className="flex items-center justify-between mb-4 md:mb-6">
                                            <label className="block text-lg md:text-xl font-bold uppercase text-white">
                                                Rate yourself in Time Management (1-10) <span className="text-brand-yellow text-lg">*</span>
                                            </label>
                                            {missingField === 'timeManagementRating' && (
                                                <span className="text-red-400 text-xs font-bold uppercase tracking-wider animate-bounce">
                                                    ⚠️ Required Field
                                                </span>
                                            )}
                                        </div>
                                        <div className={`bg-zinc-800/50 p-6 rounded-xl border-2 transition-all ${
                                            missingField === 'timeManagementRating'
                                                ? 'border-red-500 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                                                : 'border-zinc-700'
                                        }`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="font-mono text-gray-500 text-xs md:text-sm">NOT EFFICIENT</span>
                                                <span className="text-4xl font-black text-brand-yellow">{formData.timeManagementRating || 5}</span>
                                                <span className="font-mono text-gray-500 text-xs md:text-sm">VERY EFFICIENT</span>
                                            </div>
                                            <input
                                                id="field-timeManagementRating"
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
                                        {missingField === 'timeManagementRating' && (
                                            <p className="text-red-400 text-xs md:text-sm font-bold mt-2 flex items-center gap-1.5">
                                                ⚠️ Please rate yourself in time management
                                            </p>
                                        )}
                                    </div>

                                    <div id="field-container-role" className="mb-8 md:mb-10 transition-all">
                                        <div className="border-t-4 border-zinc-800 pt-6 md:pt-8 mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <label className="block text-xl md:text-2xl font-black uppercase text-white">
                                                Pick your superpower! 💪 <br />
                                                <span className="text-brand-yellow text-sm md:text-base font-mono font-normal">
                                                    Which role excites you the most? Select one to proceed.
                                                </span>
                                            </label>
                                            {missingField === 'role' && (
                                                <div className="text-red-400 text-xs md:text-sm font-bold uppercase tracking-wider animate-bounce flex items-center gap-1.5 self-start md:self-auto bg-red-950/40 border border-red-500/50 px-3 py-1.5 rounded-lg">
                                                    ⚠️ Please select a role to proceed
                                                </div>
                                            )}
                                        </div>

                                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4 p-2 rounded-2xl transition-all ${
                                            missingField === 'role'
                                                ? 'border-2 border-red-500 bg-red-950/10 shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-pulse'
                                                : ''
                                        }`}>
                                            {roles.map((roleObj) => {
                                                const Icon = roleObj.icon;
                                                const isSelected = formData.role === roleObj.id;
                                                return (
                                                    <div
                                                        key={roleObj.id}
                                                        onClick={() => handleChange({ target: { name: 'role', value: roleObj.id } })}
                                                        className={`cursor-pointer border-2 p-4 md:p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between text-left relative group ${
                                                            isSelected
                                                                ? 'bg-zinc-900 border-brand-yellow text-white shadow-[4px_4px_0px_#FFB22C] scale-[1.01]'
                                                                : `bg-zinc-950/80 border-zinc-800 text-gray-400 ${roleObj.borderHover} hover:bg-zinc-900/60`
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={`p-2 rounded-xl border ${
                                                                        isSelected
                                                                            ? 'bg-brand-yellow/20 border-brand-yellow/50 text-brand-yellow'
                                                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-white'
                                                                    }`}>
                                                                        <Icon className="w-5 h-5" />
                                                                    </div>
                                                                    <span className={`font-black uppercase tracking-wide text-sm md:text-base ${
                                                                        isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                                                                    }`}>
                                                                        {roleObj.label}
                                                                    </span>
                                                                </div>

                                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                    isSelected ? 'border-brand-yellow bg-brand-yellow' : 'border-zinc-700'
                                                                }`}>
                                                                    {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                                                                </div>
                                                            </div>

                                                            <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
                                                                {roleObj.desc}
                                                            </p>
                                                        </div>

                                                        {roleObj.badge && (
                                                            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-start">
                                                                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/30">
                                                                    {roleObj.badge}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
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

                                    {formData.role === 'corporate_relations' && (
                                        <>
                                            {renderField('cr_why', '1. Why Corporate Relations?', 'textarea')}
                                            {renderField('cr_first_message', '2. Imagine you have to approach a company that has never heard of our E-Cell. What would you say in your first message/email to make them interested in partnering with us?\nHow do you ensure both the event and the sponsor benefit from the partnership?', 'textarea')}
                                            {renderField('cr_gameplan', '3. You have 2 days to get ₹20,000 worth of sponsorship for an event, but you have zero existing contacts. What\'s your game plan?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'design' && (
                                        <>
                                            {renderField('design_why', '1. Why Design?', 'textarea')}
                                            {renderField('design_poster', '2. You have 30 minutes to make a post announcing an event. You have the logo, event name and date, nothing else. What are you putting on the poster, and what are you leaving out?', 'textarea')}
                                            {renderField('design_software', '3. Tools you use : (list them all)', 'textarea')}
                                            {renderField('design_portfolio', '4. Attach your portfolio or designs : (option to put up things in drive)', 'text', 'https://drive.google.com/... or Behance / Portfolio link')}
                                        </>
                                    )}

                                    {formData.role === 'pr' && (
                                        <>
                                            {renderField('pr_experience', '1. Tell us about one time you convinced someone, handled a conflict, or represented a group publicly.', 'textarea')}
                                            {renderField('pr_campaign', '2. We are launching a campus event, but students are showing almost no interest. You have 4 days to increase registrations. What would your campaign look like?', 'textarea')}
                                            {renderField('pr_collab', '3. E-Cell is organizing an event and wants to collaborate with an entrepreneurship community from another college. How would you approach them for the first time?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'marketing' && (
                                        <>
                                            {renderField('marketing_urgency', '1. What, according to you, is the best method for creating urgency in event ticket sales?', 'textarea')}
                                            {renderField('marketing_strategy', '2. Registrations for our flagship event are stuck at 40%, and the event is in 5 days. “Post more on Instagram” is not an answer. What would you actually do?', 'textarea')}
                                            {renderField('marketing_adapt', '3. A campaign is getting views but few registrations. What will be your approach to overcome this issue?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'social_media' && (
                                        <>
                                            {renderField('sm_format', '1. Which content format currently yields the highest engagement rate on Instagram/LinkedIn?', 'textarea')}
                                            {renderField('sm_complex', '2. You need to explain a complex E-Cell initiative (e.g., a startup mentorship program). What\'s the best approach?', 'textarea')}
                                            {renderField('sm_low_footage', '3. An E-Cell event happened yesterday, but you have very little usable footage. You still need to make the Instagram account active today. What would you post?', 'textarea')}
                                            {renderField('sm_low_reach', '4. Suppose an E-Cell reel gets very low reach despite having good content. What would you check before deciding that the content itself was bad?', 'textarea')}
                                        </>
                                    )}

                                    {formData.role === 'operations' && (
                                        <>
                                            {renderField('ops_jugaad', '1. What’s the most “jugaad” thing you’ve ever pulled off?', 'textarea')}
                                            {renderField('ops_chaos', '2. On event day, food is late, the chief guest is missing, and students are restless. What’s your plan to handle the chaos?', 'textarea')}
                                            {renderField('ops_forgot', '3. You realise 10 minutes before an event that your team forgot something important. You can either tell the senior immediately or try to fix it yourself first. What do you do and why?', 'textarea')}
                                        </>
                                    )}

                                    <div id="recaptcha-container" className={`flex flex-col items-center justify-center mb-6 p-4 rounded-2xl transition-all ${
                                        error && !captchaToken ? 'border-2 border-red-500 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' : ''
                                    }`}>
                                        <ReCAPTCHA
                                            ref={recaptchaRef}
                                            sitekey="6LfkAWAsAAAAANtYBVUELWkoCVaCWCpbvhC_s6rv"
                                            onChange={onCaptchaChange}
                                            theme="dark"
                                        />
                                        {error && !captchaToken && (
                                            <p className="text-red-400 text-xs md:text-sm font-bold mt-2">
                                                ⚠️ Please complete the reCAPTCHA verification to submit
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !captchaToken}
                                        className="w-full bg-brand-yellow text-black text-xl md:text-2xl font-black uppercase py-4 md:py-6 border-4 border-black hover:bg-white hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-[4px_4px_0px_#fff]"
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
