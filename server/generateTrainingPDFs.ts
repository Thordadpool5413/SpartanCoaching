import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
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
  const lines = script.split('\n').length;
  const estimatedHeight = Math.max(60, lines * 14 + 24);
  ensureSpace(state, estimatedHeight);
  const { doc } = state;
  
  doc.rect(MARGIN, state.y, 3, estimatedHeight - 8).fill(SPARTAN_RED_LIGHT);
  doc.rect(MARGIN + 3, state.y, CONTENT_WIDTH - 3, estimatedHeight - 8).fill('#FEF2F2');
  
  doc.fontSize(10).font('Helvetica-Oblique').fillColor(DARK_GRAY);
  doc.text(script, MARGIN + 16, state.y + 12, { 
    width: CONTENT_WIDTH - 32, 
    lineGap: 3 
  });
  
  state.y = doc.y + 16;
}

function addTipBox(state: PDFState, tipTitle: string, tipContent: string, isLast: boolean = false): void {
  const boxHeight = 58;
  if (!isLast) {
    ensureSpace(state, boxHeight + 10);
  }
  const { doc } = state;
  
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, boxHeight)
    .fillAndStroke('#FEF2F2', SPARTAN_RED);
  
  doc.rect(MARGIN, state.y, 4, boxHeight).fill(SPARTAN_RED);
  
  doc.fontSize(9).font('Helvetica-Bold').fillColor(SPARTAN_RED);
  doc.text(tipTitle.toUpperCase(), MARGIN + 16, state.y + 12, { width: CONTENT_WIDTH - 32 });
  
  doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(tipContent, MARGIN + 16, state.y + 28, { width: CONTENT_WIDTH - 32, lineGap: 2 });
  
  state.y += boxHeight + 10;
}

function addCheckbox(state: PDFState, text: string): void {
  ensureSpace(state, 22);
  const { doc } = state;
  
  doc.rect(MARGIN + 8, state.y + 1, 12, 12)
    .lineWidth(1)
    .strokeColor(SPARTAN_RED)
    .stroke();
  
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
    
    doc.fontSize(isHeader ? 9 : 9)
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(isHeader ? DARK_GRAY : MEDIUM_GRAY);
    doc.text(cell, x + 8, state.y + 7, { width: cellWidth - 16 });
    
    x += cellWidth;
  });
  
  state.y += rowHeight;
}

function addFormField(state: PDFState, label: string): void {
  ensureSpace(state, 28);
  const { doc } = state;
  
  doc.fontSize(10).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(`${label}:`, MARGIN, state.y);
  
  const labelWidth = doc.widthOfString(`${label}:`);
  const lineStart = MARGIN + labelWidth + 8;
  const lineEnd = PAGE_WIDTH - MARGIN;
  
  doc.strokeColor(BORDER_LIGHT).lineWidth(0.5);
  doc.moveTo(lineStart, state.y + 12).lineTo(lineEnd, state.y + 12).stroke();
  
  state.y += 24;
}

function addEmailTemplate(state: PDFState, subject: string, body: string): void {
  const estimatedHeight = 100;
  ensureSpace(state, estimatedHeight);
  const { doc } = state;
  
  doc.rect(MARGIN, state.y, CONTENT_WIDTH, 1).fill(BORDER_LIGHT);
  state.y += 8;
  
  doc.fontSize(9).font('Helvetica-Bold').fillColor(MEDIUM_GRAY);
  doc.text('Subject:', MARGIN, state.y);
  doc.font('Helvetica').fillColor(DARK_GRAY);
  doc.text(subject, MARGIN + 50, state.y, { width: CONTENT_WIDTH - 50 });
  state.y = doc.y + 10;
  
  doc.fontSize(9).font('Helvetica').fillColor(DARK_GRAY);
  doc.text(body, MARGIN, state.y, { width: CONTENT_WIDTH, lineGap: 3 });
  state.y = doc.y + 16;
}

