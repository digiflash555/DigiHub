import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Trophy, Search, Plus, Trash2, Calendar, MapPin, ArrowLeft, Lock, Unlock, Image, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';

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
                return e.status === 'Completed' || isPast;
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

    const handleEventLockToggle = async (eventId, currentStatus) => {
        try {
            await axios.patch(`/api/winners/event/${eventId}/lock-photos`, { locked: !currentStatus });
            toast.success(`Uploads ${!currentStatus ? 'locked' : 'unlocked'} for event`);
            fetchEvents();
            // Also fetch winners to update their state if necessary
            fetchWinners();
            // Update selectedEvent to reflect the new state
            setSelectedEvent(prev => ({ ...prev, winnerPhotoUploadLocked: !currentStatus }));
        } catch (error) {
            toast.error('Failed to toggle event lock');
        }
    };

    const handleSingleLockToggle = async (winnerId, currentStatus) => {
        try {
            await axios.patch(`/api/winners/${winnerId}/lock-photo`, { locked: !currentStatus });
            toast.success(`Upload ${!currentStatus ? 'locked' : 'unlocked'} for winner`);
            fetchWinners();
        } catch (error) {
            toast.error('Failed to toggle winner lock');
        }
    };

    const handleAdminPhotoUpload = async (winnerId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const uploadPromise = axios.post(`/api/winners/${winnerId}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.promise(uploadPromise, {
                loading: 'Uploading photo...',
                success: 'Photo updated!',
                error: 'Failed to update photo'
            });
            await uploadPromise;
            fetchWinners();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAdminPhotoDelete = async (winnerId) => {
        if (!window.confirm('Remove this photo?')) return;
        try {
            await axios.delete(`/api/winners/${winnerId}/photo`);
            toast.success('Photo removed');
            fetchWinners();
        } catch (error) {
            toast.error('Failed to remove photo');
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
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current Winners</h2>
                                    <button
                                        onClick={() => handleEventLockToggle(selectedEvent._id, selectedEvent.winnerPhotoUploadLocked)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                            selectedEvent.winnerPhotoUploadLocked 
                                                ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' 
                                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                        }`}
                                    >
                                        {selectedEvent.winnerPhotoUploadLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                        {selectedEvent.winnerPhotoUploadLocked ? 'Unlock All Uploads' : 'Lock All Uploads'}
                                    </button>
                                </div>
                                {winners.length > 0 ? (
                                    <div className="space-y-3">
                                        {winners.map(winner => (
                                            <motion.div
                                                key={winner._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative border-2 border-amber-200">
                                                        <img 
                                                            src={getImageUrl(winner.profilePhoto || winner.participant?.profileImage || 'default-profile.png')} 
                                                            className="w-full h-full object-cover" 
                                                            alt="Winner" 
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-[10px] border-2 border-white">
                                                            {winner.position.match(/\d+/)?.[0] || 'W'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{winner.participant?.username || 'Unknown'}</p>
                                                        {winner.participant?.yearAndDept && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {winner.participant.yearAndDept}{winner.participant.section && winner.participant.section !== 'Nil' ? ` - Section ${winner.participant.section}` : ''}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-amber-600 dark:text-amber-500 font-bold mt-0.5">{winner.position} • {winner.prize}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <div className="flex items-center gap-1">
                                                        <label className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer" title="Replace Photo">
                                                            <Image className="w-4 h-4" />
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAdminPhotoUpload(winner._id, e)} />
                                                        </label>
                                                        {winner.profilePhoto && (
                                                            <button onClick={() => handleAdminPhotoDelete(winner._id)} className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors" title="Remove Uploaded Photo">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleSingleLockToggle(winner._id, winner.photoUploadLocked)}
                                                            className={`p-1.5 rounded-lg transition-colors ${winner.photoUploadLocked ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                            title={winner.photoUploadLocked ? "Unlock Photo Upload" : "Lock Photo Upload"}
                                                        >
                                                            {winner.photoUploadLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteWinner(winner._id)}
                                                            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                                                            title="Remove Winner"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
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
