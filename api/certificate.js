import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp as FirestoreTimestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

let db = null;
let Timestamp = FirestoreTimestamp;

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
    console.warn('⚠️  Firebase not available for certificate API, using local fallback');
}

function getLocalConfigPath() {
    const __dir = typeof __dirname !== 'undefined'
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(__dir, '..', 'certificate-configs.json');
}

function readLocalConfigs() {
    const filePath = getLocalConfigPath();
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return {};
}

function writeLocalConfigs(configs) {
    const filePath = getLocalConfigPath();
    fs.writeFileSync(filePath, JSON.stringify(configs, null, 2), 'utf-8');
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(to, subject, html, provider = 'resend', attachments = []) {
    if (provider === 'bridge1' || provider === 'bridge2') {
        const url = provider === 'bridge1' ? process.env.MAIL_BRIDGE_1 : process.env.MAIL_BRIDGE_2;
        if (!url) {
            throw new Error(`Environment variable ${provider === 'bridge1' ? 'MAIL_BRIDGE_1' : 'MAIL_BRIDGE_2'} is not set.`);
        }
        
        const defaultName = provider === 'bridge1' ? 'CIIE DYPIU' : 'E-Cell DYPIU';
        const defaultEmail = provider === 'bridge1' ? 'ciie@dypiu.in' : 'noreply@ecelldypiu.in';
        
        const envNameKey = provider === 'bridge1' ? 'MAIL_BRIDGE_1_NAME' : 'MAIL_BRIDGE_2_NAME';
        const envEmailKey = provider === 'bridge1' ? 'MAIL_BRIDGE_1_EMAIL' : 'MAIL_BRIDGE_2_EMAIL';

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                subject,
                htmlContent: html,
                fromName: process.env[envNameKey] || defaultName,
                fromEmail: process.env[envEmailKey] || defaultEmail,
                attachments
            })
        });

        const responseText = await res.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch(e) {
            throw new Error(`Mail Bridge returned invalid response: ${responseText}`);
        }

        if (!data.success) {
            throw new Error(`Mail Bridge error: ${data.error || 'Unknown error'}`);
        }
        return data;
    }

    if (provider === 'zeptomail' || (!process.env.RESEND_API_KEY && process.env.ZEPTOMAIL_API_KEY)) {
        if (!process.env.ZEPTOMAIL_API_KEY) {
            throw new Error('ZEPTOMAIL_API_KEY is not set');
        }
        const url = process.env.ZEPTOMAIL_URL || 'https://api.zeptomail.in/v1.1/email';
        
        let authHeader = process.env.ZEPTOMAIL_API_KEY;
        if (!authHeader.toLowerCase().startsWith('zoho-enczapikey')) {
            authHeader = `Zoho-enczapikey ${authHeader}`;
        }
        
        const fromAddress = process.env.ZEPTOMAIL_FROM_ADDRESS || 'ecell@dypiu.ac.in';
        const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'E-Cell DYPIU';
        
        let toName = '';
        let toAddress = to;
        const toMatch = to.match(/^(.*?)\s*<(.*?)>$/);
        if (toMatch) {
            toName = toMatch[1].trim();
            toAddress = toMatch[2].trim();
        }

        const formattedAttachments = attachments.map(att => ({
            content: att.content || att.base64 || att.data,
            mime_type: att.contentType || att.mimeType || att.type || 'application/octet-stream',
            name: att.filename || att.name || 'attachment'
        }));

        const payload = {
            from: {
                address: fromAddress,
                name: fromName
            },
            to: [
                {
                    email_address: {
                        address: toAddress,
                        name: toName || toAddress.split('@')[0]
                    }
                }
            ],
            subject,
            htmlbody: html
        };

        if (formattedAttachments.length > 0) {
            payload.attachments = formattedAttachments;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`ZeptoMail send failed: ${errorText}`);
        }
        return res.json();
    }

    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not set');
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'CIIE Bridge <noreply@ecelldypiu.in>',
            to: [to],
            subject,
            html,
            attachments: attachments.length > 0 ? attachments : undefined,
        }),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Email send failed: ${error}`);
    }
    return res.json();
}

function maskEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 3
        ? local.slice(0, 2) + '*'.repeat(local.length - 3) + local.slice(-1)
        : local[0] + '*'.repeat(local.length - 1);
    return `${maskedLocal}@${domain}`;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const url = new URL(req.url, 'http://localhost');
    const actionQuery = req.query?.action || url.searchParams.get('action');

    if (req.method === 'GET') {
        if (actionQuery === 'templates') {
            return await handleListTemplates(req, res);
        }
        return await handleGetConfig(req, res);
    }

    if (req.method === 'POST') {
        // We might accept action in body or query
        const action = actionQuery || req.body?.action;

        if (action === 'save-config') {
            return await handleSaveConfig(req, res);
        } else if (action === 'send-otp') {
            return await handleSendOtp(req, res);
        } else if (action === 'verify-otp') {
            return await handleVerifyOtp(req, res);
        } else if (action === 'upload-template') {
            return await handleUploadTemplate(req, res);
        } else if (action === 'dispatch-certificates') {
            return await handleDispatchCertificates(req, res);
        }
        return res.status(400).json({ error: 'Valid action parameter is required for POST' });
    }

    if (req.method === 'DELETE') {
        const action = actionQuery || req.body?.action;
        if (action === 'delete-template') {
            return await handleDeleteTemplate(req, res);
        }
        return res.status(400).json({ error: 'Valid action parameter is required for DELETE' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGetConfig(req, res) {
    try {
        const url = new URL(req.url, 'http://localhost');
        const eventId = req.query?.eventId || url.searchParams.get('eventId');
        const isAdmin = req.query?.admin === 'true' || url.searchParams.get('admin') === 'true';

        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        let config = null;

        if (db) {
            try {
                const docRef = db.collection('certificateConfigs').doc(eventId);
                const doc = await docRef.get();
                if (doc.exists) config = doc.data();
            } catch (fbErr) {
                console.warn('Firebase read failed, trying local fallback:', fbErr.message);
            }
        }

        if (!config) {
            const localConfigs = readLocalConfigs();
            config = localConfigs[eventId] || null;
        }

        if (!config) return res.status(404).json({ error: 'No certificate config found for this event' });
        if (!config.enabled) return res.status(404).json({ error: 'Certificates are not enabled for this event' });

        const publicConfig = {
            eventId: config.eventId,
            eventName: config.eventName,
            enabled: config.enabled,
            autoIssueToProfile: config.autoIssueToProfile === true,
            templateUrl: config.templateUrl,
            textFields: config.textFields,
            imageFields: config.imageFields || [],
            customFonts: config.customFonts,
        };

        if (isAdmin) {
            publicConfig.eligibility = config.eligibility || {};
            publicConfig.attendeeCollection = config.attendeeCollection || '';
            publicConfig.emailSubject = config.emailSubject || '';
            publicConfig.emailHTML = config.emailHTML || '';
        }

        return res.status(200).json({ config: publicConfig });
    } catch (error) {
        console.error('Error getting config:', error);
        return res.status(500).json({ error: 'Failed to get certificate config', details: error.message });
    }
}

async function handleListTemplates(req, res) {
    try {
        if (!db) {
            return res.status(500).json({ error: 'Firebase not initialized' });
        }
        
        const snapshot = await db.collection('certificateTemplates').get();
        const templates = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                name: data.name,
                filename: data.filename,
                url: data.url
            };
        });

        return res.status(200).json({ templates });
    } catch (error) {
        console.error('Error listing templates:', error);
        return res.status(500).json({ error: 'Failed to list templates', details: error.message });
    }
}

async function handleDeleteTemplate(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authHeader.split('Bearer ')[1];
        if (token !== process.env.ADMIN_API_KEY) {
            return res.status(403).json({ error: 'Invalid admin key' });
        }

        const url = new URL(req.url, 'http://localhost');
        const filename = req.query?.filename || url.searchParams.get('filename') || req.body?.filename;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        const safeFilename = path.basename(filename);
        
        if (!db) {
            return res.status(500).json({ error: 'Firebase not initialized' });
        }

        const docRef = db.collection('certificateTemplates').doc(safeFilename);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Template not found' });
        }

        await docRef.delete();
        return res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        return res.status(500).json({ error: 'Failed to delete template', details: error.message });
    }
}

async function handleSaveConfig(req, res) {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { eventId, eventName, enabled, templateUrl, textFields, imageFields, customFonts, attendeeCollection, eligibility, emailSubject, emailHTML, autoIssueToProfile } = req.body;
        if (!eventId || !eventName) return res.status(400).json({ error: 'eventId and eventName are required' });

        const configData = {
            eventId,
            eventName,
            enabled: enabled !== false,
            templateUrl: templateUrl || '',
            textFields: textFields || [],
            imageFields: imageFields || [],
            customFonts: customFonts || [],
            attendeeCollection: attendeeCollection || `events/${eventId}/attendees`,
            eligibility: eligibility || {},
            emailSubject: emailSubject || '',
            emailHTML: emailHTML || '',
            // Separate from `enabled` on purpose: `enabled` gates the existing manual-
            // claim page; this gates whether it also auto-appears on member profiles.
            autoIssueToProfile: autoIssueToProfile === true,
            updatedAt: new Date().toISOString(),
        };

        let savedToFirebase = false;

        if (db) {
            try {
                const fbData = { ...configData };
                if (Timestamp) fbData.updatedAt = Timestamp.now();
                const docRef = db.collection('certificateConfigs').doc(eventId);
                const existing = await docRef.get();
                if (existing.exists) {
                    await docRef.update(fbData);
                } else {
                    if (Timestamp) fbData.createdAt = Timestamp.now();
                    await docRef.set(fbData);
                }
                savedToFirebase = true;
            } catch (fbErr) {
                console.warn('Firebase write failed, using local fallback:', fbErr.message);
            }
        }

        if (!savedToFirebase) {
            const localConfigs = readLocalConfigs();
            localConfigs[eventId] = configData;
            writeLocalConfigs(localConfigs);
        }

        return res.status(200).json({
            success: true,
            message: `Certificate config saved for ${eventName} ${savedToFirebase ? '(Firebase)' : '(Local)'}`,
            config: configData
        });
    } catch (error) {
        console.error('Error saving config:', error);
        return res.status(500).json({ error: 'Failed to save certificate config', details: error.message });
    }
}

async function handleSendOtp(req, res) {
    try {
        const { eventId, identifier } = req.body;
        if (!eventId || !identifier) return res.status(400).json({ error: 'eventId and identifier are required' });

        if (!db) return res.status(500).json({ error: 'Database connection not available' });

        const configDoc = await db.collection('certificateConfigs').doc(eventId).get();
        if (!configDoc.exists || !configDoc.data().enabled) return res.status(404).json({ error: 'Certificate not available for this event' });

        const config = configDoc.data();
        const attendeeCollection = config.attendeeCollection || `events/${eventId}/attendees`;
        const collectionRef = db.collection(attendeeCollection);

        let attendeeDoc = null, attendeeData = null;

        const emailQuery = await collectionRef.where('email', '==', identifier.toLowerCase().trim()).limit(1).get();
        if (!emailQuery.empty) {
            attendeeDoc = emailQuery.docs[0];
            attendeeData = attendeeDoc.data();
        }

        if (!attendeeData) {
            const nameQuery = await collectionRef.where('name', '==', identifier.trim()).limit(1).get();
            if (!nameQuery.empty) {
                attendeeDoc = nameQuery.docs[0];
                attendeeData = nameQuery.docs[0].data();
            }
        }

        if (!attendeeData) {
            const allDocs = await collectionRef.get();
            for (const doc of allDocs.docs) {
                const data = doc.data();
                if (data.name && data.name.toLowerCase().trim() === identifier.toLowerCase().trim()) {
                    attendeeDoc = doc;
                    attendeeData = data;
                    break;
                }
            }
        }

        if (!attendeeData || !attendeeDoc) return res.status(404).json({ error: 'No attendee found. Check your details.' });
        if (!attendeeData.email) return res.status(400).json({ error: 'No email address found for this attendee' });

        const otp = generateOTP();
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));
        const otpDocId = `${eventId}_${attendeeDoc.id}`;

        await db.collection('certificateOTPs').doc(otpDocId).set({
            eventId,
            attendeeId: attendeeDoc.id,
            otp,
            expiresAt,
            verified: false,
            createdAt: Timestamp.now(),
        });

        const emailHTML = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #000; color: #fff; border-radius: 16px; overflow: hidden; border: 2px solid #333;">
                <div style="background: #FFB22C; padding: 24px 32px; text-align: center;">
                    <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 900; letter-spacing: 1px;">E-CELL DYPIU</h1>
                    <p style="margin: 4px 0 0; color: #000; font-size: 14px; font-weight: 600;">Certificate Verification</p>
                </div>
                <div style="padding: 32px;">
                    <p style="color: #ccc; font-size: 15px; line-height: 1.6;">Hi <strong style="color: #fff;">${attendeeData.name}</strong>,</p>
                    <p style="color: #ccc; font-size: 15px; line-height: 1.6;">Your OTP for certificate download for <strong style="color: #FFB22C;">${config.eventName}</strong> is:</p>
                    <div style="text-align: center; margin: 24px 0;">
                        <div style="display: inline-block; background: #111; border: 2px solid #FFB22C; border-radius: 12px; padding: 16px 40px;">
                            <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #FFB22C;">${otp}</span>
                        </div>
                    </div>
                    <p style="color: #888; font-size: 13px; text-align: center;">This code expires in <strong>10 minutes</strong>.</p>
                </div>
            </div>
        `;

        await sendEmail(attendeeData.email, `Your Certificate OTP - ${config.eventName}`, emailHTML);

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email',
            attendeeId: attendeeDoc.id,
            attendee: {
                name: attendeeData.name,
                email: maskEmail(attendeeData.email),
                team: attendeeData.team || attendeeData.teamName || null,
                college: attendeeData.college || null,
            }
        });
    } catch (error) {
        console.error('Error sending certificate OTP:', error);
        return res.status(500).json({ error: 'Failed to send OTP', details: error.message });
    }
}

