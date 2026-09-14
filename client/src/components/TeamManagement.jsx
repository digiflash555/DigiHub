import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Users, UserPlus, Check, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamManagement = ({ teamId, isLeader }) => {
    const [team, setTeam] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const fetchTeamDetails = useCallback(async () => {
        if (!teamId) return;

        try {
            const res = await axios.get(`/api/teams/${teamId}`);
            setTeam(res.data);
        } catch {
            toast.error('Failed to load team details');
        }
    }, [teamId]);

    useEffect(() => {
        fetchTeamDetails();
    }, [fetchTeamDetails]);

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) return;

        setIsSearching(true);
        try {
            const res = await axios.get(`/api/auth/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.data);
        } catch {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const inviteUser = async (userId) => {
        try {
            await axios.post(`/api/teams/${teamId}/invite`, { userId });
            toast.success('Invitation sent');
            await fetchTeamDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to invite');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#20242B] p-6 rounded-2xl border shadow-sm dark:text-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        Team Management
                    </h2>
                    {team && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${ team.isRegistrationComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600' }`}>
                            {team.isRegistrationComplete ? 'Ready' : 'Incomplete'}
                        </span>
                    )}
                </div>

                {/* Team Members List */}
                <div className="space-y-4">
                    {team?.members.map((member, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300">
                                    {member?.user?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{member.user.username}</p>
                                    <p className="text-xs text-gray-500">{member.user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {member.status === 'Accepted' ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-bold">
                                        <Check className="w-4 h-4" /> Joined
                                    </span>
                                ) : (
                                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs font-bold">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Invite Section (Only for Leader) */}
                {isLeader && (
                    <div className="mt-8 pt-8 border-t space-y-4">
                        <h3 className="font-bold text-gray-900">Invite Members</h3>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    className="input-field pl-9" 
                                    placeholder="Username or Email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSearching ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2 border rounded-xl bg-gray-50 max-h-60 overflow-y-auto"
                                >
                                    {searchResults.map(user => (
                                        <div key={user._id} className="flex items-center justify-between p-3 hover:bg-white rounded-lg transition-all dark:text-white">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                                <span className="text-sm font-medium">{user.username}</span>
                                            </div>
                                            <button 
                                                onClick={() => inviteUser(user._id)}
                                                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 rounded-lg"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamManagement;
