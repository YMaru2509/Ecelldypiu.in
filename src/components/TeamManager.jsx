import { useState, useEffect } from 'react';
import {
    Users, PlusCircle, Search, Trash2, Edit3, Mail, Phone,
    User, Briefcase, Shield, Award, Sparkles, Code2, Palette,
    Share2, Megaphone, DollarSign, CheckCircle2, AlertCircle,
    Loader2, X, RefreshCw, ExternalLink, Image as ImageIcon, Database, Info, Upload, Camera, ZoomIn, Maximize2,
    GripVertical, LayoutGrid, List, Instagram, Calendar
} from 'lucide-react';

const DEPARTMENT_OPTIONS = [
    'Executive Board',
    'Technical Team',
    'Corporate Relations Team',
    'Management Team',
    'Design Team',
    'Social Media Team',
    'Public Relations Team',
    'Marketing Team',
    'Finance Team'
];

// Complete initial team dataset (57 members total across all departments & mentor)
const DEFAULT_TEAM_DATA = [
    // EXECUTIVE BOARD & MENTOR
    { name: 'Dr. Sandhya Ingale', position: 'Experienced Mentor', department: 'Executive Board', image: '/SANDHYA INGLE.jpeg', priority: 0 },
    { name: 'Yash Maru', position: 'President', department: 'Executive Board', image: '/team/yash-maru.jpeg', priority: 1 },
    { name: 'Preet Sonar', position: 'Vice-President', department: 'Executive Board', image: '/team/preet-sonar.jpg', priority: 2 },
    { name: 'D Disha Shree', position: 'General Secretary', department: 'Executive Board', image: '/team/d-disha-shree.png', priority: 3 },

    // FINANCE TEAM
    { name: 'Shantanu Patil', position: 'Treasurer', department: 'Finance Team', image: '/team/shantanu-patil.jpg', priority: 1 },

    // TECHNICAL TEAM
    { name: 'Rigved Aherrao', position: 'Tech Lead', department: 'Technical Team', image: '/team/rigved-aherrao.jpeg', priority: 1 },
    { name: 'Yash Tripathi', position: 'Tech Secretary', department: 'Technical Team', image: '/team/yash-tripathi.png', priority: 2 },
    { name: 'Diya Rathod', position: 'Tech Team Member', department: 'Technical Team', image: '/team/diya-rathod.jpg', priority: 3 },
    { name: 'Krushna Nirmalkar', position: 'Tech Team Member', department: 'Technical Team', image: '/team/krushna-nirmalkar.jpg', priority: 4 },
    { name: 'Riya Petle', position: 'Tech Team Member', department: 'Technical Team', image: '/team/riya-petle.jpg', priority: 5 },
    { name: 'Aadi Rohankar', position: 'Tech Team Member', department: 'Technical Team', image: '/team/aadi-rohankar.jpeg', priority: 6 },

    // CORPORATE RELATIONS TEAM
    { name: 'Ram Mittal', position: 'CR Lead', department: 'Corporate Relations Team', image: '/team/ram-mittal.jpg', priority: 1 },
    { name: 'Abhishek Ghate', position: 'CR Team Member', department: 'Corporate Relations Team', image: '/team/abhishek-ghate.jpeg', priority: 2 },
    { name: 'Aviraj Raut', position: 'CR Team Member', department: 'Corporate Relations Team', image: '/team/aviraj-raut.png', priority: 3 },
    { name: 'Koushal Pratap Singh', position: 'CR Team Member', department: 'Corporate Relations Team', image: '/team/koushal-pratap-singh.jpg', priority: 4 },
    { name: 'Ketaki', position: 'CR Team Member', department: 'Corporate Relations Team', image: '/team/ketaki.jpg', priority: 5 },
    { name: 'Aaryan Thole', position: 'CR Team Member', department: 'Corporate Relations Team', image: '/team/aaryan-thole.jpg', priority: 6 },

    // MANAGEMENT TEAM
    { name: 'Yash Jain', position: 'Ops Lead', department: 'Management Team', image: '/team/yash-jain.jpg', priority: 1 },
    { name: 'Nishant Kumar', position: 'Ops Secretary', department: 'Management Team', image: '/team/nishant-kumar.jpg', priority: 2 },
    { name: 'Vyom Singhai', position: 'Hospitality Lead', department: 'Management Team', image: '/team/vyom-singhai.jpg', priority: 3 },
    { name: 'Krushna Patil', position: 'Hospitality Secretary', department: 'Management Team', image: '/team/krushna-patil.png', priority: 4 },
    { name: 'Israr Sheikh', position: 'Security Joint-Lead', department: 'Management Team', image: '/team/israr-sheikh.jpg', priority: 5 },
    { name: 'Amey Mode', position: 'Security Joint-Lead', department: 'Management Team', image: '/team/amey-mode.png', priority: 6 },
    { name: 'Soham Raut', position: 'Management Team Member', department: 'Management Team', image: '/team/soham-raut.jpg', priority: 7 },
    { name: 'Harshit Barde', position: 'Management Team Member', department: 'Management Team', image: '/team/harshit-barde.png', priority: 8 },
    { name: 'Rohan Rijhwani', position: 'Management Team Member', department: 'Management Team', image: '/team/rohan-rijhwani.jpg', priority: 9 },
    { name: 'Suman', position: 'Management Team Member', department: 'Management Team', image: '/team/suman.jpg', priority: 10 },
    { name: 'Prince Jha', position: 'Management Team Member', department: 'Management Team', image: '/team/prince-jha.jpg', priority: 11 },
    { name: 'Sarthak Saoji', position: 'Management Team Member', department: 'Management Team', image: '/team/sarthak-saoji.png', priority: 12 },
    { name: 'Sharvari Burle', position: 'Management Team Member', department: 'Management Team', image: '/team/sharvari-burle.jpg', priority: 13 },
    { name: 'Madhura Joshi', position: 'Management Team Member', department: 'Management Team', image: '/team/madhura-joshi.jpg', priority: 14 },
    { name: 'Sneha Kelzarkar', position: 'Anchor', department: 'Management Team', image: '/team/sneha-kelzarkar.jpeg', priority: 15 },

    // DESIGN TEAM
    { name: 'Bhavika Deshmukh', position: 'Design Lead', department: 'Design Team', image: '/team/bhavika-deshmukh.png', priority: 1 },
    { name: 'Om Joshi', position: 'Design Secretary', department: 'Design Team', image: '/team/om-joshi.jpg', priority: 2 },
    { name: 'Aarushi Jain', position: 'Design Team Member', department: 'Design Team', image: '/team/aarushi-jain.jpg', priority: 3 },
    { name: 'Diya Bagul', position: 'Design Team Member', department: 'Design Team', image: '/team/diya-bagul.jpg', priority: 4 },
    { name: 'Krutika Ashapure', position: 'Design Team Member', department: 'Design Team', image: '/team/krutika-ashapure.jpg', priority: 5 },
    { name: 'Pranjal', position: 'Design Team Member', department: 'Design Team', image: '/team/pranjal.jpg', priority: 6 },
    { name: 'Palak Kariya', position: 'Design Team Member', department: 'Design Team', image: '/team/palak-kariya.jpg', priority: 7 },

    // SOCIAL MEDIA TEAM
    { name: 'Sharvari Khandait', position: 'Social Media Lead', department: 'Social Media Team', image: '/team/sharvari-khandait.jpg', priority: 1 },
    { name: 'Samikshit Ghule', position: 'Social Media Secretary', department: 'Social Media Team', image: '/team/samikshit-ghule.jpg', priority: 2 },
    { name: 'Almeer Khan', position: 'Social Media Team Member', department: 'Social Media Team', image: '/team/almeer-khan.jpg', priority: 3 },
    { name: 'Pawani Sharma', position: 'Social Media Team Member', department: 'Social Media Team', image: '/team/pawani-sharma.jpg', priority: 4 },
    { name: 'Viral Babariya', position: 'Social Media Team Member', department: 'Social Media Team', image: '/team/viral-babariya.jpg', priority: 5 },
    { name: 'Sankalp', position: 'Social Media Team Member', department: 'Social Media Team', image: '/team/sankalp.png', priority: 6 },

    // PUBLIC RELATIONS TEAM
    { name: 'Yash Pawar', position: 'PR Lead', department: 'Public Relations Team', image: '/team/yash-pawar.jpeg', priority: 1 },
    { name: 'Swara Pusalkar', position: 'PR Joint-Secretary', department: 'Public Relations Team', image: '/team/swara-pusalkar.jpg', priority: 2 },
    { name: 'Kali Kanungo', position: 'PR Joint-Secretary', department: 'Public Relations Team', image: '/team/kali-kanungo.jpg', priority: 3 },
    { name: 'Shravani Sakunde', position: 'PR Team Member', department: 'Public Relations Team', image: '/team/shravani-sakunde.jpeg', priority: 4 },

    // MARKETING TEAM
    { name: 'Pranav Batheja', position: 'Marketing Lead', department: 'Marketing Team', image: '/team/pranav-batheja.jpeg', priority: 1 },
    { name: 'Sanskruti Amdare', position: 'Marketing Secretary', department: 'Marketing Team', image: '/team/sanskruti-amdare.png', priority: 2 },
    { name: 'Anwesha Sahay', position: 'Marketing Team Member', department: 'Marketing Team', image: '/team/anwesha-sahay.jpg', priority: 3 },
    { name: 'Disha Sachdev', position: 'Marketing Team Member', department: 'Marketing Team', image: '/team/disha-sachdev.jpg', priority: 4 },
    { name: 'Priyal Bisen', position: 'Marketing Team Member', department: 'Marketing Team', image: '/team/priyal-bisen.jpg', priority: 5 },
    { name: 'Mitali Lodh', position: 'Marketing Team Member', department: 'Marketing Team', image: '/team/mitali-lodh.jpeg', priority: 6 },
    { name: 'Devesh Sankhla', position: 'Marketing Team Member', department: 'Marketing Team', image: '/team/devesh-sankhla.jpg', priority: 7 },
    { name: 'Vanshika Kanojiya', position: 'Marketing Team Member', department: 'Marketing Team', image: '/team/vanshika-kanojiya.jpg', priority: 8 }
];

