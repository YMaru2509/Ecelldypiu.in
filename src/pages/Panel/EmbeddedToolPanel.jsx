import { useState } from 'react';
import PanelShell from './PanelShell';
import AdminPortal from '../AdminPortal';
import ViewOnlyNotice from '../../components/ViewOnlyNotice';
import { usePanelAccess } from '../../context/panelAccessContext';

// Hosts one of the admin portal's built-in tools inside the staff panel, using
// the signed-in member's own credential instead of the shared admin password.
// `tabs` lets one screen offer several related tools (e.g. the mail composers);
// switching remounts the tool, which also discards any half-written draft.
const EmbeddedToolPanel = ({ title, module, label, tabs }) => {
    const { credential } = usePanelAccess();
    const [tab, setTab] = useState(tabs[0].key);

    return (
        <PanelShell>
            <h1 className="text-2xl md:text-3xl font-black uppercase mb-4">{title}</h1>
            <ViewOnlyNotice module={module} label={label} />
            {tabs.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-2 transition-colors ${tab === t.key
                                    ? 'bg-brand-yellow text-[var(--text-on-brand)] border-brand-yellow'
                                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}
            <AdminPortal key={tab} embedded initialTab={tab} credential={credential} />
        </PanelShell>
    );
};

export default EmbeddedToolPanel;
