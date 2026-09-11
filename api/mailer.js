import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendEmail } from './_lib/emailTransport.js';

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

// Generate Plain Text Email Layout (Clean, Un-templated Standard Direct Email)
function generatePlainTextEmailHTML(bodyText, recipient) {
    const text = (bodyText || '')
        .replace(/\{name\}/g, recipient?.name || 'Member')
        .replace(/\{email\}/g, recipient?.email || '')
        .replace(/\{role\}/g, recipient?.role || '');

    const safeEscaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Message</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #1e293b;">
    <div style="max-width: 620px; margin: 0 auto; white-space: pre-wrap; font-family: inherit; font-size: inherit; color: inherit; line-height: inherit;">${safeEscaped}</div>
</body>
</html>`;
}

// Generate Announcement Email Layout
function generateAnnouncementHTML(data, subscriberName) {
    const bannerHtml = data.bannerUrl 
        ? `<tr>
            <td align="center" style="padding: 0 0 25px 0;">
                <img src="${data.bannerUrl}" alt="${data.title}" width="520" style="display: block; width: 100%; max-width: 520px; border-radius: 12px; border: 1px solid #e2e8f0;" />
            </td>
           </tr>`
        : '';

    const buttonHtml = (data.buttonText && data.buttonUrl)
        ? `<tr>
            <td align="center" style="padding: 10px 0 20px 0;">
                <a href="${data.buttonUrl}" target="_blank" style="display: inline-block; background-color: #FFB22C; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 15px; font-weight: 900; text-decoration: none; padding: 14px 35px; border-radius: 8px; text-transform: uppercase; border: 2px solid #000000;" class="mobile-cta">
                    ${data.buttonText}
                </a>
            </td>
           </tr>`
        : '';

    const formattedBody = (data.body || '').replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Announcement</title>
    <style type="text/css">
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; border-radius: 0 !important; }
            .mobile-cta { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
            .mobile-content { padding: 25px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7;">
        <tr>
            <td align="center" style="padding: 35px 12px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; max-width: 600px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 26px 30px; text-align: center; border-bottom: 2px solid #eab308;">
                            <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin: 6px 0 0 0; color: #000000; font-size: 13px; font-weight: 800; opacity: 0.85; letter-spacing: 0.5px;">
                                OFFICIAL ANNOUNCEMENT 📢
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td class="mobile-content" style="padding: 35px 40px; color: #1e293b;">
                            <p style="font-size: 16px; margin: 0 0 20px 0; color: #1e293b;">
                                Hello <strong>${subscriberName || 'E-Cell Member'}</strong>,
                            </p>
                            ${bannerHtml}
                            <h2 style="color: #0f172a; font-size: 23px; font-weight: 900; margin: 0 0 14px 0; text-transform: uppercase; line-height: 1.3;">
                                ${data.title}
                            </h2>
                            ${data.subtitle ? `<p style="color: #475569; font-size: 15px; font-weight: 600; margin: 0 0 20px 0;">${data.subtitle}</p>` : ''}
                            <div style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
                                ${formattedBody}
                            </div>
                            ${buttonHtml}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">
                                © ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.
                            </p>
                            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 11px;">
                                You are receiving this because you subscribed to updates from the E-Cell DYPIU portal.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Generate Event Notification Email Layout
function generateEventHTML(data, subscriberName) {
    const bannerHtml = data.bannerUrl 
        ? `<tr>
            <td align="center" style="padding: 0 0 25px 0;">
                <img src="${data.bannerUrl}" alt="${data.title}" width="520" style="display: block; width: 100%; max-width: 520px; border-radius: 12px; border: 1px solid #e2e8f0;" />
            </td>
           </tr>`
        : '';

    const registerButtonHtml = data.registrationLink
        ? `<tr>
            <td align="center" style="padding: 10px 0 15px 0;">
                <a href="${data.registrationLink}" target="_blank" style="display: inline-block; background-color: #FFB22C; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 15px; font-weight: 900; text-decoration: none; padding: 14px 35px; border-radius: 8px; text-transform: uppercase; border: 2px solid #000000;" class="mobile-cta">
                    ${data.buttonText || 'Register Now'}
                </a>
            </td>
           </tr>`
        : '';

    const formattedDesc = (data.description || '').replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Invite: ${data.title}</title>
    <style type="text/css">
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; border-radius: 0 !important; }
            .mobile-cta { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
            .mobile-content { padding: 25px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7;">
        <tr>
            <td align="center" style="padding: 35px 12px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; max-width: 600px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 26px 30px; text-align: center; border-bottom: 2px solid #eab308;">
                            <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin: 6px 0 0 0; color: #000000; font-size: 13px; font-weight: 800; opacity: 0.85; letter-spacing: 0.5px;">
                                EVENT INVITATION 📅 🚀
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td class="mobile-content" style="padding: 35px 40px; color: #1e293b;">
                            <p style="font-size: 16px; margin: 0 0 20px 0; color: #1e293b;">
                                Hi <strong>${subscriberName || 'Innovator'}</strong>,
                            </p>
                            ${bannerHtml}
                            <h2 style="color: #0f172a; font-size: 23px; font-weight: 900; margin: 0 0 14px 0; text-transform: uppercase; line-height: 1.3;">
                                ${data.title}
                            </h2>
                            
                            <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 25px 0;">
                                ${formattedDesc}
                            </p>
                            
                            <!-- Event Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px 0; color: #b45309; font-size: 14px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Event Details</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            ${data.date ? `<tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                                                    <span style="display: block; color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Date</span>
                                                    <span style="display: block; color: #0f172a; font-size: 14px; font-weight: 600; margin-top: 3px;">${data.date}</span>
                                                </td>
                                            </tr>` : ''}
                                            ${data.time ? `<tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                                                    <span style="display: block; color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Time</span>
                                                    <span style="display: block; color: #0f172a; font-size: 14px; font-weight: 600; margin-top: 3px;">${data.time}</span>
                                                </td>
                                            </tr>` : ''}
                                            ${data.venue ? `<tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="display: block; color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Venue</span>
                                                    <span style="display: block; color: #0f172a; font-size: 14px; font-weight: 600; margin-top: 3px;">${data.venue}</span>
                                                </td>
                                            </tr>` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            ${registerButtonHtml}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">
                                © ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Generate Interview Schedule Email Layout
function generateInterviewHTML(data, candidateName) {
    const formattedNotes = (data.notes || data.body || '').replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Schedule - E-Cell DYPIU</title>
    <style type="text/css">
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; border-radius: 0 !important; }
            .mobile-cta { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
            .mobile-content { padding: 25px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7;">
        <tr>
            <td align="center" style="padding: 35px 12px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; max-width: 600px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 26px 30px; text-align: center; border-bottom: 2px solid #eab308;">
                            <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin: 6px 0 0 0; color: #000000; font-size: 13px; font-weight: 800; opacity: 0.85; letter-spacing: 0.5px;">
                                TEAM SELECTION INTERVIEW INVITATION
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td class="mobile-content" style="padding: 35px 40px; color: #1e293b;">
                            <p style="font-size: 16px; margin: 0 0 20px 0; color: #1e293b;">
                                Dear <strong>${candidateName || 'Applicant'}</strong>,
                            </p>
                            <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0 0 25px 0;">
                                Thank you for applying to join <strong>E-Cell DYPIU</strong>! Based on your application review, we are pleased to invite you for an interview round.
                            </p>
                            
                            <!-- Interview Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px 0; color: #b45309; font-size: 14px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #fde68a; padding-bottom: 8px;">Interview Schedule Details</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            ${data.role ? `<tr>
                                                <td style="padding: 7px 0; color: #78350f; font-size: 13px; width: 110px; font-weight: 700;">ROLE:</td>
                                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${data.role}</td>
                                            </tr>` : ''}
                                            ${data.date ? `<tr>
                                                <td style="padding: 7px 0; color: #78350f; font-size: 13px; width: 110px; font-weight: 700;">DATE:</td>
                                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${data.date}</td>
                                            </tr>` : ''}
                                            ${data.time ? `<tr>
                                                <td style="padding: 7px 0; color: #78350f; font-size: 13px; width: 110px; font-weight: 700;">TIME / SLOT:</td>
                                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${data.time}</td>
                                            </tr>` : ''}
                                            ${data.venue ? `<tr>
                                                <td style="padding: 7px 0; color: #78350f; font-size: 13px; width: 110px; font-weight: 700;">LOCATION:</td>
                                                <td style="padding: 7px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${data.venue}</td>
                                            </tr>` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${formattedNotes ? `
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 10px; margin-bottom: 25px;">
                                <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 800; text-transform: uppercase;">Important Instructions / Notes</h4>
                                <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0;">${formattedNotes}</p>
                            </div>
                            ` : ''}

                            ${data.buttonUrl ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 15px 0;">
                                        <a href="${data.buttonUrl}" target="_blank" style="display: inline-block; background-color: #FFB22C; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 15px; font-weight: 900; text-decoration: none; padding: 14px 35px; border-radius: 8px; text-transform: uppercase; border: 2px solid #000000;" class="mobile-cta">
                                            ${data.buttonText || 'Join Interview / Confirm Slot'}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                                Best of luck! We look forward to meeting you.<br/><br/>
                                Warm regards,<br/>
                                <strong style="color: #0f172a;">Team E-Cell DYPIU</strong>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #64748b; font-size: 12px;">
                                © ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Generate Custom Composer Email Layouts with Multi-Template Support
function generateGenericHTML(data, recipient) {
    const template = data?.template || 'executive';
    const accent = data?.accentColor || '#FFB22C';
    const headerTitle = data?.headerTitle || 'E-CELL DYPIU';
    const headerSubtitle = data?.headerSubtitle || 'A MESSAGE FROM THE TEAM';
    const footerText = data?.footerText || `© ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.`;

    const formattedBody = (data?.body || '')
        .replace(/\{name\}/g, recipient?.name || 'Applicant')
        .replace(/\{email\}/g, recipient?.email || '')
        .replace(/\{role\}/g, recipient?.role || data?.role || 'Team Member');

    // 1. Official Letterhead Template
    if (template === 'letterhead') {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Georgia, serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;">
        <tr>
            <td align="center" style="padding:40px 12px;">
                <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff; border:2px solid #0f172a; border-radius:4px; overflow:hidden; max-width:620px; width:100%; box-shadow:0 10px 25px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="padding:32px 40px 20px 40px; border-bottom:3px double ${accent}; background-color:#ffffff; text-align:left;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <h1 style="margin:0; color:#0f172a; font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:1px; font-family:'Segoe UI', Arial, sans-serif;">
                                            ${headerTitle}
                                        </h1>
                                        <p style="margin:4px 0 0 0; color:#64748b; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; font-family:'Segoe UI', Arial, sans-serif;">
                                            Centre for Innovation, Incubation & Entrepreneurship (CIIE) • DYPIU
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:36px 40px; color:#0f172a; font-size:15px; line-height:1.75; font-family:'Segoe UI', Arial, sans-serif;">
                            ${formattedBody}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f8fafc; padding:20px 40px; text-align:center; border-top:1px solid #e2e8f0; font-family:'Segoe UI', Arial, sans-serif;">
                            <p style="margin:0; color:#64748b; font-size:11px;">
                                ${footerText}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    // 2. Minimalist Clean Template
    if (template === 'minimal') {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="580" cellspacing="0" cellpadding="0" border="0" style="max-width:580px; width:100%;">
                    <tr>
                        <td style="padding:0 0 24px 0; border-bottom:2px solid #0f172a;">
                            <span style="display:inline-block; font-size:13px; font-weight:900; text-transform:uppercase; letter-spacing:1px; color:#0f172a;">
                                ${headerTitle} <span style="color:${accent};">●</span>
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 0; color:#1e293b; font-size:15px; line-height:1.7;">
                            ${formattedBody}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 0 0 0; border-top:1px solid #e2e8f0; color:#94a3b8; font-size:12px;">
                            ${footerText}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    // 3. Modern Dark Preset (available when dark mode is explicitly desired)
    if (template === 'dark') {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:#09090b; font-family:Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#09090b;">
        <tr>
            <td align="center" style="padding:35px 12px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#18181b; border:2px solid #27272a; border-radius:16px; overflow:hidden; max-width:600px; width:100%;">
                    <tr>
                        <td style="background-color:${accent}; padding:24px 30px; text-align:center;">
                            <h1 style="margin:0; color:#000000; font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px;">
                                ${headerTitle}
                            </h1>
                            <p style="margin:4px 0 0 0; color:#000000; font-size:12px; font-weight:bold; opacity:0.85;">
                                ${headerSubtitle}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:35px 40px; color:#f4f4f5; font-size:15px; line-height:1.7;">
                            ${formattedBody}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#0c0c0e; padding:22px 30px; text-align:center; border-top:1px solid #27272a;">
                            <p style="margin:0; color:#71717a; font-size:12px;">
                                ${footerText}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    // 4. Default: Modern Executive Light
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerTitle}</title>
    <style type="text/css">
        @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; border-radius: 0 !important; }
            .mobile-cta { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
            .mobile-content { padding: 25px 20px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f5f7;">
        <tr>
            <td align="center" style="padding:35px 12px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="background-color:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; max-width:600px; width:100%; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color:${accent}; padding:26px 30px; text-align:center; border-bottom:2px solid rgba(0,0,0,0.08);">
                            <h1 style="margin:0; color:#000000; font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                ${headerTitle}
                            </h1>
                            <p style="margin:6px 0 0 0; color:#000000; font-size:13px; font-weight:800; opacity:0.85; letter-spacing:0.5px;">
                                ${headerSubtitle}
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td class="mobile-content" style="padding:35px 40px; color:#1e293b; font-size:15px; line-height:1.7;">
                            ${formattedBody}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc; padding:24px 30px; text-align:center; border-top:1px solid #e2e8f0;">
                            <p style="margin:0; color:#64748b; font-size:12px;">
                                ${footerText}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Fetch past dispatch logs for the Email Logs admin tab, newest first.
async function handleGetEmailLogs(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const snapshot = await db.collection('EMAIL_LOGS').orderBy('sentAt', 'desc').limit(limit).get();

        const logs = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                sentAt: d.sentAt?.toDate ? d.sentAt.toDate().toISOString() : d.sentAt
            };
        });

        return res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error('Failed to fetch email logs:', error);
        return res.status(500).json({ error: 'Failed to fetch email logs', details: error.message });
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Verify admin API key
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET' && req.query.action === 'logs') {
        return handleGetEmailLogs(req, res);
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, manualEmails, type, subject, data, selectedSubscribers, provider, attachments, cc, bcc } = req.body;

        if (!type || !subject) {
            return res.status(400).json({ error: 'Type and Subject are required' });
        }

        let recipients = [];
        let skippedDocs = [];
        let totalDocs = 0;

        // Resolve recipients based on 'to' setting
        if (to === 'all') {
            const subscribersSnapshot = await db.collection('SUBSCRIPTION_REQUESTS').get();
            totalDocs = subscribersSnapshot.size;

            subscribersSnapshot.forEach(doc => {
                const docData = doc.data();
                if (docData.email) {
                    recipients.push({
                        name: docData.name || 'Subscriber',
                        email: docData.email
                    });
                } else {
                    skippedDocs.push({ id: doc.id, fields: Object.keys(docData) });
                }
            });
        } else if (to === 'selected') {
            if (selectedSubscribers && Array.isArray(selectedSubscribers)) {
                recipients = selectedSubscribers.map(sub => ({
                    name: sub.name || 'Subscriber',
                    email: sub.email,
                    role: sub.role
                }));
                totalDocs = selectedSubscribers.length;
            }
        } else if (to === 'manual') {
            let emails = [];
            if (typeof manualEmails === 'string') {
                emails = manualEmails.split(',').map(e => e.trim()).filter(Boolean);
            } else if (Array.isArray(manualEmails)) {
                emails = manualEmails.map(e => e.trim()).filter(Boolean);
            }

            recipients = emails.map(email => ({
                name: email.split('@')[0],
                email: email
            }));
            totalDocs = emails.length;
        }

        if (recipients.length === 0) {
            return res.status(400).json({ error: 'No valid recipients selected' });
        }

        const results = {
            sent: 0,
            failed: 0,
            details: []
        };

        // Dispatch emails one-by-one
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];

            try {
                let recipientSubject = (subject || '')
                    .replace(/\{name\}/g, recipient.name || 'Applicant')
                    .replace(/\{email\}/g, recipient.email || '')
                    .replace(/\{role\}/g, recipient.role || data?.role || 'Team Role');

                let htmlContent = '';
                let rawText = '';

                if (data && (data.format === 'plain' || data.isPlainText)) {
                    htmlContent = generatePlainTextEmailHTML(data.plainText || data.body || '', recipient);
                    rawText = (data.plainText || data.body || '')
                        .replace(/\{name\}/g, recipient.name || 'Member')
                        .replace(/\{email\}/g, recipient.email || '')
                        .replace(/\{role\}/g, recipient.role || data?.role || '');
                } else if (data && (data.customHtml || data.fullHtml)) {
                    htmlContent = (data.customHtml || data.fullHtml)
                        .replace(/\{name\}/g, recipient.name || 'Applicant')
                        .replace(/\{email\}/g, recipient.email || '')
                        .replace(/\{role\}/g, recipient.role || data.role || 'E-Cell Team Member')
                        .replace(/\{date\}/g, data.date || '')
                        .replace(/\{time\}/g, data.time || '')
                        .replace(/\{venue\}/g, data.venue || '');
                } else if (type === 'announcement') {
                    htmlContent = generateAnnouncementHTML(data, recipient.name);
                } else if (type === 'event') {
                    htmlContent = generateEventHTML(data, recipient.name);
                } else if (type === 'interview') {
                    htmlContent = generateInterviewHTML(data, recipient.name);
                } else {
                    htmlContent = generateGenericHTML(data, recipient);
                }

                await sendEmail(recipient.email, recipientSubject, htmlContent, provider || 'resend', attachments || [], cc || [], bcc || [], rawText);
                results.sent++;
                results.details.push({
                    name: recipient.name,
                    email: recipient.email,
                    status: 'sent',
                    error: null
                });
            } catch (err) {
                results.failed++;
                results.details.push({
                    name: recipient.name,
                    email: recipient.email,
                    status: 'failed',
                    error: err.message
                });
            }

            // Rate limit delay between dispatches (1 second)
            if (i < recipients.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Best-effort audit log — must never fail the dispatch response itself.
        try {
            await db.collection('EMAIL_LOGS').add({
                type,
                subject,
                provider: provider || 'resend',
                to,
                recipients: results.details,
                cc: (cc || []).map(c => ({ name: c.name || '', email: c.email })),
                bcc: (bcc || []).map(b => ({ name: b.name || '', email: b.email })),
                attachmentCount: (attachments || []).length,
                sentCount: results.sent,
                failedCount: results.failed,
                totalRecipients: recipients.length,
                sentAt: Timestamp.now()
            });
        } catch (logErr) {
            console.error('Failed to write email log:', logErr.message);
        }

        return res.status(200).json({
            success: true,
            message: `Mailer finished dispatching`,
            results: {
                totalDocs,
                validSubscribers: recipients.length,
                skippedDocs: skippedDocs.length,
                sent: results.sent,
                failed: results.failed,
                details: results.details,
                skipped: skippedDocs
            }
        });

    } catch (error) {
        console.error('Mailer error:', error);
        return res.status(500).json({
            error: 'Failed to process mailing list',
            details: error.message
        });
    }
}
