import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Settings, Save, Send, Eye, EyeOff, Loader2 } from 'lucide-react';

const ENCRYPTION_OPTIONS = ['TLS', 'SSL', 'None'];

const EmailConfig = () => {
    const [form, setForm] = useState({
        smtpHost: 'smtp-relay.brevo.com',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        encryption: 'TLS',
        senderName: 'Event Management System',
        senderEmail: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/email/config')
            .then(r => setForm(prev => ({ ...prev, ...r.data })))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            await axios.post('/api/email/config', form);
            toast.success('Configuration saved!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const test = async () => {
        setTesting(true);
        try {
            const res = await axios.post('/api/email/test');
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Test failed');
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Email Configuration</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure SMTP settings for Brevo or any other email provider.</p>
            </div>

            {/* Brevo Quick Start Guide */}
            <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 space-y-2">
                <h3 className="font-black text-indigo-700 dark:text-indigo-300 text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Brevo SMTP Quick Setup
                </h3>
                <ul className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1 font-medium">
                    <li>• Host: <code className="bg-indigo-100 dark:bg-indigo-800 px-1 rounded">smtp-relay.brevo.com</code></li>
                    <li>• Port: <code className="bg-indigo-100 dark:bg-indigo-800 px-1 rounded">587</code> (TLS) or <code className="bg-indigo-100 dark:bg-indigo-800 px-1 rounded">465</code> (SSL)</li>
                    <li>• Username: Your Brevo account email</li>
                    <li>• Password: Your Brevo SMTP Key (from Settings → SMTP & API)</li>
                </ul>
            </div>

            <div className="space-y-5">
                {/* SMTP Host & Port */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">SMTP Host</label>
                        <input value={form.smtpHost} onChange={e => set('smtpHost', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Port</label>
                        <input type="number" value={form.smtpPort} onChange={e => set('smtpPort', parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                        />
                    </div>
                </div>

                {/* Encryption */}
                <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Encryption</label>
                    <div className="flex gap-2">
                        {ENCRYPTION_OPTIONS.map(opt => (
                            <button key={opt} onClick={() => set('encryption', opt)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-black border transition-all ${
                                    form.encryption === opt
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                                }`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Username */}
                <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">SMTP Username</label>
                    <input value={form.smtpUsername} onChange={e => set('smtpUsername', e.target.value)}
                        placeholder="your@brevo-email.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">SMTP Password / API Key</label>
                    <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} value={form.smtpPassword} onChange={e => set('smtpPassword', e.target.value)}
                            placeholder="Your Brevo SMTP Key"
                            className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                        />
                        <button onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Sender Name & Email */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Sender Name</label>
                        <input value={form.senderName} onChange={e => set('senderName', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Sender Email</label>
                        <input type="email" value={form.senderEmail} onChange={e => set('senderEmail', e.target.value)}
                            placeholder="noreply@yourdomain.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button onClick={test} disabled={testing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-60">
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {testing ? 'Testing...' : 'Send Test Email'}
                    </button>
                    <button onClick={save} disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-lg">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailConfig;
