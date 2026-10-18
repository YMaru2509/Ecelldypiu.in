/* global process */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { callerCan } from './_lib/rbac.js';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

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

// Helper to auto-generate a 6-character alphanumeric slug
const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Helper to validate URL format
const isValidUrl = (urlStr) => {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const trimmed = urlStr.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
    try {
        new URL(trimmed);
        return true;
    } catch {
        return false;
    }
};

// Helper to validate destination name (2-60 chars)
const isValidDestinationName = (nameStr) => {
    if (!nameStr || typeof nameStr !== 'string') return false;
    const trimmed = nameStr.trim();
    return trimmed.length >= 2 && trimmed.length <= 60;
};

// Device detection helper
function detectDevice(ua = '') {
    const userAgent = (ua || '').toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'Tablet';
    if (/mobile|android|i(phone|pod)|iemobile|blackberry/i.test(userAgent)) return 'Mobile';
    return 'Desktop';
}

// Browser detection helper
function detectBrowser(ua = '') {
    const userAgent = (ua || '').toLowerCase();
    if (userAgent.includes('edg/') || userAgent.includes('edge/')) return 'Edge';
    if (userAgent.includes('chrome') || userAgent.includes('crios')) return 'Chrome';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('firefox') || userAgent.includes('fxios')) return 'Firefox';
    if (userAgent.includes('opera') || userAgent.includes('opr/')) return 'Opera';
    return 'Other';
}

