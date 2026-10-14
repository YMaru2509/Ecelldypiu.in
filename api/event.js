import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from './_lib/emailTransport.js';
import { requirePermission, getCallerMember, sendRbacError } from './_lib/rbac.js';

let db = null;

try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (privateKey && privateKey.length > 100 && !getApps().length) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
            }),
        });
    }

    if (getApps().length) {
        db = getFirestore();
    }
} catch (e) {
    console.warn('⚠️  Firebase not available for event API:', e.message);
}

function isAuthorized(authHeader) {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || !authHeader) return false;
    const token = authHeader.replace(/^Bearer\s+/, '').trim().replace(/^["'`]|["'`]$/g, '');
    const cleanAdminKey = adminKey.trim().replace(/^["'`]|["'`]$/g, '');
    if (token === cleanAdminKey) return true;
    const validKeys = cleanAdminKey.split(',').map(k => k.trim().replace(/^["'`]|["'`]$/g, ''));
    return validKeys.includes(token);
}

function getEventKeywords(eventId) {
    return eventId.split(/[-_]/).filter(w => w.length > 2 && !['for', 'the', 'and'].includes(w));
}

function collectionMatchesEvent(collName, eventId) {
    const keywords = getEventKeywords(eventId);
    const collLower = collName.toLowerCase();
    return keywords.some(kw => collLower.includes(kw.toLowerCase()));
}

function extractAttendees(snapshot, sourceName) {
    const attendees = [];
    for (const doc of snapshot.docs) {
        const data = doc.data();

        if (data.name || data.email) {
            attendees.push({
                id: doc.id,
                name: data.name || '',
                email: data.email || '',
                team: data.team || data.teamName || '',
                college: data.college || '',
                phone: data.phone || '',
                source: sourceName,
            });
        }

        if (data.members && Array.isArray(data.members)) {
            for (const member of data.members) {
                if (member.name || member.email) {
                    attendees.push({
                        id: `${doc.id}_${member.email || member.name}`,
                        name: member.name || '',
                        email: member.email || '',
                        team: data.teamName || data.team || data.name || '',
                        college: member.college || data.college || '',
                        phone: member.phone || '',
                        source: sourceName,
                    });
                }
            }
        }
    }
    return attendees;
}

function findInSnapshot(snapshot, searchTerm) {
    for (const doc of snapshot.docs) {
        const data = doc.data();

        const docEmail = (data.email || '').trim().toLowerCase();
        if (docEmail && docEmail === searchTerm) return { doc, data, type: 'direct' };

        const docName = (data.name || '').trim().toLowerCase();
        if (docName && (docName === searchTerm || docName.includes(searchTerm) || searchTerm.includes(docName))) {
            return { doc, data, type: 'direct' };
        }

        if (data.members && Array.isArray(data.members)) {
            for (const member of data.members) {
                const memberEmail = (member.email || '').trim().toLowerCase();
                const memberName = (member.name || '').trim().toLowerCase();
                if ((memberEmail && memberEmail === searchTerm) ||
                    (memberName && (memberName === searchTerm || memberName.includes(searchTerm)))) {
                    return {
                        doc,
                        data: {
                            name: member.name || '',
                            email: member.email || '',
                            team: data.teamName || data.team || data.name || '',
                            college: member.college || data.college || '',
                            phone: member.phone || '',
                            role: member.role || 'member',
                        },
                        type: 'member'
                    };
                }
            }
        }
    }
    return null;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
    }
    req.body = body;

    const url = new URL(req.url, 'http://localhost');
    const actionQuery = req.query?.action || url.searchParams.get('action');
    const action = actionQuery || req.body?.action;

    if (req.method === 'GET') {
        if (action === 'list-attendees') {
            return await handleListAttendees(req, res);
        } else if (action === 'get-events') {
            return await handleGetEvents(req, res);
        } else if (action === 'list-applications') {
            return await handleListApplications(req, res);
        } else if (action === 'checkin-status') {
            return await handleCheckinStatus(req, res);
        }
    }

    if (req.method === 'POST') {
        if (action === 'lookup-attendee') {
            return await handleLookupAttendee(req, res);
        } else if (action === 'submit-application') {
            return await handleSubmitApplication(req, res);
        } else if (action === 'list-applications') {
            return await handleListApplications(req, res);
        } else if (action === 'update-application') {
            return await handleUpdateApplication(req, res);
        } else if (action === 'delete-application') {
            return await handleDeleteApplication(req, res);
        } else if (action === 'verify-admin') {
            return await handleVerifyAdmin(req, res);
        } else if (action === 'import-attendees') {
            return await handleImportAttendees(req, res);
        } else if (action === 'create-event') {
            return await handleCreateEvent(req, res);
        } else if (action === 'update-event') {
            return await handleUpdateEvent(req, res);
        } else if (action === 'delete-event') {
            return await handleDeleteEvent(req, res);
        } else if (action === 'create-checkin-session') {
            return await handleCreateCheckinSession(req, res);
        } else if (action === 'close-checkin') {
            return await handleCloseCheckin(req, res);
        } else if (action === 'manual-checkin') {
            return await handleManualCheckin(req, res);
        } else if (action === 'scan-checkin') {
            return await handleScanCheckin(req, res);
        }
    }

    return res.status(405).json({ error: 'Method not allowed or invalid action' });
}

async function handleListApplications(req, res) {
    const authHeader = req.headers.authorization;
    if (!isAuthorized(authHeader)) return res.status(401).json({ error: 'Unauthorized' });

    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        const snapshot = await db.collection('TEAM_APPLICATION_FORM').get();
        const applications = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            let submittedAt = data.submittedAt;
            if (submittedAt && typeof submittedAt.toDate === 'function') {
                submittedAt = submittedAt.toDate().toISOString();
            } else if (submittedAt && submittedAt._seconds) {
                submittedAt = new Date(submittedAt._seconds * 1000).toISOString();
            }
            applications.push({
                id: doc.id,
                ...data,
                submittedAt: submittedAt || null
            });
        });

        applications.sort((a, b) => {
            const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            return timeB - timeA;
        });

        return res.status(200).json({ success: true, count: applications.length, applications });
    } catch (error) {
        console.error('Error listing applications:', error);
        return res.status(500).json({ error: 'Failed to list applications', details: error.message });
    }
}

async function handleListAttendees(req, res) {
    const authHeader = req.headers.authorization;
    if (!isAuthorized(authHeader)) return res.status(401).json({ error: 'Unauthorized' });

    const eventId = req.query?.eventId || new URL(req.url, 'http://localhost').searchParams.get('eventId');
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        let attendees = [];
        const eventDocRef = db.doc(`events/${eventId}`);

        try {
            const subcollections = await eventDocRef.listCollections();
            for (const collRef of subcollections) {
                const snapshot = await collRef.get();
                attendees.push(...extractAttendees(snapshot, `events/${eventId}/${collRef.id}`));
            }
        } catch (e) {
            console.warn('Could not list event subcollections:', e.message);
        }

        try {
            const rootCollections = await db.listCollections();
            const matchingCollections = rootCollections.filter(c =>
                collectionMatchesEvent(c.id, eventId) &&
                !['events', 'BLOGS', 'SUBSCRIPTION_REQUESTS', 'TEAM_APPLICATION_FORM', 'certificate_templates', 'certificateConfigs'].includes(c.id)
            );

            for (const collRef of matchingCollections) {
                const snapshot = await collRef.get();
                attendees.push(...extractAttendees(snapshot, collRef.id));
            }
        } catch (e) {
            console.warn('Could not list root collections:', e.message);
        }

        return res.status(200).json({ success: true, eventId, count: attendees.length, attendees });
    } catch (error) {
        console.error('Error listing attendees:', error);
        return res.status(500).json({ error: 'Failed to list attendees', details: error.message });
    }
}

async function handleLookupAttendee(req, res) {
    try {
        const { eventId, identifier } = req.body;
        if (!eventId || !identifier) return res.status(400).json({ error: 'eventId and identifier required' });
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const searchTerm = identifier.trim().toLowerCase();
        let foundDoc = null, foundData = null, foundIn = '';

        const eventDocRef = db.doc(`events/${eventId}`);
        try {
            const subcollections = await eventDocRef.listCollections();
            for (const collRef of subcollections) {
                const snapshot = await collRef.get();
                const result = findInSnapshot(snapshot, searchTerm);
                if (result) {
                    foundDoc = result.doc;
                    foundData = result.type === 'member' ? result.data : null;
                    foundIn = `events/${eventId}/${collRef.id}`;
                    break;
                }
            }
        } catch (e) {
            console.warn('Could not search subcollections:', e.message);
        }

        if (!foundDoc) {
            try {
                const rootCollections = await db.listCollections();
                const skipFiles = ['events', 'BLOGS', 'SUBSCRIPTION_REQUESTS', 'TEAM_APPLICATION_FORM', 'certificate_templates', 'certificateConfigs'];
                const matchingCollections = rootCollections.filter(c => collectionMatchesEvent(c.id, eventId) && !skipFiles.includes(c.id));

                for (const collRef of matchingCollections) {
                    const snapshot = await collRef.get();
                    const result = findInSnapshot(snapshot, searchTerm);
                    if (result) {
                        foundDoc = result.doc;
                        foundData = result.type === 'member' ? result.data : null;
                        foundIn = collRef.id;
                        break;
                    }
                }
            } catch (e) {
                console.warn('Could not search root collections:', e.message);
            }
        }

        if (!foundDoc) return res.status(404).json({ error: 'No attendee found' });

        const attendeeData = foundData || foundDoc.data();
        let uniqueAttendeeId = foundDoc.id;

        if (attendeeData !== foundDoc.data()) {
            const suffix = (attendeeData.email || attendeeData.name || 'member').replace(/[^a-zA-Z0-9]/g, '');
            uniqueAttendeeId = `${foundDoc.id}-${suffix}`;
        }

        const attendeeEmail = (attendeeData.email || '').trim().toLowerCase();
        let eligibility = null;

        try {
            const configDoc = await db.collection('certificateConfigs').doc(eventId).get();
            if (configDoc.exists) {
                const eligMap = configDoc.data().eligibility || {};
                if (eligMap[attendeeEmail]) eligibility = eligMap[attendeeEmail];
            }
        } catch (e) {
            console.warn('Could not check eligibility:', e.message);
        }

        if (eligibility && eligibility.eligible === false) {
            return res.status(200).json({
                success: true,
                eligible: false,
                reason: eligibility.reason || 'You are not eligible for this certificate.',
                attendee: { name: attendeeData.name || '' }
            });
        }

        return res.status(200).json({
            success: true,
            eligible: true,
            attendeeId: uniqueAttendeeId,
            foundIn,
            attendee: {
                name: attendeeData.name || '',
                email: attendeeData.email || '',
                team: attendeeData.team || attendeeData.teamName || '',
                college: attendeeData.college || '',
                phone: attendeeData.phone || '',
                role: attendeeData.role || '',
            }
        });

    } catch (error) {
        console.error('Error looking up attendee:', error);
        return res.status(500).json({ error: 'Failed to look up attendee', details: error.message });
    }
}

const APPLICATION_ROLE_LABELS = {
    corporate_relations: 'Corporate Relations',
    design: 'Design',
    pr: 'PR (Public Relations)',
    marketing: 'Marketing',
    social_media: 'Social Media',
    operations: 'Operations',
    technical: 'Technical',
    aesthetics: 'Aesthetics (Creatives)'
};

const APPLICATION_ROLE_QUESTIONS = {
    corporate_relations: [
        { key: 'cr_why', label: 'Why Corporate Relations?' },
        { key: 'cr_first_message', label: 'First outreach message & mutual benefit strategy' },
        { key: 'cr_gameplan', label: '2-day ₹20k sponsorship game plan' }
    ],
    design: [
        { key: 'design_why', label: 'Why Design?' },
        { key: 'design_poster', label: '30-min emergency poster strategy' },
        { key: 'design_software', label: 'Tools & software used' },
        { key: 'design_portfolio', label: 'Portfolio link' }
    ],
    pr: [
        { key: 'pr_experience', label: 'Conflict/persuasion experience' },
        { key: 'pr_campaign', label: '4-day registration campaign' },
        { key: 'pr_collab', label: 'Inter-college E-Cell collaboration approach' }
    ],
    marketing: [
        { key: 'marketing_urgency', label: 'Creating ticket sales urgency' },
        { key: 'marketing_strategy', label: 'Stuck registrations 5-day action plan' },
        { key: 'marketing_adapt', label: 'Low conversion campaign fix' }
    ],
    social_media: [
        { key: 'sm_format', label: 'Highest engagement format' },
        { key: 'sm_complex', label: 'Explaining complex initiatives' },
        { key: 'sm_low_footage', label: 'Low footage posting strategy' },
        { key: 'sm_low_reach', label: 'Low reel reach audit checklist' }
    ],
    operations: [
        { key: 'ops_jugaad', label: 'Most "jugaad" thing pulled off' },
        { key: 'ops_chaos', label: 'Event day chaos management' },
        { key: 'ops_forgot', label: 'Pre-event missing item decision' }
    ]
};

function buildApplicationConfirmationHTML(formData) {
    const roleLabel = APPLICATION_ROLE_LABELS[formData.role] || formData.role || 'General';
    const questions = APPLICATION_ROLE_QUESTIONS[formData.role] || [];

    const answerRows = questions.map(q => `
        <div style="background-color:#000000; border:1px solid #27272a; border-radius:10px; padding:14px; margin-bottom:10px;">
            <p style="margin:0 0 6px 0; color:#a1a1aa; font-size:12px; font-weight:bold; text-transform:uppercase;">${q.label}</p>
            <p style="margin:0; color:#e4e4e7; font-size:14px; white-space:pre-wrap;">${(formData[q.key] || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;') || '<span style="color:#52525b;">No response provided</span>'}</p>
        </div>`).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Received - E-Cell DYPIU</title>
</head>
<body style="margin:0; padding:0; background-color:#000000; font-family:Arial, sans-serif; color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#000000;">
        <tr>
            <td align="center" style="padding:30px 10px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#18181b; border:4px solid #ffffff; border-radius:20px; overflow:hidden; max-width:600px; width:100%;">
                    <tr>
                        <td style="background-color:#FFB22C; padding:25px 30px; text-align:center;">
                            <h1 style="margin:0; color:#000000; font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:-1px;">E-CELL DYPIU</h1>
                            <p style="margin:5px 0 0 0; color:#000000; font-size:13px; font-weight:bold;">APPLICATION RECEIVED</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 40px; color:#ffffff;">
                            <p style="font-size:17px; margin:0 0 20px 0; line-height:1.5;">Dear <strong>${(formData.fullName || 'Applicant').toString().replace(/</g, '&lt;')}</strong>,</p>
                            <p style="color:#e4e4e7; font-size:15px; line-height:1.6; margin:0 0 25px 0;">
                                Thank you for applying to join <strong>E-Cell DYPIU</strong>! This is a confirmation copy of the responses you submitted for the <strong style="color:#FFB22C;">${roleLabel}</strong> role. Our team will review your application and reach out regarding next steps.
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#000000; border:2px solid #FFB22C; border-radius:12px; margin-bottom:25px;">
                                <tr>
                                    <td style="padding:18px;">
                                        <h3 style="margin:0 0 12px 0; color:#FFB22C; font-size:14px; font-weight:bold; text-transform:uppercase; border-bottom:1px solid #27272a; padding-bottom:8px;">Your Details</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            <tr><td style="padding:6px 0; border-bottom:1px solid #1f1f22;">
                                                <span style="display:block; color:#a1a1aa; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">Name</span>
                                                <span style="display:block; color:#ffffff; font-size:14px; margin-top:3px;">${(formData.fullName || '-').toString().replace(/</g, '&lt;')}</span>
                                            </td></tr>
                                            <tr><td style="padding:6px 0; border-bottom:1px solid #1f1f22;">
                                                <span style="display:block; color:#a1a1aa; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">PRN</span>
                                                <span style="display:block; color:#ffffff; font-size:14px; margin-top:3px;">${(formData.prn || '-').toString().replace(/</g, '&lt;')}</span>
                                            </td></tr>
                                            <tr><td style="padding:6px 0; border-bottom:1px solid #1f1f22;">
                                                <span style="display:block; color:#a1a1aa; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">Division</span>
                                                <span style="display:block; color:#ffffff; font-size:14px; margin-top:3px;">${(formData.division || '-').toString().replace(/</g, '&lt;')}</span>
                                            </td></tr>
                                            <tr><td style="padding:6px 0; border-bottom:1px solid #1f1f22;">
                                                <span style="display:block; color:#a1a1aa; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">Contact</span>
                                                <span style="display:block; color:#ffffff; font-size:14px; margin-top:3px;">${(formData.contactNumber || '-').toString().replace(/</g, '&lt;')}</span>
                                            </td></tr>
                                            <tr><td style="padding:6px 0;">
                                                <span style="display:block; color:#a1a1aa; font-size:11px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">Role Applied</span>
                                                <span style="display:block; color:#FFB22C; font-size:14px; font-weight:bold; margin-top:3px;">${roleLabel}</span>
                                            </td></tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${answerRows ? `<h3 style="margin:0 0 12px 0; color:#FFB22C; font-size:14px; font-weight:bold; text-transform:uppercase; border-bottom:1px solid #27272a; padding-bottom:8px;">Your Responses</h3>${answerRows}` : ''}

                            <p style="color:#a1a1aa; font-size:13px; line-height:1.5; margin:25px 0 0 0;">
                                This is an automated confirmation of your own submission. If any of this looks incorrect, please contact us.<br/><br/>
                                Warm regards,<br/><strong>Team E-Cell DYPIU</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#0c0c0e; padding:20px 30px; text-align:center; border-top:2px solid #27272a;">
                            <p style="margin:0; color:#71717a; font-size:11px;">&copy; ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

async function handleSubmitApplication(req, res) {
    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        const formData = req.body;
        const docRef = await db.collection('TEAM_APPLICATION_FORM').add({
            ...formData,
            submittedAt: Timestamp.now(),
        });

        // Best-effort confirmation copy to the applicant's own email — must never fail the submission itself.
        if (formData.email) {
            try {
                await sendEmail(
                    formData.email,
                    'Your E-Cell DYPIU Application - Response Copy',
                    buildApplicationConfirmationHTML(formData)
                );
            } catch (mailErr) {
                console.error('Failed to send application confirmation email:', mailErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            id: docRef.id,
            message: 'Application submitted successfully'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to submit application', details: error.message });
    }
}

async function handleVerifyAdmin(req, res) {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey) return res.status(500).json({ error: 'Admin key not configured on server' });

    if (!isAuthorized(authHeader)) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid admin key' });
    }

    return res.status(200).json({ success: true, message: 'Authenticated successfully' });
}

async function handleImportAttendees(req, res) {
    const authHeader = req.headers.authorization;
    if (!isAuthorized(authHeader)) return res.status(401).json({ error: 'Unauthorized' });

    const { eventId, attendees } = req.body;
    if (!eventId || !attendees || !Array.isArray(attendees)) return res.status(400).json({ error: 'eventId and attendees array required' });

    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        let count = 0;
        await Promise.all(attendees.map(async (attendee) => {
            if (!attendee.email && !attendee.name) return;
            const docId = (attendee.email || attendee.name).replace(/[^a-zA-Z0-9]/g, '');
            await db.doc(`events/${eventId}/attendees/${docId}`).set({
                ...attendee,
                importedAt: Timestamp.now()
            }, { merge: true });
            count++;
        }));

        return res.status(200).json({ success: true, count, message: 'Attendees imported successfully' });
    } catch (error) {
        console.error('Error importing attendees:', error);
        return res.status(500).json({ error: 'Failed to import attendees', details: error.message });
    }
}

async function handleGetEvents(req, res) {
    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        const authHeader = req.headers.authorization;
        const isAdmin = isAuthorized(authHeader);

        const snapshot = await db.collection('events').orderBy('createdAt', 'desc').get();
        let events = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt && data.createdAt.toDate) data.createdAt = data.createdAt.toDate().toISOString();
            if (data.updatedAt && data.updatedAt.toDate) data.updatedAt = data.updatedAt.toDate().toISOString();
            events.push({ id: doc.id, ...data });
        });

        if (!isAdmin) {
            events = events.filter(e => !e.internalOnly);
        }

        return res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
    }
}

