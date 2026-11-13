"""Build slides/Training3_Slides.pptx (first draft).

Usage: python build_slides.py <output.pptx>   (requires python-pptx and Pillow, macOS for the emoji font)
Icons are emoji rendered to PNG images, so they look the same in PowerPoint, Keynote and PDF exports.
"""
import os
import tempfile
from PIL import Image, ImageDraw, ImageFont
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

NAVY = RGBColor(0x1F, 0x3A, 0x5F)
BG = RGBColor(0xF7, 0xF9, 0xFC)
ALERT = RGBColor(0xE4, 0x57, 0x2E)
GREEN = RGBColor(0x2E, 0x9E, 0x5B)
SOFT = RGBColor(0xE3, 0xEA, 0xF3)
GREY = RGBColor(0x5B, 0x67, 0x78)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = "Calibri"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
W = 13.333
BLANK = prs.slide_layouts[6]


def new_slide(bg=BG, notes=""):
    s = prs.slides.add_slide(BLANK)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = bg
    if notes:
        s.notes_slide.notes_text_frame.text = notes
    return s


def text(s, x, y, w, h, t, size=24, bold=False, color=NAVY, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for i, line in enumerate(t.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run()
        r.text = line
        r.font.size, r.font.bold, r.font.name = Pt(size), bold, FONT
        r.font.color.rgb = color
    return tb


def box(s, x, y, w, h, fill, t="", size=22, bold=True, color=WHITE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, align=PP_ALIGN.CENTER):
    sh = s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    sh.shadow.inherit = False
    if t:
        tf = sh.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        for i, line in enumerate(t.split("\n")):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.alignment = align
            r = p.add_run()
            r.text = line
            r.font.size, r.font.bold, r.font.name = Pt(size), bold, FONT
            r.font.color.rgb = color
    return sh


ICON_DIR = tempfile.mkdtemp()
EMOJI_FONT = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", 160)


def emoji_png(ch):
    path = os.path.join(ICON_DIR, "-".join(f"{ord(c):x}" for c in ch) + ".png")
    if not os.path.exists(path):
        im = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((100, 100), ch, font=EMOJI_FONT, embedded_color=True, anchor="mm")
        im.crop(im.getbbox()).save(path)
    return path


def icons(s, x, y, w, h, chars, gap=0.25):
    """Place one or more emoji icons (list of strings), centred in the (x, y, w, h) area."""
    n = len(chars)
    size = min(h, (w - gap * (n - 1)) / n)
    x0 = x + (w - (n * size + gap * (n - 1))) / 2
    for i, ch in enumerate(chars):
        s.shapes.add_picture(emoji_png(ch), Inches(x0 + i * (size + gap)), Inches(y + (h - size) / 2), Inches(size), Inches(size))


def title(s, t, color=NAVY):
    text(s, 0.7, 0.45, W - 1.4, 1.0, t, size=36, bold=True, color=color)


def section(t, sub, notes):
    s = new_slide(NAVY, notes)
    text(s, 0.9, 2.6, W - 1.8, 1.3, t, size=54, bold=True, color=WHITE)
    text(s, 0.9, 3.9, W - 1.8, 0.8, sub, size=26, color=SOFT)
    return s


# 1 – Title
s = new_slide(NAVY, "Welcome everyone. Introduce the trainers. Today: what to do when something goes wrong with computers, phones or data at the NGO. No technical knowledge needed.")
box(s, 0.9, 1.5, 1.3, 1.3, ALERT, "!", size=60, shape=MSO_SHAPE.OVAL)
text(s, 0.9, 3.0, W - 1.8, 1.2, "When something goes wrong", size=52, bold=True, color=WHITE)
text(s, 0.9, 4.3, W - 1.8, 0.8, "A simple incident response for NGOs", size=30, color=SOFT)
text(s, 0.9, 6.4, W - 1.8, 0.5, "Cybersecurity for NGOs · Training 3 · 60 minutes", size=16, color=SOFT)

# 2 – Agenda
s = new_slide(notes="Show the 6 steps of the session. Animation: reveal the timeline from left to right (Wipe), one step per click.")
title(s, "Our hour together")
steps = [("5'", "Quiz", "What do you\nalready know?"), ("16'", "Learn", "Spot it &\nact on it"),
         ("12'", "Play", "Incident\ngame"), ("17'", "Practise", "A real NGO\ncase"), ("5'", "Take home", "Your\ncheat sheet")]
bw, gap, x0 = 2.15, 0.33, 0.7
for i, (mins, name, desc) in enumerate(steps):
    x = x0 + i * (bw + gap)
    box(s, x, 2.0, bw, 1.6, NAVY if i != 1 else ALERT, f"{name}\n{mins}", size=26)
    text(s, x, 3.8, bw, 1.2, desc, size=20, color=GREY, align=PP_ALIGN.CENTER)
    if i < len(steps) - 1:
        box(s, x + bw + 0.04, 2.6, 0.25, 0.4, GREY, shape=MSO_SHAPE.RIGHT_ARROW)

# 3 – Quiz intro
s = new_slide(notes="Onsite: hand out the answer sheet; participants write their nickname (e.g. their 'cyber name'). Online: they type 'Q1: A, C' in the chat. Reassure: this is not an exam, there are no bad marks. About 1 minute per question. Do NOT give the answers yet.")
title(s, "What would you do?")
text(s, 0.7, 1.5, W - 1.4, 0.8, "5 short questions · 5 minutes · not an exam", size=26, color=GREY)
box(s, 0.9, 2.8, 5.5, 3.0, SOFT, "In the room\n\nTick your answers\non the paper sheet", size=26, color=NAVY)
box(s, 6.9, 2.8, 5.5, 3.0, SOFT, "Online\n\nType your answer\nin the chat: \"Q1: A\"", size=26, color=NAVY)

# 4–8 – Quiz questions
quiz = [
    ("Q1", "Which of these are security incidents?", "Choose all that apply",
     ["You lose the work phone with the beneficiaries' contacts",
      "You forget your password and ask for a new one",
      "Your email sends messages you didn't write",
      "You send the volunteers' addresses to the wrong person"]),
    ("Q2", "\"Your files are locked. Pay €500 to get them back.\"", "What do you do first?",
     ["Pay quickly so the NGO doesn't lose its files",
      "Turn off the Wi-Fi or unplug the cable, and stop using the computer",
      "Restart the computer to see if the message goes away"]),
    ("Q3", "Friday, 18:00. You clicked a strange link. Your coordinator has gone home.", "What do you do?",
     ["Wait until Monday and tell the coordinator then",
      "Call the backup contact person now",
      "Say nothing if everything looks normal again"]),
    ("Q4", "Something went wrong. What do you write down?", "Choose the most useful answer",
     ["Nothing: the IT person will find out",
      "What happened, when, and what you saw (photo of the screen)",
      "Only your name and your department"]),
    ("Q5", "\"Just delete that strange email and forget about it.\"", "What do you do?",
     ["Delete it: once it's gone, the danger is gone",
      "Keep it, don't click anything and report it",
      "Forward it to the whole team to warn them"]),
]
for qn, q, hint, opts in quiz:
    s = new_slide(notes=f"{qn}: read the question and the options aloud. Give about 1 minute. Don't comment on the answers yet. (Answer key: see 02-learner-assessment/README.md)")
    box(s, 0.7, 0.5, 1.1, 1.1, ALERT, qn, size=28, shape=MSO_SHAPE.OVAL)
    text(s, 2.0, 0.45, W - 2.7, 1.3, q, size=32, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    text(s, 2.0, 1.75, W - 2.7, 0.5, hint, size=20, color=GREY)
    oh = 1.05 if len(opts) == 4 else 1.25
    for i, o in enumerate(opts):
        y = 2.55 + i * (oh + 0.18)
        box(s, 0.9, y, W - 1.8, oh, SOFT, "")
        box(s, 1.1, y + (oh - 0.75) / 2, 0.75, 0.75, NAVY, "ABCD"[i], size=24, shape=MSO_SHAPE.OVAL)
        text(s, 2.1, y, W - 3.3, oh, o, size=24, anchor=MSO_ANCHOR.MIDDLE)

# 9 – Section: spot it
section("1 · Spot it", "Is something wrong?",
        "Transition to the first topic. Ask: 'Has something strange ever happened to your computer or phone at work?' Take 1–2 answers.")

# 10 – Signs
s = new_slide(notes="These are all incidents, not only viruses or hackers. Mistakes count too (wrong email, lost phone). Animation: show the 4 cards one by one (Appear), ask the room for an example of each.")
title(s, "These are all incidents")
signs = [("📱", "Lost or stolen\nphone or laptop"), ("🔒", "Strange message\non the screen"),
         ("✉️", "Email sent to\nthe wrong person"), ("👤", "Your account does\nthings you didn't do")]
cw = 2.75
for i, (ico, lab) in enumerate(signs):
    x = 0.7 + i * (cw + 0.3)
    box(s, x, 1.9, cw, 3.9, WHITE, "")
    icons(s, x, 2.35, cw, 1.2, [ico])
    text(s, x + 0.15, 4.0, cw - 0.3, 1.5, lab, size=22, bold=True, align=PP_ALIGN.CENTER)
text(s, 0.7, 6.2, W - 1.4, 0.6, "Not sure? Treat it as an incident.", size=24, bold=True, color=ALERT, align=PP_ALIGN.CENTER)

# 11 – Fire analogy
s = new_slide(notes="Analogy: a small fire in a bin is easy to put out. If you close the door and hope, the whole building burns. Incidents are the same: the sooner someone knows, the smaller the damage. Animation: show the small fire first, then the arrow and the big fire.")
title(s, "Like a fire: act early")
box(s, 1.2, 2.2, 3.6, 3.0, WHITE, "")
icons(s, 1.2, 2.55, 3.6, 0.7, ["🔥"])
text(s, 1.2, 4.0, 3.6, 1.0, "Seen early:\nsmall damage", size=24, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
box(s, 5.3, 3.3, 2.6, 0.8, SOFT, "time", size=20, color=GREY, shape=MSO_SHAPE.RIGHT_ARROW)
box(s, 8.4, 2.2, 3.6, 3.0, WHITE, "")
icons(s, 8.6, 2.5, 3.2, 1.05, ["🔥", "🔥", "🔥"], gap=0.05)
text(s, 8.4, 4.0, 3.6, 1.0, "Hidden or late:\nbig damage", size=24, bold=True, color=ALERT, align=PP_ALIGN.CENTER)

# 12 – Section: act
section("2 · Act on it", "4 simple steps",
        "Transition to the second topic: what to do in the first minutes.")

# 13 – The 4 steps
s = new_slide(notes="The key message of the training. Repeat it: Stop, Disconnect, Report, Write down. Animation: reveal the 4 steps one by one (Fly in from the left).")
title(s, "4 steps when something goes wrong")
four = [("1", "STOP", "Don't click\nanything else"), ("2", "DISCONNECT", "Wi-Fi off or\ncable out"),
        ("3", "REPORT", "Call your\ncontact person"), ("4", "WRITE DOWN", "What, when,\nwhat you saw")]
for i, (n, name, desc) in enumerate(four):
    x = 0.7 + i * (cw + 0.3)
    box(s, x, 1.8, cw, 4.6, NAVY, "")
    box(s, x + cw / 2 - 0.55, 2.1, 1.1, 1.1, ALERT, n, size=36, shape=MSO_SHAPE.OVAL)
    text(s, x, 3.5, cw, 0.7, name, size=24, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    text(s, x, 4.4, cw, 1.4, desc, size=22, color=SOFT, align=PP_ALIGN.CENTER)

# 14 – Stop & disconnect
s = new_slide(notes="Disconnecting stops the problem from spreading to other computers and to the NGO's shared files. Don't switch the computer off: the IT helper may need what is on the screen. Demo: show where the Wi-Fi button is on a laptop and a phone.")
title(s, "Steps 1–2: Stop and disconnect")
box(s, 0.9, 1.9, 5.6, 4.2, WHITE, "")
icons(s, 0.9, 2.2, 5.6, 1.3, ["✋", "📶"], gap=0.5)
text(s, 1.2, 3.8, 5.0, 2.0, "Turn off the Wi-Fi\nUnplug the cable", size=28, bold=True, color=GREEN, align=PP_ALIGN.CENTER)
box(s, 6.9, 1.9, 5.6, 4.2, WHITE, "")
icons(s, 6.9, 2.2, 5.6, 1.3, ["💻", "🚫"], gap=0.5)
text(s, 7.2, 3.8, 5.0, 2.0, "Don't switch off\nthe computer", size=28, bold=True, color=ALERT, align=PP_ALIGN.CENTER)

# 15 – Report
s = new_slide(notes="Every NGO needs a contact person AND a backup. Fill in the real names with the participants, or ask them to write them on their cheat sheet. Message: reporting is not admitting a fault, it is protecting the NGO and its beneficiaries.")
title(s, "Step 3: Report it now")
box(s, 0.9, 1.9, 5.6, 2.0, NAVY, "Contact person\n______________", size=28)
box(s, 6.9, 1.9, 5.6, 2.0, GREY, "Backup person\n______________", size=28)
text(s, 0.9, 4.4, W - 1.8, 0.8, "Not today, not Monday: now.", size=30, bold=True, color=ALERT, align=PP_ALIGN.CENTER)
text(s, 0.9, 5.3, W - 1.8, 0.8, "Reporting = protecting, not confessing", size=26, color=GREY, align=PP_ALIGN.CENTER)

# 16 – Write down
s = new_slide(notes="Notes help the person who fixes the problem, and are needed if the NGO has to inform its beneficiaries or the authorities (e.g. personal data). Animation: reveal the 4 items one by one.")
title(s, "Step 4: Write it down")
items = [("❓", "What\nhappened?"), ("🕒", "When?"), ("👀", "What did\nyou see?"), ("📸", "Photo of\nthe screen")]
for i, (ico, lab) in enumerate(items):
    x = 0.7 + i * (cw + 0.3)
    box(s, x, 2.0, cw, 3.8, WHITE, "")
    icons(s, x, 2.4, cw, 1.2, [ico])
    text(s, x, 4.0, cw, 1.4, lab, size=26, bold=True, align=PP_ALIGN.CENTER)

# 17 – Never
s = new_slide(notes="The 3 most common mistakes. Paying gives no guarantee and funds criminals. Deleting removes the evidence. Hiding it lets the fire grow. Animation: reveal each cross one by one.")
title(s, "Never do this", color=ALERT)
nevers = [("💶", "Pay"), ("🗑️", "Delete"), ("🙈", "Hide it")]
nw = 3.7
for i, (ico, lab) in enumerate(nevers):
    x = 0.9 + i * (nw + 0.35)
    box(s, x, 1.9, nw, 4.3, WHITE, "")
    icons(s, x, 2.35, nw, 1.4, [ico])
    text(s, x, 4.1, nw, 1.0, "✗ " + lab, size=36, bold=True, color=ALERT, align=PP_ALIGN.CENTER)

# 18 – Game
s = new_slide(NAVY, "Challenge 3 – serious game (to be designed). Explain the rules in under a minute.")
box(s, W / 2 - 0.8, 1.4, 1.6, 1.6, ALERT, "▶", size=48, shape=MSO_SHAPE.OVAL)
text(s, 0.9, 3.3, W - 1.8, 1.2, "Game time!", size=60, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
text(s, 0.9, 4.6, W - 1.8, 0.8, "[Challenge 3 – rules to be added]", size=26, color=SOFT, align=PP_ALIGN.CENTER)

# 19 – Case
s = new_slide(notes="Challenge 4. Read the case aloud. Participants first answer ALONE on the sheet (5'), then compare in groups (6'). Online: breakout rooms or the chat.")
title(s, "Your turn: Friday at the food bank")
box(s, 0.9, 1.7, W - 1.8, 2.3, WHITE, "")
text(s, 1.2, 1.85, W - 2.4, 2.0,
     "17:00. Marie, a volunteer, opens the email \"Invoice overdue\" and clicks the attachment. "
     "Her screen goes black: \"Pay €500 in Bitcoin.\" The coordinator has gone home. There is no IT person.",
     size=24, anchor=MSO_ANCHOR.MIDDLE)
qs = ["What does Marie do first?", "Who does she tell?", "What does she write down?", "What must she NOT do?"]
for i, q in enumerate(qs):
    x = 0.9 + i * 2.95
    box(s, x, 4.4, 2.75, 1.8, NAVY, f"{i + 1}\n{q}", size=20)
text(s, 0.9, 6.45, W - 1.8, 0.5, "5' alone  →  6' in groups  →  6' together", size=20, color=GREY, align=PP_ALIGN.CENTER)

# 20 – Case answers
s = new_slide(notes="Debrief. Reveal the answers one by one (Appear). Ask: 'Who got this right? And who would have waited until Monday in the quiz at the start?' This shows the progress.")
title(s, "What Marie should do")
ans = [("1", "Stop and disconnect", GREEN), ("2", "Call the backup contact now", GREEN),
       ("3", "What, when, photo of the screen", GREEN), ("4", "Pay, delete, switch off, wait", ALERT)]
for i, (n, a, c) in enumerate(ans):
    y = 1.7 + i * 1.25
    box(s, 0.9, y, 0.95, 0.95, c, n, size=28, shape=MSO_SHAPE.OVAL)
    box(s, 2.1, y, W - 3.0, 0.95, WHITE, ("✗ " if c == ALERT else "✓ ") + a, size=26, color=c, align=PP_ALIGN.LEFT)

# 21 – Take home
s = new_slide(notes="Hand out the cheat sheet (Challenge 5). Ask participants to write their contact person and backup on it and keep it next to their computer.")
title(s, "Keep this next to your computer")
for i, (n, name, _) in enumerate(four):
    y = 1.8 + i * 1.15
    box(s, 0.9, y, 0.9, 0.9, ALERT, n, size=28, shape=MSO_SHAPE.OVAL)
    text(s, 2.0, y, 4.5, 0.9, name, size=30, bold=True, anchor=MSO_ANCHOR.MIDDLE)
box(s, 7.2, 1.8, 5.2, 4.4, WHITE, "")
icons(s, 7.2, 2.3, 5.2, 1.3, ["📄"])
text(s, 7.2, 3.9, 5.2, 1.2, "Your cheat sheet\n[Challenge 5]", size=26, bold=True, align=PP_ALIGN.CENTER)

# 22 – Thank you
s = new_slide(NAVY, "Collect feedback: participants show thumbs up / middle / down (onsite) or use the call reactions (online). Ask for one thing to improve.")
text(s, 0.9, 2.2, W - 1.8, 1.2, "Thank you!", size=60, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
text(s, 0.9, 3.6, W - 1.8, 0.8, "How was today?", size=30, color=SOFT, align=PP_ALIGN.CENTER)
icons(s, 0.9, 4.6, W - 1.8, 1.0, ["👍", "👌", "👎"], gap=0.8)

prs.save(sys.argv[1])
print("slides:", len(prs.slides))
