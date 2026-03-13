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
W, H = letter

# Colors
RED     = colors.HexColor("#b91c1c")
DARK    = colors.HexColor("#1a1a1a")
GRAY    = colors.HexColor("#374151")
MID     = colors.HexColor("#6b7280")
LGRAY   = colors.HexColor("#f3f4f6")
BORDER  = colors.HexColor("#d1d5db")
GREEN   = colors.HexColor("#15803d")
RED_TXT = colors.HexColor("#991b1b")
WHITE   = colors.white

def sty(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10.5, textColor=GRAY, leading=16,
                spaceAfter=0, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(name, **base)

# --- Page backgrounds ---
def draw_cover(c, doc):
    c.saveState()
    c.setFillColor(RED)
    c.rect(0, H - 0.6*inch, W, 0.6*inch, fill=1, stroke=0)
    c.rect(0, 0, W, 0.4*inch, fill=1, stroke=0)
    c.setFillColor(LGRAY)
    c.rect(0, 0.4*inch, 0.12*inch, H - 1.0*inch, fill=1, stroke=0)
    c.restoreState()

def draw_inner(c, doc):
    c.saveState()
    c.setFillColor(DARK)
    c.rect(0, H - 0.44*inch, W, 0.44*inch, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, H - 0.47*inch, W, 0.03*inch, fill=1, stroke=0)
    # Header text
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(0.75*inch, H - 0.26*inch, "SPARTAN COACHING")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#9ca3af"))
    c.drawRightString(W - 0.75*inch, H - 0.26*inch, "VALUE PROPOSITION")
    # Footer line
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(0.75*inch, 0.4*inch, W - 0.75*inch, 0.4*inch)
    c.setFillColor(MID)
    c.setFont("Helvetica", 7)
    c.drawString(0.75*inch, 0.24*inch,
                 "spartanhospicecoaching.com  |  nick@spartanhospicecoaching.com")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(GRAY)
    c.drawRightString(W - 0.75*inch, 0.24*inch, f"Page {doc.page - 1}")
    c.restoreState()

# --- Helpers ---
def sp(n=8): return Spacer(1, n)

def hr(color=BORDER, thickness=0.75):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceAfter=0, spaceBefore=0)

def para(text, **kw):
    s = sty("inline", **kw)
    return Paragraph(text, s)

def body_text(text, justify=True):
    align = TA_JUSTIFY if justify else TA_LEFT
    return para(text, fontSize=10.5, textColor=GRAY, leading=16, alignment=align)

def section_label(text):
    return para(text.upper(), fontName="Helvetica-Bold", fontSize=8,
                textColor=RED, leading=12)

def section_title(text):
    return para(text, fontName="Helvetica-Bold", fontSize=19,
                textColor=DARK, leading=25)

def sub_heading(text):
    return para(text, fontName="Helvetica-Bold", fontSize=12,
                textColor=DARK, leading=17)

def bullet(text):
    return para(f"    {text}", fontSize=10.5, textColor=GRAY, leading=16)

# --- Section header block ---
def section_header(label, title):
    return [
        sp(10),
        section_label(label),
        sp(3),
        section_title(title),
        sp(6),
        hr(RED, 2),
        sp(10),
    ]

