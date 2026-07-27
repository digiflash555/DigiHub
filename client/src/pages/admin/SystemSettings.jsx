import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Settings, Save, ChevronLeft, ToggleLeft, ToggleRight, Users, Calendar, Upload, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';


const SystemSettings = () => {
    const [settings, setSettings] = useState({
        nominationFormsEnabled: true,
        volunteerRestriction: 'upcoming_events_only',
        symposiumName: 'DIGIFLASH 2026',
        symposiumType: 'National Level Technical Symposium'
    });
    const [iicLogoFile, setIicLogoFile] = useState(null);
    const [iicLogoPreview, setIicLogoPreview] = useState('');
    const [digiflashLogoFile, setDigiflashLogoFile] = useState(null);
    const [digiflashLogoPreview, setDigiflashLogoPreview] = useState('');
    const [assocSignFile, setAssocSignFile] = useState(null);
    const [assocSignPreview, setAssocSignPreview] = useState('');
    const [hodSignFile, setHodSignFile] = useState(null);
    const [hodSignPreview, setHodSignPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/settings`);
            setSettings(res.data);
            if (res.data.iicLogo) {
                setIicLogoPreview(getImageUrl(res.data.iicLogo));
            }
            if (res.data.digiflashLogo) {
                setDigiflashLogoPreview(getImageUrl(res.data.digiflashLogo));
            }
            if (res.data.associationCoordinatorSign) {
                setAssocSignPreview(getImageUrl(res.data.associationCoordinatorSign));
            }
            if (res.data.hodSign) {
                setHodSignPreview(getImageUrl(res.data.hodSign));
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append('nominationFormsEnabled', settings.nominationFormsEnabled);
        formData.append('volunteerRestriction', settings.volunteerRestriction);
        formData.append('symposiumName', settings.symposiumName || '');
        formData.append('symposiumType', settings.symposiumType || '');

        if (iicLogoFile) {
            formData.append('iicLogo', iicLogoFile);
        }
        if (digiflashLogoFile) {
            formData.append('digiflashLogo', digiflashLogoFile);
        }
        if (assocSignFile) {
            formData.append('associationCoordinatorSign', assocSignFile);
        }
        if (hodSignFile) {
            formData.append('hodSign', hodSignFile);
        }

        try {
            const res = await axios.put(`/api/settings`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSettings(res.data);
            toast.success('Settings saved successfully');
            if (res.data.iicLogo) {
                setIicLogoPreview(getImageUrl(res.data.iicLogo));
            }
            if (res.data.digiflashLogo) {
                setDigiflashLogoPreview(getImageUrl(res.data.digiflashLogo));
            }
            if (res.data.associationCoordinatorSign) {
                setAssocSignPreview(getImageUrl(res.data.associationCoordinatorSign));
            }
            if (res.data.hodSign) {
                setHodSignPreview(getImageUrl(res.data.hodSign));
            }
            setIicLogoFile(null);
            setDigiflashLogoFile(null);
            setAssocSignFile(null);
            setHodSignFile(null);
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-40">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-[#20242B] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 dark:text-white">
                <div>
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-bold transition-colors text-sm mb-4">
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        System <span className="text-reveal">Settings.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                        Configure global system settings and permissions
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-premium flex items-center gap-3 px-8 py-4"
                >
                    {isSaving ? 'Saving...' : <Save className="w-6 h-6" />}
                    Save Changes
                </button>
            </div>

            {/* Settings Cards */}
            <div className="space-y-8">
                {/* Nomination Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#20242B] p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 dark:text-white"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-primary-50 dark:bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Settings className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Nomination Settings</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Control nomination form availability</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl">
                            <div className="flex items-center gap-4">
                                <Users className="w-6 h-6 text-slate-400" />
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white">Enable Nomination Forms</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Allow users to submit nomination forms</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, nominationFormsEnabled: !settings.nominationFormsEnabled })}
                                className={`relative w-16 h-8 rounded-full transition-colors ${settings.nominationFormsEnabled ? 'bg-primary-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white dark:bg-[#20242B] transition-transform ${settings.nominationFormsEnabled ? 'translate-x-8' : 'translate-x-1 dark:text-white'}`} />
                            </button>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <Calendar className="w-6 h-6 text-slate-400" />
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white">Volunteer Restriction</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Control who can volunteer for events</p>
                                </div>
                            </div>
                            <div className="space-y-3 mt-4">
                                <label className="flex items-center gap-3 p-4 bg-white dark:bg-[#20242B] rounded-xl cursor-pointer border-2 border-transparent hover:border-primary-200 transition-all dark:text-white">
                                    <input
                                        type="radio"
                                        name="restriction"
                                        value="all"
                                        checked={settings.volunteerRestriction === 'all'}
                                        onChange={(e) => setSettings({ ...settings, volunteerRestriction: e.target.value })}
                                        className="w-5 h-5 text-primary-600 dark:text-primary-400"
                                    />
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">All Users</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Allow eligible users to volunteer anytime</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-white dark:bg-[#20242B] rounded-xl cursor-pointer border-2 border-transparent hover:border-primary-200 transition-all dark:text-white">
                                    <input
                                        type="radio"
                                        name="restriction"
                                        value="upcoming_events_only"
                                        checked={settings.volunteerRestriction === 'upcoming_events_only'}
                                        onChange={(e) => setSettings({ ...settings, volunteerRestriction: e.target.value })}
                                        className="w-5 h-5 text-primary-600 dark:text-primary-400"
                                    />
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Upcoming Events Only</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Only allow volunteering for upcoming events</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Report Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-[#20242B] p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 dark:text-white"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Image className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">PDF Report & Header Settings</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Configure institutional headers and logos for all generated PDF reports (Attendance, Feedback, etc.)</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Symposium Name</label>
                            <input
                                type="text"
                                className="input-premium"
                                value={settings.symposiumName || ''}
                                onChange={(e) => setSettings({ ...settings, symposiumName: e.target.value })}
                                placeholder="e.g. DIGIFLASH 2026"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Symposium Type</label>
                            <input
                                type="text"
                                className="input-premium"
                                value={settings.symposiumType || ''}
                                onChange={(e) => setSettings({ ...settings, symposiumType: e.target.value })}
                                placeholder="e.g. National Level Technical Symposium"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 pt-4">
                        {/* IIC Logo */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Institution Innovation Council (IIC) Logo</label>
                            <div className="flex items-center gap-6">
                                {iicLogoPreview ? (
                                    <div className="w-24 h-24 rounded-2xl border bg-white dark:bg-[#20242B] p-2 overflow-hidden flex items-center justify-center shrink-0 dark:text-white">
                                        <img src={iicLogoPreview} className="w-full h-full object-contain" alt="IIC Logo Preview" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1a1d24] text-slate-400 shrink-0">
                                        <Image className="w-8 h-8" />
                                        <span className="text-[10px] font-bold">No logo</span>
                                    </div>
                                )}
                                <label className="flex-1 py-3 px-4 bg-slate-50 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                                    <Upload className="w-4 h-4 text-slate-400" />
                                    {iicLogoFile ? 'Change File' : 'Upload Logo'}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setIicLogoFile(file);
                                                setIicLogoPreview(URL.createObjectURL(file));
                                            }
                                        }} 
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Digiflash Logo */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Digiflash Logo</label>
                            <div className="flex items-center gap-6">
                                {digiflashLogoPreview ? (
                                    <div className="w-24 h-24 rounded-2xl border bg-white dark:bg-[#20242B] p-2 overflow-hidden flex items-center justify-center shrink-0 dark:text-white">
                                        <img src={digiflashLogoPreview} className="w-full h-full object-contain" alt="Digiflash Logo Preview" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1a1d24] text-slate-400 shrink-0">
                                        <Image className="w-8 h-8" />
                                        <span className="text-[10px] font-bold">No logo</span>
                                    </div>
                                )}
                                <label className="flex-1 py-3 px-4 bg-slate-50 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                                    <Upload className="w-4 h-4 text-slate-400" />
                                    {digiflashLogoFile ? 'Change File' : 'Upload Logo'}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setDigiflashLogoFile(file);
                                                setDigiflashLogoPreview(URL.createObjectURL(file));
                                            }
                                        }} 
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Association Coordinator Sign */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Association Coordinator Sign</label>
                            <div className="flex items-center gap-6">
                                {assocSignPreview ? (
                                    <div className="w-24 h-24 rounded-2xl border bg-white dark:bg-[#20242B] p-2 overflow-hidden flex items-center justify-center shrink-0 dark:text-white">
                                        <img src={assocSignPreview} className="w-full h-full object-contain" alt="Assoc Sign Preview" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1a1d24] text-slate-400 shrink-0">
                                        <Image className="w-8 h-8" />
                                        <span className="text-[10px] font-bold">No sign</span>
                                    </div>
                                )}
                                <label className="flex-1 py-3 px-4 bg-slate-50 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                                    <Upload className="w-4 h-4 text-slate-400" />
                                    {assocSignFile ? 'Change File' : 'Upload Sign'}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setAssocSignFile(file);
                                                setAssocSignPreview(URL.createObjectURL(file));
                                            }
                                        }} 
                                    />
                                </label>
                            </div>
                        </div>

                        {/* HOD Sign */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">HOD Sign</label>
                            <div className="flex items-center gap-6">
                                {hodSignPreview ? (
                                    <div className="w-24 h-24 rounded-2xl border bg-white dark:bg-[#20242B] p-2 overflow-hidden flex items-center justify-center shrink-0 dark:text-white">
                                        <img src={hodSignPreview} className="w-full h-full object-contain" alt="HOD Sign Preview" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1a1d24] text-slate-400 shrink-0">
                                        <Image className="w-8 h-8" />
                                        <span className="text-[10px] font-bold">No sign</span>
                                    </div>
                                )}
                                <label className="flex-1 py-3 px-4 bg-slate-50 dark:bg-[#1a1d24] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors">
                                    <Upload className="w-4 h-4 text-slate-400" />
                                    {hodSignFile ? 'Change File' : 'Upload Sign'}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setHodSignFile(file);
                                                setHodSignPreview(URL.createObjectURL(file));
                                            }
                                        }} 
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SystemSettings;
