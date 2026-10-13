import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Upload, Save, Loader2, AlertCircle, CheckCircle2, X,
    Plus, Trash2, Move, Type, Eye, ArrowLeft,
    Settings, Image as ImageIcon, ChevronDown, Grid3X3,
    Users, Search, CheckSquare, XSquare
} from 'lucide-react';

const EVENTS = [
    { id: 'innovate-for-impact', name: 'Innovate For Impact', collection: 'events/innovate-for-impact/attendees' },
    { id: 'finbiz', name: "FinBiz'25", collection: 'events/finbiz/attendees' },
    { id: 'inceptio', name: "Inceptio'25", collection: 'events/inceptio/attendees' },
    { id: 'elevate', name: "Elevate'25", collection: 'events/elevate/attendees' },
    { id: 'sih', name: "SIH'25", collection: 'events/sih/attendees' },
];

const ATTENDEE_FIELDS = ['name', 'email', 'team', 'teamName', 'college', 'phone', 'role'];

const DEFAULT_FONTS = [
    'Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana',
    'Trebuchet MS', 'Impact', 'Comic Sans MS',
    'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins',
    'Playfair Display', 'Oswald', 'Raleway', 'Inter', 'Outfit',
    'Dancing Script', 'Great Vibes', 'Pacifico', 'Satisfy'
];

