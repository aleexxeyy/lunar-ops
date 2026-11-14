"""Build Lunar Ops pitch deck (.pptx) mirroring the Slides mockup.

Coordinates are written in px of a 1920x1080 canvas: 1 px = 6350 EMU, font px / 2 = pt.
"""
import sys
from pathlib import Path

import numpy as np
from lxml import etree
from PIL import Image, ImageDraw
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

OUT = Path(sys.argv[1])
ASSETS = Path(sys.argv[2])
ASSETS.mkdir(parents=True, exist_ok=True)

INK, INK2, LINE = "0B1026", "151C40", "27315F"
PAPER, CARD, STAT = "EEF1F8", "FBFCFF", "DDE3F2"
MOON, MUTE, MUTE_L = "E8ECF7", "B4BEDD", "46507A"
MARS, MARS_D, TEAL, AMBER, LAV = "FF7A3D", "C2461A", "38D9C4", "FFC24B", "8C9BFF"
FOOT_D, FOOT_L = "8792B8", "5A6488"

HEAD, BODY, MONO = "Arial", "Calibri", "Consolas"


def E(px):
    return Emu(int(round(px * 6350)))


def rgb(h):
    return RGBColor.from_string(h)


# ---------- background images ----------
STARS = [(120, 90, 2, .8), (310, 210, 1.5, .5), (520, 70, 2.5, .9), (760, 160, 1.5, .6), (980, 60, 2, .7),
         (1210, 190, 1.5, .5), (1440, 80, 2.5, .9), (1650, 230, 1.5, .6), (1840, 110, 2, .8), (90, 420, 1.5, .5),
         (260, 560, 2, .7), (430, 380, 1.5, .4), (640, 610, 1.5, .6), (880, 470, 2, .7), (1100, 560, 1.5, .5),
         (1330, 420, 2, .8), (1780, 450, 2, .6), (180, 800, 2, .7), (400, 920, 1.5, .5), (620, 860, 2, .6),
         (850, 990, 1.5, .5), (1060, 830, 2, .7), (60, 1020, 1.5, .5), (700, 300, 1, .6), (300, 700, 1, .6),
         (1000, 350, 1, .6), (1880, 760, 2, .6), (1500, 1040, 2, .6), (40, 560, 1.5, .5)]
S = 2  # supersampling


def mars_layer(img, cx, cy, r):
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - cx * S) ** 2 + (yy - cy * S) ** 2)
    mask = d <= r * S
    # radial gradient centred at 35%/30% of the bounding box
    gx, gy = cx - r + 0.7 * r, cy - r + 0.6 * r
    t = np.clip(np.sqrt((xx - gx * S) ** 2 + (yy - gy * S) ** 2) / (1.5 * r * S), 0, 1)
    stops = [(0, (246, 248, 252)), (0.45, (168, 175, 196)), (1, (44, 50, 74))]  # Moon grey
    out = np.zeros((h, w, 3), np.float32)
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        seg = (t >= t0) & (t <= t1)
        k = ((t - t0) / (t1 - t0))[..., None]
        out = np.where(seg[..., None], np.array(c0) * (1 - k) + np.array(c1) * k, out)
    base = np.asarray(img).astype(np.float32)
    base[mask] = out[mask]
    return Image.fromarray(base.astype(np.uint8))


def starfield(name, planet=None, craters=(), orbit=None, moon=None):
    img = Image.new("RGB", (1920 * S, 1080 * S), "#" + INK)
    d = ImageDraw.Draw(img, "RGBA")
    for x, y, r, a in STARS:
        d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=(232, 236, 247, int(255 * a)))
    if orbit:
        cx, cy, rx, ry, ang = orbit
        ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(ov).ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S],
                                   outline=(255, 122, 61, 90), width=2 * S)
        ov = ov.rotate(ang, center=(cx * S, cy * S), resample=Image.BICUBIC)
        img.paste(ov, (0, 0), ov)
    if planet:
        img = mars_layer(img, *planet)
        d = ImageDraw.Draw(img, "RGBA")
        for x, y, r, a in craters:
            d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=(74, 20, 10, int(255 * a)))
    if moon:
        x, y, r = moon
        d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=(201, 206, 223, 255))
    img = img.resize((1920, 1080), Image.LANCZOS)
    p = ASSETS / name
    img.save(p, optimize=True)
    return p


