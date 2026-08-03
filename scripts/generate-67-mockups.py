#!/usr/bin/env python3
"""
Generate realistic 6.7" (1290x2796) App Store mockup PNGs for Spartan Coaching Membership.
These match the actual app UI (dark theme, Spartan Red accent) for all 5 required screens.
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

W, H = 1290, 2796
FONT_REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

OUT_DIR = "artifacts/spartan-coaching-mobile/store/screenshots/6.7"

# ── Brand colours ────────────────────────────────────────────────────
BG      = (10, 10, 10)
CARD    = (17, 17, 17)
CARD2   = (22, 22, 22)
BORDER  = (30, 30, 30)
RED     = (232, 41, 30)
RED_DIM = (140, 25, 18)
WHITE   = (245, 245, 245)
MUTED   = (120, 120, 120)
VERY_MUTED = (60, 60, 60)
GREEN   = (74, 222, 128)
GREEN_DIM = (22, 66, 38)
BLUE    = (96, 165, 250)
BLUE_DIM = (23, 37, 84)
YELLOW  = (250, 204, 21)

def font(size, bold=False, mono=False):
    path = FONT_MONO if mono else (FONT_BOLD if bold else FONT_REG)
    return ImageFont.truetype(path, size)

def base_image():
    img = Image.new("RGBA", (W, H), BG)
    return img, ImageDraw.Draw(img)

def draw_status_bar(draw):
    """iPhone status bar with time, signal, battery."""
    y = 60
    # Time
    draw.text((80, y), "9:41", font=font(52, bold=True), fill=WHITE)
    # Signal bars (right side)
    bx = 1100
    for i, h2 in enumerate([20, 28, 36, 44]):
        draw.rectangle([bx + i*22, y + 44 - h2, bx + i*22 + 14, y + 44], fill=WHITE)
    # WiFi
    wx = bx + 110
    for r, a in [(28, 30), (18, 25), (8, 20)]:
        draw.arc([wx - r, y + 10, wx + r, y + 10 + r*2], start=180+a, end=360-a, fill=WHITE, width=6)
    draw.ellipse([wx - 5, y + 42, wx + 5, y + 52], fill=WHITE)
    # Battery
    bat_x, bat_y = bx + 170, y + 12
    draw.rounded_rectangle([bat_x, bat_y, bat_x + 60, bat_y + 30], radius=5, outline=WHITE, width=3)
    draw.rectangle([bat_x + 62, bat_y + 9, bat_x + 66, bat_y + 21], fill=WHITE)
    draw.rectangle([bat_x + 4, bat_y + 4, bat_x + 46, bat_y + 26], fill=WHITE)

def draw_tab_bar(draw, active="home"):
    """Bottom tab bar."""
    tb_y = H - 220
    draw.rectangle([0, tb_y, W, H], fill=(10, 10, 10))
    draw.line([0, tb_y, W, tb_y], fill=BORDER, width=2)

    tabs = [
        ("home", "Home", 215),
        ("zap",  "Tools", 430),
        ("book", "Learn", 645),
        ("user", "Account", 860),
        ("phone","Coaching", 1075),
    ]
    for key, label, cx in tabs:
        is_active = (key == active)
        col = RED if is_active else MUTED
        # Draw simple icon
        icon_y = tb_y + 30
        if key == "home":
            pts = [cx, icon_y+8, cx-22, icon_y+32, cx+22, icon_y+32]
            draw.polygon(pts, fill=col)
            draw.rectangle([cx-12, icon_y+28, cx+12, icon_y+50], fill=col)
        elif key == "zap":
            draw.polygon([cx+5, icon_y, cx-8, icon_y+26, cx+2, icon_y+26,
                          cx-5, icon_y+52, cx+12, icon_y+22, cx+2, icon_y+22], fill=col)
        elif key == "book":
            draw.rectangle([cx-18, icon_y, cx+18, icon_y+48], outline=col, width=5)
            draw.line([cx, icon_y, cx, icon_y+48], fill=col, width=3)
        elif key == "user":
            draw.ellipse([cx-12, icon_y, cx+12, icon_y+24], outline=col, width=5)
            draw.arc([cx-20, icon_y+22, cx+20, icon_y+52], start=180, end=360, fill=col, width=5)
        elif key == "phone":
            draw.rounded_rectangle([cx-14, icon_y+4, cx+14, icon_y+48],
                                   radius=5, outline=col, width=5)
            draw.ellipse([cx-4, icon_y+38, cx+4, icon_y+46], fill=col)
        draw.text((cx, tb_y + 90), label,
                  font=font(32, bold=is_active), fill=col, anchor="mm")
    # Home indicator bar
    draw.rounded_rectangle([W//2 - 120, H - 24, W//2 + 120, H - 10], radius=4, fill=(80,80,80))

def draw_card(draw, x, y, w, h, radius=24, fill=CARD, outline=BORDER):
    draw.rounded_rectangle([x, y, x+w, y+h], radius=radius, fill=fill, outline=outline, width=2)

def draw_red_button(draw, x, y, w, h, label, text_size=48):
    draw.rounded_rectangle([x, y, x+w, y+h], radius=20, fill=RED)
    draw.text((x + w//2, y + h//2), label, font=font(text_size, bold=True),
              fill=WHITE, anchor="mm")

def draw_section_header(draw, y, text, sub=None):
    draw.text((80, y), text, font=font(54, bold=True), fill=WHITE)
    if sub:
        draw.text((80, y + 70), sub, font=font(36), fill=MUTED)
    return y + (110 if sub else 70)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Screen 1: Checklist / Home
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_checklist():
    img, draw = base_image()

    # Hero gradient header
    for y in range(280):
        t = y / 280
        r = int(5 + (26-5)*t)
        g = int(5 + (4-5)*max(0,t))
        b = int(5 + (4-5)*max(0,t))
        draw.line([0, y, W, y], fill=(r, g, b))

    draw_status_bar(draw)

    # Header content
    draw.text((80, 148), "FIELD KIT", font=font(36, bold=True), fill=RED)
    draw.text((80, 195), "Today's Visit Plan", font=font(72, bold=True), fill=WHITE)

    # Date pill
    draw.rounded_rectangle([80, 282, 420, 330], radius=20, fill=(30, 10, 10))
    draw.text((250, 306), "Thursday · Jul 24", font=font(36), fill=MUTED, anchor="mm")

    # Progress bar
    bar_y = 360
    draw.rounded_rectangle([80, bar_y, W-80, bar_y+14], radius=7, fill=(30,30,30))
    draw.rounded_rectangle([80, bar_y, 80 + int((W-160)*0.6), bar_y+14], radius=7, fill=RED)

    draw.text((80, bar_y + 28), "3 of 5 complete · 60%", font=font(34), fill=MUTED)

    # Checklist section label
    y_cur = 440
    draw.text((80, y_cur), "First-Session Checklist", font=font(42, bold=True), fill=WHITE)
    y_cur += 64

    items = [
        ("Introduced Membership workflow",      True),
        ("Reviewed branch staffing model",     True),
        ("Ran scenario coach drill",           True),
        ("Reviewed objection responses",       False),
        ("Scheduled follow-up call",           False),
    ]

    for label, done in items:
        draw_card(draw, 80, y_cur, W-160, 120,
                  fill=(16, 30, 16) if done else CARD,
                  outline=(74, 222, 128, 80) if done else BORDER)
        # Checkbox
        cx, cy = 148, y_cur + 60
        draw.ellipse([cx-28, cy-28, cx+28, cy+28],
                     fill=GREEN if done else (30,30,30),
                     outline=GREEN if done else BORDER, width=3)
        if done:
            draw.line([cx-14, cy, cx-4, cy+12], fill=(10,10,10), width=7)
            draw.line([cx-4, cy+12, cx+16, cy-10], fill=(10,10,10), width=7)
        text_col = (180, 220, 180) if done else WHITE
        draw.text((200, y_cur + 60), label, font=font(40, bold=not done),
                  fill=text_col, anchor="lm")
        y_cur += 142

    # Quick Tools section
    y_cur += 20
    draw.text((80, y_cur), "Quick Tools", font=font(42, bold=True), fill=WHITE)
    y_cur += 64

    tools = [("Objection Handler", RED, "⚡"), ("Share Brand Film", (30,30,30), "▶")]
    for i, (label, bg, icon) in enumerate(tools):
        tx = 80 + i * (W//2 - 20)
        tw = W//2 - 60
        draw_card(draw, tx, y_cur, tw, 130, fill=bg)
        draw.text((tx + tw//2, y_cur + 65), label,
                  font=font(38, bold=True), fill=WHITE, anchor="mm")
    y_cur += 160

    # Coaching call banner
    draw_card(draw, 80, y_cur, W-160, 160, fill=(25, 10, 8))
    draw.rounded_rectangle([80, y_cur, 80 + 8, y_cur + 160], radius=4, fill=RED)
    draw.text((130, y_cur + 45), "Strategy Call Available", font=font(42, bold=True), fill=WHITE)
    draw.text((130, y_cur + 105), "Book your 1-on-1 with Nick →", font=font(36), fill=MUTED)

    draw_tab_bar(draw, active="home")
    return img

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Screen 2: Scenario Coach (AI Chat)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_scenario_coach():
    img, draw = base_image()
    draw_status_bar(draw)

    # Nav bar
    draw.text((W//2, 168), "Scenario Coach", font=font(54, bold=True), fill=WHITE, anchor="mm")
    draw.text((80, 168), "←", font=font(54), fill=MUTED, anchor="lm")
    draw.text((W - 80, 168), "⋯", font=font(54), fill=MUTED, anchor="rm")
    draw.line([0, 210, W, 210], fill=BORDER, width=2)

    # Scenario tag
    y = 240
    draw.rounded_rectangle([80, y, 620, y+58], radius=28, fill=(30, 8, 6))
    draw.ellipse([98, y+12, 128, y+42], fill=RED)
    draw.text((145, y+29), "Skeptical Oncologist", font=font(34, bold=True), fill=RED, anchor="lm")

    # Chat messages
    y = 340

    def user_bubble(text, lines, ypos):
        bw = 900
        bh = 40 + lines * 70
        bx = W - 80 - bw
        draw.rounded_rectangle([bx, ypos, bx+bw, ypos+bh], radius=28,
                                fill=(40, 12, 10), outline=(80, 25, 20), width=2)
        draw.text((bx + 40, ypos + 40), text, font=font(38), fill=WHITE)
        return ypos + bh + 30

    def ai_bubble(lines_data, ypos):
        max_chars = max(len(l) for l in lines_data)
        bw = min(1000, 80 + max_chars * 22)
        bh = 60 + len(lines_data) * 64
        draw.rounded_rectangle([80, ypos, 80+bw, ypos+bh], radius=28,
                                fill=CARD2, outline=BORDER, width=2)
        draw.ellipse([96, ypos+16, 144, ypos+64], fill=(50,50,50))
        draw.text((120, ypos + 40), "AI", font=font(30, bold=True), fill=MUTED, anchor="mm")
        for i, line in enumerate(lines_data):
            draw.text((164, ypos + 38 + i*64), line, font=font(38), fill=WHITE)
        return ypos + bh + 30

    y = user_bubble("We already have a preferred\nhospice provider.", 2, y)
    y = ai_bubble([
        "I hear that — and I respect the",
        "relationship you've built. What",
        "I've found is that physicians who",
        "work with us see 23% faster",
        "response times on crisis calls.",
    ], y)
    y = user_bubble("How does that compare to\nour current partner?", 2, y)
    y = ai_bubble([
        "Great question. Our branch model",
        "staffs dedicated liaisons per",
        "territory — so your patients get",
        "the same rep every visit.",
        "",
        "Would it help to see our branch",
        "data for your service area?",
    ], y)

    # Coach feedback card
    y += 20
    draw_card(draw, 80, y, W-160, 200, fill=(14, 22, 14))
    draw.rounded_rectangle([80, y, 80+8, y+200], radius=4, fill=GREEN)
    draw.text((130, y + 45), "Coach Feedback", font=font(40, bold=True), fill=GREEN)
    draw.text((130, y + 105), "Strong rapport — add a specific", font=font(36), fill=WHITE)
    draw.text((130, y + 155), "branch metric to close the loop.", font=font(36), fill=MUTED)
    # Stars
    for i in range(4):
        draw.text((W - 260 + i*50, y + 45), "★", font=font(48), fill=YELLOW)
    draw.text((W - 60, y + 45), "★", font=font(48), fill=VERY_MUTED)
    y += 220

    # Input bar
    draw.rectangle([0, H-310, W, H-220], fill=(15,15,15))
    draw.line([0, H-310, W, H-310], fill=BORDER, width=2)
    draw_card(draw, 80, H-300, W-260, 90, fill=(25,25,25))
    draw.text((130, H-255), "Respond as the physician…", font=font(38), fill=VERY_MUTED, anchor="lm")
    draw.rounded_rectangle([W-180, H-300, W-100, H-210], radius=20, fill=RED)
    draw.text((W-140, H-255), "→", font=font(48, bold=True), fill=WHITE, anchor="mm")

    draw_tab_bar(draw, active="zap")
    return img

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Screen 3: Branch Calculator
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_branch_calculator():
    img, draw = base_image()
    draw_status_bar(draw)

    draw.text((W//2, 168), "Branch Calculator", font=font(54, bold=True), fill=WHITE, anchor="mm")
    draw.text((80, 168), "←", font=font(54), fill=MUTED, anchor="lm")
    draw.line([0, 210, W, 210], fill=BORDER, width=2)

    y = 260
    draw.text((80, y), "Target ADC", font=font(42, bold=True), fill=WHITE)
    y += 60
    draw_card(draw, 80, y, W-160, 120)
    draw.text((160, y + 60), "32", font=font(72, bold=True), fill=WHITE, anchor="lm")
    draw.text((W - 130, y + 60), "patients/day", font=font(36), fill=MUTED, anchor="rm")
    y += 150

    # Preset buttons
    presets = ["Conservative", "Standard", "Aggressive"]
    pw = (W - 160 - 40) // 3
    for i, label in enumerate(presets):
        px = 80 + i * (pw + 20)
        is_sel = i == 1
        draw.rounded_rectangle([px, y, px+pw, y+80], radius=16,
                                fill=RED if is_sel else (25,25,25),
                                outline=RED if is_sel else BORDER, width=2)
        draw.text((px + pw//2, y + 40), label, font=font(34, bold=is_sel),
                  fill=WHITE if is_sel else MUTED, anchor="mm")
    y += 110

    # Staffing table
    draw.text((80, y), "Staffing Model", font=font(42, bold=True), fill=WHITE)
    y += 60

    headers = ["Role", "FTE", "Salary", "Annual Cost"]
    col_x = [80, 380, 620, 900]
    col_w = [280, 220, 260, 300]

    # Header row
    draw.rounded_rectangle([80, y, W-80, y+70], radius=12, fill=(30,8,6))
    for i, h in enumerate(headers):
        anchor = "lm" if i == 0 else "rm"
        tx = col_x[i] + (0 if i == 0 else col_w[i])
        draw.text((tx, y+35), h, font=font(34, bold=True), fill=RED, anchor=anchor)
    y += 72

    rows = [
        ("RN Case Mgr",    "2.4", "$85,000",  "$204,000"),
        ("LPN/LVN",        "1.8", "$62,000",  "$111,600"),
        ("Home Health Aide","4.2", "$38,000",  "$159,600"),
        ("Social Worker",  "0.8", "$58,000",   "$46,400"),
        ("Chaplain",       "0.4", "$48,000",   "$19,200"),
        ("Volunteer Coord","0.3", "$42,000",   "$12,600"),
    ]

    for ri, (role, fte, salary, cost) in enumerate(rows):
        row_bg = (22, 22, 22) if ri % 2 == 0 else (17, 17, 17)
        draw.rectangle([80, y, W-80, y+80], fill=row_bg)
        draw.line([80, y+80, W-80, y+80], fill=BORDER, width=1)
        draw.text((col_x[0], y+40), role, font=font(36), fill=WHITE, anchor="lm")
        draw.text((col_x[1]+col_w[1], y+40), fte, font=font(36, mono=True), fill=MUTED, anchor="rm")
        draw.text((col_x[2]+col_w[2], y+40), salary, font=font(36, mono=True), fill=MUTED, anchor="rm")
        draw.text((col_x[3]+col_w[3], y+40), cost, font=font(36, mono=True, bold=True), fill=WHITE, anchor="rm")
        y += 80

    # Total row
    draw.rounded_rectangle([80, y, W-80, y+90], radius=12, fill=(30,8,6))
    draw.text((col_x[0], y+45), "TOTAL", font=font(38, bold=True), fill=RED, anchor="lm")
    draw.text((col_x[1]+col_w[1], y+45), "9.9", font=font(38, mono=True, bold=True), fill=WHITE, anchor="rm")
    draw.text((col_x[3]+col_w[3], y+45), "$553,400", font=font(38, mono=True, bold=True), fill=RED, anchor="rm")
    y += 110

    # Revenue projection
    draw_card(draw, 80, y, W-160, 200, fill=(10, 20, 10))
    draw.rounded_rectangle([80, y, 88, y+200], radius=4, fill=GREEN)
    draw.text((130, y + 45), "Projected Annual Revenue", font=font(40, bold=True), fill=GREEN)
    draw.text((130, y + 110), "$2,944,000", font=font(72, bold=True), fill=WHITE)
    draw.text((130, y + 180), "at 32 ADC · Medicare avg $252/day", font=font(34), fill=MUTED)
    y += 220

    # Margin card
    draw_card(draw, 80, y, W-160, 120, fill=CARD2)
    draw.text((130, y + 35), "Operating Margin", font=font(38, bold=True), fill=WHITE)
    draw.text((130, y + 88), "after staffing costs", font=font(34), fill=MUTED)
    draw.text((W - 130, y + 60), "81.2%", font=font(56, bold=True), fill=GREEN, anchor="rm")

    draw_tab_bar(draw, active="zap")
    return img

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Screen 4: Objection Handler (Drills)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_drills():
    img, draw = base_image()
    draw_status_bar(draw)

    draw.text((W//2, 168), "Objection Handler", font=font(54, bold=True), fill=WHITE, anchor="mm")
    draw.text((80, 168), "←", font=font(54), fill=MUTED, anchor="lm")
    draw.line([0, 210, W, 210], fill=BORDER, width=2)

    # Tab row
    y = 238
    tabs = [("Objections", True), ("Playbooks", False), ("Saved", False)]
    tw = (W - 160) // len(tabs)
    for i, (label, active) in enumerate(tabs):
        tx = 80 + i * tw
        if active:
            draw.rounded_rectangle([tx, y, tx+tw, y+64], radius=12, fill=(30,8,6))
        draw.text((tx + tw//2, y+32), label, font=font(38, bold=active),
                  fill=RED if active else MUTED, anchor="mm")
    y += 90

    # Input card
    draw.text((80, y), "What objection are you facing?", font=font(42, bold=True), fill=WHITE)
    y += 64
    draw_card(draw, 80, y, W-160, 140)
    draw.text((130, y + 50), "We already have a preferred", font=font(40), fill=WHITE)
    draw.text((130, y + 100), "hospice provider.", font=font(40), fill=WHITE)
    y += 160

    # Type tags
    tags = [("Relationship", True), ("Gatekeeper", False), ("Competitor", False), ("Timing", False)]
    tx = 80
    for label, sel in tags:
        tw2 = len(label) * 22 + 48
        draw.rounded_rectangle([tx, y, tx+tw2, y+56], radius=28,
                                fill=RED if sel else (25,25,25),
                                outline=RED if sel else BORDER, width=2)
        draw.text((tx + tw2//2, y+28), label, font=font(32, bold=sel),
                  fill=WHITE if sel else MUTED, anchor="mm")
        tx += tw2 + 16
    y += 80

    draw_red_button(draw, 80, y, W-160, 100, "Generate Response", 48)
    y += 130

    # Generated response card
    draw.text((80, y), "Field-Ready Response", font=font(42, bold=True), fill=WHITE)
    draw.rounded_rectangle([80+W-160-120, y, 80+W-160-40, y+52],
                            radius=14, fill=(20,20,20), outline=BORDER, width=2)
    draw.text((80+W-160-80, y+26), "Save", font=font(32), fill=MUTED, anchor="mm")
    y += 70

    response_lines = [
        "\"I completely understand — you've built a real",
        "partnership there, and I respect that. What I've",
        "seen is that physicians in your position often find",
        "that a second relationship gives their patients a",
        "faster response time during evenings and weekends.",
        "",
        "Would it be worth a 10-minute conversation to see",
        "if there's a complementary fit? I'm not asking you",
        "to replace anyone — just to have one more option",
        "when census pressure is high.\"",
    ]

    card_h = 60 + len(response_lines) * 58 + 30
    draw_card(draw, 80, y, W-160, card_h, fill=(14, 18, 14))
    draw.rounded_rectangle([80, y, 88, y+card_h], radius=4, fill=GREEN)
    ry = y + 40
    for line in response_lines:
        draw.text((130, ry), line, font=font(36 if line else 20), fill=WHITE if line else MUTED)
        ry += 58
    y += card_h + 20

    # Action strip
    draw.rounded_rectangle([80, y, 80+(W-200)//2, y+90], radius=20,
                            fill=(20,20,20), outline=BORDER, width=2)
    draw.text((80 + (W-200)//4, y+45), "⟳  Regenerate", font=font(36), fill=MUTED, anchor="mm")
    draw.rounded_rectangle([80+(W-200)//2+20, y, W-80, y+90], radius=20,
                            fill=(10,40,10), outline=GREEN, width=2)
    draw.text((80+(W-200)//2+20 + (W-200)//4, y+45), "✉  Share", font=font(36, bold=True),
              fill=GREEN, anchor="mm")

    draw_tab_bar(draw, active="zap")
    return img

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Screen 5: Login
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def make_login():
    img, draw = base_image()
    draw_status_bar(draw)

    # Logo area
    logo_y = 320
    # Spartan shield outline
    cx = W // 2
    pts = [
        cx, logo_y,
        cx - 120, logo_y + 80,
        cx - 120, logo_y + 220,
        cx, logo_y + 320,
        cx + 120, logo_y + 220,
        cx + 120, logo_y + 80,
    ]
    draw.polygon(pts, fill=(25, 8, 6), outline=RED, width=6)
    draw.text((cx, logo_y + 155), "S", font=font(160, bold=True), fill=RED, anchor="mm")

    y = logo_y + 360
    draw.text((cx, y), "SPARTAN COACHING", font=font(44, bold=True), fill=WHITE, anchor="mm")
    draw.text((cx, y + 60), "FIELD KIT", font=font(36), fill=MUTED, anchor="mm")

    # Divider
    y += 120
    draw.line([cx - 200, y, cx + 200, y], fill=BORDER, width=2)
    y += 50

    draw.text((cx, y), "CLIENT ACCESS", font=font(36, bold=True), fill=RED, anchor="mm")
    y += 60
    draw.text((cx, y), "Sign in to your account", font=font(52, bold=True), fill=WHITE, anchor="mm")
    y += 90

    # Email field
    draw.text((80, y), "Email address", font=font(36), fill=MUTED)
    y += 50
    draw_card(draw, 80, y, W-160, 120)
    draw.text((130, y + 60), "nick@spartanhospicecoaching.com",
              font=font(38), fill=WHITE, anchor="lm")
    y += 140

    # Password field
    draw.text((80, y), "Password", font=font(36), fill=MUTED)
    y += 50
    draw_card(draw, 80, y, W-160, 120)
    # Password dots
    for i in range(10):
        draw.ellipse([130 + i*52, y+50, 162 + i*52, y+82], fill=WHITE)
    draw.text((W - 130, y + 60), "👁", font=font(48), fill=MUTED, anchor="rm")
    y += 150

    # Sign in button
    draw_red_button(draw, 80, y, W-160, 120, "Sign in", 52)
    y += 150

    # Separator
    draw.text((cx, y), "— or —", font=font(36), fill=VERY_MUTED, anchor="mm")
    y += 70

    # Secondary action
    draw.rounded_rectangle([80, y, W-80, y+110], radius=20,
                            fill=(20,20,20), outline=BORDER, width=2)
    draw.text((cx, y + 55), "Request evaluation access", font=font(42), fill=MUTED, anchor="mm")
    y += 140

    # Footer
    draw.text((cx, y), "Questions? Book a strategy call with Nick →",
              font=font(34), fill=MUTED, anchor="mm")
    y += 56
    draw.text((cx, y), "spartanhospicecoaching.com",
              font=font(34), fill=RED, anchor="mm")

    return img

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Generate all 5 screens
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
screens = [
    ("01-checklist.png",         make_checklist),
    ("02-scenario-coach.png",    make_scenario_coach),
    ("03-branch-calculator.png", make_branch_calculator),
    ("04-drills.png",            make_drills),
    ("05-login.png",             make_login),
]

os.makedirs(OUT_DIR, exist_ok=True)

for filename, fn in screens:
    path = os.path.join(OUT_DIR, filename)
    img = fn()
    img = img.convert("RGB")
    img.save(path, "PNG", optimize=False)
    print(f"✓ {filename}  ({img.size[0]}×{img.size[1]})")

print("\nAll done.")