async function handleCreateEvent(req, res) {
    const authHeader = req.headers.authorization;
    if (!isAuthorized(authHeader)) return res.status(401).json({ error: 'Unauthorized' });

    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        const eventData = req.body.event;
        if (!eventData) return res.status(400).json({ error: 'event data required' });

        const docId = eventData.slug || Date.now().toString();
        const docRef = db.collection('events').doc(docId);
        
        await docRef.set({
            ...eventData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        return res.status(200).json({ success: true, id: docId });
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ error: 'Failed to create event' });
    }
}

async function handleUpdateEvent(req, res) {
    const authHeader = req.headers.authorization;
    if (!isAuthorized(authHeader)) return res.status(401).json({ error: 'Unauthorized' });

    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        const { eventId, updates } = req.body;
        if (!eventId || !updates) return res.status(400).json({ error: 'eventId and updates required' });

        const docRef = db.collection('events').doc(eventId);
        await docRef.update({
            ...updates,
            updatedAt: Timestamp.now()
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating event:', error);
        return res.status(500).json({ error: 'Failed to update event' });
    }
}

async function handleDeleteEvent(req, res) {
    const authHeader = req.headers.authorization;
    if (!isAuthorized(authHeader)) return res.status(401).json({ error: 'Unauthorized' });

    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        const { eventId } = req.body;
        if (!eventId) return res.status(400).json({ error: 'eventId required' });

        await db.collection('events').doc(eventId).delete();

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ error: 'Failed to delete event' });
    }
}

