import { adminAuthHeaders } from './adminAuth';

// Downloads a file from an authenticated API route. A plain link can't carry the
// Authorization header, so fetch it and hand the blob to the browser.
export async function downloadAuthenticatedFile(url, fallbackName = 'download.csv') {
    const res = await fetch(url, { headers: adminAuthHeaders() });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Download failed');
    }
    const blob = await res.blob();
    const fileName = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || fallbackName;
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
}
