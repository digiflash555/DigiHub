import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Calendar, MapPin, Clock, Users, ArrowRight, Share2, Shield, Info, Search, X, Handshake, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({});
    const [fileFields, setFileFields] = useState({});
    const [showRegForm, setShowRegForm] = useState(false);
    const [autoFilledFields, setAutoFilledFields] = useState(new Set());
    const [teamName, setTeamName] = useState('');
    const [teamMembers, setTeamMembers] = useState([]); // [{id, username}]
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [memberFormData, setMemberFormData] = useState({}); // { memberId: { label: value } }
    const [memberFileFields, setMemberFileFields] = useState({}); // { memberId: { label: File } }
    const [volunteerMotivation, setVolunteerMotivation] = useState('');
    const [isApplyingVolunteer, setIsApplyingVolunteer] = useState(false);
    const [volunteerApplied, setVolunteerApplied] = useState(false);
    const [settings, setSettings] = useState({ volunteerRestriction: 'upcoming_events_only' });

    const getProfileAutoFill = () => {
        if (!user) return {};
        const mapping = {};
        const add = (patterns, value) => {
            if (!value) return;
            patterns.forEach(p => { mapping[p] = value; });
        };
        add(['name', 'full name', 'username', 'participant name', 'your name', 'student name', 'candidate name'], user.username);
        add(['email', 'email address', 'email id', 'mail'], user.email);
        add(['phone', 'mobile', 'phone number', 'mobile number', 'contact number', 'contact'], user.phone);
        add(['reg no', 'registration no', 'registration number', 'roll no', 'roll number', 'student id', 'reg id', 'student reg', 'register no', 'academic id'], user.registrationNumber);
        add(['bio', 'about', 'description'], user.bio);
        add(['skills', 'technical skills', 'expertise'], user.skills?.join(', '));
        add(['dob', 'date of birth', 'birth date'], user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '');
        return mapping;
    };

    const openRegForm = () => {
        if (!user) { navigate('/login'); return; }
        
        // Auto-fill form fields from profile
        if (event?.registrationForm?.length > 0) {
            const profileMap = getProfileAutoFill();
            const prefilled = { ...formData };
            const filledKeys = new Set(autoFilledFields);

            event.registrationForm.forEach(field => {
                // Skip if already has a value
                if (prefilled[field.label]) return;

                const key = field.label.toLowerCase().trim();
                // Check direct matches and pattern matches
                for (const [pattern, value] of Object.entries(profileMap)) {
                    if (key.includes(pattern)) {
                        prefilled[field.label] = value;
                        filledKeys.add(field.label);
                        break;
                    }
                }
            });
            setFormData(prefilled);
            setAutoFilledFields(filledKeys);
        }
        setShowRegForm(true);
    };

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`/api/events/${id}`);
                setEvent(res.data);
            } catch (error) {
                toast.error('Event not found');
                navigate('/events');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvent();
        // Fetch settings for volunteer restriction
        axios.get(`/api/settings`).then(res => setSettings(res.data)).catch(() => {});
    }, [id]);

    const handleRegistration = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to register');
            navigate('/login');
            return;
        }

        setIsRegistering(true);
        try {
            const hasFiles = Object.keys(fileFields).length > 0;
            const finalPayload = {
                eventId: event._id,
                teamName: event.participationType === 'Team' ? teamName : '',
                teamMembers: teamMembers.map(m => m._id),
                formData,
                memberFormData // New: separate data for each member
            };

            if (hasFiles) {
                const payload = new FormData();
                payload.append('eventId', event._id);
                if (event.participationType === 'Team') {
                    payload.append('teamName', teamName);
                    payload.append('teamMembers', JSON.stringify(teamMembers.map(m => m._id)));
                }

                // Append formData
                Object.keys(formData).forEach(key => {
                    payload.append(`formData[${key}]`, formData[key]);
                });

                // Append memberFormData
                Object.keys(memberFormData).forEach(memberId => {
                    Object.keys(memberFormData[memberId]).forEach(fieldLabel => {
                        payload.append(`memberFormData[${memberId}][${fieldLabel}]`, memberFormData[memberId][fieldLabel]);
                    });
                });

                // Append leader files
                Object.keys(fileFields).forEach(key => {
                    payload.append('files', fileFields[key]);
                });

                // New: Append member files
                Object.keys(memberFileFields).forEach(memberId => {
                    Object.keys(memberFileFields[memberId]).forEach(fieldLabel => {
                        payload.append(`memberFiles_${memberId}_${fieldLabel}`, memberFileFields[memberId][fieldLabel]);
                    });
                });
                
                const res = await axios.post(`/api/registrations`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Registration successful!');
                setShowRegForm(false);
                navigate('/dashboard');
            } else {
                const res = await axios.post(`/api/registrations`, finalPayload);
                toast.success('Registration successful!');
                setShowRegForm(false);
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsRegistering(false);
        }
    };

    const applyAsVolunteer = async () => {
        if (!user) { navigate('/login'); return; }
        setIsApplyingVolunteer(true);
        try {
            await axios.post(`/api/volunteers/apply`, {
                eventId: event._id,
                role: 'Event Volunteer',
                motivation: volunteerMotivation
            });
            toast.success('Volunteer application submitted!');
            setVolunteerApplied(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Application failed');
        } finally {
            setIsApplyingVolunteer(false);
        }
    };

    const handleUserSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await axios.get(`/api/auth/search?q=${query}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const addMember = (member) => {
        if (teamMembers.some(m => m._id === member._id)) {
            toast.error('User already added');
            return;
        }
        if (teamMembers.length + 1 >= event.maxTeamSize) {
            toast.error(`Maximum team size is ${event.maxTeamSize}`);
            return;
        }

        // Auto-fill member's specific form fields
        const profileMap = {
            name: member.username,
            email: member.email,
            phone: member.phone,
            registrationNumber: member.registrationNumber,
            gender: member.gender,
            yearAndDept: member.yearAndDept,
            dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split('T')[0] : ''
        };

        const memberPrefilled = {};
        const patterns = {
            name: ['name', 'full name', 'username', 'participant name', 'your name', 'student name'],
            email: ['email', 'email address', 'email id', 'mail'],
            phone: ['phone', 'mobile', 'phone number', 'mobile number', 'contact number'],
            registrationNumber: ['reg no', 'registration no', 'registration number', 'roll no', 'roll number', 'student id', 'reg id'],
            gender: ['gender', 'sex'],
            yearAndDept: ['year', 'department', 'class', 'branch'],
            dateOfBirth: ['dob', 'date of birth', 'birth date']
        };

        event.registrationForm.forEach(field => {
            if (field.label.toLowerCase().includes('team name')) return;
            const label = field.label.toLowerCase().trim();
            for (const [key, searchTerms] of Object.entries(patterns)) {
                if (searchTerms.some(term => label.includes(term))) {
                    if (profileMap[key]) memberPrefilled[field.label] = profileMap[key];
                    break;
                }
            }
        });

        setMemberFormData({ ...memberFormData, [member._id]: memberPrefilled });
        setTeamMembers([...teamMembers, member]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeMember = (userId) => {
        setTeamMembers(teamMembers.filter(m => m._id !== userId));
    };

    if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    if (!event) return null;

    const registrationDeadlinePassed = new Date() > new Date(event.registrationDeadline);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-[#20242B] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 dark:text-white"
                    >
                        <div className="h-80 relative">
                            <img 
                                src={getImageUrl(event.bannerImage, 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')} 
                                className="w-full h-full object-cover"
                                alt={event.title}
                            />
                            <div className="absolute top-6 left-6 flex gap-2">
                                <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold text-primary-700 shadow-lg dark:text-white">
                                    {event.category}
                                </span>
                                <span className={`bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${ event.status === 'Open' ? 'text-emerald-600' : 'text-red-600' } dark:text-white`}>
                                    {event.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-8">
                            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">{event.title}</h1>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                                        <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        {new Date(event.eventDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Time</p>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                                        <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        {event.startTime} - {event.endTime}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Venue</p>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                                        <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        {event.venue}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Type</p>
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                                        <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        {event.participationType}
                                    </div>
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                                <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-4">About the Event</h3>
                                {event.description}
                            </div>

                            {/* Coordinators Section */}
                            {(event.facultyCoordinator || event.studentCoordinator) && user && (
                                ['Admin', 'Program Coordinator', 'Class Coordinator', 'Faculty', 'Association Member'].includes(user.role) ||
                                (event.facultyCoordinator && event.facultyCoordinator._id === user._id) ||
                                (event.studentCoordinator && event.studentCoordinator._id === user._id)
                            ) && (
                                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                                    <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-4">Event Coordinators</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {event.facultyCoordinator && (
                                            <div className="p-4 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Faculty Coordinator</p>
                                                <p className="font-extrabold text-slate-800 dark:text-slate-100">{event.facultyCoordinator.username}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{event.facultyCoordinator.email}</p>
                                                {event.facultyCoordinator.phone && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ph: {event.facultyCoordinator.phone}</p>
                                                )}
                                            </div>
                                        )}
                                        {event.studentCoordinator && (
                                            <div className="p-4 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Student Coordinator</p>
                                                <p className="font-extrabold text-slate-800 dark:text-slate-100">{event.studentCoordinator.username}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{event.studentCoordinator.email}</p>
                                                {event.studentCoordinator.phone && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Ph: {event.studentCoordinator.phone}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Registration Section */}
                    {showRegForm && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-[#20242B] p-8 rounded-3xl shadow-xl border border-primary-100 dark:border-primary-500/20 dark:text-white"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Registration</h2>
                                {autoFilledFields.size > 0 && (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        {autoFilledFields.size} fields pre-filled from your profile
                                    </span>
                                )}
                            </div>

                            {/* Profile completion hint */}
                            {user && (!user.phone || !user.registrationNumber) && (
                                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl flex gap-3">
                                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-800">Complete your profile for faster registration!</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Add your phone and registration number in <a href="/profile" className="underline font-bold">Profile Settings</a> to auto-fill future forms.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleRegistration} className="space-y-10">
                                <div>
                                    <h4 className="text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center text-xs">1</div>
                                        Your Details (Leader)
                                    </h4>
                                    <div className="space-y-6">
                                        {event.registrationForm.map((field, i) => (
                                            <div key={i}>
                                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                                    {autoFilledFields.has(field.label) && (
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">Auto-filled</span>
                                                    )}
                                                </label>
                                                {field.type === 'textarea' ? (
                                                    <textarea
                                                        required={field.required}
                                                        className={`input-field h-24 ${autoFilledFields.has(field.label) ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-500/30 dark:bg-emerald-500/10' : ''}`}
                                                        placeholder={field.placeholder}
                                                        value={formData[field.label] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData({...formData, [field.label]: val});
                                                            if (field.label.toLowerCase().includes('team name')) setTeamName(val);
                                                        }}
                                                    />
                                                ) : field.type === 'dropdown' ? (
                                                    <select
                                                        required={field.required}
                                                        className={`input-field ${autoFilledFields.has(field.label) ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-500/30 dark:bg-emerald-500/10' : ''}`}
                                                        value={formData[field.label] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData({...formData, [field.label]: val});
                                                            if (field.label.toLowerCase().includes('team name')) setTeamName(val);
                                                        }}
                                                    >
                                                        <option value="">Select option</option>
                                                        {field.options && field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : field.type === 'radio' ? (
                                                    <div className="space-y-2">
                                                        {field.options && field.options.map(opt => (
                                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name={`leader_${field.label}`}
                                                                    value={opt}
                                                                    checked={formData[field.label] === opt}
                                                                    required={field.required}
                                                                    onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                                                    className="w-4 h-4 text-primary-600 dark:text-primary-400"
                                                                />
                                                                <span>{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : field.type === 'checkbox' ? (
                                                    <div className="space-y-2">
                                                        {field.options && field.options.map(opt => (
                                                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    name={`leader_${field.label}`}
                                                                    value={opt}
                                                                    checked={(formData[field.label] || []).includes(opt)}
                                                                    onChange={(e) => {
                                                                        const currentValues = formData[field.label] || [];
                                                                        if (e.target.checked) {
                                                                            setFormData({...formData, [field.label]: [...currentValues, opt]});
                                                                        } else {
                                                                            setFormData({...formData, [field.label]: currentValues.filter(v => v !== opt)});
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 text-primary-600 dark:text-primary-400 rounded"
                                                                />
                                                                <span>{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : field.type === 'file' ? (
                                                    <input
                                                        type="file"
                                                        required={field.required}
                                                        className="input-field"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setFileFields({ ...fileFields, [field.label]: file });
                                                                setFormData({ ...formData, [field.label]: file.name });
                                                            }
                                                        }}
                                                    />
                                                ) : field.type === 'number' ? (
                                                    <input
                                                        type="number"
                                                        required={field.required}
                                                        className={`input-field ${autoFilledFields.has(field.label) ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-500/30 dark:bg-emerald-500/10' : ''}`}
                                                        placeholder={field.placeholder}
                                                        value={formData[field.label] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData({...formData, [field.label]: val});
                                                            if (field.label.toLowerCase().includes('team name')) setTeamName(val);
                                                        }}
                                                    />
                                                ) : field.type === 'date' ? (
                                                    <input
                                                        type="date"
                                                        required={field.required}
                                                        className={`input-field ${autoFilledFields.has(field.label) ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-500/30 dark:bg-emerald-500/10' : ''}`}
                                                        value={formData[field.label] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData({...formData, [field.label]: val});
                                                            if (field.label.toLowerCase().includes('team name')) setTeamName(val);
                                                        }}
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        required={field.required}
                                                        className={`input-field ${autoFilledFields.has(field.label) ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-500/30 dark:bg-emerald-500/10' : ''}`}
                                                        placeholder={field.placeholder}
                                                        value={formData[field.label] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFormData({...formData, [field.label]: val});
                                                            if (field.label.toLowerCase().includes('team name')) setTeamName(val);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {event.participationType === 'Team' && teamMembers.map((member, mIdx) => (
                                    <motion.div 
                                        key={member._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="pt-6 border-t border-gray-100"
                                    >
                                        <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">{mIdx + 2}</div>
                                            Member Details: {member.username}
                                        </h4>
                                        <div className="space-y-6">
                                            {event.registrationForm.map((field, i) => {
                                                if (field.label.toLowerCase().includes('team name')) return null;
                                                return (
                                                    <div key={i}>
                                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                                        </label>
                                                        {field.type === 'textarea' ? (
                                                            <textarea
                                                                required={field.required}
                                                                className="input-field h-24"
                                                                placeholder={field.placeholder}
                                                                value={memberFormData[member._id]?.[field.label] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setMemberFormData({
                                                                        ...memberFormData,
                                                                        [member._id]: { ...(memberFormData[member._id] || {}), [field.label]: val }
                                                                    });
                                                                }}
                                                            />
                                                        ) : field.type === 'dropdown' ? (
                                                            <select
                                                                required={field.required}
                                                                className="input-field"
                                                                value={memberFormData[member._id]?.[field.label] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setMemberFormData({
                                                                        ...memberFormData,
                                                                        [member._id]: { ...(memberFormData[member._id] || {}), [field.label]: val }
                                                                    });
                                                                }}
                                                            >
                                                                <option value="">Select option</option>
                                                                {field.options && field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                        ) : field.type === 'radio' ? (
                                                            <div className="space-y-2">
                                                                {field.options && field.options.map(opt => (
                                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name={`member_${member._id}_${field.label}`}
                                                                            value={opt}
                                                                            checked={memberFormData[member._id]?.[field.label] === opt}
                                                                            required={field.required}
                                                                            onChange={(e) => {
                                                                                setMemberFormData({
                                                                                    ...memberFormData,
                                                                                    [member._id]: { ...(memberFormData[member._id] || {}), [field.label]: e.target.value }
                                                                                });
                                                                            }}
                                                                            className="w-4 h-4 text-primary-600 dark:text-primary-400"
                                                                        />
                                                                        <span>{opt}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : field.type === 'checkbox' ? (
                                                            <div className="space-y-2">
                                                                {field.options && field.options.map(opt => (
                                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            name={`member_${member._id}_${field.label}`}
                                                                            value={opt}
                                                                            checked={(memberFormData[member._id]?.[field.label] || []).includes(opt)}
                                                                            onChange={(e) => {
                                                                                const currentValues = memberFormData[member._id]?.[field.label] || [];
                                                                                let nextValues;
                                                                                if (e.target.checked) {
                                                                                    nextValues = [...currentValues, opt];
                                                                                } else {
                                                                                    nextValues = currentValues.filter(v => v !== opt);
                                                                                }
                                                                                setMemberFormData({
                                                                                    ...memberFormData,
                                                                                    [member._id]: { ...(memberFormData[member._id] || {}), [field.label]: nextValues }
                                                                                });
                                                                            }}
                                                                            className="w-4 h-4 text-primary-600 dark:text-primary-400 rounded"
                                                                        />
                                                                        <span>{opt}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : field.type === 'file' ? (
                                                            <input
                                                                type="file"
                                                                required={field.required}
                                                                className="input-field"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setMemberFileFields({
                                                                            ...memberFileFields,
                                                                            [member._id]: { ...(memberFileFields[member._id] || {}), [field.label]: file }
                                                                        });
                                                                        setMemberFormData({
                                                                            ...memberFormData,
                                                                            [member._id]: { ...(memberFormData[member._id] || {}), [field.label]: file.name }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        ) : field.type === 'number' ? (
                                                            <input
                                                                type="number"
                                                                required={field.required}
                                                                className="input-field"
                                                                placeholder={field.placeholder}
                                                                value={memberFormData[member._id]?.[field.label] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setMemberFormData({
                                                                        ...memberFormData,
                                                                        [member._id]: { ...(memberFormData[member._id] || {}), [field.label]: val }
                                                                    });
                                                                }}
                                                            />
                                                        ) : field.type === 'date' ? (
                                                            <input
                                                                type="date"
                                                                required={field.required}
                                                                className="input-field"
                                                                value={memberFormData[member._id]?.[field.label] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setMemberFormData({
                                                                        ...memberFormData,
                                                                        [member._id]: { ...(memberFormData[member._id] || {}), [field.label]: val }
                                                                    });
                                                                }}
                                                            />
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                required={field.required}
                                                                className="input-field"
                                                                placeholder={field.placeholder}
                                                                value={memberFormData[member._id]?.[field.label] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setMemberFormData({
                                                                        ...memberFormData,
                                                                        [member._id]: { ...(memberFormData[member._id] || {}), [field.label]: val }
                                                                    });
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                ))}

                                {event.participationType === 'Team' && (
                                    <div className="p-6 bg-primary-50 dark:bg-primary-500/10 rounded-2xl border border-primary-100 dark:border-primary-500/20 space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-xl font-bold text-primary-900">Team Details</h3>
                                        </div>

                                        {!event.registrationForm.some(f => f.label.toLowerCase().includes('team name')) && (
                                            <div className="space-y-4">
                                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    Team Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="input-field"
                                                    placeholder="Enter your team name"
                                                    value={teamName}
                                                    onChange={(e) => setTeamName(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                Add Team Members ({teamMembers.length + 1}/{event.maxTeamSize})
                                            </label>
                                            
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        className="input-field pl-9"
                                                        placeholder="Search by username or email..."
                                                        value={searchQuery}
                                                        onChange={(e) => handleUserSearch(e.target.value)}
                                                    />
                                                    
                                                    <AnimatePresence>
                                                        {searchResults.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#20242B] border rounded-xl shadow-xl max-h-48 overflow-y-auto dark:text-white"
                                                            >
                                                                {searchResults.map(u => (
                                                                    <div 
                                                                        key={u._id}
                                                                        className="p-3 hover:bg-gray-50 flex justify-between items-center cursor-pointer border-b last:border-0"
                                                                        onClick={() => addMember(u)}
                                                                    >
                                                                        <div>
                                                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{u.username}</p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                                                                        </div>
                                                                        <button type="button" className="text-primary-600 dark:text-primary-400 font-bold text-xs">Add</button>
                                                                    </div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Members Chip List */}
                                            <div className="flex flex-wrap gap-2">
                                                <div className="px-3 py-1.5 bg-white dark:bg-[#20242B] border border-primary-200 dark:border-primary-500/30 rounded-full text-sm font-bold text-primary-700 flex items-center gap-1 dark:text-white">
                                                    {user?.username} <span className="text-[10px] bg-primary-100 px-1.5 py-0.5 rounded text-primary-600 dark:text-primary-400">Leader</span>
                                                </div>
                                                {teamMembers.map(m => (
                                                    <div key={m._id} className="px-3 py-1.5 bg-white dark:bg-[#20242B] border border-gray-200 dark:border-gray-700 rounded-full text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 group">
                                                        {m.username}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeMember(m._id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {teamMembers.length + 1 < event.minTeamSize && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                    At least {event.minTeamSize - (teamMembers.length + 1)} more member(s) required.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowRegForm(false)}
                                        className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-bold dark:text-white"
                                    >
                                        Go Back
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isRegistering}
                                        className="flex-[2] btn-primary py-3 flex items-center justify-center gap-2 font-bold text-lg"
                                    >
                                        {isRegistering ? 'Processing...' : 'Confirm Registration'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#20242B] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 sticky top-24 dark:text-white">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm font-bold text-gray-400 uppercase">Registration</p>
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded text-xs font-bold">
                                <Info className="w-3 h-3" /> Still Open
                            </div>
                        </div>

                        {!showRegForm && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Fee</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Deadline</span>
                                        <span className="text-red-500 font-bold">{new Date(event.registrationDeadline).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {['Class Coordinator', 'Program Coordinator', 'Admin', 'Faculty', 'Faculty Coordinator'].includes(user?.role) ? (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 rounded-2xl text-center text-sm font-bold">
                                        Coordinators and Administrators cannot register for events.
                                    </div>
                                ) : registrationDeadlinePassed ? (
                                    <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 rounded-2xl text-center text-sm font-bold">
                                        Registration Closed: Deadline Exceeded
                                    </div>
                                ) : event.status !== 'Open' ? (
                                    <div className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl text-center text-sm font-bold">
                                        Registration is not currently live
                                    </div>
                                ) : (!event.registrationForm || event.registrationForm.length === 0) && event.participationType !== 'Team' ? (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-2xl text-center text-sm font-bold">
                                        Registration form not available yet
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => openRegForm()}
                                        className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-bold text-lg rounded-2xl"
                                    >
                                        Register Now <ArrowRight className="w-5 h-5" />
                                    </button>
                                )}

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Trust & Security</p>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <Shield className="w-5 h-5 text-primary-500" />
                                            <span>Secure QR Verification</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <Shield className="w-5 h-5 text-primary-500" />
                                            <span>Institutional Certification</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                        {/* Volunteer Apply Section for Association Members */}
                        {user?.role === 'Association Member' && !showRegForm &&
                         event.status !== 'Completed' && event.status !== 'Closed' &&
                         (settings.volunteerRestriction === 'all' || new Date() < new Date(event.eventDate)) && (
                            <div className="bg-white dark:bg-[#20242B] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mt-6 dark:text-white">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Handshake className="w-4 h-4 text-indigo-500" /> Volunteer for this Event
                                </p>
                                {volunteerApplied ? (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-2xl text-center text-sm font-bold border border-emerald-100 dark:border-emerald-500/20">
                                        ✓ Application Submitted — Awaiting Admin Approval
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <textarea
                                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d24] rounded-2xl p-4 text-sm font-medium text-gray-700 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/50 h-24"
                                            placeholder="Why do you want to volunteer for this event? (optional)"
                                            value={volunteerMotivation}
                                            onChange={e => setVolunteerMotivation(e.target.value)}
                                        />
                                        <button
                                            onClick={applyAsVolunteer}
                                            disabled={isApplyingVolunteer}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
                                        >
                                            {isApplyingVolunteer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                                            Apply as Volunteer
                                        </button>
                                        <p className="text-[10px] text-slate-400 font-medium text-center">
                                            Approved applications allow admin to issue On-Duty letters
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
