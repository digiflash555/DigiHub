import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Calendar, QrCode, Download, MapPin, CheckCircle,
    Clock, AlertCircle, Cake, Sparkles, ArrowUpRight,
    Award, XCircle, ChevronRight, MessageSquare, Loader2, Users,
    DollarSign, Upload, FileText, X, Send, Minus, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import FeedbackModal from '../components/FeedbackModal';

const FacultyDashboard = ({ user }) => {
    const [inchargeEvents, setInchargeEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFacultyData = async () => {
        try {
            const inchargeRes = await axios.get(`/api/events/my-incharge`);
            setInchargeEvents(inchargeRes.data);
        } catch (error) {
            console.error('Failed to load faculty dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadCSV = () => {
        if (!students || students.length === 0) {
            toast.error('No students data to download');
            return;
        }

        const headers = ['Roll Number', 'Student Name', 'Registrations', 'Attendance', 'Participation Rate'];
        const csvContent = [
            headers.join(','),
            ...students.map(student => {
                const rate = student.registrationCount > 0
                    ? ((student.attendanceCount / student.registrationCount) * 100).toFixed(0) + '%'
                    : '0%';
                return [
                    `"${student.registrationNumber || 'N/A'}"`,
                    `"${student.username}"`,
                    student.registrationCount,
                    student.attendanceCount || 0,
                    `"${rate}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `Student_Performance_${user.assignedYear}_${user.assignedSection}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAttendance = async (eventId) => {
        try {
            const res = await axios.get(`/api/attendance/export/${eventId}`, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${eventId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download attendance');
        }
    };

    const downloadFeedback = async (eventId) => {
        try {
            const res = await axios.get(`/api/feedback/export/excel/${eventId}`, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `feedback_${eventId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download feedback');
        }
    };

    const downloadAttendancePDF = async (eventId) => {
        try {
            const res = await axios.post(`/api/attendance/export-pdf/${eventId}`, {}, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${eventId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download attendance PDF');
        }
    };

    const downloadFeedbackPDF = async (eventId) => {
        try {
            const res = await axios.get(`/api/feedback/export/pdf/${eventId}`, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `feedback_${eventId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download feedback PDF');
        }
    };

    const downloadRegistrationPDF = async (eventId) => {
        try {
            const res = await axios.post(`/api/registrations/export/pdf/${eventId}`, {}, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `registrations_${eventId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download registration PDF');
        }
    };

    useEffect(() => {
        fetchFacultyData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-slate-350" />
            </div>
        );
    }

    const getRoleLabel = () => {
        if (user.role === 'Class Coordinator') return 'Class Coordinator · Year ' + user.assignedYear + ', Section ' + user.assignedSection;
        if (user.role === 'Program Coordinator') return 'Program Coordinator · ' + user.department;
        return 'Faculty · ' + user.department;
    };

    const goToEvent = (id) => { window.location.href = '/events/' + id; };

    return (
        <div className="space-y-12 pb-40">
            {/* Header / Welcome */}
            <div className="bg-white dark:bg-[#20242B] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-8 dark:text-white">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-4xl font-black border border-indigo-100 dark:border-indigo-500/20 ring-8 ring-indigo-50/50">
                        {user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Welcome, {user.username}.</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {user.designation || 'Faculty'} · {getRoleLabel()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Events Content */}
            <div className="bg-white dark:bg-[#20242B] rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white">
                <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                    <div className="flex-1 py-5 text-sm font-black uppercase tracking-widest text-indigo-600 bg-white dark:bg-[#20242B] text-center relative dark:text-white">
                        My Events (Incharge)
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    </div>
                </div>

                <div className="p-8">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Events I'm In-Charge Of</h2>
                        {inchargeEvents.length === 0 ? (
                            <p className="text-slate-400 font-medium text-center py-12">You have not been assigned as coordinator for any event yet.</p>
                        ) : (
                            <div className="grid gap-5">
                                {inchargeEvents.map(ev => {
                                    const isFC = ev.facultyCoordinator?._id === user._id || ev.facultyCoordinator === user._id;
                                    return (
                                        <div key={ev._id} className="p-6 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl hover:bg-indigo-100 transition-colors group">
                                            <div className="flex items-center gap-6 cursor-pointer" onClick={() => goToEvent(ev._id)}>
                                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#20242B] flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-500/20 shrink-0 dark:text-white">
                                                    <Calendar className="w-7 h-7 text-indigo-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg truncate">{ev.title}</h3>
                                                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400 font-bold">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(ev.eventDate).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ev.venue}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className={
                                                        'px-3 py-1.5 rounded-full text-xs font-black border ' +
                                                        (ev.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        ev.status === 'Completed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-100')
                                                    }>{ev.status}</span>
                                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        {isFC ? 'Faculty Coord.' : 'Student Coord.'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-5 pt-5 border-t border-indigo-100/50 grid grid-cols-3 gap-3">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Attendance</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => downloadAttendance(ev._id)} className="flex-1 py-2 bg-white dark:bg-[#20242B] text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs shadow-sm border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                                            <Download className="w-3.5 h-3.5" /> Excel
                                                        </button>
                                                        <button onClick={() => downloadAttendancePDF(ev._id)} className="flex-1 py-2 bg-white dark:bg-[#20242B] text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs shadow-sm border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                                            <Download className="w-3.5 h-3.5" /> PDF
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Feedback</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => downloadFeedback(ev._id)} className="flex-1 py-2 bg-white dark:bg-[#20242B] text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs shadow-sm border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                                            <Download className="w-3.5 h-3.5" /> Excel
                                                        </button>
                                                        <button onClick={() => downloadFeedbackPDF(ev._id)} className="flex-1 py-2 bg-white dark:bg-[#20242B] text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs shadow-sm border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                                            <Download className="w-3.5 h-3.5" /> PDF
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest px-1">Registration</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => downloadRegistrationPDF(ev._id)} className="flex-1 py-2 bg-white dark:bg-[#20242B] text-amber-600 dark:text-amber-400 rounded-xl font-bold text-xs shadow-sm border border-amber-100 dark:border-amber-500/20 hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                                            <Download className="w-3.5 h-3.5" /> PDF
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [nominations, setNominations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReg, setSelectedReg] = useState(null);
    const [isBirthday, setIsBirthday] = useState(false);
    const [selectedFeedbackEvent, setSelectedFeedbackEvent] = useState(null);
    const [inchargeEvents, setInchargeEvents] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [latestUser, setLatestUser] = useState(null);
    const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
    const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);

    const downloadAttendance = async (eventId) => {
        try {
            const res = await axios.get(`/api/attendance/export/${eventId}`, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${eventId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download attendance');
        }
    };

    const downloadFeedback = async (eventId) => {
        try {
            const res = await axios.get(`/api/feedback/export/excel/${eventId}`, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `feedback_${eventId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download feedback');
        }
    };

    const downloadAttendancePDF = async (eventId) => {
        try {
            const res = await axios.post(`/api/attendance/export-pdf/${eventId}`, {}, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${eventId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download attendance PDF');
        }
    };

    const downloadFeedbackPDF = async (eventId) => {
        try {
            const res = await axios.get(`/api/feedback/export/pdf/${eventId}`, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `feedback_${eventId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download feedback PDF');
        }
    };

    const downloadRegistrationPDF = async (eventId) => {
        try {
            const res = await axios.post(`/api/registrations/export/pdf/${eventId}`, {}, {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `registrations_${eventId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download registration PDF');
        }
    };

    useEffect(() => {
        if (user?.dateOfBirth) {
            const today = new Date();
            const dob = new Date(user.dateOfBirth);
            const isTodayBirthday = today.getDate() === dob.getDate() && today.getMonth() === dob.getMonth();
            setIsBirthday(isTodayBirthday);
        }
    }, [user]);

    const fetchAssociationDetails = async () => {
        try {
            const [transRes, eventsRes, profileRes] = await Promise.all([
                axios.get(`/api/transactions/my`),
                axios.get(`/api/events`),
                axios.get(`/api/auth/profile`)
            ]);
            setTransactions(transRes.data);
            setAllEvents(eventsRes.data.filter(e => e.status !== 'Draft'));
            setLatestUser(profileRes.data);
        } catch (error) {
            console.error('Failed to fetch transaction data', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const requests = [
                    axios.get(`/api/registrations/my`),
                    axios.get(`/api/nominations`)
                ];
                // Also fetch incharge events for Association Members
                if (user?.role === 'Association Member') {
                    requests.push(axios.get(`/api/events/my-incharge`));
                }
                const results = await Promise.all(requests);
                setRegistrations(results[0].data);
                setNominations(results[1].data);
                if (user?.role === 'Association Member' && results[2]) {
                    setInchargeEvents(results[2].data);
                    await fetchAssociationDetails();
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSpendSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await axios.post(`/api/transactions/spend`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Expense claim submitted successfully!');
            setIsSpendModalOpen(false);
            await fetchAssociationDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit expense claim');
        }
    };

    const handleReimburseSubmit = async (e) => {
        e.preventDefault();
        const data = {
            amount: Number(e.currentTarget.amount.value),
            description: e.currentTarget.description.value
        };
        try {
            await axios.post(`/api/transactions/reimburse`, data);
            toast.success('Reimbursement recorded successfully!');
            setIsReimburseModalOpen(false);
            await fetchAssociationDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record reimbursement');
        }
    };

    const handleDownloadCertificate = async (regId) => {
        try {
            // Fetch validated data from the backend (eligibility check happens server-side)
            const { data } = await axios.get(`/api/certificates/data/${regId}`);
            const { downloadCertificateAsPDF } = await import('../utils/renderCertificateCanvas');
            await downloadCertificateAsPDF(
                data.participant,
                data.event,
                data.config,
                data.registrationId,
                `Certificate_${data.registrationId}.pdf`
            );
            toast.success('Certificate downloaded!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Certificate download failed');
        }
    };


    const downloadQRWithTemplate = (reg) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 1300;

        // Background gradient - DigiFlash theme (cyan to blue)
        const gradient = ctx.createLinearGradient(0, 0, 0, 1300);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#0891b2');
        gradient.addColorStop(1, '#0e7490');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 1300);

        // Main white card with shadow effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
        ctx.beginPath();
        ctx.roundRect(40, 40, 720, 1220, 40);
        ctx.fill();

        // Add subtle border with cyan theme
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Load and draw DigiflashLogo.png
        const logoImage = new Image();
        logoImage.crossOrigin = 'anonymous';
        logoImage.onload = () => {
            // Logo in top left
            ctx.drawImage(logoImage, 70, 70, 100, 100);

            // Department text - Bold and Centered (2 lines)
            ctx.fillStyle = '#0e7490';
            ctx.font = '900 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Department of', 400, 115);
            ctx.fillText('Computer Science and Engineering', 400, 150);

            // Decorative line with cyan theme
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(70, 180);
            ctx.lineTo(730, 180);
            ctx.stroke();

            // "WELCOME TO" header
            ctx.fillStyle = '#0891b2';
            ctx.font = '700 20px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '4px';
            ctx.fillText('WELCOME TO', 400, 230);

            // Event title
            ctx.fillStyle = '#0e7490';
            ctx.font = '900 56px Inter, sans-serif';
            const title = reg.event.title.toUpperCase();
            if (title.length > 25) {
                ctx.fillText(title.substring(0, 25), 400, 300);
                ctx.fillText(title.substring(25), 400, 365);
            } else {
                ctx.fillText(title, 400, 335);
            }

            // Info box with gradient background (cyan theme)
            const infoGradient = ctx.createLinearGradient(100, 400, 700, 400);
            infoGradient.addColorStop(0, '#ecfeff');
            infoGradient.addColorStop(1, '#cffafe');
            ctx.fillStyle = infoGradient;
            ctx.beginPath();
            ctx.roundRect(100, 400, 600, 140, 20);
            ctx.fill();

            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Venue and Date labels
            ctx.fillStyle = '#0891b2';
            ctx.font = '700 18px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('VENUE', 250, 445);
            ctx.fillText('DATE', 550, 445);

            // Venue and Date values
            ctx.fillStyle = '#0e7490';
            ctx.font = 'bold 30px Inter, sans-serif';
            ctx.fillText(reg.event.venue, 250, 495);
            ctx.fillText(new Date(reg.event.eventDate).toLocaleDateString(), 550, 495);

            // Optional decorative header (no participant details)
            ctx.fillStyle = '#ecfeff';
            ctx.beginPath();
            ctx.roundRect(100, 580, 600, 120, 20);
            ctx.fill();

            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.stroke();

            // If team event, display team name only
            if (reg.event?.isTeamEvent && reg.teamName) {
                ctx.fillStyle = '#0891b2';
                ctx.font = '700 16px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('TEAM NAME', 130, 610);

                ctx.fillStyle = '#0e7490';
                ctx.font = 'bold 26px Inter, sans-serif';
                ctx.fillText(reg.teamName, 130, 645);
            }

            // QR Code section
            const qrImage = new Image();
            qrImage.onload = () => {                // QR Code container with gradient background and subtle shadow
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;
                const qrGradient = ctx.createLinearGradient(200, 720, 600, 1120);
                qrGradient.addColorStop(0, '#ecfeff');
                qrGradient.addColorStop(1, '#cffafe');
                ctx.fillStyle = qrGradient;
                ctx.beginPath();
                ctx.roundRect(200, 720, 400, 400, 20);
                ctx.fill();
                ctx.restore();

                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 4;
                ctx.strokeRect(200, 720, 400, 400);

                // Motivation message placed above QR code
                const motivations = [
                    'Participate today, succeed tomorrow.',
                    'Every event is a new opportunity.',
                    'Show up and stand out.',
                    'Learning starts with participation.',
                    'Take part, take charge.',
                    'Your future begins here.',
                    'Dare to participate and grow.',
                    'Every experience adds value.',
                    'Success starts with involvement.',
                    'Join, learn, and excel.',
                    'Opportunities favor active minds.',
                    'Step in and shine.',
                    'Great journeys start small.',
                    'Participate to discover potential.',
                    'Learn beyond the classroom.',
                    'Growth comes from action.',
                    'Challenge yourself to improve.',
                    'Every event shapes success.',
                    'Be where opportunities happen.',
                    'Your next achievement awaits.',
                    'Attend today, lead tomorrow.',
                    'Learning never goes unnoticed.',
                    'Participate and make memories.',
                    'Build skills through experiences.',
                    'Every effort counts.'
                ];
                // Motivational quote placed above QR code
                const msg = motivations[Math.floor(Math.random() * motivations.length)];
                ctx.fillStyle = '#06b6d4';
                ctx.font = '800 22px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.save();
                // ctx.shadowColor = 'rgba(0, 157, 255, 0.61)';
                ctx.shadowBlur = 4;
                ctx.fillText(msg, 400, 650);
                ctx.restore();

                // Draw QR code
                ctx.drawImage(qrImage, 220, 740, 360, 360);

                // Registration ID
                ctx.fillStyle = '#06b6d4';
                ctx.font = '900 24px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`ID: ${reg.registrationId}`, 400, 1180);

                // Footer with welcome message and instructions - visible
                // ctx.fillStyle = '#0891b2';
                // ctx.font = '700 18px Inter, sans-serif';
                // ctx.fillText('Welcome to the event!', 400, 1220);

                ctx.fillStyle = '#0e7490';
                ctx.font = 'italic 16px Inter, sans-serif';
                ctx.fillText('Present this QR code at the entrance for verification', 400, 1220);

                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `EventPass-${reg.event.title}.png`;
                link.click();
            };
            qrImage.src = reg.qrCode;
        };
        logoImage.src = '/DigiflashLogo.png';
    };

    const getStatusSteps = (status) => {
        const steps = [
            { id: 1, label: 'Submitted', key: 'Pending Admin' },
            { id: 2, label: 'Admin Review', key: 'Pending Admin' },
            { id: 3, label: 'Final Decision', key: 'Approved' }
        ];

        let currentIdx = 0;
        if (status === 'Pending Admin') currentIdx = 1;
        else if (status === 'Approved' || status === 'Rejected') currentIdx = 2;

        return steps.map((step, idx) => ({
            ...step,
            isCompleted: idx < currentIdx || (status === 'Approved' && idx === 2),
            isCurrent: idx === currentIdx,
            isRejected: status === 'Rejected' && idx === 2
        }));
    };

    if (!user) return null;

    if (['Class Coordinator', 'Program Coordinator', 'Faculty'].includes(user.role)) {
        return <FacultyDashboard user={user} />;
    }

    return (
        <div className="space-y-12 pb-40">
            {/* Birthday Banner */}
            <AnimatePresence>
                {isBirthday && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-20"><Cake className="w-32 h-32" /></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm dark:text-white"><Cake className="w-10 h-10" /></div>
                            <div>
                                <h2 className="text-3xl font-black mb-2">Happy Birthday, {user.username}! 🎉</h2>
                                <p className="text-white/90 font-medium">Wishing you a fantastic day filled with joy and celebration!</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Intro */}
            <div className="bg-white dark:bg-[#20242B] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-8 dark:text-white">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 text-4xl font-black border border-primary-100 dark:border-primary-500/20 ring-8 ring-primary-50/50">
                        {user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Welcome, {user.username}.</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Here's what's happening on your journey.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <a href="/nominate" className="btn-premium flex items-center gap-3">
                        Nominate <Sparkles className="w-5 h-5 text-amber-300" />
                    </a>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Main Activities */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Incharge Events (for Association Members) */}
                    {user?.role === 'Association Member' && inchargeEvents.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Events I'm In-Charge Of</h2>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coordinator Role</span>
                            </div>
                            <div className="grid gap-5">
                                {inchargeEvents.map(ev => {
                                    const isFC = ev.facultyCoordinator?._id === user._id || ev.facultyCoordinator === user._id;
                                    return (
                                        <a key={ev._id} href={`/events/${ev._id}`} className="flex flex-col gap-6 p-6 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[2.5rem] hover:bg-indigo-100 transition-colors">
                                            <div className="flex items-center gap-6 w-full">
                                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#20242B] flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-500/20 shrink-0 dark:text-white">
                                                    <Calendar className="w-7 h-7 text-indigo-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg truncate">{ev.title}</h3>
                                                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400 font-bold">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(ev.eventDate).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ev.venue}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-black border ${ev.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ev.status === 'Completed' ? 'bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-100' }`}>{ev.status}</span>
                                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        {isFC ? 'Faculty Coord.' : 'Student Coord.'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full mt-5 pt-5 border-t border-indigo-100/50 grid grid-cols-3 gap-3">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Attendance</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadAttendance(ev._id); }}
                                                            className="flex-1 py-2 bg-white dark:bg-[#20242B] text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs shadow-sm border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Excel
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadAttendancePDF(ev._id); }}
                                                            className="flex-1 py-2 bg-white dark:bg-[#20242B] text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs shadow-sm border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> PDF
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Feedback</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFeedback(ev._id); }}
                                                            className="flex-1 py-2 bg-white dark:bg-[#20242B] text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs shadow-sm border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Excel
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFeedbackPDF(ev._id); }}
                                                            className="flex-1 py-2 bg-white dark:bg-[#20242B] text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs shadow-sm border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> PDF
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest px-1">Registration</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadRegistrationPDF(ev._id); }}
                                                            className="flex-1 py-2 bg-white dark:bg-[#20242B] text-amber-600 dark:text-amber-400 rounded-xl font-bold text-xs shadow-sm border border-amber-100 dark:border-amber-500/20 hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> PDF
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Expense Tracking & Reimbursement (for Association Members) */}
                    {user?.role === 'Association Member' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Expenses & Reimbursements</h2>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Balance</span>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] text-white flex flex-wrap justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 pointer-events-none dark:text-white" />
                                <div className="space-y-2 relative z-10">
                                    <p className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Pending Reimbursement Balance</p>
                                    <p className="text-5xl font-black">₹{(latestUser?.reimbursementBalance ?? user?.reimbursementBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="flex gap-4 relative z-10">
                                    <button
                                        onClick={() => setIsSpendModalOpen(true)}
                                        className="py-4 px-6 bg-white dark:bg-[#20242B] text-indigo-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-black rounded-2xl flex items-center gap-2 transition-all text-sm shadow-md dark:text-white"
                                    >
                                        <Plus className="w-4 h-4 text-indigo-900" /> Log Expense
                                    </button>
                                    <button
                                        onClick={() => setIsReimburseModalOpen(true)}
                                        className="py-4 px-6 bg-indigo-950/50 text-white border border-indigo-500 hover:bg-indigo-950 font-black rounded-2xl flex items-center gap-2 transition-all text-sm shadow-md"
                                    >
                                        <Minus className="w-4 h-4 text-indigo-400" /> Log Reimbursement
                                    </button>
                                </div>
                            </div>

                            {/* Recent Transactions List */}
                            <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm dark:text-white">
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg mb-6">Recent Ledger Entries</h3>
                                {transactions.length === 0 ? (
                                    <p className="text-slate-400 font-medium text-center py-8">No transaction history found.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Proof</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map(t => (
                                                    <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4 text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                                                        <td className="py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.type === 'Spent' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 dark:text-emerald-300 border border-emerald-100' }`}>{t.type}</span>
                                                        </td>
                                                        <td className="py-4 text-sm font-bold text-slate-900 dark:text-white">
                                                            <div>{t.description}</div>
                                                            {t.event && <div className="text-[10px] text-indigo-500 font-extrabold mt-0.5">Event: {t.event.title}</div>}
                                                        </td>
                                                        <td className={`py-4 text-sm font-black ${t.type === 'Spent' ? 'text-amber-600' : 'text-emerald-600' }`}>
                                                            {t.type === 'Spent' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-4 text-sm">
                                                            {t.proof ? (
                                                                <a
                                                                    href={getImageUrl(t.proof)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-indigo-650 hover:text-indigo-800 font-extrabold"
                                                                >
                                                                    <FileText className="w-4 h-4" /> View
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-300 font-medium">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Nomination Timeline (Always show for Participants/Assoc Members) */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">My Nominations</h2>
                            {nominations.length > 0 && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Application History</span>
                            )}
                        </div>
                        {nominations.length > 0 ? (
                            <div className="space-y-6">
                                {nominations.map(nom => (
                                    <div key={nom._id} className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm group dark:text-white">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                                    <Award className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-slate-900 dark:text-white">{nom.postAppliedFor}</h3>
                                                    <p className="text-sm text-slate-400 font-bold tracking-tighter">Submitted on {new Date(nom.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                                                <span className={`text-sm font-black ${nom.status === 'Approved' ? 'text-emerald-500' : nom.status === 'Rejected' ? 'text-red-500' : 'text-amber-500' }`}>
                                                    {nom.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Timeline */}
                                        <div className="relative">
                                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-[#20242B] -translate-y-1/2 rounded-full" />
                                            <div className="relative flex justify-between">
                                                {getStatusSteps(nom.status).map((step, idx) => (
                                                    <div key={idx} className="flex flex-col items-center gap-3 relative z-10">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ${step.isRejected ? 'bg-red-500 border-red-100 text-white' : step.isCompleted ? 'bg-emerald-500 border-emerald-100 text-white' : step.isCurrent ? 'bg-white border-primary-500 text-primary-600' : 'bg-white border-slate-100 dark:border-slate-800 text-slate-200' }`}>
                                                            {step.isCompleted ? <CheckCircle className="w-4 h-4" /> :
                                                                step.isRejected ? <XCircle className="w-4 h-4" /> :
                                                                    <div className="w-2 h-2 rounded-full bg-current" />}
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${step.isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400' }`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#20242B] p-20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center space-y-6 dark:text-white">
                                <Award className="w-16 h-16 text-slate-100 mx-auto" />
                                <h3 className="text-2xl font-black text-slate-300">No nominations submitted yet</h3>
                                <a href="/nominate" className="inline-flex btn-premium">Submit a Nomination</a>
                            </div>
                        )}
                    </div>

                    {/* Events List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">My Registrations</h2>
                            <a href="/events" className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline flex items-center gap-1">
                                Discover More <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-40 bg-slate-50 dark:bg-[#1a1d24] rounded-[2.5rem] animate-pulse"></div>)}
                            </div>
                        ) : registrations.length === 0 ? (
                            <div className="bg-white dark:bg-[#20242B] p-20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center space-y-6 dark:text-white">
                                <Calendar className="w-16 h-16 text-slate-100 mx-auto" />
                                <h3 className="text-2xl font-black text-slate-300">No events found</h3>
                                <a href="/events" className="inline-flex btn-premium">Browse Events</a>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {registrations.map((reg) => (
                                    <motion.div
                                        key={reg._id}
                                        whileHover={{ y: -5 }}
                                        className="bg-white dark:bg-[#20242B] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-8 group transition-all hover:shadow-xl hover:shadow-slate-100 dark:text-white"
                                    >
                                        <div className="flex gap-8 items-center">
                                            <div className="w-28 h-28 rounded-3xl overflow-hidden hidden sm:block shadow-lg">
                                                <img
                                                    src={getImageUrl(reg.event?.bannerImage, 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80')}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    alt=""
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{reg.event?.title || 'Unknown Event'}</h3>
                                                <div className="flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400 font-bold">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-primary-500" />
                                                        {reg.event?.eventDate ? new Date(reg.event.eventDate).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-primary-500" />
                                                        {reg.event?.venue || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {reg.attendanceStatus ? (
                                                        <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100 dark:border-emerald-500/20">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Attended
                                                        </span>
                                                    ) : (
                                                        <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-100 dark:border-amber-500/20">
                                                            <Clock className="w-3.5 h-3.5" /> Upcoming
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            <button
                                                onClick={() => setSelectedReg(reg)}
                                                className="flex-1 sm:flex-none py-3 px-6 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                            >
                                                <QrCode className="w-5 h-5" /> PASS
                                            </button>
                                            {reg.attendanceStatus && (
                                                <>
                                                    <button
                                                        onClick={() => handleDownloadCertificate(reg._id)}
                                                        disabled={reg.event?.feedbackForm?.length > 0 && !reg.feedbackSubmitted}
                                                        className={`flex-1 sm:flex-none py-3 px-6 font-black rounded-2xl flex items-center justify-center gap-2 transition-all ${(reg.event?.feedbackForm?.length > 0 && !reg.feedbackSubmitted) ? 'bg-slate-50 text-slate-300 cursor-not-allowed border-2 border-dashed' : 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-100' }`}
                                                    >
                                                        <Download className="w-5 h-5" /> CERT
                                                    </button>
                                                    {reg.event?.feedbackForm?.length > 0 && !reg.feedbackSubmitted && (
                                                        <button
                                                            onClick={() => setSelectedFeedbackEvent(reg.event)}
                                                            className="flex-1 sm:flex-none py-3 px-6 bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-100"
                                                        >
                                                            <MessageSquare className="w-5 h-5" /> FEEDBACK
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats / Info */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20"><Sparkles className="w-20 h-20" /></div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">E-Passport</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                                <div>
                                    <p className="text-2xl font-black">{registrations.length}</p>
                                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Events Joined</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-emerald-400">{registrations.filter(r => r.attendanceStatus).length}</p>
                                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Completed</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Role</p>
                                <p className="text-lg font-black text-primary-400">{user.role}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#20242B] rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 dark:text-white">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Next Generation Leadership.</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                            Your participation counts. Build your portfolio by attending events and taking on coordinator roles.
                        </p>
                        <div className="pt-4">
                            <a href="/events" className="w-full py-4 px-6 bg-slate-50 dark:bg-[#1a1d24] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all border border-slate-100 dark:border-slate-800">
                                Browse Events <ArrowUpRight className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Modal Overseas */}
            <AnimatePresence>
                {selectedReg && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedReg(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#20242B] p-12 rounded-[3.5rem] max-w-sm w-full text-center space-y-8 shadow-2xl relative dark:text-white"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="space-y-2 text-center">
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{selectedReg.event?.title || 'Event Pass'}</h3>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{selectedReg.event?.venue}</p>
                            </div>
                            <div className="bg-white dark:bg-[#20242B] p-8 rounded-[3rem] border-4 border-slate-50 inline-block shadow-lg relative dark:text-white">
                                <img src={selectedReg.qrCode} alt="Registration QR" className="w-64 h-64" />
                                <div className="absolute inset-0 bg-primary-500/5 pointer-events-none rounded-[2.8rem]" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Digital Ticket ID</p>
                                <p className="text-xl font-mono font-black text-slate-900 dark:text-white">{selectedReg.registrationId}</p>
                            </div>
                            <button
                                onClick={() => downloadQRWithTemplate(selectedReg)}
                                className="w-full py-5 bg-primary-600 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 hover:bg-primary-500 transition-all shadow-xl shadow-primary-200"
                            >
                                <Download className="w-6 h-6" /> SAVE TO GALLERY
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <FeedbackModal
                isOpen={!!selectedFeedbackEvent}
                onClose={() => setSelectedFeedbackEvent(null)}
                event={selectedFeedbackEvent}
            />

            {/* Log Spend Modal */}
            <AnimatePresence>
                {isSpendModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsSpendModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#20242B] p-8 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-250 dark:text-white"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setIsSpendModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Log Event Expense</h3>
                                    <p className="text-gray-500 font-medium">Inform admin of money spent for an event</p>
                                </div>
                            </div>

                            <form onSubmit={handleSpendSubmit} className="space-y-6">
                                {/* Prefilled Details */}
                                <div className="bg-slate-50 dark:bg-[#1a1d24] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitter Details (Prefilled)</p>
                                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                                        <div><span className="text-slate-400">Name:</span> {latestUser?.username || user?.username}</div>
                                        <div><span className="text-slate-400">Email:</span> {latestUser?.email || user?.email}</div>
                                        <div><span className="text-slate-400">Phone:</span> {latestUser?.phone || user?.phone || 'N/A'}</div>
                                        <div><span className="text-slate-400">Dept:</span> {latestUser?.department || user?.department || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Amount Spent (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="input-field"
                                        placeholder="0.00"
                                        name="amount"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Description / Purpose *</label>
                                    <textarea
                                        required
                                        className="input-field h-24"
                                        placeholder="Explain what the money was spent on (e.g. Purchased snacks, printouts, banner stand)..."
                                        name="description"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Associated Event (Optional)</label>
                                    <select className="input-field" name="event">
                                        <option value="">Select an Event</option>
                                        {allEvents.map(e => (
                                            <option key={e._id} value={e._id}>{e.title} ({new Date(e.eventDate).toLocaleDateString()})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Proof of Purchase (Receipt/File) *</label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-250 border-dashed rounded-2xl cursor-pointer bg-slate-50 dark:bg-[#1a1d24] hover:bg-slate-100/50 transition-all">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Click to upload proof file</p>
                                                <p className="text-xs text-slate-400">PDF, JPG, PNG, DOC (Max 10MB)</p>
                                            </div>
                                            <input type="file" required className="hidden" name="proof" />
                                        </label>
                                    </div>
                                </div>

                                <button type="submit" className="w-full btn-primary py-4 font-black text-lg flex items-center justify-center gap-2">
                                    Submit Expense Claim <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Log Reimbursement Modal */}
            <AnimatePresence>
                {isReimburseModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsReimburseModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#20242B] p-8 rounded-3xl max-w-md w-full shadow-2xl relative dark:text-white"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setIsReimburseModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-650">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Log Reimbursement</h3>
                                    <p className="text-gray-500 font-medium">Record money returned by Admin</p>
                                </div>
                            </div>

                            <form onSubmit={handleReimburseSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Amount Received (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="input-field"
                                        placeholder="0.00"
                                        name="amount"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Description / Notes</label>
                                    <textarea
                                        className="input-field h-24"
                                        placeholder="e.g., Cash received from Admin, Bank transfer received..."
                                        name="description"
                                    />
                                </div>

                                <button type="submit" className="w-full btn-primary py-4 font-black text-lg flex items-center justify-center gap-2">
                                    Deduct from Balance <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
