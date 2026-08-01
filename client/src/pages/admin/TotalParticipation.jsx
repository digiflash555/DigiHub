import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Users, Search, Filter, Download, ArrowLeft, Loader2, Eye,
    Calendar, User, Trophy, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = [
    { label: 'January',   value: '1'  },
    { label: 'February',  value: '2'  },
    { label: 'March',     value: '3'  },
    { label: 'April',     value: '4'  },
    { label: 'May',       value: '5'  },
    { label: 'June',      value: '6'  },
    { label: 'July',      value: '7'  },
    { label: 'August',    value: '8'  },
    { label: 'September', value: '9'  },
    { label: 'October',   value: '10' },
    { label: 'November',  value: '11' },
    { label: 'December',  value: '12' },
];

// Build a list of years from 2020 to current+3
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2020 + 4 }, (_, i) => String(2020 + i));

/**
 * Convert a year/month into an absolute month number for easy comparisons (e.g. 2026 * 12 + 3)
 */
function getAbsoluteMonth(year, month) {
    if (!year || !month || year === 'All' || month === 'All') return null;
    return parseInt(year) * 12 + parseInt(month);
}

/**
 * Filters a participant's events by the selected From/To date range (inclusive).
 * Returns null if the participant has no events in the range.
 */
function applyDateRangeFilter(participant, fromYear, fromMonth, toYear, toMonth) {
    const fromAbs = getAbsoluteMonth(fromYear, fromMonth);
    const toAbs   = getAbsoluteMonth(toYear, toMonth);

    // If neither 'from' nor 'to' is fully selected, don't filter events
    if (!fromAbs && !toAbs) {
        return { ...participant };
    }

    const filteredEvents = (participant.attendedEvents || []).filter(event => {
        if (!event.eventDate) return false;
        const d = new Date(event.eventDate);
        const eventAbs = d.getFullYear() * 12 + (d.getMonth() + 1);

        if (fromAbs && eventAbs < fromAbs) return false;
        if (toAbs && eventAbs > toAbs) return false;

        return true;
    });

    if (filteredEvents.length === 0) return null;

    return {
        ...participant,
        attendedEvents: filteredEvents,
        totalAttendedEvents: filteredEvents.length,
    };
}

