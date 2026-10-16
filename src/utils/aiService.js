import { adminAuthHeaders } from './adminAuth';

export const AI_MODELS = {
    FLASH: 'fast',
    THINKING: 'thinking'
};

export const VIBES = [
    'Bold & Minimal',
    'Funky & Creative',
    'Formal & Tiered',
    'Tech & Cyberpunk',
    'Community Focused'
];

const postAI = async (action, body) => {
    const response = await fetch(`/api/event?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
        body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'AI request failed.');
    return data;
};

/**
 * Drafts event content from a theme via the server-side OpenRouter proxy.
 * The API key stays on the server — never exposed to the client.
 * @param {string} theme - The basic theme or title of the event.
 * @param {string} vibe - The visual/content vibe (e.g., Bold, Tech).
 * @param {string} model - AI_MODELS.FLASH or AI_MODELS.THINKING.
 */
export const generateEventContent = async (theme, vibe, model = AI_MODELS.THINKING) => {
    try {
        return await postAI('generate-event-content', { theme, vibe, model });
    } catch (error) {
        console.error('AI Generation Error:', error);
        throw error;
    }
};

export const MAX_APPROVAL_DOC_BYTES = 3 * 1024 * 1024;

/**
 * Sends an approval document (PDF or image) for analysis. Resolves to
 * { content, meta } — the drafted event fields plus the identified event type,
 * suggested page headings and hero style.
 */
export const parseApprovalDocument = async (file) => {
    if (file.size > MAX_APPROVAL_DOC_BYTES) {
        throw new Error('File is too large — keep approval documents under 3 MB.');
    }

    const readAsBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read that file.'));
        reader.readAsDataURL(blob);
    });

    // PDFs are rendered to page images here in the browser (see utils/pdfPages.js).
    if (file.type === 'application/pdf') {
        let images;
        try {
            const { pdfToImages } = await import('./pdfPages');
            images = await pdfToImages(file);
        } catch (err) {
            console.error('PDF render failed:', err);
            throw new Error('Could not open that PDF. Try exporting it again, or upload a photo/screenshot of the letter instead.');
        }
        if (images.length === 0) throw new Error('That PDF has no pages.');
        return postAI('parse-event-document', { images });
    }

    return postAI('parse-event-document', {
        images: [{ mimeType: file.type, base64: await readAsBase64(file) }]
    });
};
