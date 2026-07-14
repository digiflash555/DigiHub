import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {

    Calendar, Users, Award, ShieldCheck,
    ArrowRight, Sparkles, Zap, Globe,
    ChevronRight, Play, Star, Plus,
    Twitter, Github, Linkedin, Instagram,
    Terminal, Cpu, BookOpen, Lightbulb
} from 'lucide-react';

const Home = () => {
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
    const [associationMembers, setAssociationMembers] = useState([]);
    const [adminProfile, setAdminProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMemberIndex, setCurrentMemberIndex] = useState(0);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [eventsRes, statsRes, membersRes] = await Promise.all([
                    axios.get(`/api/events?status=Open`),
                    axios.get(`/api/events/public-stats`),
                    axios.get(`/api/auth/association-members`)
                ]);
                setEvents(eventsRes.data.slice(0, 3));
                setStats(statsRes.data);
                const members = membersRes.data;
                setAdminProfile(members.find(m => m.role === 'Admin') || null);
                setAssociationMembers(members.filter(m => m.role !== 'Admin'));
            } catch (error) {
                console.error('Failed to fetch home data');
                setStats({ totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 });
                setEvents([]);
                setAssociationMembers([]);
                setAdminProfile(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHomeData();
    }, []);

    useEffect(() => {
        if (associationMembers.length > 0) {
            const timer = setInterval(() => {
                setCurrentMemberIndex((prev) => (prev + 1) % associationMembers.length);
            }, 3000); // Auto-slide every 3 seconds
            return () => clearInterval(timer);
        }
    }, [associationMembers.length]);

    const handlePrevMember = () => {
        setCurrentMemberIndex((prev) => (prev === 0 ? associationMembers.length - 1 : prev - 1));
    };

    const handleNextMember = () => {
        setCurrentMemberIndex((prev) => (prev + 1) % associationMembers.length);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="space-y-40 pb-40 overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center pt-20">
                {/* Background Decorations */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full"></div>

                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-10 text-center lg:text-left z-10"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-primary-600 dark:text-primary-400 font-black text-sm uppercase tracking-widest">
                            <Sparkles className="w-5 h-5 fill-primary-100 dark:fill-primary-900" />
                            Association of CSE
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-6xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter">
                            Welcome to <br />
                            <span className="text-reveal">DigiFlash</span>
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-xl text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-medium mx-auto lg:mx-0">
                            The official technical community of the Computer Science and Engineering Department. Join us for cutting-edge workshops, hackathons, and exclusive tech events.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
                            <Link to="/events" className="btn-premium flex items-center gap-3 group">
                                Start Exploring
                                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                            </Link>
                            <Link to="/register" className="px-10 py-4 bg-white dark:bg-transparent border-2 border-slate-900 dark:border-white text-slate-900 dark:text-white rounded-2xl font-black hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 dark:text-white transition-all duration-300 active:scale-95">
                                Join Now
                            </Link>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center justify-center lg:justify-start gap-4 pt-8">
                            <div className="text-sm font-bold text-slate-400 dark:text-slate-500">
                                <span className="text-slate-900 dark:text-white font-black text-lg block leading-tight">{stats.totalRegistrations}+ Participants</span>
                                Active Tech Enthusiasts
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Admin Block */}
                    {adminProfile && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-col items-center justify-center relative z-10 mt-12 lg:mt-0 w-full"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6, type: "spring", bounce: 0.4 }}
                                className="mb-8 relative group cursor-default mx-auto"
                            >
                                <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 opacity-30 blur-lg group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></span>
                                <div className="relative px-4 sm:px-6 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full shadow-xl text-xs sm:text-sm md:text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center justify-center text-center gap-2 sm:gap-3 whitespace-nowrap">
                                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 drop-shadow-sm shrink-0" />
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
                                        Association Coordinator
                                    </span>
                                </div>
                            </motion.div>

                            <div className="glass dark:bg-slate-900/60 rounded-[3rem] p-8 max-w-sm w-full relative overflow-hidden group border border-slate-200 dark:border-slate-700/50 hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                    <div className="w-40 h-40 rounded-full p-2 bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                        {adminProfile.profileImage ? (
                                            <img src={getImageUrl(adminProfile.profileImage)} alt={adminProfile.username} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800" />
                                        ) : (
                                            <img src={`https://ui-avatars.com/api/?name=${adminProfile.username}&background=0047AB&color=fff&size=200`} alt={adminProfile.username} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">{adminProfile.username}</h3>
                                        <p className="text-primary-600 dark:text-primary-400 font-bold tracking-wide uppercase text-sm mt-1">{adminProfile.designation || 'Association Coordinator'}</p>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                                        "{adminProfile.bio || 'Empowering the next generation of tech innovators through DigiFlash.'}"
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </div>
            </section>

            {/* Feature Bento Grid */}
            <section className="container mx-auto px-6 space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Our Core <span className="text-reveal">Initiatives</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Fostering technical excellence through engaging community activities.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Large Feature */}
                    <div className="md:col-span-2 group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-2 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="absolute -top-24 -right-24 opacity-5 dark:opacity-10 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12">
                            <Terminal className="w-96 h-96 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="relative z-10 space-y-6 max-w-md">
                            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                <Terminal className="w-8 h-8 font-black" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">Hackathons & Coding Contests</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-medium">
                                Compete with the brightest minds. Our regular hackathons and algorithmic challenges push your coding skills to the absolute limit.
                            </p>
                            <div className="pt-4">
                                <Link to="/events" className="flex items-center gap-2 font-black text-primary-600 dark:text-primary-400 group-hover:gap-4 transition-all">
                                    Explore Hackathons <ChevronRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Small Feature */}
                    <div className="group bg-primary-600 dark:bg-primary-800 rounded-[3rem] p-12 text-white shadow-xl shadow-primary-200 dark:shadow-none hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur dark:text-white">
                            <Cpu className="w-8 h-8" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black">Tech Workshops</h3>
                            <p className="text-primary-100 font-medium">Hands-on sessions covering AI, Web3, and emerging technologies.</p>
                        </div>
                    </div>

                    {/* More Bento Items... */}
                    <div className="group bg-white dark:bg-slate-900 rounded-[3rem] p-12 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-slate-800 flex items-center justify-center backdrop-blur">
                            <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="space-y-4 mt-6">
                            <h3 className="text-2xl font-black">Guest Lectures</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Gain valuable insights from industry leaders and top alumni.</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 group relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-2 transition-all duration-500 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative z-10 space-y-6 max-w-sm shrink-0">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">Project Showcases</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-medium">
                                Exhibit your innovative projects, get constructive peer reviews, and connect with faculty mentors to bring your ideas to life.
                            </p>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${80 - i * 15}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.2 }}
                                        className="h-full bg-primary-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Events */}
            <section className="container mx-auto px-6 space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Featured <span className="text-reveal">Events</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Discover and join exciting upcoming events.</p>
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading events...</p>
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <Link key={event._id} to={`/events/${event._id}`} className="group">
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-2 transition-all duration-500 dark:text-white">
                                    <div className="aspect-video bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                                        {event.bannerImage ? (
                                            <img src={getImageUrl(event.bannerImage)} alt={event.title} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700" />
                                        ) : (
                                            <Calendar className="w-16 h-16 text-white/50 group-hover:scale-125 transition-transform duration-700 relative z-10" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-widest">
                                                {event.category}
                                            </span>
                                            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
                                                {event.status}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white line-clamp-2">{event.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2">{event.description}</p>
                                        <div className="flex items-center justify-between pt-4">
                                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                                                {new Date(event.eventDate).toLocaleDateString()}
                                            </span>
                                            <ArrowRight className="w-5 h-5 text-primary-600 dark:text-primary-400 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No events available at the moment.</p>
                    </div>
                )}
            </section>

            {/* Association Members Carousel */}
            {associationMembers.length > 0 && (
                <section className="container mx-auto px-6 space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Our <span className="text-reveal">Team</span></h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">The dedicated members driving the association forward.</p>
                    </div>

                    <div className="relative max-w-4xl mx-auto">
                        <div className="overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border border-primary-100 dark:border-slate-800 shadow-xl relative min-h-[400px] flex items-center justify-center p-8">

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentMemberIndex}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.1, ease: "easeInOut" }}
                                    className="flex flex-col md:flex-row items-center gap-10"
                                >
                                    <div className="shrink-0 relative">
                                        <div className="absolute inset-0 bg-primary-200 dark:bg-primary-900/30 rounded-full blur-2xl opacity-50"></div>
                                        {associationMembers[currentMemberIndex]?.profileImage ? (
                                            <img
                                                src={getImageUrl(associationMembers[currentMemberIndex].profileImage)}
                                                alt={associationMembers[currentMemberIndex].username}
                                                className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-2xl relative z-10"
                                            />
                                        ) : (
                                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-800 shadow-2xl flex items-center justify-center relative z-10 text-primary-200 dark:text-primary-800">
                                                <Users className="w-20 h-20" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4 text-center md:text-left">
                                        <div className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold text-sm tracking-wide uppercase">
                                            {associationMembers[currentMemberIndex]?.associationRole || 'Volunteer'}
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{associationMembers[currentMemberIndex]?.username}</h3>
                                        {associationMembers[currentMemberIndex]?.yearAndDept && (
                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                                                {associationMembers[currentMemberIndex].yearAndDept} {associationMembers[currentMemberIndex].section !== 'Nil' ? `- ${associationMembers[currentMemberIndex].section}` : ''}
                                            </p>
                                        )}
                                        {associationMembers[currentMemberIndex]?.bio && (
                                            <p className="text-slate-600 dark:text-slate-300 max-w-md mt-4">
                                                "{associationMembers[currentMemberIndex].bio}"
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <button
                                onClick={handlePrevMember}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all z-20"
                            >
                                <ChevronRight className="w-6 h-6 rotate-180" />
                            </button>
                            <button
                                onClick={handleNextMember}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all z-20"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Dots */}
                        <div className="flex justify-center gap-2 mt-8">
                            {associationMembers.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentMemberIndex(idx)}
                                    className={`w-3 h-3 rounded-full transition-all ${idx === currentMemberIndex ? 'bg-primary-600 w-8' : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'}`}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Final CTA */}
            <section className="container mx-auto px-6">
                <div className="bg-primary-600 dark:bg-primary-800 rounded-[4rem] p-24 text-center text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(30,167,255,0.4)] dark:shadow-none">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]"></div>
                    <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                        <h2 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter">Ready to Spark Your <span className="text-primary-200">Tech Journey?</span></h2>
                        <p className="text-xl text-primary-100 font-medium">Be part of the most active tech association on campus. Join {stats.totalRegistrations}+ participants today.</p>
                        <div className="flex justify-center flex-wrap gap-6">
                            <Link to="/events" className="px-12 py-5 bg-white dark:bg-slate-900 text-primary-600 rounded-2xl font-black text-lg hover:bg-primary-50 transition-all active:scale-95 shadow-2xl dark:text-white dark:hover:bg-slate-800 border border-transparent dark:border-slate-800">
                                Explore Upcoming Events
                            </Link>
                            <Link to="/register" className="px-12 py-5 bg-transparent border-2 border-white/30 text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all">
                                Join the Community
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social & Footer Section */}
            <footer className="container mx-auto px-6 py-20 border-t border-slate-100 dark:border-slate-800 mt-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-4 text-center md:text-left">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Digi<span className="text-primary-600 dark:text-primary-400">Flash.</span></h3>
                        <p className="text-slate-400 font-medium max-w-xs">The official Computer Science and Engineering Association.</p>
                    </div>

                    <div className="flex gap-4">
                        {[

                            { icon: Linkedin, href: 'https://www.linkedin.com/company/digiflash-cse/', label: 'LinkedIn' },
                            { icon: Instagram, href: 'https://www.instagram.com/digiflash_cse?igsh=MWpjemJueWgya2ZmaA==', label: 'Instagram' }
                        ].map((social, i) => (
                            <a
                                key={i}
                                href={social.href}
                                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-primary-600 dark:hover:bg-primary-500 hover:text-white transition-all duration-300 shadow-sm"
                                aria-label={social.label}
                            >
                                <social.icon className="w-5 h-5" />
                            </a>
                        ))}
                    </div>

                    <div className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                        © 2026 DigiFlash CSE Association. All Rights Reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
