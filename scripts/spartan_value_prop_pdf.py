from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether
)

OUTPUT = "/home/runner/workspace/spartan-coaching-value-proposition.pdf"
W, H = letter

RED      = colors.HexColor("#b91c1c")
DARK     = colors.HexColor("#111111")
GRAY     = colors.HexColor("#374151")
MID      = colors.HexColor("#6b7280")
LITE     = colors.HexColor("#f3f4f6")
RULE_C   = colors.HexColor("#e5e7eb")
GREEN    = colors.HexColor("#15803d")
GREEN_BG = colors.HexColor("#f0fdf4")
RED_BG   = colors.HexColor("#fef2f2")
AMBER    = colors.HexColor("#92400e")
WHITE    = colors.white

def mk(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, textColor=GRAY,
                leading=16, spaceAfter=6, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(name, **base)

ST = {
    "cov_eye":  mk("cov_eye",  fontName="Helvetica-Bold", fontSize=9, textColor=RED, alignment=TA_CENTER, spaceAfter=0),
    "cov_h1":   mk("cov_h1",   fontName="Helvetica-Bold", fontSize=30, textColor=DARK, leading=38, alignment=TA_CENTER, spaceAfter=10),
    "cov_sub":  mk("cov_sub",  fontSize=12, textColor=GRAY, leading=18, alignment=TA_CENTER),
    "cov_nick": mk("cov_nick", fontName="Helvetica-Bold", fontSize=11, textColor=DARK, alignment=TA_CENTER, spaceAfter=2),
    "cov_cont": mk("cov_cont", fontSize=9.5, textColor=MID, alignment=TA_CENTER),
    "eye":      mk("eye",      fontName="Helvetica-Bold", fontSize=8.5, textColor=RED, spaceAfter=3),
    "h1":       mk("h1",       fontName="Helvetica-Bold", fontSize=20, textColor=DARK, leading=26, spaceBefore=4, spaceAfter=8),
    "body":     mk("body",     alignment=TA_JUSTIFY, spaceAfter=8),
    "caption":  mk("caption",  fontSize=9, textColor=MID, leading=13, alignment=TA_CENTER),
    "bullet":   mk("bullet",   leftIndent=16, spaceAfter=5),
    "wh2":      mk("wh2",      fontName="Helvetica-Bold", fontSize=18, textColor=WHITE, leading=24, alignment=TA_CENTER),
    "wsub":     mk("wsub",     fontSize=10.5, textColor=colors.HexColor("#9ca3af"), leading=16, alignment=TA_CENTER),
    "fin_bold": mk("fin_bold", fontName="Helvetica-Bold", fontSize=11, textColor=DARK, leading=16, alignment=TA_CENTER),
    "fin_tag":  mk("fin_tag",  fontName="Helvetica-Oblique", fontSize=9.5, textColor=MID, alignment=TA_CENTER),
}

def sp(n=8):   return Spacer(1, n)
def rule():    return HRFlowable(width="100%", thickness=0.75, color=RULE_C, spaceAfter=10, spaceBefore=4)
def redrule(): return HRFlowable(width="100%", thickness=2,    color=RED,    spaceAfter=10, spaceBefore=2)
def P(txt, s): return Paragraph(txt, ST[s])
def BUL(txt):  return Paragraph(f"<font color='#b91c1c'>&#9632;</font>  {txt}", ST["bullet"])

def section(story, label, title):
    story.append(sp(10))
    story.append(P(label.upper(), "eye"))
    story.append(P(title, "h1"))
    story.append(redrule())

def stat_row(stats):
    cells = []
    for num, lbl in stats:
        inner = Table([
            [Paragraph(num, ParagraphStyle("sn2", fontName="Helvetica-Bold", fontSize=26, textColor=RED, leading=32, alignment=TA_CENTER))],
            [Paragraph(lbl, ParagraphStyle("sl2", fontSize=9, textColor=GRAY, leading=13, alignment=TA_CENTER))],
        ], colWidths=[1.55*inch])
        inner.setStyle(TableStyle([
            ("ALIGN",(0,0),(-1,-1),"CENTER"), ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
            ("TOPPADDING",(0,0),(-1,-1),10), ("BOTTOMPADDING",(0,0),(-1,-1),10),
            ("LEFTPADDING",(0,0),(-1,-1),4), ("RIGHTPADDING",(0,0),(-1,-1),4),
        ]))
        cells.append(inner)
    t = Table([cells], colWidths=[1.625*inch]*len(stats))
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,RULE_C), ("INNERGRID",(0,0),(-1,-1),1,RULE_C),
        ("BACKGROUND",(0,0),(-1,-1),LITE), ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
    ]))
    return t

