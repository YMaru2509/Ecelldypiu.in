import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Loader2, CheckCircle2, XCircle, PartyPopper, ScanLine, CameraOff, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { parseCheckinQr, submitCheckin } from '../utils/checkin';

const CAMERA_ERRORS = {
    'permission-denied': 'Camera access was blocked. Allow the camera for this site in your browser settings, then reload.',
    'no-camera': 'No camera was found on this device.',
    'in-use': 'Your camera is being used by another app. Close it and try again.',
    'insecure-context': 'The camera only works on a secure (https) page.',
    unsupported: 'This browser can\'t scan QR codes. Try Chrome or Safari.',
};

// In-app scanner for core members: open it, point the camera at the QR shown
// in the room, and attendance is marked — no need to leave for the phone's
// camera app and wait for a link to open.
const ScanCheckIn = () => {
    const { currentUser } = useAuth();
    const [phase, setPhase] = useState('scanning'); // 'scanning' | 'submitting' | 'result'
    const [result, setResult] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const lastScan = useRef('');

    const handleScan = async (codes) => {
        const raw = codes?.[0]?.rawValue;
        if (!raw || phase !== 'scanning' || raw === lastScan.current) return;
        lastScan.current = raw;

        const parsed = parseCheckinQr(raw);
        if (!parsed) {
            setResult({ type: 'error', message: 'That isn\'t an attendance QR code. Scan the one shown in the room.' });
            setPhase('result');
            return;
        }

        setPhase('submitting');
        try {
            const data = await submitCheckin(currentUser, parsed);
            setResult({
                type: data.alreadyCheckedIn ? 'already' : 'success',
                eventTitle: data.eventTitle,
                room: data.room,
            });
        } catch (err) {
            setResult({ type: 'error', message: err.message || 'Check-in failed. Try scanning again.' });
        }
        setPhase('result');
    };

    const scanAgain = () => {
        lastScan.current = '';
        setResult(null);
        setPhase('scanning');
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center p-4 pt-28 pb-16">
            <div className="max-w-md w-full bg-[var(--bg-card)] border-4 border-[var(--border-color)] p-6 rounded-3xl shadow-[8px_8px_0px_var(--primary-color)] text-center">
                <h1 className="text-xl font-black uppercase flex items-center justify-center gap-2 mb-1">
                    <ScanLine className="w-5 h-5 text-brand-yellow" /> Scan Attendance
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mb-5">Point your camera at the QR code shown in the room.</p>

                {phase !== 'result' && (
                    cameraError ? (
                        <div className="rounded-2xl border-2 border-[var(--border-color)] p-6">
                            <CameraOff className="w-10 h-10 text-[var(--danger-color)] mx-auto mb-3" />
                            <p className="text-sm font-bold text-[var(--danger-color)]">{cameraError}</p>
                        </div>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden border-4 border-[var(--border-color)] bg-black">
                            <Scanner
                                onScan={handleScan}
                                onError={(err) => setCameraError(CAMERA_ERRORS[err?.kind] || 'The camera couldn\'t start. Check permissions and try again.')}
                                formats={['qr_code']}
                                paused={phase === 'submitting'}
                                components={{ finder: true, torch: true }}
                            />
                            {phase === 'submitting' && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                                    <Loader2 className="w-10 h-10 animate-spin text-brand-yellow mb-3" />
                                    <p className="text-sm font-black uppercase">Checking you in…</p>
                                </div>
                            )}
                        </div>
                    )
                )}

                {phase === 'result' && result && (
                    <div className="py-4">
                        {result.type === 'success' && (
                            <>
                                <PartyPopper className="w-14 h-14 text-brand-yellow mx-auto mb-4" />
                                <h2 className="text-2xl font-black uppercase mb-2">You're checked in!</h2>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {result.eventTitle ? `${result.eventTitle}${result.room ? ` · ${result.room}` : ''}` : 'Your attendance has been recorded and verified.'}
                                </p>
                            </>
                        )}
                        {result.type === 'already' && (
                            <>
                                <CheckCircle2 className="w-14 h-14 text-[var(--success-color)] mx-auto mb-4" />
                                <h2 className="text-2xl font-black uppercase mb-2">Already checked in</h2>
                                <p className="text-sm text-[var(--text-secondary)]">You were already marked present{result.eventTitle ? ` for ${result.eventTitle}` : ''}.</p>
                            </>
                        )}
                        {result.type === 'error' && (
                            <>
                                <XCircle className="w-14 h-14 text-[var(--danger-color)] mx-auto mb-4" />
                                <h2 className="text-2xl font-black uppercase mb-2">Couldn't check in</h2>
                                <p className="text-sm text-[var(--danger-color)] font-bold">{result.message}</p>
                            </>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                            {result.type === 'error' && (
                                <button type="button" onClick={scanAgain} className="flex items-center justify-center gap-2 bg-brand-yellow text-[var(--text-on-brand)] font-black px-5 py-3 rounded-xl text-xs uppercase">
                                    <RotateCcw className="w-4 h-4" /> Scan again
                                </button>
                            )}
                            <Link to="/profile" className="inline-block border-2 border-[var(--border-color)] font-black px-5 py-3 rounded-xl text-xs uppercase hover:bg-[var(--bg-hover)]">
                                Back to my profile
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanCheckIn;
