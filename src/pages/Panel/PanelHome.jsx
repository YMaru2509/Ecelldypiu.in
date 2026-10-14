import PanelShell from './PanelShell';

const PanelHome = () => {
    return (
        <PanelShell>
            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 md:p-8">
                <h1 className="text-2xl md:text-4xl font-black uppercase mb-2">Attendance Management</h1>
                <p className="text-[var(--text-secondary)]">
                    Manage member roles, E-Cell verticals, and attendance request approvals. Everything here is gated by your admin panel login.
                </p>
            </div>
        </PanelShell>
    );
};

export default PanelHome;