async function handleUpdateApplication(req, res) {
    const authHeader = req.headers.authorization;
    if (!isAuthorized(authHeader)) return res.status(401).json({ error: 'Unauthorized' });

    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        const { applicationId, updates } = req.body;
        if (!applicationId || !updates) return res.status(400).json({ error: 'applicationId and updates required' });

        const docRef = db.collection('TEAM_APPLICATION_FORM').doc(applicationId);
        await docRef.update({
            ...updates,
            updatedAt: Timestamp.now()
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating application:', error);
        return res.status(500).json({ error: 'Failed to update application' });
    }
}

async function handleDeleteApplication(req, res) {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) return res.status(401).json({ error: 'Unauthorized' });

    if (!db) return res.status(503).json({ error: 'Database not available' });

    try {
        const { applicationId, applicationIds } = req.body;
        if (!applicationId && (!applicationIds || !applicationIds.length)) {
            return res.status(400).json({ error: 'applicationId or applicationIds required' });
        }

        if (applicationIds && Array.isArray(applicationIds)) {
            const batch = db.batch();
            applicationIds.forEach(id => {
                const docRef = db.collection('TEAM_APPLICATION_FORM').doc(id);
                batch.delete(docRef);
            });
            await batch.commit();
            return res.status(200).json({ success: true, count: applicationIds.length });
        }

        await db.collection('TEAM_APPLICATION_FORM').doc(applicationId).delete();

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting application:', error);
        return res.status(500).json({ error: 'Failed to delete application' });
    }
}

