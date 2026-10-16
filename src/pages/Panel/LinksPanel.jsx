import PanelShell from './PanelShell';
import LinkShortener from '../../components/LinkShortener';
import ViewOnlyNotice from '../../components/ViewOnlyNotice';
import { usePanelAccess } from '../../context/panelAccessContext';

const LinksPanel = () => {
    const { credential } = usePanelAccess();
    return (
        <PanelShell>
            <ViewOnlyNotice module="links" label="short links" />
            <LinkShortener adminKey={credential} />
        </PanelShell>
    );
};

export default LinksPanel;
