import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Star } from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, event }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && event?.feedbackForm && user) {
            const prefilled = {};
            const patterns = {
                username: ['name', 'full name', 'username', 'participant name', 'your name', 'student name'],
                email: ['email', 'email address', 'email id', 'mail'],
                phone: ['phone', 'mobile', 'phone number', 'mobile number', 'contact number'],
                registrationNumber: ['reg no', 'registration no', 'registration number', 'roll no', 'roll number', 'student id', 'reg id'],
                gender: ['gender', 'sex'],
                yearAndDept: ['year', 'department', 'class', 'branch'],
                dateOfBirth: ['dob', 'date of birth', 'birth date']
            };

            event.feedbackForm.forEach(field => {
                const label = field.label.toLowerCase().trim();
                for (const [key, searchTerms] of Object.entries(patterns)) {
                    if (searchTerms.some(term => label.includes(term))) {
                        let value = user[key];
                        if (key === 'dateOfBirth' && value) value = value.split('T')[0];
                        if (value) prefilled[field.label] = value;
                        break;
                    }
                }
            });
            setFormData(prefilled);
        }
    }, [isOpen, event, user]);

    if (!event || !event.feedbackForm) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`/api/feedback`, {
                eventId: event._id,
                responses: formData
            });
            toast.success('Feedback submitted successfully! Thank you.');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white dark:bg-[#20242B] p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative dark:text-white"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Event Feedback</h3>
                                <p className="text-gray-500 font-medium">{event.title}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {event.feedbackForm.map((field, i) => (
                                <div key={i} className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            required={field.required}
                                            className="input-field h-24"
                                            value={formData[field.label] || ''}
                                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                        />
                                    ) : field.type === 'dropdown' ? (
                                        <select
                                            required={field.required}
                                            className="input-field"
                                            value={formData[field.label] || ''}
                                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                        >
                                            <option value="">Select option</option>
                                            {field.options && field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : field.type === 'radio' ? (
                                        <div className="flex flex-wrap gap-4">
                                            {field.options && field.options.map(opt => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-xl border hover:bg-white transition-all dark:text-white">
                                                    <input
                                                        type="radio"
                                                        name={field.label}
                                                        value={opt}
                                                        required={field.required}
                                                        onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                                        className="text-primary-600 dark:text-primary-400 focus:ring-primary-500"
                                                    />
                                                    <span className="text-sm font-medium">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === 'checkbox' ? (
                                        <div className="space-y-2">
                                            {field.options && field.options.map(opt => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            const current = formData[field.label] || [];
                                                            if (e.target.checked) setFormData({...formData, [field.label]: [...current, opt]});
                                                            else setFormData({...formData, [field.label]: current.filter(v => v !== opt)});
                                                        }}
                                                        className="rounded text-primary-600 dark:text-primary-400"
                                                    />
                                                    <span className="text-sm font-medium">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === 'number' ? (
                                        <div className="flex items-center gap-4">
                                            {[1, 2, 3, 4, 5].map((num) => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, [field.label]: num})}
                                                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${ formData[field.label] === num ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-primary-200' }`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            required={field.required}
                                            className="input-field"
                                            value={formData[field.label] || ''}
                                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-black text-lg shadow-xl shadow-primary-200"
                                >
                                    {isSubmitting ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            Submit Feedback <Send className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FeedbackModal;
