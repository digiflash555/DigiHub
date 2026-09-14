import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Mail, PenSquare, Clock, Send, History,
    Layout, Settings, BarChart2, FileText, ArrowLeft
} from 'lucide-react';

const navItems = [
    { to: '/admin/email/compose',    label: 'Compose',    icon: PenSquare },
    { to: '/admin/email/drafts',     label: 'Drafts',     icon: FileText },
    { to: '/admin/email/scheduled',  label: 'Scheduled',  icon: Clock },
    { to: '/admin/email/sent',       label: 'Sent',       icon: Send },
    { to: '/admin/email/history',    label: 'History',    icon: History },
    { to: '/admin/email/templates',  label: 'Auto Templates', icon: Layout },
    { to: '/admin/email/stats',      label: 'Statistics', icon: BarChart2 },
    { to: '/admin/email/config',     label: 'Config',     icon: Settings },
];

const EmailLayout = () => {
    const navigate = useNavigate();
    return (
        <div className="flex min-h-[80vh] gap-0 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-[#20242B]">
            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 bg-slate-50 dark:bg-[#1a1d24] border-r border-slate-100 dark:border-slate-800 flex flex-col py-6 px-3 gap-1">
                <div className="flex items-center gap-3 px-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Mail className="w-5 h-5" />
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-white">Email Hub</span>
                </div>
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-[#20242B] hover:text-slate-900 dark:hover:text-white'
                            }`
                        }
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                <Outlet />
            </div>
        </div>
    );
};

export default EmailLayout;
