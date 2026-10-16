// Turns the first pages of a PDF into JPEG images in the browser. Sending
// pictures instead of the PDF itself means the AI reads exactly what a person
// sees (scanned letters, stamps and tables included) and avoids OpenRouter's
// file-input surcharge/minimum balance, which applies to PDFs but not images.
// pdf.js is large, so it's only loaded when a PDF is actually chosen.
const MAX_PAGES = 3;
const TARGET_WIDTH = 1400;

export async function pdfToImages(file) {
    const [pdfjs, workerModule] = await Promise.all([
        import('pdfjs-dist/build/pdf.mjs'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    const doc = await task.promise;
    const images = [];
    const pageCount = Math.min(doc.numPages, MAX_PAGES);

    for (let n = 1; n <= pageCount; n++) {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        // JPEG has no transparency; PDFs without a page background would render black.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
        images.push({ mimeType: 'image/jpeg', base64: canvas.toDataURL('image/jpeg', 0.82).split(',')[1] });
    }

    await task.destroy();
    return images;
}
