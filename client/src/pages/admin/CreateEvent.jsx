import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, Briefcase, Users, Layout, ArrowLeft, ChevronRight, Sparkles, Save, Eye, Settings, UserCheck, Lock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConfirm } from '../../contexts/ConfirmContext';


const CreateEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { confirm } = useConfirm();
    const [isLoading, setIsLoading] = useState(false);
    const [facultySearch, setFacultySearch] = useState('');
    const [facultyResults, setFacultyResults] = useState([]);
    const [isSearchingFaculty, setIsSearchingFaculty] = useState(false);
    const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);

    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [isSearchingStudent, setIsSearchingStudent] = useState(false);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);

    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        venue: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        registrationDeadline: '',
        maxParticipants: 100,
        category: 'Workshop',
        participationType: 'Individual',
        registrationRestrictionMode: 'Open to All Students',
        allocations: [],
        minTeamSize: 1,
        maxTeamSize: 1,
        status: 'Draft',
        registrationForm: [],
        feedbackForm: [],
        bannerImage: '',
        facultyCoordinator: '',
        studentCoordinator: '',
        isRegistrationOpen: true
    });
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState('');
    const [feedbackTemplates, setFeedbackTemplates] = useState([]);
    const [regTemplates, setRegTemplates] = useState([]);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [newTemplateDetails, setNewTemplateDetails] = useState({
        templateName: '',
        description: '',
        category: 'Workshop'
    });
    const [defaultAllocationLimit, setDefaultAllocationLimit] = useState(10);

    const handleDateChange = (date) => {
        if (eventData.registrationDeadline && date) {
            if (new Date(eventData.registrationDeadline) > new Date(date)) {
                toast.error('Event date cannot be earlier than registration deadline');
                return;
            }
        }
        if (eventData.startTime && eventData.endTime && date) {
            if (new Date(`${date}T${eventData.startTime}`) >= new Date(`${date}T${eventData.endTime}`)) {
                toast.error('Start time must be strictly earlier than End time on this date');
                return;
            }
        }
        setEventData({ ...eventData, eventDate: date });
    };

    const handleStartTimeChange = (time) => {
        if (eventData.eventDate && eventData.endTime && time) {
            if (new Date(`${eventData.eventDate}T${time}`) >= new Date(`${eventData.eventDate}T${eventData.endTime}`)) {
                toast.error('Start time must be strictly earlier than End time');
                return;
            }
        }
        setEventData({ ...eventData, startTime: time });
    };

    const handleEndTimeChange = (time) => {
        if (eventData.eventDate && eventData.startTime && time) {
            if (new Date(`${eventData.eventDate}T${eventData.startTime}`) >= new Date(`${eventData.eventDate}T${time}`)) {
                toast.error('End time must be strictly after Start time');
                return;
            }
        }
        setEventData({ ...eventData, endTime: time });
    };

    const handleRegDeadlineChange = (date) => {
        if (eventData.eventDate && date) {
            if (new Date(date) > new Date(eventData.eventDate)) {
                toast.error('Registration deadline cannot be set after the event date');
                return;
            }
        }
        setEventData({ ...eventData, registrationDeadline: date });
    };

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const [fbRes, regRes] = await Promise.all([
                    axios.get(`/api/feedback-templates`),
                    axios.get(`/api/templates`)
                ]);
                setFeedbackTemplates(fbRes.data);
                setRegTemplates(regRes.data);
            } catch (error) {
                console.error('Failed to load templates', error);
            }
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (id) {
            const fetchEvent = async () => {
                try {
                    const res = await axios.get(`/api/events/${id}`);
                    const data = res.data;
                    // Format dates for input fields
                    data.eventDate = data.eventDate.split('T')[0];
                    data.registrationDeadline = data.registrationDeadline.split('T')[0];
                    setEventData({
                        ...data,
                        facultyCoordinator: data.facultyCoordinator?._id || data.facultyCoordinator || '',
                        studentCoordinator: data.studentCoordinator?._id || data.studentCoordinator || '',
                    });
                    if (data.facultyCoordinator?.username) {
                        setFacultySearch(data.facultyCoordinator.username);
                    }
                    if (data.studentCoordinator?.username) {
                        setStudentSearch(data.studentCoordinator.username);
                    }
                    if (data.bannerImage) {
                        setBannerPreview(getImageUrl(data.bannerImage));
                    }
                } catch (error) {
                    toast.error('Failed to load event');
                }
            };
            fetchEvent();
        }
    }, [id]);

    const handleFacultySearch = async (query) => {
        setFacultySearch(query);
        if (query.trim().length < 2) {
            setFacultyResults([]);
            setShowFacultyDropdown(false);
            return;
        }

        setIsSearchingFaculty(true);
        setShowFacultyDropdown(true);
        try {
            const res = await axios.get(`/api/auth/search?q=${query}&role=Faculty,Faculty Coordinator`);
            setFacultyResults(res.data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearchingFaculty(false);
        }
    };

    const handleStudentSearch = async (query) => {
        setStudentSearch(query);
        if (query.trim().length < 2) {
            setStudentResults([]);
            setShowStudentDropdown(false);
            return;
        }

        setIsSearchingStudent(true);
        setShowStudentDropdown(true);
        try {
            const res = await axios.get(`/api/auth/search?q=${query}&role=Association Member,Student Coordinator`);
            setStudentResults(res.data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearchingStudent(false);
        }
    };

    const addFormField = () => {
        setEventData({
            ...eventData,
            registrationForm: [
                ...eventData.registrationForm,
                { label: '', type: 'text', required: false, options: [] }
            ]
        });
    };

    const removeFormField = (index) => {
        const newForm = [...eventData.registrationForm];
        newForm.splice(index, 1);
        setEventData({ ...eventData, registrationForm: newForm });
    };

    const updateField = (index, key, value) => {
        const newForm = [...eventData.registrationForm];
        newForm[index][key] = value;
        setEventData({ ...eventData, registrationForm: newForm });
    };

    const addFeedbackField = () => {
        setEventData({
            ...eventData,
            feedbackForm: [
                ...eventData.feedbackForm,
                { label: '', type: 'text', required: false, options: [] }
            ]
        });
    };

    const removeFeedbackField = (index) => {
        const newForm = [...eventData.feedbackForm];
        newForm.splice(index, 1);
        setEventData({ ...eventData, feedbackForm: newForm });
    };

    const updateFeedbackField = (index, key, value) => {
        const newForm = [...eventData.feedbackForm];
        newForm[index][key] = value;
        setEventData({ ...eventData, feedbackForm: newForm });
    };

    const handleSaveAsTemplate = async () => {
        if (!newTemplateDetails.templateName.trim()) {
            return toast.error('Template name is required');
        }
        try {
            const payload = {
                templateName: newTemplateDetails.templateName,
                description: newTemplateDetails.description,
                category: newTemplateDetails.category,
                fields: eventData.registrationForm.map(f => {
                    const { _id, ...rest } = f;
                    return {
                        ...rest,
                        fieldId: f.fieldId || `field_${Math.random().toString(36).substring(2, 9)}`
                    };
                })
            };

            await axios.post('/api/templates', payload);
            toast.success('Registration template saved successfully!');
            setShowSaveTemplateModal(false);

            // Reload templates list
            const res = await axios.get(`/api/templates`);
            setRegTemplates(res.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save template');
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Date and Time Validation
        if (eventData.eventDate && eventData.startTime && eventData.endTime) {
            const startDateTime = new Date(`${eventData.eventDate}T${eventData.startTime}`);
            const endDateTime = new Date(`${eventData.eventDate}T${eventData.endTime}`);
            if (startDateTime >= endDateTime) {
                return toast.error('Start time must be before end time');
            }
        }
        
        if (eventData.registrationDeadline && eventData.eventDate) {
            const regDate = new Date(eventData.registrationDeadline);
            const evtDate = new Date(eventData.eventDate);
            if (regDate > evtDate) {
                return toast.error('Registration deadline cannot be after the event date');
            }
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            const allowedKeys = [
                'title', 'description', 'venue', 'eventDate', 'startTime', 'endTime',
                'registrationDeadline', 'maxParticipants', 'category', 'participationType',
                'registrationRestrictionMode', 'minTeamSize', 'maxTeamSize', 'status', 'isRegistrationOpen', 'facultyCoordinator', 'studentCoordinator'
            ];

            allowedKeys.forEach(key => {
                if ((key === 'facultyCoordinator' || key === 'studentCoordinator') && !eventData[key]) {
                    // Skip empty coordinator fields so backend doesn't fail on casting empty string to ObjectId
                    return;
                }
                if (eventData[key] !== undefined && eventData[key] !== null) {
                    formData.append(key, eventData[key]);
                }
            });
            formData.append('registrationForm', JSON.stringify(eventData.registrationForm));
            formData.append('feedbackForm', JSON.stringify(eventData.feedbackForm));
            formData.append('allocations', JSON.stringify(eventData.allocations || []));

            if (bannerFile) {
                formData.append('bannerImage', bannerFile);
            }

            if (id) {
                await axios.put(`/api/events/${id}`, formData);
                toast.success('Event updated successfully');
            } else {
                await axios.post(`/api/events`, formData);
                toast.success('Event created successfully');
            }
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-[95%] 2xl:max-w-[1600px] mx-auto space-y-8 pb-20 px-4">
            {/* Premium Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <Link to="/admin" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">{id ? 'Edit Mode' : 'Create Mode'}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{id ? 'Edit Event' : 'Create New Event'}</h1>
                            <p className="text-indigo-200/80 text-sm mt-1 font-medium">Configure all event details and publish when ready</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/admin')} className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold text-sm transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-7 py-3 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-indigo-900/30 disabled:opacity-60"
                        >
                            {isLoading ? (
                                <><div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />Saving...</>
                            ) : (
                                <><Save className="w-4 h-4" />{id ? 'Update Event' : 'Publish Event'}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: General Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Section 1: General Info */}
                    <section className="glass rounded-[2rem] overflow-hidden dark:text-white">
                        <div className="flex items-center gap-4 px-8 py-6 bg-gradient-to-r from-primary-500/5 to-indigo-500/5 border-b border-slate-100 dark:border-[#2D3340]">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20">1</div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">General Information</h2>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Event title, description, category and media</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Event Title <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                className="input-premium py-3 px-5 text-lg font-bold"
                                placeholder="e.g. Annual Tech Symposium 2025"
                                value={eventData.title}
                                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Description <span className="text-red-400">*</span></label>
                            <textarea
                                className="input-premium py-3 px-5 h-36 resize-none"
                                placeholder="Write a compelling description of your event..."
                                value={eventData.description}
                                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Banner Image</label>
                            <div className="space-y-3">
                                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/5 transition-all p-6 group">
                                    <ImageIcon className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                                    <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600">Click to upload banner</span>
                                    <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                                {bannerPreview && (
                                    <div className="relative rounded-2xl overflow-hidden shadow-md">
                                        <img src={bannerPreview} alt="Banner preview" className="w-full h-52 object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                            <span className="text-white text-xs font-bold bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">Preview</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                <select
                                    className="input-premium py-3 px-5"
                                    value={eventData.category}
                                    onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                                >
                                    <option>Workshop</option>
                                    <option>Hackathon</option>
                                    <option>Conference</option>
                                    <option>Seminar</option>
                                    <option>Competition</option>
                                    <option>Guest Lecture</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Venue</label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                                    <input
                                        type="text"
                                        className="input-premium py-3 pl-11 pr-5"
                                        placeholder="Auditorium 1"
                                        value={eventData.venue}
                                        onChange={(e) => setEventData({ ...eventData, venue: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        </div>
                    </section>

                    {/* Section 2: Registration Form Builder */}
                    <section className="glass rounded-[2rem] overflow-hidden dark:text-white">
                        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-b border-slate-100 dark:border-[#2D3340] flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/20">2</div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Registration Form</h2>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Fields participants fill when registering</p>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    className="text-xs bg-emerald-55 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2 font-black outline-none cursor-pointer"
                                    onChange={async (e) => {
                                        if (!e.target.value) return;
                                        const template = regTemplates.find(t => t._id === e.target.value);
                                        const confirmed = await confirm('This will replace your current registration fields. Continue?');
                                        if (template && confirmed) {
                                            setEventData({
                                                ...eventData,
                                                registrationForm: template.fields.map(f => {
                                                    const { _id, ...rest } = f;
                                                    return {
                                                        ...rest,
                                                        fieldId: f.fieldId || `field_${Math.random().toString(36).substring(2, 9)}`
                                                    };
                                                })
                                            });
                                            toast.success('Registration template imported!');
                                        }
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Import Template...</option>
                                    {regTemplates.filter(t => t.status === 'Active').map(t => (
                                        <option key={t._id} value={t._id}>{t.templateName}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (eventData.registrationForm.length === 0) {
                                            return toast.error('Add at least one field to save as a template');
                                        }
                                        setNewTemplateDetails({
                                            templateName: `${eventData.title || 'Event'} Template`,
                                            description: `Template based on ${eventData.title || 'current event'}.`,
                                            category: eventData.category || 'Workshop'
                                        });
                                        setShowSaveTemplateModal(true);
                                    }}
                                    className="text-xs font-black text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-4 py-2 rounded-xl transition-all"
                                >
                                    Save As Template
                                </button>
                                <select
                                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold outline-none cursor-pointer dark:text-white"
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const templates = {
                                            name: { label: 'Full Name', type: 'text', required: true },
                                            email: { label: 'Email', type: 'text', required: true },
                                            phone: { label: 'Phone Number', type: 'text', required: true },
                                            reg: { label: 'Registration Number', type: 'text', required: true },
                                            team: { label: 'Team Name', type: 'text', required: true },
                                            dep: { label: 'Department', type: 'dropdown', required: true, options: ['CS', 'EE', 'ME', 'CE'] },
                                        };
                                        const template = templates[e.target.value];
                                        setEventData({
                                            ...eventData,
                                            registrationForm: [...eventData.registrationForm, {
                                                ...template,
                                                fieldId: `field_${Math.random().toString(36).substring(2, 9)}`
                                            }]
                                        });
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Quick Add...</option>
                                    <option value="name">Full Name</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone Number</option>
                                    <option value="reg">Registration Number</option>
                                    <option value="team">Team Name</option>
                                    <option value="dep">Department Dropdown</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={addFormField}
                                    className="bg-primary-600 text-white hover:bg-primary-700 text-xs font-black flex items-center gap-1 px-4 py-2 rounded-xl transition-all shadow-md shadow-primary-500/10"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Field
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            {eventData.registrationForm.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-medium">
                                    No custom fields added yet. Add one or load a template above!
                                </div>
                            ) : (
                                eventData.registrationForm.map((field, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4"
                                    >
                                        <div className="grid md:grid-cols-3 gap-4 items-center">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Field Label</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. T-Shirt Size"
                                                    className="input-premium py-2.5 px-4 text-sm"
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, 'label', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Field Type</label>
                                                <select
                                                    className="input-premium py-2.5 px-4 text-sm"
                                                    value={field.type}
                                                    onChange={(e) => updateField(index, 'type', e.target.value)}
                                                >
                                                    <option value="text">Text Input</option>
                                                    <option value="textarea">Text Area</option>
                                                    <option value="email">Email</option>
                                                    <option value="phone">Phone Number</option>
                                                    <option value="number">Number</option>
                                                    <option value="date">Date</option>
                                                    <option value="time">Time</option>
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="multiselect">Multi-select</option>
                                                    <option value="radio">Radio Group</option>
                                                    <option value="checkbox">Checkbox</option>
                                                    <option value="file">File Upload</option>
                                                    <option value="image">Image Upload</option>
                                                    <option value="url">URL</option>
                                                    <option value="password">Password</option>
                                                    <option value="department">Department</option>
                                                    <option value="year">Year</option>
                                                    <option value="section">Section</option>
                                                    <option value="gender">Gender</option>
                                                    <option value="collegeName">College Name</option>
                                                    <option value="rollNumber">Roll Number</option>
                                                    <option value="studentId">Student ID</option>
                                                    <option value="teamName">Team Name</option>
                                                    <option value="teamSize">Team Size</option>
                                                    <option value="skills">Skills</option>
                                                    <option value="address">Address</option>
                                                    <option value="emergencyContact">Emergency Contact</option>
                                                    <option value="customField">Custom Field</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between pt-5 md:pt-0">
                                                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-[#1a1d24] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-650 dark:text-slate-300">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-indigo-650 rounded"
                                                        checked={field.required}
                                                        onChange={(e) => updateField(index, 'required', e.target.checked)}
                                                    />
                                                    Required
                                                </label>
                                                <button type="button" onClick={() => removeFormField(index)} className="p-2.5 text-red-500 hover:text-red-750 bg-red-50 dark:bg-red-500/10 rounded-xl hover:scale-105 transition-all">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </div>
                                        {['dropdown', 'radio', 'checkbox', 'multiselect', 'department', 'year', 'section', 'gender'].includes(field.type) && (
                                            <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                                <label className="block text-xs font-black text-indigo-700 dark:text-indigo-400 mb-2 uppercase tracking-wide">
                                                    Options (comma-separated)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. S, M, L, XL"
                                                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-[#1a1d24] border border-indigo-200 dark:border-indigo-500/20 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                                    value={field.options ? field.options.join(', ') : ''}
                                                    onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                                />
                                                <p className="text-[10px] text-indigo-500 font-bold mt-1">
                                                    Separate choices using commas.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Section 3: Feedback Form Builder */}
                    <section className="glass rounded-[2rem] overflow-hidden dark:text-white">
                        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-rose-500/5 to-orange-500/5 border-b border-slate-100 dark:border-[#2D3340] flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-rose-500/20">3</div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Feedback Form</h2>
                                    <p className="text-xs text-rose-500 dark:text-rose-450 font-bold">Collect post-event feedback from participants</p>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    className="text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-2 font-black outline-none cursor-pointer"
                                    onChange={async (e) => {
                                        if (!e.target.value) return;
                                        const template = feedbackTemplates.find(t => t._id === e.target.value);
                                        const confirmed = await confirm('This will replace your current feedback fields. Continue?');
                                        if (template && confirmed) {
                                            setEventData({
                                                ...eventData,
                                                feedbackForm: template.fields.map(f => {
                                                    const { _id, ...rest } = f;
                                                    return rest; // remove mongoose _id so new fields are created
                                                })
                                            });
                                        }
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Load Template...</option>
                                    {feedbackTemplates.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                                <select
                                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold outline-none cursor-pointer dark:text-white"
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const templates = {
                                            rating: { label: 'Overall Rating', type: 'number', required: true },
                                            experience: { label: 'How was your experience?', type: 'textarea', required: true },
                                            source: { label: 'How did you hear about us?', type: 'dropdown', required: false, options: ['Social Media', 'Friends', 'Email', 'Other'] },
                                            improve: { label: 'What can we improve?', type: 'textarea', required: false },
                                            recommend: { label: 'Would you recommend us?', type: 'dropdown', required: true, options: ['Definitely', 'Maybe', 'No'] },
                                        };
                                        const template = templates[e.target.value];
                                        setEventData({
                                            ...eventData,
                                            feedbackForm: [...eventData.feedbackForm, template]
                                        });
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Quick Add...</option>
                                    <option value="rating">Overall Rating</option>
                                    <option value="experience">Experience Textarea</option>
                                    <option value="source">Source Dropdown</option>
                                    <option value="recommend">Recommend Select</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={addFeedbackField}
                                    className="bg-primary-600 text-white hover:bg-primary-700 text-xs font-black flex items-center gap-1 px-4 py-2 rounded-xl transition-all shadow-md shadow-primary-500/10"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Field
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            {eventData.feedbackForm?.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-medium">
                                    No feedback fields added yet. Add one or load a template above!
                                </div>
                            ) : (
                                (eventData.feedbackForm || []).map((field, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4"
                                    >
                                        <div className="grid md:grid-cols-3 gap-4 items-center">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Field Label</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. How would you rate the venue?"
                                                    className="input-premium py-2.5 px-4 text-sm"
                                                    value={field.label}
                                                    onChange={(e) => updateFeedbackField(index, 'label', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Field Type</label>
                                                <select
                                                    className="input-premium py-2.5 px-4 text-sm"
                                                    value={field.type}
                                                    onChange={(e) => updateFeedbackField(index, 'type', e.target.value)}
                                                >
                                                    <option value="text">Text Input</option>
                                                    <option value="textarea">Text Area</option>
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="radio">Radio Group</option>
                                                    <option value="checkbox">Checkbox</option>
                                                    <option value="number">Rating / Number</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between pt-5 md:pt-0">
                                                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-[#1a1d24] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-indigo-650 rounded"
                                                        checked={field.required}
                                                        onChange={(e) => updateFeedbackField(index, 'required', e.target.checked)}
                                                    />
                                                    Required
                                                </label>
                                                <button type="button" onClick={() => removeFeedbackField(index)} className="p-2.5 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-500/10 rounded-xl hover:scale-105 transition-all">
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </div>
                                        {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
                                            <div className="p-4 bg-rose-500/5 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-550/20">
                                                <label className="block text-xs font-black text-rose-700 dark:text-rose-400 mb-2 uppercase tracking-wide">
                                                    Options (comma-separated)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Excellent, Good, Average"
                                                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-[#1a1d24] border border-rose-200 dark:border-rose-500/20 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none dark:text-white"
                                                    value={field.options ? field.options.join(', ') : ''}
                                                    onChange={(e) => updateFeedbackField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                                />
                                                <p className="text-[10px] text-rose-500 font-bold mt-1">
                                                    Separate choices using commas.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Side: Schedule & Logistics */}
                <div className="space-y-6">
                    <section className="glass rounded-[2rem] overflow-hidden dark:text-white">
                        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-b border-slate-100 dark:border-[#2D3340]">
                            <Calendar className="w-5 h-5 text-amber-600" />
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Schedule & Settings</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Event Date</label>
                                <input
                                    type="date"
                                    className="input-premium py-2.5 px-4 text-sm"
                                    value={eventData.eventDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Start Time</label>
                                    <input
                                        type="time"
                                        className="input-premium py-2.5 px-4 text-sm"
                                        value={eventData.startTime}
                                        onChange={(e) => handleStartTimeChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">End Time</label>
                                    <input
                                        type="time"
                                        className="input-premium py-2.5 px-4 text-sm"
                                        value={eventData.endTime}
                                        onChange={(e) => handleEndTimeChange(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5 pl-1">Registration Deadline</label>
                                <input
                                    type="date"
                                    className="input-premium py-2.5 px-4 text-sm border-amber-300 dark:border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10"
                                    value={eventData.registrationDeadline}
                                    onChange={(e) => handleRegDeadlineChange(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="glass rounded-[2rem] overflow-hidden dark:text-white">
                        <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-b border-slate-100 dark:border-[#2D3340]">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Participation Limits</h2>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Participation Type</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/30">
                                    {['Individual', 'Team'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setEventData({ 
                                                ...eventData, 
                                                participationType: type,
                                                minTeamSize: type === 'Individual' ? 1 : 2,
                                                maxTeamSize: type === 'Individual' ? 1 : 4
                                            })}
                                            className={`py-2 px-4 rounded-xl font-bold text-xs transition-all ${
                                                eventData.participationType === type
                                                    ? 'bg-white dark:bg-[#1A1D24] text-indigo-650 dark:text-indigo-400 shadow-md shadow-indigo-900/5'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {type === 'Individual' ? '👤 Individual' : '👥 Team-based'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {eventData.participationType === 'Team' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 dark:bg-[#1a1d24]/30 rounded-2xl border border-slate-100 dark:border-slate-800/50"
                                >
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Min Size</label>
                                        <input
                                            type="number"
                                            className="input-premium py-2 px-3.5 text-xs text-center font-bold"
                                            value={eventData.minTeamSize || ''}
                                            onChange={(e) => setEventData({ ...eventData, minTeamSize: parseInt(e.target.value) || '' })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Max Size</label>
                                        <input
                                            type="number"
                                            className="input-premium py-2 px-3.5 text-xs text-center font-bold"
                                            value={eventData.maxTeamSize || ''}
                                            onChange={(e) => setEventData({ ...eventData, maxTeamSize: parseInt(e.target.value) || '' })}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Max Registrations</label>
                                <input
                                    type="number"
                                    className="input-premium py-2.5 px-4 text-sm"
                                    value={eventData.maxParticipants || ''}
                                    onChange={(e) => setEventData({ ...eventData, maxParticipants: parseInt(e.target.value) || '' })}
                                />
                            </div>

                            {eventData.participationType === 'Team' && eventData.maxParticipants > 0 && eventData.minTeamSize > 0 && (
                                <div className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-100/30 dark:border-indigo-500/20 p-4 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-black text-indigo-750 dark:text-indigo-350">Max Teams Permitted</span>
                                        <p className="text-[10px] text-indigo-500 font-bold mt-0.5">Total capacity ÷ Min Size</p>
                                    </div>
                                    <span className="text-2xl font-black text-indigo-650 dark:text-indigo-400">
                                        {Math.floor(eventData.maxParticipants / eventData.minTeamSize)}
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Access restriction</label>
                                <select
                                    className="input-premium py-2.5 px-4 text-sm font-bold"
                                    value={eventData.registrationRestrictionMode}
                                    onChange={(e) => setEventData({ ...eventData, registrationRestrictionMode: e.target.value })}
                                >
                                    <option value="Open to All Students">🔓 Open to All Students</option>
                                    <option value="Restrict by Class & Section">🔒 Restrict by Class & Section</option>
                                </select>
                            </div>

                            {eventData.registrationRestrictionMode === 'Restrict by Class & Section' && (
                                <div className="space-y-4 mt-2">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Allocations</p>
                                            <button
                                                type="button"
                                                onClick={() => setEventData({
                                                    ...eventData,
                                                    allocations: [...(eventData.allocations || []), { yearAndDept: 'I B.E. CSE', section: 'A', limit: defaultAllocationLimit }]
                                                })}
                                                className="flex items-center gap-1 text-[10px] font-black text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 transition-all shadow-sm"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Add Class
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1a1d24] px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Default Limit:</span>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-16 bg-white dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 rounded-lg text-xs py-1 text-center font-black dark:text-white"
                                                value={defaultAllocationLimit}
                                                onChange={(e) => setDefaultAllocationLimit(parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                    </div>

                                    {(!eventData.allocations || eventData.allocations.length === 0) && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5 dark:bg-amber-500/10 px-4 py-3 rounded-2xl border border-amber-100 dark:border-amber-500/20 leading-relaxed">
                                            No allocations added yet. Click "Add Class" above!
                                        </p>
                                    )}

                                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                                        {(eventData.allocations || []).map((alloc, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-slate-50/50 dark:bg-[#1a1d24]/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <select
                                                    className="flex-1 bg-white dark:bg-[#1a1d24] text-xs font-bold py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-xl"
                                                    value={alloc.yearAndDept}
                                                    onChange={(e) => {
                                                        const updated = [...eventData.allocations];
                                                        updated[idx] = { ...updated[idx], yearAndDept: e.target.value };
                                                        setEventData({ ...eventData, allocations: updated });
                                                    }}
                                                >
                                                    {[
                                                        'I B.E. CSE','II B.E. CSE','III B.E. CSE','IV B.E. CSE',
                                                        'I B.E. ECE','II B.E. ECE','III B.E. ECE','IV B.E. ECE',
                                                        'I B.E. EEE','II B.E. EEE','III B.E. EEE','IV B.E. EEE',
                                                        'I B.E. Mechanical','II B.E. Mechanical','III B.E. Mechanical','IV B.E. Mechanical',
                                                        'I B.E. Civil','II B.E. Civil','III B.E. Civil','IV B.E. Civil',
                                                        'I B.E. IT','II B.E. IT','III B.E. IT','IV B.E. IT',
                                                        'I B.E. AI&DS','II B.E. AI&DS','III B.E. AI&DS','IV B.E. AI&DS',
                                                        'I B.E. Mechatronics','II B.E. Mechatronics','III B.E. Mechatronics','IV B.E. Mechatronics',
                                                        'I B.E. AIML(CSE)','II B.E. AIML(CSE)','III B.E. AIML(CSE)','IV B.E. AIML(CSE)',
                                                        'I B.E. ACT','II B.E. ACT','III B.E. ACT','IV B.E. ACT',
                                                        'I B.E. VLSI','II B.E. VLSI','III B.E. VLSI','IV B.E. VLSI',
                                                        'I B.E. CYBER(CSE)','II B.E. CYBER(CSE)','III B.E. CYBER(CSE)','IV B.E. CYBER(CSE)',
                                                        'I B.E. AUTO','II B.E. AUTO','III B.E. AUTO','IV B.E. AUTO'
                                                    ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <select
                                                    className="w-18 bg-white dark:bg-[#1a1d24] text-xs font-bold py-1.5 px-2 border border-slate-200 dark:border-slate-700 rounded-xl"
                                                    value={alloc.section}
                                                    onChange={(e) => {
                                                        const updated = [...eventData.allocations];
                                                        updated[idx] = { ...updated[idx], section: e.target.value };
                                                        setEventData({ ...eventData, allocations: updated });
                                                    }}
                                                >
                                                    {['A','B','C','Nil'].map(s => <option key={s} value={s}>Sec {s}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-14 bg-white dark:bg-[#1a1d24] text-xs font-bold py-1.5 text-center border border-slate-200 dark:border-slate-700 rounded-xl"
                                                    value={alloc.limit}
                                                    onChange={(e) => {
                                                        const updated = [...eventData.allocations];
                                                        updated[idx] = { ...updated[idx], limit: parseInt(e.target.value) || 0 };
                                                        setEventData({ ...eventData, allocations: updated });
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = eventData.allocations.filter((_, i) => i !== idx);
                                                        setEventData({ ...eventData, allocations: updated });
                                                    }}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-55 dark:hover:bg-red-500/10 rounded-xl"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {eventData.allocations && eventData.allocations.length > 0 && (
                                        <div className="flex justify-between items-center px-4 py-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100/30 dark:border-indigo-500/20">
                                            <span className="text-xs font-black text-indigo-750 dark:text-indigo-400">Total Allocated Seats</span>
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                {eventData.allocations.reduce((sum, a) => sum + (a.limit || 0), 0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Publishing</label>
                                    <select
                                        className="input-premium py-2.5 px-4 text-sm font-bold"
                                        value={eventData.status === 'Draft' ? 'Draft' : 'Published'}
                                        onChange={(e) => setEventData({ ...eventData, status: e.target.value === 'Draft' ? 'Draft' : 'Upcoming' })}
                                    >
                                        <option value="Draft">Draft (Hidden)</option>
                                        <option value="Published">Published (Live)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Registration</label>
                                    <select
                                        className="input-premium py-2.5 px-4 text-sm font-bold"
                                        value={eventData.isRegistrationOpen ? 'Open' : 'Closed'}
                                        onChange={(e) => setEventData({ ...eventData, isRegistrationOpen: e.target.value === 'Open' })}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="glass rounded-[2rem] overflow-visible dark:text-white relative">
                        <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-slate-500/5 to-slate-900/5 border-b border-slate-100 dark:border-[#2D3340] rounded-t-[2rem]">
                            <UserCheck className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Event Coordinators</h2>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="relative">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Faculty Coordinator</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input-premium py-2.5 pl-4 pr-10 text-sm"
                                        placeholder="Search faculty name..."
                                        value={facultySearch}
                                        onChange={(e) => {
                                            handleFacultySearch(e.target.value);
                                            if (!e.target.value) {
                                                setEventData({ ...eventData, facultyCoordinator: '' });
                                            }
                                        }}
                                    />
                                    {facultySearch && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setFacultySearch('');
                                                setEventData({ ...eventData, facultyCoordinator: '' });
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                {isSearchingFaculty && <div className="absolute right-10 top-9"><div className="w-4 h-4 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin"></div></div>}
                                {showFacultyDropdown && facultyResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-[#1a1d24] border border-slate-100 dark:border-[#2D3340] rounded-2xl shadow-xl max-h-48 overflow-y-auto dark:text-white">
                                        {facultyResults.map(user => (
                                            <div
                                                key={user._id}
                                                className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-100 dark:border-[#2D3340] last:border-0 flex items-center gap-3 transition-colors"
                                                onClick={() => {
                                                    setEventData({ ...eventData, facultyCoordinator: user._id });
                                                    setFacultySearch(user.username);
                                                    setShowFacultyDropdown(false);
                                                }}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center text-xs">
                                                    {user.username[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{user.username}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Student Coordinator</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input-premium py-2.5 pl-4 pr-10 text-sm"
                                        placeholder="Search student name..."
                                        value={studentSearch}
                                        onChange={(e) => {
                                            handleStudentSearch(e.target.value);
                                            if (!e.target.value) {
                                                setEventData({ ...eventData, studentCoordinator: '' });
                                            }
                                        }}
                                    />
                                    {studentSearch && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setStudentSearch('');
                                                setEventData({ ...eventData, studentCoordinator: '' });
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                {isSearchingStudent && <div className="absolute right-10 top-9"><div className="w-4 h-4 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin"></div></div>}
                                {showStudentDropdown && studentResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-[#1a1d24] border border-slate-100 dark:border-[#2D3340] rounded-2xl shadow-xl max-h-48 overflow-y-auto dark:text-white">
                                        {studentResults.map(user => (
                                            <div
                                                key={user._id}
                                                className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-100 dark:border-[#2D3340] last:border-0 flex items-center gap-3 transition-colors"
                                                onClick={() => {
                                                    setEventData({ ...eventData, studentCoordinator: user._id });
                                                    setStudentSearch(user.username);
                                                    setShowStudentDropdown(false);
                                                }}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-bold flex items-center justify-center text-xs">
                                                    {user.username[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{user.username}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {showSaveTemplateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white/90 dark:bg-[#1a1d24]/90 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 dark:border-white/5 text-slate-900 dark:text-white space-y-6 relative">
                        <button onClick={() => setShowSaveTemplateModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-650 bg-slate-50 dark:bg-slate-800 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="pb-2 border-b dark:border-slate-800">
                            <h3 className="font-black text-xl tracking-tight">Save As Template</h3>
                            <p className="text-xs text-slate-400 mt-1">Reuse this form configuration for future events</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1.5">Template Name</label>
                                <input
                                    type="text"
                                    className="input-premium py-2.5 px-4 text-sm"
                                    value={newTemplateDetails.templateName}
                                    onChange={(e) => setNewTemplateDetails({ ...newTemplateDetails, templateName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1.5">Description</label>
                                <textarea
                                    className="input-premium py-2.5 px-4 text-sm h-20 resize-none"
                                    value={newTemplateDetails.description}
                                    onChange={(e) => setNewTemplateDetails({ ...newTemplateDetails, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1.5">Category</label>
                                <select
                                    className="input-premium py-2.5 px-4 text-sm font-bold"
                                    value={newTemplateDetails.category}
                                    onChange={(e) => setNewTemplateDetails({ ...newTemplateDetails, category: e.target.value })}
                                >
                                    <option value="Workshop">Workshop</option>
                                    <option value="Hackathon">Hackathon</option>
                                    <option value="Seminar">Seminar</option>
                                    <option value="Competition">Competition</option>
                                    <option value="Conference">Conference</option>
                                    <option value="Guest Lecture">Guest Lecture</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowSaveTemplateModal(false)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAsTemplate}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20"
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateEvent;