const TotalParticipation = () => {
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Filters ---
    const [searchTerm,     setSearchTerm]     = useState('');
    const [classFilter,    setClassFilter]    = useState('All');
    const [sectionFilter,  setSectionFilter]  = useState('All');
    
    // Date Range Filters
    const [fromYear,  setFromYear]  = useState('All');
    const [fromMonth, setFromMonth] = useState('All');
    const [toYear,    setToYear]    = useState('All');
    const [toMonth,   setToMonth]   = useState('All');

    // Event Count Range Filters
    const [minEvents, setMinEvents] = useState('');
    const [maxEvents, setMaxEvents] = useState('');

    const [sortBy, setSortBy] = useState('eventsDesc');

    // --- Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // --- Modal ---
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/registrations/total-participation');
                setParticipants(res.data);
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || 'Failed to fetch participation data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Step 1: Apply date range filters
    const dateScopedParticipants = useMemo(() => {
        const result = [];
        for (const p of participants) {
            const scoped = applyDateRangeFilter(p, fromYear, fromMonth, toYear, toMonth);
            if (scoped) result.push(scoped);
        }
        return result;
    }, [participants, fromYear, fromMonth, toYear, toMonth]);

    // Step 2: Compute unique classes & sections
    const uniqueClasses = useMemo(() => {
        const s = new Set(dateScopedParticipants.map(p => p.yearAndDept).filter(Boolean));
        return ['All', ...Array.from(s).sort()];
    }, [dateScopedParticipants]);

    const uniqueSections = useMemo(() => {
        const s = new Set(dateScopedParticipants.map(p => p.section).filter(Boolean));
        return ['All', ...Array.from(s).sort()];
    }, [dateScopedParticipants]);

    // Step 3: Apply text & select filters + sort
    const filteredAndSorted = useMemo(() => {
        let list = dateScopedParticipants.filter(p => {
            const q = searchTerm.toLowerCase();
            const matchesSearch =
                !q ||
                p.username?.toLowerCase().includes(q) ||
                p.email?.toLowerCase().includes(q) ||
                p.registrationNumber?.toLowerCase().includes(q) ||
                p.phone?.toLowerCase().includes(q);

            const matchesClass   = classFilter   === 'All' || p.yearAndDept === classFilter;
            const matchesSection = sectionFilter === 'All' || p.section     === sectionFilter;

            const min = parseInt(minEvents, 10);
            const max = parseInt(maxEvents, 10);
            const matchesMin = isNaN(min) || p.totalAttendedEvents >= min;
            const matchesMax = isNaN(max) || p.totalAttendedEvents <= max;

            return matchesSearch && matchesClass && matchesSection && matchesMin && matchesMax;
        });

        list.sort((a, b) => {
            if (sortBy === 'eventsDesc') return b.totalAttendedEvents - a.totalAttendedEvents;
            if (sortBy === 'eventsAsc')  return a.totalAttendedEvents - b.totalAttendedEvents;
            if (sortBy === 'nameAsc')    return (a.username || '').localeCompare(b.username || '');
            if (sortBy === 'nameDesc')   return (b.username || '').localeCompare(a.username || '');
            return 0;
        });

        return list;
    }, [dateScopedParticipants, searchTerm, classFilter, sectionFilter, sortBy, minEvents, maxEvents]);

    // Reset page on any filter change
    useEffect(() => { setCurrentPage(1); },
        [searchTerm, classFilter, sectionFilter, fromYear, fromMonth, toYear, toMonth, sortBy, minEvents, maxEvents]);

    // Pagination slicing
    const totalPages  = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
    const currentData = filteredAndSorted.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Active date label for display & export
    const activeDateLabel = useMemo(() => {
        const fromActive = fromYear !== 'All' && fromMonth !== 'All';
        const toActive   = toYear !== 'All' && toMonth !== 'All';

        if (!fromActive && !toActive) return null;

        const getLabel = (y, m) => `${MONTHS.find(x => x.value === m)?.label} ${y}`;
        
        if (fromActive && toActive) return `${getLabel(fromYear, fromMonth)} to ${getLabel(toYear, toMonth)}`;
        if (fromActive) return `From ${getLabel(fromYear, fromMonth)}`;
        if (toActive)   return `Up to ${getLabel(toYear, toMonth)}`;
        
        return null;
    }, [fromYear, fromMonth, toYear, toMonth]);

    const clearDateFilters = () => {
        setFromYear('All'); setFromMonth('All');
        setToYear('All'); setToMonth('All');
    };

    // ----- Export (filtered data only) -----
    const downloadXLSX = () => {
        if (filteredAndSorted.length === 0) { toast.error('No data to export'); return; }

        const rows = filteredAndSorted.map((p, i) => ({
            'S.No'                 : i + 1,
            'Name'                 : p.username              || '',
            'Roll No.'             : p.registrationNumber    || '',
            'Class (Year/Dept)'    : p.yearAndDept           || '',
            'Section'              : p.section               || '',
            'Phone'                : p.phone                 || '',
            'Email'                : p.email                 || '',
            'Total Attended Events': p.totalAttendedEvents,
            'Attended Event Titles': (p.attendedEvents || []).map(e => e.title).join('; '),
            'Event Dates'          : (p.attendedEvents || []).map(e =>
                e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-IN') : ''
            ).join('; '),
            'Role': p.role || '',
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Total Participation');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        const label = activeDateLabel ? activeDateLabel.replace(/ /g, '_') : 'All';
        saveAs(
            new Blob([wbout], { type: 'application/octet-stream' }),
            `Total_Participation_${label}_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
        toast.success(`Exported ${rows.length} records`);
    };

    return (
        <div className="space-y-8 pb-40">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <Link
                        to="/admin/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Total <span className="text-indigo-600">Participation.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Comprehensive view of all participants and their event attendance history.
                    </p>
                </div>

                <button
                    onClick={downloadXLSX}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                    <Download className="w-5 h-5" />
                    Export XLSX
                    {activeDateLabel && (
                        <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] truncate max-w-[150px]" title={activeDateLabel}>
                            Filtered
                        </span>
                    )}
                </button>
            </div>

            {/* ── Date Filter Banner (only when active) ── */}
            <AnimatePresence>
                {activeDateLabel && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center gap-3 px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl flex-wrap"
                    >
                        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                        <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                            Showing participation: <span className="font-black">{activeDateLabel}</span>
                        </p>
                        <span className="ml-auto text-xs font-black text-indigo-500 bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 rounded-full">
                            {filteredAndSorted.length} participant{filteredAndSorted.length !== 1 ? 's' : ''} found
                        </span>
                        <button
                            onClick={clearDateFilters}
                            className="text-xs font-black text-indigo-400 hover:text-indigo-600 transition-colors ml-2"
                        >
                            Clear ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Filters & Controls ── */}
            <div className="bg-white dark:bg-[#20242B] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
                
                {/* Search & Sort Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, roll no, email or phone..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-[#1a1d24] rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="w-full md:w-auto bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl text-sm font-bold px-4 py-3 outline-none border border-indigo-100 dark:border-indigo-500/20 shrink-0"
                    >
                        <option value="eventsDesc">Most Attended</option>
                        <option value="eventsAsc">Least Attended</option>
                        <option value="nameAsc">Name (A–Z)</option>
                        <option value="nameDesc">Name (Z–A)</option>
                    </select>
                </div>

                {/* Date & Class Filters Row */}
                <div className="flex flex-wrap gap-x-6 gap-y-4 items-end">
                    
                    {/* Date Range Group */}
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-[#1a1d24] p-2 pl-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">From</span>
                            <select value={fromMonth} onChange={e => setFromMonth(e.target.value)} className="bg-white dark:bg-[#2a2e36] text-xs font-bold px-2 py-1.5 rounded-lg outline-none cursor-pointer border border-slate-200 dark:border-slate-700">
                                <option value="All">Month</option>
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select value={fromYear} onChange={e => setFromYear(e.target.value)} className="bg-white dark:bg-[#2a2e36] text-xs font-bold px-2 py-1.5 rounded-lg outline-none cursor-pointer border border-slate-200 dark:border-slate-700">
                                <option value="All">Year</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        
                        <span className="text-slate-300 dark:text-slate-600 font-black">→</span>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">To</span>
                            <select value={toMonth} onChange={e => setToMonth(e.target.value)} className="bg-white dark:bg-[#2a2e36] text-xs font-bold px-2 py-1.5 rounded-lg outline-none cursor-pointer border border-slate-200 dark:border-slate-700">
                                <option value="All">Month</option>
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select value={toYear} onChange={e => setToYear(e.target.value)} className="bg-white dark:bg-[#2a2e36] text-xs font-bold px-2 py-1.5 rounded-lg outline-none cursor-pointer border border-slate-200 dark:border-slate-700">
                                <option value="All">Year</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden lg:block" />

                    {/* Class Group */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#1a1d24] rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-800">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            <select
                                value={classFilter}
                                onChange={e => setClassFilter(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                            >
                                <option value="All">All Classes</option>
                                {uniqueClasses.filter(c => c !== 'All').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#1a1d24] rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-800">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            <select
                                value={sectionFilter}
                                onChange={e => setSectionFilter(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                            >
                                <option value="All">All Sections</option>
                                {uniqueSections.filter(s => s !== 'All').map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden lg:block" />

                    {/* Event Count Group */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#1a1d24] rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-800">
                        <Trophy className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-1 hidden sm:inline">Events</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={minEvents}
                            onChange={e => setMinEvents(e.target.value)}
                            className="w-16 bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none text-center placeholder-slate-400/70"
                            min="0"
                        />
                        <span className="text-slate-300 dark:text-slate-600 font-black">-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxEvents}
                            onChange={e => setMaxEvents(e.target.value)}
                            className="w-16 bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none text-center placeholder-slate-400/70"
                            min="0"
                        />
                    </div>
                </div>
            </div>

            {/* ── Data Table ── */}
            <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-[#1a1d24]/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Participant</th>
                                <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Contact</th>
                                <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400">Class & Section</th>
                                <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400 text-center">
                                    Events{activeDateLabel ? ` (Filtered)` : ''}
                                </th>
                                <th className="py-5 px-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                                        <p className="text-slate-400 font-bold mt-4">Loading participation records...</p>
                                    </td>
                                </tr>
                            ) : currentData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold text-lg">No participants found.</p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            {activeDateLabel
                                                ? `No one attended events matching "${activeDateLabel}".`
                                                : 'Try adjusting your filters.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                currentData.map(p => (
                                    <tr key={p._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-[#1a1d24] transition-colors">
                                        {/* Participant */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                                                    {p.profileImage
                                                        ? <img src={p.profileImage} alt={p.username} className="w-full h-full object-cover" />
                                                        : <User className="w-6 h-6 text-slate-400" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{p.username}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{p.registrationNumber || 'No Roll No'}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.email}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{p.phone || 'No Phone'}</p>
                                        </td>

                                        {/* Class & Section */}
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
                                                {p.yearAndDept || 'N/A'} {p.section ? `- ${p.section}` : ''}
                                            </span>
                                        </td>

                                        {/* Events Count */}
                                        <td className="py-4 px-6 text-center">
                                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-lg">
                                                {p.totalAttendedEvents}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => setSelectedParticipant(p)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                                            >
                                                <Eye className="w-4 h-4" /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#1a1d24]/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium">
                            Showing{' '}
                            <span className="font-bold text-slate-900 dark:text-white">
                                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                            </span>{' '}–{' '}
                            <span className="font-bold text-slate-900 dark:text-white">
                                {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSorted.length)}
                            </span>{' '}
                            of{' '}
                            <span className="font-bold text-slate-900 dark:text-white">
                                {filteredAndSorted.length}
                            </span>{' '}
                            participants
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    const page = totalPages <= 5
                                        ? i + 1
                                        : currentPage <= 3
                                            ? i + 1
                                            : currentPage >= totalPages - 2
                                                ? totalPages - 4 + i
                                                : currentPage - 2 + i;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-9 h-9 rounded-xl text-sm font-black transition-all ${
                                                page === currentPage
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {selectedParticipant && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedParticipant(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-white dark:bg-[#20242B] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1a1d24]/50 flex justify-between items-start shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 p-1">
                                        <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                                            {selectedParticipant.profileImage
                                                ? <img src={selectedParticipant.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                : <User className="w-8 h-8 text-slate-400" />
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedParticipant.username}</h2>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold uppercase">
                                                {selectedParticipant.role}
                                            </span>
                                            {selectedParticipant.registrationNumber && (
                                                <span className="text-slate-500 font-medium text-sm">• {selectedParticipant.registrationNumber}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedParticipant(null)}
                                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-lg leading-none"
                                >✕</button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                                    {/* Sidebar */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Contact Info</h3>
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 break-all">{selectedParticipant.email}</p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedParticipant.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Academic Details</h3>
                                            <div className="space-y-3">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    <span className="text-slate-400 block text-xs mb-0.5">Class & Section</span>
                                                    {selectedParticipant.yearAndDept || 'N/A'}
                                                    {selectedParticipant.section ? ` (${selectedParticipant.section})` : ''}
                                                </p>
                                                {selectedParticipant.passoutYear && (
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        <span className="text-slate-400 block text-xs mb-0.5">Passout Year</span>
                                                        {selectedParticipant.passoutYear}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Events list */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-indigo-500" />
                                                Attended Events
                                            </h3>
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-black">
                                                {selectedParticipant.totalAttendedEvents} event{selectedParticipant.totalAttendedEvents !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {activeDateLabel && (
                                            <p className="text-sm text-slate-500 font-medium">
                                                Showing events for: <span className="font-bold text-slate-700 dark:text-slate-300">{activeDateLabel}</span>
                                            </p>
                                        )}

                                        {selectedParticipant.attendedEvents?.length > 0 ? (
                                            <div className="grid gap-3">
                                                {selectedParticipant.attendedEvents.map((event, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1a1d24]/50 flex justify-between items-center group hover:border-indigo-200 dark:hover:border-indigo-500/40 transition-colors"
                                                    >
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 dark:text-white">{event.title}</h4>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                {event.category && (
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                                                                        {event.category}
                                                                    </span>
                                                                )}
                                                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {event.eventDate
                                                                        ? new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                                        : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Link
                                                            to={`/events/${event._id}`}
                                                            target="_blank"
                                                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-12 text-center bg-slate-50 dark:bg-[#1a1d24] rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-500 font-medium text-sm">
                                                    {activeDateLabel
                                                        ? `No events attended in this date range.`
                                                        : "This participant hasn't attended any events yet."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TotalParticipation;
