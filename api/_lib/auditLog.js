// Append-only audit trail for privileged actions across every panel module.
// Best-effort: an audit log failure must never block the action it's recording,
// mirroring the best-effort email pattern already used in api/collaboration.js.
import { db } from './firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

export async function writeAuditLog({ actorUid, actorRole, action, targetType, targetId, metadata = {} }) {
    try {
        await db.collection('audit_logs').add({
            actorUid,
            actorRole: actorRole || null,
            action,
            targetType,
            targetId: targetId || null,
            metadata,
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
        console.error(`Failed to write audit log for action "${action}":`, err.message);
    }
}