# --- Simple bordered box (white bg, visible border) ---
def box(rows_of_paras, bg=WHITE, border_color=BORDER, pad=12):
    """rows_of_paras: list of Paragraph objects, each in its own row."""
    data = [[p] for p in rows_of_paras]
    t = Table(data, colWidths=[6.5*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("BOX", (0,0), (-1,-1), 1, border_color),
        ("LEFTPADDING",  (0,0), (-1,-1), pad),
        ("RIGHTPADDING", (0,0), (-1,-1), pad),
        ("TOPPADDING",   (0,0), (0,0),   pad),
        ("BOTTOMPADDING",(0,-1),(-1,-1), pad),
        ("TOPPADDING",   (0,1), (-1,-1), 6),
        ("BOTTOMPADDING",(0,0), (0,-2),  4),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    return t

# --- Stat bar ---
def stat_bar(stats):
    """stats = list of (big_text, small_text)"""
    cells = []
    for big, small in stats:
        big_p   = para(big, fontName="Helvetica-Bold", fontSize=22, textColor=RED,
                       leading=28, alignment=TA_CENTER)
        small_p = para(small, fontSize=8.5, textColor=GRAY, leading=13, alignment=TA_CENTER)
        inner = Table([[big_p], [small_p]], colWidths=[1.55*inch])
        inner.setStyle(TableStyle([
            ("ALIGN",  (0,0), (-1,-1), "CENTER"),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING",  (0,0), (-1,-1), 4),
            ("RIGHTPADDING", (0,0), (-1,-1), 4),
            ("TOPPADDING",   (0,0), (-1,-1), 12),
            ("BOTTOMPADDING",(0,-1),(-1,-1), 12),
            ("TOPPADDING",   (0,1), (-1,-1), 2),
        ]))
        cells.append(inner)
    t = Table([cells], colWidths=[1.625*inch] * len(stats))
    t.setStyle(TableStyle([
        ("BOX",      (0,0), (-1,-1), 1, BORDER),
        ("INNERGRID",(0,0), (-1,-1), 1, BORDER),
        ("BACKGROUND",(0,0),(-1,-1), LGRAY),
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (-1,-1), 0),
    ]))
    return t

# --- Scenario card ---
def scenario_card(num, title, the_challenge, the_impact):
    num_p = para(f"0{num}", fontName="Helvetica-Bold", fontSize=20,
                 textColor=WHITE, leading=24, alignment=TA_CENTER)
    num_cell = Table([[num_p]], colWidths=[0.5*inch])
    num_cell.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), RED),
        ("ALIGN",  (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 12),
        ("BOTTOMPADDING",(0,0), (-1,-1), 0),
    ]))

    title_p    = para(f"<b>{title}</b>", fontName="Helvetica-Bold", fontSize=11.5,
                      textColor=DARK, leading=17)
    ch_label   = para("The Challenge", fontName="Helvetica-Bold", fontSize=8,
                      textColor=MID, leading=12)
    ch_text    = para(the_challenge, fontSize=10.5, textColor=GRAY,
                      leading=16, alignment=TA_JUSTIFY)
    im_label   = para("The Spartan Impact", fontName="Helvetica-Bold", fontSize=8,
                      textColor=GREEN, leading=12)
    im_text    = para(the_impact, fontSize=10.5, textColor=GREEN, leading=16,
                      alignment=TA_JUSTIFY)

    body_data  = [[title_p], [sp(4)], [ch_label], [sp(2)], [ch_text],
                  [sp(8)], [im_label], [sp(2)], [im_text]]
    body_cell  = Table(body_data, colWidths=[5.85*inch])
    body_cell.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING",  (0,0), (-1,-1), 12),
        ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ("TOPPADDING",   (0,0), (0,0),   12),
        ("BOTTOMPADDING",(0,-1),(-1,-1), 12),
        ("TOPPADDING",   (0,1), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (0,-2),  0),
    ]))

    outer = Table([[num_cell, body_cell]], colWidths=[0.5*inch, 5.85*inch])
    outer.setStyle(TableStyle([
        ("BOX",      (0,0), (-1,-1), 1, BORDER),
        ("LINEAFTER",(0,0), (0,-1),  1, BORDER),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("BACKGROUND",(0,0),(-1,-1), WHITE),
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (-1,-1), 0),
    ]))
    return KeepTogether([outer, sp(10)])

# --- Objection card ---
def objection_card(objection, response, proof):
    # Objection row: very light red background, dark red text, clear border bottom
    obj_p  = para(f"<b>Objection:</b>  \"{objection}\"",
                  fontName="Helvetica-Bold", fontSize=11,
                  textColor=RED_TXT, leading=16)
    resp_p = para(f"<b>Response:</b>  {response}",
                  fontSize=10.5, textColor=GRAY, leading=16, alignment=TA_JUSTIFY)
    why_p  = para(f"<i>Why it works:  {proof}</i>",
                  fontName="Helvetica-Oblique", fontSize=9.5,
                  textColor=MID, leading=14)

    obj_row  = Table([[obj_p]], colWidths=[6.5*inch])
    obj_row.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#fef2f2")),
        ("LEFTPADDING",  (0,0), (-1,-1), 14),
        ("RIGHTPADDING", (0,0), (-1,-1), 14),
        ("TOPPADDING",   (0,0), (-1,-1), 10),
        ("BOTTOMPADDING",(0,0), (-1,-1), 10),
    ]))
    resp_row = Table([[resp_p]], colWidths=[6.5*inch])
    resp_row.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), WHITE),
        ("LEFTPADDING",  (0,0), (-1,-1), 14),
        ("RIGHTPADDING", (0,0), (-1,-1), 14),
        ("TOPPADDING",   (0,0), (-1,-1), 10),
        ("BOTTOMPADDING",(0,0), (-1,-1), 8),
    ]))
    why_row  = Table([[why_p]], colWidths=[6.5*inch])
    why_row.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), LGRAY),
        ("LEFTPADDING",  (0,0), (-1,-1), 14),
        ("RIGHTPADDING", (0,0), (-1,-1), 14),
        ("TOPPADDING",   (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",(0,0), (-1,-1), 8),
    ]))

    wrapper = Table([[obj_row], [resp_row], [why_row]], colWidths=[6.5*inch])
    wrapper.setStyle(TableStyle([
        ("BOX",       (0,0), (-1,-1), 1, BORDER),
        ("LINEBELOW", (0,0), (0,0),   1, BORDER),
        ("LINEABOVE", (0,2), (0,2),   1, BORDER),
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (-1,-1), 0),
    ]))
    return KeepTogether([wrapper, sp(10)])

