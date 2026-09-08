/**
 * eventPassUtils.js
 *
 * Shared utility for generating and downloading a styled Event Pass (QR card)
 * as a PNG image.  Extracted from Dashboard.jsx so it can be called immediately
 * after a successful registration from EventDetails.jsx as well.
 *
 * @param {object} params
 * @param {object} params.event          - The event object { title, eventDate, venue, isTeamEvent }
 * @param {object} params.participant    - The participant object { username, yearAndDept, section, department }
 * @param {string} params.qrCode        - Base64 data URL of the QR code image
 * @param {string} params.registrationId - The unique registration ID string
 * @param {string} [params.teamName]     - Team name (for team events)
 * @returns {Promise<void>}
 */
export const downloadEventPass = ({ event, participant, qrCode, registrationId, teamName }) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 1300;

        // Background gradient – DigiFlash cyan/teal theme
        const gradient = ctx.createLinearGradient(0, 0, 0, 1300);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#0891b2');
        gradient.addColorStop(1, '#0e7490');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 1300);

        // Main white card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
        ctx.beginPath();
        ctx.roundRect(40, 40, 720, 1220, 40);
        ctx.fill();

        // Card border
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Helper – word-wrap text to fit maxWidth
        const wrapText = (context, text, maxWidth) => {
            if (!text) return [];
            const words = text.split(' ');
            const lines = [];
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                if (context.measureText(currentLine + ' ' + word).width < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);

            // Break any single token that is still too wide
            const finalLines = [];
            lines.forEach(line => {
                if (context.measureText(line).width <= maxWidth) {
                    finalLines.push(line);
                } else {
                    let tempLine = '';
                    for (const char of line) {
                        if (context.measureText(tempLine + char).width < maxWidth) {
                            tempLine += char;
                        } else {
                            finalLines.push(tempLine);
                            tempLine = char;
                        }
                    }
                    if (tempLine) finalLines.push(tempLine);
                }
            });
            return finalLines;
        };

        const logoImage = new Image();
        logoImage.crossOrigin = 'anonymous';

        logoImage.onload = () => {
            // ── Logo ────────────────────────────────────────────────────────
            ctx.drawImage(logoImage, 70, 70, 100, 100);

            // ── Department header ────────────────────────────────────────────
            ctx.fillStyle = '#0e7490';
            ctx.font = '900 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Department of', 400, 115);
            ctx.fillText('Computer Science and Engineering', 400, 150);

            // Divider line
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(70, 180);
            ctx.lineTo(730, 180);
            ctx.stroke();

            // ── "WELCOME TO" subtitle ───────────────────────────────────────
            ctx.fillStyle = '#0891b2';
            ctx.font = '700 20px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('WELCOME TO', 400, 230);

            // ── Event title ─────────────────────────────────────────────────
            ctx.fillStyle = '#0e7490';
            let titleFontSize = 56;
            ctx.font = `900 ${titleFontSize}px Inter, sans-serif`;
            const title = (event.title || '').toUpperCase();

            let titleLines = wrapText(ctx, title, 680);
            if (titleLines.length > 2) { titleFontSize = 42; ctx.font = `900 ${titleFontSize}px Inter, sans-serif`; titleLines = wrapText(ctx, title, 680); }
            if (titleLines.length > 3) { titleFontSize = 28; ctx.font = `900 ${titleFontSize}px Inter, sans-serif`; titleLines = wrapText(ctx, title, 680); }
            if (titleLines.length > 4) { titleLines = titleLines.slice(0, 4); titleLines[3] = titleLines[3].slice(0, -3) + '...'; }

            const titleLineHeight = titleFontSize * 1.2;
            const titleStartY = 330 - ((titleLines.length - 1) * titleLineHeight) / 2;
            titleLines.forEach((line, i) => ctx.fillText(line, 400, titleStartY + i * titleLineHeight));

            // ── Info box (venue + date) ──────────────────────────────────────
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

            ctx.fillStyle = '#0891b2';
            ctx.font = '700 18px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('VENUE', 250, 445);
            ctx.fillText('DATE', 550, 445);

            ctx.fillStyle = '#0e7490';
            ctx.font = 'bold 30px Inter, sans-serif';
            ctx.fillText(new Date(event.eventDate).toLocaleDateString(), 550, 495);

            let venueFontSize = 30;
            ctx.font = `bold ${venueFontSize}px Inter, sans-serif`;
            const venueText = event.venue || '';
            let venueLines = wrapText(ctx, venueText, 280);
            if (venueLines.length > 2) { venueFontSize = 22; ctx.font = `bold ${venueFontSize}px Inter, sans-serif`; venueLines = wrapText(ctx, venueText, 280); }
            if (venueLines.length > 3) { venueFontSize = 14; ctx.font = `bold ${venueFontSize}px Inter, sans-serif`; venueLines = wrapText(ctx, venueText, 280); }
            if (venueLines.length > 4) { venueLines = venueLines.slice(0, 4); venueLines[3] = venueLines[3].slice(0, -3) + '...'; }
            const venueLineH = venueFontSize * 1.2;
            const venueStartY = 495 - ((venueLines.length - 1) * venueLineH) / 2;
            venueLines.forEach((line, i) => ctx.fillText(line, 250, venueStartY + i * venueLineH));

            // ── Participant / Team box ────────────────────────────────────────
            ctx.fillStyle = '#ecfeff';
            ctx.beginPath();
            ctx.roundRect(100, 580, 600, 140, 20);
            ctx.fill();
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.stroke();

            if (event.isTeamEvent && teamName) {
                ctx.fillStyle = '#0891b2';
                ctx.font = '700 16px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('TEAM NAME', 130, 610);
                ctx.fillStyle = '#0e7490';
                ctx.font = 'bold 26px Inter, sans-serif';
                ctx.fillText(teamName, 130, 645);
            } else {
                const participantName = participant?.username || 'Participant';
                const yearDept = participant?.yearAndDept || '';
                const section = participant?.section || '';
                const classInfo = section ? `${yearDept} - ${section}` : yearDept;

                ctx.fillStyle = '#0891b2';
                ctx.font = '700 14px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('PARTICIPANT', 130, 605);

                ctx.fillStyle = '#0e7490';
                ctx.font = 'bold 22px Inter, sans-serif';
                let nameLines = wrapText(ctx, participantName, 350);
                if (nameLines.length > 2) { nameLines = nameLines.slice(0, 2); nameLines[1] = nameLines[1].slice(0, -3) + '...'; }
                nameLines.forEach((line, idx) => ctx.fillText(line, 130, 630 + idx * 25));

                ctx.fillStyle = '#0891b2';
                ctx.font = '700 14px Inter, sans-serif';
                ctx.fillText('CLASS', 130, 680);

                ctx.fillStyle = '#0e7490';
                ctx.font = 'bold 18px Inter, sans-serif';
                let classLines = wrapText(ctx, classInfo, 350);
                if (classLines.length > 1) { classLines = classLines.slice(0, 1); classLines[0] = classLines[0].slice(0, -3) + '...'; }
                classLines.forEach((line, idx) => ctx.fillText(line, 130, 700 + idx * 20));
            }

            // ── QR Code section ──────────────────────────────────────────────
            const qrImage = new Image();
            qrImage.crossOrigin = 'anonymous';

            qrImage.onload = () => {
                // QR container background
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 10;
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

                // Motivational quote
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
                    'Step in and shine.',
                ];
                const msg = motivations[Math.floor(Math.random() * motivations.length)];
                ctx.fillStyle = '#06b6d4';
                ctx.font = '800 20px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.save();
                ctx.shadowBlur = 4;
                const msgLines = wrapText(ctx, msg, 500).slice(0, 2);
                const msgStartY = 650 - ((msgLines.length - 1) * 24) / 2;
                msgLines.forEach((line, i) => ctx.fillText(line, 400, msgStartY + i * 24));
                ctx.restore();

                // Draw QR code
                ctx.drawImage(qrImage, 220, 740, 360, 360);

                // Registration ID
                ctx.fillStyle = '#06b6d4';
                ctx.font = '900 24px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`ID: ${registrationId}`, 400, 1180);

                // Footer hint
                ctx.fillStyle = '#0e7490';
                ctx.font = 'italic 16px Inter, sans-serif';
                ctx.fillText('Present this QR code at the entrance for verification', 400, 1220);

                // Trigger download
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                const safeTitle = (event.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
                link.download = `EventPass-${safeTitle}.png`;
                link.click();
                resolve();
            };

            qrImage.onerror = () => reject(new Error('Failed to load QR code image'));
            qrImage.src = qrCode;
        };

        logoImage.onerror = () => reject(new Error('Failed to load logo image'));
        logoImage.src = '/DigiflashLogo.png';
    });
};
