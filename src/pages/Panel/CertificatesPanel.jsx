import { useMemo } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import PanelShell from './PanelShell';
import CertificateManager from '../../components/CertificateManager';
import ViewOnlyNotice from '../../components/ViewOnlyNotice';
import { usePanelAccess } from '../../context/panelAccessContext';
import { auth } from '../../firebaseConfig';

const CertificatesPanel = () => {
    const { mode, credential } = usePanelAccess();

    // Sending certificates to a whole attendee list asks for a password first.
    // With the shared admin login that's the admin password; a staff member
    // proves it's them by re-entering their own account password.
    const verifyPassword = useMemo(() => {
        if (mode !== 'member') return undefined;
        return async (typed) => {
            const user = auth.currentUser;
            if (!user?.email || !typed) return false;
            try {
                await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, typed));
                return true;
            } catch {
                return false;
            }
        };
    }, [mode]);

    return (
        <PanelShell>
            <ViewOnlyNotice module="certificates" label="certificates" />
            <CertificateManager
                adminKey={credential}
                verifyPassword={verifyPassword}
                passwordLabel={mode === 'member' ? 'Your Account Password' : 'Admin Password'}
            />
        </PanelShell>
    );
};

export default CertificatesPanel;
