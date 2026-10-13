import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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
    console.warn('⚠️ Firebase Admin initialization failed for team API:', e.message);
}

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
        return await handleGetTeam(req, res);
    }

    if (req.method === 'POST') {
        return await handleSaveTeam(req, res);
    }

    if (req.method === 'DELETE') {
        return await handleDeleteTeam(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

// Check Admin API Authorization
function checkAuth(req) {
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
        return false;
    }
    return true;
}

async function handleGetTeam(req, res) {
    try {
        if (!db) {
            return res.status(200).json({ success: true, team: [], source: 'fallback' });
        }

        const snapshot = await db.collection('TEAM_MEMBERS').get();

        if (snapshot.empty) {
            return res.status(200).json({ success: true, team: [], total: 0 });
        }

        const team = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            team.push({
                id: doc.id,
                name: data.name || '',
                position: data.position || '',
                email: data.email || '',
                phone: data.phone || '',
                prn: data.prn || '',
                department: data.department || 'Technical Team',
                personalEmail: data.personalEmail || '',
                instagramUrl: data.instagramUrl || '',
                image: data.image || '',
                joiningDate: data.joiningDate || '',
                priority: typeof data.priority === 'number' ? data.priority : 99,
                createdAt: data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt) : null
            });
        });

        // Sort by priority ascending, then by name
        team.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.name.localeCompare(b.name);
        });

        return res.status(200).json({ success: true, team, total: team.length });
    } catch (err) {
        console.error('Error fetching team members:', err);
        return res.status(500).json({ error: err.message || 'Failed to fetch team members' });
    }
}

async function handleSaveTeam(req, res) {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!db) {
        return res.status(500).json({ error: 'Database connection not initialized' });
    }

    const { action } = req.query;
    const body = req.body || {};

    try {
        if (action === 'seed' && Array.isArray(body.team)) {
            // If overwrite parameter is passed, clear existing entries first
            if (req.query.overwrite === 'true') {
                const existingSnapshot = await db.collection('TEAM_MEMBERS').get();
                const deleteBatch = db.batch();
                existingSnapshot.forEach((doc) => {
                    deleteBatch.delete(doc.ref);
                });
                await deleteBatch.commit();
            }

            const batch = db.batch();
            body.team.forEach((member) => {
                const docRef = db.collection('TEAM_MEMBERS').doc();
                batch.set(docRef, {
                    name: member.name || '',
                    position: member.position || '',
                    email: member.email || '',
                    phone: member.phone || '',
                    prn: member.prn || '',
                    department: member.department || 'Technical Team',
                    personalEmail: member.personalEmail || '',
                    instagramUrl: member.instagramUrl || '',
                    image: member.image || '',
                    joiningDate: member.joiningDate || '',
                    priority: typeof member.priority === 'number' ? member.priority : 99,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
            });
            await batch.commit();
            return res.status(200).json({ success: true, message: `Seeded ${body.team.length} team members successfully` });
        }

        if (action === 'reorder' && Array.isArray(body.team)) {
            if (db) {
                const batch = db.batch();
                body.team.forEach((member) => {
                    if (member.id) {
                        const docRef = db.collection('TEAM_MEMBERS').doc(member.id);
                        batch.update(docRef, {
                            priority: member.priority,
                            updatedAt: Timestamp.now()
                        });
                    }
                });
                await batch.commit();
            }
            return res.status(200).json({ success: true, message: 'Team priority reordered successfully' });
        }

        // Add or Update single member
        const { id, name, position, email, phone, prn, department, personalEmail, instagramUrl, image, joiningDate, priority } = body;

        if (!name || !position || !department) {
            return res.status(400).json({ error: 'Student Name, Position, and Department are required fields.' });
        }

        const memberData = {
            name: name.trim(),
            position: position.trim(),
            email: (email || '').trim(),
            phone: (phone || '').trim(),
            prn: (prn || '').trim(),
            department: (department || '').trim(),
            personalEmail: (personalEmail || '').trim(),
            instagramUrl: (instagramUrl || '').trim(),
            image: (image || '').trim(),
            joiningDate: (joiningDate || '').trim(),
            priority: typeof priority === 'number' ? priority : parseInt(priority) || 99,
            updatedAt: Timestamp.now()
        };

        if (id) {
            // Update existing member
            await db.collection('TEAM_MEMBERS').doc(id).set(memberData, { merge: true });
            return res.status(200).json({ success: true, id, message: 'Team member updated successfully!' });
        } else {
            // Create new member
            memberData.createdAt = Timestamp.now();
            const docRef = await db.collection('TEAM_MEMBERS').add(memberData);
            return res.status(200).json({ success: true, id: docRef.id, message: 'Team member added successfully!' });
        }
    } catch (err) {
        console.error('Error saving team member:', err);
        return res.status(500).json({ error: err.message || 'Failed to save team member' });
    }
}

async function handleDeleteTeam(req, res) {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!db) {
        return res.status(500).json({ error: 'Database connection not initialized' });
    }

    try {
        const { id } = req.body || {};
        if (!id) {
            return res.status(400).json({ error: 'Member ID is required for deletion' });
        }

        await db.collection('TEAM_MEMBERS').doc(id).delete();
        return res.status(200).json({ success: true, message: 'Team member deleted successfully' });
    } catch (err) {
        console.error('Error deleting team member:', err);
        return res.status(500).json({ error: err.message || 'Failed to delete team member' });
    }
}
