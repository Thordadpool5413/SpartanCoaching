from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether
)

OUT = "/home/runner/workspace/spartan-coaching-value-proposition.pdf"
PW, PH = letter
M = 0.75 * inch          # margin
CW = PW - 2 * M          # content width = 6.5"

# ── Palette ────────────────────────────────────────────────────────────────────
RED    = colors.HexColor("#B91C1C")
DARK   = colors.HexColor("#111827")
GRAY   = colors.HexColor("#374151")
MID    = colors.HexColor("#6B7280")
LGRAY  = colors.HexColor("#F3F4F6")
BORDER = colors.HexColor("#E5E7EB")
GREEN  = colors.HexColor("#166534")
GBKG   = colors.HexColor("#F0FDF4")
RBKG   = colors.HexColor("#FFF1F2")
WHITE  = colors.white
DRED   = colors.HexColor("#991B1B")

# ── Type helpers ───────────────────────────────────────────────────────────────
def sty(name, fn="Helvetica", fs=10.5, fc=GRAY, lh=None, al=TA_LEFT,
        sa=0, li=0):
    return ParagraphStyle(name, fontName=fn, fontSize=fs, textColor=fc,
                          leading=lh or fs * 1.55, alignment=al,
                          spaceAfter=sa, leftIndent=li)

# All styles defined once — no inline creation
EYEBROW  = sty("EYE",  fn="Helvetica-Bold", fs=7.5, fc=RED,  al=TA_LEFT)
H1       = sty("H1",   fn="Helvetica-Bold", fs=20,  fc=DARK, lh=26)
H2       = sty("H2",   fn="Helvetica-Bold", fs=13,  fc=DARK, lh=19)
H3       = sty("H3",   fn="Helvetica-Bold", fs=11.5,fc=DARK, lh=17)
BODY     = sty("BODY", fs=10.5, fc=GRAY, al=TA_JUSTIFY, lh=17)
BODYL    = sty("BODYL",fs=10.5, fc=GRAY, lh=17)
SMALL    = sty("SML",  fs=9,    fc=MID,  lh=13)
CAPTION  = sty("CAP",  fs=8.5,  fc=MID,  lh=13, al=TA_CENTER)
BOLD     = sty("BLD",  fn="Helvetica-Bold", fs=10.5, fc=DARK, lh=17)
GRN      = sty("GRN",  fs=10.5, fc=GREEN, lh=17, al=TA_JUSTIFY)
GRN_LBL  = sty("GLBL", fn="Helvetica-Bold", fs=8, fc=GREEN, lh=11)
OBJ_Q    = sty("OBQ",  fn="Helvetica-Bold", fs=11, fc=DRED, lh=17)
STAT_N   = sty("STN",  fn="Helvetica-Bold", fs=22, fc=RED, lh=28, al=TA_CENTER)
STAT_L   = sty("STL",  fs=8.5, fc=GRAY, lh=13, al=TA_CENTER)
MAS_LBL  = sty("MLB",  fn="Helvetica-Bold", fs=7.5, fc=RED,  lh=11)
MAS_T    = sty("MT",   fn="Helvetica-Bold", fs=11,  fc=DARK, lh=16)
SVC_C    = sty("SCC",  fn="Helvetica-Bold", fs=7.5, fc=MID,  lh=11)
SVC_T    = sty("SCT",  fn="Helvetica-Bold", fs=12,  fc=DARK, lh=18)
SVC_B    = sty("SCB",  fs=10.5, fc=GRAY, lh=16, al=TA_JUSTIFY)
BUL      = sty("BUL",  fs=10.5, fc=GRAY, lh=16)
SCN_N    = sty("SNN",  fn="Helvetica-Bold", fs=17, fc=WHITE, lh=21, al=TA_CENTER)
CH_LBL   = sty("CHL",  fn="Helvetica-Bold", fs=7.5, fc=MID, lh=10)
STEP_N   = sty("SPN",  fn="Helvetica-Bold", fs=17, fc=RED, lh=21, al=TA_CENTER)
STEP_T   = sty("SPT",  fn="Helvetica-Bold", fs=11, fc=DARK, lh=16)
STEP_D   = sty("SPD",  fs=10, fc=GRAY, lh=15)
WHT_H    = sty("WH",   fn="Helvetica-Bold", fs=16, fc=WHITE, lh=22, al=TA_CENTER)
WHT_B    = sty("WB",   fs=10, fc=colors.HexColor("#D1D5DB"), lh=16, al=TA_CENTER)
PLR_T    = sty("PLT",  fn="Helvetica-Bold", fs=11, fc=DARK, lh=16)
PLR_B    = sty("PLB",  fs=9.5, fc=GRAY, lh=14, al=TA_JUSTIFY)
COV_EYE  = sty("CE",   fn="Helvetica-Bold", fs=9, fc=RED, lh=12, al=TA_CENTER)
COV_H    = sty("CH",   fn="Helvetica-Bold", fs=28, fc=WHITE, lh=36, al=TA_CENTER)
COV_S    = sty("CS",   fs=12, fc=colors.HexColor("#E5E7EB"), lh=19, al=TA_CENTER)
COV_AU   = sty("CA",   fn="Helvetica-Bold", fs=11, fc=WHITE, lh=16, al=TA_CENTER)
COV_CT   = sty("CC",   fs=9.5, fc=colors.HexColor("#9CA3AF"), lh=14, al=TA_CENTER)

