const PDFDocument = require('pdfkit');
const fs = require('fs');

const SPARTAN_RED = '#DC2626';
const DARK_TEXT = '#1F2937';
const LIGHT_TEXT = '#6B7280';

function addHeader(doc, title) {
  doc.rect(0, 0, doc.page.width, 5).fill(SPARTAN_RED);
  doc.fontSize(28).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('SPARTAN COACHING', 40, 28);
  doc.fontSize(10).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('HOSPICE SALES EXCELLENCE', 40, 55);
  doc.fontSize(16).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(title, 40, 80);
  doc.strokeColor(SPARTAN_RED).lineWidth(2);
  doc.moveTo(40, 105).lineTo(doc.page.width - 40, 105).stroke();
  return 115;
}

function addSection(doc, title, y) {
  doc.fontSize(12).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text(title, 40, y);
  return doc.y + 12;
}

function addSubsection(doc, title, y) {
  doc.fontSize(11).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(title, 55, y);
  return doc.y + 10;
}

function addFooter(doc) {
  const footerY = doc.page.height - 40;
  doc.strokeColor('#E5E7EB').lineWidth(1);
  doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke();
  doc.fontSize(8).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('© 2025 Spartan Coaching | Confidential Training Material', 40, footerY + 10);
  doc.text('www.spartan.coach', doc.page.width - 180, footerY + 10);
}

function createColdCallPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/cold-call-script.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Cold Call Opening Script & Discovery Framework');
    
    // The Opening
    y = addSection(doc, 'PART 1: THE OPENING (First 30 Seconds)', y + 15);
    y = addSubsection(doc, 'The 30-Second Formula', y);
    
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    doc.text('"Hi [Name], this is [Your Name] with Spartan Coaching. I know you\'re busy, so I\'ll be brief. We work with facilities like yours to improve patient outcomes and family satisfaction by connecting eligible patients with hospice care earlier in their journey. I\'m not selling anything today—just want to understand your situation. Do you have 30 seconds?"', 50, y, { width: 450 });
    
    y = doc.y + 15;
    doc.fontSize(9).fillColor(LIGHT_TEXT).font('Helvetica-Bold');
    doc.text('Why This Works:', 50, y);
    y += 10;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const openingPoints = [
      '• Respects their time (validates their concern)',
      '• Names the outcome upfront (better care, satisfaction)',
      '• Removes sales pressure ("not selling")',
      '• Creates urgency ("earlier in their journey")',
      '• Asks for micro-commitment (30 seconds)',
      '• Positions you as helpful, not pushy'
    ];
    openingPoints.forEach(pt => {
      doc.text(pt, 55, y);
      y += 9;
    });
    
    // The Bridge
    y += 8;
    y = addSubsection(doc, 'If They Say "Yes" (Your Bridge)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 10;
    doc.text('"Perfect. Here\'s what I\'ve observed: Many facilities like yours have eligible patients in house, but the referral process isn\'t structured, so some miss the window. We work with facilities to clarify that process and get better outcomes. Does that resonate with you at all?"', 50, y, { width: 450 });
    
    y = doc.y + 12;
    y = addSubsection(doc, 'If They Say "No" (Your Pivot)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 10;
    doc.text('"I understand. Can I ask—out of curiosity—when a patient in your facility becomes appropriate for hospice, what does that referral process look like? Just trying to understand if it\'s something we could eventually help with."', 50, y, { width: 450 });
    
    // Discovery Section
    y = doc.y + 15;
    y = addSection(doc, 'PART 2: DISCOVERY QUESTIONS (Your Conversation Framework)', y + 10);
    
    y = addSubsection(doc, 'Tier 1: Initial Assessment', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 10;
    const tier1 = [
      '1. "How many patients would you estimate are in your facility at any time?"',
      '   > Establish baseline census',
      '',
      '2. "Of those patients, how many would you say are appropriate for hospice?"',
      '   > Gauge current awareness and referral volume',
      '',
      '3. "Do you have a formal hospice referral process, or does it vary by department?"',
      '   > Identify process clarity (or lack thereof)',
      '',
      '4. "Who typically initiates the hospice conversation in your facility—nurses, doctors, care managers?"',
      '   > Understand decision-maker roles'
    ];
    
    tier1.forEach(line => {
      if (line === '') {
        y += 4;
      } else if (line.startsWith('   >')) {
        doc.fontSize(7.5).fillColor(LIGHT_TEXT).font('Helvetica');
        doc.text(line, 55, y);
        y += 8;
      } else {
        doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
        doc.text(line, 55, y);
        y += 9;
      }
    });
    
    y += 5;
    y = addSubsection(doc, 'Tier 2: Deeper Opportunity', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 10;
    const tier2 = [
      '5. "In the last quarter, how many patients transitioned to hospice from your facility?"',
      '   > Get specific referral numbers (for gap analysis)',
      '',
      '6. "Did any patients who could have benefited from hospice not get referred? What happened?"',
      '   > Uncover barriers and missed opportunities',
      '',
      '7. "How involved is your medical director in those decisions? Supportive?"',
      '   > Gauge physician alignment (critical for referrals)'
    ];
    
    tier2.forEach(line => {
      if (line === '') {
        y += 4;
      } else if (line.startsWith('   >')) {
        doc.fontSize(7.5).fillColor(LIGHT_TEXT).font('Helvetica');
        doc.text(line, 55, y);
        y += 8;
      } else {
        doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
        doc.text(line, 55, y, { width: 440 });
        y = doc.y + 9;
      }
    });
    
    // Objections Section
    y += 8;
    y = addSection(doc, 'PART 3: HANDLING OBJECTIONS (Spartan Approach)', y + 10);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    
    const objections = [
      {
        obj: '"We already work with [Competitor]."',
        response: '"I respect that. Many best-in-class facilities actually work with 2-3 partners to ensure they\'re not leaving eligible patients on the table. Our approach is different because... [specific differentiator]. Would it make sense to have a brief conversation about how we complement what you\'re already doing?"',
        note: 'Acknowledge, position as complementary, ask permission'
      },
      {
        obj: '"We don\'t have a need right now."',
        response: '"I hear that. Here\'s what I\'ve seen: most facilities realize they DO have a gap when they look at their data. Could I just ask—if you looked at your last 20 discharges, what percentage went to hospice versus home health or other settings? That might tell us if there\'s an opportunity."',
        note: 'Reframe from subjective to objective (data-driven)'
      }
    ];
    
    objections.forEach(obj => {
      y = addSubsection(doc, obj.obj, y);
      y += 10;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(obj.response, 55, y, { width: 440 });
      y = doc.y + 10;
      doc.fontSize(7.5).fillColor(LIGHT_TEXT).font('Helvetica');
      doc.text(`[${obj.note}]`, 55, y, { width: 440 });
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
    
    let y = addHeader(doc, 'Sales Territory Analysis & Strategy Template');
    
    // Overview
    y = addSection(doc, 'TERRITORY PROFILE', y + 15);
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    doc.text('Territory Name: ________________________________     Manager: ________________________________', 40, y);
    y += 20;
    doc.text('Region: ___________________________  Last Updated: ___________________________', 40, y);
    
    // Facility Inventory
    y += 25;
    y = addSection(doc, 'FACILITY INVENTORY & OPPORTUNITY SIZING', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    y += 15;
    doc.text('TOTAL FACILITIES BY TYPE:', 40, y);
    y += 12;
    
    const cols = [
      ['Hospitals', '___'],
      ['Skilled Nursing', '___'],
      ['Assisted Living', '___'],
      ['Memory Care', '___'],
      ['Other', '___']
    ];
    
    doc.fontSize(8.5);
    cols.forEach(([label, space]) => {
      doc.text(`${label}: ${space}`, 55, y);
      y += 12;
    });
    
    y += 10;
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('OPPORTUNITY ASSESSMENT:', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 14;
    doc.text('Average Daily Census (all facilities): ____________', 55, y);
    y += 12;
    doc.text('Estimated Hospice-Eligible Patients: ____________  (typically 5-12% of census)', 55, y);
    y += 12;
    doc.text('Current Hospice Referral Rate: ____________ (your goal: 8-15% per quarter)', 55, y);
    y += 12;
    doc.text('Missing Referral Opportunity: ____________ (gap to close)', 55, y);
    
    // Strategic Accounts
    y += 20;
    y = addSection(doc, 'ACCOUNT PRIORITIZATION & STRATEGY', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    y += 14;
    doc.text('A-PRIORITY: High-potential, early-stage relationships', 40, y);
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 10;
    doc.text('Account: ____________________________ Contact: _________________ Phone: ________________', 55, y);
    y += 10;
    doc.text('Next Step: _____________________________________________________________________________', 55, y);
    y += 12;
    doc.text('Timeline: Contact within ___ days | Goal: Schedule meeting by ___', 55, y);
    
    y += 15;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('B-PRIORITY: Developing relationships (active hospice partner)', 40, y);
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 10;
    doc.text('Account: ____________________________ Current Partner: _________________ Contacts: ____', 55, y);
    y += 10;
    doc.text('Entry Point: _____________________________________________________________________________', 55, y);
    
    y += 15;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('C-PRIORITY: Monitor & maintain (mature partners)', 40, y);
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 10;
    doc.text('Account: ____________________________ Relationship Status: Well-established', 55, y);
    y += 10;
    doc.text('Quarterly Check-in: ___________________________', 55, y);
    
    // Quarterly Targets
    y += 20;
    y = addSection(doc, 'QUARTERLY PERFORMANCE TARGETS', y);
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica-Bold');
    y += 14;
    doc.text('Quarter', 40, y).text('Discovery Calls', 135, y).text('New Meetings', 250, y).text('Referrals', 360, y).text('Revenue Impact', 450, y);
    
    doc.strokeColor('#D1D5DB').lineWidth(1);
    y += 10;
    doc.moveTo(40, y).lineTo(530, y).stroke();
    y += 8;
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
      doc.text(q, 40, y);
      doc.text('____', 140, y);
      doc.text('____', 260, y);
      doc.text('____', 370, y);
      doc.text('$_______', 460, y);
      doc.moveTo(40, y + 12).lineTo(530, y + 12).stroke();
      y += 18;
    });
    
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
    
    let y = addHeader(doc, 'Pre-Call Research & Preparation Checklist');
    
    // Facility Research
    y = addSection(doc, 'PRE-CALL RESEARCH (1 Week Before)', y + 15);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const research = [
      '☐ Facility name, location, website, and main phone verified',
      '☐ Current census, licensed beds, and unit breakdown documented',
      '☐ Mission statement, quality scores (CMS ratings if applicable), recent performance data',
      '☐ Current hospice partners identified (ask staff or check discharge data)',
      '☐ Decision-maker identified: Name, title, email, direct phone, LinkedIn profile',
      '☐ Secondary contacts: Admissions, Care Manager, Social Worker, Physician',
      '☐ Facility history: Recent news, changes in leadership, new programs',
      '☐ Insurance partners and payer mix understood'
    ];
    
    research.forEach(item => {
      doc.text(item, 50, y);
      y += 11;
    });
    
    // Strategic Prep
    y += 10;
    y = addSection(doc, 'SPARTAN STRATEGIC PREPARATION (3 Days Before)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const prep = [
      '☐ Talking points prepared: 2-3 specific value props for THEIR facility type',
      '☐ Competitive landscape mapped: Who else do they work with? What\'s our difference?',
      '☐ Case studies selected: 2-3 most relevant to their facility type',
      '☐ Objection response card created (what will you say if they say "no"?)',
      '☐ Discovery questions customized to their specific situation',
      '☐ Their referral process researched (ask: do they have formal process?)',
      '☐ Physician alignment assessed (is medical director supportive of hospice?)',
      '☐ Patient demographics analyzed (what conditions dominate?)'
    ];
    
    prep.forEach(item => {
      doc.text(item, 50, y);
      y += 11;
    });
    
    // Materials
    y += 10;
    y = addSection(doc, 'MATERIALS & LOGISTICS (Day Before)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const materials = [
      '☐ Spartan Coaching overview printed and marked with key talking points',
      '☐ 2-3 most relevant case studies selected and highlighted',
      '☐ Contact cards prepared with YOUR phone, email, and follow-up timeline',
      '☐ Facility-specific one-pager created (showing how we help facilities like theirs)',
      '☐ CRM notes updated with: facility profile, decision-maker, strategy',
      '☐ Backup phone and contact info for rescheduling',
      '☐ Calendar block created: 1 hour meeting + 30 min debrief time',
      '☐ Travel time, parking, and arrival time (plan 15 min early) confirmed'
    ];
    
    materials.forEach(item => {
      doc.text(item, 50, y);
      y += 11;
    });
    
    // Call Objectives
    y += 10;
    y = addSection(doc, 'CALL OBJECTIVES & SUCCESS METRICS', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    doc.text('By the end of this call, you MUST understand:', 40, y);
    y += 12;
    
    const objectives = [
      '✓ Their current referral process (formal vs ad-hoc)',
      '✓ Decision-maker\'s #1 pain point regarding referrals',
      '✓ How many eligible patients they estimate they have',
      '✓ Current hospice partners and satisfaction level',
      '✓ Physician\'s openness to hospice referrals',
      '✓ Timeline: When to follow up (next week, month, quarter?)',
      '✓ Next step: Meeting, call, email, materials?'
    ];
    
    objectives.forEach(item => {
      doc.text(item, 55, y);
      y += 10;
    });
    
    // Post-Call
    y += 10;
    y = addSection(doc, 'POST-CALL FOLLOW-UP (Within 24 Hours)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const postCall = [
      '☐ Detailed notes entered in CRM (key quotes, pain points, next steps)',
      '☐ Promised materials sent (case study, facility-specific proposal, etc.)',
      '☐ Follow-up date/time scheduled and confirmed',
      '☐ Decision-maker asked: Who else should we involve in next conversation?',
      '☐ Call debriefed with manager: What went well? What to improve?',
      '☐ Timeline for next contact set in calendar (show no-show discipline)'
    ];
    
    postCall.forEach(item => {
      doc.text(item, 50, y);
      y += 11;
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
    
    let y = addHeader(doc, 'Medicare/Medicaid Hospice Regulations & Compliance Guide');
    
    // Eligibility
    y = addSection(doc, 'MEDICARE HOSPICE ELIGIBILITY (The Gatekeeper Rules)', y + 15);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    doc.text('A patient must meet ALL of these criteria to be Medicare-eligible for hospice:', 40, y);
    y += 12;
    
    const criteria = [
      ['1. Medicare Part A Coverage', 'Patient must have active Medicare Part A (hospital insurance). If only on Part B, not eligible.'],
      ['2. Physician Certification', 'A licensed physician MUST certify the patient has a terminal illness with 6-month prognosis or less.'],
      ['3. Informed Consent', 'Patient (or authorized representative) must sign the Medicare Hospice Election Form (CMS-1525-02).'],
      ['4. Prognosis Certainty', 'The 6-month window assumes "if disease runs normal course"—patient must clearly be declining.']
    ];
    
    criteria.forEach(([rule, desc]) => {
      doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(rule, 50, y);
      y += 10;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(desc, 60, y, { width: 430 });
      y = doc.y + 10;
    });
    
    // Commonly Eligible Diagnoses
    y += 8;
    y = addSection(doc, 'COMMONLY ELIGIBLE DIAGNOSES', y);
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const diagnoses = [
      ['Cancer', 'Metastatic with systemic symptoms, declining functional status'],
      ['COPD', 'FEV1 <25% predicted OR resting hypoxemia OR hypercapnia'],
      ['Heart Failure', 'NYHA Class IV (symptomatic at rest), ejection fraction <20%, recent hospitalizations'],
      ['Renal Disease', 'Serum creatinine >2.5 or GFR <25 (NOT on dialysis)'],
      ['Liver Disease', 'Albumin <2.5 or INR >1.5 OR ascites present'],
      ['Dementia', 'Eating tube required, unable to communicate, recurrent infections'],
      ['ALS', 'Declining respiratory function, difficulty swallowing, weight loss >10%'],
      ['Stroke', 'Unable to swallow, severe neurological decline, unable to ambulate']
    ];
    
    diagnoses.forEach(([disease, criteria]) => {
      doc.fontSize(8).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(`• ${disease}:`, 50, y);
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(criteria, 70, y, { width: 420 });
      y = doc.y + 10;
    });
    
    // Referral Process
    y += 8;
    y = addSection(doc, 'THE 4-STEP REFERRAL PROCESS', y);
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const steps = [
      {
        step: 'STEP 1: DISCOVERY',
        detail: 'Patient meets eligibility criteria. Care team identifies patient as appropriate for hospice consideration.'
      },
      {
        step: 'STEP 2: PHYSICIAN EVALUATION',
        detail: 'Primary care physician evaluates patient, confirms terminal diagnosis and 6-month prognosis. No referral without this.'
      },
      {
        step: 'STEP 3: PATIENT/FAMILY CONSENT',
        detail: 'Physician discusses hospice with patient/family. Patient/representative signs CMS-1525 election form. Cannot pressure.'
      },
      {
        step: 'STEP 4: HOSPICE ADMISSION',
        detail: 'Hospice accepts referral, completes intake, develops plan of care. Facility coordinates discharge if inpatient.'
      }
    ];
    
    steps.forEach(s => {
      doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(s.step, 50, y);
      y += 10;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(s.detail, 60, y, { width: 420 });
      y = doc.y + 10;
    });
    
    // Common Barriers
    y += 8;
    y = addSection(doc, 'OVERCOMING COMMON BARRIERS', y);
    
    const barriers = [
      {
        barrier: 'BARRIER: "Family not ready to give up treatment"',
        solution: 'Reframe hospice as SUPPORTIVE care. Emphasize comfort, dignity, quality of life. "Hospice helps families have more meaningful time."'
      },
      {
        barrier: 'BARRIER: "Physician hesitant to certify"',
        solution: 'Educate physician on criteria. Provide clinical support. Position as good medicine. "You\'re the only one who can make this determination."'
      },
      {
        barrier: 'BARRIER: "Insurance/financial confusion"',
        solution: 'Clarify: Medicare covers 100% of hospice. No patient cost. Facility doesn\'t lose billing for non-hospice care.'
      }
    ];
    
    barriers.forEach(b => {
      doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(b.barrier, 50, y);
      y += 10;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(b.solution, 60, y, { width: 420 });
      y = doc.y + 12;
    });
    
    // Compliance
    y = addSection(doc, 'COMPLIANCE & LEGAL GUARDRAILS', y);
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const compliance = [
      '☐ NO FINANCIAL INCENTIVES for referrals (Stark Law, Anti-Kickback Statute)',
      '☐ Documentation must show medical necessity (physician certification, prognosis)',
      '☐ NO pressure to choose one hospice over another',
      '☐ Proper informed consent (patient understands choice implications)',
      '☐ All discussions documented in patient medical record',
      '☐ Referral source documented (who initiated the conversation?)',
      '☐ Maintain confidentiality (HIPAA-compliant discussions)'
    ];
    
    compliance.forEach(item => {
      doc.text(item, 50, y);
      y += 10;
    });
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

console.log('Generating enhanced Spartan-branded training PDFs...');
Promise.all([
  createColdCallPDF(),
  createTerritoryPDF(),
  createChecklistPDF(),
  createRegulationsPDF()
]).then(() => {
  console.log('✓ All enhanced PDFs generated successfully');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