export const DEFAULT_IMAGE_MAP = DEFAULT_TEAM_DATA.reduce((acc, member) => {
    acc[member.name.toLowerCase().trim()] = member.image;
    return acc;
}, {});

const TeamManager = ({ adminKey }) => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [failedImages, setFailedImages] = useState({});
    const [enlargedImage, setEnlargedImage] = useState(null);

    // Drag and Drop & View Mode States
    const [viewMode, setViewMode] = useState('live'); // 'live' or 'compact'
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [savingOrder, setSavingOrder] = useState(false);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = async (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const updated = [...team];
        const [movedItem] = updated.splice(draggedIndex, 1);
        updated.splice(targetIndex, 0, movedItem);

        const reordered = updated.map((item, i) => ({
            ...item,
            priority: i + 1
        }));

        setTeam(reordered);
        setDraggedIndex(null);
        setDragOverIndex(null);

        setSavingOrder(true);
        setError(null);
        try {
            await fetch('/api/team?action=reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ team: reordered })
            });
            setSuccessMessage('Team priorities reordered & synced live!');
        } catch (err) {
            console.error('Failed to save order:', err);
            setError('Failed to persist new priority order to database.');
        } finally {
            setSavingOrder(false);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('all');

    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Modal state for Add/Edit
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        position: '',
        email: '',
        phone: '',
        prn: '',
        department: 'Technical Team',
        personalEmail: '',
        instagramUrl: '',
        image: '',
        joiningDate: '',
        priority: 1
    });

    useEffect(() => {
        fetchTeam();
    }, []);

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal]);

    const fetchTeam = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/team');
            const data = await response.json();
            if (data.team) {
                setTeam(data.team);
            }
        } catch (err) {
            console.error('Failed to fetch team members:', err);
            setError('Failed to fetch team members from database.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingMember(null);
        setFormData({
            name: '',
            position: '',
            email: '',
            phone: '',
            prn: '',
            department: 'Technical Team',
            personalEmail: '',
            instagramUrl: '',
            image: '',
            joiningDate: '',
            priority: team.length + 1
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name || '',
            position: member.position || '',
            email: member.email || '',
            phone: member.phone || '',
            prn: member.prn || '',
            department: member.department || 'Technical Team',
            personalEmail: member.personalEmail || '',
            instagramUrl: member.instagramUrl || '',
            image: member.image || '',
            joiningDate: member.joiningDate || '',
            priority: member.priority || 1
        });
        setShowModal(true);
    };

    const handleSaveMember = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const payload = {
                ...formData,
                id: editingMember ? editingMember.id : undefined
            };

            const response = await fetch('/api/team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save team member details');
            }

            setSuccessMessage(data.message || (editingMember ? 'Member updated successfully!' : 'Member added successfully!'));
            setShowModal(false);
            fetchTeam();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteMember = async (id, name) => {
        if (!confirm(`Are you sure you want to remove "${name}" from the team?`)) return;

        setDeletingId(id);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('/api/team', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ id })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete team member');
            }

            setSuccessMessage('Team member deleted successfully');
            fetchTeam();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSeedDefaultTeam = async (overwrite = false) => {
        const confirmMsg = overwrite
            ? `This will overwrite existing database records and sync all ${DEFAULT_TEAM_DATA.length} team members with full details, images, and priorities. Proceed?`
            : `This will seed all ${DEFAULT_TEAM_DATA.length} team members into the database. Proceed?`;
        if (!confirm(confirmMsg)) return;

        setSeeding(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const endpoint = `/api/team?action=seed${overwrite ? '&overwrite=true' : ''}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminKey}`
                },
                body: JSON.stringify({ team: DEFAULT_TEAM_DATA })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to seed team members');
            }

            setSuccessMessage(data.message || `Successfully synced ${DEFAULT_TEAM_DATA.length} team members!`);
            fetchTeam();
        } catch (err) {
            setError(err.message);
        } finally {
            setSeeding(false);
        }
    };

    const handleImageError = (memberId) => {
        setFailedImages(prev => ({ ...prev, [memberId]: true }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (PNG, JPG, WEBP, etc.)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                setFormData(prev => ({ ...prev, image: compressedDataUrl }));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const resolveMemberImage = (member) => {
        const key = member.id || member.name;
        if (failedImages[key]) return null;

        if (member.image && member.image.trim() && !member.image.includes('placeholder')) {
            return member.image;
        }

        if (member.name) {
            const normName = member.name.toLowerCase().trim();
            if (DEFAULT_IMAGE_MAP[normName]) {
                return DEFAULT_IMAGE_MAP[normName];
            }
        }
        return null;
    };

    const filteredTeam = team.filter((member) => {
        const matchesDepartment = selectedDepartmentFilter === 'all' || member.department === selectedDepartmentFilter;
        const query = searchQuery.trim().toLowerCase();

        if (!query) return matchesDepartment;

        const matchesSearch =
            (member.name || '').toLowerCase().includes(query) ||
            (member.position || '').toLowerCase().includes(query) ||
            (member.email || '').toLowerCase().includes(query) ||
            (member.prn || '').toLowerCase().includes(query) ||
            (member.department || '').toLowerCase().includes(query);

        return matchesDepartment && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border-2 border-zinc-700 p-6 rounded-2xl">
                <div>
                    <h2 className="text-2xl font-black uppercase text-white flex items-center gap-3">
                        <Users className="w-7 h-7 text-brand-yellow" />
                        TEAM <span className="text-brand-yellow">MANAGEMENT</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        View, add, edit & organize team members across all departments
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={fetchTeam}
                        disabled={loading}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => handleSeedDefaultTeam(team.length > 0)}
                        disabled={seeding}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        title="Sync or restore full 57 team members to database"
                    >
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        {team.length === 0 ? 'Seed Default Team (57)' : `Restore Default Squad (${DEFAULT_TEAM_DATA.length})`}
                    </button>
                    <button
                        onClick={handleOpenAddModal}
                        className="px-5 py-2.5 bg-brand-yellow hover:bg-white text-black font-black uppercase rounded-xl text-sm flex items-center gap-2 transition-colors shadow-md"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Add Team Member
                    </button>
                </div>
            </div>

            {/* Notification messages */}
            {error && (
                <div className="bg-red-900/40 border-2 border-red-500 text-red-300 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="bg-green-900/40 border-2 border-green-500 text-green-300 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Filter, Search, and View Mode Bar */}
            <div className="grid md:grid-cols-4 gap-4 items-center">
                {/* Search */}
                <div className="relative md:col-span-2">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, position, email, PRN, or department..."
                        className="w-full bg-zinc-900 border-2 border-zinc-700 pl-12 pr-10 py-3 rounded-xl text-white focus:border-brand-yellow focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-lg bg-zinc-800"
                            title="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Department Filter */}
                <div>
                    <select
                        value={selectedDepartmentFilter}
                        onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                        className="w-full bg-zinc-900 border-2 border-zinc-700 px-4 py-3 rounded-xl text-white focus:border-brand-yellow focus:outline-none"
                    >
                        <option value="all">All Departments ({team.length})</option>
                        {DEPARTMENT_OPTIONS.map((dept) => {
                            const deptCount = team.filter((m) => m.department === dept).length;
                            return (
                                <option key={dept} value={dept}>
                                    {dept} ({deptCount})
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* View Mode Switcher */}
                <div className="flex bg-zinc-900 p-1 border-2 border-zinc-700 rounded-xl">
                    <button
                        onClick={() => setViewMode('live')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${viewMode === 'live' ? 'bg-brand-yellow text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Live Cards & Drag
                    </button>
                    <button
                        onClick={() => setViewMode('compact')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${viewMode === 'compact' ? 'bg-brand-yellow text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        <List className="w-4 h-4" />
                        Details Table
                    </button>
                </div>
            </div>

            {/* Drag & Drop Reorder Helper Notice */}
            <div className="bg-zinc-900/90 border border-brand-yellow/30 p-3 rounded-xl flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-brand-yellow flex-shrink-0 animate-bounce" />
                    <span><strong className="text-brand-yellow">Live Drag & Drop Enabled:</strong> Click and drag any member card to rearrange priority sequence live on screen!</span>
                </div>
                {savingOrder && (
                    <span className="text-brand-yellow font-bold flex items-center gap-1 bg-brand-yellow/10 px-2.5 py-1 rounded-lg border border-brand-yellow/30">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving New Sequence...
                    </span>
                )}
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-yellow mb-4" />
                    <p>Loading team members...</p>
                </div>
            ) : filteredTeam.length === 0 ? (
                <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-12 text-center">
                    <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Team Members Found</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-6 text-sm">
                        {team.length === 0
                            ? 'No team members are stored in database yet. Click "Restore Default Squad (57)" to import all team members or add one manually.'
                            : selectedDepartmentFilter !== 'all' && searchQuery
                            ? `No team members match "${searchQuery}" in ${selectedDepartmentFilter}.`
                            : 'No team members match your search or filter criteria.'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {selectedDepartmentFilter !== 'all' && searchQuery && (
                            <button
                                onClick={() => setSelectedDepartmentFilter('all')}
                                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-brand-yellow font-bold rounded-xl text-sm"
                            >
                                Search Across All Departments
                            </button>
                        )}
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm"
                            >
                                Clear Search
                            </button>
                        )}
                        <button
                            onClick={() => handleSeedDefaultTeam(team.length > 0)}
                            disabled={seeding}
                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl inline-flex items-center gap-2 text-sm"
                        >
                            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                            Restore Default Squad ({DEFAULT_TEAM_DATA.length})
                        </button>
                    </div>
                </div>
            ) : viewMode === 'live' ? (
                /* LIVE PUBLIC CARD GRID WITH DRAG & DROP REORDERING */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredTeam.map((member, index) => {
                        const imgUrl = resolveMemberImage(member);
                        const initials = (member.name || '?')
                            .split(' ')
                            .filter(Boolean)
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                        const isDragging = draggedIndex === index;
                        const isOver = dragOverIndex === index;

                        return (
                            <div
                                key={member.id || member.name}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                className={`group relative bg-zinc-900 border-4 border-white rounded-[2rem] overflow-hidden shadow-[6px_6px_0px_rgba(255,255,255,0.15)] hover:shadow-[10px_10px_0px_#FFB22C] hover:border-brand-yellow transition-all duration-300 flex flex-col h-full cursor-grab active:cursor-grabbing ${
                                    isDragging ? 'opacity-30 scale-95 border-dashed border-brand-yellow' : ''
                                } ${isOver ? 'scale-105 border-brand-yellow shadow-[12px_12px_0px_#FFB22C] ring-4 ring-brand-yellow/40' : ''}`}
                            >
                                {/* Drag Handle & Priority Badge */}
                                <div className="absolute top-3 left-3 z-30 bg-black/85 hover:bg-brand-yellow hover:text-black text-white px-2.5 py-1 rounded-xl text-xs font-mono font-bold border border-white/30 flex items-center gap-1.5 backdrop-blur-md transition-colors shadow-lg">
                                    <GripVertical className="w-3.5 h-3.5 text-brand-yellow group-hover:text-black" />
                                    <span>Priority #{member.priority}</span>
                                </div>

                                {/* Floating Admin Action Controls (Top Right) */}
                                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                                    {member.instagramUrl && (
                                        <a
                                            href={member.instagramUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-xl bg-pink-600/90 text-white flex items-center justify-center border border-white/40 hover:bg-pink-500 hover:scale-110 transition-all shadow-md"
                                            title="Instagram Profile"
                                        >
                                            <Instagram className="w-4 h-4" />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleOpenEditModal(member)}
                                        className="w-8 h-8 rounded-xl bg-zinc-900/90 text-brand-yellow flex items-center justify-center border border-brand-yellow/40 hover:bg-brand-yellow hover:text-black hover:scale-110 transition-all shadow-md"
                                        title="Edit Team Member Details"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMember(member.id, member.name)}
                                        disabled={deletingId === member.id}
                                        className="w-8 h-8 rounded-xl bg-red-950/90 text-red-400 flex items-center justify-center border border-red-500/40 hover:bg-red-600 hover:text-white hover:scale-110 transition-all shadow-md disabled:opacity-50"
                                        title="Delete Team Member"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Aspect Ratio Photo (4/5 portrait ratio, identical to public Team page) */}
                                <div
                                    onClick={() => imgUrl && setEnlargedImage({ src: imgUrl, title: `${member.name} (${member.position})` })}
                                    className="flex-1 aspect-[4/5] relative overflow-hidden bg-zinc-950 flex items-center justify-center cursor-pointer"
                                    title={imgUrl ? 'Click to view full photo' : member.name}
                                >
                                    {imgUrl ? (
                                        <>
                                            <img
                                                src={imgUrl}
                                                alt={member.name}
                                                onError={() => handleImageError(member.id || member.name)}
                                                className="w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-75 group-hover:opacity-50 transition-opacity duration-300 z-10" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                                                <span className="bg-brand-yellow text-black px-3 py-1.5 rounded-full font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-xl border border-black">
                                                    <ZoomIn className="w-4 h-4" /> Preview Photo
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFB22C_1px,transparent_1px)] [background-size:16px_16px]" />
                                            <div className="w-20 h-20 rounded-full bg-brand-yellow text-black flex items-center justify-center text-2xl font-black font-mono border-4 border-black shadow-[4px_4px_0px_white] mb-3 group-hover:scale-110 transition-transform duration-300">
                                                {initials}
                                            </div>
                                            <Users className="w-6 h-6 text-brand-yellow opacity-40" />
                                        </div>
                                    )}
                                </div>

                                {/* Info Banner at Bottom (Public Site Style) */}
                                <div className="p-4 z-20 bg-black/95 backdrop-blur-md border-t-4 border-white group-hover:border-brand-yellow transition-colors duration-300 flex flex-col justify-center">
                                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white mb-1 group-hover:text-brand-yellow transition-colors duration-300 truncate">
                                        {member.name}
                                    </h3>
                                    <p className="text-brand-yellow font-mono font-bold tracking-wider text-xs uppercase flex items-center gap-1.5 mb-2 truncate">
                                        <span className="inline-block w-2 h-2 bg-brand-yellow rounded-full animate-pulse flex-shrink-0" />
                                        <span className="truncate">{member.position}</span>
                                    </p>

                                    {/* Department, PRN & Joining Date Badges */}
                                    <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-[11px] flex-wrap gap-1">
                                        <span className="text-gray-300 font-bold bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-zinc-700">
                                            {member.department}
                                        </span>
                                        {member.joiningDate && (
                                            <span className="text-zinc-300 font-mono text-[10px] bg-black px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-brand-yellow" /> Joined: {member.joiningDate}
                                            </span>
                                        )}
                                        {member.prn && (
                                            <span className="text-zinc-400 font-mono text-[10px] bg-black px-2 py-0.5 rounded border border-zinc-800">
                                                PRN: {member.prn}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* COMPACT MANAGEMENT TABLE VIEW */
                <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-300">
                            <thead className="bg-zinc-950 text-gray-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                                <tr>
                                    <th className="p-4 w-12 text-center">Drag</th>
                                    <th className="p-4">Priority</th>
                                    <th className="p-4">Member Name</th>
                                    <th className="p-4">Position / Role</th>
                                    <th className="p-4">Department</th>
                                    <th className="p-4">Contact Info</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {filteredTeam.map((member, index) => {
                                    const imgUrl = resolveMemberImage(member);
                                    return (
                                        <tr
                                            key={member.id || member.name}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className="hover:bg-zinc-800/60 transition-colors group cursor-grab active:cursor-grabbing"
                                        >
                                            <td className="p-4 text-center">
                                                <GripVertical className="w-4 h-4 text-gray-500 group-hover:text-brand-yellow inline-block" />
                                            </td>
                                            <td className="p-4 font-mono text-brand-yellow font-bold">
                                                #{member.priority}
                                            </td>
                                            <td className="p-4 font-bold text-white flex items-center gap-3">
                                                {imgUrl ? (
                                                    <img src={imgUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-bold">
                                                        {member.name?.[0]}
                                                    </div>
                                                )}
                                                <span>{member.name}</span>
                                            </td>
                                            <td className="p-4 text-gray-200 font-semibold">{member.position}</td>
                                            <td className="p-4 text-gray-400">{member.department}</td>
                                            <td className="p-4 text-gray-400 space-y-0.5">
                                                {member.email && <div className="text-[11px]">{member.email}</div>}
                                                {member.phone && <div className="text-[11px] text-zinc-500">{member.phone}</div>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEditModal(member)}
                                                        className="p-2 bg-zinc-800 hover:bg-brand-yellow hover:text-black text-white rounded-lg transition-colors"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMember(member.id, member.name)}
                                                        className="p-2 bg-zinc-800 hover:bg-red-600 text-white rounded-lg transition-colors"
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
                </div>
            )}

            {/* Modal for Add / Edit Team Member */}
            {showModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
                    <div className="bg-zinc-900 border-4 border-zinc-700 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col relative shadow-2xl overflow-hidden my-auto">
                        
                        {/* Header (Sticky top) */}
                        <div className="p-6 pb-4 border-b border-zinc-800 relative bg-zinc-900 flex-shrink-0">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-zinc-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-2xl font-black uppercase text-white mb-1 flex items-center gap-3">
                                <Users className="w-7 h-7 text-brand-yellow" />
                                {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                            </h3>
                            <p className="text-gray-400 text-xs sm:text-sm">
                                Update profile details, positions, contact info, and social links.
                            </p>
                        </div>

                        {/* Scrollable Form Body */}
                        <form onSubmit={handleSaveMember} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Student Name */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                            Student Name <span className="text-brand-yellow">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Yash Maru"
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        />
                                    </div>

                                    {/* Position */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                            Position / Role <span className="text-brand-yellow">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            placeholder="e.g. President / Tech Lead"
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Department */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                            Department (School) <span className="text-brand-yellow">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        >
                                            {DEPARTMENT_OPTIONS.map((dept) => (
                                                <option key={dept} value={dept}>
                                                    {dept}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* PRN */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                            PRN (Permanent Registration No.)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.prn}
                                            onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
                                            placeholder="e.g. 20230101234"
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Official Mail ID */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                            Mail ID (Official/College)
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="e.g. student@dypiu.ac.in"
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        />
                                    </div>

                                    {/* Personal Mail ID */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                            Personal Mail ID
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.personalEmail}
                                            onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                                            placeholder="e.g. personal@gmail.com"
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    {/* Phone No. */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                            Phone No.
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="e.g. +91 9876543210"
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        />
                                    </div>

                                    {/* Instagram Profile Link */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                            Instagram Profile Link
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.instagramUrl}
                                            onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                                            placeholder="https://instagram.com/username"
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        />
                                    </div>

                                    {/* Joining Date */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-brand-yellow" />
                                            Joining Date
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.joiningDate}
                                            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                            placeholder="e.g. Aug 2024 or 2024-08-15"
                                            className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Direct Image Upload & Path Section */}
                                <div className="bg-black/40 border-2 border-zinc-700/80 rounded-2xl p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold uppercase text-brand-yellow flex items-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            Team Member Photo <span className="text-gray-400 font-normal">(Upload File or URL)</span>
                                        </label>
                                        {formData.image && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image: '' })}
                                                className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/50 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Remove Photo
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4 items-center">
                                        {/* Direct Upload Dropzone */}
                                        <div className="md:col-span-2">
                                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-600 hover:border-brand-yellow rounded-xl p-4 bg-zinc-900/80 cursor-pointer transition-all group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 group-hover:bg-brand-yellow text-brand-yellow group-hover:text-black flex items-center justify-center transition-colors flex-shrink-0">
                                                        <Upload className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-sm font-bold text-white block group-hover:text-brand-yellow transition-colors">
                                                            {formData.image ? 'Click to Upload Different Photo' : 'Click to Upload Photo from Device'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 block">
                                                            PNG, JPG, WEBP, HEIC (Auto-optimized)
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Priority Order */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                                                Priority Order
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full bg-black border-2 border-zinc-700 focus:border-brand-yellow p-3 rounded-xl text-white text-sm focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Optional URL/Path Field */}
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                                            Or paste image URL / local path:
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.image}
                                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                            placeholder="/team/member-photo.jpg or https://..."
                                            className="w-full bg-black/80 border border-zinc-800 focus:border-brand-yellow/60 p-2.5 rounded-lg text-white text-xs font-mono focus:outline-none"
                                        />
                                    </div>

                                    {/* Live Photo Preview */}
                                    {formData.image && (
                                        <div
                                            onClick={() => setEnlargedImage({ src: formData.image, title: formData.name ? `${formData.name}'s Photo` : 'Photo Preview' })}
                                            className="bg-zinc-900 border-2 border-zinc-700 hover:border-brand-yellow p-3.5 rounded-xl flex items-center gap-4 cursor-pointer group transition-all shadow-md hover:shadow-brand-yellow/10"
                                            title="Click to view full photo"
                                        >
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0 border-2 border-brand-yellow/50 group-hover:border-brand-yellow shadow-md relative">
                                                <img
                                                    src={formData.image}
                                                    alt="Photo Preview"
                                                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                                                    onError={(e) => { e.target.onerror = null; }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <ZoomIn className="w-6 h-6 text-brand-yellow" />
                                                </div>
                                            </div>
                                            <div className="text-xs min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-brand-yellow font-black uppercase tracking-wider">Photo Preview Active</span>
                                                    <span className="text-[10px] bg-brand-yellow/20 text-brand-yellow font-bold px-2 py-0.5 rounded-full border border-brand-yellow/40 group-hover:bg-brand-yellow group-hover:text-black transition-colors flex items-center gap-1">
                                                        <ZoomIn className="w-3 h-3" /> Click to Enlarge
                                                    </span>
                                                </div>
                                                <span className="text-zinc-400 truncate block font-mono text-[11px]">
                                                    {formData.image.startsWith('data:') ? `Directly Uploaded Image (${Math.round(formData.image.length / 1024)} KB data URL)` : formData.image}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Action Footer (Always Visible at Bottom) */}
                            <div className="p-4 sm:p-6 bg-zinc-900/95 border-t border-zinc-800 flex justify-end gap-3 flex-shrink-0 z-10 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-brand-yellow hover:bg-white text-black font-black uppercase rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg hover:scale-105"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        editingMember ? 'UPDATE MEMBER' : 'ADD MEMBER'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Full-Size Image Lightbox Modal */}
            {enlargedImage && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setEnlargedImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] bg-zinc-950 border-4 border-zinc-700 rounded-3xl overflow-hidden p-3 flex flex-col items-center justify-center shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setEnlargedImage(null)}
                            className="absolute top-4 right-4 bg-black/80 hover:bg-brand-yellow hover:text-black text-white p-2.5 rounded-full border border-white/20 transition-all z-20 shadow-lg cursor-pointer"
                            title="Close Full Preview"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="max-h-[78vh] overflow-hidden rounded-2xl flex items-center justify-center bg-black w-full">
                            <img
                                src={enlargedImage.src}
                                alt={enlargedImage.title || 'Full Photo Preview'}
                                className="max-h-[76vh] max-w-full object-contain rounded-xl shadow-2xl"
                            />
                        </div>
                        {enlargedImage.title && (
                            <div className="p-3 text-center w-full bg-zinc-900 border-t border-zinc-800 mt-2 rounded-xl flex items-center justify-between px-6">
                                <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                                    {enlargedImage.title}
                                </span>
                                <span className="text-xs text-brand-yellow font-mono font-bold">
                                    Full Resolution Preview
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManager;
