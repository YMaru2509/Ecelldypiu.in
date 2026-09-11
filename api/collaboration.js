import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from './_lib/emailTransport.js';

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

// Best-effort wrapper: collaboration workflow actions (submit/approve/reject) must still
// succeed and persist to Firestore even if the notification email fails to send.
async function sendEmailBestEffort(to, subject, html) {
    try {
        await sendEmail(to, subject, html);
        console.log(`Email sent successfully to ${to}`);
    } catch (err) {
        console.error(`Email send failed: ${err.message}`);
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action, id } = req.query;

    if (req.method === 'GET') {
        if (id) {
            return await handleGetStatus(req, res);
        } else if (action === 'questions') {
            return await handleGetQuestions(req, res);
        }
        return await handleGetCollaborations(req, res);
    }

    if (req.method === 'POST') {
        if (action === 'manage') {
            return await handleManageCollaboration(req, res);
        } else if (action === 'questions') {
            return await handleManageQuestions(req, res);
        }
        return await handleSubmitCollaboration(req, res);
    }

    if (req.method === 'DELETE') {
        return await handleDeleteCollaboration(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGetStatus(req, res) {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Collaboration ID is required' });

        const collabRef = db.collection('COLLABORATIONS').doc(id);
        const docSnap = await collabRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const data = docSnap.data();
        return res.status(200).json({
            success: true,
            application: {
                id: docSnap.id,
                organization: data.organization,
                contactName: data.contactName,
                status: data.status,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
            }
        });
    } catch (error) {
        console.error('Error fetching collaboration status:', error);
        return res.status(500).json({ error: 'Failed to fetch status', details: error.message });
    }
}

async function handleGetQuestions(req, res) {
    try {
        const docRef = db.collection('CONFIG').doc('collaborationQuestions');
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return res.status(200).json({ success: true, questions: docSnap.data().questions || [] });
        } else {
            return res.status(200).json({ success: true, questions: [] });
        }
    } catch (error) {
        console.error('Error fetching dynamic questions:', error);
        return res.status(500).json({ error: 'Failed to fetch collaboration form questions', details: error.message });
    }
}

async function handleGetCollaborations(req, res) {
    try {
        const authHeader = req.headers.authorization;
        const isAdminRequest = authHeader && authHeader.startsWith('Bearer ') && authHeader.split('Bearer ')[1] === process.env.ADMIN_API_KEY;

        let query = db.collection('COLLABORATIONS');
        if (!isAdminRequest) {
            query = query.where('status', '==', 'approved');
        }
        query = query.orderBy('createdAt', 'desc');

        let snapshot;
        try {
            snapshot = await query.get();
        } catch (indexError) {
            snapshot = await db.collection('COLLABORATIONS').get();
            let allItems = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (isAdminRequest || data.status === 'approved') {
                    allItems.push({ id: doc.id, ...data });
                }
            });
            allItems.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
            return res.status(200).json({ success: true, collaborations: allItems, count: allItems.length });
        }

        const collaborations = [];
        snapshot.forEach(doc => { collaborations.push({ id: doc.id, ...doc.data() }); });
        return res.status(200).json({ success: true, collaborations, count: collaborations.length });
    } catch (error) {
        console.error('Error fetching collaborations:', error);
        return res.status(500).json({ error: 'Failed to fetch collaborations', details: error.message });
    }
}

