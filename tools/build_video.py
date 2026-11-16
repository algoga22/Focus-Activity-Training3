"""30-second trailer of the project, for the 5-minute presentation.

Shows the 5 challenges with real screenshots of the web app and the PDFs, on a dark
"fire" background, with a synthesised soundtrack (no third-party music).

    uv run --with pillow --with numpy --with scipy --with pymupdf python tools/build_video.py

Needs ffmpeg and the fonts of the slides (TeX Live: Montserrat, Fira Sans, Font Awesome 5).
Output: slides/30-second-video.mp4 (1920x1080, 30 fps, AAC audio).
"""
import math, os, random, subprocess, sys, tempfile, wave
from functools import lru_cache
from pathlib import Path

import numpy as np
import pymupdf
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.signal import lfilter, fftconvolve

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'slides' / 'screenshots'
OUT = ROOT / 'slides' / '30-second-video.mp4'
W, H, FPS, DUR = 1920, 1080, 30, 30.0
N = int(FPS * DUR)

TEX = Path('/usr/local/texlive/2026/texmf-dist/fonts/opentype/public')
F_BLACK = TEX / 'montserrat/Montserrat-Black.otf'
F_XBOLD = TEX / 'montserrat/Montserrat-ExtraBold.otf'
F_BOLD = TEX / 'montserrat/Montserrat-Bold.otf'
F_BODY = TEX / 'fira/FiraSans-Medium.otf'
F_ICON = TEX / 'fontawesome5/FontAwesome5Free-Solid-900.otf'

WHITE = (255, 255, 255)
ORANGE = (255, 107, 61)
AMBER = (245, 184, 46)
GREEN = (52, 199, 123)
BLUE = (61, 139, 253)
PURPLE = (159, 84, 246)
MUTED = (160, 176, 200)
NAVY = (31, 58, 95)

BEAT = 0.6  # 100 BPM: the cuts fall on the beats
# sections (start, end): intro, title, C1, C2, C3, C4, C5, results, outro
T_TITLE, T_C1, T_C2, T_C3, T_C4, T_C5, T_RES, T_OUT, T_END = 3.0, 5.4, 8.4, 12.6, 20.4, 23.4, 25.8, 27.6, 28.9
GAME_CUTS = [T_C3, 14.4, 15.6, 16.8, 18.0, 19.2, T_C4]
STAMPS = [T_OUT + i * 0.3 for i in range(4)]
HITS = [T_TITLE, T_C1, T_C2, 10.2, *GAME_CUTS[:-1], T_C4, T_C5, T_RES, *STAMPS, T_END]


# ------------------------------------------------------------------ helpers
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a))
def ease_out(x): return 1 - (1 - x) ** 3
def ease_in_out(x): return 3 * x * x - 2 * x * x * x
def back_out(x, s=1.9): x -= 1; return 1 + x * x * ((s + 1) * x + s)


@lru_cache(None)
def font(path, size): return ImageFont.truetype(str(path), size)


