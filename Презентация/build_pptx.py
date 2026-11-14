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
    stops = [(0, (255, 178, 122)), (0.45, (232, 98, 44)), (1, (74, 20, 10))]
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
    """Cover backdrop from separate native shapes: stars, orbit, Mars, craters, moon."""
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
    mars = oval(s, 1560, 840, 380, "E8622C", name="Mars")
    spPr = mars._element.spPr
    spPr.remove(spPr.find(qn("a:solidFill")))
    grad = etree.fromstring(
        '<a:gradFill xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" rotWithShape="1">'
        '<a:gsLst><a:gs pos="0"><a:srgbClr val="FFB27A"/></a:gs>'
        '<a:gs pos="45000"><a:srgbClr val="E8622C"/></a:gs>'
        '<a:gs pos="100000"><a:srgbClr val="4A140A"/></a:gs></a:gsLst>'
        '<a:path path="circle"><a:fillToRect l="35000" t="30000" r="65000" b="70000"/></a:path>'
        '</a:gradFill>')
    spPr.insert(list(spPr).index(spPr.find(qn("a:prstGeom"))) + 1, grad)
    for i, (x, y, r, a) in enumerate([(1440, 700, 46, .35), (1660, 930, 70, .3), (1720, 720, 28, .35)], 1):
        oval(s, x, y, r, "4A140A", a, name=f"Crater {i}")
    oval(s, 980, 1000, 34, "C9CEDF", name="Moon")


def notes(s, t):
    s.notes_slide.notes_text_frame.text = t


FOOT = "NASA SPACE APPS · DNIPRO 2026"

# ---------- 1. cover ----------
s = new_slide(INK)
cover_background(s)
text(s, 128, 128, 1100, 32, "NASA SPACE APPS CHALLENGE · DNIPRO 2026", 24, MARS, MONO, bold=True, spacing=4)
text(s, 128, 186, 1100, 140, "[TEAM NAME]", 120, MOON, HEAD, bold=True, name="Team name")
text(s, 128, 350, 1060, 120, "[Project name] — a game where kids run their own Moon or Mars outpost", 44, MOON,
     line=1.1)
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
text(s, 128, 904, 1000, 36, "[team@email.com] · [github / demo link]", 24, TEAL, MONO)
notes(s, "Титульный слайд: название команды, проекта, выбранный челлендж и контакты "
         "(мануал просит контакты на первом слайде). Заменить всё в квадратных скобках. "
         "Фон собран из отдельных фигур (Star 01–26, Orbit, Mars, Crater 1–3, Moon) — "
         "см. Главная → Выделить → Область выделения.")

# ---------- 2. mission ----------
s = new_slide(PAPER)
head(s, "01 // MISSION BRIEFING", "Learning the trade-offs of survival", True)
cards = [("THE PROBLEM", "Space lessons for kids are either flat facts on a poster or too technical to follow. "
          "Students see how a mission ends — never the decisions behind it.", CARD, MARS_D, MUTE_L),
         ("OUR MISSION", "[Project name] is a browser game where players run a lunar or Martian outpost and feel "
          "that no choice is free: saving power today can cost oxygen tomorrow.", INK, MARS, MUTE)]
for i, (tag, body, fill, tagc, bodyc) in enumerate(cards):
    x = 128 + i * (816 + 32)
    box(s, x, 300, 816, 300, fill)
    text(s, x + 40, 340, 736, 32, tag, 24, tagc, MONO, bold=True, spacing=2)
    text(s, x + 40, 388, 736, 190, body, 28, bodyc, line=1.15)
stats = [("7–12", "years old — our main players"), ("3", "core resources: power, life support, shielding"),
         ("0", "downloads or accounts needed")]
w = (1664 - 64) / 3
for i, (num, lbl) in enumerate(stats):
    x = 128 + i * (w + 32)
    box(s, x, 640, w, 220, STAT)
    text(s, x + 40, 672, w - 80, 100, num, 96, INK, HEAD, bold=True)
    text(s, x + 40, 786, w - 80, 66, lbl, 26, MUTE_L, line=1.1)
footer(s, FOOT, "02 / 07", True)
notes(s, "Проблема из описания челленджа и наша цель. Цифры — из условий задания (возраст 7–12, "
         "2–3 ключевых ресурса, игра в браузере без регистрации). Поправить, если механика изменится.")

# ---------- 3. how it works ----------
s = new_slide(INK, BG_STARS)
head(s, "02 // HOW IT WORKS", "Every sol is a trade-off", False)
steps = [("Briefing", "Check today’s space weather and the outpost status. A sol is one day on Mars."),
         ("Plan", "Split a limited power budget between life support, shielding and food."),
         ("Event", "A solar flare, dust storm or communication delay tests the plan."),
         ("Debrief", "See what each choice cost and why, with the real science behind it.")]
for i, (t, b) in enumerate(steps):
    y = 300 + i * 120
    circle_label(s, 128, y, 64, MARS, str(i + 1), 28, INK)
    text(s, 220, y - 2, 820, 40, t, 32, MOON, HEAD, bold=True)
    text(s, 220, y + 40, 820, 70, b, 26, MUTE, line=1.1)
text(s, 128, 800, 900, 44, "Save power today → lose oxygen tomorrow", 32, TEAL, italic=True)
box(s, 1112, 300, 680, 560, INK2, line=LINE, line_w=1.5)
text(s, 1152, 340, 600, 32, "OUTPOST STATUS · SOL 14 · [MOCK-UP]", 24, MUTE, MONO, bold=True)
for i, (lbl, pct, col) in enumerate([("Power", 62, AMBER), ("Life support", 80, TEAL), ("Shielding", 35, LAV)]):
    y = 400 + i * 92
    text(s, 1152, y, 400, 34, lbl, 26, MOON, MONO)
    text(s, 1552, y, 200, 34, f"{pct}%", 26, MOON, MONO, align=PP_ALIGN.RIGHT)
    box(s, 1152, y + 44, 600, 24, INK, radius=12)
    box(s, 1152, y + 44, 600 * pct / 100, 24, col, radius=12, name=f"Gauge {lbl}")
