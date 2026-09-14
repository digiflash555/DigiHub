import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, TrendingUp, Mail, CheckCircle, XCircle, Zap, Users } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#ef4444', '#f59e0b'];

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
    <div className={`p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#20242B] space-y-2 hover:shadow-md transition-all`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
);

const EmailStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/email/stats')
            .then(r => setStats(r.data))
            .catch(() => toast.error('Failed to load statistics'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;
    if (!stats) return null;

    const { summary, chartData } = stats;

    const pieData = [
        { name: 'Sent', value: summary.sent },
        { name: 'Failed', value: summary.failed },
    ];

    const successRate = summary.total > 0 ? ((summary.sent / summary.total) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Email Statistics</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Total Sent" value={summary.sent} icon={CheckCircle} color="bg-emerald-500" />
                <StatCard label="Total Failed" value={summary.failed} icon={XCircle} color="bg-red-500" />
                <StatCard label="Success Rate" value={`${successRate}%`} icon={TrendingUp} color="bg-indigo-500" />
                <StatCard label="Manual Emails" value={summary.manual} icon={Mail} color="bg-blue-500" />
                <StatCard label="Automatic Emails" value={summary.auto} icon={Zap} color="bg-violet-500" />
                <StatCard label="Total Emails" value={summary.total} icon={Users} color="bg-amber-500" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#20242B] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">Email Volume (Last 30 Days)</h3>
                    {chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-bold">No data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Area type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2} fill="url(#colorSent)" name="Sent" />
                                <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="url(#colorFailed)" name="Failed" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie Chart */}
                <div className="bg-white dark:bg-[#20242B] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">Send Status</h3>
                    {summary.total === 0 ? (
                        <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-bold">No data yet</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                        dataKey="value" paddingAngle={3}>
                                        {pieData.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-2">
                                {pieData.map((item, i) => (
                                    <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                            <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                                        </div>
                                        <span className="text-slate-900 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailStats;
