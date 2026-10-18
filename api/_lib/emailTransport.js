// Unified email sender supporting multiple providers/"mail bridges":
//   - 'bridge1' / 'bridge2': external mail bridge webhooks (MAIL_BRIDGE_1 / MAIL_BRIDGE_2)
//   - 'zeptomail': ZeptoMail HTTP API
// Mirrors the provider logic already used by api/certificate.js so every mailer in the
// admin panel can pick the same set of mail bridges. Attachments are optional and use a
// permissive shape: { filename, content (base64), contentType }. cc/bcc are optional
// arrays of { name, email }.
// Shared by api/mailer.js and api/collaboration.js.
export async function sendEmail(to, subject, htmlContent, provider = 'zeptomail', attachments = [], cc = [], bcc = []) {
    if (provider === 'bridge1' || provider === 'bridge2') {
        const url = provider === 'bridge1' ? process.env.MAIL_BRIDGE_1 : process.env.MAIL_BRIDGE_2;
        if (!url) {
            throw new Error(`Environment variable ${provider === 'bridge1' ? 'MAIL_BRIDGE_1' : 'MAIL_BRIDGE_2'} is not set.`);
        }

        const defaultName = provider === 'bridge1' ? 'CIIE DYPIU' : 'E-Cell DYPIU';
        const defaultEmail = provider === 'bridge1' ? 'ciie@dypiu.in' : 'noreply@ecelldypiu.in';

        const envNameKey = provider === 'bridge1' ? 'MAIL_BRIDGE_1_NAME' : 'MAIL_BRIDGE_2_NAME';
        const envEmailKey = provider === 'bridge1' ? 'MAIL_BRIDGE_1_EMAIL' : 'MAIL_BRIDGE_2_EMAIL';

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to,
                cc: (cc || []).map(c => c.email),
                bcc: (bcc || []).map(b => b.email),
                subject,
                htmlContent,
                fromName: process.env[envNameKey] || defaultName,
                fromEmail: process.env[envEmailKey] || defaultEmail,
                attachments
            })
        });

        const responseText = await res.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error(`Mail Bridge returned invalid response: ${responseText}`);
        }

        if (!data.success) {
            throw new Error(`Mail Bridge error: ${data.error || 'Unknown error'}`);
        }
        return data;
    }

    if (provider === 'zeptomail') {
        if (!process.env.ZEPTOMAIL_API_KEY) {
            throw new Error('ZEPTOMAIL_API_KEY is not set');
        }
        const url = process.env.ZEPTOMAIL_URL || 'https://api.zeptomail.in/v1.1/email';
        let authHeader = process.env.ZEPTOMAIL_API_KEY;
        if (!authHeader.toLowerCase().startsWith('zoho-enczapikey')) {
            authHeader = `Zoho-enczapikey ${authHeader}`;
        }

        const fromAddress = process.env.ZEPTOMAIL_FROM_ADDRESS || 'ecell@dypiu.ac.in';
        const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'E-Cell DYPIU';

        let toName = '';
        let toAddress = to;
        const toMatch = to.match(/^(.*?)\s*<(.*?)>$/);
        if (toMatch) {
            toName = toMatch[1].trim();
            toAddress = toMatch[2].trim();
        }

        // Attachments with a `cid` are inline images (referenced as cid:<id> in the HTML).
        const toZeptoFile = (att) => ({
            content: att.content || att.base64 || att.data,
            mime_type: att.contentType || att.mimeType || att.type || 'application/octet-stream',
            name: att.filename || att.name || 'attachment'
        });
        const formattedAttachments = (attachments || []).filter(att => !att.cid).map(toZeptoFile);
        const inlineImages = (attachments || []).filter(att => att.cid).map(att => ({ ...toZeptoFile(att), cid: att.cid }));

        const toEmailAddress = (person) => ({
            email_address: {
                address: person.email,
                name: person.name || person.email.split('@')[0]
            }
        });

        const payload = {
            from: { address: fromAddress, name: fromName },
            to: [
                {
                    email_address: {
                        address: toAddress,
                        name: toName || toAddress.split('@')[0]
                    }
                }
            ],
            subject,
            htmlbody: htmlContent
        };

        if ((cc || []).length > 0) {
            payload.cc = cc.map(toEmailAddress);
        }
        if ((bcc || []).length > 0) {
            payload.bcc = bcc.map(toEmailAddress);
        }
        if (formattedAttachments.length > 0) {
            payload.attachments = formattedAttachments;
        }
        if (inlineImages.length > 0) {
            payload.inline_images = inlineImages;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ZeptoMail send failed: ${error}`);
        }

        return response.json();
    }

    throw new Error(`Unsupported mail provider: ${provider}`);
}
