import PDFDocument from 'pdfkit';
import fs from 'fs';
import { fileURLToPath } from 'url';

const SPARTAN_RED = '#DC2626';
const SPARTAN_RED_LIGHT = '#EF4444';
const SPARTAN_RED_DARK = '#991B1B';
const BLACK = '#0F172A';
const DARK_GRAY = '#1E293B';
const MEDIUM_GRAY = '#475569';
const LIGHT_GRAY = '#64748B';
const PALE_GRAY = '#94A3B8';
const BORDER_LIGHT = '#E2E8F0';
const SURFACE_LIGHT = '#F8FAFC';
const WHITE = '#FFFFFF';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const HEADER_HEIGHT = 72;
const FOOTER_HEIGHT = 36;

interface PDFState {
  doc: InstanceType<typeof PDFDocument>;
  y: number;
  pageNum: number;
}

function ensureSpace(state: PDFState, needed: number): boolean {
  const availableSpace = PAGE_HEIGHT - FOOTER_HEIGHT - 20 - state.y;
  if (availableSpace < needed) {
    addFooter(state);
    state.doc.addPage();
    state.pageNum++;
    addHeader(state);
    state.y = HEADER_HEIGHT + 24;
    return true;
  }
  return false;
}

function addHeader(state: PDFState): void {
  const { doc } = state;
  doc.rect(0, 0, PAGE_WIDTH, 4).fill(SPARTAN_RED);
  doc.rect(0, 4, PAGE_WIDTH, HEADER_HEIGHT - 4).fill(WHITE);
  doc.fontSize(18).font('Helvetica-Bold').fillColor(SPARTAN_RED);
  doc.text('SPARTAN', MARGIN, 20, { continued: true });
  doc.fillColor(BLACK).text(' COACHING');
  doc.fontSize(8).font('Helvetica').fillColor(LIGHT_GRAY);
  doc.text('DISCIPLINE  |  EMPATHY  |  STRATEGY', MARGIN, 42);
  doc.strokeColor(BORDER_LIGHT).lineWidth(0.5);
  doc.moveTo(0, HEADER_HEIGHT).lineTo(PAGE_WIDTH, HEADER_HEIGHT).stroke();
}

function addFooter(state: PDFState): void {
  const { doc, pageNum } = state;
  const footerY = PAGE_HEIGHT - FOOTER_HEIGHT;
  doc.strokeColor(BORDER_LIGHT).lineWidth(0.5);
  doc.moveTo(MARGIN, footerY).lineTo(PAGE_WIDTH - MARGIN, footerY).stroke();
  doc.fontSize(7).font('Helvetica').fillColor(PALE_GRAY);
  doc.text('Spartan Coaching  |  Hospice Sales Excellence  |  Confidential Training Material', MARGIN, footerY + 12);
  doc.text(`${pageNum}`, PAGE_WIDTH - MARGIN - 20, footerY + 12, { width: 20, align: 'right' });
  doc.rect(0, PAGE_HEIGHT - 3, PAGE_WIDTH, 3).fill(SPARTAN_RED);
}

function addCoverPage(state: PDFState, title: string, subtitle: string, purpose: string): void {
  const { doc } = state;
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(SPARTAN_RED);
  doc.rect(0, PAGE_HEIGHT - 120, PAGE_WIDTH, 120).fill(SPARTAN_RED_DARK);
  doc.rect(0, PAGE_HEIGHT - 122, PAGE_WIDTH, 2).fill(WHITE);
  doc.rect(MARGIN, 100, 3, 60).fill(WHITE);
  doc.fontSize(32).font('Helvetica-Bold').fillColor(WHITE);
  doc.text('SPARTAN', MARGIN + 16, 100, { continued: true });
  doc.font('Helvetica').text(' COACHING');
  doc.fontSize(10).font('Helvetica').fillColor('rgba(255,255,255,0.75)');
  doc.text('DISCIPLINE  |  EMPATHY  |  STRATEGY', MARGIN + 16, 144);
  doc.rect(MARGIN, 200, CONTENT_WIDTH, 1).fill('rgba(255,255,255,0.3)');
  doc.fontSize(28).font('Helvetica-Bold').fillColor(WHITE);
  doc.text(title.toUpperCase(), MARGIN, 224, { width: CONTENT_WIDTH, lineGap: 4 });
  const titleBottom = doc.y + 16;
  doc.fontSize(14).font('Helvetica').fillColor('rgba(255,255,255,0.85)');
  doc.text(subtitle, MARGIN, titleBottom, { width: CONTENT_WIDTH, lineGap: 4 });
  const subtitleBottom = doc.y + 24;
  doc.rect(MARGIN, subtitleBottom, CONTENT_WIDTH, 1).fill('rgba(255,255,255,0.3)');
  doc.fontSize(10).font('Helvetica').fillColor('rgba(255,255,255,0.7)');
  doc.text(purpose, MARGIN, subtitleBottom + 20, { width: CONTENT_WIDTH, lineGap: 4 });
  doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.6)');
  doc.text('spartan-coaching-schools.org', MARGIN, PAGE_HEIGHT - 80);
  doc.text('nicholas.lynch@spartan-coaching-schools.org', MARGIN, PAGE_HEIGHT - 64);
  doc.text('2026 Edition  |  Confidential Training Material', PAGE_WIDTH - MARGIN - 160, PAGE_HEIGHT - 64, { width: 160, align: 'right' });
}

function addDocumentTitle(state: PDFState, title: string, subtitle?: string): void {
  const { doc } = state;
  state.y = HEADER_HEIGHT + 36;
  doc.fontSize(24).font('Helvetica-Bold').fillColor(BLACK);
  doc.text(title, MARGIN, state.y, { width: CONTENT_WIDTH });
  state.y = doc.y + 8;
  if (subtitle) {
    doc.fontSize(11).font('Helvetica').fillColor(MEDIUM_GRAY);
    doc.text(subtitle, MARGIN, state.y, { width: CONTENT_WIDTH });
    state.y = doc.y + 6;
  }
  doc.strokeColor(SPARTAN_RED).lineWidth(2);
  doc.moveTo(MARGIN, state.y).lineTo(MARGIN + 60, state.y).stroke();
  state.y += 24;
}

function addSection(state: PDFState, title: string): void {
  ensureSpace(state, 50);
  const { doc } = state;
  state.y += 8;
  doc.rect(MARGIN, state.y, 3, 20).fill(SPARTAN_RED);
  doc.fontSize(13).font('Helvetica-Bold').fillColor(BLACK);
  doc.text(title.toUpperCase(), MARGIN + 14, state.y + 3, { width: CONTENT_WIDTH - 14 });
  state.y = doc.y + 16;
}

function addSubsection(state: PDFState, title: string): void {
  ensureSpace(state, 30);
  const { doc } = state;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(SPARTAN_RED_DARK);
  doc.text(title, MARGIN, state.y, { width: CONTENT_WIDTH });
  state.y = doc.y + 6;
}

function addParagraph(state: PDFState, text: string, indent: number = 0): void {
  ensureSpace(state, 40);
  const { doc } = state;
  doc.fontSize(10).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(text, MARGIN + indent, state.y, { width: CONTENT_WIDTH - indent, lineGap: 3 });
  state.y = doc.y + 10;
}

function addBullet(state: PDFState, text: string, indent: number = 0): void {
  ensureSpace(state, 24);
  const { doc } = state;
  const bulletX = MARGIN + indent + 8;
  doc.circle(bulletX, state.y + 5, 2).fill(SPARTAN_RED);
  doc.fontSize(10).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(text, MARGIN + indent + 18, state.y, { width: CONTENT_WIDTH - indent - 18, lineGap: 2 });
  state.y = doc.y + 6;
}

function addNumberedItem(state: PDFState, num: number, title: string, desc?: string): void {
  ensureSpace(state, 36);
  const { doc } = state;
  doc.circle(MARGIN + 10, state.y + 6, 10).fill(SPARTAN_RED);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE);
  doc.text(`${num}`, MARGIN + 5, state.y + 2, { width: 11, align: 'center' });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(BLACK);
  doc.text(title, MARGIN + 28, state.y + 2, { width: CONTENT_WIDTH - 28 });
  if (desc) {
    state.y = doc.y + 2;
    doc.fontSize(9).font('Helvetica').fillColor(MEDIUM_GRAY);
    doc.text(desc, MARGIN + 28, state.y, { width: CONTENT_WIDTH - 28, lineGap: 2 });
  }
  state.y = doc.y + 10;
}

function addSalesStage(state: PDFState, stageNum: number, stageName: string, stageDesc: string): void {
  ensureSpace(state, 52);
  const { doc } = state;
  const boxHeight = 44;
  const numWidth = 44;
  doc.rect(MARGIN, state.y, numWidth, boxHeight).fill(SPARTAN_RED);
  doc.fontSize(22).font('Helvetica-Bold').fillColor(WHITE);
  doc.text(`${stageNum}`, MARGIN, state.y + 11, { width: numWidth, align: 'center' });
  doc.rect(MARGIN + numWidth, state.y, CONTENT_WIDTH - numWidth, boxHeight)
    .fillAndStroke(SURFACE_LIGHT, BORDER_LIGHT);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(BLACK);
  doc.text(stageName.toUpperCase(), MARGIN + numWidth + 14, state.y + 10, { width: CONTENT_WIDTH - numWidth - 28 });
  doc.fontSize(9).font('Helvetica').fillColor(MEDIUM_GRAY);
  doc.text(stageDesc, MARGIN + numWidth + 14, state.y + 26, { width: CONTENT_WIDTH - numWidth - 28 });
  state.y += boxHeight + 8;
}

function addScriptBox(state: PDFState, script: string): void {
  const lineCount = script.split('\n').length;
  const charCount = script.length;
  const estimatedHeight = Math.max(72, lineCount * 15 + Math.ceil(charCount / 80) * 14 + 28);
  ensureSpace(state, estimatedHeight);
  const { doc } = state;
  doc.rect(MARGIN, state.y, 3, estimatedHeight - 8).fill(SPARTAN_RED_LIGHT);
  doc.rect(MARGIN + 3, state.y, CONTENT_WIDTH - 3, estimatedHeight - 8).fill('#FEF2F2');
  doc.fontSize(10).font('Helvetica-Oblique').fillColor(DARK_GRAY);
  doc.text(script, MARGIN + 16, state.y + 12, { width: CONTENT_WIDTH - 32, lineGap: 3 });
  state.y = doc.y + 16;
}

function addTipBox(state: PDFState, tipTitle: string, tipContent: string, tall: boolean = false): void {
  const charCount = tipContent.length;
  const boxHeight = tall ? Math.max(68, Math.ceil(charCount / 70) * 13 + 36) : 58;
  ensureSpace(state, boxHeight + 10);
  const { doc } = state;
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, boxHeight).fillAndStroke('#FEF2F2', SPARTAN_RED);
  doc.rect(MARGIN, state.y, 4, boxHeight).fill(SPARTAN_RED);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(SPARTAN_RED);
  doc.text(tipTitle.toUpperCase(), MARGIN + 16, state.y + 12, { width: CONTENT_WIDTH - 32 });
  doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(tipContent, MARGIN + 16, state.y + 28, { width: CONTENT_WIDTH - 32, lineGap: 2 });
  state.y += boxHeight + 12;
}

function addCalloutBox(state: PDFState, text: string): void {
  const charCount = text.length;
  const boxHeight = Math.max(48, Math.ceil(charCount / 65) * 13 + 28);
  ensureSpace(state, boxHeight + 10);
  const { doc } = state;
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, boxHeight).fill(SURFACE_LIGHT);
  doc.strokeColor(BORDER_LIGHT).lineWidth(1);
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, boxHeight).stroke();
  doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK_GRAY);
  doc.text(text, MARGIN + 14, state.y + 14, { width: CONTENT_WIDTH - 28, lineGap: 3 });
  state.y = doc.y + 18;
}

function addCheckbox(state: PDFState, text: string): void {
  ensureSpace(state, 22);
  const { doc } = state;
  doc.rect(MARGIN + 8, state.y + 1, 12, 12).lineWidth(1).strokeColor(SPARTAN_RED).stroke();
  doc.fontSize(10).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(text, MARGIN + 28, state.y, { width: CONTENT_WIDTH - 28 });
  state.y = doc.y + 6;
}

function addTableRow(state: PDFState, cells: string[], widths: number[], isHeader: boolean = false): void {
  ensureSpace(state, 28);
  const { doc } = state;
  const rowHeight = 24;
  let x = MARGIN;
  if (isHeader) {
    doc.rect(MARGIN, state.y, CONTENT_WIDTH, rowHeight).fill(SURFACE_LIGHT);
  }
  doc.strokeColor(BORDER_LIGHT).lineWidth(0.5);
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, rowHeight).stroke();
  cells.forEach((cell, i) => {
    const cellWidth = widths[i] || 100;
    if (i > 0) {
      doc.moveTo(x, state.y).lineTo(x, state.y + rowHeight).stroke();
    }
    doc.fontSize(9)
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(isHeader ? DARK_GRAY : MEDIUM_GRAY);
    doc.text(cell, x + 8, state.y + 7, { width: cellWidth - 16 });
    x += cellWidth;
  });
  state.y += rowHeight;
}

function addFormField(state: PDFState, label: string, wide: boolean = false): void {
  ensureSpace(state, 28);
  const { doc } = state;
  doc.fontSize(10).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(`${label}:`, MARGIN, state.y);
  const labelWidth = doc.widthOfString(`${label}:`);
  const lineStart = MARGIN + labelWidth + 8;
  const lineEnd = wide ? PAGE_WIDTH - MARGIN : Math.min(MARGIN + 260, PAGE_WIDTH - MARGIN);
  doc.strokeColor(BORDER_LIGHT).lineWidth(0.5);
  doc.moveTo(lineStart, state.y + 12).lineTo(lineEnd, state.y + 12).stroke();
  state.y += 24;
}

function addEmailTemplate(state: PDFState, subject: string, body: string): void {
  const lineCount = body.split('\n').length;
  const estimatedHeight = Math.max(120, lineCount * 14 + 50);
  ensureSpace(state, estimatedHeight);
  const { doc } = state;
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, 1).fill(BORDER_LIGHT);
  state.y += 8;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(MEDIUM_GRAY);
  doc.text('Subject:', MARGIN, state.y);
  doc.font('Helvetica').fillColor(DARK_GRAY);
  doc.text(subject, MARGIN + 52, state.y, { width: CONTENT_WIDTH - 52 });
  state.y = doc.y + 10;
  doc.fontSize(10).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(body, MARGIN, state.y, { width: CONTENT_WIDTH, lineGap: 3 });
  state.y = doc.y + 16;
}

function addDivider(state: PDFState): void {
  ensureSpace(state, 20);
  const { doc } = state;
  state.y += 6;
  doc.strokeColor(BORDER_LIGHT).lineWidth(0.5);
  doc.moveTo(MARGIN, state.y).lineTo(PAGE_WIDTH - MARGIN, state.y).stroke();
  state.y += 14;
}

function createDocument(withCover: boolean = false): PDFState {
  const doc = new PDFDocument({
    size: 'LETTER',
    margin: 0,
    autoFirstPage: true
  });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  if (!withCover) {
    addHeader(state);
  }
  return state;
}