BG_STARS = starfield("bg-stars.png")
BG_NEXT = starfield("bg-next.png", planet=(1760, 150, 200))
SHOT_EVENT, SHOT_DASH, SHOT_MOBILE = (ASSETS / n for n in ("shot-event.png", "shot-dashboard.png", "shot-mobile.png"))

# ---------- deck helpers ----------
prs = Presentation()
prs.slide_width, prs.slide_height = E(1920), E(1080)
BLANK = prs.slide_layouts[6]


def new_slide(bg_hex, image=None):
    s = prs.slides.add_slide(BLANK)
    fill = s.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb(bg_hex)
    if image:
        pic = s.shapes.add_picture(str(image), 0, 0, E(1920), E(1080))
        pic.name = "Background"
    return s


def text(s, x, y, w, h, content, size, color, font=BODY, bold=False, italic=False, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, spacing=None, line=None, name=None):
    tb = s.shapes.add_textbox(E(x), E(y), E(w), E(h))
    if name:
        tb.name = name
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    paras = content if isinstance(content, list) else [content]
    for i, ptxt in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if line:
            p.line_spacing = line
        r = p.add_run()
        r.text = ptxt
        f = r.font
        f.size, f.name, f.bold, f.italic = Pt(size / 2), font, bold, italic
        f.color.rgb = rgb(color)
        if spacing:
            r._r.get_or_add_rPr().set("spc", str(int(spacing * 100)))
    return tb


def box(s, x, y, w, h, fill, radius=28, line=None, line_w=None, dash=False, shape=None, name=None):
    shp_type = shape or (MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE)
    sh = s.shapes.add_shape(shp_type, E(x), E(y), E(w), E(h))
    if name:
        sh.name = name
    if shp_type == MSO_SHAPE.ROUNDED_RECTANGLE:
        sh.adjustments[0] = min(0.5, radius / min(w, h))
    if fill:
        sh.fill.solid()
        sh.fill.fore_color.rgb = rgb(fill)
    else:
        sh.fill.background()
    if line:
        sh.line.color.rgb = rgb(line)
        sh.line.width = Pt(line_w or 1)
        if dash:
            sh.line.dash_style = 4  # MSO_LINE.DASH
    else:
        sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


def circle_label(s, x, y, d, fill, label, size, color, font=MONO, bold=True, line=None, line_w=None):
    c = box(s, x, y, d, d, fill, radius=0, shape=MSO_SHAPE.OVAL, line=line, line_w=line_w)
    tf = c.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.size, r.font.name, r.font.bold = Pt(size / 2), font, bold
    r.font.color.rgb = rgb(color)
    return c


def head(s, eyebrow, title, light):
    text(s, 128, 128, 1664, 32, eyebrow, 24, MARS_D if light else MARS, MONO, bold=True, spacing=4, name="Eyebrow")
    text(s, 128, 170, 1664, 90, title, 72, INK if light else MOON, HEAD, bold=True, name="Title")


def footer(s, left, right, light):
    c = FOOT_L if light else FOOT_D
    text(s, 128, 984, 900, 32, left, 24, c, MONO, name="Footer left")
    text(s, 1292, 984, 500, 32, right, 24, c, MONO, align=PP_ALIGN.RIGHT, name="Footer right")


def set_alpha(parent, alpha):
    """Add <a:alpha> (0..1) to the first srgbClr under parent."""
    clr = parent.find(".//" + qn("a:srgbClr"))
    etree.SubElement(clr, qn("a:alpha")).set("val", str(int(alpha * 100000)))


