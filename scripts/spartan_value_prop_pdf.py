from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether, CondPageBreak
)

OUT = "/home/runner/workspace/spartan-coaching-value-proposition.pdf"
PW, PH = letter

# ── Palette ────────────────────────────────────────────────────────────────────
RED    = colors.HexColor("#B91C1C")
DARK   = colors.HexColor("#111827")
GRAY   = colors.HexColor("#374151")
MID    = colors.HexColor("#6B7280")
LGRAY  = colors.HexColor("#F9FAFB")
MGRAY  = colors.HexColor("#F3F4F6")
DLINE  = colors.HexColor("#E5E7EB")
GREEN  = colors.HexColor("#166534")
GBKG   = colors.HexColor("#F0FDF4")
RBKG   = colors.HexColor("#FEF2F2")
WHITE  = colors.white

# ── Type scale ─────────────────────────────────────────────────────────────────
def S(name, font="Helvetica", size=10.5, color=GRAY, leading=None,
      bold=False, italic=False, after=0, align=TA_LEFT, indent=0, tracking=0):
    if bold and italic:
        font = "Helvetica-BoldOblique"
    elif bold:
        font = "Helvetica-Bold"
    elif italic:
        font = "Helvetica-Oblique"
    if leading is None:
        leading = size * 1.5
    return ParagraphStyle(name, fontName=font, fontSize=size, textColor=color,
                          leading=leading, spaceAfter=after, alignment=align,
                          leftIndent=indent, wordWrap="CJK")

EYEBROW  = S("eyebrow", size=8,   bold=True,  color=RED,  after=4,  align=TA_LEFT, leading=10)
H1       = S("h1",      size=21,  bold=True,  color=DARK, after=0,  align=TA_LEFT, leading=27)
H2       = S("h2",      size=13,  bold=True,  color=DARK, after=0,  leading=19)
H3       = S("h3",      size=11,  bold=True,  color=DARK, after=0,  leading=17)
BODY     = S("body",    size=10.5,            color=GRAY, after=0,  align=TA_JUSTIFY, leading=17)
BODYL    = S("bodyl",   size=10.5,            color=GRAY, after=0,  leading=17)
SMALL    = S("small",   size=9,               color=MID,  after=0,  leading=13)
CAPTION  = S("caption", size=8.5,             color=MID,  after=0,  align=TA_CENTER, leading=13)
BOLD_DK  = S("bolddk",  size=10.5, bold=True, color=DARK, after=0,  leading=17)
COV_EYE  = S("covey",   size=9,   bold=True,  color=RED,  after=0,  align=TA_CENTER, leading=12)
COV_H1   = S("covh1",   size=30,  bold=True,  color=DARK, after=0,  align=TA_CENTER, leading=38)
COV_SUB  = S("covsub",  size=12,              color=GRAY, after=0,  align=TA_CENTER, leading=19)
COV_AUT  = S("covaut",  size=11,  bold=True,  color=DARK, after=0,  align=TA_CENTER, leading=16)
COV_CTT  = S("covctt",  size=9.5,             color=MID,  after=0,  align=TA_CENTER, leading=14)
GRN_BODY = S("grnbody", size=10.5,            color=GREEN,after=0,  align=TA_JUSTIFY, leading=17)
GRN_LBL  = S("grnlbl",  size=8,  bold=True,  color=GREEN,after=0,  leading=11)
DRED_Q   = S("dredq",   size=11,  bold=True,  color=RED,  after=0,  leading=17)
SCN_NUM  = S("scnnum",  size=18,  bold=True,  color=WHITE,after=0,  align=TA_CENTER, leading=22)
STAT_N   = S("statn",   size=24,  bold=True,  color=RED,  after=0,  align=TA_CENTER, leading=30)
STAT_L   = S("statl",   size=8.5,             color=GRAY, after=0,  align=TA_CENTER, leading=13)
WHT_H    = S("whth",    size=17,  bold=True,  color=WHITE,after=0,  align=TA_CENTER, leading=23)
WHT_B    = S("whtb",    size=10,              color=colors.HexColor("#D1D5DB"), after=0, align=TA_CENTER, leading=16)
STEP_N   = S("stepn",   size=18,  bold=True,  color=RED,  after=0,  align=TA_CENTER, leading=22)
STEP_T   = S("stept",   size=11,  bold=True,  color=DARK, after=0,  leading=16)
STEP_D   = S("stepd",   size=10,              color=GRAY, after=0,  leading=15)
MAS_LBL  = S("maslbl",  size=8,   bold=True,  color=RED,  after=0,  leading=11)
MAS_T    = S("mast",    size=11,  bold=True,  color=DARK, after=0,  leading=16)
MAS_B    = S("masb",    size=10.5,            color=GRAY, after=0,  align=TA_JUSTIFY, leading=16)
SVC_CAT  = S("svcat",   size=8,   bold=True,  color=MID,  after=0,  leading=11)
SVC_T    = S("svct",    size=12,  bold=True,  color=DARK, after=0,  leading=18)
SVC_B    = S("svcb",    size=10.5,            color=GRAY, after=0,  align=TA_JUSTIFY, leading=16)
SVC_BUL  = S("svcbul",  size=10.5,            color=GRAY, after=0,  leading=16, indent=8)
PILL_T   = S("pillt",   size=11,  bold=True,  color=DARK, after=0,  leading=16)
PILL_B   = S("pillb",   size=9.5,             color=GRAY, after=0,  align=TA_JUSTIFY, leading=14)

