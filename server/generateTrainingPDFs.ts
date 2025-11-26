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

function addQuoteBox(doc: InstanceType<typeof PDFDocument>, quote: string, y: number): number {
  const boxHeight = 50;
  doc.rect(MARGIN_LEFT, y, 4, boxHeight).fill(SPARTAN_RED);
  doc.rect(MARGIN_LEFT + 4, y, CONTENT_WIDTH - 4, boxHeight).fill('#F9FAFB');
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica-Oblique');
  doc.text(`"${quote}"`, MARGIN_LEFT + 15, y + 10, { width: CONTENT_WIDTH - 30 });
  return y + boxHeight + 15;
}

function addTipBox(doc: InstanceType<typeof PDFDocument>, title: string, content: string, y: number): number {
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 60).fill(ACCENT_BG);
  doc.rect(MARGIN_LEFT, y, 4, 60).fill(SPARTAN_RED);
  doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text(`💡 ${title}`, MARGIN_LEFT + 15, y + 10);
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

function createColdCallPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const stream = fs.createWriteStream('public/resources/cold-call-script.pdf');
    doc.pipe(stream);
    
    let y = addProfessionalHeader(doc, 'Cold Call Opening Script', 'Master the Psychology-Backed 30-Second Opening Framework');
    
    y = addSectionHeader(doc, 'The Spartan 30-Second Opening', y);
    
    y = addQuoteBox(doc, "Hi [Name], this is [Your Name] with [Hospice Company]. I know you're incredibly busy caring for patients, so I'll be brief. We partner with facilities like yours to ensure patients receive optimal comfort care at the right time. Do you have 30 seconds?", y);
    
    y = addSubSection(doc, 'Why This Works:', y);
    y = addBulletPoint(doc, 'Acknowledges their time constraints immediately (builds respect)', y);
    y = addBulletPoint(doc, 'Focuses on patient outcomes, not sales (aligns with their mission)', y);
    y = addBulletPoint(doc, 'Requests minimal commitment (lowers resistance)', y);
    y = addBulletPoint(doc, 'Opens door for deeper conversation', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Tier 1 Discovery Questions', y);
    y = addParagraph(doc, 'Use these questions to understand their current situation and identify opportunities:', y);
    
    const tier1Questions = [
      'How many patients in your facility would you estimate are appropriate for hospice comfort care?',
      'What does your current referral process look like when a patient becomes appropriate?',
      'Who else is typically involved in those care transition decisions?',
      'What challenges do you face in identifying appropriate patients early enough?'
    ];
    
    tier1Questions.forEach((q, i) => {
      y = addNumberedItem(doc, i + 1, '', `"${q}"`, y);
    });
    
    y += 5;
    y = addSectionHeader(doc, 'Tier 2 Deep Discovery Questions', y);
    
    const tier2Questions = [
      'What would it mean for your facility if you could identify appropriate patients 2 weeks earlier?',
      'How does late hospice referral impact your readmission rates and family satisfaction scores?',
      'What percentage of your patients who pass away were receiving hospice services?'
    ];
    
    tier2Questions.forEach((q, i) => {
      y = addNumberedItem(doc, i + 1, '', `"${q}"`, y);
    });
    
    y += 10;
    y = addSectionHeader(doc, 'Spartan Objection Framework', y);
    
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('OBJECTION: "We already have a hospice partner"', MARGIN_LEFT, y);
    y = doc.y + 5;
    y = addQuoteBox(doc, "I respect that relationship. Many of our best partners work with multiple hospice providers to ensure coverage and options for families. What criteria do you use when a family requests a specific provider?", y);
    
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('OBJECTION: "Not interested right now"', MARGIN_LEFT, y);
    y = doc.y + 5;
    y = addQuoteBox(doc, "I understand completely. The reason I called is that many facilities discover they have patients who could benefit from earlier hospice conversations. Could I send you a 2-minute assessment tool? No obligation—just something that might be helpful.", y);
    
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('OBJECTION: "I don\'t have time"', MARGIN_LEFT, y);
    y = doc.y + 5;
    y = addQuoteBox(doc, "That's exactly why I called—to help save you time in the long run. Our partners tell us we've reduced their hospice-related administrative burden by 40%. Can we schedule a focused 15-minute call next week when it's more convenient?", y);
    
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
    
    let y = addProfessionalHeader(doc, 'Sales Territory Analysis Template', 'Strategic Planning Framework for Territory Optimization');
    
    y = addSectionHeader(doc, 'Territory Overview', y);
    
    doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
    const fields = [
      'Territory Name: _______________________________________________',
      'Territory Manager: ____________________________________________',
      'Analysis Period: ______________________________________________',
      'Total Addressable Market (Facilities): ____________________________'
    ];
    fields.forEach(field => {
      doc.text(field, MARGIN_LEFT, y);
      y += 22;
    });
    
    y += 10;
    y = addSectionHeader(doc, 'Facility Inventory Analysis', y);
    
    doc.strokeColor(BORDER_COLOR).lineWidth(1);
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 25).stroke();
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Facility Type', MARGIN_LEFT + 10, y + 8);
    doc.text('Count', MARGIN_LEFT + 180, y + 8);
    doc.text('Avg Beds', MARGIN_LEFT + 250, y + 8);
    doc.text('Priority', MARGIN_LEFT + 330, y + 8);
    doc.text('Est. Opportunity', MARGIN_LEFT + 410, y + 8);
    y += 25;
    
    const facilityTypes = ['Acute Care Hospitals', 'Skilled Nursing Facilities', 'Assisted Living', 'Memory Care', 'Home Health Agencies'];
    facilityTypes.forEach(type => {
      doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 22).stroke();
      doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
      doc.text(type, MARGIN_LEFT + 10, y + 7);
      y += 22;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'Account Prioritization Matrix', y);
    
    y = addSubSection(doc, 'A-Priority Accounts (Top 20%)', y);
    y = addParagraph(doc, 'High volume, decision-maker access, strong fit. Target: Weekly contact.', y);
    
    y = addSubSection(doc, 'B-Priority Accounts (Middle 50%)', y);
    y = addParagraph(doc, 'Medium volume, developing relationships. Target: Bi-weekly contact.', y);
    
    y = addSubSection(doc, 'C-Priority Accounts (Bottom 30%)', y);
    y = addParagraph(doc, 'Lower volume, limited access. Target: Monthly contact.', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Quarterly Targets', y);
    
    doc.strokeColor(BORDER_COLOR).lineWidth(1);
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 25).fill('#F9FAFB').stroke();
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Quarter', MARGIN_LEFT + 10, y + 8);
    doc.text('Discovery Meetings', MARGIN_LEFT + 100, y + 8);
    doc.text('Proposals', MARGIN_LEFT + 220, y + 8);
    doc.text('New Accounts', MARGIN_LEFT + 310, y + 8);
    doc.text('Revenue Target', MARGIN_LEFT + 420, y + 8);
    y += 25;
    
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
      doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 22).stroke();
      doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
      doc.text(q, MARGIN_LEFT + 10, y + 7);
      y += 22;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'Strategic Notes & Action Items', y);
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 80).lineWidth(1).strokeColor(BORDER_COLOR).stroke();
    
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
    
    let y = addProfessionalHeader(doc, 'Pre-Call Research Checklist', 'Complete Preparation Framework for Maximum Impact');
    
    y = addSectionHeader(doc, '2 Weeks Before: Strategic Assessment', y);
    
    const twoWeekItems = [
      'Identify all decision-makers and influencers at target facility',
      'Research facility ownership, recent acquisitions, or changes',
      'Review CMS quality ratings and any recent citations',
      'Analyze competitor presence and current hospice relationships',
      'Document facility mission, values, and strategic priorities'
    ];
    twoWeekItems.forEach(item => { y = addChecklistItem(doc, item, y); });
    
    y += 10;
    y = addSectionHeader(doc, '1 Week Before: Tactical Preparation', y);
    
    const oneWeekItems = [
      'Review LinkedIn profiles of key contacts',
      'Identify mutual connections for warm introductions',
      'Research recent news, press releases, or community involvement',
      'Prepare customized value proposition for their specific challenges',
      'Select 2-3 relevant case studies from similar facilities'
    ];
    oneWeekItems.forEach(item => { y = addChecklistItem(doc, item, y); });
    
    y += 10;
    y = addSectionHeader(doc, '3 Days Before: Materials Development', y);
    
    const threeDayItems = [
      'Customize presentation deck with facility-specific data',
      'Prepare printed materials and leave-behinds',
      'Draft personalized follow-up email template',
      'Prepare objection responses specific to their situation',
      'Create meeting agenda with clear objectives'
    ];
    threeDayItems.forEach(item => { y = addChecklistItem(doc, item, y); });
    
    y += 10;
    y = addSectionHeader(doc, 'Day Of: Execution Readiness', y);
    
    const dayOfItems = [
      'Confirm meeting time and location',
      'Review key talking points and objectives',
      'Prepare discovery questions tailored to their needs',
      'Test all technology if virtual meeting',
      'Arrive 10 minutes early (or log in 5 minutes early)'
    ];
    dayOfItems.forEach(item => { y = addChecklistItem(doc, item, y); });
    
    y += 10;
    y = addTipBox(doc, 'SPARTAN DISCIPLINE', 'Preparation is the foundation of confidence. The more you prepare, the more natural and authentic your conversation will be. Never wing it.', y);
    
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
    y = addSectionHeader(doc, 'Optimal 4-Step Referral Process', y);
    
    y = addNumberedItem(doc, 1, 'IDENTIFY', 'Use screening tools during care planning to identify appropriate patients early', y);
    y = addNumberedItem(doc, 2, 'DISCUSS', 'Conduct goals-of-care conversation with patient/family about comfort options', y);
    y = addNumberedItem(doc, 3, 'CERTIFY', 'Obtain physician certification of terminal prognosis (< 6 months)', y);
    y = addNumberedItem(doc, 4, 'ELECT', 'Patient signs election form; hospice admission within 24-48 hours', y);
    
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
    
    y = addSubSection(doc, 'Opening Script:', y);
    y = addQuoteBox(doc, "I work with hospitals like yours to reduce readmissions and improve patient satisfaction scores. Many of our hospital partners have seen a 15-20% reduction in 30-day readmits by identifying hospice-appropriate patients 24-48 hours earlier. Is that something worth 10 minutes to explore?", y);
    
    y = addSectionHeader(doc, 'Skilled Nursing Facilities', y);
    y = addSubSection(doc, 'Key Pain Points:', y);
    y = addBulletPoint(doc, 'CMS therapy minute scrutiny and RUG optimization', y);
    y = addBulletPoint(doc, 'Staff burden and after-hours coverage needs', y);
    y = addBulletPoint(doc, 'Family satisfaction and complaint management', y);
    
    y = addSubSection(doc, 'Opening Script:', y);
    y = addQuoteBox(doc, "I partner with SNFs to provide 24/7 clinical support for your most complex residents. Our hospice team becomes an extension of your staff—handling symptom management, family conversations, and after-hours needs. How are you currently managing residents with declining trajectories?", y);
    
    y = addSectionHeader(doc, 'Assisted Living Communities', y);
    y = addSubSection(doc, 'Key Pain Points:', y);
    y = addBulletPoint(doc, 'Aging-in-place vs. hospital transfer decisions', y);
    y = addBulletPoint(doc, 'Family expectations and communication burden', y);
    y = addBulletPoint(doc, 'Staff training on end-of-life care', y);
    
    y = addSubSection(doc, 'Opening Script:', y);
    y = addQuoteBox(doc, "We help assisted living communities keep residents comfortable in their homes rather than transferring to hospitals during end-of-life. Our approach focuses on family communication and staff support. What percentage of your residents are currently aging in place versus transferring out?", y);
    
    y = addTipBox(doc, 'SPARTAN STRATEGY', 'Always research the specific facility before calling. Reference their recent news, awards, or challenges to demonstrate you understand their unique situation.', y);
    
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
    
    let y = addProfessionalHeader(doc, 'Follow-Up Communication Framework', 'Strategic Sequences for Moving Deals Forward');
    
    y = addSectionHeader(doc, 'Post-Meeting Same-Day Email', y);
    
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Subject: Following Up - [Facility Name] Partnership Discussion', MARGIN_LEFT, y);
    y = doc.y + 10;
    
    doc.fontSize(9).fillColor(MEDIUM_TEXT).font('Helvetica');
    const email1 = `Hi [Name],

Thank you for taking time to meet with me today. I enjoyed learning about [specific thing discussed] and [specific challenge mentioned].

As promised, I've attached [relevant resource discussed]. I think you'll find the section on [specific topic] particularly relevant to [their situation].

Based on our conversation, I'd like to propose [specific next step] to help you [achieve specific outcome]. Would [specific date/time] work for a brief follow-up call?

Looking forward to continuing our conversation.

Best regards,
[Your Name]`;
    doc.text(email1, MARGIN_LEFT, y, { width: CONTENT_WIDTH });
    y = doc.y + 15;
    
    y = addSectionHeader(doc, '7-Day Nurture Sequence', y);
    
    y = addSubSection(doc, 'Day 2: Value-Add Touch', y);
    y = addParagraph(doc, 'Share a relevant article or resource related to their specific challenge. No ask—just value.', y);
    
    y = addSubSection(doc, 'Day 4: Case Study Share', y);
    y = addParagraph(doc, 'Send a brief case study from a similar facility. Highlight specific metrics and outcomes.', y);
    
    y = addSubSection(doc, 'Day 7: Reconnection Call', y);
    y = addParagraph(doc, 'Phone call to check in, reference previous conversation, and propose concrete next step.', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Phone Follow-Up Script', y);
    
    y = addQuoteBox(doc, "Hi [Name], this is [Your Name] from Spartan Coaching. I wanted to follow up on our conversation last week about [specific topic]. I've been thinking about what you said regarding [their challenge], and I had an idea I wanted to run by you. Do you have 2 minutes?", y);
    
    y = addTipBox(doc, 'SPARTAN EMPATHY', 'Always reference something specific from your previous conversation. This shows you were listening and builds trust. Generic follow-ups get ignored.', y);
    
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
    
    let y = addProfessionalHeader(doc, 'Physician Engagement Strategy', 'Building Medical Director Alignment & Referral Partnerships');
    
    y = addSectionHeader(doc, 'The 5 Physician Hesitation Barriers', y);
    
    y = addNumberedItem(doc, 1, 'Prognostic Uncertainty', '"I can\'t predict exactly when they\'ll die." Response: Discuss the clinical criteria and that certification is about trajectory, not precision.', y);
    y = addNumberedItem(doc, 2, 'Abandonment Concerns', '"Hospice means giving up." Response: Emphasize hospice as active comfort care and that you remain involved as attending.', y);
    y = addNumberedItem(doc, 3, 'Family Pressure', '"The family isn\'t ready." Response: Offer to facilitate goals-of-care conversations; share family satisfaction data.', y);
    y = addNumberedItem(doc, 4, 'Time Constraints', '"I don\'t have time for the paperwork." Response: Highlight that hospice handles 90% of documentation and coordination.', y);
    y = addNumberedItem(doc, 5, 'Knowledge Gaps', '"I\'m not sure about the criteria." Response: Provide LCD reference cards and offer brief in-service education.', y);
    
    y += 10;
    y = addSectionHeader(doc, '5-Step Physician Engagement Framework', y);
    
    y = addSubSection(doc, 'Step 1: EDUCATE', y);
    y = addParagraph(doc, 'Provide clinical criteria resources, LCD guidelines, and prognostication tools. Position yourself as a resource, not a salesperson.', y);
    
    y = addSubSection(doc, 'Step 2: ESTABLISH CREDIBILITY', y);
    y = addParagraph(doc, 'Share your medical director credentials, clinical team qualifications, and outcome data from similar patient populations.', y);
    
    y = addSubSection(doc, 'Step 3: OFFER SUPPORT', y);
    y = addParagraph(doc, 'Offer to conduct family meetings, provide 24/7 clinical backup, and handle care coordination. Remove burden, don\'t add it.', y);
    
    y = addSubSection(doc, 'Step 4: BUILD PARTNERSHIP', y);
    y = addParagraph(doc, 'Propose regular case reviews, IDT participation, and open communication channels. Make collaboration easy.', y);
    
    y = addSubSection(doc, 'Step 5: CONTINUOUS REFINEMENT', y);
    y = addParagraph(doc, 'Provide feedback on patient outcomes, family satisfaction, and process improvements. Demonstrate ongoing value.', y);
    
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
    
    let y = addProfessionalHeader(doc, 'Case Studies: Real Results', 'Documented Transformation Outcomes & ROI Analysis');
    
    y = addSectionHeader(doc, 'Case Study #1: 120-Bed Skilled Nursing Facility', y);
    
    y = addSubSection(doc, 'The Challenge:', y);
    y = addParagraph(doc, 'A 120-bed SNF was averaging only 2-3 hospice referrals per month despite having 40+ residents with life-limiting conditions. Staff reported feeling uncomfortable initiating hospice conversations, and families were often surprised when their loved one passed.', y);
    
    y = addSubSection(doc, 'The Spartan Approach:', y);
    y = addBulletPoint(doc, 'Implemented monthly hospice eligibility screening rounds', y);
    y = addBulletPoint(doc, 'Trained nursing staff on goals-of-care conversation techniques', y);
    y = addBulletPoint(doc, 'Established direct communication channel with hospice liaison', y);
    y = addBulletPoint(doc, 'Created family education materials in multiple languages', y);
    
    y = addSubSection(doc, 'The Results (6 Months):', y);
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('300% INCREASE', MARGIN_LEFT, y);
    doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
    doc.text(' in monthly hospice referrals (2-3 → 8-10/month)', MARGIN_LEFT + 110, y);
    y = doc.y + 8;
    y = addBulletPoint(doc, 'Family satisfaction scores increased from 3.2 to 4.6 (out of 5)', y);
    y = addBulletPoint(doc, 'Hospital transfer rate for end-of-life residents decreased 45%', y);
    y = addBulletPoint(doc, 'Staff reported feeling more confident in difficult conversations', y);
    
    y += 15;
    y = addSectionHeader(doc, 'Case Study #2: 280-Bed Regional Hospital', y);
    
    y = addSubSection(doc, 'The Challenge:', y);
    y = addParagraph(doc, 'A regional hospital struggled with late hospice referrals—average length of stay on hospice was only 5 days. This led to poor patient/family experience, increased costs, and missed quality metrics.', y);
    
    y = addSubSection(doc, 'The Spartan Approach:', y);
    y = addBulletPoint(doc, 'Integrated palliative care triggers into EMR workflows', y);
    y = addBulletPoint(doc, 'Trained hospitalists on prognostic indicators and referral criteria', y);
    y = addBulletPoint(doc, 'Established 24-hour hospice admission guarantee', y);
    y = addBulletPoint(doc, 'Created seamless discharge-to-hospice pathway', y);
    
    y = addSubSection(doc, 'The Results (12 Months):', y);
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('100% INCREASE', MARGIN_LEFT, y);
    doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
    doc.text(' in monthly hospice referrals (6-8 → 14-16/month)', MARGIN_LEFT + 105, y);
    y = doc.y + 8;
    y = addBulletPoint(doc, 'Average hospice length of stay increased from 5 to 28 days', y);
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
    
    let y = addProfessionalHeader(doc, 'Decision Trees & Frameworks', 'Strategic Decision-Making Tools for Complex Situations');
    
    y = addSectionHeader(doc, 'Account Qualification Framework', y);
    
    y = addSubSection(doc, 'Is This a Qualified Opportunity?', y);
    
    y = addNumberedItem(doc, 1, 'BUDGET', 'Do they have decision-making authority on hospice partnerships?', y);
    y = addNumberedItem(doc, 2, 'AUTHORITY', 'Are you speaking with the right person?', y);
    y = addNumberedItem(doc, 3, 'NEED', 'Do they have patients who could benefit from hospice services?', y);
    y = addNumberedItem(doc, 4, 'TIMELINE', 'Is there a compelling reason to act now?', y);
    
    y += 5;
    y = addParagraph(doc, 'If YES to all 4: Priority A account. If YES to 3: Priority B. If YES to 2 or fewer: Nurture or deprioritize.', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Objection Response Decision Tree', y);
    
    doc.fontSize(10).fillColor(MEDIUM_TEXT).font('Helvetica');
    doc.text('When you encounter resistance, follow this framework:', MARGIN_LEFT, y);
    y = doc.y + 12;
    
    y = addSubSection(doc, 'Step 1: ACKNOWLEDGE', y);
    y = addParagraph(doc, '"I understand..." or "That makes sense..." Validate their concern without agreeing with the objection itself.', y);
    
    y = addSubSection(doc, 'Step 2: CLARIFY', y);
    y = addParagraph(doc, '"Help me understand..." or "Can you tell me more about..." Get to the root of the objection.', y);
    
    y = addSubSection(doc, 'Step 3: RESPOND', y);
    y = addParagraph(doc, 'Address the specific concern with relevant evidence, case studies, or reframing. Keep it brief.', y);
    
    y = addSubSection(doc, 'Step 4: ADVANCE', y);
    y = addParagraph(doc, 'Propose a low-commitment next step. "Would it be helpful if I..." or "Could we schedule..."', y);
    
    y += 10;
    y = addSectionHeader(doc, 'Meeting Outcome Decision Tree', y);
    
    y = addSubSection(doc, 'After Every Meeting, Ask:', y);
    y = addBulletPoint(doc, 'Did I advance the relationship? → If NO: What value can I add in follow-up?', y);
    y = addBulletPoint(doc, 'Did I learn something new? → If NO: What questions should I have asked?', y);
    y = addBulletPoint(doc, 'Is there a clear next step? → If NO: Immediately schedule follow-up action.', y);
    y = addBulletPoint(doc, 'Am I closer to a decision? → If NO: What\'s blocking progress?', y);
    
    y += 10;
    y = addTipBox(doc, 'CONTINUOUS IMPROVEMENT', 'After every call, meeting, or interaction, spend 2 minutes documenting lessons learned. What worked? What would you do differently? This discipline compounds into expertise.', y);
    
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
