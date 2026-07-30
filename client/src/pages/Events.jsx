import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, Filter, Calendar, MapPin, 
    Users, ArrowRight, Sparkles, Zap, 
    ChevronRight, LayoutGrid 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../context/AuthContext';

const Events = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [timeFilter, setTimeFilter] = useState('Active'); // Active, Participated, Past
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventsRes, regsRes] = await Promise.all([
                    axios.get(`/api/events`),
                    user ? axios.get(`/api/registrations/my`) : Promise.resolve({ data: [] })
                ]);
                setEvents(eventsRes.data);
                setMyRegistrations(regsRes.data);
            } catch (error) {
                console.error('Failed to fetch events');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
        let matchesTime = true;
        if (timeFilter === 'Active') {
            matchesTime = event.status === 'Open';
        } else if (timeFilter === 'Past') {
            matchesTime = ['Closed', 'Completed'].includes(event.status);
        } else if (timeFilter === 'Participated') {
            matchesTime = myRegistrations.some(reg => (reg.event?._id || reg.event) === event._id);
        }

        return matchesSearch && matchesCategory && matchesTime;
    });

    return (
        <div className="space-y-16 pb-40">
            {/* Elegant Header */}
            <header className="relative py-12 px-8 bg-slate-900 rounded-[3rem] text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                <div className="relative z-10 space-y-6 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-300 dark:text-white">
                        <Sparkles className="w-4 h-4" />
                        Global Intelligence Network
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-tight">
                        Discover <span className="text-reveal">Elite</span> Events.
                    </h1>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                        Curated experiences for high-impact developers, designers, and innovators.
                    </p>
                </div>
            </header>

            {/* Filter Hub */}
            <div className="space-y-6 p-8 bg-white dark:bg-[#20242B] rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm dark:text-white">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="relative flex-1">
                        <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Search event infrastructure..." 
                            className="input-premium pl-16 bg-slate-50/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                        {['All', 'Workshop', 'Hackathon', 'Conference', 'Seminar', 'Competition', 'Guest Lecture'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-6 py-3 rounded-2xl text-xs font-black transition-all duration-300 ${ categoryFilter === cat ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white dark:text-white' }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex flex-wrap gap-3">
                    {[
                        { label: 'Active Events', value: 'Active' },
                        { label: 'Participated', value: 'Participated', auth: true },
                        { label: 'Past Events', value: 'Past' }
                    ].map(type => {
                        if (type.auth && !user) return null;
                        return (
                            <button
                                key={type.value}
                                onClick={() => setTimeFilter(type.value)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${ timeFilter === type.value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600' }`}
                            >
                                {type.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grid State */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white dark:bg-[#20242B] p-6 rounded-[3rem] border border-slate-50 space-y-6 dark:text-white">
                                <div className="h-64 bg-slate-100 dark:bg-[#20242B] rounded-[2rem] animate-pulse"></div>
                                <div className="h-8 bg-slate-50 dark:bg-[#1a1d24] rounded-full w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-slate-50 dark:bg-[#1a1d24] rounded-full w-1/2 animate-pulse"></div>
                            </div>
                        ))
                    ) : filteredEvents.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-40 text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-slate-50 dark:bg-[#1a1d24] rounded-full flex items-center justify-center mx-auto mb-8">
                                <LayoutGrid className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">No events found.</h3>
                            <p className="text-slate-400 font-medium">Try adjusting your filters or search keywords.</p>
                            <button 
                                onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }}
                                className="text-indigo-600 dark:text-indigo-400 font-black hover:underline"
                            >
                                Reset Infrastructure Filters
                            </button>
                        </motion.div>
                    ) : (
                        filteredEvents.map((event, i) => {
                            const statusColors = {
                                Open: { dot: 'bg-emerald-400', text: 'text-emerald-500' },
                                Closed: { dot: 'bg-amber-400', text: 'text-amber-500' },
                                Completed: { dot: 'bg-indigo-400', text: 'text-indigo-500' },
                                Cancelled: { dot: 'bg-red-400', text: 'text-red-500' },
                                Draft: { dot: 'bg-slate-400', text: 'text-slate-500' }
                            };
                            const status = event.status || 'Open';
                            const colors = statusColors[status] || statusColors.Open;

                            return (
                                <Link key={event._id} to={`/events/${event._id}`} className="block">
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group bg-white dark:bg-[#20242B] rounded-[3rem] p-6 border border-slate-100 dark:border-slate-800 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full dark:text-white"
                                    >
                                        <div className="relative h-72 rounded-[2rem] overflow-hidden mb-8">
                                            <img 
                                                src={getImageUrl(event.bannerImage, 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&w=800&q=80')} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt={event.title}
                                            />
                                            <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl dark:text-white">
                                                {event.category}
                                            </div>
                                            <div className="absolute bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                <Zap className="w-6 h-6 fill-current" />
                                            </div>
                                        </div>
                                        <div className="space-y-6 flex-1 px-4 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors mb-4">
                                                    {event.title}
                                                </h3>
                                                
                                                <div className="space-y-3 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="w-5 h-5 text-indigo-400" />
                                                        <span>{new Date(event.eventDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="w-5 h-5 text-indigo-400" />
                                                        <span className="truncate">{event.venue}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-slate-50 flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.text}`}>{status}</span>
                                                </div>
                                                <span 
                                                    className="inline-flex items-center gap-2 font-black text-slate-900 dark:text-white group-hover:gap-4 transition-all"
                                                >
                                                    Details <ChevronRight className="w-5 h-5" />
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Events;
