import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Mail, Lock, AlertCircle, Loader2, LogIn, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const { login, sendResetPassword, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/profile';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Forgot password state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetError, setResetError] = useState('');

    if (currentUser) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) return;

        setLoading(true);
        setError('');

        try {
            await login(email.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            console.error('Login error:', err);
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail.trim()) return;

        setResetLoading(true);
        setResetSuccess('');
        setResetError('');

        try {
            await sendResetPassword(resetEmail.trim());
            setResetSuccess('Password reset link has been sent to your email.');
            setResetEmail('');
        } catch (err) {
            console.error('Reset password error:', err);
            setResetError('Failed to send reset email. Please verify the email address.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 py-16">
            <div className="max-w-md w-full bg-zinc-900 border-4 border-white p-6 md:p-10 rounded-3xl shadow-[8px_8px_0px_#FFB22C] my-8">
                {/* Logo & Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="flex items-center space-x-3 mb-4 select-none">
                        <img
                            src="/logonew.png"
                            alt="E-Cell DYPIU Logo"
                            className="h-12 w-auto object-contain"
                        />
                        <span className="text-white font-bold text-2xl tracking-wide">
                            ECELL DYPIU
                        </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black uppercase text-white mb-2">
                        Welcome <span className="text-brand-yellow">Back</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">
                        Log in to your E-Cell DYPIU account
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-900/40 border-2 border-red-500 text-red-300 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                            Email Address <span className="text-brand-yellow">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                placeholder="you@mail.com"
                                required
                                autoComplete="email"
                                className="w-full bg-black border-2 border-zinc-700 pl-11 pr-4 py-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold uppercase text-gray-300">
                                Password <span className="text-brand-yellow">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => { setShowForgotModal(true); setResetEmail(email); setError(''); }}
                                className="text-xs text-brand-yellow hover:underline font-medium"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                className="w-full bg-black border-2 border-zinc-700 pl-11 pr-11 py-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-yellow focus:outline-none transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-yellow text-[var(--text-on-brand)] font-black py-4 rounded-xl uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-[4px_4px_0px_#000000] pt-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Log In
                            </>
                        )}
                    </button>
                </form>

                {/* Signup Link */}
                <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                    <p className="text-gray-400 text-sm">
                        New here?{' '}
                        <Link to="/register" className="text-brand-yellow font-bold uppercase hover:underline">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border-4 border-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0px_#FFB22C] space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                                <Lock className="w-5 h-5 text-brand-yellow" />
                                Reset Password
                            </h3>
                            <button
                                onClick={() => { setShowForgotModal(false); setResetSuccess(''); setResetError(''); }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {resetSuccess && (
                            <div className="bg-green-900/40 border-2 border-green-500 text-green-300 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                <span>{resetSuccess}</span>
                            </div>
                        )}

                        {resetError && (
                            <div className="bg-red-900/40 border-2 border-red-500 text-red-300 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span>{resetError}</span>
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <p className="text-xs text-gray-400">
                                Enter your registered email address and we'll send you a link to reset your password.
                            </p>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    placeholder="you@mail.com"
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    className="px-4 py-2 rounded-xl bg-zinc-800 text-gray-300 font-bold uppercase text-xs hover:bg-zinc-700"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading || !resetEmail.trim()}
                                    className="px-6 py-2 rounded-xl bg-brand-yellow text-[var(--text-on-brand)] font-black uppercase text-xs hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
