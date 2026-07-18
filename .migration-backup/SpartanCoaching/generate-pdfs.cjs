const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const SPARTAN_RED = '#DC2626';
const DARK_TEXT = '#1F2937';
const LIGHT_TEXT = '#6B7280';

function addHeader(doc, title) {
  doc.rect(0, 0, doc.page.width, 4).fill(SPARTAN_RED);
  doc.fontSize(28).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('SPARTAN COACHING', 40, 25);
  doc.fontSize(10).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('HOSPICE SALES EXCELLENCE', 40, 55);
  doc.fontSize(18).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(title, 40, 80);
  doc.strokeColor(SPARTAN_RED).lineWidth(2);
  doc.moveTo(40, 110).lineTo(doc.page.width - 40, 110).stroke();
  return 120;
}

function addFooter(doc) {
  const footerY = doc.page.height - 40;
  doc.strokeColor('#E5E7EB').lineWidth(1);
  doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke();
  doc.fontSize(9).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('© 2025 Spartan Coaching. Confidential Training Material.', 40, footerY + 10);
  doc.text('www.spartan.coach', doc.page.width - 200, footerY + 10);
}

function createColdCallPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/cold-call-script.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Cold Call Opening Script');
    doc.fontSize(12).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('THE 30-SECOND OPENING', 40, y + 15);
    y += 40;
    
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Hi [Name], this is [Your Name] with [Company]. I know you\'re busy, so I\'ll be brief. We work with facilities like yours to improve patient outcomes and family satisfaction by connecting eligible patients with specialized hospice care earlier in their journey. Do you have 30 seconds?"', 40, y, { width: 500 });
    
    y = doc.y + 25;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('THREE PILLARS OF THE SPARTAN METHOD:', 40, y);
    
    y += 20;
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('1. DISCIPLINE - Consistent, structured approach to every call', 55, y);
    y += 18;
    doc.text('2. EMPATHY - Understand their challenges and constraints', 55, y);
    y += 18;
    doc.text('3. STRATEGY - Position hospice as enabling better outcomes', 55, y);
    
    y += 25;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Discovery Questions That Uncover Need:', 40, y);
    
    y += 20;
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    [
      '"How many patients in your facility would you say are appropriate for hospice?"',
      '"What\'s your current referral process when a patient becomes appropriate?"',
      '"Who else is involved in those decisions with you?"',
      '"What\'s the biggest challenge you face with timely referrals?"'
    ].forEach((q, i) => {
      doc.text(`${i + 1}. ${q}`, 55, y, { width: 440 });
      y = doc.y + 15;
    });
    
    y += 10;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Spartan Objection Handling:', 40, y);
    
    y += 18;
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    const objections = [
      ['Already have partner', '"I respect that. Many facilities work with multiple partners for better outcomes. Would you be open to discussing how we differ?"'],
      ['Not interested', '"Many facilities miss eligible patients. Could I send a quick assessment? Takes 5 minutes to review."'],
      ['No time', '"That\'s why I\'m calling—to save you time. Can we schedule 15 minutes next week?"']
    ];
    
    objections.forEach(([obj, resp]) => {
      doc.fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(`${obj}:`, 55, y);
      y += 12;
      doc.fillColor(DARK_TEXT).font('Helvetica');
      doc.text(resp, 70, y, { width: 420 });
      y = doc.y + 12;
    });
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createTerritoryPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/territory-template.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Sales Territory Analysis Template');
    doc.fontSize(12).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('TERRITORY OVERVIEW', 40, y + 15);
    
    y += 40;
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Territory: _____________________________   Manager: _____________________________', 40, y);
    y += 25;
    doc.text('Analysis Date: _____________________________', 40, y);
    
    y += 30;
    doc.fontSize(12).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('FACILITY INVENTORY', 40, y);
    
    y += 25;
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Total Facilities: ___   Hospitals: ___   SNFs: ___   Assisted Living: ___   Other: ___', 40, y);
    
    y += 30;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('QUARTERLY SALES TARGETS (4-Step Healthcare Sales Mastery)', 40, y);
    
    y += 25;
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Quarter', 40, y).text('Discovery Calls', 140, y).text('Decision Meetings', 270, y).text('Referrals', 420, y);
    
    y += 18;
    doc.strokeColor('#D1D5DB').lineWidth(1);
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
      doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(q, 40, y);
      doc.moveTo(40, y + 16).lineTo(500, y + 16).stroke();
      y += 25;
    });
    
    y += 15;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('STRATEGIC ACCOUNT PRIORITIZATION:', 40, y);
    
    y += 22;
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('A-Priority Accounts (High Potential): ___________________________________________', 40, y);
    y += 18;
    doc.text('B-Priority Accounts (Developing): ___________________________________________', 40, y);
    y += 18;
    doc.text('C-Priority Accounts (Monitor): ___________________________________________', 40, y);
    
    y += 25;
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Key Insights & Next Steps:', 40, y);
    y += 18;
    doc.rect(40, y, 500, 60).stroke();
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createChecklistPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/research-checklist.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Pre-Call Research Checklist');
    
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('PRE-CALL FACILITY RESEARCH', 40, y + 15);
    
    y = doc.y + 15;
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    const research = [
      '☐ Facility name, location, and contact info verified',
      '☐ Decision-maker name, title, and LinkedIn reviewed',
      '☐ Recent facility news, ratings, and performance reviewed',
      '☐ Facility mission, values, and strategic priorities noted',
      '☐ Current hospice partnerships identified'
    ];
    
    research.forEach(item => {
      doc.text(item, 55, y);
      y += 16;
    });
    
    y += 15;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('SPARTAN STRATEGIC PREPARATION', 40, y);
    
    y = doc.y + 15;
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    const prep = [
      '☐ Talking points customized to their facility type',
      '☐ Relevant case studies and testimonials compiled',
      '☐ Objection handling strategies prepared',
      '☐ Discovery questions personalized to their situation',
      '☐ Their referral process mapped',
      '☐ Follow-up plan outlined'
    ];
    
    prep.forEach(item => {
      doc.text(item, 55, y);
      y += 16;
    });
    
    y += 15;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('MATERIALS & LOGISTICS', 40, y);
    
    y = doc.y + 15;
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    const materials = [
      '☐ Spartan Coaching overview and samples printed',
      '☐ Contact card prepared with follow-up plan',
      '☐ Meeting arrival time planned (15 min early)',
      '☐ CRM updated with call objectives',
      '☐ Calendar reminder set for 24-hour follow-up'
    ];
    
    materials.forEach(item => {
      doc.text(item, 55, y);
      y += 16;
    });
    
    y += 15;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('CALL SUCCESS METRICS', 40, y);
    
    y = doc.y + 15;
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    const metrics = [
      '✓ 30+ minutes of quality conversation',
      '✓ At least 2 key challenges identified',
      '✓ Specific referral process understood',
      '✓ Next meeting scheduled or materials promised',
      '✓ Contact exchanged and follow-up timed'
    ];
    
    metrics.forEach(item => {
      doc.text(item, 55, y);
      y += 16;
    });
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createRegulationsPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/regulations-guide.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Medicare/Medicaid Hospice Regulations Quick Reference');
    
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('MEDICARE HOSPICE ELIGIBILITY', 40, y + 15);
    
    y = doc.y + 15;
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Patient must meet ALL requirements:', 40, y);
    y += 14;
    
    const eligibility = [
      '✓ Enrolled in Medicare Part A',
      '✓ Physician certifies terminal illness',
      '✓ Prognosis: 6 months or less if disease runs normal course',
      '✓ Patient/representative signs election form (CMS-1525)'
    ];
    
    eligibility.forEach(item => {
      doc.text(item, 55, y);
      y += 14;
    });
    
    y += 12;
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Commonly Eligible Diagnoses:', 40, y);
    
    y += 12;
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Terminal Cancer • Advanced COPD • Heart Failure (NYHA IV) • Renal Disease • Liver Disease', 50, y);
    y += 12;
    doc.text('ALS • Dementia/Alzheimer\'s (specific criteria) • Stroke with severe neurological decline', 50, y);
    
    y += 18;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('4-STEP REFERRAL & ADMISSION PROCESS', 40, y);
    
    y += 18;
    doc.fontSize(8.5);
    const steps = [
      ['1. IDENTIFICATION', 'Identify eligible patient during care planning meetings'],
      ['2. PHYSICIAN CERTIFICATION', 'Physician formally certifies terminal diagnosis and prognosis'],
      ['3. PATIENT CONSENT', 'Patient or authorized representative signs Medicare Hospice Election'],
      ['4. ADMISSION', 'Formal enrollment; initial assessment and plan of care developed']
    ];
    
    steps.forEach(([step, desc]) => {
      doc.fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(step, 50, y, { width: 70 });
      doc.fillColor(DARK_TEXT).font('Helvetica');
      doc.text(desc, 130, y - 3, { width: 380 });
      y += 20;
    });
    
    y += 10;
    doc.fontSize(11).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('OVERCOMING BARRIERS', 40, y);
    
    y += 16;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Patient Hesitant: Frame hospice as complementary support & quality of life enhancement', 50, y);
    y += 12;
    doc.text('Physician Concerns: Share criteria; emphasize symptom management and comfort focus', 50, y);
    y += 12;
    doc.text('Family Doubts: Explain trial period; emphasize support for patient & family', 50, y);
    
    y += 18;
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('KEY COMPLIANCE POINTS', 40, y);
    
    y += 14;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('☐ No incentives for referrals (Stark Law, Anti-Kickback Statute)', 50, y);
    y += 12;
    doc.text('☐ Physician must evaluate & certify before enrollment', 50, y);
    y += 12;
    doc.text('☐ Proper documentation in patient medical record', 50, y);
    y += 12;
    doc.text('☐ Genuine patient consent (no pressure or coercion)', 50, y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

console.log('Generating Spartan-branded training PDFs...');
Promise.all([
  createColdCallPDF(),
  createTerritoryPDF(),
  createChecklistPDF(),
  createRegulationsPDF()
]).then(() => {
  console.log('✓ All PDFs generated successfully');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