// Referrer category helper
function detectReferrer(ref = '') {
    if (!ref || ref.trim() === '') return 'Direct';
    const lowerRef = ref.toLowerCase();
    if (lowerRef.includes('instagram')) return 'Instagram';
    if (lowerRef.includes('whatsapp') || lowerRef.includes('wa.me')) return 'WhatsApp';
    if (lowerRef.includes('linkedin')) return 'LinkedIn';
    if (lowerRef.includes('twitter') || lowerRef.includes('t.co') || lowerRef.includes('x.com')) return 'Twitter / X';
    if (lowerRef.includes('facebook') || lowerRef.includes('fb.com')) return 'Facebook';
    if (lowerRef.includes('google')) return 'Google';
    if (lowerRef.includes('youtube')) return 'YouTube';
    try {
        const url = new URL(ref);
        return url.hostname.replace(/^www\./, '');
    } catch {
        return 'Other';
    }
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Determine payload/action regardless of GET/POST
    const body = req.body || {};
    const query = req.query || {};
    const action = body.action || query.action || (req.method === 'GET' ? 'redirect' : null);
    const slugParam = body.slug || query.slug;

    // Public actions: redirect or track_event
    if (action === 'redirect') {
        return await handleRedirect(req, res, slugParam);
    }
    if (action === 'track_event') {
        return await handleTrackEvent(req, res);
    }

    // All other actions need the shared admin key or a staff member with links
    // access: listing needs view, anything that changes a link needs manage.
    const level = action === 'list' ? 'view' : 'manage';
    if (!(await callerCan(req, 'links', level))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        switch (action) {
            case 'create':
                return await handleCreate(req, res);
            case 'list':
                return await handleList(req, res);
            case 'delete':
                return await handleDelete(req, res);
            case 'update':
                return await handleUpdate(req, res);
            default:
                return res.status(400).json({ error: 'Invalid action specified' });
        }
    } catch (error) {
        console.error('Shortlink API error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

// ACTION: redirect (PUBLIC)
async function handleRedirect(req, res, slugFromQuery) {
    try {
        const slug = slugFromQuery || req.body?.slug;
        if (!slug) {
            return res.status(404).json({ error: 'Slug is required' });
        }

        const cleanSlug = slug.trim().toLowerCase();
        const docRef = db.collection('shortlinks').doc(cleanSlug);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Shortlink not found' });
        }

        const data = docSnap.data();
        if (data.isActive === false) {
            return res.status(404).json({ error: 'Shortlink is inactive' });
        }

        const clientUa = req.body?.clientUa || req.headers['user-agent'] || '';
        const clientRef = req.body?.clientRef || req.headers['referer'] || req.headers['referrer'] || '';

        const device = detectDevice(clientUa);
        const browser = detectBrowser(clientUa);
        const referrer = detectReferrer(clientRef);
        const todayStr = new Date().toISOString().split('T')[0];

        // Count the link open here. Completion is recorded separately by the
        // redirect page's beacon, so a successful redirect is never counted twice.
        await docRef.update({
            clicks: FieldValue.increment(1),
            totalOpens: FieldValue.increment(1),
            lastClickedAt: Timestamp.now(),
            [`devices.${device}`]: FieldValue.increment(1),
            [`browsers.${browser}`]: FieldValue.increment(1),
            [`referrers.${referrer}`]: FieldValue.increment(1),
            [`dailyClicks.${todayStr}`]: FieldValue.increment(1)
        });

        // Return ONLY success, originalUrl, and destinationName
        const destName = data.destinationName && data.destinationName.trim()
            ? data.destinationName.trim()
            : 'your destination';

        return res.status(200).json({
            success: true,
            originalUrl: data.originalUrl,
            destinationName: destName
        });
    } catch (error) {
        console.error('Redirect handler error:', error);
        return res.status(500).json({ error: 'Failed to process redirect', details: error.message });
    }
}

// ACTION: track_event (PUBLIC)
async function handleTrackEvent(req, res) {
    try {
        const { slug, event, clientUa, clientRef } = req.body || {};
        if (!slug || !event) {
            return res.status(400).json({ error: 'Slug and event are required' });
        }

        const cleanSlug = slug.trim().toLowerCase();
        const docRef = db.collection('shortlinks').doc(cleanSlug);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Shortlink not found' });
        }

        const updatePayload = {};
        if (event === 'went_back') {
            updatePayload.wentBack = FieldValue.increment(1);
        } else if (event === 'redirect_completed') {
            updatePayload.redirectCompleted = FieldValue.increment(1);
        }

        const device = detectDevice(clientUa || req.headers['user-agent'] || '');
        const browser = detectBrowser(clientUa || req.headers['user-agent'] || '');
        const referrer = detectReferrer(clientRef || req.headers['referer'] || req.headers['referrer'] || '');

        const logEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            event: event === 'went_back' ? 'went_back' : 'redirect_completed',
            device,
            browser,
            referrer
        };

        const existingLogs = docSnap.data().recentLogs || [];
        const updatedLogs = [logEntry, ...existingLogs].slice(0, 50);
        updatePayload.recentLogs = updatedLogs;

        await docRef.update(updatePayload);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Track event error:', error);
        return res.status(500).json({ error: 'Failed to track event' });
    }
}

