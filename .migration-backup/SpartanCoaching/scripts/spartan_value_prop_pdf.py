"""
Spartan Coaching Value Proposition PDF
Key principles:
- No wordWrap overrides (causes mid-word breaks)
- Each card is ONE outer Table row, body built as KeepInFrame or tight Paragraph list
- All text short enough that KeepTogether fits within one page
- Explicit page breaks to control layout
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether, FrameBreak
)
from reportlab.platypus.flowables import KeepInFrame

OUT = "/home/runner/workspace/spartan-coaching-value-proposition.pdf"
PW, PH = letter
LM = RM = 0.75 * inch
TM = BM = 0.58 * inch
CW = PW - LM - RM  # 6.5 inches

# ── Colors ─────────────────────────────────────────────────────────────────────
RED   = colors.HexColor("#B91C1C")
DARK  = colors.HexColor("#111827")
GRAY  = colors.HexColor("#374151")
MID   = colors.HexColor("#6B7280")
LGRAY = colors.HexColor("#F3F4F6")
BORD  = colors.HexColor("#E5E7EB")
GREEN = colors.HexColor("#166534")
RBKG  = colors.HexColor("#FFF1F2")
DRED  = colors.HexColor("#991B1B")
WHITE = colors.white
LBLUE = colors.HexColor("#EFF6FF")

# ── Styles — NO wordWrap override, no CJK ──────────────────────────────────────
def st(name, fn="Helvetica", fs=10.5, fc=GRAY, lh=None, al=TA_LEFT):
    return ParagraphStyle(name, fontName=fn, fontSize=fs, textColor=fc,
                          leading=lh or round(fs * 1.52), alignment=al,
                          spaceAfter=0, spaceBefore=0)

EYE   = st("EYE", fn="Helvetica-Bold", fs=7.5, fc=RED)
H1    = st("H1",  fn="Helvetica-Bold", fs=19,  fc=DARK, lh=25)
H2    = st("H2",  fn="Helvetica-Bold", fs=13,  fc=DARK, lh=18)
H3    = st("H3",  fn="Helvetica-Bold", fs=11,  fc=DARK, lh=16)
BODY  = st("BODY",fs=10.5, fc=GRAY, al=TA_JUSTIFY, lh=17)
BODYL = st("BODL",fs=10.5, fc=GRAY, lh=17)
SML   = st("SML", fs=9,    fc=MID,  lh=13)
CAP   = st("CAP", fs=8.5,  fc=MID,  lh=13, al=TA_CENTER)
GRN   = st("GRN", fs=10.5, fc=GREEN,lh=17, al=TA_JUSTIFY)
GLBL  = st("GLBL",fn="Helvetica-Bold", fs=7.5, fc=GREEN, lh=10)
OBJ   = st("OBJ", fn="Helvetica-Bold", fs=11, fc=DRED, lh=17)
STATN = st("STN", fn="Helvetica-Bold", fs=22, fc=RED, lh=28, al=TA_CENTER)
STATL = st("STL", fs=8.5, fc=GRAY, lh=13, al=TA_CENTER)
MLAB  = st("MLB", fn="Helvetica-Bold", fs=7.5, fc=RED, lh=10)
MTIT  = st("MT",  fn="Helvetica-Bold", fs=11, fc=DARK, lh=16)
SCAT  = st("SCT", fn="Helvetica-Bold", fs=7.5, fc=MID, lh=10)
STIT  = st("STI", fn="Helvetica-Bold", fs=12, fc=DARK, lh=18)
SBOD  = st("SBD", fs=10.5, fc=GRAY, lh=16, al=TA_JUSTIFY)
SBUL  = st("SBU", fs=10.5, fc=GRAY, lh=16)
CHLBL = st("CHL", fn="Helvetica-Bold", fs=7.5, fc=MID,  lh=10)
SCNN  = st("SCN", fn="Helvetica-Bold", fs=16, fc=WHITE, lh=20, al=TA_CENTER)
PLT   = st("PLT", fn="Helvetica-Bold", fs=11, fc=DARK, lh=16)
PLB   = st("PLB", fs=9.5, fc=GRAY, lh=14, al=TA_JUSTIFY)
SPTN  = st("SPN", fn="Helvetica-Bold", fs=17, fc=RED, lh=21, al=TA_CENTER)
SPTIT = st("SPT", fn="Helvetica-Bold", fs=11, fc=DARK, lh=16)
SPDES = st("SPD", fs=10,  fc=GRAY, lh=15)
CTAH  = st("CTH", fn="Helvetica-Bold", fs=16, fc=WHITE, lh=22, al=TA_CENTER)
CTAB  = st("CTB", fs=10,  fc=colors.HexColor("#D1D5DB"), lh=16, al=TA_CENTER)
COVEY = st("CVE", fn="Helvetica-Bold", fs=9, fc=RED, lh=12, al=TA_CENTER)
COVH  = st("CVH", fn="Helvetica-Bold", fs=28, fc=WHITE, lh=36, al=TA_CENTER)
COVS  = st("CVS", fs=12, fc=colors.HexColor("#E5E7EB"), lh=19, al=TA_CENTER)
COVAU = st("CVA", fn="Helvetica-Bold", fs=11, fc=WHITE, lh=16, al=TA_CENTER)
COVCT = st("CVC", fs=9.5, fc=colors.HexColor("#9CA3AF"), lh=14, al=TA_CENTER)
FINB  = st("FNB", fn="Helvetica-Bold", fs=11, fc=DARK, lh=16, al=TA_CENTER)
FINT  = st("FNT", fn="Helvetica-Oblique", fs=9.5, fc=MID, lh=14, al=TA_CENTER)

# ── Helpers ────────────────────────────────────────────────────────────────────
def sp(n): return Spacer(1, n)
def P(t, s): return Paragraph(t, s)
def hr(c=BORD, t=0.75): return HRFlowable(width="100%", thickness=t, color=c,
                                            spaceAfter=0, spaceBefore=0)

# Zero-pad table style
ZERO = [("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),   ("BOTTOMPADDING",(0,0),(-1,-1),0)]

def single_cell(content_list, w, bg=WHITE, lp=12, rp=12, tp=12, bp=12):
    """
    Wraps a list of Paragraphs/Spacers into a single-row, single-col table cell.
    Returns Table. content_list items: Paragraph | int (spacer points).
    """
    story = []
    for item in content_list:
        if isinstance(item, (int, float)):
            story.append(sp(item))
        else:
            story.append(item)
    # Flatten into a single KeepInFrame so the cell never splits internally
    kif = KeepInFrame(w - lp - rp, 10000, story, mode='shrink')
    t = Table([[kif]], colWidths=[w])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), bg),
        ("LEFTPADDING",(0,0),(-1,-1), lp),
        ("RIGHTPADDING",(0,0),(-1,-1), rp),
        ("TOPPADDING",(0,0),(-1,-1), tp),
        ("BOTTOMPADDING",(0,0),(-1,-1), bp),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    return t

# ── Page drawing ───────────────────────────────────────────────────────────────
def draw_cover(c, doc):
    """All cover content drawn directly on the canvas — zero flowable wrapping."""
    c.saveState()
    cx = PW / 2  # horizontal center

    # ── Backgrounds ────────────────────────────────────────────────────────────
    c.setFillColor(DARK)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)
    # Red top band
    c.setFillColor(RED)
    c.rect(0, PH - 0.55*inch, PW, 0.55*inch, fill=1, stroke=0)
    # Red bottom band
    c.rect(0, 0, PW, 0.5*inch, fill=1, stroke=0)
    # Slightly lighter mid-panel
    c.setFillColor(colors.HexColor("#1F2937"))
    c.rect(0, PH * 0.27, PW, PH * 0.44, fill=1, stroke=0)

    # ── Eyebrow ────────────────────────────────────────────────────────────────
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(cx, PH * 0.745, "THE AUTHORITY IN HOSPICE SALES EXCELLENCE")

    # Thin red rule
    dw = 1.6 * inch
    c.setStrokeColor(RED)
    c.setLineWidth(2)
    c.line(cx - dw, PH * 0.725, cx + dw, PH * 0.725)

    # ── Headline — 3 lines drawn individually (22pt bold, ~422pt max line) ─────
    # All three lines verified to fit within CW=468pt at 22pt Helvetica-Bold
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 22)
    lh = 32   # line height
    y0 = PH * 0.682
    c.drawCentredString(cx, y0,          "Why Spartan Coaching Is the Investment")
    c.drawCentredString(cx, y0 - lh,     "Your Organization Cannot Afford to Skip")

    # ── Subtitle ───────────────────────────────────────────────────────────────
    c.setFillColor(colors.HexColor("#D1D5DB"))
    c.setFont("Helvetica", 11)
    y1 = y0 - lh - 26
    c.drawCentredString(cx, y1,
        "A plain-language case for structured hospice sales coaching.")
    c.drawCentredString(cx, y1 - 17,
        "Real scenarios. Proven outcomes. Honest answers to every objection.")

    # ── Separator ──────────────────────────────────────────────────────────────
    c.setStrokeColor(colors.HexColor("#374151"))
    c.setLineWidth(0.75)
    sep_y = PH * 0.255
    c.line(LM, sep_y, PW - RM, sep_y)

    # ── Author block ───────────────────────────────────────────────────────────
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(cx, sep_y - 20, "Nick Lynch, Founder")

    c.setFillColor(colors.HexColor("#9CA3AF"))
    c.setFont("Helvetica", 9.5)
    c.drawCentredString(cx, sep_y - 36,
        "nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com")

    c.restoreState()

def draw_page(c, doc):
    c.saveState()
    c.setFillColor(DARK)
    c.rect(0, PH - 0.44*inch, PW, 0.44*inch, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, PH - 0.465*inch, PW, 0.025*inch, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(LM, PH - 0.27*inch, "SPARTAN COACHING")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#9CA3AF"))
    c.drawRightString(PW - RM, PH - 0.27*inch, "VALUE PROPOSITION")
    c.setStrokeColor(BORD)
    c.setLineWidth(0.5)
    c.line(LM, 0.4*inch, PW - RM, 0.4*inch)
    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    c.drawString(LM, 0.24*inch,
                 "spartanhospicecoaching.com  |  nick@spartanhospicecoaching.com")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(GRAY)
    c.drawRightString(PW - RM, 0.24*inch, f"Page {doc.page - 1}")
    c.restoreState()

# ── Reusable layout blocks ─────────────────────────────────────────────────────
def sec(label, title):
    return [P(label.upper(), EYE), sp(4), P(title, H1), sp(7), hr(RED, 2), sp(11)]

def stat_bar(stats):
    """Flat 2-row table: all numbers on row 0, all labels on row 1.
    This guarantees every stat number sits at the exact same vertical position."""
    cw = CW / len(stats)
    nums = [P(big, STATN) for big, lbl in stats]
    # Replace \n with <br/> so Paragraph renders real line breaks
    lbls = [P(lbl.replace("\n", "<br/>"), STATL) for big, lbl in stats]
    t = Table([nums, lbls], colWidths=[cw] * len(stats))
    t.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,-1), LGRAY),
        ("BOX",         (0,0),(-1,-1), 1, BORD),
        ("INNERGRID",   (0,0),(-1,-1), 1, BORD),
        ("ALIGN",       (0,0),(-1,-1), "CENTER"),
        ("VALIGN",      (0,0),(-1,-1), "MIDDLE"),
        ("TOPPADDING",  (0,0),(-1,0),  13),
        ("BOTTOMPADDING",(0,0),(-1,0), 5),
        ("TOPPADDING",  (0,1),(-1,1),  5),
        ("BOTTOMPADDING",(0,1),(-1,1), 13),
        ("LEFTPADDING", (0,0),(-1,-1), 6),
        ("RIGHTPADDING",(0,0),(-1,-1), 6),
    ]))
    t.splitByRow = 0
    return t

def pillar_2x2(items):
    """2x2 grid — each cell is ~3.22 inches wide, no word-break risk."""
    hw = (CW - 4) / 2
    def cell(title, body):
        t = Table([
            [P(title, PLT)], [sp(5)], [P(body, PLB)]
        ], colWidths=[hw])
        t.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), LGRAY),
            ("BOX",(0,0),(-1,-1),1,BORD),
            ("LINEBEFORE",(0,0),(0,-1),3,RED),
            ("LEFTPADDING",(0,0),(-1,-1),13),("RIGHTPADDING",(0,0),(-1,-1),11),
            ("TOPPADDING",(0,0),(0,0),12),("BOTTOMPADDING",(0,-1),(-1,-1),12),
            ("TOPPADDING",(0,1),(-1,-1),0),("BOTTOMPADDING",(0,0),(0,-2),0),
            ("VALIGN",(0,0),(-1,-1),"TOP"),
        ]))
        return t
    row1 = [cell(items[0][0], items[0][1]), cell(items[1][0], items[1][1])]
    row2 = [cell(items[2][0], items[2][1]), cell(items[3][0], items[3][1])]
    t = Table([row1, row2], colWidths=[hw, hw])
    t.setStyle(TableStyle([
        ("INNERGRID",(0,0),(-1,-1),4,WHITE),
    ] + ZERO))
    return t

def mastery_row(lbl, title, body):
    LW = 1.6*inch
    RW = CW - LW
    lt = Table([[P(lbl, MLAB)], [sp(3)], [P(title, MTIT)]], colWidths=[LW])
    lt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),LGRAY),
        ("LEFTPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),10),
        ("TOPPADDING",(0,0),(0,0),12),("BOTTOMPADDING",(0,-1),(-1,-1),12),
        ("TOPPADDING",(0,1),(-1,-1),0),("BOTTOMPADDING",(0,0),(0,-2),0),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    rt = Table([[P(body, BODY)]], colWidths=[RW])
    rt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),WHITE),
        ("LEFTPADDING",(0,0),(-1,-1),13),("RIGHTPADDING",(0,0),(-1,-1),12),
        ("TOPPADDING",(0,0),(-1,-1),12),("BOTTOMPADDING",(0,0),(-1,-1),12),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    t = Table([[lt, rt]], colWidths=[LW, RW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,BORD),("LINEAFTER",(0,0),(0,-1),1,BORD),
    ] + ZERO))
    t.splitByRow = 0
    return KeepTogether([t, sp(5)])

def svc_card(cat, title, desc, bullets):
    content = [P(cat.upper(), SCAT), 4, P(title, STIT), 7, P(desc, SBOD)]
    for b in bullets:
        content += [5, P(f"   + {b}", SBUL)]
    inner = single_cell(content, CW, bg=WHITE, lp=16, rp=14, tp=12, bp=13)
    t = Table([[inner]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,BORD),("LINEBEFORE",(0,0),(0,-1),4,RED),
    ] + ZERO))
    t.splitByRow = 0
    return KeepTogether([t, sp(8)])

def scenario_card(num, title, challenge, impact):
    NW = 0.48 * inch
    BW = CW - NW
    num_t = Table([[P(f"0{num}", SCNN)]], colWidths=[NW])
    num_t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),RED),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),13),("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    body_content = [
        P(title, H3), 8,
        P("The Challenge", CHLBL), 3, P(challenge, BODY),
        9, P("The Spartan Impact", GLBL), 3, P(impact, GRN),
    ]
    body_t = single_cell(body_content, BW, bg=WHITE, lp=13, rp=12, tp=12, bp=13)
    t = Table([[num_t, body_t]], colWidths=[NW, BW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,BORD),("LINEAFTER",(0,0),(0,-1),1,BORD),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ] + ZERO))
    t.splitByRow = 0
    return KeepTogether([t, sp(8)])

def obj_card(q, resp, proof):
    qt = Table([[P(f'Objection:  "{q}"', OBJ)]], colWidths=[CW])
    qt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),RBKG),
        ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(-1,-1),11),("BOTTOMPADDING",(0,0),(-1,-1),11),
    ]))
    at = Table([[P(resp, BODY)]], colWidths=[CW])
    at.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),WHITE),
        ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),9),
    ]))
    pt = Table([[P(f"Why it works:  {proof}", SML)]], colWidths=[CW])
    pt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),LGRAY),
        ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),
    ]))
    wrapper = Table([[qt],[at],[pt]], colWidths=[CW])
    wrapper.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,BORD),
        ("LINEBELOW",(0,0),(0,0),1,BORD),("LINEABOVE",(0,2),(0,2),1,BORD),
    ] + ZERO))
    wrapper.splitByRow = 0
    return KeepTogether([wrapper, sp(8)])

def step_card(num, title, desc):
    NW = 0.6 * inch
    BW = CW - NW
    nt = Table([[P(num, SPTN)]], colWidths=[NW])
    nt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),LGRAY),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),14),("BOTTOMPADDING",(0,0),(-1,-1),14),
    ] + [("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0)]))
    bt = Table([[P(title, SPTIT)],[sp(3)],[P(desc, SPDES)]], colWidths=[BW])
    bt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),WHITE),
        ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(0,0),12),("BOTTOMPADDING",(0,-1),(-1,-1),12),
        ("TOPPADDING",(0,1),(-1,-1),3),("BOTTOMPADDING",(0,0),(0,-2),0),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    t = Table([[nt, bt]], colWidths=[NW, BW])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,BORD),("LINEAFTER",(0,0),(0,-1),1,BORD),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ] + ZERO))
    return KeepTogether([t, sp(6)])

def cta(heading, sub):
    t = Table([
        [P(heading, CTAH)],[sp(8)],[P(sub, CTAB)]
    ], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),DARK),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(-1,-1),24),("RIGHTPADDING",(0,0),(-1,-1),24),
        ("TOPPADDING",(0,0),(0,0),22),("BOTTOMPADDING",(0,-1),(-1,-1),22),
        ("TOPPADDING",(0,1),(-1,-1),0),("BOTTOMPADDING",(0,0),(0,-2),0),
    ]))
    return t

# ══════════════════════════════════════════════════════════════════════════════
def build():
    doc = SimpleDocTemplate(
        OUT, pagesize=letter,
        leftMargin=LM, rightMargin=RM,
        topMargin=TM, bottomMargin=BM,
        title="Spartan Coaching - Value Proposition",
        author="Nick Lynch, Spartan Coaching",
    )
    s = []

    # ── COVER — all drawn in draw_cover() canvas callback; story just pages past it
    s += [PageBreak()]

    # ── PAGE 2: THE CHALLENGE + ABOUT ─────────────────────────────────────────
    s += sec("The Challenge", "The Hospice Sales Gap Most Organizations Ignore")
    s += [P("Hospice care is mission-driven. But missions do not sustain themselves — referrals do. "
             "The single greatest driver of census growth in any hospice organization is the skill, "
             "strategy, and discipline of the sales team in the field. Yet most providers operate "
             "with under-coached reps, no structured methodology, and no system to make "
             "improvements stick.", BODY), sp(9)]
    s += [P("The result is predictable: referral sources go underserved, high-acuity patients "
             "go to competitors, talented reps plateau and leave, and leadership cycles through "
             "hiring hoping something changes. It rarely does — because the problem is not the "
             "people. It is the absence of a coaching infrastructure.", BODY), sp(9)]
    s += [P("Spartan Coaching was built to close that gap, with a methodology drawn entirely "
             "from the hospice sales environment, delivered by someone who has lived it.", BODY),
          sp(14)]

    s += [stat_bar([
        ("72%",   "of hospice organizations\nlack a formalized sales\ncoaching system"),
        ("3-5x",  "ROI from structured coaching\nversus uncoached teams"),
        ("28%",   "average referral increase\nwith consistent monthly\ncoaching"),
        ("$44K+", "annual Medicare revenue\nper additional referral\nsustained on census"),
    ]), sp(6)]
    s += [P("Sources: NHPCO industry data, Sales Management Association, Spartan Coaching internal analysis.",
             CAP), sp(18)]

    s += sec("Who We Are", "About Spartan Coaching")
    s += [P("Spartan Coaching was founded by Nick Lynch, a hospice sales leader with hands-on "
             "field experience building referral relationships, growing census, and developing "
             "reps into consistent performers. This is not theory from a generalist consultant. "
             "It is hospice-specific methodology built from real territory management, physician "
             "engagement, and the nuanced communication that end-of-life care demands.", BODY), sp(9)]
    s += [P("Our guiding belief: Ethics without structure does not scale. Structure without heart "
             "does not last. Spartan Coaching holds both — a disciplined system built on genuine "
             "care for the patient, the family, and the sales professional doing the work.", BODY)]
    s += [PageBreak()]

    # ── PAGE 3: METHOD ────────────────────────────────────────────────────────
    s += sec("Methodology", "The Spartan Method: Three Pillars, Four Mastery Subjects")
    s += [P("Most sales training teaches features and benefits. The Spartan Method teaches "
             "patient access — the disciplined, empathetic, and strategic practice of connecting "
             "referral sources with the hospice care their patients need. Every Spartan-coached "
             "rep internalizes and applies this framework daily in the field.", BODY), sp(13)]

    s += [pillar_2x2([
        ("Discipline",
         "Proven frameworks applied with consistency. Mamba mentality: deliberate practice, "
         "weekly accountability, and structured coaching applied to every real call."),
        ("Empathy",
         "Hospice is a grief-adjacent environment. Spartan reps hold difficult conversations "
         "with dignity — for physicians, families, and themselves."),
        ("Strategy",
         "Territory management, account prioritization, and KPI rigor separate reps who "
         "grow census from reps who simply stay busy."),
        ("Plain Language",
         "No jargon with referral sources. No black boxes in reporting. Shared definitions "
         "and visible, coachable work at every level of the organization."),
    ]), sp(16)]

    s += [P("THE FOUR MASTERY SUBJECTS", EYE), sp(9)]
    s += [mastery_row("SUBJECT 01", "Discovery",
            "Learn what the referral source actually needs — clinically, operationally, and "
            "personally. Most reps show up and talk. Spartan reps show up, listen, and respond "
            "with relevance. Output: a completed contact profile.")]
    s += [mastery_row("SUBJECT 02", "Connecting",
            "Align with the referral source's workflow, communication style, and patient "
            "population. Build trust through genuine relevance, not repetitive visits without "
            "substance. Output: a documented working agreement.")]
    s += [mastery_row("SUBJECT 03", "Guiding",
            "Use your hospice capabilities as tools to solve the referral source's specific "
            "patient problems — not as a feature list to recite. Output: the contact can name "
            "one specific way your team solves their problem.")]
    s += [mastery_row("SUBJECT 04", "Commitment",
            "Define clear referral triggers and concrete next steps. Every conversation ends "
            "with a specific agreed-upon action, not a vague plan to stay in touch. Output: a "
            "referral pathway document or verbal commitment naming the trigger.")]
    s += [PageBreak()]

    # ── PAGE 4: SERVICES ──────────────────────────────────────────────────────
    s += sec("What We Offer", "Services Built for Every Level of Your Organization")
    s += [P("Spartan Coaching is not a vendor. We are a coaching partner. Every engagement is "
             "structured around your specific gaps, your team's reality, and measurable outcomes "
             "— not packaged curriculum delivered on a generic schedule.", BODY), sp(12)]

    s += [svc_card("For Individual Sales Reps", "One-on-One Coaching",
            "Targeted, real-time coaching for the individual rep — addressing specific challenges "
            "from physician objections to territory production gaps.",
            ["Virtual sessions: 30 minutes ($40) or 60 minutes ($70)",
             "Field coaching ridealongs: full-day live observation and real-time feedback",
             "Territory management: A/B/C account classification and weekly routing plans",
             "Daily drill platform: scenario practice, objection handling, knowledge quizzes"])]
    s += [svc_card("For Sales Leadership", "Team Training and Leadership Development",
            "Shift your team from managing results to coaching behaviors. Build a shared "
            "language, process, and playbook that produces repeatable performance.",
            ["Team workshops: 1 to 2 day customized curriculum with live roleplay",
             "Leadership coaching: monthly or quarterly sessions on behavior-based management",
             "Growth strategy consulting: 3 to 6 month market analysis and process redesign",
             "Accountability systems: weekly prep forms, action plans, and KPI dashboards"])]
    s += [svc_card("For Corporate and Multi-Market Providers", "Enterprise Consulting",
            "Standardize execution across every market. Gain visibility into what is working, "
            "where the gaps are, and where the greatest growth opportunities exist.",
            ["Market and territory analysis: 4 to 6 week deep dive into share and opportunities",
             "System implementation: unified playbook standardized across all markets",
             "Executive consulting: senior guidance for M&amp;A integration and turnarounds",
             "HIPAA-compliant engagements with Business Associate Agreements available"])]
    s += [PageBreak()]

    # ── PAGES 5-6: SCENARIOS ──────────────────────────────────────────────────
    s += sec("Real-World Scenarios", "What Coaching Looks Like in Practice")
    s += [P("The following scenarios represent situations Spartan Coaching addresses in every "
             "engagement. Details have been generalized. The outcomes reflect real coaching results.",
             BODY), sp(10)]

    s += [scenario_card(1,
        "The Stalled Territory: Busy Reps Who Are Not Growing Census",
        "A mid-size hospice had four reps making consistent calls and logging activity, but "
        "census had been flat for 14 months. The disconnect: activity was being mistaken for "
        "effectiveness. Reps called on the wrong accounts, led with features instead of "
        "trust-building conversations, and failed to differentiate in a crowded market.",
        "After a Spartan audit and 60 days of coaching, the team rebuilt their referral tier "
        "lists and adopted a physician-first engagement strategy. Within 90 days monthly "
        "referrals increased by 11. Within six months referrals were up by 22 per month, "
        "representing over $1.8 million in annualized Medicare revenue from a team that was "
        "already working hard."
    )]
    s += [scenario_card(2,
        "New Hire Turnover: Onboarding Without Structure",
        "A Midwest hospice hired three new reps over 18 months. All three left within their "
        "first year. Exit interviews revealed the same theme: unprepared for the emotional "
        "complexity of hospice conversations, no framework for physician resistance, and "
        "minimal guidance beyond brief shadowing. Cost per cycle: $35,000 to $50,000.",
        "Spartan designed a 60-day onboarding program covering clinical fluency, objection "
        "handling, and emotional intelligence. The next two hires both hit productivity "
        "benchmarks within 45 days. One is now a top performer in her region. "
        "First-year turnover for that cohort: zero."
    )]
    s += [scenario_card(3,
        "The Physician Who Will Not Refer: Breaking Clinical Resistance",
        "A rep visited a high-volume internal medicine practice seven times over five months "
        "with no referrals. The rep assumed the physician did not believe in hospice. In "
        "reality, every visit opened with marketing materials, no clinical questions were "
        "asked, and the rep had never differentiated from two competitors the physician "
        "had poor prior experiences with.",
        "Using the Spartan physician engagement framework, the rep opened with a clinical "
        "question, demonstrated knowledge of the practice's patient population, and shared "
        "a concrete outcome story. The physician referred his first patient two weeks later. "
        "Within four months, the practice became one of her top three referral sources."
    )]
    s += [scenario_card(4,
        "Late Referrals: Missing the Patients Who Need Hospice Most",
        "A Northeast hospice had strong referral relationships but consistently admitted "
        "patients late in their disease trajectory. Average length of stay was falling and "
        "quality metrics were under pressure. The sales team had never been trained to "
        "discuss earlier referral timing — they accepted late referrals passively.",
        "Spartan worked with the team on physician-appropriate conversations about prognosis, "
        "Medicare eligibility, and quality-of-life outcomes for patients enrolled earlier. "
        "Within two quarters, average length of stay increased by 9 days — a significant "
        "improvement in both patient care and organizational financial performance."
    )]
    s += [scenario_card(5,
        "Burnout: When a Top Performer Stops Performing",
        "A six-year veteran rep had been the top performer. Over 18 months, her numbers "
        "steadily declined. She was still making calls, but energy was flat, follow-through "
        "weakened, and new relationship-building had stopped. Leadership was considering a "
        "performance improvement plan. The real diagnosis: compassion fatigue with zero "
        "structured support for the emotional weight of the work.",
        "Four months of Spartan coaching focused on professional identity and sustainable "
        "habits reversed the decline within 60 days. She became a mentor to a newer rep "
        "and is now the organization's top producer again. Leadership retained an "
        "irreplaceable six-year relationship asset and avoided a costly replacement cycle."
    )]
    s += [PageBreak()]

    # ── PAGE 7: OBJECTIONS ────────────────────────────────────────────────────
    s += sec("Objection Handling", "Common Concerns, Answered Directly")
    s += [P("It is entirely reasonable to ask hard questions before investing in external "
             "coaching. Below are the objections we hear most often, with substantive responses.",
             BODY), sp(10)]

    s += [obj_card(
        "We already have a training program.",
        "Internal training is valuable and almost never sufficient on its own. Most hospice "
        "organizations have clinical orientation and compliance onboarding — very few have a "
        "structured, sales-specific coaching methodology that addresses physician engagement "
        "and accountability. A program not producing measurable census growth is an onboarding "
        "checklist, not a coaching system. Spartan does not replace what you have. We build "
        "the layer that makes your existing investment move numbers.",
        "Organizations with external coaching outperform those with internal training alone "
        "by an average of 23% in census growth within 12 months. (Sales Management Association)"
    )]
    s += [obj_card(
        "Our reps already know the basics.",
        "The basics are table stakes. Every rep can explain the six-month prognosis requirement. "
        "What separates top-quartile performers is what happens in the room: how they listen, "
        "handle physician skepticism, and build trust over a 12-month relationship. Reps who "
        "believe they know the basics are often most in need of advanced conversation framework "
        "training — and most receptive when it is delivered by someone who understands their "
        "environment.",
        "Knowing the basics explains eligibility. It does not explain why two reps with the "
        "same territory produce wildly different census results. Coaching explains that."
    )]
    s += [obj_card(
        "We cannot afford it right now.",
        "Each additional referral sustained on census generates $44,000 to $58,000 per year "
        "in Medicare reimbursement. If coaching secures two to three additional referrals per "
        "month over six months, the investment pays for itself many times over. Virtual "
        "sessions start at $40 for 30 minutes. The question is not whether you can afford "
        "coaching — it is how many referrals you are losing each month without it.",
        "Five additional referrals per month generates $220,000 to $290,000 in annualized "
        "Medicare revenue. Spartan Coaching engagements are priced at a fraction of that figure."
    )]
    s += [obj_card(
        "We have tried sales training before and it did not stick.",
        "One-time training almost never sticks — and that is not a failure of your team. It "
        "is a failure of the delivery model. Skills from a single training event decay by more "
        "than 80% within one week without reinforcement. Spartan is not a training event. It "
        "is an ongoing coaching relationship with accountability, field application, and "
        "deliberate repetition built in. The Mamba Mentality at the core of our method exists "
        "to make change permanent through structured, repeated practice.",
        "Ongoing coaching produces three times the behavior change of one-time training "
        "programs. (Sales Management Association, 2022)"
    )]
    s += [obj_card(
        "Our reps will not be receptive to outside coaching.",
        "This usually reflects reps who feel unsupported, or reps who have experienced "
        "generic training that did not resonate. Spartan is hospice-specific. Reps immediately "
        "recognize that Nick Lynch understands the work — the emotional complexity, physician "
        "dynamics, compliance considerations, and the weight of selling in a grief-adjacent "
        "environment. Credibility creates receptivity. In nearly every engagement, initial "
        "skepticism converts to genuine engagement within the first two sessions.",
        "Reps who have seen generic sales training respond differently when coaching speaks "
        "the language of their actual job."
    )]
    s += [obj_card(
        "We would rather hire more reps than coach existing ones.",
        "Hiring is essential for growth. Coaching protects that investment. The all-in cost of "
        "hiring, onboarding, and ramping a hospice sales rep — including recruiting fees, "
        "salary during ramp-up, and opportunity cost of an empty territory — exceeds $60,000. "
        "If that rep leaves within a year because they lacked structured support, you absorb "
        "that cost again. Coaching reduces turnover and cuts time to productivity from 6 to 9 "
        "months down to 3 to 4 months.",
        "Structured onboarding coaching reduces first-year turnover by up to 40% and shortens "
        "average ramp time by half. (Aberdeen Group, 2021)"
    )]
    s += [PageBreak()]

    # ── PAGE 8: MISSION + CTA ─────────────────────────────────────────────────
    # Content budget: ~676pt available. All items below are sized to fit on one page.
    s += sec("Why It Matters", "The Patient Equation")
    s += [P("Census and revenue are important. What they represent is more important: patients "
             "who receive, or do not receive, the care they deserve at the end of their lives. "
             "Research consistently shows that patients who enroll in hospice earlier experience "
             "better pain management, fewer hospitalizations, more time at home with family, and "
             "significantly greater quality of life in their final months.", BODY), sp(9)]
    s += [P("Every referral that does not happen, because a rep did not know how to have the "
             "right conversation, is a patient who did not get the care they needed. Better-trained "
             "sales teams do not just grow census. They ensure the right patients reach the right "
             "care at the right time. That is the ultimate value proposition.", BODY)]
    s += [sp(12), hr(BORD, 0.75), sp(12)]

    s += [cta("Ready to Grow Your Census?",
               "Every engagement begins with a 30-minute discovery call.  "
               "No obligation. No pitch. A direct conversation about what is possible."),
          sp(11)]

    s += [step_card("1", "Discovery Call",
            "A 30-minute conversation about your organization, team, and census goals.")]
    s += [step_card("2", "Assessment and Proposal",
            "Spartan reviews your situation and proposes an engagement specific to your gaps.")]
    s += [step_card("3", "Coaching Begins",
            "Clear metrics set on day one. Individual, team, or hybrid engagement launches.")]
    s += [step_card("4", "Accountability and Growth",
            "Regular check-ins, KPI review, and real-time adjustments convert coaching to results.")]

    s += [sp(12), hr(BORD, 0.75), sp(11)]
    s += [P("nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com", FINB), sp(5)]
    s += [P("Spartan Coaching  |  The Authority in Hospice Sales Excellence", FINT)]

    doc.build(s, onFirstPage=draw_cover, onLaterPages=draw_page)
    print("Done:", OUT)

build()
