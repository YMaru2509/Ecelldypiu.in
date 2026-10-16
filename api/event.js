import crypto from 'crypto';
import QRCode from 'qrcode';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from './_lib/emailTransport.js';
import { requirePermission, requireAnyPermission, getCallerMember, hasPermission, callerCan, callerCanAny, sendRbacError } from './_lib/rbac.js';

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
        } else if (action === 'list-registrations') {
            return await handleListRegistrations(req, res);
        } else if (action === 'export-checkins') {
            return await handleExportCheckins(req, res);
        } else if (action === 'export-registrations') {
            return await handleExportRegistrations(req, res);
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
        } else if (action === 'toggle-attendance') {
            return await handleToggleAttendance(req, res);
        } else if (action === 'create-checkin-session') {
            return await handleCreateCheckinSession(req, res);
        } else if (action === 'close-checkin') {
            return await handleCloseCheckin(req, res);
        } else if (action === 'manual-checkin') {
            return await handleManualCheckin(req, res);
        } else if (action === 'scan-checkin') {
            return await handleScanCheckin(req, res);
        } else if (action === 'register-for-event') {
            return await handleRegisterForEvent(req, res);
        } else if (action === 'checkin-registration') {
            return await handleCheckinRegistration(req, res);
        } else if (action === 'parse-event-document') {
            return await handleParseEventDocument(req, res);
        } else if (action === 'generate-event-content') {
            return await handleGenerateEventContent(req, res);
        } else if (action === 'export-checkins-sheet') {
            return await handleExportCheckinsSheet(req, res);
        } else if (action === 'resend-pass') {
            return await handleResendPass(req, res);
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
    if (!(await callerCanAny(req, [['certificates', 'view'], ['events', 'view']]))) return res.status(401).json({ error: 'Unauthorized' });

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
    if (!(await callerCanAny(req, [['certificates', 'manage'], ['events', 'manage']]))) return res.status(401).json({ error: 'Unauthorized' });

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
        let isAdmin = isAuthorized(authHeader);
        // A staff member signed in with their own account (not the shared admin
        // key) who may view events sees internal events too. Anonymous visitors
        // send no header and skip this entirely.
        if (!isAdmin && authHeader?.startsWith('Bearer ')) {
            try {
                isAdmin = hasPermission(await getCallerMember(req), 'events', 'view');
            } catch {
                isAdmin = false;
            }
        }
        const { slug } = req.query || {};

        // Single-event lookup for the public event detail page — docId is
        // the slug for events created via the editor (see handleCreateEvent),
        // so try a direct doc read first before falling back to a query for
        // older/imported events whose docId diverged from their slug field.
        if (slug) {
            let doc = await db.collection('events').doc(slug).get();
            if (!doc.exists) {
                const bySlug = await db.collection('events').where('slug', '==', slug).limit(1).get();
                if (!bySlug.empty) doc = bySlug.docs[0];
            }
            if (!doc.exists) return res.status(404).json({ error: 'Event not found' });
            const data = doc.data();
            if (!isAdmin && data.internalOnly) return res.status(404).json({ error: 'Event not found' });
            if (data.createdAt && data.createdAt.toDate) data.createdAt = data.createdAt.toDate().toISOString();
            if (data.updatedAt && data.updatedAt.toDate) data.updatedAt = data.updatedAt.toDate().toISOString();
            return res.status(200).json({ id: doc.id, ...data });
        }

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
    if (!(await callerCan(req, 'events', 'manage'))) return res.status(401).json({ error: 'Unauthorized' });

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
    if (!(await callerCan(req, 'events', 'manage'))) return res.status(401).json({ error: 'Unauthorized' });

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
    if (!(await callerCan(req, 'events', 'manage'))) return res.status(401).json({ error: 'Unauthorized' });

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

async function recordCheckin({ eventId, windowId, uid, memberName, verified, method, markedBy }) {
    const scannedAt = new Date().toISOString();
    // Doc id is per (window, member) — not per (event, member) — so the same
    // member can be checked in independently on each day/window of a
    // multi-day event instead of only ever once for the whole event.
    await db.collection('event_checkins').doc(`${windowId}_${uid}`).set({
        eventId,
        windowId,
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

async function getActiveWindow(eventId) {
    const snap = await db.collection('event_checkin_windows')
        .where('eventId', '==', eventId)
        .where('active', '==', true)
        .limit(1)
        .get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// Admin: the explicit gate in front of the whole check-in feature — a QR
// session can't be opened for an event until this is turned on, even by a
// system owner. Doesn't touch any existing window/check-in data, just the
// event's own flag.
async function handleToggleAttendance(req, res) {
    try {
        await requirePermission(req, 'events', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, enabled } = req.body || {};
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });
        if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be true or false' });

        const eventRef = db.collection('events').doc(eventId);
        const eventSnap = await eventRef.get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });

        await eventRef.update({ attendanceEnabled: enabled, updatedAt: Timestamp.now() });
        return res.status(200).json({ success: true, attendanceEnabled: enabled });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error toggling attendance:', error);
        return res.status(500).json({ error: 'Failed to toggle attendance' });
    }
}

// Admin: opens a new window (one per day/session, kept as permanent history
// rather than overwritten) and emails every active core member. Best-effort
// on the email send — a failed send for one person never blocks activation.
async function handleCreateCheckinSession(req, res) {
    try {
        const caller = await requirePermission(req, 'events', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, room, windowMinutes, provider } = req.body || {};
        // Emailing the team is opt-out so existing callers keep their behaviour;
        // the panel's plain "Activate" button sends notify: false to open the
        // window silently.
        const shouldNotify = req.body?.notify !== false;
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });
        if (!room?.trim()) return res.status(400).json({ error: 'room is required' });
        const minutes = Number(windowMinutes) > 0 ? Number(windowMinutes) : 15;

        const eventRef = db.collection('events').doc(eventId);
        const eventSnap = await eventRef.get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
        const eventData = eventSnap.data();

        if (!eventData.attendanceEnabled) {
            return res.status(403).json({ error: 'Team Attendance is not enabled for this event yet' });
        }

        // Close out any window left open from a previous activation before
        // starting a new one — only one window is ever live at a time.
        const stillOpen = await db.collection('event_checkin_windows')
            .where('eventId', '==', eventId)
            .where('active', '==', true)
            .get();
        const closeBatch = db.batch();
        stillOpen.docs.forEach((doc) => closeBatch.update(doc.ref, { active: false }));
        if (!stillOpen.empty) await closeBatch.commit();

        const token = crypto.randomBytes(12).toString('hex');
        const now = new Date();
        const windowStart = now.toISOString();
        const windowEnd = new Date(now.getTime() + minutes * 60000).toISOString();
        const dayLabel = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

        const windowRef = await db.collection('event_checkin_windows').add({
            eventId,
            token,
            room: room.trim(),
            windowStart,
            windowEnd,
            active: true,
            dayLabel,
            activatedBy: caller.uid,
            createdAt: Timestamp.now(),
        });

        let notified = 0;
        let totalMembers = 0;

        if (shouldNotify) {
            const membersSnap = await db.collection('members')
                .where('memberType', '==', 'ecell_member')
                .where('membershipStatus', '==', 'active')
                .get();
            totalMembers = membersSnap.size;

            const eventTitle = eventData.title || eventId;
            const subject = `Attendance check-in now open: ${eventTitle}`;
            const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
                <h2>Attendance check-in is open</h2>
                <p>Be in <strong>${room.trim()}</strong> now and scan the QR code shown there to be marked present for <strong>${eventTitle}</strong>.</p>
                <p>This closes in ${minutes} minute${minutes === 1 ? '' : 's'}.</p>
            </div>`;

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
        }

        return res.status(200).json({ success: true, windowId: windowRef.id, token, windowStart, windowEnd, notified, totalMembers, notifyRequested: shouldNotify });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error creating checkin session:', error);
        return res.status(500).json({ error: 'Failed to create checkin session' });
    }
}

// Admin: status for the panel — the event's attendanceEnabled flag, the
// active window (if any), and the window history for this event. The
// client also attaches its own live Firestore listener on event_checkins
// (see firestore.rules) for real-time attendee updates instead of
// repolling this endpoint — this just establishes the starting state.
async function handleCheckinStatus(req, res) {
    try {
        await requirePermission(req, 'events', 'view');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const eventId = req.query?.eventId;
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        const eventSnap = await db.collection('events').doc(eventId).get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });

        const windowsSnap = await db.collection('event_checkin_windows').where('eventId', '==', eventId).get();
        const windows = windowsSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.windowStart || '').localeCompare(a.windowStart || ''));
        const activeWindow = windows.find((w) => w.active) || null;

        const checkinsSnap = await db.collection('event_checkins').where('eventId', '==', eventId).get();
        const allCheckins = checkinsSnap.docs.map((d) => d.data());
        const countByWindow = {};
        allCheckins.forEach((c) => { countByWindow[c.windowId] = (countByWindow[c.windowId] || 0) + 1; });
        const windowsWithCounts = windows.map((w) => ({ ...w, attendeeCount: countByWindow[w.id] || 0 }));

        const attendees = activeWindow
            ? allCheckins.filter((c) => c.windowId === activeWindow.id).sort((a, b) => (a.scannedAt || '').localeCompare(b.scannedAt || ''))
            : [];

        return res.status(200).json({
            success: true,
            attendanceEnabled: eventSnap.data().attendanceEnabled === true,
            activeWindow,
            windows: windowsWithCounts,
            attendees,
        });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error reading checkin status:', error);
        return res.status(500).json({ error: 'Failed to read checkin status' });
    }
}

// Admin: ends the active window early (e.g. everyone's already scanned).
async function handleCloseCheckin(req, res) {
    try {
        await requirePermission(req, 'events', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId } = req.body || {};
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        const active = await getActiveWindow(eventId);
        if (!active) return res.status(200).json({ success: true });

        await db.collection('event_checkin_windows').doc(active.id).update({ active: false });
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

        const active = await getActiveWindow(eventId);
        if (!active) return res.status(400).json({ error: 'No attendance window is currently open for this event' });

        const memberSnap = await db.collection('members').doc(uid).get();
        if (!memberSnap.exists) return res.status(404).json({ error: 'Member not found' });

        await recordCheckin({
            eventId,
            windowId: active.id,
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
// server-side against whichever window is currently active, and records one
// check-in per member per window (idempotent — re-scanning just confirms,
// never double-records; a different day's window gets its own record).
async function handleScanCheckin(req, res) {
    try {
        const member = await getCallerMember(req);
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, token } = req.body || {};
        if (!eventId || !token) return res.status(400).json({ error: 'eventId and token are required' });

        const eventSnap = await db.collection('events').doc(eventId).get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
        const eventTitle = eventSnap.data().title || '';

        const active = await getActiveWindow(eventId);
        if (!active) {
            return res.status(400).json({ error: 'Check-in is not currently open for this event' });
        }
        if (active.token !== token) {
            return res.status(400).json({ error: 'Invalid or expired check-in code' });
        }
        const now = Date.now();
        if (now < new Date(active.windowStart).getTime() || now > new Date(active.windowEnd).getTime()) {
            return res.status(400).json({ error: 'The check-in window has closed' });
        }

        const already = await db.collection('event_checkins').doc(`${active.id}_${member.uid}`).get();
        if (already.exists) {
            return res.status(200).json({ success: true, alreadyCheckedIn: true, eventTitle, room: active.room });
        }

        await recordCheckin({ eventId, windowId: active.id, uid: member.uid, memberName: member.name, verified: true, method: 'qr' });
        return res.status(200).json({ success: true, alreadyCheckedIn: false, eventTitle, room: active.room });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error scanning checkin:', error);
        return res.status(500).json({ error: 'Failed to record checkin' });
    }
}

// ---------------------------------------------------------------------------
// Attendance export: the core-team check-ins for an event as a sheet — one row
// per active core member, one column per attendance window (day/session), so
// absentees are as visible as attendees. Served as a CSV download, or written
// into a tab of the connected Google Sheet.
// ---------------------------------------------------------------------------

const IST = 'Asia/Kolkata';
const istTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: IST });

async function buildAttendanceReport(eventId, windowId) {
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) return { status: 404, error: 'Event not found' };
    const event = { id: eventId, title: eventSnap.data().title || eventId };

    const windowsSnap = await db.collection('event_checkin_windows').where('eventId', '==', eventId).get();
    let windows = windowsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.windowStart || '').localeCompare(b.windowStart || ''));
    if (windowId) {
        windows = windows.filter((w) => w.id === windowId);
        if (windows.length === 0) return { status: 404, error: 'Attendance window not found' };
    }
    if (windows.length === 0) return { status: 404, error: 'No attendance has been opened for this event yet' };

    const windowIds = new Set(windows.map((w) => w.id));
    const checkinsSnap = await db.collection('event_checkins').where('eventId', '==', eventId).get();
    const checkins = checkinsSnap.docs.map((d) => d.data()).filter((c) => windowIds.has(c.windowId));
    const byUidWindow = new Map(checkins.map((c) => [`${c.uid}|${c.windowId}`, c]));

    const membersSnap = await db.collection('members')
        .where('memberType', '==', 'ecell_member')
        .where('membershipStatus', '==', 'active')
        .get();
    const people = new Map(membersSnap.docs.map((d) => [d.id, { uid: d.id, ...d.data() }]));

    // Anyone who checked in but isn't an active core member today (e.g. a
    // member who has since left) still belongs in the record.
    const extraUids = [...new Set(checkins.map((c) => c.uid))].filter((uid) => !people.has(uid));
    if (extraUids.length > 0) {
        const extraDocs = await db.getAll(...extraUids.map((uid) => db.collection('members').doc(uid)));
        extraDocs.forEach((doc, i) => {
            const fallbackName = checkins.find((c) => c.uid === extraUids[i])?.memberName || extraUids[i];
            people.set(extraUids[i], doc.exists ? { uid: doc.id, ...doc.data() } : { uid: extraUids[i], name: fallbackName });
        });
    }

    const windowLabel = (w) => `${w.dayLabel || ''} · ${w.room || ''} (${istTime(w.windowStart)}–${istTime(w.windowEnd)})`.trim();
    const header = ['Name', 'Email', 'Branch', 'Year', ...windows.map(windowLabel), 'Days Present', 'Total Days'];

    const presentTotals = windows.map(() => 0);
    const rows = [...people.values()]
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .map((person) => {
            let daysPresent = 0;
            const marks = windows.map((w, i) => {
                const hit = byUidWindow.get(`${person.uid}|${w.id}`);
                if (!hit) return 'Absent';
                daysPresent++;
                presentTotals[i]++;
                return `Present (${hit.method === 'qr' ? 'QR' : 'Manual'}, ${istTime(hit.scannedAt)})`;
            });
            return [person.name || '', person.email || '', person.branch || '', person.year || '', ...marks, String(daysPresent), String(windows.length)];
        });

    const summary = ['Total present', '', '', '', ...presentTotals.map(String), '', ''];
    return { event, windows, header, rows, summary };
}

// A leading = + - @ makes spreadsheet apps treat a cell as a formula; names
// come from user-editable profiles, so neutralise that in the CSV.
const csvCell = (value) => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const toCsv = (rows) => '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';

const safeFilePart = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'event';

// events:view — downloads the attendance sheet as CSV (all days, or one window).
async function handleExportCheckins(req, res) {
    try {
        await requirePermission(req, 'events', 'view');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, windowId } = req.query || {};
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        const report = await buildAttendanceReport(eventId, windowId);
        if (report.error) return res.status(report.status).json({ error: report.error });

        const csv = toCsv([report.header, ...report.rows, report.summary]);
        const scope = windowId ? safeFilePart(report.windows[0].dayLabel || 'day') : 'all-days';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-${safeFilePart(report.event.title)}-${scope}.csv"`);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).end(csv);
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error exporting checkins:', error);
        return res.status(500).json({ error: 'Failed to export attendance' });
    }
}

