import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
    QrCode, CheckCircle2, XCircle, 
    Search, Loader2, Calendar, ShieldCheck, 
    Zap, ArrowLeft, FileSpreadsheet, FileText,
    Download, ScanLine, UserCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const AttendanceScanner = () => {
    const { user } = useAuth();
    const [scanResult, setScanResult] = useState(null);
    const [manualId, setManualId] = useState('');
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDownloading, setIsDownloading] = useState('');
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [isScannerActive, setIsScannerActive] = useState(true);
    const scannerRef = useRef(null);
    const selectedEventRef = useRef('');
    const isProcessingRef = useRef(false);

    useEffect(() => {
        selectedEventRef.current = selectedEvent;
        if (selectedEvent) fetchStats(selectedEvent);
        else setAttendanceStats(null);
    }, [selectedEvent]);

    useEffect(() => {
        isProcessingRef.current = isProcessing;
    }, [isProcessing]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(`/api/events`);
                setEvents(res.data.filter(e => e.status !== 'Cancelled'));
            } catch {
                toast.error('Failed to load events');
            }
        };
        fetchEvents();
    }, []);

    const fetchStats = async (eventId) => {
        try {
            const res = await axios.get(`/api/attendance/report/${eventId}`);
            setAttendanceStats(res.data);
        } catch { /* ignore */ }
    };

    const stopScanner = useCallback(() => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
            scannerRef.current = null;
        }
    }, []);

    const startScanner = useCallback(() => {
        if (scannerRef.current) return;

        const scanner = new Html5QrcodeScanner('reader', {
            qrbox: { width: 280, height: 280 },
            fps: 10,
            rememberLastUsedCamera: true,
        }, false);

        scanner.render(onScanSuccess, () => {});
        scannerRef.current = scanner;
    }, [selectedEvent]);

    useEffect(() => {
        stopScanner();
        if (isScannerActive) {
            const timer = setTimeout(startScanner, 300);
            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        }
    }, [selectedEvent, startScanner, stopScanner, isScannerActive]);

    useEffect(() => () => stopScanner(), [stopScanner]);

    const handleMarkAttendance = async (regId, eventIdFromQr = null) => {
        const eventId = eventIdFromQr || selectedEvent;

        if (!eventId) {
            toast.error('Please select an event first');
            return;
        }

        if (!regId || !regId.trim()) {
            toast.error('Invalid registration ID');
            return;
        }

        setIsProcessing(true);

        try {
            const res = await axios.post(`/api/attendance/mark`, {
                registrationId: regId.trim(),
                eventId
            });
            setScanResult({ success: true, ...res.data });
            toast.success('Attendance recorded!');
            setManualId('');
            fetchStats(eventId);
        } catch (error) {
            const message = error.response?.data?.message || 'Verification failed';
            setScanResult({ success: false, message });
            toast.error(message);
        } finally {
            setIsProcessing(false);
            setTimeout(() => {
                setScanResult(null);
            }, 4000);
        }
    };

    const onScanSuccess = (decodedText) => {
        if (isProcessingRef.current) return;

        try {
            let regId = decodedText;
            let eventIdFromQr = null;

            try {
                const data = JSON.parse(decodedText);
                
                if (data.r && data.e) {
                    regId = data.r;
                    eventIdFromQr = data.e;
                } else if (data.registrationId) {
                    regId = data.registrationId;
                    eventIdFromQr = data.eventId;
                }

                if (eventIdFromQr && !selectedEventRef.current) {
                    setSelectedEvent(eventIdFromQr);
                }
            } catch {
                // Plain registration ID string
            }

            const effectiveEventId = eventIdFromQr || selectedEventRef.current;
            if (!effectiveEventId) {
                toast.error('Select an event or scan a valid event QR code');
                return;
            }

            handleMarkAttendance(regId, effectiveEventId);
        } catch {
            toast.error('Invalid scan data');
        }
    };

    const handleDownloadExcel = async () => {
        if (!selectedEvent) return toast.error('Select an event first');
        setIsDownloading('excel');
        try {
            const res = await axios.get(`/api/attendance/export/${selectedEvent}`, {
                responseType: 'blob'
            });
            const eventTitle = events.find(e => e._id === selectedEvent)?.title || 'Event';
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Attendance_${eventTitle.replace(/\s/g, '_')}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Attendance sheet downloaded!');
        } catch {
            toast.error('Download failed');
        } finally {
            setIsDownloading('');
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedEvent) return toast.error('Select an event first');
        const eventTitle = events.find(e => e._id === selectedEvent)?.title || 'Event';
        setIsDownloading('pdf');
        try {
            const res = await axios.post(`/api/attendance/export-pdf/${selectedEvent}`, {
                header: `${eventTitle} — Attendance Report`,
                columns: ['S.No', 'Name', 'Reg Number', 'Email', 'Status', 'Time']
            }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Attendance_${eventTitle.replace(/\s/g, '_')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('PDF report downloaded!');
        } catch {
            toast.error('PDF download failed');
        } finally {
            setIsDownloading('');
        }
    };

    const handleDownloadFeedbackForm = async () => {
        if (!selectedEvent) return toast.error('Select an event first');
        const eventTitle = events.find(e => e._id === selectedEvent)?.title || 'Event';
        setIsDownloading('feedback');
        try {
            const res = await axios.get(`/api/feedback/export/pdf/${selectedEvent}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Feedback_${eventTitle.replace(/\s/g, '_')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Feedback form downloaded!');
        } catch {
            toast.error('Feedback download failed');
        } finally {
            setIsDownloading('');
        }
    };

    return (
        <div className="space-y-12 pb-40">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
                <div className="space-y-4">
                    <Link to={user?.role === 'Admin' ? '/admin/dashboard' : '/dashboard'} className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight flex items-center gap-4">
                        Access <span className="text-reveal">Control.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-md">
                        Scan QR codes to authenticate participants instantly. 
                    </p>
                </div>
                <button 
                    onClick={() => setIsScannerActive(!isScannerActive)}
                    className={`px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl transition-all ${ isScannerActive ? 'bg-slate-900 text-white hover:bg-slate-800 border-2 border-transparent' : 'bg-white text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50' }`}
                >
                    <div className={`w-2 h-2 rounded-full ${ isScannerActive ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-300' }`}></div>
                    <span className={`text-xs font-black uppercase tracking-widest ${ isScannerActive ? 'text-emerald-400' : 'text-slate-500' }`}>
                        {isScannerActive ? 'Scanner Online' : 'Scanner Offline'}
                    </span>
                </button>
            </header>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Side: Stats and Controls */}
                <div className="lg:col-span-5 space-y-8 flex flex-col">
                    
                    {/* Glassmorphic Event Selector */}
                    <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden dark:text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full"></div>
                        <div className="space-y-4 relative z-10">
                            <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                                <Calendar className="w-4 h-4 text-indigo-500" /> Active Session
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-[#1a1d24] border-2 border-transparent hover:border-indigo-100 focus:border-indigo-500 rounded-2xl appearance-none outline-none transition-all font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                                    value={selectedEvent}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                >
                                    <option value="" className="text-slate-400">Auto-detect from QR...</option>
                                    {events.map(event => (
                                        <option key={event._id} value={event._id}>{event.title}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    ▼
                                </div>
                            </div>
                        </div>

                        {attendanceStats && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800"
                            >
                                {[
                                    { label: 'Expected', value: attendanceStats.total, color: 'text-slate-400' },
                                    { label: 'Scanned', value: attendanceStats.count, color: 'text-indigo-600' },
                                    { label: 'Yield', value: `${attendanceStats.percentage}%`, color: 'text-emerald-500' },
                                ].map(stat => (
                                    <div key={stat.label} className="text-center">
                                        <p className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">{stat.label}</p>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Manual Entry */}
                    <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex-1 dark:text-white">
                        <div className="space-y-6 h-full flex flex-col justify-center">
                            <div className="space-y-1">
                                <label className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" /> Manual Override
                                </label>
                                <p className="text-xs text-slate-400 font-medium">Input Registration ID or Roll Number</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="relative w-full">
                                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-[#1a1d24] border-2 border-transparent focus:border-slate-300 rounded-2xl outline-none font-medium transition-all"
                                        placeholder="e.g. REG-1024"
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleMarkAttendance(manualId)}
                                    />
                                </div>
                                <button 
                                    onClick={() => handleMarkAttendance(manualId)}
                                    disabled={isProcessing || !manualId}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 transition-all font-bold flex items-center justify-center gap-2"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Export Actions */}
                    {selectedEvent && (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDownloadExcel}
                                disabled={isDownloading === 'excel'}
                                className="w-full flex items-center justify-between px-6 py-4 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-2xl font-bold transition-colors group border border-emerald-100 dark:border-emerald-500/20"
                            >
                                <span className="flex items-center gap-3">
                                    {isDownloading === 'excel' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5 text-emerald-500" />}
                                    Export Excel Report
                                </span>
                                <Download className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0" />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isDownloading === 'pdf'}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-2xl font-bold transition-colors border border-rose-100 dark:border-rose-500/20"
                                >
                                    {isDownloading === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-rose-500" />}
                                    Attendance PDF
                                </button>
                                <button
                                    onClick={handleDownloadFeedbackForm}
                                    disabled={isDownloading === 'feedback'}
                                    className="flex items-center justify-center gap-2 px-4 py-4 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 text-violet-700 dark:text-violet-300 rounded-2xl font-bold transition-colors border border-violet-100 dark:border-violet-500/20"
                                >
                                    {isDownloading === 'feedback' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-violet-500" />}
                                    Feedback PDF
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: High-Tech Scanner Container */}
                <div className="lg:col-span-7 relative flex flex-col">
                    <div className="flex-1 bg-slate-900 rounded-[3rem] overflow-hidden relative shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border-[10px] border-slate-800 flex items-center justify-center group min-h-[500px]">
                        
                        {isScannerActive ? (
                            <>
                                {/* UI Overlay for Scanner */}
                                <div className="absolute inset-0 pointer-events-none z-10">
                                    {/* Scanning Laser Line */}
                                    <motion.div 
                                        animate={{ top: ["0%", "100%", "0%"] }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                        className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] opacity-70"
                                    />
                                    
                                    {/* Targeting Brackets */}
                                    <div className="absolute inset-12 border-2 border-white/10 flex justify-between">
                                        <div className="w-16 h-16 border-l-4 border-t-4 border-emerald-400 absolute top-0 left-0 -ml-1 -mt-1 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="w-16 h-16 border-r-4 border-t-4 border-emerald-400 absolute top-0 right-0 -mr-1 -mt-1 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="w-16 h-16 border-l-4 border-b-4 border-emerald-400 absolute bottom-0 left-0 -ml-1 -mb-1 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="w-16 h-16 border-r-4 border-b-4 border-emerald-400 absolute bottom-0 right-0 -mr-1 -mb-1 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white/80 text-xs font-bold flex items-center gap-2">
                                        <ScanLine className="w-4 h-4" /> Align QR Code within frame
                                    </div>
                                </div>

                                <div id="reader" className="w-full h-full [&>img]:hidden [&>video]:object-cover [&>video]:h-full [&>video]:w-full relative z-0"></div>
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10 border-2 border-dashed border-slate-700 m-4 rounded-[2rem]">
                                <ScanLine className="w-20 h-20 text-slate-700 dark:text-slate-200 mb-6" />
                                <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-sm">Scanner is offline</p>
                                <p className="text-slate-600 dark:text-slate-300 font-medium mt-2 max-w-xs text-center text-xs">Enable scan mode to use the camera, or use the manual override.</p>
                                <button 
                                    onClick={() => setIsScannerActive(true)}
                                    className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:-translate-y-1"
                                >
                                    Enable Scanner
                                </button>
                            </div>
                        )}
                        
                        {isProcessing && (
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-indigo-500/30 rounded-full"></div>
                                    <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                    <ShieldCheck className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-white font-black uppercase tracking-widest mt-6 animate-pulse">Authenticating...</p>
                            </div>
                        )}
                    </div>

                    {/* Scan Results Floating Notification */}
                    <AnimatePresence>
                        {scanResult && (
                            <motion.div 
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                                className="absolute bottom-10 left-10 right-10 z-30"
                            >
                                <div className={`p-6 rounded-[2rem] shadow-2xl backdrop-blur-xl border ${ scanResult.success ? 'bg-emerald-900/90 border-emerald-500/50' : 'bg-rose-900/90 border-rose-500/50' }`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-inner ${ scanResult.success ? 'bg-emerald-500 shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-400/50' }`}>
                                            {scanResult.success ? <UserCheck className="w-8 h-8 text-white" /> : <AlertTriangle className="w-8 h-8 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-2xl font-black text-white truncate mb-1">
                                                {scanResult.success ? scanResult.participant : 'Authentication Failed'}
                                            </h3>
                                            <p className={`font-medium ${scanResult.success ? 'text-emerald-200' : 'text-rose-200'}`}>
                                                {scanResult.success ? 'Identity verified & attendance marked' : scanResult.message}
                                            </p>
                                        </div>
                                    </div>
                                    {scanResult.success && scanResult.members && scanResult.members.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-emerald-800/50 flex flex-wrap gap-2">
                                            {scanResult.members.map(member => (
                                                <span key={member} className="px-3 py-1 bg-emerald-950/50 border border-emerald-700/50 rounded-full text-emerald-100 text-xs font-bold">
                                                    {member}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AttendanceScanner;