function finishDocument(state: PDFState, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    addFooter(state);
    const stream = fs.createWriteStream(outputPath);
    state.doc.pipe(stream);
    state.doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ─── PDF 1: COLD CALL SCRIPT ────────────────────────────────────────────────

async function createColdCallScript(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Cold Call Opening Script', 'Field-Ready Conversation Guides for Hospice Sales', 'Complete scripts, discovery questions, objection rebuttals, and conversation branches for new account development.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Cold Call Opening Script', 'The Spartan Approach to First Conversations');

  addSection(state, 'The Healthcare Sales Mastery Model');
  addParagraph(state, 'Every successful hospice sales conversation follows a four-stage progression. Understanding which stage you are in determines how you speak, what you ask, and what you offer next. Rushing through stages is the single most common reason deals fall apart. Train yourself to slow down.');
  addSalesStage(state, 1, 'Discovery', 'Learning about the operations, processes, and organizational priorities of the account');
  addSalesStage(state, 2, 'Connecting', 'Building individual rapport and understanding the personal motivations of your contact');
  addSalesStage(state, 3, 'Guiding', 'Aligning the problems they have shared with the solutions you can provide');
  addSalesStage(state, 4, 'Commitment', 'Asking for the referral or partnership with confidence and clarity');

  addSection(state, 'The Spartan 30-Second Opener');
  addParagraph(state, 'Your opening sets the entire tone of the relationship. Most hospice reps lead with their company name and credentials. Spartan-trained reps lead with the patient. The following opener works because it acknowledges their time constraints, centers the conversation on outcomes, and asks for minimal commitment upfront.');
  addScriptBox(state, `"Hi [Name], this is [Your Name] with [Hospice Company]. I know you are dealing with a full caseload right now, so I will keep this brief. We partner with facilities like yours to help ensure patients with serious illness get into comfort-focused care at the right time instead of the last minute. I would love to ask you two questions about how your team currently approaches those decisions. Do you have 90 seconds?"`);
  addSubsection(state, 'Why This Opening Works');
  addBullet(state, 'Opening with acknowledgment of their workload builds immediate rapport and reduces defensiveness');
  addBullet(state, 'Framing hospice around timing and outcomes rather than services positions you as a clinical partner');
  addBullet(state, 'Asking for 90 seconds instead of a meeting lowers the perceived cost of saying yes');
  addBullet(state, 'Asking for two questions rather than presenting creates a dialogue rather than a pitch');

  addSection(state, 'Three Conversation Branches');
  addSubsection(state, 'Branch 1: They Say Yes');
  addParagraph(state, 'When they agree to talk, move immediately into Stage 1 discovery without any preamble. Do not thank them excessively or repitch your company. Get into the questions.');
  addScriptBox(state, `"Perfect. First question: when a patient in your facility reaches a point where curative treatment is no longer helping, what typically happens with their care plan from your team's perspective?"`);
  addParagraph(state, 'Listen fully. Do not interrupt. After they answer, follow with:');
  addScriptBox(state, `"That is helpful. And how frequently does your team connect with a hospice liaison to help think through those decisions together?"`);
  addParagraph(state, 'These two questions tell you everything: whether they have a process, how often they use it, and whether there is a gap you can fill. From there, you can book a follow-up meeting or offer an educational resource based on what they share.');

  addSubsection(state, 'Branch 2: They Are Resistant or Rushed');
  addParagraph(state, 'Resistance is not rejection. It is usually a time or priority issue. If they say they are busy or not interested, do not argue. Pivot to a low-commitment ask.');
  addScriptBox(state, `"Absolutely, I understand. I am not here to take up your time. Would it be okay if I dropped off a short resource next week when you have a quiet moment? It takes about two minutes to read and covers the eligibility criteria most facilities find helpful for their more complex patients."`);
  addParagraph(state, 'This keeps the door open and positions your next visit as a value delivery rather than a sales call. The resource gives them a reason to see you again.');

  addSubsection(state, 'Branch 3: The Gatekeeper Stops You');
  addParagraph(state, 'Front desk staff and nurses who screen calls are not obstacles. They are potential champions. Treat every gatekeeper with the same respect you would give the decision-maker.');
  addScriptBox(state, `"Hi, my name is [Your Name] from [Hospice Company]. I work with your social work team and nursing leadership on making sure patients with serious illness get evaluated at the right time. I am not here to sell anything today. I am just looking to introduce myself and learn about how your team works. Would [name] have five minutes sometime this week?"`);
  addParagraph(state, 'Ask the gatekeeper for their name. Use it. Ask them what the best time of day is to catch the decision-maker. They will often tell you exactly when and how to reach the right person.');

  addSection(state, 'Five Discovery Questions with Purpose Explanations');
  addParagraph(state, 'These questions are designed to open up a genuine conversation in Stage 1. Never fire more than two or three in one visit. They should feel like natural curiosity, not a structured interview.');

  addNumberedItem(state, 1, 'The Census Question',
    '"How many patients in your facility right now would you estimate are appropriate for hospice comfort care?" — Purpose: This immediately establishes shared clinical ground and often reveals that they have not thought about this. Most facilities underestimate. When they answer, it opens the door to a discussion about identification processes.');
  addNumberedItem(state, 2, 'The Process Question',
    '"What does your current process look like when a clinician identifies a patient who might benefit from hospice?" — Purpose: This reveals whether there is a formal or informal process, who is involved, and where the bottlenecks are. The answer tells you exactly where your support would be most valuable.');
  addNumberedItem(state, 3, 'The Timing Question',
    '"When patients do get referred to hospice, how long are they typically on service before they pass away?" — Purpose: This opens a conversation about late referrals, which is one of the biggest issues in the field. Most facilities know their average length of stay is shorter than ideal. You are not telling them they are doing it wrong. You are asking them to acknowledge it themselves.');
  addNumberedItem(state, 4, 'The Barrier Question',
    '"What gets in the way of earlier conversations with patients and families about comfort-focused care?" — Purpose: This question invites them to name their pain point. They might say family resistance, physician hesitation, or staff discomfort. Whatever they say, it is your next educational topic.');
  addNumberedItem(state, 5, 'The Relationship Question',
    '"Who else in your building is typically part of those care transition conversations?" — Purpose: This is your stakeholder mapping question. You are identifying who else you need to meet and build a relationship with before you can advance the partnership.');

  addSection(state, 'Four Objection Rebuttals');
  addSubsection(state, 'Objection 1: "We already have a hospice we work with."');
  addScriptBox(state, `"I respect that. A lot of the facilities I partner with work with multiple hospice providers depending on the patient's location, insurance, or family preference. I am not here to replace anyone. I am just hoping to learn about your experience and see if there is a way we can support your team in specific situations where your current partner might not be the right fit. Would it be helpful to at least know we are available?"`);

  addSubsection(state, 'Objection 2: "We are not taking new referral partners right now."');
  addScriptBox(state, `"That makes complete sense. I would not want to add anything to your plate. What I would ask is whether I could simply introduce myself and drop off a clinical resource on eligibility criteria. No relationship required, no commitment. If something changes down the road and you ever need a second option, I want you to know my name and number."`);

  addSubsection(state, 'Objection 3: "We handle our own discharge planning."');
  addScriptBox(state, `"That is great to hear and it shows how much your team cares about continuity. My role is not to interfere with that process. What I find most valuable is when I can partner with your discharge planners to make their job easier for the most complex cases. Would it be worth a 15-minute conversation with your discharge planning lead just to see if there are any gaps I might be able to help fill?"`);

  addSubsection(state, 'Objection 4: "I do not have time for this right now."');
  addScriptBox(state, `"Completely understood. I will be brief. Could I simply leave my card and one resource and follow up by email? The resource has practical information about hospice eligibility criteria for your three most common diagnoses. No strings attached. If it is useful, great. If not, no harm done."`);

  addTipBox(state, 'Spartan Field Principle', 'Every objection is a doorway. Behind "we already have a hospice" is often a dissatisfied referral source who has never been asked how things are actually going. Behind "not interested" is often a person who has been burned by pushy reps before. Your job is to be so different from what they expect that they cannot help but give you five minutes.');

  await finishDocument(state, 'public/resources/cold-call-script.pdf');
}

// ─── PDF 2: TERRITORY TEMPLATE ────────────────────────────────────────────

async function createTerritoryTemplate(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Sales Territory Analysis', 'Strategic Planning Through the Healthcare Sales Mastery Model', 'A complete framework for mapping, tiering, and optimizing your hospice sales territory to maximize referrals and admissions.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Territory Analysis and Planning', 'Building a Systematic Approach to Account Management');

  addSection(state, 'Territory Information');
  addFormField(state, 'Territory Name', true);
  addFormField(state, 'Territory Manager');
  addFormField(state, 'Analysis Period');
  addFormField(state, 'Total Addressable Accounts');
  addFormField(state, 'Current Monthly Admission Goal');
  addFormField(state, 'Current Conversion Rate (Referrals to Admissions)');

  addSection(state, 'Understanding Your Territory');
  addParagraph(state, 'Before you can build a territory plan, you need a clear picture of the landscape you are working in. This section helps you assess the full potential of your territory, understand how it breaks down by account type, and identify where your best opportunities exist today.');
  addParagraph(state, 'Great territory management is not about visiting every account equally. It is about making high-quality, intentional visits to the right people at the right time. A rep who makes 60 well-prepared visits produces far more admissions than a rep who makes 100 unfocused calls.');

  addSection(state, 'Account Inventory by Facility Type');
  const facilityWidths = [175, 70, 75, 75, 109];
  addTableRow(state, ['Facility Type', 'Total', 'A Tier', 'B Tier', 'C Tier'], facilityWidths, true);
  addTableRow(state, ['Skilled Nursing Facilities', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Assisted Living Communities', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Acute Care Hospitals', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Physician Group Practices', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Home Health Agencies', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Oncology and Specialty Clinics', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Independent Physicians', '', '', '', ''], facilityWidths);
  addTableRow(state, ['TOTAL', '', '', '', ''], facilityWidths);
  state.y += 10;

  addSection(state, 'A / B / C Account Tiering System');
  addParagraph(state, 'Not all accounts are created equal. Use the following criteria to place every account into one of three tiers. Revisit your tiers monthly and adjust based on referral activity, relationship development, and competitive changes.');

  addSubsection(state, 'A Tier: High Priority Accounts (Visit Every 5 to 7 Days)');
  addBullet(state, 'Currently sending referrals or has sent referrals in the last 30 days');
  addBullet(state, 'Strong existing relationship with at least one champion inside the account');
  addBullet(state, 'High patient census with significant eligible population');
  addBullet(state, 'Low or no competitive lockout, or known dissatisfaction with current provider');
  addBullet(state, 'Decision-maker is accessible and responsive to your outreach');
  addParagraph(state, 'Target: 10 to 15 A Tier accounts. These accounts should receive 50% or more of your weekly call time.', 10);

  addSubsection(state, 'B Tier: Growth Accounts (Visit Every 10 to 14 Days)');
  addBullet(state, 'Occasional referrals or no referrals yet but clear pathway to develop them');
  addBullet(state, 'Relationship is established but not yet at the champion level');
  addBullet(state, 'Moderate census with meaningful eligible population');
  addBullet(state, 'Some competitive presence but not completely locked out');
  addBullet(state, 'Contact is willing to meet and engage with educational content');
  addParagraph(state, 'Target: 15 to 25 B Tier accounts. These accounts should receive 30 to 35% of your weekly call time.', 10);

  addSubsection(state, 'C Tier: Maintenance Accounts (Visit Every 21 to 30 Days)');
  addBullet(state, 'Little to no referral activity and limited development path in the near term');
  addBullet(state, 'No established relationship or contact who is difficult to access');
  addBullet(state, 'Low census or very low eligible patient population');
  addBullet(state, 'Strong competitive lockout with no clear in-road');
  addBullet(state, 'New accounts not yet evaluated or recently inherited from another rep');
  addParagraph(state, 'Target: All remaining accounts. These accounts should receive 15 to 20% of your weekly call time.', 10);

  addSection(state, 'Sales Mastery Model Pipeline Tracking');
  addParagraph(state, 'Track each A Tier account through all four stages of the Spartan Healthcare Sales Mastery Model. Use this table to identify where accounts are stalling and what action is needed to advance them.');
  const stageWidths = [100, 200, 80, 124];
  addTableRow(state, ['Stage', 'Definition', 'Count', 'Actions Needed'], stageWidths, true);
  addTableRow(state, ['1. Discovery', 'Learning about their operations and processes', '', ''], stageWidths);
  addTableRow(state, ['2. Connecting', 'Building individual rapport with key contacts', '', ''], stageWidths);
  addTableRow(state, ['3. Guiding', 'Aligning their needs to your solutions', '', ''], stageWidths);
  addTableRow(state, ['4. Commitment', 'Active referral or formal partnership', '', ''], stageWidths);
  state.y += 10;

  addSection(state, 'Weekly Activity Cadence');
  addParagraph(state, 'Use this framework to structure each week. Adjust numbers based on your admission goal, territory size, and conversion rates. This is a starting template, not a rigid prescription.');

  const cadenceWidths = [120, 100, 100, 184];
  addTableRow(state, ['Activity', 'Daily Target', 'Weekly Target', 'Notes'], cadenceWidths, true);
  addTableRow(state, ['Total Conversations', '8 to 12', '40 to 60', 'Any live referral source contact'], cadenceWidths);
  addTableRow(state, ['A Tier Visits', '3 to 4', '15 to 20', 'In-person preferred'], cadenceWidths);
  addTableRow(state, ['B Tier Visits', '2 to 3', '10 to 15', 'Mix of in-person and phone'], cadenceWidths);
  addTableRow(state, ['New Account Introductions', '1', '5', 'Prospecting to grow C tier'], cadenceWidths);
  addTableRow(state, ['Follow-Up Emails Sent', '3 to 5', '15 to 25', 'Same day preferred'], cadenceWidths);
  state.y += 10;

  addSection(state, 'Quarterly Planning Framework');
  addSubsection(state, 'Quarter Beginning Checklist');
  addCheckbox(state, 'Review last quarter admissions by account and identify top 5 performing sources');
  addCheckbox(state, 'Review accounts that referred last quarter but have gone quiet and plan re-engagement');
  addCheckbox(state, 'Identify 5 new prospects to develop into B Tier this quarter');
  addCheckbox(state, 'Reset weekly activity targets based on current admission goal');
  addCheckbox(state, 'Schedule quarterly business reviews at your top 3 A Tier accounts');
  addCheckbox(state, 'Plan at least 4 lunch-and-learn presentations for the quarter');

  addSubsection(state, 'Quarter End Review Checklist');
  addCheckbox(state, 'Total admissions vs. goal: did you hit it? Why or why not?');
  addCheckbox(state, 'Conversion rate: is your referral to admission rate improving?');
  addCheckbox(state, 'Account movement: how many accounts moved up or down a tier?');
  addCheckbox(state, 'Relationship depth: do you have a champion at every A Tier account?');
  addCheckbox(state, 'Competitive intelligence: are there changes in competitor activity in your territory?');

  addTipBox(state, 'Territory Discipline', 'The best territory plans are written in pencil. Your plan should be reviewed weekly, adjusted monthly, and rebuilt quarterly. The market changes, relationships evolve, and your skills improve. A plan that you never update is not a plan. It is a wish list.');

  await finishDocument(state, 'public/resources/territory-template.pdf');
}

// ─── PDF 3: RESEARCH CHECKLIST ─────────────────────────────────────────────

async function createResearchChecklist(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Pre-Call Research Checklist', 'Complete Preparation for Every Referral Source Visit', 'A 40-item research protocol covering facility intelligence, contact preparation, competitive positioning, and clinical context for each call.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Pre-Call Research Checklist', 'Preparation Separates Spartan Reps from the Competition');

  addSection(state, 'Why Research Matters');
  addParagraph(state, 'Most hospice reps walk into facilities knowing only the name on the door. Spartan-trained reps know the census numbers, the decision-makers, the clinical challenges, the competitive situation, and what that specific contact cares about most. The rep who is most prepared wins the conversation before it starts.');
  addParagraph(state, 'Use this checklist before every new account introduction and before any major meeting at an existing account. Abbreviated research takes 15 minutes. Full research for a high-value new account should take 45 to 60 minutes. Never skip it.');

  addSection(state, 'Facility-Level Research (All Account Types)');
  addSubsection(state, 'Organizational Basics');
  addCheckbox(state, 'Facility name, address, ownership group, and number of locations in the system');
  addCheckbox(state, 'Type of facility and licensed bed count or panel size');
  addCheckbox(state, 'Ownership structure: for-profit, nonprofit, faith-based, or government');
  addCheckbox(state, 'Part of a larger health system or independent operation');
  addCheckbox(state, 'Any recent news about the facility (expansions, closings, leadership changes, awards)');
  addCheckbox(state, 'Current census utilization rate if available publicly');

  addSubsection(state, 'CMS Data and Quality Metrics');
  addCheckbox(state, 'CMS Five Star Quality Rating for SNFs (cms.gov/care-compare)');
  addCheckbox(state, 'Most recent standard survey results and any deficiencies noted');
  addCheckbox(state, 'Quality measure scores compared to state and national averages');
  addCheckbox(state, 'Staffing hours per resident per day (a key quality indicator)');
  addCheckbox(state, 'For hospitals: readmission rates, HCAHPS scores, value-based purchasing results');
  addCheckbox(state, 'For home health: OASIS outcomes and agency compare star ratings');

  addSubsection(state, 'Current Hospice Activity');
  addCheckbox(state, 'Which hospice providers are currently active in this facility or with this physician');
  addCheckbox(state, 'Estimated volume: how many referrals per month, if knowable');
  addCheckbox(state, 'Any known dissatisfaction with current hospice partner');
  addCheckbox(state, 'Whether any patients have been on long hospice stays or had recertifications');
  addCheckbox(state, 'Whether the facility has its own palliative care program');

  addSection(state, 'Contact-Level Research');
  addSubsection(state, 'LinkedIn and Professional Profiles');
  addCheckbox(state, 'Years in current role and years at this facility');
  addCheckbox(state, 'Prior work history: what settings have they worked in?');
  addCheckbox(state, 'Educational background and professional credentials');
  addCheckbox(state, 'Any publications, presentations, or professional affiliations');
  addCheckbox(state, 'Shared connections with your network or colleagues in common');
  addCheckbox(state, 'Recent posts or comments that reveal priorities and interests');
  addCheckbox(state, 'Volunteer work, community involvement, or causes they support');

  addSubsection(state, 'Role and Decision Authority');
  addCheckbox(state, 'Exact role in the referral decision process (recommender, approver, influencer)');
  addCheckbox(state, 'Who they report to and who they collaborate with on care decisions');
  addCheckbox(state, 'How long they have been in the decision-making role');
  addCheckbox(state, 'Whether they have a preferred hospice provider and how loyal they are to it');

  addSection(state, 'Facility-Specific Research by Type');
  addSubsection(state, 'Skilled Nursing Facilities');
  addCheckbox(state, 'Specialty units: dementia care, wound care, short-term rehab, ventilator');
  addCheckbox(state, 'Average resident acuity and primary diagnoses');
  addCheckbox(state, 'Recent survey findings related to end-of-life care practices');
  addCheckbox(state, 'Staffing model: what is the typical CNA-to-resident and RN-to-resident ratio?');

  addSubsection(state, 'Hospitals');
  addCheckbox(state, 'Key service lines: oncology, cardiology, neurology, pulmonary');
  addCheckbox(state, 'Current readmission rates for CHF, pneumonia, COPD');
  addCheckbox(state, 'Whether they have a palliative care team and what its scope is');
  addCheckbox(state, 'Average length of stay for patients who die in-hospital');

  addSubsection(state, 'Physician Offices');
  addCheckbox(state, 'Specialty: primary care, oncology, cardiology, neurology, geriatrics');
  addCheckbox(state, 'Patient panel size and estimated number with serious illness');
  addCheckbox(state, 'Whether they have participated in MACRA / MIPS quality reporting');
  addCheckbox(state, 'Any known interest in advance care planning or goals of care conversations');

  addSection(state, 'Competitive Intelligence');
  addCheckbox(state, 'Primary hospice competitors in the territory: list names and market position');
  addCheckbox(state, 'Which competitor currently holds this account and how long');
  addCheckbox(state, 'Known strengths and weaknesses of each competitor');
  addCheckbox(state, 'Any recent changes at the competitor: staffing, ownership, reputation');
  addCheckbox(state, 'Whether the account has ever changed hospice providers and why');
  addCheckbox(state, 'Whether there is a formal or informal preferred vendor agreement in place');

  addSection(state, 'Call Preparation Checklist');
  addCheckbox(state, 'Identify one specific question about their patient population to open with');
  addCheckbox(state, 'Select one educational resource relevant to their primary diagnosis mix');
  addCheckbox(state, 'Prepare one relevant outcome or data point, not a product spec');
  addCheckbox(state, 'Have a clear ask for the end of the conversation (meeting, lunch-and-learn, follow-up call)');
  addCheckbox(state, 'Know who else in the building you want to meet during the same visit');
  addCheckbox(state, 'Check your CRM for the last visit notes and any open commitments you made');

  addTipBox(state, 'The Preparation Payoff', 'Research is not busywork. It is competitive advantage. When you can reference specific CMS quality data, mention a shared connection, or ask a question that shows you understand their specific challenges, you immediately separate yourself from every other rep who showed up with brochures and a business card. Preparation communicates respect for their time. Showing up unprepared communicates the opposite.');

  await finishDocument(state, 'public/resources/research-checklist.pdf');
}

// ─── PDF 4: REGULATIONS GUIDE ──────────────────────────────────────────────

async function createRegulationsGuide(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Medicare Hospice Regulations', 'Compliance Reference Guide for Hospice Sales Professionals', 'A plain-language summary of the Medicare Hospice Benefit, eligibility standards, disease-specific criteria, and compliance requirements relevant to sales conversations.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Medicare Hospice Regulations', 'What Every Hospice Sales Rep Needs to Know');

  addSection(state, 'The Medicare Hospice Benefit: Overview');
  addParagraph(state, 'The Medicare Hospice Benefit was established in 1983 and is governed by 42 CFR Part 418. It is a comprehensive benefit that covers all services related to the patient\'s terminal diagnosis, including physician services, nursing visits, aide services, social work, counseling, spiritual care, medications, medical equipment, and bereavement support for families.');
  addParagraph(state, 'Unlike most Medicare benefits, hospice is an elected benefit. The patient or their legal representative must sign an election statement choosing hospice care and agreeing to forgo curative treatment for the terminal diagnosis. Patients can revoke and re-elect hospice at any time, and can receive unlimited periods of care as long as they continue to meet eligibility criteria.');

  addSection(state, 'The Four Core Eligibility Requirements');
  addParagraph(state, 'Under 42 CFR 418.24, patients must meet all four of the following criteria to elect the Medicare Hospice Benefit:');
  addNumberedItem(state, 1, 'Medicare Part A Enrollment',
    'Patient must be enrolled in Medicare Part A (Hospital Insurance). This is typically automatic for people 65 and older who have worked at least 10 years in Medicare-covered employment. Patients under 65 may qualify through SSDI.');
  addNumberedItem(state, 2, 'Terminal Illness Certification',
    'A physician who is an employee or under contract with the hospice and the patient\'s attending physician (if the patient has one) must certify in writing that the patient has a terminal illness with a life expectancy of 6 months or less if the disease runs its normal course.');
  addNumberedItem(state, 3, 'Patient Election of Hospice',
    'The patient or their authorized representative must sign an election statement indicating they understand that choosing hospice means foregoing curative treatment for the terminal diagnosis. The statement must include the hospice name, acknowledgment of the palliative nature of the benefit, and acknowledgment of what services are not covered under the benefit.');
  addNumberedItem(state, 4, 'Compliance with Care Plan',
    'The patient must agree to follow the hospice plan of care and to receive care primarily through the hospice rather than from other Medicare providers for conditions related to the terminal diagnosis.');

  addSection(state, 'The Six-Month Prognosis Standard');
  addParagraph(state, 'The six-month prognosis standard is widely misunderstood in the field, both by referral sources and by sales reps. Here is what you need to know and be able to explain clearly:');
  addBullet(state, 'Six months is a probability, not a deadline. The physician is certifying that IF the disease runs its normal course, death would be expected within six months. This is not a guarantee or a cutoff.');
  addBullet(state, 'Patients do not lose their hospice benefit if they live longer than six months. They can continue as long as they continue to meet eligibility criteria and a physician recertifies them at each benefit period.');
  addBullet(state, 'The benefit periods are: two initial 90-day periods, followed by unlimited 60-day periods thereafter. At each recertification, the clinical team must document continued decline or medical need.');
  addBullet(state, 'If a patient\'s condition improves to the point they no longer have a terminal prognosis, they are discharged from hospice. They can re-elect the benefit later if they decline again.');
  addParagraph(state, 'When referral sources say "the patient isn\'t sick enough for hospice," they are often applying a more restrictive standard than the law actually requires. Your job is to educate them on what the eligibility criteria actually say.');

  addSection(state, 'Disease-Specific Eligibility Criteria');
  addSubsection(state, 'Congestive Heart Failure');
  addBullet(state, 'NYHA Class IV: symptoms of heart failure at rest or with any physical activity');
  addBullet(state, 'Ejection fraction at or below 20% despite optimal medical treatment');
  addBullet(state, 'Three or more hospitalizations for CHF exacerbation in the prior 12 months');
  addBullet(state, 'Persistent resting hypotension (systolic below 90) despite treatment');
  addBullet(state, 'Cachexia, renal insufficiency, or hyponatremia indicating multi-organ involvement');
  addBullet(state, 'Patient declining or not tolerating evidence-based therapies such as ACE inhibitors or beta blockers');

  addSubsection(state, 'COPD and Pulmonary Disease');
  addBullet(state, 'Disabling dyspnea at rest or with minimal exertion despite maximal bronchodilator therapy');
  addBullet(state, 'FEV1 below 30% of predicted value on pulmonary function testing');
  addBullet(state, 'Hypoxemia at rest requiring supplemental oxygen at 88% or less on room air');
  addBullet(state, 'Hypercapnia with PCO2 50 mmHg or greater on arterial blood gas');
  addBullet(state, 'Right heart failure secondary to pulmonary disease (cor pulmonale)');
  addBullet(state, 'Progressive weight loss or cachexia exceeding 10% body weight over 6 months');

  addSubsection(state, 'Cancer');
  addBullet(state, 'Metastatic disease or locally advanced disease not responsive to further treatment');
  addBullet(state, 'Patient has declined further curative treatment or is no longer a candidate');
  addBullet(state, 'Palliative Performance Scale (PPS) at or below 70% indicating meaningful functional limitation');
  addBullet(state, 'Rapid clinical decline over 4 to 6 weeks with weight loss, weakness, or altered cognition');
  addBullet(state, 'Symptomatic or laboratory evidence of active disease despite treatment');

  addSubsection(state, 'Dementia and Alzheimer Disease');
  addBullet(state, 'FAST Scale Stage 7 or beyond: severe cognitive decline with marked functional limitation');
  addBullet(state, 'Unable to ambulate, dress, bathe, or toilet without complete assistance');
  addBullet(state, 'Urinary and fecal incontinence consistently');
  addBullet(state, 'Limited meaningful verbal communication: fewer than 6 intelligible words per day');
  addBullet(state, 'Plus at least one complication in the prior 12 months: aspiration pneumonia, pyelonephritis, septicemia, decubiti Stage 3 or 4, or recurrent fever despite antibiotics');

  addSubsection(state, 'Renal Disease');
  addBullet(state, 'Patient not seeking dialysis or electing to discontinue dialysis');
  addBullet(state, 'Creatinine clearance below 10 ml per min (15 for diabetics)');
  addBullet(state, 'Serum creatinine above 8.0 mg per dl (6.0 for diabetics)');
  addBullet(state, 'Signs of uremia: confusion, restlessness, intractable nausea, reduced urine output');

  addSubsection(state, 'Neurological Disease (ALS, Stroke, Parkinson\'s)');
  addBullet(state, 'For ALS: critically impaired breathing with vital capacity below 30% predicted, dysphagia with weight loss, and at least one complication in the prior year');
  addBullet(state, 'For CVA: coma or persistent vegetative state beyond 3 days, dysphagia, or post-stroke dementia meeting FAST Stage 7 criteria');
  addBullet(state, 'For Parkinson\'s: Stage 3 or beyond with significant functional decline and complications');

  addSection(state, 'Compliance Landmines in Sales Conversations');
  addParagraph(state, 'Certain conversations and actions can create legal and regulatory risk. Every Spartan-trained rep understands where the compliance lines are and stays well clear of them.');
  addBullet(state, 'Never offer gifts, meals, entertainment, or anything of value to referral sources or their staff that exceeds the Anti-Kickback Statute safe harbor thresholds. As of 2026 the per-item limit is $21 and the annual aggregate per person limit is $420.');
  addBullet(state, 'Never imply that a patient qualifies for hospice without a clinical evaluation. You can educate on criteria but the eligibility determination belongs to the clinical team.');
  addBullet(state, 'Never pressure a facility to refer patients who have not been clinically evaluated, or suggest targets for the number of referrals they should be sending.');
  addBullet(state, 'Never discuss patient-specific clinical information with referral sources unless you have appropriate authorization. PHI protections under HIPAA apply to sales conversations.');
  addBullet(state, 'Never make guarantees about outcomes, length of stay, or the patient experience. These are clinical matters outside the scope of a sales conversation.');

  addTipBox(state, 'Compliance Is Competitive Advantage', 'The best hospice sales reps do not view compliance as a constraint. They view it as a differentiator. When you educate referral sources accurately, avoid questionable practices, and demonstrate clinical credibility, you build trust that competitors who cut corners will never achieve. Compliance is how the Spartan Method builds lasting market position.');

  await finishDocument(state, 'public/resources/regulations-guide.pdf');
}

// ─── PDF 5: FACILITY-SPECIFIC SCRIPTS ──────────────────────────────────────

async function createFacilityScripts(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Facility-Specific Scripts', 'Customized Conversation Guides by Healthcare Setting', 'Complete scripts for SNF directors of nursing, hospital discharge planners, physician offices, and assisted living administrators — each with openers, discovery questions, and closing language.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Facility-Specific Scripts', 'Tailoring Your Approach by Setting');

  addSection(state, 'Skilled Nursing Facilities');
  addSubsection(state, 'Who You Are Meeting With');
  addBullet(state, 'Director of Nursing (DON): Clinical authority, staff supervisor, often the decision-maker for hospice partnerships');
  addBullet(state, 'Social Worker / Discharge Planner: Typically initiates the referral conversation with families');
  addBullet(state, 'Administrator: Business relationship owner, may need to be brought in for formal partnership agreements');
  addBullet(state, 'MDS Coordinator: Manages care planning and is often the first to identify declining residents');

  addSubsection(state, 'Key Pain Points in SNF Settings');
  addBullet(state, 'Staff burnout from managing complex end-of-life needs without clinical support');
  addBullet(state, 'After-hours coverage gaps when residents decline rapidly');
  addBullet(state, 'Family dissatisfaction and complaint management during difficult care periods');
  addBullet(state, 'CMS pressure on quality measures related to symptom management and avoidable hospitalizations');

  addSubsection(state, 'Opening Script for DON');
  addScriptBox(state, `"Hi [Name], I am [Your Name] with [Hospice Company]. I work with skilled nursing facilities to provide 24-hour clinical support for your most complex residents — especially those with CHF, COPD, dementia, and cancer who are at high risk of hospitalization. I have a few questions about how your team currently manages those residents. Do you have 10 minutes to talk?"`);

  addSubsection(state, 'Discovery Questions for SNF Staff');
  addNumberedItem(state, 1, 'The Burden Question', '"When a resident is declining and the family is struggling to accept the situation, how does your team typically handle that conversation?"');
  addNumberedItem(state, 2, 'The After-Hours Question', '"How does your on-call team currently handle after-hours calls when a resident with serious illness needs clinical support?"');
  addNumberedItem(state, 3, 'The Timing Question', '"When residents do get referred to hospice, how long are they typically on service before they pass away?"');
  addNumberedItem(state, 4, 'The Readmission Question', '"Are there residents who are being hospitalized repeatedly for symptoms that hospice could manage here at the facility?"');

  addSubsection(state, 'Closing Language for SNF');
  addScriptBox(state, `"Based on what you have shared, I think there are a few specific situations where our clinical team could take a real burden off your staff — especially the after-hours support and the family communication piece. Would it make sense to schedule a time for me to meet with your social work team and walk through how our process works? No commitment, just a conversation to see if it is a good fit."`);

  addDivider(state);

  addSection(state, 'Hospital Discharge Planners');
  addSubsection(state, 'Who You Are Meeting With');
  addBullet(state, 'Case Managers and Discharge Planners: Primary referral initiators in hospital settings');
  addBullet(state, 'Palliative Care Team Members: Clinical partners who often support hospice transitions');
  addBullet(state, 'Social Workers: Family communication leads and emotional support resources');
  addBullet(state, 'Unit Charge Nurses: Day-to-day point of contact for patient transitions');

  addSubsection(state, 'Key Pain Points in Hospital Settings');
  addBullet(state, 'Readmission penalties affecting reimbursement under value-based purchasing programs');
  addBullet(state, 'Length of stay pressures with beds needed for higher-acuity patients');
  addBullet(state, 'Inadequate community resources for complex patients after discharge');
  addBullet(state, 'Family resistance to accepting the severity of a loved one\'s condition');

  addSubsection(state, 'Opening Script for Case Manager');
  addScriptBox(state, `"Hi [Name], I am [Your Name] from [Hospice Company]. I know you are managing a full board right now, so I will be brief. I work with hospitals to help reduce readmissions for patients with CHF, COPD, and cancer by ensuring they transition to the right level of care at the right time. I have helped case managers identify patients for earlier hospice conversations and streamline the referral process when families are ready. Is there a better time this week for me to walk you through our process?"`);

  addSubsection(state, 'Discovery Questions for Hospital Settings');
  addNumberedItem(state, 1, 'The Readmission Question', '"Which diagnosis categories are generating your highest readmission rates right now?"');
  addNumberedItem(state, 2, 'The Timing Question', '"When you identify a patient who might benefit from hospice, how early in the admission is that conversation typically happening?"');
  addNumberedItem(state, 3, 'The Family Question', '"When families are not ready to hear the hospice conversation, how does your team approach that?"');
  addNumberedItem(state, 4, 'The Process Question', '"What does your current referral process look like from initial conversation to actual discharge to hospice?"');

  addSubsection(state, 'Closing Language for Hospital');
  addScriptBox(state, `"Based on what you are describing, it sounds like timing is the biggest lever. I work with a few case managers at [similar hospital] who have found it helpful to have me do an initial family conversation alongside their social worker when there is resistance. It takes the pressure off your team and often moves things along more quickly. Could I show you how that works?"`);

  addDivider(state);

  addSection(state, 'Physician Offices');
  addSubsection(state, 'Who You Are Meeting With');
  addBullet(state, 'Primary Care Physicians: High-volume referral potential with diverse patient populations');
  addBullet(state, 'Oncologists: Highest acuity patient population with late-stage disease trajectory');
  addBullet(state, 'Cardiologists: CHF and advanced cardiac patients with complex end-of-life needs');
  addBullet(state, 'Neurologists: ALS, Parkinson\'s, and stroke patients with long decline trajectories');

  addSubsection(state, 'Key Pain Points in Physician Settings');
  addBullet(state, 'Limited time for complex goals-of-care conversations during office visits');
  addBullet(state, 'Difficulty identifying the right moment to introduce the hospice conversation');
  addBullet(state, 'Feeling that referring to hospice means abandoning the patient');
  addBullet(state, 'Administrative burden of certification paperwork and ongoing documentation');

  addSubsection(state, 'Opening Script for Physician');
  addScriptBox(state, `"Dr. [Name], I know your time is extremely limited, so I appreciate the 5 minutes. I am [Your Name] with [Hospice Company]. We work alongside physicians like you to manage symptom burden and support families for your patients with serious illness, so that you can focus on the care decisions while we handle the day-to-day support piece. I would love to ask you two clinical questions about how you currently approach those situations. Is that okay?"`);

  addSubsection(state, 'Discovery Questions for Physicians');
  addNumberedItem(state, 1, 'The Clinical Question', '"For patients with end-stage CHF or COPD, at what point do you typically begin introducing the comfort care conversation?"');
  addNumberedItem(state, 2, 'The Outcome Question', '"When patients do transition to hospice, do you typically stay involved in their care plan or does that relationship transfer?"');
  addNumberedItem(state, 3, 'The Documentation Question', '"The certification documentation for hospice can be time-intensive. What has your experience been with that process?"');

  addSubsection(state, 'Closing Language for Physician');
  addScriptBox(state, `"Many physicians tell me that they wish they had referred earlier because patients did so much better on hospice than expected. We can make the process very simple on your end — we handle the documentation, we provide the clinical updates, and you stay as involved in the patient\'s care as you want to be. Could we schedule a brief call with your nurse and me to talk through what that workflow would look like?"`);

  addDivider(state);

  addSection(state, 'Assisted Living Communities');
  addSubsection(state, 'Opening Script for ALF Administrator');
  addScriptBox(state, `"Hi [Name], I am [Your Name] with [Hospice Company]. We partner with assisted living communities to help residents age in place and avoid unnecessary emergency transfers during serious illness. I work with your staff to provide the clinical support and family communication that keeps residents comfortable at home. I have a couple of questions about how your community currently handles residents who are medically declining. Do you have 10 minutes?"`);

  addSubsection(state, 'Discovery Questions for ALF');
  addNumberedItem(state, 1, 'The Transfer Question', '"When a resident is declining significantly, what typically happens: do they stay in the community or transfer out?"');
  addNumberedItem(state, 2, 'The Family Question', '"Who typically has the conversation with the family about what options exist when a resident is near the end of life?"');
  addNumberedItem(state, 3, 'The Staff Question', '"How comfortable is your caregiving staff with managing residents who have significant symptom burden?"');

  addTipBox(state, 'Adapting to the Room', 'No script will work perfectly in every situation. Use these as starting frameworks, then listen carefully and adapt. The best hospice reps are skilled listeners first and skilled talkers second. When you are genuinely curious about a referral source\'s world, your questions feel natural and your conversations go deeper. Scripts become habits. Habits become instinct.');

  await finishDocument(state, 'public/resources/facility-specific-scripts.pdf');
}

// ─── PDF 6: FOLLOW-UP TEMPLATES ────────────────────────────────────────────

async function createFollowUpTemplates(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Follow-Up Communication Templates', 'Six Complete Email Templates for Advancing the Referral Relationship', 'Post-visit follow-ups, educational touchpoints, re-engagement sequences, and referral acknowledgments — ready for customization and use.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Follow-Up Communication Templates', 'Staying Top of Mind Without Being a Nuisance');

  addSection(state, 'The Follow-Up Discipline');
  addParagraph(state, 'Most hospice reps underinvest in follow-up. They visit an account, have a good conversation, and move on without sending a meaningful follow-up within 24 hours. The accounts that refer most consistently are often not the ones where the best first meeting happened. They are the ones where the rep followed up immediately, delivered on every promise, and stayed visible without being intrusive.');
  addParagraph(state, 'Each template below is designed for a specific scenario. Customize the bracketed fields before every use. Do not send generic messages. Reference something specific from your interaction.');

  addSection(state, 'Template 1: Post-First-Visit Follow-Up');
  addParagraph(state, 'Send within 24 hours of your first meeting with a new contact. This is your most important follow-up message.');
  addEmailTemplate(state,
    'Great to Meet You Today, [Name]',
    `Hi [Name],

Thank you for taking time to speak with me today. I genuinely appreciated learning about how your team approaches care transitions for your [residents / patients] — especially the point you made about [specific detail from conversation].

As I mentioned, I am attaching a short resource on hospice eligibility criteria for patients with [primary diagnosis they mentioned]. I think the section on [specific topic] will be particularly relevant given what you shared.

Based on our conversation, I would love to schedule 20 minutes with you and [other staff member if relevant] to walk through how our team supports facilities like yours. I am available [two specific time options]. Which works better for you?

Looking forward to continuing the conversation.

[Your Name]
[Your Direct Phone]
[Your Email]`);

  addSection(state, 'Template 2: Educational Value Email');
  addParagraph(state, 'Send to contacts you have met at least once. This is a non-sales touchpoint that reinforces your clinical credibility.');
  addEmailTemplate(state,
    'Resource: [Topic Relevant to Their Patient Population]',
    `Hi [Name],

I came across this information and immediately thought of the conversation we had about [specific topic they mentioned]. I wanted to share it with you in case it is helpful for your team.

The key takeaway: [one-sentence clinical insight or data point relevant to their situation].

This comes up fairly often in facilities managing [primary diagnosis] patients, and a lot of teams find it helps them have earlier, more confident conversations with families.

No action required — just wanted to share something useful. If you ever want to talk through any of these situations in more detail, I am always available.

[Your Name]
[Your Direct Phone]`);

  addSection(state, 'Template 3: Quarterly Touchpoint');
  addParagraph(state, 'Send to active referral partners every 8 to 12 weeks to maintain the relationship and stay top of mind.');
  addEmailTemplate(state,
    'Checking In — [Season] 2026',
    `Hi [Name],

I hope [season] has been going well for your team. I wanted to check in and let you know that [specific positive outcome or case reference if appropriate and compliant with HIPAA].

I have also been meaning to follow up on something you mentioned last time — [callback to previous conversation]. I would love to hear how that situation has developed.

If you would find it helpful, I have a new resource on [topic relevant to their current needs] that several of your colleagues in similar facilities have found useful. Happy to drop it off or send it over digitally — whatever is easier.

Let me know if there is anything I can help with. I always appreciate the trust you put in our team.

[Your Name]`);

  addSection(state, 'Template 4: Re-Engagement for Quiet Accounts');
  addParagraph(state, 'Send to accounts that have gone quiet after previous referral activity. Timing: when referrals drop off for 30 or more days with no clear reason.');
  addEmailTemplate(state,
    'Checking In — Has Anything Changed?',
    `Hi [Name],

I noticed I have not heard from you in a few weeks and wanted to reach out. I hope everything is going well with your team.

I want to be direct: if there has been anything about our service or responsiveness that fell short of what you expected, I would genuinely want to hear about it. My commitment to you and your [residents / patients] is too important for me to just let a silence go without checking in.

If everything is fine and it has just been a quiet period, that is great too. I am always here when you need us.

Is there anything I can help with right now?

[Your Name]
[Your Direct Phone]`);

  addSection(state, 'Template 5: Referral Thank-You');
  addParagraph(state, 'Send within 24 hours of receiving a referral. This is non-negotiable. Fast, specific acknowledgment builds loyalty.');
  addEmailTemplate(state,
    'Thank You for the Referral',
    `Hi [Name],

I wanted to reach out right away to thank you for referring [patient first name only if HIPAA-compliant, or "your patient"] to our team. I know that trust is earned, and I do not take it lightly that you chose us.

Our clinical team has already [reached out / made contact / begun the evaluation process] and we will keep you updated as appropriate.

If there is anything you need from our end, please do not hesitate to contact me directly. I am always available for you.

[Your Name]
[Your Direct Phone]`);

  addSection(state, 'Template 6: Holiday Touchpoint');
  addParagraph(state, 'Send during major holidays (Thanksgiving, winter holidays, New Year). Keep it brief and personal, not promotional.');
  addEmailTemplate(state,
    'Wishing You a Restful [Holiday]',
    `Hi [Name],

I just wanted to reach out and wish you and your team a wonderful [holiday]. The work you do for families during some of the hardest moments of their lives is something I truly respect.

I am grateful for the partnership we have built and look forward to continuing to support your team in the year ahead.

Take good care, and I hope you get some rest.

[Your Name]`);

  addSection(state, 'Follow-Up Scheduling Guidelines');
  addBullet(state, 'Post-first-visit email: within 24 hours, always');
  addBullet(state, 'Post-referral thank-you: same day if possible, 24 hours maximum');
  addBullet(state, 'Educational touchpoint: every 4 to 6 weeks for B Tier accounts');
  addBullet(state, 'Quarterly check-in: every 10 to 12 weeks for A Tier accounts');
  addBullet(state, 'Re-engagement after silence: at 30 days of no contact');
  addBullet(state, 'Never send two emails in one week unless there is a specific urgent reason');

  addTipBox(state, 'The One-Line Rule', 'Every follow-up email should have at least one sentence that could only have been written after meeting that specific person. If you cannot write that sentence, your follow-up is generic and it will be treated like spam. The line that proves you were listening is the line that gets the reply.');

  await finishDocument(state, 'public/resources/followup-templates.pdf');
}

// ─── PDF 7: PHYSICIAN STRATEGY ─────────────────────────────────────────────

async function createPhysicianStrategy(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Physician Engagement Strategy', 'Building Medical Referral Relationships Through Clinical Credibility', 'A complete framework for earning physician trust, speaking the clinical language, structuring CME partnerships, and converting skeptics into long-term referral champions.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Physician Engagement Strategy', 'Earning the Trust of the Most Difficult Referral Source in Healthcare');

  addSection(state, 'Understanding the Physician Mindset');
  addParagraph(state, 'Physicians are trained to be skeptical. They are evidence-driven, time-constrained, and have been pitched by pharmaceutical reps, device companies, and other service providers for their entire careers. They have excellent radar for when someone is wasting their time or talking to them without genuine clinical understanding.');
  addParagraph(state, 'The most common mistake hospice sales reps make with physicians is leading with features and benefits. Physicians do not care about your hospice\'s response times, your star ratings, or your service coverage area in the first conversation. They care about whether you understand their patients, their challenges, and their clinical reasoning. Earn that first, and the operational details follow naturally.');

  addSection(state, 'The Five Physician Archetypes');
  addSubsection(state, '1. The Paternalistic Physician (Most Common)');
  addParagraph(state, 'This physician has a deep emotional attachment to their patients and views hospice conversations as admissions of defeat. They delay referrals because accepting a terminal prognosis feels like abandonment. Approach with respect for their commitment and reframe hospice as a continuation of their care, not an ending.');

  addSubsection(state, '2. The Busy Practitioner');
  addParagraph(state, 'This physician simply does not have time to think carefully about their patients with serious illness. They are managing a panel of 2,000 people and the hospice conversation falls to the bottom of the priority stack. Approach by making the process as frictionless as possible and offering to handle the family conversation on their behalf.');

  addSubsection(state, '3. The Evidence Follower');
  addParagraph(state, 'This physician wants clinical data before making any referral decision. They will respond to published research on hospice outcomes, symptom management effectiveness, and quality of life metrics. Come prepared with peer-reviewed evidence and speak in clinical terms.');

  addSubsection(state, '4. The Champion (Your Goal)');
  addParagraph(state, 'This physician has had a transformative experience with hospice, either personally or clinically, and has become an advocate. They refer early and often. Maintain these relationships with consistency and excellent follow-through. Protect them carefully because their loyalty is your biggest competitive advantage.');

  addSubsection(state, '5. The Burned Skeptic');
  addParagraph(state, 'This physician had a bad experience with hospice previously. A late admission, poor clinical support, or communication failure created permanent skepticism. Identify the specific incident if possible, acknowledge it directly, and demonstrate through actions rather than words that your team is different.');

  addSection(state, 'The Clinical Conversation Framework');
  addSubsection(state, 'Opening with Clinical Relevance');
  addScriptBox(state, `"Dr. [Name], I appreciate the few minutes. I work with physicians managing patients with advanced heart failure and COPD, and I know that the conversation about shifting goals of care is one of the hardest conversations in medicine. I wanted to ask you directly: in your experience, at what point do your patients typically begin expressing that they want to prioritize comfort over curative intervention?"`);

  addSubsection(state, 'Three Clinical Talking Points That Resonate');
  addNumberedItem(state, 1, 'The Outcome Data Point',
    '"Studies in JAMA and NEJM have consistently shown that patients with advanced cancer or CHF who enroll in hospice earlier experience lower symptom burden, fewer hospitalizations in their final months, and in some cases live longer than similar patients who continue aggressive treatment. The evidence is genuinely compelling."');
  addNumberedItem(state, 2, 'The Care Continuation Point',
    '"Many physicians worry that referring to hospice means losing their relationship with the patient. In practice, most of our physicians stay actively involved. We send clinical updates at every meaningful change and we actively seek their input on symptom management decisions. Hospice extends your care — it does not replace it."');
  addNumberedItem(state, 3, 'The Administrative Relief Point',
    '"I know the certification documentation can be time-intensive. We have a process that minimizes what you need to do on your end. We handle the clinical narrative, we coordinate with your office for signature, and we send a clear summary of what you need to certify and why. Most physicians tell me it takes less than three minutes of their time."');

  addSection(state, 'CME Partnership Opportunities');
  addParagraph(state, 'Educational programming is one of the highest-value relationship builders with physicians because it positions your hospice as a clinical resource rather than a sales vendor. The following formats work well in physician settings:');
  addBullet(state, 'Grand Rounds: 30 to 45 minute presentation on a clinically relevant topic such as symptom management in advanced heart failure or the evidence base for early hospice enrollment. Best for hospital-based physicians.');
  addBullet(state, 'Lunch and Learn: 15 to 20 minute educational session at the practice. Focus on eligibility criteria for the specialty\'s primary diagnoses. Bring food. Keep slides to a minimum.');
  addBullet(state, 'Case Conference: Monthly or quarterly review of complex patients in the physician\'s panel. Your hospice medical director participates alongside the attending. Builds the deepest clinical trust.');
  addBullet(state, 'Written Resource: A one-page clinical reference card tailored to the specialty\'s primary diagnoses, featuring eligibility criteria, clinical indicators, and your contact information.');

  addSection(state, 'Sample Quarterly Business Review Agenda');
  addParagraph(state, 'Conduct a brief business review with your highest-volume physician partners every 90 days. Keep it to 20 minutes or less. The agenda signals that you take the partnership seriously and are tracking outcomes.');
  addSubsection(state, 'Agenda: 20-Minute QBR with a High-Volume Physician Partner');
  addNumberedItem(state, 1, 'Outcomes Update (5 min)', 'Share aggregate data on patients referred over the prior quarter: average length of stay, family satisfaction summary, any notable care moments you can share without violating HIPAA.');
  addNumberedItem(state, 2, 'Process Review (5 min)', 'Ask if the referral process is working smoothly. Address any documentation friction, response time concerns, or communication gaps.');
  addNumberedItem(state, 3, 'Clinical Education (5 min)', 'Share one clinical update, case study, or data point that is relevant to the cases they are seeing most often.');
  addNumberedItem(state, 4, 'Next Quarter Planning (5 min)', 'Identify any specific patients or case types where you can provide more support. Agree on next touchpoint.');

  addSection(state, 'Conversion Timeline Expectations');
  addParagraph(state, 'Physician relationship development is a long-cycle process. Do not expect referrals within the first two or three visits. Below are realistic timeline expectations based on Spartan Method application:');
  addBullet(state, 'Months 1 to 2: Introduction and education phase. You are planting seeds and establishing credibility. No referrals expected.');
  addBullet(state, 'Month 3: First informal referral inquiry or request for more information. This is a positive signal.');
  addBullet(state, 'Months 4 to 5: First patient referral, usually a patient the physician has been thinking about for some time. Deliver an exceptional experience.');
  addBullet(state, 'Month 6 onward: Regular referral pattern begins if you have delivered on the first one. This is when consistency of visits and follow-through compounds into a champion relationship.');

  addTipBox(state, 'The Physician Relationship Rule', 'Never waste a physician\'s time. Not their physical time in a meeting, and not their cognitive time with a disorganized pitch. Be brief, be clinical, and be prepared. Every second you spend on company boilerplate is a second you could spend asking a question that builds trust. Physicians reward those who respect their expertise by treating them as clinical peers, not as sales targets.');

  await finishDocument(state, 'public/resources/physician-strategy.pdf');
}

// ─── PDF 8: CASE STUDIES ───────────────────────────────────────────────────

async function createCaseStudies(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Case Studies: Real Results', 'Three Detailed Narratives of Spartan Method Success', 'Anonymized accounts of a territory turnaround, a physician conversion, and a new hire ramp-up — each with the challenge, the approach, and the quantified outcomes.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Case Studies: Real Results', 'What the Spartan Method Looks Like in the Field');

  addSection(state, 'How to Use These Case Studies');
  addParagraph(state, 'These case studies are not for presentation purposes. Do not hand them to referral sources as marketing collateral. Instead, use them privately to study the pattern of what worked, why it worked, and how the specific Spartan Method principles applied in a real-world situation. The value is in the debrief, not in the story itself.');
  addParagraph(state, 'When a referral source describes a challenge that mirrors one of these cases, you can draw on the language and approach from the matching case study. Do not quote the case study directly. Internalize the insight and apply it naturally in the conversation.');

  addSection(state, 'Case Study 1: SNF Territory Turnaround');
  addSubsection(state, 'The Situation');
  addParagraph(state, 'A hospice organization in a mid-sized metro market assigned an experienced rep to a territory that had produced fewer than 8 admissions per month for 18 consecutive months. The prior rep had been in the territory for 3 years and had solid relationships but had stopped growing. The top 12 SNF accounts in the territory were all sending referrals elsewhere. The new rep was given 90 days to show meaningful progress before the organization would consider reassigning the territory.');

  addSubsection(state, 'The Diagnosis');
  addParagraph(state, 'After 30 days of purely observational visits with no sales agenda, the rep identified three root causes: First, the prior rep had transitioned too quickly to a maintenance mode and had stopped running meaningful discovery conversations. Second, several accounts had unresolved service quality complaints that were never addressed. Third, the rep had never built relationships beyond the social workers, leaving DONs and administrators completely unengaged.');

  addSubsection(state, 'The Spartan Approach Applied');
  addNumberedItem(state, 1, 'Discovery Restart',
    'The rep spent the first 45 days conducting genuine Stage 1 Discovery conversations with decision-makers who had never been properly engaged. She asked about pain points, operations, and experiences with the previous hospice provider without defending or apologizing for anything. She just listened.');
  addNumberedItem(state, 2, 'Service Issue Resolution',
    'She escalated three service quality concerns to clinical leadership and followed up with the affected accounts to personally communicate that the issues had been addressed and what had changed. Two of those accounts became active referrers within 60 days.');
  addNumberedItem(state, 3, 'Stakeholder Expansion',
    'She mapped every key contact at each A Tier account and identified that she was missing the DON at seven of her top twelve facilities. She built those relationships specifically, focusing on clinical support for complex cases rather than general service pitches.');
  addNumberedItem(state, 4, 'Lunch and Learn Series',
    'She ran eight lunch-and-learn sessions in 90 days on topics specifically requested by her accounts based on the discovery conversations. Two of those sessions led to direct referrals within the following week.');

  addSubsection(state, 'The Results (at 90 Days)');
  addBullet(state, 'Monthly admissions grew from 8 to 23, an increase of 188%');
  addBullet(state, 'Active referral sources expanded from 4 to 14 across the territory');
  addBullet(state, 'Average hospice length of stay increased from 12 to 31 days as relationships with earlier-referring accounts deepened');
  addBullet(state, 'Two accounts that had been locked by competitors began sending referrals after unresolved service complaints at the competitor became known');

  addSubsection(state, 'Key Lessons');
  addBullet(state, 'Maintenance mode is the beginning of account loss. Active discovery conversations must continue even at established accounts.');
  addBullet(state, 'Unresolved service complaints are the single most common reason accounts go quiet. Addressing them directly and fast is the fastest path to re-engagement.');
  addBullet(state, 'Stakeholder mapping below the social worker level is a major differentiator. DON and administrator relationships create access no competitor can easily replicate.');

  addSection(state, 'Case Study 2: The Skeptical Oncologist');
  addSubsection(state, 'The Situation');
  addParagraph(state, 'A large oncology group practice in a suburban market had not referred a single patient to the local hospice organization in two years. The previous rep had been told by the office manager that the physicians preferred to manage their own end-of-life transitions and did not want to involve hospice until the final days of a patient\'s life. The practice saw over 400 patients per month across six physicians.');

  addSubsection(state, 'The Diagnosis');
  addParagraph(state, 'After careful inquiry, the rep discovered that a patient had passed away at a local hospice two years prior under circumstances the lead oncologist considered medically inappropriate. The family had complained to the physician, and the physician had developed a blanket policy against hospice referrals as a result. The incident had never been addressed or acknowledged by the hospice organization.');

  addSubsection(state, 'The Spartan Approach Applied');
  addParagraph(state, 'The rep requested a one-on-one meeting with the lead oncologist specifically to listen, not to pitch. In the meeting, she asked directly whether there had been a negative experience with hospice that she should understand before they talked further. The oncologist shared the story in detail. The rep listened fully without interrupting or defending the organization.');
  addParagraph(state, 'She then said: "I appreciate you telling me that. I cannot speak to what happened with the prior team, but I can tell you what my clinical standards are and what I personally commit to for your patients. Would you be willing to give me one patient to evaluate so I can show you rather than tell you?" The oncologist agreed, largely because no one from hospice had ever asked about the incident directly.');

  addSubsection(state, 'The Results (at 6 Months)');
  addBullet(state, 'The first patient referral received exceptional clinical care and the oncologist received a detailed clinical update at every meaningful change in the patient\'s condition');
  addBullet(state, 'Within 30 days of the first patient\'s death, the oncologist referred two more patients');
  addBullet(state, 'At six months, the practice was generating 6 to 9 referrals per month and had become the rep\'s highest-volume physician account');
  addBullet(state, 'The oncologist agreed to participate in a grand rounds presentation on early palliative intervention the following quarter');

  addSubsection(state, 'Key Lessons');
  addBullet(state, 'Unexplained silence from a physician account almost always has a story behind it. Find out what happened before you try to sell anything.');
  addBullet(state, 'Asking about negative experiences directly builds more credibility than pretending they did not happen. It signals confidence and honesty.');
  addBullet(state, 'One exceptional patient experience with a skeptic is worth more than 20 sales calls. Make the first referral extraordinary.');

  addSection(state, 'Case Study 3: New Hire Ramp-Up');
  addSubsection(state, 'The Situation');
  addParagraph(state, 'A hospice organization hired a rep with no healthcare background. She had five years of B2B sales experience in commercial real estate. Her manager was skeptical but took a chance based on her exceptional listening skills and coachability. The territory was mid-sized with moderate competition and no prior rep history, meaning no existing relationships.');

  addSubsection(state, 'The Approach');
  addParagraph(state, 'Rather than forcing her into traditional healthcare sales training, her manager followed the Spartan Method new hire ramp exactly as written. Weeks one and two were purely shadow and learn: she rode along with an experienced rep, attended clinical team meetings, visited patients with nurses (with appropriate consent), and read everything available about hospice eligibility and the Medicare benefit. She did not make a single sales call for the first two weeks.');
  addParagraph(state, 'Weeks three and four were introduction-only visits: she introduced herself at every account in her territory with no agenda beyond meeting people and asking one question about how they handled patients with serious illness. She took detailed notes and never mentioned her hospice\'s service features.');

  addSubsection(state, 'The Results at 30 Days');
  addBullet(state, 'She had met contacts at 34 accounts and had follow-up meetings scheduled at 11 of them');
  addBullet(state, 'She had received her first referral at day 28 from a social worker who said "you are the first hospice rep who actually listened to what I said"');
  addBullet(state, 'By month three she was producing 9 admissions per month, ahead of the 6 month target');
  addBullet(state, 'At the six month mark she was the second highest producing rep in the organization');

  addSubsection(state, 'Key Lessons');
  addBullet(state, 'Healthcare background matters far less than listening skills and genuine curiosity about the referral source\'s world');
  addBullet(state, 'The first 30 days should be spent learning, not selling. Reps who rush into sales mode in week one build weak relationships that rarely generate consistent referrals');
  addBullet(state, 'Detailed call notes from early visits compound into relationship capital over time. What you learn in month one becomes the material for your month three conversations');

  addTipBox(state, 'Using Case Studies in the Field', 'When a referral source describes a challenge you recognize from one of these cases, do not tell the story. Ask a question that leads them to arrive at the same insight on their own. The insight they discover themselves is far more powerful than the one you hand them. Your job is to create the conditions for that discovery, not to perform it for them.');

  await finishDocument(state, 'public/resources/case-studies.pdf');
}

// ─── PDF 9: DECISION FRAMEWORKS ───────────────────────────────────────────

async function createDecisionFrameworks(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Decision Frameworks', 'Strategic Tools for Field Sales Excellence', 'Account prioritization, objection response protocol, stage advancement criteria, weekly planning structure, and the referral readiness scoring model for Spartan-method practitioners.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Decision Frameworks', 'Tools for Making the Right Call in Every Situation');

  addSection(state, 'The Spartan Method: Four-Stage Framework');
  addParagraph(state, 'The Spartan Healthcare Sales Mastery Model is not a linear checklist. It is a dynamic diagnostic tool. At any given moment in any given account, you are operating in one of four stages. The discipline is in knowing which stage you are in and resisting the temptation to skip ahead.');
  addSalesStage(state, 1, 'Discovery', 'Learn about the account: census, operations, referral processes, decision-makers, and organizational challenges. Never move to Stage 2 without a clear picture of how the account works.');
  addSalesStage(state, 2, 'Connecting', 'Build individual rapport with your key contact. Learn their personal professional motivations, what success looks like to them, and what frustrates them about their current situation. This is where trust is built.');
  addSalesStage(state, 3, 'Guiding', 'Align what you have learned in Stages 1 and 2 to what your hospice can provide. This is not a product presentation. It is a guided conversation where you help them see how your support solves their specific problems.');
  addSalesStage(state, 4, 'Commitment', 'Ask for the referral or partnership clearly and confidently. You have earned the right to ask because you have done the work in the previous three stages. A weak close is almost always a sign that Stages 1 to 3 were incomplete.');

  addSection(state, 'Account Prioritization Matrix');
  addParagraph(state, 'Use this matrix to make clear decisions about where to invest your time. Review weekly and adjust as account behaviors change.');
  const priorityWidths = [80, 140, 120, 164];
  addTableRow(state, ['Priority', 'Characteristics', 'Time Allocation', 'Primary Stage Focus'], priorityWidths, true);
  addTableRow(state, ['A: Strategic', 'High potential, actively referred or near commitment', '50% of call time', 'Stages 3 and 4'], priorityWidths);
  addTableRow(state, ['B: Developing', 'Good potential, relationship building in progress', '30% of call time', 'Stages 1 and 2'], priorityWidths);
  addTableRow(state, ['C: Monitoring', 'Lower potential or high competitive barrier', '20% of call time', 'Stage 1 maintenance'], priorityWidths);
  state.y += 10;

  addSection(state, 'The ACE Objection Response Protocol');
  addParagraph(state, 'Every objection you hear in the field can be handled with the ACE method. Master this three-step response and you will never be caught off guard.');
  addNumberedItem(state, 1, 'Acknowledge',
    'Show the other person that you heard them and that their concern is valid. Never argue, qualify, or start your response with "but." Examples: "That makes complete sense." / "I hear you." / "A lot of people in your position feel exactly the same way."');
  addNumberedItem(state, 2, 'Clarify',
    'Ask a question that helps you understand the root cause of the objection. The objection they state is often not the objection that is actually blocking the decision. Examples: "Help me understand what specifically feels like it is not the right fit." / "What would need to be different for this to make sense?"');
  addNumberedItem(state, 3, 'Educate',
    'Provide information that directly addresses the underlying concern. Use data, a case story, or a reframe. Never give a sales pitch in this moment. Give a specific, relevant answer to the specific concern they expressed.');

  addSection(state, 'Stage Advancement Criteria');
  addSubsection(state, 'Discovery to Connecting (Stage 1 to Stage 2)');
  addCheckbox(state, 'You can describe how the account\'s referral process works from identification to discharge');
  addCheckbox(state, 'You have identified the primary clinical challenges this account faces with their end-of-life population');
  addCheckbox(state, 'You know who the key decision-makers and influencers are and have met at least one');
  addCheckbox(state, 'You have had a conversation long enough to earn the right to a follow-up meeting');

  addSubsection(state, 'Connecting to Guiding (Stage 2 to Stage 3)');
  addCheckbox(state, 'Your key contact has shared a specific professional pain point, goal, or frustration');
  addCheckbox(state, 'You have delivered educational value that they have responded positively to');
  addCheckbox(state, 'You have built enough rapport that they are willing to share candid information about their situation');
  addCheckbox(state, 'They have expressed at least passive interest in understanding how your hospice works');

  addSubsection(state, 'Guiding to Commitment (Stage 3 to Stage 4)');
  addCheckbox(state, 'They have acknowledged that your approach addresses their specific challenges');
  addCheckbox(state, 'All major objections have been surfaced and addressed');
  addCheckbox(state, 'All relevant decision-makers have been engaged, not just the most accessible contact');
  addCheckbox(state, 'They have used language that implies forward movement: "that would be helpful," "let us try," "who would I contact?"');

  addSection(state, 'Weekly Planning Framework');
  addSubsection(state, 'Monday: Planning and Preparation');
  addBullet(state, 'Review last week\'s call notes and identify any open commitments you made');
  addBullet(state, 'Confirm appointments and prioritize accounts to visit by tier');
  addBullet(state, 'Prepare educational resources and talking points for each planned visit');
  addBullet(state, 'Identify one new prospect account to add to your C Tier list');

  addSubsection(state, 'Tuesday through Thursday: High-Value Field Days');
  addBullet(state, 'Concentrate all in-person A and B Tier visits during these three days');
  addBullet(state, 'Target a minimum of 8 to 12 live conversations per day');
  addBullet(state, 'Send same-day follow-up emails for any meaningful conversations');
  addBullet(state, 'Document all visit notes in your CRM within 4 hours of each call');

  addSubsection(state, 'Friday: Follow-Up and Planning');
  addBullet(state, 'Complete any remaining CRM documentation from the week');
  addBullet(state, 'Review weekly activity totals against targets: conversations, referrals, admissions');
  addBullet(state, 'Identify which accounts advanced a stage and which stalled');
  addBullet(state, 'Begin territory planning for the following week');
  addBullet(state, 'Send one educational or follow-up email to a quiet account you have not visited recently');

  addSection(state, 'Referral Readiness Scoring Model');
  addParagraph(state, 'Use this model to predict which accounts are most likely to refer in the next 30 days. Score each A and B Tier account monthly on these five factors, 1 to 5 each (5 = highest readiness):');
  addBullet(state, 'Relationship Depth: How strong is your relationship with the primary decision-maker?');
  addBullet(state, 'Stage Progression: Have you completed meaningful Discovery and Connecting work?');
  addBullet(state, 'Patient Volume Signal: Are there patients in this account who likely meet eligibility criteria right now?');
  addBullet(state, 'Competitive Weakness: Is there any dissatisfaction with the current hospice provider?');
  addBullet(state, 'Recent Engagement: Have they engaged with your educational content or follow-up recently?');
  addParagraph(state, 'Total score 20 to 25: Priority focus — a referral is likely within 30 days if you maintain contact frequency. Score 13 to 19: Active development — continue building relationship and education cadence. Score below 13: Stage reset may be needed — go back to genuine discovery.', 10);

  addTipBox(state, 'Framework Discipline', 'These frameworks are not theoretical tools. They are field instruments designed to help you make better decisions under the time pressure and unpredictability of real sales situations. The rep who has internalized these frameworks makes better decisions faster than one who is improvising. Drill them until they are instinct, not memory.');

  await finishDocument(state, 'public/resources/decision-frameworks.pdf');
}

// ─── PDF 10: DECISION TREES ────────────────────────────────────────────────

async function createDecisionTrees(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Qualifying Decision Trees', 'Visual Logic Tools for Referral Source Conversations', 'Step-by-step decision frameworks for qualifying patient appropriateness, advancing stage conversations, and diagnosing stalled accounts.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Qualifying Decision Trees', 'Making the Right Call at Every Step');

  addSection(state, 'Decision Tree 1: Is This Account Ready to Refer?');
  addParagraph(state, 'Work through the following questions in order at any A or B Tier account. Each answer directs you to the appropriate next action. Do not skip questions.');

  addSubsection(state, 'Question 1: Have you had a meaningful discovery conversation?');
  addBullet(state, 'Yes, continue to Question 2');
  addBullet(state, 'No, action: Schedule a 15-minute discovery visit. Use the Stage 1 opener from the Cold Call Script. Do not try to advance past this step.');

  addSubsection(state, 'Question 2: Have you identified a specific pain point this account has?');
  addBullet(state, 'Yes, continue to Question 3');
  addBullet(state, 'No, action: You need one more discovery conversation focused on their challenges. Ask: "What is the hardest part of managing your most medically complex residents right now?"');

  addSubsection(state, 'Question 3: Have you delivered educational content specific to their pain point?');
  addBullet(state, 'Yes, continue to Question 4');
  addBullet(state, 'No, action: Schedule a lunch-and-learn or drop off a targeted resource. This is the bridge between Stage 2 and Stage 3. Educational value is the currency of trust in clinical settings.');

  addSubsection(state, 'Question 4: Has the contact responded positively to your educational content?');
  addBullet(state, 'Yes, continue to Question 5');
  addBullet(state, 'No response, action: Follow up with a direct phone call. Ask: "I sent over that resource last week — did you get a chance to glance at it? I wanted to hear your thoughts."');
  addBullet(state, 'Negative response, action: Ask what type of information they would find more useful. Pivot to their preferred learning format.');

  addSubsection(state, 'Question 5: Are there patients in this account who likely meet eligibility criteria right now?');
  addBullet(state, 'Yes, action: Ask directly — "Is there anyone you are managing right now who you have been wondering about in terms of appropriateness for comfort-focused care?"');
  addBullet(state, 'Unknown, action: Offer to conduct a brief case review with the clinical team. Phrase it as educational, not as a patient screening service.');
  addBullet(state, 'No, action: Maintain contact frequency and ask about patient mix and recent clinical trends during each visit.');

  addSection(state, 'Decision Tree 2: Why Is This Account Not Referring?');
  addParagraph(state, 'Use this tree when an account has the potential to refer but has gone quiet or is actively referring elsewhere. Work through each branch until you find the root cause.');

  addSubsection(state, 'Branch A: Competitor Is Entrenched');
  addBullet(state, 'Indicators: Account praises current provider, has long-standing relationship, never mentions dissatisfaction');
  addBullet(state, 'Strategy: Do not attack the competitor. Build your own relationship on the margin. Ask: "If there were ever a situation where your current provider wasn\'t the right fit for a particular patient or family, what would that situation look like?"');
  addBullet(state, 'Patience required: Competitor entrenchment typically takes 6 to 18 months to break without a service failure event. Focus on relationship depth while you wait for an opening.');

  addSubsection(state, 'Branch B: Service Quality Issue');
  addBullet(state, 'Indicators: Account was previously active but referrals dropped suddenly or gradually, contact is less warm in recent visits');
  addBullet(state, 'Strategy: Ask directly — "I want to make sure our team is giving you and your patients the level of support you expect. Has anything happened that I should know about?" Then listen without defending.');
  addBullet(state, 'Escalate: If there is a legitimate service concern, escalate it to clinical leadership the same day. Follow up with the account within 48 hours with a specific update on what is being done.');

  addSubsection(state, 'Branch C: Decision-Maker Has Changed');
  addBullet(state, 'Indicators: New DON, new discharge planner, new social worker at previously active account');
  addBullet(state, 'Strategy: Request an introduction meeting with the new decision-maker. Your relationship with the predecessor carries no weight. Start Stage 1 fresh.');
  addBullet(state, 'Opportunity: A leadership change at a previously locked account is a prime opportunity to establish a relationship before a competitor does. Move quickly.');

  addSubsection(state, 'Branch D: Contact Is Not a True Decision-Maker');
  addBullet(state, 'Indicators: Contact is friendly and engaged but referrals never materialize, they always defer to someone else');
  addBullet(state, 'Strategy: Ask — "Who else on your team is typically involved when a patient is being considered for hospice?" Then build a relationship with the identified stakeholder, keeping your current contact involved.');
  addBullet(state, 'Caution: Do not abandon a helpful contact even if they are not the decision-maker. Champions and influencers provide access you cannot get directly.');

  addSubsection(state, 'Branch E: Awareness or Knowledge Gap');
  addBullet(state, 'Indicators: Contact seems genuinely uncertain about when hospice is appropriate, asks basic eligibility questions, defers to physicians who are also uncertain');
  addBullet(state, 'Strategy: This is an education opportunity, not a sales problem. Offer a lunch-and-learn specifically on eligibility criteria for their primary patient diagnoses. Frame it as serving the clinical team, not as a sales visit.');
  addBullet(state, 'Outcome: Education-driven conversions tend to produce the most loyal long-term referral sources because the relationship started with genuine value delivery.');

  addSection(state, 'Decision Tree 3: Should I Ask for the Referral Today?');
  addParagraph(state, 'This is the question that stops many reps. They are afraid to ask too early and damage the relationship. They are equally afraid to wait too long and miss the moment. Use these criteria to make a clear decision.');

  addSubsection(state, 'Ask today if all of the following are true:');
  addCheckbox(state, 'You have completed meaningful Discovery and Connecting conversations with this contact');
  addCheckbox(state, 'They have acknowledged a specific patient need that your hospice can address');
  addCheckbox(state, 'There are no major unresolved objections or concerns that they have raised');
  addCheckbox(state, 'They have responded positively to your most recent educational content or visit');
  addCheckbox(state, 'You know of at least one patient in the facility who may currently be eligible');

  addSubsection(state, 'Do NOT ask today if any of the following are true:');
  addCheckbox(state, 'You are still in Stage 1 Discovery and have not built individual rapport yet');
  addCheckbox(state, 'They have expressed a concern or objection that you have not yet addressed');
  addCheckbox(state, 'You do not know their name for the patient they would most likely refer');
  addCheckbox(state, 'The relationship has not yet reached the point where they would share clinical concerns candidly');
  addCheckbox(state, 'There is a current service quality issue that has not been resolved to their satisfaction');

  addSection(state, 'Asking for the Referral: Scripted Language');
  addScriptBox(state, `"Based on what you shared about [specific situation from previous conversation], it sounds like [patient type or clinical situation] might be the right fit for what our team does. Is there anyone you are currently managing who you have been wondering about in terms of appropriateness for comfort-focused care? I am happy to just do an informal consult with your clinical team to see if it would be a good fit."`);
  addParagraph(state, 'Notice: the ask is framed as a clinical consult, not as a referral request. This lowers the perceived commitment threshold and positions you as a clinical resource rather than a sales rep.');

  addTipBox(state, 'The Decision Tree Mindset', 'Decision trees are most valuable when you are stuck or uncertain. Before every visit, ask yourself which branch you are on. Before every conversation, know which question you are trying to answer. Clarity of purpose in each interaction compounds into consistent results across your entire territory. The rep who always knows why they are in a room is the one who earns the most trust.');

  await finishDocument(state, 'public/resources/decision-trees.pdf');
}

// ─── PDF 11: WEEKLY ACTIVITY TRACKER ──────────────────────────────────────

async function createWeeklyActivityTracker(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Weekly Activity Tracker', 'Daily Conversation Logging and Performance Measurement', 'A structured weekly tracking system for logging referral source conversations, monitoring pipeline progression, calculating conversion metrics, and identifying coaching opportunities.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Weekly Activity Tracker', 'What Gets Tracked Gets Improved');

  addSection(state, 'How to Use This Tracker');
  addParagraph(state, 'Log every live conversation with a referral source contact as it happens. Do not rely on memory at the end of the day. A conversation counts when both of the following are true: you spoke with a live human contact (not a voicemail), and the conversation was related to patient care, referral activity, or relationship development.');
  addParagraph(state, 'At the end of each day, complete the daily summary. At the end of the week, complete the weekly reflection. Review your tracker with your manager or coach weekly. The patterns in your activity data are your most important coaching tool.');

  addSection(state, 'Key Metrics and What They Mean');
  addSubsection(state, 'Conversations Per Day');
  addParagraph(state, 'This is your primary leading indicator. Research across high-performing hospice sales territories shows that reps averaging 8 or more live referral source conversations per day significantly outperform those averaging fewer than 5. Conversations drive everything downstream.');
  addSubsection(state, 'Conversation-to-Referral Conversion Rate');
  addParagraph(state, 'Calculated as: Referrals received divided by total conversations. A healthy rate is typically 8 to 15%. Below 8% usually indicates a Discovery or Connecting gap. Above 15% often means you have good relationships but may not be seeing enough new accounts to grow.');
  addSubsection(state, 'Referral-to-Admission Conversion Rate');
  addParagraph(state, 'Calculated as: Admissions divided by referrals received. A healthy rate is typically 65 to 80%. Below 65% may indicate clinical eligibility issues, family hesitation, or competitive situations at point of referral. Track this monthly, not weekly, as the sample size is small.');

  addSection(state, 'Monday');
  addSubsection(state, 'Conversations (check each one as it happens)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (1)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (2)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (3)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (4)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (5)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (6)');
  addSubsection(state, 'Monday Daily Summary');
  addFormField(state, 'Total conversations today');
  addFormField(state, 'Referrals received today');
  addFormField(state, 'Admissions confirmed today');
  addFormField(state, 'Key win or insight from today');

  addSection(state, 'Tuesday');
  addSubsection(state, 'Conversations');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (1)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (2)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (3)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (4)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (5)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (6)');
  addSubsection(state, 'Tuesday Daily Summary');
  addFormField(state, 'Total conversations today');
  addFormField(state, 'Referrals received today');
  addFormField(state, 'Admissions confirmed today');
  addFormField(state, 'Key win or insight from today');

  addSection(state, 'Wednesday');
  addSubsection(state, 'Conversations');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (1)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (2)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (3)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (4)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (5)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (6)');
  addSubsection(state, 'Wednesday Daily Summary');
  addFormField(state, 'Total conversations today');
  addFormField(state, 'Referrals received today');
  addFormField(state, 'Admissions confirmed today');
  addFormField(state, 'Key win or insight from today');

  addSection(state, 'Thursday');
  addSubsection(state, 'Conversations');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (1)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (2)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (3)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (4)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (5)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (6)');
  addSubsection(state, 'Thursday Daily Summary');
  addFormField(state, 'Total conversations today');
  addFormField(state, 'Referrals received today');
  addFormField(state, 'Admissions confirmed today');
  addFormField(state, 'Key win or insight from today');

  addSection(state, 'Friday');
  addSubsection(state, 'Conversations');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (1)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (2)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (3)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (4)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (5)');
  addFormField(state, 'Account / Contact / Topic / Stage / Outcome (6)');
  addSubsection(state, 'Friday Daily Summary');
  addFormField(state, 'Total conversations today');
  addFormField(state, 'Referrals received today');
  addFormField(state, 'Admissions confirmed today');
  addFormField(state, 'Key win or insight from today');

  addSection(state, 'Weekly Summary and Reflection');
  addFormField(state, 'Total conversations this week');
  addFormField(state, 'Total referrals received this week');
  addFormField(state, 'Total admissions this week');
  addFormField(state, 'Conversation to referral conversion rate (referrals / conversations)');
  addFormField(state, 'New accounts visited for the first time');
  addFormField(state, 'Accounts that advanced a stage in the Sales Mastery Model');

  addSubsection(state, 'Weekly Reflection Questions');
  addFormField(state, 'What conversation this week went best, and why?');
  addFormField(state, 'What conversation went poorly, and what would I do differently?');
  addFormField(state, 'Which accounts am I most concerned about and why?');
  addFormField(state, 'What is the one thing I will do differently next week?');

  addTipBox(state, 'The Tracking Discipline', 'Reps who track consistently outperform reps who do not, independent of any other variable. The data in your tracker is not for your manager. It is for you. It will tell you exactly where your process is breaking down. Trust it more than your gut. Your gut notices patterns too slowly. Your data catches them immediately.');

  await finishDocument(state, 'public/resources/weekly-activity-tracker.pdf');
}

// ─── PDF 12: ELIGIBILITY QUICK REFERENCE ──────────────────────────────────

async function createEligibilityQuickReference(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Hospice Eligibility Quick Reference', 'Clinical Criteria by Diagnosis for Field Use', 'A complete field reference covering eligibility criteria, clinical indicators, LCD documentation terms, and conversation guidance for eight major terminal diagnoses.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Hospice Eligibility Quick Reference', 'Know the Criteria, Know the Patient, Serve the Family');

  addSection(state, 'Universal Eligibility Requirements');
  addParagraph(state, 'Regardless of diagnosis, every patient must meet ALL of the following criteria before electing the Medicare Hospice Benefit. Know these by heart.');
  addBullet(state, 'Enrolled in Medicare Part A (Hospital Insurance)');
  addBullet(state, 'Terminal prognosis of 6 months or less if disease runs its normal course, certified by both the hospice medical director and the attending physician');
  addBullet(state, 'Patient or legal representative signs a hospice election statement agreeing to forgo curative treatment for the terminal diagnosis');
  addBullet(state, 'Patient resides in the hospice service area');
  addParagraph(state, 'Key clinical note: A patient who lives longer than 6 months does NOT lose eligibility. They are recertified every benefit period (90, 90, then 60-day periods) as long as clinical decline continues. This is one of the most important points to explain to referral sources who delay because they are "not sure it\'s time."');

  addSection(state, 'Congestive Heart Failure');
  addSubsection(state, 'Primary Eligibility Indicators');
  addBullet(state, 'NYHA Class IV: Symptoms of cardiac insufficiency at rest');
  addBullet(state, 'Ejection fraction at or below 20% despite optimal medical management');
  addBullet(state, 'Refractory angina or symptomatic dysrhythmias not controlled by medication');
  addBullet(state, 'Three or more inpatient hospitalizations in the preceding 12 months for CHF exacerbation');

  addSubsection(state, 'Supporting Clinical Indicators');
  addBullet(state, 'Persistent hypotension (systolic below 90 mmHg)');
  addBullet(state, 'Renal insufficiency with creatinine above 3.0 mg/dl');
  addBullet(state, 'Cardiac cachexia: significant unintentional weight loss');
  addBullet(state, 'Hyponatremia: serum sodium below 130 mEq/L');
  addBullet(state, 'Patient declining or not tolerating recommended therapies');

  addSubsection(state, 'Key Documentation Terms for This Diagnosis');
  addBullet(state, 'Optimally medically managed, Refractory heart failure, Volume overload despite diuresis');
  addBullet(state, 'Goals of care aligned with comfort, Functional decline consistent with terminal trajectory');

  addSection(state, 'COPD and Pulmonary Disease');
  addSubsection(state, 'Primary Eligibility Indicators');
  addBullet(state, 'Disabling dyspnea at rest or with minimal exertion despite maximal bronchodilator therapy');
  addBullet(state, 'FEV1 below 30% of predicted value on post-bronchodilator pulmonary function testing');
  addBullet(state, 'Hypoxemia at rest requiring supplemental oxygen (PO2 55 mmHg or less on room air, or SpO2 88% or less)');
  addBullet(state, 'Hypercapnia on ABG (PCO2 50 mmHg or more)');

  addSubsection(state, 'Supporting Clinical Indicators');
  addBullet(state, 'Cor pulmonale or right heart failure secondary to pulmonary disease');
  addBullet(state, 'Unintentional weight loss exceeding 10% body weight over 6 months');
  addBullet(state, 'Resting tachycardia above 100 beats per minute');
  addBullet(state, 'Progressive functional decline despite therapy and rehabilitation');

  addSection(state, 'Cancer');
  addSubsection(state, 'Primary Eligibility Indicators');
  addBullet(state, 'Metastatic or locally advanced disease not amenable to further curative treatment');
  addBullet(state, 'Patient has declined further curative treatment or is no longer a candidate');
  addBullet(state, 'Palliative Performance Scale (PPS) at or below 70%: some functional limitation');
  addBullet(state, 'Rapid decline over 4 to 6 weeks documented in clinical record');

  addSubsection(state, 'Supporting Clinical Indicators');
  addBullet(state, 'Hypercalcemia of malignancy');
  addBullet(state, 'Cachexia: weight loss exceeding 10% in the prior 6 months');
  addBullet(state, 'Pleural effusion, ascites, or peripheral edema not responding to treatment');
  addBullet(state, 'Uncontrolled pain, nausea, or dyspnea requiring escalating medication');
  addBullet(state, 'Serum albumin below 2.5 g/dl indicating poor nutritional status');

  addSection(state, 'Dementia and Alzheimer Disease');
  addSubsection(state, 'Primary Eligibility Indicators (FAST Stage 7 or Beyond)');
  addBullet(state, 'Unable to walk without personal assistance — not just walker-assisted, but entirely dependent');
  addBullet(state, 'Unable to dress without full assistance from another person');
  addBullet(state, 'Unable to bathe without full assistance from another person');
  addBullet(state, 'Urinary and fecal incontinence consistently, not occasionally');
  addBullet(state, 'Verbal communication limited to 6 or fewer intelligible words in a given day');
  addBullet(state, 'Loss of ability to smile meaningfully in response to stimulation');

  addSubsection(state, 'Required Comorbid Conditions (At Least One in Prior 12 Months)');
  addBullet(state, 'Aspiration pneumonia');
  addBullet(state, 'Pyelonephritis or other upper urinary tract infection');
  addBullet(state, 'Septicemia');
  addBullet(state, 'Decubiti Stage 3 or 4 (pressure ulcers)');
  addBullet(state, 'Fever that recurred after antibiotic treatment');
  addBullet(state, 'Difficulty swallowing food or water leading to dehydration or aspiration risk');

  addSection(state, 'Renal Disease');
  addSubsection(state, 'Primary Eligibility Indicators');
  addBullet(state, 'Creatinine clearance below 10 ml per minute (15 ml per minute for diabetics)');
  addBullet(state, 'Serum creatinine above 8.0 mg per dl (6.0 mg per dl for diabetics)');
  addBullet(state, 'Patient declining or discontinuing dialysis');
  addBullet(state, 'Uremic encephalopathy: confusion, restlessness, somnolence');
  addBullet(state, 'Intractable nausea and vomiting unresponsive to standard treatment');
  addBullet(state, 'Significant reduction in urine output with fluid overload');

  addSection(state, 'Stroke and Neurological Disease');
  addSubsection(state, 'For CVA and Stroke');
  addBullet(state, 'Coma or persistent vegetative state persisting beyond 3 days post-event');
  addBullet(state, 'Dysphagia severe enough to prevent adequate oral intake and creating aspiration risk');
  addBullet(state, 'Post-stroke dementia meeting FAST Stage 7 or beyond criteria');
  addBullet(state, 'Karnofsky Performance Scale at or below 40% indicating severe functional impairment');

  addSubsection(state, 'For ALS (Amyotrophic Lateral Sclerosis)');
  addBullet(state, 'Critically impaired breathing capacity: vital capacity below 30% of predicted value');
  addBullet(state, 'Dysphagia with documented weight loss');
  addBullet(state, 'Life-threatening aspiration or the patient is declining artificial ventilation');
  addBullet(state, 'Plus one complication in the prior 12 months: aspiration pneumonia, septicemia, fever');

  addSection(state, 'Adult Failure to Thrive');
  addBullet(state, 'BMI below 22 kg per square meter');
  addBullet(state, 'Unintentional weight loss exceeding 10% over the prior 6 months');
  addBullet(state, 'Serum albumin below 2.5 g per dl');
  addBullet(state, 'Declining functional status with no reversible cause identified');
  addBullet(state, 'Patient declining workup or intervention for underlying conditions');

  addSection(state, 'Liver Disease');
  addBullet(state, 'Prothrombin time more than 5 seconds prolonged over control');
  addBullet(state, 'Serum albumin below 2.5 g per dl');
  addBullet(state, 'Refractory ascites not controlled with diuretics');
  addBullet(state, 'Spontaneous bacterial peritonitis');
  addBullet(state, 'Hepatic encephalopathy with altered cognition');
  addBullet(state, 'Hepatorenal syndrome with rising creatinine');

  addTipBox(state, 'How to Use This Reference', 'Memorize the top 3 diagnoses in your territory. For the others, keep this card accessible. When a referral source says "I have a patient I am wondering about," your clinical knowledge is your most powerful credibility tool. The more accurately you can speak to eligibility criteria, the more referral sources trust your judgment on clinical appropriateness.');

  await finishDocument(state, 'public/resources/eligibility-quick-reference.pdf');
}

// ─── PDF 13: NEW HIRE ONBOARDING ──────────────────────────────────────────

async function createNewHireOnboarding(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'New Hire Onboarding Plan', 'A Complete 90-Day Ramp for Hospice Sales Representatives', 'Daily action items, knowledge milestones, coaching checkpoints, activity targets, and success indicators for the first 90 days in a hospice sales role.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'New Hire Onboarding Plan', 'Your First 90 Days: A Roadmap to Consistent Performance');

  addSection(state, 'The Philosophy Behind This Plan');
  addParagraph(state, 'The biggest mistake new hospice sales reps make is trying to sell before they are ready to serve. In the first 30 days, your job is to learn, not to pitch. The accounts that you introduce yourself to during this period will form impressions that last for years. Make those impressions count by showing up as genuinely curious, clinically interested, and focused on their world — not yours.');
  addParagraph(state, 'The Spartan Method new hire ramp is built on a simple progression: knowledge, then presence, then credibility, then referrals. Reps who shortcut this progression by pushing for referrals before they have established credibility typically plateau early. Reps who trust the progression typically outperform their targets by month 4 and sustain that performance for years.');

  addSection(state, 'Week 1: Orientation and Foundation');
  addSubsection(state, 'Administrative and Clinical Onboarding');
  addCheckbox(state, 'Complete all HR paperwork and company orientation requirements');
  addCheckbox(state, 'Review compliance training including HIPAA, Anti-Kickback Statute, and your organization\'s policies');
  addCheckbox(state, 'Receive CRM access and complete 2-hour system training with your manager');
  addCheckbox(state, 'Receive territory assignment, account list, and any existing relationship notes from your predecessor');
  addCheckbox(state, 'Review the Medicare Hospice Benefit summary and take the self-assessment quiz');

  addSubsection(state, 'Clinical Team Integration');
  addCheckbox(state, 'Meet each member of your assigned clinical team: nurses, social workers, aide coordinators, chaplain, and medical director');
  addCheckbox(state, 'Shadow a nurse on at least two patient visits (with appropriate patient consent obtained by the clinical team)');
  addCheckbox(state, 'Attend one family meeting or care planning conference');
  addCheckbox(state, 'Attend one clinical team meeting to understand how patient care decisions are made');
  addCheckbox(state, 'Review your organization\'s service offerings: routine home care, continuous care, respite, and inpatient');

  addSubsection(state, 'Field Learning');
  addCheckbox(state, 'Complete 2 full days of field shadowing with an experienced rep or your manager');
  addCheckbox(state, 'Observe how the experienced rep conducts a first visit, a follow-up visit, and a lunch-and-learn');
  addCheckbox(state, 'Debrief every field visit the same day: what worked, what did not, what questions came up');
  addCheckbox(state, 'Begin building your personal territory account list with all contacts identified');

  addSection(state, 'Week 2: Territory Mapping');
  addSubsection(state, 'Account Research');
  addCheckbox(state, 'Map all referral sources in your territory by type: SNF, hospital, physician, ALF, home health, other');
  addCheckbox(state, 'Research your top 20 highest-potential accounts using CMS data, LinkedIn, and news sources');
  addCheckbox(state, 'Identify key decision-makers at each account: name, role, tenure, and any known preferences');
  addCheckbox(state, 'Complete a competitive analysis: which hospice providers are active in your territory and where?');
  addCheckbox(state, 'Apply the initial A/B/C tiering to your account list based on your research');

  addSubsection(state, 'Personal Skills Development');
  addCheckbox(state, 'Practice your 30-second opener until it is completely natural — record yourself and review the recording');
  addCheckbox(state, 'Study the 5 Stage 1 Discovery questions and be able to deliver each one conversationally, not from memory');
  addCheckbox(state, 'Review all six disease-specific eligibility criteria in the Quick Reference guide');
  addCheckbox(state, 'Complete a second field ride-along, this time focusing specifically on how discovery questions are used');

  addSection(state, 'Weeks 3 and 4: Initial Outreach (Introduction Mode)');
  addSubsection(state, 'Daily Activity Targets at 50% Ramp');
  addBullet(state, 'Minimum 5 live referral source conversations per day');
  addBullet(state, 'Visit at least 4 new accounts for first introductions per day');
  addBullet(state, 'Send at least 3 follow-up emails per day, same-day for any meaningful conversations');
  addBullet(state, 'Document every visit in CRM within 4 hours');

  addSubsection(state, 'Week 3 and 4 Checklist');
  addCheckbox(state, 'Introduce yourself at every A Tier account in your territory (in-person preferred)');
  addCheckbox(state, 'Deliver a value message in every introduction: what you do for their patients, not your company features');
  addCheckbox(state, 'Ask at least one Stage 1 Discovery question in every first visit');
  addCheckbox(state, 'Schedule your first lunch-and-learn for week 5 or 6');
  addCheckbox(state, 'Complete a weekly call review with your manager: discuss 3 best conversations and 3 where you felt stuck');
  addCheckbox(state, 'Receive your first coaching feedback on your opener and discovery question delivery');

  addSection(state, 'Month 2: Relationship Building and First Referrals');
  addSubsection(state, 'Daily Activity Targets at 70% Ramp');
  addBullet(state, 'Minimum 7 live referral source conversations per day');
  addBullet(state, 'At least 2 educational leave-behinds delivered per day');
  addBullet(state, '100% of visits documented in CRM same day');
  addBullet(state, 'Minimum 1 Stage 2 Connecting conversation per day with an existing contact');

  addSubsection(state, 'Month 2 Checklist');
  addCheckbox(state, 'Begin second-round visits at all A Tier accounts with a specific educational agenda per visit');
  addCheckbox(state, 'Conduct at least 2 lunch-and-learn presentations during the month');
  addCheckbox(state, 'Study objection handling and practice the ACE method with your manager');
  addCheckbox(state, 'Identify 3 accounts where a first referral may be possible and develop a specific plan for each');
  addCheckbox(state, 'Track your weekly conversion metrics and share with your manager in coaching meetings');
  addCheckbox(state, 'Receive your first referral (target: by the end of week 6)');

  addSection(state, 'Month 3: Full Pace Operations');
  addSubsection(state, 'Daily Activity Targets at Full Pace');
  addBullet(state, 'Minimum 9 live referral source conversations per day');
  addBullet(state, 'Operating on full A/B/C visit cadence (A weekly, B every 2 weeks, C monthly)');
  addBullet(state, 'All CRM documentation complete within 24 hours');
  addBullet(state, 'Minimum 4 lunch-and-learns per month');

  addSubsection(state, 'Month 3 Checklist');
  addCheckbox(state, 'Receiving regular referrals from at least 3 active referral sources');
  addCheckbox(state, 'Monthly admission total is at or near the assigned goal for your territory');
  addCheckbox(state, 'Completed your first formal territory review with your manager');
  addCheckbox(state, 'Built champion relationships at a minimum of 3 A Tier accounts');
  addCheckbox(state, 'Identified your weakest skill area and have a specific improvement plan in place');
  addCheckbox(state, 'Prepared your 90-day report covering account progression, activity metrics, and next-quarter goals');

  addSection(state, 'Coaching Checkpoints');
  addParagraph(state, 'Schedule the following coaching sessions with your manager before your first day:');
  const coachWidths = [100, 180, 224];
  addTableRow(state, ['Timing', 'Format', 'Focus'], coachWidths, true);
  addTableRow(state, ['End of Week 2', 'Territory review meeting', 'Account tier list review and territory plan'], coachWidths);
  addTableRow(state, ['End of Week 4', 'Field ride-along', 'Live observation of your first account visits'], coachWidths);
  addTableRow(state, ['End of Month 1', 'Coaching session', 'CRM review, opener and discovery question feedback'], coachWidths);
  addTableRow(state, ['End of Month 2', 'Coaching session', 'Objection handling review, first referral debrief'], coachWidths);
  addTableRow(state, ['End of Month 3', 'Formal territory review', 'Full 90-day performance and next-quarter goal setting'], coachWidths);

  addTipBox(state, 'The Most Important 90 Days', 'The habits you build in your first 90 days will shape your career in hospice sales. Reps who build strong documentation habits, genuine curiosity habits, and daily activity discipline in the first 90 days almost always go on to be top performers. Reps who develop shortcut habits in the first 90 days carry those habits forward and rarely break out of mediocrity. Do it right from day one.');

  await finishDocument(state, 'public/resources/new-hire-onboarding.pdf');
}

// ─── PDF 14: LUNCH AND LEARN TEMPLATE ─────────────────────────────────────

async function createLunchLearnTemplate(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Lunch and Learn Template', 'Complete Facilitation Guide for Educational Presentations', 'Everything you need to plan, deliver, and follow up on a high-impact educational presentation for any referral source setting.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Lunch and Learn Template', 'Education First. Referrals Follow.');

  addSection(state, 'The Purpose of a Lunch and Learn');
  addParagraph(state, 'A lunch-and-learn is not a sales presentation. It is an opportunity to establish yourself as a knowledgeable, trustworthy clinical resource for a referral source\'s team. The moment your content feels like a sales pitch, you lose the room. The moment it genuinely helps the clinical staff do their jobs better, you become someone they want to see again.');
  addParagraph(state, 'The best lunch-and-learns end with a clinical staff member asking you a question you were not expecting. That means they were genuinely engaged and thinking about how the content applies to their actual patients. That is your success metric, not the number of referrals received that week.');

  addSection(state, 'Planning Checklist (Complete at Least 7 Days Before)');
  addCheckbox(state, 'Confirm date, start time, end time, and location with your facility contact');
  addCheckbox(state, 'Ask how many attendees to expect and which roles they hold (CNAs, nurses, social workers, administration)');
  addCheckbox(state, 'Select a topic based on the diagnoses most common at this facility, not based on what you want to present');
  addCheckbox(state, 'Prepare your content: 3 to 4 key educational points maximum, no more');
  addCheckbox(state, 'Prepare handouts or leave-behind reference cards: one per attendee plus 10% extra');
  addCheckbox(state, 'Order food: enough for 20% more than expected, with vegetarian options included');
  addCheckbox(state, 'Confirm a day before: send a reminder email and confirm food count');
  addCheckbox(state, 'Prepare your post-presentation follow-up email in advance so it can be sent within 24 hours');

  addSection(state, 'Day-of Checklist (Arrive 20 Minutes Early)');
  addCheckbox(state, 'Arrive before food arrives and before any attendees to set up the space');
  addCheckbox(state, 'Arrange food so it does not interfere with the presentation space');
  addCheckbox(state, 'Set out one leave-behind document per chair or place setting');
  addCheckbox(state, 'Test any technology: projector, laptop connection, screen visibility from all seats');
  addCheckbox(state, 'Prepare a simple sign-in sheet with name and role fields only (no email collection unless specifically appropriate)');
  addCheckbox(state, 'Welcome people as they arrive: learn their names and roles before the session begins');

  addSection(state, 'Presentation Structure (15 to 20 Minutes Total)');
  addNumberedItem(state, 1, 'Opening: 2 to 3 Minutes',
    'Thank the team for their time. Introduce yourself very briefly — one sentence maximum. State the topic and why it matters to their specific patient population. Do not start with your hospice\'s story or your career background. Start with them.');
  addNumberedItem(state, 2, 'The Problem: 3 to 4 Minutes',
    'Describe a common clinical challenge their team faces that relates to your topic. Use a recognizable scenario — a patient type, a clinical situation, or a family dynamic they encounter regularly. Do not use statistics in this section. Use a story or scenario that makes them nod in recognition.');
  addNumberedItem(state, 3, 'Educational Content: 6 to 8 Minutes',
    'Cover 3 to 4 specific, practical takeaways. Each takeaway should be something they can use in their next patient interaction. Use clinical language appropriate to their roles. Define any medical terms that CNAs or non-clinical staff may not know. Connect every point back to patient outcomes.');
  addNumberedItem(state, 4, 'How to Identify Patients: 3 to 4 Minutes',
    'Give them clear, actionable clinical signs to look for. For nursing staff: what to observe and document. For social workers: what conversation cues and family dynamics to listen for. For administrators: what population metrics to watch. This is almost always the most valuable part of the presentation for clinical attendees.');
  addNumberedItem(state, 5, 'Q and A and Close: 2 to 3 Minutes',
    'Open the floor for questions. Answer each question clearly and briefly. If you do not know the answer, say so and offer to follow up. Thank the group sincerely. Tell them you are available for one-on-one conversations after the session for anyone who has questions about a specific patient.');

  addSection(state, 'High-Impact Topic Guide by Facility Type');
  addSubsection(state, 'Skilled Nursing Facilities');
  addBullet(state, 'What hospice eligibility really looks like for dementia patients at FAST Stage 7 and beyond');
  addBullet(state, 'How hospice can reduce emergency transfers and improve staff confidence in complex end-of-life situations');
  addBullet(state, 'Common misconceptions about the hospice benefit that delay appropriate referrals');
  addBullet(state, 'How to have the hospice conversation with families when residents are declining');

  addSubsection(state, 'Hospitals');
  addBullet(state, 'Hospice and palliative care: understanding the difference and when each applies');
  addBullet(state, 'How earlier hospice transitions reduce 30-day readmissions for CHF and COPD patients');
  addBullet(state, 'Evidence-based outcomes for patients who enroll in hospice earlier in their disease trajectory');
  addBullet(state, 'The discharge planning workflow when hospice is the most appropriate next level of care');

  addSubsection(state, 'Physician Offices');
  addBullet(state, 'Hospice eligibility criteria for your specialty\'s primary diagnoses: what the LCD actually says');
  addBullet(state, 'The evidence base for early hospice enrollment: what the clinical research shows about outcomes');
  addBullet(state, 'How to have the goals-of-care conversation with patients and families who are not yet ready');
  addBullet(state, 'What staying involved as the attending physician looks like in a hospice partnership');

  addSection(state, 'Common Presentation Mistakes to Avoid');
  addBullet(state, 'Spending more than 60 seconds on your company\'s background, mission, or service area');
  addBullet(state, 'Using slides that are text-heavy or that you read directly from the screen');
  addBullet(state, 'Presenting for more than 20 minutes regardless of how much material you have prepared');
  addBullet(state, 'Forgetting to leave a practical reference card with clinical criteria they can use immediately');
  addBullet(state, 'Not following up within 48 hours with a personalized thank-you email to your primary contact');
  addBullet(state, 'Collecting business cards or email addresses in a way that feels like lead generation rather than follow-through');

  addSection(state, 'Post-Presentation Follow-Up Checklist');
  addCheckbox(state, 'Send thank-you email to your primary contact within 24 hours, referencing something specific from the session');
  addCheckbox(state, 'Follow up personally with any attendee who stayed after to ask a question about a specific patient');
  addCheckbox(state, 'Update your CRM with attendee names, roles, and key conversation notes');
  addCheckbox(state, 'Schedule your next touchpoint with this account within 7 to 10 days');
  addCheckbox(state, 'Review what worked well and what you would do differently at the next session');
  addCheckbox(state, 'If a referral was generated directly from the session, send a thank-you to your contact the same day it is received');

  addSection(state, 'Leave-Behind Reference Card Template');
  addParagraph(state, 'Create a simple one-page reference card for each presentation. Include:');
  addBullet(state, 'The topic title and date in small text at the top');
  addBullet(state, 'Three to four clinical criteria or key takeaways in simple language');
  addBullet(state, 'One clear "when to think about hospice" guideline relevant to their patient population');
  addBullet(state, 'Your name, direct phone number, and email in a prominent position');
  addBullet(state, 'The hospice company name and a one-sentence description of what you offer');
  addParagraph(state, 'This card should be something they pin to their bulletin board or tape to their desk. Make it genuinely useful for their clinical work and they will look at your name every day.');

  addTipBox(state, 'The Lasting Impression', 'Clinical staff remember presentations that taught them something they immediately used. They forget presentations that were organized, professional, and forgettable. To be remembered, you need one moment in the session where the room goes quiet because you said something that reframed how they see a patient they have been managing. Prepare for that moment intentionally. Know the one insight that will change how they see their most challenging end-of-life cases. Deliver that insight with clarity and confidence. That is what they remember, and that is what generates referrals long after the lunch is eaten.');

  await finishDocument(state, 'public/resources/lunch-learn-template.pdf');
}

// ─── PDF 15: ACCOUNT TIERING WORKSHEET ─────────────────────────────────────

async function createAccountTieringWorksheet(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Account Tiering Worksheet', 'Scoring, Prioritization, and Territory Planning Tool', 'A complete framework for scoring every account on four dimensions, calculating tier placement, scheduling visit cadence, and identifying your highest-priority development opportunities.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Account Tiering Worksheet', 'Invest Your Time Where It Produces the Most Results');

  addSection(state, 'Why Tiering Matters');
  addParagraph(state, 'Time is the one resource you cannot recover. Every hour you spend at a low-potential account is an hour you did not spend at a high-potential one. Account tiering is how Spartan-trained reps make disciplined decisions about where their time goes. It removes the emotional attachment that causes reps to overinvest in accounts they like rather than accounts that will produce.');
  addParagraph(state, 'Tier your accounts monthly. The first time you do it, it takes 2 to 3 hours because you are building from scratch. After that, the monthly refresh takes 30 to 45 minutes. It is the highest-ROI planning activity you can do.');

  addSection(state, 'The Four Scoring Dimensions');
  addSubsection(state, 'Dimension 1: Current Referral Volume (1 to 5)');
  addBullet(state, '5: Regular consistent referrals, 3 or more per month');
  addBullet(state, '4: Occasional referrals, 1 to 2 per month on average');
  addBullet(state, '3: Referred at least once in the past 90 days');
  addBullet(state, '2: Referred in the past 6 months but not recently');
  addBullet(state, '1: No referrals or has not referred in more than 6 months');

  addSubsection(state, 'Dimension 2: Growth Potential (1 to 5)');
  addBullet(state, '5: High census, large eligible population, significant untapped opportunity');
  addBullet(state, '4: Good census, meaningful potential, currently underreferring relative to population');
  addBullet(state, '3: Moderate census, moderate potential, some room to grow');
  addBullet(state, '2: Limited census or limited eligible population');
  addBullet(state, '1: Fully tapped or very low potential population');

  addSubsection(state, 'Dimension 3: Relationship Strength (1 to 5)');
  addBullet(state, '5: Strong champion who actively advocates for you internally');
  addBullet(state, '4: Solid relationship with primary decision-maker, multiple contacts established');
  addBullet(state, '3: Good relationship with one contact, working on building deeper access');
  addBullet(state, '2: Introductions made but relationship is still early-stage');
  addBullet(state, '1: No meaningful relationship with any decision-maker');

  addSubsection(state, 'Dimension 4: Competitive Position (1 to 5)');
  addBullet(state, '5: Preferred provider or no significant competition at this account');
  addBullet(state, '4: Strong position with known gap in competitor\'s service that you can fill');
  addBullet(state, '3: Equal footing with competitor, no strong preference either direction');
  addBullet(state, '2: Competitor holds meaningful relationship advantage, but not locked out');
  addBullet(state, '1: Strongly locked by competitor with no known opening');

  addSection(state, 'Tier Placement by Score');
  const tierWidths = [80, 120, 120, 184];
  addTableRow(state, ['Tier', 'Total Score', 'Visit Cadence', 'Primary Objective'], tierWidths, true);
  addTableRow(state, ['A Tier', '17 to 20', 'Weekly', 'Deepen, expand, and maintain high referral volume'], tierWidths);
  addTableRow(state, ['B Tier', '11 to 16', 'Every 10 to 14 days', 'Advance stage and develop toward first or more referrals'], tierWidths);
  addTableRow(state, ['C Tier', '6 to 10', 'Monthly', 'Maintain presence and watch for upgrade signals'], tierWidths);
  addTableRow(state, ['Archive', '5 or below', 'Quarterly or remove', 'Minimal investment until circumstances change'], tierWidths);
  state.y += 10;

  addSection(state, 'Account Scoring Worksheets');
  addParagraph(state, 'Complete one row for each account in your territory. Review and update monthly.');

  for (let i = 1; i <= 8; i++) {
    ensureSpace(state, 90);
    addSubsection(state, `Account ${i}`);
    addFormField(state, 'Account Name and Facility Type');
    addFormField(state, 'Primary Contact Name and Role');
    const scoreWidths = [130, 60, 60, 60, 60, 134];
    addTableRow(state, ['Dimension', 'Score (1 to 5)', '', '', '', 'Notes'], scoreWidths, true);
    addTableRow(state, ['Current Referral Volume', '', '', '', '', ''], scoreWidths);
    addTableRow(state, ['Growth Potential', '', '', '', '', ''], scoreWidths);
    addTableRow(state, ['Relationship Strength', '', '', '', '', ''], scoreWidths);
    addTableRow(state, ['Competitive Position', '', '', '', '', ''], scoreWidths);
    addTableRow(state, ['TOTAL SCORE / TIER', '', '', '', '', ''], scoreWidths);
    state.y += 8;
  }

  addSection(state, 'Re-Tiering Trigger Events');
  addParagraph(state, 'Re-tier an account immediately (outside of your monthly review cycle) if any of the following occur:');
  addBullet(state, 'A referral is received: upgrade if the account was B Tier');
  addBullet(state, 'A key contact leaves the account: reassess relationship strength, may downgrade');
  addBullet(state, 'A competitive hospice loses or gains a major advantage at the account');
  addBullet(state, 'The facility has a significant census change, acquisition, or leadership transition');
  addBullet(state, 'A service quality issue is reported at the account: immediately assess relationship strength impact');
  addBullet(state, 'An account that was quiet for 90 or more days suddenly becomes active: move to B Tier immediately');

  addSection(state, 'Common Tiering Mistakes to Avoid');
  addBullet(state, 'Keeping accounts in A Tier because you enjoy visiting them, not because they are producing');
  addBullet(state, 'Letting relationship comfort drive tier decisions instead of performance data');
  addBullet(state, 'Not downgrading accounts that have been in B Tier for 6 months with no stage advancement');
  addBullet(state, 'Failing to upgrade accounts quickly after receiving a first referral — strike while the momentum is there');
  addBullet(state, 'Using tier placement as a permanent label rather than a dynamic, data-driven assessment');

  addTipBox(state, 'The Honest Conversation with Yourself', 'Look at your A Tier list. Ask yourself: of these accounts, how many are there because they produce results and how many are there because you are comfortable there? The accounts you are most comfortable at are not always your highest-value accounts. Discomfort is often a signal that there is untapped potential. The visit you are avoiding is probably the one you should be making first.');

  await finishDocument(state, 'public/resources/account-tiering-worksheet.pdf');
}

// ─── PDF 16: DIFFICULT CONVERSATION GUIDE ─────────────────────────────────

async function createDifficultConversationGuide(): Promise<void> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addCoverPage(state, 'Difficult Conversation Guide', 'Frameworks for Sensitive End-of-Life Conversations', 'Complete guides for five high-stakes scenarios: family reluctance, patient refusal, physician resistance, competitive displacement, and census loss conversations.');
  doc.addPage();
  state.pageNum = 2;
  addHeader(state);
  addDocumentTitle(state, 'Difficult Conversation Guide', 'Presence, Patience, and Prepared Language for Hard Moments');

  addSection(state, 'The Foundation: Posture Before Words');
  addParagraph(state, 'Difficult conversations in hospice are not won with clever scripts. They are won with presence. The person across from you — whether it is a grieving family member, a defensive physician, or a frustrated discharge planner — does not primarily need to hear the right words. They need to experience being genuinely heard by someone who is not trying to rush through the conversation to get to their agenda.');
  addParagraph(state, 'The three posture principles for every difficult conversation are: slow down, listen longer than is comfortable, and resist the urge to solve before the other person is ready to be helped. These principles do not come naturally under pressure. Practice them in low-stakes conversations so they are available to you in high-stakes ones.');

  addSection(state, 'Universal Preparation Checklist');
  addCheckbox(state, 'Review everything you know about the situation and the person: their role, their history, any previous interactions');
  addCheckbox(state, 'Identify their most likely concern: what do they need from this conversation to feel like it was worthwhile?');
  addCheckbox(state, 'Prepare 2 to 3 open-ended questions rather than a script or talking points');
  addCheckbox(state, 'Check your own emotional state: are you calm enough to be fully present without an agenda driving your energy?');
  addCheckbox(state, 'Identify what a successful outcome looks like for them, not just for you');

  addSection(state, 'Scenario 1: Family Is Not Ready to Accept Hospice');
  addSubsection(state, 'What Is Happening Beneath the Surface');
  addParagraph(state, '"Not ready" almost always means one of three things: they do not yet believe the prognosis is what the doctors are saying, they feel that choosing hospice is giving up on their loved one, or they carry unresolved guilt about past caregiving that makes this decision feel like the final evidence of failure. Your job is to find out which one it is before saying anything else.');

  addSubsection(state, 'Opening the Conversation');
  addScriptBox(state, `"I want to be upfront with you: I am not here to convince you of anything or to rush you toward any decision. What I would really like to understand is what is on your mind right now. What feels like the hardest part of what you are facing?"`);

  addSubsection(state, 'When They Say "We Are Holding Out Hope"');
  addScriptBox(state, `"I hear that, and I think hope is exactly the right thing to hold onto. What I have seen is that choosing hospice does not mean giving up hope. It means choosing to focus your hope on the things that matter most to your [family member] right now: comfort, dignity, time with the people they love. Can I share what that looks like in practice?"`);

  addSubsection(state, 'When They Say "We Do Not Want to Give Up"');
  addScriptBox(state, `"That response tells me a lot about who you are and what your [family member] means to you. Hospice actually does not require you to give up. Your [family member] can still receive treatment for any condition unrelated to their terminal diagnosis. And they continue to have their own physician. What changes is that a team of specialists steps in to manage their comfort and support your family through what comes next. Would it be helpful to talk about what that actually looks like day to day?"`);

  addSubsection(state, 'When They Are Silent or Crying');
  addParagraph(state, 'Stop talking. Wait. Let the silence exist without filling it. The most powerful thing you can do when someone is crying is to be present and quiet. Place a hand on the table if appropriate. After they have had time, say simply:');
  addScriptBox(state, `"Take all the time you need. There is no rush here."`);

  addSection(state, 'Scenario 2: Patient Refuses to Discuss Hospice');
  addSubsection(state, 'What Is Happening');
  addParagraph(state, 'Patients who refuse to discuss hospice are almost always processing a fear underneath the refusal. The most common fears: fear that accepting hospice accelerates death, fear of losing control over their own healthcare decisions, and fear that their doctor or family has given up on them. Naming these fears gently opens the conversation that lecturing closes.');

  addSubsection(state, 'Opening Without Pressure');
  addScriptBox(state, `"I am not here to talk you into anything. I just wondered if you would be willing to share with me what specifically worries you about hospice. I have heard a lot of misconceptions over the years and I want to make sure you have accurate information to make whatever decision is right for you."`);

  addSubsection(state, 'Addressing the "Hospice Speeds Up Death" Misconception');
  addScriptBox(state, `"I understand why people believe that, and it is one of the most common concerns I hear. The research actually shows the opposite: patients who enroll in hospice with serious illnesses like heart failure and cancer have statistically similar or in some cases longer survival compared to patients who continue aggressive treatment, with significantly better symptom control and quality of life. Hospice does not shorten life. It focuses on how that life is lived."`);

  addSection(state, 'Scenario 3: Physician Dismisses the Hospice Conversation');
  addSubsection(state, 'What Is Happening');
  addParagraph(state, 'Physician resistance to hospice is almost always rooted in one of three things: they believe referring to hospice signals clinical failure, they have had a bad experience with a hospice organization in the past, or they are not yet convinced the patient meets eligibility criteria. Each requires a different approach.');

  addSubsection(state, 'When the Physician Feels Hospice Signals Failure');
  addScriptBox(state, `"I hear that concern a lot from physicians I work with, and I think it reflects how deeply you are invested in your patients. What I have seen is that the physicians whose patients do best in hospice are the ones who stay involved. You do not give up your patient when you refer to hospice. You gain a team of specialists who support your care plan. Many physicians describe it as the most effective handoff they have made."`);

  addSubsection(state, 'When the Physician Had a Bad Prior Experience');
  addScriptBox(state, `"I appreciate you telling me that. Can I ask what happened? I want to understand the specific gap so I can tell you honestly whether our team does things differently, and if we do not, I am not going to try to paper over that with promises."`);
  addParagraph(state, 'If the issue was communication, explain specifically how you handle clinical updates. If it was response time, explain your after-hours coverage protocol. If it was a clinical decision they disagreed with, acknowledge it and ask whether they would be open to a single patient trial where they stay closely involved in the care decisions.');

  addSubsection(state, 'When the Physician Questions Eligibility');
  addScriptBox(state, `"I would never want you to refer a patient who does not meet eligibility criteria — that creates regulatory risk for you and your practice and it is not something we would support. What I can offer is an informal clinical consultation with our medical director to look at the specific patient together. That way, the eligibility determination is clinical, not sales-driven."`);

  addSection(state, 'Scenario 4: A Referral Source Is Using a Competitor');
  addSubsection(state, 'What Is Happening');
  addParagraph(state, 'Competitor displacement requires patience and a long-term perspective. The worst thing you can do is speak negatively about the competitor, pressure the referral source to switch, or make promises you cannot keep. The most effective strategy is to become so consistently valuable that the relationship you build makes the switch feel natural over time.');

  addSubsection(state, 'Opening Without Attacking');
  addScriptBox(state, `"I have a lot of respect for the relationship you have built with [competitor]. I am not here to disrupt that. What I am interested in is whether there are specific situations — particular patients, diagnoses, or family circumstances — where having a second option would be useful. I would rather start with the edge cases and earn the right to be considered more broadly over time."`);

  addSubsection(state, 'When They Mention Dissatisfaction with the Competitor');
  addParagraph(state, 'Listen completely before saying anything. Do not express satisfaction that they are unhappy. Do not immediately offer yourself as the solution. After they have finished:');
  addScriptBox(state, `"I am sorry to hear that. That is not the experience patients and families deserve. What would need to be different for you to feel confident about trying another provider?"`);

  addSection(state, 'Scenario 5: You Have a Service Quality Problem to Address');
  addSubsection(state, 'What Is Happening');
  addParagraph(state, 'When your hospice has let a referral source down — a missed visit, a late response, a communication breakdown — the fastest way to lose the relationship is to minimize the problem or make excuses. The fastest way to strengthen the relationship is to own the failure completely, explain what you know about what happened, and demonstrate what has changed.');

  addSubsection(state, 'Addressing the Issue Directly');
  addScriptBox(state, `"I need to talk to you about what happened with [situation]. I want to start by saying I am sorry. What you experienced was not acceptable and it does not reflect the standard we hold ourselves to. Can you tell me exactly what happened from your perspective so I make sure I have the complete picture?"`);
  addParagraph(state, 'After they have shared the full account:');
  addScriptBox(state, `"Thank you for telling me all of that. Here is what I know about what happened from our end: [specific explanation without excuses]. Here is what has changed or what I am committing to personally going forward: [specific, measurable commitment]. And I want to ask: is there anything else I should know, or anything you need from me right now?"`);

  addSubsection(state, 'The Follow-Through Is Everything');
  addParagraph(state, 'Whatever you commit to in this conversation, deliver it faster than you promised and with more specificity than they expected. Service recovery is one of the most powerful trust-building experiences in any relationship, but only if the follow-through matches or exceeds the expectation you set in the moment of apology. If you commit to a callback by Thursday, call Wednesday. If you commit to providing a clinical update weekly, provide it every Tuesday at the same time.');

  addSection(state, 'Language to Use and Language to Avoid in Difficult Conversations');
  addSubsection(state, 'Use Language That Invites and Opens');
  addBullet(state, '"Tell me more about what is behind that concern."');
  addBullet(state, '"Help me understand what that situation looks like from your perspective."');
  addBullet(state, '"What would need to be true for this to feel like the right path?"');
  addBullet(state, '"What matters most to you and your [patient / resident / family member] right now?"');
  addBullet(state, '"Is there anything about what I just shared that does not feel right to you?"');

  addSubsection(state, 'Avoid Language That Closes or Pressures');
  addBullet(state, '"You should really consider hospice for this patient." — Too directive, removes their agency');
  addBullet(state, '"Most families in your situation..." — Generalizes their specific experience, feels dismissive');
  addBullet(state, '"If I were you, I would..." — Makes the conversation about you and presumes equivalence');
  addBullet(state, '"They definitely qualify for hospice." — Clinical determination belongs to the clinical team, not sales');
  addBullet(state, '"Our hospice is the best option here." — Comparative claims create distrust, not confidence');
  addBullet(state, '"I understand completely." — Unless you have been in their exact situation, this feels hollow');

  addTipBox(state, 'The Core of Difficult Conversations', 'The most skilled hospice sales professionals are not the most persuasive. They are the most patient and the most genuinely curious. In a field where you are regularly encountering grief, fear, clinical complexity, and institutional pressure, the people who stay grounded, listen without an agenda, and speak from a place of genuine care for patient outcomes are the ones who build relationships that last for careers. That is the Spartan standard. Master the fundamentals of presence before mastering the art of persuasion.');

  await finishDocument(state, 'public/resources/difficult-conversation-guide.pdf');
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────

export async function generateAllPDFs(): Promise<void> {
  const resourceDir = 'public/resources';
  if (!fs.existsSync(resourceDir)) {
    fs.mkdirSync(resourceDir, { recursive: true });
  }

  console.log('Generating professional training PDFs...');

  await createColdCallScript();
  console.log('  Created: cold-call-script.pdf');

  await createTerritoryTemplate();
  console.log('  Created: territory-template.pdf');

  await createResearchChecklist();
  console.log('  Created: research-checklist.pdf');

  await createRegulationsGuide();
  console.log('  Created: regulations-guide.pdf');

  await createFacilityScripts();
  console.log('  Created: facility-specific-scripts.pdf');

  await createFollowUpTemplates();
  console.log('  Created: followup-templates.pdf');

  await createPhysicianStrategy();
  console.log('  Created: physician-strategy.pdf');

  await createCaseStudies();
  console.log('  Created: case-studies.pdf');

  await createDecisionFrameworks();
  console.log('  Created: decision-frameworks.pdf');

  await createDecisionTrees();
  console.log('  Created: decision-trees.pdf');

  await createWeeklyActivityTracker();
  console.log('  Created: weekly-activity-tracker.pdf');

  await createEligibilityQuickReference();
  console.log('  Created: eligibility-quick-reference.pdf');

  await createNewHireOnboarding();
  console.log('  Created: new-hire-onboarding.pdf');

  await createLunchLearnTemplate();
  console.log('  Created: lunch-learn-template.pdf');

  await createAccountTieringWorksheet();
  console.log('  Created: account-tiering-worksheet.pdf');

  await createDifficultConversationGuide();
  console.log('  Created: difficult-conversation-guide.pdf');

  console.log('All 16 training PDFs generated successfully!');
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  generateAllPDFs().catch(console.error);
}
