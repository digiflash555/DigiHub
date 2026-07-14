import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Calendar, Clock, MapPin, Image as ImageIcon, Briefcase, Users, Layout, ArrowLeft } from 'lucide-react';
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

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await axios.get(`/api/feedback-templates`);
                setFeedbackTemplates(res.data);
            } catch (error) {
                console.error('Failed to load feedback templates');
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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = new FormData();
            const allowedKeys = [
                'title', 'description', 'venue', 'eventDate', 'startTime', 'endTime', 
                'registrationDeadline', 'maxParticipants', 'category', 'participationType', 
                'minTeamSize', 'maxTeamSize', 'status', 'facultyCoordinator', 'studentCoordinator'
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
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-2 mb-[-1rem]">
                <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
            <div className="flex justify-between items-center bg-white dark:bg-[#20242B] p-6 rounded-2xl shadow-sm border border-gray-100 dark:text-white">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{id ? 'Edit Event' : 'Create New Event'}</h1>
                    <p className="text-gray-500 mt-1">Fill in the details to publish your event</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/admin')} className="px-6 py-2 border rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                    <button onClick={handleSubmit} disabled={isLoading} className="btn-primary px-8 flex items-center gap-2">
                        {isLoading ? 'Saving...' : id ? 'Update Event' : 'Create Event'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: General Info */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white dark:bg-[#20242B] p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 dark:text-white">
                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                            <Layout className="w-5 h-5" />
                            <h2 className="text-xl font-bold">General Information</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                                <input 
                                    type="text" 
                                    className="input-field text-lg font-medium" 
                                    placeholder="e.g. Annual Tech Symposium 2024"
                                    value={eventData.title}
                                    onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="input-field h-40"
                                    placeholder="Detailed description of the event..."
                                    value={eventData.description}
                                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="input-field"
                                    />
                                    {bannerPreview && (
                                        <div className="mt-2">
                                            <img
                                                src={bannerPreview}
                                                alt="Banner preview"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

                    {/* Registration Form Builder */}
                    <section className="bg-white dark:bg-[#20242B] p-8 rounded-2xl shadow-sm border border-gray-100 dark:text-white">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                                <Layout className="w-5 h-5" />
                                <h2 className="text-xl font-bold">Registration Form Builder</h2>
                            </div>
                            <div className="flex gap-2">
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
                                            registrationForm: [...eventData.registrationForm, template]
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

                        <div className="space-y-4">
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
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="radio">Radio Group</option>
                                                    <option value="checkbox">Checkbox</option>
                                                    <option value="file">File Upload</option>
                                                    <option value="date">Date Picker</option>
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
                                                    <button type="button" onClick={() => removeFormField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg ml-auto">
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
                                                        placeholder="e.g. Option 1, Option 2, Option 3"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-[#20242B] border border-indigo-200 dark:border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
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

                    {/* Feedback Form Builder */}
                    <section className="bg-white dark:bg-[#20242B] p-8 rounded-2xl shadow-sm border border-gray-100 dark:text-white">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                                <Plus className="w-5 h-5" />
                                <h2 className="text-xl font-bold">Feedback Form Builder</h2>
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

                        <div className="space-y-4">
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
                    <section className="bg-white dark:bg-[#20242B] p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 dark:text-white">
                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                            <Calendar className="w-5 h-5" />
                            <h2 className="text-xl font-bold">Schedule</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                                <input 
                                    type="date" 
                                    className="input-field"
                                    value={eventData.eventDate}
                                    onChange={(e) => setEventData({ ...eventData, eventDate: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        className="input-field"
                                        value={eventData.startTime}
                                        onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input 
                                        type="time" 
                                        className="input-field"
                                        value={eventData.endTime}
                                        onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                                <input 
                                    type="date" 
                                    className="input-field border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10"
                                    value={eventData.registrationDeadline}
                                    onChange={(e) => setEventData({ ...eventData, registrationDeadline: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-[#20242B] p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 dark:text-white">
                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                            <Users className="w-5 h-5" />
                            <h2 className="text-xl font-bold">Participation</h2>
                        </div>
                        
                        <div className="space-y-4">
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

                    <section className="bg-white dark:bg-[#20242B] p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 dark:text-white">
                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                            <Users className="w-5 h-5" />
                            <h2 className="text-xl font-bold">Event Coordinators</h2>
                        </div>
                        
                        <div className="space-y-4">
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
        </div>
    );
};

export default CreateEvent;