const CertificateManager = ({ adminKey, onBack }) => {
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const fontInputRef = useRef(null);
    const templateImgRef = useRef(null);

    const [selectedEvent, setSelectedEvent] = useState('');
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Templates gallery
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Template selection
    const [templateUrl, setTemplateUrl] = useState('');
    const [templateLoaded, setTemplateLoaded] = useState(false);

    // Text fields
    const [textFields, setTextFields] = useState([]);
    const [activeFieldIndex, setActiveFieldIndex] = useState(null);

    // Custom fonts
    const [customFonts, setCustomFonts] = useState([]);

    // Enabled
    const [enabled, setEnabled] = useState(true);

    // Attendee collection override
    const [attendeeCollection, setAttendeeCollection] = useState('');

    // Attendee eligibility
    const [eventAttendees, setEventAttendees] = useState([]);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
    const [eligibility, setEligibility] = useState({}); // { email: { eligible: bool, reason: string } }
    const [attendeeSearch, setAttendeeSearch] = useState('');

    // Drag state stored in refs for performance
    const dragState = useRef({
        isDragging: false,
        fieldIndex: null,
        offsetX: 0,
        offsetY: 0,
        startMouseX: 0,
        startMouseY: 0,
        hasMoved: false,
    });

    const imageDims = useRef({ width: 0, height: 0 });

    // Load Google Fonts
    useEffect(() => {
        const googleFonts = DEFAULT_FONTS.filter(f =>
            !['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana',
                'Trebuchet MS', 'Impact', 'Comic Sans MS'].includes(f)
        );
        if (googleFonts.length > 0) {
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${f.replace(/ /g, '+')}:wght@400;700;900`).join('&')}&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }, []);

    // Load available templates
    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const res = await fetch('/api/certificate?action=templates');
            if (res.ok) {
                const data = await res.json();
                setAvailableTemplates(data.templates || []);
            }
        } catch (err) {
            console.warn('Could not fetch templates:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Load existing config when event is selected
    useEffect(() => {
        if (!selectedEvent) return;

        const loadConfig = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/certificate?eventId=${selectedEvent}&admin=true`);
                if (res.ok) {
                    const data = await res.json();
                    const cfg = data.config;
                    setTemplateUrl(cfg.templateUrl || '');
                    setTextFields(cfg.textFields || []);
                    setCustomFonts(cfg.customFonts || []);
                    setEnabled(cfg.enabled !== false);
                    setAttendeeCollection(cfg.attendeeCollection || '');
                    setEligibility(cfg.eligibility || {});
                    setConfig(cfg);
                } else {
                    // No config yet, start fresh
                    setTemplateUrl('');
                    setTextFields([]);
                    setCustomFonts([]);
                    setEnabled(true);
                    setAttendeeCollection(EVENTS.find(e => e.id === selectedEvent)?.collection || '');
                    setConfig(null);
                }
            } catch (err) {
                setConfig(null);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [selectedEvent]);

    // Load custom fonts into document
    useEffect(() => {
        const loadFonts = async () => {
            for (const font of customFonts) {
                try {
                    const fontFace = new FontFace(font.name, `url(${font.url})`);
                    const loaded = await fontFace.load();
                    document.fonts.add(loaded);
                } catch (err) {
                    console.warn('Failed to load custom font:', font.name, err);
                }
            }
        };
        if (customFonts.length > 0) loadFonts();
    }, [customFonts]);

    // Helper: convert mouse event to original image coordinates
    const getImageCoords = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / rect.width * imageDims.current.width);
        const y = Math.round((e.clientY - rect.top) / rect.height * imageDims.current.height);
        return { x, y };
    }, []);

    // Find the closest text field to given image coordinates
    const findFieldAtCoords = useCallback((imgX, imgY) => {
        let closestIdx = -1;
        let closestDist = Infinity;
        textFields.forEach((field, i) => {
            const dx = imgX - (field.x || 0);
            const dy = imgY - (field.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const hitRadius = Math.max(80, (field.fontSize || 36) * 2);
            if (dist < closestDist && dist < hitRadius) {
                closestDist = dist;
                closestIdx = i;
            }
        });
        return closestIdx;
    }, [textFields]);

    // Canvas rendering
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const img = templateImgRef.current;
        if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

        const ctx = canvas.getContext('2d');
        const origW = img.naturalWidth;
        const origH = img.naturalHeight;

        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / origW);
        canvas.width = origW * scale;
        canvas.height = origH * scale;
        imageDims.current = { width: origW, height: origH };

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        for (let i = 0; i < textFields.length; i++) {
            const field = textFields[i];
            const x = (field.x || 0) * scale;
            const y = (field.y || 0) * scale;
            const fontSize = (field.fontSize || 36) * scale;

            ctx.save();
            ctx.font = `${field.fontWeight || 'normal'} ${fontSize}px "${field.fontFamily || 'Arial'}"`;
            ctx.fillStyle = field.fontColor || '#000000';
            ctx.textAlign = field.textAlign || 'center';
            ctx.textBaseline = 'middle';

            const label = field.label || `[${field.sourceField}]`;
            ctx.fillText(label, x, y);

            if (activeFieldIndex === i) {
                const metrics = ctx.measureText(label);
                const textWidth = metrics.width;
                const textHeight = fontSize * 1.2;
                let rectX = x - textWidth / 2;
                if (field.textAlign === 'left') rectX = x;
                else if (field.textAlign === 'right') rectX = x - textWidth;

                ctx.strokeStyle = '#FFB22C';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(rectX - 8, y - textHeight / 2 - 4, textWidth + 16, textHeight + 8);
                ctx.setLineDash([]);

                ctx.fillStyle = '#FFB22C';
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.restore();
        }
    }, [textFields, activeFieldIndex]);

    // Load template image
    useEffect(() => {
        if (!templateUrl) {
            templateImgRef.current = null;
            setTemplateLoaded(false);
            return;
        }

        setTemplateLoaded(false);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            templateImgRef.current = img;
            imageDims.current = { width: img.naturalWidth, height: img.naturalHeight };
            setTemplateLoaded(true);
        };
        img.onerror = () => {
            setError('Failed to load template image');
            setTemplateLoaded(false);
        };
        img.src = templateUrl;
    }, [templateUrl]);

    useEffect(() => {
        if (templateLoaded) renderCanvas();
    }, [templateLoaded, textFields, activeFieldIndex, renderCanvas]);

    // ====== CANVAS MOUSE HANDLERS ======
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        const { x, y } = getImageCoords(e);
        const fieldIdx = findFieldAtCoords(x, y);

        if (fieldIdx >= 0) {
            const field = textFields[fieldIdx];
            dragState.current = {
                isDragging: true,
                fieldIndex: fieldIdx,
                offsetX: x - (field.x || 0),
                offsetY: y - (field.y || 0),
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                hasMoved: false,
            };
            setActiveFieldIndex(fieldIdx);
        } else {
            dragState.current = { isDragging: false, fieldIndex: null, offsetX: 0, offsetY: 0, startMouseX: e.clientX, startMouseY: e.clientY, hasMoved: false };
            setActiveFieldIndex(null);
        }
    }, [getImageCoords, findFieldAtCoords, textFields]);

    const handleMouseMove = useCallback((e) => {
        const ds = dragState.current;
        if (!ds.isDragging || ds.fieldIndex === null) return;

        const dx = e.clientX - ds.startMouseX;
        const dy = e.clientY - ds.startMouseY;
        if (!ds.hasMoved && Math.sqrt(dx * dx + dy * dy) < 3) return;
        ds.hasMoved = true;

        const { x, y } = getImageCoords(e);
        const newX = Math.max(0, Math.min(imageDims.current.width, x - ds.offsetX));
        const newY = Math.max(0, Math.min(imageDims.current.height, y - ds.offsetY));

        setTextFields(prev => {
            const updated = [...prev];
            updated[ds.fieldIndex] = { ...updated[ds.fieldIndex], x: newX, y: newY };
            return updated;
        });
    }, [getImageCoords]);

    const handleMouseUp = useCallback(() => {
        dragState.current.isDragging = false;
        dragState.current.fieldIndex = null;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // ====== TEMPLATE UPLOAD ======
    const handleTemplateUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError('Template file must be under 10MB');
            return;
        }

        setUploading(true);
        setError('');

        try {
            // Read as base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (evt) => resolve(evt.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Upload to server
            const res = await fetch('/api/certificate?action=upload-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    filename: file.name,
                    imageData: base64
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setSuccess(`Template "${data.filename}" uploaded!`);
            setTimeout(() => setSuccess(''), 3000);

            // Refresh templates list
            await fetchTemplates();

            // Auto-select the newly uploaded template
            setTemplateUrl(data.url);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ====== FONT UPLOAD ======
    const handleFontUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '').replace(/[-_]/g, ' ');
        const reader = new FileReader();
        reader.onload = (evt) => {
            setCustomFonts(prev => [...prev, { name: fontName, url: evt.target.result }]);
            setError('');
        };
        reader.readAsDataURL(file);
    };

    // Add text field
    const addTextField = () => {
        const newField = {
            id: `field_${Date.now()}`,
            label: 'Sample Name',
            sourceField: 'name',
            x: Math.round(imageDims.current.width / 2) || 400,
            y: Math.round(imageDims.current.height / 2) || 300,
            fontSize: 48,
            fontFamily: 'Arial',
            fontColor: '#000000',
            fontWeight: 'bold',
            textAlign: 'center',
        };
        setTextFields(prev => [...prev, newField]);
        setActiveFieldIndex(textFields.length);
    };

    const updateField = (index, key, value) => {
        setTextFields(prev => {
            const newFields = [...prev];
            newFields[index] = { ...newFields[index], [key]: value };
            return newFields;
        });
    };

    const removeField = (index) => {
        setTextFields(prev => prev.filter((_, i) => i !== index));
        setActiveFieldIndex(null);
    };

    // Fetch attendees for the event
    const fetchAttendees = async () => {
        if (!selectedEvent) return;
        setLoadingAttendees(true);
        try {
            const res = await fetch(`/api/event?action=list-attendees&eventId=${selectedEvent}`, {
                headers: { 'Authorization': `Bearer ${adminKey}` }
            });
            const data = await res.json();
            if (res.ok && data.attendees) {
                setEventAttendees(data.attendees);
            }
        } catch (err) {
            console.warn('Could not fetch attendees:', err);
        } finally {
            setLoadingAttendees(false);
        }
    };

    // Toggle eligibility for an attendee
    const toggleEligibility = (email) => {
        if (!email) return;
        const key = email.trim().toLowerCase();
        setEligibility(prev => {
            const curr = prev[key];
            if (!curr || curr.eligible !== false) {
                // Mark as ineligible
                return { ...prev, [key]: { eligible: false, reason: '' } };
            } else {
                // Remove from map (mark as eligible)
                const next = { ...prev };
                delete next[key];
                return next;
            }
        });
    };

    // Update denial reason
    const updateDenialReason = (email, reason) => {
        const key = email.trim().toLowerCase();
        setEligibility(prev => ({
            ...prev,
            [key]: { ...prev[key], eligible: false, reason }
        }));
    };

    // Save config
    const handleSave = async () => {
        if (!selectedEvent) return;
        setSaving(true);
        setError('');
        setSuccess('');

        const eventInfo = EVENTS.find(e => e.id === selectedEvent);

        try {
            const res = await fetch('/api/certificate?action=save-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    eventId: selectedEvent,
                    eventName: eventInfo?.name || selectedEvent,
                    enabled,
                    templateUrl,
                    textFields,
                    customFonts,
                    attendeeCollection: attendeeCollection || eventInfo?.collection,
                    eligibility,
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.details || 'Failed to save');

            setSuccess('Certificate config saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const activeField = activeFieldIndex !== null ? textFields[activeFieldIndex] : null;

    return (
        <div className="max-w-6xl mx-auto">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
            </button>

            <h2 className="text-3xl font-black uppercase mb-6">
                Certificate <span className="text-brand-yellow">Manager</span>
            </h2>

            {/* Event Selector */}
            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6 mb-6">
                <label className="block text-sm font-bold uppercase mb-3 text-gray-400">Select Event</label>
                <div className="relative">
                    <select
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white text-lg rounded-xl focus:border-brand-yellow focus:outline-none appearance-none cursor-pointer"
                    >
                        <option value="">-- Choose an event --</option>
                        {EVENTS.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                </div>
            </div>

            {loading && (
                <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow mx-auto" />
                </div>
            )}

            {selectedEvent && !loading && (
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Left Panel - Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Enable/Disable */}
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <span className="font-bold uppercase text-sm">Certificates Enabled</span>
                                <button
                                    onClick={() => setEnabled(!enabled)}
                                    className={`w-14 h-7 rounded-full transition-colors relative ${enabled ? 'bg-brand-yellow' : 'bg-zinc-700'}`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Template Gallery */}
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                            <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                                <Grid3X3 className="w-5 h-5 text-brand-yellow" />
                                Certificate Templates
                            </h3>

                            {/* Upload New Template */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full border-2 border-dashed border-zinc-600 rounded-xl p-4 text-center hover:border-brand-yellow transition-colors group mb-4 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <Loader2 className="w-6 h-6 text-brand-yellow mx-auto animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-1 group-hover:text-brand-yellow" />
                                        <p className="text-zinc-400 text-sm">Upload new template (PNG/JPG, max 10MB)</p>
                                    </>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={handleTemplateUpload}
                            />

                            {/* Templates Grid */}
                            {loadingTemplates ? (
                                <div className="text-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-zinc-500 mx-auto" />
                                </div>
                            ) : availableTemplates.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                                    {availableTemplates.map((tpl) => (
                                        <button
                                            key={tpl.filename}
                                            onClick={() => setTemplateUrl(tpl.url)}
                                            className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[4/3] group ${templateUrl === tpl.url
                                                ? 'border-brand-yellow shadow-lg shadow-brand-yellow/20'
                                                : 'border-zinc-700 hover:border-zinc-500'
                                                }`}
                                        >
                                            <img
                                                src={tpl.url}
                                                alt={tpl.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                                <p className="text-xs text-white truncate font-medium">{tpl.name}</p>
                                            </div>
                                            {templateUrl === tpl.url && (
                                                <div className="absolute top-2 right-2 bg-brand-yellow rounded-full p-1">
                                                    <CheckCircle2 className="w-4 h-4 text-black" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm text-center py-4">
                                    No templates uploaded yet. Upload one above!
                                </p>
                            )}

                            {/* Or enter URL manually */}
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Or enter template URL</label>
                                <input
                                    type="text"
                                    value={templateUrl}
                                    onChange={(e) => setTemplateUrl(e.target.value)}
                                    placeholder="/certificates/my-template.png"
                                    className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm font-mono"
                                />
                            </div>
                        </div>

                        {/* Attendee Collection */}
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                            <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-brand-yellow" />
                                Firestore Collection
                            </h3>
                            <input
                                type="text"
                                value={attendeeCollection}
                                onChange={(e) => setAttendeeCollection(e.target.value)}
                                placeholder="events/event-id/attendees"
                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none font-mono text-sm"
                            />
                            <p className="text-zinc-500 text-xs mt-2">Firestore path for attendee data</p>
                        </div>

                        {/* Text Fields */}
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black uppercase flex items-center gap-2">
                                    <Type className="w-5 h-5 text-brand-yellow" />
                                    Text Fields
                                </h3>
                                <button
                                    onClick={addTextField}
                                    className="bg-brand-yellow text-[var(--text-on-brand)] font-bold px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {textFields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        onClick={() => setActiveFieldIndex(index)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all ${activeFieldIndex === index
                                            ? 'bg-brand-yellow/10 border-2 border-brand-yellow'
                                            : 'bg-zinc-800 border-2 border-transparent hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm">{field.label || field.sourceField}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeField(index); }}
                                                className="text-red-400 hover:text-red-300 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 text-xs font-mono">Source: {field.sourceField}</span>
                                            <span className="text-zinc-600 text-xs font-mono">({field.x}, {field.y})</span>
                                        </div>
                                    </div>
                                ))}
                                {textFields.length === 0 && (
                                    <p className="text-zinc-500 text-sm text-center py-4">No text fields added yet</p>
                                )}
                            </div>
                        </div>

                        {/* Active Field Editor */}
                        {activeField && (
                            <div className="bg-zinc-900 border-4 border-brand-yellow rounded-2xl p-6">
                                <h3 className="text-lg font-black uppercase mb-4 text-brand-yellow">
                                    Edit: {activeField.label || activeField.sourceField}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Preview Text</label>
                                        <input
                                            type="text"
                                            value={activeField.label}
                                            onChange={e => updateField(activeFieldIndex, 'label', e.target.value)}
                                            className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Data Source</label>
                                        <select
                                            value={activeField.sourceField}
                                            onChange={e => updateField(activeFieldIndex, 'sourceField', e.target.value)}
                                            className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                        >
                                            {ATTENDEE_FIELDS.map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-400">X Position</label>
                                            <input
                                                type="number"
                                                value={activeField.x}
                                                onChange={e => updateField(activeFieldIndex, 'x', parseInt(e.target.value) || 0)}
                                                className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Y Position</label>
                                            <input
                                                type="number"
                                                value={activeField.y}
                                                onChange={e => updateField(activeFieldIndex, 'y', parseInt(e.target.value) || 0)}
                                                className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1 text-gray-400">X Slider</label>
                                        <input
                                            type="range" min={0} max={imageDims.current.width || 1600}
                                            value={activeField.x}
                                            onChange={e => updateField(activeFieldIndex, 'x', parseInt(e.target.value))}
                                            className="w-full accent-brand-yellow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Y Slider</label>
                                        <input
                                            type="range" min={0} max={imageDims.current.height || 1200}
                                            value={activeField.y}
                                            onChange={e => updateField(activeFieldIndex, 'y', parseInt(e.target.value))}
                                            className="w-full accent-brand-yellow"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Font</label>
"                                        <select\n                                            value={activeField.fontFamily}\n                                            onChange={e => updateField(activeFieldIndex, 'fontFamily', e.target.value)}\n                                            style={{ fontFamily: activeField.fontFamily }}\n                                            className=\"w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm\"\n                                        >\n                                            <optgroup label=\"System Fonts\">\n                                                {DEFAULT_FONTS.filter(f => ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS'].includes(f)).map(f => (\n                                                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>\n                                                ))}\n                                            </optgroup>\n                                            <optgroup label=\"Google Fonts\">\n                                                {DEFAULT_FONTS.filter(f => !['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS'].includes(f)).map(f => (\n                                                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>\n                                                ))}\n                                            </optgroup>\n                                            {customFonts.length > 0 && (\n                                                <optgroup label=\"Custom Fonts\">\n                                                    {customFonts.map(f => (\n                                                        <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.name}</option>\n                                                    ))}\n                     
<truncated 138 bytes>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Size (px)</label>
                                            <input
                                                type="number"
                                                value={activeField.fontSize}
                                                onChange={e => updateField(activeFieldIndex, 'fontSize', parseInt(e.target.value) || 12)}
                                                className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Weight</label>
                                            <select
                                                value={activeField.fontWeight}
                                                onChange={e => updateField(activeFieldIndex, 'fontWeight', e.target.value)}
                                                className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="bold">Bold</option>
                                                <option value="900">Extra Bold</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={activeField.fontColor}
                                                    onChange={e => updateField(activeFieldIndex, 'fontColor', e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={activeField.fontColor}
                                                    onChange={e => updateField(activeFieldIndex, 'fontColor', e.target.value)}
                                                    className="flex-1 bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-400">Align</label>
                                            <div className="flex gap-1">
                                                {['left', 'center', 'right'].map(align => (
                                                    <button
                                                        key={align}
                                                        onClick={() => updateField(activeFieldIndex, 'textAlign', align)}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${activeField.textAlign === align
                                                            ? 'bg-brand-yellow text-[var(--text-on-brand)]'
                                                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                            }`}
                                                    >
                                                        {align}
                                                    </button>
                                                ))}
                                                                                 </div>
                                 </div>
                             )}
                         </div>
                                </div>
                            </div>
                        )}

                        {/* Custom Font Upload */}
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                            <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                                <Type className="w-5 h-5 text-brand-yellow" />
                                Custom Fonts
                            </h3>
                            <button
                                onClick={() => fontInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-zinc-600 rounded-xl p-4 text-center hover:border-brand-yellow transition-colors group text-sm"
                            >
                                <Upload className="w-5 h-5 text-zinc-500 mx-auto mb-1 group-hover:text-brand-yellow" />
                                <p className="text-zinc-400">Upload .ttf / .woff2 / .otf</p>
                            </button>
                            <input
                                ref={fontInputRef}
                                type="file"
                                accept=".ttf,.otf,.woff,.woff2"
                                className="hidden"
                                onChange={handleFontUpload}
                            />
                            {customFonts.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {customFonts.map((font, i) => (
                                        <div key={i} className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
                                            <span className="text-sm" style={{ fontFamily: font.name }}>{font.name}</span>
                                            <button
                                                onClick={() => setCustomFonts(prev => prev.filter((_, fi) => fi !== i))}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Live Preview */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black uppercase flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-brand-yellow" />
                                    Live Preview
                                </h3>
                                <span className="text-sm text-brand-yellow font-mono flex items-center gap-1">
                                    <Move className="w-4 h-4" />
                                    Click & drag text to move
                                </span>
                            </div>

                            {templateUrl ? (
                                <div className="bg-zinc-800 rounded-xl p-2 overflow-hidden">
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full h-auto rounded-lg select-none"
                                        style={{ maxWidth: '100%', cursor: 'crosshair' }}
                                        onMouseDown={handleMouseDown}
                                    />
                                </div>
                            ) : (
                                <div className="bg-zinc-800 rounded-xl p-20 text-center">
                                    <ImageIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                                    <p className="text-zinc-500">Select a template from the gallery or upload one</p>
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                                <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{success}</span>
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving || !templateUrl}
                            className="w-full bg-brand-yellow text-[var(--text-on-brand)] font-black text-xl py-5 rounded-xl border-4 border-white hover:shadow-[8px_8px_0px_white] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wider"
                        >
                            {saving ? (
                                <><Loader2 className="w-6 h-6 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="w-6 h-6" /> Save Certificate Config</>
                            )}
                        </button>
                    </div>

                    {/* Attendee Eligibility Section - Full Width */}
                    <div className="lg:col-span-5 mt-6">
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black uppercase flex items-center gap-2">
                                    <Users className="w-5 h-5 text-brand-yellow" />
                                    Attendee Eligibility
                                </h3>
                                <button
                                    onClick={fetchAttendees}
                                    disabled={loadingAttendees}
                                    className="bg-brand-yellow text-[var(--text-on-brand)] font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    {loadingAttendees ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                                    ) : (
                                        <><Users className="w-4 h-4" /> Fetch Attendees</>
                                    )}
                                </button>
                            </div>

                            <p className="text-zinc-500 text-sm mb-4">
                                Fetch attendees from all event subcollections. Uncheck anyone who should not receive a certificate and enter a reason.
                            </p>

                            {eventAttendees.length > 0 && (
                                <>
                                    {/* Search & Stats */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex-1 relative">
                                            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={attendeeSearch}
                                                onChange={e => setAttendeeSearch(e.target.value)}
                                                placeholder="Search by name or email..."
                                                className="w-full bg-black border-2 border-zinc-700 pl-10 pr-4 py-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div className="text-sm text-zinc-500 whitespace-nowrap">
                                            <span className="text-green-400 font-bold">{eventAttendees.length - Object.keys(eligibility).length}</span> eligible
                                            {Object.keys(eligibility).length > 0 && (
                                                <> · <span className="text-red-400 font-bold">{Object.keys(eligibility).length}</span> excluded</>
                                            )}
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="max-h-[500px] overflow-y-auto border-2 border-zinc-800 rounded-xl">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-zinc-800 z-10">
                                                <tr className="text-left">
                                                    <th className="px-4 py-3 text-zinc-400 font-bold uppercase text-xs w-12">✓</th>
                                                    <th className="px-4 py-3 text-zinc-400 font-bold uppercase text-xs">Name</th>
                                                    <th className="px-4 py-3 text-zinc-400 font-bold uppercase text-xs">Email</th>
                                                    <th className="px-4 py-3 text-zinc-400 font-bold uppercase text-xs">Source</th>
                                                    <th className="px-4 py-3 text-zinc-400 font-bold uppercase text-xs">Reason (if excluded)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {eventAttendees
                                                    .filter(a => {
                                                        if (!attendeeSearch) return true;
                                                        const q = attendeeSearch.toLowerCase();
                                                        return (a.name || '').toLowerCase().includes(q) ||
                                                            (a.email || '').toLowerCase().includes(q);
                                                    })
                                                    .map((attendee, idx) => {
                                                        const emailKey = (attendee.email || '').trim().toLowerCase();
                                                        const isExcluded = eligibility[emailKey]?.eligible === false;

                                                        return (
                                                            <tr
                                                                key={attendee.id || idx}
                                                                className={`border-t border-zinc-800 transition-colors ${isExcluded ? 'bg-red-500/5' : 'hover:bg-zinc-800/50'
                                                                    }`}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <button
                                                                        onClick={() => toggleEligibility(attendee.email)}
                                                                        className="flex items-center justify-center"
                                                                    >
                                                                        {isExcluded ? (
                                                                            <XSquare className="w-5 h-5 text-red-400" />
                                                                        ) : (
                                                                            <CheckSquare className="w-5 h-5 text-green-400" />
                                                                        )}
                                                                    </button>
                                                                </td>
                                                                <td className={`px-4 py-3 font-medium ${isExcluded ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                                                    {attendee.name || '—'}
                                                                </td>
                                                                <td className={`px-4 py-3 font-mono text-xs ${isExcluded ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                                    {attendee.email || '—'}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-mono">
                                                                        {attendee.source}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {isExcluded && (
                                                                        <input
                                                                            type="text"
                                                                            value={eligibility[emailKey]?.reason || ''}
                                                                            onChange={e => updateDenialReason(attendee.email, e.target.value)}
                                                                            placeholder="Enter reason..."
                                                                            className="w-full bg-black border border-red-500/30 px-3 py-1.5 text-white rounded-lg focus:border-red-400 focus:outline-none text-sm"
                                                                        />
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {eventAttendees.length === 0 && !loadingAttendees && (
                                <div className="text-center py-8 text-zinc-600">
                                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p>Click "Fetch Attendees" to load the list</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateManager;
