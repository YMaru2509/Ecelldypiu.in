import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, PartyPopper } from 'lucide-react';
import { useAuth } from '../context/useAuth';

// The QR code's scan target. eventId + token come from the URL (encoded into
// the QR shown in the room); the member's own logged-in session is what
// proves *who* is scanning — ProtectedRoute already guarantees we only get
// here authenticated.
const CheckIn = () => {
    const { currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('eventId');
    const token = searchParams.get('token');

    const [status, setStatus] = useState('checking'); // 'checking' | 'success' | 'already' | 'error'
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            if (!eventId || !token) {
                setStatus('error');
                setError('This check-in link is missing information — scan the QR code again.');
                return;
            }
            try {
                const idToken = await currentUser.getIdToken();
                const res = await fetch('/api/event?action=scan-checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                    body: JSON.stringify({ eventId, token }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Check-in failed');
                setStatus(data.alreadyCheckedIn ? 'already' : 'success');
            } catch (err) {
                setStatus('error');
                setError(err.message || 'Check-in failed. Try scanning again.');
            }
        })();
    }, [eventId, token, currentUser]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 py-16">
            <div className="max-w-md w-full bg-[var(--bg-card)] border-4 border-[var(--border-color)] p-8 rounded-3xl shadow-[8px_8px_0px_#FFB22C] text-center">
                {status === 'checking' && (
                    <>
                        <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mx-auto mb-4" />
                        <h1 className="text-xl font-black uppercase">Checking you in...</h1>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <PartyPopper className="w-14 h-14 text-brand-yellow mx-auto mb-4" />
                        <h1 className="text-2xl font-black uppercase mb-2">You're checked in!</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Your attendance has been recorded and verified.</p>
                    </>
                )}
                {status === 'already' && (
                    <>
                        <CheckCircle2 className="w-14 h-14 text-[var(--success-color)] mx-auto mb-4" />
                        <h1 className="text-2xl font-black uppercase mb-2">Already checked in</h1>
                        <p className="text-sm text-[var(--text-secondary)]">You were already marked present for this event.</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="w-14 h-14 text-[var(--danger-color)] mx-auto mb-4" />
                        <h1 className="text-2xl font-black uppercase mb-2">Check-in failed</h1>
                        <p className="text-sm text-[var(--danger-color)] font-bold">{error}</p>
                    </>
                )}

                {status !== 'checking' && (
                    <Link
                        to="/profile"
                        className="inline-block mt-6 bg-brand-yellow text-[var(--text-on-brand)] font-black px-6 py-3 rounded-xl text-xs uppercase hover:bg-white transition-colors"
                    >
                        Go to My Profile
                    </Link>
                )}
            </div>
        </div>
    );
};

export default CheckIn;
