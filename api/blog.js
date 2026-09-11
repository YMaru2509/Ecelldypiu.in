import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

// Email sending function using Resend API
async function sendEmail(to, subject, htmlContent) {
    if (process.env.ZEPTOMAIL_API_KEY) {
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

        const payload = {
            from: {
                address: fromAddress,
                name: fromName
            },
            to: [
                {
                    email_address: {
                        address: toAddress,
                        name: toName || toAddress.split('@')[0]
                    }
                }
            ],
            subject: subject,
            htmlbody: htmlContent
        };

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

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'E-Cell DYPIU <noreply@ecelldypiu.in>',
            to: [to],
            subject: subject,
            html: htmlContent,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Email send failed: ${JSON.stringify(error)}`);
    }

    return response.json();
}

// Generate HTML email template for new blog notification
function generateBlogEmailHTML(blogData, subscriberName) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <title>New Blog Post - E-Cell DYPIU</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
    <style type="text/css">
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Mobile styles */
        @media only screen and (max-width: 620px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .mobile-padding {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            .mobile-padding-header {
                padding: 25px 20px !important;
            }
            .mobile-padding-content {
                padding: 30px 20px !important;
            }
            .mobile-padding-card {
                padding: 20px !important;
            }
            .mobile-title {
                font-size: 22px !important;
                line-height: 1.3 !important;
            }
            .mobile-heading {
                font-size: 20px !important;
                line-height: 1.3 !important;
            }
            .mobile-text {
                font-size: 15px !important;
            }
            .mobile-small {
                font-size: 13px !important;
            }
            .mobile-cta {
                padding: 14px 30px !important;
                font-size: 14px !important;
            }
            .mobile-footer {
                padding: 25px 20px !important;
            }
        }
        
        @media only screen and (max-width: 480px) {
            .mobile-padding {
                padding-left: 15px !important;
                padding-right: 15px !important;
            }
            .mobile-padding-header {
                padding: 20px 15px !important;
            }
            .mobile-padding-content {
                padding: 25px 15px !important;
            }
            .mobile-padding-card {
                padding: 15px !important;
            }
            .mobile-title {
                font-size: 20px !important;
            }
            .mobile-heading {
                font-size: 18px !important;
            }
            .mobile-text {
                font-size: 14px !important;
            }
            .mobile-small {
                font-size: 12px !important;
            }
            .mobile-cta {
                padding: 12px 25px !important;
                font-size: 13px !important;
                display: block !important;
                width: 100% !important;
                box-sizing: border-box !important;
                text-align: center !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7;">
        <tr>
            <td align="center" style="padding: 35px 12px;" class="mobile-padding">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-container" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; max-width: 600px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 26px 35px; text-align: center; border-bottom: 2px solid #eab308;" class="mobile-padding-header">
                            <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;" class="mobile-title">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin: 6px 0 0 0; color: #000000; font-size: 13px; font-weight: 800; opacity: 0.85; letter-spacing: 0.5px;" class="mobile-small">
                                NEW BLOG POST ALERT 🚀
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 35px 40px;" class="mobile-padding-content">
                            <p style="color: #1e293b; font-size: 16px; margin: 0 0 20px 0;" class="mobile-text">
                                Hey <strong>${subscriberName || 'there'}</strong>! 👋
                            </p>
                            
                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;" class="mobile-text">
                                We just published a new blog post that we think you'll love! Check it out:
                            </p>
                            
                            <!-- Blog Card -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #FFB22C; border-radius: 12px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 24px;" class="mobile-padding-card">
                                        <span style="display: inline-block; background-color: #FFB22C; color: #000000; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px;" class="mobile-small">
                                            ${blogData.category || 'BLOG'}
                                        </span>
                                        
                                        <h2 style="color: #0f172a; font-size: 20px; font-weight: 900; margin: 10px 0; text-transform: uppercase; line-height: 1.3;" class="mobile-heading">
                                            ${blogData.title}
                                        </h2>
                                        
                                        <p style="color: #b45309; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; font-weight: 700;" class="mobile-text">
                                            🔥 Tap the button below to read this exciting new post!
                                        </p>
                                        
                                        <p style="color: #64748b; font-size: 12px; margin: 0;" class="mobile-small">
                                            📅 ${blogData.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            ${blogData.readTime ? ` • ⏱️ ${blogData.readTime}` : ''}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="${blogData.url || 'https://ecelldypiu.in/blogs'}" 
                                           style="display: inline-block; background-color: #FFB22C; color: #000000; text-decoration: none; padding: 14px 35px; font-size: 15px; font-weight: 900; text-transform: uppercase; border-radius: 8px; border: 2px solid #000000;" class="mobile-cta">
                                            READ NOW →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0; text-align: center;" class="mobile-footer">
                            <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;" class="mobile-small">
                                You're receiving this because you subscribed to E-Cell DYPIU newsletter.
                            </p>
                            <p style="color: #94a3b8; font-size: 11px; margin: 0;" class="mobile-small">
                                © ${new Date().getFullYear()} E-Cell DYPIU. All rights reserved.<br>
                                D. Y. Patil International University, Pune
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    if (req.method === 'GET') {
        return await handleGetBlogs(req, res);
    }

    if (req.method === 'POST') {
        if (action === 'notify') {
            return await handleSendNotification(req, res);
        }
        return await handleCreateBlog(req, res);
    }

    if (req.method === 'DELETE') {
        return await handleDeleteBlog(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGetBlogs(req, res) {
    try {
        const { slug } = req.query;

        // If slug provided, get single blog
        if (slug) {
            const blogsSnapshot = await db.collection('BLOGS')
                .where('slug', '==', slug)
                .where('published', '==', true)
                .limit(1)
                .get();

            if (blogsSnapshot.empty) {
                return res.status(404).json({ error: 'Blog not found' });
            }

            const doc = blogsSnapshot.docs[0];
            return res.status(200).json({
                success: true,
                blog: {
                    id: doc.id,
                    ...doc.data()
                }
            });
        }

        // Get all published blogs, ordered by creation date
        let blogsSnapshot;
        try {
            blogsSnapshot = await db.collection('BLOGS')
                .where('published', '==', true)
                .orderBy('createdAt', 'desc')
                .get();
        } catch (indexError) {
            // Fallback: if composite index not available, get all and filter/sort in memory
            console.log('Index error, using fallback:', indexError.message);
            const allBlogsSnapshot = await db.collection('BLOGS').get();
            const allBlogs = [];
            allBlogsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.published === true) {
                    allBlogs.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            // Sort by createdAt descending
            allBlogs.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
            return res.status(200).json({
                success: true,
                blogs: allBlogs,
                total: allBlogs.length
            });
        }

        const blogs = [];
        blogsSnapshot.forEach(doc => {
            blogs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return res.status(200).json({
            success: true,
            blogs,
            count: blogs.length
        });

    } catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({
            error: 'Failed to fetch blogs',
            details: error.message
        });
    }
}

async function handleCreateBlog(req, res) {
    // Verify admin API key
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const {
            title,
            slug,
            excerpt,
            content,
            author,
            category,
            readTime,
            tags,
            images,
            date
        } = req.body;

        // Validation
        if (!title || !slug || !excerpt || !content) {
            return res.status(400).json({ error: 'Title, slug, excerpt, and content are required' });
        }

        // Check if slug already exists
        const existingBlog = await db.collection('BLOGS').where('slug', '==', slug).get();
        if (!existingBlog.empty) {
            return res.status(400).json({ error: 'A blog with this slug already exists' });
        }

        // Create blog document
        const blogData = {
            title,
            slug,
            excerpt,
            content,
            author: author || 'E-Cell DYPIU',
            category: category || 'Entrepreneurship',
            readTime: readTime || '5 min read',
            tags: tags || [],
            images: images || [],
            date: date || new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            published: true
        };

        const docRef = await db.collection('BLOGS').add(blogData);

        console.log('✅ Blog created:', docRef.id);

        return res.status(200).json({
            success: true,
            blog: {
                id: docRef.id,
                ...blogData
            },
            message: 'Blog created successfully'
        });

    } catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).json({
            error: 'Failed to create blog',
            details: error.message
        });
    }
}

async function handleDeleteBlog(req, res) {
    // Verify admin API key
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Blog ID is required' });
        }

        // Delete the blog
        await db.collection('BLOGS').doc(id).delete();

        console.log('✅ Blog deleted:', id);

        return res.status(200).json({
            success: true,
            message: 'Blog deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting blog:', error);
        return res.status(500).json({
            error: 'Failed to delete blog',
            details: error.message
        });
    }
}

async function handleSendNotification(req, res) {
    // Verify admin API key for security
    const authHeader = req.headers.authorization;
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { title, excerpt, description, category, date, readTime, url, selectedSubscribers } = req.body;

        // Validation
        if (!title) {
            return res.status(400).json({ error: 'Blog title is required' });
        }

        const blogData = {
            title,
            excerpt: excerpt || description,
            category: category || 'Blog',
            date: date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            readTime,
            url: url || 'https://ecelldypiu.in/blogs'
        };

        let subscribers = [];
        let skippedDocs = [];
        let totalDocs = 0;

        // If selectedSubscribers is provided, use that list
        if (selectedSubscribers && Array.isArray(selectedSubscribers) && selectedSubscribers.length > 0) {
            subscribers = selectedSubscribers.map(sub => ({
                name: sub.name || 'Subscriber',
                email: sub.email
            }));
            totalDocs = selectedSubscribers.length;
            console.log(`Using ${subscribers.length} selected subscribers`);
        } else {
            // Fetch all newsletter subscribers from Firebase
            const subscribersSnapshot = await db.collection('SUBSCRIPTION_REQUESTS').get();

            console.log(`Total documents in SUBSCRIPTION_REQUESTS: ${subscribersSnapshot.size}`);
            totalDocs = subscribersSnapshot.size;

            if (subscribersSnapshot.empty) {
                return res.status(200).json({
                    success: true,
                    message: 'No subscribers to notify',
                    sentCount: 0,
                    debug: { totalDocs: 0 }
                });
            }

            subscribersSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`Doc ${doc.id}: email="${data.email}", name="${data.name}"`);
                if (data.email) {
                    subscribers.push({
                        name: data.name || 'Subscriber',
                        email: data.email
                    });
                } else {
                    skippedDocs.push({ id: doc.id, fields: Object.keys(data) });
                }
            });

            console.log(`Found ${subscribers.length} subscribers with email field, skipped ${skippedDocs.length}`);
        }

        if (subscribers.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No subscribers to notify',
                sentCount: 0
            });
        }

        // Send emails to all subscribers
        const emailSubject = `📢 New Blog: ${title} | E-Cell DYPIU`;
        const results = {
            sent: 0,
            failed: 0,
            details: [] // Detailed results for each subscriber
        };

        // Send emails ONE AT A TIME with delay to avoid rate limits
        for (let i = 0; i < subscribers.length; i++) {
            const subscriber = subscribers[i];

            try {
                const htmlContent = generateBlogEmailHTML(blogData, subscriber.name);
                await sendEmail(subscriber.email, emailSubject, htmlContent);
                results.sent++;
                results.details.push({
                    name: subscriber.name,
                    email: subscriber.email,
                    status: 'sent',
                    error: null
                });
                console.log(`✅ Email sent to: ${subscriber.email}`);
            } catch (error) {
                results.failed++;
                results.details.push({
                    name: subscriber.name,
                    email: subscriber.email,
                    status: 'failed',
                    error: error.message
                });
                console.error(`❌ Failed to send to ${subscriber.email}:`, error.message);
            }

            // Wait 1 second between each email to avoid rate limits
            if (i < subscribers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return res.status(200).json({
            success: true,
            message: `Blog notification sent`,
            blog: blogData,
            results: {
                totalDocs: totalDocs,
                validSubscribers: subscribers.length,
                skippedDocs: skippedDocs.length,
                sent: results.sent,
                failed: results.failed,
                details: results.details,
                skipped: skippedDocs
            }
        });

    } catch (error) {
        console.error('Error sending blog notifications:', error);
        return res.status(500).json({
            error: 'Failed to send blog notifications',
            details: error.message
        });
    }
}
