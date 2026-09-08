import { useState, useEffect } from 'react';
import {
    Loader2, Send, AlertCircle, CheckCircle2, Lock,
    PlusCircle, List, Bell, LogOut, Image, X, Upload,
    Calendar, Clock, Tag, User, Eye, Trash2, BookOpen,
    FileText, Users, CheckSquare, Square, Mail, Phone, Search,
    ArrowLeft, Sparkles, Archive, ArrowUpDown, UserPlus, UserMinus,
    Award, Building, LinkIcon
} from 'lucide-react';
import CertificateManager from '../components/CertificateManager';
import EventManager from '../components/EventManager';
import LinkShortener from '../components/LinkShortener';

const AdminPortal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminKey, setAdminKey] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [blogs, setBlogs] = useState([]);
    const [loadingBlogs, setLoadingBlogs] = useState(false);
    const [blogFilter, setBlogFilter] = useState('all'); // 'all', 'new', 'old'
    const [blogSortOrder, setBlogSortOrder] = useState('newest'); // 'newest', 'oldest'

    // Collaborations state
    const [collaborations, setCollaborations] = useState([]);
    const [loadingCollaborations, setLoadingCollaborations] = useState(false);
    const [collabFilter, setCollabFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
    const [collabQuestions, setCollabQuestions] = useState([]);
    const [loadingCollabQuestions, setLoadingCollabQuestions] = useState(false);

    // Subscriber modal state
    const [showSubscriberModal, setShowSubscriberModal] = useState(false);
    const [subscribers, setSubscribers] = useState([]);
    const [selectedSubscribers, setSelectedSubscribers] = useState([]);
    const [loadingSubscribers, setLoadingSubscribers] = useState(false);
    const [subscriberSearch, setSubscriberSearch] = useState('');

    // New subscriber form state
    const [newSubscriber, setNewSubscriber] = useState({
        name: '',
        email: '',
        phone: '',
        college: ''
    });
    const [addingSubscriber, setAddingSubscriber] = useState(false);
    const [deletingSubscriber, setDeletingSubscriber] = useState(null);

    // Team Applications state
    const [applications, setApplications] = useState([]);
    const [loadingApplications, setLoadingApplications] = useState(false);
    const [selectedApplications, setSelectedApplications] = useState([]);
    const [appSearch, setAppSearch] = useState('');
    const [appRoleFilter, setAppRoleFilter] = useState('all');
    const [appStatusFilter, setAppStatusFilter] = useState('pending'); // 'pending', 'selected', 'rejected'
    const [viewingApp, setViewingApp] = useState(null);

    // Interview schedule modal & email editor state
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [interviewEditorTab, setInterviewEditorTab] = useState('guided'); // 'guided', 'html', 'preview'
    const [interviewData, setInterviewData] = useState({
        subject: 'Interview Schedule - E-Cell DYPIU Team Application',
        role: '',
        date: '',
        time: '',
        venue: '',
        notes: 'Please arrive 5 minutes prior to your scheduled slot. Bring a copy of your resume or portfolio if applicable.',
        buttonText: 'Confirm Slot / Join Meet',
        buttonUrl: '',
        useCustomHtml: false,
        customHtml: ''
    });
    const [sendingInterviewMail, setSendingInterviewMail] = useState(false);

    // Mailer state variables
    const [mailerTo, setMailerTo] = useState('all'); // 'all', 'selected', 'manual'
    const [mailerManualEmails, setMailerManualEmails] = useState('');
    const [mailerSubject, setMailerSubject] = useState('');
    const [mailerType, setMailerType] = useState('announcement'); // 'announcement', 'event', 'generic'
    
    // Announcement data state
    const [announcementData, setAnnouncementData] = useState({
        title: '',
        subtitle: '',
        bannerUrl: '',
        body: '',
        buttonText: '',
        buttonUrl: ''
    });

    // Event notification data state
    const [eventMailData, setEventMailData] = useState({
        title: '',
        bannerUrl: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        registrationLink: '',
        buttonText: 'Register Now'
    });

    // Generic composer data state
    const [genericMailData, setGenericMailData] = useState({
        plainText: 'Dear {name},\n\nA very warm welcome to E-Cell DYPIU! We are absolutely thrilled to have you join our entrepreneurship community.\n\nWe will keep you updated with the latest incubation cohorts, ideation workshops, and startup funding opportunities.\n\nBest regards,\nTeam E-Cell DYPIU',
        body: `<div style="font-family:Segoe UI,Arial,sans-serif;color:#ffffff;line-height:1.6;font-size:14px;">\n<p style="margin:0 0 12px;">Dear {name},</p>\n<p style="margin:0 0 10px;">&nbsp;</p>\n<p style="margin:0 0 12px;">A very warm welcome to E-Cell DYPIU! We are absolutely thrilled to have you join our entrepreneurship community.</p>\n<p style="margin:0 0 10px;">&nbsp;</p>\n<p style="margin:0 0 12px;">We will keep you updated with the latest incubation cohorts, ideation workshops, and startup funding opportunities.</p>\n<p style="margin:0 0 10px;">&nbsp;</p>\n<p style="margin:0 0 12px;">Best regards,</p>\n<p style="margin:0 0 12px;">Team E-Cell DYPIU</p>\n</div>`
    });
    const [showMailPreviewModal, setShowMailPreviewModal] = useState(false);

    // Sync plain text edit to HTML
    const handlePlainTextChange = (text) => {
        setGenericMailData(prev => {
            const paragraphs = text.split('\n').map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '<p style="margin:0 0 10px;">&nbsp;</p>';
                return `<p style="margin:0 0 12px;">${trimmed}</p>`;
            }).join('\n');
            
            const htmlContent = `<div style="font-family:Segoe UI,Arial,sans-serif;color:#ffffff;line-height:1.6;font-size:14px;">\n${paragraphs}\n</div>`;
            
            return {
                ...prev,
                plainText: text,
                body: htmlContent
            };
        });
    };

    // Reset Generic Composer default template
    const handleResetGenericDefault = () => {
        if (window.confirm("Are you sure you want to reset the custom email template? This will discard your current edits.")) {
            setGenericMailData({
                plainText: 'Dear {name},\n\nA very warm welcome to E-Cell DYPIU! We are absolutely thrilled to have you join our entrepreneurship community.\n\nWe will keep you updated with the latest incubation cohorts, ideation workshops, and startup funding opportunities.\n\nBest regards,\nTeam E-Cell DYPIU',
                body: `<div style="font-family:Segoe UI,Arial,sans-serif;color:#ffffff;line-height:1.6;font-size:14px;">\n<p style="margin:0 0 12px;">Dear {name},</p>\n<p style="margin:0 0 10px;">&nbsp;</p>\n<p style="margin:0 0 12px;">A very warm welcome to E-Cell DYPIU! We are absolutely thrilled to have you join our entrepreneurship community.</p>\n<p style="margin:0 0 10px;">&nbsp;</p>\n<p style="margin:0 0 12px;">We will keep you updated with the latest incubation cohorts, ideation workshops, and startup funding opportunities.</p>\n<p style="margin:0 0 10px;">&nbsp;</p>\n<p style="margin:0 0 12px;">Best regards,</p>\n<p style="margin:0 0 12px;">Team E-Cell DYPIU</p>\n</div>`
            });
        }
    };

    // Export Contacts to CSV
    const handleExportSubscribersCSV = () => {
        if (subscribers.length === 0) {
            alert('No subscribers to export.');
            return;
        }
        const headers = ['Name', 'Email', 'Phone', 'College/Organization'];
        const rows = subscribers.map(s => [
            s.name || 'Unknown',
            s.email || '',
            s.phone || '',
            s.college || ''
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ECell_Subscribers_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Import Emails from CSV/TXT file
    const handleImportEmailsCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const matches = text.match(emailRegex) || [];
            
            if (matches.length === 0) {
                alert("No valid email addresses found in the selected file!");
                return;
            }

            const uniqueEmails = [...new Set(matches.map(email => email.toLowerCase()))];
            
            setMailerManualEmails(prev => {
                const existing = prev ? prev.split(',').map(email => email.trim().toLowerCase()).filter(Boolean) : [];
                const combined = [...new Set([...existing, ...uniqueEmails])];
                return combined.join(', ');
            });
            
            alert(`Successfully imported ${uniqueEmails.length} unique email address(es) from "${file.name}"!`);
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    // Generate live html preview of the custom email wrapped in E-cell branding
    const getGenericPreviewHTML = (bodyContent) => {
        const formattedBody = (bodyContent || '').replace(/\n/g, '<br/>');
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif; color: #ffffff; }
    </style>
</head>
<body>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #18181b; border: 3px solid #ffffff; border-radius: 16px; overflow: hidden; max-width: 550px; width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 20px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; font-family: Arial, sans-serif;">
                                E-CELL DYPIU
                            </h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 25px 30px; color: #ffffff; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">
                            ${formattedBody}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0c0c0e; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
                            <p style="margin: 0; color: #71717a; font-size: 10px; font-family: Arial, sans-serif;">
                                © ${new Date().getFullYear()} E-Cell DYPIU.
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
    };

    // Copy selected or all emails to clipboard
    const handleCopyEmails = () => {
        const listToCopy = selectedSubscribers.length > 0 
            ? selectedSubscribers 
            : subscribers.map(s => s.email);
            
        if (listToCopy.length === 0) {
            alert('No emails to copy!');
            return;
        }
        
        navigator.clipboard.writeText(listToCopy.join(', '));
        alert(`Copied ${listToCopy.length} email address(es) to clipboard!`);
    };

    // Dispatch Emails via Mailer API
    const handleSendMailerEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        let payloadData = {};
        if (mailerType === 'announcement') {
            payloadData = announcementData;
        } else if (mailerType === 'event') {
            payloadData = eventMailData;
        } else {
            payloadData = genericMailData;
        }

        const selectedSubs = subscribers.filter(s => selectedSubscribers.includes(s.email));

        try {
            const response = await fetch('/api/mailer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    to: mailerTo,
                    manualEmails: mailerManualEmails,
                    type: mailerType,
                    subject: mailerSubject,
                    data: payloadData,
                    selectedSubscribers: selectedSubs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to dispatch emails');
            }

            setResult({
                type: 'notification',
                message: `Emails dispatched successfully to ${data.results?.sent || 0} of ${data.results?.validSubscribers || 0} recipients!`,
                details: data.results?.details || [],
                sent: data.results?.sent || 0,
                failed: data.results?.failed || 0,
                total: data.results?.validSubscribers || 0,
                totalDocs: data.results?.totalDocs || 0,
                skipped: data.results?.skippedDocs || 0,
                skippedDetails: data.results?.skipped || []
            });

            // Reset form details if successful
            if (mailerType === 'announcement') {
                setAnnouncementData({ title: '', subtitle: '', bannerUrl: '', body: '', buttonText: '', buttonUrl: '' });
            } else if (mailerType === 'event') {
                setEventMailData({ title: '', bannerUrl: '', description: '', date: '', time: '', venue: '', registrationLink: '', buttonText: 'Register Now' });
            } else {
                setGenericMailData({ body: '' });
            }
            setMailerSubject('');
            setMailerManualEmails('');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Login state
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Filter subscribers based on search
    const filteredSubscribers = subscribers.filter(sub =>
        sub.name.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
        sub.email.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
        (sub.phone && sub.phone.includes(subscriberSearch)) ||
        (sub.college && sub.college.toLowerCase().includes(subscriberSearch.toLowerCase()))
    );

    // Helper function to check if a blog is "new" (created within last 7 days)
    const isBlogNew = (blog) => {
        if (!blog.createdAt) return false;
        const createdTime = blog.createdAt?.toMillis?.() || blog.createdAt?._seconds * 1000 || 0;
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return createdTime > sevenDaysAgo;
    };

    // Static/Legacy blogs data
    const legacyBlogs = [
        {
            id: 'static-1',
            title: 'E-Cell DYPIU Blog: Where Ideas Meet Impact',
            slug: 'where-ideas-meet-impact',
            category: 'Entrepreneurship',
            date: 'September 20, 2025',
            excerpt: 'Discover how E-Cell DYPIU is transforming entrepreneurial dreams into reality through innovative programs, events, and community building.',
            isLegacy: true
        },
        {
            id: 'static-2',
            title: 'E-Cell DYPIU at COEP Pune E-Cell Meetup',
            slug: 'ceo-pune-meetup',
            category: 'Events',
            date: 'September 27, 2025',
            excerpt: 'A collaborative gathering of Pune\'s brightest entrepreneurial minds, fostering connections and sharing innovative ideas.',
            isLegacy: true
        },
        {
            id: 'static-3',
            title: 'E-Cell DYPIU at Entrepreneurship Awareness Drive',
            slug: 'entrepreneurship-awareness-drive',
            category: 'Events',
            date: 'October 1, 2025',
            excerpt: 'E-Cell DYPIU takes the lead in spreading entrepreneurship awareness across Pune.',
            isLegacy: true
        }
    ];

    // Combined and filtered blogs
    const getAllBlogs = () => {
        const dynamicBlogs = blogs.map(b => ({ ...b, isLegacy: false }));
        let allBlogs = [...dynamicBlogs, ...legacyBlogs];

        // Filter
        if (blogFilter === 'new') {
            allBlogs = dynamicBlogs.filter(b => isBlogNew(b));
        } else if (blogFilter === 'old') {
            allBlogs = [...dynamicBlogs.filter(b => !isBlogNew(b)), ...legacyBlogs];
        }

        // Sort (only for dynamic, legacy always at end)
        if (blogSortOrder === 'oldest') {
            const dynamic = allBlogs.filter(b => !b.isLegacy);
            const legacy = allBlogs.filter(b => b.isLegacy);
            dynamic.reverse();
            return [...dynamic, ...legacy];
        }

        return allBlogs;
    };

    // Blog form state
    const [blogData, setBlogData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author: 'E-Cell DYPIU',
        category: 'Entrepreneurship',
        readTime: '5 min read',
        tags: '',
        images: []
    });

    // Image upload state
    const [imageUrls, setImageUrls] = useState(['']);

    // Notification state
    const [notifyData, setNotifyData] = useState({
        blogId: '',
        title: '',
        excerpt: '',
        url: '',
        category: ''
    });

    // Check for saved auth and verify it's still valid
    useEffect(() => {
        const verifyAndRestoreSession = async () => {
            const savedKey = sessionStorage.getItem('adminKey');
            if (savedKey) {
                setAdminKey(savedKey);
                setLoginLoading(true);
                try {
                    const response = await fetch('/api/event', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${savedKey}`
                        },
                        body: JSON.stringify({ action: 'verify-admin' })
                    });
                    if (response.ok) {
                        setIsAuthenticated(true);
                    } else {
                        // Saved key is no longer valid
                        sessionStorage.removeItem('adminKey');
                        setAdminKey('');
                        setLoginError('Session expired. Please login again.');
                    }
                } catch {
                    // Network error - still try to authenticate
                    setIsAuthenticated(true);
                } finally {
                    setLoginLoading(false);
                }
            }
        };
        verifyAndRestoreSession();
    }, []);

    // Prevent body scroll when any modal is open
    useEffect(() => {
        if (viewingApp || showInterviewModal || showMailPreviewModal || showSubscriberModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [viewingApp, showInterviewModal, showMailPreviewModal, showSubscriberModal]);

    // Load blogs when authenticated
    useEffect(() => {
        if (isAuthenticated && (activeTab === 'manage-blogs' || activeTab === 'dashboard')) {
            fetchBlogs();
        }
    }, [isAuthenticated, activeTab]);

    const fetchBlogs = async () => {
        setLoadingBlogs(true);
        try {
            const response = await fetch('/api/blog');
            const data = await response.json();
            if (data.blogs) {
                setBlogs(data.blogs);
            }
        } catch (err) {
            console.error('Failed to fetch blogs:', err);
        } finally {
            setLoadingBlogs(false);
        }
    };

    const fetchCollaborations = async () => {
        setLoadingCollaborations(true);
        try {
            const response = await fetch('/api/collaboration', {
                headers: {
                    'Authorization': `Bearer ${adminKey}`
                }
            });
            const data = await response.json();
            if (data.collaborations) {
                setCollaborations(data.collaborations);
            }
        } catch (err) {
            console.error('Failed to fetch collaborations:', err);
        } finally {
            setLoadingCollaborations(false);
        }
    };

    // Load collaborations when authenticated and on manage-collaborations tab
    useEffect(() => {
        if (isAuthenticated && activeTab === 'manage-collaborations') {
            fetchCollaborations();
            fetchCollabQuestions();
        }
    }, [isAuthenticated, activeTab]);

    const fetchCollabQuestions = async () => {
        setLoadingCollabQuestions(true);
        try {
            const response = await fetch('/api/collaboration?action=questions');
            const data = await response.json();
            if (data.questions) {
                setCollabQuestions(data.questions);
            }
        } catch (err) {
            console.error('Failed to fetch collab questions:', err);
        } finally {
            setLoadingCollabQuestions(false);
        }
    };

    const handleSaveCollabQuestions = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/collaboration?action=questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ questions: collabQuestions })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save questions');

            setResult({ type: 'success', message: 'Questions updated successfully!' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!adminKey.trim()) return;

        setLoginLoading(true);
        setLoginError('');

        try {
            const response = await fetch('/api/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ action: 'verify-admin' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Invalid admin key');
            }

            // Success - save key and authenticate
            sessionStorage.setItem('adminKey', adminKey);
            setIsAuthenticated(true);
        } catch (err) {
            setLoginError(err.message || 'Unauthorized - Invalid admin key');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminKey');
        setAdminKey('');
        setIsAuthenticated(false);
    };

    const handleBlogChange = (e) => {
        const { name, value } = e.target;
        setBlogData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug from title
        if (name === 'title') {
            const slug = value
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setBlogData(prev => ({ ...prev, slug }));
        }
    };

    const handleQuestionAdd = () => {
        setCollabQuestions([...collabQuestions, { id: Date.now().toString(), label: '', type: 'text', required: true }]);
    };

    const handleQuestionChange = (id, field, value) => {
        setCollabQuestions(collabQuestions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const handleQuestionRemove = (id) => {
        if (!confirm('Are you sure you want to remove this question?')) return;
        setCollabQuestions(collabQuestions.filter(q => q.id !== id));
    };

    const addImageUrl = () => {
        setImageUrls([...imageUrls, '']);
    };

    const removeImageUrl = (index) => {
        const newUrls = imageUrls.filter((_, i) => i !== index);
        setImageUrls(newUrls.length ? newUrls : ['']);
    };

    const updateImageUrl = (index, value) => {
        const newUrls = [...imageUrls];
        newUrls[index] = value;
        setImageUrls(newUrls);
    };

    const handleCreateBlog = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Filter out empty image URLs
            const validImages = imageUrls.filter(url => url.trim());

            const payload = {
                ...blogData,
                images: validImages,
                tags: blogData.tags.split(',').map(t => t.trim()).filter(Boolean),
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };

            const response = await fetch('/api/blog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create blog');
            }

            setResult({
                type: 'success',
                message: 'Blog created successfully!',
                blog: data.blog
            });

            // Reset form
            setBlogData({
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                author: 'E-Cell DYPIU',
                category: 'Entrepreneurship',
                readTime: '5 min read',
                tags: '',
                images: []
            });
            setImageUrls(['']);

            // Set notification data for quick notify
            setNotifyData({
                blogId: data.blog?.id,
                title: payload.title,
                excerpt: payload.excerpt,
                url: `https://ecelldypiu.in/blogs/${payload.slug}`,
                category: payload.category
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch subscribers for selection modal
    const fetchSubscribers = async () => {
        setLoadingSubscribers(true);
        setError(null);
        try {
            const response = await fetch('/api/subscriber', {
                headers: {
                    'Authorization': `Bearer ${adminKey}`
                }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch subscribers');
            }

            if (data.subscribers) {
                setSubscribers(data.subscribers);
                setSelectedSubscribers(data.subscribers.map(s => s.email)); // Select all by default
            }
        } catch (err) {
            console.error('Failed to fetch subscribers:', err);
            setError(`Failed to load subscribers: ${err.message}`);
        } finally {
            setLoadingSubscribers(false);
        }
    };

    // Open subscriber selection modal
    const openSubscriberModal = async () => {
        setShowSubscriberModal(true);
        await fetchSubscribers();
    };

    // Toggle individual subscriber selection
    const toggleSubscriber = (email) => {
        setSelectedSubscribers(prev =>
            prev.includes(email)
                ? prev.filter(e => e !== email)
                : [...prev, email]
        );
    };

    // Select all subscribers
    const selectAllSubscribers = () => {
        setSelectedSubscribers(subscribers.map(s => s.email));
    };

    // Deselect all subscribers
    const deselectAllSubscribers = () => {
        setSelectedSubscribers([]);
    };

    const handleSendNotification = async () => {
        if (selectedSubscribers.length === 0) {
            setError('Please select at least one subscriber');
            return;
        }

        setShowSubscriberModal(false);
        setSubscriberSearch('');
        setLoading(true);
        setError(null);

        try {
            // Get the selected subscriber objects with name and email
            const selectedSubs = subscribers.filter(s => selectedSubscribers.includes(s.email));

            const response = await fetch('/api/blog?action=notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    title: notifyData.title,
                    excerpt: notifyData.excerpt,
                    url: notifyData.url,
                    category: notifyData.category || 'Blog',
                    selectedSubscribers: selectedSubs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send notifications');
            }

            setResult({
                type: 'notification',
                message: `Notifications sent to ${data.results?.sent || 0} of ${data.results?.validSubscribers || 0} subscribers!`,
                details: data.results?.details || [],
                sent: data.results?.sent || 0,
                failed: data.results?.failed || 0,
                total: data.results?.validSubscribers || 0,
                totalDocs: data.results?.totalDocs || 0,
                skipped: data.results?.skippedDocs || 0,
                skippedDetails: data.results?.skipped || []
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBlog = async (blogId, blogSlug) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;

        try {
            const response = await fetch('/api/blog', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ id: blogId, slug: blogSlug })
            });

            if (!response.ok) {
                throw new Error('Failed to delete blog');
            }

            fetchBlogs();
        } catch (err) {
            setError(err.message);
        }
    };

    // Handle collaboration actions
    const handleCollabAction = async (id, action) => {
        const actionText = action === 'delete' ? 'delete' : `${action}`;
        if (!confirm(`Are you sure you want to ${actionText} this collaboration?${action === 'delete' ? ' This cannot be undone.' : ''}`)) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const method = action === 'delete' ? 'DELETE' : 'POST';
            const body = action === 'delete' ? JSON.stringify({ id }) : JSON.stringify({ id, action });

            const response = await fetch('/api/collaboration?action=manage', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Failed to ${action} collaboration`);
            }

            setResult({
                type: 'success',
                message: `Collaboration ${action === 'delete' ? 'deleted' : action + 'd'} successfully!`
            });

            // Refresh the list
            fetchCollaborations();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Get filtered collaborations
    const getFilteredCollaborations = () => {
        if (collabFilter === 'all') return collaborations;
        return collaborations.filter(c => c.status === collabFilter);
    };

    // Fetch subscribers for manage-subscribers tab
    const fetchSubscribersForManagement = async () => {
        setLoadingSubscribers(true);
        try {
            const response = await fetch('/api/subscriber', {
                headers: {
                    'Authorization': `Bearer ${adminKey}`
                }
            });
            const data = await response.json();
            if (data.subscribers) {
                setSubscribers(data.subscribers);
            }
        } catch (err) {
            console.error('Failed to fetch subscribers:', err);
            setError('Failed to load subscribers');
        } finally {
            setLoadingSubscribers(false);
        }
    };

    // Add new subscriber
    const handleAddSubscriber = async (e) => {
        e.preventDefault();
        setAddingSubscriber(true);
        setError(null);

        try {
            const response = await fetch('/api/subscriber?action=add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify(newSubscriber)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add subscriber');
            }

            // Reset form and refresh list
            setNewSubscriber({ name: '', email: '', phone: '', college: '' });
            fetchSubscribersForManagement();
            setResult({ type: 'success', message: 'Subscriber added successfully!' });
        } catch (err) {
            setError(err.message);
        } finally {
            setAddingSubscriber(false);
        }
    };

    // Delete subscriber
    const handleDeleteSubscriber = async (subscriberId) => {
        if (!confirm('Are you sure you want to remove this subscriber?')) return;

        setDeletingSubscriber(subscriberId);
        setError(null);

        try {
            const response = await fetch('/api/subscriber', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ id: subscriberId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete subscriber');
            }

            // Refresh list
            fetchSubscribersForManagement();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingSubscriber(null);
        }
    };

    // Load subscribers when manage-subscribers tab or dashboard is active
    useEffect(() => {
        if (isAuthenticated && (activeTab === 'manage-subscribers' || activeTab === 'dashboard')) {
            fetchSubscribersForManagement();
        }
    }, [isAuthenticated, activeTab]);

    // Fetch team applications
    const fetchApplications = async () => {
        setLoadingApplications(true);
        try {
            const response = await fetch('/api/event?action=list-applications', {
                headers: {
                    'Authorization': `Bearer ${adminKey}`
                }
            });
            const data = await response.json();
            if (data.applications) {
                setApplications(data.applications);
            }
        } catch (err) {
            console.error('Failed to fetch applications:', err);
            setError('Failed to load team applications');
        } finally {
            setLoadingApplications(false);
        }
    };

    const handleUpdateAppStatus = async (appId, newStatus, email, name) => {
        if (!confirm(`Are you sure you want to mark this application as '${newStatus}'?`)) return;
        
        try {
            const response = await fetch('/api/event?action=update-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    applicationId: appId,
                    updates: { status: newStatus }
                })
            });
            
            if (!response.ok) throw new Error('Failed to update status');
            
            // Optionally, send an email to the candidate if selected or rejected
            if (newStatus === 'selected') {
                await fetch('/api/mailer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminKey}`
                    },
                    body: JSON.stringify({
                        to: 'manual',
                        manualEmails: email,
                        type: 'generic',
                        subject: 'Application Update - E-Cell DYPIU',
                        data: {
                            body: `<div style="font-family:Segoe UI,Arial,sans-serif;color:#ffffff;line-height:1.6;font-size:14px;">\n<p style="margin:0 0 12px;">Dear ${name},</p>\n<p style="margin:0 0 10px;">&nbsp;</p>\n<p style="margin:0 0 12px;">Congratulations! You have been selected for the next round of interviews.</p>\n<p style="margin:0 0 12px;">You will be notified of the time and schedule soon.</p>\n<p style="margin:0 0 10px;">&nbsp;</p>\n<p style="margin:0 0 12px;">Best regards,</p>\n<p style="margin:0 0 12px;">Team E-Cell DYPIU</p>\n</div>`
                        }
                    })
                });
            }
            
            alert(`Application marked as ${newStatus} successfully.`);
            setViewingApp(null);
            fetchApplications(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteApp = async (appId) => {
        if (!confirm('Are you sure you want to delete this application permanently? The candidate will NOT be notified.')) return;
        
        try {
            const response = await fetch('/api/event?action=delete-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ applicationId: appId })
            });
            
            if (!response.ok) throw new Error('Failed to delete application');
            
            alert('Application deleted successfully.');
            setViewingApp(null);
            fetchApplications(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    };
    // Load team applications when manage-applications or dashboard is active
    useEffect(() => {
        if (isAuthenticated && (activeTab === 'manage-applications' || activeTab === 'dashboard')) {
            fetchApplications();
        }
    }, [isAuthenticated, activeTab]);

    const toggleApplicationSelection = (id) => {
        setSelectedApplications(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const selectAllApplications = (appList) => {
        setSelectedApplications(appList.map(app => app.id));
    };

    const deselectAllApplications = () => {
        setSelectedApplications([]);
    };

    const handleExportApplicationsCSV = (appList) => {
        if (!appList || appList.length === 0) {
            alert('No applications to export.');
            return;
        }

        const headers = ['Full Name', 'PRN', 'Division', 'Email', 'Contact Number', 'Role', 'Time Management Score', 'Submitted Date'];
        const rows = appList.map(app => [
            app.fullName || '',
            app.prn || '',
            app.division || '',
            app.email || '',
            app.contactNumber || '',
            app.role || '',
            app.timeManagementRating || '',
            app.submittedAt ? new Date(app.submittedAt).toLocaleString() : ''
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ECell_Team_Applications_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateInterviewHtmlTemplate = (data) => {
        const roleText = data.role || '{role}';
        const dateText = data.date || '{date}';
        const timeText = data.time || '{time}';
        const venueText = data.venue || '{venue}';
        const notesText = (data.notes || '').replace(/\n/g, '<br/>');

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Schedule - E-Cell DYPIU</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #18181b; border: 4px solid #ffffff; border-radius: 20px; overflow: hidden; max-width: 600px; width: 100%;">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #FFB22C; padding: 25px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000000; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; font-family: Arial, sans-serif;">
                                E-CELL DYPIU
                            </h1>
                            <p style="margin: 5px 0 0 0; color: #000000; font-size: 13px; font-weight: bold; font-family: Arial, sans-serif;">
                                TEAM SELECTION INTERVIEW INVITATION
                            </p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 35px 40px; color: #ffffff;">
                            <p style="font-size: 17px; margin: 0 0 20px 0; line-height: 1.5;">
                                Dear <strong>{name}</strong>,
                            </p>
                            <p style="color: #e4e4e7; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                Thank you for applying to join <strong>E-Cell DYPIU</strong>! Based on your application review, we are pleased to invite you for an interview round.
                            </p>
                            
                            <!-- Interview Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000; border: 2px solid #FFB22C; border-radius: 12px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px 0; color: #FFB22C; font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #27272a; padding-bottom: 8px;">Interview Schedule Details</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="padding: 6px 0; color: #a1a1aa; font-size: 14px; width: 110px; font-weight: bold;">ROLE:</td>
                                                <td style="padding: 6px 0; color: #FFB22C; font-size: 14px; font-weight: bold;">${roleText}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #a1a1aa; font-size: 14px; font-weight: bold;">DATE:</td>
                                                <td style="padding: 6px 0; color: #ffffff; font-size: 14px;">${dateText}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #a1a1aa; font-size: 14px; font-weight: bold;">TIME / SLOT:</td>
                                                <td style="padding: 6px 0; color: #ffffff; font-size: 14px;">${timeText}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 6px 0; color: #a1a1aa; font-size: 14px; font-weight: bold;">LOCATION:</td>
                                                <td style="padding: 6px 0; color: #ffffff; font-size: 14px;">${venueText}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            ${notesText ? `
                            <div style="background-color: #27272a; padding: 18px; border-radius: 10px; margin-bottom: 25px;">
                                <h4 style="margin: 0 0 8px 0; color: #FFB22C; font-size: 14px; text-transform: uppercase;">Important Instructions / Notes</h4>
                                <p style="color: #e4e4e7; font-size: 14px; line-height: 1.5; margin: 0;">${notesText}</p>
                            </div>
                            ` : ''}

                            ${data.buttonUrl ? `
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 15px 0;">
                                        <a href="${data.buttonUrl}" target="_blank" style="display: inline-block; background-color: #FFB22C; color: #000000; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 35px; border-radius: 8px; text-transform: uppercase; border: 3px solid #ffffff;">
                                            ${data.buttonText || 'Join Interview / Confirm Slot'}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 25px 0 0 0;">
                                Best of luck! We look forward to meeting you.<br/><br/>
                                Warm regards,<br/>
                                <strong>Team E-Cell DYPIU</strong>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0c0c0e; padding: 25px 30px; text-align: center; border-top: 2px solid #27272a;">
                            <p style="margin: 0; color: #71717a; font-size: 12px;">
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
    };

    const handleSendInterviewScheduleEmails = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (selectedApplications.length === 0) {
            setError('Please select at least one applicant.');
            return;
        }

        setSendingInterviewMail(true);
        setError(null);

        const selectedAppDocs = applications.filter(app => selectedApplications.includes(app.id));
        const selectedSubscribers = selectedAppDocs.map(app => ({
            name: app.fullName || app.email.split('@')[0],
            email: app.email,
            role: getRoleLabel(app.role)
        }));

        let payloadData = {};
        if (interviewData.useCustomHtml && interviewData.customHtml) {
            payloadData = {
                customHtml: interviewData.customHtml,
                role: interviewData.role || 'E-Cell Team Member',
                date: interviewData.date,
                time: interviewData.time,
                venue: interviewData.venue
            };
        } else {
            const compiledHtml = generateInterviewHtmlTemplate(interviewData);
            payloadData = {
                customHtml: compiledHtml,
                role: interviewData.role || (selectedAppDocs.length === 1 ? getRoleLabel(selectedAppDocs[0].role) : 'E-Cell Team Role'),
                date: interviewData.date,
                time: interviewData.time,
                venue: interviewData.venue,
                notes: interviewData.notes,
                buttonText: interviewData.buttonText,
                buttonUrl: interviewData.buttonUrl
            };
        }

        try {
            const response = await fetch('/api/mailer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    to: 'selected',
                    type: 'interview',
                    subject: interviewData.subject,
                    data: payloadData,
                    selectedSubscribers
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to dispatch interview emails');
            }

            setShowInterviewModal(false);
            setResult({
                type: 'notification',
                message: `Interview emails dispatched successfully to ${data.results?.sent || 0} candidate(s)!`,
                details: data.results?.details || [],
                sent: data.results?.sent || 0,
                failed: data.results?.failed || 0,
                total: data.results?.validSubscribers || 0,
                totalDocs: data.results?.totalDocs || 0
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setSendingInterviewMail(false);
        }
    };

    const getRoleLabel = (roleId) => {
        const rolesList = [
            { id: 'corporate_relations', label: 'Corporate Relations (high chances)' },
            { id: 'design', label: 'Design (high chances)' },
            { id: 'pr', label: 'PR (Public Relations)' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'social_media', label: 'Social Media' },
            { id: 'operations', label: 'Operations' },
            { id: 'technical', label: 'Technical' },
            { id: 'aesthetics', label: 'Aesthetics (Creatives)' }
        ];
        const found = rolesList.find(r => r.id === roleId);
        return found ? found.label : (roleId || 'General');
    };

    const getRoleBadgeStyle = (roleId) => {
        switch (roleId) {
            case 'corporate_relations': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
            case 'design': return 'bg-red-500/20 text-red-400 border-red-500/40';
            case 'pr': return 'bg-pink-500/20 text-pink-400 border-pink-500/40';
            case 'marketing': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
            case 'social_media': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
            case 'operations': return 'bg-green-500/20 text-green-400 border-green-500/40';
            case 'technical': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
            case 'aesthetics': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
            default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
        }
    };

    const roleQuestionsMap = {
        corporate_relations: [
            { key: 'cr_why', label: 'Why Corporate Relations?' },
            { key: 'cr_first_message', label: 'First outreach message & mutual benefit strategy' },
            { key: 'cr_gameplan', label: '2-day ₹20k sponsorship game plan' },
            { key: 'cr_pitch', label: 'Legacy: 2-sentence sponsor pitch' }
        ],
        design: [
            { key: 'design_why', label: 'Why Design?' },
            { key: 'design_poster', label: '30-min emergency poster strategy' },
            { key: 'design_software', label: 'Tools & software used' },
            { key: 'design_portfolio', label: 'Portfolio link' }
        ],
        pr: [
            { key: 'pr_experience', label: 'Conflict/persuasion experience' },
            { key: 'pr_campaign', label: '4-day registration campaign' },
            { key: 'pr_collab', label: 'Inter-college E-Cell collaboration approach' },
            { key: 'pr_why', label: 'Legacy: Why PR?' },
            { key: 'pr_scenario', label: 'Legacy: Crowd attraction strategy' }
        ],
        marketing: [
            { key: 'marketing_urgency', label: 'Creating ticket sales urgency' },
            { key: 'marketing_strategy', label: 'Stuck registrations 5-day action plan' },
            { key: 'marketing_adapt', label: 'Low conversion campaign fix' },
            { key: 'marketing_promotion', label: 'Legacy: College event promotion strategy' }
        ],
        social_media: [
            { key: 'sm_format', label: 'Highest engagement format' },
            { key: 'sm_complex', label: 'Explaining complex initiatives' },
            { key: 'sm_low_footage', label: 'Low footage posting strategy' },
            { key: 'sm_low_reach', label: 'Low reel reach audit checklist' },
            { key: 'sm_experience', label: 'Legacy: Social media experience' },
            { key: 'sm_skills', label: 'Legacy: Key skills' },
            { key: 'sm_brand', label: 'Legacy: Favorite brand/page' }
        ],
        operations: [
            { key: 'ops_jugaad', label: 'Most "jugaad" thing pulled off' },
            { key: 'ops_chaos', label: 'Event day chaos management' },
            { key: 'ops_forgot', label: 'Pre-event missing item decision' },
            { key: 'ops_prioritize', label: 'Legacy: Task prioritization' },
            { key: 'ops_crisis', label: 'Legacy: Crisis response plan' }
        ],
        technical: [
            { key: 'tech_project', label: 'Built code projects' },
            { key: 'tech_experience', label: 'Website / App / Event tech experience' }
        ],
        aesthetics: [
            { key: 'aesthetics_ideas', label: 'Tech event decoration theme idea' },
            { key: 'aesthetics_experience', label: 'Venue decoration / Stage setup experience' }
        ]
    };

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="bg-zinc-900 border-4 border-white p-8 rounded-2xl max-w-md w-full shadow-[8px_8px_0px_#FFB22C]">
                    <div className="flex items-center justify-center mb-6">
                        <Lock className="w-12 h-12 text-brand-yellow" />
                    </div>
                    <h1 className="text-2xl font-black uppercase text-center mb-2">
                        ADMIN <span className="text-brand-yellow">PORTAL</span>
                    </h1>
                    <p className="text-gray-400 text-center mb-6 text-sm">
                        E-Cell DYPIU Blog Management
                    </p>
                    <form onSubmit={handleLogin}>
                        {loginError && (
                            <div className="bg-red-900/50 border-2 border-red-500 text-red-400 p-4 rounded-lg mb-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="font-bold text-sm">{loginError}</span>
                            </div>
                        )}
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => { setAdminKey(e.target.value); setLoginError(''); }}
                            placeholder="Enter Admin API Key"
                            className={`w-full bg-black border-2 p-4 text-white rounded-lg mb-4 focus:border-brand-yellow focus:outline-none ${loginError ? 'border-red-500' : 'border-zinc-700'
                                }`}
                            required
                            disabled={loginLoading}
                        />
                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full bg-brand-yellow text-black font-black py-4 rounded-lg uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loginLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-20">
            {/* Header */}
            <div className="bg-zinc-900 border-b-4 border-white">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-black uppercase">
                        ADMIN <span className="text-brand-yellow">PORTAL</span>
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                {/* Alerts */}
                {error && (
                    <div className="bg-red-900/20 border-2 border-red-500 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {result && (
                    <div className={`border-2 rounded-xl mb-6 ${result.type === 'notification' ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-green-900/20 border-green-500 text-green-400'}`}>
                        <div className="p-4 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p className="font-bold">{result.message}</p>
                        </div>

                        {/* Notification Results Checklist */}
                        {result.type === 'notification' && result.details && result.details.length > 0 && (
                            <div className="border-t border-blue-500/30 p-4 bg-black/30 max-h-96 overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-white font-bold uppercase text-sm">Delivery Report</h4>
                                    <div className="flex gap-4 text-xs flex-wrap">
                                        <span className="text-green-400">✓ Sent: {result.sent}</span>
                                        {result.failed > 0 && <span className="text-red-400">✗ Failed: {result.failed}</span>}
                                        <span className="text-gray-400">Valid: {result.total}</span>
                                        {result.skipped > 0 && <span className="text-yellow-400">⚠ Skipped: {result.skipped}</span>}
                                        <span className="text-zinc-500">Total Docs: {result.totalDocs}</span>
                                    </div>
                                </div>

                                {/* Skipped documents warning */}
                                {result.skipped > 0 && (
                                    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
                                        <p className="text-yellow-400 text-sm font-bold mb-2">⚠️ {result.skipped} documents skipped (no email field)</p>
                                        <p className="text-yellow-500/70 text-xs mb-2">These documents in your Firebase don't have an 'email' field:</p>
                                        {result.skippedDetails && result.skippedDetails.length > 0 && (
                                            <ul className="text-xs text-yellow-400/80 space-y-1 max-h-24 overflow-y-auto">
                                                {result.skippedDetails.map((doc, idx) => (
                                                    <li key={idx} className="font-mono">
                                                        • {doc.id} (fields: {doc.fields.join(', ') || 'none'})
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {result.details.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-3 rounded-lg ${item.status === 'sent'
                                                ? 'bg-green-900/20 border border-green-800'
                                                : 'bg-red-900/20 border border-red-800'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.status === 'sent' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                                                    }`}>
                                                    {item.status === 'sent' ? '✓' : '✗'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{item.name || 'Unknown'}</p>
                                                    <p className="text-gray-400 text-xs">{item.email}</p>
                                                    {item.error && (
                                                        <p className="text-red-400 text-xs mt-1 font-mono">{item.error}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold uppercase flex-shrink-0 ${item.status === 'sent' ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {item.status === 'sent' ? 'Delivered' : 'Failed'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {result.failed > 0 && (
                                    <p className="text-yellow-400 text-xs mt-4">
                                        ⚠️ Some emails failed. This could be due to invalid email addresses or rate limiting.
                                    </p>
                                )}
                            </div>
                        )}

                        {result.type === 'success' && notifyData.title && (
                            <div className="border-t border-green-500/30 p-6 bg-black/30">
                                <h3 className="text-white font-black uppercase mb-4 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-brand-yellow" />
                                    Send Notification to Subscribers
                                </h3>
                                <div className="bg-zinc-900 rounded-lg p-4 mb-4 border border-zinc-700">
                                    <p className="text-white font-bold mb-1">{notifyData.title}</p>
                                    <p className="text-gray-400 text-sm mb-2">{notifyData.excerpt}</p>
                                    <p className="text-brand-yellow text-xs font-mono">{notifyData.url}</p>
                                </div>
                                <button
                                    onClick={openSubscriberModal}
                                    disabled={loading}
                                    className="w-full bg-brand-yellow text-black py-4 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-3 hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending Notifications...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-5 h-5" />
                                            Select Subscribers & Send
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Welcome to <span className="text-brand-yellow">Admin Portal</span>
                        </h2>

                        {/* Quick Stats Horizontal Bar */}
                        <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-4 mb-6 flex flex-wrap gap-6 items-center justify-between">
                            <h3 className="text-lg font-black uppercase flex items-center gap-2 m-0 text-white">
                                <Eye className="w-5 h-5 text-brand-yellow" />
                                Quick Stats
                            </h3>
                            <div className="flex flex-wrap gap-4 md:gap-8 items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">Events</span>
                                    <span className="text-brand-yellow font-black text-lg">5</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">Dynamic Blogs</span>
                                    <span className="text-brand-yellow font-black text-lg">{blogs.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">Legacy Blogs</span>
                                    <span className="text-white font-black text-lg">3</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">Subscribers</span>
                                    <span className="text-green-500 font-black text-lg">{subscribers.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">Applications</span>
                                    <span className="text-pink-500 font-black text-lg">{applications.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Team Applications Card */}
                            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-pink-500 rounded-xl flex items-center justify-center">
                                        <Users className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase">Team Applications</h3>
                                        <p className="text-gray-400 text-sm font-medium">Review /apply responses & schedule interviews</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <button
                                        onClick={() => { setActiveTab('manage-applications'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-pink-500 hover:text-white transition-colors text-left group"
                                    >
                                        <List className="w-4 h-4 text-pink-500 group-hover:text-white" />
                                        <span>View Responses ({applications.length})</span>
                                    </button>
                                </div>
                            </div>
                            {/* Blog Section Card */}
                            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-brand-yellow rounded-xl flex items-center justify-center">
                                        <FileText className="w-7 h-7 text-black" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase">Blog Management</h3>
                                        <p className="text-gray-400 text-sm">Create, manage & notify</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <button
                                        onClick={() => { setActiveTab('create-blog'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-brand-yellow hover:text-black transition-colors text-left group"
                                    >
                                        <PlusCircle className="w-4 h-4 text-brand-yellow group-hover:text-black" />
                                        <span>Push New Blog</span>
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('manage-blogs'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-brand-yellow hover:text-black transition-colors text-left group"
                                    >
                                        <List className="w-4 h-4 text-brand-yellow group-hover:text-black" />
                                        <span>Manage Blogs</span>
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('notify'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-brand-yellow hover:text-black transition-colors text-left group"
                                    >
                                        <Bell className="w-4 h-4 text-brand-yellow group-hover:text-black" />
                                        <span>Send Notification</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mailer & Contacts Card */}
                            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
                                        <Mail className="w-7 h-7 text-black" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase">Mailer & Contacts</h3>
                                        <p className="text-gray-400 text-sm">Send updates & manage directory</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <button
                                        onClick={() => { setActiveTab('manage-subscribers'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-green-500 hover:text-black transition-colors text-left group"
                                    >
                                        <Users className="w-4 h-4 text-green-500 group-hover:text-black" />
                                        <span>Contacts Directory</span>
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('mailer-announcement'); setMailerType('announcement'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-green-500 hover:text-black transition-colors text-left group"
                                    >
                                        <PlusCircle className="w-4 h-4 text-green-500 group-hover:text-black" />
                                        <span>Announcement Creator</span>
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('mailer-event'); setMailerType('event'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-green-500 hover:text-black transition-colors text-left group"
                                    >
                                        <Calendar className="w-4 h-4 text-green-500 group-hover:text-black" />
                                        <span>Event Notifier</span>
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('mailer-generic'); setMailerType('generic'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-green-500 hover:text-black transition-colors text-left group"
                                    >
                                        <Send className="w-4 h-4 text-green-500 group-hover:text-black" />
                                        <span>Direct Custom Composer</span>
                                    </button>
                                </div>
                            </div>

                            {/* Event Management Card */}
                            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-brand-yellow rounded-xl flex items-center justify-center">
                                        <Calendar className="w-7 h-7 text-black" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase">Event Management</h3>
                                        <p className="text-gray-400 text-sm">Create, edit & manage events</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setActiveTab('manage-events'); setError(null); setResult(null); }}
                                    className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-brand-yellow hover:text-black transition-colors text-left group"
                                >
                                    <List className="w-4 h-4 text-brand-yellow group-hover:text-black" />
                                    <span>Manage Events</span>
                                </button>
                            </div>

                            {/* Certificate Management Card */}
                            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
                                        <Award className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase">Certificate Manager</h3>
                                        <p className="text-gray-400 text-sm">Configure & manage event certificates</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <button
                                        onClick={() => { setActiveTab('certificates'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-purple-500 hover:text-white transition-colors text-left group"
                                    >
                                        <Award className="w-4 h-4 text-purple-500 group-hover:text-white" />
                                        <span>Manage Certificates</span>
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('certificates'); setError(null); setResult(null); }}
                                        className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-purple-500 hover:text-white transition-colors text-left group"
                                    >
                                        <Send className="w-4 h-4 text-purple-500 group-hover:text-white" />
                                        <span>Dispatch Certificates</span>
                                    </button>
                                </div>
                            </div>

                            {/* Collaborations Management Card */}
                            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <Building className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase">Collaborations</h3>
                                        <p className="text-gray-400 text-sm">Review & manage proposals</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setActiveTab('manage-collaborations'); setError(null); setResult(null); }}
                                    className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-blue-500 hover:text-white transition-colors text-left group"
                                >
                                    <Building className="w-4 h-4 text-blue-500 group-hover:text-white" />
                                    <span>Manage Collaborations</span>
                                </button>
                            </div>

                            {/* Link Shortener Card */}
                            <div className="bg-zinc-900 border-4 border-zinc-700 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-brand-yellow rounded-xl flex items-center justify-center">
                                        <LinkIcon className="w-7 h-7 text-black" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase">Link Shortener</h3>
                                        <p className="text-gray-400 text-sm">Create & manage short URLs</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setActiveTab('link-shortener'); setError(null); setResult(null); }}
                                    className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-brand-yellow hover:text-black transition-colors text-left group"
                                >
                                    <LinkIcon className="w-4 h-4 text-brand-yellow group-hover:text-black" />
                                    <span>Link Shortener</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Team Applications Tab */}
                {activeTab === 'manage-applications' && (() => {
                    const filteredApplications = applications.filter(app => {
                        const appStatus = app.status || 'pending';
                        const matchesStatus = appStatus === appStatusFilter;
                        const matchesSearch = !appSearch || (
                            (app.fullName || '').toLowerCase().includes(appSearch.toLowerCase()) ||
                            (app.email || '').toLowerCase().includes(appSearch.toLowerCase()) ||
                            (app.prn || '').toLowerCase().includes(appSearch.toLowerCase()) ||
                            (app.division || '').toLowerCase().includes(appSearch.toLowerCase()) ||
                            (app.contactNumber || '').includes(appSearch)
                        );
                        const matchesRole = appRoleFilter === 'all' || app.role === appRoleFilter;
                        return matchesStatus && matchesSearch && matchesRole;
                    });

                    return (
                        <div className="max-w-7xl mx-auto space-y-6">
                            <button
                                onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Back to Dashboard</span>
                            </button>

                            {/* Header Title & Actions */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border-4 border-zinc-700 p-6 rounded-2xl">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black uppercase text-white flex items-center gap-3">
                                        <Users className="w-8 h-8 text-brand-yellow" />
                                        Team Application <span className="text-brand-yellow">Responses</span>
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Manage form submissions from /apply, review detailed Q&A answers, and dispatch interview schedule emails.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={() => fetchApplications()}
                                        disabled={loadingApplications}
                                        className="px-4 py-2.5 bg-zinc-800 border-2 border-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-700 flex items-center gap-2"
                                    >
                                        <Loader2 className={`w-4 h-4 ${loadingApplications ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => handleExportApplicationsCSV(filteredApplications)}
                                        className="px-4 py-2.5 bg-zinc-800 border-2 border-zinc-600 rounded-xl text-sm font-bold hover:bg-white hover:text-black transition-colors flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (selectedApplications.length === 0) {
                                                alert('Please select at least one application response to schedule an interview.');
                                                return;
                                            }
                                            setShowInterviewModal(true);
                                        }}
                                        className="px-5 py-2.5 bg-brand-yellow text-black font-black uppercase text-sm rounded-xl hover:bg-white transition-colors border-2 border-black flex items-center gap-2 shadow-[4px_4px_0px_#fff]"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Schedule Interview ({selectedApplications.length})
                                    </button>
                                </div>
                            </div>

                            {/* Status Tabs */}
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => setAppStatusFilter('pending')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase transition-colors border-2 ${appStatusFilter === 'pending' ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:border-gray-500 hover:text-white'}`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => setAppStatusFilter('selected')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase transition-colors border-2 ${appStatusFilter === 'selected' ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:border-gray-500 hover:text-white'}`}
                                >
                                    Selected
                                </button>
                                <button
                                    onClick={() => setAppStatusFilter('rejected')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase transition-colors border-2 ${appStatusFilter === 'rejected' ? 'bg-brand-yellow text-black border-brand-yellow' : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:border-gray-500 hover:text-white'}`}
                                >
                                    Rejected
                                </button>
                            </div>

                            {/* Search & Role Filter Toolbar */}
                            <div className="bg-zinc-900 border-2 border-zinc-700 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:w-96">
                                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={appSearch}
                                        onChange={(e) => setAppSearch(e.target.value)}
                                        placeholder="Search name, email, PRN, phone..."
                                        className="w-full bg-black border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-brand-yellow focus:outline-none"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Filter Role:</span>
                                    <select
                                        value={appRoleFilter}
                                        onChange={(e) => setAppRoleFilter(e.target.value)}
                                        className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-yellow focus:outline-none font-bold"
                                    >
                                        <option value="all">All Roles ({applications.length})</option>
                                        <option value="pr">PR (Public Relations)</option>
                                        <option value="marketing">Marketing</option>
                                        <option value="social_media">Social Media</option>
                                        <option value="operations">Operations</option>
                                        <option value="technical">Technical</option>
                                        <option value="corporate_relations">Corporate Relations</option>
                                        <option value="design">Design</option>
                                        <option value="aesthetics">Aesthetics (Creatives)</option>
                                    </select>

                                    <div className="flex items-center gap-2 ml-2">
                                        <button
                                            onClick={() => selectAllApplications(filteredApplications)}
                                            className="text-xs text-brand-yellow font-bold hover:underline"
                                        >
                                            Select All ({filteredApplications.length})
                                        </button>
                                        <span className="text-zinc-600">|</span>
                                        <button
                                            onClick={deselectAllApplications}
                                            className="text-xs text-gray-400 font-bold hover:underline"
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Applications List */}
                            {loadingApplications ? (
                                <div className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-12 text-center text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-yellow" />
                                    <p className="font-bold">Fetching application responses from Firebase...</p>
                                </div>
                            ) : filteredApplications.length === 0 ? (
                                <div className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl p-12 text-center text-gray-400">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                                    <p className="font-bold text-lg text-white">No applications found</p>
                                    <p className="text-sm mt-1">Try clearing your search or role filter.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredApplications.map((app) => {
                                        const isSelected = selectedApplications.includes(app.id);
                                        return (
                                            <div
                                                key={app.id}
                                                className={`bg-zinc-900 border-2 rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                                    isSelected ? 'border-brand-yellow bg-zinc-900/90 shadow-[4px_4px_0px_#FFB22C]' : 'border-zinc-800 hover:border-zinc-700'
                                                }`}
                                            >
                                                <div className="flex items-start md:items-center gap-4">
                                                    <button
                                                        onClick={() => toggleApplicationSelection(app.id)}
                                                        className="mt-1 md:mt-0 text-brand-yellow flex-shrink-0"
                                                    >
                                                        {isSelected ? (
                                                            <CheckSquare className="w-6 h-6 text-brand-yellow" />
                                                        ) : (
                                                            <Square className="w-6 h-6 text-zinc-600 hover:text-white" />
                                                        )}
                                                    </button>

                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h3 className="text-lg font-black uppercase text-white">{app.fullName || 'Anonymous'}</h3>
                                                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase border ${getRoleBadgeStyle(app.role)}`}>
                                                                {getRoleLabel(app.role)}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                                            <span>PRN: <strong className="text-zinc-200">{app.prn || 'N/A'}</strong></span>
                                                            <span>Div: <strong className="text-zinc-200">{app.division || 'N/A'}</strong></span>
                                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-zinc-500" /> {app.email}</span>
                                                            {app.contactNumber && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-zinc-500" /> {app.contactNumber}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0">
                                                    <div className="text-right">
                                                        <div className="text-[10px] uppercase font-bold text-gray-400">Time Mgmt</div>
                                                        <div className="text-sm font-black text-brand-yellow">{app.timeManagementRating || '-'}/10</div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setViewingApp(app)}
                                                            className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-brand-yellow hover:text-brand-yellow rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> View Response
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Link Shortener Tab */}
                {activeTab === 'link-shortener' && (
                    <LinkShortener
                        adminKey={sessionStorage.getItem('adminKey') || adminKey}
                        onBack={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                    />
                )}

                {/* Event Manager Tab */}
                {activeTab === 'manage-events' && (
                    <div className="max-w-6xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <EventManager adminKey={sessionStorage.getItem('adminKey')} />
                    </div>
                )}

                {/* Certificate Manager Tab */}
                {activeTab === 'certificates' && (
                    <CertificateManager
                        adminKey={sessionStorage.getItem('adminKey')}
                        onBack={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                    />
                )}

                {/* Create Blog Tab */}
                {activeTab === 'create-blog' && (
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Create New <span className="text-brand-yellow">Blog</span>
                        </h2>

                        <form onSubmit={handleCreateBlog} className="space-y-6">
                            {/* Title & Slug */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Title <span className="text-brand-yellow">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={blogData.title}
                                        onChange={handleBlogChange}
                                        className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                        placeholder="Blog Title"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        URL Slug
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={blogData.slug}
                                        onChange={handleBlogChange}
                                        className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none font-mono text-sm"
                                        placeholder="auto-generated-from-title"
                                    />
                                </div>
                            </div>

                            {/* Author & Category */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        name="author"
                                        value={blogData.author}
                                        onChange={handleBlogChange}
                                        className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                        placeholder="E-Cell DYPIU"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Category
                                    </label>
                                    <select
                                        name="category"
                                        value={blogData.category}
                                        onChange={handleBlogChange}
                                        className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                    >
                                        <option value="Entrepreneurship">Entrepreneurship</option>
                                        <option value="Events">Events</option>
                                        <option value="Innovation">Innovation</option>
                                        <option value="Startup">Startup</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Insights">Insights</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Read Time
                                    </label>
                                    <input
                                        type="text"
                                        name="readTime"
                                        value={blogData.readTime}
                                        onChange={handleBlogChange}
                                        className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                        placeholder="5 min read"
                                    />
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-bold uppercase mb-2">
                                    Tags (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={blogData.tags}
                                    onChange={handleBlogChange}
                                    className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                    placeholder="E-Cell, Innovation, Event"
                                />
                            </div>

                            {/* Excerpt */}
                            <div>
                                <label className="block text-sm font-bold uppercase mb-2">
                                    Excerpt / Short Description <span className="text-brand-yellow">*</span>
                                </label>
                                <textarea
                                    name="excerpt"
                                    value={blogData.excerpt}
                                    onChange={handleBlogChange}
                                    rows={2}
                                    className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none resize-none"
                                    placeholder="Brief description shown on blog listing..."
                                    required
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-bold uppercase mb-2">
                                    Full Content <span className="text-brand-yellow">*</span>
                                </label>
                                <p className="text-gray-500 text-xs mb-2">
                                    Separate paragraphs with blank lines. Use double line breaks for section headings.
                                </p>
                                <textarea
                                    name="content"
                                    value={blogData.content}
                                    onChange={handleBlogChange}
                                    rows={12}
                                    className="w-full bg-zinc-900 border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none resize-none font-mono text-sm"
                                    placeholder="Write your blog content here...

Section Heading

Paragraph content goes here. Write naturally and separate paragraphs with blank lines.

Another Section

More content..."
                                    required
                                />
                            </div>

                            {/* Images */}
                            <div>
                                <label className="block text-sm font-bold uppercase mb-2">
                                    <Image className="w-4 h-4 inline mr-2" />
                                    Image URLs
                                </label>
                                <p className="text-gray-500 text-xs mb-3">
                                    Add image URLs. Place images in /public/blog/[slug]/ folder and use paths like /blog/slug/image.jpg
                                </p>
                                <div className="space-y-2">
                                    {imageUrls.map((url, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={url}
                                                onChange={(e) => updateImageUrl(index, e.target.value)}
                                                className="flex-1 bg-zinc-900 border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none text-sm"
                                                placeholder="/blog/slug/image1.jpg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImageUrl(index)}
                                                className="p-3 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addImageUrl}
                                        className="flex items-center gap-2 text-brand-yellow hover:text-white transition-colors text-sm font-bold"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Add Another Image
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-yellow text-black text-xl font-black uppercase py-5 border-4 border-black hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-[4px_4px_0px_#fff]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-6 h-6" />
                                        Creating Blog...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="w-6 h-6" />
                                        Publish Blog
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Manage Blogs Tab */}
                {activeTab === 'manage-blogs' && (
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Manage <span className="text-brand-yellow">Blogs</span>
                        </h2>

                        {/* Filter and Sort Controls */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            {/* Filter Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setBlogFilter('all')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${blogFilter === 'all'
                                        ? 'bg-brand-yellow text-black'
                                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    All Blogs
                                </button>
                                <button
                                    onClick={() => setBlogFilter('new')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${blogFilter === 'new'
                                        ? 'bg-green-500 text-black'
                                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    New
                                </button>
                                <button
                                    onClick={() => setBlogFilter('old')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${blogFilter === 'old'
                                        ? 'bg-zinc-500 text-white'
                                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                                        }`}
                                >
                                    <Archive className="w-4 h-4" />
                                    Old
                                </button>
                            </div>

                            {/* Sort Button */}
                            <button
                                onClick={() => setBlogSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                                className="px-4 py-2 bg-zinc-800 text-gray-400 rounded-lg font-bold text-sm hover:bg-zinc-700 transition-all flex items-center gap-2"
                            >
                                <ArrowUpDown className="w-4 h-4" />
                                {blogSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                            </button>
                        </div>

                        {/* Blog Stats */}
                        <div className="flex gap-4 mb-6 text-sm">
                            <span className="text-gray-400">
                                Total: <span className="text-white font-bold">{blogs.length + legacyBlogs.length}</span>
                            </span>
                            <span className="text-gray-400">
                                Dynamic: <span className="text-brand-yellow font-bold">{blogs.length}</span>
                            </span>
                            <span className="text-gray-400">
                                Legacy: <span className="text-zinc-500 font-bold">{legacyBlogs.length}</span>
                            </span>
                            <span className="text-gray-400">
                                Showing: <span className="text-white font-bold">{getAllBlogs().length}</span>
                            </span>
                        </div>

                        {loadingBlogs ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                            </div>
                        ) : getAllBlogs().length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-zinc-900/50 rounded-xl border border-zinc-800 mb-8">
                                <List className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                <p>No blogs match the current filter.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {getAllBlogs().map((blog) => (
                                    <div
                                        key={blog.id}
                                        className={`border-2 rounded-xl p-6 transition-colors ${blog.isLegacy
                                            ? 'bg-zinc-900/50 border-zinc-800 opacity-80'
                                            : 'bg-zinc-900 border-zinc-700 hover:border-brand-yellow'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${blog.isLegacy
                                                        ? 'bg-zinc-700 text-gray-300'
                                                        : 'bg-brand-yellow text-black'
                                                        }`}>
                                                        {blog.category}
                                                    </span>
                                                    {/* NEW Badge */}
                                                    {!blog.isLegacy && isBlogNew(blog) && (
                                                        <span className="bg-green-500 text-black px-2 py-1 rounded text-xs font-bold flex items-center gap-1 animate-pulse">
                                                            <Sparkles className="w-3 h-3" />
                                                            NEW
                                                        </span>
                                                    )}
                                                    {/* OLD Badge for dynamic blogs older than 7 days */}
                                                    {!blog.isLegacy && !isBlogNew(blog) && (
                                                        <span className="bg-zinc-600 text-zinc-300 px-2 py-1 rounded text-xs font-bold">
                                                            OLD
                                                        </span>
                                                    )}
                                                    {/* LEGACY Badge */}
                                                    {blog.isLegacy && (
                                                        <span className="bg-zinc-800 text-zinc-500 px-2 py-1 rounded text-xs font-bold">
                                                            LEGACY
                                                        </span>
                                                    )}
                                                    <span className="text-gray-500 text-xs">
                                                        {blog.date}
                                                    </span>
                                                </div>
                                                <h3 className={`text-xl font-black mb-2 ${blog.isLegacy ? 'text-gray-300' : 'text-white'}`}>
                                                    {blog.title}
                                                </h3>
                                                <p className={`text-sm line-clamp-2 ${blog.isLegacy ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {blog.excerpt}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <a
                                                    href={`/blogs/${blog.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-zinc-800 text-gray-400 rounded-lg hover:bg-brand-yellow hover:text-black transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setNotifyData({
                                                            title: blog.title,
                                                            excerpt: blog.excerpt,
                                                            url: `https://ecelldypiu.in/blogs/${blog.slug}`,
                                                            category: blog.category
                                                        });
                                                        setActiveTab('notify');
                                                    }}
                                                    className="p-2 bg-blue-900/50 text-blue-400 rounded-lg hover:bg-blue-900 transition-colors"
                                                    title="Send Notification"
                                                >
                                                    <Bell className="w-5 h-5" />
                                                </button>
                                                {/* Delete button for all blogs (including legacy) */}
                                                <button
                                                    onClick={() => {
                                                        if (blog.isLegacy) {
                                                            // For legacy blogs, we can't delete from Firebase
                                                            // Instead show an info message
                                                            alert('Legacy blogs are hardcoded and cannot be deleted from here. Please remove them from the source code.');
                                                        } else {
                                                            handleDeleteBlog(blog.id, blog.slug);
                                                        }
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${blog.isLegacy
                                                        ? 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700 cursor-not-allowed'
                                                        : 'bg-red-900/50 text-red-400 hover:bg-red-900'
                                                        }`}
                                                    title={blog.isLegacy ? "Cannot delete legacy blogs" : "Delete"}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Notify Tab */}
                {activeTab === 'notify' && (
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Send <span className="text-brand-yellow">Notification</span>
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Send email notification to all newsletter subscribers about a new blog.
                        </p>

                        <div className="bg-zinc-900 border-4 border-white p-8 rounded-2xl shadow-[8px_8px_0px_#FFB22C]">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Blog Title <span className="text-brand-yellow">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={notifyData.title}
                                        onChange={(e) => setNotifyData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                        placeholder="Blog title for notification"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Excerpt
                                    </label>
                                    <textarea
                                        value={notifyData.excerpt}
                                        onChange={(e) => setNotifyData(prev => ({ ...prev, excerpt: e.target.value }))}
                                        rows={2}
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none resize-none"
                                        placeholder="Brief description for email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Blog URL
                                    </label>
                                    <input
                                        type="url"
                                        value={notifyData.url}
                                        onChange={(e) => setNotifyData(prev => ({ ...prev, url: e.target.value }))}
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                        placeholder="https://ecelldypiu.in/blogs/your-blog-slug"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={notifyData.category}
                                        onChange={(e) => setNotifyData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Entrepreneurship">Entrepreneurship</option>
                                        <option value="Events">Events</option>
                                        <option value="Innovation">Innovation</option>
                                        <option value="Startup">Startup</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Insights">Insights</option>
                                    </select>
                                </div>

                                <button
                                    onClick={openSubscriberModal}
                                    disabled={loading || !notifyData.title}
                                    className="w-full bg-brand-yellow text-black text-xl font-black uppercase py-4 border-4 border-black hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl mt-4"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin w-6 h-6" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-6 h-6" />
                                            Select Subscribers & Send
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Collaborations Tab */}
                {activeTab === 'manage-collaborations' && (
                    <div className="max-w-5xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Manage <span className="text-brand-yellow">Collaborations</span>
                        </h2>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['all', 'pending', 'approved', 'rejected'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setCollabFilter(filter)}
                                    className={`px-6 py-2 rounded-full font-bold uppercase transition-all duration-300 ${collabFilter === filter
                                        ? 'bg-brand-yellow text-black'
                                        : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {loadingCollaborations ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-10 h-10 animate-spin text-brand-yellow" />
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Collaborations List */}
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Proposals & Applications</h3>
                                    {getFilteredCollaborations().length === 0 ? (
                                        <div className="text-center py-20 border-4 border-dashed border-zinc-800 rounded-[2rem] bg-zinc-900/50">
                                            <h3 className="text-2xl font-black uppercase text-gray-500 mb-2">No Collaborations Found</h3>
                                            <p className="text-gray-400">There are no collaborations matching the '{collabFilter}' filter.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6">
                                            {getFilteredCollaborations().map((collab) => (
                                                <div key={collab.id} className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
                                                    <div className="flex flex-col md:flex-row gap-6">
                                                        {/* Details Section */}
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        {(() => {
                                                                            // Dynamically determine the title to show. First try 'organization' or 'name', otherwise pick the first string field.
                                                                            const keys = Object.keys(collab).filter(k => k !== 'id' && k !== 'status' && k !== 'createdAt');

                                                                            // find a key that looks like an organization or name
                                                                            let titleKey = keys.find(k => k.toLowerCase().includes('organization') || k.toLowerCase().includes('company'));
                                                                            if (!titleKey) {
                                                                                titleKey = keys.find(k => k.toLowerCase().includes('name'));
                                                                            }
                                                                            if (!titleKey && keys.length > 0) {
                                                                                titleKey = keys[0]; // fallback to first field
                                                                            }

                                                                            const titleValue = titleKey ? collab[titleKey] : 'Application #' + collab.id.substring(0, 6);

                                                                            return <h3 className="text-2xl font-black">{titleValue}</h3>;
                                                                        })()}
                                                                        {collab.status === 'pending' && <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-2 py-1 rounded text-xs font-bold uppercase">Pending</span>}
                                                                        {collab.status === 'approved' && <span className="bg-green-500/20 text-green-500 border border-green-500/50 px-2 py-1 rounded text-xs font-bold uppercase">Approved</span>}
                                                                        {collab.status === 'rejected' && <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-1 rounded text-xs font-bold uppercase">Rejected</span>}
                                                                    </div>
                                                                </div>
                                                                <span className="text-gray-500 text-sm whitespace-nowrap">
                                                                    {collab.createdAt ? new Date(collab.createdAt._seconds * 1000 || collab.createdAt).toLocaleDateString() : 'N/A'}
                                                                </span>
                                                            </div>

                                                            {/* Render All Application Details */}
                                                            <div className="space-y-4">
                                                                <h4 className="text-sm font-bold uppercase text-brand-yellow border-b border-zinc-800 pb-2">Application Details</h4>
                                                                <div className="grid gap-4">
                                                                    {Object.keys(collab)
                                                                        .filter(key => key !== 'id' && key !== 'status' && key !== 'createdAt')
                                                                        .map(key => (
                                                                            <div key={key} className="bg-black/30 rounded-lg p-3 border border-zinc-800/50">
                                                                                <h5 className="text-xs font-bold uppercase text-gray-400 mb-1">{key}</h5>
                                                                                {/* Render based on value type or known link/email patterns if needed, for now just strings */}
                                                                                {typeof collab[key] === 'string' && collab[key].startsWith('http') ? (
                                                                                    <a href={collab[key]} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-yellow hover:underline break-all">
                                                                                        {collab[key]}
                                                                                    </a>
                                                                                ) : typeof collab[key] === 'string' && collab[key].includes('@') && !collab[key].includes(' ') ? (
                                                                                    <a href={`mailto:${collab[key]}`} className="text-sm text-brand-yellow hover:underline">
                                                                                        {collab[key]}
                                                                                    </a>
                                                                                ) : (
                                                                                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{collab[key]?.toString() || 'N/A'}</p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>

                                                            {/* Contact details removed, rendering everything above instead */}
                                                        </div>

                                                        {/* Actions Section */}
                                                        <div className="flex flex-row md:flex-col gap-3 justify-center md:justify-start pt-4 border-t border-zinc-800 md:border-t-0 md:border-l md:pl-6">
                                                            {collab.status !== 'approved' && (
                                                                <button
                                                                    onClick={() => handleCollabAction(collab.id, 'approve')}
                                                                    disabled={loading}
                                                                    className="flex-1 md:flex-none bg-green-900/40 text-green-500 border border-green-500/50 px-4 py-2 rounded-xl font-bold uppercase hover:bg-green-500 hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                                >
                                                                    <CheckSquare className="w-4 h-4" /> Approve
                                                                </button>
                                                            )}
                                                            {collab.status !== 'rejected' && (
                                                                <button
                                                                    onClick={() => handleCollabAction(collab.id, 'reject')}
                                                                    disabled={loading}
                                                                    className="flex-1 md:flex-none bg-orange-900/40 text-orange-400 border border-orange-500/50 px-4 py-2 rounded-xl font-bold uppercase hover:bg-orange-500 hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                                >
                                                                    <X className="w-4 h-4" /> Reject
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleCollabAction(collab.id, 'delete')}
                                                                disabled={loading}
                                                                className="flex-1 md:flex-none bg-red-900/40 text-red-500 border border-red-500/50 px-4 py-2 rounded-xl font-bold uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Question Manager Section */}
                        <div className="mt-16 pt-16 border-t-2 border-zinc-800">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black uppercase">
                                    Manage <span className="text-brand-yellow">Form Questions</span>
                                </h3>
                                <button
                                    onClick={handleSaveCollabQuestions}
                                    disabled={loading || loadingCollabQuestions}
                                    className="bg-brand-yellow text-black px-6 py-2 rounded-xl font-bold uppercase hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                                    Save Config
                                </button>
                            </div>

                            <p className="text-gray-400 mb-6">These questions will dynamically appear in the application form for new collaborations.</p>

                            {loadingCollabQuestions ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {collabQuestions.map((question, index) => (
                                        <div key={question.id} className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-700 font-bold bg-black flex-shrink-0 text-brand-yellow">
                                                {index + 1}
                                            </div>

                                            <div className="flex-1 grid md:grid-cols-12 gap-4 w-full">
                                                <div className="md:col-span-6">
                                                    <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Question Label</label>
                                                    <input
                                                        type="text"
                                                        value={question.label}
                                                        onChange={(e) => handleQuestionChange(question.id, 'label', e.target.value)}
                                                        className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none focus:bg-zinc-950"
                                                        placeholder="What is your primary goal?"
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs text-gray-500 font-bold uppercase mb-1">Input Type</label>
                                                    <select
                                                        value={question.type}
                                                        onChange={(e) => handleQuestionChange(question.id, 'type', e.target.value)}
                                                        className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none appearance-none cursor-pointer"
                                                    >
                                                        <option value="text">Short Text</option>
                                                        <option value="textarea">Long Textarea</option>
                                                        <option value="email">Email</option>
                                                        <option value="tel">Phone Number</option>
                                                        <option value="url">Website URL</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-3 flex shrink-0 items-center justify-between gap-4 mt-6 md:mt-0">
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold uppercase select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={question.required}
                                                            onChange={(e) => handleQuestionChange(question.id, 'required', e.target.checked)}
                                                            className="w-5 h-5 accent-brand-yellow bg-black border-2 border-zinc-700 rounded cursor-pointer"
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleQuestionRemove(question.id)}
                                                className="mt-2 md:mt-0 ml-auto md:ml-2 p-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 group flex-shrink-0"
                                                title="Remove Question"
                                            >
                                                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={handleQuestionAdd}
                                        className="w-full mt-4 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-brand-yellow/30 rounded-xl text-brand-yellow hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all font-bold uppercase"
                                    >
                                        <PlusCircle className="w-5 h-5" /> Add New Question
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Manage Subscribers Tab (Enhanced Contacts Directory) */}
                {activeTab === 'manage-subscribers' && (
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Contacts <span className="text-green-500">Directory</span>
                        </h2>

                        {/* Stats & Actions Bar */}
                        <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-green-500" />
                                <span className="text-gray-400 font-bold">Total Contacts:</span>
                                <span className="text-green-500 font-black text-2xl">{subscribers.length}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={fetchSubscribersForManagement}
                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-gray-400 rounded-lg hover:bg-zinc-700 transition-colors text-xs font-bold uppercase"
                                >
                                    <Loader2 className={`w-4 h-4 ${loadingSubscribers ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Selection & Export actions */}
                        <div className="flex flex-wrap gap-3 mb-6 justify-between items-center bg-zinc-900 border-2 border-zinc-700 rounded-xl p-4">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedSubscribers(subscribers.map(s => s.email))}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase rounded-lg border border-zinc-700 transition-colors"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={() => setSelectedSubscribers([])}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase rounded-lg border border-zinc-700 transition-colors"
                                >
                                    Deselect All
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleCopyEmails}
                                    className="px-4 py-2 bg-brand-yellow text-black font-bold text-xs uppercase rounded-lg border border-white hover:bg-white transition-colors"
                                >
                                    Copy Emails
                                </button>
                                <button
                                    onClick={handleExportSubscribersCSV}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-lg border border-blue-400 transition-colors"
                                >
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {selectedSubscribers.length > 0 && (
                            <div className="bg-brand-yellow/10 border-2 border-brand-yellow rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4 animate-pulse">
                                <p className="m-0 font-bold text-sm text-brand-yellow">
                                    ⚡ {selectedSubscribers.length} contact(s) selected. Quick Compose:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setActiveTab('mailer-announcement'); setMailerTo('selected'); setMailerType('announcement'); setError(null); setResult(null); }}
                                        className="px-3 py-1.5 bg-brand-yellow text-black font-black text-xs uppercase rounded-lg border-2 border-white hover:bg-white transition-all"
                                    >
                                        Announcement
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('mailer-event'); setMailerTo('selected'); setMailerType('event'); setError(null); setResult(null); }}
                                        className="px-3 py-1.5 bg-brand-yellow text-black font-black text-xs uppercase rounded-lg border-2 border-white hover:bg-white transition-all"
                                    >
                                        Event Invitation
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('mailer-generic'); setMailerTo('selected'); setMailerType('generic'); setError(null); setResult(null); }}
                                        className="px-3 py-1.5 bg-brand-yellow text-black font-black text-xs uppercase rounded-lg border-2 border-white hover:bg-white transition-all"
                                    >
                                        Compose Email
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Add New Contact Form */}
                        <div className="bg-zinc-900 border-4 border-green-500/30 rounded-2xl p-6 mb-6">
                            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-3">
                                <UserPlus className="w-5 h-5 text-green-500" />
                                Add New Contact
                            </h3>
                            <form onSubmit={handleAddSubscriber} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">
                                            Name <span className="text-green-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newSubscriber.name}
                                            onChange={(e) => setNewSubscriber(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-green-500 focus:outline-none"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">
                                            Email <span className="text-green-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={newSubscriber.email}
                                            onChange={(e) => setNewSubscriber(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-green-500 focus:outline-none"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={newSubscriber.phone}
                                            onChange={(e) => setNewSubscriber(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-green-500 focus:outline-none"
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">
                                            College/Organization
                                        </label>
                                        <input
                                            type="text"
                                            value={newSubscriber.college}
                                            onChange={(e) => setNewSubscriber(prev => ({ ...prev, college: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-green-500 focus:outline-none"
                                            placeholder="DYPIU"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={addingSubscriber}
                                    className="w-full bg-green-500 text-black py-3 rounded-xl font-black uppercase flex items-center justify-center gap-3 hover:bg-green-400 transition-colors disabled:opacity-50"
                                >
                                    {addingSubscriber ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5" />
                                            Add to Directory
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Search Box */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={subscriberSearch}
                                    onChange={(e) => setSubscriberSearch(e.target.value)}
                                    placeholder="Search by name, email, phone, college..."
                                    className="w-full bg-zinc-900 border-2 border-zinc-700 pl-12 pr-4 py-3 text-white rounded-xl focus:border-green-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Subscriber List */}
                        <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl overflow-hidden">
                            <div className="bg-zinc-800 p-4 border-b border-zinc-700 flex items-center justify-between">
                                <h3 className="font-bold uppercase text-sm text-gray-400">
                                    Contact Records ({filteredSubscribers.length})
                                </h3>
                            </div>

                            {loadingSubscribers ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                                </div>
                            ) : filteredSubscribers.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>{subscriberSearch ? 'No contacts match your search' : 'No contacts in directory yet'}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {filteredSubscribers.map((subscriber, index) => (
                                        <div
                                            key={subscriber.id}
                                            className={`p-4 hover:bg-zinc-800/50 transition-colors flex items-center justify-between ${
                                                selectedSubscribers.includes(subscriber.email) ? 'bg-brand-yellow/5' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* Checkbox */}
                                                <div 
                                                    onClick={() => toggleSubscriber(subscriber.email)}
                                                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center cursor-pointer mt-1 ${
                                                        selectedSubscribers.includes(subscriber.email)
                                                        ? 'bg-brand-yellow text-black'
                                                        : 'bg-black border-2 border-zinc-700'
                                                    }`}
                                                >
                                                    {selectedSubscribers.includes(subscriber.email) && <CheckCircle2 className="w-4.5 h-4.5" />}
                                                </div>

                                                <div className="flex-1" onClick={() => toggleSubscriber(subscriber.email)}>
                                                    <p className="font-bold text-white cursor-pointer hover:text-brand-yellow transition-colors">{subscriber.name}</p>
                                                    <p className="text-green-500 text-sm flex items-center gap-1 cursor-pointer">
                                                        <Mail className="w-3 h-3" />
                                                        {subscriber.email}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 text-gray-500 text-xs">
                                                        {subscriber.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                {subscriber.phone}
                                                            </span>
                                                        )}
                                                        {subscriber.college && (
                                                            <span>• {subscriber.college}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSubscriber(subscriber.id)}
                                                disabled={deletingSubscriber === subscriber.id}
                                                className="p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors disabled:opacity-50"
                                                title="Remove Contact"
                                            >
                                                {deletingSubscriber === subscriber.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <UserMinus className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mailer - Announcement Creator */}
                {activeTab === 'mailer-announcement' && (
                    <div className="max-w-3xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Announcement <span className="text-brand-yellow">Creator</span>
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Send a structured announcement email containing a banner image, headlines, and call-to-action button to your audience.
                        </p>

                        <div className="bg-zinc-900 border-4 border-white p-8 rounded-2xl shadow-[8px_8px_0px_#FFB22C] mb-8">
                            <form onSubmit={handleSendMailerEmail} className="space-y-6">
                                {/* Audience Selection */}
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">Target Audience</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['all', 'selected', 'manual'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setMailerTo(type)}
                                                className={`py-2 px-4 rounded-lg font-bold text-xs uppercase border-2 transition-all ${
                                                    mailerTo === type 
                                                    ? 'bg-brand-yellow text-black border-white' 
                                                    : 'bg-black text-gray-400 border-zinc-800 hover:border-zinc-600'
                                                }`}
                                            >
                                                {type === 'all' && 'All Subscribers'}
                                                {type === 'selected' && `Selected (${selectedSubscribers.length})`}
                                                {type === 'manual' && 'Manual Entry'}
                                            </button>
                                        ))}
                                    </div>
                                    {mailerTo === 'manual' && (
                                        <div className="mt-3">
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Recipients Emails (comma separated)</label>
                                            <textarea
                                                value={mailerManualEmails}
                                                onChange={(e) => setMailerManualEmails(e.target.value)}
                                                rows={2}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="email1@domain.com, email2@domain.com"
                                                required={mailerTo === 'manual'}
                                            />
                                            <div className="mt-2 flex items-center gap-3">
                                                <label className="bg-zinc-800 border-2 border-zinc-700 hover:border-brand-yellow text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-colors flex items-center gap-2">
                                                    <Upload className="w-4 h-4 text-brand-yellow" />
                                                    <span>Import Emails from CSV / Text File</span>
                                                    <input 
                                                        type="file" 
                                                        accept=".csv,.txt" 
                                                        onChange={handleImportEmailsCSV} 
                                                        className="hidden" 
                                                    />
                                                </label>
                                                <span className="text-zinc-500 text-[10px] uppercase font-bold">Supports CSV/Excel/Text lists</span>
                                            </div>
                                        </div>
                                    )}
                                    {mailerTo === 'selected' && (
                                        <div className="mt-3 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-xs text-zinc-400">
                                            ⚡ Sending to the **{selectedSubscribers.length}** contact(s) currently checkmarked in the Contacts Directory.
                                        </div>
                                    )}
                                </div>

                                {/* Subject Line */}
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Email Subject Line <span className="text-brand-yellow">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={mailerSubject}
                                        onChange={(e) => setMailerSubject(e.target.value)}
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                        placeholder="📢 Important Update: E-Cell Incubation Cohort 2026 Open!"
                                        required
                                    />
                                </div>

                                {/* Form Fields */}
                                <div className="border-t-2 border-zinc-800 pt-6 space-y-4">
                                    <h3 className="text-lg font-black uppercase text-brand-yellow mb-2">Announcement Layout Settings</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">Announcement Heading Title <span className="text-brand-yellow">*</span></label>
                                        <input
                                            type="text"
                                            value={announcementData.title}
                                            onChange={(e) => setAnnouncementData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                            placeholder="Incubation Registration Open"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">Subheading / Excerpt</label>
                                        <input
                                            type="text"
                                            value={announcementData.subtitle}
                                            onChange={(e) => setAnnouncementData(prev => ({ ...prev, subtitle: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                            placeholder="Apply now to secure funding & mentorship for your startup venture."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">Banner Image URL</label>
                                        <input
                                            type="url"
                                            value={announcementData.bannerUrl}
                                            onChange={(e) => setAnnouncementData(prev => ({ ...prev, bannerUrl: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                            placeholder="https://example.com/banner.png"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">Body Content (supports paragraphs) <span className="text-brand-yellow">*</span></label>
                                        <textarea
                                            value={announcementData.body}
                                            onChange={(e) => setAnnouncementData(prev => ({ ...prev, body: e.target.value }))}
                                            rows={6}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none font-sans text-sm resize-none"
                                            placeholder="Type the main message body of your announcement here..."
                                            required
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold uppercase mb-2">CTA Button Text</label>
                                            <input
                                                type="text"
                                                value={announcementData.buttonText}
                                                onChange={(e) => setAnnouncementData(prev => ({ ...prev, buttonText: e.target.value }))}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="APPLY NOW"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold uppercase mb-2">CTA Button Link</label>
                                            <input
                                                type="url"
                                                value={announcementData.buttonUrl}
                                                onChange={(e) => setAnnouncementData(prev => ({ ...prev, buttonUrl: e.target.value }))}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="https://ecelldypiu.in/apply"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || (mailerTo === 'selected' && selectedSubscribers.length === 0)}
                                    className="w-full bg-brand-yellow text-black text-xl font-black uppercase py-4 border-4 border-black hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin w-6 h-6" />
                                            Broadcasting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-6 h-6" />
                                            Send Announcement
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Mailer - Event Notifier */}
                {activeTab === 'mailer-event' && (
                    <div className="max-w-3xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Event <span className="text-brand-yellow">Notifier</span>
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Draft and dispatch structured invitations containing description, banner, details (Date, Time, Venue), and registration URL to subscribers.
                        </p>

                        <div className="bg-zinc-900 border-4 border-white p-8 rounded-2xl shadow-[8px_8px_0px_#FFB22C] mb-8">
                            <form onSubmit={handleSendMailerEmail} className="space-y-6">
                                {/* Audience Selection */}
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">Target Audience</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['all', 'selected', 'manual'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setMailerTo(type)}
                                                className={`py-2 px-4 rounded-lg font-bold text-xs uppercase border-2 transition-all ${
                                                    mailerTo === type 
                                                    ? 'bg-brand-yellow text-black border-white' 
                                                    : 'bg-black text-gray-400 border-zinc-800 hover:border-zinc-600'
                                                }`}
                                            >
                                                {type === 'all' && 'All Subscribers'}
                                                {type === 'selected' && `Selected (${selectedSubscribers.length})`}
                                                {type === 'manual' && 'Manual Entry'}
                                            </button>
                                        ))}
                                    </div>
                                    {mailerTo === 'manual' && (
                                        <div className="mt-3">
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Recipients Emails (comma separated)</label>
                                            <textarea
                                                value={mailerManualEmails}
                                                onChange={(e) => setMailerManualEmails(e.target.value)}
                                                rows={2}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="email1@domain.com, email2@domain.com"
                                                required={mailerTo === 'manual'}
                                            />
                                            <div className="mt-2 flex items-center gap-3">
                                                <label className="bg-zinc-800 border-2 border-zinc-700 hover:border-brand-yellow text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-colors flex items-center gap-2">
                                                    <Upload className="w-4 h-4 text-brand-yellow" />
                                                    <span>Import Emails from CSV / Text File</span>
                                                    <input 
                                                        type="file" 
                                                        accept=".csv,.txt" 
                                                        onChange={handleImportEmailsCSV} 
                                                        className="hidden" 
                                                    />
                                                </label>
                                                <span className="text-zinc-500 text-[10px] uppercase font-bold">Supports CSV/Excel/Text lists</span>
                                            </div>
                                        </div>
                                    )}
                                    {mailerTo === 'selected' && (
                                        <div className="mt-3 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-xs text-zinc-400">
                                            ⚡ Sending to the **{selectedSubscribers.length}** contact(s) currently checkmarked in the Contacts Directory.
                                        </div>
                                    )}
                                </div>

                                {/* Subject Line */}
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Email Subject Line <span className="text-brand-yellow">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={mailerSubject}
                                        onChange={(e) => setMailerSubject(e.target.value)}
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                        placeholder="📅 RSVP: E-Cell Ideation Workshop next Saturday!"
                                        required
                                    />
                                </div>

                                {/* Event Specific Fields */}
                                <div className="border-t-2 border-zinc-800 pt-6 space-y-4">
                                    <h3 className="text-lg font-black uppercase text-brand-yellow mb-2">Event Schedule & Settings</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">Event Title <span className="text-brand-yellow">*</span></label>
                                        <input
                                            type="text"
                                            value={eventMailData.title}
                                            onChange={(e) => setEventMailData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                            placeholder="Ideation Workshop"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">Banner Image URL</label>
                                        <input
                                            type="url"
                                            value={eventMailData.bannerUrl}
                                            onChange={(e) => setEventMailData(prev => ({ ...prev, bannerUrl: e.target.value }))}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                            placeholder="https://example.com/event-banner.png"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold uppercase mb-2">Event Description <span className="text-brand-yellow">*</span></label>
                                        <textarea
                                            value={eventMailData.description}
                                            onChange={(e) => setEventMailData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={4}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none resize-none text-sm"
                                            placeholder="Provide a description of the event details, speakers, and topics covered..."
                                            required
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-2">Date (e.g. Oct 12, 2026)</label>
                                            <input
                                                type="text"
                                                value={eventMailData.date}
                                                onChange={(e) => setEventMailData(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="Oct 12, 2026"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-2">Time (e.g. 10:00 AM)</label>
                                            <input
                                                type="text"
                                                value={eventMailData.time}
                                                onChange={(e) => setEventMailData(prev => ({ ...prev, time: e.target.value }))}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="10:00 AM IST"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-2">Venue</label>
                                            <input
                                                type="text"
                                                value={eventMailData.venue}
                                                onChange={(e) => setEventMailData(prev => ({ ...prev, venue: e.target.value }))}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="Seminar Hall, DYPIU"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold uppercase mb-2">Registration Link</label>
                                            <input
                                                type="url"
                                                value={eventMailData.registrationLink}
                                                onChange={(e) => setEventMailData(prev => ({ ...prev, registrationLink: e.target.value }))}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="https://ecelldypiu.in/events/ideation-2026/register"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold uppercase mb-2">Button Text</label>
                                            <input
                                                type="text"
                                                value={eventMailData.buttonText}
                                                onChange={(e) => setEventMailData(prev => ({ ...prev, buttonText: e.target.value }))}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="Register Now"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || (mailerTo === 'selected' && selectedSubscribers.length === 0)}
                                    className="w-full bg-brand-yellow text-black text-xl font-black uppercase py-4 border-4 border-black hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin w-6 h-6" />
                                            Broadcasting...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-6 h-6" />
                                            Send Event Invite
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Mailer - Direct Custom Composer */}
                {activeTab === 'mailer-generic' && (
                    <div className="max-w-3xl mx-auto">
                        <button
                            onClick={() => { setActiveTab('dashboard'); setError(null); setResult(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Dashboard</span>
                        </button>
                        <h2 className="text-3xl font-black uppercase mb-6">
                            Direct Custom <span className="text-brand-yellow">Composer</span>
                        </h2>
                        <p className="text-gray-400 mb-6">
                            Compose a personalized text email to selected contacts. The message will be beautifully wrapped inside the default E-Cell DYPIU branding layout.
                        </p>

                        <div className="bg-zinc-900 border-4 border-white p-8 rounded-2xl shadow-[8px_8px_0px_#FFB22C] mb-8">
                            <form onSubmit={handleSendMailerEmail} className="space-y-6">
                                {/* Audience Selection */}
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">Target Audience</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['all', 'selected', 'manual'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setMailerTo(type)}
                                                className={`py-2 px-4 rounded-lg font-bold text-xs uppercase border-2 transition-all ${
                                                    mailerTo === type 
                                                    ? 'bg-brand-yellow text-black border-white' 
                                                    : 'bg-black text-gray-400 border-zinc-800 hover:border-zinc-600'
                                                }`}
                                            >
                                                {type === 'all' && 'All Subscribers'}
                                                {type === 'selected' && `Selected (${selectedSubscribers.length})`}
                                                {type === 'manual' && 'Manual Entry'}
                                            </button>
                                        ))}
                                    </div>
                                    {mailerTo === 'manual' && (
                                        <div className="mt-3">
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Recipients Emails (comma separated)</label>
                                            <textarea
                                                value={mailerManualEmails}
                                                onChange={(e) => setMailerManualEmails(e.target.value)}
                                                rows={2}
                                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                                placeholder="email1@domain.com, email2@domain.com"
                                                required={mailerTo === 'manual'}
                                            />
                                            <div className="mt-2 flex items-center gap-3">
                                                <label className="bg-zinc-800 border-2 border-zinc-700 hover:border-brand-yellow text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-colors flex items-center gap-2">
                                                    <Upload className="w-4 h-4 text-brand-yellow" />
                                                    <span>Import Emails from CSV / Text File</span>
                                                    <input 
                                                        type="file" 
                                                        accept=".csv,.txt" 
                                                        onChange={handleImportEmailsCSV} 
                                                        className="hidden" 
                                                    />
                                                </label>
                                                <span className="text-zinc-500 text-[10px] uppercase font-bold">Supports CSV/Excel/Text lists</span>
                                            </div>
                                        </div>
                                    )}
                                    {mailerTo === 'selected' && (
                                        <div className="mt-3 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-xs text-zinc-400">
                                            ⚡ Sending to the **{selectedSubscribers.length}** contact(s) currently checkmarked in the Contacts Directory.
                                        </div>
                                    )}
                                </div>

                                {/* Mail Template Action Bar */}
                                <div className="flex gap-2 justify-between items-center border-t-2 border-zinc-800 pt-6">
                                    <h3 className="text-lg font-black uppercase text-brand-yellow">Mail Template</h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowMailPreviewModal(true)}
                                            className="px-4 py-2 bg-brand-yellow text-black font-black text-xs uppercase rounded-lg border-2 border-white hover:bg-white transition-all flex items-center gap-1.5"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Preview Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResetGenericDefault}
                                            className="px-4 py-2 bg-zinc-800 text-gray-300 hover:text-white font-bold text-xs uppercase rounded-lg border border-zinc-700 transition-colors"
                                        >
                                            Reset Default
                                        </button>
                                    </div>
                                </div>

                                {/* Subject Line */}
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-2">
                                        Email Subject Line <span className="text-brand-yellow">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={mailerSubject}
                                        onChange={(e) => setMailerSubject(e.target.value)}
                                        className="w-full bg-black border-2 border-zinc-700 p-4 text-white rounded-lg focus:border-brand-yellow focus:outline-none"
                                        placeholder="📢 Welcome to E-Cell DYPIU!"
                                        required
                                    />
                                </div>

                                {/* Side-by-Side Editors */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Left Column: Quick Edit */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                            Quick Edit (No Code)
                                        </label>
                                        <textarea
                                            value={genericMailData.plainText}
                                            onChange={(e) => handlePlainTextChange(e.target.value)}
                                            rows={14}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none resize-none text-sm font-sans"
                                            placeholder="Dear {name},&#10;&#10;Type your message here..."
                                        />
                                        <p className="text-[11px] text-zinc-500 mt-1">
                                            Editing here automatically updates the HTML template on the right. Use <strong>Preview Changes</strong> to see the rendered preview.
                                        </p>
                                    </div>

                                    {/* Right Column: HTML Editor */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                                            Body (HTML or Plain Text)
                                        </label>
                                        <textarea
                                            value={genericMailData.body}
                                            onChange={(e) => setGenericMailData(prev => ({ ...prev, body: e.target.value }))}
                                            rows={14}
                                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-lg focus:border-brand-yellow focus:outline-none resize-none font-mono text-xs"
                                            placeholder="HTML code content..."
                                            required
                                        />
                                        <p className="text-[11px] text-zinc-500 mt-1">
                                            Placeholders: <code>{`{name}`}</code> will be automatically replaced with the recipient's name during dispatch.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || (mailerTo === 'selected' && selectedSubscribers.length === 0)}
                                    className="w-full bg-brand-yellow text-black text-xl font-black uppercase py-4 border-4 border-black hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin w-6 h-6" />
                                            Dispatched...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-6 h-6" />
                                            Send Email
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Subscriber Selection Modal */}
            {showSubscriberModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border-4 border-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[8px_8px_0px_#FFB22C]">
                        {/* Modal Header */}
                        <div className="p-6 border-b-2 border-zinc-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black uppercase flex items-center gap-3">
                                    <Users className="w-6 h-6 text-brand-yellow" />
                                    Select <span className="text-brand-yellow">Subscribers</span>
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    Choose who receives the notification
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowSubscriberModal(false); setSubscriberSearch(''); }}
                                className="text-gray-400 hover:text-white p-2"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="p-4 bg-zinc-900 border-b border-zinc-700">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, phone, or college..."
                                    value={subscriberSearch}
                                    onChange={(e) => setSubscriberSearch(e.target.value)}
                                    className="w-full bg-zinc-800 border-2 border-zinc-700 pl-12 pr-4 py-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none placeholder-gray-500"
                                />
                                {subscriberSearch && (
                                    <button
                                        onClick={() => setSubscriberSearch('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Selection Controls */}
                        <div className="p-4 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between flex-wrap gap-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={selectAllSubscribers}
                                    className="px-4 py-2 bg-brand-yellow text-black font-bold text-sm rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                                >
                                    <CheckSquare className="w-4 h-4" />
                                    Select All
                                </button>
                                <button
                                    onClick={deselectAllSubscribers}
                                    className="px-4 py-2 bg-zinc-700 text-white font-bold text-sm rounded-lg hover:bg-zinc-600 transition-colors flex items-center gap-2"
                                >
                                    <Square className="w-4 h-4" />
                                    Deselect All
                                </button>
                            </div>
                            <div className="text-sm text-gray-400">
                                <span className="text-brand-yellow font-bold">{selectedSubscribers.length}</span> of {subscribers.length} selected
                                {subscriberSearch && <span className="ml-2 text-zinc-500">({filteredSubscribers.length} shown)</span>}
                            </div>
                        </div>

                        {/* Subscribers List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#FFB22C #27272a' }}>
                            {loadingSubscribers ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-yellow mb-3" />
                                    <p className="text-gray-400 text-sm">Loading subscribers...</p>
                                </div>
                            ) : error && subscribers.length === 0 ? (
                                <div className="text-center py-10">
                                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                    <p className="text-red-400">{error}</p>
                                    <button
                                        onClick={fetchSubscribers}
                                        className="mt-4 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : subscribers.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    No subscribers found
                                </div>
                            ) : filteredSubscribers.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                    <p>No subscribers match "{subscriberSearch}"</p>
                                    <button
                                        onClick={() => setSubscriberSearch('')}
                                        className="mt-3 text-brand-yellow hover:underline"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            ) : (
                                filteredSubscribers.map((subscriber) => (
                                    <div
                                        key={subscriber.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedSubscribers.includes(subscriber.email)
                                            ? 'bg-brand-yellow/10 border-brand-yellow'
                                            : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                                            }`}
                                        onClick={() => toggleSubscriber(subscriber.email)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Checkbox */}
                                            <div className={`w-6 h-6 rounded flex items-center justify-center ${selectedSubscribers.includes(subscriber.email)
                                                ? 'bg-brand-yellow text-black'
                                                : 'bg-zinc-700 border border-zinc-600'
                                                }`}>
                                                {selectedSubscribers.includes(subscriber.email) && (
                                                    <CheckSquare className="w-4 h-4" />
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div>
                                                <p className="text-white font-bold">{subscriber.name}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {subscriber.email}
                                                    </span>
                                                    {subscriber.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {subscriber.phone}
                                                        </span>
                                                    )}
                                                </div>
                                                {subscriber.college && (
                                                    <p className="text-xs text-gray-500 mt-1">{subscriber.college}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSubscriber(subscriber.email);
                                            }}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${selectedSubscribers.includes(subscriber.email)
                                                ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                                                : 'bg-green-900/50 text-green-400 hover:bg-green-900'
                                                }`}
                                        >
                                            {selectedSubscribers.includes(subscriber.email) ? 'Remove' : 'Add'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t-2 border-zinc-700 bg-zinc-800 flex items-center justify-between gap-4">
                            <button
                                onClick={() => { setShowSubscriberModal(false); setSubscriberSearch(''); }}
                                className="px-6 py-3 bg-zinc-700 text-white font-bold rounded-xl hover:bg-zinc-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendNotification}
                                disabled={selectedSubscribers.length === 0 || loading}
                                className="flex-1 bg-brand-yellow text-black py-3 rounded-xl font-black uppercase flex items-center justify-center gap-3 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Send to {selectedSubscribers.length} Subscriber{selectedSubscribers.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Mail Preview Modal */}
            {showMailPreviewModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border-4 border-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[8px_8px_0px_#FFB22C] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 border-b-2 border-zinc-700 flex items-center justify-between bg-zinc-800">
                            <h3 className="text-md font-black uppercase text-brand-yellow">Mail Preview</h3>
                            <button
                                type="button"
                                onClick={() => setShowMailPreviewModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Subject Indicator */}
                        <div className="p-4 bg-zinc-900 border-b border-zinc-800">
                            <p className="text-xs font-bold text-zinc-500 uppercase">Subject</p>
                            <p className="text-sm font-black text-white">{mailerSubject || '(No Subject)'}</p>
                        </div>
                        
                        {/* Rendered Preview Area */}
                        <div className="flex-1 overflow-y-auto bg-black p-4">
                            <iframe
                                srcDoc={getGenericPreviewHTML(genericMailData.body)}
                                title="Email Rendered Preview"
                                className="w-full h-[380px] border-none bg-black rounded-lg"
                            />
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-4 border-t-2 border-zinc-700 bg-zinc-800 text-right">
                            <button
                                type="button"
                                onClick={() => setShowMailPreviewModal(false)}
                                className="px-6 py-2 bg-brand-yellow text-black font-black text-xs uppercase rounded-lg border-2 border-white hover:bg-white transition-all"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Viewing Application Details Modal */}
            {viewingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-zinc-900 border-4 border-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-[8px_8px_0px_#FFB22C] relative">
                        <button
                            onClick={() => setViewingApp(null)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-black rounded-lg border border-zinc-700"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6 border-b border-zinc-800 pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-black uppercase text-white">{viewingApp.fullName}</h2>
                                <span className={`px-3 py-1 rounded-md text-xs font-black uppercase border ${getRoleBadgeStyle(viewingApp.role)}`}>
                                    {getRoleLabel(viewingApp.role)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">
                                Submitted: {viewingApp.submittedAt ? new Date(viewingApp.submittedAt).toLocaleString() : 'N/A'}
                            </p>
                        </div>

                        {/* Candidate Key Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black p-4 rounded-xl border border-zinc-800 mb-6">
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">PRN</span>
                                <span className="text-sm font-bold text-white">{viewingApp.prn || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">Division</span>
                                <span className="text-sm font-bold text-white">{viewingApp.division || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">Contact</span>
                                <span className="text-sm font-bold text-white">{viewingApp.contactNumber || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">Time Management</span>
                                <span className="text-sm font-black text-brand-yellow">{viewingApp.timeManagementRating || '-'}/10</span>
                            </div>
                            <div className="col-span-2 md:col-span-4 border-t border-zinc-800 pt-2">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block">Email</span>
                                <span className="text-sm font-bold text-brand-yellow">{viewingApp.email}</span>
                            </div>
                        </div>

                        {/* Role-Specific Answers */}
                        <div className="space-y-4 mb-6">
                            <h3 className="text-lg font-black uppercase text-brand-yellow border-b border-zinc-800 pb-2">
                                Role Specific Questionnaire Answers
                            </h3>

                            {roleQuestionsMap[viewingApp.role] ? (
                                roleQuestionsMap[viewingApp.role].map((q) => (
                                    <div key={q.key} className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{q.label}</h4>
                                        <p className="text-sm text-white whitespace-pre-wrap font-medium">
                                            {viewingApp[q.key] ? viewingApp[q.key] : <span className="text-zinc-600 italic">No response provided</span>}
                                        </p>
                                    </div>
                                ))
) : (
                                <p className="text-sm text-gray-400">No role-specific answers available for this entry.</p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUpdateAppStatus(viewingApp.id, 'selected', viewingApp.email, viewingApp.fullName)}
                                    className="px-5 py-2.5 bg-brand-yellow text-black border-2 border-black hover:bg-white rounded-xl font-bold uppercase text-xs flex items-center gap-2"
                                >
                                    Select for Interview
                                </button>
                                <button
                                    onClick={() => handleUpdateAppStatus(viewingApp.id, 'rejected', viewingApp.email, viewingApp.fullName)}
                                    className="px-5 py-2.5 bg-red-900/30 text-red-400 border-2 border-red-500 hover:bg-red-900/50 rounded-xl font-bold uppercase text-xs flex items-center gap-2"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleDeleteApp(viewingApp.id)}
                                    className="px-5 py-2.5 bg-zinc-800 text-gray-400 border-2 border-zinc-700 hover:bg-zinc-700 hover:text-white rounded-xl font-bold uppercase text-xs flex items-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>

                            <button
                                onClick={() => setViewingApp(null)}
                                className="px-6 py-2.5 bg-zinc-800 text-white font-bold uppercase text-xs rounded-xl hover:bg-zinc-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interview Schedule & Email Editor Modal */}
            {showInterviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
                    <div className="bg-zinc-900 border-4 border-brand-yellow rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-[12px_12px_0px_#FFB22C] relative overflow-hidden">
                        
                        {/* Header */}
                        <div className="p-6 bg-zinc-900 border-b-2 border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black uppercase text-white flex items-center gap-3">
                                    <Mail className="w-7 h-7 text-brand-yellow" />
                                    Interview <span className="text-brand-yellow">Emailing Panel & Editor</span>
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    Compose, format, preview, and dispatch interview invitations to selected candidates.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-black p-1.5 rounded-xl border border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setInterviewEditorTab('guided')}
                                    className={`px-3.5 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                                        interviewEditorTab === 'guided' ? 'bg-brand-yellow text-black shadow-sm' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Guided Form
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!interviewData.customHtml) {
                                            setInterviewData(prev => ({
                                                ...prev,
                                                useCustomHtml: true,
                                                customHtml: generateInterviewHtmlTemplate(interviewData)
                                            }));
                                        }
                                        setInterviewEditorTab('html');
                                    }}
                                    className={`px-3.5 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                                        interviewEditorTab === 'html' ? 'bg-brand-yellow text-black shadow-sm' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    HTML Code Editor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInterviewEditorTab('preview')}
                                    className={`px-3.5 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                                        interviewEditorTab === 'preview' ? 'bg-brand-yellow text-black shadow-sm' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Live Preview
                                </button>
                            </div>

                            <button
                                onClick={() => setShowInterviewModal(false)}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-black rounded-lg border border-zinc-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Selected Recipients Bar */}
                        <div className="bg-black/80 px-6 py-3 border-b border-zinc-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-3xl">
                                <span className="text-xs font-bold uppercase text-brand-yellow flex-shrink-0">
                                    Recipients ({selectedApplications.length}):
                                </span>
                                {applications.filter(app => selectedApplications.includes(app.id)).map(app => (
                                    <span key={app.id} className="px-2.5 py-0.5 bg-zinc-800 text-white rounded-md text-xs font-medium border border-zinc-700 flex items-center gap-1.5 flex-shrink-0">
                                        {app.fullName}
                                        <button
                                            type="button"
                                            onClick={() => toggleApplicationSelection(app.id)}
                                            className="text-zinc-500 hover:text-red-400 ml-1 font-bold"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="text-xs text-zinc-500 font-mono flex-shrink-0">
                                Mode: <strong className="text-white uppercase">{interviewData.useCustomHtml ? 'Custom HTML' : 'Standard Layout'}</strong>
                            </div>
                        </div>

                        {/* Main Content Body */}
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            
                            {/* Email Subject Line (Always visible) */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold uppercase text-gray-300">Email Subject Line *</label>
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setInterviewData(prev => ({ ...prev, subject: prev.subject + ' {name}' }))}
                                            className="text-[10px] bg-zinc-800 text-brand-yellow px-2 py-0.5 rounded border border-zinc-700 font-mono hover:bg-zinc-700"
                                        >
                                            + {'{name}'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInterviewData(prev => ({ ...prev, subject: prev.subject + ' {role}' }))}
                                            className="text-[10px] bg-zinc-800 text-brand-yellow px-2 py-0.5 rounded border border-zinc-700 font-mono hover:bg-zinc-700"
                                        >
                                            + {'{role}'}
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={interviewData.subject}
                                    onChange={(e) => setInterviewData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-brand-yellow focus:outline-none font-bold"
                                    required
                                />
                            </div>

                            {/* Tab 1: Guided Form */}
                            {interviewEditorTab === 'guided' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-300">
                                                Role Title (Auto-Filled Per Candidate)
                                            </label>
                                            <div className="w-full bg-zinc-900/90 border border-zinc-700 rounded-lg p-3 text-sm text-brand-yellow font-mono font-bold flex items-center justify-between">
                                                <span>
                                                    {selectedApplications.length === 1
                                                        ? getRoleLabel(applications.find(a => selectedApplications.includes(a.id))?.role)
                                                        : 'Auto-filled per candidate\'s applied role ({role})'}
                                                </span>
                                                <span className="text-[10px] bg-zinc-800 text-gray-400 px-2 py-0.5 rounded border border-zinc-700 font-sans uppercase flex-shrink-0">
                                                    Locked
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-300">Interview Date *</label>
                                            <input
                                                type="text"
                                                value={interviewData.date}
                                                onChange={(e) => setInterviewData(prev => ({ ...prev, date: e.target.value }))}
                                                placeholder="e.g. 10th September 2026"
                                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-brand-yellow focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-300">Time / Slot *</label>
                                            <input
                                                type="text"
                                                value={interviewData.time}
                                                onChange={(e) => setInterviewData(prev => ({ ...prev, time: e.target.value }))}
                                                placeholder="e.g. 03:00 PM - 03:15 PM"
                                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-brand-yellow focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-300">Location / Venue / Link *</label>
                                            <input
                                                type="text"
                                                value={interviewData.venue}
                                                onChange={(e) => setInterviewData(prev => ({ ...prev, venue: e.target.value }))}
                                                placeholder="e.g. Room 204, Academic Block / Google Meet Link"
                                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-brand-yellow focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1 text-gray-300">Important Instructions / Notes</label>
                                        <textarea
                                            value={interviewData.notes}
                                            onChange={(e) => setInterviewData(prev => ({ ...prev, notes: e.target.value }))}
                                            rows="3"
                                            placeholder="e.g. Please arrive 5 minutes prior. Bring a copy of your resume."
                                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-brand-yellow focus:outline-none font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-300">Action Button Text (Optional)</label>
                                            <input
                                                type="text"
                                                value={interviewData.buttonText}
                                                onChange={(e) => setInterviewData(prev => ({ ...prev, buttonText: e.target.value }))}
                                                placeholder="Confirm Slot / Join Meet"
                                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-brand-yellow focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-gray-300">Action Button URL (Optional)</label>
                                            <input
                                                type="url"
                                                value={interviewData.buttonUrl}
                                                onChange={(e) => setInterviewData(prev => ({ ...prev, buttonUrl: e.target.value }))}
                                                placeholder="https://meet.google.com/abc-xyz-123"
                                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-brand-yellow focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-between items-center border-t border-zinc-800">
                                        <span className="text-xs text-gray-400">Want full control over HTML?</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const compiled = generateInterviewHtmlTemplate(interviewData);
                                                setInterviewData(prev => ({ ...prev, useCustomHtml: true, customHtml: compiled }));
                                                setInterviewEditorTab('html');
                                            }}
                                            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-brand-yellow rounded-lg text-xs font-bold uppercase hover:bg-zinc-700"
                                        >
                                            Convert to HTML Code & Edit →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: HTML Code Editor */}
                            {interviewEditorTab === 'html' && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-black p-3 rounded-xl border border-zinc-800">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold uppercase text-gray-400">Insert Tags:</span>
                                            {['{name}', '{email}', '{role}', '{date}', '{time}', '{venue}'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => {
                                                        setInterviewData(prev => ({
                                                            ...prev,
                                                            useCustomHtml: true,
                                                            customHtml: (prev.customHtml || '') + tag
                                                        }));
                                                    }}
                                                    className="text-xs bg-zinc-800 text-brand-yellow px-2 py-1 rounded font-mono hover:bg-zinc-700 border border-zinc-700"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const compiled = generateInterviewHtmlTemplate(interviewData);
                                                    setInterviewData(prev => ({ ...prev, useCustomHtml: true, customHtml: compiled }));
                                                }}
                                                className="text-xs text-gray-400 hover:text-white underline font-bold"
                                            >
                                                Reset to Standard Template
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <textarea
                                            value={interviewData.useCustomHtml ? interviewData.customHtml : generateInterviewHtmlTemplate(interviewData)}
                                            onChange={(e) => setInterviewData(prev => ({ ...prev, useCustomHtml: true, customHtml: e.target.value }))}
                                            rows="14"
                                            className="w-full bg-black border border-zinc-700 p-4 text-xs font-mono text-green-400 focus:border-brand-yellow focus:outline-none rounded-xl leading-relaxed resize-y"
                                            placeholder="Paste or type raw email HTML content..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Live Preview */}
                            {interviewEditorTab === 'preview' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase text-gray-400">Live Email Output Render</span>
                                        <span className="text-xs text-brand-yellow font-mono">Sample variables applied for preview</span>
                                    </div>

                                    <div className="border-2 border-zinc-700 rounded-xl overflow-hidden bg-black p-2">
                                        <iframe
                                            srcDoc={(interviewData.useCustomHtml ? interviewData.customHtml : generateInterviewHtmlTemplate(interviewData))
                                                .replace(/\{name\}/g, selectedApplications.length > 0 ? (applications.find(a => selectedApplications.includes(a.id))?.fullName || 'John Doe') : 'John Doe')
                                                .replace(/\{email\}/g, 'john@example.com')
                                                .replace(/\{role\}/g, interviewData.role || 'Technical')
                                                .replace(/\{date\}/g, interviewData.date || '10th September 2026')
                                                .replace(/\{time\}/g, interviewData.time || '03:00 PM')
                                                .replace(/\{venue\}/g, interviewData.venue || 'Room 204')}
                                            title="Live Email Render"
                                            className="w-full h-[450px] border-none bg-black rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-zinc-900 border-t-2 border-zinc-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                {interviewEditorTab !== 'preview' && (
                                    <button
                                        type="button"
                                        onClick={() => setInterviewEditorTab('preview')}
                                        className="px-4 py-2 bg-zinc-800 text-gray-300 font-bold uppercase text-xs rounded-xl hover:bg-zinc-700 flex items-center gap-1.5"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> Preview Output
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInterviewModal(false)}
                                    className="px-5 py-2.5 bg-zinc-800 text-gray-300 font-bold uppercase text-xs rounded-xl hover:bg-zinc-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendInterviewScheduleEmails}
                                    disabled={sendingInterviewMail || selectedApplications.length === 0}
                                    className="px-6 py-2.5 bg-brand-yellow text-black font-black uppercase text-xs rounded-xl hover:bg-white transition-colors border-2 border-black flex items-center gap-2 disabled:opacity-50 shadow-[4px_4px_0px_#fff]"
                                >
                                    {sendingInterviewMail ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" /> Send Email ({selectedApplications.length})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPortal;