def pillar_row(pillars):
    cells = []
    for eyebrow, title, body_text in pillars:
        c = Table([
            [Paragraph(eyebrow, ParagraphStyle("pe", fontName="Helvetica-Bold", fontSize=8, textColor=RED, leading=12, spaceAfter=2))],
            [Paragraph(f"<b>{title}</b>", ParagraphStyle("pt", fontName="Helvetica-Bold", fontSize=11, textColor=DARK, leading=16, spaceAfter=4))],
            [Paragraph(body_text, ParagraphStyle("pb", fontSize=9.5, textColor=GRAY, leading=14, alignment=TA_JUSTIFY))],
        ], colWidths=[1.55*inch])
        c.setStyle(TableStyle([
            ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("LEFTPADDING",(0,0),(-1,-1),10), ("RIGHTPADDING",(0,0),(-1,-1),10),
            ("TOPPADDING",(0,0),(0,0),12), ("BOTTOMPADDING",(0,-1),(-1,-1),12),
            ("TOPPADDING",(0,1),(-1,-1),4), ("BOTTOMPADDING",(0,0),(0,-2),4),
            ("BOX",(0,0),(-1,-1),1,RULE_C), ("BACKGROUND",(0,0),(-1,-1),LITE),
        ]))
        cells.append(c)
    t = Table([cells], colWidths=[1.625*inch]*4)
    t.setStyle(TableStyle([
        ("INNERGRID",(0,0),(-1,-1),6,WHITE), ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    return t

def mastery_row(label, title, body_text):
    left = Table([
        [Paragraph(label, ParagraphStyle("ml2", fontName="Helvetica-Bold", fontSize=8, textColor=RED, leading=12, spaceAfter=2))],
        [Paragraph(f"<b>{title}</b>", ParagraphStyle("mt2", fontName="Helvetica-Bold", fontSize=11, textColor=DARK, leading=16))],
    ], colWidths=[1.7*inch])
    left.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(0,0),(-1,-1),12), ("RIGHTPADDING",(0,0),(-1,-1),6),
        ("TOPPADDING",(0,0),(-1,-1),10), ("BOTTOMPADDING",(0,0),(-1,-1),10),
        ("TOPPADDING",(0,1),(-1,-1),4),
        ("BACKGROUND",(0,0),(-1,-1),LITE),
    ]))
    right = Table([
        [Paragraph(body_text, ParagraphStyle("mb2", fontSize=10.5, textColor=GRAY, leading=16, alignment=TA_JUSTIFY))],
    ], colWidths=[4.65*inch])
    right.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(-1,-1),12), ("RIGHTPADDING",(0,0),(-1,-1),12),
        ("TOPPADDING",(0,0),(-1,-1),10), ("BOTTOMPADDING",(0,0),(-1,-1),10),
    ]))
    t = Table([[left, right]], colWidths=[1.7*inch, 4.65*inch])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,RULE_C), ("LINEAFTER",(0,0),(0,-1),1,RULE_C),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    return KeepTogether([t, sp(5)])

def service_card(title, accent_color, bullets):
    title_p = Paragraph(f"<b>{title}</b>", ParagraphStyle(
        "svt2", fontName="Helvetica-Bold", fontSize=12, textColor=WHITE, leading=18))
    title_t = Table([[title_p]], colWidths=[6.35*inch])
    title_t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),accent_color),
        ("LEFTPADDING",(0,0),(-1,-1),14), ("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(-1,-1),10), ("BOTTOMPADDING",(0,0),(-1,-1),10),
    ]))
    brows = [[Paragraph(f"<font color='#b91c1c'>&#9632;</font>  {b}", ParagraphStyle(
        "svb2", fontSize=10.5, textColor=GRAY, leading=16))] for b in bullets]
    body_t = Table(brows, colWidths=[6.35*inch])
    body_t.setStyle(TableStyle([
        ("LEFTPADDING",(0,0),(-1,-1),14), ("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6),
        ("BACKGROUND",(0,0),(-1,-1),WHITE),
    ]))
    outer = Table([[title_t],[body_t]], colWidths=[6.35*inch])
    outer.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,RULE_C),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    return KeepTogether([outer, sp(8)])

