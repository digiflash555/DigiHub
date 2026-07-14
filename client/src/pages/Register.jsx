import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Building2, ArrowRight, Loader2, ChevronRight, Sparkles, Phone, FileText, Tag, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        registrationNumber: '',
        phone: '',
        bio: '',
        skills: '',
        dateOfBirth: '',
        gender: 'Male',
        yearAndDept: 'I B.E. CSE',
        section: 'A',
        securityQuestions: {
            bestFriendName: '',
            favoriteColor: '',
            favoriteHero: ''
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('securityQuestions.')) {
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                securityQuestions: {
                    ...formData.securityQuestions,
                    [field]: value
                }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Convert skills string to array
            const submitData = {
                ...formData,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
            };
            const response = await axios.post(`/api/auth/register`, submitData);
            // Server returns flat user object with token
            login(response.data);
            toast.success('Account created! Welcome aboard 🎉');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
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
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Join as a Participant and explore events.</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-widest">
                        Participant Registration
                    </div>
                </div>

                <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 dark:text-white">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                <div className="relative">

                                    <input
                                        type="text"
                                        name="username"
                                        className="input-premium pl-14"
                                        placeholder="Murugan"
                                        required
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Student / Reg ID</label>
                                <div className="relative">

                                    <input
                                        type="text"
                                        name="registrationNumber"
                                        className="input-premium pl-14"
                                        placeholder="ST12345 (optional)"
                                        value={formData.registrationNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Date of Birth</label>
                                <div className="relative">

                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        className="input-premium pl-14"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                                <div className="relative">
                                    <select
                                        name="gender"
                                        className="input-premium pl-4"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Year & Dept</label>
                                <div className="relative">
                                    <select
                                        name="yearAndDept"
                                        className="input-premium pl-4"
                                        value={formData.yearAndDept}
                                        onChange={handleChange}
                                    >
                                        <option value="I B.E. CSE">I B.E. CSE</option>
                                        <option value="II B.E. CSE">II B.E. CSE</option>
                                        <option value="III B.E. CSE">III B.E. CSE</option>
                                        <option value="IV B.E. CSE">IV B.E. CSE</option>


                                        <option value="I B.E. ECE">I B.E. ECE</option>
                                        <option value="II B.E. ECE">II B.E. ECE</option>
                                        <option value="III B.E. ECE">III B.E. ECE</option>
                                        <option value="IV B.E. ECE">IV B.E. ECE</option>


                                        <option value="I B.E. EEE">I B.E. EEE</option>
                                        <option value="II B.E. EEE">II B.E. EEE</option>
                                        <option value="III B.E. EEE">III B.E. EEE</option>
                                        <option value="IV B.E. EEE">IV B.E. EEE</option>


                                        <option value="I B.E. Mechanical">I B.E. Mechanical</option>
                                        <option value="II B.E. Mechanical">II B.E. Mechanical</option>
                                        <option value="III B.E. Mechanical">III B.E. Mechanical</option>
                                        <option value="IV B.E. Mechanical">IV B.E. Mechanical</option>


                                        <option value="I B.E. Civil">I B.E. Civil</option>
                                        <option value="II B.E. Civil">II B.E. Civil</option>
                                        <option value="III B.E. Civil">III B.E. Civil</option>
                                        <option value="IV B.E. Civil">IV B.E. Civil</option>


                                        <option value="I B.Tech. IT">I B.Tech. IT</option>
                                        <option value="II B.Tech. IT">II B.Tech. IT</option>
                                        <option value="III B.Tech. IT">III B.Tech. IT</option>
                                        <option value="IV B.Tech. IT">IV B.Tech. IT</option>


                                        <option value="I B.Tech. AI&DS">I B.Tech. AI&DS</option>
                                        <option value="II B.Tech. AI&DS">II B.Tech. AI&DS</option>
                                        <option value="III B.Tech. AI&DS">III B.Tech. AI&DS</option>
                                        <option value="IV B.Tech. AI&DS">IV B.Tech. AI&DS</option>


                                        <option value="I B.E. Mechatronics">I B.E. Mechatronics</option>
                                        <option value="II B.E. Mechatronics">II B.E. Mechatronics</option>
                                        <option value="III B.E. Mechatronics">III B.E. Mechatronics</option>
                                        <option value="IV B.E. Mechatronics">IV B.E. Mechatronics</option>


                                        <option value="I B.E. AIML(CSE)">I B.E. AIML(CSE)</option>
                                        <option value="II B.E. AIML(CSE)">II B.E. AIML(CSE)</option>
                                        <option value="III B.E. AIML(CSE)">III B.E. AIML(CSE)</option>
                                        <option value="IV B.E. AIML(CSE)">IV B.E. AIML(CSE)</option>


                                        <option value="I B.E. ACT">I B.E. ACT</option>
                                        <option value="II B.E. ACT">II B.E. ACT</option>
                                        <option value="III B.E. ACT">III B.E. ACT</option>
                                        <option value="IV B.E. ACT">IV B.E. ACT</option>

                                        <option value="I B.E. AUTO">I B.E. AUTO</option>
                                        <option value="II B.E. AUTO">II B.E. AUTO</option>
                                        <option value="III B.E. AUTO">III B.E. AUTO</option>
                                        <option value="IV B.E. AUTO">IV B.E. AUTO</option>

                                        <option value="I B.E. VLSI">I B.E. VLSI</option>
                                        <option value="II B.E. VLSI">II B.E. VLSI</option>
                                        <option value="III B.E. VLSI">III B.E. VLSI</option>
                                        <option value="IV B.E. VLSI">IV B.E. VLSI</option>

                                        <option value="I B.E. CYBER(CSE)">I B.E. CYBER(CSE)</option>
                                        <option value="II B.E. CYBER(CSE)">II B.E. CYBER(CSE)</option>
                                        <option value="III B.E. CYBER(CSE)">III B.E. CYBER(CSE)</option>
                                        <option value="IV B.E. CYBER(CSE)">IV B.E. CYBER(CSE)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Class Section</label>
                                <div className="relative">
                                    <select
                                        name="section"
                                        className="input-premium pl-4"
                                        value={formData.section}
                                        onChange={handleChange}
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="Nil">None</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                            <div className="relative">

                                <input
                                    type="email"
                                    name="email"
                                    className="input-premium pl-14"
                                    placeholder="name@example.com"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Password</label>
                            <div className="relative">

                                <input
                                    type="password"
                                    name="password"
                                    className="input-premium pl-14"
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                            <div className="relative">

                                <input
                                    type="tel"
                                    name="phone"
                                    className="input-premium pl-14"
                                    placeholder="+1 234 567 8900"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Bio</label>
                            <div className="relative">

                                <textarea
                                    name="bio"
                                    className="input-premium pl-14 h-24 resize-none"
                                    placeholder="Tell us about yourself..."
                                    maxLength={500}
                                    value={formData.bio}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Skills</label>
                            <div className="relative">

                                <input
                                    type="text"
                                    name="skills"
                                    className="input-premium pl-14"
                                    placeholder="JavaScript, React, Python (comma separated)"
                                    value={formData.skills}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Security Questions Section */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-4">

                                <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Security Questions</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">These answers will be encrypted and used for password recovery. Please remember them.</p>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Best Friend's Name</label>
                                    <input
                                        type="text"
                                        name="securityQuestions.bestFriendName"
                                        className="input-premium text-sm"
                                        placeholder="Enter in one word"
                                        required
                                        value={formData.securityQuestions.bestFriendName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Favorite Color</label>
                                    <input
                                        type="text"
                                        name="securityQuestions.favoriteColor"
                                        className="input-premium text-sm"
                                        placeholder="Enter in one word"
                                        required
                                        value={formData.securityQuestions.favoriteColor}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Favorite Hero Name</label>
                                    <input
                                        type="text"
                                        name="securityQuestions.favoriteHero"
                                        className="input-premium text-sm"
                                        placeholder="Enter in one word"
                                        required
                                        value={formData.securityQuestions.favoriteHero}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-premium w-full flex items-center justify-center gap-3 py-4 text-lg mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Create Participant Account
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-black hover:underline inline-flex items-center gap-1 group">
                                Sign In <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </p>
                        <p className="text-xs text-slate-400 mt-4 font-medium">
                            Admin or Association Member? Use your credentials on the Login page.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
