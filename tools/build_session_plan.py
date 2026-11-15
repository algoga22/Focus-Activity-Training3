import sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm

out = sys.argv[1]
doc = SimpleDocTemplate(out, pagesize=landscape(A4), leftMargin=15*mm, rightMargin=15*mm, topMargin=10*mm, bottomMargin=10*mm,
                        title="Training 3 - Session Plan")
ss = getSampleStyleSheet()
cell = ParagraphStyle('c', parent=ss['BodyText'], fontSize=7.9, leading=9.4)
head = ParagraphStyle('h', parent=cell, fontName='Helvetica-Bold', textColor=colors.white)
P = lambda t, s=cell: Paragraph(t, s)

rows = [
 ('0–5', 'Welcome participants and introduce the session', "5'", '—', 'Who we are (the 3 trainers), warm-up "Raise your hand if…" (strange email, lost device, not sure who to call), agenda of the hour and the 3 things they will take home. Participants scan the QR code of the web app while we introduce ourselves', 'Slides'),
 ('5–10', 'Assess what participants already know', "5'", 'LO1–LO5', 'Diagnostic quiz "What would you do?": 5 real-life incidents with 4 options each, 1 per objective, answered on the phone in our web app (QR code, nickname, no account). The right answers are not shown yet: the same quiz comes back at the end. The trainer sees the results per objective live and spends more time on the weakest ones. Paper answer sheet as backup', '<b>Challenge 2</b>'),
 ('10–18', 'Recognise that something has gone wrong', "8'", 'LO1', '"Spot it": what an incident is (something lost, leaked or acting strange: mistakes count too), 4 everyday incidents and their signs (hacked account, ransomware, email to the wrong person, lost device), the fire analogy (the sooner you spot it, the less damage), "Incident or not?" thumbs-up vote, key message: not sure? sound the alarm', 'Slides'),
 ('18–26', 'Apply the first steps', "8'", 'LO2–LO5', '"Act on it": one rule, <b>Stop, Disconnect, Report, Write down</b>, said aloud together and linked to the fire. Each step in detail (leave the computer on; lost device: report straight away; backup contact on Friday 18:00; a 4-line note + photo), what never to do (pay, delete, hide, restart, forward), worked example on the ransom screen', 'Slides'),
 ('26–41', 'Play an incident response game', "15'", 'LO1–LO5', 'Game "Put out the fire" in the same web app: 4 rooms of the NGO (4 incidents) × 4 phases (the 4 steps). One fire for the whole team that grows every second: right move = water, trap card = petrol; individual points and a surprise "hacker" message. 1\' rules + ~10\' play + ~4\' debrief (rooms saved, right moves per objective next to the quiz at the start, most chosen trap cards)', '<b>Challenge 3</b>'),
 ('41–53', 'Practise with a real NGO case', "12'", 'to choose', "Each participant first solves a new, realistic NGO case alone on a short sheet, then groups compare answers and agree on the best response, then the trainer runs the debrief (4' alone + 4' in groups + 4' debrief). Case to be finalised", '<b>Challenge 4</b>'),
 ('53–56', 'Measure what participants have learned', "3'", 'LO1–LO5', 'The same 5 quiz questions again in the web app (30 s each). The trainer shows the before / after comparison per objective, the team score and how many people improved; each person sees their own progress on the phone', '<b>Challenge 2</b>'),
 ('56–60', 'Review key points and close', "4'", 'LO1–LO5', 'Hand out the one-page cheat sheet (the 4 steps, who to call, what never to do), recap the key messages and collect feedback', '<b>Challenge 5</b>'),
]
data = [[P(h, head) for h in ("Min","Topic (What?)","Duration","Objectives","Description (How?)","Challenge")]]
data += [[P(c) for c in r] for r in rows]
data.append([P(""), P("<b>Total</b>"), P("<b>60'</b>"), P(""), P(""), P("")])

t = Table(data, colWidths=[16*mm, 52*mm, 18*mm, 22*mm, 134*mm, 25*mm], repeatRows=1)
navy = colors.HexColor("#1F3A5F")
t.setStyle(TableStyle([
 ('BACKGROUND',(0,0),(-1,0),navy),
 ('ROWBACKGROUNDS',(0,1),(-1,-2),[colors.white, colors.HexColor("#EEF2F7")]),
 ('BACKGROUND',(0,-1),(-1,-1),colors.HexColor("#D9E1EC")),
 ('GRID',(0,0),(-1,-1),0.5,colors.HexColor("#B0BCCB")),
 ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
 ('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),
]))
title = ParagraphStyle('t', parent=ss['Title'], fontSize=17, textColor=navy, spaceAfter=2)
sub = ParagraphStyle('s', parent=ss['BodyText'], fontSize=10.5, textColor=colors.HexColor("#555555"), alignment=1)
note = ParagraphStyle('n', parent=ss['BodyText'], fontSize=9, textColor=colors.HexColor("#444444"), leading=12)
story = [Paragraph("Training 3 – When something goes wrong: a simple incident response", title),
         Paragraph("Session plan · 60 minutes", sub), Spacer(1,3*mm), t, Spacer(1,3*mm),
         Paragraph("• <b>Challenge 1 (Training plan)</b> is this table, once completed with the official learning objectives.", note),
         Paragraph("• <b>Learning objectives:</b> LO1 Recognise an incident · LO2 Take the first steps (stop and disconnect) · LO3 Report quickly to the right person · LO4 Write down what happened · LO5 Avoid the common mistakes (paying, deleting, hiding).", note),
         Paragraph("• <b>Measuring learning:</b> the same quiz at the start (min 5) and at the end (min 53), compared automatically per objective and per person; the game (min 26) measures the same objectives in between.", note),
         Paragraph("• <b>Materials:</b> slides (LaTeX), our web app for the quiz and the game (QR code, no account), paper answer sheet as backup, case sheet (Challenge 4) and cheat sheet (Challenge 5).", note),
         Paragraph("• Topics are provisional until the official Training 3 learning objectives are confirmed.", note)]
doc.build(story)
