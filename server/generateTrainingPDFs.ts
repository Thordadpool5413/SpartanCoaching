import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const SPARTAN_RED = '#DC2626';
const DARK_TEXT = '#1F2937';
const LIGHT_TEXT = '#6B7280';

function addHeader(doc: InstanceType<typeof PDFDocument>, title: string) {
  // Top border with Spartan red
  doc.rect(0, 0, doc.page.width, 4).fill(SPARTAN_RED);
  
  // Logo/Header text
  doc.fontSize(28).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('SPARTAN COACHING', 40, 25);
  
  // Subtitle
  doc.fontSize(10).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('HOSPICE SALES EXCELLENCE', 40, 55);
  
  // Document title
  doc.fontSize(18).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(title, 40, 80);
  
  // Separator line
  doc.strokeColor(SPARTAN_RED).lineWidth(2);
  doc.moveTo(40, 110).lineTo(doc.page.width - 40, 110).stroke();
  
  return 120; // Return Y position for content start
}

function addFooter(doc: InstanceType<typeof PDFDocument>) {
  const footerY = doc.page.height - 40;
  
  // Footer line
  doc.strokeColor('#E5E7EB').lineWidth(1);
  doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke();
  
  // Footer text
  doc.fontSize(9).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('© 2025 Spartan Coaching. Confidential Training Material.', 40, footerY + 10);
  doc.text('www.spartan.coach', doc.page.width - 200, footerY + 10);
}

