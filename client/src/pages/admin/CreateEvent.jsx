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
        status: 'Open',
        registrationForm: [],
        feedbackForm: [],
        bannerImage: '',
        facultyCoordinator: '',
        studentCoordinator: ''
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
            const res = await axios.get(`/api/auth/search?q=${query}`);
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
            const res = await axios.get(`/api/auth/search?q=${query}`);
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
                'registrationRestrictionMode', 'minTeamSize', 'maxTeamSize', 'status', 'facultyCoordinator', 'studentCoordinator'
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
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Premium Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-200">{id ? 'Edit Mode' : 'Create Mode'}</span>
                            </div>
                            <h1 className="text-3xl font-black">{id ? 'Edit Event' : 'Create New Event'}</h1>
                            <p className="text-indigo-200 text-sm mt-1">Configure all event details and publish when ready</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/admin')} className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl font-bold text-sm transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-black text-sm flex items-center gap-2 transition-colors shadow-lg disabled:opacity-60"
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
                    <section className="bg-white dark:bg-[#20242B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden dark:text-white">
                        <div className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-b border-indigo-100 dark:border-indigo-800/50">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">1</div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">General Information</h2>
                                <p className="text-xs text-indigo-500 dark:text-indigo-400">Event title, description and media</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">

                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Event Title <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                className="input-field text-lg font-bold"
                                placeholder="e.g. Annual Tech Symposium 2025"
                                value={eventData.title}
                                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Description <span className="text-red-400">*</span></label>
                            <textarea
                                className="input-field h-36"
                                placeholder="Write a compelling description of your event..."
                                value={eventData.description}
                                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Banner Image</label>
                            <div className="space-y-3">
                                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-indigo-200 dark:border-indigo-700 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all p-6 group">
                                    <ImageIcon className="w-10 h-10 text-indigo-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                                    <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Click to upload banner</span>
                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                                {bannerPreview && (
                                    <div className="relative rounded-2xl overflow-hidden">
                                        <img src={bannerPreview} alt="Banner preview" className="w-full h-52 object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
                                            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">Preview</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Category</label>
                                <select
                                    className="input-field"
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
                                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Venue</label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" />
                                    <input
                                        type="text"
                                        className="input-field pl-9"
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
                    <section className="bg-white dark:bg-[#20242B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden dark:text-white">
                        <div className="flex justify-between items-center px-8 py-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-100 dark:border-emerald-800/50 flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm">2</div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Registration Form Builder</h2>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Fields participants fill when registering</p>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    className="text-sm border border-indigo-205 rounded-lg px-3 py-1 bg-indigo-50 dark:bg-indigo-550/10 text-indigo-700 dark:text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
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
                                    <option value="">Import Registration Template...</option>
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
                                    className="text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                                >
                                    Save as Template
                                </button>
                                <select
                                    className="text-sm border rounded-lg px-3 py-1 bg-gray-50 text-gray-600 outline-none focus:ring-2 focus:ring-primary-500"
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
                                    <option value="">Quick Add Field...</option>
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
                                    className="text-primary-600 dark:text-primary-400 text-sm font-bold flex items-center gap-1 hover:bg-primary-50 px-3 py-1 rounded-lg transition-colors border border-primary-100 dark:border-primary-500/20"
                                >
                                    <Plus className="w-4 h-4" /> Custom Field
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {eventData.registrationForm.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50 text-gray-500">
                                    No custom fields added yet.
                                </div>
                            ) : (
                                eventData.registrationForm.map((field, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 border rounded-xl flex gap-4 items-start bg-gray-50/50"
                                    >
                                        <div className="flex-1 space-y-4">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Field Label"
                                                    className="input-field bg-white dark:bg-[#20242B] dark:text-white"
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, 'label', e.target.value)}
                                                />
                                                <select
                                                    className="input-field bg-white dark:bg-[#20242B] dark:text-white"
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
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={(e) => updateField(index, 'required', e.target.checked)}
                                                        />
                                                        Required
                                                    </label>
                                                    <button type="button" onClick={() => removeFormField(index)} className="text-red-500 hover:bg-red-55 p-2 rounded-lg ml-auto">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {['dropdown', 'radio', 'checkbox', 'multiselect', 'department', 'year', 'section', 'gender'].includes(field.type) && (
                                                <div className="mt-3 p-3 bg-indigo-55/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2 uppercase tracking-wide">
                                                        Options (comma-separated)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Option 1, Option 2, Option 3"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-[#20242B] border border-indigo-200 dark:border-indigo-550/30 rounded-lg focus:ring-2 focus:ring-indigo-55 focus:border-indigo-500 dark:text-white"
                                                        value={field.options ? field.options.join(', ') : ''}
                                                        onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                                    />
                                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                                                        Separate multiple options with commas
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Section 3: Feedback Form Builder */}
                    <section className="bg-white dark:bg-[#20242B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden dark:text-white">
                        <div className="flex justify-between items-center px-8 py-5 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border-b border-rose-100 dark:border-rose-800/50 flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white font-black text-sm">3</div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Feedback Form Builder</h2>
                                    <p className="text-xs text-rose-500 dark:text-rose-400">Collect post-event feedback from participants</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="text-sm border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 outline-none focus:ring-2 focus:ring-rose-500 font-bold"
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
                                    className="text-sm border rounded-lg px-3 py-1 bg-gray-50 text-gray-600 outline-none focus:ring-2 focus:ring-primary-500"
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
                                    <option value="">Quick Add Field...</option>
                                    <option value="rating">Overall Rating</option>
                                    <option value="experience">Experience Textarea</option>
                                    <option value="source">Source Dropdown</option>
                                    <option value="recommend">Recommend Select</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={addFeedbackField}
                                    className="text-primary-600 dark:text-primary-400 text-sm font-bold flex items-center gap-1 hover:bg-primary-50 px-3 py-1 rounded-lg transition-colors border border-primary-100 dark:border-primary-500/20"
                                >
                                    <Plus className="w-4 h-4" /> Custom Field
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {eventData.feedbackForm?.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50 text-gray-500">
                                    No feedback fields added yet.
                                </div>
                            ) : (
                                (eventData.feedbackForm || []).map((field, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 border rounded-xl flex gap-4 items-start bg-gray-50/50"
                                    >
                                        <div className="flex-1 space-y-4">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Field Label"
                                                    className="input-field bg-white dark:bg-[#20242B] dark:text-white"
                                                    value={field.label}
                                                    onChange={(e) => updateFeedbackField(index, 'label', e.target.value)}
                                                />
                                                <select
                                                    className="input-field bg-white dark:bg-[#20242B] dark:text-white"
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
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.required}
                                                            onChange={(e) => updateFeedbackField(index, 'required', e.target.checked)}
                                                        />
                                                        Required
                                                    </label>
                                                    <button type="button" onClick={() => removeFeedbackField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg ml-auto">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
                                                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2 uppercase tracking-wide">
                                                        Options (comma-separated)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Excellent, Good, Average"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-[#20242B] border border-indigo-200 dark:border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                                                        value={field.options ? field.options.join(', ') : ''}
                                                        onChange={(e) => updateFeedbackField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                                    />
                                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                                                        Separate multiple options with commas
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Side: Schedule & Logistics */}
                <div className="space-y-6">
                    <section className="bg-white dark:bg-[#20242B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden dark:text-white">
                        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-100 dark:border-amber-800/50">
                            <Calendar className="w-5 h-5 text-amber-600" />
                            <h2 className="text-base font-black text-gray-900 dark:text-white">Schedule & Settings</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Event Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={eventData.eventDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        value={eventData.startTime}
                                        onChange={(e) => handleStartTimeChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">End Time</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        value={eventData.endTime}
                                        onChange={(e) => handleEndTimeChange(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Registration Deadline</label>
                                <input
                                    type="date"
                                    className="input-field border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10"
                                    value={eventData.registrationDeadline}
                                    onChange={(e) => handleRegDeadlineChange(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-[#20242B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden dark:text-white">
                        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-blue-100 dark:border-blue-800/50">
                            <Users className="w-5 h-5 text-blue-600" />
                            <h2 className="text-base font-black text-gray-900 dark:text-white">Participation</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    className="input-field"
                                    value={eventData.participationType}
                                    onChange={(e) => setEventData({ ...eventData, participationType: e.target.value })}
                                >
                                    <option value="Individual">Individual</option>
                                    <option value="Team">Team-based</option>
                                </select>
                            </div>

                            {eventData.participationType === 'Team' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Team Size</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={eventData.minTeamSize || ''}
                                            onChange={(e) => setEventData({ ...eventData, minTeamSize: parseInt(e.target.value) || '' })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Team Size</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={eventData.maxTeamSize || ''}
                                            onChange={(e) => setEventData({ ...eventData, maxTeamSize: parseInt(e.target.value) || '' })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants (Total)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={eventData.maxParticipants || ''}
                                    onChange={(e) => setEventData({ ...eventData, maxParticipants: parseInt(e.target.value) || '' })}
                                />
                            </div>

                            {eventData.participationType === 'Team' && eventData.maxParticipants > 0 && eventData.minTeamSize > 0 && (
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Maximum Teams Allowed</span>
                                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                            {Math.floor(eventData.maxParticipants / eventData.minTeamSize)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-500 mt-1">Calculated as Maximum Participants ÷ Minimum Team Size</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Restriction</label>
                                <select
                                    className="input-field"
                                    value={eventData.registrationRestrictionMode}
                                    onChange={(e) => setEventData({ ...eventData, registrationRestrictionMode: e.target.value })}
                                >
                                    <option value="Open to All Students">Open to All Students</option>
                                    <option value="Restrict by Class & Section">Restrict by Class & Section</option>
                                </select>
                            </div>

                            {eventData.registrationRestrictionMode === 'Restrict by Class & Section' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Class/Section Allocations</p>
                                        <button
                                            type="button"
                                            onClick={() => setEventData({
                                                ...eventData,
                                                allocations: [...(eventData.allocations || []), { yearAndDept: 'I B.E. CSE', section: 'A', limit: 10 }]
                                            })}
                                            className="flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-3 py-1.5 rounded-lg border border-primary-100 dark:border-primary-500/20 hover:bg-primary-100 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Allocation
                                        </button>
                                    </div>

                                    {(!eventData.allocations || eventData.allocations.length === 0) && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-500/20">
                                            ⚠ No allocations added yet. Click "Add Allocation" to specify which classes can register and how many seats each gets.
                                        </p>
                                    )}

                                    {(eventData.allocations || []).map((alloc, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <select
                                                className="input-field text-sm py-1.5"
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
                                                className="input-field text-sm py-1.5 w-24"
                                                value={alloc.section}
                                                onChange={(e) => {
                                                    const updated = [...eventData.allocations];
                                                    updated[idx] = { ...updated[idx], section: e.target.value };
                                                    setEventData({ ...eventData, allocations: updated });
                                                }}
                                            >
                                                {['A','B','C','Nil'].map(s => <option key={s} value={s}>Sec {s}</option>)}
                                            </select>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="input-field text-sm py-1.5 w-20 text-center font-bold"
                                                    value={alloc.limit}
                                                    onChange={(e) => {
                                                        const updated = [...eventData.allocations];
                                                        updated[idx] = { ...updated[idx], limit: parseInt(e.target.value) || 0 };
                                                        setEventData({ ...eventData, allocations: updated });
                                                    }}
                                                />
                                                <span className="text-xs text-gray-500 whitespace-nowrap">seats</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = eventData.allocations.filter((_, i) => i !== idx);
                                                    setEventData({ ...eventData, allocations: updated });
                                                }}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {eventData.allocations && eventData.allocations.length > 0 && (
                                        <div className="flex justify-between items-center px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Total Allocated Seats</span>
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                {eventData.allocations.reduce((sum, a) => sum + (a.limit || 0), 0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Publishing Status</label>
                                <select
                                    className="input-field font-bold"
                                    value={eventData.status}
                                    onChange={(e) => setEventData({ ...eventData, status: e.target.value })}
                                >
                                    <option value="Draft">Draft (Hidden)</option>
                                    <option value="Open">Open (Live)</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-[#20242B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden dark:text-white">
                        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-b border-slate-100 dark:border-slate-800/50">
                            <UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-base font-black text-gray-900 dark:text-white">Event Coordinators</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Coordinator</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Search by name, email, or ID..."
                                    value={facultySearch}
                                    onChange={(e) => {
                                        handleFacultySearch(e.target.value);
                                        if (!e.target.value) {
                                            setEventData({ ...eventData, facultyCoordinator: '' });
                                        }
                                    }}
                                />
                                {isSearchingFaculty && <div className="absolute right-3 top-9"><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}
                                {showFacultyDropdown && facultyResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#20242B] border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto dark:text-white">
                                        {facultyResults.map(user => (
                                            <div
                                                key={user._id}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                onClick={() => {
                                                    setEventData({ ...eventData, facultyCoordinator: user._id });
                                                    setFacultySearch(user.username);
                                                    setShowFacultyDropdown(false);
                                                }}
                                            >
                                                <p className="font-bold text-gray-900">{user.username}</p>
                                                <p className="text-xs text-gray-500">{user.email} {user.registrationNumber ? `• ${user.registrationNumber}` : ''}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student Coordinator</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Search by name, email, or ID..."
                                    value={studentSearch}
                                    onChange={(e) => {
                                        handleStudentSearch(e.target.value);
                                        if (!e.target.value) {
                                            setEventData({ ...eventData, studentCoordinator: '' });
                                        }
                                    }}
                                />
                                {isSearchingStudent && <div className="absolute right-3 top-9"><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}
                                {showStudentDropdown && studentResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#20242B] border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto dark:text-white">
                                        {studentResults.map(user => (
                                            <div
                                                key={user._id}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                onClick={() => {
                                                    setEventData({ ...eventData, studentCoordinator: user._id });
                                                    setStudentSearch(user.username);
                                                    setShowStudentDropdown(false);
                                                }}
                                            >
                                                <p className="font-bold text-gray-900">{user.username}</p>
                                                <p className="text-xs text-gray-500">{user.email} {user.registrationNumber ? `• ${user.registrationNumber}` : ''}</p>
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
                    <div className="bg-white dark:bg-[#20242B] p-6 rounded-2xl shadow-xl w-full max-w-md border dark:border-slate-800 text-slate-900 dark:text-white space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                            <h3 className="font-bold text-lg">Save Registration Form as Template</h3>
                            <button onClick={() => setShowSaveTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#1a1d24] dark:border-slate-850"
                                    value={newTemplateDetails.templateName}
                                    onChange={(e) => setNewTemplateDetails({ ...newTemplateDetails, templateName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#1a1d24] dark:border-slate-850 h-20"
                                    value={newTemplateDetails.description}
                                    onChange={(e) => setNewTemplateDetails({ ...newTemplateDetails, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#1a1d24] dark:border-slate-850"
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
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowSaveTemplateModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAsTemplate}
                                className="px-4 py-2 bg-emerald-605 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
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