def scenario_card(number, title, challenge, impact):
    num_p = Paragraph(f"<b>0{number}</b>", ParagraphStyle(
        "scn2", fontName="Helvetica-Bold", fontSize=18, textColor=WHITE, leading=22, alignment=TA_CENTER))
    num_t = Table([[num_p]], colWidths=[0.5*inch])
    num_t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),RED), ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
    ]))

    rows = [
        [Paragraph(f"<b>{title}</b>", ParagraphStyle("sct2", fontName="Helvetica-Bold", fontSize=12, textColor=DARK, leading=17, spaceAfter=0))],
        [Paragraph("THE CHALLENGE", ParagraphStyle("scl2", fontName="Helvetica-Bold", fontSize=8, textColor=MID, leading=12))],
        [Paragraph(challenge, ParagraphStyle("scc2", fontSize=10.5, textColor=GRAY, leading=16, alignment=TA_JUSTIFY))],
        [Paragraph("THE SPARTAN IMPACT", ParagraphStyle("scil2", fontName="Helvetica-Bold", fontSize=8, textColor=GREEN, leading=12))],
        [Paragraph(impact, ParagraphStyle("scip2", fontSize=10.5, textColor=GREEN, leading=16, alignment=TA_JUSTIFY))],
    ]
    body_t = Table(rows, colWidths=[5.85*inch])
    body_t.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(0,0),(-1,-1),12), ("RIGHTPADDING",(0,0),(-1,-1),12),
        ("TOPPADDING",(0,0),(0,0),10), ("BOTTOMPADDING",(0,-1),(-1,-1),10),
        ("TOPPADDING",(0,1),(-1,-1),4), ("BOTTOMPADDING",(0,0),(0,-2),4),
        ("BACKGROUND",(0,3),(0,4),GREEN_BG),
    ]))
    outer = Table([[num_t, body_t]], colWidths=[0.5*inch, 5.85*inch])
    outer.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,RULE_C), ("LINEAFTER",(0,0),(0,-1),1,RULE_C),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    return KeepTogether([outer, sp(10)])

def objection_card(q_text, a_text, proof_text):
    q_p  = Paragraph(f"<b>\"</b>{q_text}<b>\"</b>", ParagraphStyle(
        "oq2", fontName="Helvetica-Bold", fontSize=11, textColor=DARK, leading=16))
    a_p  = Paragraph(a_text, ParagraphStyle(
        "oa2", fontSize=10.5, textColor=GRAY, leading=16, alignment=TA_JUSTIFY))
    pr_p = Paragraph(f"<i>{proof_text}</i>", ParagraphStyle(
        "op2", fontName="Helvetica-Oblique", fontSize=9.5, textColor=MID, leading=14))

    q_t  = Table([[q_p]],  colWidths=[6.35*inch])
    q_t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),RED_BG),
        ("LEFTPADDING",(0,0),(-1,-1),14), ("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(-1,-1),10), ("BOTTOMPADDING",(0,0),(-1,-1),10),
    ]))
    a_t  = Table([[a_p]],  colWidths=[6.35*inch])
    a_t.setStyle(TableStyle([
        ("LEFTPADDING",(0,0),(-1,-1),14), ("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(-1,-1),10), ("BOTTOMPADDING",(0,0),(-1,-1),6),
    ]))
    pr_t = Table([[pr_p]], colWidths=[6.35*inch])
    pr_t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),LITE),
        ("LEFTPADDING",(0,0),(-1,-1),14), ("RIGHTPADDING",(0,0),(-1,-1),14),
        ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LINEABOVE",(0,0),(-1,-1),1,RULE_C),
    ]))
    wrap = Table([[q_t],[a_t],[pr_t]], colWidths=[6.35*inch])
    wrap.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,RULE_C),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    return KeepTogether([wrap, sp(10)])

def dark_banner(heading, subtext):
    rows = [
        [Paragraph(f"<b>{heading}</b>", ParagraphStyle("dbh2", fontName="Helvetica-Bold", fontSize=18, textColor=WHITE, leading=24, alignment=TA_CENTER))],
        [Paragraph(subtext, ParagraphStyle("dbs2", fontSize=10.5, textColor=colors.HexColor("#9ca3af"), leading=16, alignment=TA_CENTER))],
    ]
    t = Table(rows, colWidths=[6.5*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),DARK), ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(-1,-1),20), ("RIGHTPADDING",(0,0),(-1,-1),20),
        ("TOPPADDING",(0,0),(-1,-1),18), ("BOTTOMPADDING",(0,0),(-1,-1),18),
    ]))
    return t