@lru_cache(None)
def text_img(s, path, size, color, spacing=0, glow=0):
    """RGBA image of a text (cached). spacing = letter spacing in px, glow = blur radius of a coloured halo."""
    f = font(path, size)
    if spacing:
        widths = [f.getlength(c) + spacing for c in s]
        w = int(sum(widths) - spacing) + 4
    else:
        w = int(f.getlength(s)) + 4
    asc, desc = f.getmetrics()
    pad = glow * 3
    im = Image.new('RGBA', (w + 2 * pad, asc + desc + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if spacing:
        x = pad
        for c, cw in zip(s, widths):
            d.text((x, pad), c, font=f, fill=color); x += cw
    else:
        d.text((pad, pad), s, font=f, fill=color)
    if glow:
        halo = im.filter(ImageFilter.GaussianBlur(glow))
        halo = Image.alpha_composite(halo, halo)
        im = Image.alpha_composite(halo, im)
    return im


def with_alpha(im, a):
    if a >= 0.999: return im
    im = im.copy()
    im.putalpha(im.getchannel('A').point(lambda v: int(v * a)))
    return im


def put(frame, im, x, y, a=1.0, anchor='lt', scale=1.0, rot=0.0):
    """Paste an RGBA image. anchor: l/m/r + t/m/b."""
    if a <= 0.003: return
    if scale != 1.0:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BICUBIC)
    if rot:
        im = im.rotate(rot, Image.BICUBIC, expand=True)
    im = with_alpha(im, a)
    ox = {'l': 0, 'm': im.width / 2, 'r': im.width}[anchor[0]]
    oy = {'t': 0, 'm': im.height / 2, 'b': im.height}[anchor[1]]
    frame.alpha_composite(im, (int(x - ox), int(y - oy))) if (x - ox >= 0 and y - oy >= 0 and x - ox + im.width <= W and y - oy + im.height <= H) \
        else paste_clip(frame, im, int(x - ox), int(y - oy))


def paste_clip(frame, im, x, y):
    l, t = max(0, -x), max(0, -y)
    r, b = min(im.width, W - x), min(im.height, H - y)
    if r <= l or b <= t: return
    frame.alpha_composite(im.crop((l, t, r, b)), (x + l, y + t))


@lru_cache(None)
def card(name, width, radius=22):
    """Screenshot / page with rounded corners, a thin light border and a soft shadow (cached)."""
    if name.endswith('.pdf'):
        doc = pymupdf.open(ROOT / name)
        pix = doc[0].get_pixmap(dpi=200)
        src = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    else:
        src = Image.open(SHOTS / name).convert('RGB')
    h = round(src.height * width / src.width)
    src = src.resize((width, h), Image.LANCZOS)
    pad = 60
    out = Image.new('RGBA', (width + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    sh = Image.new('L', out.size, 0)
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 18, pad + width, pad + h + 18), radius, fill=170)
    sh = sh.filter(ImageFilter.GaussianBlur(26))
    out = Image.composite(Image.new('RGBA', out.size, (0, 0, 0, 255)), Image.new('RGBA', out.size, (0, 0, 0, 0)), sh)
    mask = Image.new('L', (width, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, h - 1), radius, fill=255)
    face = src.convert('RGBA'); face.putalpha(mask)
    out.alpha_composite(face, (pad, pad))
    ImageDraw.Draw(out).rounded_rectangle((pad, pad, pad + width - 1, pad + h - 1), radius, outline=(255, 255, 255, 90), width=2)
    return out


def shot(frame, name, cx, cy, width, a=1.0, zoom=1.0, rot=0.0, base=1400):
    """Card centred on (cx, cy) with a given visible width."""
    c = card(name, base if 'phone' not in name else 420)
    k = width / (c.width - 120) * zoom
    put(frame, c, cx, cy, a, 'mm', k, rot)


def zoom_shot(frame, name, cx, cy, width, height, focus, z, a=1.0):
    """Crop of a screenshot zoomed on focus=(fx, fy) (0..1), shown in a width x height card."""
    src = card(name, 1800)
    pad = 60
    iw, ih = src.width - 2 * pad, src.height - 2 * pad
    cw, ch = iw / z, iw / z * height / width
    fx = clamp(focus[0] * iw - cw / 2, 0, iw - cw)
    fy = clamp(focus[1] * ih - ch / 2, 0, ih - ch)
    crop = src.crop((pad + fx, pad + fy, pad + fx + cw, pad + fy + ch)).resize((width, height), Image.BICUBIC)
    m = Image.new('L', crop.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, width - 1, height - 1), 22, fill=255)
    crop.putalpha(Image.composite(crop.getchannel('A'), m, m))
    out = Image.new('RGBA', (width + 120, height + 120), (0, 0, 0, 0))
    sh = Image.new('L', out.size, 0)
    ImageDraw.Draw(sh).rounded_rectangle((60, 78, 60 + width, 78 + height), 22, fill=170)
    out = Image.composite(Image.new('RGBA', out.size, (0, 0, 0, 255)), out, sh.filter(ImageFilter.GaussianBlur(26)))
    out.alpha_composite(crop, (60, 60))
    ImageDraw.Draw(out).rounded_rectangle((60, 60, 60 + width - 1, 60 + height - 1), 22, outline=(255, 255, 255, 90), width=2)
    put(frame, out, cx, cy, a, 'mm')


# ------------------------------------------------------------------ background: night, embers, fire glow
def make_bg():
    y, x = np.mgrid[0:H, 0:W]
    d = np.sqrt(((x - W / 2) / W) ** 2 + ((y - H * 0.45) / H) ** 2)
    top, bottom = np.array([10, 20, 38]), np.array([6, 11, 22])
    g = (y / H)[..., None]
    img = top * (1 - g) + bottom * g
    img = img * (1 - 0.55 * np.clip(d - 0.25, 0, 1)[..., None])
    # faint grid, like the web app
    grid = ((x % 64 == 0) | (y % 64 == 0)) * 5
    img = img + grid[..., None]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')