def oval(s, cx, cy, r, color, alpha=1.0, name=None):
    sh = s.shapes.add_shape(MSO_SHAPE.OVAL, E(cx - r), E(cy - r), E(2 * r), E(2 * r))
    sh.name = name or "Shape"
    sh.fill.solid()
    sh.fill.fore_color.rgb = rgb(color)
    if alpha < 1:
        set_alpha(sh._element.spPr.find(qn("a:solidFill")), alpha)
    sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


def cover_background(s):
    """Cover backdrop from separate native shapes: stars, orbit, Moon, craters, Earth."""
    for i, (x, y, r, a) in enumerate(STARS[:26], 1):
        oval(s, x, y, r * 1.5, MOON, a, name=f"Star {i:02d}")
    orb = s.shapes.add_shape(MSO_SHAPE.OVAL, E(1560 - 640), E(840 - 140), E(1280), E(280))
    orb.name = "Orbit"
    orb.fill.background()
    orb.line.color.rgb = rgb(MARS)
    orb.line.width = Pt(1)
    set_alpha(orb._element.spPr.find(qn("a:ln")), 0.35)
    orb.rotation = -14
    orb.shadow.inherit = False
    moon = oval(s, 1560, 840, 380, "A8AFC4", name="Moon")
    spPr = moon._element.spPr
    spPr.remove(spPr.find(qn("a:solidFill")))
    grad = etree.fromstring(
        '<a:gradFill xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" rotWithShape="1">'
        '<a:gsLst><a:gs pos="0"><a:srgbClr val="F6F8FC"/></a:gs>'
        '<a:gs pos="45000"><a:srgbClr val="A8AFC4"/></a:gs>'
        '<a:gs pos="100000"><a:srgbClr val="2C324A"/></a:gs></a:gsLst>'
        '<a:path path="circle"><a:fillToRect l="35000" t="30000" r="65000" b="70000"/></a:path>'
        '</a:gradFill>')
    spPr.insert(list(spPr).index(spPr.find(qn("a:prstGeom"))) + 1, grad)
    for i, (x, y, r, a) in enumerate([(1440, 700, 46, .3), (1660, 930, 70, .25), (1720, 720, 28, .3),
                                      (1360, 900, 22, .25)], 1):
        oval(s, x, y, r, "2C324A", a, name=f"Crater {i}")
    earth = oval(s, 980, 1000, 34, "4A8FE7", name="Earth")
    e_spPr = earth._element.spPr
    e_spPr.remove(e_spPr.find(qn("a:solidFill")))
    e_spPr.insert(list(e_spPr).index(e_spPr.find(qn("a:prstGeom"))) + 1, etree.fromstring(
        '<a:gradFill xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" rotWithShape="1">'
        '<a:gsLst><a:gs pos="0"><a:srgbClr val="9FD3FF"/></a:gs>'
        '<a:gs pos="55000"><a:srgbClr val="2F7FE0"/></a:gs>'
        '<a:gs pos="100000"><a:srgbClr val="0E2A66"/></a:gs></a:gsLst>'
        '<a:path path="circle"><a:fillToRect l="35000" t="30000" r="65000" b="70000"/></a:path>'
        '</a:gradFill>'))


def notes(s, t):
    s.notes_slide.notes_text_frame.text = t


FOOT = "NASA SPACE APPS · DNIPRO 2026"

# ---------- 1. cover ----------
s = new_slide(INK)
cover_background(s)
text(s, 128, 128, 1100, 32, "NASA SPACE APPS CHALLENGE · DNIPRO 2026", 24, MARS, MONO, bold=True, spacing=4)
text(s, 128, 186, 1100, 140, "[TEAM NAME]", 120, MOON, HEAD, bold=True, name="Team name")
text(s, 128, 350, 1060, 120, "Lunar Ops — a mission-control game where kids keep a Moon base crew alive", 44,
     MOON, line=1.1, name="Project name")
