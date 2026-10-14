// Shared certificate canvas rendering — extracted from the original inline logic
// in GetCertificate.jsx so the same renderer can be reused by Profile.jsx for
// auto-issued certificates (where field values come from a member profile
// instead of a looked-up event attendee record).
export async function renderCertificateToCanvas(canvas, config, fieldValues) {
    if (!canvas || !config) throw new Error('Canvas and config are required');
    const ctx = canvas.getContext('2d');

    if (config.customFonts && config.customFonts.length > 0) {
        await Promise.all(config.customFonts.map(async (font) => {
            try {
                const fontFace = new FontFace(font.name, `url(${font.url})`);
                const loadedFont = await fontFace.load();
                document.fonts.add(loadedFont);
            } catch (err) {
                console.warn(`Failed to load font ${font.name}:`, err);
            }
        }));
    }

    const loadedImageFields = [];
    if (config.imageFields && config.imageFields.length > 0) {
        const results = await Promise.all(config.imageFields.map((field) => {
            if (!field.url) return Promise.resolve(null);
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve({ ...field, imgElement: img });
                img.onerror = () => resolve(null);
                img.src = field.url;
            });
        }));
        loadedImageFields.push(...results.filter((r) => r !== null));
    }

    await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => reject(new Error('Image load timed out')), 10000);

        img.onload = () => {
            clearTimeout(timer);
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            for (const field of loadedImageFields) {
                ctx.drawImage(field.imgElement, field.x || 0, field.y || 0, field.width || 100, field.height || 100);
            }

            if (config.textFields) {
                for (const field of config.textFields) {
                    const value = fieldValues[field.sourceField] || '';
                    if (!value) continue;
                    ctx.save();
                    ctx.font = `${field.fontWeight || 'normal'} ${field.fontSize || 36}px "${field.fontFamily || 'Arial'}"`;
                    ctx.fillStyle = field.fontColor || '#000000';
                    ctx.textAlign = field.textAlign || 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(value, field.x || 0, field.y || 0);
                    ctx.restore();
                }
            }
            resolve();
        };

        img.onerror = () => {
            clearTimeout(timer);
            reject(new Error('Failed to load certificate template image'));
        };

        img.src = config.templateUrl;
    });
}

export function downloadCanvasAsPng(canvas, filename) {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

// Maps a members/{uid} profile doc onto the attendee-shaped field values the
// renderer expects (ATTENDEE_FIELDS in CertificateManager.jsx: name, email,
// team, teamName, college, phone, role). team/teamName/role have no member-
// account equivalent and render blank, same as any missing attendee field.
export function memberToFieldValues(memberProfile) {
    return {
        name: memberProfile?.name || '',
        email: memberProfile?.email || '',
        college: memberProfile?.branch || memberProfile?.college || '',
        phone: memberProfile?.phone || '',
        team: '',
        teamName: '',
        role: '',
    };
}

// Field values for the default Certificate of Appreciation (not event-based):
// name, days (tenure length), startDate, endDate.
export function appreciationFieldValues(memberProfile) {
    const startRaw = memberProfile?.ecellJoinDate || memberProfile?.joinedAt;
    const startDate = startRaw?.toDate ? startRaw.toDate() : new Date(startRaw);
    const endDate = memberProfile?.leftAt ? new Date(memberProfile.leftAt) : new Date();
    const fmt = (d) => (isNaN(d?.getTime?.()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));

    return {
        name: memberProfile?.name || '',
        days: String(memberProfile?.membershipDurationDays ?? ''),
        startDate: fmt(startDate),
        endDate: fmt(endDate),
    };
}
