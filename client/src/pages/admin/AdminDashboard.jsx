import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Users, Calendar, Award, TrendingUp,
    Plus, Download, CheckCircle, Clock,
    Search, ArrowUpRight,
    Activity, Globe, Shield, ChevronRight, Trophy, UserCheck, MessageSquare, DollarSign,
    MapPin, Eye, Edit2, Trash2, Filter, Loader2, Layout, Bell, BellOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useConfirm } from '../../contexts/ConfirmContext';
import AdminHeader from '../../components/layout/AdminHeader';

const AdminDashboard = () => {
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const currentUserRole = user?.role ?? '';
    const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [eventsRes, statsRes] = await Promise.all([
                    axios.get(`/api/events?_t=${Date.now()}`),
                    axios.get(`/api/events/stats?_t=${Date.now()}`)
                ]);
                setAllEvents(eventsRes.data || []);
                setStats(statsRes.data || { totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
            } catch (error) {
                console.error('Dashboard data error:', error);
                toast.error('Failed to load dashboard data. Please refresh.');
                setStats({ totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
                setAllEvents([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // --------------------------------------------------------------
    // Helper: fetch registrations for a specific event
    // Route: GET /api/registrations/event/:eventId
    // (axios already carries the Bearer token via axios.defaults set by AuthContext)
    // --------------------------------------------------------------
    const fetchEventRegistrations = async (eventId) => {
        const res = await axios.get(
            `/api/registrations/event/${eventId}`
        );
        return res.data;
    };

    // Helper: fetch ALL registrations across all events
    // Route: GET /api/registrations/all
    const fetchAllRegistrations = async () => {
        const res = await axios.get(
            `/api/registrations/all`
        );
        return res.data;
    };

    // Download PDF for a specific event
    const downloadEventPDF = async (eventId) => {
        try {
            const data = await fetchEventRegistrations(eventId);
            const eventName = allEvents.find(e => e._id === eventId)?.title || eventId;
            const rows = [];
            let sno = 1;
            data.forEach(rec => {
                const p = rec.participant || {};
                rows.push([
                    sno++,
                    rec.registrationId || 'N/A',
                    p.username || rec.formData?.name || '',
                    p.registrationNumber || rec.formData?.rollNumber || '',
                    p.yearAndDept || rec.formData?.year || '',
                    p.department || rec.formData?.department || '',
                    p.section || rec.formData?.section || '',
                    p.phone || rec.formData?.phone || '',
                    p.email || ''
                ]);
            });
            const doc = new jsPDF();
            doc.setFontSize(14);
            doc.text(`Registrations: ${eventName}`, 14, 20);
            autoTable(doc, {
                startY: 30,
                head: [['S.No', 'Registration ID', 'Name', 'Roll No.', 'Year/Dept', 'Department', 'Section', 'Phone', 'Email']],
                body: rows,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [70, 130, 180], textColor: 255 },
            });
            doc.save(`registrations_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to download PDF. Check if you have permission.');
        }
    };

    // Download XLSX for a specific event
    const downloadEventXLSX = async (eventId) => {
        try {
            const data = await fetchEventRegistrations(eventId);
            const eventName = allEvents.find(e => e._id === eventId)?.title || eventId;
            const rows = [];
            let sno = 1;
            data.forEach(rec => {
                const p = rec.participant || {};
                rows.push({
                    S_No: sno++,
                    Registration_ID: rec.registrationId || 'N/A',
                    Name: p.username || rec.formData?.name || '',
                    Roll_No: p.registrationNumber || rec.formData?.rollNumber || '',
                    Year_Dept: p.yearAndDept || rec.formData?.year || '',
                    Department: p.department || rec.formData?.department || '',
                    Section: p.section || rec.formData?.section || '',
                    Phone: p.phone || rec.formData?.phone || '',
                    Email: p.email || ''
                });
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `registrations_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to download XLSX. Check if you have permission.');
        }
    };

    // --------------------------------------------------------------
    // Export: PDF all registrations (grouped by team if applicable)
    // --------------------------------------------------------------
    const downloadPDF = async () => {
        try {
            const data = await fetchAllRegistrations();
            const rows = [];
            let sno = 1;
            data.forEach(rec => {
                const p = rec.participant || {};
                rows.push([
                    sno++,
                    rec.registrationId || 'N/A',
                    p.username || '',
                    p.registrationNumber || '',
                    p.yearAndDept || '',
                    p.department || '',
                    p.section || '',
                    p.phone || '',
                    p.email || ''
                ]);
            });
            const doc = new jsPDF();
            doc.setFontSize(14);
            doc.text('All Registrations Report', 14, 20);
            autoTable(doc, {
                startY: 30,
                head: [['S.No', 'Registration ID', 'Name', 'Roll No.', 'Year/Dept', 'Department', 'Section', 'Phone', 'Email']],
                body: rows,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [70, 130, 180], textColor: 255 },
            });
            doc.save(`all_registrations_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to download PDF. Check permissions.');
        }
    };

    // --------------------------------------------------------------
    // Export: XLSX all registrations
    // --------------------------------------------------------------
    const downloadXLSX = async () => {
        try {
            const data = await fetchAllRegistrations();
            const rows = [];
            let sno = 1;
            data.forEach(rec => {
                const p = rec.participant || {};
                rows.push({
                    S_No: sno++,
                    Registration_ID: rec.registrationId || 'N/A',
                    Name: p.username || '',
                    Roll_No: p.registrationNumber || '',
                    Year_Dept: p.yearAndDept || '',
                    Department: p.department || '',
                    Section: p.section || '',
                    Phone: p.phone || '',
                    Email: p.email || ''
                });
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `all_registrations_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to download XLSX. Check permissions.');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        const confirmed = await confirm('Are you sure you want to delete this event? This action cannot be undone.');
        if (!confirmed) {
            return;
        }

        try {
            await axios.delete(`/api/events/${eventId}`);
            toast.success('Event deleted successfully');
            setAllEvents(allEvents.filter(e => e._id !== eventId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete event');
        }
    };

    const statusTabs = ['All', 'Draft', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

    // --------------------------------------------------------------
    // Role‑based visibility for export buttons
    // --------------------------------------------------------------
    const privilegedRoles = ['Admin', 'Class Coordinator', 'Program Coordinator', 'Association Member', 'Faculty'];

    // Global export (all registrations across all events)
    const renderExportButtons = () => {
        if (!privilegedRoles.includes(currentUserRole)) return null;
        return (
            <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Export All Registrations:</span>
                <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <Download className="w-4 h-4" /> PDF
                </button>
                <button
                    onClick={downloadXLSX}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <Download className="w-4 h-4" /> XLSX
                </button>
            </div>
        );
    };

    // Per-event export (admin selects event from dropdown)
    const renderDownloadSection = () => {
        if (!privilegedRoles.includes(currentUserRole)) return null;
        return (
            <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Download Registrations by Event:</span>
                <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#20242B] text-slate-900 text-sm font-medium dark:text-white"
                >
                    <option value="">  Select Event </option>
                    {allEvents.map(ev => (
                        <option key={ev._id} value={ev._id}>{ev.title}</option>
                    ))}
                </select>
                <button
                    onClick={() => selectedEventId ? downloadEventPDF(selectedEventId) : toast.error('Please select an event')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <Download className="w-4 h-4" /> PDF
                </button>
                <button
                    onClick={() => selectedEventId ? downloadEventXLSX(selectedEventId) : toast.error('Please select an event')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <Download className="w-4 h-4" /> XLSX
                </button>
            </div>
        );
    };

    const filteredEvents = allEvents.filter(event => {
        const matchesStatus = statusFilter === 'All' || event.status === statusFilter;
        const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.venue?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Upcoming': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Ongoing': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Draft': return 'bg-slate-50 text-slate-500 border-slate-200';
            case 'Completed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Cancelled': return 'bg-red-50 text-red-500 border-red-100';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Upcoming': return 'bg-emerald-500';
            case 'Ongoing': return 'bg-amber-500';
            case 'Draft': return 'bg-slate-400';
            case 'Completed': return 'bg-indigo-500';
            case 'Cancelled': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    const cards = [
        { title: 'Total Events', val: stats.totalEvents || 0, icon: <Globe className="w-6 h-6" />, color: 'from-indigo-500 to-indigo-600', label: 'Events Created', gradient: true },
        { title: 'Registrations', val: stats.totalRegistrations || 0, icon: <Users className="w-6 h-6" />, color: 'from-emerald-500 to-emerald-600', label: 'Total Sign-ups', gradient: true },
        { title: 'Upcoming', val: stats.upcomingEvents || allEvents.filter(e => e.status === 'Upcoming').length, icon: <Calendar className="w-6 h-6" />, color: 'from-violet-500 to-violet-600', label: 'Future Events', gradient: true },
        { title: 'Ongoing', val: stats.ongoingEvents || allEvents.filter(e => e.status === 'Ongoing').length, icon: <TrendingUp className="w-6 h-6" />, color: 'from-amber-500 to-amber-600', label: 'Currently Live', gradient: true },
    ];

    return (
        <div className="space-y-12 pb-40">
            {/* Admin Header */}
            <AdminHeader 
                title="Admin Dashboard"
                subtitle="Real-time intelligence for your global event infrastructure."
                icon={Shield}
                badge="Admin Secured"
                actions={
                    <div className="flex gap-4">
                        <Link to="/admin/events/create" className="group px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-white/90 transition-all duration-300 flex items-center gap-2 shadow-lg">
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            Create Event
                        </Link>
                        <Link to="/admin/winners" className="group px-6 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/30 transition-all duration-300 flex items-center gap-2">
                            <Trophy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Winners
                        </Link>
                    </div>
                }
            />
            {/* Export & Download Registration Buttons */}
            <div className="flex flex-col gap-3">
                {renderExportButtons()}
                {renderDownloadSection()}
            </div>


            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                        viewport={{ once: true }}
                        className="group bg-white dark:bg-[#20242B] rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 dark:text-white relative overflow-hidden"
                    >
                        {/* Background gradient decoration */}
                        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 bg-gradient-to-br ${card.color} group-hover:scale-150 transition-transform duration-500`}></div>
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl ${card.gradient ? `bg-gradient-to-br ${card.color}` : card.color} text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                {card.icon}
                            </div>
                            <div className="flex items-center gap-1">
                                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-500">Live</span>
                            </div>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 relative z-10">{card.val}</h3>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest relative z-10">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Event Management — Full Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-4 px-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
                                <Layout className="w-5 h-5" />
                            </div>
                            Event Infrastructure
                        </h2>
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="pl-10 pr-4 py-2.5 bg-white dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/50 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all w-64 dark:text-white group-hover:border-indigo-300 dark:group-hover:border-indigo-500/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl overflow-x-auto">
                        {statusTabs.map((tab, idx) => {
                            const count = tab === 'All' ? allEvents.length : allEvents.filter(e => e.status === tab).length;
                            return (
                                <motion.button
                                    key={tab}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setStatusFilter(tab)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${statusFilter === tab ? 'bg-white dark:bg-[#20242B] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    {tab}
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] ${statusFilter === tab ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400'}`}>
                                        {count}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Events Table */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm dark:text-white"
                    >
                        {isLoading ? (
                            <div className="p-16 text-center space-y-4">
                                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
                                <p className="text-slate-400 font-bold">Loading events...</p>
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="p-16 text-center space-y-4">
                                <Calendar className="w-16 h-16 text-slate-200 mx-auto" />
                                <p className="text-slate-400 font-bold text-lg">No events match your filter</p>
                                <p className="text-slate-300 text-sm">Try adjusting your search or filter criteria</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                {filteredEvents.map((event, idx) => (
                                    <motion.div 
                                        key={event._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white dark:bg-[#20242B] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 p-6 group flex flex-col justify-between dark:text-white"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shrink-0">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{event.title}</h3>
                                                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-indigo-500/20 inline-block mt-1">
                                                            {event.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(event.status)}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(event.status)} animate-pulse`}></div>
                                                        {event.status}
                                                    </span>
                                                    {event.status === 'Upcoming' && (
                                                        event.reminderSent
                                                            ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                                                    <Bell className="w-2.5 h-2.5" />
                                                                    Reminder Sent
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                                                                    <BellOff className="w-2.5 h-2.5" />
                                                                    Reminder Pending
                                                                </span>
                                                            )
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-6">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-indigo-400" />
                                                    {new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {event.startTime} - {event.endTime}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                                    {event.venue}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-indigo-400" />
                                                    {event.participationType} ({event.maxParticipants} max)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-start sm:justify-end gap-2 mt-auto">
                                            <Link
                                                to={`/events/${event._id}`}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 text-xs font-bold"
                                                title="View Event"
                                            >
                                                <Eye className="w-4 h-4" /> View
                                            </Link>
                                            <Link
                                                to={`/admin/events/edit/${event._id}`}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 text-xs font-bold"
                                                title="Edit Event"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteEvent(event._id)}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-2 text-xs font-bold"
                                                title="Delete Event"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                            {/* Per‑event registration download buttons */}
                                            <button
                                                onClick={() => downloadEventPDF(event._id)}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 text-xs font-bold"
                                                title="Download Registrations PDF"
                                            >
                                                <Download className="w-4 h-4" /> PDF
                                            </button>
                                            <button
                                                onClick={() => downloadEventXLSX(event._id)}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 text-xs font-bold"
                                                title="Download Registrations XLSX"
                                            >
                                                <Download className="w-4 h-4" /> XLSX
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        {/* Event Count Footer */}
                        {!isLoading && filteredEvents.length > 0 && (
                            <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <p className="text-xs font-bold text-slate-400">
                                    Showing {filteredEvents.length} of {allEvents.length} events
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Intelligent Insights */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-8"
                >
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white px-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <Activity className="w-5 h-5" />
                        </div>
                        Instant Actions
                    </h2>
                    
                    <div className="space-y-8">
                        {[
                            {
                                category: 'Core Management',
                                items: [
                                    { title: 'Create Event', icon: <Calendar />, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', link: '/admin/events/create' },
                                    { title: 'Manage Winners', icon: <Trophy />, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', link: '/admin/winners' },
                                    { title: 'Total Participation', icon: <Users />, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', link: '/admin/total-participation' },
                                ]
                            },
                            {
                                category: 'People & Directory',
                                items: [
                                    { title: 'Faculty Registry', icon: <UserCheck />, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', link: '/admin/faculty' },
                                    { title: 'Association Members', icon: <Users />, color: 'from-purple-500 to-indigo-600', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', link: '/admin/association-members' },
                                    { title: 'Volunteer Applications', icon: <UserCheck />, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', link: '/admin/volunteers' },
                                ]
                            },
                            {
                                category: 'Forms & Certifications',
                                items: [
                                    { title: 'Nomination Forms', icon: <Plus />, color: 'from-indigo-500 to-violet-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', link: '/admin/nomination-forms' },
                                    { title: 'Manage Nominations', icon: <Award />, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', link: '/admin/nominations' },
                                    { title: 'Certificate Studio', icon: <Award />, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', link: '/admin/certificates' },
                                    { title: 'Registration Templates', icon: <Layout />, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', link: '/admin/registration-templates' },
                                ]
                            },
                            {
                                category: 'Operations & Analytics',
                                items: [
                                    { title: 'Attendance Records', icon: <Download />, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', link: '/admin/attendance' },
                                    { title: 'Feedback Management', icon: <Activity />, color: 'from-pink-500 to-fuchsia-600', bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', link: '/admin/feedback' },
                                    { title: 'Feedback Templates', icon: <Layout />, color: 'from-rose-500 to-red-600', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', link: '/admin/feedback-templates' },
                                    { title: 'Scanner Mode', icon: <Search />, color: 'from-rose-500 to-red-600', bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', link: '/scanner' },
                                ]
                            },
                            {
                                category: 'Communication & Finance',
                                items: [
                                    { title: 'Email Management', icon: <MessageSquare />, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', link: '/admin/email/compose' },
                                    { title: 'User Care & Support', icon: <MessageSquare />, color: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', link: '/admin/support' },
                                    { title: 'Expenses & Reimbursements', icon: <DollarSign />, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', link: '/admin/expenses' },
                                ]
                            },
                            {
                                category: 'System',
                                items: [
                                    { title: 'System Settings', icon: <Shield />, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', link: '/admin/settings' },
                                ]
                            },
                        ].map((group, groupIdx) => (
                            <motion.div 
                                key={groupIdx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: groupIdx * 0.1 }}
                                className="space-y-4"
                            >
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2">{group.category}</h3>
                                <div className="grid gap-4">
                                    {group.items.map((action, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Link to={action.link} className="group bg-white dark:bg-[#20242B] p-4 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 dark:text-white">
                                                <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                                        <span className={`text-white ${action.text}`}>{action.icon}</span>
                                                    </div>
                                                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">{action.title}</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 transition-colors flex-shrink-0 ml-2" />
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <Shield className="w-32 h-32" />
                    </div>
                    <div className="absolute bottom-0 left-0 p-10 opacity-5">
                        <Activity className="w-24 h-24" />
                    </div>
                    <div className="relative z-10 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-emerald-300 text-xs font-black uppercase tracking-widest">System Online</span>
                        </div>
                        <h3 className="text-2xl font-black leading-tight">System Health <br /> is 100% Core.</h3>
                        <p className="text-indigo-100 font-medium text-sm leading-relaxed">
                            All database nodes and email delivery segments are functioning at optimal latency.
                        </p>
                        <button className="px-6 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all border border-white/30">
                            Diagnostics
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
