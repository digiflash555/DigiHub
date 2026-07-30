import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Users, Calendar, Award, TrendingUp,
    Plus, Download, CheckCircle, Clock,
    Search, ArrowUpRight,
    Activity, Globe, Shield, ChevronRight, Trophy, UserCheck, MessageSquare, DollarSign,
    MapPin, Eye, Edit2, Trash2, Filter, Loader2, Layout
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useConfirm } from '../../contexts/ConfirmContext';

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
                setAllEvents(eventsRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Dashboard data error');
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
                head: [['S.No', 'Name', 'Roll No.', 'Year/Dept', 'Department', 'Section', 'Phone', 'Email']],
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
                head: [['S.No', 'Name', 'Roll No.', 'Year/Dept', 'Department', 'Section', 'Phone', 'Email']],
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

    const statusTabs = ['All', 'Draft', 'Open', 'Closed', 'Completed', 'Cancelled'];

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
            case 'Open': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Draft': return 'bg-slate-50 text-slate-500 border-slate-200';
            case 'Closed': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Completed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'Cancelled': return 'bg-red-50 text-red-500 border-red-100';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Open': return 'bg-emerald-500';
            case 'Draft': return 'bg-slate-400';
            case 'Closed': return 'bg-amber-500';
            case 'Completed': return 'bg-indigo-500';
            case 'Cancelled': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    const cards = [
        { title: 'Total Events', val: stats.totalEvents, icon: <Globe className="w-6 h-6" />, color: 'bg-indigo-600', label: 'Events Created' },
        { title: 'Registrations', val: stats.totalRegistrations, icon: <Users className="w-6 h-6" />, color: 'bg-emerald-600', label: 'Total Sign-ups' },
        { title: 'Attendance', val: stats.totalAttendees, icon: <Activity className="w-6 h-6" />, color: 'bg-violet-600', label: 'Check-ins Recorded' },
        { title: 'Active Events', val: allEvents.filter(e => e.status === 'Open').length, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-amber-600', label: 'Currently Open' },
    ];

    return (
        <div className="space-y-12 pb-40">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest">
                        <Shield className="w-4 h-4 fill-indigo-100" />
                        Admin Secured
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">Control <span className="text-reveal">Center.</span></h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-md">Real-time intelligence for your global event infrastructure.</p>
                </div>
                <div className="flex gap-4">
                    <Link to="/admin/events/create" className="btn-premium flex items-center gap-3">
                        <Plus className="w-6 h-6" />
                        Create New Event
                    </Link>
                    <Link to="/admin/winners" className="px-8 py-4 bg-white dark:bg-[#20242B] border-2 border-slate-900 text-slate-900 dark:text-white rounded-2xl font-black hover:bg-slate-900 hover:text-white transition-all duration-300 flex items-center gap-3">
                        <Trophy className="w-6 h-6" />
                        Manage Winners
                    </Link>
                </div>
            </div>
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
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="group bg-white dark:bg-[#20242B] rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] transition-all duration-500 dark:text-white"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className={`w-14 h-14 rounded-2xl ${card.color} text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
                                {card.icon}
                            </div>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{card.val}</h3>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Event Management — Full Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-4 px-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Event Infrastructure</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="pl-10 pr-4 py-2.5 bg-white dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/50 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all w-64 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl overflow-x-auto">
                        {statusTabs.map(tab => {
                            const count = tab === 'All' ? allEvents.length : allEvents.filter(e => e.status === tab).length;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setStatusFilter(tab)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${statusFilter === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600' } dark:text-white`}
                                >
                                    {tab}
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] ${statusFilter === tab ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400' }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Events Table */}
                    <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm dark:text-white">
                        {isLoading ? (
                            <div className="p-16 text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto" />
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="p-16 text-center space-y-4">
                                <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
                                <p className="text-slate-400 font-bold">No events match your filter</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                {filteredEvents.map((event) => (
                                    <div key={event._id} className="bg-white dark:bg-[#20242B] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-6 group flex flex-col justify-between dark:text-white">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#1a1d24] flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">{event.title}</h3>
                                                        <span className="px-2.5 py-1 bg-slate-50 dark:bg-[#1a1d24] text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-100 dark:border-slate-800 inline-block mt-1">
                                                            {event.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(event.status)}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(event.status)}`}></div>
                                                    {event.status}
                                                </span>
                                            </div>

                                            <div className="space-y-2 mb-6">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    {new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {event.startTime} - {event.endTime}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400" />
                                                    {event.venue}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    {event.participationType} ({event.maxParticipants} max)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-start sm:justify-end gap-2 mt-auto">
                                            <Link
                                                to={`/events/${event._id}`}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-xs font-bold"
                                                title="View Event"
                                            >
                                                <Eye className="w-4 h-4" /> View
                                            </Link>
                                            <Link
                                                to={`/admin/events/edit/${event._id}`}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-indigo-50 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-xs font-bold"
                                                title="Edit Event"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteEvent(event._id)}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-red-50 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center gap-2 text-xs font-bold"
                                                title="Delete Event"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                            {/* Per‑event registration download buttons */}
                                            <button
                                                onClick={() => downloadEventPDF(event._id)}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-emerald-50 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-2 text-xs font-bold"
                                                title="Download Registrations PDF"
                                            >
                                                <Download className="w-4 h-4" /> PDF
                                            </button>
                                            <button
                                                onClick={() => downloadEventXLSX(event._id)}
                                                className="p-2.5 bg-slate-50 dark:bg-[#1a1d24] hover:bg-emerald-50 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-2 text-xs font-bold"
                                                title="Download Registrations XLSX"
                                            >
                                                <Download className="w-4 h-4" /> XLSX
                                            </button>
                                        </div>
                                    </div>
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
                    </div>
                </div>

                {/* Intelligent Insights */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white px-2">Instant Actions</h2>
                    <div className="grid gap-4">
                        {[
                            { title: 'Expenses & Reimbursements', icon: <DollarSign />, color: 'bg-emerald-100 text-emerald-600', link: '/admin/expenses' },
                            { title: 'Nomination Forms', icon: <Plus />, color: 'bg-primary-100 text-primary-600', link: '/admin/nomination-forms' },
                            { title: 'Manage Nominations', icon: <Award />, color: 'bg-indigo-100 text-indigo-600', link: '/admin/nominations' },
                            { title: 'Volunteer Applications', icon: <UserCheck />, color: 'bg-violet-100 text-violet-600', link: '/admin/volunteers' },
                            { title: 'Faculty Registry', icon: <UserCheck />, color: 'bg-indigo-100 text-indigo-600', link: '/admin/faculty' },
                            { title: 'Attendance Records', icon: <Download />, color: 'bg-emerald-100 text-emerald-600', link: '/admin/attendance' },
                            { title: 'Total Participation', icon: <Users />, color: 'bg-indigo-100 text-indigo-600', link: '/admin/total-participation' },
                            { title: 'Association Members', icon: <Users />, color: 'bg-indigo-100 text-indigo-600', link: '/admin/association-members' },
                            { title: 'Scanner Mode', icon: <Search />, color: 'bg-amber-100 text-amber-600', link: '/scanner' },
                            { title: 'Feedback Management', icon: <Activity />, color: 'bg-pink-100 text-pink-600', link: '/admin/feedback' },
                            { title: 'Feedback Templates', icon: <Layout />, color: 'bg-rose-100 text-rose-600', link: '/admin/feedback-templates' },
                            { title: 'Registration Templates', icon: <Layout />, color: 'bg-indigo-100 text-indigo-650', link: '/admin/registration-templates' },
                            { title: 'Certificate Studio', icon: <Award />, color: 'bg-amber-100 text-amber-600', link: '/admin/certificates' },
                            { title: 'Support Tickets', icon: <MessageSquare />, color: 'bg-indigo-100 text-indigo-600', link: '/admin/support' },
                            { title: 'System Settings', icon: <Shield />, color: 'bg-slate-100 text-slate-600', link: '/admin/settings' },
                        ].map((action, i) => (
                            <Link key={i} to={action.link} className="group bg-white dark:bg-[#20242B] p-4 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 dark:text-white">
                                <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 ${action.color} flex items-center justify-center shadow-sm`}>
                                        {action.icon}
                                    </div>
                                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">{action.title}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 transition-colors flex-shrink-0 ml-2" />
                            </Link>
                        ))}
                    </div>

                    <div className="bg-indigo-600 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <Shield className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-5">
                            <h3 className="text-2xl font-black leading-tight">System Health <br /> is 100% Core.</h3>
                            <p className="text-indigo-100 font-medium text-sm leading-relaxed">
                                All database nodes and email delivery segments are functioning at optimal latency.
                            </p>
                            <button className="px-6 py-2.5 bg-white dark:bg-[#20242B] text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all dark:text-white">
                                Diagnostics
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
