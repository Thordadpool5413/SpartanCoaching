import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const SPARTAN_RED = '#DC2626';
const SPARTAN_RED_DARK = '#B91C1C';
const DARK_TEXT = '#111827';
const MEDIUM_TEXT = '#374151';
const LIGHT_TEXT = '#6B7280';
const ACCENT_BG = '#FEF2F2';
const BORDER_COLOR = '#E5E7EB';

const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

function addProfessionalHeader(doc: InstanceType<typeof PDFDocument>, title: string, subtitle?: string) {
  doc.rect(0, 0, doc.page.width, 8).fill(SPARTAN_RED);
  
  doc.rect(0, 8, doc.page.width, 85).fill('#FAFAFA');
  doc.strokeColor(BORDER_COLOR).lineWidth(1);
  doc.moveTo(0, 93).lineTo(doc.page.width, 93).stroke();
  
  doc.fontSize(24).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('SPARTAN', MARGIN_LEFT, 25);
  doc.fontSize(24).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text('COACHING', MARGIN_LEFT + 95, 25);
  
  doc.fontSize(9).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('DISCIPLINE  •  EMPATHY  •  STRATEGY', MARGIN_LEFT, 52);
  
  doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
  doc.text('Hospice Sales Excellence Training', doc.page.width - 200, 25, { width: 150, align: 'right' });
  doc.text('www.spartan.coach', doc.page.width - 200, 40, { width: 150, align: 'right' });
  
  doc.fontSize(20).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(title, MARGIN_LEFT, 110);
  
  if (subtitle) {
    doc.fontSize(11).fillColor(MEDIUM_TEXT).font('Helvetica');
    doc.text(subtitle, MARGIN_LEFT, 135);
  }
  
  doc.strokeColor(SPARTAN_RED).lineWidth(3);
  doc.moveTo(MARGIN_LEFT, subtitle ? 155 : 140).lineTo(MARGIN_LEFT + 80, subtitle ? 155 : 140).stroke();
  
  return subtitle ? 170 : 155;
}

function addFooter(doc: InstanceType<typeof PDFDocument>, pageNum?: number, totalPages?: number) {
  const footerY = doc.page.height - 50;
  
  doc.strokeColor(BORDER_COLOR).lineWidth(1);
  doc.moveTo(MARGIN_LEFT, footerY).lineTo(doc.page.width - MARGIN_RIGHT, footerY).stroke();
  
  doc.fontSize(8).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('© 2025 Spartan Coaching. All Rights Reserved. Confidential Training Material.', MARGIN_LEFT, footerY + 12);
  
  if (pageNum && totalPages) {
    doc.text(`Page ${pageNum} of ${totalPages}`, doc.page.width - MARGIN_RIGHT - 60, footerY + 12);
  }
  
  doc.rect(0, doc.page.height - 6, doc.page.width, 6).fill(SPARTAN_RED);
}

function addSectionHeader(doc: InstanceType<typeof PDFDocument>, title: string, y: number): number {
  doc.rect(MARGIN_LEFT - 5, y, CONTENT_WIDTH + 10, 28).fill(ACCENT_BG);
  doc.fontSize(13).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text(title.toUpperCase(), MARGIN_LEFT, y + 8);
  return y + 38;
}

function addSubSection(doc: InstanceType<typeof PDFDocument>, title: string, y: number): number {
  doc.fontSize(11).fillColor(SPARTAN_RED_DARK).font('Helvetica-Bold');
  doc.text(title, MARGIN_LEFT, y);
  return doc.y + 8;
}

function addParagraph(doc: InstanceType<typeof PDFDocument>, text: string, y: number, indent = 0): number {
  doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
  doc.text(text, MARGIN_LEFT + indent, y, { width: CONTENT_WIDTH - indent });
  return doc.y + 10;
}

function addBulletPoint(doc: InstanceType<typeof PDFDocument>, text: string, y: number, bullet = '•'): number {
  doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text(bullet, MARGIN_LEFT + 10, y);
  doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
  doc.text(text, MARGIN_LEFT + 25, y, { width: CONTENT_WIDTH - 25 });
  return doc.y + 6;
}

