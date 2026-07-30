import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Calendar, MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';


const Winners = () => {
    const [winnersByEvent, setWinnersByEvent] = useState({});
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchWinners = async () => {
            try {
                setIsLoading(true);
                const winnersRes = await axios.get(`/api/winners`);

                const uniqueEventsMap = {};
                const grouped = winnersRes.data.reduce((acc, winner) => {
                    const event = winner.event;
                    if (!event || !event._id) return acc;

                    if (!acc[event._id]) {
                        acc[event._id] = [];
                        uniqueEventsMap[event._id] = event;
                    }
                    acc[event._id].push(winner);
                    return acc;
                }, {});

                setWinnersByEvent(grouped);
                setEvents(Object.values(uniqueEventsMap));
            } catch (error) {
                console.error('Failed to fetch winners data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchWinners();
    }, []);

    const searchLower = searchTerm.toLowerCase();

    const processedEvents = events.map(event => {
        let eventWinners = winnersByEvent[event._id] || [];
        const eventMatch = 
            event.title.toLowerCase().includes(searchLower) ||
            (event.category && event.category.toLowerCase().includes(searchLower));

        if (!eventMatch && searchLower) {
            eventWinners = eventWinners.filter(winner => 
                (winner.participant?.username && winner.participant.username.toLowerCase().includes(searchLower)) ||
                (winner.participant?.yearAndDept && winner.participant.yearAndDept.toLowerCase().includes(searchLower)) ||
                (winner.prize && winner.prize.toLowerCase().includes(searchLower))
            );
        }

        const sortedWinners = [...eventWinners].sort((a, b) => {
            const posA = parseInt(a.position) || Number.MAX_SAFE_INTEGER;
            const posB = parseInt(b.position) || Number.MAX_SAFE_INTEGER;
            return posA - posB;
        });

        return {
            ...event,
            displayWinners: sortedWinners
        };
    }).filter(event => event.displayWinners.length > 0);

    return (
        <div className="max-w-6xl mx-auto space-y-16 pb-40">
            {/* Header Section */}
            <div className="text-center space-y-6 pt-10">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-700 font-black text-sm uppercase tracking-widest shadow-sm"
                >
                    <Trophy className="w-5 h-5 fill-yellow-100" />
                    Celebrating Excellence
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                    Wall of <span className="text-indigo-600 dark:text-indigo-400">Winners.</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    Honoring the outstanding achievements and extraordinary performances from our community events.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
                <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                    type="text" 
                    placeholder="Search events or winners..." 
                    className="w-full pl-16 pr-8 py-5 bg-white dark:bg-[#20242B] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium text-lg dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Winners Grid */}
            <div className="space-y-20">
                {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-10">
                        {[1, 2].map(i => <div key={i} className="h-80 bg-slate-100 dark:bg-[#20242B] rounded-[3rem] animate-pulse"></div>)}
                    </div>
                ) : processedEvents.length > 0 ? (
                    processedEvents.map((event) => (
                        <motion.section 
                            key={event._id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-[#20242B] rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white"
                        >
                            <div className="grid lg:grid-cols-5 h-full">
                                {/* Event Banner Area */}
                                <div className="lg:col-span-2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 opacity-10">
                                        <Trophy className="w-40 h-40" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-black uppercase tracking-widest text-indigo-300 border border-white/10 dark:text-white">
                                            {event.category}
                                        </span>
                                        <h2 className="text-4xl font-black tracking-tight leading-tight">{event.title}</h2>
                                        <div className="space-y-3 font-medium opacity-80">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5" />
                                                {new Date(event.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-5 h-5" />
                                                {event.venue}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Winners List Area */}
                                <div className="lg:col-span-3 p-12 space-y-8">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Hall of Fame</h3>
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{event.displayWinners.length} Winners</span>
                                    </div>
                                    <div className="space-y-4">
                                        {event.displayWinners.map((winner, idx) => (
                                            <div 
                                                key={winner._id}
                                                className={`relative overflow-hidden group p-6 rounded-3xl border transition-all duration-300 flex items-center justify-between ${ parseInt(winner.position) === 1 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 hover:shadow-xl hover:shadow-yellow-100/50' : parseInt(winner.position) === 2 ? 'bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50' : parseInt(winner.position) === 3 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:shadow-xl hover:shadow-orange-100/50' : 'bg-slate-50 border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50' } dark:text-white`}
                                            >
                                                <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${ parseInt(winner.position) === 1 ? 'bg-yellow-400' : parseInt(winner.position) === 2 ? 'bg-slate-400' : parseInt(winner.position) === 3 ? 'bg-orange-500' : 'bg-indigo-400' }`}></div>
                                                <div className="flex items-center gap-6">
                                                    <div className="relative z-10">
                                                        {winner.participant?.profileImage ? (
                                                            <div className="relative">
                                                                <img 
                                                                    src={getImageUrl(winner.participant.profileImage)} 
                                                                    alt={winner.participant?.username} 
                                                                    className="w-16 h-16 rounded-2xl object-cover shadow-lg transition-transform group-hover:scale-110 border-2 border-white"
                                                                />
                                                                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-white ${ parseInt(winner.position) === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : parseInt(winner.position) === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-500' : parseInt(winner.position) === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600' : 'bg-gradient-to-br from-indigo-400 to-indigo-600' }`}>
                                                                    {winner.position[0]}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg transition-transform group-hover:scale-110 ${ parseInt(winner.position) === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : parseInt(winner.position) === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-500' : parseInt(winner.position) === 3 ? 'bg-gradient-to-br from-orange-400 to-amber-600' : 'bg-gradient-to-br from-indigo-400 to-indigo-600' }`}>
                                                                {winner.position[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="relative z-10">
                                                        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{winner.participant?.username || 'Redacted'}</p>
                                                        {winner.participant?.yearAndDept && (
                                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">
                                                                {winner.participant.yearAndDept}{winner.participant.section && winner.participant.section !== 'Nil' ? ` - Section ${winner.participant.section}` : ''}
                                                            </p>
                                                        )}
                                                        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-wide uppercase mt-1">{winner.prize}</p>
                                                    </div>
                                                </div>
                                                {parseInt(winner.position) === 1 && (
                                                    <div className="hidden sm:flex relative z-10 w-10 h-10 bg-yellow-100 text-yellow-600 items-center justify-center rounded-full animate-bounce shadow-sm">
                                                        <Trophy className="w-5 h-5 fill-yellow-200" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-[#20242B] rounded-[3.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 dark:text-white">
                        <Trophy className="w-20 h-20 mx-auto text-slate-200 mb-6 opacity-50" />
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">No results found.</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Try adjusting your search filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Winners;
