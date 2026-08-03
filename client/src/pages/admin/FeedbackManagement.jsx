import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../contexts/ConfirmContext';
import {
    MessageSquare, ChevronDown, ChevronUp, Mail, BarChart2,
    FileText, Download, Loader2, TrendingUp, Star, SmilePlus,
    Meh, Frown, Brain, PieChart as PieChartIcon, ArrowLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {

    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── Sentiment Analysis ──────────────────────────────────────────────────────
const POSITIVE_WORDS = new Set([
    'excellent', 'amazing', 'great', 'good', 'awesome', 'fantastic', 'wonderful',
    'outstanding', 'superb', 'perfect', 'loved', 'enjoyed', 'helpful', 'informative',
    'knowledgeable', 'well', 'clear', 'interesting', 'engaging', 'inspiring',
    'useful', 'valuable', 'satisfied', 'happy', 'impressive', 'best', 'love', 'like',
    'brilliant', 'exceptional', 'positive', 'nice', 'fun', 'productive', 'learned',
    'effective', 'efficient', 'organized', 'professional', 'smooth', 'thorough'
]);
const NEGATIVE_WORDS = new Set([
    'bad', 'poor', 'terrible', 'horrible', 'awful', 'boring', 'worst', 'disappoint',
    'disappointing', 'disappointed', 'confusing', 'confused', 'unclear', 'slow',
    'difficult', 'hard', 'issue', 'problem', 'fail', 'failed', 'waste', 'useless',
    'irrelevant', 'incomplete', 'lacking', 'disorganized', 'chaotic', 'late',
    'unprepared', 'unprofessional', 'rushed', 'unhelpful', 'repetitive', 'redundant'
]);

const analyzeSentiment = (text) => {
    if (!text || typeof text !== 'string') return 'neutral';
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    let score = 0;
    words.forEach(w => {
        if (POSITIVE_WORDS.has(w)) score++;
        if (NEGATIVE_WORDS.has(w)) score--;
    });
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
};

const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return <SmilePlus className="w-4 h-4 text-emerald-500" />;
    if (sentiment === 'negative') return <Frown className="w-4 h-4 text-rose-500" />;
    return <Meh className="w-4 h-4 text-amber-500" />;
};

const getSentimentBadge = (sentiment) => {
    const styles = {
        positive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        negative: 'bg-rose-100 text-rose-700 border-rose-200',
        neutral: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${styles[sentiment]}`;
};

// ─── Chart Colors ─────────────────────────────────────────────────────────────
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#20242B] border border-gray-200 shadow-xl rounded-xl px-4 py-3 dark:text-white">
                <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
                <p className="text-lg font-black text-primary-700 dark:text-primary-300">{payload[0].value} responses</p>
            </div>
        );
    }
    return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FeedbackManagement = () => {
    const { confirm } = useConfirm();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [feedbackData, setFeedbackData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [expandedResponses, setExpandedResponses] = useState({});
    const [chartType, setChartType] = useState({}); // per-question chart toggle: 'bar' | 'pie'
    const chartRefs = useRef({});

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(`/api/events`);
                setEvents(res.data.filter(e => e.feedbackForm && e.feedbackForm.length > 0));
            } catch {
                toast.error('Failed to load events');
            }
        };
        fetchEvents();
    }, []);

    const loadFeedback = async (event) => {
        setSelectedEvent(event);
        setIsLoading(true);
        setFeedbackData([]);
        try {
            const res = await axios.get(`/api/feedback/event/${event._id}`);
            setFeedbackData(res.data);
        } catch {
            toast.error('Failed to load feedback');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id) => setExpandedResponses(prev => ({ ...prev, [id]: !prev[id] }));

    // ─── Build Summary ─────────────────────────────────────────────────────────
    const buildSummary = () => {
        if (!selectedEvent || feedbackData.length === 0) return null;
        const summary = {};
        selectedEvent.feedbackForm.forEach(field => {
            const answers = feedbackData
                .map(fb => {
                    const val = fb.responses?.[field.label];
                    return val !== undefined ? val : null;
                })
                .filter(v => v !== null);

            if (['dropdown', 'radio', 'checkbox'].includes(field.type)) {
                const counts = {};
                answers.forEach(a => {
                    if (Array.isArray(a)) {
                        a.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
                    } else {
                        counts[a] = (counts[a] || 0) + 1;
                    }
                });
                summary[field.label] = { type: 'counts', data: counts };
            } else if (field.type === 'number') {
                const nums = answers.map(Number).filter(n => !isNaN(n));
                const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null;
                const dist = {};
                nums.forEach(n => { dist[n] = (dist[n] || 0) + 1; });
                summary[field.label] = { type: 'number', avg, count: nums.length, dist };
            } else {
                // Compute sentiment for all text answers
                const sentiments = answers.map(a => ({
                    text: a,
                    sentiment: analyzeSentiment(String(a))
                }));
                const sentimentCount = { positive: 0, negative: 0, neutral: 0 };
                sentiments.forEach(s => sentimentCount[s.sentiment]++);
                summary[field.label] = { type: 'text', answers: sentiments, sentimentCount };
            }
        });
        return summary;
    };

    const summary = buildSummary();

    // ─── Compute overall sentiment ─────────────────────────────────────────────
    const overallSentiment = (() => {
        if (!summary) return null;
        let pos = 0, neg = 0, neu = 0;
        Object.values(summary).forEach(info => {
            if (info.type === 'text') {
                pos += info.sentimentCount.positive;
                neg += info.sentimentCount.negative;
                neu += info.sentimentCount.neutral;
            }
        });
        const total = pos + neg + neu;
        if (total === 0) return null;
        return { pos, neg, neu, total };
    })();

    // ─── PDF Export ───────────────────────────────────────────────────────────
    const getBase64ImageFromUrl = (imgUrl) => {
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
                    resolve(null);
                }
            };
            img.onerror = () => {
                resolve(null);
            };
        });
    };

    const captureChartAsImage = (label) => {
        return new Promise((resolve) => {
            const container = chartRefs.current[label];
            if (!container) { resolve(null); return; }
            const svg = container.querySelector('svg');
            if (!svg) { resolve(null); return; }
            try {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement('canvas');
                const svgBounds = svg.getBoundingClientRect();
                canvas.width = svgBounds.width || 400;
                canvas.height = svgBounds.height || 220;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const img = new Image();
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(url);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
                img.src = url;
            } catch {
                resolve(null);
            }
        });
    };

    const downloadAnalyticalReport = async () => {
        if (!selectedEvent || !feedbackData.length) return;

        try {
            const doc = new jsPDF();
            const eventTitle = selectedEvent.title;
            const apiUrl = '';

            const settingsRes = await axios.get(`${apiUrl}/api/settings`);
            const settings = settingsRes.data;

            // NOTE: Digiflash on LEFT, IIC on RIGHT (matching user's request)
            const digiLogoUrl = settings.digiflashLogo ? getImageUrl(settings.digiflashLogo) : null;
            const iicLogoUrl = settings.iicLogo ? getImageUrl(settings.iicLogo) : null;
            const assocSignUrl = settings.associationCoordinatorSign ? getImageUrl(settings.associationCoordinatorSign) : null;
            const hodSignUrl = settings.hodSign ? getImageUrl(settings.hodSign) : null;

            const [digiBase64, iicBase64, assocSignBase64, hodSignBase64] = await Promise.all([
                digiLogoUrl ? getBase64ImageFromUrl(digiLogoUrl) : null,
                iicLogoUrl ? getBase64ImageFromUrl(iicLogoUrl) : null,
                assocSignUrl ? getBase64ImageFromUrl(assocSignUrl) : null,
                hodSignUrl ? getBase64ImageFromUrl(hodSignUrl) : null,
            ]);

            const symposiumName = settings.symposiumName || 'DIGIFLASH 2026';
            const symposiumType = settings.symposiumType || 'National Level Technical Symposium';

            // Capture all chart images
            const chartImages = {};
            if (summary) {
                for (const [label, info] of Object.entries(summary)) {
                    if (info.type === 'counts' || info.type === 'number') {
                        chartImages[label] = await captureChartAsImage(label);
                    }
                }
            }

            const drawHeader = (docInstance) => {
                // Left: IIC, Right: Digiflash
                if (iicBase64) docInstance.addImage(iicBase64, 'PNG', 15, 12, 24, 24);
                else {
                    docInstance.setFillColor(245, 245, 245);
                    docInstance.rect(15, 12, 24, 24, 'FD');
                    docInstance.setFontSize(7);
                    docInstance.setTextColor(150, 150, 150);
                    docInstance.text('IIC LOGO', 27, 24, { align: 'center' });
                }

                if (digiBase64) docInstance.addImage(digiBase64, 'PNG', 171, 12, 24, 24);
                else {
                    docInstance.setFillColor(245, 245, 245);
                    docInstance.rect(171, 12, 24, 24, 'FD');
                    docInstance.setFontSize(7);
                    docInstance.setTextColor(150, 150, 150);
                    docInstance.text('DIGIFLASH', 183, 24, { align: 'center' });
                }

                docInstance.setTextColor(15, 23, 42);
                docInstance.setFont('helvetica', 'bold');
                docInstance.setFontSize(10.5);
                docInstance.text('Dr. Mahalingam College of Engineering and Technology, Pollachi', 105, 16, { align: 'center' });

                docInstance.setFontSize(9.5);
                docInstance.text('Department of Computer Science and Engineering', 105, 21, { align: 'center' });

                docInstance.setFont('helvetica', 'normal');
                docInstance.setFontSize(9);
                docInstance.text('Digiflash proudly organizes', 105, 26, { align: 'center' });

                docInstance.setFont('helvetica', 'bold');
                docInstance.setFontSize(11.5);
                docInstance.text(symposiumName, 105, 31, { align: 'center' });

                docInstance.setFontSize(8.5);
                docInstance.text(symposiumType, 105, 35.5, { align: 'center' });

                // Event details box
                docInstance.setDrawColor(200, 220, 240);
                docInstance.setLineWidth(0.3);
                docInstance.rect(15, 40, 180, 13);
                docInstance.line(110, 40, 110, 53);

                docInstance.setFont('helvetica', 'normal');
                docInstance.setFontSize(9);
                docInstance.text('Name of the Event: ', 17, 45);
                docInstance.setFont('helvetica', 'bold');
                const truncatedTitle = eventTitle.length > 30 ? eventTitle.substring(0, 30) + '...' : eventTitle;
                docInstance.text(truncatedTitle, 46, 45);

                docInstance.setFont('helvetica', 'normal');
                docInstance.text('Date: ', 17, 50.5);
                docInstance.setFont('helvetica', 'bold');
                docInstance.text(new Date(selectedEvent.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), 27, 50.5);

                docInstance.setFont('helvetica', 'normal');
                docInstance.text('Total Responses: ', 113, 45);
                docInstance.setFont('helvetica', 'bold');
                docInstance.text(String(feedbackData.length), 143, 45);

                docInstance.setFont('helvetica', 'normal');
                docInstance.text('Generated: ', 113, 50.5);
                docInstance.setFont('helvetica', 'bold');
                docInstance.text(new Date().toLocaleDateString('en-IN'), 130, 50.5);
            };

            // ── Page 1: Title + Sentiment Summary ──
            drawHeader(doc);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text('Feedback Analytical Report', 105, 62, { align: 'center' });
            doc.setDrawColor(99, 102, 241);
            doc.setLineWidth(0.8);
            doc.line(60, 64, 150, 64);

            let currentY = 74;

            // Overall sentiment box
            if (overallSentiment) {
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.3);
                doc.roundedRect(15, currentY, 180, 28, 3, 3, 'FD');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(30, 41, 59);
                doc.text('Overall Sentiment Analysis', 105, currentY + 7, { align: 'center' });

                const sentW = 40;
                const sentX = [35, 95, 155];
                const labels = ['Positive', 'Neutral', 'Negative'];
                const values = [overallSentiment.pos, overallSentiment.neu, overallSentiment.neg];
                const colors = [[16, 185, 129], [245, 158, 11], [239, 68, 68]];
                const pcts = values.map(v => ((v / overallSentiment.total) * 100).toFixed(1));

                labels.forEach((lbl, i) => {
                    doc.setFillColor(...colors[i]);
                    doc.roundedRect(sentX[i] - 15, currentY + 13, sentW, 11, 2, 2, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.text(`${lbl}: ${values[i]} (${pcts[i]}%)`, sentX[i] + 5, currentY + 20, { align: 'center' });
                });

                currentY += 35;
            }

            // ── Section: Analytics per Question ──
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Question-wise Analysis', 20, currentY);
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.2);
            doc.line(20, currentY + 2, 190, currentY + 2);
            currentY += 10;

            if (summary) {
                for (const [label, info] of Object.entries(summary)) {
                    if (currentY > 240) {
                        doc.addPage();
                        drawHeader(doc);
                        currentY = 62;
                    }

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(55, 65, 81);
                    doc.text(`Q: ${label}`, 20, currentY);
                    currentY += 7;

                    if (info.type === 'counts') {
                        const entries = Object.entries(info.data);
                        const total = feedbackData.length;

                        // Bar chart image
                        const chartImg = chartImages[label];
                        if (chartImg) {
                            try {
                                doc.addImage(chartImg, 'PNG', 20, currentY, 80, 40);
                            } catch { /* skip */ }
                        }

                        // Text data alongside
                        let textY = currentY + 4;
                        entries.forEach(([opt, count]) => {
                            const pct = ((count / total) * 100).toFixed(1);
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(8);
                            doc.setTextColor(75, 85, 99);
                            doc.text(`• ${opt}: ${count} (${pct}%)`, 108, textY);
                            textY += 5;
                        });

                        currentY += 48;

                    } else if (info.type === 'number') {
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);
                        doc.setTextColor(75, 85, 99);
                        doc.text(`Average: ${info.avg}  |  Responses: ${info.count}`, 25, currentY);

                        const chartImg = chartImages[label];
                        if (chartImg) {
                            currentY += 4;
                            try {
                                doc.addImage(chartImg, 'PNG', 20, currentY, 80, 35);
                            } catch { /* skip */ }
                            currentY += 40;
                        } else {
                            currentY += 8;
                        }

                    } else if (info.type === 'text') {
                        const sentCounts = info.sentimentCount;
                        const total = info.answers.length;
                        const posP = total ? ((sentCounts.positive / total) * 100).toFixed(1) : 0;
                        const negP = total ? ((sentCounts.negative / total) * 100).toFixed(1) : 0;
                        const neuP = total ? ((sentCounts.neutral / total) * 100).toFixed(1) : 0;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8.5);
                        doc.setTextColor(16, 185, 129);
                        doc.text(`Positive: ${sentCounts.positive} (${posP}%)`, 25, currentY);
                        doc.setTextColor(245, 158, 11);
                        doc.text(`Neutral: ${sentCounts.neutral} (${neuP}%)`, 85, currentY);
                        doc.setTextColor(239, 68, 68);
                        doc.text(`Negative: ${sentCounts.negative} (${negP}%)`, 145, currentY);
                        currentY += 7;

                        // Show up to 5 sample responses
                        info.answers.slice(0, 5).forEach(({ text, sentiment }) => {
                            if (currentY > 265) {
                                doc.addPage();
                                drawHeader(doc);
                                currentY = 62;
                            }
                            const sentLabel = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
                            const sentColor = sentiment === 'positive' ? [16, 185, 129] : sentiment === 'negative' ? [239, 68, 68] : [245, 158, 11];
                            doc.setFont('helvetica', 'italic');
                            doc.setFontSize(8);
                            doc.setTextColor(107, 114, 128);
                            const truncated = String(text).length > 80 ? String(text).substring(0, 80) + '...' : String(text);
                            doc.text(`"${truncated}"`, 27, currentY);
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(7.5);
                            doc.setTextColor(...sentColor);
                            doc.text(`[${sentLabel}]`, 170, currentY, { align: 'right' });
                            currentY += 5.5;
                        });

                        if (info.answers.length > 5) {
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(7.5);
                            doc.setTextColor(156, 163, 175);
                            doc.text(`... and ${info.answers.length - 5} more responses (see Detailed Responses section)`, 27, currentY);
                            currentY += 5;
                        }

                        currentY += 5;
                    }

                    // Divider
                    if (currentY < 268) {
                        doc.setDrawColor(241, 245, 249);
                        doc.setLineWidth(0.2);
                        doc.line(20, currentY, 190, currentY);
                        currentY += 6;
                    }
                }
            }

            // ── Page: Detailed Responses Table ──
            doc.addPage();
            drawHeader(doc);

            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text('Detailed Responses', 105, 62, { align: 'center' });
            doc.setDrawColor(99, 102, 241);
            doc.line(65, 64, 145, 64);

            const tableColumns = ['Participant', 'Reg No', 'Sentiment'];
            selectedEvent.feedbackForm.forEach(f => tableColumns.push(f.label));

            const tableRows = feedbackData.map(fb => {
                const textAnswers = selectedEvent.feedbackForm
                    .filter(f => !['dropdown', 'radio', 'checkbox', 'number'].includes(f.type))
                    .map(f => String(fb.responses?.[f.label] || ''))
                    .join(' ');
                const overallSent = analyzeSentiment(textAnswers);

                const row = [
                    fb.user?.username || 'N/A',
                    fb.user?.registrationNumber || 'N/A',
                    overallSent.charAt(0).toUpperCase() + overallSent.slice(1),
                ];
                selectedEvent.feedbackForm.forEach(f => {
                    const ans = fb.responses?.[f.label];
                    row.push(Array.isArray(ans) ? ans.join(', ') : (ans || '-'));
                });
                return row;
            });

            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 70,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak' },
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
                margin: { top: 65 },
                didDrawPage: (data) => {
                    if (data.pageNumber > 1) drawHeader(doc);
                },
                didParseCell: (data) => {
                    if (data.column.index === 2 && data.section === 'body') {
                        const val = data.cell.raw;
                        if (val === 'Positive') data.cell.styles.textColor = [16, 185, 129];
                        else if (val === 'Negative') data.cell.styles.textColor = [239, 68, 68];
                        else data.cell.styles.textColor = [245, 158, 11];
                    }
                }
            });

            // Footer signatures
            let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY) + 25;
            if (finalY > 250) {
                doc.addPage();
                drawHeader(doc);
                finalY = 85;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);

            if (assocSignBase64) doc.addImage(assocSignBase64, 'PNG', 35, finalY - 12, 30, 15);
            doc.text('__________________________', 50, finalY, { align: 'center' });
            doc.text('Association Coordinator', 50, finalY + 7, { align: 'center' });

            if (hodSignBase64) doc.addImage(hodSignBase64, 'PNG', 145, finalY - 12, 30, 15);
            doc.text('__________________________', 160, finalY, { align: 'center' });
            doc.text('Head of Department', 160, finalY + 7, { align: 'center' });

            doc.save(`Feedback_Report_${(eventTitle || 'Report').replace(/[^a-z0-9]/gi, '_')}.pdf`);
            toast.success('Analytical Report Downloaded!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate PDF report');
        }
    };

    // ─── Toggle chart type per question ───────────────────────────────────────
    const toggleChartType = (label) => {
        setChartType(prev => ({ ...prev, [label]: prev[label] === 'pie' ? 'bar' : 'pie' }));
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-[-1rem]">
                <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
            <div className="bg-white dark:bg-[#20242B] p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 dark:text-white">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 dark:text-primary-300">
                        <MessageSquare className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Feedback Management</h1>
                        <p className="text-gray-500 font-medium">Visual analytics with sentiment insights</p>
                    </div>
                </div>
                {selectedEvent && (
                    <div className="flex gap-3">
                        <button
                            onClick={downloadAnalyticalReport}
                            disabled={isLoading || !feedbackData.length}
                            className="bg-white dark:bg-[#20242B] text-gray-700 font-bold px-6 py-3 rounded-2xl border border-gray-200 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 dark:text-white"
                        >
                            <Download className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            Download Report
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Event List */}
                <div className="lg:col-span-1 space-y-3">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">Events with Feedback</h2>
                    {events.length === 0 ? (
                        <div className="bg-white dark:bg-[#20242B] p-6 rounded-2xl border border-dashed text-center text-gray-400 text-sm dark:text-white">
                            No events with feedback forms yet.
                        </div>
                    ) : (
                        events.map(event => (
                            <motion.button
                                key={event._id}
                                whileHover={{ x: 4 }}
                                onClick={() => loadFeedback(event)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedEvent?._id === event._id ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-100' : 'bg-white border-gray-100 hover:border-primary-200 text-gray-900 dark:text-white'}`}
                            >
                                <p className="font-bold text-sm truncate">{event.title}</p>
                                <p className={`text-xs mt-1 ${selectedEvent?._id === event._id ? 'text-primary-100' : 'text-gray-400'}`}>
                                    {event.feedbackForm.length} question{event.feedbackForm.length !== 1 ? 's' : ''}
                                </p>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Main Panel */}
                <div className="lg:col-span-3 space-y-6">
                    {!selectedEvent ? (
                        <div className="bg-white dark:bg-[#20242B] rounded-3xl border-2 border-dashed p-16 text-center space-y-4 dark:text-white">
                            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto" />
                            <p className="text-gray-400 font-medium">Select an event to see feedback responses</p>
                        </div>
                    ) : isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <>
                            {/* Stats Banner */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-[#20242B] p-5 rounded-2xl border border-gray-100 shadow-sm text-center dark:text-white">
                                    <p className="text-3xl font-black text-primary-700 dark:text-primary-300">{feedbackData.length}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Responses</p>
                                </div>
                                <div className="bg-white dark:bg-[#20242B] p-5 rounded-2xl border border-gray-100 shadow-sm text-center dark:text-white">
                                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{selectedEvent.feedbackForm.length}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Questions</p>
                                </div>
                                {overallSentiment && (
                                    <>
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm text-center">
                                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{overallSentiment.pos}</p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-1">Positive 😊</p>
                                        </div>
                                        <div className="bg-rose-50 dark:bg-rose-500/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-500/20 shadow-sm text-center">
                                            <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{overallSentiment.neg}</p>
                                            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest mt-1">Negative 😞</p>
                                        </div>
                                    </>
                                )}
                                {!overallSentiment && (
                                    <div className="bg-primary-700 p-5 rounded-2xl text-center col-span-2">
                                        <p className="text-3xl font-black text-white">{selectedEvent.status}</p>
                                        <p className="text-xs text-primary-200 font-bold uppercase tracking-widest mt-1">Event Status</p>
                                    </div>
                                )}
                            </div>

                            {/* Overall Sentiment Pie */}
                            {overallSentiment && overallSentiment.total > 0 && (
                                <div className="bg-white dark:bg-[#20242B] p-8 rounded-2xl border border-gray-100 shadow-sm dark:text-white">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Sentiment Overview</h3>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="w-full sm:w-64 h-52">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Positive', value: overallSentiment.pos },
                                                            { name: 'Neutral', value: overallSentiment.neu },
                                                            { name: 'Negative', value: overallSentiment.neg },
                                                        ]}
                                                        cx="50%" cy="50%"
                                                        innerRadius={55} outerRadius={90}
                                                        labelLine={false}
                                                        label={renderCustomLabel}
                                                        dataKey="value"
                                                    >
                                                        <Cell fill="#10b981" />
                                                        <Cell fill="#f59e0b" />
                                                        <Cell fill="#ef4444" />
                                                    </Pie>
                                                    <Tooltip formatter={(v, n) => [`${v} responses`, n]} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            {[
                                                { label: 'Positive', count: overallSentiment.pos, color: 'bg-emerald-500', textColor: 'text-emerald-700', icon: <SmilePlus className="w-4 h-4" /> },
                                                { label: 'Neutral', count: overallSentiment.neu, color: 'bg-amber-400', textColor: 'text-amber-700', icon: <Meh className="w-4 h-4" /> },
                                                { label: 'Negative', count: overallSentiment.neg, color: 'bg-rose-500', textColor: 'text-rose-700', icon: <Frown className="w-4 h-4" /> },
                                            ].map(s => (
                                                <div key={s.label} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`flex items-center gap-1.5 text-sm font-bold ${s.textColor}`}>{s.icon}{s.label}</span>
                                                        <span className="text-sm font-black text-gray-700">{s.count} <span className="text-gray-400 font-medium text-xs">({((s.count / overallSentiment.total) * 100).toFixed(1)}%)</span></span>
                                                    </div>
                                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(s.count / overallSentiment.total) * 100}%` }}
                                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                                            className={`h-full ${s.color} rounded-full`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary Analytics: Charts */}
                            {summary && feedbackData.length > 0 && (
                                <div className="bg-white dark:bg-[#20242B] p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8 dark:text-white">
                                    <div className="flex items-center gap-2">
                                        <BarChart2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Question Analytics</h3>
                                    </div>

                                    {Object.entries(summary).map(([label, info]) => (
                                        <div key={label} className="space-y-3 border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{label}</p>

                                                {info.type === 'counts' && (
                                                    <button
                                                        onClick={() => toggleChartType(label)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-primary-100 text-gray-600 hover:text-primary-700 rounded-lg text-xs font-bold transition-colors shrink-0"
                                                    >
                                                        {chartType[label] === 'pie' ? (
                                                            <><BarChart2 className="w-3.5 h-3.5" /> Bar Chart</>
                                                        ) : (
                                                            <><PieChartIcon className="w-3.5 h-3.5" /> Pie Chart</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {info.type === 'counts' && (() => {
                                                const chartData = Object.entries(info.data).map(([name, value]) => ({ name, value }));
                                                const isPie = chartType[label] === 'pie';

                                                return (
                                                    <div ref={el => chartRefs.current[label] = el} className="w-full h-52">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            {isPie ? (
                                                                <PieChart>
                                                                    <Pie
                                                                        data={chartData}
                                                                        cx="50%" cy="50%"
                                                                        outerRadius={85}
                                                                        labelLine={false}
                                                                        label={renderCustomLabel}
                                                                        dataKey="value"
                                                                    >
                                                                        {chartData.map((_, idx) => (
                                                                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip formatter={(v, n) => [`${v} responses`, n]} />
                                                                    <Legend />
                                                                </PieChart>
                                                            ) : (
                                                                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-15} textAnchor="end" interval={0} />
                                                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                                                                    <Tooltip content={<CustomBarTooltip />} />
                                                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                                        {chartData.map((_, idx) => (
                                                                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                                        ))}
                                                                    </Bar>
                                                                </BarChart>
                                                            )}
                                                        </ResponsiveContainer>
                                                    </div>
                                                );
                                            })()}

                                            {info.type === 'number' && (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                                        <span className="text-2xl font-black text-primary-700 dark:text-primary-300">{info.avg}</span>
                                                        <span className="text-xs text-gray-400 font-bold">avg. from {info.count} responses</span>
                                                    </div>
                                                    {Object.keys(info.dist).length > 0 && (
                                                        <div ref={el => chartRefs.current[label] = el} className="w-full h-40">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart
                                                                    data={Object.entries(info.dist).sort(([a], [b]) => Number(a) - Number(b)).map(([name, value]) => ({ name, value }))}
                                                                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                                                                >
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                                                    <Tooltip content={<CustomBarTooltip />} />
                                                                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {info.type === 'text' && (
                                                <div className="space-y-2">
                                                    <div className="flex gap-3 text-xs mb-3">
                                                        <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-full font-bold">
                                                            <SmilePlus className="w-3.5 h-3.5" /> Positive: {info.sentimentCount.positive}
                                                        </span>
                                                        <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 dark:text-amber-300 rounded-full font-bold">
                                                            <Meh className="w-3.5 h-3.5" /> Neutral: {info.sentimentCount.neutral}
                                                        </span>
                                                        <span className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 dark:text-rose-300 rounded-full font-bold">
                                                            <Frown className="w-3.5 h-3.5" /> Negative: {info.sentimentCount.negative}
                                                        </span>
                                                    </div>
                                                    {info.answers.slice(0, 4).map(({ text, sentiment }, i) => (
                                                        <div key={i} className="flex gap-3 items-start">
                                                            <span className={getSentimentBadge(sentiment)}>
                                                                {getSentimentIcon(sentiment)}
                                                                {sentiment}
                                                            </span>
                                                            <span className="text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg flex-1 italic">
                                                                "{text}"
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {info.answers.length > 4 && (
                                                        <span className="text-xs text-gray-400">+{info.answers.length - 4} more responses</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Individual Responses */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    <h3 className="text-xl font-black">Individual Responses</h3>
                                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-bold">{feedbackData.length} total</span>
                                </div>
                                {feedbackData.length === 0 ? (
                                    <div className="bg-white dark:bg-[#20242B] p-12 rounded-2xl border-2 border-dashed text-center dark:text-white">
                                        <p className="text-gray-400 font-medium">No responses yet. Send emails to attendees to collect feedback.</p>
                                    </div>
                                ) : (
                                    feedbackData.map((fb) => {
                                        const textAnswers = selectedEvent.feedbackForm
                                            .filter(f => !['dropdown', 'radio', 'checkbox', 'number'].includes(f.type))
                                            .map(f => String(fb.responses?.[f.label] || ''))
                                            .join(' ');
                                        const sentiment = analyzeSentiment(textAnswers);

                                        return (
                                            <motion.div
                                                key={fb._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white dark:bg-[#20242B] rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:text-white"
                                            >
                                                <button
                                                    className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                                    onClick={() => toggleExpand(fb._id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center font-black text-primary-700 dark:text-primary-300">
                                                            {fb.user?.username?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{fb.user?.username}</p>
                                                            <p className="text-xs text-gray-400">{fb.user?.registrationNumber || fb.user?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={getSentimentBadge(sentiment)}>
                                                            {getSentimentIcon(sentiment)}
                                                            {sentiment}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                                        {expandedResponses[fb._id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                    </div>
                                                </button>
                                                <AnimatePresence>
                                                    {expandedResponses[fb._id] && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                                                                {selectedEvent.feedbackForm.map((field) => {
                                                                    const answer = fb.responses?.[field.label];
                                                                    const isText = !['dropdown', 'radio', 'checkbox', 'number'].includes(field.type);
                                                                    const sent = isText ? analyzeSentiment(String(answer || '')) : null;
                                                                    return (
                                                                        <div key={field.label} className="flex gap-4 items-start">
                                                                            <span className="text-xs font-bold text-gray-500 w-40 shrink-0 pt-1.5">{field.label}</span>
                                                                            <div className="flex-1 flex items-start gap-2">
                                                                                <span className="text-sm text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg flex-1">
                                                                                    {Array.isArray(answer) ? answer.join(', ') : (answer ?? <span className="text-gray-300 italic">—</span>)}
                                                                                </span>
                                                                                {sent && answer && (
                                                                                    <span className={getSentimentBadge(sent)}>
                                                                                        {getSentimentIcon(sent)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackManagement;