function addNumberedItem(doc: InstanceType<typeof PDFDocument>, num: number, title: string, description: string, y: number): number {
  doc.fontSize(12).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text(`${num}.`, MARGIN_LEFT, y);
  doc.fontSize(11).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(title, MARGIN_LEFT + 20, y);
  doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
  doc.text(description, MARGIN_LEFT + 20, doc.y + 4, { width: CONTENT_WIDTH - 20 });
  return doc.y + 12;
}

function addQuoteBox(doc: InstanceType<typeof PDFDocument>, quote: string, y: number, height = 50): number {
  doc.rect(MARGIN_LEFT, y, 4, height).fill(SPARTAN_RED);
  doc.rect(MARGIN_LEFT + 4, y, CONTENT_WIDTH - 4, height).fill('#F9FAFB');
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica-Oblique');
  doc.text(`"${quote}"`, MARGIN_LEFT + 15, y + 10, { width: CONTENT_WIDTH - 30 });
  return y + height + 15;
}

function addTipBox(doc: InstanceType<typeof PDFDocument>, title: string, content: string, y: number): number {
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 60).fill(ACCENT_BG);
  doc.rect(MARGIN_LEFT, y, 4, 60).fill(SPARTAN_RED);
  doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text(`[TIP] ${title}`, MARGIN_LEFT + 15, y + 10);
  doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
  doc.text(content, MARGIN_LEFT + 15, y + 28, { width: CONTENT_WIDTH - 30 });
  return y + 70;
}

function addChecklistItem(doc: InstanceType<typeof PDFDocument>, text: string, y: number): number {
  doc.rect(MARGIN_LEFT + 10, y + 2, 12, 12).lineWidth(1).strokeColor(SPARTAN_RED).stroke();
  doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
  doc.text(text, MARGIN_LEFT + 30, y, { width: CONTENT_WIDTH - 40 });
  return doc.y + 8;
}

function addStageBox(doc: InstanceType<typeof PDFDocument>, stageNum: number, stageName: string, stageDesc: string, y: number): number {
  doc.rect(MARGIN_LEFT, y, 40, 40).fill(SPARTAN_RED);
  doc.fontSize(20).fillColor('#FFFFFF').font('Helvetica-Bold');
  doc.text(`${stageNum}`, MARGIN_LEFT + 14, y + 10);
  
  doc.rect(MARGIN_LEFT + 40, y, CONTENT_WIDTH - 40, 40).fill('#F9FAFB');
  doc.strokeColor(BORDER_COLOR).lineWidth(1);
  doc.rect(MARGIN_LEFT + 40, y, CONTENT_WIDTH - 40, 40).stroke();
  
  doc.fontSize(12).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(stageName.toUpperCase(), MARGIN_LEFT + 55, y + 8);
  doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
  doc.text(stageDesc, MARGIN_LEFT + 55, y + 24, { width: CONTENT_WIDTH - 70 });
  
  return y + 50;
}

function createColdCallPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/cold-call-script.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Cold Call Opening Script', 'Healthcare Sales Mastery Model - Stage 1: Discovery');
    
    y = addSectionHeader(doc, 'The Healthcare Sales Mastery Model', y);
    y = addParagraph(doc, 'Every successful healthcare sale follows this proven 4-stage progression. Master each stage before advancing:', y);
    
    y = addStageBox(doc, 1, 'Discovery', 'Learning about the needs and operations of the account or contact', y);
    y = addStageBox(doc, 2, 'Connecting', 'Learning the individual needs of the account or contact', y);
    y = addStageBox(doc, 3, 'Guiding', 'Aligning their needs to your features and benefits', y);
    y = addStageBox(doc, 4, 'Commitment', 'Closing and asking for the business', y);
    
    y += 5;
    y = addSectionHeader(doc, 'Stage 1: The Spartan 30-Second Opening', y);
    
    y = addQuoteBox(doc, "Hi [Name], this is [Your Name] with [Hospice Company]. I know you're incredibly busy caring for patients, so I'll be brief. We partner with facilities like yours to ensure patients receive optimal comfort care at the right time. Do you have 30 seconds?", y, 55);
    
    y = addSubSection(doc, 'Why This Opening Works:', y);
    y = addBulletPoint(doc, 'Acknowledges their time constraints immediately (builds respect)', y);
    y = addBulletPoint(doc, 'Focuses on patient outcomes, not sales (aligns with their mission)', y);
    y = addBulletPoint(doc, 'Requests minimal commitment (lowers resistance)', y);
    
    y += 8;
    y = addSectionHeader(doc, 'Discovery Questions (Stage 1)', y);
    y = addParagraph(doc, 'Your goal: Learn about their operations, processes, and organizational challenges.', y);
    
    const discoveryQuestions = [
      'How many patients in your facility would you estimate are appropriate for hospice comfort care?',
      'What does your current referral process look like when a patient becomes appropriate?',
      'Who else is typically involved in those care transition decisions?',
      'What challenges do you face in identifying appropriate patients early enough?'
    ];
    
    discoveryQuestions.forEach((q, i) => {
      y = addNumberedItem(doc, i + 1, '', `"${q}"`, y);
    });
    
    y += 5;
    y = addSectionHeader(doc, 'Spartan Objection Framework', y);
    
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('OBJECTION: "We already have a hospice partner"', MARGIN_LEFT, y);
    y = doc.y + 5;
    y = addQuoteBox(doc, "I respect that relationship. Many of our best partners work with multiple hospice providers to ensure coverage and options for families. What criteria do you use when a family requests a specific provider?", y, 45);
    
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('OBJECTION: "Not interested right now"', MARGIN_LEFT, y);
    y = doc.y + 5;
    y = addQuoteBox(doc, "I understand completely. Could I send you a 2-minute assessment tool? No obligation—just something that might be helpful for identifying patients who could benefit from earlier hospice conversations.", y, 45);
    
    y = addTipBox(doc, 'SPARTAN PRINCIPLE', 'Never argue with an objection. Acknowledge, pivot to value, and offer a low-commitment next step. Discipline in your response builds trust.', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createTerritoryPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/territory-template.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Sales Territory Analysis Template', 'Track Progress Through the Healthcare Sales Mastery Model');
    
    y = addSectionHeader(doc, 'Territory Overview', y);
    
    doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
    const fields = [
      'Territory Name: _______________________________________________',
      'Territory Manager: ____________________________________________',
      'Analysis Period: ______________________________________________'
    ];
    fields.forEach(field => {
      doc.text(field, MARGIN_LEFT, y);
      y += 20;
    });
    
    y += 5;
    y = addSectionHeader(doc, 'Healthcare Sales Mastery Model Tracking', y);
    y = addParagraph(doc, 'Track each account through the 4 stages of the sales process:', y);
    
    doc.strokeColor(BORDER_COLOR).lineWidth(1);
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 25).fill('#F9FAFB').stroke();
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Stage', MARGIN_LEFT + 10, y + 8);
    doc.text('Definition', MARGIN_LEFT + 80, y + 8);
    doc.text('# Accounts', MARGIN_LEFT + 320, y + 8);
    doc.text('Target', MARGIN_LEFT + 410, y + 8);
    y += 25;
    
    const stages = [
      ['1. Discovery', 'Learning about needs/operations of account', '___', '___'],
      ['2. Connecting', 'Learning individual needs of contact', '___', '___'],
      ['3. Guiding', 'Aligning needs to features/benefits', '___', '___'],
      ['4. Commitment', 'Closing, asking for the business', '___', '___']
    ];
    
    stages.forEach(([stage, def, count, target]) => {
      doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 22).stroke();
      doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(stage, MARGIN_LEFT + 10, y + 7);
      doc.fontSize(8).fillColor(MEDIUM_TEXT).font('Helvetica');
      doc.text(def, MARGIN_LEFT + 80, y + 7, { width: 220 });
      doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(count, MARGIN_LEFT + 330, y + 7);
      doc.text(target, MARGIN_LEFT + 420, y + 7);
      y += 22;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'Facility Inventory by Type', y);
    
    doc.strokeColor(BORDER_COLOR).lineWidth(1);
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 22).fill('#F9FAFB').stroke();
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Facility Type', MARGIN_LEFT + 10, y + 6);
    doc.text('Count', MARGIN_LEFT + 180, y + 6);
    doc.text('Priority A', MARGIN_LEFT + 250, y + 6);
    doc.text('Priority B', MARGIN_LEFT + 330, y + 6);
    doc.text('Priority C', MARGIN_LEFT + 410, y + 6);
    y += 22;
    
    const facilityTypes = ['Acute Care Hospitals', 'Skilled Nursing Facilities', 'Assisted Living', 'Home Health Agencies', 'Physician Practices'];
    facilityTypes.forEach(type => {
      doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 20).stroke();
      doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
      doc.text(type, MARGIN_LEFT + 10, y + 6);
      y += 20;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'Weekly Activity Targets', y);
    
    y = addBulletPoint(doc, 'Discovery calls/visits: ___ per week', y);
    y = addBulletPoint(doc, 'Connecting meetings scheduled: ___ per week', y);
    y = addBulletPoint(doc, 'Guiding presentations delivered: ___ per week', y);
    y = addBulletPoint(doc, 'Commitment asks made: ___ per week', y);
    
    y += 10;
    y = addTipBox(doc, 'TRACKING SUCCESS', 'Review your stage progression weekly. If accounts are stalling in one stage, focus your training and preparation on advancing through that specific stage.', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createChecklistPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/research-checklist.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Pre-Call Research Checklist', 'Complete Preparation for Every Stage of the Sales Mastery Model');
    
    y = addSectionHeader(doc, 'Stage 1: Discovery Preparation', y);
    y = addParagraph(doc, 'Before learning about their needs/operations, research:', y);
    
    const discoveryItems = [
      'Facility ownership, size, and patient census',
      'CMS quality ratings and recent inspection results',
      'Current hospice partnerships (if any)',
      'Recent news, awards, or community involvement',
      'Key decision-makers and their LinkedIn profiles'
    ];
    discoveryItems.forEach(item => { y = addChecklistItem(doc, item, y); });
    
    y += 10;
    y = addSectionHeader(doc, 'Stage 2: Connecting Preparation', y);
    y = addParagraph(doc, 'Before learning individual needs of the contact, prepare:', y);
    
    const connectingItems = [
      'Personal background of your specific contact',
      'Their role in the referral decision process',
      'Their professional challenges and goals',
      'Mutual connections or shared interests',
      'Questions about their individual perspective on patient care'
    ];
    connectingItems.forEach(item => { y = addChecklistItem(doc, item, y); });
    
    y += 10;
    y = addSectionHeader(doc, 'Stage 3: Guiding Preparation', y);
    y = addParagraph(doc, 'Before aligning needs to features/benefits, have ready:', y);
    
    const guidingItems = [
      'Case studies relevant to their specific situation',
      'Data points that address their stated challenges',
      'Comparison of your approach vs. their current process',
      'ROI calculations or outcome improvements',
      'References from similar facilities'
    ];
    guidingItems.forEach(item => { y = addChecklistItem(doc, item, y); });
    
    y += 10;
    y = addSectionHeader(doc, 'Stage 4: Commitment Preparation', y);
    y = addParagraph(doc, 'Before asking for the business, confirm:', y);
    
    const commitmentItems = [
      'All decision-makers have been engaged',
      'Key objections have been addressed',
      'Implementation timeline is understood',
      'Contract or agreement documents ready',
      'Onboarding plan prepared to present'
    ];
    commitmentItems.forEach(item => { y = addChecklistItem(doc, item, y); });
    
    y += 10;
    y = addTipBox(doc, 'SPARTAN DISCIPLINE', 'Never advance to the next stage until you have genuinely completed the current one. Rushing through stages leads to lost deals and wasted effort.', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createRegulationsPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/regulations-guide.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Medicare/Medicaid Hospice Regulations', 'Comprehensive Compliance Reference Guide (42 CFR 418)');
    
    y = addSectionHeader(doc, 'Federal Eligibility Criteria (42 CFR 418.24)', y);
    
    y = addSubSection(doc, 'Four Core Requirements:', y);
    y = addNumberedItem(doc, 1, 'Medicare Part A Enrollment', 'Patient must be enrolled in Medicare Part A (Hospital Insurance)', y);
    y = addNumberedItem(doc, 2, 'Physician Certification', 'Attending physician and hospice medical director must certify terminal illness', y);
    y = addNumberedItem(doc, 3, 'Prognosis Requirement', 'Life expectancy of 6 months or less if disease runs its normal course', y);
    y = addNumberedItem(doc, 4, 'Written Consent', 'Patient or representative must sign election statement choosing hospice', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Disease-Specific Clinical Guidelines', y);
    
    y = addSubSection(doc, 'Cancer (LCD L33393)', y);
    y = addBulletPoint(doc, 'Metastatic disease or locally advanced with poor prognosis', y);
    y = addBulletPoint(doc, 'Declining functional status (PPS < 70%)', y);
    y = addBulletPoint(doc, 'Patient declines further curative treatment', y);
    
    y = addSubSection(doc, 'Heart Disease (NYHA Class IV)', y);
    y = addBulletPoint(doc, 'Symptoms at rest despite optimal medical management', y);
    y = addBulletPoint(doc, 'EF < 20% or recurrent hospitalizations (3+ in 12 months)', y);
    y = addBulletPoint(doc, 'Persistent hypotension, cardiac cachexia', y);
    
    y = addSubSection(doc, 'Pulmonary Disease (End-Stage COPD)', y);
    y = addBulletPoint(doc, 'Disabling dyspnea at rest or with minimal exertion', y);
    y = addBulletPoint(doc, 'FEV1 < 30% predicted after bronchodilator', y);
    y = addBulletPoint(doc, 'Progressive weight loss, cor pulmonale', y);
    
    y = addSubSection(doc, 'Dementia (FAST Stage 7+)', y);
    y = addBulletPoint(doc, 'Unable to ambulate, dress, bathe independently', y);
    y = addBulletPoint(doc, 'Limited speech (< 6 intelligible words/day)', y);
    y = addBulletPoint(doc, 'Recent aspiration pneumonia, UTI, sepsis, or pressure ulcers', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Referral Process Aligned to Sales Mastery Model', y);
    
    y = addNumberedItem(doc, 1, 'DISCOVERY', 'Identify eligible patients during care planning meetings', y);
    y = addNumberedItem(doc, 2, 'CONNECTING', 'Conduct goals-of-care conversation with patient/family', y);
    y = addNumberedItem(doc, 3, 'GUIDING', 'Educate on hospice benefits and address concerns', y);
    y = addNumberedItem(doc, 4, 'COMMITMENT', 'Obtain physician certification and patient election', y);
    
    y = addTipBox(doc, 'COMPLIANCE TIP', 'Document all conversations about hospice in the medical record. Include patient/family responses and any barriers discussed. This protects both the facility and supports continuity of care.', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createFacilityScriptsPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/facility-specific-scripts.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Facility-Type Specific Scripts', 'Customized Approaches for Each Healthcare Setting');
    
    y = addSectionHeader(doc, 'Acute Care Hospitals', y);
    y = addSubSection(doc, 'Key Pain Points:', y);
    y = addBulletPoint(doc, 'Readmission penalties (30-day readmit rates)', y);
    y = addBulletPoint(doc, 'Length of stay pressure and bed turnover', y);
    y = addBulletPoint(doc, 'Patient satisfaction scores (HCAHPS)', y);
    
    y = addSubSection(doc, 'Discovery Opening (Stage 1):', y);
    y = addQuoteBox(doc, "I work with hospitals like yours to reduce readmissions and improve patient satisfaction scores. Many of our hospital partners have seen a 15-20% reduction in 30-day readmits by identifying hospice-appropriate patients 24-48 hours earlier. How are you currently identifying patients who might benefit from hospice conversations?", y, 60);
    
    y = addSectionHeader(doc, 'Skilled Nursing Facilities', y);
    y = addSubSection(doc, 'Key Pain Points:', y);
    y = addBulletPoint(doc, 'Staff burden and after-hours coverage needs', y);
    y = addBulletPoint(doc, 'Family satisfaction and complaint management', y);
    y = addBulletPoint(doc, 'Managing declining residents appropriately', y);
    
    y = addSubSection(doc, 'Discovery Opening (Stage 1):', y);
    y = addQuoteBox(doc, "I partner with SNFs to provide 24/7 clinical support for your most complex residents. Our hospice team becomes an extension of your staff—handling symptom management, family conversations, and after-hours needs. How are you currently managing residents with declining trajectories?", y, 60);
    
    y = addSectionHeader(doc, 'Assisted Living Communities', y);
    y = addSubSection(doc, 'Key Pain Points:', y);
    y = addBulletPoint(doc, 'Aging-in-place vs. hospital transfer decisions', y);
    y = addBulletPoint(doc, 'Family expectations and communication burden', y);
    y = addBulletPoint(doc, 'Staff training on end-of-life care', y);
    
    y = addSubSection(doc, 'Discovery Opening (Stage 1):', y);
    y = addQuoteBox(doc, "We help assisted living communities keep residents comfortable in their homes rather than transferring to hospitals during end-of-life. Our approach focuses on family communication and staff support. What percentage of your residents are currently aging in place versus transferring out?", y, 55);
    
    y = addTipBox(doc, 'SPARTAN STRATEGY', 'Always research the specific facility before calling. Reference their recent news, awards, or challenges to demonstrate you understand their unique situation. This moves you quickly from Discovery to Connecting.', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createFollowUpPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/followup-templates.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Follow-Up Communication Framework', 'Advancing Through Each Stage of the Sales Mastery Model');
    
    y = addSectionHeader(doc, 'After Stage 1: Discovery Follow-Up', y);
    y = addParagraph(doc, 'Goal: Move to Connecting by scheduling a deeper conversation', y);
    
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Subject: Following Up - [Facility Name] Patient Care Discussion', MARGIN_LEFT, y);
    y = doc.y + 8;
    
    doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
    const email1 = `Hi [Name],

Thank you for sharing insights about [specific challenge they mentioned]. I've been thinking about what you said regarding [their situation].

I'd love to learn more about your perspective on patient care transitions. Would you have 20 minutes this week for a deeper conversation about how we might support your team?

Best regards,
[Your Name]`;
    doc.text(email1, MARGIN_LEFT, y, { width: CONTENT_WIDTH });
    y = doc.y + 15;
    
    y = addSectionHeader(doc, 'After Stage 2: Connecting Follow-Up', y);
    y = addParagraph(doc, 'Goal: Move to Guiding by presenting tailored solutions', y);
    
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Subject: Addressing [Specific Challenge] at [Facility Name]', MARGIN_LEFT, y);
    y = doc.y + 8;
    
    doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
    const email2 = `Hi [Name],

Based on our conversation about [their individual challenges], I've prepared a brief overview of how facilities like yours have addressed similar situations.

I'd like to walk you through 2-3 specific approaches that align with your goals. Would [specific date/time] work for a 30-minute presentation?

Best regards,
[Your Name]`;
    doc.text(email2, MARGIN_LEFT, y, { width: CONTENT_WIDTH });
    y = doc.y + 15;
    
    y = addSectionHeader(doc, 'After Stage 3: Guiding Follow-Up', y);
    y = addParagraph(doc, 'Goal: Move to Commitment by addressing final concerns', y);
    
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Subject: Next Steps for [Facility Name] Partnership', MARGIN_LEFT, y);
    y = doc.y + 8;
    
    doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
    const email3 = `Hi [Name],

Thank you for your time reviewing our approach. Based on our discussion, I believe we can help you [achieve specific outcome they care about].

I'd like to discuss next steps and answer any remaining questions. When would be a good time to talk through the partnership process?

Best regards,
[Your Name]`;
    doc.text(email3, MARGIN_LEFT, y, { width: CONTENT_WIDTH });
    y = doc.y + 15;
    
    y = addTipBox(doc, 'SPARTAN EMPATHY', 'Always reference something specific from your previous conversation. This shows you were listening and builds trust. Generic follow-ups signal you see them as a transaction, not a relationship.', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createPhysicianPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/physician-strategy.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Physician Engagement Strategy', 'Building Medical Director Alignment Through the Sales Mastery Model');
    
    y = addSectionHeader(doc, 'The 5 Physician Hesitation Barriers', y);
    
    y = addNumberedItem(doc, 1, 'Prognostic Uncertainty', '"I can\'t predict exactly when they\'ll die." Response: Discuss the clinical criteria and that certification is about trajectory, not precision.', y);
    y = addNumberedItem(doc, 2, 'Abandonment Concerns', '"Hospice means giving up." Response: Emphasize hospice as active comfort care and that you remain involved as attending.', y);
    y = addNumberedItem(doc, 3, 'Family Pressure', '"The family isn\'t ready." Response: Offer to facilitate goals-of-care conversations; share family satisfaction data.', y);
    y = addNumberedItem(doc, 4, 'Time Constraints', '"I don\'t have time for the paperwork." Response: Highlight that hospice handles 90% of documentation and coordination.', y);
    y = addNumberedItem(doc, 5, 'Knowledge Gaps', '"I\'m not sure about the criteria." Response: Provide LCD reference cards and offer brief in-service education.', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Applying the Sales Mastery Model to Physicians', y);
    
    y = addSubSection(doc, 'Stage 1 - Discovery:', y);
    y = addParagraph(doc, 'Learn about their patient population, referral patterns, and current hospice relationships. Ask about their experience with hospice.', y);
    
    y = addSubSection(doc, 'Stage 2 - Connecting:', y);
    y = addParagraph(doc, 'Understand their personal philosophy on end-of-life care. What matters most to them about patient outcomes?', y);
    
    y = addSubSection(doc, 'Stage 3 - Guiding:', y);
    y = addParagraph(doc, 'Present how your hospice approach aligns with their values. Share clinical protocols, outcome data, and quality metrics.', y);
    
    y = addSubSection(doc, 'Stage 4 - Commitment:', y);
    y = addParagraph(doc, 'Propose a pilot: "Would you be willing to refer 2-3 appropriate patients so you can evaluate our clinical approach?"', y);
    
    y += 10;
    y = addTipBox(doc, 'CME OPPORTUNITY', 'Offer to sponsor or facilitate CME-eligible education on palliative care, hospice criteria, or goals-of-care conversations. This positions you as an educational partner, not just a vendor.', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createCaseStudiesPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/case-studies.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Case Studies: Real Results', 'Documented Transformation Outcomes Through the Sales Mastery Model');
    
    y = addSectionHeader(doc, 'Case Study #1: 120-Bed Skilled Nursing Facility', y);
    
    y = addSubSection(doc, 'The Challenge:', y);
    y = addParagraph(doc, 'A 120-bed SNF was averaging only 2-3 hospice referrals per month despite having 40+ residents with life-limiting conditions. Staff reported feeling uncomfortable initiating hospice conversations.', y);
    
    y = addSubSection(doc, 'Sales Mastery Model Application:', y);
    y = addBulletPoint(doc, 'DISCOVERY: Learned their referral process was ad-hoc with no systematic screening', y);
    y = addBulletPoint(doc, 'CONNECTING: Director of Nursing wanted to improve family satisfaction scores', y);
    y = addBulletPoint(doc, 'GUIDING: Proposed monthly screening rounds + staff training program', y);
    y = addBulletPoint(doc, 'COMMITMENT: Secured 6-month pilot with monthly reviews', y);
    
    y = addSubSection(doc, 'The Results (6 Months):', y);
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('300% INCREASE', MARGIN_LEFT, y);
    doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
    doc.text(' in monthly hospice referrals (2-3 to 8-10/month)', MARGIN_LEFT + 110, y);
    y = doc.y + 8;
    y = addBulletPoint(doc, 'Family satisfaction scores increased from 3.2 to 4.6 (out of 5)', y);
    y = addBulletPoint(doc, 'Hospital transfer rate for end-of-life residents decreased 45%', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Case Study #2: 280-Bed Regional Hospital', y);
    
    y = addSubSection(doc, 'The Challenge:', y);
    y = addParagraph(doc, 'Average length of stay on hospice was only 5 days, indicating late referrals. This led to poor patient/family experience and missed quality metrics.', y);
    
    y = addSubSection(doc, 'Sales Mastery Model Application:', y);
    y = addBulletPoint(doc, 'DISCOVERY: Learned hospitalists lacked confidence in prognostic indicators', y);
    y = addBulletPoint(doc, 'CONNECTING: Chief Medical Officer valued reducing readmissions', y);
    y = addBulletPoint(doc, 'GUIDING: Proposed EMR-integrated triggers + hospitalist training', y);
    y = addBulletPoint(doc, 'COMMITMENT: Secured 24-hour hospice admission guarantee partnership', y);
    
    y = addSubSection(doc, 'The Results (12 Months):', y);
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('460% INCREASE', MARGIN_LEFT, y);
    doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
    doc.text(' in average hospice length of stay (5 to 28 days)', MARGIN_LEFT + 110, y);
    y = doc.y + 8;
    y = addBulletPoint(doc, 'Readmission rate for discharged hospice patients: 0%', y);
    y = addBulletPoint(doc, 'Estimated annual cost savings: $420,000', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createDecisionTreesPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/decision-trees.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Decision Trees & Frameworks', 'Strategic Navigation Through the Healthcare Sales Mastery Model');
    
    y = addSectionHeader(doc, 'The Healthcare Sales Mastery Model', y);
    y = addParagraph(doc, 'Use this 4-stage framework to track every account and guide your next action:', y);
    
    y = addStageBox(doc, 1, 'Discovery', 'Learning about the needs and operations of the account or contact', y);
    y = addStageBox(doc, 2, 'Connecting', 'Learning the individual needs of the account or contact', y);
    y = addStageBox(doc, 3, 'Guiding', 'Aligning their needs to your features and benefits', y);
    y = addStageBox(doc, 4, 'Commitment', 'Closing and asking for the business', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Stage Advancement Criteria', y);
    
    y = addSubSection(doc, 'Ready to move from Discovery to Connecting when:', y);
    y = addBulletPoint(doc, 'You understand their patient population and care model', y);
    y = addBulletPoint(doc, 'You know their current referral process', y);
    y = addBulletPoint(doc, 'You have identified key decision-makers', y);
    
    y = addSubSection(doc, 'Ready to move from Connecting to Guiding when:', y);
    y = addBulletPoint(doc, 'You understand their personal priorities and concerns', y);
    y = addBulletPoint(doc, 'They have shared specific challenges they want to solve', y);
    y = addBulletPoint(doc, 'You have built rapport and they view you as a resource', y);
    
    y = addSubSection(doc, 'Ready to move from Guiding to Commitment when:', y);
    y = addBulletPoint(doc, 'They see clear alignment between their needs and your solution', y);
    y = addBulletPoint(doc, 'Key objections have been addressed', y);
    y = addBulletPoint(doc, 'All decision-makers have been engaged', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Objection Response Framework', y);
    
    y = addNumberedItem(doc, 1, 'ACKNOWLEDGE', '"I understand..." or "That makes sense..." Validate their concern.', y);
    y = addNumberedItem(doc, 2, 'CLARIFY', '"Help me understand..." Get to the root of the objection.', y);
    y = addNumberedItem(doc, 3, 'RESPOND', 'Address with relevant evidence. Keep it brief and specific.', y);
    y = addNumberedItem(doc, 4, 'ADVANCE', 'Propose a low-commitment next step within the current stage.', y);
    
    y = addTipBox(doc, 'CONTINUOUS IMPROVEMENT', 'After every interaction, document: Which stage is this account in? What do I need to learn/do to advance them to the next stage? This discipline compounds into expertise.', y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

export async function generateAllPDFs() {
  console.log('Generating professional Spartan Coaching training PDFs...');
  
  const resourcesDir = 'public/resources';
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
  }
  
  await Promise.all([
    createColdCallPDF(),
    createTerritoryPDF(),
    createChecklistPDF(),
    createRegulationsPDF(),
    createFacilityScriptsPDF(),
    createFollowUpPDF(),
    createPhysicianPDF(),
    createCaseStudiesPDF(),
    createDecisionTreesPDF()
  ]);
  
  console.log('All 9 professional PDFs generated successfully!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllPDFs().catch(console.error);
}