pill = box(s, 128, 500, 860, 64, MARS, radius=32)
tf = pill.text_frame
tf.margin_left = tf.margin_right = E(28)
tf.vertical_anchor = MSO_ANCHOR.MIDDLE
r = tf.paragraphs[0].add_run()
r.text = "CHALLENGE: BUILD A JUNIOR ASTRONAUT MISSION TRAINER"
r.font.size, r.font.name, r.font.bold = Pt(13), MONO, True
r.font.color.rgb = rgb(INK)
tf.paragraphs[0].alignment = PP_ALIGN.CENTER
text(s, 128, 820, 1000, 70, "Separated Structural Subdivision «Applied Rocket-and-Space Engineering College "
     "of Oles Honchar Dnipro National University»", 24, MUTE, line=1.15)
text(s, 128, 904, 1000, 36, "[team@email.com] · github.com/aleexxeyy/lunar-ops", 24, TEAL, MONO)
notes(s, "Титульный слайд: команда, проект Lunar Ops, челлендж и контакты (мануал просит контакты на первом "
         "слайде). Заменить [TEAM NAME] и почту. Фон из отдельных фигур (Star 01–26, Orbit, Moon, Crater 1–4, "
         "Earth) — Главная → Выделить → Область выделения.")

# ---------- 2. mission ----------
s = new_slide(PAPER)
head(s, "01 // MISSION BRIEFING", "Learning the trade-offs of survival", True)
cards = [("THE PROBLEM", "Space lessons for kids are either flat facts on a poster or too technical to follow. "
          "Students see how a mission ends — never the decisions behind it.", CARD, MARS_D, MUTE_L),
         ("OUR MISSION", "Lunar Ops puts the player in command of Horizon base on the Moon. Keep three astronauts "
          "safe, finish the science program — and learn that no choice is free.", INK, MARS, MUTE)]
for i, (tag, body, fill, tagc, bodyc) in enumerate(cards):
    x = 128 + i * (816 + 32)
    box(s, x, 300, 816, 300, fill)
    text(s, x + 40, 340, 736, 32, tag, 24, tagc, MONO, bold=True, spacing=2)
    text(s, x + 40, 388, 736, 190, body, 28, bodyc, line=1.15)
stats = [("7", "days on the Moon to survive"), ("4", "resources: energy, oxygen, water, morale"),
         ("60", "science points to complete the mission")]
w = (1664 - 64) / 3
for i, (num, lbl) in enumerate(stats):
    x = 128 + i * (w + 32)
    box(s, x, 640, w, 220, STAT)
    text(s, x + 40, 672, w - 80, 100, num, 96, INK, HEAD, bold=True)
    text(s, x + 40, 786, w - 80, 66, lbl, 26, MUTE_L, line=1.1)
footer(s, FOOT, "02 / 07", True)
notes(s, "Проблема и цель. Цифры — из game-config: 7 игровых дней, 4 ресурса, цель 60 научных данных, "
         "экипаж из 3 человек. Аудитория — дети 7–12 лет (условие челленджа).")

# ---------- 3. how it works ----------
s = new_slide(INK, BG_STARS)
head(s, "02 // HOW IT WORKS", "Every day is a trade-off", False)
steps = [("Check the base", "Energy, oxygen, water and morale drop every day — see the forecast."),
         ("Spend 2 operations", "Research, make oxygen, recycle water, rest or upgrade a module."),
         ("Face an event", "Solar storm, air leak, ice signal: two answers, each has a price."),
         ("End the day", "Modules produce, roles give bonuses, a short lesson explains why.")]
for i, (t, b) in enumerate(steps):
    y = 300 + i * 120
    circle_label(s, 128, y, 64, MARS, str(i + 1), 28, INK)
    text(s, 220, y - 2, 820, 40, t, 32, MOON, HEAD, bold=True)
    text(s, 220, y + 40, 820, 70, b, 26, MUTE, line=1.1)
