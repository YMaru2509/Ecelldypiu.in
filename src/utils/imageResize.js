// Shared by Onboarding.jsx and Profile.jsx — both let a member upload their
// own avatar, resized client-side before it's stored as a base64 data URL on
// the member doc (Firestore caps a whole document at 1MiB including every
// other field, so the budget here is conservative, not the full 1MiB).
export const MAX_PHOTO_DATA_URL_LENGTH = 700 * 1024;

export function resizeImageToDataUrl(file, maxDim = 320) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => { img.src = reader.result; };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        img.onload = () => {
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        reader.readAsDataURL(file);
    });
}

// Resizes at 320px, retries once smaller/more compressed if still too big,
// and throws instead of silently returning an oversized data URL.
export async function resizeImageWithBudget(file) {
    let dataUrl = await resizeImageToDataUrl(file, 320);
    if (dataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
        dataUrl = await resizeImageToDataUrl(file, 220);
    }
    if (dataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
        throw new Error('Photo is too large even after compression — try a different image.');
    }
    return dataUrl;
}
