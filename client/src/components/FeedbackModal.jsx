import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Star, Sparkles } from 'lucide-react';

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
                        className="bg-white/90 dark:bg-[#1a1d24]/90 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative dark:text-white border border-white/20 dark:border-white/5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none rounded-t-[2.5rem]" />
                        
                        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full transition-all backdrop-blur-sm z-10">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 transform rotate-3">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Your Feedback</h3>
                                <p className="text-primary-600 dark:text-primary-400 font-bold mt-1">{event.title}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            {event.feedbackForm.map((field, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="space-y-3 bg-white/50 dark:bg-black/20 p-6 rounded-3xl border border-white/40 dark:border-white/5 shadow-sm"
                                >
                                    <label className="block text-sm font-black text-gray-800 dark:text-gray-200">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            required={field.required}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-transparent bg-white dark:bg-[#1a1d24] shadow-inner focus:border-primary-500 focus:ring-0 transition-all resize-none text-sm dark:text-white h-32"
                                            placeholder="Share your thoughts..."
                                            value={formData[field.label] || ''}
                                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                        />
                                    ) : field.type === 'dropdown' ? (
                                        <select
                                            required={field.required}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-transparent bg-white dark:bg-[#1a1d24] shadow-inner focus:border-primary-500 focus:ring-0 transition-all text-sm dark:text-white appearance-none cursor-pointer"
                                            value={formData[field.label] || ''}
                                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                        >
                                            <option value="">Select an option</option>
                                            {field.options && field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : field.type === 'radio' ? (
                                        <div className="flex flex-wrap gap-3 mt-2">
                                            {field.options && field.options.map(opt => (
                                                <label key={opt} className={`flex items-center gap-2 cursor-pointer px-5 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${formData[field.label] === opt ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'border-transparent bg-white dark:bg-[#1a1d24] text-gray-600 dark:text-gray-300 hover:border-primary-200'}`}>
                                                    <input
                                                        type="radio"
                                                        name={field.label}
                                                        value={opt}
                                                        required={field.required}
                                                        onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                                        className="hidden"
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === 'checkbox' ? (
                                        <div className="space-y-3 mt-2">
                                            {field.options && field.options.map(opt => {
                                                const isChecked = (formData[field.label] || []).includes(opt);
                                                return (
                                                    <label key={opt} className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border-2 transition-all ${isChecked ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-transparent bg-white dark:bg-[#1a1d24] hover:border-primary-200'}`}>
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isChecked ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                            {isChecked && <Star className="w-4 h-4 fill-current" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const current = formData[field.label] || [];
                                                                if (e.target.checked) setFormData({...formData, [field.label]: [...current, opt]});
                                                                else setFormData({...formData, [field.label]: current.filter(v => v !== opt)});
                                                            }}
                                                        />
                                                        <span className={`text-sm font-bold ${isChecked ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'}`}>{opt}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : field.type === 'number' ? (
                                        <div className="flex items-center gap-3 md:gap-6 mt-4">
                                            {[1, 2, 3, 4, 5].map((num) => {
                                                const emojis = ['😞', '😐', '🙂', '😊', '🤩'];
                                                const isSelected = formData[field.label] === num;
                                                return (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setFormData({...formData, [field.label]: num})}
                                                        className={`relative flex flex-col items-center gap-2 p-4 rounded-3xl transition-all flex-1 ${ isSelected ? 'bg-gradient-to-b from-primary-50 to-white dark:from-primary-900/20 dark:to-black/40 border-2 border-primary-500 shadow-xl shadow-primary-500/20' : 'bg-white dark:bg-[#1a1d24] border-2 border-transparent hover:border-primary-200 opacity-70 hover:opacity-100' }`}
                                                    >
                                                        <span className="text-3xl filter drop-shadow-sm">{emojis[num-1]}</span>
                                                        <span className={`text-xs font-black ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>{num}/5</span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            required={field.required}
                                            className="w-full px-5 py-4 rounded-2xl border-2 border-transparent bg-white dark:bg-[#1a1d24] shadow-inner focus:border-primary-500 focus:ring-0 transition-all text-sm dark:text-white"
                                            placeholder="Your answer"
                                            value={formData[field.label] || ''}
                                            onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                                        />
                                    )}
                                </motion.div>
                            ))}

                            <div className="pt-8 pb-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-2xl py-5 flex items-center justify-center gap-3 font-black text-lg shadow-xl shadow-primary-500/30 transition-all"
                                >
                                    {isSubmitting ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full" />
                                    ) : (
                                        <>
                                            Submit Feedback <Send className="w-6 h-6" />
                                        </>
                                    )}
                                </motion.button>
                                <p className="text-center text-xs font-bold text-gray-400 mt-6">
                                    Your feedback helps us improve future events.
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FeedbackModal;