async function handleSubmitCollaboration(req, res) {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'Application data is required.' });
        }

        let email = null;
        for (const [key, value] of Object.entries(req.body)) {
            if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
                email = value;
                break;
            }
        }

        const newCollab = { ...req.body, status: 'pending', createdAt: FieldValue.serverTimestamp() };
        const docRef = await db.collection('COLLABORATIONS').add(newCollab);

        if (email) {
            const emailHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2>Thank You for Your Application!</h2>
                    <p>Hello,</p>
                    <p>We have successfully received your collaboration application at E-Cell DYPIU.</p>
                    <p>Our team will review your proposal and get back to you soon. In the meantime, you can track the status of your application using the link below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ecelldypiu.in'}/collaborations/status/${docRef.id}" 
                           style="background-color: #fbbf24; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">
                            Track Application Status
                        </a>
                    </div>
                    <p>Application Reference ID: <strong>${docRef.id}</strong></p>
                    <p>Best Regards,<br>E-Cell DYPIU Team</p>
                </div>
            `;
            await sendEmailBestEffort(email, 'Application Received - E-Cell DYPIU', emailHTML);
        }

        return res.status(200).json({
            success: true,
            message: 'Collaboration application submitted successfully',
            collaboration: { id: docRef.id, ...newCollab }
        });

    } catch (error) {
        console.error('Error submitting collaboration:', error);
        return res.status(500).json({ error: 'Failed to submit collaboration', details: error.message });
    }
}

async function handleManageQuestions(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split('Bearer ')[1];
    if (token !== process.env.ADMIN_API_KEY) return res.status(403).json({ error: 'Invalid admin key' });

    try {
        const { questions } = req.body;
        if (!Array.isArray(questions)) return res.status(400).json({ error: 'Invalid config format: questions must be an array' });

        const docRef = db.collection('CONFIG').doc('collaborationQuestions');
        await docRef.set({ questions, lastUpdatedAt: new Date() }, { merge: true });

        return res.status(200).json({ success: true, message: 'Dynamic collaboration questions updated successfully' });
    } catch (error) {
        console.error('Error updating dynamic questions:', error);
        return res.status(500).json({ error: 'Failed to update dynamic questions', details: error.message });
    }
}

async function handleManageCollaboration(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id, action } = req.body;
        if (!id) return res.status(400).json({ error: 'Collaboration ID is required' });

        const collabRef = db.collection('COLLABORATIONS').doc(id);
        const docSnap = await collabRef.get();
        if (!docSnap.exists) return res.status(404).json({ error: 'Collaboration request not found' });

        const collabData = docSnap.data();

        let recipientEmail = collabData.email;
        let recipientName = collabData.contactName || 'Applicant';
        let orgName = collabData.organization || 'Your Organization';

        if (!recipientEmail) {
            for (const [key, value] of Object.entries(collabData)) {
                if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
                    recipientEmail = value;
                }
                if (key.toLowerCase().includes('name') && !key.toLowerCase().includes('organization') && !key.toLowerCase().includes('company')) {
                    recipientName = value;
                }
                if (key.toLowerCase().includes('organization') || key.toLowerCase().includes('company')) {
                    orgName = value;
                }
            }
        }

        if (action === 'approve') {
            await collabRef.update({ status: 'approved' });
            const emailHTML = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #000; color: #fff; border-radius: 16px; overflow: hidden; border: 2px solid #333;">
                    <div style="background: #10B981; padding: 24px 32px; text-align: center;">
                        <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 900; letter-spacing: 1px;">E-CELL DYPIU</h1>
                        <p style="margin: 4px 0 0; color: #000; font-size: 14px; font-weight: 600;">Application Approved</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #ccc; font-size: 15px; line-height: 1.6;">
                            Hi <strong style="color: #fff;">${recipientName}</strong>,
                        </p>
                        <p style="color: #ccc; font-size: 15px; line-height: 1.6;">
                            Great news! Your collaboration application for <strong>${orgName}</strong> has been <strong style="color: #10B981;">Approved</strong>.
                        </p>
                        <p style="color: #ccc; font-size: 15px; line-height: 1.6;">
                            Our team will be in touch with you shortly with further details. You can track your status anytime using the link below.
                        </p>
                        <div style="margin-top: 24px;">
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ecelldypiu.in'}/collaborations/status/${id}" style="display: inline-block; background: #10B981; color: #000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Track Status</a>
                        </div>
                    </div>
                    <div style="background: #111; padding: 16px 32px; text-align: center; border-top: 1px solid #333;">
                        <p style="color: #666; font-size: 12px; margin: 0;">
                            E-Cell Entrepreneurship Cell, DY Patil International University
                        </p>
                    </div>
                </div>
            `;
            if (recipientEmail) await sendEmailBestEffort(recipientEmail, 'Collaboration Application Approved - E-Cell DYPIU', emailHTML);
            return res.status(200).json({ success: true, message: 'Collaboration approved' });

        } else if (action === 'reject') {
            await collabRef.update({ status: 'rejected' });
            const emailHTML = `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #000; color: #fff; border-radius: 16px; overflow: hidden; border: 2px solid #333;">
                    <div style="background: #EF4444; padding: 24px 32px; text-align: center;">
                        <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 900; letter-spacing: 1px;">E-CELL DYPIU</h1>
                        <p style="margin: 4px 0 0; color: #000; font-size: 14px; font-weight: 600;">Application Update</p>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #ccc; font-size: 15px; line-height: 1.6;">
                            Hi <strong style="color: #fff;">${recipientName}</strong>,
                        </p>
                        <p style="color: #ccc; font-size: 15px; line-height: 1.6;">
                            Thank you for your interest in collaborating with us for <strong>${orgName}</strong>.
                        </p>
                        <p style="color: #ccc; font-size: 15px; line-height: 1.6;">
                            After careful consideration, we are unable to proceed with your proposal at this time. We appreciate your interest and wish you the best in your endeavors.
                        </p>
                        <div style="margin-top: 24px;">
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ecelldypiu.in'}/collaborations/status/${id}" style="display: inline-block; background: #333; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">View Application</a>
                        </div>
                    </div>
                    <div style="background: #111; padding: 16px 32px; text-align: center; border-top: 1px solid #333;">
                        <p style="color: #666; font-size: 12px; margin: 0;">
                            E-Cell Entrepreneurship Cell, DY Patil International University
                        </p>
                    </div>
                </div>
            `;
            if (recipientEmail) await sendEmailBestEffort(recipientEmail, 'Update on Collaboration Application - E-Cell DYPIU', emailHTML);
            return res.status(200).json({ success: true, message: 'Collaboration rejected' });
        } else {
            return res.status(400).json({ error: 'Invalid action. Must be approve or reject.' });
        }
    } catch (error) {
        console.error('Error managing collaboration:', error);
        return res.status(500).json({ error: 'Failed to manage collaboration', details: error.message });
    }
}

async function handleDeleteCollaboration(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Collaboration ID is required' });

        const collabRef = db.collection('COLLABORATIONS').doc(id);
        await collabRef.delete();
        return res.status(200).json({ success: true, message: 'Collaboration deleted successfully' });
    } catch (error) {
        console.error('Error managing collaboration:', error);
        return res.status(500).json({ error: 'Failed to manage collaboration', details: error.message });
    }
}
