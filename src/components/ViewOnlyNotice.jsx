import { Eye } from 'lucide-react';
import { usePanelAccess } from '../context/panelAccessContext';
import { hasPermission } from '../utils/rbac';

// The embedded legacy tools (certificates, links, mail, …) show every control
// regardless of access level; the server refuses changes from view-only
// members, so say so up front instead of letting them hit a wall of errors.
const ViewOnlyNotice = ({ module, label }) => {
    const { profile } = usePanelAccess();
    if (hasPermission(profile, module, 'manage')) return null;
    return (
        <div className="mb-6 flex items-start gap-3 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <Eye className="w-5 h-5 text-brand-yellow flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-[var(--text-secondary)]">
                You have view-only access to {label}. You can look around, but anything that changes data will be refused.
            </p>
        </div>
    );
};

export default ViewOnlyNotice;