// ---------------------------------------------------------------------------
// Event-day attendance check-in: an admin opens a short time window for an
// event (room + duration), every active core member is emailed, a QR code
// encoding a one-time token is displayed in the room, and members scan it
// from their own logged-in session to be marked present. Uses the RBAC
// chokepoint (_lib/rbac.js) rather than this file's own legacy isAuthorized()
// for these actions specifically, since member-facing scan-checkin needs to
// identify *which* member is scanning, not just whether a request holds the
// shared admin key.
// ---------------------------------------------------------------------------

async function recordCheckin({ eventId, uid, memberName, verified, method, markedBy }) {
    const scannedAt = new Date().toISOString();
    await db.collection('event_checkins').doc(`${eventId}_${uid}`).set({
        eventId,
        uid,
        memberName: memberName || '',
        verified,
        method,
        scannedAt,
        markedBy: markedBy || null,
    });
    await db.collection('members').doc(uid).update({
        eventsAttended: FieldValue.arrayUnion(eventId),
        // Only a genuine QR scan counts as verified — a manual admin fallback
        // check-in still records attendance, but isn't held to the same bar.
        ...(verified ? { verifiedEventIds: FieldValue.arrayUnion(eventId) } : {}),
        lastUpdated: Timestamp.now(),
    });
}