def make_glow():
    y, x = np.mgrid[0:H // 2, 0:W // 2]
    d = np.sqrt(((x - W / 4) / (W / 2.4)) ** 2 + ((y - H / 2 - 40) / (H / 3.2)) ** 2)
    a = np.clip(1 - d, 0, 1) ** 2.2
    rgba = np.zeros((H // 2, W // 2, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = 255, 90, 30
    rgba[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(rgba).resize((W, H), Image.BICUBIC)


BG, GLOW = make_bg(), make_glow()
rng = random.Random(7)
EMBERS = [dict(x=rng.uniform(0, W), y=rng.uniform(0, H + 200), v=rng.uniform(40, 170), r=rng.uniform(1.2, 4.2),
               ph=rng.uniform(0, 6.28), amp=rng.uniform(10, 50), c=rng.choice([ORANGE, AMBER, (255, 150, 60)]))
          for _ in range(150)]


def embers(t, boost):
    lay = Image.new('RGBA', (W // 2, H // 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for e in EMBERS:
        v = e['v'] * (1 + 1.5 * boost)
        y = (e['y'] - v * t) % (H + 200) - 100
        x = e['x'] + e['amp'] * math.sin(t * 1.3 + e['ph'])
        life = clamp(y / H + 0.15)
        a = int(255 * life * (0.6 + 0.4 * math.sin(t * 7 + e['ph'])))
        r = e['r'] / 2
        d.ellipse((x / 2 - r, y / 2 - r, x / 2 + r, y / 2 + r), fill=(*e['c'], max(0, a)))
    glow = lay.filter(ImageFilter.GaussianBlur(3))
    lay = Image.alpha_composite(glow, lay)
    return lay.resize((W, H), Image.BILINEAR)


def hit_level(t, decay=0.18):
    """1 right after a hit, then decays: used for flash, shake and glow."""
    past = [t - h for h in HITS if 0 <= t - h < 1.0]
    return max([math.exp(-p / decay) for p in past], default=0.0)


# ------------------------------------------------------------------ building blocks
def header(fr, t, t0, kicker, title, n=None):
    """Chapter header, top left. n = number of the challenge (lights the tracker)."""
    p = ease_out(prog(t, t0, t0 + 0.45))
    put(fr, text_img(kicker, F_BOLD, 26, ORANGE, spacing=5), 110 - 60 * (1 - p), 78, p)
    put(fr, text_img(title, F_BLACK, 70, WHITE), 108 - 120 * (1 - p), 112, p)
    if n:
        tracker(fr, t, n)


def tracker(fr, t, n):
    names = ['Plan', 'Quiz', 'Game', 'Case', 'Cheat sheet']
    x = W - 110
    for i in range(5, 0, -1):
        on = i == n
        done = i < n
        lbl = text_img(names[i - 1], F_BOLD, 20, WHITE if on else MUTED)
        if on:
            w = lbl.width + 70
            d = ImageDraw.Draw(fr)
            d.rounded_rectangle((x - w, 82, x, 126), 22, fill=ORANGE)
            d.ellipse((x - w + 6, 88, x - w + 38, 120), fill=WHITE)
            num = text_img(str(i), F_BLACK, 20, ORANGE)
            put(fr, num, x - w + 22, 104, 1, 'mm')
            put(fr, lbl, x - 16, 104, 1, 'rm')
            x -= w + 12
        else:
            d = ImageDraw.Draw(fr)
            d.ellipse((x - 44, 82, x, 126), fill=(*GREEN, 255) if done else (40, 56, 84, 255))
            put(fr, text_img(str(i), F_BLACK, 20, WHITE), x - 22, 104, 1, 'mm')
            x -= 56


def stamp(fr, t, t0, s, color, x, y, rot=-7, size=110):
    """Word that slams onto the screen."""
    if t < t0: return
    p = prog(t, t0, t0 + 0.16)
    k = 1.8 - 0.8 * ease_out(p)
    a = clamp(p * 2)
    im = text_img(s, F_BLACK, size, color, glow=10)
    put(fr, im, x, y, a, 'mm', k, rot)


def chip(fr, t, t0, s, x, y, color=WHITE, icon=None, anchor='lm'):
    p = ease_out(prog(t, t0, t0 + 0.35))
    if p <= 0: return
    lbl = text_img(s, F_BODY, 30, color)
    ic = text_img(icon, F_ICON, 26, ORANGE) if icon else None
    w = lbl.width + 48 + (ic.width + 14 if ic else 0)
    h = 62
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 31, fill=(14, 27, 48, 230), outline=(255, 255, 255, 60), width=2)
    xx = 24
    if ic:
        im.alpha_composite(ic, (xx, (h - ic.height) // 2)); xx += ic.width + 14
    im.alpha_composite(lbl, (xx, (h - lbl.height) // 2 + 1))
    dx = {'l': 0, 'm': w / 2, 'r': w}[anchor[0]]
    put(fr, im, x - dx + 40 * (1 - p), y, p, 'lm')


# icons (Font Awesome 5 Solid)
I_FIRE, I_CLOCK, I_MOBILE, I_ENVELOPE, I_EURO, I_USERS, I_PHONE, I_CHECK, I_FILE, I_CHART, I_QRCODE, I_SHIELD = \
    '', '', '', '', '', '', '', '', '', '', '', ''


# ------------------------------------------------------------------ scenes
def s_intro(fr, t):
    k = 0.6 + 0.9 * ease_in_out(prog(t, 0, T_TITLE))
    flick = 1 + 0.05 * math.sin(t * 23) + 0.04 * math.sin(t * 37)
    put(fr, text_img(I_FIRE, F_ICON, 150, ORANGE, glow=22), W / 2, 420, ease_out(prog(t, 0.1, 0.8)), 'mm', k * flick)
    a1 = ease_out(prog(t, 0.3, 0.8)) * (1 - prog(t, 1.4, 1.6))
    put(fr, text_img('Something goes wrong.', F_BLACK, 84, WHITE), W / 2, 700 + 20 * (1 - a1), a1, 'mm')
    a2 = ease_out(prog(t, 1.6, 2.0)) * (1 - prog(t, 2.85, 3.0))
    put(fr, text_img('Every second counts.', F_BLACK, 84, ORANGE, glow=8), W / 2, 700, a2, 'mm', 1.12 - 0.12 * ease_out(prog(t, 1.6, 2.2)))
    # clock
    secs = int(t * 10)
    put(fr, text_img(f'00:00:0{min(secs // 10, 9)}.{secs % 10}', F_XBOLD, 30, MUTED, spacing=3), W / 2, 820, ease_out(prog(t, 0.3, 0.8)) * (1 - prog(t, 2.85, 3.0)), 'mm')


def s_title(fr, t):
    t0 = T_TITLE
    put(fr, text_img('CYBERSECURITY FOR NGOs BOOTCAMP  ·  TRAINING 3', F_BOLD, 28, ORANGE, spacing=6), W / 2, 300, ease_out(prog(t, t0 + 0.1, t0 + 0.5)), 'mm')
    z = 1.12 - 0.12 * ease_out(prog(t, t0, t0 + 2.4))
    put(fr, text_img('WHEN SOMETHING', F_BLACK, 132, WHITE), W / 2, 430, 1, 'mm', z)
    put(fr, text_img('GOES WRONG', F_BLACK, 132, ORANGE, glow=12), W / 2, 580, 1, 'mm', z)
    a = ease_out(prog(t, t0 + 0.5, t0 + 0.9))
    put(fr, text_img('A 60-minute incident response training for people with no technical background', F_BODY, 34, MUTED), W / 2, 700, a, 'mm')
    labels = [('1', 'Plan'), ('2', 'Quiz'), ('3', 'Game'), ('4', 'Case'), ('5', 'Cheat sheet')]
    ims = []
    for n, s in labels:
        lbl = text_img(s, F_BOLD, 26, WHITE)
        w = lbl.width + 76
        im = Image.new('RGBA', (w, 56), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((0, 0, w - 1, 55), 28, fill=(14, 27, 48, 235), outline=(*ORANGE, 160), width=2)
        d.ellipse((8, 8, 48, 48), fill=ORANGE)
        num = text_img(n, F_BLACK, 22, WHITE)
        im.alpha_composite(num, (28 - num.width // 2, 28 - num.height // 2))
        im.alpha_composite(lbl, (58, 28 - lbl.height // 2 + 1))
        ims.append(im)
    total = sum(i.width for i in ims) + 18 * 4
    x = W / 2 - total / 2
    for i, im in enumerate(ims):
        p = back_out(prog(t, t0 + 0.9 + i * 0.12, t0 + 1.25 + i * 0.12)) if t > t0 + 0.9 + i * 0.12 else 0
        put(fr, im, x + im.width / 2, 810, clamp(p), 'mm', max(0.01, p))
        x += im.width + 18


PLAN = [(0, 5, 'Welcome', None, NAVY), (5, 10, 'Quiz', 2, PURPLE), (10, 18, 'Recognise', None, BLUE), (18, 26, 'First steps', None, BLUE),
        (26, 41, 'Game', 3, ORANGE), (41, 53, 'Case', 4, GREEN), (53, 56, 'Quiz again', 2, PURPLE), (56, 60, 'Close', 5, AMBER)]


def s_plan(fr, t):
    t0 = T_C1
    header(fr, t, t0, 'CHALLENGE 1  ·  TRAINING PLAN', '60 minutes, minute by minute', 1)
    x0, x1, y, h = 150, W - 150, 560, 84
    k = (x1 - x0) / 60
    sweep = 60 * ease_in_out(prog(t, t0 + 0.3, t0 + 2.2))
    d = ImageDraw.Draw(fr)
    d.rounded_rectangle((x0, y, x1, y + h), 14, fill=(22, 36, 60, 255))
    for i, (a, b, name, ch, col) in enumerate(PLAN):
        if sweep <= a + 0.3: continue
        xb = x0 + min(b, sweep) * k
        d.rounded_rectangle((x0 + a * k + 3, y + 3, xb - 3, y + h - 3), 10, fill=col)
        if ch and sweep >= (a + b) / 2:
            put(fr, text_img(f'C{ch}', F_BLACK, 26, WHITE), x0 + (a + b) / 2 * k, y + h / 2, 1, 'mm')
        p = ease_out(prog(sweep, a, a + 3))
        cx = x0 + (a + b) / 2 * k
        up = i % 2 == 0
        ly = y - 70 if up else y + h + 26
        put(fr, text_img(name, F_XBOLD, 30, WHITE), cx, ly + (12 if up else -12) * (1 - p), p, 'mt')
        put(fr, text_img(f"{a}–{b}'", F_BODY, 22, MUTED), cx, ly + 38, p, 'mt')
        d.line((cx, y - 12 if up else y + h, cx, y if up else y + h + 12), fill=(*MUTED, 255), width=2)
    # playhead
    if 0 < sweep < 60:
        px = x0 + sweep * k
        d.line((px, y - 18, px, y + h + 18), fill=WHITE, width=4)
    put(fr, text_img("0'", F_XBOLD, 26, MUTED), x0, y + h + 120, 1, 'lt')
    put(fr, text_img("60'", F_XBOLD, 26, MUTED), x1, y + h + 120, 1, 'rt')
    chip(fr, t, t0 + 1.9, 'Every minute has a method, an objective and a challenge', W / 2, 900, MUTED, I_CLOCK, 'mm')


def s_quiz(fr, t):
    t0 = T_C2
    header(fr, t, t0, 'CHALLENGE 2  ·  LEARNER ASSESSMENT', 'What would you do?', 2)
    if t < 10.2:
        p = ease_out(prog(t, t0, t0 + 0.5))
        shot(fr, 'quiz-lobby.png', 860, 620, 1250, p, 1.0 + 0.05 * prog(t, t0, 10.2))
        q = back_out(prog(t, t0 + 0.6, t0 + 1.0)) if t > t0 + 0.6 else 0
        shot(fr, 'quiz-phone-q1.png', 1640 + 300 * (1 - clamp(q)), 640, 330, clamp(q * 2), 1, -4 * clamp(q))
        chip(fr, t, t0 + 0.9, 'Scan the QR code: no account, no app', 140, 990, WHITE, I_QRCODE)
    else:
        z = 1.0 + 0.25 * ease_in_out(prog(t, 10.2, 12.6))
        zoom_shot(fr, 'quiz-host-question.png', 960, 620, 1500, 760, (0.42, 0.5), z)
        chip(fr, t, 10.5, '5 real incidents', 140, 990, WHITE, I_SHIELD)
        chip(fr, t, 10.8, 'The same quiz at the start and at the end', 520, 990, WHITE, I_CHART)


def s_game(fr, t):
    t0 = T_C3
    c = GAME_CUTS
    header(fr, t, t0, 'CHALLENGE 3  ·  SERIOUS GAME', 'Put out the fire', 3)
    loc = t - max(x for x in c if x <= t)
    drift = 1.0 + 0.04 * loc
    if t < c[1]:
        shot(fr, 'game-lobby.png', 860, 620, 1250, ease_out(prog(t, t0, t0 + 0.4)), drift)
        q = back_out(prog(t, t0 + 0.5, t0 + 0.9)) if t > t0 + 0.5 else 0
        shot(fr, 'game-phone-lobby.png', 1640 + 300 * (1 - clamp(q)), 640, 330, clamp(q * 2), 1, -4 * clamp(q))
        chip(fr, t, t0 + 0.8, '4 rooms of our NGO  ×  the 4 steps', 140, 990, WHITE, I_FIRE)
    elif t < c[2]:
        zoom_shot(fr, 'game-host-question.png', 960, 620, 1500, 760, (0.45, 0.4), 1.08 + 0.15 * prog(t, c[1], c[2]))
        stamp(fr, t, c[1] + 0.25, 'THE FIRE GROWS', ORANGE, 1380, 860, -5, 92)
    elif t < c[3]:
        shot(fr, 'game-host-reveal.png', 800, 620, 1180, 1, drift)
        shot(fr, 'game-phone-water.png', 1600, 640, 330, 1, 1, -4)
        stamp(fr, t, c[2] + 0.15, 'WATER!', BLUE, 1560, 900, -7, 120)
        chip(fr, t, c[2] + 0.3, 'Right move = water', 140, 990, WHITE, I_CHECK)
    elif t < c[4]:
        shot(fr, 'game-intro.png', 800, 620, 1180, 1, drift)
        shot(fr, 'game-phone-petrol.png', 1600, 640, 330, 1, 1, 4)
        stamp(fr, t, c[3] + 0.15, 'PETROL!', ORANGE, 1560, 900, -7, 120)
        chip(fr, t, c[3] + 0.3, 'Trap card = petrol for the whole team', 140, 990, WHITE, I_FIRE)
    elif t < c[5]:
        zoom_shot(fr, 'game-host-hacker.png', 800, 620, 1180, 664, (0.3, 0.4), 1.3 + 0.2 * prog(t, c[4], c[5]))
        shot(fr, 'game-phone-hacker.png', 1600, 640, 330, 1, 1, -4)
        stamp(fr, t, c[4] + 0.15, 'SURPRISE!', AMBER, 1000, 930, -6, 110)
    else:
        zoom_shot(fr, 'game-debrief.png', 960, 620, 1500, 760, (0.3, 0.3), 1.15 + 0.2 * prog(t, c[5], c[6]))
        chip(fr, t, c[5] + 0.2, 'Results per objective, trap cards, best firefighters', 140, 990, WHITE, I_CHART)


def s_case(fr, t):
    t0 = T_C4
    header(fr, t, t0, 'CHALLENGE 4  ·  LEARNING BY DOING', 'The urgent payment', 4)
    p = ease_out(prog(t, t0, t0 + 0.5))
    shot(fr, '04-learning-by-doing/case-sheet.pdf', 1380 + 200 * (1 - p), 640 - 60 * prog(t, t0, T_C5), 560, p, 1.0 + 0.06 * prog(t, t0, T_C5), 4 * p - 2)
    chip(fr, t, t0 + 0.4, 'A fake email from the president', 140, 400, WHITE, I_ENVELOPE)
    chip(fr, t, t0 + 0.9, '€2,000 already paid', 140, 500, WHITE, I_EURO)
    chip(fr, t, t0 + 1.4, 'Alone, then in groups, then together', 140, 600, WHITE, I_USERS)
    stamp(fr, t, t0 + 1.9, 'CALL THE BANK. NOW.', ORANGE, 560, 800, -4, 72)


def s_cheat(fr, t):
    t0 = T_C5
    header(fr, t, t0, 'CHALLENGE 5  ·  TAKE-HOME', 'The cheat sheet', 5)
    p = ease_out(prog(t, t0, t0 + 0.5))
    shot(fr, '05-take-home/cheat-sheet.pdf', 1380 - 200 * (1 - p), 650 - 40 * prog(t, t0, T_RES), 560, p, 1.0 + 0.06 * prog(t, t0, T_RES), -3 * p + 1)
    chip(fr, t, t0 + 0.4, 'One page, next to the computer', 140, 400, WHITE, I_FILE)
    chip(fr, t, t0 + 0.8, 'The 4 steps and what never to do', 140, 500, WHITE, I_CHECK)
    chip(fr, t, t0 + 1.2, 'Your phone numbers, already written', 140, 600, WHITE, I_PHONE)


def s_results(fr, t):
    t0 = T_RES
    header(fr, t, t0, 'LEARNING, MEASURED', 'Before  →  after')
    z = 1.0 + 0.08 * ease_in_out(prog(t, t0, T_OUT))
    zoom_shot(fr, 'quiz-before-after.png', 960, 630, 1500, 760, (0.5, 0.45), z, ease_out(prog(t, t0, t0 + 0.3)))


WORDS = [('STOP', ORANGE), ('DISCONNECT', AMBER), ('REPORT', BLUE), ('WRITE DOWN', GREEN)]


def s_outro(fr, t):
    ims = [text_img(w, F_BLACK, 84, c, glow=8) for w, c in WORDS]
    gap = 50
    total = sum(i.width for i in ims) + gap * 3
    fit = min(1.0, 1680 / total)
    up = ease_in_out(prog(t, T_END, T_END + 0.4))
    y = 520 - 190 * up
    k = fit * (1 - 0.3 * up)
    x = W / 2 - total * k / 2
    for i, im in enumerate(ims):
        if t >= STAMPS[i]:
            p = prog(t, STAMPS[i], STAMPS[i] + 0.14)
            s = (1.9 - 0.9 * ease_out(p)) * k
            put(fr, im, x + im.width * k / 2, y, clamp(p * 2), 'mm', s)
        x += (im.width + gap) * k
    if t >= T_END:
        a = ease_out(prog(t, T_END + 0.1, T_END + 0.5))
        put(fr, text_img('One rule. Four steps.', F_BLACK, 110, WHITE), W / 2, 520, a, 'mm', 1.08 - 0.08 * a)
        put(fr, text_img('TRAINING 3  ·  WHEN SOMETHING GOES WRONG', F_BOLD, 28, ORANGE, spacing=6), W / 2, 650, a, 'mm')
        b = ease_out(prog(t, T_END + 0.35, T_END + 0.75))
        put(fr, text_img('Divya Ravichandran  ·  Álvaro Gómez García  ·  Mohammed Krayem', F_BODY, 32, WHITE), W / 2, 780, b, 'mm')
        put(fr, text_img('University of Luxembourg  ·  Cybersecurity for NGOs Bootcamp', F_BODY, 26, MUTED), W / 2, 830, b, 'mm')


SCENES = [(0, T_TITLE, s_intro), (T_TITLE, T_C1, s_title), (T_C1, T_C2, s_plan), (T_C2, T_C3, s_quiz), (T_C3, T_C4, s_game),
          (T_C4, T_C5, s_case), (T_C5, T_RES, s_cheat), (T_RES, T_OUT, s_results), (T_OUT, DUR + 1, s_outro)]


def render(i):
    t = i / FPS
    h = hit_level(t)
    fr = BG.copy()
    pulse = 0.35 + 0.1 * math.sin(t * 2.2) + 0.45 * h + 0.25 * prog(t, T_RES, T_OUT)
    fr.alpha_composite(with_alpha(GLOW, clamp(pulse)))
    fr.alpha_composite(embers(t, h + prog(t, T_RES, T_OUT)))
    for a, b, f in SCENES:
        if a <= t < b:
            f(fr, t)
    # letterbox fade-in at the start
    rgb = fr.convert('RGB')
    if h > 0.02:
        flash = Image.new('RGB', (W, H), (255, 220, 190))
        rgb = Image.blend(rgb, flash, 0.35 * h ** 2)
        dx, dy = int(14 * h * math.sin(i * 2.7)), int(10 * h * math.cos(i * 3.1))
        moved = Image.new('RGB', (W, H), (6, 11, 22)); moved.paste(rgb, (dx, dy)); rgb = moved
    if t < 0.3:
        rgb = Image.blend(Image.new('RGB', (W, H), 0), rgb, t / 0.3)
    return rgb


# ------------------------------------------------------------------ soundtrack (synthesised)
SR = 48000


def soundtrack():
    n = int(SR * DUR)
    L = np.zeros(n)
    tt = np.arange(n) / SR

    def add(sig, t0, gain=1.0):
        s = int(t0 * SR)
        e = min(n, s + len(sig))
        if s < n: L[s:e] += gain * sig[:e - s]

    def env(dur, a=0.005, d=0.3):
        x = np.arange(int(dur * SR)) / SR
        return np.minimum(x / a, 1) * np.exp(-x / d)

    def lowpass(x, fc):
        a = math.exp(-2 * math.pi * fc / SR)
        return lfilter([1 - a], [1, -a], x)

    def saw(f, x):
        return 2 * ((f * x) % 1) - 1

    def kick(gain=1.0):
        x = np.arange(int(0.5 * SR)) / SR
        f = 45 + 110 * np.exp(-x / 0.04)
        ph = 2 * np.pi * np.cumsum(f) / SR
        return gain * np.sin(ph) * np.exp(-x / 0.22)

    def snare():
        x = np.arange(int(0.25 * SR)) / SR
        nz = np.random.default_rng(1).standard_normal(len(x))
        nz = nz - lowpass(nz, 1500)
        return (0.6 * nz * np.exp(-x / 0.07) + 0.4 * np.sin(2 * np.pi * 185 * x) * np.exp(-x / 0.05))

    def braam(dur=1.8, root=55.0):
        x = np.arange(int(dur * SR)) / SR
        s = sum(saw(f * (1 + dt), x) for f in (root, root * 1.5, root * 2, root * 2.38) for dt in (-0.004, 0.004))
        s = lowpass(lowpass(s, 900), 900)
        s = np.tanh(2.2 * s / 4) * np.minimum(x / 0.03, 1) * np.exp(-x / (dur / 2.6))
        sub = np.sin(2 * np.pi * root * x) * np.exp(-x / (dur / 2))
        return 0.7 * s + 0.6 * sub

    def tick():
        x = np.arange(int(0.03 * SR)) / SR
        return np.sin(2 * np.pi * 2800 * x) * np.exp(-x / 0.006)

    # drone: rises through the whole video
    dr = lowpass(saw(55, tt) + 0.6 * saw(55.3, tt) + 0.5 * saw(82.4, tt), 260)
    swell = 0.25 + 0.35 * np.clip(tt / DUR, 0, 1) + 0.08 * np.sin(2 * np.pi * tt / 4.8)
    L += 0.16 * dr * swell * np.clip(tt / 1.5, 0, 1)

    # intro: clock ticks + heartbeat
    for k in range(int(T_TITLE / 0.3)):
        add(tick(), k * 0.3, 0.25 if k % 2 else 0.4)
    for k in range(int(T_TITLE / BEAT)):
        add(kick(0.35), k * BEAT); add(kick(0.25), k * BEAT + 0.18)
    # sub-bass ostinato in eighths from the title, kicks on every beat from Challenge 2
    pattern = [55, 55, 65.4, 55, 55, 49, 55, 73.4]
    k = 0
    while T_TITLE + k * BEAT / 2 < T_OUT - 0.1:
        t0 = T_TITLE + k * BEAT / 2
        f = pattern[k % 8]
        x = np.arange(int(0.28 * SR)) / SR
        add(lowpass(saw(f, x), 400) * np.exp(-x / 0.12), t0, 0.32)
        k += 1
    b = T_C2
    while b < T_OUT - 0.1:
        add(kick(0.9), b)
        if b >= T_C3 and round((b - T_C3) / BEAT) % 2 == 1:
            add(snare(), b, 0.45)
        b += BEAT
    # hits on every cut
    for h in HITS:
        if h in STAMPS or h == T_END: continue
        add(braam(1.2 if h != T_TITLE else 2.2), h, 0.55 if h != T_TITLE else 0.9)
        add(kick(1.0), h)
    # riser + snare roll before the outro
    seg = np.arange(int((T_OUT - T_RES) * SR)) / SR
    nz = np.random.default_rng(3).standard_normal(len(seg))
    rise = (seg / seg[-1]) ** 2
    add((nz - lowpass(nz, 300 + 5000 * rise[-1])) * rise * 0.35 + 0.2 * np.sin(2 * np.pi * (200 * seg + 900 * seg ** 2)) * rise, T_RES)
    r = T_RES
    step = 0.3
    while r < T_OUT - 0.05:
        add(snare(), r, 0.25 + 0.5 * prog(r, T_RES, T_OUT)); r += step; step = max(0.05, step * 0.82)
    # the 4 steps: 4 hits, then the final one
    for i, s in enumerate(STAMPS):
        add(braam(0.6, 55 * (1, 1.12, 1.33, 1.5)[i]), s, 0.6); add(kick(1.0), s)
    add(braam(3.5, 41.2), T_END, 1.0); add(kick(1.2), T_END); add(snare(), T_END, 0.6)

    # space + level
    ir_x = np.arange(int(1.4 * SR)) / SR
    ir = np.random.default_rng(5).standard_normal(len(ir_x)) * np.exp(-ir_x / 0.35)
    ir = lowpass(ir, 3000)
    wet = fftconvolve(L, ir)[:n]
    wet /= np.max(np.abs(wet)) + 1e-9
    mix = L / (np.max(np.abs(L)) + 1e-9) + 0.22 * wet
    mix = np.tanh(1.4 * mix)
    mix *= np.minimum(1, (DUR - tt) / 0.5)  # fade out over the last half second
    mix = 0.89 * mix / np.max(np.abs(mix))
    # small stereo width: delay the wet part on the right
    right = np.roll(mix, int(0.012 * SR))
    st = np.stack([mix, 0.85 * right + 0.15 * mix], 1)
    return (st * 32767).astype(np.int16)


def main():
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / 'audio.wav'
        with wave.open(str(wav), 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(soundtrack().tobytes())
        only = [int(a) for a in sys.argv[1:]]  # optional: frame numbers to save as PNG previews
        if only:
            for i in only:
                render(i).save(Path(os.environ.get('PREVIEW', '.')) / f'frame-{i:03d}.png')
            return
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                               '-i', '-', '-i', str(wav), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
                               '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', str(OUT)], stdin=subprocess.PIPE)
        for i in range(N):
            ff.stdin.write(render(i).tobytes())
            if i % 90 == 0: print(f'{i / FPS:4.1f} s', flush=True)
        ff.stdin.close(); ff.wait()
    print('wrote', OUT)


if __name__ == '__main__':
    main()