# ── Utilities ──────────────────────────────────────────────────────────────────
def sp(n): return Spacer(1, n)
def P(t, s): return Paragraph(t, s)
def hr(c=BORDER, t=0.75): return HRFlowable(width="100%", thickness=t, color=c,
                                              spaceAfter=0, spaceBefore=0)

TS_ZERO = TableStyle([
    ("LEFTPADDING",  (0,0),(-1,-1), 0),
    ("RIGHTPADDING", (0,0),(-1,-1), 0),
    ("TOPPADDING",   (0,0),(-1,-1), 0),
    ("BOTTOMPADDING",(0,0),(-1,-1), 0),
])

def tcell(items, w, bg=WHITE, lp=12, rp=12, tp=12, bp=12, valign="TOP"):
    """Single-column cell. items can be Paragraphs or ints (spacers)."""
    rows = [[sp(i)] if isinstance(i, (int,float)) else [i] for i in items]
    t = Table(rows, colWidths=[w])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), bg),
        ("LEFTPADDING", (0,0),(-1,-1), lp),
        ("RIGHTPADDING",(0,0),(-1,-1), rp),
        ("TOPPADDING",  (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",  (0,0),(0,0),  tp),
        ("BOTTOMPADDING",(0,-1),(-1,-1), bp),
        ("VALIGN",(0,0),(-1,-1), valign),
    ]))
    return t

# ── Page canvas callbacks ───────────────────────────────────────────────────────
def draw_cover(c, doc):
    c.saveState()
    # Full dark background
    c.setFillColor(DARK)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)
    # Red top band
    c.setFillColor(RED)
    c.rect(0, PH - 0.6*inch, PW, 0.6*inch, fill=1, stroke=0)
    # Red bottom band
    c.rect(0, 0, PW, 0.45*inch, fill=1, stroke=0)
    # Subtle diagonal texture block (mid area)
    c.setFillColor(colors.HexColor("#1F2937"))
    c.rect(0, PH*0.28, PW, PH*0.42, fill=1, stroke=0)
    # Thin red accent line above content area
    c.setFillColor(RED)
    c.rect(M, PH*0.7 + 0.05*inch, CW, 0.03*inch, fill=1, stroke=0)
    c.restoreState()

