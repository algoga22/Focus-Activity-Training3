import sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm

out = sys.argv[1]
doc = SimpleDocTemplate(out, pagesize=landscape(A4), leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm,
                        title="Training 3 - Session Plan")
ss = getSampleStyleSheet()
cell = ParagraphStyle('c', parent=ss['BodyText'], fontSize=9.5, leading=12)
head = ParagraphStyle('h', parent=cell, fontName='Helvetica-Bold', textColor=colors.white)
P = lambda t, s=cell: Paragraph(t, s)

rows = [
 ("0–5","Welcome participants and introduce the session","5'","Introductions, agenda and what they'll take home at the end","Slides"),
 ("5–10","Assess what participants already know","5'","Short quiz with 5 real-life situations (\"What would you do if…?\"), answered on the phone after scanning a QR code (paper sheet as backup)","<b>Challenge 2</b>"),
 ("10–18","Recognise that something has gone wrong","8'","Explanation with everyday examples (hacked account, virus, email sent to the wrong person, lost laptop) and an analogy: it's like a fire, the sooner you spot it, the less damage it does","Slides"),
 ("18–26","Apply the first steps","8'","One easy-to-remember rule, e.g. <b>Stop, Disconnect, Report, Write down</b>. What to do and what NOT to do (don't delete anything, don't hide it, don't pay)","Slides"),
 ("26–41","Play an incident response game","15'","The game that brings together all the learning objectives","<b>Challenge 3</b>"),
 ("41–55","Practise with a real NGO case and measure what participants have learned","14'","Each participant first answers a realistic case alone on a short sheet (this shows what they have learned), then groups compare answers and the trainer runs the debrief (5' alone + 5' in groups + 4' debrief)","<b>Challenge 4</b>"),
 ("55–60","Review key points and close","5'","Hand out the cheat sheet, recap the key messages and collect feedback","<b>Challenge 5</b>"),
]
data = [[P(h, head) for h in ("Min","Topic (What?)","Duration","Description (How?)","Challenge")]]
data += [[P(c) for c in r] for r in rows]
data.append([P(""), P("<b>Total</b>"), P("<b>60'</b>"), P(""), P("")])

t = Table(data, colWidths=[18*mm, 62*mm, 20*mm, 132*mm, 35*mm], repeatRows=1)
navy = colors.HexColor("#1F3A5F")
t.setStyle(TableStyle([
 ('BACKGROUND',(0,0),(-1,0),navy),
 ('ROWBACKGROUNDS',(0,1),(-1,-2),[colors.white, colors.HexColor("#EEF2F7")]),
 ('BACKGROUND',(0,-1),(-1,-1),colors.HexColor("#D9E1EC")),
 ('GRID',(0,0),(-1,-1),0.5,colors.HexColor("#B0BCCB")),
 ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
 ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
]))
title = ParagraphStyle('t', parent=ss['Title'], fontSize=17, textColor=navy, spaceAfter=2)
sub = ParagraphStyle('s', parent=ss['BodyText'], fontSize=10.5, textColor=colors.HexColor("#555555"), alignment=1)
note = ParagraphStyle('n', parent=ss['BodyText'], fontSize=9, textColor=colors.HexColor("#444444"), leading=12)
story = [Paragraph("Training 3 – When something goes wrong: a simple incident response", title),
         Paragraph("Session plan · 60 minutes", sub), Spacer(1,8*mm), t, Spacer(1,6*mm),
         Paragraph("• <b>Challenge 1 (Training plan)</b> is this table, once completed with the official learning objectives.", note),
         Paragraph("• <b>Slides</b> support the whole session.", note),
         Paragraph("• Topics are provisional until the official Training 3 learning objectives are confirmed.", note)]
doc.build(story)