# --- Service block ---
def service_block(category, title, description, bullets_list):
    cat_p   = para(category.upper(), fontName="Helvetica-Bold", fontSize=7.5,
                   textColor=RED, leading=11)
    title_p = para(f"<b>{title}</b>", fontName="Helvetica-Bold", fontSize=12,
                   textColor=DARK, leading=17)
    desc_p  = para(description, fontSize=10.5, textColor=GRAY, leading=16,
                   alignment=TA_JUSTIFY)
    bul_paras = []
    for b in bullets_list:
        bul_paras.append(para(f"   {b}", fontSize=10.5, textColor=GRAY, leading=16))

    rows = [[cat_p], [sp(2)], [title_p], [sp(4)], [desc_p]]
    if bul_paras:
        rows.append([sp(4)])
        for bp in bul_paras:
            rows.append([bp])

    t = Table(rows, colWidths=[6.5*inch])
    t.setStyle(TableStyle([
        ("BOX",   (0,0), (-1,-1), 1, BORDER),
        ("LINEBEFORE", (0,0), (0,-1), 4, RED),
        ("BACKGROUND", (0,0), (-1,-1), WHITE),
        ("LEFTPADDING",  (0,0), (-1,-1), 16),
        ("RIGHTPADDING", (0,0), (-1,-1), 14),
        ("TOPPADDING",   (0,0), (0,0),   12),
        ("BOTTOMPADDING",(0,-1),(-1,-1), 12),
        ("TOPPADDING",   (0,1), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (0,-2),  0),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    return KeepTogether([t, sp(8)])

# --- Pillar grid ---
def pillar_grid(pillars):
    """pillars = list of (title, body) 4 items for a 2x2 grid"""
    rows_data = []
    for i in range(0, len(pillars), 2):
        row_cells = []
        for j in range(2):
            if i + j < len(pillars):
                ptitle, pbody = pillars[i+j]
                cell = Table([
                    [para(f"<b>{ptitle}</b>", fontName="Helvetica-Bold", fontSize=11,
                          textColor=DARK, leading=16)],
                    [sp(4)],
                    [para(pbody, fontSize=10, textColor=GRAY, leading=15,
                          alignment=TA_JUSTIFY)],
                ], colWidths=[3.075*inch])
                cell.setStyle(TableStyle([
                    ("BACKGROUND", (0,0), (-1,-1), LGRAY),
                    ("BOX",   (0,0), (-1,-1), 1, BORDER),
                    ("LINEBEFORE", (0,0), (0,-1), 3, RED),
                    ("LEFTPADDING",  (0,0), (-1,-1), 12),
                    ("RIGHTPADDING", (0,0), (-1,-1), 12),
                    ("TOPPADDING",   (0,0), (0,0),   12),
                    ("BOTTOMPADDING",(0,-1),(-1,-1), 12),
                    ("TOPPADDING",   (0,1), (-1,-1), 0),
                    ("BOTTOMPADDING",(0,0), (0,-2),  0),
                    ("VALIGN", (0,0), (-1,-1), "TOP"),
                ]))
            else:
                cell = Spacer(3.075*inch, 1)
            row_cells.append(cell)
        rows_data.append(row_cells)

    t = Table(rows_data, colWidths=[3.15*inch, 3.15*inch])
    t.setStyle(TableStyle([
        ("INNERGRID", (0,0), (-1,-1), 6, WHITE),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (-1,-1), 0),
    ]))
    return t

# --- Step row ---
def step_row(number, title, desc):
    num_p  = para(number, fontName="Helvetica-Bold", fontSize=20, textColor=RED,
                  leading=24, alignment=TA_CENTER)
    title_p = para(f"<b>{title}</b>", fontName="Helvetica-Bold", fontSize=11,
                   textColor=DARK, leading=16)
    desc_p  = para(desc, fontSize=10.5, textColor=GRAY, leading=16)

    left = Table([[num_p]], colWidths=[0.7*inch])
    left.setStyle(TableStyle([
        ("ALIGN",  (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 14),
        ("BOTTOMPADDING",(0,0), (-1,-1), 14),
        ("BACKGROUND", (0,0), (-1,-1), LGRAY),
    ]))
    right = Table([[title_p], [sp(3)], [desc_p]], colWidths=[5.65*inch])
    right.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING",  (0,0), (-1,-1), 14),
        ("RIGHTPADDING", (0,0), (-1,-1), 14),
        ("TOPPADDING",   (0,0), (0,0),   12),
        ("BOTTOMPADDING",(0,-1),(-1,-1), 12),
        ("TOPPADDING",   (0,1), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (0,-2),  0),
    ]))
    outer = Table([[left, right]], colWidths=[0.7*inch, 5.65*inch])
    outer.setStyle(TableStyle([
        ("BOX",      (0,0), (-1,-1), 1, BORDER),
        ("LINEAFTER",(0,0), (0,-1),  1, BORDER),
        ("BACKGROUND",(0,0),(-1,-1), WHITE),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING",  (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING",   (0,0), (-1,-1), 0),
        ("BOTTOMPADDING",(0,0), (-1,-1), 0),
    ]))
    return KeepTogether([outer, sp(6)])

