#!/usr/bin/env python3
"""
Generate App Store screenshots for the Spartan Coaching Field Kit
iPhone 16 Pro Max / 6.9" — 1320 × 2868 px
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts", "spartan-coaching-mobile", "store", "screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

# --- Sizes ---
W, H = 1320, 2868
STATUS_H = 120         # status bar
NAV_H    = 160         # top nav bar
TAB_H    = 190         # bottom tab bar
CORNER   = 110         # screen corner radius

# --- Brand colours (from constants/colors.ts) ---
BG        = "#0a0a0a"
CARD      = "#111111"
SECONDARY = "#1e1e1e"
MUTED     = "#161616"
PRIMARY   = "#e8291e"
FG        = "#f5f5f5"
MUT_FG    = "#888888"
BORDER    = "#2a2a2a"
INPUT_BG  = "#1a1a1a"
GREEN     = "#22c55e"
AMBER     = "#f59e0b"

# --- Fonts ---
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
def font(size, bold=False):
    try:
        path = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def mono(size):
    try:
        return ImageFont.truetype(os.path.join(FONT_DIR, "DejaVuSansMono.ttf"), size)
    except:
        return ImageFont.load_default()

# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def new_screen():
    img = Image.new("RGB", (W, H), BG)
    d   = ImageDraw.Draw(img)
    return img, d

def rounded_rect(d, x0, y0, x1, y1, r, fill=None, outline=None, width=2):
    d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=fill, outline=outline, width=width)

def status_bar(d, time_str="9:41"):
    """Draw a minimal iOS-style status bar."""
    d.rectangle([0, 0, W, STATUS_H], fill=BG)
    # Time
    d.text((80, 36), time_str, font=font(52, bold=True), fill=FG)
    # Signal dots (simplified)
    for i in range(4):
        x = W - 260 + i * 46
        h_bar = 20 + i * 12
        d.rectangle([x, 96 - h_bar, x + 30, 96], fill=FG)
    # WiFi arc simplified
    wx = W - 145
    for r_arc in [48, 32, 18]:
        d.arc([wx - r_arc, 50, wx + r_arc, 96], 200, 340, fill=FG, width=8)
    # Battery
    d.rounded_rectangle([W - 105, 42, W - 45, 84], radius=6, outline=FG, width=4)
    d.rectangle([W - 100, 48, W - 68, 78], fill=FG)
    d.rectangle([W - 44, 55, W - 40, 71], fill=FG)

def nav_bar(d, title, back=False):
    """Draw top nav bar."""
    y0 = STATUS_H
    d.rectangle([0, y0, W, y0 + NAV_H], fill=BG)
    # Subtle bottom border
    d.line([(0, y0 + NAV_H - 1), (W, y0 + NAV_H - 1)], fill=BORDER, width=2)
    # Title
    tf = font(52, bold=True)
    d.text((W // 2, y0 + NAV_H // 2), title, font=tf, fill=FG, anchor="mm")
    if back:
        d.text((60, y0 + NAV_H // 2), "‹ Back", font=font(42), fill=PRIMARY, anchor="lm")

def tab_bar(d, active="home"):
    """Draw bottom tab bar."""
    y0 = H - TAB_H
    d.rectangle([0, y0, W, H], fill="#0d0d0d")
    d.line([(0, y0), (W, y0)], fill=BORDER, width=2)
    tabs = [
        ("home", "Home", "⌂"),
        ("tools", "Tools", "⚡"),
        ("learn", "Learn", "📖"),
        ("account", "Account", "👤"),
    ]
    tw = W // len(tabs)
    for i, (key, label, icon) in enumerate(tabs):
        cx = i * tw + tw // 2
        cy = y0 + TAB_H // 2
        clr = PRIMARY if key == active else MUT_FG
        d.text((cx, cy - 28), icon, font=font(52), fill=clr, anchor="mm")
        d.text((cx, cy + 40), label, font=font(34), fill=clr, anchor="mm")

def pill(d, x, y, w, h, text, bg, fg, r=20, fs=36, bold=False):
    rounded_rect(d, x, y, x + w, y + h, r, fill=bg)
    d.text((x + w // 2, y + h // 2), text, font=font(fs, bold), fill=fg, anchor="mm")

def section_label(d, x, y, text):
    d.text((x, y), text.upper(), font=font(30, bold=True), fill=MUT_FG, anchor="lm")

def card_bg(d, x, y, w, h, r=24):
    rounded_rect(d, x, y, x + w, y + h, r, fill=CARD)

# ---------------------------------------------------------------------------
# Screen 1 — Checklist / Home
# ---------------------------------------------------------------------------
def screen_checklist():
    img, d = new_screen()
    status_bar(d, "9:41")
    nav_bar(d, "Field Kit")
    tab_bar(d, "home")

    y = STATUS_H + NAV_H + 40

    # Welcome card
    card_bg(d, 40, y, W - 80, 190)
    d.text((80, y + 52), "Good morning, Sarah", font=font(50, bold=True), fill=FG)
    d.text((80, y + 118), "3 visits scheduled today", font=font(38), fill=MUT_FG)
    y += 210

    # Section label
    section_label(d, 80, y + 24, "First-Session Checklist")
    y += 60

    # Checklist items
    items = [
        (True,  "Handle a live objection",        "Objection Handler →"),
        (True,  "Build a growth plan",             "Sales Playbooks →"),
        (False, "Complete a role-play drill",      "Start Role-Play →"),
        (False, "Review your branch numbers",      "Open Calculator →"),
        (False, "Book your debrief call",          "Schedule →"),
    ]
    for done, label, action in items:
        card_bg(d, 40, y, W - 80, 140)
        # Check circle
        cx, cy = 100, y + 70
        d.ellipse([cx - 32, cy - 32, cx + 32, cy + 32], outline=GREEN if done else BORDER, width=4, fill=GREEN if done else None)
        if done:
            # Checkmark
            d.line([(cx - 14, cy), (cx - 2, cy + 14), (cx + 16, cy - 14)], fill="#fff", width=6)
        fg_c = MUT_FG if done else FG
        d.text((152, y + 50), label, font=font(42, bold=not done), fill=fg_c)
        d.text((152, y + 102), action, font=font(34), fill=PRIMARY if not done else MUT_FG)
        y += 156

    # Quick ask field
    y += 10
    rounded_rect(d, 40, y, W - 40, y + 108, 24, fill=INPUT_BG, outline=BORDER, width=2)
    d.text((90, y + 54), "Ask any question…", font=font(42), fill=MUT_FG, anchor="lm")
    y += 130

    img.save(os.path.join(OUT_DIR, "01-checklist.png"))
    print("✓  01-checklist.png")

# ---------------------------------------------------------------------------
# Screen 2 — AI Scenario Coach (Role-Play)
# ---------------------------------------------------------------------------
def screen_scenario_coach():
    img, d = new_screen()
    status_bar(d, "9:41")
    nav_bar(d, "Tools")
    tab_bar(d, "tools")

    # Tool tabs
    y = STATUS_H + NAV_H
    tab_keys   = ["Objections", "Playbooks", "Email", "Role-Play"]
    active_tab = 3
    tw = W // len(tab_keys)
    d.rectangle([0, y, W, y + 100], fill=SECONDARY)
    for i, t in enumerate(tab_keys):
        cx = i * tw + tw // 2
        clr = PRIMARY if i == active_tab else MUT_FG
        d.text((cx, y + 50), t, font=font(38, bold=(i == active_tab)), fill=clr, anchor="mm")
        if i == active_tab:
            d.rectangle([i * tw + 20, y + 90, (i + 1) * tw - 20, y + 98], fill=PRIMARY)
    y += 110

    # Active scenario header
    card_bg(d, 40, y, W - 80, 130)
    d.text((80, y + 45), "🩺  Skeptical Oncologist", font=font(46, bold=True), fill=FG)
    d.text((80, y + 100), "Practice Mode  •  Turn 3 of 5", font=font(34), fill=MUT_FG)
    y += 150

    # Chat bubbles
    bubbles = [
        ("ai",   "I really don't see the value in making more hospice referrals. My patients still have months left."),
        ("user", "I hear you — and I respect that you know your patients best. Can I share what we typically see with your patient population?"),
        ("ai",   "Sure, but make it quick. I have rounds in ten minutes."),
        ("user", "Of course. In similar oncology practices, about 30% of patients referred to us in the last 6 months of life had a measurably better symptom burden…"),
    ]

    for role, text in bubbles:
        is_user = role == "user"
        max_w = 900
        lines  = []
        words  = text.split()
        line   = ""
        fnt    = font(38)
        for w in words:
            test = (line + " " + w).strip()
            bb   = d.textbbox((0, 0), test, font=fnt)
            if bb[2] - bb[0] > max_w - 60:
                if line: lines.append(line)
                line = w
            else:
                line = test
        if line: lines.append(line)

        bh = len(lines) * 54 + 40
        bw = max(d.textbbox((0,0), l, font=fnt)[2] for l in lines) + 60
        bw = min(bw, max_w)

        if is_user:
            bx = W - 60 - bw
            bc = PRIMARY
            tc = "#fff"
        else:
            bx = 60
            bc = CARD
            tc = FG

        rounded_rect(d, bx, y, bx + bw, y + bh, 28, fill=bc)
        for li, line_text in enumerate(lines):
            d.text((bx + 30, y + 20 + li * 54), line_text, font=fnt, fill=tc)
        y += bh + 24

    # Feedback prompt row
    y += 10
    card_bg(d, 40, y, W - 80, 110)
    d.text((80, y + 55), "⭐  Rate this turn's coaching quality", font=font(40), fill=MUT_FG, anchor="lm")

    # Input bar
    iy = H - TAB_H - 130
    rounded_rect(d, 40, iy, W - 160, iy + 100, 28, fill=INPUT_BG, outline=BORDER, width=2)
    d.text((80, iy + 50), "Your response…", font=font(42), fill=MUT_FG, anchor="lm")
    rounded_rect(d, W - 148, iy, W - 40, iy + 100, 28, fill=PRIMARY)
    d.text((W - 94, iy + 50), "➤", font=font(48), fill="#fff", anchor="mm")

    img.save(os.path.join(OUT_DIR, "02-scenario-coach.png"))
    print("✓  02-scenario-coach.png")

# ---------------------------------------------------------------------------
# Screen 3 — Branch Calculator
# ---------------------------------------------------------------------------
def screen_calculator():
    img, d = new_screen()
    status_bar(d, "9:41")
    nav_bar(d, "Branch Staffing", back=True)

    y = STATUS_H + NAV_H + 40

    # Scenario selector
    section_label(d, 80, y + 24, "Scenario")
    y += 56
    scenarios = [("standard", "Standard", False), ("high_growth", "High-Growth", True), ("rural", "Rural", False)]
    sx = 40
    for key, label, active in scenarios:
        bw = 310 if key == "high_growth" else 260
        bg_c = PRIMARY if active else SECONDARY
        fg_c = "#fff" if active else MUT_FG
        rounded_rect(d, sx, y, sx + bw, y + 88, 20, fill=bg_c)
        d.text((sx + bw // 2, y + 44), label, font=font(38, bold=active), fill=fg_c, anchor="mm")
        sx += bw + 20
    y += 108

    # ADC input
    section_label(d, 80, y + 30, "Target ADC (average daily census)")
    y += 66
    rounded_rect(d, 40, y, W - 40, y + 108, 24, fill=INPUT_BG, outline=PRIMARY, width=3)
    d.text((90, y + 54), "42", font=font(58, bold=True), fill=FG, anchor="lm")
    d.text((W - 90, y + 54), "patients / day", font=font(38), fill=MUT_FG, anchor="rm")
    y += 130

    # Results table header
    section_label(d, 80, y + 30, "Required Staff")
    y += 66

    rows = [
        ("RN Case Manager",       "3.6",  "4"),
        ("LPN / LVN",             "1.8",  "2"),
        ("Social Worker",         "0.9",  "1"),
        ("Chaplain",              "0.5",  "1"),
        ("Home Health Aide",      "5.4",  "6"),
        ("Medical Director (FTE)","0.3",  "1"),
        ("Volunteer Coordinator", "0.5",  "1"),
    ]

    # Table header
    card_bg(d, 40, y, W - 80, 80, r=16)
    d.text((80, y + 40), "Role", font=font(36, bold=True), fill=MUT_FG, anchor="lm")
    d.text((W - 280, y + 40), "Calc", font=font(36, bold=True), fill=MUT_FG, anchor="lm")
    d.text((W - 130, y + 40), "Min", font=font(36, bold=True), fill=MUT_FG, anchor="lm")
    y += 88

    for i, (role, calc, mini) in enumerate(rows):
        bg_c = CARD if i % 2 == 0 else MUTED
        card_bg(d, 40, y, W - 80, 88, r=0)
        d.rectangle([40, y, W - 40, y + 88], fill=bg_c)
        d.text((80, y + 44), role, font=font(38), fill=FG, anchor="lm")
        d.text((W - 265, y + 44), calc, font=font(38), fill=MUT_FG, anchor="lm")
        d.text((W - 110, y + 44), mini, font=font(38, bold=True), fill=PRIMARY, anchor="lm")
        y += 90

    # Summary card
    y += 20
    card_bg(d, 40, y, W - 80, 160)
    d.text((80, y + 50), "Estimated annual payroll", font=font(38), fill=MUT_FG)
    d.text((80, y + 110), "$2,340,000 – $2,680,000", font=font(52, bold=True), fill=FG)

    img.save(os.path.join(OUT_DIR, "03-branch-calculator.png"))
    print("✓  03-branch-calculator.png")

# ---------------------------------------------------------------------------
# Screen 4 — Drills (Objection Handler)
# ---------------------------------------------------------------------------
def screen_drills():
    img, d = new_screen()
    status_bar(d, "9:41")
    nav_bar(d, "Tools")
    tab_bar(d, "tools")

    # Tool tabs
    y = STATUS_H + NAV_H
    tab_keys   = ["Objections", "Playbooks", "Email", "Role-Play"]
    active_tab = 0
    tw = W // len(tab_keys)
    d.rectangle([0, y, W, y + 100], fill=SECONDARY)
    for i, t in enumerate(tab_keys):
        cx = i * tw + tw // 2
        clr = PRIMARY if i == active_tab else MUT_FG
        d.text((cx, y + 50), t, font=font(38, bold=(i == active_tab)), fill=clr, anchor="mm")
        if i == active_tab:
            d.rectangle([i * tw + 20, y + 90, (i + 1) * tw - 20, y + 98], fill=PRIMARY)
    y += 120

    # Intro card
    card_bg(d, 40, y, W - 80, 150)
    d.text((80, y + 50), "Objection Handler", font=font(52, bold=True), fill=FG)
    d.text((80, y + 112), "Paste a live objection — get a field-ready response", font=font(36), fill=MUT_FG)
    y += 172

    # Input
    section_label(d, 80, y + 24, "Live Objection")
    y += 56
    rounded_rect(d, 40, y, W - 40, y + 180, 24, fill=INPUT_BG, outline=BORDER, width=2)
    obj_text = [
        '"We already have a great hospice provider',
        'and switching is too disruptive for our team."',
    ]
    for li, lt in enumerate(obj_text):
        d.text((80, y + 36 + li * 58), lt, font=font(42), fill=FG)
    y += 200

    # Generate button
    rounded_rect(d, 40, y, W - 40, y + 110, 28, fill=PRIMARY)
    d.text((W // 2, y + 55), "⚡  Generate Response", font=font(46, bold=True), fill="#fff", anchor="mm")
    y += 132

    # Response card
    section_label(d, 80, y + 24, "Field-Ready Response")
    y += 56
    card_bg(d, 40, y, W - 80, 740)
    response_lines = [
        "That loyalty tells me a lot about how your",
        "team operates — and I respect it.",
        "",
        "We're not asking you to switch. What we",
        "find is that referral sources who work with",
        "us alongside their current partner often",
        "see a faster call-to-admit on complex",
        "cases — because we specialize in exactly",
        "that handoff.",
        "",
        "Would it make sense to run one case",
        "together so you can see the difference",
        "firsthand — no commitment required?",
    ]
    ry = y + 40
    for line in response_lines:
        if line == "":
            ry += 28
        else:
            d.text((80, ry), line, font=font(40), fill=FG)
            ry += 56

    # Action row
    ay = y + 740 - 100
    d.text((100, ay + 30), "📋 Copy", font=font(40), fill=PRIMARY)
    d.text((340, ay + 30), "🔖 Save", font=font(40), fill=PRIMARY)
    d.text((560, ay + 30), "📤 Share", font=font(40), fill=PRIMARY)

    img.save(os.path.join(OUT_DIR, "04-drills.png"))
    print("✓  04-drills.png")

# ---------------------------------------------------------------------------
# Screen 5 — Portal / Login
# ---------------------------------------------------------------------------
def screen_login():
    img, d = new_screen()
    status_bar(d, "9:41")

    # Gradient-ish hero using layered rectangles
    for i in range(60):
        alpha = int(255 * (1 - i / 60) * 0.15)
        clr = f"#{int(232*(1-i/60)):02x}0000"
        d.rectangle([0, STATUS_H + i * 12, W, STATUS_H + i * 12 + 12], fill=clr)

    # Logo / brand mark
    logo_y = STATUS_H + 120
    # Red shield / S mark (simplified geometric)
    shield_cx, shield_cy = W // 2, logo_y + 160
    # Shield outline
    pts = [
        (shield_cx, shield_cy - 140),
        (shield_cx + 110, shield_cy - 80),
        (shield_cx + 110, shield_cy + 40),
        (shield_cx, shield_cy + 140),
        (shield_cx - 110, shield_cy + 40),
        (shield_cx - 110, shield_cy - 80),
    ]
    d.polygon(pts, fill=PRIMARY)
    d.text((shield_cx, shield_cy + 10), "S", font=font(140, bold=True), fill="#fff", anchor="mm")

    # App name
    name_y = logo_y + 360
    d.text((W // 2, name_y), "Spartan Coaching", font=font(64, bold=True), fill=FG, anchor="mm")
    d.text((W // 2, name_y + 76), "Field Kit", font=font(48), fill=MUT_FG, anchor="mm")

    y = name_y + 180

    # Login card
    card_bg(d, 60, y, W - 60, 640)
    cy = y + 50
    d.text((W // 2, cy), "Client Access", font=font(52, bold=True), fill=FG, anchor="mm")
    cy += 80

    # Email field
    d.text((100, cy + 30), "Email", font=font(36, bold=True), fill=MUT_FG)
    cy += 60
    rounded_rect(d, 100, cy, W - 100, cy + 100, 20, fill=INPUT_BG, outline=BORDER, width=2)
    d.text((140, cy + 50), "sarah@hospicegroup.com", font=font(42), fill=FG, anchor="lm")
    cy += 120

    # Password field
    d.text((100, cy + 30), "Password", font=font(36, bold=True), fill=MUT_FG)
    cy += 60
    rounded_rect(d, 100, cy, W - 100, cy + 100, 20, fill=INPUT_BG, outline=PRIMARY, width=3)
    d.text((140, cy + 50), "••••••••••••", font=font(42), fill=FG, anchor="lm")
    cy += 120

    # Sign in button
    rounded_rect(d, 100, cy, W - 100, cy + 110, 28, fill=PRIMARY)
    d.text((W // 2, cy + 55), "Sign In", font=font(50, bold=True), fill="#fff", anchor="mm")
    cy += 130

    # Links
    d.text((W // 2, cy + 20), "Magic link  •  Request access", font=font(38), fill=PRIMARY, anchor="mm")

    # Trust strip
    ty = y + 700
    d.text((W // 2, ty), "🔒  Approved clients & evaluators only", font=font(36), fill=MUT_FG, anchor="mm")
    ty += 56
    d.text((W // 2, ty), "Request access at spartanhospicecoaching.com", font=font(34), fill=MUT_FG, anchor="mm")

    # Home indicator
    d.rounded_rectangle([W // 2 - 140, H - 40, W // 2 + 140, H - 14], radius=10, fill="#444")

    img.save(os.path.join(OUT_DIR, "05-login.png"))
    print("✓  05-login.png")

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print(f"Generating screenshots → {OUT_DIR}")
    screen_checklist()
    screen_scenario_coach()
    screen_calculator()
    screen_drills()
    screen_login()
    print("\nDone. 5 screenshots at 1320×2868 px")
