"""Build 02-learner-assessment/answer-sheet.pdf: 2 answer sheets per A4 page (cut in half).

Usage: python build_answer_sheet.py <output.pdf>   (requires reportlab)
"""
import sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm

NAVY = colors.HexColor("#1F3A5F")
GREY = colors.HexColor("#5B6778")
QUESTIONS = [
    ("Q1", "Which are security incidents? (all that apply)", "ABCD"),
    ("Q2", "Locked screen asking for money: first step?", "ABCD"),
    ("Q3", "Friday 18:00, coordinator gone: what do you do?", "ABCD"),
    ("Q4", "What is most useful to write down?", "ABCD"),
    ("Q5", "\"Just delete that strange email\": what do you do?", "ABCD"),
]

c = canvas.Canvas(sys.argv[1], pagesize=A4)
c.setTitle("Training 3 - Quiz answer sheet")
W, H = A4
half = H / 2
for top in (H, half):
    y = top - 18 * mm
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 16)
    c.drawString(18 * mm, y, "What would you do?  ·  Answer sheet")
    c.setFillColor(GREY); c.setFont("Helvetica", 10)
    c.drawString(18 * mm, y - 6 * mm, "Training 3 – When something goes wrong  ·  Tick your answers at the start, then again at the end. Not an exam.")
    c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 12)
    c.drawString(18 * mm, y - 17 * mm, "Your nickname:")
    c.setStrokeColor(GREY); c.line(52 * mm, y - 18 * mm, 120 * mm, y - 18 * mm)
    y -= 26 * mm
    # two columns of boxes: start of the session and end of the session (same questions, to measure progress)
    for x0, title in ((112 * mm, "START (min 5)"), (158 * mm, "END (min 53)")):
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 9); c.drawString(x0, y, title)
    y -= 9 * mm
    for qn, label, opts in QUESTIONS:
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 11); c.drawString(18 * mm, y, qn)
        c.setFillColor(colors.black); c.setFont("Helvetica", 9.5); c.drawString(28 * mm, y, label)
        for x0 in (112 * mm, 158 * mm):
            x = x0
            for o in opts:
                c.setStrokeColor(NAVY); c.rect(x, y - 1.2 * mm, 4.5 * mm, 4.5 * mm)
                c.setFont("Helvetica-Bold", 9.5); c.drawString(x + 5.5 * mm, y, o)
                x += 10.5 * mm
        y -= 11.5 * mm
    if top == H:
        c.setDash(3, 3); c.setStrokeColor(colors.lightgrey); c.line(10 * mm, half, W - 10 * mm, half); c.setDash()
c.save()
