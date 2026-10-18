import PanelShell from './PanelShell';
import LinkShortener from '../../components/LinkShortener';
import ViewOnlyNotice from '../../components/ViewOnlyNotice';
import { usePanelAccess } from '../../context/panelAccessContext';
import { useNavigate, useParams } from 'react-router-dom';

const LinksPanel = () => {
    const { credential } = usePanelAccess();
    const { slug } = useParams();
    const navigate = useNavigate();
    return (
        <PanelShell>
            <ViewOnlyNotice module="links" label="short links" />
            <LinkShortener
                adminKey={credential}
                onViewLink={(link) => navigate(`/panel/links/${link.slug}`)}
                onBack={slug ? () => navigate('/panel/links') : undefined}
                initialSlug={slug}
            />
        </PanelShell>
    );
};

export default LinksPanel;
