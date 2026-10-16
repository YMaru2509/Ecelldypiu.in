import { useState, useEffect } from 'react';
import { Calendar, Loader2, Plus, Edit, Trash2, LinkIcon, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import EventEditor from './EventEditor';
import EventCreationWizard from './EventCreationWizard';
import { createBlankEventForm, createEventDraftFromTemplate } from '../utils/eventTemplates';

const EventManager = ({ adminKey }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const [showEventStartModal, setShowEventStartModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventForm, setEventForm] = useState(() => createBlankEventForm());
    const [editingEventId, setEditingEventId] = useState(null);
    const [eventInitialAIOpen, setEventInitialAIOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/event?action=get-events', {
                headers: { 'Authorization': `Bearer ${adminKey}` }
            });
            const data = await response.json();
            if (response.ok) {
                setEvents(data);
            } else {
                throw new Error(data.error || 'Failed to load events');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId, title) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
        setLoading(true);
        try {
            const response = await fetch('/api/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ action: 'delete-event', eventId })
            });
            if (response.ok) {
                setResult({ type: 'success', message: 'Event deleted successfully!' });
                fetchEvents();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete event');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEvent = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const action = editingEventId ? 'update-event' : 'create-event';
            const body = editingEventId 
                ? { action, eventId: editingEventId, updates: formData }
                : { action, event: formData };

            const response = await fetch('/api/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save event');
            }

            setResult({ type: 'success', message: 'Event saved successfully!' });
            setShowEventModal(false);
            setEditingEventId(null);
            fetchEvents();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black uppercase flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-brand-yellow" />
                        Event Management
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Create, update, and manage your events.</p>
                </div>
                <button
                    onClick={() => setShowEventStartModal(true)}
                    className="bg-brand-yellow text-[var(--text-on-brand)] font-black uppercase px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-white transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create New Event
                </button>
            </div>

            {error && (
                <div className="bg-red-900/20 border-2 border-red-500 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}
            {result && (
                <div className="bg-green-900/20 border-2 border-green-500 text-green-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    {result.message}
                </div>
            )}

            {loading && !events.length ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map(event => (
                        <div key={event.id} className="bg-black border-2 border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-zinc-600 transition-colors">
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0 p-1">
                                    <img src={event.thumbnail || event.image} alt={event.title} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-lg">{event.title}</h3>
                                        {event.internalOnly && (
                                            <span className="bg-red-900/30 text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-red-500/50">
                                                Private
                                            </span>
                                        )}
                                        {event.featured && (
                                            <span className="bg-brand-yellow/20 text-brand-yellow text-[10px] font-black uppercase px-2 py-0.5 rounded border border-brand-yellow/50">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">{event.date} • {event.category}</p>
                                    <div className="text-xs font-mono text-zinc-500 mt-1">ID: {event.id}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => {
                                        setEventForm(event);
                                        setEditingEventId(event.id);
                                        setEventInitialAIOpen(false);
                                        setShowEventModal(true);
                                    }}
                                    className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 flex items-center justify-center gap-2 transition-colors text-sm font-bold"
                                >
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteEvent(event.id, event.title)}
                                    className="flex-1 md:flex-none px-4 py-2 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 border border-transparent hover:border-red-500/30 flex items-center justify-center gap-2 transition-all text-sm font-bold"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && !loading && (
                        <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">No events found</h3>
                            <p className="text-zinc-500 mt-2">Create your first event to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {showEventStartModal && (
                <EventCreationWizard
                    onClose={() => setShowEventStartModal(false)}
                    onComplete={(draft) => {
                        setEventForm(draft);
                        setEditingEventId(null);
                        setEventInitialAIOpen(false);
                        setShowEventStartModal(false);
                        setShowEventModal(true);
                    }}
                    onSelectTemplate={(template) => {
                        setEventForm(createEventDraftFromTemplate(template));
                        setEditingEventId(null);
                        setEventInitialAIOpen(false);
                        setShowEventStartModal(false);
                        setShowEventModal(true);
                    }}
                    onStartAI={() => {
                        setEventForm(createBlankEventForm());
                        setEditingEventId(null);
                        setEventInitialAIOpen(true);
                        setShowEventStartModal(false);
                        setShowEventModal(true);
                    }}
                />
            )}

            {showEventModal && (
                <EventEditor
                    event={eventForm}
                    onSave={handleSaveEvent}
                    onClose={() => {
                        setShowEventModal(false);
                        setEditingEventId(null);
                    }}
                    loading={loading}
                    initialAIOpen={eventInitialAIOpen}
                    openMediaBrowser={() => alert("Media browser not implemented yet")}
                />
            )}
        </div>
    );
};

export default EventManager;