// events:manage — writes the same sheet into a tab of the connected Google
// Sheet (created on first export, replaced on later ones) and returns its URL.
async function handleExportCheckinsSheet(req, res) {
    try {
        await requirePermission(req, 'events', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, windowId } = req.body || {};
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        // Loaded on demand: googleapis is heavy and this function also serves
        // the public events list, which shouldn't pay for it on every cold start.
        const sheets = await import('./_lib/sheetsSync.js');
        if (!sheets.isSheetsSyncConfigured()) {
            return res.status(503).json({ error: "Google Sheets isn't connected yet. Set GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY and GOOGLE_SHEETS_SPREADSHEET_ID, and share the spreadsheet with that service account. Use Download CSV in the meantime." });
        }

        const report = await buildAttendanceReport(eventId, windowId);
        if (report.error) return res.status(report.status).json({ error: report.error });

        const stamp = new Date().toLocaleString('en-GB', { timeZone: IST, dateStyle: 'medium', timeStyle: 'short' });
        const values = [
            ['Event', report.event.title],
            ['Event ID', report.event.id],
            ['Exported', `${stamp} IST`],
            [],
            report.header,
            ...report.rows,
            report.summary,
        ];
        // Tab titles may not contain []*?:/\ and max out at 100 characters.
        const tabName = `Attendance - ${report.event.title.replace(/[[\]*?:/\\]/g, '-').slice(0, 60)} - ${eventId.slice(-6)}`;

        try {
            const { url } = await sheets.writeValuesToTab(tabName, values);
            return res.status(200).json({ success: true, url, tabName });
        } catch (sheetErr) {
            console.error('Sheets export failed:', sheetErr.message);
            if (sheetErr.code === 403 || /permission/i.test(sheetErr.message)) {
                return res.status(502).json({ error: `Google denied access to the spreadsheet — share it (as Editor) with ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}.` });
            }
            return res.status(502).json({ error: `Google Sheets rejected the export: ${sheetErr.message}` });
        }
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error exporting checkins to sheet:', error);
        return res.status(500).json({ error: 'Failed to export attendance' });
    }
}