def draw_page(c, doc):
    c.saveState()
    # Header
    c.setFillColor(DARK)
    c.rect(0, PH - 0.44*inch, PW, 0.44*inch, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, PH - 0.465*inch, PW, 0.025*inch, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(M, PH - 0.27*inch, "SPARTAN COACHING")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#9CA3AF"))
    c.drawRightString(PW - M, PH - 0.27*inch, "VALUE PROPOSITION")
    # Footer
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(M, 0.4*inch, PW - M, 0.4*inch)
    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    c.drawString(M, 0.24*inch,
                 "spartanhospicecoaching.com  |  nick@spartanhospicecoaching.com")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(GRAY)
    c.drawRightString(PW - M, 0.24*inch, f"Page {doc.page - 1}")
    c.restoreState()

# ── Section header ─────────────────────────────────────────────────────────────
def section(label, title):
    return [sp(12), P(label.upper(), EYEBROW), sp(4),
            P(title, H1), sp(7), hr(RED, 2), sp(12)]

def section_flat(label, title):
    """For first section on page (no top spacer)."""
    return [P(label.upper(), EYEBROW), sp(4),
            P(title, H1), sp(7), hr(RED, 2), sp(12)]

# ── Reusable blocks ─────────────────────────────────────────────────────────────
def stat_bar(stats):
    n = len(stats)
    cw = CW / n
    cols = []
    for big, lbl in stats:
        inner = Table([
            [P(big, STAT_N)],
            [sp(3)],
            [P(lbl, STAT_L)],
        ], colWidths=[cw])
        inner.setStyle(TableStyle([
            ("ALIGN",  (0,0),(-1,-1), "CENTER"),
            ("VALIGN", (0,0),(-1,-1), "TOP"),
            ("BACKGROUND",(0,0),(-1,-1), LGRAY),
            ("LEFTPADDING",(0,0),(-1,-1), 4),
            ("RIGHTPADDING",(0,0),(-1,-1), 4),
            ("TOPPADDING",(0,0),(-1,-1), 0),
            ("BOTTOMPADDING",(0,0),(-1,-1), 0),
            ("TOPPADDING",(0,0),(0,0), 14),
            ("BOTTOMPADDING",(0,-1),(-1,-1), 14),
        ]))
        cols.append(inner)
    t = Table([cols], colWidths=[cw]*n)
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1), 1, BORDER),
        ("INNERGRID",(0,0),(-1,-1), 1, BORDER),
        ("LEFTPADDING",(0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",(0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))
    return t

def pillar_2x2(pillars):
    """2x2 grid — wider cells, no word-break issues."""
    hw = (CW - 5) / 2

    def make_cell(title, body_txt):
        t = Table([
            [P(title, PLR_T)],
            [sp(5)],
            [P(body_txt, PLR_B)],
        ], colWidths=[hw])
        t.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), LGRAY),
            ("BOX",(0,0),(-1,-1), 1, BORDER),
            ("LINEBEFORE",(0,0),(0,-1), 3, RED),
            ("LEFTPADDING",(0,0),(-1,-1), 13),
            ("RIGHTPADDING",(0,0),(-1,-1), 11),
            ("TOPPADDING",(0,0),(-1,-1), 0),
            ("BOTTOMPADDING",(0,0),(-1,-1), 0),
            ("TOPPADDING",(0,0),(0,0), 12),
            ("BOTTOMPADDING",(0,-1),(-1,-1), 12),
            ("VALIGN",(0,0),(-1,-1), "TOP"),
        ]))
        return t

    row1 = [make_cell(pillars[0][0], pillars[0][1]),
            make_cell(pillars[1][0], pillars[1][1])]
    row2 = [make_cell(pillars[2][0], pillars[2][1]),
            make_cell(pillars[3][0], pillars[3][1])]

    t = Table([row1, row2], colWidths=[hw, hw])
    t.setStyle(TableStyle([
        ("INNERGRID",(0,0),(-1,-1), 5, WHITE),
        ("LEFTPADDING",(0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",(0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN",(0,0),(-1,-1), "TOP"),
    ]))
    return t

def mastery_row(lbl, title, body_txt):
    LW = 1.65*inch
    RW = CW - LW
    left = tcell([P(lbl, MAS_LBL), 4, P(title, MAS_T)],
                 w=LW, bg=LGRAY, lp=13, rp=10, tp=12, bp=12)
    right = tcell([P(body_txt, BODY)],
                  w=RW, bg=WHITE, lp=13, rp=12, tp=12, bp=12)
    t = Table([[left, right]], colWidths=[LW, RW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1), 1, BORDER),
        ("LINEAFTER",(0,0),(0,-1), 1, BORDER),
        ("LEFTPADDING",(0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",(0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN",(0,0),(-1,-1), "TOP"),
    ]))
    return KeepTogether([t, sp(5)])

def service_card(cat, title, desc, bullets):
    content = [P(cat.upper(), SVC_C), 4, P(title, SVC_T), 7, P(desc, SVC_B)]
    for b in bullets:
        content += [5, P(f"  + {b}", BUL)]
    inner = tcell(content, w=CW, bg=WHITE, lp=16, rp=14, tp=13, bp=14)
    t = Table([[inner]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1), 1, BORDER),
        ("LINEBEFORE",(0,0),(0,-1), 4, RED),
        ("LEFTPADDING",(0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",(0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))
    return KeepTogether([t, sp(9)])

def scenario_card(num, title, challenge, impact):
    NW = 0.5*inch
    BW = CW - NW
    num_cell = tcell([P(f"0{num}", SCN_N)],
                     w=NW, bg=RED, lp=0, rp=0, tp=13, bp=0, valign="TOP")
    body_items = [
        P(title, H3), 9,
        P("The Challenge", CH_LBL), 4,
        P(challenge, BODY), 10,
        P("The Spartan Impact", GRN_LBL), 4,
        P(impact, GRN),
    ]
    body_cell = tcell(body_items, w=BW, bg=WHITE, lp=13, rp=12, tp=12, bp=14)
    t = Table([[num_cell, body_cell]], colWidths=[NW, BW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1), 1, BORDER),
        ("LINEAFTER",(0,0),(0,-1), 1, BORDER),
        ("LEFTPADDING",(0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",(0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN",(0,0),(-1,-1), "TOP"),
    ]))
    return KeepTogether([t, sp(9)])