// Admin: opens the window and emails every active core member. Best-effort
// on the email send — a failed send for one person never blocks activation.
async function handleCreateCheckinSession(req, res) {
    try {
        const caller = await requirePermission(req, 'events', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, room, windowMinutes, provider } = req.body || {};
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });
        if (!room?.trim()) return res.status(400).json({ error: 'room is required' });
        const minutes = Number(windowMinutes) > 0 ? Number(windowMinutes) : 15;

        const eventRef = db.collection('events').doc(eventId);
        const eventSnap = await eventRef.get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
        const eventData = eventSnap.data();

        const token = crypto.randomBytes(12).toString('hex');
        const now = new Date();
        const windowStart = now.toISOString();
        const windowEnd = new Date(now.getTime() + minutes * 60000).toISOString();

        await eventRef.update({
            checkin: {
                token,
                room: room.trim(),
                windowStart,
                windowEnd,
                active: true,
                activatedBy: caller.uid,
            },
            updatedAt: Timestamp.now(),
        });

        const membersSnap = await db.collection('members')
            .where('memberType', '==', 'ecell_member')
            .where('membershipStatus', '==', 'active')
            .get();

        const eventTitle = eventData.title || eventId;
        const subject = `Attendance check-in now open: ${eventTitle}`;
        const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
            <h2>Attendance check-in is open</h2>
            <p>Be in <strong>${room.trim()}</strong> now and scan the QR code shown there to be marked present for <strong>${eventTitle}</strong>.</p>
            <p>This closes in ${minutes} minute${minutes === 1 ? '' : 's'}.</p>
        </div>`;

        let notified = 0;
        for (const doc of membersSnap.docs) {
            const email = doc.data().email;
            if (!email) continue;
            try {
                await sendEmail(email, subject, html, provider || 'resend');
                notified++;
            } catch (err) {
                console.error(`Check-in notify failed for ${email}: ${err.message}`);
            }
        }

        return res.status(200).json({ success: true, token, windowStart, windowEnd, notified, totalMembers: membersSnap.size });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error creating checkin session:', error);
        return res.status(500).json({ error: 'Failed to create checkin session' });
    }
}

// Admin: live status for the panel — the session itself plus who's checked
// in so far. 'view' permission is enough here; only activating/closing the
// window requires 'manage'.
async function handleCheckinStatus(req, res) {
    try {
        await requirePermission(req, 'events', 'view');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const eventId = req.query?.eventId;
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        const eventSnap = await db.collection('events').doc(eventId).get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });

        const checkinsSnap = await db.collection('event_checkins').where('eventId', '==', eventId).get();
        const attendees = checkinsSnap.docs
            .map((d) => d.data())
            .sort((a, b) => (a.scannedAt || '').localeCompare(b.scannedAt || ''));

        return res.status(200).json({ success: true, checkin: eventSnap.data().checkin || null, attendees });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error reading checkin status:', error);
        return res.status(500).json({ error: 'Failed to read checkin status' });
    }
}

// Admin: ends the window early (e.g. everyone's already scanned).
async function handleCloseCheckin(req, res) {
    try {
        await requirePermission(req, 'events', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId } = req.body || {};
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        await db.collection('events').doc(eventId).update({ 'checkin.active': false, updatedAt: Timestamp.now() });
        return res.status(200).json({ success: true });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error closing checkin:', error);
        return res.status(500).json({ error: 'Failed to close checkin' });
    }
}

// Admin fallback for someone who was genuinely in the room but couldn't scan
// (dead phone, no camera access, etc.) — recorded as unverified, distinct
// from a real QR scan, so admins can still see who was hand-marked.
async function handleManualCheckin(req, res) {
    try {
        const caller = await requirePermission(req, 'events', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, uid } = req.body || {};
        if (!eventId || !uid) return res.status(400).json({ error: 'eventId and uid are required' });

        const memberSnap = await db.collection('members').doc(uid).get();
        if (!memberSnap.exists) return res.status(404).json({ error: 'Member not found' });

        await recordCheckin({
            eventId,
            uid,
            memberName: memberSnap.data().name,
            verified: false,
            method: 'manual',
            markedBy: caller.uid,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error recording manual checkin:', error);
        return res.status(500).json({ error: 'Failed to record checkin' });
    }
}

// Member-facing: the QR code's target. Verifies the scanning member's own
// Firebase session (not the admin key), validates the token and time window
// server-side, and records one check-in per member per event (idempotent —
// re-scanning just confirms, never double-records).
async function handleScanCheckin(req, res) {
    try {
        const member = await getCallerMember(req);
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, token } = req.body || {};
        if (!eventId || !token) return res.status(400).json({ error: 'eventId and token are required' });

        const eventSnap = await db.collection('events').doc(eventId).get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
        const checkin = eventSnap.data().checkin;

        if (!checkin || !checkin.active) {
            return res.status(400).json({ error: 'Check-in is not currently open for this event' });
        }
        if (checkin.token !== token) {
            return res.status(400).json({ error: 'Invalid or expired check-in code' });
        }
        const now = Date.now();
        if (now < new Date(checkin.windowStart).getTime() || now > new Date(checkin.windowEnd).getTime()) {
            return res.status(400).json({ error: 'The check-in window has closed' });
        }

        const already = await db.collection('event_checkins').doc(`${eventId}_${member.uid}`).get();
        if (already.exists) {
            return res.status(200).json({ success: true, alreadyCheckedIn: true });
        }

        await recordCheckin({ eventId, uid: member.uid, memberName: member.name, verified: true, method: 'qr' });
        return res.status(200).json({ success: true, alreadyCheckedIn: false });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error scanning checkin:', error);
        return res.status(500).json({ error: 'Failed to record checkin' });
    }
}
