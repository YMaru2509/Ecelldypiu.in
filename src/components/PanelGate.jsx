import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { onIdTokenChanged } from 'firebase/auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/useAuth';
import { PanelAccessContext } from '../context/panelAccessContext';
import { setMemberPanelToken } from '../utils/adminAuth';
import { PANEL_MODULES, hasStaffAccess } from '../utils/panelModules';
import ProtectedRoute from './ProtectedRoute';

// What the panel treats the shared admin password as: a system owner with no
// personal identity (the server does the same — see ADMIN_PANEL_ACTOR in
// api/_lib/rbac.js).
const ADMIN_PROFILE = { roles: ['system_owner'], permissions: {} };

// `credential` is the bearer string for the active session. Embedded legacy
// tools (certificates, links, …) take it as a prop and put it in their own
// request headers, so it has to follow the member's rotating ID token.
const buildAccess = (mode, profile, name, credential) => ({
    mode,
    profile,
    name,
    credential,
    canAccess: (key) => PANEL_MODULES.some((m) => m.key === key && m.access(profile)),
});

const FullPageMessage = ({ children }) => (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-6">
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-8 max-w-md w-full text-center">
            {children}
        </div>
    </div>
);

const Denied = ({ title, message, action }) => (
    <FullPageMessage>
        <ShieldAlert className="w-10 h-10 text-brand-yellow mx-auto mb-4" />
        <h1 className="font-black uppercase text-xl mb-2">{title}</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        {action || (
            <Link to="/profile" className="inline-block bg-brand-yellow text-[var(--text-on-brand)] font-black uppercase text-xs px-5 py-2.5 rounded-xl">
                Back to my profile
            </Link>
        )}
    </FullPageMessage>
);

// Signed-in member: confirm with the server who they are and what they hold,
// then hand the panel only the modules those permissions open.
const MemberGate = () => {
    const { currentUser } = useAuth();
    const [state, setState] = useState({ status: 'loading' });
    const [token, setToken] = useState(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setState({ status: 'loading' });

        // Keeps the shared token slot current as Firebase rotates the ID token.
        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            const fresh = user ? await user.getIdToken() : null;
            setMemberPanelToken(fresh);
            if (!cancelled) setToken(fresh);
        });

        (async () => {
            try {
                const idToken = await currentUser.getIdToken();
                setMemberPanelToken(idToken);
                setToken(idToken);
                const res = await fetch('/api/panel-users?action=whoami', {
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (res.status === 401 || res.status === 403) {
                    setState({ status: 'denied', message: data.error || 'Your account is not allowed into the staff panel.' });
                } else if (!res.ok) {
                    setState({ status: 'error', message: data.error || 'Could not verify your access.' });
                } else {
                    setState({ status: 'ready', member: data.member });
                }
            } catch {
                if (!cancelled) setState({ status: 'error', message: 'Could not reach the server to verify your access.' });
            }
        })();

        // The token slot is deliberately not cleared here: this effect re-runs
        // (e.g. React dev double-mount, profile refresh) while child screens are
        // already fetching, and a momentary null would turn those requests into
        // spurious 401s. Sign-out clears it via onIdTokenChanged above.
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [currentUser, attempt]);

    const access = useMemo(
        () => (state.status === 'ready' ? buildAccess('member', state.member, state.member.name, token) : null),
        [state, token]
    );

    if (state.status === 'loading') {
        return (
            <FullPageMessage>
                <Loader2 className="w-8 h-8 text-brand-yellow animate-spin mx-auto mb-3" />
                <p className="font-bold uppercase text-xs tracking-wider text-[var(--text-secondary)]">Verifying staff access…</p>
            </FullPageMessage>
        );
    }

    if (state.status === 'denied') {
        return <Denied title="Access denied" message={state.message} />;
    }

    if (state.status === 'error') {
        return (
            <Denied
                title="Something went wrong"
                message={state.message}
                action={
                    <button type="button" onClick={() => setAttempt((n) => n + 1)} className="bg-brand-yellow text-[var(--text-on-brand)] font-black uppercase text-xs px-5 py-2.5 rounded-xl">
                        Try again
                    </button>
                }
            />
        );
    }

    if (!hasStaffAccess(state.member)) {
        return (
            <Denied
                title="No staff access"
                message="Your account doesn't have access to any staff panel modules. If you think it should, ask a system owner to assign them."
            />
        );
    }

    return (
        <PanelAccessContext.Provider value={access}>
            <Outlet />
        </PanelAccessContext.Provider>
    );
};

const AdminGate = () => {
    const access = useMemo(() => buildAccess('admin', ADMIN_PROFILE, 'Admin', sessionStorage.getItem('adminKey')), []);
    return (
        <PanelAccessContext.Provider value={access}>
            <Outlet />
        </PanelAccessContext.Provider>
    );
};

// Layout route for everything under /panel. The shared admin password (set by
// logging in at /admin) opens everything as before; otherwise the visitor must
// be signed in as a member — ProtectedRoute sends them to /login (and back here
// afterwards) and enforces the temp-password and onboarding steps first.
const PanelGate = () => {
    const hasAdminKey = typeof window !== 'undefined' && !!sessionStorage.getItem('adminKey');
    if (hasAdminKey) return <AdminGate />;
    return (
        <ProtectedRoute>
            <MemberGate />
        </ProtectedRoute>
    );
};

export default PanelGate;