async function handleVerifyOtp(req, res) {
    try {
        const { eventId, attendeeId, otp } = req.body;
        if (!eventId || !attendeeId || !otp) return res.status(400).json({ error: 'eventId, attendeeId, and otp required' });
        if (!db) return res.status(500).json({ error: 'Database connection not available' });

        const otpDocId = `${eventId}_${attendeeId}`;
        const otpDocRef = db.collection('certificateOTPs').doc(otpDocId);
        const otpDoc = await otpDocRef.get();

        if (!otpDoc.exists) return res.status(404).json({ error: 'No OTP found' });
        const otpData = otpDoc.data();

        if (otpData.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        const expiresAt = otpData.expiresAt?.toDate?.() || new Date(otpData.expiresAt?._seconds * 1000);
        if (new Date() > expiresAt) return res.status(400).json({ error: 'OTP has expired' });

        await otpDocRef.update({ verified: true, verifiedAt: Timestamp.now() });

        const configDoc = await db.collection('certificateConfigs').doc(eventId).get();
        const config = configDoc.data();
        const attendeeCollection = config.attendeeCollection || `events/${eventId}/attendees`;
        const attendeeDoc = await db.collection(attendeeCollection).doc(attendeeId).get();

        if (!attendeeDoc.exists) return res.status(404).json({ error: 'Attendee record not found' });
        const attendeeData = attendeeDoc.data();

        return res.status(200).json({
            verified: true,
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
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
    }
}

async function handleUploadTemplate(req, res) {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { filename, imageData } = req.body;
        if (!filename || !imageData) return res.status(400).json({ error: 'filename and imageData required' });

        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
        if (!/\.(png|jpg|jpeg|webp)$/i.test(safeName)) return res.status(400).json({ error: 'File must be a valid image format' });

        if (!db) {
            return res.status(500).json({ error: 'Firebase not initialized' });
        }
        
        const sizeInMB = Buffer.byteLength(imageData, 'utf8') / (1024 * 1024);
        if (sizeInMB > 1.0) {
            return res.status(400).json({ error: 'Template size is too large (max 1MB). Please compress the image.' });
        }

        const docRef = db.collection('certificateTemplates').doc(safeName);
        await docRef.set({
            name: safeName.replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/[-_]/g, ' '),
            filename: safeName,
            url: imageData, // the base64 data URI
            createdAt: FirestoreTimestamp.now()
        });

        return res.status(200).json({
            success: true,
            url: imageData,
            filename: safeName,
            message: `Template uploaded successfully`
        });
    } catch (error) {
        console.error('Error uploading template:', error);
        return res.status(500).json({ error: 'Failed to upload template', details: error.message });
    }
}

async function handleDispatchCertificates(req, res) {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { eventId, provider, eligibility: reqEligibility } = req.body;
        if (!eventId) return res.status(400).json({ error: 'eventId is required' });

        if (!db) return res.status(500).json({ error: 'Database connection not available' });

        const configDoc = await db.collection('certificateConfigs').doc(eventId).get();
        if (!configDoc.exists || !configDoc.data().enabled) return res.status(404).json({ error: 'Certificate config not found or disabled' });

        const config = configDoc.data();
        const attendeeCollection = config.attendeeCollection || `events/${eventId}/attendees`;
        const eligibility = reqEligibility || config.eligibility || {};

        const attendeesSnapshot = await db.collection(attendeeCollection).get();
        if (attendeesSnapshot.empty) {
            return res.status(404).json({ error: 'No attendees found for this event' });
        }

        let sentCount = 0;
        let skippedCount = 0;
        const errors = [];
        const attendees = [];
        attendeesSnapshot.forEach(doc => attendees.push(doc.data()));

        let templateImageBytes = null;
        let templateImageType = 'png';
        if (config.templateUrl) {
            try {
                let urlToFetch = config.templateUrl;
                if (urlToFetch.startsWith('data:image/')) {
                    const parts = urlToFetch.split(',');
                    const dataPart = parts[1];
                    const mimePart = parts[0].split(';')[0].toLowerCase();
                    if (dataPart) {
                        templateImageBytes = Buffer.from(dataPart, 'base64');
                        if (mimePart.includes('jpeg') || mimePart.includes('jpg')) {
                            templateImageType = 'jpg';
                        } else {
                            templateImageType = 'png';
                        }
                    }
                } else {
                    if (urlToFetch.startsWith('/')) {
                        let scheme = 'https';
                        if (req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'))) {
                            scheme = 'http';
                        }
                        const host = req.headers.origin || (req.headers.host ? `${scheme}://${req.headers.host}` : 'https://ecelldypiu.in');
                        urlToFetch = `${host}${urlToFetch}`;
                    }
                    const imgRes = await fetch(urlToFetch);
                    if (imgRes.ok) {
                        const arrayBuffer = await imgRes.arrayBuffer();
                        templateImageBytes = Buffer.from(arrayBuffer);
                        if (urlToFetch.toLowerCase().endsWith('.jpg') || urlToFetch.toLowerCase().endsWith('.jpeg')) {
                            templateImageType = 'jpg';
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to pre-fetch template image:", err);
            }
        }

        for (const attendee of attendees) {
            if (!attendee.email) {
                skippedCount++;
                continue;
            }

            const emailKey = attendee.email.trim().toLowerCase();
            if (eligibility[emailKey]?.eligible !== true) {
                skippedCount++;
                continue;
            }

            try {
                // Assuming protocol is https unless localhost
                const host = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://ecelldypiu.in');
                const certLink = `${host}/events/${eventId}/certificate?email=${encodeURIComponent(attendee.email)}`;
                const subjectTemplate = config.emailSubject || `Your Certificate for ${config.eventName} is Ready!`;
                const htmlTemplate = config.emailHTML || `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #000; color: #fff; border-radius: 16px; overflow: hidden; border: 2px solid #333;">
                        <div style="background: #FFB22C; padding: 24px 32px; text-align: center;">
                            <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 900; letter-spacing: 1px;">E-CELL DYPIU</h1>
                            <p style="margin: 4px 0 0; color: #000; font-size: 14px; font-weight: 600;">Certificate Ready</p>
                        </div>
                        <div style="padding: 32px;">
                            <p style="color: #ccc; font-size: 15px; line-height: 1.6;">Hi <strong style="color: #fff;">{{attendee_name}}</strong>,</p>
                            <p style="color: #ccc; font-size: 15px; line-height: 1.6;">Thank you for participating in <strong style="color: #FFB22C;">{{event_name}}</strong>. Your certificate is now ready to download!</p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="{{cert_link}}" style="display: inline-block; background: #FFB22C; color: #000; text-decoration: none; font-weight: 800; padding: 14px 32px; border-radius: 8px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Get My Certificate</a>
                            </div>
                            <p style="color: #888; font-size: 13px; text-align: center;">If the button doesn't work, copy this link:<br/><a href="{{cert_link}}" style="color: #FFB22C;">{{cert_link}}</a></p>
                        </div>
                    </div>
                `;

                // Replace placeholders
                const finalSubject = subjectTemplate
                    .replace(/{{attendee_name}}/g, attendee.name || 'Attendee')
                    .replace(/{{event_name}}/g, config.eventName)
                    .replace(/{{cert_link}}/g, certLink);

                const finalHTML = htmlTemplate
                    .replace(/{{attendee_name}}/g, attendee.name || 'Attendee')
                    .replace(/{{event_name}}/g, config.eventName)
                    .replace(/{{cert_link}}/g, certLink);

                const attachments = [];
                if (templateImageBytes) {
                    try {
                        const pdfDoc = await PDFDocument.create();
                        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                        
                        let image;
                        if (templateImageType === 'jpg') {
                            image = await pdfDoc.embedJpg(templateImageBytes);
                        } else {
                            image = await pdfDoc.embedPng(templateImageBytes);
                        }
                        
                        const { width, height } = image.scale(1);
                        const page = pdfDoc.addPage([width, height]);
                        page.drawImage(image, { x: 0, y: 0, width, height });

                        if (config.textFields) {
                            for (const field of config.textFields) {
                                const value = attendee[field.sourceField] || '';
                                if (!value) continue;
                                
                                const fontSize = field.fontSize || 36;
                                const pdfY = height - (field.y || 0) - (fontSize / 2) - (fontSize * 0.15); // Adjustment for vertical centering
                                
                                let pdfX = field.x || 0;
                                const textWidth = font.widthOfTextAtSize(value, fontSize);
                                
                                if ((field.textAlign || 'center') === 'center') {
                                    pdfX = pdfX - (textWidth / 2);
                                } else if (field.textAlign === 'right') {
                                    pdfX = pdfX - textWidth;
                                }

                                let color = rgb(0, 0, 0);
                                if (field.fontColor) {
                                    const hex = field.fontColor.replace('#', '');
                                    if (hex.length === 6) {
                                        color = rgb(
                                            parseInt(hex.substring(0, 2), 16) / 255,
                                            parseInt(hex.substring(2, 4), 16) / 255,
                                            parseInt(hex.substring(4, 6), 16) / 255
                                        );
                                    }
                                }

                                page.drawText(value, {
                                    x: pdfX,
                                    y: pdfY,
                                    size: fontSize,
                                    font: font,
                                    color: color,
                                });
                            }
                        }

                        const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: false });
                        attachments.push({
                            filename: `${config.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`,
                            content: pdfBytes,
                            base64: pdfBytes,
                            data: pdfBytes,
                            contentType: 'application/pdf',
                            mimeType: 'application/pdf',
                            type: 'application/pdf'
                        });
                    } catch (pdfErr) {
                        console.error('Failed to generate PDF for', attendee.email, pdfErr);
                        errors.push({ email: attendee.email, error: 'PDF Error: ' + pdfErr.message });
                        continue; // Skip sending email if PDF failed
                    }
                }

                await sendEmail(attendee.email, finalSubject, finalHTML, provider || 'resend', attachments);
                sentCount++;
                
                await new Promise(r => setTimeout(r, 100)); // Rate limit
            } catch (err) {
                errors.push({ email: attendee.email, error: err.message });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Dispatched ${sentCount} emails. Skipped ${skippedCount}.`,
            sentCount,
            skippedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error dispatching certificates:', error);
        return res.status(500).json({ error: 'Failed to dispatch certificates', details: error.message });
    }
}

