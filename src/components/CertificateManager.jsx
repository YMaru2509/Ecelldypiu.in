import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Upload, Save, Loader2, AlertCircle, CheckCircle2, X,
    Plus, Trash2, Move, Type, Eye, ArrowLeft,
    Settings, Image as ImageIcon, ChevronDown, Grid3X3,
    Users, Search, CheckSquare, XSquare, Send
} from 'lucide-react';

const EVENTS = [
    { id: 'inceptio-26', name: "Inceptio'26", collection: 'events/inceptio-26/attendees' },
    { id: 'fdp-trie', name: 'FDP on TRIE by CIIE', collection: 'events/fdp-trie/attendees' },
    { id: 'innovate-for-impact', name: 'Innovate For Impact', collection: 'events/innovate-for-impact/attendees' },
    { id: 'finbiz', name: "FinBiz'25", collection: 'events/finbiz/attendees' },
    { id: 'inceptio', name: "Inceptio'25", collection: 'events/inceptio/attendees' },
    { id: 'elevate', name: "Elevate'25", collection: 'events/elevate/attendees' },
    { id: 'sih', name: "SIH'25", collection: 'events/sih/attendees' },
];

const CERTIFICATE_AUDIENCES = {
    participants: {
        label: 'Participants',
        collection: null,
        emailSubject: 'Your Certificate for {{event_name}} is Ready!',
    },
    organisers: {
        label: 'Organising Team',
        collection: 'members',
        emailSubject: 'Your Organising Team Certificate for {{event_name}}',
    }
};

const ORGANISER_EMAIL_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background-color: #FFB22C; padding: 24px; text-align: center;"><h1 style="color: #000000; font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase;">E-CELL DYPIU</h1><p style="color: #000000; font-size: 16px; margin: 8px 0 0;">Organising Team Certificate</p></div>
  <div style="background-color: #000000; padding: 32px; color: #FFFFFF;"><p style="font-size: 16px; line-height: 1.5;">Hi <strong style="color: #FFB22C;">{{attendee_name}}</strong>,<br><br>Thank you for your contribution to <strong style="color: #FFB22C;">{{event_name}}</strong> as a member of the organising team.</p><p style="font-size: 14px; color: #D1D5DB;">Your certificate is attached to this email.</p></div>
