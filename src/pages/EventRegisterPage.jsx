import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SectionShell } from '../components/eventPage/shared';
import { RegisterSection } from '../components/eventPage/EventSections';

// Standalone registration page: /events/<slug>/register
const EventRegisterPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        (async () => {
            try {
                const res = await fetch(`/api/event?action=get-events&slug=${encodeURIComponent(slug)}`);
                if (!res.ok) throw new Error('Not found');
                setEvent(await res.json());
            } catch {
                navigate('/events', { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [slug, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
            </div>
        );
    }
    if (!event) return null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-brand-yellow selection:text-[var(--text-on-brand)] font-sans overflow-x-hidden">
            <section className="pt-32 pb-10 bg-black">
                <div className="container mx-auto px-4">
                    <Link
                        to={`/events/${event.slug || event.id}`}
                        className="inline-flex items-center text-white hover:text-brand-yellow transition-colors font-mono uppercase tracking-widest border-2 border-white/20 px-4 py-2 rounded-full hover:border-brand-yellow hover:bg-white/5"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to {event.title}
                    </Link>
                </div>
            </section>
            <SectionShell id="register" tone="brand">
                <RegisterSection event={event} heading="Register *Now*" />
            </SectionShell>
        </div>
    );
};

export default EventRegisterPage;
