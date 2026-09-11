import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendEmail } from './_lib/emailTransport.js';

// Initialize Firebase Admin (only once)
const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        }),
    });
}

const db = getFirestore();

// Generate Announcement Email Layout
function generateAnnouncementHTML(data, subscriberName) {
    const bannerHtml = data.bannerUrl 
        ? `<tr>
            <td align="center" style="padding: 0 0 30px 0;">
                <img src="${data.bannerUrl}" alt="${data.title}" width="520" style="display: block; width: 100%; max-width: 520px; border-radius: 12px; border: 2px solid #ffffff;" />
            </td>
           </tr>`
        : '';

    const buttonHtml = (data.buttonText && data.buttonUrl)
        ? `<tr>
            <td align="center" style="padding: 10px 0 20px 0;">
                <a href="${data.buttonUrl}" target="_blank" style="display: inline-block; background-color: #FFB22C; color: #000000; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 35px; border-radius: 8px; text-transform: uppercase; border: 3px solid #ffffff;" class="mobile-cta">
                    ${data.buttonText}
                </a>
            </td>
           </tr>`
        : '';

    const formattedBody = (data.body || '').replace(/\n/g, '<br/>');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Announcement</title>
    <style type="text/css">
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; }
            .mobile-cta { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="background-color: #18181b; border: 4px solid #ffffff; border-radius: 20px; overflow: hidden; max-width: 600px; width: 100%;">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 25px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin: 5px 0 0 0; color: #000000; font-size: 13px; font-weight: bold;">
                                OFFICIAL ANNOUNCEMENT 📢
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 35px 40px; color: #ffffff;">
                            <p style="font-size: 17px; margin: 0 0 20px 0;">
                                Hello <strong>${subscriberName || 'E-Cell Member'}</strong>,
                            </p>
                            ${bannerHtml}
                            <h2 style="color: #FFB22C; font-size: 24px; font-weight: 900; margin: 0 0 15px 0; text-transform: uppercase; line-height: 1.3;">
                                ${data.title}
                            </h2>
                            ${data.subtitle ? `<p style="color: #e4e4e7; font-size: 16px; font-weight: bold; margin: 0 0 20px 0;">${data.subtitle}</p>` : ''}
                            <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 35px 0;">
                                ${formattedBody}
                            </p>
                            ${buttonHtml}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0c0c0e; padding: 25px 30px; text-align: center; border-top: 2px solid #27272a;">
                            <p style="margin: 0; color: #71717a; font-size: 12px;">
                                © ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.
                            </p>
                            <p style="margin: 5px 0 0 0; color: #52525b; font-size: 11px;">
                                You are receiving this because you subscribed to updates from the E-Cell DYPIU portal.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

// Generate Event Notification Email Layout
function generateEventHTML(data, subscriberName) {
    const bannerHtml = data.bannerUrl 
        ? `<tr>
            <td align="center" style="padding: 0 0 25px 0;">
                <img src="${data.bannerUrl}" alt="${data.title}" width="520" style="display: block; width: 100%; max-width: 520px; border-radius: 12px; border: 2px solid #ffffff;" />
            </td>
           </tr>`
        : '';

    const registerButtonHtml = data.registrationLink
        ? `<tr>
            <td align="center" style="padding: 10px 0 15px 0;">
                <a href="${data.registrationLink}" target="_blank" style="display: inline-block; background-color: #FFB22C; color: #000000; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 35px; border-radius: 8px; text-transform: uppercase; border: 3px solid #ffffff;" class="mobile-cta">
                    ${data.buttonText || 'Register Now'}
                </a>
            </td>
           </tr>`
        : '';

    const formattedDesc = (data.description || '').replace(/\n/g, '<br/>');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Invite: ${data.title}</title>
    <style type="text/css">
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; }
            .mobile-cta { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="background-color: #18181b; border: 4px solid #ffffff; border-radius: 20px; overflow: hidden; max-width: 600px; width: 100%;">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 25px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin: 5px 0 0 0; color: #000000; font-size: 13px; font-weight: bold;">
                                EVENT INVITATION 📅 🚀
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 35px 40px; color: #ffffff;">
                            <p style="font-size: 17px; margin: 0 0 20px 0;">
                                Hi <strong>${subscriberName || 'Innovator'}</strong>,
                            </p>
                            ${bannerHtml}
                            <h2 style="color: #FFB22C; font-size: 24px; font-weight: 900; margin: 0 0 15px 0; text-transform: uppercase; line-height: 1.3;">
                                ${data.title}
                            </h2>
                            
                            <p style="color: #e4e4e7; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                ${formattedDesc}
                            </p>
                            
                            <!-- Event Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000; border: 2px solid #3f3f46; border-radius: 12px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px 0; color: #FFB22C; font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #27272a; padding-bottom: 8px;">Event Details</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            ${data.date ? `<tr>
                                                <td style="padding: 7px 0; border-bottom: 1px solid #1f1f22;">
                                                    <span style="display: block; color: #a1a1aa; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Date</span>
                                                    <span style="display: block; color: #ffffff; font-size: 14px; margin-top: 3px;">${data.date}</span>
                                                </td>
                                            </tr>` : ''}
                                            ${data.time ? `<tr>
                                                <td style="padding: 7px 0; border-bottom: 1px solid #1f1f22;">
                                                    <span style="display: block; color: #a1a1aa; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Time</span>
                                                    <span style="display: block; color: #ffffff; font-size: 14px; margin-top: 3px;">${data.time}</span>
                                                </td>
                                            </tr>` : ''}
                                            ${data.venue ? `<tr>
                                                <td style="padding: 7px 0;">
                                                    <span style="display: block; color: #a1a1aa; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Venue</span>
                                                    <span style="display: block; color: #ffffff; font-size: 14px; margin-top: 3px;">${data.venue}</span>
                                                </td>
                                            </tr>` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            ${registerButtonHtml}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0c0c0e; padding: 25px 30px; text-align: center; border-top: 2px solid #27272a;">
                            <p style="margin: 0; color: #71717a; font-size: 12px;">
                                © ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

// Generate Interview Schedule Email Layout
function generateInterviewHTML(data, candidateName) {
    const formattedNotes = (data.notes || data.body || '').replace(/\n/g, '<br/>');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Schedule - E-Cell DYPIU</title>
    <style type="text/css">
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; }
            .mobile-cta { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="background-color: #18181b; border: 4px solid #ffffff; border-radius: 20px; overflow: hidden; max-width: 600px; width: 100%;">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 25px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin: 5px 0 0 0; color: #000000; font-size: 13px; font-weight: bold;">
                                TEAM SELECTION INTERVIEW INVITATION
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 35px 40px; color: #ffffff;">
                            <p style="font-size: 17px; margin: 0 0 20px 0;">
                                Dear <strong>${candidateName || 'Applicant'}</strong>,
                            </p>
                            <p style="color: #e4e4e7; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                Thank you for applying to join <strong>E-Cell DYPIU</strong>! Based on your application review, we are pleased to invite you for an interview round.
                            </p>
                            
                            <!-- Interview Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000; border: 2px solid #FFB22C; border-radius: 12px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px 0; color: #FFB22C; font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #27272a; padding-bottom: 8px;">Interview Schedule Details</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            ${data.role ? `<tr>
                                                <td style="padding: 6px 0; color: #a1a1aa; font-size: 14px; width: 100px; font-weight: bold;">ROLE:</td>
                                                <td style="padding: 6px 0; color: #FFB22C; font-size: 14px; font-weight: bold;">${data.role}</td>
                                            </tr>` : ''}
                                            ${data.date ? `<tr>
                                                <td style="padding: 6px 0; color: #a1a1aa; font-size: 14px; width: 100px; font-weight: bold;">DATE:</td>
                                                <td style="padding: 6px 0; color: #ffffff; font-size: 14px;">${data.date}</td>
                                            </tr>` : ''}
                                            ${data.time ? `<tr>
                                                <td style="padding: 6px 0; color: #a1a1aa; font-size: 14px; font-weight: bold;">TIME / SLOT:</td>
                                                <td style="padding: 6px 0; color: #ffffff; font-size: 14px;">${data.time}</td>
                                            </tr>` : ''}
                                            ${data.venue ? `<tr>
                                                <td style="padding: 6px 0; color: #a1a1aa; font-size: 14px; font-weight: bold;">LOCATION:</td>
                                                <td style="padding: 6px 0; color: #ffffff; font-size: 14px;">${data.venue}</td>
                                            </tr>` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${formattedNotes ? `
                            <div style="background-color: #27272a; padding: 18px; border-radius: 10px; margin-bottom: 25px;">
                                <h4 style="margin: 0 0 8px 0; color: #FFB22C; font-size: 14px; text-transform: uppercase;">Important Instructions / Notes</h4>
                                <p style="color: #e4e4e7; font-size: 14px; line-height: 1.5; margin: 0;">${formattedNotes}</p>
                            </div>
                            ` : ''}

                            ${data.buttonUrl ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 15px 0;">
                                        <a href="${data.buttonUrl}" target="_blank" style="display: inline-block; background-color: #FFB22C; color: #000000; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 35px; border-radius: 8px; text-transform: uppercase; border: 3px solid #ffffff;" class="mobile-cta">
                                            ${data.buttonText || 'Join Interview / Confirm Slot'}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 25px 0 0 0;">
                                Best of luck! We look forward to meeting you.<br/><br/>
                                Warm regards,<br/>
                                <strong>Team E-Cell DYPIU</strong>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0c0c0e; padding: 25px 30px; text-align: center; border-top: 2px solid #27272a;">
                            <p style="margin: 0; color: #71717a; font-size: 12px;">
                                © ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

// Generate Generic Compose Email Layout (Direct Custom Composer)
function generateGenericHTML(data, recipient) {
    const formattedBody = (data.body || '')
        .replace(/\{name\}/g, recipient?.name || 'Applicant')
        .replace(/\{email\}/g, recipient?.email || '');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Cell DYPIU</title>
</head>
<body style="margin:0; padding:0; background-color:#000000; font-family:Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#000000;">
        <tr>
            <td align="center" style="padding:30px 10px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#18181b; border:4px solid #ffffff; border-radius:20px; overflow:hidden; max-width:600px; width:100%;">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color:#FFB22C; padding:25px 30px; text-align:center;">
                            <h1 style="margin:0; color:#000000; font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:-1px; font-family:Arial, sans-serif;">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin:5px 0 0 0; color:#000000; font-size:13px; font-weight:bold; font-family:Arial, sans-serif;">
                                A MESSAGE FROM THE TEAM
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td style="padding:35px 40px;">
                            ${formattedBody}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#0c0c0e; padding:25px 30px; text-align:center; border-top:2px solid #27272a;">
                            <p style="margin:0; color:#71717a; font-size:12px; font-family:Arial, sans-serif;">
                                &copy; ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Fetch past dispatch logs for the Email Logs admin tab, newest first.
async function handleGetEmailLogs(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const snapshot = await db.collection('EMAIL_LOGS').orderBy('sentAt', 'desc').limit(limit).get();

        const logs = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                sentAt: d.sentAt?.toDate ? d.sentAt.toDate().toISOString() : d.sentAt
            };
        });

        return res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error('Failed to fetch email logs:', error);
        return res.status(500).json({ error: 'Failed to fetch email logs', details: error.message });
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Verify admin API key
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET' && req.query.action === 'logs') {
        return handleGetEmailLogs(req, res);
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, manualEmails, type, subject, data, selectedSubscribers, provider, attachments, cc, bcc } = req.body;

        if (!type || !subject) {
            return res.status(400).json({ error: 'Type and Subject are required' });
        }

        let recipients = [];
        let skippedDocs = [];
        let totalDocs = 0;

        // Resolve recipients based on 'to' setting
        if (to === 'all') {
            const subscribersSnapshot = await db.collection('SUBSCRIPTION_REQUESTS').get();
            totalDocs = subscribersSnapshot.size;

            subscribersSnapshot.forEach(doc => {
                const docData = doc.data();
                if (docData.email) {
                    recipients.push({
                        name: docData.name || 'Subscriber',
                        email: docData.email
                    });
                } else {
                    skippedDocs.push({ id: doc.id, fields: Object.keys(docData) });
                }
            });
        } else if (to === 'selected') {
            if (selectedSubscribers && Array.isArray(selectedSubscribers)) {
                recipients = selectedSubscribers.map(sub => ({
                    name: sub.name || 'Subscriber',
                    email: sub.email,
                    role: sub.role
                }));
                totalDocs = selectedSubscribers.length;
            }
        } else if (to === 'manual') {
            let emails = [];
            if (typeof manualEmails === 'string') {
                emails = manualEmails.split(',').map(e => e.trim()).filter(Boolean);
            } else if (Array.isArray(manualEmails)) {
                emails = manualEmails.map(e => e.trim()).filter(Boolean);
            }

            recipients = emails.map(email => ({
                name: email.split('@')[0],
                email: email
            }));
            totalDocs = emails.length;
        }

        if (recipients.length === 0) {
            return res.status(400).json({ error: 'No valid recipients selected' });
        }

        const results = {
            sent: 0,
            failed: 0,
            details: []
        };

        // Dispatch emails one-by-one
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];

            try {
                let recipientSubject = (subject || '')
                    .replace(/\{name\}/g, recipient.name || 'Applicant')
                    .replace(/\{email\}/g, recipient.email || '')
                    .replace(/\{role\}/g, recipient.role || data?.role || 'Team Role');

                let htmlContent = '';
                if (data && data.customHtml) {
                    htmlContent = data.customHtml
                        .replace(/\{name\}/g, recipient.name || 'Applicant')
                        .replace(/\{email\}/g, recipient.email || '')
                        .replace(/\{role\}/g, recipient.role || data.role || 'E-Cell Team Member')
                        .replace(/\{date\}/g, data.date || '')
                        .replace(/\{time\}/g, data.time || '')
                        .replace(/\{venue\}/g, data.venue || '');
                } else if (type === 'announcement') {
                    htmlContent = generateAnnouncementHTML(data, recipient.name);
                } else if (type === 'event') {
                    htmlContent = generateEventHTML(data, recipient.name);
                } else if (type === 'interview') {
                    htmlContent = generateInterviewHTML(data, recipient.name);
                } else {
                    htmlContent = generateGenericHTML(data, recipient);
                }

                await sendEmail(recipient.email, recipientSubject, htmlContent, provider || 'resend', attachments || [], cc || [], bcc || []);
                results.sent++;
                results.details.push({
                    name: recipient.name,
                    email: recipient.email,
                    status: 'sent',
                    error: null
                });
            } catch (err) {
                results.failed++;
                results.details.push({
                    name: recipient.name,
                    email: recipient.email,
                    status: 'failed',
                    error: err.message
                });
            }

            // Rate limit delay between dispatches (1 second)
            if (i < recipients.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Best-effort audit log — must never fail the dispatch response itself.
        try {
            await db.collection('EMAIL_LOGS').add({
                type,
                subject,
                provider: provider || 'resend',
                to,
                recipients: results.details,
                cc: (cc || []).map(c => ({ name: c.name || '', email: c.email })),
                bcc: (bcc || []).map(b => ({ name: b.name || '', email: b.email })),
                attachmentCount: (attachments || []).length,
                sentCount: results.sent,
                failedCount: results.failed,
                totalRecipients: recipients.length,
                sentAt: Timestamp.now()
            });
        } catch (logErr) {
            console.error('Failed to write email log:', logErr.message);
        }

        return res.status(200).json({
            success: true,
            message: `Mailer finished dispatching`,
            results: {
                totalDocs,
                validSubscribers: recipients.length,
                skippedDocs: skippedDocs.length,
                sent: results.sent,
                failed: results.failed,
                details: results.details,
                skipped: skippedDocs
            }
        });

    } catch (error) {
        console.error('Mailer error:', error);
        return res.status(500).json({
            error: 'Failed to process mailing list',
            details: error.message
        });
    }
}