# ── Utility ────────────────────────────────────────────────────────────────────
def sp(n): return Spacer(1, n)
def P(text, style): return Paragraph(text, style)
def rule(c=DLINE, t=0.75): return HRFlowable(width="100%", thickness=t, color=c, spaceAfter=0, spaceBefore=0)

def cell(paras, w, bg=WHITE, lpad=12, rpad=12, tpad=12, bpad=12):
    """Single-column table cell with full control."""
    data = []
    for p in paras:
        if isinstance(p, int) or isinstance(p, float):
            data.append([Spacer(1, p)])
        else:
            data.append([p])
    t = Table(data, colWidths=[w])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), bg),
        ("LEFTPADDING",  (0,0),(-1,-1), lpad),
        ("RIGHTPADDING", (0,0),(-1,-1), rpad),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(0,0),   tpad),
        ("BOTTOMPADDING",(0,-1),(-1,-1), bpad),
        ("VALIGN", (0,0),(-1,-1), "TOP"),
    ]))
    return t

# ── Page canvas callbacks ───────────────────────────────────────────────────────
def draw_cover(c, doc):
    c.saveState()
    c.setFillColor(RED)
    c.rect(0, PH - 0.55*inch, PW, 0.55*inch, fill=1, stroke=0)
    c.rect(0, 0, PW, 0.38*inch, fill=1, stroke=0)
    c.restoreState()