// ACTION: create (PROTECTED)
async function handleCreate(req, res) {
    const { originalUrl, destinationName, slug, aliases } = req.body || {};

    if (!isValidUrl(originalUrl)) {
        return res.status(400).json({ error: 'Invalid URL. Please enter a valid URL starting with http:// or https://' });
    }

    if (!isValidDestinationName(destinationName)) {
        return res.status(400).json({ error: 'Destination name is required and must be between 2 and 60 characters.' });
    }

    const trimmedUrl = originalUrl.trim();
    const trimmedDestName = destinationName.trim();
    let requestedSlugs = [];

    if (slug && slug.trim()) {
        const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!cleanSlug) {
            return res.status(400).json({ error: 'Custom slug contains invalid characters' });
        }

        requestedSlugs.push(cleanSlug);
    }

    if (Array.isArray(aliases)) {
        for (const alias of aliases) {
            if (typeof alias !== 'string' || !alias.trim()) continue;
            const cleanAlias = alias.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
            if (!cleanAlias) {
                return res.status(400).json({ error: 'Each alias must contain letters, numbers, hyphens, or underscores.' });
            }
            requestedSlugs.push(cleanAlias);
        }
    }

    requestedSlugs = [...new Set(requestedSlugs)];
    if (requestedSlugs.length > 20) {
        return res.status(400).json({ error: 'You can create at most 20 aliases at once.' });
    }

    if (requestedSlugs.length === 0) {
        // Auto-generate 6-char alphanumeric slug, retry up to 5 times on collision
        let attempts = 0;
        let generated = '';
        let uniqueFound = false;

        while (attempts < 5 && !uniqueFound) {
            generated = generateSlug();
            const checkSnap = await db.collection('shortlinks').doc(generated).get();
            if (!checkSnap.exists) {
                uniqueFound = true;
            }
            attempts++;
        }

        if (!uniqueFound) {
            return res.status(409).json({ error: 'Failed to generate a unique short slug after multiple attempts. Please try again.' });
        }

        requestedSlugs.push(generated);
    }

    const existingSlugs = await Promise.all(requestedSlugs.map((candidate) =>
        db.collection('shortlinks').doc(candidate).get()
    ));
    if (existingSlugs.some((snapshot) => snapshot.exists)) {
        return res.status(409).json({ error: 'One or more aliases already exist. Please choose different aliases.' });
    }

    const finalSlug = requestedSlugs[0];
    const isCustomSlug = Boolean(slug && slug.trim());

    const now = Timestamp.now();
    const aliasGroup = finalSlug;
    const baseDocData = {
        originalUrl: trimmedUrl,
        destinationName: trimmedDestName,
        aliasGroup,
        aliases: requestedSlugs,
        createdAt: now,
        createdBy: 'admin',
        clicks: 0,
        totalOpens: 0,
        redirectCompleted: 0,
        wentBack: 0,
        devices: {},
        browsers: {},
        referrers: {},
        dailyClicks: {},
        recentLogs: [],
        lastClickedAt: null,
        isActive: true,
        customSlug: isCustomSlug
    };

    await Promise.all(requestedSlugs.map((alias) =>
        db.collection('shortlinks').doc(alias).set({ ...baseDocData, slug: alias })
    ));

    const createdAtIso = now.toDate().toISOString();

    return res.status(200).json({
        success: true,
        slug: finalSlug,
        shortUrl: `https://ecell.dypiu.ac.in/s/${finalSlug}`,
        originalUrl: trimmedUrl,
        destinationName: trimmedDestName,
        aliases: requestedSlugs,
        links: requestedSlugs.map((alias) => ({ slug: alias, shortUrl: `https://ecell.dypiu.ac.in/s/${alias}` })),
        clicks: 0,
        totalOpens: 0,
        redirectCompleted: 0,
        wentBack: 0,
        createdAt: createdAtIso,
        isActive: true
    });
}

// ACTION: list (PROTECTED)
async function handleList(req, res) {
    const snapshot = await db.collection('shortlinks').orderBy('createdAt', 'desc').get();

    const links = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        const asText = (value, fallback = '') => {
            if (typeof value === 'string' || typeof value === 'number') return String(value);
            if (value && typeof value === 'object') {
                if (typeof value.value === 'string') return value.value;
                if (typeof value.in === 'string') return value.in;
            }
            return fallback;
        };
        const safeSlug = asText(data.slug, doc.id).trim().toLowerCase();
        const safeAliases = Array.isArray(data.aliases)
            ? data.aliases.map((alias) => asText(alias)).map((alias) => alias.trim().toLowerCase()).filter(Boolean)
            : [];
        links.push({
            id: doc.id,
            slug: safeSlug,
            originalUrl: asText(data.originalUrl),
            destinationName: asText(data.destinationName, 'your destination'),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
            createdBy: data.createdBy || 'admin',
            clicks: data.clicks || 0,
            totalOpens: data.totalOpens || data.clicks || 0,
            redirectCompleted: data.redirectCompleted || 0,
            wentBack: data.wentBack || 0,
            devices: data.devices || {},
            browsers: data.browsers || {},
            referrers: data.referrers || {},
            dailyClicks: data.dailyClicks || {},
            recentLogs: data.recentLogs || [],
            lastClickedAt: data.lastClickedAt?.toDate ? data.lastClickedAt.toDate().toISOString() : (data.lastClickedAt || null),
            isActive: data.isActive !== undefined ? data.isActive : true,
            customSlug: data.customSlug || false,
            aliasGroup: asText(data.aliasGroup, safeSlug),
            aliases: safeAliases.length > 0 ? safeAliases : [safeSlug]
        });
    });

    return res.status(200).json({
        success: true,
        links,
        total: links.length
    });
}

