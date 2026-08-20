import re
import os
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.pagesizes import A4, portrait
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm

md_file = r"C:\Users\Santharam S\.gemini\antigravity-ide\brain\71abf77d-0a58-45ba-b836-91ea2e0c772e\DigiFlash_User_Manual.md"
output_file = r"d:\MiniProject\Event_Management_System\DigiFlash_User_Manual_Clean.pdf"

# Premium Color Palette
INDIGO = colors.Color(79/255, 70/255, 229/255)
IND_LIGHT = colors.Color(238/255, 242/255, 255/255)
SLATE_900 = colors.Color(15/255, 23/255, 42/255)
SLATE_700 = colors.Color(51/255, 65/255, 85/255)
SLATE_500 = colors.Color(100/255, 116/255, 139/255)
WHITE = colors.white

def draw_cover_page(canvas, doc):
    canvas.saveState()
    # Draw white background
    canvas.setFillColor(WHITE)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    
    # Draw a neat accent line
    canvas.setStrokeColor(INDIGO)
    canvas.setLineWidth(3)
    canvas.line(40*mm, 150*mm, A4[0]-40*mm, 150*mm)
    
    # Title Text
    canvas.setFillColor(INDIGO)
    canvas.setFont("Helvetica-Bold", 46)
    canvas.drawCentredString(A4[0]/2, 165*mm, "DigiFlash")
    
    # Subtitle
    canvas.setFont("Helvetica", 18)
    canvas.setFillColor(SLATE_900)
    canvas.drawCentredString(A4[0]/2, 135*mm, "Event Management System")
    
    # App Explanation
    canvas.setFont("Helvetica", 12)
    canvas.setFillColor(SLATE_700)
    canvas.drawCentredString(A4[0]/2, 115*mm, "A comprehensive digital platform for event lifecycles,")
    canvas.drawCentredString(A4[0]/2, 108*mm, "smart registrations, QR attendance, and certificates.")
    
    # Tagline
    canvas.setFont("Helvetica-Bold", 11)
    canvas.setFillColor(INDIGO)
    canvas.drawCentredString(A4[0]/2, 90*mm, "Complete User Manual & Feature Guide")
    
    # Footer on cover
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(SLATE_500)
    canvas.drawCentredString(A4[0]/2, 20*mm, "© 2026 Association of CSE. All Rights Reserved.")
    
    canvas.restoreState()

def draw_header_footer(canvas, doc):
    canvas.saveState()
    
    # Header line
    canvas.setStrokeColor(SLATE_500)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, A4[1]-doc.topMargin+10, A4[0]-doc.rightMargin, A4[1]-doc.topMargin+10)
    
    # Header text
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(INDIGO)
    canvas.drawString(doc.leftMargin, A4[1]-doc.topMargin+14, "DigiFlash - Event Management System")
    canvas.drawRightString(A4[0]-doc.rightMargin, A4[1]-doc.topMargin+14, "User Manual")
    
    # Footer line
    canvas.setStrokeColor(SLATE_500)
    canvas.line(doc.leftMargin, doc.bottomMargin-10, A4[0]-doc.rightMargin, doc.bottomMargin-10)
    
    # Footer text (Page numbers)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SLATE_700)
    page_num = f"Page {doc.page}"
    canvas.drawCentredString(A4[0]/2, doc.bottomMargin-20, page_num)
    
    canvas.restoreState()

# Define the document template with two page templates: Cover and Normal
doc = BaseDocTemplate(output_file, pagesize=portrait(A4), rightMargin=20*mm, leftMargin=20*mm, topMargin=25*mm, bottomMargin=25*mm)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='normal')
template_cover = PageTemplate(id='cover', frames=frame, onPage=draw_cover_page)
template_normal = PageTemplate(id='normal', frames=frame, onPage=draw_header_footer)
doc.addPageTemplates([template_cover, template_normal])

styles = getSampleStyleSheet()

# Create Custom Aesthetic Styles
title_style = ParagraphStyle('Title', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=24, textColor=INDIGO, spaceAfter=20)
h1_style = ParagraphStyle('Heading1', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, textColor=INDIGO, spaceAfter=12, spaceBefore=24)
h2_style = ParagraphStyle('Heading2', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, textColor=SLATE_900, spaceAfter=10, spaceBefore=18)
h3_style = ParagraphStyle('Heading3', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=12, textColor=SLATE_700, spaceAfter=8, spaceBefore=12)
normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=SLATE_900, spaceAfter=8, leading=16)
bullet_style = ParagraphStyle('Bullet', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=SLATE_900, spaceAfter=6, leading=16, leftIndent=20, bulletIndent=10)

content = []

# Trigger Cover Page
content.append(Spacer(1, 1))
content.append(PageBreak())

# Read Markdown Source
with open(md_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

in_table = False
table_data = []

def process_table(table_data):
    filtered = []
    for row in table_data:
        # Ignore markdown table separators
        if all('-' in cell or ':' in cell for cell in row) and len(row) > 0 and '---' in row[0]:
            continue
        
        processed_row = []
        for cell in row:
            cell = cell.strip()
            cell = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', cell)
            processed_row.append(Paragraph(cell, normal_style))
        filtered.append(processed_row)
        
    if not filtered: return None
    
    cols = len(filtered[0])
    avail_width = A4[0] - 40*mm
    if cols == 2:
        col_widths = [avail_width * 0.3, avail_width * 0.7]
    elif cols == 3:
        col_widths = [avail_width * 0.25, avail_width * 0.5, avail_width * 0.25]
    elif cols == 8:
        col_widths = [avail_width * 0.23] + [avail_width * 0.11] * 7
    else:
        col_widths = [avail_width / cols] * cols

    t = Table(filtered, colWidths=col_widths, repeatRows=1)
    # Zebra striping for enhanced table UI
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), INDIGO),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, IND_LIGHT]), # Zebra stripe rows
        ('GRID', (0, 0), (-1, -1), 0.5, SLATE_500),
    ]))
    return t

for line in lines:
    line = line.strip()
    if not line:
        continue
        
    if line.startswith("|"):
        in_table = True
        row = [cell.strip() for cell in line.split("|") if cell.strip()]
        if row:
            table_data.append(row)
        continue
    else:
        if in_table:
            t = process_table(table_data)
            if t:
                content.append(t)
                content.append(Spacer(1, 15))
            in_table = False
            table_data = []

    # Map markdown headings to paragraph styles
    if line.startswith("# "):
        content.append(Paragraph(line[2:].replace('**', ''), title_style))
    elif line.startswith("## "):
        content.append(Paragraph(line[3:].replace('**', ''), h1_style))
    elif line.startswith("### "):
        content.append(Paragraph(line[4:].replace('**', ''), h2_style))
    elif line.startswith("#### "):
        content.append(Paragraph(line[5:].replace('**', ''), h3_style))
    elif line.startswith("- "):
        line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
        content.append(Paragraph(line[2:], bullet_style, bulletText="•"))
    elif line[0].isdigit() and line[1:3] == ". ":
        line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
        num = line.split(". ")[0] + "."
        text = line.split(". ", 1)[1]
        content.append(Paragraph(text, bullet_style, bulletText=num))
    elif line.startswith(">"):
        line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
        content.append(Paragraph("<i>" + line[1:].strip() + "</i>", normal_style))
    elif line == "---":
        content.append(Spacer(1, 15))
    else:
        line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
        line = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', line)
        content.append(Paragraph(line, normal_style))

if in_table:
    t = process_table(table_data)
    if t: content.append(t)

# Build PDF using the flowables
doc.build(content)
print(f"Enhanced PDF Generated Successfully: {output_file}")