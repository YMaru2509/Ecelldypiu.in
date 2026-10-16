import PanelShell from './PanelShell';
import EventManager from '../../components/EventManager';
import { usePanelAccess } from '../../context/panelAccessContext';

// Create / edit / delete events (and the document-upload creation wizard).
// Needs events:manage — viewing attendance is the separate Event Attendance page.
const ManageEventsPanel = () => {
    const { credential } = usePanelAccess();
    return (
        <PanelShell>
            <EventManager adminKey={credential} />
        </PanelShell>
    );
};

export default ManageEventsPanel;