// ACTION: delete (PROTECTED) - Hard delete document
async function handleDelete(req, res) {
    const { slug } = req.body || {};

    if (!slug) {
        return res.status(400).json({ error: 'Slug is required for deletion' });
    }

    const cleanSlug = slug.trim().toLowerCase();
    const docRef = db.collection('shortlinks').doc(cleanSlug);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        return res.status(404).json({ error: 'Shortlink not found' });
    }

    await docRef.delete();

    return res.status(200).json({
        success: true,
        message: 'Shortlink deleted successfully'
    });
}

// ACTION: update (PROTECTED)
async function handleUpdate(req, res) {
    const { slug, originalUrl, destinationName, newSlug, isActive } = req.body || {};

    if (!slug) {
        return res.status(400).json({ error: 'Slug is required for update' });
    }

    const cleanSlug = slug.trim().toLowerCase();
    const oldDocRef = db.collection('shortlinks').doc(cleanSlug);
    const oldSnap = await oldDocRef.get();

    if (!oldSnap.exists) {
        return res.status(404).json({ error: 'Shortlink not found' });
    }

    const oldData = oldSnap.data();

    // Check if originalUrl update is requested
    let updatedUrl = oldData.originalUrl;
    if (originalUrl !== undefined) {
        if (!isValidUrl(originalUrl)) {
            return res.status(400).json({ error: 'Invalid URL provided' });
        }
        updatedUrl = originalUrl.trim();
    }

    // Check if destinationName update is requested
    let updatedDestName = oldData.destinationName || 'your destination';
    if (destinationName !== undefined) {
        if (!isValidDestinationName(destinationName)) {
            return res.status(400).json({ error: 'Destination name must be between 2 and 60 characters.' });
        }
        updatedDestName = destinationName.trim();
    }

    // Check if isActive update is requested
    const updatedIsActive = isActive !== undefined ? Boolean(isActive) : oldData.isActive;

    // Check if newSlug is provided and different from current slug
    if (newSlug && newSlug.trim().toLowerCase() !== cleanSlug) {
        const cleanNewSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!cleanNewSlug) {
            return res.status(400).json({ error: 'New slug contains invalid characters' });
        }

        const newSnap = await db.collection('shortlinks').doc(cleanNewSlug).get();
        if (newSnap.exists) {
            return res.status(409).json({ error: 'New slug already exists' });
        }

        // Create new document with updated slug
        const newDocData = {
            ...oldData,
            slug: cleanNewSlug,
            originalUrl: updatedUrl,
            destinationName: updatedDestName,
            isActive: updatedIsActive,
            customSlug: true
        };

        await db.collection('shortlinks').doc(cleanNewSlug).set(newDocData);
        await oldDocRef.delete();

        return res.status(200).json({
            success: true,
            newSlug: cleanNewSlug,
            message: 'Shortlink updated with new slug'
        });
    }

    // Otherwise update in-place
    await oldDocRef.update({
        originalUrl: updatedUrl,
        destinationName: updatedDestName,
        isActive: updatedIsActive
    });

    return res.status(200).json({
        success: true,
        message: 'Shortlink updated successfully'
    });
}
