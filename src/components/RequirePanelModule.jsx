import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { usePanelAccess } from '../context/panelAccessContext';
import PanelShell from '../pages/Panel/PanelShell';

// Page-level guard inside the panel: a member who types a URL for a module they
// don't hold gets a clear message inside the panel instead of a broken page
// full of 403s. (The endpoints refuse them regardless.)
const RequirePanelModule = ({ module, children }) => {
    const { canAccess } = usePanelAccess();
    if (canAccess(module)) return children;
    return (
        <PanelShell>
            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-8 text-center">
                <Lock className="w-8 h-8 text-brand-yellow mx-auto mb-3" />
                <h1 className="font-black uppercase text-xl mb-2">Not available to you</h1>
                <p className="text-sm text-[var(--text-secondary)] mb-5">Your account doesn't have access to this module.</p>
                <Link to="/panel" className="inline-block bg-brand-yellow text-[var(--text-on-brand)] font-black uppercase text-xs px-5 py-2.5 rounded-xl">
                    Back to dashboard
                </Link>
            </div>
        </PanelShell>
    );
};

export default RequirePanelModule;
