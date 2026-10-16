// Shared by the QR landing page (/checkin, opened by the phone's camera app) and
// the in-app scanner (/checkin/scan): both end up posting the same eventId +
// token pair as the signed-in member, and the server decides if it's valid.

// The room QR encodes a URL like https://<site>/checkin?eventId=…&token=…
// Returns null for anything else, so scanning an unrelated QR is a gentle
// "that's not an attendance code" instead of a failed request.
export function parseCheckinQr(raw) {
    try {
        const url = new URL(raw);
        if (!url.pathname.replace(/\/+$/, '').endsWith('/checkin')) return null;
        const eventId = url.searchParams.get('eventId');
        const token = url.searchParams.get('token');
        return eventId && token ? { eventId, token } : null;
    } catch {
        return null;
    }
}

// Resolves to { alreadyCheckedIn, eventTitle, room }; throws with the server's
// message (window closed, wrong code, …) on failure.
export async function submitCheckin(currentUser, { eventId, token }) {
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/event?action=scan-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ eventId, token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Check-in failed');
    return data;
}
