import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Trophy, Search, Plus, Trash2, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ManageWinners = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [winners, setWinners] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddWinner, setShowAddWinner] = useState(false);
    const [newWinner, setNewWinner] = useState({
        userId: '',
        position: '',
        prize: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            fetchRegistrations();
            fetchWinners();
        }
    }, [selectedEvent]);

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`/api/events`);
            setEvents(res.data.filter(e => {
                const isPast = new Date(e.eventDate) < new Date();
                return e.status === 'Completed' || e.status === 'Closed' || isPast;
            }));
        } catch (error) {
            toast.error('Failed to fetch events');
        }
    };

    const fetchRegistrations = async () => {
        try {
            const res = await axios.get(`/api/registrations/event/${selectedEvent._id}`);
            setRegistrations(res.data);
        } catch (error) {
            toast.error('Failed to fetch registrations');
        }
    };

    const fetchWinners = async () => {
        try {
            const res = await axios.get(`/api/winners/event/${selectedEvent._id}`);
            setWinners(res.data);
        } catch (error) {
            setWinners([]);
        }
    };

    const handleAddWinner = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`/api/winners/single`, {
                event: selectedEvent._id,
                participant: newWinner.userId,
                position: newWinner.position,
                prize: newWinner.prize
            });
            toast.success('Winner added successfully');
            setNewWinner({ userId: '', position: '', prize: '' });
            setShowAddWinner(false);
            fetchWinners();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add winner');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteWinner = async (winnerId) => {
        try {
            await axios.delete(`/api/winners/${winnerId}`);
            toast.success('Winner removed successfully');
            fetchWinners();
        } catch (error) {
            toast.error('Failed to remove winner');
        }
    };

    const filteredRegistrations = registrations.filter(reg =>
        reg.participant?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.participant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.participant?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-[-1rem]">
                <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
            <div className="bg-white dark:bg-[#1A1D24] p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manage Winners</h1>
                <p className="text-slate-500 dark:text-slate-400">Add and manage winners for completed events</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Event Selection */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Select Event</h2>
                        <div className="space-y-2">
                            {events.map(event => (
                                <button
                                    key={event._id}
                                    onClick={() => setSelectedEvent(event)}
                                    className={`w-full p-4 rounded-xl text-left transition-all ${
                                        selectedEvent?._id === event._id
                                            ? 'bg-primary-600 text-white dark:bg-primary-500'
                                            : 'bg-slate-50 dark:bg-[#20242B] hover:bg-slate-100 dark:hover:bg-[#2a2e36] text-slate-900 dark:text-slate-100'
                                    }`}
                                >
                                    <div className="font-bold">{event.title}</div>
                                    <div className="text-sm opacity-80">{new Date(event.eventDate).toLocaleDateString()}</div>
                                </button>
                            ))}
                            {events.length === 0 && (
                                <p className="text-slate-500 dark:text-slate-400 text-sm">No completed events available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Winners Management */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedEvent ? (
                        <>
                            {/* Event Info */}
                            <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{selectedEvent.title}</h2>
                                <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(selectedEvent.eventDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {selectedEvent.venue}
                                    </div>
                                </div>
                            </div>

                            {/* Add Winner Button */}
                            <button
                                onClick={() => setShowAddWinner(true)}
                                className="w-full p-4 bg-primary-600 dark:bg-primary-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-700 dark:hover:bg-primary-400 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Add Winner
                            </button>

                            {/* Winners List */}
                            <div className="bg-white dark:bg-[#1A1D24] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current Winners</h2>
                                {winners.length > 0 ? (
                                    <div className="space-y-3">
                                        {winners.map(winner => (
                                            <motion.div
                                                key={winner._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                                        {winner.position}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{winner.participant?.username || 'Unknown'}</p>
                                                        {winner.participant?.yearAndDept && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {winner.participant.yearAndDept}{winner.participant.section && winner.participant.section !== 'Nil' ? ` - Section ${winner.participant.section}` : ''}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{winner.prize}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteWinner(winner._id)}
                                                    className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">No winners added yet</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-[#1A1D24] p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
                            <Trophy className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Select an event to manage winners</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Winner Modal */}
            {showAddWinner && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddWinner(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-[#1A1D24] p-8 rounded-3xl max-w-md w-full shadow-2xl relative border border-slate-200 dark:border-slate-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowAddWinner(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-xl font-bold leading-none"
                        >×</button>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Add Winner</h2>

                        {/* Search participants */}
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search participants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:focus:border-cyan-400 transition-all"
                            />
                        </div>

                        <form onSubmit={handleAddWinner} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select Participant</label>
                                <select
                                    required
                                    value={newWinner.userId}
                                    onChange={(e) => setNewWinner({ ...newWinner, userId: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500/30 dark:focus:ring-cyan-500/30 focus:border-primary-500 dark:focus:border-cyan-400 focus:outline-none transition-all"
                                >
                                    <option value="">Choose a participant...</option>
                                    {filteredRegistrations.map(reg => (
                                        <option key={reg._id} value={reg.participant._id}>
                                            {reg.participant.username} ({reg.participant.registrationNumber || reg.participant.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Position</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="1st, 2nd, 3rd, etc."
                                    value={newWinner.position}
                                    onChange={(e) => setNewWinner({ ...newWinner, position: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-primary-500/30 dark:focus:ring-cyan-500/30 focus:border-primary-500 dark:focus:border-cyan-400 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Prize</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Gold Medal, $500, etc."
                                    value={newWinner.prize}
                                    onChange={(e) => setNewWinner({ ...newWinner, prize: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-primary-500/30 dark:focus:ring-cyan-500/30 focus:border-primary-500 dark:focus:border-cyan-400 focus:outline-none transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full p-4 bg-primary-600 dark:bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-700 dark:hover:bg-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Adding...' : 'Add Winner'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ManageWinners;
