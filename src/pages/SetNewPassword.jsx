import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from 'firebase/auth';
import { Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const SetNewPassword = () => {
    const { currentUser, updateProfileData } = useAuth();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            await updatePassword(currentUser, password);
            await updateProfileData({ mustChangePassword: false });
            navigate('/onboarding', { replace: true });
        } catch (err) {
            console.error('Set password error:', err);
            if (err.code === 'auth/requires-recent-login') {
                setError('For security, please log out and log back in with your temporary password, then try again immediately.');
            } else {
                setError('Failed to set your password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 py-16">
            <div className="max-w-md w-full bg-zinc-900 border-4 border-white p-6 md:p-10 rounded-3xl shadow-[8px_8px_0px_#FFB22C]">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-brand-yellow/10 border-2 border-brand-yellow/30 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-brand-yellow" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black uppercase mb-2">Set a New Password</h1>
                    <p className="text-gray-400 text-sm">
                        You're using a temporary password. Choose a permanent one to continue.
                    </p>
                </div>

                {error && (
                    <div className="bg-[color-mix(in_srgb,var(--danger-bg)_40%,transparent)] border-2 border-red-500 text-[var(--danger-color)] p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-300 mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                className="w-full bg-black border-2 border-zinc-700 pl-11 pr-11 py-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-yellow"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-300 mb-2">Confirm Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                className="w-full bg-black border-2 border-zinc-700 pl-11 pr-4 py-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-yellow text-[var(--text-on-brand)] font-black py-4 rounded-xl uppercase hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-base shadow-[4px_4px_0px_#000000]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Set Password & Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetNewPassword;