function createColdCallPDF() {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const stream = fs.createWriteStream('public/resources/cold-call-script.pdf');
  doc.pipe(stream);
  
  let y = addHeader(doc, 'Cold Call Opening Script');
  
  // Content
  doc.fontSize(12).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text('THE 30-SECOND OPENING', 40, y + 15);
  
  y += 40;
  doc.fontSize(11).fillColor(DARK_TEXT).font('Helvetica');
  doc.text('"Hi [Name], this is [Your Name] with [Company]. I know you\'re busy, so I\'ll be brief. We work with facilities like yours to improve patient outcomes and family satisfaction by connecting eligible patients with specialized hospice care earlier in their journey. Do you have 30 seconds?"', 40, y, { width: 500 });
  
  y = doc.y + 20;
  
  // Three Key Points
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('Three Pillars of Effective Discovery:', 40, y);
  
  y = doc.y + 12;
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  const points = [
    '1. DISCIPLINE: Consistent, structured approach to every call',
    '2. EMPATHY: Understand their challenges and constraints',
    '3. STRATEGY: Position hospice as enabling better outcomes'
  ];
  
  points.forEach(point => {
    doc.text(point, 55, y);
    y += 20;
  });
  
  // Discovery Questions Section
  y += 10;
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('Powerful Discovery Questions:', 40, y);
  
  y = doc.y + 12;
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  const questions = [
    '"How many patients in your facility would you say are appropriate for hospice?"',
    '"What\'s your current referral process when a patient becomes appropriate?"',
    '"Who else is involved in those decisions with you?"',
    '"What\'s the biggest challenge you face in those situations?"'
  ];
  
  questions.forEach((q, i) => {
    doc.text(`${i + 1}. ${q}`, 55, y, { width: 450 });
    y = doc.y + 15;
  });
  
  // Objection Handling
  y += 10;
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('Spartan Objection Framework:', 40, y);
  
  y = doc.y + 12;
  doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
  const objections = [
    ['Already have a partner', '"I respect that. Many facilities work with multiple partners. Would you be open to discussing how our approach differs?"'],
    ['Not interested now', '"The reason I called is many facilities miss eligible patients. Could I send you a quick assessment? Takes 5 minutes to review."'],
    ['No time', '"That\'s exactly why I\'m calling—to save you time. Can we schedule 15 minutes next week?"']
  ];
  
  objections.forEach(([obj, response]) => {
    doc.fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text(`${obj}:`, 55, y);
    y += 15;
    doc.fillColor(DARK_TEXT).font('Helvetica');
    doc.text(response, 70, y, { width: 430 });
    y = doc.y + 12;
  });
  
  addFooter(doc);
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createTerritoryPDF() {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const stream = fs.createWriteStream('public/resources/territory-template.pdf');
  doc.pipe(stream);
  
  let y = addHeader(doc, 'Sales Territory Analysis Template');
  
  // Overview Section
  doc.fontSize(12).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('TERRITORY OVERVIEW', 40, y + 15);
  
  y += 40;
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  
  const fields = [
    'Territory Name: _________________________________',
    'Territory Manager: _________________________________',
    'Analysis Date: _________________________________'
  ];
  
  fields.forEach(field => {
    doc.text(field, 40, y);
    y += 25;
  });
  
  // Facility Inventory
  y += 10;
  doc.fontSize(12).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('FACILITY INVENTORY ANALYSIS', 40, y);
  
  y += 30;
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  doc.text('Total Facilities in Territory: ___', 40, y);
  y += 20;
  
  const facilities = ['Hospitals: ___', 'SNFs: ___', 'Assisted Living: ___', 'Other: ___'];
  facilities.forEach(fac => {
    doc.text(fac, 60, y);
    y += 18;
  });
  
  // Key Metrics Section
  y += 15;
  doc.fontSize(12).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('QUARTERLY TARGETS (4-Step Healthcare Sales Mastery)', 40, y);
  
  y += 30;
  doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text('Quarter', 40, y);
  doc.text('Discovery Meetings', 150, y);
  doc.text('Referrals', 290, y);
  doc.text('Outcomes', 400, y);
  
  y += 20;
  doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
  doc.strokeColor('#E5E7EB').lineWidth(1);
  
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  quarters.forEach(q => {
    doc.text(q, 40, y);
    doc.text('_____', 150, y);
    doc.text('_____', 290, y);
    doc.text('_____', 400, y);
    doc.moveTo(40, y + 16).lineTo(500, y + 16).stroke();
    y += 25;
  });
  
  // Strategic Notes
  y += 15;
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('STRATEGIC INSIGHTS & ACTION ITEMS:', 40, y);
  
  y = doc.y + 15;
  doc.rect(40, y, 500, 80).stroke();
  doc.fontSize(10).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('Document key opportunities, competitive threats, and next steps here', 50, y + 10);
  
  addFooter(doc);
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createChecklistPDF() {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const stream = fs.createWriteStream('public/resources/research-checklist.pdf');
  doc.pipe(stream);
  
  let y = addHeader(doc, 'Pre-Call Research Checklist');
  
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  
  // Pre-call section
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('FACILITY RESEARCH (Before the Call)', 40, y + 15);
  
  y = doc.y + 15;
  const checklistItems = [
    '☐ Facility name and location verified',
    '☐ Contact person confirmed and researched',
    '☐ Recent news articles and ratings reviewed',
    '☐ Facility mission and values documented',
    '☐ Decision-maker LinkedIn profile reviewed',
    '☐ Current hospice relationships identified'
  ];
  
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  checklistItems.forEach(item => {
    doc.text(item, 50, y);
    y += 18;
  });
  
  // Strategic Prep
  y += 15;
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('SPARTAN STRATEGIC PREPARATION', 40, y);
  
  y = doc.y + 15;
  const strategyItems = [
    '☐ Key talking points prepared for their facility type',
    '☐ Case studies relevant to their situation selected',
    '☐ Objection scenarios anticipated and responses prepared',
    '☐ Discovery questions customized to their facility',
    '☐ Referral process documented',
    '☐ Follow-up plan outlined'
  ];
  
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  strategyItems.forEach(item => {
    doc.text(item, 50, y);
    y += 18;
  });
  
  // Materials
  y += 15;
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('MATERIALS PREPARED', 40, y);
  
  y = doc.y + 15;
  const materials = [
    '☐ Spartan Coaching overview printed',
    '☐ Relevant case studies and testimonials',
    '☐ Service capabilities sheet ready',
    '☐ Contact information card prepared',
    '☐ Follow-up communication template'
  ];
  
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  materials.forEach(item => {
    doc.text(item, 50, y);
    y += 18;
  });
  
  // Call Objectives
  y += 15;
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('CALL OBJECTIVES', 40, y);
  
  y = doc.y + 15;
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  doc.text('By the end of this call, you should understand:', 40, y);
  
  y += 20;
  const objectives = [
    '✓ Their current referral process and challenges',
    '✓ Decision-maker\'s specific pain points',
    '✓ Hospice eligibility criteria they use',
    '✓ Current hospice partner relationships',
    '✓ Opportunity size and timeline'
  ];
  
  objectives.forEach(obj => {
    doc.text(obj, 50, y);
    y += 18;
  });
  
  addFooter(doc);
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createRegulationsPDF() {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const stream = fs.createWriteStream('public/resources/regulations-guide.pdf');
  doc.pipe(stream);
  
  let y = addHeader(doc, 'Medicare/Medicaid Hospice Regulations Quick Reference');
  
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
  
  // Eligibility Section
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('MEDICARE HOSPICE ELIGIBILITY CRITERIA', 40, y + 15);
  
  y = doc.y + 15;
  doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text('Patient Must Meet ALL These Requirements:', 40, y);
  
  y = doc.y + 12;
  doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
  const eligibility = [
    '✓ Enrolled in Medicare Part A',
    '✓ Physician certifies terminal illness',
    '✓ Prognosis: 6 months or less',
    '✓ Patient signs consent form'
  ];
  
  eligibility.forEach(item => {
    doc.text(item, 50, y);
    y += 16;
  });
  
  // Common Diagnoses
  y += 10;
  doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('Commonly Eligible Diagnoses:', 40, y);
  
  y = doc.y + 12;
  doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
  const diagnoses = [
    'Terminal Cancer • Advanced COPD • Heart Failure (NYHA IV)',
    'Renal Disease • Liver Disease • ALS • Advanced Dementia'
  ];
  
  diagnoses.forEach(d => {
    doc.text(d, 50, y);
    y += 14;
  });
  
  // Referral Process
  y += 10;
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('4-STEP REFERRAL PROCESS', 40, y);
  
  y = doc.y + 15;
  const steps = [
    ['1. DISCOVERY', 'Identify eligible patients during care planning'],
    ['2. PHYSICIAN CERTIFICATION', 'Physician formally certifies terminal status'],
    ['3. PATIENT CONSENT', 'Patient/representative signs election form'],
    ['4. FORMAL ADMISSION', 'Patient admitted to hospice program']
  ];
  
  doc.fontSize(9);
  steps.forEach(([step, desc]) => {
    doc.fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text(step, 50, y, { width: 100 });
    doc.fillColor(DARK_TEXT).font('Helvetica');
    doc.text(desc, 160, y - 3, { width: 340 });
    y += 22;
  });
  
  // Common Barriers
  y += 10;
  doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('OVERCOMING COMMON BARRIERS', 40, y);
  
  y = doc.y + 15;
  doc.fontSize(8.5);
  const barriers = [
    ['Patient hesitant', 'Frame hospice as complementary support and quality of life enhancement'],
    ['Physician concerns', 'Provide criteria guidelines and emphasize symptom management benefits'],
    ['Family doubts', 'Explain trial period available; hospice can be revoked if needed']
  ];
  
  barriers.forEach(([barrier, solution], i) => {
    doc.fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text(`${barrier}:`, 50, y);
    y += 12;
    doc.fillColor(DARK_TEXT).font('Helvetica');
    doc.text(solution, 60, y, { width: 430 });
    y = doc.y + 14;
  });
  
  addFooter(doc);
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

export async function generateAllPDFs() {
  console.log('Generating branded Spartan Coaching training PDFs...');
  await Promise.all([
    createColdCallPDF(),
    createTerritoryPDF(),
    createChecklistPDF(),
    createRegulationsPDF()
  ]);
  console.log('✓ All PDFs generated successfully');
}