// ---------------------------------------------------------------------------
// Public event registration + door check-in: a second, separate audience from
// the section above — the general public, not logged-in core members. Anyone
// registers with no account via register-for-event, gets emailed a personal
// QR "pass" (a one-time token distinct from the room-wide rotating QR used
// for members), and an admin/volunteer at the door scans each pass with
// checkin-registration to mark it used. event_registrations is fully
// server-mediated (see firestore.rules section 10) — registrants never read
// their own record back; their pass only ever reaches them by email.
// ---------------------------------------------------------------------------

function buildRegistrationPassHTML(name, event) {
    const title = (event.title || 'Event').toString().replace(/</g, '&lt;');
    const safeName = (name || 'Guest').toString().replace(/</g, '&lt;');
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Pass - ${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#000000; font-family:Arial, sans-serif; color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#000000;">
        <tr>
            <td align="center" style="padding:30px 10px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#18181b; border:4px solid #ffffff; border-radius:20px; overflow:hidden; max-width:600px; width:100%;">
                    <tr>
                        <td style="background-color:#FFB22C; padding:25px 30px; text-align:center;">
                            <h1 style="margin:0; color:#000000; font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:-1px;">E-CELL DYPIU</h1>
                            <p style="margin:5px 0 0 0; color:#000000; font-size:13px; font-weight:bold;">YOUR EVENT PASS</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 40px; color:#ffffff; text-align:center;">
                            <p style="font-size:17px; margin:0 0 20px 0; line-height:1.5; text-align:left;">Dear <strong>${safeName}</strong>,</p>
                            <p style="color:#e4e4e7; font-size:15px; line-height:1.6; margin:0 0 25px 0; text-align:left;">
                                You're registered for <strong style="color:#FFB22C;">${title}</strong>${event.date ? ` on <strong>${event.date.toString().replace(/</g, '&lt;')}</strong>` : ''}${event.location ? ` at <strong>${event.location.toString().replace(/</g, '&lt;')}</strong>` : ''}. Show the attached QR pass at the door to check in.
                            </p>
                            <p style="color:#71717a; font-size:12px; margin:0;">This pass is unique to you — please don't forward it.</p>
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

// Emails a registrant their personal QR pass. Used when they first register and
// again when staff resend it.
async function sendPassEmail({ eventId, registrationId, passToken, name, email }, eventData, provider) {
    const qrPayload = JSON.stringify({ eventId, registrationId, token: passToken });
    const qrPng = await QRCode.toBuffer(qrPayload, { errorCorrectionLevel: 'H', width: 480 });
    await sendEmail(
        email,
        `Your Pass: ${eventData.title || 'Event'}`,
        buildRegistrationPassHTML(name, eventData),
        provider || 'resend',
        [{ filename: 'pass.png', content: qrPng.toString('base64'), contentType: 'image/png' }],
    );
}

function normalizeEmailForId(email) {
    return (email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Public: no auth required — anyone can register for any non-internal event.
async function handleRegisterForEvent(req, res) {
    try {
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, name, email, phone, provider } = req.body || {};
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });
        if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
        if (!email?.trim()) return res.status(400).json({ error: 'email is required' });

        const eventSnap = await db.collection('events').doc(eventId).get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
        const eventData = eventSnap.data();
        if (eventData.internalOnly) return res.status(404).json({ error: 'Event not found' });

        const normalizedEmail = normalizeEmailForId(email);
        if (!normalizedEmail) return res.status(400).json({ error: 'A valid email is required' });
        const registrationId = `${eventId}_${normalizedEmail}`;
        const passToken = crypto.randomBytes(16).toString('hex');

        try {
            await db.collection('event_registrations').doc(registrationId).create({
                eventId,
                eventTitle: eventData.title || eventId,
                name: name.trim(),
                email: email.trim(),
                phone: phone?.trim() || '',
                passToken,
                registeredAt: Timestamp.now(),
                checkedIn: false,
                checkedInAt: null,
                checkedInBy: null,
            });
        } catch (createErr) {
            if (createErr.code === 6 || /already exists/i.test(createErr.message || '')) {
                return res.status(409).json({ error: "You're already registered for this event" });
            }
            throw createErr;
        }

        try {
            await sendPassEmail({ eventId, registrationId, passToken, name: name.trim(), email: email.trim() }, eventData, provider);
        } catch (emailErr) {
            console.error(`Pass email failed for ${email}: ${emailErr.message}`);
        }

        return res.status(200).json({ success: true, registrationId });
    } catch (error) {
        console.error('Error registering for event:', error);
        return res.status(500).json({ error: 'Failed to register' });
    }
}

// Admin/operator (door volunteer): scans a registrant's emailed pass.
// Idempotent — rescanning an already-checked-in pass confirms rather than errors.
async function handleCheckinRegistration(req, res) {
    try {
        const caller = await requirePermission(req, 'registrations', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, registrationId, token } = req.body || {};
        if (!eventId || !registrationId || !token) {
            return res.status(400).json({ error: 'eventId, registrationId and token are required' });
        }

        const ref = db.collection('event_registrations').doc(registrationId);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ error: 'Pass not found' });
        const reg = snap.data();

        if (reg.eventId !== eventId || reg.passToken !== token) {
            return res.status(400).json({ error: 'Invalid pass for this event' });
        }

        if (reg.checkedIn) {
            return res.status(200).json({ success: true, alreadyCheckedIn: true, name: reg.name, email: reg.email });
        }

        await ref.update({ checkedIn: true, checkedInAt: Timestamp.now(), checkedInBy: caller.uid });
        return res.status(200).json({ success: true, alreadyCheckedIn: false, name: reg.name, email: reg.email });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error checking in registration:', error);
        return res.status(500).json({ error: 'Failed to check in' });
    }
}