function createDocument(): PDFState {
  const doc = new PDFDocument({ 
    size: 'LETTER',
    margin: 0,
    autoFirstPage: true
  });
  
  const state: PDFState = { doc, y: 0, pageNum: 1 };
  addHeader(state);
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

async function createColdCallScript(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Cold Call Opening Script', 'Healthcare Sales Mastery Model - Stage 1: Discovery');
  
  addSection(state, 'The Healthcare Sales Mastery Model');
  addParagraph(state, 'Every successful healthcare sale follows this proven 4-stage progression. Master each stage before advancing to the next.');
  
  addSalesStage(state, 1, 'Discovery', 'Learning about the needs and operations of the account or contact');
  addSalesStage(state, 2, 'Connecting', 'Learning the individual needs of the account or contact');
  addSalesStage(state, 3, 'Guiding', 'Aligning their needs to your features and benefits');
  addSalesStage(state, 4, 'Commitment', 'Closing and asking for the business');
  
  addSection(state, 'The Spartan 30-Second Opening');
  addParagraph(state, 'Use this proven opening to establish respect and create an opening for discovery:');
  
  addScriptBox(state, `"Hi [Name], this is [Your Name] with [Hospice Company]. I know you're incredibly busy caring for patients, so I'll be brief. We partner with facilities like yours to ensure patients receive optimal comfort care at the right time. Do you have 30 seconds?"`);
  
  addSubsection(state, 'Why This Opening Works');
  addBullet(state, 'Acknowledges their time constraints immediately, building respect');
  addBullet(state, 'Focuses on patient outcomes rather than sales language');
  addBullet(state, 'Requests minimal commitment, lowering initial resistance');
  
  addSection(state, 'Discovery Questions');
  addParagraph(state, 'Your goal in Stage 1 is to learn about their operations, processes, and organizational challenges:');
  
  addNumberedItem(state, 1, 'Census Assessment', '"How many patients in your facility would you estimate are appropriate for hospice comfort care?"');
  addNumberedItem(state, 2, 'Process Understanding', '"What does your current referral process look like when a patient becomes appropriate?"');
  addNumberedItem(state, 3, 'Stakeholder Mapping', '"Who else is typically involved in those care transition decisions?"');
  addNumberedItem(state, 4, 'Challenge Identification', '"What challenges do you face in identifying appropriate patients early enough?"');
  
  addSection(state, 'Handling Common Objections');
  
  addSubsection(state, '"We already have a hospice partner"');
  addScriptBox(state, `"I respect that relationship. Many of our best partners work with multiple hospice providers to ensure coverage and options for families. What criteria do you use when a family requests a specific provider?"`);
  
  addSubsection(state, '"Not interested right now"');
  addScriptBox(state, `"I understand completely. Could I send you a 2-minute assessment tool? No obligation - just something that might help identify patients who could benefit from earlier hospice conversations."`);
  
  addTipBox(state, 'Spartan Principle', 'Never argue with an objection. Acknowledge, pivot to value, and offer a low-commitment next step. Discipline in your response builds trust.', true);
  
  await finishDocument(state, 'public/resources/cold-call-script.pdf');
}

async function createTerritoryTemplate(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Sales Territory Analysis', 'Strategic Planning Through the Healthcare Sales Mastery Model');
  
  addSection(state, 'Territory Information');
  addFormField(state, 'Territory Name');
  addFormField(state, 'Territory Manager');
  addFormField(state, 'Analysis Period');
  addFormField(state, 'Total Addressable Accounts');
  
  addSection(state, 'Sales Mastery Model Pipeline Tracking');
  addParagraph(state, 'Track each account through the 4 stages of the healthcare sales process:');
  
  const stageWidths = [100, 220, 90, 94];
  addTableRow(state, ['Stage', 'Definition', 'Count', 'Target'], stageWidths, true);
  addTableRow(state, ['1. Discovery', 'Learning needs and operations', '', ''], stageWidths);
  addTableRow(state, ['2. Connecting', 'Learning individual needs', '', ''], stageWidths);
  addTableRow(state, ['3. Guiding', 'Aligning needs to benefits', '', ''], stageWidths);
  addTableRow(state, ['4. Commitment', 'Asking for the business', '', ''], stageWidths);
  
  state.y += 10;
  
  addSection(state, 'Facility Inventory');
  const facilityWidths = [160, 70, 90, 90, 94];
  addTableRow(state, ['Facility Type', 'Total', 'Priority A', 'Priority B', 'Priority C'], facilityWidths, true);
  addTableRow(state, ['Acute Care Hospitals', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Skilled Nursing Facilities', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Assisted Living', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Home Health Agencies', '', '', '', ''], facilityWidths);
  addTableRow(state, ['Physician Practices', '', '', '', ''], facilityWidths);
  
  state.y += 10;
  
  addSection(state, 'Weekly Activity Targets');
  addFormField(state, 'Discovery calls/visits per week');
  addFormField(state, 'Connecting meetings scheduled per week');
  addFormField(state, 'Guiding presentations delivered per week');
  addFormField(state, 'Commitment asks made per week');
  
  addTipBox(state, 'Tracking Success', 'Review your stage progression weekly. If accounts are stalling in one stage, focus your training and preparation on advancing through that specific stage.', true);
  
  await finishDocument(state, 'public/resources/territory-template.pdf');
}

async function createResearchChecklist(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Pre-Call Research Checklist', 'Complete Preparation for Every Stage of the Sales Mastery Model');
  
  addSection(state, 'Stage 1: Discovery Preparation');
  addParagraph(state, 'Before learning about their needs and operations, research:');
  addCheckbox(state, 'Facility ownership, size, and current patient census');
  addCheckbox(state, 'CMS quality ratings and recent inspection results');
  addCheckbox(state, 'Current hospice partnerships and competitors in the area');
  addCheckbox(state, 'Recent news, awards, or community involvement');
  addCheckbox(state, 'Key decision-makers and their LinkedIn profiles');
  addCheckbox(state, 'Organizational structure and reporting relationships');
  
  addSection(state, 'Stage 2: Connecting Preparation');
  addParagraph(state, 'Before learning individual needs of your contact, prepare:');
  addCheckbox(state, 'Personal background and career history of your contact');
  addCheckbox(state, 'Their specific role in the referral decision process');
  addCheckbox(state, 'Professional challenges they may be facing');
  addCheckbox(state, 'Mutual connections or shared professional interests');
  addCheckbox(state, 'Questions about their individual perspective on patient care');
  addCheckbox(state, 'Common ground topics for relationship building');
  
  addSection(state, 'Stage 3: Guiding Preparation');
  addParagraph(state, 'Before aligning needs to your features and benefits, have ready:');
  addCheckbox(state, 'Case studies relevant to their specific situation');
  addCheckbox(state, 'Data points that address their stated challenges');
  addCheckbox(state, 'Comparison of your approach vs. their current process');
  addCheckbox(state, 'ROI calculations and outcome improvement metrics');
  addCheckbox(state, 'References from similar facilities you can provide');
  addCheckbox(state, 'Customized presentation materials for their needs');
  
  addSection(state, 'Stage 4: Commitment Preparation');
  addParagraph(state, 'Before asking for the business, confirm:');
  addCheckbox(state, 'All decision-makers have been engaged and bought in');
  addCheckbox(state, 'Key objections have been fully addressed');
  addCheckbox(state, 'Implementation timeline is clearly understood');
  addCheckbox(state, 'Contract or agreement documents are ready');
  addCheckbox(state, 'Onboarding plan is prepared to present');
  addCheckbox(state, 'Next steps after commitment are clearly defined');
  
  addTipBox(state, 'Spartan Discipline', 'Never advance to the next stage until you have genuinely completed the current one. Rushing through stages leads to lost deals and wasted effort.', true);
  
  await finishDocument(state, 'public/resources/research-checklist.pdf');
}

async function createRegulationsGuide(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Medicare Hospice Regulations', 'Compliance Reference Guide - 42 CFR Part 418');
  
  addSection(state, 'Federal Eligibility Requirements');
  addParagraph(state, 'Under 42 CFR 418.24, patients must meet these four core requirements for Medicare hospice coverage:');
  
  addNumberedItem(state, 1, 'Medicare Part A Enrollment', 'Patient must be enrolled in Medicare Part A (Hospital Insurance)');
  addNumberedItem(state, 2, 'Physician Certification', 'Attending physician and hospice medical director must certify terminal illness');
  addNumberedItem(state, 3, 'Prognosis Requirement', 'Life expectancy of 6 months or less if disease runs its normal course');
  addNumberedItem(state, 4, 'Written Election', 'Patient or representative must sign election statement choosing hospice');
  
  addSection(state, 'Disease-Specific Clinical Guidelines');
  
  addSubsection(state, 'Cancer (LCD L33393)');
  addBullet(state, 'Metastatic disease or locally advanced with poor prognosis');
  addBullet(state, 'Declining functional status (Palliative Performance Scale < 70%)');
  addBullet(state, 'Patient declines or is no longer benefiting from curative treatment');
  
  addSubsection(state, 'Heart Disease (NYHA Class IV)');
  addBullet(state, 'Symptoms at rest despite optimal medical management');
  addBullet(state, 'Ejection fraction < 20% or 3+ hospitalizations in past 12 months');
  addBullet(state, 'Persistent hypotension, renal insufficiency, or cardiac cachexia');
  
  addSubsection(state, 'Pulmonary Disease (End-Stage COPD)');
  addBullet(state, 'Disabling dyspnea at rest or with minimal exertion');
  addBullet(state, 'FEV1 < 30% predicted after bronchodilator therapy');
  addBullet(state, 'Progressive weight loss, right heart failure, or cor pulmonale');
  
  addSubsection(state, 'Dementia (FAST Stage 7+)');
  addBullet(state, 'Unable to ambulate, dress, or bathe independently');
  addBullet(state, 'Limited speech (fewer than 6 intelligible words per day)');
  addBullet(state, 'Recent aspiration pneumonia, UTI, sepsis, or stage 3+ pressure ulcers');
  
  addSection(state, 'Aligning Compliance to the Sales Mastery Model');
  addSalesStage(state, 1, 'Discovery', 'Identify eligible patients during care planning meetings');
  addSalesStage(state, 2, 'Connecting', 'Conduct goals-of-care conversation with patient and family');
  addSalesStage(state, 3, 'Guiding', 'Educate on hospice benefits and address concerns');
  addSalesStage(state, 4, 'Commitment', 'Obtain physician certification and patient election');
  
  addTipBox(state, 'Compliance Tip', 'Document all hospice conversations in the medical record. Include patient/family responses and any barriers discussed. This protects the facility and supports continuity of care.', true);
  
  await finishDocument(state, 'public/resources/regulations-guide.pdf');
}

async function createFacilityScripts(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Facility-Specific Scripts', 'Customized Approaches for Each Healthcare Setting');
  
  addSection(state, 'Acute Care Hospitals');
  addSubsection(state, 'Key Pain Points');
  addBullet(state, 'Readmission penalties affecting reimbursement (30-day readmit rates)');
  addBullet(state, 'Length of stay pressure and bed turnover requirements');
  addBullet(state, 'Patient satisfaction scores (HCAHPS) impacting payments');
  
  addSubsection(state, 'Discovery Opening Script');
  addScriptBox(state, `"I work with hospitals like yours to reduce readmissions and improve patient satisfaction scores. Many of our hospital partners have seen a 15-20% reduction in 30-day readmits by identifying hospice-appropriate patients 24-48 hours earlier.\n\nHow are you currently identifying patients who might benefit from earlier hospice conversations?"`);
  
  addSection(state, 'Skilled Nursing Facilities');
  addSubsection(state, 'Key Pain Points');
  addBullet(state, 'Staff burden and after-hours coverage gaps');
  addBullet(state, 'Family satisfaction and complaint management');
  addBullet(state, 'Managing declining residents with appropriate care levels');
  
  addSubsection(state, 'Discovery Opening Script');
  addScriptBox(state, `"I partner with SNFs to provide 24/7 clinical support for your most complex residents. Our hospice team becomes an extension of your staff - handling symptom management, family conversations, and after-hours clinical needs.\n\nHow are you currently managing residents with declining trajectories?"`);
  
  addSection(state, 'Assisted Living Communities');
  addSubsection(state, 'Key Pain Points');
  addBullet(state, 'Aging-in-place versus hospital transfer decisions');
  addBullet(state, 'Family expectations and communication burden');
  addBullet(state, 'Staff training gaps in end-of-life care');
  
  addSubsection(state, 'Discovery Opening Script');
  addScriptBox(state, `"We help assisted living communities keep residents comfortable in their homes rather than transferring to hospitals during end-of-life. Our approach focuses on family communication and staff support.\n\nWhat percentage of your residents are currently aging in place versus transferring out?"`);
  
  addTipBox(state, 'Spartan Strategy', 'Always research the specific facility before calling. Reference their recent news, awards, or challenges to demonstrate you understand their unique situation. This moves you quickly from Discovery to Connecting.', true);
  
  await finishDocument(state, 'public/resources/facility-specific-scripts.pdf');
}

async function createFollowUpTemplates(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Follow-Up Communication', 'Templates for Advancing Through Each Stage');
  
  addSection(state, 'After Stage 1: Discovery Follow-Up');
  addParagraph(state, 'Send within 24 hours of your initial discovery conversation:');
  
  addEmailTemplate(state, 
    'Following Up - [Your Hospice Name] Partnership',
    `Hi [Name],

Thank you for taking time to speak with me today about [specific topic discussed]. I appreciated learning about [specific insight from conversation].

As promised, I've attached [resource mentioned]. Based on what you shared about [their challenge], I think you'll find the section on [relevant topic] particularly helpful.

I'd love to continue our conversation and learn more about how your team handles [specific process]. Would next [day] at [time] work for a brief follow-up call?

Best regards,
[Your Name]`);
  
  addSection(state, 'After Stage 2: Connecting Follow-Up');
  addParagraph(state, 'Send after building individual rapport with your contact:');
  
  addEmailTemplate(state,
    'Ideas for [Their Specific Challenge]',
    `Hi [Name],

I've been thinking about what you shared regarding [personal/professional challenge]. Your commitment to [specific value they expressed] really resonated with me.

I put together some thoughts on how we've helped others in similar situations. Would it be helpful if I walked you through a case study from [similar facility type]?

I'm available [2-3 time options]. Let me know what works best for you.

Best regards,
[Your Name]`);
  
  addSection(state, 'After Stage 3: Guiding Follow-Up');
  addParagraph(state, 'Send after presenting your solution aligned to their needs:');
  
  addEmailTemplate(state,
    'Next Steps - [Their Facility] Partnership',
    `Hi [Name],

Thank you for the opportunity to present how our approach could address [specific challenges discussed]. I hope the case study from [reference facility] was helpful in showing what's possible.

As we discussed, the next step would be [specific next action]. I've attached [relevant document] for your review.

I'll follow up on [specific date] to answer any questions. In the meantime, please don't hesitate to reach out.

Best regards,
[Your Name]`);
  
  addSection(state, 'After Stage 4: Commitment Follow-Up');
  addParagraph(state, 'Send after receiving commitment to partner:');
  
  addEmailTemplate(state,
    'Welcome to [Your Hospice Name] - Getting Started',
    `Hi [Name],

Thank you for choosing to partner with [Hospice Name]. We're honored by your trust and committed to exceeding your expectations.

Here's what happens next:
1. Our clinical team will contact you within [timeframe] to begin onboarding
2. We'll schedule a staff education session for [suggested timeframe]
3. Your dedicated liaison, [name], will be your ongoing point of contact

Welcome to the partnership. We look forward to serving your patients together.

Best regards,
[Your Name]`);
  
  addTipBox(state, 'Follow-Up Discipline', 'Always reference something specific from your previous conversation. Generic follow-ups feel impersonal and reduce response rates. Take notes during every call and use them.', true);
  
  await finishDocument(state, 'public/resources/followup-templates.pdf');
}

async function createPhysicianStrategy(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Physician Engagement Strategy', 'Building Medical Director Relationships');
  
  addSection(state, 'Understanding Physician Priorities');
  addParagraph(state, 'Physicians have unique concerns that require a tailored approach:');
  
  addBullet(state, 'Time efficiency is their most valuable resource');
  addBullet(state, 'Clinical outcomes and evidence-based care drive decisions');
  addBullet(state, 'They need clear, actionable communication');
  addBullet(state, 'Peer credibility matters more than sales presentations');
  
  addSection(state, 'The Physician Sales Mastery Approach');
  
  addSubsection(state, 'Stage 1: Discovery with Physicians');
  addParagraph(state, 'Focus on understanding their practice patterns and patient population:');
  addScriptBox(state, `"Dr. [Name], I work with physicians who manage patients with serious illness. I'm curious about your experience - when patients reach end-stage disease, what typically happens with their care transitions?"`);
  
  addSubsection(state, 'Stage 2: Connecting with Physicians');
  addParagraph(state, 'Build relationship through clinical credibility:');
  addBullet(state, 'Share relevant clinical research and outcomes data');
  addBullet(state, 'Offer CME opportunities on palliative care topics');
  addBullet(state, 'Introduce them to your medical director for peer consultation');
  addBullet(state, 'Demonstrate knowledge of their specialty-specific challenges');
  
  addSubsection(state, 'Stage 3: Guiding Physicians');
  addParagraph(state, 'Present solutions in clinical terms:');
  addBullet(state, 'Focus on patient outcomes and quality of life metrics');
  addBullet(state, 'Show how hospice extends their care rather than replacing it');
  addBullet(state, 'Provide clear criteria for when to consider hospice referral');
  addBullet(state, 'Offer streamlined referral processes that save time');
  
  addSubsection(state, 'Stage 4: Commitment from Physicians');
  addParagraph(state, 'Make partnering easy and low-risk:');
  addBullet(state, 'Start with a single patient trial rather than formal partnership');
  addBullet(state, 'Provide excellent follow-up communication on that first patient');
  addBullet(state, 'Gradually build to regular referral patterns');
  
  addSection(state, 'CME Partnership Opportunities');
  addParagraph(state, 'Offer educational value to physicians through:');
  addBullet(state, 'Lunch-and-learn sessions on hospice eligibility criteria');
  addBullet(state, 'Grand rounds presentations on symptom management');
  addBullet(state, 'Case conferences on complex patients');
  addBullet(state, 'Written CME materials on end-of-life care');
  
  addTipBox(state, 'Physician Relationship Rule', 'Never waste a physician\'s time. Be prepared, be brief, be clinical. If you can\'t articulate your value in 30 seconds, you\'re not ready for the meeting.', true);
  
  await finishDocument(state, 'public/resources/physician-strategy.pdf');
}

async function createCaseStudies(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Case Studies: Real Results', 'Measurable Outcomes from Spartan Method Implementation');
  
  addSection(state, 'Case Study 1: Regional SNF Network');
  
  addSubsection(state, 'The Challenge');
  addParagraph(state, 'A 12-facility skilled nursing network struggled with late hospice referrals, resulting in average hospice length of stay under 7 days. Staff burnout was high due to complex end-of-life care without hospice support.');
  
  addSubsection(state, 'The Spartan Approach');
  addBullet(state, 'Discovery: Mapped referral processes at each facility');
  addBullet(state, 'Connecting: Built relationships with DONs and social workers');
  addBullet(state, 'Guiding: Presented data on staff burden reduction with earlier referrals');
  addBullet(state, 'Commitment: Implemented facility-specific referral protocols');
  
  addSubsection(state, 'The Results');
  addBullet(state, 'Average hospice length of stay increased from 7 to 28 days');
  addBullet(state, 'Staff satisfaction scores improved 23% in 6 months');
  addBullet(state, 'Family satisfaction ratings increased to 94%');
  addBullet(state, 'Monthly referrals grew from 8 to 31 across the network');
  
  addSection(state, 'Case Study 2: Hospital Discharge Optimization');
  
  addSubsection(state, 'The Challenge');
  addParagraph(state, 'A 400-bed acute care hospital faced readmission penalties and low patient satisfaction scores. Hospice referrals were reactive, often made in the final 24 hours of hospitalization.');
  
  addSubsection(state, 'The Spartan Approach');
  addBullet(state, 'Discovery: Analyzed discharge data and identified high-risk patient patterns');
  addBullet(state, 'Connecting: Engaged case management leadership on shared goals');
  addBullet(state, 'Guiding: Demonstrated hospice impact on readmission rates');
  addBullet(state, 'Commitment: Integrated hospice screening into discharge planning rounds');
  
  addSubsection(state, 'The Results');
  addBullet(state, 'On-time hospice discharges increased from 62% to 89%');
  addBullet(state, '30-day readmission rate for hospice-eligible patients dropped 34%');
  addBullet(state, 'HCAHPS scores for discharge process improved 18 points');
  addBullet(state, 'Partnership expanded to include palliative care consults');
  
  addSection(state, 'Key Success Factors');
  addNumberedItem(state, 1, 'Patient Focus', 'Every conversation centered on patient outcomes, not sales metrics');
  addNumberedItem(state, 2, 'Stage Discipline', 'No rushing through the Sales Mastery Model stages');
  addNumberedItem(state, 3, 'Data-Driven', 'Measurable outcomes tracked and shared with partners');
  addNumberedItem(state, 4, 'Relationship Investment', 'Long-term partnership mentality over transactional approach');
  
  addTipBox(state, 'Using Case Studies', 'When presenting case studies, always ask first: "Would it be helpful if I shared how a similar facility addressed this challenge?" Let them invite the story rather than forcing it.', true);
  
  await finishDocument(state, 'public/resources/case-studies.pdf');
}

async function createDecisionFrameworks(): Promise<void> {
  const state = createDocument();
  
  addDocumentTitle(state, 'Decision Frameworks', 'Strategic Tools for Field Sales Excellence');
  
  addSection(state, 'Account Prioritization Matrix');
  addParagraph(state, 'Use this framework to allocate your time across your territory:');
  
  const priorityWidths = [100, 130, 130, 144];
  addTableRow(state, ['Priority', 'Characteristics', 'Time Allocation', 'Stage Focus'], priorityWidths, true);
  addTableRow(state, ['A - Strategic', 'High potential, receptive', '50% of time', 'All stages'], priorityWidths);
  addTableRow(state, ['B - Developing', 'Good potential, building', '30% of time', 'Stage 1-2'], priorityWidths);
  addTableRow(state, ['C - Maintain', 'Lower potential or resistant', '20% of time', 'Periodic touch'], priorityWidths);
  
  state.y += 10;
  
  addSection(state, 'Objection Response Framework');
  addParagraph(state, 'Use the ACE method for handling any objection:');
  
  addNumberedItem(state, 1, 'Acknowledge', 'Show you heard and respect their concern: "I understand..."');
  addNumberedItem(state, 2, 'Clarify', 'Ask a question to understand the root cause: "Help me understand..."');
  addNumberedItem(state, 3, 'Educate', 'Provide information that addresses the concern: "What we\'ve found is..."');
  
  addSection(state, 'Stage Advancement Criteria');
  addParagraph(state, 'Only advance to the next stage when you can confirm:');
  
  addSubsection(state, 'Discovery to Connecting');
  addCheckbox(state, 'You understand their organizational needs and processes');
  addCheckbox(state, 'You have identified key stakeholders and decision-makers');
  addCheckbox(state, 'You have permission to explore individual needs');
  
  addSubsection(state, 'Connecting to Guiding');
  addCheckbox(state, 'You understand the personal motivations of your contact');
  addCheckbox(state, 'You have built sufficient rapport and trust');
  addCheckbox(state, 'They have expressed interest in potential solutions');
  
  addSubsection(state, 'Guiding to Commitment');
  addCheckbox(state, 'They agree your solution addresses their needs');
  addCheckbox(state, 'All major objections have been addressed');
  addCheckbox(state, 'Decision-makers are aligned and ready');
  
  addSection(state, 'Weekly Planning Framework');
  addParagraph(state, 'Structure your week for maximum effectiveness:');
  
  addBullet(state, 'Monday: Planning and research for the week ahead');
  addBullet(state, 'Tuesday-Thursday: High-value face-to-face meetings');
  addBullet(state, 'Friday: Follow-up, documentation, and next week prep');
  
  addTipBox(state, 'Strategic Discipline', 'Review these frameworks weekly. The difference between good and great salespeople is consistent application of proven processes, not occasional brilliance.', true);
  
  await finishDocument(state, 'public/resources/decision-frameworks.pdf');
}

async function createWeeklyActivityTracker(): Promise<void> {
  const state = createDocument();

  addDocumentTitle(state, 'Weekly Activity Tracker', 'Track Daily Conversations, Referrals, and Admissions');

  addSection(state, 'How to Use This Tracker');
  addParagraph(state, 'Record each conversation with a referral source contact throughout the day. At the end of each day, tally your numbers and note any key takeaways. Review weekly totals every Friday to identify patterns and adjust your plan.');

  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    addSection(state, day);
    addSubsection(state, 'Conversations');
    addCheckbox(state, 'Account Name: ________________  Contact: ________________  Outcome: ________________');
    addCheckbox(state, 'Account Name: ________________  Contact: ________________  Outcome: ________________');
    addCheckbox(state, 'Account Name: ________________  Contact: ________________  Outcome: ________________');
    addCheckbox(state, 'Account Name: ________________  Contact: ________________  Outcome: ________________');
    addCheckbox(state, 'Account Name: ________________  Contact: ________________  Outcome: ________________');
    addCheckbox(state, 'Account Name: ________________  Contact: ________________  Outcome: ________________');
    addSubsection(state, 'Daily Totals');
    addParagraph(state, 'Conversations: ____  Referrals Received: ____  Admissions: ____');
    addSubsection(state, 'Notes and Observations');
    addParagraph(state, '________________________________________________________________________');
    addParagraph(state, '________________________________________________________________________');
  }

  addSection(state, 'Weekly Summary');
  addParagraph(state, 'Total Conversations: ____  Total Referrals: ____  Total Admissions: ____');
  addParagraph(state, 'Conversion Rate (Referrals to Admissions): ____%');
  addSubsection(state, 'Weekly Reflection');
  addParagraph(state, 'What worked well this week?');
  addParagraph(state, '________________________________________________________________________');
  addParagraph(state, 'What could improve next week?');
  addParagraph(state, '________________________________________________________________________');

  addTipBox(state, 'Coaching Tip', 'Consistency matters more than perfection. If you track every day for four weeks, the patterns in your data will tell you exactly where to focus your energy.', true);

  await finishDocument(state, 'public/resources/weekly-activity-tracker.pdf');
}

async function createEligibilityQuickReference(): Promise<void> {
  const state = createDocument();

  addDocumentTitle(state, 'Hospice Eligibility Quick Reference', 'Clinical Criteria by Diagnosis');

  addSection(state, 'General Eligibility Requirements');
  addBullet(state, 'Terminal prognosis of 6 months or less if disease runs its normal course');
  addBullet(state, 'Patient elects comfort focused care over curative treatment');
  addBullet(state, 'Certification by attending physician and hospice medical director');

  addSection(state, 'Cancer');
  addBullet(state, 'Metastatic or locally advanced disease');
  addBullet(state, 'Disease progression despite treatment or patient declines further treatment');
  addBullet(state, 'Declining functional status (KPS 50 or below)');

  addSection(state, 'Heart Disease');
  addBullet(state, 'NYHA Class IV symptoms despite optimal treatment');
  addBullet(state, 'Ejection fraction 20% or less');
  addBullet(state, 'Refractory angina or recurrent hospitalizations');
  addBullet(state, 'History of cardiac arrest or syncope');

  addSection(state, 'COPD and Pulmonary Disease');
  addBullet(state, 'Disabling dyspnea at rest');
  addBullet(state, 'FEV1 below 30% predicted');
  addBullet(state, 'Progressive disease with increasing ER visits or hospitalizations');
  addBullet(state, 'Cor pulmonale or right heart failure');

  addSection(state, 'Dementia and Alzheimer\'s');
  addBullet(state, 'FAST Scale Stage 7 or beyond');
  addBullet(state, 'Inability to ambulate, dress, or bathe without assistance');
  addBullet(state, 'Urinary and fecal incontinence');
  addBullet(state, 'Limited meaningful speech (fewer than 6 intelligible words per day)');
  addBullet(state, 'Plus a comorbid condition within the past 12 months');

  addSection(state, 'Renal Disease');
  addBullet(state, 'Patient not seeking or discontinuing dialysis');
  addBullet(state, 'Creatinine clearance below 10 ml/min');
  addBullet(state, 'Serum creatinine above 8.0 mg/dl with comorbid conditions');

  addSection(state, 'Liver Disease');
  addBullet(state, 'Prothrombin time more than 5 seconds over control');
  addBullet(state, 'Serum albumin less than 2.5 g/dl');
  addBullet(state, 'Refractory ascites or hepatic encephalopathy');

  addSection(state, 'Stroke and CVA');
  addBullet(state, 'Coma or persistent vegetative state beyond 3 days');
  addBullet(state, 'Dysphagia preventing adequate food and fluid intake');
  addBullet(state, 'Post stroke dementia with FAST Stage 7 or beyond');

  addSection(state, 'Adult Failure to Thrive');
  addBullet(state, 'BMI under 22');
  addBullet(state, 'Unintentional weight loss exceeding 10% in 6 months');
  addBullet(state, 'Declining functional status and serum albumin under 2.5');

  addTipBox(state, 'Field Note', 'You do not need to memorize every criterion. Know the most common diagnoses in your territory and keep this card accessible. When in doubt, ask your clinical team for a consultation.', true);

  await finishDocument(state, 'public/resources/eligibility-quick-reference.pdf');
}

async function createNewHireOnboarding(): Promise<void> {
  const state = createDocument();

  addDocumentTitle(state, 'New Hire Onboarding Checklist', '90 Day Plan for Hospice Sales Representatives');

  addSection(state, 'Week 1: Orientation and Foundation');
  addCheckbox(state, 'Complete company orientation and HR requirements');
  addCheckbox(state, 'Meet clinical team members (nursing, social work, chaplain)');
  addCheckbox(state, 'Review all hospice service offerings and levels of care');
  addCheckbox(state, 'Study the Medicare Hospice Benefit basics');
  addCheckbox(state, 'Shadow an experienced rep for 2 full days in the field');
  addCheckbox(state, 'Receive territory assignment and account list');
  addCheckbox(state, 'Set up CRM and learn documentation requirements');

  addSection(state, 'Week 2: Territory Mapping');
  addCheckbox(state, 'Map all referral sources in your territory by type');
  addCheckbox(state, 'Research the top 20 accounts (key contacts, volume, competitors)');
  addCheckbox(state, 'Tier accounts into A, B, and C categories');
  addCheckbox(state, 'Create a visit schedule based on account tiers');
  addCheckbox(state, 'Practice your elevator pitch until it feels natural');
  addCheckbox(state, 'Complete a second ride along with your manager');

  addSection(state, 'Week 3 to 4: Initial Outreach');
  addCheckbox(state, 'Visit 5 accounts per day minimum');
  addCheckbox(state, 'Introduce yourself to key contacts at each location');
  addCheckbox(state, 'Deliver a value message, not a company pitch');
  addCheckbox(state, 'Document every visit in your CRM');
  addCheckbox(state, 'Schedule your first lunch and learn');
  addCheckbox(state, 'Debrief weekly with your manager on conversation quality');

  addSection(state, 'Month 2: Building Relationships');
  addCheckbox(state, 'Increase to 6 to 8 conversations per day');
  addCheckbox(state, 'Begin second round visits at top tier accounts');
  addCheckbox(state, 'Deliver at least 2 lunch and learns');
  addCheckbox(state, 'Study eligibility criteria for the 3 most common diagnoses in your territory');
  addCheckbox(state, 'Practice objection handling with your manager or a peer');
  addCheckbox(state, 'Track weekly activity and conversion metrics');

  addSection(state, 'Month 3: Full Pace Operations');
  addCheckbox(state, 'Operating at full daily conversation targets');
  addCheckbox(state, 'Maintain consistent visit frequency by account tier');
  addCheckbox(state, 'Receiving regular referrals from at least 3 sources');
  addCheckbox(state, 'Completing all documentation within 24 hours');
  addCheckbox(state, 'Conducting regular lunch and learns independently');
  addCheckbox(state, 'Preparing for first quarterly territory review');

  addTipBox(state, '90 Day Milestone', 'By the end of 90 days, you should be operating at full daily targets, have established relationships at your top accounts, and be generating consistent referral activity. If you are behind in any area, talk to your manager about a specific plan to catch up.', true);

  await finishDocument(state, 'public/resources/new-hire-onboarding.pdf');
}

async function createLunchLearnTemplate(): Promise<void> {
  const state = createDocument();

  addDocumentTitle(state, 'Lunch and Learn Presentation Template', 'Educational Presentation for Referral Sources');

  addSection(state, 'Before the Presentation');
  addBullet(state, 'Confirm date, time, and room with your contact at least one week ahead');
  addBullet(state, 'Ask how many attendees to expect and what roles they hold');
  addBullet(state, 'Choose a topic relevant to their patient population');
  addBullet(state, 'Prepare food that is easy to eat during a presentation (no messy options)');
  addBullet(state, 'Arrive 15 minutes early to set up');

  addSection(state, 'Presentation Structure (15 to 20 Minutes)');

  addNumberedItem(state, 1, 'Opening (2 minutes)', 'Introduce yourself briefly. Thank the team for their time. State the topic and why it matters to their patients.');
  addNumberedItem(state, 2, 'The Problem (3 minutes)', 'Describe a common challenge their patients face that relates to your topic. Use a relatable scenario, not statistics.');
  addNumberedItem(state, 3, 'Key Education Points (8 minutes)', 'Cover 3 to 4 specific, practical takeaways. Use simple language. Avoid acronyms unless you define them. Connect each point back to patient outcomes.');
  addNumberedItem(state, 4, 'How to Identify Patients (3 minutes)', 'Give them clear, actionable signs to look for. This is the most valuable part for clinical staff.');
  addNumberedItem(state, 5, 'Q&A and Close (3 minutes)', 'Open the floor for questions. Thank them again. Leave your card and a one page reference sheet.');

  addSection(state, 'Suggested Topics');
  addBullet(state, 'Common misconceptions about hospice care');
  addBullet(state, 'How to have the hospice conversation with families');
  addBullet(state, 'Hospice eligibility criteria for specific diagnoses');
  addBullet(state, 'The difference between palliative care and hospice');
  addBullet(state, 'How hospice supports the facility care team');
  addBullet(state, 'What families wish they had known sooner');

  addSection(state, 'Common Mistakes to Avoid');
  addBullet(state, 'Talking too much about your company instead of educating');
  addBullet(state, 'Using too many slides or reading from notes');
  addBullet(state, 'Going over 20 minutes (respect their schedule)');
  addBullet(state, 'Forgetting to leave a reference sheet or contact info');
  addBullet(state, 'Not following up within 48 hours after the presentation');

  addTipBox(state, 'The Real Goal', 'A lunch and learn is not a sales pitch. It is an opportunity to establish yourself as a knowledgeable, trustworthy resource. If you do that well, the referrals will follow naturally.', true);

  await finishDocument(state, 'public/resources/lunch-learn-template.pdf');
}

async function createAccountTieringWorksheet(): Promise<void> {
  const state = createDocument();

  addDocumentTitle(state, 'Account Tiering Worksheet', 'Prioritize Your Territory for Maximum Impact');

  addSection(state, 'How Account Tiering Works');
  addParagraph(state, 'Not all accounts deserve equal time. Tiering helps you invest your limited hours where they will generate the most referrals and admissions. Review your tiers monthly and adjust based on results.');

  addSection(state, 'Tier Definitions');

  addSubsection(state, 'A Tier: High Value Accounts (Visit Weekly)');
  addBullet(state, 'Currently sending referrals or high potential to start');
  addBullet(state, 'Strong relationship with key contacts');
  addBullet(state, 'High patient volume in your target population');
  addBullet(state, 'Typically 8 to 12 accounts in this tier');

  addSubsection(state, 'B Tier: Growth Accounts (Visit Every 2 Weeks)');
  addBullet(state, 'Occasional referrals or growing relationship');
  addBullet(state, 'Moderate patient volume with room to grow');
  addBullet(state, 'Requires more education or trust building');
  addBullet(state, 'Typically 15 to 20 accounts in this tier');

  addSubsection(state, 'C Tier: Maintenance Accounts (Visit Monthly)');
  addBullet(state, 'Low current volume but worth maintaining');
  addBullet(state, 'New contacts still being developed');
  addBullet(state, 'May move up with consistent effort');
  addBullet(state, 'Remaining accounts in your territory');

  addSection(state, 'Scoring Criteria');
  addParagraph(state, 'Rate each account 1 to 5 on the following dimensions:');
  addBullet(state, 'Current referral volume (1 = none, 5 = consistent high volume)');
  addBullet(state, 'Growth potential (1 = maxed out, 5 = significant untapped potential)');
  addBullet(state, 'Relationship strength (1 = no contacts, 5 = strong champion)');
  addBullet(state, 'Competitive position (1 = locked out, 5 = preferred provider)');
  addParagraph(state, 'Total score 16 to 20 = A Tier. Score 10 to 15 = B Tier. Score below 10 = C Tier.');

  addSection(state, 'Account Tiering Template');
  addParagraph(state, 'Account: ________________  Type: ________________  Tier: ____');
  addParagraph(state, 'Key Contact: ________________  Volume Score: __  Growth Score: __');
  addParagraph(state, 'Relationship Score: __  Competitive Score: __  Total: ____');
  addParagraph(state, '');
  addParagraph(state, 'Account: ________________  Type: ________________  Tier: ____');
  addParagraph(state, 'Key Contact: ________________  Volume Score: __  Growth Score: __');
  addParagraph(state, 'Relationship Score: __  Competitive Score: __  Total: ____');
  addParagraph(state, '');
  addParagraph(state, 'Account: ________________  Type: ________________  Tier: ____');
  addParagraph(state, 'Key Contact: ________________  Volume Score: __  Growth Score: __');
  addParagraph(state, 'Relationship Score: __  Competitive Score: __  Total: ____');

  addTipBox(state, 'Territory Discipline', 'The hardest part of tiering is being honest about accounts that consume your time without producing results. If an account has been C Tier for three months with no movement, it may be time to stop visiting and replace it with a new prospect.', true);

  await finishDocument(state, 'public/resources/account-tiering-worksheet.pdf');
}

async function createDifficultConversationGuide(): Promise<void> {
  const state = createDocument();

  addDocumentTitle(state, 'Difficult Conversation Preparation Guide', 'Frameworks for Sensitive End of Life Discussions');

  addSection(state, 'Before the Conversation');
  addParagraph(state, 'Difficult conversations in hospice are not about having the right words. They are about having the right posture: listening more than talking, being comfortable with silence, and letting the other person lead when they are ready.');

  addSubsection(state, 'Preparation Checklist');
  addCheckbox(state, 'Review the patient situation and any clinical details you have');
  addCheckbox(state, 'Identify who will be in the conversation and their likely concerns');
  addCheckbox(state, 'Prepare 2 to 3 open ended questions rather than a script');
  addCheckbox(state, 'Check your own emotional state before entering the room');

  addSection(state, 'Common Scenarios');

  addSubsection(state, 'When a Family Says "We Are Not Ready"');
  addParagraph(state, 'This is the most common thing you will hear. Resist the urge to convince them otherwise.');
  addBullet(state, 'Acknowledge: "That makes complete sense. This is a big decision."');
  addBullet(state, 'Explore: "Can you tell me more about what feels like it is not the right time?"');
  addBullet(state, 'Educate: "Some families find it helpful to at least understand what services are available, with no pressure to decide today."');

  addSubsection(state, 'When a Physician Resists the Hospice Conversation');
  addParagraph(state, 'Physicians often feel that discussing hospice means they have failed. Approach with respect for their clinical judgment.');
  addBullet(state, 'Acknowledge: "I understand there is still a lot you are doing for this patient."');
  addBullet(state, 'Explore: "Have the family members expressed any concerns about the patient\'s comfort?"');
  addBullet(state, 'Educate: "Hospice can actually work alongside your care plan to support symptom management."');

  addSubsection(state, 'When a Discharge Planner Is Overwhelmed');
  addParagraph(state, 'Discharge planners manage dozens of cases at once. Respect their time and make things simple.');
  addBullet(state, 'Lead with: "I know you are busy. I just wanted to check if there is anyone I can help with today."');
  addBullet(state, 'Be specific: "I noticed Mrs. Johnson has been here for 12 days. Would it be helpful if I spoke with the family?"');
  addBullet(state, 'Follow through: Everything you promise, deliver on time, every time.');

  addSection(state, 'Language to Use and Language to Avoid');
  addSubsection(state, 'Use');
  addBullet(state, '"Tell me more about what is happening."');
  addBullet(state, '"What matters most to you right now?"');
  addBullet(state, '"How can I be most helpful to you today?"');
  addBullet(state, '"There is no pressure to make any decisions right now."');

  addSubsection(state, 'Avoid');
  addBullet(state, '"You need to consider hospice." (Too directive)');
  addBullet(state, '"Most patients at this stage..." (Generalizing their situation)');
  addBullet(state, '"If I were you..." (Making it about you)');
  addBullet(state, '"They qualify for hospice." (Clinical language that feels cold)');

  addTipBox(state, 'The Most Important Thing', 'In difficult conversations, your presence matters more than your words. Being calm, patient, and genuinely interested in what the other person needs will carry you further than any scripted response.', true);

  await finishDocument(state, 'public/resources/difficult-conversation-guide.pdf');
}

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
  
  console.log('All 15 training PDFs generated successfully!');
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  generateAllPDFs().catch(console.error);
}
