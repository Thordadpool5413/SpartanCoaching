#!/usr/bin/env python3
"""
Why Your Census Number Is Not Arbitrary - v8.0 (COMPREHENSIVE EDITION)
Spartan Coaching | Branch Profitability Education Series

Deep narrative edition. FY 2026 RHC rates: Day 1-60 = $230.83, Day 61+ = $181.94.
No em dashes. Professional PDF for distribution.
Run: python3 scripts/generate_census_pdf_v8.py
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame,
    Paragraph, Spacer, Table, TableStyle,
    KeepTogether, PageBreak, HRFlowable,
    NextPageTemplate
)

# ---- Brand ------------------------------------------------------------------
RED        = colors.HexColor("#b91c1c")
RED_DARK   = colors.HexColor("#991b1b")
RED_LIGHT  = colors.HexColor("#fef2f2")
RED_MID    = colors.HexColor("#fee2e2")
DARK       = colors.HexColor("#111827")
DARK_MED   = colors.HexColor("#1f2937")
MID        = colors.HexColor("#374151")
MID_LIGHT  = colors.HexColor("#6b7280")
LIGHT      = colors.HexColor("#f9fafb")
LIGHT2     = colors.HexColor("#f3f4f6")
RULE_GRAY  = colors.HexColor("#e5e7eb")
RULE_DARK  = colors.HexColor("#d1d5db")
WHITE      = colors.white

PAGE_W, PAGE_H = letter
MARGIN_L = 0.85 * inch
MARGIN_R = 0.85 * inch
MARGIN_T = 0.90 * inch
MARGIN_B = 0.75 * inch
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

BASE = "Helvetica"
BOLD = "Helvetica-Bold"
ITAL = "Helvetica-Oblique"
BITA = "Helvetica-BoldOblique"


# ---- Document ---------------------------------------------------------------
class SpartanDoc(BaseDocTemplate):
    def __init__(self, path):
        super().__init__(
            path, pagesize=letter,
            leftMargin=MARGIN_L, rightMargin=MARGIN_R,
            topMargin=MARGIN_T, bottomMargin=MARGIN_B,
            title="Why Your Census Number Is Not Arbitrary",
            author="Spartan Coaching",
            subject="Branch Profitability Education Series",
        )
        body_frame = Frame(
            MARGIN_L, MARGIN_B, CONTENT_W, PAGE_H - MARGIN_T - MARGIN_B,
            id="body", leftPadding=0, rightPadding=0,
            topPadding=0, bottomPadding=0,
        )
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[body_frame], onPage=self._cover),
            PageTemplate(id="toc",   frames=[body_frame], onPage=self._inner),
            PageTemplate(id="body",  frames=[body_frame], onPage=self._inner),
        ])

    def _cover(self, canvas, doc):
        canvas.saveState()
        # Full dark background
        canvas.setFillColor(DARK)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        # Red top band
        canvas.setFillColor(RED)
        canvas.rect(0, PAGE_H - 0.55 * inch, PAGE_W, 0.55 * inch, fill=1, stroke=0)
        # Series label
        canvas.setFillColor(WHITE)
        canvas.setFont(BASE, 7.5)
        canvas.drawCentredString(PAGE_W / 2, PAGE_H - 0.33 * inch,
            "BRANCH PROFITABILITY EDUCATION SERIES  -  SPARTAN COACHING")
        # Left accent rule
        canvas.setFillColor(RED)
        canvas.rect(MARGIN_L, 1.6 * inch, 0.04 * inch, 5.5 * inch, fill=1, stroke=0)
        # Wordmark
        canvas.setFillColor(RED)
        canvas.setFont(BOLD, 9)
        canvas.drawString(MARGIN_L + 0.18 * inch, PAGE_H - 1.10 * inch, "SPARTAN COACHING")
        canvas.setFillColor(MID_LIGHT)
        canvas.setFont(BASE, 8)
        canvas.drawString(MARGIN_L + 0.18 * inch, PAGE_H - 1.35 * inch,
            "Hospice Sales Coaching  -  spartanhospicecoaching.com")
        # Main title
        ty = PAGE_H - 2.50 * inch
        canvas.setFillColor(WHITE)
        canvas.setFont(BOLD, 36)
        canvas.drawString(MARGIN_L + 0.18 * inch, ty,              "Why Your Census")
        canvas.drawString(MARGIN_L + 0.18 * inch, ty - 0.55 * inch, "Number Is Not")
        canvas.setFillColor(RED)
        canvas.drawString(MARGIN_L + 0.18 * inch, ty - 1.10 * inch, "Arbitrary")
        # Subtitle
        canvas.setFillColor(RULE_DARK)
        canvas.setFont(BASE, 11.5)
        canvas.drawString(MARGIN_L + 0.18 * inch, ty - 1.68 * inch,
            "The complete picture of who depends on your census,")
        canvas.drawString(MARGIN_L + 0.18 * inch, ty - 1.93 * inch,
            "what they do, why it matters, and what the math means.")
        # Thin rule
        canvas.setStrokeColor(RED)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN_L + 0.18 * inch, ty - 2.20 * inch,
                    PAGE_W - MARGIN_R, ty - 2.20 * inch)
        # Pull quote
        qy = ty - 2.62 * inch
        canvas.setFillColor(MID_LIGHT)
        canvas.setFont(ITAL, 10)
        canvas.drawString(MARGIN_L + 0.18 * inch, qy,
            '"A rep who understands why the number exists sells with conviction.')
        canvas.drawString(MARGIN_L + 0.18 * inch, qy - 0.22 * inch,
            ' A rep who understands who depends on it never needs to be motivated again."')
        # Footer band
        canvas.setFillColor(DARK_MED)
        canvas.rect(0, 0, PAGE_W, 0.65 * inch, fill=1, stroke=0)
        canvas.setFillColor(MID_LIGHT)
        canvas.setFont(BASE, 7.5)
        canvas.drawString(MARGIN_L, 0.27 * inch,
            "A Spartan Coaching Field Education Document  -  Branch Profitability Series")
        canvas.drawRightString(PAGE_W - MARGIN_R, 0.27 * inch,
            "2025 Spartan Coaching  -  For internal training use")
        canvas.restoreState()

    def _inner(self, canvas, doc):
        canvas.saveState()
        pn = doc.page
        canvas.setStrokeColor(RULE_GRAY)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN_L, PAGE_H - 0.52 * inch, PAGE_W - MARGIN_R, PAGE_H - 0.52 * inch)
        canvas.setFillColor(MID_LIGHT)
        canvas.setFont(BASE, 7)
        canvas.drawString(MARGIN_L, PAGE_H - 0.38 * inch, "SPARTAN COACHING")
        canvas.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 0.38 * inch,
            "Why Your Census Number Is Not Arbitrary")
        canvas.setStrokeColor(RULE_GRAY)
        canvas.line(MARGIN_L, 0.52 * inch, PAGE_W - MARGIN_R, 0.52 * inch)
        canvas.setFillColor(MID_LIGHT)
        canvas.setFont(BASE, 7)
        canvas.drawString(MARGIN_L, 0.33 * inch,
            "Branch Profitability Education Series  -  Spartan Coaching")
        canvas.drawRightString(PAGE_W - MARGIN_R, 0.33 * inch, "Page %d" % pn)
        canvas.setFillColor(RED)
        canvas.rect(0.35 * inch, MARGIN_B, 0.025 * inch,
                    PAGE_H - MARGIN_T - MARGIN_B, fill=1, stroke=0)
        canvas.restoreState()


# ---- Style factory ----------------------------------------------------------
def mk(name, **kw):
    return ParagraphStyle(name, **kw)

ST = {
    "body":     mk("body",     fontName=BASE, fontSize=10, leading=16.5,
                   textColor=MID, alignment=TA_JUSTIFY, spaceAfter=8),
    "body_l":   mk("body_l",   fontName=BASE, fontSize=10, leading=16.5,
                   textColor=MID, alignment=TA_LEFT, spaceAfter=8),
    "body_sm":  mk("body_sm",  fontName=BASE, fontSize=9,  leading=14.5,
                   textColor=MID, alignment=TA_JUSTIFY, spaceAfter=6),
    "lede":     mk("lede",     fontName=BASE, fontSize=11.5, leading=18,
                   textColor=DARK_MED, alignment=TA_JUSTIFY,
                   spaceBefore=4, spaceAfter=12),
    "h_pl":     mk("h_pl",     fontName=BOLD, fontSize=8,  leading=12,
                   textColor=RED,  spaceBefore=4, spaceAfter=2),
    "h_pt":     mk("h_pt",     fontName=BOLD, fontSize=22, leading=28,
                   textColor=DARK, spaceBefore=2, spaceAfter=4),
    "h_pt_sub": mk("h_pt_sub", fontName=ITAL, fontSize=11, leading=16,
                   textColor=MID_LIGHT, spaceBefore=0, spaceAfter=16),
    "h_sec":    mk("h_sec",    fontName=BOLD, fontSize=13.5, leading=19,
                   textColor=DARK, spaceBefore=20, spaceAfter=6),
    "h_sub":    mk("h_sub",    fontName=BOLD, fontSize=10.5, leading=15,
                   textColor=DARK, spaceBefore=14, spaceAfter=4),
    "pull":     mk("pull",     fontName=ITAL, fontSize=11.5, leading=18.5,
                   textColor=DARK, alignment=TA_LEFT,
                   spaceBefore=4, spaceAfter=4),
    "pull_sm":  mk("pull_sm",  fontName=ITAL, fontSize=10, leading=16,
                   textColor=MID, alignment=TA_LEFT,
                   spaceBefore=4, spaceAfter=4),
    "toc_t":    mk("toc_t",    fontName=BOLD, fontSize=22, leading=30,
                   textColor=DARK),
    "toc_sec":  mk("toc_sec",  fontName=BOLD, fontSize=9,  leading=14,
                   textColor=RED,  spaceBefore=8, spaceAfter=2),
    "toc_e":    mk("toc_e",    fontName=BASE, fontSize=10, leading=15,
                   textColor=MID, spaceBefore=2, spaceAfter=2),
    "toc_sub":  mk("toc_sub",  fontName=BASE, fontSize=9,  leading=14,
                   textColor=MID_LIGHT, leftIndent=14,
                   spaceBefore=1, spaceAfter=2),
    "toc_pg":   mk("toc_pg",   fontName=BOLD, fontSize=9,
                   textColor=RED,  alignment=TA_RIGHT),
    "th":       mk("th",       fontName=BOLD, fontSize=8.5, leading=12,
                   textColor=WHITE, alignment=TA_LEFT),
    "th_c":     mk("th_c",     fontName=BOLD, fontSize=8.5, leading=12,
                   textColor=WHITE, alignment=TA_CENTER),
    "td":       mk("td",       fontName=BASE, fontSize=9,  leading=14,
                   textColor=MID,  alignment=TA_LEFT),
    "td_r":     mk("td_r",     fontName=BOLD, fontSize=9,  leading=14,
                   textColor=DARK, alignment=TA_LEFT),
    "td_c":     mk("td_c",     fontName=BASE, fontSize=9,  leading=14,
                   textColor=MID,  alignment=TA_CENTER),
    "td_cb":    mk("td_cb",    fontName=BOLD, fontSize=9,  leading=14,
                   textColor=DARK, alignment=TA_CENTER),
    "td_cost":  mk("td_cost",  fontName=BOLD, fontSize=9,  leading=14,
                   textColor=RED_DARK, alignment=TA_RIGHT),
    "tbl_note": mk("tbl_note", fontName=ITAL, fontSize=7.5, leading=11,
                   textColor=MID_LIGHT, alignment=TA_CENTER,
                   spaceBefore=4, spaceAfter=8),
    "cb_lbl":   mk("cb_lbl",   fontName=BOLD, fontSize=7.5, leading=11,
                   textColor=RED,  spaceBefore=0, spaceAfter=3),
    "cb_body":  mk("cb_body",  fontName=BASE, fontSize=9.5, leading=15.5,
                   textColor=DARK_MED, alignment=TA_LEFT),
    "cb_inv":   mk("cb_inv",   fontName=BASE, fontSize=9.5, leading=15.5,
                   textColor=WHITE, alignment=TA_LEFT),
    "cb_big":   mk("cb_big",   fontName=BOLD, fontSize=22, leading=28,
                   textColor=DARK, alignment=TA_CENTER,
                   spaceBefore=4, spaceAfter=4),
    "cb_be":    mk("cb_be",    fontName=BOLD, fontSize=16, leading=22,
                   textColor=DARK, alignment=TA_CENTER,
                   spaceBefore=4, spaceAfter=6),
    "fml_hd":   mk("fml_hd",   fontName=BOLD, fontSize=8, leading=12,
                   textColor=RED,  spaceBefore=0, spaceAfter=4),
    "fml_tx":   mk("fml_tx",   fontName=BOLD, fontSize=10, leading=15,
                   textColor=WHITE, alignment=TA_CENTER),
    "fml_ex":   mk("fml_ex",   fontName=BASE, fontSize=9, leading=14,
                   textColor=RULE_GRAY, alignment=TA_CENTER),
    "bullet":   mk("bullet",   fontName=BASE, fontSize=10, leading=15.5,
                   textColor=MID, leftIndent=14, firstLineIndent=-10,
                   spaceBefore=2, spaceAfter=2, alignment=TA_JUSTIFY),
    "gl_term":  mk("gl_term",  fontName=BOLD, fontSize=9.5, leading=14,
                   textColor=DARK, spaceBefore=8, spaceAfter=2),
    "gl_def":   mk("gl_def",   fontName=BASE, fontSize=9,  leading=14,
                   textColor=MID, spaceBefore=0, spaceAfter=4),
    "lnk":      mk("lnk",      fontName=BOLD, fontSize=9,  leading=13,
                   textColor=RED, alignment=TA_CENTER,
                   spaceBefore=6, spaceAfter=6),
    "scenario": mk("scenario", fontName=ITAL, fontSize=9.5, leading=15,
                   textColor=MID, alignment=TA_LEFT,
                   spaceBefore=2, spaceAfter=2),
}


# ---- Helpers ----------------------------------------------------------------
def SP(n=8): return Spacer(1, n)

def rule(c=RULE_GRAY, t=0.5, b=8, a=8):
    return [SP(b), HRFlowable(width="100%", thickness=t, color=c, spaceAfter=a)]

def red_rule(b=12, a=12): return rule(RED, 1.0, b, a)

def pullquote(text):
    data = [[Paragraph(text, ST["pull"])]]
    t = Table(data, colWidths=[CONTENT_W - 0.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), LIGHT),
        ("LEFTPADDING",   (0,0),(-1,-1), 20),
        ("RIGHTPADDING",  (0,0),(-1,-1), 20),
        ("TOPPADDING",    (0,0),(-1,-1), 16),
        ("BOTTOMPADDING", (0,0),(-1,-1), 16),
        ("LINEBEFORE",    (0,0),(-1,-1), 4, RED),
        ("LINEABOVE",     (0,0),(-1,-1), 0.5, RULE_GRAY),
        ("LINEBELOW",     (0,0),(-1,-1), 0.5, RULE_GRAY),
    ]))
    return [SP(12), t, SP(12)]

def callout(label, paras, bg=LIGHT, border=RED):
    inner = []
    if label:
        inner.append(Paragraph(label, ST["cb_lbl"]))
        inner.append(SP(4))
    inner.extend(paras)
    data = [[inner]]
    t = Table(data, colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), bg),
        ("LEFTPADDING",   (0,0),(-1,-1), 18),
        ("RIGHTPADDING",  (0,0),(-1,-1), 18),
        ("TOPPADDING",    (0,0),(-1,-1), 14),
        ("BOTTOMPADDING", (0,0),(-1,-1), 14),
        ("LINEBEFORE",    (0,0),(-1,-1), 4, border),
        ("LINEABOVE",     (0,0),(-1,-1), 0.5, RULE_DARK),
        ("LINEBELOW",     (0,0),(-1,-1), 0.5, RULE_DARK),
    ]))
    return [SP(12), t, SP(12)]

def dark_callout(label, paras):
    inner = []
    if label:
        inner.append(Paragraph(label, ST["cb_lbl"]))
        inner.append(SP(4))
    inner.extend(paras)
    data = [[inner]]
    t = Table(data, colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK),
        ("LEFTPADDING",   (0,0),(-1,-1), 18),
        ("RIGHTPADDING",  (0,0),(-1,-1), 18),
        ("TOPPADDING",    (0,0),(-1,-1), 14),
        ("BOTTOMPADDING", (0,0),(-1,-1), 14),
        ("LINEBEFORE",    (0,0),(-1,-1), 4, RED),
    ]))
    return [SP(12), t, SP(12)]

def formula_box(formula_text, example_text):
    inner = [
        Paragraph("FORMULA", ST["fml_hd"]),
        SP(6),
        Paragraph(formula_text, ST["fml_tx"]),
        SP(4),
        Paragraph(example_text, ST["fml_ex"]),
    ]
    data = [[inner]]
    t = Table(data, colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK),
        ("LEFTPADDING",   (0,0),(-1,-1), 22),
        ("RIGHTPADDING",  (0,0),(-1,-1), 22),
        ("TOPPADDING",    (0,0),(-1,-1), 16),
        ("BOTTOMPADDING", (0,0),(-1,-1), 16),
        ("LINEBEFORE",    (0,0),(-1,-1), 4, RED),
    ]))
    return [SP(14), t, SP(14)]

def part_header(label, title, subtitle):
    els = [PageBreak()]
    if label:
        els.append(Paragraph(label, ST["h_pl"]))
        els.append(SP(2))
    els.append(Paragraph(title, ST["h_pt"]))
    if subtitle:
        els.append(Paragraph(subtitle, ST["h_pt_sub"]))
    els += rule(RULE_GRAY, 1.0, 0, 16)
    return els

def H(title): return [Paragraph(title, ST["h_sec"])]
def h(title): return [Paragraph(title, ST["h_sub"])]

def two_col(left_els, right_els, l_w=None, r_w=None):
    lw = l_w or CONTENT_W * 0.52
    rw = r_w or CONTENT_W * 0.44
    data = [[left_els, right_els]]
    t = Table(data, colWidths=[lw, rw])
    t.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("TOPPADDING",    (0,0),(-1,-1), 0),
        ("BOTTOMPADDING", (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(0,-1),  14),
    ]))
    return t

def stat_block(label, value, sub, bg=LIGHT2, accent=RED):
    inner = [
        Paragraph(label, mk("_sl", fontName=BOLD, fontSize=7, leading=10,
                             textColor=MID_LIGHT, alignment=TA_CENTER)),
        SP(4),
        Paragraph(value, mk("_sv", fontName=BOLD, fontSize=20, leading=26,
                             textColor=DARK, alignment=TA_CENTER)),
        SP(2),
        Paragraph(sub, mk("_ss", fontName=BASE, fontSize=8, leading=12,
                           textColor=MID_LIGHT, alignment=TA_CENTER)),
    ]
    data = [[inner]]
    t = Table(data, colWidths=[CONTENT_W / 3 - 8])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), bg),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 12),
        ("BOTTOMPADDING", (0,0),(-1,-1), 12),
        ("LINEBELOW",     (0,0),(-1,-1), 3, accent),
    ]))
    return t


# ---- Tables -----------------------------------------------------------------
def clinical_team_table():
    W = CONTENT_W
    cols = [W * 0.22, W * 0.55, W * 0.23]
    header = [
        Paragraph("CLINICAL AND OPERATIONAL ROLE", ST["th"]),
        Paragraph("WHO THEY ARE AND WHAT THEY DO FOR EACH PATIENT", ST["th"]),
        Paragraph("ANNUAL COST", ST["th_c"]),
    ]
    team = [
        ("Executive Director",
         "The leader who sets the standard of care every other person on this list is held to. "
         "Not a title - a daily accountability. Accountable for regulatory compliance, quality "
         "outcomes, and the organizational culture that determines whether a nurse answers a "
         "2 a.m. call with patience or exhaustion, whether a chaplain has the time to truly sit "
         "with a patient or is rushing to the next visit. Every decision about staffing, protocols, "
         "and resources flows through this role - and every one of those decisions touches patients.",
         "$140,000"),
        ("Director of\nClinical Services",
         "The clinical backbone of the branch. Reviews and approves every plan of care before it "
         "reaches a patient's home. Catches medication conflicts, flags symptoms that a case manager "
         "may have missed, and provides the expert oversight that keeps care from becoming routine. "
         "Often the first person a struggling nurse calls at 10 p.m. and the last line of defense "
         "between a patient in distress and a clinical error. The DCS is the reason clinical quality "
         "stays consistent across the entire enrolled census.",
         "$110,000"),
        ("RN Case Manager\n(min. 2; +1 per 12\npatients - Medicare\nrequired)",
         "The most consistent clinical presence in a dying patient's life. Visits twice weekly or "
         "more. Manages pain. Adjusts medications when they stop working. Watches for the early "
         "signs of a crisis and intervenes before it becomes one. Coordinates the aide, the social "
         "worker, the chaplain, and the physician around a single plan tailored to this patient. "
         "Communicates prognosis to families with honesty and compassion. Over weeks or months "
         "of visits, becomes one of the most trusted people a dying person has ever known. "
         "Medicare requires one for every 12 patients on service - this is a federal condition of "
         "participation, not a staffing preference. Below ratio, every clinical relationship suffers.",
         "$100,000\neach"),
        ("Hospice Aide\n(min. 2; +1 per 8\npatients - Medicare\nrequired)",
         "The most frequent visitor in a patient's final days. Provides personal care - bathing, "
         "grooming, oral hygiene, repositioning - and in doing so, preserves human dignity in "
         "the most intimate moments of a person's life. The aide is often the first person to "
         "notice that a patient's pain has changed, that they haven't been eating, that their "
         "breathing is different today. That observation, communicated to the RN, can change a "
         "care plan before the patient suffers unnecessarily. Required at one per 8 patients. "
         "Cannot be deferred or reduced without directly compromising the quality of daily care "
         "for every enrolled patient.",
         "$50,000\neach"),
        ("Licensed Social Worker",
         "Carries the weight a family has been carrying alone for months. Navigates insurance "
         "appeals, financial assistance programs, advance care planning, and the complicated "
         "family dynamics that surface when death becomes imminent. Sits with an exhausted adult "
         "child and tells her that she does not have to manage her father's medications, coordinate "
         "his appointments, and hold the family together all at once - that there is a team now. "
         "Provides grief counseling before death and bereavement support after. Often the reason "
         "a family says, years later, that hospice saved them.",
         "$75,000"),
        ("Chaplain",
         "Provides care for the dimension of dying that medicine cannot reach. The existential "
         "weight of a life ending - the unfinished conversations, the old wounds, the fears that "
         "don't have a clinical name. Shows up without an agenda and sits with whatever the patient "
         "or family needs to say: faith, doubt, regret, gratitude, anger, or silence. Does not "
         "require a religious framework. Does not offer answers. Offers presence. For many patients, "
         "the chaplain is the person they speak most honestly with in the final weeks of their life - "
         "and the person their family remembers most clearly after.",
         "$70,000"),
        ("After-Hours RN",
         "The voice on the other end of the call at 2 a.m. When a patient's breathing changes "
         "and a family member does not know if this is the end, this person answers. Listens. "
         "Assesses. Guides the family through what is happening with expertise and calm. Determines "
         "whether an in-home visit is needed and goes if it is. When budget pressure leads a branch "
         "to eliminate or reduce this role, families call 911. Patients who asked to die at home "
         "end their lives in an emergency department. That is the direct, measurable cost of "
         "insufficient census - and it falls entirely on the patients who trusted the branch.",
         "$95,000"),
        ("Weekend RN",
         "Ensures that the standard of care does not drop on Saturday and Sunday. A patient's "
         "pain does not observe business hours. Symptoms do not pause for the weekend. A family's "
         "fear does not wait until Monday morning. A branch that cannot fund weekend coverage "
         "has patients whose distress goes unaddressed for 48 consecutive hours every single "
         "week - and families who learn that the team they trusted has a two-day gap in its "
         "commitment to them.",
         "$95,000"),
        ("Intake Coordinator",
         "The first human voice a family hears after a physician has said that curative treatment "
         "is no longer the path forward. Receives the referral, guides the family through the "
         "enrollment process, and coordinates the first clinical visit - often within hours. The "
         "warmth, speed, and competence of this interaction forms the family's first impression "
         "of the team that will be present for the rest of their loved one's life. A strong intake "
         "process is the difference between a family who feels held and a family who feels "
         "processed.",
         "$60,000"),
        ("Medical Director\n(Contract)",
         "Certifies that each patient meets hospice eligibility criteria - a gatekeeping function "
         "required by Medicare for every certified hospice. Provides physician-level oversight "
         "of every plan of care. Reviews symptom management protocols. Ensures that the care "
         "each patient receives is medically appropriate, evidence-based, and aligned with their "
         "goals. The clinical authority whose signature backs every treatment decision the "
         "interdisciplinary team makes.",
         "$75,000"),
        ("Secretary /\nAdministrator",
         "The operational infrastructure that makes everything else possible. Scheduling, "
         "documentation management, billing support, office coordination. When this role is "
         "understaffed or absent, clinicians spend their time on paperwork instead of patients. "
         "Visit schedules break down. Billing errors accumulate. The clinical team loses hours "
         "of care time to administrative tasks that were never meant to be theirs.",
         "$55,000"),
    ]
    rows = [header]
    for role, what, cost in team:
        rows.append([
            Paragraph(role, ST["td_r"]),
            Paragraph(what, ST["td"]),
            Paragraph(cost, ST["td_cost"]),
        ])
    t = Table(rows, colWidths=cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0,0), (-1,0),  DARK),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
        ("TOPPADDING",     (0,0), (-1,-1), 9),
        ("BOTTOMPADDING",  (0,0), (-1,-1), 9),
        ("LEFTPADDING",    (0,0), (-1,-1), 8),
        ("RIGHTPADDING",   (0,0), (-1,-1), 8),
        ("VALIGN",         (0,0), (-1,-1), "TOP"),
        ("GRID",           (0,0), (-1,-1), 0.3, RULE_GRAY),
        ("LINEBELOW",      (0,0), (-1,0),  1.0, RED),
    ]))
    return t

def var_cost_table():
    W = CONTENT_W
    cols = [W*0.20, W*0.47, W*0.16, W*0.17]
    header = [
        Paragraph("COST CATEGORY", ST["th"]),
        Paragraph("WHAT IT COVERS", ST["th"]),
        Paragraph("RANGE / DAY", ST["th_c"]),
        Paragraph("BASE PRESET", ST["th_c"]),
    ]
    rows_d = [
        ("Pharmacy",
         "Every medication on the hospice plan of care - opioid pain management, "
         "anti-nausea, anti-anxiety, secretion control, comfort agents, wound care. "
         "The single largest variable cost and the one most sensitive to patient acuity. "
         "An oncology patient with complex pain can reach $80-$100/day on pharmacy alone.",
         "$15-$60", "$22.00"),
        ("Durable Medical Equipment",
         "Hospital bed, wheelchair, commode, oxygen concentrator, bedside table, "
         "and the equipment infrastructure that allows a patient to remain safely "
         "and comfortably at home instead of in a facility.",
         "$6-$15", "$9.00"),
        ("Medical Supplies",
         "Gloves, wound dressings, incontinence products, catheters, oral care "
         "supplies, and the clinical supply bag that accompanies every visit to "
         "every patient's home, every day.",
         "$6-$20", "$8.00"),
        ("Travel and Transportation",
         "Mileage reimbursement and drive-time allocation for every RN, aide, "
         "social worker, and chaplain visit. In rural or geographically dispersed "
         "markets, this line item can become a significant profitability factor.",
         "$4-$12", "$7.00"),
        ("Other Direct Costs",
         "Contracted therapy (PT, OT, speech), lab draws, interpreter services, "
         "and any per-patient clinical expense not captured in the categories above.",
         "$2-$10", "$4.00"),
    ]
    total = [
        Paragraph("TOTAL VARIABLE COST PER PATIENT PER DAY", ST["td_r"]),
        Paragraph("The direct clinical spend that begins the moment a patient is on service - "
                  "before payroll, before overhead, before any margin.", ST["td"]),
        Paragraph("$33-$117", ST["td_cb"]),
        Paragraph("$50.00",   ST["td_cost"]),
    ]
    rows = [header]
    for cat, what, rng, pre in rows_d:
        rows.append([
            Paragraph(cat,  ST["td_r"]),
            Paragraph(what, ST["td"]),
            Paragraph(rng,  ST["td_c"]),
            Paragraph(pre,  ST["td_cb"]),
        ])
    rows.append(total)
    n = len(rows)
    t = Table(rows, colWidths=cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0,0),  (-1,0),   DARK),
        ("BACKGROUND",     (0,n-1),(-1,n-1), RED_LIGHT),
        ("ROWBACKGROUNDS", (0,1),  (-1,n-2), [WHITE, LIGHT]),
        ("TOPPADDING",     (0,0),  (-1,-1),  8),
        ("BOTTOMPADDING",  (0,0),  (-1,-1),  8),
        ("LEFTPADDING",    (0,0),  (-1,-1),  8),
        ("RIGHTPADDING",   (0,0),  (-1,-1),  8),
        ("VALIGN",         (0,0),  (-1,-1),  "TOP"),
        ("GRID",           (0,0),  (-1,-1),  0.3, RULE_GRAY),
        ("LINEBELOW",      (0,0),  (-1,0),   1.0, RED),
        ("LINEABOVE",      (0,n-1),(-1,n-1), 1.0, RED_DARK),
    ]))
    return t

def math_chain_table():
    W = CONTENT_W
    cols = [W*0.05, W*0.27, W*0.68]
    header = [
        Paragraph("#", ST["th_c"]),
        Paragraph("METRIC", ST["th"]),
        Paragraph("WHAT IT MEANS AND HOW IT CONNECTS", ST["th"]),
    ]
    chain = [
        ("1", "Average Daily Census (ADC)",
         "The count of patients actively enrolled and receiving care on any given day. "
         "The single most important operational number in hospice. Every formula in this "
         "section begins with ADC. Every additional patient adds their contribution margin "
         "to the pool that funds the clinical team - every single day they are on service."),
        ("2", "Blended Revenue Per Day",
         "The weighted average per-diem across a patient's enrollment, accounting for the "
         "two-tier CMS rate structure. For LOS above 60 days: ((Day 1-60 Rate x 60) + "
         "(Day 61+ Rate x (LOS - 60))) / LOS. FY 2026 national base rates: $230.83 (Day 1-60) "
         "and $181.94 (Day 61+). Longer average LOS lowers blended revenue per day, which "
         "directly raises the break-even census required."),
        ("3", "Annual Revenue",
         "ADC x Blended Revenue Per Day x 365. The total Medicare RHC revenue the branch "
         "generates at a given census level across a full year. Every cost line that follows "
         "comes out of this number."),
        ("4", "Annual Variable Cost",
         "ADC x Total Variable Cost Per Patient Per Day x 365. The pharmacy, DME, supplies, "
         "travel, and other direct clinical costs that scale with census. These are funded "
         "from revenue before any portion reaches payroll."),
        ("5", "Annual Payroll",
         "The sum of all staff salaries required at that census level, including the "
         "Medicare-mandated scaling roles (RN Case Managers at 1 per 12 patients, Hospice "
         "Aides at 1 per 8) that must increase as census grows. Typically the single largest "
         "cost line and the one most directly connected to the care patients receive."),
        ("6", "Annual Overhead",
         "Monthly non-payroll fixed costs multiplied by 12. Office rent, EMR system, "
         "malpractice insurance, compliance programs, billing software, licensing. These "
         "costs do not change with census - identical whether the branch carries 10 "
         "patients or 150."),
        ("7", "Annual Profit / (Loss)",
         "Revenue minus Variable Cost minus Payroll minus Overhead. The operating income "
         "that remains after every obligation is met. A negative number does not mean "
         "no one is being cared for - it means the organization is spending capital reserves "
         "to fund care that revenue cannot yet cover. That reserve has a finite life."),
        ("8", "Operating Margin %",
         "Annual Profit divided by Annual Revenue, times 100. The industry benchmark for "
         "a financially sustainable hospice branch is 12 to 18 percent. Below 10 percent "
         "the branch is financially fragile with no buffer against census disruption. "
         "Above 20 percent it has capacity to grow, invest, and absorb shocks."),
        ("9", "Break-Even ADC",
         "Annual Fixed Cost divided by (Contribution Margin Per Day x 365). The census "
         "at which revenue exactly covers all costs. The survival floor - the minimum "
         "condition for the team to be fully funded today. Not the goal. Not the destination. "
         "At break-even, the team exists. It cannot grow, train, or withstand disruption."),
        ("10", "Target Margin ADC",
         "Annual Fixed Cost divided by (365 x ((Revenue Per Day x (1 - Target Margin%)) "
         "minus Variable Cost Per Day)). The census where the branch hits its operating "
         "margin goal. This is the actual sales target. The number that moves the branch "
         "from a team that survives today to one that is protected tomorrow."),
    ]
    rows = [header]
    for n, metric, desc in chain:
        rows.append([
            Paragraph(n,      ST["td_cb"]),
            Paragraph(metric, ST["td_r"]),
            Paragraph(desc,   ST["td"]),
        ])
    t = Table(rows, colWidths=cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0,0), (-1,0),  DARK),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [LIGHT, WHITE]),
        ("BACKGROUND",     (0,1), (0,-1),  DARK_MED),
        ("FONTNAME",       (0,1), (0,-1),  BOLD),
        ("TEXTCOLOR",      (0,1), (0,-1),  WHITE),
        ("ALIGN",          (0,0), (0,-1),  "CENTER"),
        ("TOPPADDING",     (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",  (0,0), (-1,-1), 8),
        ("LEFTPADDING",    (0,0), (-1,-1), 8),
        ("RIGHTPADDING",   (0,0), (-1,-1), 8),
        ("VALIGN",         (0,0), (-1,-1), "TOP"),
        ("GRID",           (0,0), (-1,-1), 0.3, RULE_GRAY),
        ("LINEBELOW",      (0,0), (-1,0),  1.0, RED),
    ]))
    return t

def adc_ref_table():
    W = CONTENT_W
    cols = [W*0.14, W*0.17, W*0.18, W*0.17, W*0.15, W*0.19]
    header = [
        Paragraph("TARGET ADC",          ST["th_c"]),
        Paragraph("PATIENT-DAYS / YEAR", ST["th_c"]),
        Paragraph("MONTHLY ADMISSIONS",  ST["th_c"]),
        Paragraph("WEEKLY ADMISSIONS",   ST["th_c"]),
        Paragraph("MARKETERS @8/mo",     ST["th_c"]),
        Paragraph("EST. ANNUAL REVENUE", ST["th_c"]),
    ]
    data = [
        ("30",  "10,950", "~15 / month", "~3.5 / week",  "~2",  "~$2.4M"),
        ("50",  "18,250", "~16.9 / month","~3.9 / week", "~3",  "~$3.9M"),
        ("60",  "21,900", "~20.3 / month","~4.7 / week", "~3",  "~$4.7M"),
        ("80",  "29,200", "~27.0 / month","~6.2 / week", "~4",  "~$6.3M"),
        ("100", "36,500", "~33.8 / month","~7.8 / week", "~5",  "~$7.9M"),
    ]
    rows = [header]
    for row in data:
        rows.append([Paragraph(c, ST["td_cb"] if i==0 else ST["td_c"])
                     for i, c in enumerate(row)])
    t = Table(rows, colWidths=cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0,0), (-1,0),  DARK),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
        ("TOPPADDING",     (0,0), (-1,-1), 7),
        ("BOTTOMPADDING",  (0,0), (-1,-1), 7),
        ("LEFTPADDING",    (0,0), (-1,-1), 7),
        ("RIGHTPADDING",   (0,0), (-1,-1), 7),
        ("VALIGN",         (0,0), (-1,-1), "MIDDLE"),
        ("GRID",           (0,0), (-1,-1), 0.3, RULE_GRAY),
        ("LINEBELOW",      (0,0), (-1,0),  1.0, RED),
    ]))
    return t

def simulator_table():
    W = CONTENT_W
    cols = [W*0.24, W*0.35, W*0.41]
    header = [
        Paragraph("INPUT CATEGORY", ST["th"]),
        Paragraph("WHAT YOU ENTER",  ST["th"]),
        Paragraph("WHAT IT GENERATES", ST["th"]),
    ]
    rows_d = [
        ("Census and LOS",
         "Target ADC, Average Length of Stay",
         "Blended revenue per day, monthly and weekly admissions required to hold census"),
        ("Revenue Rates",
         "RHC Day 1-60, RHC Day 61+ (FY 2026 national base: $230.83 / $181.94)",
         "Annual revenue at target ADC, precise blended per-diem for your patient mix"),
        ("Variable Costs",
         "Pharmacy, DME, supplies, travel, other - per patient per day",
         "Contribution margin per patient per day, total annual variable cost"),
        ("Staffing Structure",
         "All staff roles with salary inputs, scaling triggers",
         "Annual payroll, required headcount at target ADC, staffing cost by role"),
        ("Operating Overhead",
         "Monthly non-payroll fixed costs",
         "Annual overhead, total annual fixed cost"),
        ("Target Margin",
         "Desired operating margin percentage",
         "Target Margin ADC - the census required to reach your financial goal"),
        ("Starting Capital",
         "Cash available at launch",
         "18-month cash runway projection with break-even crossing month"),
        ("Sales Assumptions",
         "New admissions per marketer per month",
         "Number of marketers required to generate the admissions needed"),
    ]
    rows = [header]
    for cat, inp, out in rows_d:
        rows.append([Paragraph(cat, ST["td_r"]),
                     Paragraph(inp, ST["td"]),
                     Paragraph(out, ST["td"])])
    t = Table(rows, colWidths=cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0,0), (-1,0),  DARK),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, LIGHT]),
        ("TOPPADDING",     (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",  (0,0), (-1,-1), 8),
        ("LEFTPADDING",    (0,0), (-1,-1), 8),
        ("RIGHTPADDING",   (0,0), (-1,-1), 8),
        ("VALIGN",         (0,0), (-1,-1), "TOP"),
        ("GRID",           (0,0), (-1,-1), 0.3, RULE_GRAY),
        ("LINEBELOW",      (0,0), (-1,0),  1.0, RED),
    ]))
    return t


# ---- TOC --------------------------------------------------------------------
def toc_els():
    els = []
    els.append(Paragraph("CONTENTS", ST["h_pl"]))
    els.append(SP(4))
    els.append(Paragraph("Table of Contents", ST["toc_t"]))
    els += rule(RED, 1.0, 0, 14)
    sections = [
        ("Opening",           "The Moment It Becomes Real",
         "One patient's story. The whole point.",                          "3"),
        ("Before the Numbers","The Covenant of Care",
         "What it means when a patient chooses hospice - and what they are owed in return.", "4"),
        ("Part One",          "The Most Influential People in the Dying Process",
         "Who they are, what they do, and what it costs to have them at full strength.",     "6"),
        ("Part Two",          "The Daily Cost Reality",
         "The math of what it costs to care for each patient before payroll is paid.",       "11"),
        ("Part Three",        "The Numbers That Should Have Been Explained on Day One",
         "Break-even, target margin, and why your census goal is exactly what it is.",       "14"),
        ("Part Four",         "Reading the Field Differently",
         "How understanding this changes every referral conversation you will have.",        "19"),
        ("The Spartan Simulator", "A Live Model of Your Branch",
         "What the tool computes, how to read it, and how to use it in the field.",          "22"),
        ("Closing",           "The Census Is Not the Point. The Care Is.",
         "The only thing a hospice sales rep needs to remember.",                            "24"),
        ("Reference",         "Key Terms Glossary",
         "Plain-language definitions for every metric and formula in this document.",        "25"),
    ]
    for part, title, desc, page in sections:
        row = [[Paragraph(part, ST["toc_sec"]),
                Paragraph(page, ST["toc_pg"])]]
        t = Table(row, colWidths=[CONTENT_W * 0.85, CONTENT_W * 0.15])
        t.setStyle(TableStyle([
            ("VALIGN",        (0,0),(-1,-1), "BOTTOM"),
            ("LEFTPADDING",   (0,0),(-1,-1), 0),
            ("RIGHTPADDING",  (0,0),(-1,-1), 0),
            ("TOPPADDING",    (0,0),(-1,-1), 0),
            ("BOTTOMPADDING", (0,0),(-1,-1), 0),
        ]))
        els.append(t)
        els.append(Paragraph(title, ST["toc_e"]))
        els.append(Paragraph(desc,  ST["toc_sub"]))
        els += rule(RULE_GRAY, 0.3, 4, 4)
    return els


# ---- Glossary ---------------------------------------------------------------
def glossary_els():
    terms = [
        ("Average Daily Census (ADC)",
         "The number of patients actively enrolled in and receiving hospice care on any given "
         "day. The single most important operational metric in hospice and the starting point "
         "for every financial calculation in this document."),
        ("Routine Home Care (RHC)",
         "The standard Medicare hospice level of care, paid as a flat daily per-diem. Two rates "
         "apply under FY 2026: $230.83 per day for days 1-60 and $181.94 per day for day 61 and "
         "beyond (national base rates, before wage index adjustment, for hospices submitting "
         "required quality data). Actual rates vary by geographic wage index."),
        ("Contribution Margin Per Day",
         "Blended RHC per-diem minus all direct variable costs per patient per day. The amount "
         "each enrolled patient contributes toward the fixed costs (payroll and overhead) that "
         "sustain the clinical team. Formula: Blended Revenue Per Day minus Total Variable "
         "Cost Per Day."),
        ("Blended Revenue Per Day",
         "The weighted average per-diem across a patient's enrollment, accounting for the mix "
         "of Day 1-60 and Day 61+ rates based on average length of stay. For LOS above 60 days: "
         "((Day 1-60 Rate x 60) + (Day 61+ Rate x (LOS - 60))) / LOS."),
        ("Break-Even ADC",
         "The census level at which total revenue exactly covers all costs, leaving zero profit. "
         "Formula: Annual Fixed Cost divided by (Contribution Margin Per Day x 365). The survival "
         "floor - not the goal. At break-even the clinical team is fully funded today but the branch "
         "cannot invest in retention, quality improvement, or disruption resilience."),
        ("Target Margin ADC",
         "The census level at which the branch hits its operating margin goal. Formula: Annual Fixed "
         "Cost divided by (365 x ((Revenue Per Day x (1 - Target Margin%)) minus Variable Cost Per "
         "Day)). The real sales target. The number that moves the branch from surviving to sustainable."),
        ("Operating Margin %",
         "Annual Profit divided by Annual Revenue, times 100. Industry benchmark for financial "
         "sustainability: 12-18 percent. Below 10 percent is considered fragile. This margin funds "
         "staff retention, equipment maintenance, quality programs, and the buffer needed to absorb "
         "census disruptions without cutting the clinical team."),
        ("Cash Runway",
         "The number of months a branch can sustain operations from starting capital before reaching "
         "break-even. Modeled using a linear ADC ramp over 18 months. A planning tool - actual runway "
         "depends on ramp speed, hiring timing, and market conditions."),
        ("Monthly Admissions Needed",
         "New patient admissions required per month to maintain a target ADC, given average length "
         "of stay. Formula: (Target ADC x 365) divided by Average LOS (days), divided by 12. This "
         "is the admission flow required to replace patients dying and being discharged at the other "
         "end of the census - not an activity standard invented by management."),
        ("Medicare Conditions of Participation",
         "Federal regulatory requirements a hospice must meet to maintain Medicare certification. "
         "Includes mandatory staffing ratios (minimum 1 RN Case Manager per 12 patients; minimum 1 "
         "Hospice Aide per 8 patients), required service disciplines, and documentation standards. "
         "These requirements apply at every census level. 42 CFR Part 418."),
    ]
    els = []
    for term, defn in terms:
        els.append(Paragraph(term, ST["gl_term"]))
        els.append(Paragraph(defn, ST["gl_def"]))
        els += rule(RULE_GRAY, 0.3, 2, 0)
    return els


# ---- Story ------------------------------------------------------------------
def build_story():
    s = []

    # =========================================================================
    # OPENING
    # =========================================================================
    s.append(NextPageTemplate("toc"))
    s.append(PageBreak())
    s += toc_els()

    s.append(NextPageTemplate("body"))

    # Opening: The Moment It Becomes Real
    s += part_header(
        "OPENING",
        "The Moment It Becomes Real",
        "One patient. One family. The whole point.",
    )

    s.append(Paragraph(
        "Her name was Margaret. She was 74, and she had been fighting pancreatic cancer for "
        "eleven months before her oncologist sat down with her family and said the words no one "
        "had been willing to say out loud: that the treatment was no longer working, that the "
        "side effects were compounding faster than the benefits, and that it was time to talk "
        "about a different kind of care.",
        ST["lede"]))

    s.append(Paragraph(
        "Margaret's daughter, Claire, made the call to hospice on a Tuesday afternoon. She "
        "had been managing her mother's medications, attending every appointment, coordinating "
        "between the oncology team and the cardiologist and the palliative care nurse, while "
        "also working full time and raising two children. She had not slept more than five hours "
        "in three months. When the intake coordinator answered the phone, she started crying "
        "before she could finish her first sentence.",
        ST["body"]))

    s.append(Paragraph(
        "What happened next - what hospice made possible for Margaret and for Claire - was not "
        "an administrative process. It was the deployment of a full clinical team around a single "
        "family at the hardest point in their lives. The RN Case Manager arrived within four "
        "hours. She reviewed Margaret's medications, identified two that were causing unnecessary "
        "side effects, and adjusted the pain management protocol before she left. The hospice aide "
        "came the next morning and helped Margaret bathe - the first time in three weeks she had "
        "been able to do so comfortably. The social worker met with Claire that afternoon and spent "
        "two hours helping her understand that she was allowed to stop being Margaret's care "
        "coordinator and start being her daughter again.",
        ST["body"]))

    s.append(Paragraph(
        "The chaplain came on Thursday. He did not bring a script or a theology. He sat with "
        "Margaret for an hour and listened to her talk about her late husband, her garden, and "
        "the fact that she had never told her sister she was sorry for a fight they had twenty "
        "years ago. He helped her make that call.",
        ST["body"]))

    s.append(Paragraph(
        "Margaret died at home six weeks later, in her own bed, with Claire holding one hand and "
        "the hospice nurse holding the other. The after-hours RN had arrived at 11 p.m. when her "
        "breathing changed, had guided the family through what was happening with such steadiness "
        "that Claire later said she had not been afraid. She had been present.",
        ST["body"]))

    s += pullquote(
        '"That is what a hospice branch actually does. Not what the brochure says it does - '
        'what it actually does, in real homes, with real families, on the real worst days of '
        'their lives. And every single element of that care - the nurse, the aide, the social '
        'worker, the chaplain, the after-hours clinician - is funded by one thing: the census."')

    s.append(Paragraph(
        "Margaret was one patient on one branch's census. When she enrolled, she added her "
        "contribution margin to the pool that paid the team around her. When the branch had "
        "enough Margarets on service, the after-hours RN could answer every call. When it did "
        "not, that call went to voicemail - or to 911.",
        ST["body"]))

    s.append(Paragraph(
        "This document is about the number that made Margaret's care possible. Where it comes "
        "from. What it mathematically requires. Who depends on it. And why a rep who truly "
        "understands what that number means never needs to be motivated again.",
        ST["body"]))

    # =========================================================================
    # BEFORE THE NUMBERS: THE COVENANT
    # =========================================================================
    s += part_header(
        "BEFORE THE NUMBERS",
        "The Covenant of Care",
        "What it means when a patient chooses hospice - and what they are owed in return.",
    )

    s.append(Paragraph(
        "At some point early in your hospice sales career, someone gave you a number. Eight "
        "admissions a month. Twelve. An ADC of 60 by Q3. The number almost certainly arrived "
        "without an explanation of where it came from, what it mathematically requires, or "
        "what it means for the people your branch exists to serve.",
        ST["body"]))

    s.append(Paragraph(
        "This document provides that explanation in full - not just the math, though the math "
        "is here in complete detail, but the human reality that the math exists to sustain. Because "
        "a rep who understands why the number exists sells with a different kind of conviction. "
        "And a rep who truly understands who depends on it never needs to be motivated again.",
        ST["body"]))

    s += H("An Act of Trust Unlike Almost Any Other in Medicine")

    s.append(Paragraph(
        "When a patient's physician delivers the recommendation to transition to hospice, "
        "something profound and irreversible happens. A family that has been fighting - "
        "navigating treatment options, managing side effects, coordinating specialists, trying "
        "to hold everything together through months or years of illness - is asked to stop "
        "fighting and start receiving. To put down the weapons of curative medicine and accept "
        "something harder and more honest: that the goal is now comfort, dignity, and the "
        "quality of the time that remains.",
        ST["body"]))

    s.append(Paragraph(
        "To do that, the family must trust a team of people they have never met. They are "
        "asked to believe - without the ability to verify it in advance - that a nurse will "
        "show up when the pain becomes unmanageable at 2 a.m. That an aide will help their "
        "father bathe with dignity when he can no longer do it himself. That a social worker "
        "will carry some of the weight they have been carrying alone. That a chaplain will sit "
        "with their mother and let her say whatever she needs to say, without agenda, without "
        "judgment, without a script.",
        ST["body"]))

    s.append(Paragraph(
        "That is not an administrative enrollment. That is not the activation of a Medicare benefit. "
        "That is a covenant - a family placing the most sacred chapter of their lives in the hands "
        "of strangers and trusting that those strangers will be worthy of it.",
        ST["body"]))

    s += pullquote(
        '"They are not choosing a provider. They are placing their life and their death '
        'in the care of a team they have never met. That team exists because the census '
        'is high enough to sustain it."')

    s.append(Paragraph(
        "Your census - the count of patients actively on service at any given moment - is the "
        "financial expression of that covenant. It is what funds the team those patients trusted. "
        "It pays their salaries every two weeks. It puts the medications in the nursing bags, "
        "the equipment in the patient's room, and the fuel in the car that gets the aide there "
        "at 8 a.m. Without sufficient census, the team cannot exist at full capacity. Without "
        "that team at full capacity, the patients who placed their trust in your branch do not "
        "receive the care they were promised. It is that direct. It is that consequential.",
        ST["body"]))

    s += H("The Scale of the Trust")

    s.append(Paragraph(
        "Most patients who enroll in hospice are in the final weeks or months of their lives. "
        "Many have never experienced this level of care before. They have spent years in a "
        "healthcare system designed for diagnosis, treatment, and recovery - a system that "
        "can feel impersonal, transactional, and oriented around their disease rather than "
        "their person. Hospice is different. It is one of the only corners of American healthcare "
        "built entirely around the patient as a human being with a life, a history, relationships, "
        "fears, and hopes that exist beyond their diagnosis.",
        ST["body"]))

    s.append(Paragraph(
        "The team that arrives in a patient's home is not there to treat their disease. "
        "They are there to walk alongside them through the end of it - to manage pain, "
        "to provide comfort, to support the family, and to make it possible for the patient "
        "to experience whatever remains of their life with as much dignity, peace, and "
        "connection as possible. That is a profound responsibility. It is also a profound "
        "privilege - one that the clinical team carries consciously and that shapes everything "
        "about how they do their work.",
        ST["body"]))

    s += callout(
        "THE NUMBER IS NOT A QUOTA",
        [Paragraph(
            "The census goal you were given is not a business metric dressed up as a sales target. "
            "It is the minimum condition under which the most influential people in the dying "
            "process - the people who make that covenant real for every enrolled patient - can "
            "actually do their jobs at full capacity. Below that number, the team is incomplete "
            "or underfunded. Above it, the branch can invest in keeping them, developing them, "
            "and extending their reach into a community that needs them.",
            ST["cb_body"])],
        bg=RED_LIGHT, border=RED)

    # =========================================================================
    # PART ONE
    # =========================================================================
    s += part_header(
        "PART ONE",
        "The Most Influential People in the Dying Process",
        "Every line in a hospice payroll is a person - with training, credentials, clinical "
        "relationships, and the daily weight of being present with the dying and their families.",
    )

    s.append(Paragraph(
        "The phrase 'most influential people in the dying process' is not marketing language. "
        "It is a clinical and human reality. Research on end-of-life care consistently shows "
        "that the quality of a patient's death - how much pain they experience, how afraid they "
        "are, how connected they feel to the people who love them, whether they are able to "
        "say and hear the things they need to say and hear - is shaped more by the quality "
        "and consistency of their care team than by any other single factor.",
        ST["body"]))

    s.append(Paragraph(
        "That team costs money. Real money, paid every two weeks, regardless of census. "
        "Understanding your branch's financial model begins with understanding not just what "
        "these roles cost but who these people are, what they do, and what it means when "
        "the census is not high enough to fund them fully.",
        ST["body"]))

    s += H("The Interdisciplinary Team - Required by Federal Law, Funded by Census")

    s.append(Paragraph(
        "Medicare Conditions of Participation require every certified hospice to maintain an "
        "interdisciplinary team that includes at minimum a physician, registered nurse, social "
        "worker, and spiritual care provider. These are not optional roles. They are the legal "
        "and clinical infrastructure of a hospice license. They exist on your payroll before "
        "the first patient enrolls and they remain there regardless of census - paid every two "
        "weeks whether the branch has 10 patients or 80.",
        ST["body"]))

    s.append(Paragraph(
        "What changes with census is not whether the team exists, but whether it exists at "
        "full strength. Whether there are enough RN Case Managers to truly know each patient "
        "rather than manage each chart. Whether the aides have caseloads that allow them to "
        "spend real time at the bedside or are stretched so thin that visits get shorter. "
        "Whether the chaplain has hours to sit with patients or is running from one visit to "
        "the next with no margin for the kind of presence that actually matters. Census is "
        "what determines the difference.",
        ST["body"]))

    s.append(SP(8))
    s.append(clinical_team_table())
    s.append(Paragraph(
        "Annual salary estimates reflect typical ranges for fully qualified, experienced clinicians. "
        "Scaling roles grow with census by Medicare Conditions of Participation (42 CFR Part 418). "
        "All roles are paid biweekly regardless of census level.",
        ST["tbl_note"]))

    s += H("What the Staffing Table Does Not Show")

    s.append(Paragraph(
        "A salary figure on a spreadsheet captures what a role costs. It does not capture what "
        "that role does. It does not capture the RN Case Manager who memorized the names of a "
        "patient's grandchildren and asked about them every visit because she knew it mattered. "
        "The hospice aide who noticed that a patient had stopped eating and flagged it to the "
        "nurse before it became a crisis. The social worker who spent an extra hour with a "
        "family after a difficult prognosis conversation because no one else had the training "
        "to do what the moment required.",
        ST["body"]))

    s.append(Paragraph(
        "These are not exceptional moments. They are the standard of care that a fully funded, "
        "fully staffed hospice team delivers every day to every patient on its census. They are "
        "what a family gets when the branch is financially healthy enough to hire the right "
        "people, retain them, and give them the caseloads that allow this kind of attention. "
        "And they are what a family loses - gradually, invisibly - when census falls and "
        "something in the clinical infrastructure has to give.",
        ST["body"]))

    s += pullquote(
        '"The staffing table shows you what the team costs. The patient\'s experience shows you '
        'what it is worth."')

    s += H("When Census Falls: The Human Cost Nobody Names")

    s.append(Paragraph(
        "When census drops below the level needed to sustain the team at full strength, the "
        "consequences do not announce themselves. They accumulate quietly. Leadership delays "
        "backfilling a departing RN because the financial pressure is real and the timing is "
        "hard. The remaining case managers absorb the extra patients. Visit lengths get shorter. "
        "Assessments become less thorough because there is simply less time. The hospice aide "
        "carries two more patients than she should because no one wants to admit the staffing "
        "model is strained.",
        ST["body"]))

    s.append(Paragraph(
        "After-hours coverage gets stretched. The chaplain's hours get cut. The social worker "
        "skips a follow-up call because she has three more urgent situations ahead of it. "
        "Training budgets disappear. Merit raises get deferred. The experienced clinicians "
        "who could earn more elsewhere start quietly looking, because they can feel the pressure "
        "even when no one names its source.",
        ST["body"]))

    s.append(Paragraph(
        "The patients enrolled during this period do not receive objectively worse care - "
        "they receive care from the same professionals who are committed to this work. But "
        "they receive a version of it that is thinner, less consistent, more reactive and "
        "less proactive. They may not know the difference. But their families do, even if "
        "they cannot name it. And the clinical team does - and carries that weight home "
        "every night.",
        ST["body"]))

    s += callout(
        "THE COST OF INSUFFICIENT CENSUS DOES NOT SHOW UP ON A BALANCE SHEET",
        [Paragraph(
            "It shows up at the bedside. In the call that went to voicemail at 2 a.m. "
            "In the visit that was fifteen minutes shorter than it should have been. "
            "In the conversation that needed to happen with that family but could not because "
            "there was no one with the time and the training to have it. "
            "In the patient who asked to die at home and ended up in an emergency department "
            "because the after-hours coverage was not there when it mattered.",
            ST["cb_body"])],
        bg=RED_LIGHT, border=RED)

    s += H("The Sales Rep - The Economic Engine Behind the Mission")

    s.append(Paragraph(
        "Every person on the team described above - the nurse, the aide, the chaplain, "
        "the social worker, the coordinator who answers the phone on the first ring - "
        "has a job because someone built a census. That someone is you.",
        ST["body"]))

    s.append(Paragraph(
        "The hospice sales rep is not a peripheral function. Not a liaison. Not a "
        "relationship builder who passes names to intake and considers the work done. "
        "The rep is the economic engine that funds the mission. Every admission generated "
        "is a patient who receives expert, compassionate, coordinated end-of-life care "
        "instead of a frightened family navigating a crisis alone. Every referral "
        "relationship built and sustained is a pipeline of future patients who will "
        "receive that same care.",
        ST["body"]))

    s.append(Paragraph(
        "And every time the connection is not made - every time a referral does not "
        "come through, a follow-up does not happen, a patient who would have benefited "
        "from hospice does not get enrolled - the census does not grow, and the team "
        "funded by that census stays exactly where it is while its operational demands "
        "remain unchanged. There is no neutral in hospice sales. Every conversation "
        "either moves the census forward or leaves the gap in place.",
        ST["body"]))

    s += pullquote(
        '"You are not selling a service. You are connecting the people who need this team '
        'to the team that needs them. Every admission is a patient who gets Margaret\'s '
        'experience instead of a hospital room."')

    # =========================================================================
    # PART TWO
    # =========================================================================
    s += part_header(
        "PART TWO",
        "The Daily Cost Reality",
        "What it costs to care for each patient, every day - before a single salary is paid.",
    )

    s.append(Paragraph(
        "The Medicare Routine Home Care per-diem arrives as a flat daily rate - the same "
        "dollar amount whether the patient had a crisis visit last night or a routine aide "
        "visit this morning, whether the RN spent thirty minutes or two hours. Before that "
        "per-diem reaches payroll, a significant portion is consumed by the direct clinical "
        "costs incurred for each patient on each day of service. These are not administrative "
        "line items. They are the medications, equipment, supplies, and travel that make "
        "clinical care physically possible.",
        ST["body"]))

    s += H("The FY 2026 Revenue Structure")

    s.append(Paragraph(
        "Medicare pays Routine Home Care at two rates based on how many days a patient has "
        "been enrolled in the current benefit period. The FY 2026 national base rates are:",
        ST["body"]))

    s += callout(
        "FY 2026 MEDICARE ROUTINE HOME CARE - NATIONAL BASE RATES",
        [
            Paragraph(
                "Day 1-60:  $230.83 per patient per day (for hospices submitting required quality data)",
                ST["cb_body"]),
            SP(4),
            Paragraph(
                "Day 61+:  $181.94 per patient per day (for hospices submitting required quality data)",
                ST["cb_body"]),
            SP(8),
            Paragraph(
                "These are national base rates before geographic wage index adjustment. Your actual "
                "contracted rate will vary by CBSA. FY 2026 represents a 2.6% payment update from "
                "FY 2025. For planning purposes, these base rates provide a conservative benchmark. "
                "Branches with higher average length of stay carry a structurally lower blended "
                "revenue per day, which directly increases the break-even census required.",
                ST["body_sm"]),
        ],
        bg=LIGHT2, border=DARK)

    s.append(Paragraph(
        "The two-tier rate structure is one of the most important financial facts in hospice "
        "that most sales reps never fully internalize. When a patient's average length of stay "
        "exceeds 60 days, the blended revenue per day drops - because a growing share of their "
        "patient-days falls into the lower Day 61+ rate. A branch with a 90-day average LOS "
        "earns a meaningfully lower blended per-diem than one with a 60-day average LOS, "
        "which means it needs a higher census to generate the same annual revenue. Length "
        "of stay mix is a core driver of the break-even number - not just an operational detail.",
        ST["body"]))

    s.append(Paragraph(
        "Understanding this also clarifies something about your referral mix. Earlier hospice "
        "referrals - patients enrolled with more time remaining - generate more patient-days "
        "at the higher Day 1-60 rate. They also receive more of the interdisciplinary care "
        "that hospice is designed to deliver. The financial incentive and the clinical incentive "
        "point in exactly the same direction: earlier is better, for the patient and for the branch.",
        ST["body"]))

    s += H("Variable Clinical Costs - What the Per-Diem Pays For First")

    s.append(Paragraph(
        "Before payroll, before overhead, before any operating income, the branch must fund "
        "the direct clinical cost of caring for each patient each day. These costs begin the "
        "moment a patient is on service:",
        ST["body"]))

    s.append(SP(8))
    s.append(var_cost_table())
    s.append(Paragraph(
        "Base preset reflects national average acuity. Oncology, complex pain, or wound-heavy "
        "patients can reach $80-$120/day in variable costs. Variable costs scale with census - "
        "every patient on service generates these costs every single day.",
        ST["tbl_note"]))

    s += H("Contribution Margin - What Remains for the Team in Part One")

    s.append(Paragraph(
        "After subtracting all direct variable costs from the blended RHC per-diem, what "
        "remains is the contribution margin per patient per day. This is the amount each "
        "enrolled patient contributes toward the payroll and overhead that fund the "
        "interdisciplinary team. It is the bridge between the revenue a patient generates "
        "and the care infrastructure that serves them.",
        ST["body"]))

    s += callout(
        "TYPICAL CONTRIBUTION MARGIN RANGE (FY 2026)",
        [
            Paragraph("$145 to $180 per patient per day", ST["cb_big"]),
            Paragraph(
                "At FY 2026 national base RHC rates with standard variable costs and a typical "
                "90-day average LOS, most hospice branches operate with a contribution margin "
                "between $145 and $180 per patient per day. The Spartan simulator calculates "
                "your exact figure based on your actual rates, variable costs, and LOS. Every "
                "patient on service generates this amount toward fixed costs every single day.",
                ST["cb_body"]),
        ],
        bg=LIGHT2, border=RED)

    s.append(Paragraph(
        "This single number connects every patient on your census to every person on the "
        "clinical team. Each enrolled patient contributes their margin every day toward "
        "the nurse's salary, the aide's wage, the chaplain's hours, and the after-hours "
        "coverage that answers at 2 a.m. Every patient not enrolled is that amount, "
        "every day, that does not exist.",
        ST["body"]))

    s.append(Paragraph(
        "It is worth sitting with that for a moment. When a patient who would have benefited "
        "from hospice does not enroll - because a referral was not made, because a follow-up "
        "did not happen, because the conversation was deferred - the branch does not just lose "
        "revenue. A specific family loses the nurse who would have managed their loved one's "
        "pain before it became a crisis. A specific patient loses the aide who would have "
        "helped them bathe with dignity. A specific daughter loses the social worker who would "
        "have told her she did not have to do this alone.",
        ST["body"]))

    s += pullquote(
        '"Building and maintaining census is not a sales function disconnected from clinical '
        'care. It is the precondition for clinical care to exist at full strength."')

    # =========================================================================
    # PART THREE
    # =========================================================================
    s += part_header(
        "PART THREE",
        "The Numbers That Should Have Been Explained on Day One",
        "The complete math behind break-even, target margin, and why your census goal is "
        "exactly what it is.",
    )

    s.append(Paragraph(
        "Everything in the first two sections leads to this: the financial formulas that "
        "connect a specific census number to the ability to maintain the clinical team at "
        "full strength. These calculations are not complicated. They are simply never "
        "explained to the people whose daily work determines whether the results come true.",
        ST["body"]))

    s.append(Paragraph(
        "By the end of this section, you will know exactly why your census goal is the number "
        "it is - and you will never need to be told what it means again.",
        ST["body"]))

    s += H("The Formula Chain: From Census to Sustainability")
    s.append(SP(6))
    s.append(math_chain_table())
    s.append(SP(8))

    s += H("The Blended Revenue Formula - Why LOS Changes Everything")

    s.append(Paragraph(
        "The most misunderstood financial mechanic in hospice is the impact of average "
        "length of stay on blended revenue per day. It is not intuitive - and it is "
        "one of the most important drivers of break-even ADC.",
        ST["body"]))

    s += formula_box(
        "Blended Revenue = ((Day1Rate x 60) + (Day61Rate x (LOS - 60))) / LOS",
        "FY 2026 Example: LOS=90 days: ((230.83 x 60) + (181.94 x 30)) / 90 = $214.53 per patient per day"
    )

    s.append(Paragraph(
        "At a 90-day average LOS with FY 2026 national base rates, the blended revenue per "
        "patient per day is approximately $214.53 - not the Day 1-60 rate of $230.83. That "
        "difference of $16.30 per patient per day compounds across an entire census. At "
        "ADC 60, it represents over $356,000 per year in revenue that the Day 1-60 rate "
        "alone would have generated but the blend does not. The break-even ADC must be "
        "calculated using the blended figure - not either base rate in isolation.",
        ST["body"]))

    s += H("Break-Even ADC - The Floor, Not the Finish Line")

    s.append(Paragraph(
        "Break-even is the census level at which total annual revenue exactly covers all "
        "costs - variable costs, payroll, overhead - with precisely zero left over. At "
        "break-even, the clinical team is fully funded. Every nurse is paid. Every "
        "medication is purchased. Every scheduled visit happens. The patients currently "
        "on service are receiving the care they were promised.",
        ST["body"]))

    s.append(Paragraph(
        "What break-even cannot fund: merit increases for the clinical staff who have "
        "proven themselves and could earn more elsewhere. Education and certification for "
        "clinicians who want to grow. Quality improvement initiatives that elevate the "
        "standard of care. Equipment upgrades before the existing equipment fails a patient. "
        "The recruiting bonus that attracts an experienced RN when a key case manager departs. "
        "Any reserve against a sudden census disruption.",
        ST["body"]))

    s.append(Paragraph(
        "Break-even means the team exists today. It says nothing about whether the team "
        "will still be whole six months from now - and in hospice, the clinical team is "
        "the product. There is no hospice without it.",
        ST["body"]))

    s += formula_box(
        "Break-Even ADC = Annual Fixed Cost / (Contribution Per Day x 365)",
        "Example: $2,561,000 Fixed Cost / ($161.53 Contribution/Day x 365) = ADC 43.4"
    )

    s += callout(
        "TYPICAL BREAK-EVEN RANGE (FY 2026 NATIONAL BASE RATES)",
        [
            Paragraph("ADC 37 to 45 (Base Preset Assumptions)", ST["cb_be"]),
            Paragraph(
                "Using FY 2026 national base RHC rates, standard variable costs, and a lean but "
                "complete staffing structure, most new hospice branches hit break-even somewhere "
                "between ADC 37 and ADC 45 - depending on local overhead, wage rates, and patient "
                "acuity mix. Below break-even, the branch is depleting capital reserves every "
                "patient-day. The clinical team is present and serving. But the balance sheet "
                "is running out.",
                ST["cb_body"]),
        ],
        bg=LIGHT2, border=DARK)

    s += H("Target Margin ADC - The Real Sales Goal")

    s.append(Paragraph(
        "Every hospice branch operates with a target operating margin - typically 12 to 18 "
        "percent of annual revenue. This margin is not profit extracted from patient care. "
        "It is the financial capacity that allows the organization to sustain the things "
        "break-even cannot fund.",
        ST["body"]))

    s.append(Paragraph(
        "A branch operating at 14 percent margin can replace an aging hospital bed before it "
        "breaks in a patient's room at 11 p.m. It can give a senior case manager the pay "
        "increase she has earned before she accepts an offer from a competing agency. It can "
        "fund the certification program that turns a good aide into an exceptional one. It "
        "can absorb a 10-patient census drop without immediately reducing clinical staff - "
        "giving leadership time to rebuild the census rather than cutting the team that "
        "makes the census worth having.",
        ST["body"]))

    s.append(Paragraph(
        "The Target Margin ADC is the census required to reach that goal. It is always higher "
        "than break-even - often by 12 to 20 patients, depending on the branch's cost "
        "structure. The gap between break-even ADC and target margin ADC is the sales gap. "
        "It is the specific number of additional patients whose admissions move the branch "
        "from surviving to sustainable.",
        ST["body"]))

    s += formula_box(
        "Target Margin ADC = Fixed Cost / (365 x ((Revenue/Day x (1 - Margin%)) - VarCost/Day))",
        "Example: $2,561,000 / (365 x ($214.53 x 0.85 - $53)) = ADC 54.2 at 15% target margin"
    )

    s += pullquote(
        '"The gap between break-even ADC and target margin ADC is the sales gap. '
        'That is the number your work closes. That is what every admission activity actually means."')

    s += H("Monthly Admissions - The Flow That Holds the Census")

    s.append(Paragraph(
        "ADC is a stock - the number of patients on service at a given moment. "
        "Admissions are the flow that replenishes it. Every month, patients leave "
        "the census through death, discharge, or revocation. The admission rate "
        "required to replace that attrition and hold the target ADC is determined "
        "entirely by a formula - not by a manager's preference or a quota imposed "
        "from above.",
        ST["body"]))

    s += formula_box(
        "Monthly Admissions Needed = (Target ADC x 365) / Average LOS (days) / 12",
        "Example: ADC 60, LOS 90 days: (60 x 365) / 90 / 12 = 20.3 admissions per month"
    )

    s.append(Paragraph(
        "This is not an activity standard invented by management. It is the mathematical "
        "rate at which new patients must enter service to replace the patients dying and "
        "being discharged at the other end. Every missed admission creates a gap in that "
        "flow. And every gap in the flow reduces the census. And every reduction in the "
        "census reduces the contribution margin pool. And every reduction in that pool "
        "moves the branch back toward break-even - or below it.",
        ST["body"]))

    s.append(Paragraph(
        "The chain is that direct. The connection between a follow-up call not made today "
        "and the aide whose caseload grows next month is real - it just takes time to "
        "show up.",
        ST["body"]))

    s += H("Reference: ADC, Admissions, and Revenue at FY 2026 Rates (90-Day LOS)")
    s.append(SP(6))
    s.append(adc_ref_table())
    s.append(Paragraph(
        "Assumes 90-day average LOS. Revenue estimates based on blended rate of approximately "
        "$214.53/day at FY 2026 national base rates. Admissions per marketer assumed at 8/month. "
        "Use the Spartan simulator with your actual rates for precise figures.",
        ST["tbl_note"]))

    s += callout(
        "THE ADC 60 REFERENCE POINT",
        [Paragraph(
            "A branch targeting ADC 60 with a 90-day average LOS needs approximately 20.3 "
            "new admissions per month - roughly 4 to 5 per week - to maintain that census. "
            "That is not a quota. It is the admission rate at which departures are replaced "
            "and the census holds. Every week below that rate, the census declines. Every "
            "week it declines, the contribution margin pool shrinks. Every time the pool "
            "shrinks, the team funded by that pool gets a little closer to a threshold "
            "that matters to real patients.",
            ST["cb_body"])],
        bg=LIGHT2, border=RED)

    s += H("The Cumulative Impact of Sustained ADC")

    s.append(Paragraph(
        "The math is not just about the break-even moment. It is about what sustained "
        "census above break-even makes possible over time. A branch that holds ADC 55 "
        "for 12 consecutive months builds the financial foundation to hire an experienced "
        "clinical educator, fund a bereavement coordinator, develop a dementia-specific "
        "care protocol, and establish the community relationships that sustain referrals "
        "for the next three years.",
        ST["body"]))

    s.append(Paragraph(
        "A branch that fluctuates around break-even does none of those things. It "
        "manages the present at the expense of the future - and in hospice, the clinical "
        "future is measured in the quality of care received by every patient who enrolls "
        "next year.",
        ST["body"]))

    # =========================================================================
    # PART FOUR
    # =========================================================================
    s += part_header(
        "PART FOUR",
        "Reading the Field Differently",
        "How understanding all of this changes every referral conversation you will ever have.",
    )

    s.append(Paragraph(
        "Most hospice sales reps walk into a referral source's office thinking about their "
        "own number - their monthly target, their manager's expectations, whether this "
        "account is worth the time. The rep who has read this far walks in thinking about "
        "a different set of numbers and a different set of people. That shift is not "
        "motivational language. It changes what you say, how you say it, and what you "
        "know to be true when you say it.",
        ST["body"]))

    s += H("Five Things That Change When You Know This")

    shifts = [
        ("1. You stop thinking about the benefit and start thinking about the team.",
         "The difference between a branch at ADC 40 and ADC 65 is not an administrative "
         "metric. It is the difference between a branch that can afford its after-hours "
         "RN and one that cannot. Between one that can retain its most experienced case "
         "manager and one that loses her to a competitor with a more stable census. Between "
         "one that can fund weekend coverage and one that has a two-day gap in its commitment "
         "to enrolled patients. Every admission you generate is a contribution to that team's "
         "ability to function at full capacity - not just today but sustainably."),
        ("2. Every delayed referral has a clinical consequence.",
         "When a physician delays a hospice conversation, or when a facility is noncommittal "
         "about referring to your branch, the patient who would have benefited pays the cost - "
         "not in dollars but in care. In the weeks of pain that could have been better managed. "
         "In the family that never got the social worker who would have told them what they "
         "needed to hear. In the chaplain visit that never happened because the patient died "
         "before enrollment. When you understand who the team is and what they do, the urgency "
         "of timely referral is no longer about metrics. It is about specific people losing "
         "access to specific care."),
        ("3. Your follow-through is a clinical act.",
         "The admission that did not happen because the follow-up did not happen is not just "
         "a missed sales opportunity. It is a patient who did not enroll. That is a clinical "
         "outcome. Reps who understand this do not need to be reminded to follow up. They "
         "understand the weight of not doing it. The call is not about the number. It is about "
         "whether a specific family has access to the most influential people in the dying "
         "process - or does not."),
        ("4. Your activity targets have a why you can explain.",
         "Five admissions per week. Twenty per month. These numbers have a precise mathematical "
         "derivation: they are the admission rate required to hold the census that sustains "
         "the clinical team at full strength. You can now trace the path from one admission "
         "to the contribution margin it generates to the salary line it funds to the nurse "
         "it keeps employed to the patient that nurse serves. That is not a motivational "
         "framework. It is a fact."),
        ("5. Break-even is not the destination. Sustainable is.",
         "A branch at break-even is surviving. It can fund the team today. It cannot "
         "invest in them, develop them, or protect them from disruption. The gap between "
         "current ADC and target margin ADC is the gap between a branch that exists and "
         "one that grows. Between a team that is hired and one that stays. Between care "
         "that is technically delivered and care that is excellent. Your work is what "
         "closes that gap."),
    ]

    for title, body in shifts:
        s += h(title)
        s.append(Paragraph(body, ST["body"]))
        s.append(SP(4))

    s += H("What to Say When You Know This")

    s.append(Paragraph(
        "You do not lead a referral conversation with the financial model. You lead with "
        "the clinical team and the care they deliver. But knowing the model gives you "
        "authority - the authority that comes from understanding what you are talking "
        "about down to its foundations. Referral sources notice that. They have seen "
        "enough reps to know the difference between someone reciting a pitch and someone "
        "who actually understands the landscape.",
        ST["body"]))

    talking_points = [
        ("On clinical depth:",
         "Our branch has the staffing structure to handle complex patients because our census "
         "supports it. An RN Case Manager for every 12 patients on service - the Medicare "
         "standard, not the minimum we can get away with. Dedicated after-hours RN coverage "
         "every night of the year. That is not universal across hospice providers."),
        ("On family support:",
         "The families who come to us are placing their loved one's final chapter in our "
         "hands. We have built the census - and therefore the team - to honor that. Our social "
         "worker has time for the family, not just the chart. Our chaplain has hours to actually "
         "sit with people, not just visit."),
        ("On the referral itself:",
         "Every patient we are able to enroll helps us maintain the team that serves every "
         "other patient. And every patient we cannot reach is a family that goes through this "
         "without the support that makes it something other than devastating."),
        ("On timing:",
         "Earlier enrollment means more days of expert symptom management, more time for the "
         "social worker to get ahead of what the family needs, more opportunity for the chaplain "
         "to be present before the final days. The patient who enrolls with sixty days remaining "
         "has a fundamentally different experience than the one who enrolls in the last week."),
    ]

    for label, quote in talking_points:
        s.append(Paragraph("<b>%s</b>" % label, ST["body_l"]))
        s.append(Paragraph(quote, ST["body_l"]))
        s.append(SP(8))

    s.append(Paragraph(
        "None of these statements are marketing language. They are true - grounded in the "
        "math and the mission this document has described in full. When you say them, you "
        "say them as someone who knows exactly what they mean. And that is a different "
        "kind of conversation.",
        ST["body"]))

    # =========================================================================
    # SIMULATOR
    # =========================================================================
    s += part_header(
        "THE SPARTAN SIMULATOR",
        "A Live Model of Your Branch's Financial Reality",
        "Built on the exact formulas in this document. Specific to your rates, your costs, "
        "your market. Updated in real time as inputs change.",
    )

    s.append(Paragraph(
        "Every number and relationship described in this document can be modeled precisely "
        "for your specific branch using the Spartan Branch Profitability Simulator - an "
        "interactive financial model built directly into the Spartan Coaching platform. "
        "It is not a spreadsheet approximation. Every calculation uses the exact formulas "
        "described in Part Three, with your actual revenue rates, clinical costs, staffing "
        "structure, and operating assumptions.",
        ST["body"]))

    s += H("What the Simulator Computes")
    s.append(SP(6))
    s.append(simulator_table())
    s.append(SP(10))

    s += H("How to Read the Key Outputs")

    outputs = [
        ("Profit and Revenue Curve",
         "A continuous curve showing annual profit across the full ADC range (10 to 200). "
         "Break-even ADC and Target Margin ADC are plotted directly on the curve. You can "
         "see immediately where you are relative to both thresholds and what it takes to "
         "close the gap."),
        ("Operating Margin Curve",
         "The margin percentage at every census level. Watch for the 10 percent fragile "
         "threshold and the 12 to 18 percent sustainable band. A branch at 10 percent margin "
         "has no financial buffer. One at 15 percent can absorb a census disruption without "
         "cutting the team."),
        ("Required Staffing Table",
         "Every clinical and operational role required at your target ADC, with FTE count "
         "and annual cost. Shows exactly how many RN Case Managers and Hospice Aides are "
         "required by Medicare CoP at that census level and what full payroll looks like."),
        ("Cash Runway Projection",
         "Month-by-month cash flow over 18 months as census ramps toward target ADC. "
         "Identifies the month cash flow first turns positive and the break-even crossing "
         "month. Shows whether your starting capital is sufficient to reach sustainability."),
        ("Admissions and Marketer Analysis",
         "Monthly and weekly admission requirements at target ADC and average LOS. "
         "The number of marketers required at a given production assumption. The mathematical "
         "link between sales activity and financial sustainability."),
    ]

    for title, body in outputs:
        s += h(title)
        s.append(Paragraph(body, ST["body"]))

    s += callout(
        "HOW TO USE THE SIMULATOR BEFORE YOUR NEXT MANAGER CONVERSATION",
        [
            Paragraph(
                "Run your branch's actual numbers. Know your exact break-even ADC. Know "
                "your exact target margin ADC. Know your monthly admissions requirement and "
                "what it implies about your weekly activity. Know your cash runway and the "
                "month it crosses.",
                ST["cb_body"]),
            SP(6),
            Paragraph(
                "Then use those numbers not to prepare for a conversation with your manager "
                "but to understand precisely what your daily work is building toward - and "
                "what the team you are funding looks like at each census milestone.",
                ST["cb_body"]),
        ],
        bg=LIGHT2, border=RED)

    s.append(Paragraph(
        "Access the simulator: spartanhospicecoaching.com / Tools / Branch Profitability",
        ST["lnk"]))

    # =========================================================================
    # CLOSING
    # =========================================================================
    s += part_header(
        "CLOSING",
        "The Census Is Not the Point. The Care Is.",
        "The only thing a hospice sales rep needs to remember.",
    )

    s.append(Paragraph(
        "The census number you were given at the start of your career was not arbitrary. "
        "It was never arbitrary. It was the financial expression of a specific human "
        "requirement: the census needed for your branch to sustain the team of people "
        "who would provide the care it promised.",
        ST["body"]))

    s.append(Paragraph(
        "That team - the nurses, the aides, the social workers, the chaplains, the "
        "after-hours clinician, the intake coordinator who answered Claire's call before "
        "she could finish her first sentence - exists for one reason. Not to generate "
        "revenue. Not to hit a margin target. To be present with people in the most "
        "vulnerable, most sacred, most irreversible chapter of their lives. To do work "
        "that requires both professional training and human courage: to walk into a "
        "room where someone is dying and to make that room, for a time, less frightening.",
        ST["body"]))

    s.append(Paragraph(
        "The census is what makes that possible. Maintaining it - building it to the "
        "point where the team is not just funded but strong, not just present but "
        "excellent, not just surviving but sustainable - is what your work is for. "
        "Not because a manager set a number. Because the patients who entrust your "
        "branch with their life and their death deserve the full team that the number "
        "is designed to support.",
        ST["body"]))

    s.append(Paragraph(
        "The connection between the call you make this morning and the chaplain who "
        "sits with a patient tonight is not metaphorical. It is direct. It is causal. "
        "It is real. The most influential people in the dying process are there - "
        "or they are not - because of the census. And the census is there - "
        "or it is not - because of you.",
        ST["body"]))

    s += pullquote(
        '"The census is not the point. The care is the point. '
        'The census is the condition that makes the care possible - '
        'at full strength, for every patient who trusts you with their final chapter."')

    s += dark_callout(
        "A FINAL NOTE FROM SPARTAN COACHING",
        [Paragraph(
            "This document is part of the Spartan Coaching Branch Profitability Education "
            "Series. The Spartan Branch Profitability Simulator - accessible at "
            "spartanhospicecoaching.com - computes every number described here for your "
            "specific branch, using your actual FY 2026 rates, costs, and assumptions. "
            "It is free to use and takes approximately three minutes to complete.",
            ST["cb_inv"]),
         SP(6),
         Paragraph(
            "Run your numbers. Know your break-even. Know your target margin ADC. "
            "Know your monthly admissions requirement and what it means for the team "
            "you are building. Know why the number is exactly what it is.",
            ST["cb_inv"])])

    # =========================================================================
    # GLOSSARY
    # =========================================================================
    s += part_header(
        "KEY TERMS",
        "Glossary",
        "Plain-language definitions for every metric and formula used in this document.",
    )
    s += glossary_els()

    return s


# ---- Main -------------------------------------------------------------------
def main():
    out = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public", "resources", "branch-profitability-education.pdf"
    )
    doc = SpartanDoc(out)
    doc.build(build_story())
    print(f"PDF generated: {out} ({os.path.getsize(out)//1024} KB)")

if __name__ == "__main__":
    main()
