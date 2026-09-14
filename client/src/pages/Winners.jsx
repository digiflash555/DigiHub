import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Calendar, MapPin, Search, Heart, MessageSquare, Send, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ─── helpers ──────────────────────────────────────────────── */
const Avatar = ({ src, alt, size = 8 }) => (
    src
        ? <img src={getImageUrl(src)} alt={alt} className={`w-${size} h-${size} rounded-full object-cover shrink-0 bg-slate-200 border-2 border-white`} />
        : <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-xs shrink-0 border-2 border-white`}>{(alt || '?')[0].toUpperCase()}</div>
);

const ReplyItem = ({ reply, currentUserId, onLikeReply }) => {
    const liked = currentUserId && reply.likes?.includes(currentUserId);
    return (
        <div className="flex gap-2 ml-10 mt-2">
            <Avatar src={reply.user?.profileImage} alt={reply.user?.username} size={7} />
            <div className="flex-1">
                <div className="inline-block bg-slate-100 dark:bg-slate-700/60 rounded-2xl px-3 py-2 max-w-full">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{reply.user?.username || 'User'}</span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 break-words">{reply.text}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 ml-1">
                    <button
                        onClick={onLikeReply}
                        className={`flex items-center gap-1 text-xs font-bold transition-colors ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                    >
                        <Heart className={`w-3 h-3 ${liked ? 'fill-red-500' : ''}`} />
                        {reply.likes?.length > 0 && reply.likes.length}
                    </button>
                    <span className="text-[10px] text-slate-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

const CommentItem = ({ comment, winnerId, currentUserId, onUpdate }) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const liked = currentUserId && comment.likes?.some(id => id === currentUserId || id?._id === currentUserId || id?.toString() === currentUserId);

    const handleLikeComment = async () => {
        if (!currentUserId) { alert('Please login to like comments.'); return; }
        try {
            const res = await axios.post(`/api/winners/${winnerId}/comment/${comment._id}/like`);
            onUpdate(res.data);
        } catch (e) { console.error(e); }
    };

    const handleLikeReply = async (replyId) => {
        if (!currentUserId) { alert('Please login to like replies.'); return; }
        try {
            const res = await axios.post(`/api/winners/${winnerId}/comment/${comment._id}/reply/${replyId}/like`);
            onUpdate(res.data);
        } catch (e) { console.error(e); }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!currentUserId) { alert('Please login to reply.'); return; }
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const res = await axios.post(`/api/winners/${winnerId}/comment/${comment._id}/reply`, { text: replyText });
            onUpdate(res.data);
            setReplyText('');
            setShowReplyInput(false);
            setShowReplies(true);
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const replyCount = comment.replies?.length || 0;

    return (
        <div className="group/comment">
            <div className="flex gap-2">
                <Avatar src={comment.user?.profileImage} alt={comment.user?.username} size={8} />
                <div className="flex-1">
                    <div className="inline-block bg-white/70 dark:bg-slate-900/50 rounded-2xl px-4 py-2.5 max-w-full border border-slate-100 dark:border-slate-700/50">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{comment.user?.username || 'User'}</span>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 break-words">{comment.text}</p>
                    </div>

                    {/* Comment actions */}
                    <div className="flex items-center gap-3 mt-1 ml-1">
                        <button onClick={handleLikeComment} className={`flex items-center gap-1 text-xs font-bold transition-colors ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
                            <Heart className={`w-3 h-3 ${liked ? 'fill-red-500' : ''}`} />
                            {comment.likes?.length > 0 && <span>{comment.likes.length}</span>}
                            Like
                        </button>
                        <button onClick={() => setShowReplyInput(v => !v)} className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3" />
                            Reply
                        </button>
                        <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Inline Reply Input */}
                    <AnimatePresence>
                        {showReplyInput && (
                            <motion.form
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                onSubmit={handleReplySubmit}
                                className="flex items-center gap-2 mt-2 ml-1 overflow-hidden"
                            >
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={`Reply to ${comment.user?.username}...`}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    className="flex-1 bg-white dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                />
                                <button type="submit" disabled={submitting || !replyText.trim()} className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white disabled:opacity-50">
                                    <Send className="w-3 h-3" />
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Show/hide replies */}
                    {replyCount > 0 && (
                        <button onClick={() => setShowReplies(v => !v)} className="flex items-center gap-1 mt-2 ml-1 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {showReplies ? 'Hide' : 'View'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </button>
                    )}

                    <AnimatePresence>
                        {showReplies && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-1 mt-1"
                            >
                                {comment.replies?.map(reply => (
                                    <ReplyItem
                                        key={reply._id}
                                        reply={reply}
                                        currentUserId={currentUserId}
                                        onLikeReply={() => handleLikeReply(reply._id)}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const Winners = () => {
    const { user } = useAuth();
    const [winnersByEvent, setWinnersByEvent] = useState({});
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedComments, setExpandedComments] = useState({});
    const [commentTexts, setCommentTexts] = useState({});
    const [isSubmitting, setIsSubmitting] = useState({});

    const fetchWinners = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get('/api/winners');
            const uniqueEventsMap = {};
            const grouped = res.data.reduce((acc, winner) => {
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
        } catch (e) {
            console.error('Failed to fetch winners data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchWinners(); }, []);

    useEffect(() => {
        if (!isLoading && window.location.hash) {
            const el = document.querySelector(window.location.hash);
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-4', 'ring-amber-400/60', 'ring-offset-2');
                    setTimeout(() => el.classList.remove('ring-4', 'ring-amber-400/60', 'ring-offset-2'), 3000);
                }, 300);
            }
        }
    }, [isLoading]);

    /* ── update local winner state after comment/like actions ── */
    const updateWinnerComments = (winnerId, newComments) => {
        setWinnersByEvent(prev => {
            const updated = { ...prev };
            for (const eid in updated) {
                updated[eid] = updated[eid].map(w =>
                    w._id === winnerId ? { ...w, comments: newComments } : w
                );
            }
            return updated;
        });
    };

    const handleLike = async (winnerId) => {
        if (!user) { alert('Please login to like this achievement.'); return; }
        try {
            const res = await axios.post(`/api/winners/${winnerId}/like`);
            setWinnersByEvent(prev => {
                const updated = { ...prev };
                for (const eid in updated) {
                    updated[eid] = updated[eid].map(w =>
                        w._id === winnerId ? { ...w, likes: res.data.likes } : w
                    );
                }
                return updated;
            });
        } catch (e) { console.error(e); }
    };

    const handleCommentSubmit = async (winnerId, e) => {
        e.preventDefault();
        if (!user) { alert('Please login to comment.'); return; }
        const text = commentTexts[winnerId];
        if (!text?.trim()) return;
        setIsSubmitting(p => ({ ...p, [winnerId]: true }));
        try {
            const res = await axios.post(`/api/winners/${winnerId}/comment`, { text });
            updateWinnerComments(winnerId, res.data);
            setCommentTexts(p => ({ ...p, [winnerId]: '' }));
        } catch (e) { console.error(e); }
        finally { setIsSubmitting(p => ({ ...p, [winnerId]: false })); }
    };

    const searchLower = searchTerm.toLowerCase();
    const processedEvents = events.map(event => {
        let eventWinners = winnersByEvent[event._id] || [];
        const eventMatch =
            event.title.toLowerCase().includes(searchLower) ||
            (event.category && event.category.toLowerCase().includes(searchLower));

        if (!eventMatch && searchLower) {
            eventWinners = eventWinners.filter(w =>
                (w.participant?.username?.toLowerCase().includes(searchLower)) ||
                (w.participant?.yearAndDept?.toLowerCase().includes(searchLower)) ||
                (w.prize?.toLowerCase().includes(searchLower))
            );
        }

        return {
            ...event,
            displayWinners: [...eventWinners].sort((a, b) => {
                const posA = parseInt(a.position) || Number.MAX_SAFE_INTEGER;
                const posB = parseInt(b.position) || Number.MAX_SAFE_INTEGER;
                return posA - posB;
            })
        };
    }).filter(ev => ev.displayWinners.length > 0);

    const posClass = (pos) => ({
        1: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700/40',
        2: 'bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800/60 dark:to-slate-700/40 border-slate-200 dark:border-slate-600/50',
        3: 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-700/40',
    }[pos] || 'bg-slate-50 dark:bg-slate-800/40 border-transparent');

    const posGlow = (pos) => ({
        1: 'bg-yellow-400',
        2: 'bg-slate-400',
        3: 'bg-orange-500',
    }[pos] || 'bg-indigo-400');

    const posBadge = (pos) => ({
        1: 'bg-gradient-to-br from-yellow-400 to-orange-500',
        2: 'bg-gradient-to-br from-slate-400 to-slate-500',
        3: 'bg-gradient-to-br from-orange-400 to-amber-600',
    }[pos] || 'bg-gradient-to-br from-indigo-400 to-indigo-600');

    return (
        <div className="max-w-6xl mx-auto space-y-16 pb-40">
            {/* Header */}
            <div className="text-center space-y-6 pt-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-700/50 text-yellow-700 dark:text-yellow-400 font-black text-sm uppercase tracking-widest shadow-sm"
                >
                    <Trophy className="w-5 h-5 fill-yellow-100 dark:fill-yellow-800" />
                    Celebrating Excellence
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                    Wall of <span className="text-indigo-600 dark:text-indigo-400">Winners.</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    Honoring the outstanding achievements and extraordinary performances from our community events.
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
                <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                    type="text"
                    placeholder="Search events or winners..."
                    className="w-full pl-16 pr-8 py-5 bg-white dark:bg-[#20242B] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium text-lg dark:text-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Winners Grid */}
            <div className="space-y-20">
                {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-10">
                        {[1, 2].map(i => <div key={i} className="h-80 bg-slate-100 dark:bg-[#20242B] rounded-[3rem] animate-pulse" />)}
                    </div>
                ) : processedEvents.length > 0 ? (
                    processedEvents.map(event => (
                        <motion.section
                            key={event._id}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-[#20242B] rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white"
                        >
                            <div className="grid lg:grid-cols-5 h-full">
                                {/* Event Banner */}
                                <div className="lg:col-span-2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 opacity-10">
                                        <Trophy className="w-40 h-40" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <span className="px-4 py-1.5 rounded-full bg-white/10 text-xs font-black uppercase tracking-widest text-indigo-300 border border-white/10">
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

                                {/* Winners List */}
                                <div className="lg:col-span-3 p-10 space-y-8">
                                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-5">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Hall of Fame</h3>
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{event.displayWinners.length} Winners</span>
                                    </div>

                                    <div className="space-y-4">
                                        {event.displayWinners.map(winner => {
                                            const pos = parseInt(winner.position);
                                            const hasLiked = user && winner.likes?.includes(user._id);
                                            const likesCount = winner.likes?.length || 0;
                                            const commentsCount = winner.comments?.length || 0;
                                            const isCommentsOpen = expandedComments[winner._id];

                                            return (
                                                <div
                                                    key={winner._id}
                                                    id={`winner-${winner._id}`}
                                                    className={`relative overflow-hidden group rounded-3xl border transition-all duration-300 ${posClass(pos)} dark:text-white`}
                                                >
                                                    {/* Glow blob */}
                                                    <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${posGlow(pos)}`} />

                                                    {/* Winner Info Row */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="relative z-10">
                                                                {winner.profilePhoto || winner.participant?.profileImage ? (
                                                                    <div className="relative">
                                                                        <img
                                                                            src={getImageUrl(winner.profilePhoto || winner.participant.profileImage)}
                                                                            alt={winner.participant?.username}
                                                                            className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white"
                                                                        />
                                                                        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-white ${posBadge(pos)}`}>
                                                                            {winner.position[0]}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${posBadge(pos)}`}>
                                                                        {winner.position[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="relative z-10">
                                                                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{winner.participant?.username || 'Redacted'}</p>
                                                                {winner.participant?.yearAndDept && (
                                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">
                                                                        {winner.participant.yearAndDept}
                                                                        {winner.participant.section && winner.participant.section !== 'Nil' ? ` - Section ${winner.participant.section}` : ''}
                                                                    </p>
                                                                )}
                                                                <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm tracking-wide uppercase mt-1">{winner.prize}</p>
                                                            </div>
                                                        </div>

                                                        <div className="relative z-10 flex items-center gap-2 flex-wrap">
                                                            {/* Like winner */}
                                                            <button
                                                                onClick={() => handleLike(winner._id)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-sm font-bold ${hasLiked ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10' : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white dark:bg-slate-900/30 dark:border-slate-700 dark:text-slate-300'}`}
                                                            >
                                                                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-500' : ''}`} />
                                                                {likesCount > 0 && likesCount}
                                                            </button>
                                                            {/* Open comments */}
                                                            <button
                                                                onClick={() => setExpandedComments(p => ({ ...p, [winner._id]: !p[winner._id] }))}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 border border-slate-200 text-slate-600 hover:bg-white dark:bg-slate-900/30 dark:border-slate-700 dark:text-slate-300 transition-all text-sm font-bold"
                                                            >
                                                                <MessageSquare className="w-4 h-4" />
                                                                {commentsCount > 0 && commentsCount}
                                                            </button>
                                                            {pos === 1 && (
                                                                <div className="hidden sm:flex w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 items-center justify-center rounded-full animate-bounce shadow-sm">
                                                                    <Trophy className="w-5 h-5 fill-yellow-200 dark:fill-yellow-700" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Comments Panel */}
                                                    <AnimatePresence>
                                                        {isCommentsOpen && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="relative z-10 border-t border-slate-200/60 dark:border-slate-700/50 overflow-hidden"
                                                            >
                                                                <div className="p-5 space-y-4">
                                                                    {/* Comment list */}
                                                                    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                                                                        {commentsCount === 0 ? (
                                                                            <p className="text-center text-sm text-slate-400 py-4">No comments yet. Be the first to congratulate them!</p>
                                                                        ) : (
                                                                            winner.comments.map(comment => (
                                                                                <CommentItem
                                                                                    key={comment._id}
                                                                                    comment={comment}
                                                                                    winnerId={winner._id}
                                                                                    currentUserId={user?._id}
                                                                                    onUpdate={(newComments) => updateWinnerComments(winner._id, newComments)}
                                                                                />
                                                                            ))
                                                                        )}
                                                                    </div>

                                                                    {/* New Comment Input */}
                                                                    <form onSubmit={e => handleCommentSubmit(winner._id, e)} className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                                                        {user && <Avatar src={user.profileImage} alt={user.username} size={8} />}
                                                                        <input
                                                                            type="text"
                                                                            placeholder={user ? 'Write a comment...' : 'Login to comment'}
                                                                            disabled={!user}
                                                                            className="flex-1 bg-white dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
                                                                            value={commentTexts[winner._id] || ''}
                                                                            onChange={e => setCommentTexts(p => ({ ...p, [winner._id]: e.target.value }))}
                                                                        />
                                                                        <button
                                                                            type="submit"
                                                                            disabled={isSubmitting[winner._id] || !commentTexts[winner._id]?.trim() || !user}
                                                                            className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors shrink-0"
                                                                        >
                                                                            <Send className="w-4 h-4" />
                                                                        </button>
                                                                    </form>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
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