text(s, 128, 800, 940, 44, "Shield the crew from a storm → less energy for research", 32, TEAL, italic=True)
box(s, 1108, 296, 688, 572, INK2, line=LINE, line_w=1.5, radius=20)
pic = s.shapes.add_picture(str(SHOT_EVENT), E(1112), E(300), E(680), E(565))
pic.name = "Screenshot: solar storm event"
text(s, 1112, 880, 680, 30, "Day 2 event in the working prototype", 22, MUTE, MONO, align=PP_ALIGN.CENTER)
footer(s, FOOT, "03 / 07", False)
notes(s, "Игровой цикл одного дня. Справа — реальный скриншот события «Солнечная буря» (день 2): два решения, "
         "у каждого своя цена. Расход в день: энергия −18, кислород −14, вода −12, мораль −6 (Командир: +35%).")

# ---------- 4. experience ----------
s = new_slide(PAPER)
head(s, "03 // PLAYER EXPERIENCE", "Easy to start, hard to master", True)
box(s, 124, 300, 908, 514, INK, radius=12)
pic = s.shapes.add_picture(str(SHOT_DASH), E(128), E(304), E(900), E(506))
pic.name = "Screenshot: mission dashboard"
box(s, 868, 476, 204, 424, INK, radius=24)
pic = s.shapes.add_picture(str(SHOT_MOBILE), E(876), E(484), E(188), E(408))
pic.name = "Screenshot: mobile"
text(s, 128, 836, 720, 30, "Mission dashboard · desktop and phone", 22, MUTE_L, MONO)
feats = [("www", "Free, in any browser", "No download, no account. Adapts to school computers and phones."),
         ("2", "Cadet or Commander", "Two difficulty levels: Commander burns resources 35% faster."),
         ("i", "Learn by deciding", "Every event ends with a short lesson on real lunar science.")]
for i, (g, t, b) in enumerate(feats):
    y = 340 + i * 170
    circle_label(s, 1112, y, 80, INK, g, 24 if len(g) > 2 else 32, MARS, font=HEAD)
    text(s, 1216, y, 576, 40, t, 32, INK, HEAD, bold=True)
    text(s, 1216, y + 46, 576, 80, b, 26, MUTE_L, line=1.1)
footer(s, FOOT, "04 / 07", True)
notes(s, "Визуализация проекта + пользовательский опыт. Скриншоты из рабочего прототипа (desktop 1920×1080 "
         "и телефон). Интерфейс игры пока на русском — к финалу лучше переснять с английской версией. "
         "Остальные скриншоты: Презентация/screenshots/.")

# ---------- 5. data ----------
s = new_slide(INK)
head(s, "04 // NASA SCIENCE", "Real science behind every event", False)
rows = [("In the game", "What the player learns", "NASA / partner source"),
        ("Solar storm · day 2", "The Moon has almost no atmosphere or magnetic field — shelters and space-weather "
         "forecasts cut radiation risk", "NASA DONKI — solar flares, CMEs"),
        ("Air leak · day 4", "Sealed modules isolate a leak; pressure control and reserves keep the crew alive",
         "NASA OSDR — crew health in space"),
        ("Ice signal · day 6", "Water ice may survive in permanently shadowed craters near the lunar poles",
         "NASA Moon Trek — lunar south pole"),
        ("Hydroponics module", "A greenhouse returns water and lifts crew morale in a closed habitat",
         "CSA — food production in space"),
        ("Crew health", "Low supplies hurt the crew; the medic role and rest restore health",
         "RadLab (OSDR) — radiation dose")]
gt = s.shapes.add_table(len(rows), 3, E(128), E(290), E(1664), E(60 + 5 * 92))
gt.name = "NASA data table"
tbl = gt.table
tblPr = tbl._tbl.tblPr
style = tblPr.find(qn("a:tableStyleId"))
if style is not None:
    style.text = "{2D5ABB26-0587-4C30-8999-92F81FD0307C}"  # No Style, No Grid; fills set per cell
for ci, wpx in enumerate([0.22, 0.48, 0.30]):
    tbl.columns[ci].width = E(1664 * wpx)