def objection_card(q, resp, proof):
    q_cell  = tcell([P(f'Objection:  "{q}"', OBJ_Q)],
                    w=CW, bg=RBKG, lp=14, rp=14, tp=11, bp=11)
    a_cell  = tcell([P(resp, BODY)],
                    w=CW, bg=WHITE, lp=14, rp=14, tp=11, bp=10)
    pr_cell = tcell([P(f"Why it works:  {proof}", SMALL)],
                    w=CW, bg=LGRAY, lp=14, rp=14, tp=9, bp=9)

    t = Table([[q_cell],[a_cell],[pr_cell]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1), 1, BORDER),
        ("LINEBELOW",(0,0),(0,0), 1, BORDER),
        ("LINEABOVE",(0,2),(0,2), 1, BORDER),
        ("LEFTPADDING",(0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",(0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN",(0,0),(-1,-1), "TOP"),
    ]))
    return KeepTogether([t, sp(9)])

def step_card(num, title, desc):
    NW = 0.62*inch
    BW = CW - NW
    num_cell = tcell([P(num, STEP_N)], w=NW, bg=LGRAY, lp=0, rp=0,
                     tp=14, bp=14, valign="MIDDLE")
    body_cell = tcell([P(title, STEP_T), 4, P(desc, STEP_D)],
                      w=BW, bg=WHITE, lp=14, rp=14, tp=12, bp=12)
    t = Table([[num_cell, body_cell]], colWidths=[NW, BW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1), 1, BORDER),
        ("LINEAFTER",(0,0),(0,-1), 1, BORDER),
        ("LEFTPADDING",(0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",(0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN",(0,0),(-1,-1), "MIDDLE"),
    ]))
    return KeepTogether([t, sp(6)])

def cta_banner(heading, sub):
    t = tcell([P(heading, WHT_H), 9, P(sub, WHT_B)],
              w=CW, bg=DARK, lp=24, rp=24, tp=22, bp=22)
    return t