def draw_page(c, doc):
    c.saveState()
    # Header bar
    c.setFillColor(DARK)
    c.rect(0, PH - 0.42*inch, PW, 0.42*inch, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, PH - 0.445*inch, PW, 0.025*inch, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(0.75*inch, PH - 0.265*inch, "SPARTAN COACHING")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#9CA3AF"))
    c.drawRightString(PW - 0.75*inch, PH - 0.265*inch, "VALUE PROPOSITION")
    # Footer line + text
    c.setStrokeColor(DLINE)
    c.setLineWidth(0.5)
    c.line(0.75*inch, 0.38*inch, PW - 0.75*inch, 0.38*inch)
    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    c.drawString(0.75*inch, 0.23*inch,
                 "spartanhospicecoaching.com  |  nick@spartanhospicecoaching.com")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(GRAY)
    c.drawRightString(PW - 0.75*inch, 0.23*inch, f"Page {doc.page - 1}")
    c.restoreState()

# ── Reusable blocks ─────────────────────────────────────────────────────────────
def section_block(label, title):
    return [
        sp(14),
        P(label.upper(), EYEBROW),
        sp(3),
        P(title, H1),
        sp(8),
        rule(RED, 2),
        sp(12),
    ]

def body(txt): return [P(txt, BODY), sp(10)]

def stat_table(stats):
    n = len(stats)
    cw = 6.5*inch / n
    cells = []
    for big, lbl in stats:
        inner = Table([
            [P(big, STAT_N)],
            [sp(2)],
            [P(lbl, STAT_L)],
        ], colWidths=[cw])
        inner.setStyle(TableStyle([
            ("ALIGN",  (0,0),(-1,-1), "CENTER"),
            ("VALIGN", (0,0),(-1,-1), "TOP"),
            ("BACKGROUND",(0,0),(-1,-1), MGRAY),
            ("LEFTPADDING",  (0,0),(-1,-1), 6),
            ("RIGHTPADDING", (0,0),(-1,-1), 6),
            ("TOPPADDING",   (0,0),(-1,-1), 0),
            ("BOTTOMPADDING",(0,0),(-1,-1), 0),
            ("TOPPADDING",   (0,0),(0,0),   14),
            ("BOTTOMPADDING",(0,-1),(-1,-1), 14),
        ]))
        cells.append(inner)
    t = Table([cells], colWidths=[cw]*n)
    t.setStyle(TableStyle([
        ("BOX",      (0,0),(-1,-1), 1, DLINE),
        ("INNERGRID",(0,0),(-1,-1), 1, DLINE),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))
    return t

def pillar_table(pillars):
    n = len(pillars)
    cw = (6.5*inch - (n-1)*5) / n
    cells = []
    for title, body_txt in pillars:
        c = Table([
            [P(title, PILL_T)],
            [sp(5)],
            [P(body_txt, PILL_B)],
        ], colWidths=[cw])
        c.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), MGRAY),
            ("BOX",(0,0),(-1,-1), 1, DLINE),
            ("LINEBEFORE",(0,0),(0,-1), 3, RED),
            ("LEFTPADDING",  (0,0),(-1,-1), 12),
            ("RIGHTPADDING", (0,0),(-1,-1), 10),
            ("TOPPADDING",   (0,0),(-1,-1), 0),
            ("BOTTOMPADDING",(0,0),(-1,-1), 0),
            ("TOPPADDING",   (0,0),(0,0),   12),
            ("BOTTOMPADDING",(0,-1),(-1,-1), 12),
            ("VALIGN", (0,0),(-1,-1), "TOP"),
        ]))
        cells.append(c)
    t = Table([cells], colWidths=[cw]*n,
              spaceBefore=0, spaceAfter=0,
              hAlign="LEFT")
    t.setStyle(TableStyle([
        ("INNERGRID",(0,0),(-1,-1), 5, WHITE),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN", (0,0),(-1,-1), "TOP"),
    ]))
    return t

def mastery_row(num_label, title, body_txt):
    left = cell([P(num_label, MAS_LBL), 4, P(title, MAS_T)],
                w=1.6*inch, bg=MGRAY, lpad=12, rpad=10, tpad=12, bpad=12)
    right = cell([P(body_txt, MAS_B)],
                 w=4.75*inch, bg=WHITE, lpad=13, rpad=12, tpad=12, bpad=12)
    t = Table([[left, right]], colWidths=[1.6*inch, 4.75*inch])
    t.setStyle(TableStyle([
        ("BOX",      (0,0),(-1,-1), 1, DLINE),
        ("LINEAFTER",(0,0),(0,-1),  1, DLINE),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN", (0,0),(-1,-1), "TOP"),
    ]))
    return KeepTogether([t, sp(5)])

