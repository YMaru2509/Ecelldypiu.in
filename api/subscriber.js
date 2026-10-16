import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { callerCan } from './_lib/rbac.js';

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

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        return await handleGetSubscribers(req, res);
    }

    if (req.method === 'POST') {
        const { action } = req.query;
        if (action === 'add') {
            return await handleAddSubscriber(req, res);
        }
        return await handleSubmitNewsletter(req, res);
    }

    if (req.method === 'DELETE') {
        return await handleDeleteSubscriber(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGetSubscribers(req, res) {
    // Shared admin key, or a staff member with view access to subscribers
    if (!(await callerCan(req, 'subscribers', 'view'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const subscribersSnapshot = await db.collection('SUBSCRIPTION_REQUESTS').get();

        if (subscribersSnapshot.empty) {
            return res.status(200).json({
                success: true,
                subscribers: [],
                total: 0
            });
        }

        const subscribers = [];
        subscribersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.email) {
                subscribers.push({
                    id: doc.id,
                    name: data.name || 'Unknown',
                    email: data.email,
                    phone: data.phone || data.mobile || '',
                    college: data.college || data.institution || '',
                    subscribedAt: data.createdAt || data.timestamp || null
                });
            }
        });

        return res.status(200).json({
            success: true,
            subscribers,
            total: subscribers.length
        });

    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return res.status(500).json({
            error: 'Failed to fetch subscribers',
            details: error.message
        });
    }
}

async function handleSubmitNewsletter(req, res) {
    try {
        const { name, email, phone } = req.body;

        // Validation
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Write to Firestore
        const docRef = await db.collection('SUBSCRIPTION_REQUESTS').add({
            name,
            email,
            phone,
            submittedAt: Timestamp.now(),
        });

        return res.status(200).json({
            success: true,
            id: docRef.id,
            message: 'Subscription successful'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Failed to submit subscription',
            details: error.message
        });
    }
}

async function handleAddSubscriber(req, res) {
    // Shared admin key, or a staff member with manage access to subscribers
    if (!(await callerCan(req, 'subscribers', 'manage'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { name, email, phone, college } = req.body;

        // Validation
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if email already exists
        const existingSubscriber = await db.collection('SUBSCRIPTION_REQUESTS')
            .where('email', '==', email.toLowerCase().trim())
            .get();

        if (!existingSubscriber.empty) {
            return res.status(400).json({ error: 'Email already subscribed' });
        }

        // Add subscriber to Firestore
        const subscriberData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim() || '',
            college: college?.trim() || '',
            subscribedAt: new Date(),
            source: 'admin-portal'
        };

        const docRef = await db.collection('SUBSCRIPTION_REQUESTS').add(subscriberData);

        return res.status(200).json({
            success: true,
            message: 'Subscriber added successfully',
            subscriber: {
                id: docRef.id,
                ...subscriberData
            }
        });

    } catch (error) {
        console.error('Add subscriber error:', error);
        return res.status(500).json({
            error: 'Failed to add subscriber',
            details: error.message
        });
    }
}

async function handleDeleteSubscriber(req, res) {
    // Shared admin key, or a staff member with manage access to subscribers
    if (!(await callerCan(req, 'subscribers', 'manage'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id } = req.body;

        // Validation
        if (!id) {
            return res.status(400).json({ error: 'Subscriber ID is required' });
        }

        // Check if subscriber exists
        const subscriberRef = db.collection('SUBSCRIPTION_REQUESTS').doc(id);
        const subscriber = await subscriberRef.get();

        if (!subscriber.exists) {
            return res.status(404).json({ error: 'Subscriber not found' });
        }

        // Delete subscriber
        await subscriberRef.delete();

        return res.status(200).json({
            success: true,
            message: 'Subscriber deleted successfully',
            deletedId: id
        });

    } catch (error) {
        console.error('Delete subscriber error:', error);
        return res.status(500).json({
            error: 'Failed to delete subscriber',
            details: error.message
        });
    }
}
