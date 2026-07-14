import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
    Download, Users, CheckCircle, XCircle,
    Calendar, Search, Loader2, FileSpreadsheet, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


const AttendanceRecords = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [records, setRecords] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(`/api/events`);
                setEvents(res.data);
            } catch {
                toast.error('Failed to load events');
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (!selectedEvent) {
            setRecords(null);
            return;
        }

        const fetchRecords = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get(`/api/attendance/records/${selectedEvent}`);
                setRecords(res.data);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load attendance records');
                setRecords(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecords();
    }, [selectedEvent]);

    const handleExport = async () => {
        if (!selectedEvent) return;
        setIsExporting(true);
        try {
            const res = await axios.get(`/api/attendance/export/${selectedEvent}`, {
                responseType: 'blob'
            });
            const eventTitle = records?.event?.title || 'Event';
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Attendance_${eventTitle.replace(/\s/g, '_')}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Attendance report downloaded!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const filteredRecords = records?.records?.filter((reg) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            reg.registrationId?.toLowerCase().includes(term) ||
            reg.participant?.username?.toLowerCase().includes(term) ||
            reg.participant?.email?.toLowerCase().includes(term)
        );
    }) || [];

    const handleDownloadPDF = async () => {
        if (!records) return;
        setIsLoading(true);

        try {
            const doc = new jsPDF();
            const event = records?.event;
            if (!event) throw new Error('Event data missing');
            const isTeamEvent = (records.records && records.records.length > 0) ? records.records[0].team != null : false;

            // Fetch system settings to get logos and symposium details
            let settings = {
                symposiumName: 'DIGIFLASH 2026',
                symposiumType: 'National Level Technical Symposium',
                iicLogo: '',
                digiflashLogo: '',
                associationCoordinatorSign: '',
                hodSign: ''
            };
            try {
                const settingsRes = await axios.get(`/api/settings`);
                if (settingsRes.data) {
                    settings = settingsRes.data;
                }
            } catch (err) {
                console.warn('Failed to load settings, using defaults', err);
            }

            // Helper to load image as Base64 safely without CORS fetch errors
            const getBase64Image = (imgUrl) => {
                if (!imgUrl) return Promise.resolve(null);
                if (imgUrl.startsWith('data:')) return Promise.resolve(imgUrl);
                return new Promise((resolve) => {
                    const img = new Image();
                    img.setAttribute('crossOrigin', 'anonymous');
                    img.src = imgUrl;
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        } catch (e) {
                            console.warn('Canvas conversion failed', e);
                            resolve(null);
                        }
                    };
                    img.onerror = () => {
                        resolve(null);
                    };
                });
            };

            const iicLogoUrl = settings.iicLogo ? getImageUrl(settings.iicLogo) : null;
            const digiflashLogoUrl = settings.digiflashLogo ? getImageUrl(settings.digiflashLogo) : null;
            const assocSignUrl = settings.associationCoordinatorSign ? getImageUrl(settings.associationCoordinatorSign) : null;
            const hodSignUrl = settings.hodSign ? getImageUrl(settings.hodSign) : null;

            // Preload logos and student signatures
            const [iicLogoBase64, digiflashLogoBase64, assocSignBase64, hodSignBase64] = await Promise.all([
                iicLogoUrl ? getBase64Image(iicLogoUrl) : Promise.resolve(null),
                digiflashLogoUrl ? getBase64Image(digiflashLogoUrl) : Promise.resolve(null),
                assocSignUrl ? getBase64Image(assocSignUrl) : Promise.resolve(null),
                hodSignUrl ? getBase64Image(hodSignUrl) : Promise.resolve(null)
            ]);

            const recordsToExport = [...filteredRecords];

            // Pre-load all student signatures
            const signaturesMap = {};
            await Promise.all(
                recordsToExport.map(async (reg) => {
                    if (!reg.signature) return;
                    const sigUrl = reg.signature.startsWith('data:')
                        ? reg.signature
                        : getImageUrl(reg.signature);

                    try {
                        const base64 = await getBase64Image(sigUrl);
                        if (base64) {
                            signaturesMap[reg.registrationId] = base64;
                        }
                    } catch (err) {
                        console.warn('Failed to load signature:', sigUrl, err);
                    }
                })
            );

            // Setup Header drawing function that will be executed on every page
            const drawHeader = (docInstance) => {
                // Left Logo (IIC)
                if (iicLogoBase64) {
                    docInstance.addImage(iicLogoBase64, 'PNG', 15, 12, 24, 24);
                } else {
                    docInstance.setDrawColor(200, 200, 200);
                    docInstance.setFillColor(245, 245, 245);
                    docInstance.rect(15, 12, 24, 24, 'FD');
                    docInstance.setFont("helvetica", "bold");
                    docInstance.setFontSize(8);
                    docInstance.setTextColor(150, 150, 150);
                    docInstance.text("IIC LOGO", 27, 24, { align: 'center' });
                }

                // Right Logo (Digiflash)
                if (digiflashLogoBase64) {
                    docInstance.addImage(digiflashLogoBase64, 'PNG', 171, 12, 24, 24);
                } else {
                    docInstance.setDrawColor(200, 200, 200);
                    docInstance.setFillColor(245, 245, 245);
                    docInstance.rect(171, 12, 24, 24, 'FD');
                    docInstance.setFont("helvetica", "bold");
                    docInstance.setFontSize(8);
                    docInstance.setTextColor(150, 150, 150);
                    docInstance.text("DIGIFLASH", 183, 24, { align: 'center' });
                }

                // Center Header Texts
                docInstance.setTextColor(15, 23, 42); // slate-900

                docInstance.setFont("helvetica", "bold");
                docInstance.setFontSize(10.5);
                docInstance.text("Dr. Mahalingam College of Engineering and Technology, Pollachi", 105, 16, { align: 'center' });

                docInstance.setFont("helvetica", "bold");
                docInstance.setFontSize(9.5);
                docInstance.text("Department of Computer Science and Engineering", 105, 21, { align: 'center' });

                docInstance.setFont("helvetica", "normal");
                docInstance.setFontSize(9);
                docInstance.text("Digiflash proudly organizes", 105, 26, { align: 'center' });

                docInstance.setFont("helvetica", "bold");
                docInstance.setFontSize(11.5);
                docInstance.text(settings.symposiumName, 105, 31, { align: 'center' });

                docInstance.setFont("helvetica", "bold");
                docInstance.setFontSize(8.5);
                docInstance.text(settings.symposiumType, 105, 35.5, { align: 'center' });

                // Event details box borders
                docInstance.setDrawColor(200, 220, 240); // light blue border
                docInstance.setLineWidth(0.3);
                docInstance.rect(15, 40, 180, 13); // outer box
                docInstance.line(110, 40, 110, 53); // vertical division

                // Left Column
                docInstance.setFont("helvetica", "normal");
                docInstance.setFontSize(9);
                docInstance.text("Name of the Event: ", 17, 45);
                docInstance.setFont("helvetica", "bold");
                docInstance.text(event.title, 45, 45);

                docInstance.setFont("helvetica", "normal");
                docInstance.text("Date: ", 17, 50.5);
                docInstance.setFont("helvetica", "bold");
                docInstance.text(new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), 27, 50.5);

                // Right Column
                docInstance.setFont("helvetica", "normal");
                docInstance.text("Timing: ", 113, 45);
                docInstance.setFont("helvetica", "bold");
                docInstance.text(`${event.startTime || 'N/A'} - ${event.endTime || 'N/A'}`, 125, 45);

                docInstance.setFont("helvetica", "normal");
                docInstance.text("Venue: ", 113, 50.5);
                docInstance.setFont("helvetica", "bold");
                docInstance.text(event.venue, 125, 50.5);

                // Title Section
                docInstance.setFont("helvetica", "bold");
                docInstance.setFontSize(13);
                docInstance.setTextColor(30, 41, 59); // slate-800
                docInstance.text("Attendance Sheet", 105, 60.5, { align: 'center' });

                docInstance.setDrawColor(226, 232, 240);
                docInstance.line(85, 62.5, 125, 62.5);
            };

            // 2. Attendance Table setup
            const head = [['S.No', 'Roll Number', 'Name of the Student', 'Dept/Class', 'Signature of the student']];

            let body = [];
            const sortedRecordsForTable = [];

            if (!isTeamEvent) {
                body = recordsToExport.map((reg, index) => {
                    sortedRecordsForTable.push(reg);
                    const participant = reg.participant || {};
                    const classDept = (participant.yearAndDept && participant.section)
                        ? `${participant.yearAndDept} - ${participant.section}`
                        : (participant.yearAndDept || participant.department || '-');

                    return [
                        (index + 1).toString(),
                        participant.registrationNumber || '-',
                        participant.username || 'N/A',
                        classDept,
                        ''
                    ];
                });
            } else {
                const teamsMap = {};
                const teamOrder = [];
                recordsToExport.forEach(reg => {
                    const teamId = reg.team ? (reg.team._id || reg.team).toString() : 'Unknown';
                    if (!teamsMap[teamId]) {
                        teamsMap[teamId] = { teamObj: reg.team, members: [] };
                        teamOrder.push(teamId);
                    }
                    teamsMap[teamId].members.push(reg);
                });

                let teamCounter = 0;
                teamOrder.forEach(teamId => {
                    teamCounter++;
                    const teamData = teamsMap[teamId];
                    const members = teamData.members;
                    const teamNameStr = teamData.teamObj?.name || `Team ${teamCounter}`;
                    const firstColStr = `Team ${teamCounter}\n${teamNameStr}`;

                    members.forEach((reg, index) => {
                        sortedRecordsForTable.push(reg);
                        const participant = reg.participant || {};
                        const classDept = (participant.yearAndDept && participant.section)
                            ? `${participant.yearAndDept} - ${participant.section}`
                            : (participant.yearAndDept || participant.department || '-');

                        const rowData = [
                            participant.registrationNumber || '-',
                            participant.username || 'N/A',
                            classDept,
                            ''
                        ];

                        if (index === 0) {
                            body.push([
                                { content: firstColStr, rowSpan: members.length, styles: { halign: 'center', valign: 'middle' } },
                                ...rowData
                            ]);
                        } else {
                            body.push(rowData);
                        }
                    });
                });
            }

            autoTable(doc, {
                startY: 68,
                margin: { top: 68 }, // ensures top margin for repeating headers on page 2+
                head: head,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
                styles: { fontSize: 8, cellPadding: 4, verticalAlign: 'middle', halign: 'center' },
                columnStyles: isTeamEvent ? {
                    0: { halign: 'center', cellWidth: 35 },
                    1: { halign: 'center', cellWidth: 30 },
                    2: { halign: 'center', cellWidth: 45 },
                    3: { halign: 'center', cellWidth: 35 },
                    4: { halign: 'center', cellWidth: 35, minCellHeight: 18 }
                } : {
                    0: { halign: 'center', cellWidth: 15 },
                    1: { halign: 'center', cellWidth: 35 },
                    2: { halign: 'center', cellWidth: 50 },
                    3: { halign: 'center', cellWidth: 40 },
                    4: { halign: 'center', cellWidth: 40, minCellHeight: 18 }
                },
                didDrawPage: (data) => {
                    // Call header drawing on every page
                    drawHeader(doc);
                },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index === 4) {
                        const reg = sortedRecordsForTable[data.row.index];
                        const sigData = reg?.registrationId ? signaturesMap[reg.registrationId] : null;
                        if (sigData) {
                            try {
                                const imgSize = 12;
                                const x = data.cell.x + (data.cell.width - imgSize * 2) / 2;
                                const y = data.cell.y + 2;
                                doc.addImage(sigData, 'auto', x, y, imgSize * 2, imgSize);
                            } catch (imgError) {
                                console.warn('Failed to add image to PDF:', imgError);
                            }
                        }
                    }
                }
            });

            // 3. Footer with Signatures
            let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 70) + 25;
            if (finalY > 250) {
                doc.addPage();
                finalY = 85; // safe offset after page 2+ header
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);

            if (assocSignBase64) doc.addImage(assocSignBase64, 'PNG', 35, finalY - 12, 30, 15);
            doc.text("__________________________", 50, finalY, { align: 'center' });
            doc.text("Association Coordinator", 50, finalY + 7, { align: 'center' });

            if (hodSignBase64) doc.addImage(hodSignBase64, 'PNG', 145, finalY - 12, 30, 15);
            doc.text("__________________________", 160, finalY, { align: 'center' });
            doc.text("Head of Department", 160, finalY + 7, { align: 'center' });

            doc.save(`Attendance_${event.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
            toast.success('Attendance Report Downloaded!');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error(`PDF Error: ${error.message || 'Check connection'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-40">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors mb-2 text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Attendance <span className="text-indigo-600 dark:text-indigo-400">Records</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">View and download attendance reports for any event.</p>
                </div>
                {selectedEvent && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={!records || isLoading}
                            className="bg-white dark:bg-[#20242B] text-slate-700 font-bold px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-all shadow-sm dark:text-white"
                        >
                            <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Attendance PDF
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || !records}
                            className="btn-premium flex items-center gap-3 disabled:opacity-50"
                        >
                            {isExporting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="w-5 h-5" />
                            )}
                            Export Responses (Excel)
                        </button>
                    </div>
                )}
            </header>

            <div className="bg-white dark:bg-[#20242B] rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 dark:text-white">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Select Event</label>
                        <div className="relative">
                            <Calendar className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            <select
                                className="input-premium pl-14 appearance-none w-full"
                                value={selectedEvent}
                                onChange={(e) => setSelectedEvent(e.target.value)}
                            >
                                <option value="">Choose an event...</option>
                                {events.map((event) => (
                                    <option key={event._id} value={event._id}>{event.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {records && (
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Search</label>
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    className="input-premium pl-14 w-full"
                                    placeholder="Search by name, email, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {records && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                        {[
                            { label: 'Total Registered', val: records.summary.total, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
                            { label: 'Attended', val: records.summary.attended, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Absent', val: records.summary.absent, icon: XCircle, color: 'text-red-600 bg-red-50' },
                            { label: 'Attendance Rate', val: `${records.summary.percentage}%`, icon: Download, color: 'text-amber-600 bg-amber-50' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.val}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
            ) : records ? (
                <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm dark:text-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#1a1d24] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">#</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Registration ID</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Participant</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Year & Dept</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Section</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Signature</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Check-in Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                                            No records match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((reg, index) => (
                                        <tr key={reg._id} className="hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-400">{index + 1}</td>
                                            <td className="px-8 py-5 font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{reg.registrationId}</td>
                                            <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{reg.participant?.username}</td>
                                            <td className="px-8 py-5 text-sm font-medium text-slate-600 dark:text-slate-300">{reg.participant?.yearAndDept || '-'}</td>
                                            <td className="px-8 py-5 text-sm font-medium text-slate-600 dark:text-slate-300">{reg.participant?.section || '-'}</td>
                                            <td className="px-8 py-5 text-slate-500 dark:text-slate-400">{reg.participant?.email}</td>
                                            <td className="px-8 py-5">
                                                {reg.attendanceStatus ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Present
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-[#20242B] text-slate-500 dark:text-slate-400">
                                                        <XCircle className="w-3.5 h-3.5" /> Absent
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                {reg.signature ? (
                                                    <div className="h-10 w-24 bg-white dark:bg-[#20242B] border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden group relative dark:text-white">
                                                        <img
                                                            src={reg.signature.startsWith('data:') ? reg.signature : getImageUrl(reg.signature)}
                                                            className="h-full w-full object-contain"
                                                            alt="Signature"
                                                        />
                                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-slate-500 dark:text-slate-400 text-sm">
                                                {reg.attendanceTime
                                                    ? new Date(reg.attendanceTime).toLocaleString()
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : selectedEvent ? null : (
                <div className="text-center py-20 text-slate-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Select an event to view attendance records.</p>
                </div>
            )}
        </div>
    );
};

export default AttendanceRecords;