</div>`;

const ATTENDEE_FIELDS = ['name', 'email', 'team', 'teamName', 'college', 'phone', 'role'];

const DEFAULT_FONTS = [
    'Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana',
    'Trebuchet MS', 'Impact', 'Comic Sans MS',
    'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins',
    'Playfair Display', 'Oswald', 'Raleway', 'Inter', 'Outfit',
    'Dancing Script', 'Great Vibes', 'Pacifico', 'Satisfy'
];

// verifyPassword(typed) confirms a bulk dispatch. The admin portal compares the
// typed value to the shared admin password; the staff panel passes a check that
// re-authenticates the signed-in member instead. onBack is optional — the
// panel has its own navigation, so it omits the "Back to Dashboard" button.
const CertificateManager = ({ adminKey, onBack, verifyPassword, passwordLabel = 'Admin Password' }) => {
    const checkPassword = verifyPassword || (async (typed) => typed === adminKey);

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const fontInputRef = useRef(null);
    const templateImgRef = useRef(null);

    // Real events from the `events` Firestore collection, merged with the legacy
    // hardcoded EVENTS list above (kept for their known attendeeCollection paths).
    // This keeps eventIds configured here consistent with the eventIds members
    // pick in onboarding, which is required for certificate auto-issuance to match.
    const [dynamicEvents, setDynamicEvents] = useState([]);
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/event?action=get-events', {
                    headers: adminKey ? { Authorization: `Bearer ${adminKey}` } : {},
                });
                const data = await res.json();
                if (res.ok && Array.isArray(data)) setDynamicEvents(data);
            } catch {
                // Non-critical — the legacy hardcoded list still works standalone.
            }
        })();
    }, [adminKey]);

    const allEvents = useMemo(() => [
        ...EVENTS,
        ...dynamicEvents
            .filter((de) => !EVENTS.some((se) => se.id === de.id))
            .map((de) => ({ id: de.id, name: de.title || de.id, collection: '' })),
        { id: '_appreciation_default', name: 'Certificate of Appreciation (default, not tied to an event)', collection: '' },
    ], [dynamicEvents]);

    const [selectedEvent, setSelectedEvent] = useState('');
    const [certificateAudience, setCertificateAudience] = useState('participants');
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
    // Separate from `enabled`: gates whether this certificate is also auto-issued
    // to member profiles (vs. just the existing manual-claim page).
    const [autoIssueToProfile, setAutoIssueToProfile] = useState(false);

    // Attendee collection override
    const [attendeeCollection, setAttendeeCollection] = useState('');

    // Attendee eligibility
    const [eventAttendees, setEventAttendees] = useState([]);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
    const [eligibility, setEligibility] = useState({}); // { email: { eligible: bool, reason: string } }
    const [attendeeSearch, setAttendeeSearch] = useState('');

    // NEW: Tabs & Email
    const [managerTab, setManagerTab] = useState('design');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailHTML, setEmailHTML] = useState('');
    const [dispatching, setDispatching] = useState(false);
    const [dispatchResult, setDispatchResult] = useState(null);
    const [emailProvider, setEmailProvider] = useState('zeptomail');
    const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);
    const [dispatchPassword, setDispatchPassword] = useState('');
    const [dispatchPasswordError, setDispatchPasswordError] = useState('');

    // NEW: Manual Attendee & CSV Import
    const [showAddAttendee, setShowAddAttendee] = useState(false);
    const [newAttendeeData, setNewAttendeeData] = useState({ name: '', email: '', college: '', phone: '' });
    const csvInputRef = useRef(null);

    const DEFAULT_EMAIL_SUBJECT = "Your Certificate for {{event_name}} is Ready!";
    const DEFAULT_EMAIL_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
  <div style="background-color: #FFB22C; padding: 24px; text-align: center;">
    <h1 style="color: #000000; font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px;">E-CELL DYPIU</h1>
    <p style="color: #000000; font-size: 16px; margin: 8px 0 0 0; font-weight: 500;">Certificate Ready</p>
  </div>
  <div style="background-color: #000000; padding: 32px; color: #FFFFFF;">
    <p style="font-size: 16px; margin-bottom: 24px; line-height: 1.5;">Hi <strong style="color: #FFB22C;">{{attendee_name}}</strong>,<br><br>Thank you for participating in <strong style="color: #FFB22C;">{{event_name}}</strong>. Your certificate is now ready to download!</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{cert_link}}" style="background-color: #FFB22C; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; text-transform: uppercase;">Get My Certificate</a>
    </div>
    <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin-top: 32px;">If the button doesn't work, copy this link:<br><a href="{{cert_link}}" style="color: #FFB22C;">{{cert_link}}</a></p>
  </div>
</div>`;

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
                const res = await fetch(`/api/certificate?eventId=${selectedEvent}&admin=true&audience=${certificateAudience}`, {
                    headers: { 'Authorization': `Bearer ${adminKey}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const cfg = data.config;
                    setTemplateUrl(cfg.templateUrl || '');
                    setTextFields(cfg.textFields || []);
                    setCustomFonts(cfg.customFonts || []);
                    setEnabled(cfg.enabled !== false);
                    setAutoIssueToProfile(cfg.autoIssueToProfile === true);
                    setAttendeeCollection(cfg.attendeeCollection || CERTIFICATE_AUDIENCES[certificateAudience].collection || '');
                    setEligibility({});
                    setEmailSubject(cfg.emailSubject || CERTIFICATE_AUDIENCES[certificateAudience].emailSubject);
                    setEmailHTML(cfg.emailHTML || (certificateAudience === 'organisers' ? ORGANISER_EMAIL_HTML : ''));
                    setConfig(cfg);
                } else {
                    // No config yet, start fresh
                    setTemplateUrl('');
                    setTextFields([]);
                    setCustomFonts([]);
                    setEnabled(true);
                    setAutoIssueToProfile(false);
                    setAttendeeCollection(CERTIFICATE_AUDIENCES[certificateAudience].collection || allEvents.find(e => e.id === selectedEvent)?.collection || '');
                    setEligibility({});
                    setEmailSubject(CERTIFICATE_AUDIENCES[certificateAudience].emailSubject);
                    setEmailHTML(certificateAudience === 'organisers' ? ORGANISER_EMAIL_HTML : '');
                    setConfig(null);
                }
            } catch (err) {
                setConfig(null);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [selectedEvent, certificateAudience, allEvents]);

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
        if (templateUrl.startsWith('http')) {
            img.crossOrigin = 'anonymous';
        }
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

    const handleDeleteTemplate = async (filename) => {
        try {
            const res = await fetch('/api/certificate?action=delete-template', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ filename })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete template');
            setSuccess(`Template "${filename}" deleted!`);
            setTimeout(() => setSuccess(''), 3000);
            if (templateUrl.includes(filename)) {
                setTemplateUrl('');
            }
            fetchTemplates();
        } catch (err) {
            setError(err.message);
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
            const endpoint = certificateAudience === 'organisers'
                ? '/api/certificate?action=team-members'
                : `/api/event?action=list-attendees&eventId=${selectedEvent}`;
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${adminKey}` }
            });
            const data = await res.json();
            const recipients = certificateAudience === 'organisers' ? data.members : data.attendees;
            if (res.ok && recipients) {
                setEventAttendees(recipients);
            }
        } catch (err) {
            console.warn('Could not fetch attendees:', err);
        } finally {
            setLoadingAttendees(false);
        }
    };

    const handleAddManualAttendee = async (e) => {
        e.preventDefault();
        if (certificateAudience === 'organisers') return;
        if (!selectedEvent) return;
        setLoadingAttendees(true);
        try {
            const res = await fetch('/api/event?action=import-attendees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    eventId: selectedEvent,
                    attendees: [{ ...newAttendeeData, source: 'Manual Import' }]
                })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Attendee added successfully!');
                setTimeout(() => setSuccess(''), 3000);
                setNewAttendeeData({ name: '', email: '', college: '', phone: '' });
                setShowAddAttendee(false);
                fetchAttendees();
            } else {
                throw new Error(data.error || 'Failed to add attendee');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAttendees(false);
        }
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files?.[0];
        if (certificateAudience === 'organisers') return;
        if (!file || !selectedEvent) return;
        setLoadingAttendees(true);
        try {
            const text = await file.text();
            const rows = text.split('\n').map(row => row.trim()).filter(row => row);
            if (rows.length < 2) throw new Error('CSV is empty or missing headers');
            
            const parseCSVRow = (row) => {
                const values = [];
                let inQuotes = false;
                let currentValue = '';
                for (let i = 0; i < row.length; i++) {
                    const char = row[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(currentValue);
                        currentValue = '';
                    } else {
                        currentValue += char;
                    }
                }
                values.push(currentValue);
                return values;
            };

            const mapHeader = (h) => {
                const lower = h.trim().toLowerCase().replace(/['"]/g, '');
                if (lower.includes('name')) return 'name';
                if (lower.includes('mail')) return 'email';
                if (lower.includes('college') || lower.includes('institution') || lower.includes('university')) return 'college';
                if (lower.includes('phone') || lower.includes('contact') || lower.includes('number')) return 'phone';
                if (lower.includes('team')) return 'team';
                return lower;
            };

            const rawHeaders = parseCSVRow(rows[0]);
            const headers = rawHeaders.map(mapHeader);
            
            const attendees = rows.slice(1).map(row => {
                const values = parseCSVRow(row);
                const attendee = { source: 'CSV Import' };
                headers.forEach((header, index) => {
                    if (values[index]) attendee[header] = values[index].trim().replace(/^["']|["']$/g, '');
                });
                return attendee;
            }).filter(a => a.name || a.email);

            if (attendees.length === 0) {
                throw new Error('No valid attendees found. Ensure CSV has Name or Email columns.');
            }

            const res = await fetch('/api/event?action=import-attendees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    eventId: selectedEvent,
                    attendees
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                setSuccess(`Successfully imported ${data.count} attendees!`);
                setTimeout(() => setSuccess(''), 3000);
                fetchAttendees();
            } else {
                throw new Error(data.error || 'Failed to import CSV');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAttendees(false);
            if (csvInputRef.current) csvInputRef.current.value = '';
        }
    };

    // Toggle eligibility for an attendee
    const toggleEligibility = (email) => {
        if (!email) return;
        const key = email.trim().toLowerCase();
        setEligibility(prev => {
            const curr = prev[key];
            if (!curr || !curr.eligible) {
                // Mark as eligible
                return { ...prev, [key]: { eligible: true, reason: '' } };
            } else {
                // Remove from map (mark as ineligible)
                const next = { ...prev };
                delete next[key];
                return next;
            }
        });
    };

    const handleSelectAll = () => {
        const newEligibility = {};
        eventAttendees.forEach(attendee => {
            const emailKey = (attendee.email || attendee.name || '').trim().toLowerCase();
            if (emailKey) {
                newEligibility[emailKey] = { eligible: true, reason: '' };
            }
        });
        setEligibility(newEligibility);
    };

    const handleUnselectAll = () => {
        setEligibility({});
    };

    // Update denial reason
    const updateDenialReason = (email, reason) => {
        const key = email.trim().toLowerCase();
        setEligibility(prev => ({
            ...prev,
            [key]: { ...prev[key], eligible: false, reason }
        }));
    };

    // Dispatch Certificates
    const handleDispatch = async () => {
        if (!selectedEvent) return;
        setDispatching(true);
        setError('');
        setSuccess('');
        setDispatchResult(null);

        try {
            const res = await fetch('/api/certificate?action=dispatch-certificates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ eventId: selectedEvent, provider: emailProvider, eligibility, audience: certificateAudience })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to dispatch');

            setDispatchResult(data);
            setSuccess('Dispatch process completed! Check the results pop-up for details.');
        } catch (err) {
            setError(err.message);
        } finally {
            setDispatching(false);
        }
    };

    // Save config
    const handleSave = async () => {
        if (!selectedEvent) return;
        setSaving(true);
        setError('');
        setSuccess('');

        const eventInfo = allEvents.find(e => e.id === selectedEvent);

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
                    autoIssueToProfile,
                    templateUrl,
                    textFields,
                    customFonts,
                    attendeeCollection: attendeeCollection || eventInfo?.collection,
                    eligibility,
                    emailSubject,
                    emailHTML,
                    audience: certificateAudience
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
            {onBack && (
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                </button>
            )}

            <h2 className="text-3xl font-black uppercase mb-6">
                Certificate <span className="text-brand-yellow">Manager</span>
            </h2>

            <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {Object.entries(CERTIFICATE_AUDIENCES).map(([audience, details]) => (
                    <button
                        key={audience}
                        onClick={() => {
                            setCertificateAudience(audience);
                            setEventAttendees([]);
                            setEligibility({});
                            setShowAddAttendee(false);
                            setManagerTab('design');
                        }}
                        className={`rounded-2xl border-4 p-5 text-left transition-colors ${certificateAudience === audience ? 'border-brand-yellow bg-zinc-800 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}
                    >
                        <span className="block font-black uppercase text-lg">{details.label}</span>
                        <span className="block text-sm mt-1">{audience === 'participants' ? 'Public event attendee certificates' : 'Private certificates for E-Cell organisers'}</span>
                    </button>
                ))}
            </div>

            {/* Event Selector */}
            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6 mb-6">
                <label className="block text-sm font-bold uppercase mb-3 text-gray-400">Select Event for {CERTIFICATE_AUDIENCES[certificateAudience].label}</label>
                <div className="relative">
                    <select
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white text-lg rounded-xl focus:border-brand-yellow focus:outline-none appearance-none cursor-pointer"
                    >
                        <option value="">-- Choose an event --</option>
                        {allEvents.map(event => (
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
                <>
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b-2 border-zinc-800 pb-2">
                        <button
                            onClick={() => setManagerTab('design')}
                            className={`px-6 py-3 font-bold uppercase rounded-t-xl transition-colors ${managerTab === 'design' ? 'bg-zinc-800 text-brand-yellow' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Design & Configuration
                        </button>
                        <button
                            onClick={() => setManagerTab('dispatch')}
                            className={`px-6 py-3 font-bold uppercase rounded-t-xl transition-colors ${managerTab === 'dispatch' ? 'bg-zinc-800 text-brand-yellow' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Dispatch Panel
                        </button>
                    </div>

                    {managerTab === 'design' && (
                        <div className="grid lg:grid-cols-5 gap-6">
                            {/* Left Panel - Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Enable/Disable */}
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-bold uppercase text-sm">Certificates Enabled</span>
                                <button
                                    onClick={() => setEnabled(!enabled)}
                                    className={`w-14 h-7 rounded-full transition-colors relative ${enabled ? 'bg-brand-yellow' : 'bg-zinc-700'}`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                <div>
                                    <span className="font-bold uppercase text-sm block">Auto-Issue to Member Profiles</span>
                                    <span className="text-xs text-zinc-500">Shows automatically on a member's Profile page if they listed this event during onboarding.</span>
                                </div>
                                <button
                                    onClick={() => setAutoIssueToProfile(!autoIssueToProfile)}
                                    className={`w-14 h-7 rounded-full transition-colors relative flex-shrink-0 ${autoIssueToProfile ? 'bg-brand-yellow' : 'bg-zinc-700'}`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${autoIssueToProfile ? 'left-8' : 'left-1'}`} />
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
                                        <div key={tpl.filename} className="relative group">
                                            <button
                                                onClick={() => setTemplateUrl(tpl.url)}
                                                className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[4/3] w-full group-hover:opacity-90 ${templateUrl === tpl.url
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
                                                    <div className="absolute top-2 right-2 bg-brand-yellow rounded-full p-1 z-10">
                                                        <CheckCircle2 className="w-4 h-4 text-black" />
                                                    </div>
                                                )}
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm('Delete this template?')) {
                                                        handleDeleteTemplate(tpl.filename);
                                                    }
                                                }}
                                                className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-md"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
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
                                        <select
                                            value={activeField.fontFamily}
                                            onChange={e => updateField(activeFieldIndex, 'fontFamily', e.target.value)}
                                            className="w-full bg-black border-2 border-zinc-700 p-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                        >
                                            <optgroup label="System Fonts">
                                                {DEFAULT_FONTS.filter(f => ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS'].includes(f)).map(f => (
                                                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Google Fonts">
                                                {DEFAULT_FONTS.filter(f => !['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS'].includes(f)).map(f => (
                                                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                                ))}
                                            </optgroup>
                                            {customFonts.length > 0 && (
                                                <optgroup label="Custom Fonts">
                                                    {customFonts.map(f => (
                                                        <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>
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


                </div>
            )}

            {/* Dispatch Confirmation Modal */}
            {showDispatchConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border-4 border-zinc-700 p-6 rounded-2xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
                        <button 
                            onClick={() => {
                                setShowDispatchConfirm(false);
                                setDispatchPassword('');
                                setDispatchPasswordError('');
                            }}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <h4 className="text-white font-black text-2xl uppercase mb-2 flex items-center gap-2">
                            <Send className="w-6 h-6 text-brand-yellow" /> Confirm Dispatch
                        </h4>
                        <p className="text-zinc-400 mb-6">
                            Are you sure you want to send certificates to the following <strong className="text-white">{eventAttendees.filter(a => eligibility[(a.email || '').trim().toLowerCase()]?.eligible === true).length}</strong> participants?
                        </p>
                        
                        <div className="flex-1 overflow-y-auto border-2 border-zinc-800 rounded-xl mb-6 bg-black/50 p-2">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-zinc-900 z-10">
                                    <tr className="text-left">
                                        <th className="px-4 py-2 text-zinc-400 font-bold uppercase text-xs">Name</th>
                                        <th className="px-4 py-2 text-zinc-400 font-bold uppercase text-xs">Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventAttendees
                                        .filter(a => eligibility[(a.email || '').trim().toLowerCase()]?.eligible === true)
                                        .map((attendee, idx) => (
                                            <tr key={idx} className="border-t border-zinc-800/50">
                                                <td className="px-4 py-2 text-white">{attendee.name || '—'}</td>
                                                <td className="px-4 py-2 font-mono text-zinc-400">{attendee.email || '—'}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-bold uppercase mb-2 text-zinc-400">
                                Enter {passwordLabel} to Confirm
                            </label>
                            <input
                                type="password"
                                value={dispatchPassword}
                                onChange={(e) => {
                                    setDispatchPassword(e.target.value);
                                    setDispatchPasswordError('');
                                }}
                                className={`w-full bg-black border-2 p-3 text-white rounded-lg focus:outline-none ${dispatchPasswordError ? 'border-red-500 focus:border-red-500' : 'border-zinc-700 focus:border-brand-yellow'}`}
                                placeholder={passwordLabel}
                            />
                            {dispatchPasswordError && (
                                <p className="text-red-500 text-xs font-bold mt-1">{dispatchPasswordError}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t-2 border-zinc-800">
                            <button
                                onClick={() => {
                                    setShowDispatchConfirm(false);
                                    setDispatchPassword('');
                                    setDispatchPasswordError('');
                                }}
                                className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!(await checkPassword(dispatchPassword))) {
                                        setDispatchPasswordError('Incorrect password');
                                        return;
                                    }
                                    setShowDispatchConfirm(false);
                                    setDispatchPassword('');
                                    setDispatchPasswordError('');
                                    handleDispatch();
                                }}
                                className="bg-brand-yellow text-[var(--text-on-brand)] font-black px-6 py-3 rounded-xl hover:shadow-[4px_4px_0px_white] transition-all uppercase flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" /> Yes, Send Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Manual Attendee Modal */}
            {showAddAttendee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border-4 border-zinc-700 p-6 rounded-2xl max-w-md w-full shadow-2xl relative">
                        <button 
                            onClick={() => setShowAddAttendee(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <h4 className="text-white font-black text-2xl uppercase mb-6 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-brand-yellow" /> Add Attendee
                        </h4>
                        
                        <form onSubmit={handleAddManualAttendee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newAttendeeData.name}
                                    onChange={(e) => setNewAttendeeData({ ...newAttendeeData, name: e.target.value })}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 rounded-lg text-white focus:border-brand-yellow outline-none"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newAttendeeData.email}
                                    onChange={(e) => setNewAttendeeData({ ...newAttendeeData, email: e.target.value })}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 rounded-lg text-white focus:border-brand-yellow outline-none"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">College (Optional)</label>
                                <input
                                    type="text"
                                    value={newAttendeeData.college}
                                    onChange={(e) => setNewAttendeeData({ ...newAttendeeData, college: e.target.value })}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 rounded-lg text-white focus:border-brand-yellow outline-none"
                                    placeholder="DYPIU"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Phone (Optional)</label>
                                <input
                                    type="text"
                                    value={newAttendeeData.phone}
                                    onChange={(e) => setNewAttendeeData({ ...newAttendeeData, phone: e.target.value })}
                                    className="w-full bg-black border-2 border-zinc-700 p-3 rounded-lg text-white focus:border-brand-yellow outline-none"
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={loadingAttendees}
                                className="w-full mt-2 bg-brand-yellow hover:bg-white text-[var(--text-on-brand)] font-black py-3 rounded-xl transition-colors uppercase disabled:opacity-50"
                            >
                                {loadingAttendees ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Save Attendee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {selectedEvent && !loading && managerTab === 'dispatch' && (
                
                <div className="space-y-6">
                    {/* Attendee Eligibility Section - Full Width */}
                    <div className="mb-6">
                        <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black uppercase flex items-center gap-2">
                                    <Users className="w-5 h-5 text-brand-yellow" />
                                    {certificateAudience === 'organisers' ? 'Organiser Eligibility' : 'Attendee Eligibility'}
                                </h3>
                                <div className="flex gap-2">
                                    {certificateAudience === 'participants' && <>
                                        <button
                                            onClick={() => setShowAddAttendee(true)}
                                            className="bg-zinc-800 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-700 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" /> Add Manual
                                        </button>
                                        <button
                                            onClick={() => csvInputRef.current?.click()}
                                            className="bg-zinc-800 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-700 transition-colors"
                                        >
                                            <Upload className="w-4 h-4" /> Import CSV
                                        </button>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            className="hidden"
                                            ref={csvInputRef}
                                            onChange={handleImportCSV}
                                        />
                                    </>}
                                    <button
                                        onClick={fetchAttendees}
                                        disabled={loadingAttendees}
                                        className="bg-brand-yellow text-[var(--text-on-brand)] font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50"
                                    >
                                        {loadingAttendees ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                                        ) : (
                                            <><Users className="w-4 h-4" /> {certificateAudience === 'organisers' ? 'Fetch Team Members' : 'Fetch Attendees'}</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <p className="text-zinc-500 text-sm mb-4">
                                {certificateAudience === 'organisers'
                                    ? 'Fetch members from the E-Cell team. Select only the organisers who should receive this certificate.'
                                    : 'Fetch attendees from all event subcollections. Uncheck anyone who should not receive a certificate and enter a reason.'}
                            </p>

                            {eventAttendees.length > 0 && (
                                <>
                                    {/* Search & Stats */}
                                    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 mb-4">
                                        <div className="flex-1 relative w-full">
                                            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={attendeeSearch}
                                                onChange={e => setAttendeeSearch(e.target.value)}
                                                placeholder="Search by name or email..."
                                                className="w-full bg-black border-2 border-zinc-700 pl-10 pr-4 py-2 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleSelectAll}
                                                className="bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-700 transition-colors whitespace-nowrap"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={handleUnselectAll}
                                                className="bg-zinc-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-700 transition-colors whitespace-nowrap"
                                            >
                                                Unselect All
                                            </button>
                                        </div>
                                        <div className="text-sm text-zinc-500 whitespace-nowrap">
                                            <span className="text-green-400 font-bold">{Object.values(eligibility).filter(e => e.eligible).length}</span> eligible
                                            {eventAttendees.length - Object.values(eligibility).filter(e => e.eligible).length > 0 && (
                                                <> · <span className="text-red-400 font-bold">{eventAttendees.length - Object.values(eligibility).filter(e => e.eligible).length}</span> excluded</>
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
                                                    .sort((a, b) => {
                                                        const aKey = (a.email || '').trim().toLowerCase();
                                                        const bKey = (b.email || '').trim().toLowerCase();
                                                        const aEligible = eligibility[aKey]?.eligible === true ? 1 : 0;
                                                        const bEligible = eligibility[bKey]?.eligible === true ? 1 : 0;
                                                        return bEligible - aEligible;
                                                    })
                                                    .map((attendee, idx) => {
                                                        const emailKey = (attendee.email || '').trim().toLowerCase();
                                                        const isEligible = eligibility[emailKey]?.eligible === true;

                                                        return (
                                                            <tr
                                                                key={attendee.id || idx}
                                                                className={`border-t border-zinc-800 transition-colors ${!isEligible ? 'opacity-70' : 'hover:bg-zinc-800/50'
                                                                    }`}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <button
                                                                        onClick={() => toggleEligibility(attendee.email)}
                                                                        className="flex items-center justify-center"
                                                                    >
                                                                        {!isEligible ? (
                                                                            <div className="w-5 h-5 border-2 border-zinc-500 rounded flex items-center justify-center" />
                                                                        ) : (
                                                                            <CheckSquare className="w-5 h-5 text-green-400" />
                                                                        )}
                                                                    </button>
                                                                </td>
                                                                <td className={`px-4 py-3 font-medium ${!isEligible ? 'text-zinc-400' : 'text-white'}`}>
                                                                    {attendee.name || '—'}
                                                                </td>
                                                                <td className={`px-4 py-3 font-mono text-xs ${!isEligible ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                                    {attendee.email || '—'}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs font-mono">
                                                                        {attendee.source}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {!isEligible && (
                                                                        <input
                                                                            type="text"
                                                                            value={eligibility[emailKey]?.reason || ''}
                                                                            onChange={e => updateDenialReason(attendee.email, e.target.value)}
                                                                            placeholder="Enter reason (optional)..."
                                                                            className="w-full bg-black border border-zinc-700 px-3 py-1.5 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
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
                <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-2xl font-black uppercase text-brand-yellow">Dispatch Certificates</h3>
                            <p className="text-zinc-400 mt-1">
                                {eventAttendees.length === 0 ? 
                                    "No attendees loaded. Please go to Design & Configuration to fetch attendees." : 
                                    `Ready to dispatch to ${Object.values(eligibility).filter(e => e.eligible).length} eligible attendees.`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={emailProvider}
                                onChange={(e) => setEmailProvider(e.target.value)}
                                className="bg-black border-2 border-zinc-700 p-3 rounded-lg text-white font-bold focus:border-brand-yellow outline-none uppercase text-sm"
                            >
                                <option value="zeptomail">Zoho ZeptoMail</option>
                                <option value="bridge1">Bridge 1 (CIIE)</option>
                                <option value="bridge2">Bridge 2 (E-Cell)</option>
                            </select>
                            <button
                                onClick={() => setShowDispatchConfirm(true)}
                                disabled={dispatching || eventAttendees.length === 0}
                                className="bg-brand-yellow text-[var(--text-on-brand)] font-black px-6 py-3 rounded-xl border-4 border-white hover:shadow-[6px_6px_0px_white] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
                            >
                                {dispatching ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                                ) : (
                                    "Dispatch Now"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Dispatch Result Pop-up Modal */}
                    {dispatchResult && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-zinc-900 border-4 border-zinc-700 p-6 rounded-2xl max-w-lg w-full shadow-2xl relative">
                                <button 
                                    onClick={() => setDispatchResult(null)}
                                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                
                                <h4 className="text-green-400 font-black text-2xl uppercase flex items-center gap-2 mb-4">
                                    <CheckCircle2 className="w-8 h-8" /> Dispatch Complete
                                </h4>
                                
                                <div className="space-y-4 text-zinc-300">
                                    <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                        <p className="text-lg">Successfully Sent: <strong className="text-brand-yellow text-2xl ml-2">{dispatchResult.sentCount || dispatchResult.dispatched || 0}</strong></p>
                                    </div>
                                    
                                    {dispatchResult.errors && dispatchResult.errors.length > 0 && (
                                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                                            <p className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" /> Errors ({dispatchResult.errors.length}):
                                            </p>
                                            <ul className="list-disc list-inside text-sm text-zinc-400 max-h-48 overflow-y-auto space-y-1">
                                                {dispatchResult.errors.map((err, i) => (
                                                    <li key={i}><span className="text-white">{err.email}:</span> {err.error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                
                                <button 
                                    onClick={() => setDispatchResult(null)}
                                    className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors uppercase"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="border-t-2 border-zinc-800 pt-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                    Email Template
                                </h4>
                                <p className="text-zinc-400 text-sm mt-1">Customize the email sent to attendees. Changes appear instantly in the preview.</p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-zinc-800 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Template
                            </button>
                        </div>

                        <div className="grid xl:grid-cols-2 gap-6 items-start">
                            {/* Editor Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Email Subject</label>
                                    <input
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder={DEFAULT_EMAIL_SUBJECT}
                                        className="w-full bg-black border-2 border-zinc-700 p-3 rounded-lg text-white focus:border-brand-yellow outline-none"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-sm font-bold text-gray-400">Email HTML Body</label>
                                    </div>
                                    <textarea
                                        value={emailHTML}
                                        onChange={(e) => setEmailHTML(e.target.value)}
                                        placeholder="<div>Hello {{attendee_name}}...</div>"
                                        rows={18}
                                        className="w-full bg-black border-2 border-zinc-700 p-3 rounded-lg text-white focus:border-brand-yellow outline-none font-mono text-sm leading-relaxed"
                                    />
                                    <div className="text-xs text-zinc-500 mt-2">
                                        Placeholders: <code className="text-brand-yellow bg-brand-yellow/10 px-1 rounded">{`{{attendee_name}}`}</code>, <code className="text-brand-yellow bg-brand-yellow/10 px-1 rounded">{`{{event_name}}`}</code>, <code className="text-brand-yellow bg-brand-yellow/10 px-1 rounded">{`{{cert_link}}`}</code>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Column */}
                            <div className="bg-zinc-800 rounded-xl p-4 sticky top-6">
                                <h5 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Live Preview
                                </h5>
                                <div className="bg-white rounded-xl overflow-hidden border border-zinc-700 shadow-2xl">
                                    <div className="bg-zinc-100 p-4 border-b border-zinc-200">
                                        <div className="text-xs text-zinc-500 mb-1 font-bold uppercase flex justify-between">
                                            <span>Subject</span>
                                            <span className="text-[10px] bg-brand-yellow/20 text-brand-yellow px-2 py-0.5 rounded">Editable</span>
                                        </div>
                                        <div 
                                            className="text-black font-semibold text-sm outline-none cursor-text hover:bg-black/5 p-1 -ml-1 rounded transition-colors"
                                            contentEditable={true}
                                            suppressContentEditableWarning={true}
                                            onBlur={(e) => {
                                                let newSubj = e.currentTarget.innerHTML;
                                                newSubj = newSubj.replace(/<span[^>]*>(\{\{.*?\}\})<\/span>/gi, '$1');
                                                const tempDiv = document.createElement('div');
                                                tempDiv.innerHTML = newSubj;
                                                setEmailSubject(tempDiv.innerText || tempDiv.textContent);
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: (emailSubject || DEFAULT_EMAIL_SUBJECT)
                                                    .replace(/{{attendee_name}}/g, '<span contenteditable="false" style="background:#FFB22C33;padding:0 4px;border-radius:4px;color:#d97706;">{{attendee_name}}</span>')
                                                    .replace(/{{event_name}}/g, '<span contenteditable="false" style="background:#FFB22C33;padding:0 4px;border-radius:4px;color:#d97706;">{{event_name}}</span>')
                                            }}
                                        />
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            Click to Edit Visually
                                        </div>
                                        <div 
                                            className="p-6 outline-none cursor-text focus:ring-4 focus:ring-brand-yellow/30 transition-all min-h-[200px]"
                                            contentEditable={true}
                                            suppressContentEditableWarning={true}
                                            onBlur={(e) => {
                                                let newHtml = e.currentTarget.innerHTML;
                                                newHtml = newHtml.replace(/<span[^>]*contenteditable="false"[^>]*>(\{\{.*?\}\})<\/span>/gi, '$1');
                                                newHtml = newHtml.replace(/%7B%7B/g, '{{').replace(/%7D%7D/g, '}}');
                                                newHtml = newHtml.replace(/href="[^"]*\{\{cert_link\}\}"/g, 'href="{{cert_link}}"');
                                                setEmailHTML(newHtml);
                                            }}
                                            dangerouslySetInnerHTML={{ 
                                                __html: (emailHTML || DEFAULT_EMAIL_HTML)
                                                .replace(/{{attendee_name}}/g, '<span contenteditable="false" style="background:#FFB22C44;padding:2px 4px;border-radius:4px;color:#FFB22C;user-select:none;">{{attendee_name}}</span>')
                                                .replace(/{{event_name}}/g, '<span contenteditable="false" style="background:#FFB22C44;padding:2px 4px;border-radius:4px;color:#FFB22C;user-select:none;">{{event_name}}</span>')
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Dispatch Button (Below template) */}
                        <div className="mt-8 pt-6 border-t-2 border-zinc-800 flex justify-end">
                            <button
                                onClick={() => setShowDispatchConfirm(true)}
                                disabled={dispatching || eventAttendees.length === 0}
                                className="bg-brand-yellow text-[var(--text-on-brand)] font-black px-8 py-4 rounded-xl border-4 border-white hover:shadow-[6px_6px_0px_white] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-2"
                            >
                                {dispatching ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                                ) : (
                                    "Dispatch Now"
                                )}
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </>
    )}
        </div>
    );
};

export default CertificateManager;