def step_row(label, title, desc):
    left = Table([
        [Paragraph(label, ParagraphStyle("stl2", fontName="Helvetica-Bold", fontSize=8, textColor=RED, leading=12, spaceAfter=2))],
        [Paragraph(f"<b>{title}</b>", ParagraphStyle("stt2", fontName="Helvetica-Bold", fontSize=11, textColor=DARK, leading=16))],
    ], colWidths=[1.5*inch])
    left.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"TOP"), ("BACKGROUND",(0,0),(-1,-1),LITE),
        ("LEFTPADDING",(0,0),(-1,-1),12), ("RIGHTPADDING",(0,0),(-1,-1),8),
        ("TOPPADDING",(0,0),(-1,-1),10), ("BOTTOMPADDING",(0,0),(-1,-1),10),
        ("TOPPADDING",(0,1),(-1,-1),4),
    ]))
    right = Table([
        [Paragraph(desc, ParagraphStyle("std2", fontSize=10, textColor=GRAY, leading=15))],
    ], colWidths=[4.85*inch])
    right.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(-1,-1),12), ("RIGHTPADDING",(0,0),(-1,-1),12),
        ("TOPPADDING",(0,0),(-1,-1),10), ("BOTTOMPADDING",(0,0),(-1,-1),10),
    ]))
    t = Table([[left, right]], colWidths=[1.5*inch, 4.85*inch])
    t.setStyle(TableStyle([
        ("BOX",(0,0),(-1,-1),1,RULE_C), ("LINEAFTER",(0,0),(0,-1),1,RULE_C),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"), ("BACKGROUND",(0,0),(-1,-1),WHITE),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    return KeepTogether([t, sp(5)])

def on_cover(c, doc):
    c.saveState()
    c.setFillColor(RED)
    c.rect(0, H - 0.5*inch, W, 0.5*inch, fill=1, stroke=0)
    c.rect(0, 0, W, 0.35*inch, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#fef2f2"))
    c.rect(0, 0.35*inch, 0.16*inch, H - 0.85*inch, fill=1, stroke=0)
    c.restoreState()

def on_interior(c, doc):
    c.saveState()
    c.setFillColor(DARK)
    c.rect(0, H - 0.42*inch, W, 0.42*inch, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, H - 0.45*inch, W, 0.03*inch, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.75*inch, H - 0.27*inch, "SPARTAN COACHING")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#9ca3af"))
    c.drawRightString(W - 0.75*inch, H - 0.27*inch, "VALUE PROPOSITION")
    c.setStrokeColor(RULE_C)
    c.setLineWidth(0.75)
    c.line(0.75*inch, 0.42*inch, W - 0.75*inch, 0.42*inch)
    c.setFillColor(MID)
    c.setFont("Helvetica", 7.5)
    c.drawString(0.75*inch, 0.25*inch, "spartanhospicecoaching.com  |  nick@spartanhospicecoaching.com")
    c.setFillColor(GRAY)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawRightString(W - 0.75*inch, 0.25*inch, f"Page {doc.page - 1}")
    c.restoreState()

def build():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.62*inch, bottomMargin=0.6*inch,
        title="Spartan Coaching - Value Proposition",
        author="Nick Lynch, Spartan Coaching",
    )
    story = []

    # ── COVER ─────────────────────────────────────────────────
    story.append(sp(1.8*inch))
    story.append(P("THE AUTHORITY IN HOSPICE SALES EXCELLENCE", "cov_eye"))
    story.append(sp(12))
    story.append(HRFlowable(width=1.8*inch, thickness=2.5, color=RED, spaceAfter=18))
    story.append(P("Why Spartan Coaching<br/>Is the Investment Your<br/>Organization Can't Afford to Skip", "cov_h1"))
    story.append(sp(18))
    story.append(P(
        "A plain-language case for structured hospice sales coaching —<br/>"
        "real scenarios, proven outcomes, and honest answers<br/>"
        "to every objection you may have.", "cov_sub"))
    story.append(sp(2.0*inch))
    story.append(HRFlowable(width="100%", thickness=0.75, color=RULE_C, spaceAfter=14))
    story.append(P("Nick Lynch &mdash; Founder, Spartan Coaching", "cov_nick"))
    story.append(P("nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com", "cov_cont"))
    story.append(PageBreak())

    # ── THE PROBLEM ───────────────────────────────────────────
    section(story, "The Challenge", "The Hospice Sales Gap Most Organizations Ignore")
    story.append(P(
        "Hospice care is mission-driven. But missions don't sustain themselves — referrals do. "
        "The single greatest driver of census growth in any hospice organization is the skill, "
        "strategy, and discipline of the sales team in the field. Yet most hospice providers "
        "operate with under-coached reps, no structured methodology, and no system for making "
        "improvements stick.", "body"))
    story.append(P(
        "The result is predictable: referral sources remain underserved. High-acuity patients "
        "are referred to competitors. Talented reps plateau and eventually leave. Leadership "
        "cycles through hiring and hopes something changes. It rarely does — because the problem "
        "is not the people. It is the absence of a coaching infrastructure.", "body"))
    story.append(P(
        "Spartan Coaching was built to close that gap — with a methodology drawn entirely "
        "from the hospice sales environment, delivered by someone who has lived it.", "body"))
    story.append(sp(12))
    story.append(stat_row([
        ("72%", "of hospice orgs lack a\nformalized sales\ncoaching system"),
        ("3-5x", "ROI typical from structured\ncoaching vs.\nuncoached teams"),
        ("28%", "average census increase\nwith consistent\nmonthly coaching"),
        ("$44K+", "annual Medicare revenue\nper additional\ndaily census point"),
    ]))
    story.append(sp(6))
    story.append(P("Sources: NHPCO industry data, Sales Management Association, Spartan Coaching internal analysis.", "caption"))
    story.append(sp(14))

    section(story, "Who We Are", "About Spartan Coaching")
    story.append(P(
        "Spartan Coaching was founded by <b>Nick Lynch</b>, a hospice sales leader with "
        "hands-on field experience building referral relationships, growing census, and "
        "developing reps into consistent performers across multiple markets. This is not "
        "theory from a generalist consultant. It is hospice-specific methodology built from "
        "real territory management, physician engagement, and the nuanced communication that "
        "end-of-life care demands.", "body"))
    story.append(P(
        "<b>Our philosophy:</b> Ethics without structure does not scale. Structure without "
        "heart does not last. Spartan Coaching holds both — a disciplined system built on "
        "genuine care for the patient, the family, and the sales professional doing the work.", "body"))
    story.append(PageBreak())

    # ── THE METHOD ────────────────────────────────────────────
    section(story, "Methodology", "The Spartan Method: Three Pillars, Four Mastery Subjects")
    story.append(P(
        "Most sales training teaches features and benefits. The Spartan Method teaches "
        "<b>patient access</b> — the disciplined, empathetic, and strategic practice of "
        "connecting referral sources with the hospice care their patients need. "
        "Every rep coached by Spartan internalizes and applies this framework in the field.", "body"))
    story.append(sp(10))
    story.append(pillar_row([
        ("PILLAR 01", "Discipline",
         "Mamba mentality: relentless deliberate practice, weekly accountability, and coaching applied to every rep's real calls and situations."),
        ("PILLAR 02", "Empathy",
         "Hospice is a grief-adjacent environment. Spartan reps hold difficult conversations with dignity — for physicians, families, and themselves."),
        ("PILLAR 03", "Strategy",
         "Territory management, account prioritization, pipeline discipline, and KPI rigor separate reps who grow census from reps who stay busy."),
        ("PILLAR 04", "Plain Language",
         "No jargon with referral sources. No black boxes in reporting. Shared definitions, visible work, and coachable behaviors at every level."),
    ]))
    story.append(sp(16))
    story.append(Paragraph("THE FOUR MASTERY SUBJECTS", ParagraphStyle(
        "eye2", fontName="Helvetica-Bold", fontSize=8.5, textColor=RED, spaceAfter=8)))
    story.append(mastery_row("01 — Discovery", "Discover",
        "Learn what the referral source actually needs — clinically, operationally, and personally. "
        "Most reps show up and talk. Spartan reps show up and listen, then respond with relevance."))
    story.append(mastery_row("02 — Connecting", "Connect",
        "Align with the referral source's workflow, communication style, and patient population. "
        "Build trust through genuine relevance — not repetitive visits without substance."))
    story.append(mastery_row("03 — Guiding", "Guide",
        "Use your organization's hospice capabilities as tools to solve the referral source's "
        "specific patient problems — not as a list of features to recite at every visit."))
    story.append(mastery_row("04 — Commitment", "Commit",
        "Define clear referral triggers and concrete next steps. Every conversation ends with "
        "a specific, agreed-upon action — not a vague 'keep in touch.'"))
    story.append(PageBreak())

    # ── SERVICES ──────────────────────────────────────────────
    section(story, "What We Offer", "Services Built for Every Level of Your Organization")
    story.append(P(
        "Spartan Coaching is not a vendor. We are a coaching partner. Every engagement is "
        "structured around your specific gaps, your team's reality, and measurable outcomes "
        "— not packaged curriculum delivered on a generic schedule.", "body"))
    story.append(sp(8))
    story.append(service_card("For Individual Sales Reps", RED, [
        "Virtual coaching sessions (30 or 60 minutes) targeting specific rep challenges",
        "Field coaching ride-alongs: live observation and real-time in-field feedback",
        "Territory management coaching: A/B/C account classification and routing optimization",
        "Daily drill access: AI-powered objection handling, scenario practice, and knowledge quizzes",
    ]))
    story.append(service_card("For Sales Leadership", DARK, [
        "Team training workshops (1-2 days) with customized curriculum and live roleplay",
        "Leadership coaching: shifting from managing by results to coaching behaviors",
        "Growth strategy consulting: 3-6 month market analysis and sales process redesign",
        "Accountability systems: weekly prep forms, one-page action plans, and KPI dashboards",
    ]))
    story.append(service_card("For Corporate & Multi-Market Providers", GRAY, [
        "Market and territory analysis: 4-6 week deep dive into share and opportunity gaps",
        "System implementation: process standardization across multiple markets",
        "Executive consulting: M&A integration, performance turnarounds, team rebuilds",
        "HIPAA-compliant engagements with Business Associate Agreements (BAAs) available",
    ]))
    story.append(service_card("Specialized Programs", AMBER, [
        "Admissions Speed Boost: fixing delays in the referral-to-admission pipeline",
        "Hospital Referral Pathway: building consistent patterns with discharge planners",
        "Assisted Living and Memory Care Growth: aligning with facility workflows",
        "After-Hours Readiness: ensuring conversions during nights and weekends",
    ]))
    story.append(PageBreak())

    # ── SCENARIOS ─────────────────────────────────────────────
    section(story, "Real-World Scenarios", "What Coaching Looks Like in Practice")
    story.append(P(
        "The following scenarios reflect the types of situations Spartan Coaching addresses "
        "in every engagement. Details are generalized for confidentiality. The outcomes "
        "represent real coaching results.", "body"))
    story.append(sp(8))

    story.append(scenario_card(1,
        "The Stalled Territory — Busy Reps Who Aren't Growing Census",
        "A mid-size hospice provider had four reps making consistent calls, logging activity, "
        "and attending events — but census had been flat for 14 months. Leadership was "
        "frustrated. Reps felt like they were doing everything right. The disconnect: activity "
        "was being mistaken for effectiveness. Reps were calling on the wrong accounts, "
        "leading with features instead of trust-building conversations, and failing to "
        "differentiate in a market where three competitors called on the same physicians.",
        "After a Spartan Coaching audit and 60 days of individual coaching, the team rebuilt "
        "their referral source tier lists, adopted a physician-first engagement strategy, and "
        "implemented a structured conversation framework. Within 90 days, census grew 11 points. "
        "Within six months: up 22 points — representing over $1.8M in annualized Medicare "
        "revenue from a team that was already 'working hard.'"
    ))
    story.append(scenario_card(2,
        "New Hire Turnover — Onboarding Without Structure",
        "A Midwest hospice hired three new reps over 18 months. All three left within their "
        "first year. Exit interviews shared a consistent theme: unprepared for the emotional "
        "complexity of hospice conversations, no framework for physician resistance, and minimal "
        "structured guidance beyond brief shadowing. Each hiring cycle cost $35,000-$50,000 "
        "with zero return.",
        "Spartan designed a 60-day onboarding program covering clinical fluency, objection "
        "handling, relationship-building cadence, and emotional intelligence for sensitive "
        "conversations. The next two hires completed the program. Both hit productivity "
        "benchmarks within 45 days. One is now a top performer in her region. "
        "First-year turnover for that cohort: zero."
    ))
    story.append(scenario_card(3,
        "The Physician Who Won't Refer — Breaking Clinical Resistance",
        "A regional hospice identified a high-volume internal medicine practice as a priority "
        "target. Their rep visited seven times over five months. The physician was polite but "
        "non-committal. The rep assumed he 'just didn't believe in hospice.' In reality, every "
        "visit opened with marketing materials, no meaningful clinical questions were asked, and "
        "the rep had never differentiated the organization from two competitors the physician "
        "had bad prior experiences with.",
        "Using the Spartan physician engagement framework, the rep rebuilt the approach: opened "
        "with a clinical question about a complex patient case, demonstrated specific knowledge "
        "of the practice's patient population, and shared a concrete outcome story from a similar "
        "patient. The physician referred his first patient two weeks later. Within four months, "
        "the practice became one of the rep's top three referral sources."
    ))
    story.append(scenario_card(4,
        "Late Referrals — Missing Patients Who Need Hospice Most",
        "A Northeast hospice had strong referral relationships but consistently admitted "
        "patients later in their disease trajectory than the clinical team preferred. Average "
        "length of stay was falling. Quality metrics were under pressure. Leadership blamed "
        "physicians. In reality, the sales team had never been trained to have conversations "
        "about earlier referral timing — they accepted late referrals passively rather than "
        "educating on eligibility criteria and the clinical benefits of earlier enrollment.",
        "Spartan worked with the team on clinical education messaging — physician-appropriate "
        "conversations about prognosis, Medicare eligibility, and quality-of-life outcomes "
        "for patients enrolled earlier. Within two quarters, average length of stay increased "
        "by 9 days — a significant improvement in both patient care quality and organizational "
        "financial performance."
    ))
    story.append(scenario_card(5,
        "Burnout — When a Top Performer Stops Performing",
        "A six-year veteran rep had been the organization's top performer. Over 18 months, "
        "her numbers steadily declined. She was still making calls, but energy was flat, "
        "follow-through had weakened, and she had stopped building new relationships. "
        "Leadership was considering a performance improvement plan. The real diagnosis: "
        "compassion fatigue compounded by zero structured support for the emotional weight "
        "of the work.",
        "Four months of Spartan individual coaching — focused on professional identity, "
        "sustainable habits, and re-anchoring to purpose — reversed the decline within 60 days. "
        "She became a mentor to a newer rep and is now the organization's top producer again. "
        "Leadership retained an irreplaceable six-year relationship asset and avoided a "
        "costly replacement cycle."
    ))
    story.append(PageBreak())

    # ── OBJECTIONS ────────────────────────────────────────────
    section(story, "Objection Handling", "Common Concerns, Answered Directly")
    story.append(P(
        "It is entirely reasonable to ask hard questions before investing in external coaching. "
        "Below are the objections we hear most often — and substantive, honest responses to each.", "body"))
    story.append(sp(8))

    story.append(objection_card(
        "We already have a training program.",
        "Internal training is valuable — and almost never sufficient on its own. Most hospice "
        "organizations have clinical orientation and compliance onboarding. Very few have a "
        "structured, sales-specific coaching methodology that addresses physician engagement, "
        "objection handling, referral source psychology, and accountability systems. A training "
        "program that is not producing measurable census growth is not a training program — "
        "it is an onboarding checklist. Spartan does not replace what you have. We build "
        "the coaching layer that makes your existing investment actually move numbers.",
        "Why it works: Organizations with external coaching in addition to internal training "
        "outperform those with internal training alone by an average of 23% in census growth "
        "within 12 months (Sales Management Association)."))
    story.append(objection_card(
        "Our reps already know the basics.",
        "The basics are table stakes. Every hospice rep knows what Medicare Part A covers and "
        "can explain the six-month prognosis requirement. What separates top-quartile performers "
        "is what happens in the room: how they listen, how they handle physician skepticism, how "
        "they build trust over a 12-month relationship, and how they sustain performance without "
        "burning out. In Spartan's experience, reps who believe they 'know the basics' are often "
        "those most in need of advanced conversation framework training — and most receptive to "
        "it when delivered by someone who understands their specific environment.",
        "Why it works: Knowing the basics explains eligibility criteria. It does not explain "
        "why two reps with the same territory and the same product produce wildly different "
        "census results. Coaching explains that."))
    story.append(objection_card(
        "We can't afford it right now.",
        "Let's use real numbers. One additional daily census point generates approximately "
        "$44,000-$58,000 per year in Medicare reimbursement. If coaching produces even two "
        "to three additional census points over six months, the investment pays for itself "
        "many times over. Virtual coaching sessions start at $40 for 30 minutes. The question "
        "is not whether you can afford coaching. It is how much census you are losing each "
        "month without it — and whether that is the right trade-off.",
        "Why it works: A 5-point census increase over six months generates approximately "
        "$220,000-$290,000 in annualized Medicare revenue at standard reimbursement rates. "
        "Spartan Coaching engagements are priced at a fraction of that figure."))
    story.append(objection_card(
        "We've done sales training before and it didn't stick.",
        "One-time training almost never sticks — and that is not a failure of your team. "
        "It is a failure of the delivery model. Research on behavior change in sales is "
        "unambiguous: skills from a single training event decay by more than 80% within one "
        "week without reinforcement. Spartan Coaching is not a training event. It is an ongoing "
        "coaching relationship with accountability, field application, and deliberate repetition "
        "built into every engagement. The Mamba Mentality at the core of our method is "
        "specifically about making change permanent through structured practice.",
        "Why it works: Ongoing coaching produces 3x the behavior change of one-time training "
        "programs (Sales Management Association longitudinal study, 2022)."))
    story.append(objection_card(
        "Our reps won't be receptive to outside coaching.",
        "This objection usually reflects one of two realities: reps who feel unsupported and "
        "are defensive, or reps who have been through generic training that didn't resonate. "
        "Spartan Coaching is hospice-specific. Reps immediately recognize that Nick Lynch "
        "understands the work — the emotional complexity, physician dynamics, compliance "
        "considerations, and the weight of selling in a grief-adjacent environment. Credibility "
        "creates receptivity. In nearly every Spartan engagement, initial skepticism converts "
        "to genuine engagement within the first two sessions.",
        "Why it works: Specificity builds trust. Reps who have seen generic sales training "
        "respond differently when coaching speaks the language of their actual job."))
    story.append(objection_card(
        "We'd rather hire more reps than coach existing ones.",
        "Hiring is essential for growth. Coaching protects that investment. The all-in cost "
        "of hiring, onboarding, and ramping a hospice sales rep — including recruiting fees, "
        "salary during ramp-up, and opportunity cost of an empty territory — exceeds $60,000. "
        "If that rep leaves within a year because they lacked structured support, you absorb "
        "that cost again. Coaching existing reps and coaching new hires through a structured "
        "onboarding program dramatically reduces turnover and cuts time-to-productivity from "
        "6-9 months to 3-4 months. Spartan works alongside your hiring strategy, not against it.",
        "Why it works: Structured onboarding coaching reduces first-year turnover by up to 40% "
        "and shortens average ramp time by half (Aberdeen Group, 2021)."))
    story.append(PageBreak())

    # ── MISSION + CTA ─────────────────────────────────────────
    section(story, "Why It Matters", "The Patient Equation")
    story.append(P(
        "Census and revenue are important. What they represent is more important: patients "
        "who receive — or don't receive — the care they deserve at the end of their lives.", "body"))
    story.append(P(
        "Research consistently shows that patients who enroll in hospice earlier experience "
        "better pain management, fewer hospitalizations, more time at home with family, and "
        "significantly greater quality of life in their final months. Family members report "
        "lower rates of complicated grief when their loved one received comprehensive hospice "
        "care. Every referral that doesn't happen — because a rep didn't know how to have the "
        "right conversation — is a patient who didn't get the care they needed.", "body"))
    story.append(P(
        "<b>Spartan Coaching exists at the intersection of business performance and patient "
        "advocacy.</b> Better-trained sales teams don't just grow census. They ensure the right "
        "patients reach the right care at the right time. That is the ultimate value "
        "proposition — and the reason this work matters.", "body"))
    story.append(sp(14))
    story.append(rule())
    story.append(sp(8))
    story.append(dark_banner(
        "Ready to Grow Your Census?",
        "Every engagement begins with a 30-minute discovery call — no obligation, no pitch.\n"
        "Just a direct conversation about what is possible for your organization."))
    story.append(sp(12))
    story.append(step_row("STEP 1", "Discovery Call",
        "A focused 30-minute conversation about your organization, team makeup, and census goals."))
    story.append(step_row("STEP 2", "Assessment and Proposal",
        "Spartan reviews your current situation and proposes an engagement specific to your gaps."))
    story.append(step_row("STEP 3", "Coaching Begins",
        "Clear metrics established from day one. Individual, team, or hybrid engagement launches."))
    story.append(step_row("STEP 4", "Accountability and Growth",
        "Regular check-ins, KPI review, and real-time adjustments ensure coaching converts to census results."))
    story.append(sp(16))
    story.append(HRFlowable(width="100%", thickness=0.75, color=RULE_C, spaceAfter=12))
    story.append(Paragraph(
        "<b>nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com</b>",
        ParagraphStyle("fc2", fontName="Helvetica-Bold", fontSize=11, textColor=DARK, leading=16, alignment=TA_CENTER)))
    story.append(sp(4))
    story.append(Paragraph(
        "Spartan Coaching — The Authority in Hospice Sales Excellence",
        ParagraphStyle("ft2", fontName="Helvetica-Oblique", fontSize=9.5, textColor=MID, alignment=TA_CENTER)))

    doc.build(story, onFirstPage=on_cover, onLaterPages=on_interior)
    print(f"Done: {OUTPUT}")

build()