for ri, row in enumerate(rows):
    tbl.rows[ri].height = E(60 if ri == 0 else 92)
    for ci, val in enumerate(row):
        cell = tbl.cell(ri, ci)
        cell.fill.solid()
        cell.fill.fore_color.rgb = rgb(INK2 if ri == 0 else ("111736" if ri % 2 else INK))
        cell.margin_left = cell.margin_right = E(16)
        cell.margin_top = cell.margin_bottom = E(8)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf = cell.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = val
        r.font.size, r.font.name = Pt(13), (MONO if ri == 0 else BODY)
        r.font.bold = ri == 0 or ci == 0
        r.font.color.rgb = rgb(MUTE if ri == 0 else (TEAL if ci == 2 else MOON))
text(s, 128, 870, 1664, 70, "Today the numbers are a simplified teaching model. Next step: live space weather from "
     "NASA DONKI through our own API, so a real solar flare triggers the in-game storm.", 24, MUTE, line=1.15)
footer(s, FOOT, "05 / 07", False)
notes(s, "Честно: в коде пока нет живых данных NASA (README: «условная учебная модель»). Уроки в событиях "
         "основаны на научных фактах; колонка источников — к чему привязываем факты и что подключим. "
         "Если команда успеет подключить DONKI через apps/api — переписать нижнюю строку.")

# ---------- 6. crew ----------
s = new_slide(PAPER)
head(s, "05 // CREW", "Meet the crew", True)
cw = (1664 - 5 * 24) / 6
for i in range(6):
    x = 128 + i * (cw + 24)
    box(s, x, 320, cw, 460, CARD, name=f"Member {i + 1}")
    circle_label(s, x + (cw - 180) / 2, 356, 180, INK, "Photo", 24, MUTE, font=MONO, bold=False,
                 line=MARS, line_w=3)
    text(s, x + 16, 572, cw - 32, 76, "[Name Surname]", 28, INK, HEAD, bold=True, align=PP_ALIGN.CENTER, line=1.05)
    text(s, x + 16, 676, cw - 32, 36, "[Team lead]" if i == 0 else "[Role]", 24, MARS_D, MONO,
         align=PP_ALIGN.CENTER)
footer(s, FOOT, "06 / 07", True)
notes(s, "Команда: заменить «Photo» на фото (Формат фигуры → Заливка рисунком), имена и роли. "
         "Лишние карточки удалить и раздвинуть оставшиеся.")

# ---------- 7. next ----------
s = new_slide(INK, BG_NEXT)
head(s, "06 // NEXT MISSION", "Further plans", False)
plans = [("TEST", "Playtest with kids at schools and clubs in Dnipro and collect feedback."),
         ("UPGRADE", "Live NASA DONKI space weather in the game, more events and base modules."),
         ("IMPLEMENT", "English version of the interface and a classroom mode for teachers.")]
for i, (t, b) in enumerate(plans):
    x = 128 + i * (w + 32)
    box(s, x, 310, w, 220, INK2, line=LINE, line_w=1.5)
    text(s, x + 40, 346, w - 80, 32, t, 24, TEAL, MONO, bold=True, spacing=2)
    text(s, x + 40, 392, w - 80, 120, b, 26, MUTE, line=1.15)
text(s, 128, 620, 1500, 90, "Thanks for listening!", 72, MARS, HEAD, bold=True)
text(s, 128, 730, 1500, 70, "Sources: NASA DONKI · NASA OSDR · RadLab · NASA Moon Trek · CSA Space Resources · "
     "github.com/aleexxeyy/lunar-ops", 24, MUTE, line=1.15)
footer(s, "[team@email.com]", "07 / 07", False)
notes(s, "Планы (Test / Upgrade / Implement, как в прошлой презентации), источники и благодарность. "
         "Лимит мануала: максимум 7 слайдов на английском — это последний.")

prs.core_properties.title = "Lunar Ops — Junior Astronaut Mission Trainer"
prs.core_properties.subject = "NASA Space Apps Challenge Dnipro 2026"
prs.save(OUT)
print("saved", OUT)
