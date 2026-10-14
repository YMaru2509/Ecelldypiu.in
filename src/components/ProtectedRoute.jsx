import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2 } from 'lucide-react';
import { hasPermission } from '../utils/rbac';

// requirePermission, when passed, is { module, level } — level defaults to 'view'.
const ProtectedRoute = ({ children, requirePermission }) => {
    const { currentUser, userProfile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-6">
                    <img
                        src="/logonew.png"
                        alt="E-Cell DYPIU"
                        className="h-12 w-auto object-contain"
                    />
                </div>
                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-2xl p-8 max-w-sm w-full flex flex-col items-center shadow-[8px_8px_0px_#FFB22C]">
                    <Loader2 className="w-10 h-10 text-brand-yellow animate-spin mb-4" />
                    <p className="font-bold text-white uppercase text-sm tracking-wider">Verifying Session...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // mustChangePassword is set on every invited account (single or CSV) and takes
    // priority over everything else — a temp password must be replaced before the
    // account can do anything, including starting onboarding.
    if (userProfile?.mustChangePassword === true && location.pathname !== '/set-password') {
        return <Navigate to="/set-password" replace />;
    }

    // onboardingComplete === false (explicit) sends an incomplete profile to the
    // wizard first. Existing members predate this field entirely, so a missing
    // field is treated as complete — never force-redirect based on absence alone.
    // Every freshly-invited member has mustChangePassword AND onboardingComplete
    // both true/false respectively at once — without this guard, this rule and
    // the mustChangePassword rule above redirect to each other's target forever.
    if (userProfile?.mustChangePassword !== true && userProfile?.onboardingComplete === false && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    if (
        requirePermission &&
        !hasPermission(userProfile, requirePermission.module, requirePermission.level || 'view')
    ) {
        return <Navigate to="/panel" replace />;
    }

    return children;
};

export default ProtectedRoute;