# ══════════════════════════════════════════════════════════════════════════════
def build():
    doc = SimpleDocTemplate(
        OUT, pagesize=letter,
        leftMargin=M, rightMargin=M,
        topMargin=0.58*inch, bottomMargin=0.58*inch,
        title="Spartan Coaching - Value Proposition",
        author="Nick Lynch, Spartan Coaching",
    )
    s = []   # story

    # ══════════════════════════════════════════════════════════
    # COVER  (all text appears on the dark canvas background)
    # ══════════════════════════════════════════════════════════
    s += [sp(1.5*inch)]
    s += [P("THE AUTHORITY IN HOSPICE SALES EXCELLENCE", COV_EYE)]
    s += [sp(14)]
    # Centered red divider
    divt = Table([[hr(RED, 2.5)]], colWidths=[1.8*inch])
    divt.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),
                               ("LEFTPADDING",(0,0),(-1,-1),0),
                               ("RIGHTPADDING",(0,0),(-1,-1),0),
                               ("TOPPADDING",(0,0),(-1,-1),0),
                               ("BOTTOMPADDING",(0,0),(-1,-1),0)]))
    ctr = Table([[divt]], colWidths=[CW])
    ctr.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),
                              ("LEFTPADDING",(0,0),(-1,-1),0),
                              ("RIGHTPADDING",(0,0),(-1,-1),0),
                              ("TOPPADDING",(0,0),(-1,-1),0),
                              ("BOTTOMPADDING",(0,0),(-1,-1),0)]))
    s += [ctr, sp(20)]
    s += [P("Why Spartan Coaching Is the Investment<br/>Your Organization Cannot Afford to Skip",
             COV_H)]
    s += [sp(22)]
    s += [P("A plain-language case for structured hospice sales coaching.<br/>"
             "Real scenarios. Proven outcomes. Honest answers to every objection.", COV_S)]
    s += [sp(2.1*inch)]
    s += [hr(colors.HexColor("#374151"), 0.75), sp(14)]
    s += [P("Nick Lynch, Founder", COV_AU), sp(6)]
    s += [P("nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com", COV_CT)]
    s += [PageBreak()]

    # ══════════════════════════════════════════════════════════
    # PAGE 2 — THE PROBLEM + ABOUT
    # ══════════════════════════════════════════════════════════
    s += section_flat("The Challenge", "The Hospice Sales Gap Most Organizations Ignore")
    s += [P("Hospice care is mission-driven. But missions do not sustain themselves. "
             "Referrals do. The single greatest driver of census growth in any hospice "
             "organization is the skill, strategy, and discipline of the sales team. "
             "Yet most providers operate with under-coached reps, no structured "
             "methodology, and no system for making performance improvements stick.", BODY)]
    s += [sp(9)]
    s += [P("The result is predictable. Referral sources remain underserved. High-acuity "
             "patients are referred to competitors. Talented reps plateau and leave. "
             "Leadership cycles through hiring and hopes something changes. It rarely does, "
             "because the problem is not the people. It is the absence of a coaching "
             "infrastructure.", BODY)]
    s += [sp(9)]
    s += [P("Spartan Coaching was built to close that gap, with a methodology drawn "
             "entirely from the hospice sales environment, delivered by someone who has "
             "lived it.", BODY)]
    s += [sp(14)]

    s += [stat_bar([
        ("72%",   "of hospice organizations\nlack a formalized sales\ncoaching system"),
        ("3-5x",  "ROI from structured coaching\nversus uncoached teams"),
        ("28%",   "average census increase\nwith consistent monthly\ncoaching"),
        ("$44K+", "annual Medicare revenue\nper additional daily\ncensus point"),
    ]), sp(7)]
    s += [P("Sources: NHPCO industry data, Sales Management Association, "
             "Spartan Coaching internal analysis.", CAPTION)]
    s += [sp(18)]

    s += section("Who We Are", "About Spartan Coaching")
    s += [P("Spartan Coaching was founded by Nick Lynch, a hospice sales leader with "
             "hands-on field experience building referral relationships, growing census, "
             "and developing reps into consistent performers across multiple markets. "
             "This is not theory from a generalist consultant. It is hospice-specific "
             "methodology built from real territory management, physician engagement, "
             "and the nuanced communication that end-of-life care demands.", BODY)]
    s += [sp(9)]
    s += [P("Our guiding belief: Ethics without structure does not scale. Structure "
             "without heart does not last. Spartan Coaching holds both, a disciplined "
             "system built on genuine care for the patient, the family, and the sales "
             "professional doing the work.", BODY)]
    s += [PageBreak()]

    # ══════════════════════════════════════════════════════════
    # PAGE 3 — METHOD
    # ══════════════════════════════════════════════════════════
    s += section_flat("Methodology",
                      "The Spartan Method: Three Pillars, Four Mastery Subjects")
    s += [P("Most sales training teaches features and benefits. The Spartan Method "
             "teaches patient access, the disciplined, empathetic, and strategic practice "
             "of connecting referral sources with the hospice care their patients need. "
             "Every Spartan-coached rep internalizes and applies this framework daily.", BODY)]
    s += [sp(13)]

    s += [pillar_2x2([
        ("Discipline",
         "Proven frameworks applied consistently. Mamba mentality: deliberate practice, "
         "weekly accountability, and structured coaching applied to every real call."),
        ("Empathy",
         "Hospice is a grief-adjacent environment. Spartan reps hold difficult "
         "conversations with dignity, for physicians, families, and themselves."),
        ("Strategy",
         "Territory management, account prioritization, and KPI rigor separate reps "
         "who grow census from reps who simply stay busy."),
        ("Plain Language",
         "No jargon with referral sources. No black boxes in reporting. Shared "
         "definitions and visible, coachable work at every level."),
    ]), sp(16)]

    s += [P("THE FOUR MASTERY SUBJECTS", EYEBROW), sp(9)]
    s += [mastery_row("SUBJECT 01", "Discovery",
            "Learn what the referral source actually needs, clinically, operationally, "
            "and personally. Most reps show up and talk. Spartan reps show up and listen, "
            "then respond with relevance. Output: a completed contact profile.")]
    s += [mastery_row("SUBJECT 02", "Connecting",
            "Align with the referral source's workflow, communication style, and patient "
            "population. Build trust through genuine relevance, not repetitive visits "
            "without substance. Output: a documented working agreement.")]
    s += [mastery_row("SUBJECT 03", "Guiding",
            "Use your hospice capabilities as tools to solve the referral source's "
            "specific patient problems, not as a feature list to recite. Output: the "
            "contact can name one specific way your team solves their problem.")]
    s += [mastery_row("SUBJECT 04", "Commitment",
            "Define clear referral triggers and concrete next steps. Every conversation "
            "ends with a specific agreed-upon action, not a vague plan to stay in touch. "
            "Output: a referral pathway document or verbal commitment naming the trigger.")]
    s += [PageBreak()]

    # ══════════════════════════════════════════════════════════
    # PAGE 4 — SERVICES
    # ══════════════════════════════════════════════════════════
    s += section_flat("What We Offer",
                      "Services Built for Every Level of Your Organization")
    s += [P("Spartan Coaching is not a vendor. We are a coaching partner. Every "
             "engagement is structured around your specific gaps, your team's reality, "
             "and measurable outcomes, not packaged curriculum on a generic schedule.", BODY)]
    s += [sp(12)]

    s += [service_card(
        "For Individual Sales Reps",
        "One-on-One Coaching",
        "Targeted coaching for the individual rep, addressing specific challenges in real time "
        "whether that is physician objections, territory gaps, or referral conversion.",
        [
            "Virtual sessions: 30 minutes ($40) or 60 minutes ($70)",
            "Field coaching ride-alongs: full-day live observation and real-time feedback",
            "Territory management: A/B/C account classification and weekly routing plans",
            "Daily drill platform: scenario practice, objection handling, and knowledge quizzes",
        ]
    )]
    s += [service_card(
        "For Sales Leadership",
        "Team Training and Leadership Development",
        "Shift your team from managing results to coaching behaviors. Build a shared "
        "language, process, and playbook that produces repeatable performance.",
        [
            "Team workshops: 1 to 2 day customized curriculum with live roleplay",
            "Leadership coaching: monthly or quarterly sessions on behavior-based management",
            "Growth strategy consulting: 3 to 6 month market analysis and process redesign",
            "Accountability systems: weekly prep forms, action plans, and KPI dashboards",
        ]
    )]
    s += [service_card(
        "For Corporate and Multi-Market Providers",
        "Enterprise Consulting",
        "Standardize execution across every market. Gain visibility into what is working, "
        "where the gaps are, and where the greatest growth opportunities exist.",
        [
            "Market and territory analysis: 4 to 6 week deep dive into share and opportunities",
            "System implementation: unified playbook standardized across all markets",
            "Executive consulting: senior guidance for M&A integration and performance turnarounds",
            "HIPAA-compliant engagements with Business Associate Agreements available",
        ]
    )]
    s += [PageBreak()]

    # ══════════════════════════════════════════════════════════
    # PAGES 5-6 — SCENARIOS
    # ══════════════════════════════════════════════════════════
    s += section_flat("Real-World Scenarios", "What Coaching Looks Like in Practice")
    s += [P("The following scenarios represent situations Spartan Coaching addresses "
             "in every engagement. Details have been generalized for confidentiality. "
             "The outcomes reflect real coaching results.", BODY)]
    s += [sp(10)]

    s += [scenario_card(1,
        "The Stalled Territory: Busy Reps Who Are Not Growing Census",
        "A mid-size hospice provider had four reps making consistent calls and logging "
        "activity, but census had been flat for 14 months. Leadership was frustrated. "
        "Reps felt they were doing everything right. The disconnect was that activity "
        "was being mistaken for effectiveness. Reps were calling on the wrong accounts, "
        "leading with features instead of trust-building conversations, and failing to "
        "differentiate in a market where three competitors visited the same physicians.",
        "After a Spartan audit and 60 days of individual coaching, the team rebuilt their "
        "referral source tier lists, adopted a physician-first engagement strategy, and "
        "implemented a structured conversation framework. Within 90 days, census grew 11 "
        "points. Within six months it was up 22 points, representing over $1.8 million in "
        "annualized Medicare revenue from a team that was already working hard."
    )]
    s += [scenario_card(2,
        "New Hire Turnover: Onboarding Without Structure",
        "A Midwest hospice hired three new reps over 18 months. All three left within "
        "their first year. Exit interviews revealed the same theme: unprepared for the "
        "emotional complexity of hospice conversations, no framework for physician "
        "resistance, and minimal guidance beyond brief shadowing. Each hiring cycle cost "
        "between $35,000 and $50,000 with zero return.",
        "Spartan designed a 60-day onboarding program covering clinical fluency, objection "
        "handling, relationship-building cadence, and emotional intelligence. The next two "
        "hires completed the program. Both hit productivity benchmarks within 45 days. "
        "One is now a top performer in her region. First-year turnover for that cohort: zero."
    )]
    s += [scenario_card(3,
        "The Physician Who Will Not Refer: Breaking Clinical Resistance",
        "A regional hospice identified a high-volume internal medicine practice as a "
        "priority target. Their rep visited seven times over five months. The physician "
        "was polite but non-committal. The rep assumed he simply did not believe in hospice. "
        "In reality, every visit opened with marketing materials, no meaningful clinical "
        "questions were asked, and the rep had never differentiated the organization from "
        "two competitors the physician had poor prior experiences with.",
        "Using the Spartan physician engagement framework, the rep rebuilt the approach. "
        "She opened with a clinical question about a complex patient case, demonstrated "
        "knowledge of the practice's patient population, and shared a concrete outcome "
        "story. The physician referred his first patient two weeks later. Within four "
        "months, the practice became one of her top three referral sources."
    )]
    s += [scenario_card(4,
        "Late Referrals: Missing the Patients Who Need Hospice Most",
        "A Northeast hospice had strong referral relationships but consistently admitted "
        "patients later in their disease trajectory than the clinical team preferred. "
        "Average length of stay was falling and quality metrics were under pressure. "
        "Leadership blamed physicians. In reality, the sales team had never been trained "
        "to discuss earlier referral timing. They accepted late referrals passively rather "
        "than educating referral sources on eligibility and the benefits of earlier enrollment.",
        "Spartan worked with the team on physician-appropriate conversations about prognosis, "
        "Medicare eligibility, and quality-of-life outcomes for patients enrolled earlier. "
        "Within two quarters, average length of stay increased by 9 days, a significant "
        "improvement in both patient care quality and organizational financial performance."
    )]
    s += [scenario_card(5,
        "Burnout: When a Top Performer Stops Performing",
        "A six-year veteran rep had been the organization's top performer. Over 18 months "
        "her numbers steadily declined. She was still making calls, but energy was flat, "
        "follow-through had weakened, and she had stopped building new relationships. "
        "Leadership was considering a performance improvement plan. The real diagnosis was "
        "compassion fatigue compounded by zero structured support for the emotional weight "
        "of the work.",
        "Four months of Spartan individual coaching focused on professional identity, "
        "sustainable habits, and re-anchoring to purpose reversed the decline within 60 days. "
        "She became a mentor to a newer rep and is now the organization's top producer again. "
        "Leadership retained an irreplaceable six-year relationship asset and avoided a "
        "costly replacement cycle."
    )]
    s += [PageBreak()]

    # ══════════════════════════════════════════════════════════
    # PAGE 7 — OBJECTIONS
    # ══════════════════════════════════════════════════════════
    s += section_flat("Objection Handling", "Common Concerns, Answered Directly")
    s += [P("It is entirely reasonable to ask hard questions before investing in external "
             "coaching. Below are the objections we hear most often, with substantive "
             "and honest responses to each.", BODY)]
    s += [sp(10)]

    s += [objection_card(
        "We already have a training program.",
        "Internal training is valuable and almost never sufficient on its own. Most hospice "
        "organizations have clinical orientation and compliance onboarding. Very few have a "
        "structured, sales-specific coaching methodology that addresses physician engagement, "
        "objection handling, and accountability systems. A training program that is not "
        "producing measurable census growth is an onboarding checklist, not a coaching system. "
        "Spartan does not replace what you have. We build the layer that makes your existing "
        "investment actually move numbers.",
        "Organizations with external coaching in addition to internal training outperform "
        "those with internal training alone by an average of 23% in census growth within "
        "12 months. (Sales Management Association)"
    )]
    s += [objection_card(
        "Our reps already know the basics.",
        "The basics are table stakes. Every hospice rep can explain the six-month prognosis "
        "requirement. What separates top-quartile performers is what happens in the room: "
        "how they listen, how they handle physician skepticism, and how they build trust over "
        "a 12-month relationship. In Spartan's experience, reps who believe they know the "
        "basics are often those most in need of advanced conversation framework training, "
        "and most receptive to it when delivered by someone who understands their environment.",
        "Knowing the basics explains eligibility criteria. It does not explain why two reps "
        "with the same territory produce wildly different census results. Coaching explains that."
    )]
    s += [objection_card(
        "We cannot afford it right now.",
        "One additional daily census point generates approximately $44,000 to $58,000 per "
        "year in Medicare reimbursement. If coaching produces two to three additional census "
        "points over six months, the investment pays for itself many times over. Virtual "
        "coaching sessions start at $40 for 30 minutes. The question is not whether you can "
        "afford coaching. The question is how much census you are losing each month without it.",
        "A five-point census increase generates approximately $220,000 to $290,000 in "
        "annualized Medicare revenue. Spartan Coaching engagements are priced at a "
        "fraction of that figure."
    )]
    s += [objection_card(
        "We have tried sales training before and it did not stick.",
        "One-time training almost never sticks, and that is not a failure of your team. It "
        "is a failure of the delivery model. Skills from a single training event decay by "
        "more than 80% within one week without reinforcement. Spartan Coaching is not a "
        "training event. It is an ongoing coaching relationship with accountability, field "
        "application, and deliberate repetition built into every engagement. The Mamba "
        "Mentality at the core of our method exists to make change permanent through "
        "structured, repeated practice.",
        "Ongoing coaching produces three times the behavior change of one-time training "
        "programs. (Sales Management Association, 2022)"
    )]
    s += [objection_card(
        "Our reps will not be receptive to outside coaching.",
        "This usually reflects one of two realities: reps who feel unsupported and are "
        "defensive, or reps who have been through generic training that did not resonate. "
        "Spartan Coaching is hospice-specific. Reps immediately recognize that Nick Lynch "
        "understands the work, the emotional complexity, physician dynamics, compliance "
        "considerations, and the weight of selling in a grief-adjacent environment. "
        "Credibility creates receptivity. In nearly every Spartan engagement, initial "
        "skepticism converts to genuine engagement within the first two sessions.",
        "Reps who have seen generic sales training respond differently when coaching "
        "speaks the language of their actual job."
    )]
    s += [objection_card(
        "We would rather hire more reps than coach existing ones.",
        "Hiring is essential for growth. Coaching protects that investment. The all-in cost "
        "of hiring, onboarding, and ramping a hospice sales rep, including recruiting fees, "
        "salary during ramp-up, and opportunity cost of an empty territory, exceeds $60,000. "
        "If that rep leaves within a year because they lacked structured support, you absorb "
        "that cost again. Coaching existing reps and coaching new hires through a structured "
        "onboarding program reduces turnover and cuts time to productivity from 6 to 9 months "
        "down to 3 to 4 months.",
        "Structured onboarding coaching reduces first-year turnover by up to 40% and "
        "shortens average ramp time by half. (Aberdeen Group, 2021)"
    )]
    s += [PageBreak()]

    # ══════════════════════════════════════════════════════════
    # PAGE 8 — MISSION + CTA
    # ══════════════════════════════════════════════════════════
    s += section_flat("Why It Matters", "The Patient Equation")
    s += [P("Census and revenue are important. What they represent is more important: "
             "patients who receive, or do not receive, the care they deserve at the end "
             "of their lives.", BODY)]
    s += [sp(9)]
    s += [P("Research consistently shows that patients who enroll in hospice earlier "
             "experience better pain management, fewer hospitalizations, more time at home "
             "with family, and significantly greater quality of life in their final months. "
             "Family members report lower rates of complicated grief when their loved one "
             "received comprehensive hospice care. Every referral that does not happen, "
             "because a rep did not know how to have the right conversation, is a patient "
             "who did not get the care they needed.", BODY)]
    s += [sp(9)]
    s += [P("Spartan Coaching exists at the intersection of business performance and "
             "patient advocacy. Better-trained sales teams do not just grow census. They "
             "ensure the right patients reach the right care at the right time. That is "
             "the ultimate value proposition, and the reason this work matters.", BODY)]
    s += [sp(20), hr(BORDER, 0.75), sp(14)]

    s += [cta_banner(
        "Ready to Grow Your Census?",
        "Every engagement begins with a 30-minute discovery call.\n"
        "No obligation. No pitch. A direct conversation about what is possible."
    ), sp(14)]

    s += [step_card("1", "Discovery Call",
            "A focused 30-minute conversation about your organization, team, and census goals.")]
    s += [step_card("2", "Assessment and Proposal",
            "Spartan reviews your situation and proposes an engagement specific to your gaps.")]
    s += [step_card("3", "Coaching Begins",
            "Clear metrics are set from day one. Individual, team, or hybrid engagement launches.")]
    s += [step_card("4", "Accountability and Growth",
            "Regular check-ins, KPI review, and real-time adjustments ensure coaching converts to results.")]

    s += [sp(20), hr(BORDER, 0.75), sp(13)]
    s += [P("nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com",
             sty("FI", fn="Helvetica-Bold", fs=11, fc=DARK, al=TA_CENTER, lh=16))]
    s += [sp(6)]
    s += [P("Spartan Coaching  |  The Authority in Hospice Sales Excellence",
             sty("FT", fn="Helvetica-Oblique", fs=9.5, fc=MID, al=TA_CENTER, lh=14))]

    doc.build(s, onFirstPage=draw_cover, onLaterPages=draw_page)
    print("Done:", OUT)

build()