box(s, 1152, 700, 600, 110, "3A1A12", radius=18)
circle_label(s, 1176, 735, 40, MARS, "!", 26, INK)
text(s, 1236, 712, 500, 90, "Solar flare expected in 2 sols. Data: NASA DONKI", 24, "FFD9C7",
     anchor=MSO_ANCHOR.MIDDLE, line=1.1)
footer(s, FOOT, "03 / 07", False)
notes(s, "Игровой цикл одного сола и макет панели статуса. Значения шкал — пример, заменить реальным "
         "скриншотом/механикой, когда будет готов прототип.")

# ---------- 4. experience ----------
s = new_slide(PAPER)
head(s, "03 // PLAYER EXPERIENCE", "Easy to start, hard to master", True)
box(s, 128, 300, 900, 560, INK, line=FOOT_L, line_w=2, dash=True, name="Screenshot placeholder")
tri = box(s, 538, 460, 96, 96, MARS, radius=0, shape=MSO_SHAPE.ISOSCELES_TRIANGLE)
tri.rotation = 90
text(s, 128, 600, 900, 40, "[Game screenshot / prototype]", 28, MUTE, MONO, align=PP_ALIGN.CENTER)
feats = [("www", "Free, in any browser", "No download, no account. Works on school computers and phones."),
         ("Aa", "Plain language", "Words like sol or radiation dose are explained right in the game."),
         ("↻", "Different every run", "Random events push players to try new strategies and learn from failure.")]
for i, (g, t, b) in enumerate(feats):
    y = 340 + i * 170
    circle_label(s, 1092, y, 80, INK, g, 24 if len(g) > 2 else 32, MARS, font=HEAD)
    text(s, 1200, y, 592, 40, t, 32, INK, HEAD, bold=True)
    text(s, 1200, y + 46, 592, 80, b, 26, MUTE_L, line=1.1)
footer(s, FOOT, "04 / 07", True)
notes(s, "Визуализация проекта + пользовательский опыт (пункты 4 и 6 из рекомендаций мануала). "
         "Вставить скриншот игры вместо заглушки.")

# ---------- 5. data ----------
s = new_slide(INK)
head(s, "04 // REAL NASA DATA", "Real NASA data behind every event", False)
rows = [("Dataset", "What it gives", "How we use it [draft]"),
        ("NASA DONKI", "Solar flares and CMEs", "Triggers radiation storms the player must shield against"),
        ("NASA OSDR", "Astronaut health and space biology studies",
         "Explains what radiation and microgravity do to the crew"),
        ("RadLab (OSDR)", "ISS radiation dose measurements", "Sets how fast crew dose grows without shielding"),
        ("Mars Trek", "Mars terrain, imagery and elevation", "Real maps for choosing the outpost site"),
        ("CSA · Food in space", "Growing food on the Moon", "Greenhouse mechanic and its power cost")]
gt = s.shapes.add_table(len(rows), 3, E(128), E(300), E(1664), E(60 + 5 * 84))
gt.name = "NASA data table"
tbl = gt.table
tblPr = tbl._tbl.tblPr
style = tblPr.find(qn("a:tableStyleId"))
if style is not None:
    style.text = "{2D5ABB26-0587-4C30-8999-92F81FD0307C}"  # No Style, No Grid; fills set per cell
for ci, wpx in enumerate([0.24, 0.32, 0.44]):
    tbl.columns[ci].width = E(1664 * wpx)
for ri, row in enumerate(rows):
    tbl.rows[ri].height = E(60 if ri == 0 else 84)
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
        r.font.color.rgb = rgb(MUTE if ri == 0 else MOON)
text(s, 128, 830, 1664, 36, "Every data point is credited inside the game, so players know it is real NASA science.",
     24, MUTE)
footer(s, FOOT, "05 / 07", False)
notes(s, "Данные NASA и партнёров из вкладки Resources челленджа. Колонка «How we use it» — черновик, "
         "уточнить по факту реализации. Если данные встроены статикой, а не через живой API, так и сказать.")

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
         ("UPGRADE", "More outposts and events, live space weather, a better design."),
         ("IMPLEMENT", "A classroom mode for teachers and a mobile version.")]
for i, (t, b) in enumerate(plans):
    x = 128 + i * (w + 32)
    box(s, x, 310, w, 220, INK2, line=LINE, line_w=1.5)
    text(s, x + 40, 346, w - 80, 32, t, 24, TEAL, MONO, bold=True, spacing=2)
    text(s, x + 40, 392, w - 80, 120, b, 26, MUTE, line=1.15)
text(s, 128, 620, 1500, 90, "Thanks for listening!", 72, MARS, HEAD, bold=True)
text(s, 128, 730, 1500, 70, "Sources: NASA DONKI · NASA OSDR · RadLab · Mars Trek · CSA Space Resources · "
     "[full links: project page]", 24, MUTE, line=1.15)
footer(s, "[team@email.com]", "07 / 07", False)
notes(s, "Планы (Test / Upgrade / Implement, как в прошлой презентации), источники и благодарность. "
         "Лимит мануала: максимум 7 слайдов на английском — это последний.")

prs.core_properties.title = "Lunar Ops — Junior Astronaut Mission Trainer"
prs.core_properties.subject = "NASA Space Apps Challenge Dnipro 2026"
prs.save(OUT)
print("saved", OUT)
