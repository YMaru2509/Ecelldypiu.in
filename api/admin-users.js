import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

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

const DEFAULT_PERMISSIONS = [
    'blogs', 'events', 'subscribers', 'certificates',
    'passes', 'collaborations', 'mass-mail', 'registrations',
    'team', 'users', 'links', 'settings'
];

function isApiKeyValid(token) {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || !token) return false;
    const cleanToken = token.trim().replace(/^["'`]|["'`]$/g, '');
    const cleanAdminKey = adminKey.trim().replace(/^["'`]|["'`]$/g, '');
    if (cleanToken === cleanAdminKey) return true;
    const validKeys = cleanAdminKey.split(',').map(k => k.trim().replace(/^["'`]|["'`]$/g, ''));
    return validKeys.includes(cleanToken);
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action } = req.query;

    if (action === 'login' && req.method === 'POST') {
        return await handleLogin(req, res);
    }

    if (action === 'logout' && req.method === 'POST') {
        return await handleLogout(req, res);
    }

    if (action === 'me' && req.method === 'GET') {
        return await handleMe(req, res);
    }

    // Auth verification for management endpoints
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();

    if (!isApiKeyValid(token) && !token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        return await handleListAdminUsers(req, res);
    }

    if (req.method === 'POST') {
        return await handleCreateAdminUser(req, res);
    }

    if (req.method === 'PUT') {
        return await handleUpdateAdminUser(req, res);
    }

    if (req.method === 'DELETE') {
        return await handleDeleteAdminUser(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function handleLogin(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const cleanPassword = password.trim();

        // 1. Check if password matches ADMIN_API_KEY (bootstrap / super admin fallback)
        if (isApiKeyValid(cleanPassword)) {
            // Check if user document exists in ADMIN_USERS
            const userSnap = await db.collection('ADMIN_USERS').where('email', '==', normalizedEmail).get();
            let userData;
            if (!userSnap.empty) {
                userData = { id: userSnap.docs[0].id, ...userSnap.docs[0].data() };
            } else {
                // Upsert new super admin
                const docRef = db.collection('ADMIN_USERS').doc();
                userData = {
                    id: docRef.id,
                    email: normalizedEmail,
                    displayName: normalizedEmail.split('@')[0],
                    role: 'super_admin',
                    permissions: DEFAULT_PERMISSIONS,
                    createdAt: new Date().toISOString()
                };
                await docRef.set(userData);
            }

            return res.status(200).json({
                success: true,
                token: cleanPassword,
                user: userData
            });
        }

        // 2. Check ADMIN_USERS collection in Firestore
        const userSnap = await db.collection('ADMIN_USERS').where('email', '==', normalizedEmail).get();
        if (userSnap.empty) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const doc = userSnap.docs[0];
        const userData = { id: doc.id, ...doc.data() };

        // If password stored in Firestore or password matches ADMIN_API_KEY
        if (userData.password && userData.password !== cleanPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = process.env.ADMIN_API_KEY?.split(',')[0] || cleanPassword;

        return res.status(200).json({
            success: true,
            token,
            user: userData
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ error: 'Failed to authenticate', details: error.message });
    }
}

async function handleLogout(req, res) {
    return res.status(200).json({ success: true, message: 'Logged out' });
}

async function handleMe(req, res) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!isApiKeyValid(token)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.status(200).json({
        success: true,
        user: {
            email: 'admin@ecelldypiu.in',
            displayName: 'Super Admin',
            role: 'super_admin',
            permissions: DEFAULT_PERMISSIONS
        }
    });
}

async function handleListAdminUsers(req, res) {
    try {
        const snap = await db.collection('ADMIN_USERS').get();
        const users = [];
        snap.forEach(doc => {
            const data = doc.data();
            delete data.password; // Do not return raw password
            users.push({ id: doc.id, ...data });
        });
        return res.status(200).json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to list admin users', details: error.message });
    }
}

async function handleCreateAdminUser(req, res) {
    try {
        const { email, password, displayName, name, role, permissions } = req.body || {};
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existingSnap = await db.collection('ADMIN_USERS').where('email', '==', normalizedEmail).get();
        if (!existingSnap.empty) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const docRef = db.collection('ADMIN_USERS').doc();
        const newUser = {
            email: normalizedEmail,
            displayName: displayName || name || normalizedEmail.split('@')[0],
            role: role || 'admin',
            permissions: role === 'super_admin' ? DEFAULT_PERMISSIONS : (permissions || []),
            createdAt: new Date().toISOString()
        };
        if (password) {
            newUser.password = password;
        }
        await docRef.set(newUser);
        delete newUser.password;
        return res.status(200).json({ success: true, user: { id: docRef.id, ...newUser } });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create admin user', details: error.message });
    }
}

async function handleUpdateAdminUser(req, res) {
    try {
        const { id, displayName, name, role, permissions, password } = req.body || {};
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const docRef = db.collection('ADMIN_USERS').doc(id);
        const updateData = { updatedAt: new Date().toISOString() };
        if (displayName || name) updateData.displayName = (displayName || name).trim();
        if (role) updateData.role = role;
        if (permissions) updateData.permissions = role === 'super_admin' ? DEFAULT_PERMISSIONS : permissions;
        if (password) updateData.password = password;

        await docRef.update(updateData);
        delete updateData.password;
        return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update admin user', details: error.message });
    }
}

async function handleDeleteAdminUser(req, res) {
    try {
        const { id } = req.body || req.query || {};
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        await db.collection('ADMIN_USERS').doc(id).delete();
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete admin user', details: error.message });
    }
}
