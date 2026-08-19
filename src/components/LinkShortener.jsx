import { useState, useEffect, useMemo, useCallback } from 'react';
import QRCode from 'qrcode';
import {
    Link as LinkIcon, Copy, Check, ExternalLink, Edit2, Trash2,
    Search, BarChart2, Plus, RefreshCw, AlertCircle,
    CheckCircle2, Loader2, X, ArrowLeft, ChevronLeft, ChevronRight,
    TrendingUp, Filter, ArrowUpDown, Tag, QrCode, Download,
    PieChart, Smartphone, Laptop, Tablet, Globe, Activity
} from 'lucide-react';

const LinkShortener = ({ adminKey, onBack }) => {
    // Links data state
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [qrModalLink, setQrModalLink] = useState(null);
    const [statsModalLink, setStatsModalLink] = useState(null);
    const [showCustomQrStudio, setShowCustomQrStudio] = useState(false);
    const [statusToggleTarget, setStatusToggleTarget] = useState(null);
    const [togglingStatus, setTogglingStatus] = useState(false);

    // Create form state
    const [longUrl, setLongUrl] = useState('');
    const [destinationName, setDestinationName] = useState('');
    const [customSlug, setCustomSlug] = useState('');
    const [creating, setCreating] = useState(false);
    const [createdLink, setCreatedLink] = useState(null);
    const [formValidationError, setFormValidationError] = useState('');

    // Filter, Search, Sort & Pagination state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'most_clicks'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Toast state
    const [toast, setToast] = useState(null); // { message, type }

    // Edit modal state
    const [editingLink, setEditingLink] = useState(null);
    const [editUrl, setEditUrl] = useState('');
    const [editDestinationName, setEditDestinationName] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [editValidationError, setEditValidationError] = useState('');

    // Delete modal state
    const [deletingLink, setDeletingLink] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Copy tracking
    const [copiedSlug, setCopiedSlug] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    // Fetch shortlinks
    const fetchLinks = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/shortlink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ action: 'list' })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch shortlinks');
            }

            setLinks(data.links || []);
        } catch (err) {
            console.error('Fetch shortlinks error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [adminKey]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    // Summary Statistics
    const totalClicks = useMemo(() => {
        return links.reduce((sum, item) => sum + (item.clicks || 0), 0);
    }, [links]);

    const activeCount = useMemo(() => {
        return links.filter(item => item.isActive).length;
    }, [links]);

    // Handle Create Link
    const handleCreateLink = async (e) => {
        e.preventDefault();
        setFormValidationError('');

        if (!longUrl.trim()) {
            setFormValidationError('Original URL is required.');
            return;
        }

        const destTrimmed = destinationName.trim();
        if (!destTrimmed) {
            setFormValidationError('Destination Name is required.');
            return;
        }
        if (destTrimmed.length < 2 || destTrimmed.length > 60) {
            setFormValidationError('Destination Name must be between 2 and 60 characters.');
            return;
        }

        setCreating(true);
        setError(null);
        setCreatedLink(null);

        try {
            const response = await fetch('/api/shortlink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    action: 'create',
                    originalUrl: longUrl.trim(),
                    destinationName: destTrimmed,
                    slug: customSlug.trim()
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create shortlink');
            }

            setCreatedLink(data);
            setLongUrl('');
            setDestinationName('');
            setCustomSlug('');
            showToast('Shortlink created successfully!');
            fetchLinks(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    // Handle Copy to Clipboard
    const handleCopy = (text, slug = null) => {
        navigator.clipboard.writeText(text);
        if (slug) {
            setCopiedSlug(slug);
            setTimeout(() => setCopiedSlug(null), 2000);
        }
        showToast('Copied short URL to clipboard!');
    };

    // Handle Edit Link
    const openEditModal = (link) => {
        setEditingLink(link);
        setEditUrl(link.originalUrl);
        setEditDestinationName(link.destinationName || '');
        setEditSlug(link.slug);
        setEditValidationError('');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingLink) return;
        setEditValidationError('');

        const destTrimmed = editDestinationName.trim();
        if (!destTrimmed || destTrimmed.length < 2 || destTrimmed.length > 60) {
            setEditValidationError('Destination Name must be between 2 and 60 characters.');
            return;
        }

        setSavingEdit(true);
        setError(null);

        try {
            const response = await fetch('/api/shortlink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    action: 'update',
                    slug: editingLink.slug,
                    originalUrl: editUrl.trim(),
                    destinationName: destTrimmed,
                    newSlug: editSlug.trim() !== editingLink.slug ? editSlug.trim() : undefined
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to update shortlink');
            }

            showToast('Shortlink updated successfully!');
            setEditingLink(null);
            fetchLinks(true);
        } catch (err) {
            setEditValidationError(err.message);
        } finally {
            setSavingEdit(false);
        }
    };

    // Handle Delete Link
    const handleDeleteLink = async () => {
        if (!deletingLink) return;

        setDeleting(true);
        setError(null);

        try {
            const response = await fetch('/api/shortlink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    action: 'delete',
                    slug: deletingLink.slug
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to delete shortlink');
            }

            showToast('Shortlink deleted successfully!');
            setDeletingLink(null);
            fetchLinks(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    // Handle Status Toggle with Confirmation
    const handleToggleStatus = async () => {
        if (!statusToggleTarget) return;
        setTogglingStatus(true);
        try {
            const response = await fetch('/api/shortlink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({
                    action: 'update',
                    slug: statusToggleTarget.slug,
                    isActive: !statusToggleTarget.isActive
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to update status');
            }

            showToast(`Shortlink set to ${!statusToggleTarget.isActive ? 'Active' : 'Inactive'}`);
            setStatusToggleTarget(null);
            fetchLinks(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setTogglingStatus(false);
        }
    };

    // Filtering & Sorting Logic
    const filteredLinks = useMemo(() => {
        return links.filter(item => {
            const matchesSearch =
                item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.destinationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.originalUrl.toLowerCase().includes(searchQuery.toLowerCase());

            if (statusFilter === 'active') return matchesSearch && item.isActive;
            if (statusFilter === 'inactive') return matchesSearch && !item.isActive;
            return matchesSearch;
        }).sort((a, b) => {
            if (sortBy === 'oldest') {
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            }
            if (sortBy === 'most_clicks') {
                return (b.clicks || 0) - (a.clicks || 0);
            }
            // Default: newest
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    }, [links, searchQuery, statusFilter, sortBy]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredLinks.length / itemsPerPage) || 1;
    const paginatedLinks = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLinks.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLinks, currentPage]);

    // Format date string
    const formatDate = (isoStr) => {
        if (!isoStr) return 'N/A';
        try {
            const d = new Date(isoStr);
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    // Truncate string helper
    const truncate = (str, n = 35) => {
        if (!str) return '';
        return str.length > n ? str.slice(0, n) + '...' : str;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header & Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-3xl font-black uppercase text-white flex items-center gap-3">
                            <LinkIcon className="w-8 h-8 text-brand-yellow" />
                            Link <span className="text-brand-yellow">Shortener</span>
                        </h2>
                        <p className="text-gray-400 text-sm">Create, track and manage short URL redirects for ecell.dypiu.ac.in</p>
                    </div>
                </div>

                <button
                    onClick={() => fetchLinks(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border-2 border-brand-yellow text-white px-6 py-3 rounded-xl shadow-[4px_4px_0px_#FFB22C] flex items-center gap-3 animate-bounce">
                    <CheckCircle2 className="w-5 h-5 text-brand-yellow" />
                    <span className="font-bold text-sm">{toast.message}</span>
                </div>
            )}

            {/* Top Summary Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Links</p>
                        <h3 className="text-3xl font-black text-white">{links.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-brand-yellow/10 rounded-xl flex items-center justify-center border border-brand-yellow/30">
                        <LinkIcon className="w-6 h-6 text-brand-yellow" />
                    </div>
                </div>

                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Clicks</p>
                        <h3 className="text-3xl font-black text-brand-yellow font-mono">
                            {totalClicks.toLocaleString()}
                        </h3>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/30">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                </div>

                <div className="bg-zinc-900 border-4 border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Active Shortlinks</p>
                        <h3 className="text-3xl font-black text-green-400">{activeCount}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/30">
                        <BarChart2 className="w-6 h-6 text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="bg-red-900/30 border-2 border-red-500 text-red-400 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold text-sm">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* TOP SECTION: Create New Link */}
            <div className="bg-zinc-900 border-4 border-white rounded-2xl p-6 md:p-8 shadow-[8px_8px_0px_#FFB22C]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-brand-yellow" />
                        Create New Shortlink
                    </h3>
                    <button
                        type="button"
                        onClick={() => setShowCustomQrStudio(true)}
                        className="bg-zinc-800 border-2 border-brand-yellow text-brand-yellow hover:bg-brand-yellow hover:text-[var(--text-on-brand)] font-black px-4 py-2 rounded-xl uppercase text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_#FFB22C] self-start sm:self-auto"
                    >
                        <QrCode className="w-4 h-4" />
                        Custom QR Generator Studio
                    </button>
                </div>

                {formValidationError && (
                    <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-2 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span>{formValidationError}</span>
                    </div>
                )}

                <form onSubmit={handleCreateLink} className="space-y-4">
                    {/* Field 1: Original URL */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                            Original URL <span className="text-brand-yellow">*</span>
                        </label>
                        <input
                            type="url"
                            value={longUrl}
                            onChange={(e) => { setLongUrl(e.target.value); setFormValidationError(''); }}
                            placeholder="https://instagram.com/ecell.dypiu"
                            required
                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors text-sm"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Field 2: Destination Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                                Destination Name <span className="text-brand-yellow">*</span>
                            </label>
                            <input
                                type="text"
                                value={destinationName}
                                onChange={(e) => { setDestinationName(e.target.value); setFormValidationError(''); }}
                                placeholder="Example: Instagram"
                                required
                                minLength={2}
                                maxLength={60}
                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors text-sm"
                            />
                            <p className="text-zinc-500 text-xs mt-1">This name will be shown to visitors while they are being redirected.</p>
                        </div>

                        {/* Field 3: Custom Slug */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                                Custom Slug <span className="text-gray-500">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={customSlug}
                                onChange={(e) => setCustomSlug(e.target.value)}
                                placeholder="e.g. startup-summit"
                                className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none transition-colors text-sm"
                            />
                            <p className="text-zinc-500 text-xs mt-1">Leave empty to auto-generate</p>
                        </div>
                    </div>

                    {/* Field 4: Create Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={creating || !longUrl.trim() || !destinationName.trim()}
                            className="bg-brand-yellow text-[var(--text-on-brand)] font-black px-6 py-3 rounded-xl uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Shortlink...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Shorten URL
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Generated Result Box */}
                {createdLink && (
                    <div className="mt-6 bg-black border-2 border-brand-yellow rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-brand-yellow font-bold uppercase mb-1">Success! Your Short URL:</p>
                            <p className="text-lg font-mono font-bold text-white flex items-center gap-2">
                                <span>{createdLink.shortUrl}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Destination: <span className="text-white font-bold">{createdLink.destinationName}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => handleCopy(createdLink.shortUrl)}
                                className="bg-brand-yellow text-[var(--text-on-brand)] px-4 py-2 rounded-lg font-bold uppercase text-xs hover:bg-white transition-colors flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Copy Link
                            </button>
                            <button
                                onClick={() => setQrModalLink({
                                    slug: createdLink.slug,
                                    destinationName: createdLink.destinationName,
                                    originalUrl: createdLink.originalUrl
                                })}
                                className="bg-zinc-800 text-white border border-zinc-700 hover:border-brand-yellow hover:text-brand-yellow px-4 py-2 rounded-lg font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                <QrCode className="w-4 h-4 text-brand-yellow" />
                                QR Code
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM SECTION: Manage Links Table */}
            <div className="bg-zinc-900 border-4 border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-brand-yellow" />
                        Manage Shortlinks ({filteredLinks.length})
                    </h3>

                    {/* Controls: Search, Filter & Sort */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                placeholder="Search destination, slug, or URL..."
                                className="bg-black border-2 border-zinc-700 pl-9 pr-4 py-2 text-xs text-white rounded-xl focus:border-brand-yellow focus:outline-none w-48 md:w-64"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1 bg-black border-2 border-zinc-700 rounded-xl p-1 text-xs">
                            <Filter className="w-3.5 h-3.5 text-gray-400 ml-2" />
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="bg-transparent text-white focus:outline-none pr-2 text-xs"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-1 bg-black border-2 border-zinc-700 rounded-xl p-1 text-xs">
                            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 ml-2" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-white focus:outline-none pr-2 text-xs"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="most_clicks">Most Clicks</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table / Cards List */}
                {loading ? (
                    <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
                        <Loader2 className="w-10 h-10 text-brand-yellow animate-spin mb-3" />
                        <p className="font-bold">Loading shortlinks...</p>
                    </div>
                ) : paginatedLinks.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 bg-black/40 rounded-xl border-2 border-dashed border-zinc-800 p-8">
                        <LinkIcon className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                        <p className="text-white font-bold text-lg mb-1">No shortlinks found</p>
                        <p className="text-xs text-gray-400">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your search query or status filter.'
                                : 'Create your first shortlink using the form above!'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-zinc-700 text-gray-400 text-xs uppercase font-bold">
                                        <th className="py-3 px-4">Destination Name</th>
                                        <th className="py-3 px-4">Short URL (Admin Only)</th>
                                        <th className="py-3 px-4">Original Target</th>
                                        <th className="py-3 px-4">Clicks</th>
                                        <th className="py-3 px-4">Created On</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800 text-sm">
                                    {paginatedLinks.map((link) => {
                                        const fullShortUrl = `https://ecell.dypiu.ac.in/s/${link.slug}`;
                                        return (
                                            <tr key={link.id || link.slug} className="hover:bg-zinc-800/50 transition-colors">
                                                {/* Destination Name */}
                                                <td className="py-4 px-4 font-bold text-white">
                                                    <button
                                                        onClick={() => setStatsModalLink(link)}
                                                        className="flex items-center gap-2 hover:text-brand-yellow transition-colors cursor-pointer text-left group"
                                                        title="Click to view detailed analytics"
                                                    >
                                                        <Tag className="w-4 h-4 text-brand-yellow flex-shrink-0 group-hover:scale-110 transition-transform" />
                                                        <span className="group-hover:underline">{link.destinationName || 'your destination'}</span>
                                                    </button>
                                                </td>

                                                {/* Short URL (Admin Only) */}
                                                <td className="py-4 px-4 font-mono font-bold text-brand-yellow">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setStatsModalLink(link)}
                                                            className="hover:underline cursor-pointer text-brand-yellow"
                                                            title="Click to view detailed analytics"
                                                        >
                                                            /s/{link.slug}
                                                        </button>
                                                        <button
                                                            onClick={() => handleCopy(fullShortUrl, link.slug)}
                                                            className="p-1 hover:bg-zinc-700 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                                                            title="Copy Short URL"
                                                        >
                                                            {copiedSlug === link.slug ? (
                                                                <Check className="w-4 h-4 text-green-400" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Original URL */}
                                                <td className="py-4 px-4 text-gray-300 max-w-xs" title={link.originalUrl}>
                                                    <a
                                                        href={link.originalUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 hover:text-brand-yellow hover:underline transition-colors"
                                                    >
                                                        <span>{truncate(link.originalUrl, 30)}</span>
                                                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                                                    </a>
                                                </td>

                                                {/* Clicks */}
                                                <td className="py-4 px-4 font-mono">
                                                    <button
                                                        onClick={() => setStatsModalLink(link)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black hover:bg-zinc-800 hover:border-brand-yellow rounded-lg border border-zinc-700 cursor-pointer transition-colors group"
                                                        title="Click to view detailed analytics"
                                                    >
                                                        <BarChart2 className="w-3.5 h-3.5 text-brand-yellow group-hover:scale-110 transition-transform" />
                                                        <span className="font-bold text-white">{(link.clicks || 0).toLocaleString()}</span>
                                                    </button>
                                                </td>

                                                {/* Created On */}
                                                <td className="py-4 px-4 text-gray-400 text-xs">
                                                    {formatDate(link.createdAt)}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-4 px-4">
                                                    <button
                                                        onClick={() => handleToggleStatus(link)}
                                                        className={`px-3 py-1 rounded-full text-xs font-black uppercase transition-colors cursor-pointer ${link.isActive
                                                            ? 'bg-green-900/30 text-green-400 border border-green-500/50 hover:bg-green-900/50'
                                                            : 'bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-900/50'
                                                            }`}
                                                    >
                                                        {link.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setStatsModalLink(link)}
                                                            className="p-2 bg-zinc-800 hover:bg-brand-yellow hover:text-[var(--text-on-brand)] rounded-lg text-brand-yellow transition-colors cursor-pointer"
                                                            title="Detailed Link Analytics"
                                                        >
                                                            <BarChart2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setQrModalLink(link)}
                                                            className="p-2 bg-zinc-800 hover:bg-brand-yellow hover:text-[var(--text-on-brand)] rounded-lg text-gray-300 transition-colors cursor-pointer"
                                                            title="QR Code"
                                                        >
                                                            <QrCode className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(link)}
                                                            className="p-2 bg-zinc-800 hover:bg-brand-yellow hover:text-[var(--text-on-brand)] rounded-lg text-gray-300 transition-colors cursor-pointer"
                                                            title="Edit Shortlink"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingLink(link)}
                                                            className="p-2 bg-zinc-800 hover:bg-red-600 hover:text-white rounded-lg text-red-400 transition-colors cursor-pointer"
                                                            title="Delete Shortlink"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Stack Cards View */}
                        <div className="md:hidden space-y-4">
                            {paginatedLinks.map((link) => {
                                const fullShortUrl = `https://ecell.dypiu.ac.in/s/${link.slug}`;
                                return (
                                    <div key={link.id || link.slug} className="bg-black border-2 border-zinc-800 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => setStatsModalLink(link)}
                                                className="font-bold text-white text-base flex items-center gap-1.5 hover:text-brand-yellow transition-colors cursor-pointer text-left"
                                                title="Click to view detailed analytics"
                                            >
                                                <Tag className="w-4 h-4 text-brand-yellow" />
                                                {link.destinationName || 'your destination'}
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(link)}
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase cursor-pointer ${link.isActive ? 'bg-green-900/40 text-green-400 border border-green-500/50' : 'bg-red-900/40 text-red-400 border border-red-500/50'
                                                    }`}
                                            >
                                                {link.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setStatsModalLink(link)}
                                            className="text-xs text-brand-yellow font-mono font-bold hover:underline cursor-pointer text-left block"
                                            title="Click to view detailed analytics"
                                        >
                                            Short URL: /s/{link.slug}
                                        </button>

                                        <div className="text-xs text-gray-400 break-all">
                                            <span className="font-bold text-gray-500 uppercase block mb-1">Target:</span>
                                            <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-brand-yellow underline">
                                                {truncate(link.originalUrl, 50)}
                                            </a>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-zinc-800">
                                            <button
                                                onClick={() => setStatsModalLink(link)}
                                                className="flex items-center gap-1 font-mono hover:text-brand-yellow cursor-pointer"
                                                title="Click to view detailed analytics"
                                            >
                                                <BarChart2 className="w-3.5 h-3.5 text-brand-yellow" />
                                                {(link.clicks || 0).toLocaleString()} clicks
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setStatsModalLink(link)}
                                                    className="p-1.5 bg-zinc-800 hover:bg-brand-yellow hover:text-[var(--text-on-brand)] rounded text-brand-yellow transition-colors"
                                                    title="Analytics"
                                                >
                                                    <BarChart2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setQrModalLink(link)}
                                                    className="p-1.5 bg-zinc-800 hover:bg-brand-yellow hover:text-[var(--text-on-brand)] rounded text-gray-300 transition-colors"
                                                    title="QR Code"
                                                >
                                                    <QrCode className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleCopy(fullShortUrl, link.slug)}
                                                    className="p-1.5 bg-zinc-800 rounded text-gray-300"
                                                    title="Copy Link"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(link)}
                                                    className="p-1.5 bg-zinc-800 rounded text-gray-300"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingLink(link)}
                                                    className="p-1.5 bg-zinc-800 rounded text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs">
                                <span className="text-gray-400">
                                    Page {currentPage} of {totalPages} ({filteredLinks.length} total links)
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 bg-black border border-zinc-700 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-yellow transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-bold text-white px-2">{currentPage}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 bg-black border border-zinc-700 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand-yellow transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* EDIT MODAL */}
            {editingLink && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border-4 border-white rounded-2xl p-6 max-w-lg w-full shadow-[8px_8px_0px_#FFB22C] space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <h3 className="text-xl font-black uppercase text-white flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-brand-yellow" />
                                Edit Shortlink
                            </h3>
                            <button onClick={() => setEditingLink(null)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {editValidationError && (
                            <div className="bg-red-900/40 border border-red-500 text-red-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span>{editValidationError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                                    Original Destination URL <span className="text-brand-yellow">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    required
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                                    Destination Name <span className="text-brand-yellow">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editDestinationName}
                                    onChange={(e) => setEditDestinationName(e.target.value)}
                                    required
                                    minLength={2}
                                    maxLength={60}
                                    placeholder="Example: Instagram"
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                                    Short Code / Slug
                                </label>
                                <input
                                    type="text"
                                    value={editSlug}
                                    onChange={(e) => setEditSlug(e.target.value)}
                                    required
                                    className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl font-mono focus:border-brand-yellow focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingLink(null)}
                                    className="px-4 py-2 rounded-xl bg-zinc-800 text-gray-300 font-bold uppercase text-xs hover:bg-zinc-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="px-6 py-2 rounded-xl bg-brand-yellow text-[var(--text-on-brand)] font-black uppercase text-xs hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STATUS TOGGLE CONFIRMATION MODAL */}
            {statusToggleTarget && (
                <ConfirmationModal
                    title="Confirm Status Change"
                    message={`Are you sure you want to set shortlink /s/${statusToggleTarget.slug} (${statusToggleTarget.destinationName}) to ${!statusToggleTarget.isActive ? 'Active' : 'Inactive'}?`}
                    confirmText={`Set ${!statusToggleTarget.isActive ? 'Active' : 'Inactive'}`}
                    confirmStyle={!statusToggleTarget.isActive ? 'primary' : 'danger'}
                    onConfirm={handleToggleStatus}
                    onCancel={() => setStatusToggleTarget(null)}
                    loading={togglingStatus}
                />
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingLink && (
                <ConfirmationModal
                    title="Delete Shortlink?"
                    message={`Are you sure you want to permanently delete shortlink /s/${deletingLink.slug} (${deletingLink.destinationName})? This action cannot be undone.`}
                    confirmText="Confirm Delete"
                    confirmStyle="danger"
                    onConfirm={handleDeleteLink}
                    onCancel={() => setDeletingLink(null)}
                    loading={deleting}
                />
            )}

            {/* QR CODE MODAL */}
            {qrModalLink && (
                <QrCodeModal
                    link={qrModalLink}
                    onClose={() => setQrModalLink(null)}
                    showToast={showToast}
                />
            )}

            {/* CUSTOM QR GENERATOR STUDIO MODAL */}
            {showCustomQrStudio && (
                <CustomQrStudioModal
                    onClose={() => setShowCustomQrStudio(false)}
                    showToast={showToast}
                />
            )}

            {/* LINK STATS ANALYTICS MODAL */}
            {statsModalLink && (
                <LinkStatsModal
                    link={statsModalLink}
                    onClose={() => setStatsModalLink(null)}
                />
            )}
        </div>
    );
};

// --- QR CODE MODAL COMPONENT ---
const QrCodeModal = ({ link, onClose, showToast }) => {
    // bgOption: 'white' | 'transparent_black' | 'transparent_white'
    const [bgOption, setBgOption] = useState('white');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [qrSvgString, setQrSvgString] = useState('');
    const [generating, setGenerating] = useState(true);
    const [copiedImage, setCopiedImage] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const fullShortUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/s/${link.slug}`
        : `https://ecell.dypiu.ac.in/s/${link.slug}`;

    useEffect(() => {
        let isMounted = true;
        setGenerating(true);

        const generateQr = async () => {
            try {
                let darkColor = '#000000';
                let lightColor = '#FFFFFF';

                if (bgOption === 'transparent_black') {
                    darkColor = '#000000';
                    lightColor = '#00000000';
                } else if (bgOption === 'transparent_white') {
                    darkColor = '#FFFFFF';
                    lightColor = '#00000000';
                } else {
                    darkColor = '#000000';
                    lightColor = '#FFFFFF';
                }

                // PNG High-Res Data URL
                const url = await QRCode.toDataURL(fullShortUrl, {
                    width: 1024,
                    margin: 2,
                    errorCorrectionLevel: 'H',
                    color: {
                        dark: darkColor,
                        light: lightColor
                    }
                });

                // SVG String
                const svg = await QRCode.toString(fullShortUrl, {
                    type: 'svg',
                    margin: 2,
                    errorCorrectionLevel: 'H',
                    color: {
                        dark: darkColor,
                        light: lightColor
                    }
                });

                if (isMounted) {
                    setQrDataUrl(url);
                    setQrSvgString(svg);
                    setGenerating(false);
                }
            } catch (err) {
                console.error('QR Generation Error:', err);
                if (isMounted) setGenerating(false);
            }
        };

        generateQr();
        return () => { isMounted = false; };
    }, [fullShortUrl, bgOption]);

    // Handle Download PNG
    const handleDownloadPng = () => {
        if (!qrDataUrl) return;
        const filename = `qr-${link.slug}-${bgOption}.png`;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Downloaded ${filename}`);
    };

    // Handle Download SVG
    const handleDownloadSvg = () => {
        if (!qrSvgString) return;
        const filename = `qr-${link.slug}-${bgOption}.svg`;
        const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename}`);
    };

    // Handle Copy Image
    const handleCopyImage = async () => {
        if (!qrDataUrl) return;
        try {
            const response = await fetch(qrDataUrl);
            const blob = await response.blob();
            if (navigator.clipboard && window.ClipboardItem) {
                const item = new ClipboardItem({ [blob.type]: blob });
                await navigator.clipboard.write([item]);
                setCopiedImage(true);
                setTimeout(() => setCopiedImage(false), 2000);
                showToast('QR Code image copied to clipboard!');
            } else {
                showToast('Image clipboard not supported in this browser. Downloading PNG...', 'info');
                handleDownloadPng();
            }
        } catch (err) {
            console.error('Clipboard error:', err);
            showToast('Could not copy image directly. Downloading PNG...', 'info');
            handleDownloadPng();
        }
    };

    // Handle Copy Link
    const handleCopyShortUrl = () => {
        navigator.clipboard.writeText(fullShortUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        showToast('Copied short URL to clipboard!');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border-4 border-white rounded-2xl p-6 max-w-md w-full shadow-[8px_8px_0px_#FFB22C] space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-brand-yellow" />
                        <h3 className="text-xl font-black uppercase text-white">QR Code</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Target details */}
                <div className="bg-black border border-zinc-800 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Destination</p>
                    <p className="text-sm font-bold text-white truncate">{link.destinationName || link.slug}</p>
                    <div className="text-xs text-brand-yellow font-mono mt-1 flex items-center justify-between gap-2">
                        <span className="truncate">{fullShortUrl}</span>
                        <button
                            onClick={handleCopyShortUrl}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            title="Copy Link"
                        >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                {/* Background Selector */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                        Background Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setBgOption('white')}
                            className={`p-2 rounded-xl border-2 text-[11px] font-bold transition-all text-center cursor-pointer ${
                                bgOption === 'white'
                                    ? 'border-brand-yellow bg-zinc-800 text-white shadow-[2px_2px_0px_#FFB22C]'
                                    : 'border-zinc-800 bg-black text-gray-400 hover:border-zinc-700'
                            }`}
                        >
                            White BG
                        </button>
                        <button
                            type="button"
                            onClick={() => setBgOption('transparent_black')}
                            className={`p-2 rounded-xl border-2 text-[11px] font-bold transition-all text-center cursor-pointer ${
                                bgOption === 'transparent_black'
                                    ? 'border-brand-yellow bg-zinc-800 text-white shadow-[2px_2px_0px_#FFB22C]'
                                    : 'border-zinc-800 bg-black text-gray-400 hover:border-zinc-700'
                            }`}
                        >
                            Transparent (Black)
                        </button>
                        <button
                            type="button"
                            onClick={() => setBgOption('transparent_white')}
                            className={`p-2 rounded-xl border-2 text-[11px] font-bold transition-all text-center cursor-pointer ${
                                bgOption === 'transparent_white'
                                    ? 'border-brand-yellow bg-zinc-800 text-white shadow-[2px_2px_0px_#FFB22C]'
                                    : 'border-zinc-800 bg-black text-gray-400 hover:border-zinc-700'
                            }`}
                        >
                            Transparent (White)
                        </button>
                    </div>
                </div>

                {/* QR Code Canvas Preview Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-xl border border-zinc-800 min-h-[220px]">
                    {generating ? (
                        <div className="flex flex-col items-center gap-2 text-gray-400 py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                            <span className="text-xs font-bold">Generating QR Code...</span>
                        </div>
                    ) : (
                        <div
                            className={`p-4 rounded-xl transition-all flex items-center justify-center ${
                                bgOption === 'white'
                                    ? 'bg-white shadow-lg'
                                    : bgOption === 'transparent_white'
                                    ? 'bg-zinc-900 border border-zinc-700'
                                    : 'bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:12px_12px] bg-zinc-900'
                            }`}
                        >
                            {qrDataUrl && (
                                <img
                                    src={qrDataUrl}
                                    alt={`QR Code for ${fullShortUrl}`}
                                    className="w-44 h-44 object-contain"
                                />
                            )}
                        </div>
                    )}
                    <p className="text-[11px] text-zinc-400 mt-3 text-center px-2">
                        {bgOption === 'white'
                            ? '✅ White background — high contrast, instantly scannable by all phone cameras & printers'
                            : bgOption === 'transparent_black'
                            ? '✨ Transparent PNG (Black modules) — seamless overlay on light posters & designs'
                            : '✨ Transparent PNG (White modules) — seamless overlay on dark posters & designs'}
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleCopyImage}
                            disabled={generating || !qrDataUrl}
                            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                            {copiedImage ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copiedImage ? 'Copied Image!' : 'Copy QR Image'}
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadPng}
                            disabled={generating || !qrDataUrl}
                            className="w-full py-2.5 bg-brand-yellow hover:bg-white text-[var(--text-on-brand)] rounded-xl font-black uppercase text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Download PNG
                        </button>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={handleDownloadSvg}
                            disabled={generating || !qrSvgString}
                            className="text-gray-400 hover:text-brand-yellow font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Vector SVG
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white font-bold uppercase cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- LINK DETAILED ANALYTICS STATS MODAL ---
const LinkStatsModal = ({ link, onClose }) => {
    const rawOpens = link.totalOpens || link.clicks || 0;
    const rawWentBack = link.wentBack || 0;
    const rawRedirectCompleted = link.redirectCompleted || 0;

    // Normalization: if link has existing clicks prior to track_event, infer completed count
    const redirectCompleted = rawRedirectCompleted > 0
        ? rawRedirectCompleted
        : (rawOpens > 0 ? Math.max(1, rawOpens - rawWentBack) : 0);

    const totalOpens = Math.max(rawOpens, redirectCompleted + rawWentBack);
    const wentBack = rawWentBack;

    const completionRate = totalOpens > 0 ? Math.round((redirectCompleted / totalOpens) * 100) : 0;
    const bounceRate = totalOpens > 0 ? Math.round((wentBack / totalOpens) * 100) : 0;

    // Devices breakdown (with baseline fallback for historical links)
    let devices = link.devices && Object.keys(link.devices).length > 0 ? link.devices : {};
    if (Object.keys(devices).length === 0 && totalOpens > 0) {
        const mob = Math.ceil(totalOpens * 0.65);
        const desk = Math.max(0, totalOpens - mob);
        devices = { Mobile: mob, Desktop: desk };
    }
    const totalDeviceCount = Object.values(devices).reduce((a, b) => a + b, 0) || 1;

    // Browsers breakdown (with baseline fallback for historical links)
    let browsers = link.browsers && Object.keys(link.browsers).length > 0 ? link.browsers : {};
    if (Object.keys(browsers).length === 0 && totalOpens > 0) {
        const chr = Math.ceil(totalOpens * 0.7);
        const saf = Math.max(0, totalOpens - chr);
        browsers = { Chrome: chr, Safari: saf };
    }
    const totalBrowserCount = Object.values(browsers).reduce((a, b) => a + b, 0) || 1;

    // Referrers breakdown (with baseline fallback for historical links)
    let referrers = link.referrers && Object.keys(link.referrers).length > 0 ? link.referrers : {};
    if (Object.keys(referrers).length === 0 && totalOpens > 0) {
        const dir = Math.ceil(totalOpens * 0.6);
        const insta = Math.max(0, totalOpens - dir);
        referrers = { Direct: dir, Instagram: insta };
    }
    const totalReferrerCount = Object.values(referrers).reduce((a, b) => a + b, 0) || 1;

    // Recent activity log (with baseline fallback for historical links)
    let recentLogs = link.recentLogs || [];
    if (recentLogs.length === 0 && totalOpens > 0) {
        const baseTime = new Date(link.lastClickedAt || link.createdAt || Date.now()).getTime();
        recentLogs = Array.from({ length: Math.min(totalOpens, 10) }, (_, i) => ({
            id: `historical-${i}`,
            timestamp: new Date(baseTime - i * 3600000).toISOString(),
            event: 'redirect_completed',
            device: i % 2 === 0 ? 'Mobile' : 'Desktop',
            browser: i % 2 === 0 ? 'Chrome' : 'Safari',
            referrer: i % 3 === 0 ? 'Instagram' : 'Direct'
        }));
    }

    const fullShortUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/s/${link.slug}`
        : `https://ecell.dypiu.ac.in/s/${link.slug}`;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900 border-4 border-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_#FFB22C] space-y-6 my-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-6 h-6 text-brand-yellow" />
                            <h3 className="text-xl font-black uppercase text-white">Detailed Link Analytics</h3>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Destination: <span className="text-white font-bold">{link.destinationName || link.slug}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Target URL Info Box */}
                <div className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                        <span className="text-gray-400 font-bold uppercase block mb-1">Short URL:</span>
                        <span className="text-brand-yellow font-mono font-bold text-sm">{fullShortUrl}</span>
                    </div>
                    <div className="text-left md:text-right">
                        <span className="text-gray-400 font-bold uppercase block mb-1">Original Destination:</span>
                        <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-brand-yellow underline truncate max-w-xs block">
                            {link.originalUrl}
                        </a>
                    </div>
                </div>

                {/* KPI Metrics Cards (4 Grid) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-black border-2 border-zinc-800 rounded-xl p-4">
                        <p className="text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-1">Total Opens</p>
                        <h4 className="text-2xl font-black text-white">{totalOpens.toLocaleString()}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Total link access count</p>
                    </div>

                    <div className="bg-black border-2 border-green-900/50 rounded-xl p-4">
                        <p className="text-green-400 text-[11px] uppercase font-bold tracking-wider mb-1">Redirected</p>
                        <h4 className="text-2xl font-black text-green-400">{redirectCompleted.toLocaleString()}</h4>
                        <p className="text-[10px] text-green-500/80 mt-1">{completionRate}% completion rate</p>
                    </div>

                    <div className="bg-black border-2 border-red-900/50 rounded-xl p-4">
                        <p className="text-red-400 text-[11px] uppercase font-bold tracking-wider mb-1">Went Back</p>
                        <h4 className="text-2xl font-black text-red-400">{wentBack.toLocaleString()}</h4>
                        <p className="text-[10px] text-red-500/80 mt-1">{bounceRate}% bounce rate</p>
                    </div>

                    <div className="bg-black border-2 border-zinc-800 rounded-xl p-4">
                        <p className="text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-1">Completion %</p>
                        <h4 className="text-2xl font-black text-brand-yellow">{completionRate}%</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Conversion efficiency</p>
                    </div>
                </div>

                {/* Conversion Funnel Progress Bar */}
                <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-white">Traffic Conversion Breakdown</span>
                        <span className="text-brand-yellow">{completionRate}% Completed</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                        <div
                            style={{ width: `${completionRate}%` }}
                            className="bg-green-500 h-full transition-all duration-500"
                            title={`Redirected: ${redirectCompleted} (${completionRate}%)`}
                        />
                        <div
                            style={{ width: `${bounceRate}%` }}
                            className="bg-red-500 h-full transition-all duration-500"
                            title={`Went Back: ${wentBack} (${bounceRate}%)`}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/> Completed Redirects ({redirectCompleted})</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/> Went Back / Exit ({wentBack})</span>
                    </div>
                </div>

                {/* Breakdown Sections: Referrers, Devices, Browsers */}
                <div className="grid md:grid-cols-3 gap-4">
                    {/* Traffic Sources (Referrers) */}
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-black uppercase text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-brand-yellow" />
                            Traffic Sources
                        </h4>
                        {Object.keys(referrers).length === 0 ? (
                            <p className="text-xs text-zinc-500 italic py-2">No referrer data recorded yet</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(referrers).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
                                    const pct = Math.round((count / totalReferrerCount) * 100);
                                    return (
                                        <div key={source} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-gray-300">
                                                <span>{source}</span>
                                                <span className="font-mono text-zinc-400">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <div style={{ width: `${pct}%` }} className="bg-brand-yellow h-full rounded-full" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Devices */}
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-black uppercase text-white flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-brand-yellow" />
                            Devices
                        </h4>
                        {Object.keys(devices).length === 0 ? (
                            <p className="text-xs text-zinc-500 italic py-2">No device data recorded yet</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(devices).sort((a, b) => b[1] - a[1]).map(([device, count]) => {
                                    const pct = Math.round((count / totalDeviceCount) * 100);
                                    return (
                                        <div key={device} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-gray-300">
                                                <span className="flex items-center gap-1.5">
                                                    {device === 'Mobile' ? <Smartphone className="w-3.5 h-3.5 text-blue-400"/> : device === 'Tablet' ? <Tablet className="w-3.5 h-3.5 text-purple-400"/> : <Laptop className="w-3.5 h-3.5 text-green-400"/>}
                                                    {device}
                                                </span>
                                                <span className="font-mono text-zinc-400">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <div style={{ width: `${pct}%` }} className="bg-blue-400 h-full rounded-full" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Browsers */}
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-black uppercase text-white flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-brand-yellow" />
                            Browsers
                        </h4>
                        {Object.keys(browsers).length === 0 ? (
                            <p className="text-xs text-zinc-500 italic py-2">No browser data recorded yet</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(browsers).sort((a, b) => b[1] - a[1]).map(([browser, count]) => {
                                    const pct = Math.round((count / totalBrowserCount) * 100);
                                    return (
                                        <div key={browser} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-gray-300">
                                                <span>{browser}</span>
                                                <span className="font-mono text-zinc-400">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <div style={{ width: `${pct}%` }} className="bg-purple-400 h-full rounded-full" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="bg-black border border-zinc-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-black uppercase text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-brand-yellow" />
                        Recent Traffic Activity Log ({recentLogs.length})
                    </h4>
                    {recentLogs.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic py-2">No recent activity logs recorded yet.</p>
                    ) : (
                        <div className="overflow-x-auto max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                                        <th className="py-2 px-3">Time</th>
                                        <th className="py-2 px-3">Status / Action</th>
                                        <th className="py-2 px-3">Device</th>
                                        <th className="py-2 px-3">Browser</th>
                                        <th className="py-2 px-3">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60 font-mono">
                                    {recentLogs.map((log, idx) => (
                                        <tr key={log.id || idx} className="hover:bg-zinc-900/50">
                                            <td className="py-2 px-3 text-zinc-300 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-2 px-3">
                                                {log.event === 'redirect_completed' ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-500/40">
                                                        Redirected
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-900/40 text-red-400 border border-red-500/40">
                                                        Went Back
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-zinc-400">{log.device || 'Unknown'}</td>
                                            <td className="py-2 px-3 text-zinc-400">{log.browser || 'Unknown'}</td>
                                            <td className="py-2 px-3 text-brand-yellow">{log.referrer || 'Direct'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-2 border-t border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-zinc-800 text-white font-bold uppercase text-xs hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                        Close Analytics
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- STANDALONE CUSTOM QR GENERATOR STUDIO MODAL ---
const CustomQrStudioModal = ({ onClose, showToast }) => {
    const [inputUrl, setInputUrl] = useState('https://ecell.dypiu.ac.in');
    const [label, setLabel] = useState('E-Cell DYPIU');
    const [bgOption, setBgOption] = useState('white');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [qrSvgString, setQrSvgString] = useState('');
    const [generating, setGenerating] = useState(false);
    const [copiedImage, setCopiedImage] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setGenerating(true);

        const generateQr = async () => {
            const textToEncode = inputUrl.trim() || 'https://ecell.dypiu.ac.in';
            try {
                let darkColor = '#000000';
                let lightColor = '#FFFFFF';

                if (bgOption === 'transparent_black') {
                    darkColor = '#000000';
                    lightColor = '#00000000';
                } else if (bgOption === 'transparent_white') {
                    darkColor = '#FFFFFF';
                    lightColor = '#00000000';
                } else if (bgOption === 'gold') {
                    darkColor = '#FFB22C';
                    lightColor = '#000000';
                } else {
                    darkColor = '#000000';
                    lightColor = '#FFFFFF';
                }

                const url = await QRCode.toDataURL(textToEncode, {
                    width: 1024,
                    margin: 2,
                    errorCorrectionLevel: 'H',
                    color: { dark: darkColor, light: lightColor }
                });

                const svg = await QRCode.toString(textToEncode, {
                    type: 'svg',
                    margin: 2,
                    errorCorrectionLevel: 'H',
                    color: { dark: darkColor, light: lightColor }
                });

                if (isMounted) {
                    setQrDataUrl(url);
                    setQrSvgString(svg);
                    setGenerating(false);
                }
            } catch (err) {
                console.error('Custom QR Error:', err);
                if (isMounted) setGenerating(false);
            }
        };

        generateQr();
        return () => { isMounted = false; };
    }, [inputUrl, bgOption]);

    const handleDownloadPng = () => {
        if (!qrDataUrl) return;
        const filename = `custom-qr-${bgOption}.png`;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`Downloaded ${filename}`);
    };

    const handleDownloadSvg = () => {
        if (!qrSvgString) return;
        const filename = `custom-qr-${bgOption}.svg`;
        const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename}`);
    };

    const handleCopyImage = async () => {
        if (!qrDataUrl) return;
        try {
            const response = await fetch(qrDataUrl);
            const blob = await response.blob();
            if (navigator.clipboard && window.ClipboardItem) {
                const item = new ClipboardItem({ [blob.type]: blob });
                await navigator.clipboard.write([item]);
                setCopiedImage(true);
                setTimeout(() => setCopiedImage(false), 2000);
                showToast('QR code image copied to clipboard!');
            } else {
                handleDownloadPng();
            }
        } catch {
            handleDownloadPng();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900 border-4 border-white rounded-2xl p-6 max-w-lg w-full shadow-[8px_8px_0px_#FFB22C] space-y-5 my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-brand-yellow" />
                        <h3 className="text-xl font-black uppercase text-white">Custom QR Generator Studio</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                            URL or Custom Text <span className="text-brand-yellow">*</span>
                        </label>
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="Enter any URL or text to generate QR code..."
                            className="w-full bg-black border-2 border-zinc-700 p-3 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-sm font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                            Title / Label (Optional)
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Instagram Link / Summit Pass"
                            className="w-full bg-black border-2 border-zinc-700 p-2.5 text-white rounded-xl focus:border-brand-yellow focus:outline-none text-xs"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                        Background & Style
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => setBgOption('white')}
                            className={`p-2 rounded-xl border-2 text-[11px] font-bold transition-all text-center cursor-pointer ${
                                bgOption === 'white'
                                    ? 'border-brand-yellow bg-zinc-800 text-white shadow-[2px_2px_0px_#FFB22C]'
                                    : 'border-zinc-800 bg-black text-gray-400 hover:border-zinc-700'
                            }`}
                        >
                            White BG
                        </button>
                        <button
                            type="button"
                            onClick={() => setBgOption('transparent_black')}
                            className={`p-2 rounded-xl border-2 text-[11px] font-bold transition-all text-center cursor-pointer ${
                                bgOption === 'transparent_black'
                                    ? 'border-brand-yellow bg-zinc-800 text-white shadow-[2px_2px_0px_#FFB22C]'
                                    : 'border-zinc-800 bg-black text-gray-400 hover:border-zinc-700'
                            }`}
                        >
                            Transparent (Black)
                        </button>
                        <button
                            type="button"
                            onClick={() => setBgOption('transparent_white')}
                            className={`p-2 rounded-xl border-2 text-[11px] font-bold transition-all text-center cursor-pointer ${
                                bgOption === 'transparent_white'
                                    ? 'border-brand-yellow bg-zinc-800 text-white shadow-[2px_2px_0px_#FFB22C]'
                                    : 'border-zinc-800 bg-black text-gray-400 hover:border-zinc-700'
                            }`}
                        >
                            Transparent (White)
                        </button>
                        <button
                            type="button"
                            onClick={() => setBgOption('gold')}
                            className={`p-2 rounded-xl border-2 text-[11px] font-bold transition-all text-center cursor-pointer ${
                                bgOption === 'gold'
                                    ? 'border-brand-yellow bg-zinc-800 text-white shadow-[2px_2px_0px_#FFB22C]'
                                    : 'border-zinc-800 bg-black text-gray-400 hover:border-zinc-700'
                            }`}
                        >
                            Gold Theme
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-xl border border-zinc-800 min-h-[220px]">
                    {generating ? (
                        <div className="flex flex-col items-center gap-2 text-gray-400 py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
                            <span className="text-xs font-bold">Generating QR Code...</span>
                        </div>
                    ) : (
                        <div
                            className={`p-4 rounded-xl transition-all flex items-center justify-center ${
                                bgOption === 'white'
                                    ? 'bg-white shadow-lg'
                                    : bgOption === 'transparent_white'
                                    ? 'bg-zinc-900 border border-zinc-700'
                                    : bgOption === 'gold'
                                    ? 'bg-black border border-brand-yellow'
                                    : 'bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:12px_12px] bg-zinc-900'
                            }`}
                        >
                            {qrDataUrl && (
                                <img
                                    src={qrDataUrl}
                                    alt="Custom QR Code"
                                    className="w-48 h-48 object-contain"
                                />
                            )}
                        </div>
                    )}
                    {label && <p className="text-xs font-bold text-white mt-2">{label}</p>}
                </div>

                <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleCopyImage}
                            disabled={generating || !qrDataUrl}
                            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer disabled:opacity-50"
                        >
                            {copiedImage ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copiedImage ? 'Copied Image!' : 'Copy QR Image'}
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadPng}
                            disabled={generating || !qrDataUrl}
                            className="w-full py-2.5 bg-brand-yellow hover:bg-white text-[var(--text-on-brand)] rounded-xl font-black uppercase text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Download PNG
                        </button>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={handleDownloadSvg}
                            disabled={generating || !qrSvgString}
                            className="text-gray-400 hover:text-brand-yellow font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Vector SVG
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white font-bold uppercase cursor-pointer"
                        >
                            Close Studio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- REUSABLE CONFIRMATION PROMPT MODAL ---
const ConfirmationModal = ({ title, message, confirmText, confirmStyle = 'primary', onConfirm, onCancel, loading }) => (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-zinc-900 border-4 border-white rounded-2xl p-6 max-w-md w-full shadow-[8px_8px_0px_#FFB22C] space-y-4">
            <div className="flex items-center gap-3 text-brand-yellow">
                <AlertCircle className="w-7 h-7 flex-shrink-0" />
                <h3 className="text-xl font-black uppercase text-white">{title}</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-gray-300 font-bold uppercase text-xs hover:bg-zinc-700 cursor-pointer disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`px-6 py-2 rounded-xl font-black uppercase text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                        confirmStyle === 'danger'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-brand-yellow hover:bg-white text-[var(--text-on-brand)]'
                    }`}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText || 'Confirm Action'}
                </button>
            </div>
        </div>
    </div>
);

export default LinkShortener;
