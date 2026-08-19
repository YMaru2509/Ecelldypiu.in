import ReCAPTCHA from "react-google-recaptcha";
import { useState, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Loader2, ArrowRight, Check } from 'lucide-react';

const Newsletter = () => {

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [captchaToken, setCaptchaToken] = useState(null);
    const recaptchaRef = useRef(null);

    const onCaptchaChange = (token) => {
        setCaptchaToken(token);
    };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validation Logic
        if (name === 'name') {
            // Only allow letters and spaces
            if (value && !/^[A-Za-z\s]+$/.test(value)) return;
        }

        if (name === 'phone') {
            // Only allow numbers
            if (value && !/^\d+$/.test(value)) return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
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
            const response = await fetch('/api/subscriber', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Submission failed');
            }

            const result = await response.json();
            console.log('✅ Successfully submitted, response:', result);
            setShowSuccess(true);
            setFormData({ name: '', email: '', phone: '' });
        } catch (err) {
            console.error('❌ Submission Error:', err);
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

    const renderField = (name, label, type = 'text', placeholder = '', required = true) => (
        <div className="mb-6">
            <label className="block text-lg md:text-xl font-bold uppercase mb-2 text-white">
                {label} {required && <span className="text-brand-yellow text-lg align-top">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="w-full bg-zinc-900 border-b-4 border-zinc-700 p-3 md:p-4 text-base md:text-lg text-white focus:border-brand-yellow focus:outline-none transition-colors placeholder-gray-600 font-bold rounded-lg"
                placeholder={placeholder}
                required={required}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-[var(--text-on-brand)] font-sans overflow-x-hidden">

            {/* Hero / Header */}
            <section className="min-h-[25vh] md:min-h-[35vh] flex flex-col justify-center pt-28 md:pt-32 pb-8 relative border-b-4 border-white bg-black">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div>
                        <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase mb-2 md:mb-4">
                            NEWSLETTER <span className="text-brand-yellow">SUBSCRIPTION</span>
                        </h1>
                        <p className="text-gray-400 text-sm md:text-xl max-w-2xl mx-auto font-mono px-4">
                            Stay updated with the latest from <span className="text-white font-bold">E-Cell DYPIU</span>.
                        </p>
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-8 md:py-12 px-4">
                <div className="container mx-auto max-w-2xl">
                    <div
                        className="bg-zinc-900 border-2 md:border-4 border-white p-6 md:p-12 rounded-[1.5rem] md:rounded-[2rem] shadow-[8px_8px_0px_#FFB22C] md:shadow-[12px_12px_0px_#FFB22C] relative"
                    >
                        {error && (
                            <div className="mb-6 md:mb-8 bg-red-900/20 border-2 border-red-500 text-red-500 p-3 md:p-4 rounded-xl font-bold uppercase text-center animate-pulse text-sm md:text-base">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {renderField('name', 'Your Name', 'text', 'John Doe')}
                            {renderField('email', 'Email ID', 'email', 'you@example.com')}
                            {renderField('phone', 'Phone Number', 'tel', '9999999999')}


                            <div className="flex justify-center mb-6 min-h-[78px]">
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
                                        SUBSCRIBE <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/95 backdrop-blur-md">
                    <div className="bg-zinc-900 border-4 border-brand-yellow p-8 md:p-12 rounded-[2rem] max-w-lg w-full text-center shadow-[0_0_100px_rgba(255,178,44,0.3)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-brand-yellow to-transparent" />

                        <div className="w-20 h-20 md:w-24 md:h-24 bg-black text-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <Check className="w-10 h-10 md:w-12 md:h-12" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase mb-4 text-white italic tracking-tighter">
                            SUBSCRIBED <span className="text-brand-yellow">SUCCESSFULLY!</span>
                        </h2>
                        <p className="text-gray-400 font-bold mb-8 text-base md:text-xl">
                            You're now on our mailing list. Stay tuned!
                        </p>

                        <button
                            onClick={() => {
                                setShowSuccess(false);
                            }}
                            className="w-full bg-white text-black px-6 md:px-8 py-3 md:py-4 rounded-xl font-black uppercase text-lg md:text-xl hover:bg-brand-yellow border-4 border-transparent hover:border-black transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Newsletter;