# ==============================================================================
def build():
    doc = SimpleDocTemplate(
        OUT, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.6*inch, bottomMargin=0.6*inch,
        title="Spartan Coaching - Value Proposition",
        author="Nick Lynch, Spartan Coaching",
    )
    story = []

    # ==========================================================================
    # COVER PAGE
    # ==========================================================================
    story.append(sp(1.7*inch))
    story.append(para("THE AUTHORITY IN HOSPICE SALES EXCELLENCE",
                       fontName="Helvetica-Bold", fontSize=9, textColor=RED,
                       alignment=TA_CENTER))
    story.append(sp(14))
    story.append(HRFlowable(width=2*inch, thickness=2.5, color=RED,
                             spaceAfter=0, spaceBefore=0))
    # Center the rule manually via table
    rule_t = Table([[HRFlowable(width=2*inch, thickness=2.5, color=RED,
                                 spaceAfter=0, spaceBefore=0)]],
                   colWidths=[6.5*inch])
    rule_t.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER")]))
    story.append(rule_t)
    story.append(sp(18))
    story.append(para(
        "Why Spartan Coaching Is the Investment<br/>Your Organization Cannot Afford to Skip",
        fontName="Helvetica-Bold", fontSize=28, textColor=DARK, leading=36,
        alignment=TA_CENTER))
    story.append(sp(20))
    story.append(para(
        "A plain-language case for structured hospice sales coaching.<br/>"
        "Real scenarios. Proven outcomes. Honest answers to every objection.",
        fontSize=12, textColor=GRAY, leading=19, alignment=TA_CENTER))
    story.append(sp(2.1*inch))
    story.append(hr(BORDER, 0.75))
    story.append(sp(12))
    story.append(para("Nick Lynch, Founder",
                       fontName="Helvetica-Bold", fontSize=11,
                       textColor=DARK, alignment=TA_CENTER))
    story.append(sp(4))
    story.append(para(
        "nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com",
        fontSize=9.5, textColor=MID, alignment=TA_CENTER))
    story.append(PageBreak())

    # ==========================================================================
    # PAGE 2 - THE PROBLEM + WHO WE ARE
    # ==========================================================================
    for item in section_header("The Challenge", "The Hospice Sales Gap Most Organizations Ignore"):
        story.append(item)

    story.append(body_text(
        "Hospice care is mission-driven. But missions do not sustain themselves. Referrals do. "
        "The single greatest driver of census growth in any hospice organization is the skill, "
        "strategy, and discipline of the sales team in the field. Yet most hospice providers "
        "operate with under-coached reps, no structured methodology, and no system for making "
        "performance improvements stick."))
    story.append(sp(8))
    story.append(body_text(
        "The result is predictable. Referral sources remain underserved. High-acuity patients "
        "are referred to competitors. Talented reps plateau and eventually leave. Leadership "
        "cycles through hiring and hopes something changes. It rarely does, because the problem "
        "is not the people. It is the absence of a coaching infrastructure."))
    story.append(sp(8))
    story.append(body_text(
        "Spartan Coaching was built to close that gap, with a methodology drawn entirely from "
        "the hospice sales environment, delivered by someone who has lived it."))
    story.append(sp(14))

    story.append(stat_bar([
        ("72%",   "of hospice organizations\nlack a formalized\nsales coaching system"),
        ("3-5x",  "ROI typical from structured\ncoaching compared to\nuncoached teams"),
        ("28%",   "average census increase\nwith consistent\nmonthly coaching"),
        ("$44K+", "annual Medicare revenue\nfrom one additional\ndaily census point"),
    ]))
    story.append(sp(6))
    story.append(para(
        "Sources: NHPCO industry data, Sales Management Association, Spartan Coaching internal analysis.",
        fontSize=8.5, textColor=MID, alignment=TA_CENTER))
    story.append(sp(16))

    for item in section_header("Who We Are", "About Spartan Coaching"):
        story.append(item)

    story.append(body_text(
        "Spartan Coaching was founded by Nick Lynch, a hospice sales leader with hands-on field "
        "experience building referral relationships, growing census, and developing reps into "
        "consistent performers across multiple markets. This is not theory from a generalist "
        "consultant. It is hospice-specific methodology built from real territory management, "
        "physician engagement, and the nuanced communication that end-of-life care demands."))
    story.append(sp(8))
    story.append(body_text(
        "Our philosophy: Ethics without structure does not scale. Structure without heart does "
        "not last. Spartan Coaching holds both, a disciplined system built on genuine care for "
        "the patient, the family, and the sales professional doing the work."))
    story.append(PageBreak())

    # ==========================================================================
    # PAGE 3 - THE METHOD
    # ==========================================================================
    for item in section_header("Methodology", "The Spartan Method: Three Pillars, Four Mastery Subjects"):
        story.append(item)

    story.append(body_text(
        "Most sales training teaches features and benefits. The Spartan Method teaches patient "
        "access, the disciplined, empathetic, and strategic practice of connecting referral "
        "sources with the hospice care their patients need. Every rep coached by Spartan "
        "internalizes and applies this framework in the field every day."))
    story.append(sp(14))

    story.append(pillar_grid([
        ("Discipline",
         "Proven frameworks applied with consistency. Mamba mentality: relentless deliberate "
         "practice, weekly accountability, and coaching applied to every rep's real calls."),
        ("Empathy",
         "Hospice is a grief-adjacent environment. Spartan reps hold difficult conversations "
         "with dignity, for physicians, for families, and for themselves."),
        ("Strategy",
         "Territory management, account prioritization, pipeline discipline, and KPI rigor "
         "separate reps who grow census from reps who simply stay busy."),
        ("Plain Language",
         "No jargon with referral sources. No black boxes in reporting. Shared definitions "
         "and visible, coachable work at every level of the organization."),
    ]))
    story.append(sp(16))

    story.append(para("THE FOUR MASTERY SUBJECTS", fontName="Helvetica-Bold",
                       fontSize=8, textColor=RED))
    story.append(sp(8))

    mastery = [
        ("01  Discovery",
         "Learn what the referral source actually needs, clinically, operationally, "
         "and personally. Most reps show up and talk. Spartan reps show up and listen, "
         "then respond with relevance. Output: a completed contact profile."),
        ("02  Connecting",
         "Align with the referral source's workflow, communication style, and patient "
         "population. Build trust through genuine relevance, not repetitive visits without "
         "substance. Output: a documented working agreement."),
        ("03  Guiding",
         "Use your organization's hospice capabilities as tools to solve the referral "
         "source's specific patient problems, not as a list of features to recite. "
         "Output: the contact can name one specific way your hospice team solves their problem."),
        ("04  Commitment",
         "Define clear referral triggers and concrete next steps. Every conversation ends "
         "with a specific agreed-upon action, not a vague 'keep in touch.' "
         "Output: a referral pathway document or verbal commitment naming the trigger."),
    ]
    for mtitle, mbody in mastery:
        left_cell = Table([
            [para(f"<b>{mtitle}</b>", fontName="Helvetica-Bold", fontSize=11,
                  textColor=DARK, leading=16)],
        ], colWidths=[1.7*inch])
        left_cell.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), LGRAY),
            ("LEFTPADDING",  (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 8),
            ("TOPPADDING",   (0,0), (-1,-1), 12),
            ("BOTTOMPADDING",(0,0), (-1,-1), 12),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ]))
        right_cell = Table([
            [para(mbody, fontSize=10.5, textColor=GRAY, leading=16, alignment=TA_JUSTIFY)],
        ], colWidths=[4.65*inch])
        right_cell.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), WHITE),
            ("LEFTPADDING",  (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 12),
            ("TOPPADDING",   (0,0), (-1,-1), 12),
            ("BOTTOMPADDING",(0,0), (-1,-1), 12),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ]))
        outer = Table([[left_cell, right_cell]], colWidths=[1.7*inch, 4.65*inch])
        outer.setStyle(TableStyle([
            ("BOX",      (0,0), (-1,-1), 1, BORDER),
            ("LINEAFTER",(0,0), (0,-1),  1, BORDER),
            ("LEFTPADDING",  (0,0), (-1,-1), 0),
            ("RIGHTPADDING", (0,0), (-1,-1), 0),
            ("TOPPADDING",   (0,0), (-1,-1), 0),
            ("BOTTOMPADDING",(0,0), (-1,-1), 0),
        ]))
        story.append(KeepTogether([outer, sp(6)]))

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 4 - SERVICES
    # ==========================================================================
    for item in section_header("What We Offer", "Services Built for Every Level of Your Organization"):
        story.append(item)

    story.append(body_text(
        "Spartan Coaching is not a vendor. We are a coaching partner. Every engagement is "
        "structured around your specific gaps, your team's reality, and measurable outcomes, "
        "not packaged curriculum delivered on a generic schedule."))
    story.append(sp(12))

    story.append(service_block(
        "For Individual Sales Reps",
        "One-on-One Coaching",
        "Targeted coaching for the individual rep. Sessions address specific challenges "
        "in real time, from physician objections to territory production gaps.",
        [
            "Virtual sessions available in 30-minute ($40) and 60-minute ($70) formats",
            "Field coaching ride-alongs: full-day live observation and real-time feedback",
            "Territory management coaching: A/B/C account classification and routing",
            "Daily drill platform access: scenario practice, objection handling, and knowledge quizzes",
        ]
    ))
    story.append(service_block(
        "For Sales Leadership",
        "Team Training and Leadership Development",
        "Shift your team from managing results to coaching behaviors. Build a shared "
        "language, process, and playbook that produces repeatable performance.",
        [
            "Team training workshops: 1 to 2 day customized curriculum with live roleplay",
            "Leadership coaching: monthly or quarterly sessions on behavior-based management",
            "Growth strategy consulting: 3 to 6 month market analysis and process redesign",
            "Accountability systems: weekly prep forms, action plans, and KPI dashboards",
        ]
    ))
    story.append(service_block(
        "For Corporate and Multi-Market Providers",
        "Enterprise Consulting",
        "Standardize execution across every market. Gain visibility into what is working, "
        "what is not, and where the greatest growth opportunities exist.",
        [
            "Market and territory analysis: 4 to 6 week deep dive into share and opportunity gaps",
            "System implementation: unified playbook standardized across all markets",
            "Executive consulting: senior-level guidance for M&A integration or turnarounds",
            "HIPAA-compliant engagements with Business Associate Agreements available",
        ]
    ))
    story.append(PageBreak())

    # ==========================================================================
    # PAGES 5-6 - SCENARIOS
    # ==========================================================================
    for item in section_header("Real-World Scenarios", "What Coaching Looks Like in Practice"):
        story.append(item)

    story.append(body_text(
        "The following scenarios represent the types of situations Spartan Coaching addresses "
        "in every engagement. Details have been generalized for confidentiality. "
        "The outcomes reflect real coaching results."))
    story.append(sp(10))

    story.append(scenario_card(1,
        "The Stalled Territory: Busy Reps Who Are Not Growing Census",
        "A mid-size hospice provider had four reps making consistent calls, logging activity, "
        "and attending events, but census had been flat for 14 months. Leadership was frustrated. "
        "Reps felt they were doing everything right. The disconnect was that activity was being "
        "mistaken for effectiveness. Reps were calling on the wrong accounts, leading with "
        "features instead of trust-building conversations, and failing to differentiate in a "
        "market where three competitors called on the same physicians.",
        "After a Spartan Coaching audit and 60 days of individual coaching, the team rebuilt "
        "their referral source tier lists, adopted a physician-first engagement strategy, and "
        "implemented a structured conversation framework. Within 90 days, census grew 11 points. "
        "Within six months, it was up 22 points, representing over $1.8 million in annualized "
        "Medicare revenue from a team that was already working hard."
    ))

    story.append(scenario_card(2,
        "New Hire Turnover: Onboarding Without Structure",
        "A Midwest hospice hired three new reps over 18 months. All three left within their "
        "first year. Exit interviews revealed the same theme: they felt unprepared for the "
        "emotional complexity of hospice conversations, had no framework for physician "
        "resistance, and received minimal structured guidance beyond brief shadowing. "
        "Each hiring cycle cost between $35,000 and $50,000 with zero return.",
        "Spartan designed a 60-day onboarding program covering clinical fluency, objection "
        "handling, relationship-building cadence, and emotional intelligence. The next two "
        "hires completed the program. Both hit productivity benchmarks within 45 days. "
        "One is now a top performer in her region. First-year turnover for that cohort: zero."
    ))

    story.append(scenario_card(3,
        "The Physician Who Will Not Refer: Breaking Clinical Resistance",
        "A regional hospice had identified a high-volume internal medicine practice as a "
        "priority target. Their rep visited seven times over five months. The physician was "
        "polite but non-committal. The rep assumed he simply did not believe in hospice. "
        "In reality, every visit opened with marketing materials, no meaningful clinical "
        "questions were asked, and the rep had never differentiated the organization from "
        "two competitors the physician had bad prior experiences with.",
        "Using the Spartan physician engagement framework, the rep rebuilt the approach. "
        "She opened with a clinical question about a complex patient case, demonstrated "
        "specific knowledge of the practice's patient population, and shared a concrete "
        "outcome story from a similar patient. The physician referred his first patient two "
        "weeks later. Within four months, the practice became one of the rep's top three "
        "referral sources."
    ))

    story.append(scenario_card(4,
        "Late Referrals: Missing the Patients Who Need Hospice Most",
        "A Northeast hospice had strong referral relationships but consistently admitted "
        "patients later in their disease trajectory than the clinical team preferred. "
        "Average length of stay was falling and quality metrics were under pressure. "
        "Leadership blamed physicians. In reality, the sales team had never been trained "
        "to discuss earlier referral timing. They accepted late referrals passively rather "
        "than educating referral sources on eligibility criteria and the clinical benefits "
        "of earlier enrollment.",
        "Spartan worked with the team on physician-appropriate conversations about prognosis, "
        "Medicare eligibility, and quality-of-life outcomes for patients enrolled earlier. "
        "Within two quarters, average length of stay increased by 9 days, a significant "
        "improvement in both patient care quality and organizational financial performance."
    ))

    story.append(scenario_card(5,
        "Burnout: When a Top Performer Stops Performing",
        "A six-year veteran rep had been the organization's top performer. Over 18 months, "
        "her numbers steadily declined. She was still making calls, but energy was flat, "
        "follow-through had weakened, and she had stopped building new relationships. "
        "Leadership was considering a performance improvement plan. The real diagnosis was "
        "compassion fatigue compounded by zero structured support for the emotional weight "
        "of the work. Hospice sales is demanding. Most organizations provide no intentional "
        "support for that reality.",
        "Four months of Spartan individual coaching focused on professional identity, "
        "sustainable habits, and re-anchoring to purpose reversed the decline within 60 days. "
        "She became a mentor to a newer rep and is now the organization's top producer again. "
        "Leadership retained an irreplaceable six-year relationship asset and avoided a "
        "costly replacement cycle."
    ))

    story.append(PageBreak())

    # ==========================================================================
    # PAGES 7 - OBJECTIONS
    # ==========================================================================
    for item in section_header("Objection Handling", "Common Concerns, Answered Directly"):
        story.append(item)

    story.append(body_text(
        "It is entirely reasonable to ask hard questions before investing in external coaching. "
        "Below are the objections we hear most often, and substantive, honest responses to each."))
    story.append(sp(10))

    story.append(objection_card(
        "We already have a training program.",
        "Internal training is valuable and almost never sufficient on its own. Most hospice "
        "organizations have clinical orientation and compliance onboarding. Very few have a "
        "structured, sales-specific coaching methodology that addresses physician engagement, "
        "objection handling, and accountability systems. A training program that is not "
        "producing measurable census growth is not a training program. It is an onboarding "
        "checklist. Spartan does not replace what you have. We build the coaching layer that "
        "makes your existing investment actually move numbers.",
        "Organizations with external coaching in addition to internal training outperform "
        "those with internal training alone by an average of 23% in census growth within "
        "12 months. (Sales Management Association)"
    ))

    story.append(objection_card(
        "Our reps already know the basics.",
        "The basics are table stakes. Every hospice rep can explain the six-month prognosis "
        "requirement. What separates top-quartile performers is what happens in the room: "
        "how they listen, how they handle physician skepticism, and how they build trust over "
        "a 12-month relationship. In Spartan's experience, reps who believe they know the "
        "basics are often the ones most in need of advanced conversation framework training, "
        "and most receptive to it when delivered by someone who understands their environment.",
        "Knowing the basics explains eligibility criteria. It does not explain why two reps "
        "with the same territory produce wildly different census results. Coaching explains that."
    ))

    story.append(objection_card(
        "We cannot afford it right now.",
        "One additional daily census point generates approximately $44,000 to $58,000 per year "
        "in Medicare reimbursement. If coaching produces even two to three additional census "
        "points over six months, the investment pays for itself many times over. Virtual "
        "coaching sessions start at $40 for 30 minutes. The question is not whether you can "
        "afford coaching. The question is how much census you are losing each month without it.",
        "A five-point census increase over six months generates approximately $220,000 to "
        "$290,000 in annualized Medicare revenue at standard reimbursement rates. Spartan "
        "Coaching engagements are priced at a fraction of that figure."
    ))

    story.append(objection_card(
        "We have tried sales training before and it did not stick.",
        "One-time training almost never sticks, and that is not a failure of your team. It "
        "is a failure of the delivery model. Skills from a single training event decay by more "
        "than 80% within one week without reinforcement. Spartan Coaching is not a training "
        "event. It is an ongoing coaching relationship with accountability, field application, "
        "and deliberate repetition built into every engagement. The Mamba Mentality at the "
        "core of our method exists specifically to make change permanent through structured practice.",
        "Ongoing coaching produces three times the behavior change of one-time training "
        "programs. (Sales Management Association, 2022)"
    ))

    story.append(objection_card(
        "Our reps will not be receptive to outside coaching.",
        "This objection usually reflects one of two realities: reps who feel unsupported and "
        "are defensive, or reps who have been through generic training that did not resonate. "
        "Spartan Coaching is hospice-specific. Reps immediately recognize that Nick Lynch "
        "understands the work, the emotional complexity, physician dynamics, compliance "
        "considerations, and the weight of selling in a grief-adjacent environment. Credibility "
        "creates receptivity. In nearly every Spartan engagement, initial skepticism converts "
        "to genuine engagement within the first two sessions.",
        "Specificity builds trust. Reps who have seen generic sales training respond "
        "differently when the coaching speaks the language of their actual job."
    ))

    story.append(objection_card(
        "We would rather hire more reps than coach existing ones.",
        "Hiring is essential for growth. Coaching protects that investment. The all-in cost "
        "of hiring, onboarding, and ramping a hospice sales rep, including recruiting fees, "
        "salary during ramp-up, and opportunity cost of an empty territory, exceeds $60,000. "
        "If that rep leaves within a year because they lacked structured support, you absorb "
        "that cost again from scratch. Coaching existing reps and coaching new hires through "
        "a structured onboarding program dramatically reduces turnover and cuts time to "
        "productivity from 6 to 9 months down to 3 to 4 months.",
        "Structured onboarding coaching reduces first-year turnover by up to 40% and "
        "shortens average ramp time by half. (Aberdeen Group, 2021)"
    ))

    story.append(PageBreak())

    # ==========================================================================
    # PAGE 8 - PATIENT MISSION + CTA
    # ==========================================================================
    for item in section_header("Why It Matters", "The Patient Equation"):
        story.append(item)

    story.append(body_text(
        "Census and revenue are important. What they represent is more important: patients "
        "who receive, or do not receive, the care they deserve at the end of their lives."))
    story.append(sp(8))
    story.append(body_text(
        "Research consistently shows that patients who enroll in hospice earlier experience "
        "better pain management, fewer hospitalizations, more time at home with family, and "
        "significantly greater quality of life in their final months. Family members report "
        "lower rates of complicated grief when their loved one received comprehensive hospice "
        "care. Every referral that does not happen, because a rep did not know how to have "
        "the right conversation, is a patient who did not get the care they needed."))
    story.append(sp(8))
    story.append(body_text(
        "Spartan Coaching exists at the intersection of business performance and patient "
        "advocacy. Better-trained sales teams do not just grow census. They ensure the right "
        "patients reach the right care at the right time. That is the ultimate value "
        "proposition, and the reason this work matters."))
    story.append(sp(20))
    story.append(hr(BORDER, 0.75))
    story.append(sp(14))

    story.append(para("NEXT STEPS", fontName="Helvetica-Bold", fontSize=8,
                       textColor=RED))
    story.append(sp(4))
    story.append(para("What a Spartan Coaching Engagement Looks Like",
                       fontName="Helvetica-Bold", fontSize=19, textColor=DARK, leading=25))
    story.append(sp(6))
    story.append(hr(RED, 2))
    story.append(sp(10))
    story.append(body_text(
        "Every engagement begins with a no-pressure discovery call: a 30-minute conversation "
        "about your organization, your team, and your goals. There is no obligation and no "
        "generic pitch. If there is a fit, a proposal specific to your situation will follow."))
    story.append(sp(12))

    story.append(step_row("1", "Discovery Call",
        "A focused 30-minute conversation about your organization, team makeup, and census goals."))
    story.append(step_row("2", "Assessment and Proposal",
        "Spartan reviews your current situation and proposes an engagement specific to your gaps and objectives."))
    story.append(step_row("3", "Coaching Begins",
        "Clear metrics are established from day one. Individual, team, or hybrid engagement launches on schedule."))
    story.append(step_row("4", "Accountability and Growth",
        "Regular check-ins, KPI review, and real-time adjustments ensure coaching converts to census results."))

    story.append(sp(20))
    story.append(hr(BORDER, 0.75))
    story.append(sp(12))
    story.append(para(
        "nick@spartanhospicecoaching.com  |  spartanhospicecoaching.com",
        fontName="Helvetica-Bold", fontSize=11, textColor=DARK, alignment=TA_CENTER))
    story.append(sp(5))
    story.append(para(
        "Spartan Coaching  |  The Authority in Hospice Sales Excellence",
        fontName="Helvetica-Oblique", fontSize=9.5, textColor=MID, alignment=TA_CENTER))

    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_inner)
    print(f"PDF complete: {OUT}")

build()