def service_card(cat, title, desc, bullets):
    content = [P(cat.upper(), SVC_CAT), 4, P(title, SVC_T), 6, P(desc, SVC_B)]
    for b in bullets:
        content += [4, P(f"  + {b}", SVC_BUL)]
    t = cell(content, w=6.5*inch, bg=WHITE, lpad=16, rpad=14, tpad=12, bpad=14)
    wrap = Table([[t]], colWidths=[6.5*inch])
    wrap.setStyle(TableStyle([
        ("BOX",      (0,0),(-1,-1), 1, DLINE),
        ("LINEBEFORE",(0,0),(0,-1), 4, RED),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))
    return KeepTogether([wrap, sp(8)])

def scenario_card(num, title, challenge, impact):
    num_t = cell([P(f"0{num}", SCN_NUM)],
                 w=0.48*inch, bg=RED, lpad=0, rpad=0, tpad=12, bpad=0)
    body_content = [
        P(title, H3),
        8,
        P("The Challenge", S("chlbl", size=7.5, bold=True, color=MID, leading=10)),
        3,
        P(challenge, BODY),
        10,
        P("The Spartan Impact", GRN_LBL),
        3,
        P(impact, GRN_BODY),
    ]
    body_t = cell(body_content, w=5.87*inch, bg=WHITE, lpad=12, rpad=12, tpad=12, bpad=14)
    t = Table([[num_t, body_t]], colWidths=[0.48*inch, 5.87*inch])
    t.setStyle(TableStyle([
        ("BOX",      (0,0),(-1,-1), 1, DLINE),
        ("LINEAFTER",(0,0),(0,-1),  1, DLINE),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN", (0,0),(-1,-1), "TOP"),
    ]))
    return KeepTogether([t, sp(9)])

def objection_card(q, resp, why):
    q_row = cell([P(f"Objection: \"{q}\"", DRED_Q)],
                 w=6.5*inch, bg=RBKG, lpad=14, rpad=14, tpad=10, bpad=10)
    a_row = cell([P(resp, BODY)],
                 w=6.5*inch, bg=WHITE, lpad=14, rpad=14, tpad=10, bpad=10)
    w_row = cell([P(f"Why it works: {why}", SMALL)],
                 w=6.5*inch, bg=MGRAY, lpad=14, rpad=14, tpad=8, bpad=8)

    t = Table([[q_row],[a_row],[w_row]], colWidths=[6.5*inch])
    t.setStyle(TableStyle([
        ("BOX",      (0,0),(-1,-1), 1, DLINE),
        ("LINEBELOW",(0,0),(0,0),   1, DLINE),
        ("LINEABOVE",(0,2),(0,2),   1, DLINE),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN", (0,0),(-1,-1), "TOP"),
    ]))
    return KeepTogether([t, sp(9)])

def step_card(num, title, desc):
    num_t = cell([P(num, STEP_N)],
                 w=0.65*inch, bg=MGRAY, lpad=0, rpad=0, tpad=14, bpad=14)
    body_t = cell([P(title, STEP_T), 4, P(desc, STEP_D)],
                  w=5.7*inch, bg=WHITE, lpad=14, rpad=14, tpad=12, bpad=12)
    t = Table([[num_t, body_t]], colWidths=[0.65*inch, 5.7*inch])
    t.setStyle(TableStyle([
        ("BOX",      (0,0),(-1,-1), 1, DLINE),
        ("LINEAFTER",(0,0),(0,-1),  1, DLINE),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN", (0,0),(-1,-1), "MIDDLE"),
    ]))
    return KeepTogether([t, sp(6)])

def dark_cta_block(heading, subtext):
    t = cell([P(heading, WHT_H), 8, P(subtext, WHT_B)],
             w=6.5*inch, bg=DARK, lpad=24, rpad=24, tpad=22, bpad=22)
    return t

# ══════════════════════════════════════════════════════════════════════════════
def build():
    doc = SimpleDocTemplate(
        OUT, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.58*inch, bottomMargin=0.56*inch,
        title="Spartan Coaching - Value Proposition",
        author="Nick Lynch, Spartan Coaching",
    )
    S2 = []

    # ══ COVER ════════════════════════════════════════════════════════════════
    S2 += [sp(1.65*inch)]
    S2 += [P("THE AUTHORITY IN HOSPICE SALES EXCELLENCE", COV_EYE)]
    S2 += [sp(16)]

    # Centered red rule via table
    rtbl = Table([[rule(RED, 2.5)]], colWidths=[2*inch])
    rtbl.setStyle(TableStyle([
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    ctr = Table([[rtbl]], colWidths=[6.5*inch])
    ctr.setStyle(TableStyle([
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    S2 += [ctr, sp(20)]
    S2 += [P("Why Spartan Coaching Is the Investment<br/>Your Organization Cannot Afford to Skip", COV_H1)]
    S2 += [sp(22)]
    S2 += [P("A plain-language case for structured hospice sales coaching.<br/>Real scenarios. Proven outcomes. Honest answers to every objection.", COV_SUB)]
    S2 += [sp(2.0*inch)]
    S2 += [rule(DLINE, 0.75), sp(14)]
    S2 += [P("Nick Lynch, Founder", COV_AUT), sp(5)]
    S2 += [P("nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com", COV_CTT)]
    S2 += [PageBreak()]

    # ══ PAGE 2 — PROBLEM + ABOUT ════════════════════════════════════════════
    S2 += section_block("The Challenge", "The Hospice Sales Gap Most Organizations Ignore")
    S2 += body("Hospice care is mission-driven. But missions do not sustain themselves. "
               "Referrals do. The single greatest driver of census growth in any hospice "
               "organization is the skill, strategy, and discipline of the sales team. "
               "Yet most providers operate with under-coached reps, no structured "
               "methodology, and no system for making improvements stick.")
    S2 += body("The result is predictable. Referral sources remain underserved. "
               "High-acuity patients are referred to competitors. Talented reps plateau "
               "and leave. Leadership cycles through hiring and hopes something changes. "
               "It rarely does, because the problem is not the people. It is the absence "
               "of a coaching infrastructure.")
    S2 += body("Spartan Coaching was built to close that gap, with a methodology drawn "
               "entirely from the hospice sales environment, delivered by someone who has lived it.")

    S2 += [stat_table([
        ("72%",   "of hospice organizations\nlack a formalized sales\ncoaching system"),
        ("3-5x",  "ROI from structured coaching\ncompared to uncoached\nteams"),
        ("28%",   "average census increase\nwith consistent monthly\ncoaching"),
        ("$44K+", "annual Medicare revenue\nper additional daily\ncensus point"),
    ]), sp(6)]
    S2 += [P("Sources: NHPCO industry data, Sales Management Association, Spartan Coaching internal analysis.", CAPTION), sp(18)]

    S2 += section_block("Who We Are", "About Spartan Coaching")
    S2 += body("Spartan Coaching was founded by Nick Lynch, a hospice sales leader with "
               "hands-on field experience building referral relationships, growing census, "
               "and developing reps into consistent performers across multiple markets. "
               "This is not theory from a generalist consultant. It is hospice-specific "
               "methodology built from real territory management, physician engagement, "
               "and the communication that end-of-life care demands.")
    S2 += body("Our guiding belief: Ethics without structure does not scale. Structure "
               "without heart does not last. Spartan Coaching holds both, a disciplined "
               "system built on genuine care for the patient, the family, and the "
               "sales professional doing the work.")
    S2 += [PageBreak()]

    # ══ PAGE 3 — METHOD ══════════════════════════════════════════════════════
    S2 += section_block("Methodology", "The Spartan Method: Three Pillars, Four Mastery Subjects")
    S2 += body("Most sales training teaches features and benefits. The Spartan Method "
               "teaches patient access, the disciplined, empathetic, and strategic practice "
               "of connecting referral sources with the hospice care their patients need. "
               "Every Spartan-coached rep internalizes and applies this framework daily.")
    S2 += [pillar_table([
        ("Discipline",
         "Proven frameworks applied consistently. Mamba mentality: deliberate practice, "
         "weekly accountability, and coaching applied to every real call."),
        ("Empathy",
         "Hospice is a grief-adjacent environment. Spartan reps hold difficult conversations "
         "with dignity, for physicians, families, and themselves."),
        ("Strategy",
         "Territory management, account prioritization, and KPI rigor separate reps who "
         "grow census from reps who simply stay busy."),
        ("Plain Language",
         "No jargon with referral sources. No black boxes in reporting. Shared definitions "
         "and visible, coachable work at every level."),
    ]), sp(16)]

    S2 += [P("THE FOUR MASTERY SUBJECTS", EYEBROW), sp(8)]
    S2 += [mastery_row("SUBJECT 01", "Discovery",
        "Learn what the referral source actually needs, clinically, operationally, and personally. "
        "Most reps show up and talk. Spartan reps show up and listen, then respond with relevance. "
        "Output: a completed contact profile.")]
    S2 += [mastery_row("SUBJECT 02", "Connecting",
        "Align with the referral source's workflow, communication style, and patient population. "
        "Build trust through genuine relevance, not repetitive visits without substance. "
        "Output: a documented working agreement.")]
    S2 += [mastery_row("SUBJECT 03", "Guiding",
        "Use your hospice capabilities as tools to solve the referral source's specific patient "
        "problems, not as a feature list to recite. "
        "Output: the contact can name one specific way your team solves their problem.")]
    S2 += [mastery_row("SUBJECT 04", "Commitment",
        "Define clear referral triggers and concrete next steps. Every conversation ends with "
        "a specific agreed-upon action, not a vague plan to stay in touch. "
        "Output: a referral pathway document or verbal commitment naming the trigger.")]
    S2 += [PageBreak()]

    # ══ PAGE 4 — SERVICES ════════════════════════════════════════════════════
    S2 += section_block("What We Offer", "Services Built for Every Level of Your Organization")
    S2 += body("Spartan Coaching is not a vendor. We are a coaching partner. Every "
               "engagement is structured around your specific gaps, your team's reality, "
               "and measurable outcomes, not packaged curriculum on a generic schedule.")
    S2 += [service_card(
        "For Individual Sales Reps",
        "One-on-One Coaching",
        "Targeted coaching for the individual rep, addressing specific challenges in real time.",
        [
            "Virtual sessions: 30 minutes ($40) or 60 minutes ($70)",
            "Field coaching ride-alongs: full-day live observation and real-time feedback",
            "Territory management: A/B/C account classification and weekly routing plans",
            "Daily drill platform: scenario practice, objection handling, and knowledge quizzes",
        ]
    )]
    S2 += [service_card(
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
    S2 += [service_card(
        "For Corporate and Multi-Market Providers",
        "Enterprise Consulting",
        "Standardize execution across every market. Gain visibility into what is working, "
        "where the gaps are, and where the greatest growth opportunities exist.",
        [
            "Market and territory analysis: 4 to 6 week deep dive into share and opportunities",
            "System implementation: unified playbook standardized across all markets",
            "Executive consulting: senior guidance for M&A integration or performance turnarounds",
            "HIPAA-compliant engagements with Business Associate Agreements available",
        ]
    )]
    S2 += [PageBreak()]

    # ══ PAGES 5-6 — SCENARIOS ════════════════════════════════════════════════
    S2 += section_block("Real-World Scenarios", "What Coaching Looks Like in Practice")
    S2 += body("The following scenarios represent situations Spartan Coaching addresses in "
               "every engagement. Details have been generalized for confidentiality. "
               "The outcomes reflect real coaching results.")
    S2 += [sp(4)]
    S2 += [scenario_card(1,
        "The Stalled Territory: Busy Reps Who Are Not Growing Census",
        "A mid-size hospice provider had four reps making consistent calls and logging activity, "
        "but census had been flat for 14 months. Leadership was frustrated. Reps felt they were "
        "doing everything right. The disconnect was that activity was being mistaken for effectiveness. "
        "Reps were calling on the wrong accounts, leading with features instead of trust-building "
        "conversations, and failing to differentiate in a market where three competitors visited the same physicians.",
        "After a Spartan audit and 60 days of individual coaching, the team rebuilt their referral source "
        "tier lists, adopted a physician-first engagement strategy, and implemented a structured "
        "conversation framework. Within 90 days, census grew 11 points. Within six months, it was up "
        "22 points, representing over $1.8 million in annualized Medicare revenue from a team that "
        "was already working hard."
    )]
    S2 += [scenario_card(2,
        "New Hire Turnover: Onboarding Without Structure",
        "A Midwest hospice hired three new reps over 18 months. All three left within their first year. "
        "Exit interviews revealed the same theme: unprepared for the emotional complexity of hospice "
        "conversations, no framework for physician resistance, and minimal guidance beyond brief shadowing. "
        "Each hiring cycle cost between $35,000 and $50,000 with zero return.",
        "Spartan designed a 60-day onboarding program covering clinical fluency, objection handling, "
        "relationship-building cadence, and emotional intelligence. The next two hires completed the "
        "program. Both hit productivity benchmarks within 45 days. One is now a top performer in her "
        "region. First-year turnover for that cohort: zero."
    )]
    S2 += [scenario_card(3,
        "The Physician Who Will Not Refer: Breaking Clinical Resistance",
        "A regional hospice had identified a high-volume internal medicine practice as a priority target. "
        "Their rep visited seven times over five months. The physician was polite but non-committal. "
        "The rep assumed he simply did not believe in hospice. In reality, every visit opened with "
        "marketing materials, no meaningful clinical questions were asked, and the rep had never "
        "differentiated the organization from two competitors the physician had poor prior experiences with.",
        "Using the Spartan physician engagement framework, the rep rebuilt the approach. She opened with "
        "a clinical question about a complex patient case, demonstrated specific knowledge of the "
        "practice's patient population, and shared a concrete outcome story. The physician referred "
        "his first patient two weeks later. Within four months, the practice became one of her top "
        "three referral sources."
    )]
    S2 += [scenario_card(4,
        "Late Referrals: Missing the Patients Who Need Hospice Most",
        "A Northeast hospice had strong referral relationships but consistently admitted patients later "
        "in their disease trajectory than the clinical team preferred. Average length of stay was "
        "falling and quality metrics were under pressure. Leadership blamed physicians. In reality, "
        "the sales team had never been trained to discuss earlier referral timing. They accepted late "
        "referrals passively rather than educating referral sources on eligibility and the benefits "
        "of earlier enrollment.",
        "Spartan worked with the team on physician-appropriate conversations about prognosis, Medicare "
        "eligibility, and quality-of-life outcomes for patients enrolled earlier. Within two quarters, "
        "average length of stay increased by 9 days, a significant improvement in both patient care "
        "quality and organizational financial performance."
    )]
    S2 += [scenario_card(5,
        "Burnout: When a Top Performer Stops Performing",
        "A six-year veteran rep had been the organization's top performer. Over 18 months her numbers "
        "steadily declined. She was still making calls, but energy was flat, follow-through had "
        "weakened, and she had stopped building new relationships. Leadership was considering a "
        "performance improvement plan. The real diagnosis was compassion fatigue compounded by zero "
        "structured support for the emotional weight of the work.",
        "Four months of Spartan individual coaching focused on professional identity, sustainable "
        "habits, and re-anchoring to purpose reversed the decline within 60 days. She became a "
        "mentor to a newer rep and is now the organization's top producer again. Leadership "
        "retained an irreplaceable six-year relationship asset and avoided a costly replacement cycle."
    )]
    S2 += [PageBreak()]

    # ══ PAGE 7 — OBJECTIONS ══════════════════════════════════════════════════
    S2 += section_block("Objection Handling", "Common Concerns, Answered Directly")
    S2 += body("It is entirely reasonable to ask hard questions before investing in external "
               "coaching. Below are the objections we hear most often, with substantive and "
               "honest responses to each.")
    S2 += [sp(4)]
    S2 += [objection_card(
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
    S2 += [objection_card(
        "Our reps already know the basics.",
        "The basics are table stakes. Every hospice rep can explain the six-month prognosis "
        "requirement. What separates top-quartile performers is what happens in the room: "
        "how they listen, how they handle physician skepticism, and how they build trust over "
        "a 12-month relationship. In Spartan's experience, reps who believe they know the "
        "basics are often those most in need of advanced conversation framework training, "
        "and most receptive to it when it is delivered by someone who understands their environment.",
        "Knowing the basics explains eligibility criteria. It does not explain why two reps "
        "with the same territory produce wildly different census results. Coaching explains that."
    )]
    S2 += [objection_card(
        "We cannot afford it right now.",
        "One additional daily census point generates approximately $44,000 to $58,000 per year "
        "in Medicare reimbursement. If coaching produces two to three additional census points "
        "over six months, the investment pays for itself many times over. Virtual coaching "
        "sessions start at $40 for 30 minutes. The question is not whether you can afford "
        "coaching. The question is how much census you are losing each month without it.",
        "A five-point census increase generates approximately $220,000 to $290,000 in "
        "annualized Medicare revenue. Spartan Coaching engagements are priced at a fraction "
        "of that figure."
    )]
    S2 += [objection_card(
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
    S2 += [objection_card(
        "Our reps will not be receptive to outside coaching.",
        "This objection usually reflects one of two realities: reps who feel unsupported "
        "and are defensive, or reps who have been through generic training that did not "
        "resonate. Spartan Coaching is hospice-specific. Reps immediately recognize that "
        "Nick Lynch understands the work, the emotional complexity, physician dynamics, "
        "compliance considerations, and the weight of selling in a grief-adjacent environment. "
        "Credibility creates receptivity. In nearly every Spartan engagement, initial "
        "skepticism converts to genuine engagement within the first two sessions.",
        "Reps who have seen generic sales training respond differently when coaching "
        "speaks the language of their actual job."
    )]
    S2 += [objection_card(
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
    S2 += [PageBreak()]

    # ══ PAGE 8 — MISSION + CTA ═══════════════════════════════════════════════
    S2 += section_block("Why It Matters", "The Patient Equation")
    S2 += body("Census and revenue are important. What they represent is more important: "
               "patients who receive, or do not receive, the care they deserve at the end "
               "of their lives.")
    S2 += body("Research consistently shows that patients who enroll in hospice earlier "
               "experience better pain management, fewer hospitalizations, more time at home "
               "with family, and significantly greater quality of life in their final months. "
               "Family members report lower rates of complicated grief when their loved one "
               "received comprehensive hospice care. Every referral that does not happen, "
               "because a rep did not know how to have the right conversation, is a patient "
               "who did not get the care they needed.")
    S2 += body("Spartan Coaching exists at the intersection of business performance and "
               "patient advocacy. Better-trained sales teams do not just grow census. They "
               "ensure the right patients reach the right care at the right time. That is "
               "the ultimate value proposition, and the reason this work matters.")
    S2 += [sp(18), rule(DLINE, 0.75), sp(14)]

    S2 += [dark_cta_block(
        "Ready to Grow Your Census?",
        "Every engagement begins with a 30-minute discovery call. No obligation. No pitch.\n"
        "A direct conversation about what is possible for your organization."
    ), sp(14)]

    S2 += [step_card("1", "Discovery Call",
        "A focused 30-minute conversation about your organization, team makeup, and census goals.")]
    S2 += [step_card("2", "Assessment and Proposal",
        "Spartan reviews your situation and proposes an engagement specific to your gaps and objectives.")]
    S2 += [step_card("3", "Coaching Begins",
        "Clear metrics are established on day one. Individual, team, or hybrid engagement launches.")]
    S2 += [step_card("4", "Accountability and Growth",
        "Regular check-ins, KPI review, and real-time adjustments ensure coaching converts to results.")]

    S2 += [sp(18), rule(DLINE, 0.75), sp(12)]
    S2 += [P("nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com",
             S("fin1", size=11, bold=True, color=DARK, align=TA_CENTER, leading=16))]
    S2 += [sp(5)]
    S2 += [P("Spartan Coaching  |  The Authority in Hospice Sales Excellence",
             S("fin2", size=9.5, italic=True, color=MID, align=TA_CENTER, leading=14))]

    doc.build(S2, onFirstPage=draw_cover, onLaterPages=draw_page)
    print("Done.")

build()
