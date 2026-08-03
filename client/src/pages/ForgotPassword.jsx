import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, ArrowRight, Shield, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Step 1: Email
    const [email, setEmail] = useState('');

    // Step 2: Security Answers
    const [securityAnswers, setSecurityAnswers] = useState({
        bestFriendName: '',
        favoriteColor: '',
        favoriteHero: ''
    });

    // Step 3: Reset Password
    const [resetData, setResetData] = useState({
        resetToken: '',
        userId: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(`/api/auth/forgot-password`, { email });
            toast.success(res.data.message);
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to find account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSecurityAnswersSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(`/api/auth/verify-security-answers`, {
                email,
                securityAnswers
            });
            toast.success(res.data.message);
            setResetData({
                resetToken: res.data.resetToken,
                userId: res.data.userId,
                newPassword: '',
                confirmPassword: ''
            });
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Security answers do not match');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (resetData.newPassword !== resetData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (resetData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setIsLoading(true);
        try {
            const res = await axios.post(`/api/auth/reset-password`, {
                resetToken: resetData.resetToken,
                userId: resetData.userId,
                newPassword: resetData.newPassword
            });
            toast.success(res.data.message);
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative py-20 px-6">
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[520px]"
            >
                <div className="text-center space-y-4 mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-indigo-600 shadow-xl shadow-indigo-200 text-white mb-6">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Reset Password</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Securely recover your account access</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${ step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400' }`}>
                                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && <div className={`w-12 h-1 rounded-full transition-all ${step > s ? 'bg-indigo-600' : 'bg-slate-100'}`} />}
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 dark:text-white">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Email */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <form onSubmit={handleEmailSubmit} className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="email"
                                                className="input-premium pl-14"
                                                placeholder="name@example.com"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn-premium w-full flex items-center justify-center gap-3 py-4"
                                    >
                                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Continue'}
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 2: Security Questions */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Security Verification</h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Answer all security questions correctly to proceed.</p>

                                <form onSubmit={handleSecurityAnswersSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Best Friend's Name</label>
                                        <input
                                            type="text"
                                            className="input-premium text-sm"
                                            placeholder="Enter in one word"
                                            required
                                            value={securityAnswers.bestFriendName}
                                            onChange={(e) => setSecurityAnswers({ ...securityAnswers, bestFriendName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Favorite Color</label>
                                        <input
                                            type="text"
                                            className="input-premium text-sm"
                                            placeholder="Enter in one word"
                                            required
                                            value={securityAnswers.favoriteColor}
                                            onChange={(e) => setSecurityAnswers({ ...securityAnswers, favoriteColor: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Favorite Hero Name</label>
                                        <input
                                            type="text"
                                            className="input-premium text-sm"
                                            placeholder="Enter in one word"
                                            required
                                            value={securityAnswers.favoriteHero}
                                            onChange={(e) => setSecurityAnswers({ ...securityAnswers, favoriteHero: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn-premium w-full flex items-center justify-center gap-3 py-4 mt-4"
                                    >
                                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify Answers'}
                                        <CheckCircle className="w-6 h-6" />
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 3: Reset Password */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Set New Password</h3>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create a strong password for your account.</p>

                                <form onSubmit={handlePasswordReset} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                                        <div className="relative">
                                            <Lock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="password"
                                                className="input-premium pl-14 text-sm"
                                                placeholder="Min. 6 characters"
                                                required
                                                minLength={6}
                                                value={resetData.newPassword}
                                                onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="password"
                                                className="input-premium pl-14 text-sm"
                                                placeholder="Re-enter password"
                                                required
                                                minLength={6}
                                                value={resetData.confirmPassword}
                                                onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn-premium w-full flex items-center justify-center gap-3 py-4 mt-4"
                                    >
                                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Reset Password'}
                                        <Sparkles className="w-6 h-6" />
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <Link to="/login" className="text-slate-500 dark:text-slate-400 font-medium hover:text-indigo-600 inline-flex items-center gap-1 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