// Admin: list registrations for an event, for the door-scan panel's
// registered/checked-in counts.
async function handleListRegistrations(req, res) {
    try {
        await requireAnyPermission(req, [['registrations', 'view'], ['passes', 'view']]);
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const eventId = req.query?.eventId;
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        const snap = await db.collection('event_registrations').where('eventId', '==', eventId).get();
        const registrations = snap.docs
            .map((d) => {
                const data = d.data();
                if (data.registeredAt?.toDate) data.registeredAt = data.registeredAt.toDate().toISOString();
                if (data.checkedInAt?.toDate) data.checkedInAt = data.checkedInAt.toDate().toISOString();
                return { id: d.id, ...data, passToken: undefined };
            })
            .sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));

        return res.status(200).json({ success: true, registrations, total: registrations.length, checkedIn: registrations.filter((r) => r.checkedIn).length });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error listing registrations:', error);
        return res.status(500).json({ error: 'Failed to list registrations' });
    }
}

// passes:manage — re-sends a registrant's existing pass (same QR, same token),
// for people who lost the email. Nothing about the registration changes.
async function handleResendPass(req, res) {
    try {
        await requirePermission(req, 'passes', 'manage');
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const { eventId, registrationId, provider } = req.body || {};
        if (!eventId || !registrationId) return res.status(400).json({ error: 'eventId and registrationId are required' });

        const [regSnap, eventSnap] = await Promise.all([
            db.collection('event_registrations').doc(registrationId).get(),
            db.collection('events').doc(eventId).get(),
        ]);
        if (!regSnap.exists || regSnap.data().eventId !== eventId) return res.status(404).json({ error: 'Registration not found' });
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });

        const reg = regSnap.data();
        await sendPassEmail({ eventId, registrationId, passToken: reg.passToken, name: reg.name, email: reg.email }, eventSnap.data(), provider);
        return res.status(200).json({ success: true, email: reg.email });
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error resending pass:', error);
        return res.status(500).json({ error: `Couldn't send the pass: ${error.message}` });
    }
}

