// One-time local script: creates (or promotes) the initial system_owner accounts.
// Run manually with `node scripts/bootstrap-system-owners.mjs` — this is NOT a
// deployed /api endpoint, since granting full-access roles must never be reachable
// over the network.
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

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

const auth = getAuth();
const db = getFirestore();
const RESET_PASSWORDS = process.argv.includes('--reset-passwords');

const SYSTEM_OWNERS = [
    { email: 'yashkr.tripathi@gmail.com', name: 'Yash Tripathi' },
    { email: 'rigved.aherrao.26@gmail.com', name: 'Rigved Aherrao' },
];

// Firebase Auth requires >=6 characters; "1234" (requested) doesn't qualify.
// Generate a random compliant temporary password per account instead.
function generateTempPassword() {
    return `Ecell${crypto.randomBytes(4).toString('hex')}!`;
}

async function ensureAuthUser(email, displayName) {
    try {
        const existing = await auth.getUserByEmail(email);
        if (RESET_PASSWORDS) {
            const tempPassword = generateTempPassword();
            await auth.updateUser(existing.uid, { password: tempPassword });
            console.log(`  Reset the Firebase password for ${email} (uid: ${existing.uid}).`);
            return { uid: existing.uid, tempPassword, created: false, reset: true };
        }
        console.log(`  Auth account already exists for ${email} (uid: ${existing.uid}) — leaving password unchanged.`);
        return { uid: existing.uid, tempPassword: null, created: false, reset: false };
    } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err;
        const tempPassword = generateTempPassword();
        const created = await auth.createUser({
            email,
            password: tempPassword,
            displayName,
            emailVerified: true,
        });
        return { uid: created.uid, tempPassword, created: true, reset: false };
    }
}

async function ensureMemberDoc(uid, email, name) {
    const ref = db.collection('members').doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
        await ref.set({
            uid,
            name,
            email,
            phone: '',
            college: 'DYPIU',
            branch: 'CSE',
            year: '1st',
            bio: '',
            avatarUrl: '',
            joinedAt: FieldValue.serverTimestamp(),
            profileComplete: true,
            eventsAttended: [],
            certificatesEarned: [],
            roles: ['system_owner'],
            permissions: {},
            verticals: [],
            lastUpdated: FieldValue.serverTimestamp(),
        });
        console.log(`  Created members/${uid} with roles: ['system_owner'].`);
        return;
    }

    const data = snap.data();
    const roles = Array.isArray(data.roles) ? data.roles : [];
    if (!roles.includes('system_owner')) {
        await ref.update({
            roles: [...roles, 'system_owner'],
            lastUpdated: FieldValue.serverTimestamp(),
        });
        console.log(`  Promoted existing members/${uid} to include 'system_owner'.`);
    } else {
        console.log(`  members/${uid} already has 'system_owner'.`);
    }
}

async function main() {
    console.log('Bootstrapping system_owner accounts...\n');
    const credentials = [];

    for (const { email, name } of SYSTEM_OWNERS) {
        console.log(`Processing ${email}:`);
        const { uid, tempPassword, created, reset } = await ensureAuthUser(email, name);
        await ensureMemberDoc(uid, email, name);
        if (created || reset) credentials.push({ email, tempPassword });
        console.log('');
    }

    if (credentials.length > 0) {
        console.log(RESET_PASSWORDS
            ? '\nTemporary passwords (use them once, then change them from the account settings):'
            : '\nNew account temporary passwords (change these via "Forgot password" on first login):');
        for (const { email, tempPassword } of credentials) {
            console.log(`  ${email} -> ${tempPassword}`);
        }
    } else {
        console.log('No new accounts were created (all emails already existed) — existing passwords were left untouched.');
    }

    console.log('\nDone.');
    process.exit(0);
}

main().catch((err) => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