// passes:view — registrants for an event as a CSV (who registered, who showed up).
async function handleExportRegistrations(req, res) {
    try {
        await requireAnyPermission(req, [['passes', 'view'], ['registrations', 'view']]);
        if (!db) return res.status(503).json({ error: 'Database not available' });

        const eventId = req.query?.eventId;
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        const eventSnap = await db.collection('events').doc(eventId).get();
        if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });

        const snap = await db.collection('event_registrations').where('eventId', '==', eventId).get();
        const istStamp = (ts) => (ts?.toDate ? ts.toDate().toLocaleString('en-GB', { timeZone: IST, dateStyle: 'medium', timeStyle: 'short' }) : '');
        const rows = snap.docs
            .map((d) => d.data())
            .sort((a, b) => (a.registeredAt?.toMillis?.() || 0) - (b.registeredAt?.toMillis?.() || 0))
            .map((r) => [r.name || '', r.email || '', r.phone || '', istStamp(r.registeredAt), r.checkedIn ? 'Yes' : 'No', istStamp(r.checkedInAt)]);

        const csv = toCsv([['Name', 'Email', 'Phone', 'Registered (IST)', 'Checked In', 'Checked In At (IST)'], ...rows]);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="registrations-${safeFilePart(eventSnap.data().title || eventId)}.csv"`);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).end(csv);
    } catch (error) {
        if (error.status) return sendRbacError(res, error);
        console.error('Error exporting registrations:', error);
        return res.status(500).json({ error: 'Failed to export registrations' });
    }
}

// ---------------------------------------------------------------------------
// AI event drafting via OpenRouter. Two admin-only actions share one caller:
//   parse-event-document  — an uploaded approval letter (PDF / image) in, a
//                           drafted event + identified event type + suggested
//                           page headings out. Powers the creation wizard.
//   generate-event-content — the older "Magic AI Assistant" (theme + vibe in,
//                           drafted event out), moved here from the external
//                           Cloud Function so everything runs on one key.
// Needs OPENROUTER_API_KEY. OPENROUTER_MODEL picks the model (must accept
// image/PDF input for document parsing); OPENROUTER_MODEL_THINKING optionally
// overrides it for the assistant's "Thinking" toggle.
// ---------------------------------------------------------------------------

// Keep in sync with src/utils/eventSections.js (api/ can't import from src/).
const AI_SECTION_KEYS = [
    'highlights', 'process', 'zones', 'schedule', 'workshops', 'challenges',
    'people', 'outcomes', 'awards', 'winners', 'callout', 'gallery', 'register',
];
const AI_EVENT_TYPES = [
    'Hackathon', 'Pitch Competition', 'Summit', 'Workshop', 'Seminar / Talk',
    'Training / FDP', 'Networking', 'Awareness Drive', 'Festival', 'Other',
];
const AI_HERO_STYLES = ['poster', 'giant', 'stats'];
const AI_ICONS = 'Lightbulb, Users, Rocket, TrendingUp, Trophy, Award, Medal, Target, Shield, Star, Info, Zap, BookOpen, Mic, Handshake';

const EVENT_JSON_SHAPE = `{
  "eventType": one of ${JSON.stringify(AI_EVENT_TYPES)},
  "title": string,
  "slug": string (url-safe, lowercase, hyphenated, from the title),
  "subtitle": string (a short punchy tagline, max 10 words),
  "heroTag": string (2-3 word UPPERCASE badge, e.g. "FLAGSHIP CHALLENGE", "WORKSHOP", "UPCOMING SUMMIT"),
  "date": string (human readable, e.g. "15th March 2026" or "8th & 9th November 2025"),
  "time": string (duration or timing, e.g. "24 Hour Marathon" or "10 AM - 4 PM"),
  "location": string,
  "participants": string (expected audience, e.g. "200+" or "Students & Faculty"),
  "category": string (same as eventType unless something more specific fits),
  "teamBased": boolean,
  "description": string (2-4 sentences, faithful to the source),
  "highlights": [{ "title": string, "description": string, "icon": string }],
  "process": [{ "title": string, "description": string, "icon": string }],
  "zones": [{ "zone": string, "name": string, "duration": string, "focus": string, "description": string }],
  "schedule": { "day1Night": [{ "time": string, "event": string }], "day2": [{ "time": string, "event": string }] },
  "workshops": string[],
  "challenges": [{ "category": string, "title": string, "description": string }],
  "people": [{ "name": string, "role": string, "image": "" }],
  "outcomes": [{ "title": string, "description": string, "icon": string }],
  "awards": [{ "title": string, "icon": string }],
  "winners": [{ "place": "1st" | "2nd" | "3rd", "team": string, "prize": string, "members": string }],
  "callout": { "tag": string, "title": string, "body": string },
  "recommendedSections": subset of ${JSON.stringify(AI_SECTION_KEYS)} that suit this event,
  "heroStyle": one of ${JSON.stringify(AI_HERO_STYLES)}
}
Rules: icons must be one of: ${AI_ICONS}. Use "day1Night" for a first day that runs into the evening/night or the only day, and "day2" for the second day; use "day3" if needed. Leave arrays empty ([]) and strings "" for anything the source does not mention — never invent names, prizes, winners, speakers or numbers.`;

const DOCUMENT_PROMPT = `You are reading an event approval document (a letter, memo or form approving a college entrepreneurship-cell event). Identify what kind of event it is, extract its facts, and propose which sections an event web page should show. Respond with ONLY one JSON object — no markdown fences, no commentary — shaped exactly like:
${EVENT_JSON_SHAPE}
"recommendedSections" should include a section only if the document gives it real content (always consider "register" for an upcoming event). "heroStyle": "poster" for competitions/flagships, "giant" for celebrations/awareness events, "stats" when the event is mostly facts and timings.`;

const buildThemePrompt = (theme, vibe) => `You are drafting a web page for a college entrepreneurship-cell event. Event idea: "${theme}". Tone/vibe: "${vibe}". Invent plausible, tasteful content and respond with ONLY one JSON object — no markdown fences, no commentary — shaped exactly like:
${EVENT_JSON_SHAPE}
Fill the content sections that suit this event type (highlights, schedule, workshops, awards and so on) but leave "winners" and "people" empty arrays and "gallery"-style data out entirely, because those require real facts.`;

async function callOpenRouter(content, { thinking = false } = {}) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        const err = new Error('OPENROUTER_API_KEY is not configured on the server');
        err.status = 503;
        throw err;
    }
    const model = (thinking && process.env.OPENROUTER_MODEL_THINKING)
        || process.env.OPENROUTER_MODEL
        || 'google/gemini-2.5-flash';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://ecelldypiu.in',
            'X-Title': 'E-Cell DYPIU',
        },
        body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [{ role: 'user', content }],
        }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        console.error('OpenRouter error:', response.status, JSON.stringify(data));
        const err = new Error(data.error?.message || `OpenRouter request failed (${response.status})`);
        err.status = 502;
        throw err;
    }
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
        const err = new Error('The AI returned an empty response — try again');
        err.status = 502;
        throw err;
    }
    return text;
}

function extractJsonObject(text) {
    const stripped = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    try {
        return JSON.parse(stripped);
    } catch {
        const start = stripped.indexOf('{');
        const end = stripped.lastIndexOf('}');
        if (start === -1 || end <= start) return null;
        try {
            return JSON.parse(stripped.slice(start, end + 1));
        } catch {
            return null;
        }
    }
}

const str = (v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const pickFields = (item, fields) => {
    const source = item && typeof item === 'object' ? item : {};
    return Object.fromEntries(fields.map((f) => [f, str(source[f])]));
};
const objectList = (value, fields, requiredField) => (Array.isArray(value) ? value : [])
    .map((item) => (typeof item === 'string' ? { [fields[0]]: item } : item))
    .map((item) => pickFields(item, fields))
    .filter((item) => item[requiredField]);

// The model's JSON is untrusted input headed for the admin's form and, once
// saved, a public page — coerce every field to the shape the page expects and
// drop anything unrecognised instead of passing it through.
function normalizeEventDraft(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const schedule = {};
    if (r.schedule && typeof r.schedule === 'object') {
        for (const [day, items] of Object.entries(r.schedule)) {
            if (!/^day\d(Night|Morning)?$/.test(day) || !Array.isArray(items)) continue;
            const rows = items.map((i) => pickFields(i, ['time', 'event'])).filter((i) => i.event);
            if (rows.length) schedule[day] = rows;
        }
    }
    const eventType = AI_EVENT_TYPES.includes(r.eventType) ? r.eventType : 'Other';
    const title = str(r.title);
    const slug = str(r.slug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const content = {
        eventType,
        title,
        slug,
        subtitle: str(r.subtitle),
        heroTag: str(r.heroTag).toUpperCase(),
        date: str(r.date),
        time: str(r.time),
        location: str(r.location),
        participants: str(r.participants),
        category: str(r.category) || eventType,
        teamBased: typeof r.teamBased === 'boolean' ? r.teamBased : false,
        description: str(r.description),
        highlights: objectList(r.highlights, ['title', 'description', 'icon'], 'title'),
        process: objectList(r.process, ['title', 'description', 'icon'], 'title'),
        zones: objectList(r.zones, ['zone', 'name', 'duration', 'focus', 'description'], 'name'),
        schedule,
        workshops: (Array.isArray(r.workshops) ? r.workshops : []).map(str).filter(Boolean),
        challenges: objectList(r.challenges, ['category', 'title', 'description'], 'title'),
        people: objectList(r.people, ['name', 'role', 'image'], 'name'),
        outcomes: objectList(r.outcomes, ['title', 'description', 'icon'], 'title'),
        awards: objectList(r.awards, ['title', 'icon'], 'title'),
        winners: objectList(r.winners, ['place', 'team', 'prize', 'members'], 'team'),
        callout: pickFields(r.callout, ['tag', 'title', 'body']),
        heroStyle: AI_HERO_STYLES.includes(r.heroStyle) ? r.heroStyle : 'poster',
    };
    const recommendedSections = (Array.isArray(r.recommendedSections) ? r.recommendedSections : [])
        .filter((k) => AI_SECTION_KEYS.includes(k));
    return { content, recommendedSections };
}

const sendAiError = (res, error, fallback) => {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error(fallback, error);
    return res.status(500).json({ error: fallback });
};

// Admin-only: approval document in, drafted event + identification out.
async function handleParseEventDocument(req, res) {
    if (!(await callerCan(req, 'events', 'manage'))) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { fileBase64, mimeType, fileName } = req.body || {};
        if (!fileBase64 || !mimeType) return res.status(400).json({ error: 'fileBase64 and mimeType are required' });
        // Vercel rejects request bodies over 4.5MB; base64 adds ~33%.
        if (fileBase64.length > 4_300_000) {
            return res.status(413).json({ error: 'File is too large — keep approval documents under 3 MB' });
        }

        const dataUrl = `data:${mimeType};base64,${fileBase64}`;
        let filePart;
        if (mimeType === 'application/pdf') {
            filePart = { type: 'file', file: { filename: str(fileName) || 'approval.pdf', file_data: dataUrl } };
        } else if (mimeType.startsWith('image/')) {
            filePart = { type: 'image_url', image_url: { url: dataUrl } };
        } else {
            return res.status(400).json({ error: 'Upload a PDF or an image (PNG/JPG) of the approval document' });
        }

        const text = await callOpenRouter([{ type: 'text', text: DOCUMENT_PROMPT }, filePart]);
        const parsed = extractJsonObject(text);
        if (!parsed) {
            return res.status(502).json({ error: 'AI could not read this document — try a clearer file or fill the form manually' });
        }

        const { content, recommendedSections } = normalizeEventDraft(parsed);
        return res.status(200).json({
            content,
            meta: { eventType: content.eventType, recommendedSections, heroStyle: content.heroStyle },
        });
    } catch (error) {
        return sendAiError(res, error, 'Failed to parse document');
    }
}

// Admin-only: the theme + vibe assistant, now on OpenRouter.
async function handleGenerateEventContent(req, res) {
    if (!(await callerCan(req, 'events', 'manage'))) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { theme, vibe, model } = req.body || {};
        if (!str(theme)) return res.status(400).json({ error: 'theme is required' });

        const text = await callOpenRouter(buildThemePrompt(str(theme), str(vibe) || 'Bold & Minimal'), {
            thinking: typeof model === 'string' && model.includes('thinking'),
        });
        const parsed = extractJsonObject(text);
        if (!parsed) return res.status(502).json({ error: 'AI returned something unreadable — try again' });

        return res.status(200).json(normalizeEventDraft(parsed).content);
    } catch (error) {
        return sendAiError(res, error, 'Failed to generate event content');
    }
}
