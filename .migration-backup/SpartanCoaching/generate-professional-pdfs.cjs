const PDFDocument = require('pdfkit');
const fs = require('fs');

const SPARTAN_RED = '#DC2626';
const DARK_TEXT = '#1F2937';
const LIGHT_TEXT = '#6B7280';
const ACCENT_GRAY = '#F3F4F6';
const DARK_GRAY = '#E5E7EB';

function createDocument() {
  return new PDFDocument({ size: 'A4', margin: 50 });
}

function addBrandedHeader(doc, title, subtitle = '') {
  doc.rect(0, 0, doc.page.width, 8).fill(SPARTAN_RED);
  doc.rect(0, 8, doc.page.width, 95).fill(ACCENT_GRAY);
  doc.fontSize(24).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text('SPARTAN COACHING', 50, 25);
  doc.fontSize(9).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('HOSPICE SALES EXCELLENCE TRAINING', 50, 50);
  doc.fontSize(16).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(title, 50, 65, { width: 450 });
  if (subtitle) {
    doc.fontSize(9.5).fillColor(LIGHT_TEXT).font('Helvetica');
    doc.text(subtitle, 50, 85, { width: 450 });
  }
  return 120;
}

function addSectionHeader(doc, title, y) {
  doc.fontSize(13).fillColor(SPARTAN_RED).font('Helvetica-Bold');
  doc.text(title, 50, y);
  doc.strokeColor(SPARTAN_RED).lineWidth(2);
  doc.moveTo(50, y + 20).lineTo(550, y + 20).stroke();
  return y + 35;
}

function addFooter(doc) {
  const footerY = doc.page.height - 35;
  doc.strokeColor(DARK_GRAY).lineWidth(1);
  doc.moveTo(50, footerY).lineTo(550, footerY).stroke();
  doc.fontSize(8).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('© 2025 Spartan Coaching | Expert Hospice Sales Training', 50, footerY + 8);
}

function createColdCallPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/cold-call-script.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Cold Call Opening Script', 'Psychology-Backed Approach to Healthcare Decision-Makers');
    y += 15;
    
    y = addSectionHeader(doc, 'EXECUTIVE SUMMARY', y);
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Healthcare administrators receive 40+ calls weekly. Your 30-second opening determines whether they listen or dismiss you. This script cuts through noise by establishing credibility, respecting their time, and positioning hospice referrals as a patient care outcome—not sales.', 50, y, { width: 480 });
    y += 45;
    
    y = addSectionHeader(doc, 'THE PSYCHOLOGY-BACKED OPENING', y);
    
    doc.rect(50, y, 500, 75).fill(ACCENT_GRAY);
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica');
    const opening = '"Hi [Name], this is [Your Name] with Spartan Coaching. I know you manage a busy [facility type], so I\'ll be direct. We help facilities like [similar type] identify eligible patients for hospice care earlier, which improves patient outcomes, family satisfaction, AND regulatory compliance. Do you have 60 seconds for a quick question?"';
    doc.text(opening, 60, y + 8, { width: 480 });
    y += 90;
    
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Why This Opening Works (The Science):', 50, y);
    y += 15;
    
    const principles = [
      { principle: 'Social Proof', explain: 'Mentioning peers activates comparison—they want to know what competitors are doing' },
      { principle: 'Multi-Benefit Hook', explain: 'Three outcomes appeal to different decision-maker priorities' },
      { principle: 'Time Respect', explain: 'Removing the biggest objection (busyness) before it\'s spoken' },
      { principle: 'Question Close', explain: 'Creates psychological obligation to respond (reciprocity)' },
      { principle: 'Credibility Anchor', explain: '"Spartan Coaching" positions you as expert, not vendor' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    principles.forEach((p, i) => {
      doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(`${i + 1}. ${p.principle}`, 55, y);
      y += 11;
      doc.fontSize(8.5).fillColor(LIGHT_TEXT).font('Helvetica');
      doc.text(p.explain, 70, y, { width: 410 });
      y = doc.y + 11;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'TIER 1 DISCOVERY: BASELINE (First 2 Minutes)', y);
    
    const tier1 = [
      { q: '"How many patients are currently in your care?"', why: 'Establish census—determines opportunity size' },
      { q: '"What percentage do you estimate hospice-appropriate?"', why: 'Test awareness. Gap becomes your opening.' },
      { q: '"Do you have a formalized identification process?"', why: 'Understand current state to position value' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    tier1.forEach((item, i) => {
      doc.rect(50, y, 500, 12).fill(SPARTAN_RED);
      doc.fontSize(8.5).fillColor('white').font('Helvetica-Bold');
      doc.text(`Q${i + 1}: ${item.q}`, 55, y + 2);
      y += 17;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(`Purpose: ${item.why}`, 55, y, { width: 480 });
      y = doc.y + 12;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'TIER 2 DISCOVERY: OPPORTUNITY UNCOVERING', y);
    
    const tier2 = [
      { q: '"In last 90 days, how many transitioned to hospice?"', why: 'Real numbers vs estimates. Find the gap.' },
      { q: '"Did any miss the optimal window? What happened?"', why: 'Uncover specific barrier—physician? Family? Process?' },
      { q: '"What\'s the biggest challenge in identifying candidates?"', why: 'Get their pain in their own words—use it in follow-ups' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    tier2.forEach((item, i) => {
      doc.rect(50, y, 500, 12).fill(SPARTAN_RED);
      doc.fontSize(8.5).fillColor('white').font('Helvetica-Bold');
      doc.text(`Q${i + 4}: ${item.q}`, 55, y + 2);
      y += 17;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(`Purpose: ${item.why}`, 55, y, { width: 480 });
      y = doc.y + 12;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'ADVANCED OBJECTION HANDLING', y);
    
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Objection #1: "We already work with a hospice partner"', 50, y);
    y += 14;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Expert response: "I respect that. Best facilities use multiple partners. We focus on [specific area] where most providers have gaps. Would it make sense to explore where we complement what you\'re doing?"', 55, y, { width: 430 });
    y = doc.y + 20;
    
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Objection #2: "We don\'t have a need right now"', 50, y);
    y += 14;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Expert response: "Most facilities discover they have a gap when looking at data. Would you be open to an assessment showing referral patterns vs. best-practice facilities? No pressure, just data."', 55, y, { width: 430 });
    y = doc.y + 20;
    
    doc.fontSize(9.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Objection #3: "Send me something and I\'ll review it"', 50, y);
    y += 14;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Expert response: "I will send it today. I\'ll ping you Friday to see if you had questions. That way if needed, I can walk through it in 15 minutes. Does that timeline work?"', 55, y, { width: 430 });
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createTerritoryPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/territory-template.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Sales Territory Analysis', 'Professional Territory Planning & Account Prioritization');
    y += 15;
    
    y = addSectionHeader(doc, 'TERRITORY BASELINE ASSESSMENT', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Territory Name: ________________________________________     State: ___________', 50, y);
    y += 16;
    doc.text('Territory Manager: ____________________________________     Region: __________', 50, y);
    y += 20;
    
    y = addSectionHeader(doc, 'FACILITY CENSUS ANALYSIS', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('1. FACILITY INVENTORY BY TYPE', 50, y);
    y += 14;
    
    const facilityTypes = [
      'Acute Care Hospitals (100+ beds): Count ___ | Census ___ | Occupancy ___%',
      'Skilled Nursing Facilities (60-200 beds): Count ___ | Census ___ | Occupancy ___%',
      'Assisted Living Communities: Count ___ | Census ___ | Occupancy ___%',
      'Other (Specify): Count ___ | Census ___ | Occupancy ___%'
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    facilityTypes.forEach(f => {
      doc.text(f, 55, y);
      y += 12;
    });
    
    y += 15;
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('2. OPPORTUNITY SIZE CALCULATION', 50, y);
    y += 14;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Total Territory Daily Census: _______________', 55, y);
    y += 12;
    doc.text('× Hospice-Eligible % (5-12% evidence-based): _______ = ____________ patients/month opportunity', 55, y);
    y += 12;
    doc.text('Current Referral Rate (actual): ______/month | Goal Rate (industry): 8-15%/quarter', 55, y);
    y += 12;
    doc.text('MONTHLY OPPORTUNITY GAP: __________ patients × $8,000-$15,000 per admission = Monthly Revenue Opportunity', 55, y);
    y += 20;
    
    y = addSectionHeader(doc, 'ACCOUNT PRIORITIZATION MATRIX', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('A-PRIORITY ACCOUNTS (High Opportunity, Early Stage)', 50, y);
    y += 14;
    doc.text('Definition: New hospitals, no hospice partnership, receptive leadership', 50, y);
    y += 12;
    doc.rect(50, y, 500, 12).fill(SPARTAN_RED);
    doc.fontSize(7.5).fillColor('white').font('Helvetica-Bold');
    doc.text('Account | Location | Census | Decision-Maker | Next Contact | Strategy', 55, y + 2);
    y += 15;
    
    for (let i = 0; i < 3; i++) {
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text('___________|__________|________|_______________|_______________|_________', 55, y);
      y += 12;
    }
    
    y += 15;
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('B-PRIORITY ACCOUNTS (Medium Opportunity, Co-Existence)', 50, y);
    y += 14;
    doc.rect(50, y, 500, 12).fill('#EA580C');
    doc.fontSize(7.5).fillColor('white').font('Helvetica-Bold');
    doc.text('Account | Current Partner | Our Value Add | Entry Point | Timeline', 55, y + 2);
    y += 15;
    
    for (let i = 0; i < 2; i++) {
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text('___________|_______________|_______________|_______________|________', 55, y);
      y += 12;
    }
    
    y += 15;
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('C-PRIORITY ACCOUNTS (Established Relationships)', 50, y);
    y += 14;
    doc.rect(50, y, 500, 12).fill('#FBBF24');
    doc.fontSize(7.5).fillColor('white').font('Helvetica-Bold');
    doc.text('Account | Relationship Status | Referral Rate | Next QBR | Notes', 55, y + 2);
    y += 15;
    
    for (let i = 0; i < 2; i++) {
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text('___________|_____________________|_____________|___________|_______', 55, y);
      y += 12;
    }
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createChecklistPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/research-checklist.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Pre-Call Research & Preparation', 'Expert-Level Meeting Preparation Framework');
    y += 15;
    
    y = addSectionHeader(doc, 'TWO WEEKS BEFORE: STRATEGIC OPPORTUNITY ASSESSMENT', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    const research = [
      '☐ Facility 2-year history reviewed (CMS, state surveys, complaints)',
      '☐ Leadership transitions identified (new CNO, CFO, Chief Medical Officer)',
      '☐ Current hospice partnerships researched (LinkedIn, industry databases)',
      '☐ Physician leadership profiled (specialties, credentials, risk tolerance)',
      '☐ Recent acquisitions/mergers noted (changes strategy)',
      '☐ Quality metrics vs. benchmarks analyzed'
    ];
    research.forEach(item => {
      doc.text(item, 55, y);
      y += 12;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'ONE WEEK BEFORE: TACTICAL PREPARATION', y);
    
    const prep = [
      '☐ Decision-maker background researched (LinkedIn, credentials)',
      '☐ Their facility\'s referral patterns analyzed',
      '☐ 2-3 facility-specific case studies selected and annotated',
      '☐ Competitive positioning mapped',
      '☐ Talking points customized to facility type and leadership style',
      '☐ Discovery questions refined based on facility challenges'
    ];
    prep.forEach(item => {
      doc.text(item, 55, y);
      y += 12;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'THREE DAYS BEFORE: MATERIALS DEVELOPMENT', y);
    
    const materials = [
      '☐ Facility-specific 1-pager created (their challenges, our solutions, ROI)',
      '☐ Case studies printed, relevant sections highlighted',
      '☐ Objection response card prepared',
      '☐ CMS/regulatory resources gathered',
      '☐ Physician engagement materials prepared',
      '☐ Post-call follow-up email drafted (send within 2 hours)'
    ];
    materials.forEach(item => {
      doc.text(item, 55, y);
      y += 12;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'ONE DAY BEFORE: LOGISTICS & MENTAL PREP', y);
    
    const logistic = [
      '☐ Travel route mapped, parking verified, arrive 15 min early',
      '☐ CRM updated with research findings and strategy',
      '☐ Call backup plan created',
      '☐ Success metrics defined',
      '☐ Sales manager briefed on facility and strategy',
      '☐ Mental rehearsal completed (visualize success)'
    ];
    logistic.forEach(item => {
      doc.text(item, 55, y);
      y += 12;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'DURING CALL: EXECUTION FRAMEWORK', y);
    
    const during = [
      '✓ MINUTES 0-2: Build rapport (reference facility by name)',
      '✓ MINUTES 2-5: Discovery (ask questions that uncover real pain)',
      '✓ MINUTES 5-8: Demonstrate expertise (deep knowledge of their challenges)',
      '✓ MINUTES 8-15: Position solution (show how you solve their problem)',
      '✓ MINUTES 15-20: Address objections (use prepared responses)',
      '✓ MINUTES 20-30: Close (schedule next step or promise specific follow-up)'
    ];
    during.forEach(item => {
      doc.text(item, 55, y);
      y += 12;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'WITHIN 4 HOURS: POST-CALL FOLLOW-UP', y);
    
    const postCall = [
      '☐ Detailed notes in CRM (direct quotes, objections, opportunities)',
      '☐ Promised materials sent with personalized note',
      '☐ Follow-up email sent (reference conversation points)',
      '☐ Next contact scheduled (specific date/time)',
      '☐ Sales manager debrief completed',
      '☐ Follow-up call: 72 hours after email'
    ];
    postCall.forEach(item => {
      doc.text(item, 55, y);
      y += 12;
    });
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createRegulationsPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/regulations-guide.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Medicare/Medicaid Hospice Regulations', 'Compliance Framework & Referral Optimization');
    y += 15;
    
    y = addSectionHeader(doc, 'THE FOUR FEDERAL ELIGIBILITY CRITERIA (42 CFR 418.24)', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('All FOUR must be present. Missing even one disqualifies the patient.', 50, y);
    y += 15;
    
    const criteria = [
      { num: '1', req: 'Medicare Part A OR Medicaid Eligibility', detail: 'Patient must have active Medicare Part A or Medicaid. Self-pay only = no hospice eligibility.' },
      { num: '2', req: 'Physician Certification of Terminal Illness', detail: 'Two physicians (initial cert) or one + NP (recert) certify terminal illness: 6-month-or-less prognosis. Must expect death, not treatable to cure.' },
      { num: '3', req: 'Informed Consent via Medicare Election', detail: 'Patient or representative signs CMS-1525-02 form, understanding they elect hospice and forgo curative treatment (except unrelated conditions).' },
      { num: '4', req: 'Established Plan of Care', detail: 'Hospice develops comprehensive care plan addressing pain, symptoms, psychosocial/spiritual needs. Plan documented, reviewed by physician.' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    criteria.forEach((c, i) => {
      doc.rect(50, y, 500, 12).fill(SPARTAN_RED);
      doc.fontSize(8.5).fillColor('white').font('Helvetica-Bold');
      doc.text(`CRITERION ${c.num}: ${c.req}`, 55, y + 2);
      y += 15;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(c.detail, 55, y, { width: 480 });
      y = doc.y + 14;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'DISEASE-SPECIFIC GUIDELINES (Clinical Indicators)', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('TERMINAL CANCER (Most Common)', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Metastatic disease OR locally advanced with systemic symptoms AND functional decline (ECOG 3-4). Regardless of treatment history.', 55, y, { width: 430 });
    y = doc.y + 16;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('COPD (Emphysema/Chronic Bronchitis)', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('FEV1 <25% OR resting oxygen sat <88% OR hypercapnia (CO2 >50) OR 2+ hospitalizations in 12 months despite optimal therapy.', 55, y, { width: 430 });
    y = doc.y + 16;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('HEART FAILURE', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('NYHA Class IV OR EF <20% OR repeated hospitalizations despite optimal therapy OR inotrope dependence OR physician estimate <6-month survival.', 55, y, { width: 430 });
    y = doc.y + 16;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('DEMENTIA (Rapidly Growing Non-Cancer)', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('REISMAN Stage 7C+ (minimal speech, cannot walk/sit, requires total care) AND 12-month ADL decline AND unable to maintain nutrition (weight loss, difficulty swallowing).', 55, y, { width: 430 });
    y = doc.y + 16;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('RENAL DISEASE', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Stage 5 (GFR <15, NOT continuing dialysis) with creatinine >2.5 AND declining function AND medical complications (hypertension, pericarditis, infections).', 55, y, { width: 430 });
    y = doc.y + 20;
    
    y = addSectionHeader(doc, 'THE OPTIMAL 4-STEP REFERRAL PROCESS', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Step 1: EARLY IDENTIFICATION (Days 1-7)', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Care team flags patient meeting criteria. Document in care plan. Goal: Identify within 7 days, not at discharge planning.', 55, y, { width: 430 });
    y = doc.y + 15;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Step 2: PHYSICIAN DISCUSSION (Days 3-10)', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Attending physician meets patient/family. Discusses prognosis, options, hospice as option. Physician certifies if appropriate. Target: <7 days from identification to certification.', 55, y, { width: 430 });
    y = doc.y + 15;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Step 3: FAMILY INFORMED CONSENT (Days 7-14)', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Coordinator explains hospice benefits, obtains informed consent, explains differences from curative treatment. Family signs CMS-1525-02. Goal: Same-day/next-day after physician discussion.', 55, y, { width: 430 });
    y = doc.y + 15;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Step 4: HOSPICE ADMISSION & CARE PLANNING (Days 10-21)', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Hospice completes intake, develops individualized care plan. Services begin immediately. Physician reviews and signs plan within 48 hours.', 55, y, { width: 430 });
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createFacilityScriptsPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/facility-specific-scripts.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Facility-Type Specific Scripts', 'Expert Cold Call Approaches for Different Settings');
    y += 15;
    
    y = addSectionHeader(doc, 'ACUTE CARE HOSPITAL SCRIPT', y);
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Primary Pain Point: 24-48 Hour Discharge Windows + Readmission Penalties', 50, y);
    y += 14;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Hospital discharge planners face CMS readmission penalties ($5,000+ per readmission). Hospice identification must happen within 24-48 hours. Miss that window = patient goes home unsuitable for hospice = hospital readmission = financial penalty.', 50, y, { width: 480 });
    y += 35;
    
    doc.rect(50, y, 500, 70).fill(ACCENT_GRAY);
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const hospitalScript = '"Hi [Name], I work with large health systems on something I know you deal with daily: that 24-48 hour window from when a patient becomes appropriate for hospice to discharge. Most hospitals we partner with tell us they miss that window 30-40% of the time. How often is that a challenge for your facility?"';
    doc.text(hospitalScript, 60, y + 8, { width: 480 });
    y += 85;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Key Points:', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const hospPoints = ['• Early identification within 24 hours', '• Faster certification = discharge within window', '• Fewer readmissions = lower CMS penalties', '• Better quality metrics'];
    hospPoints.forEach(pt => {
      doc.text(pt, 55, y);
      y += 11;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'SKILLED NURSING FACILITY SCRIPT', y);
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Primary Pain Point: CMS Therapy Scrutiny + Compliance Risk', 50, y);
    y += 14;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('CMS audits therapy aggressively. If a patient is hospice-appropriate, continuing PT/OT/SLP triggers audit, denied claims, and compliance violations. SNF administrators avoid therapy on hospice-appropriate patients to prevent penalties.', 50, y, { width: 480 });
    y += 35;
    
    doc.rect(50, y, 500, 70).fill(ACCENT_GRAY);
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const snfScript = '"Hi [Name], I work with skilled nursing facilities on CMS compliance around therapy on hospice-appropriate patients. We help identify those patients BEFORE therapy starts, avoiding non-covered services and compliance issues. Do you currently have a formal identification process?"';
    doc.text(snfScript, 60, y + 8, { width: 480 });
    y += 85;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Key Points:', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const snfKeyPoints = ['• CMS actively auditing unnecessary therapy', '• Each unwarranted day = claim denial ($200-1,200)', '• Early identification prevents therapy from starting', '• Better family satisfaction'];
    snfKeyPoints.forEach(pt => {
      doc.text(pt, 55, y);
      y += 11;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'ASSISTED LIVING COMMUNITY SCRIPT', y);
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Primary Pain Point: Family Satisfaction + Regulatory Expectations', 50, y);
    y += 14;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('AL administrators compete on family satisfaction. End-of-life conversations are complicated. Families want comfort and dignity—which hospice provides. Facilities doing this well get better reviews and higher retention.', 50, y, { width: 480 });
    y += 35;
    
    doc.rect(50, y, 500, 65).fill(ACCENT_GRAY);
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const alScript = '"Hi [Name], I work with senior living communities known for great end-of-life experiences. Most families struggle with those conversations. Are you looking to strengthen how your team approaches those situations?"';
    doc.text(alScript, 60, y + 8, { width: 480 });
    y += 80;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Key Points:', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const alKeyPoints = ['• Family satisfaction = reviews + referrals', '• End-of-life support improves satisfaction 40%+', '• Positions you as premium provider', '• Reduces complaints and litigation risk'];
    alKeyPoints.forEach(pt => {
      doc.text(pt, 55, y);
      y += 11;
    });
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createFollowUpPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/followup-templates.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Follow-Up Communication Framework', 'Expert Sequences for Moving Deals Forward');
    y += 15;
    
    y = addSectionHeader(doc, 'EMAIL SEQUENCE 1: POST-CALL SUMMARY (Send Within 2 Hours)', y);
    
    doc.rect(50, y, 500, 80).fill(ACCENT_GRAY);
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    const email1 = `Subject: Appreciate the conversation—[Specific Detail]

Hi [Name], Really appreciated your time today and learning about [specific challenge]. That\'s exactly what we solve for [facility type].

A couple resources I promised:
• [Resource 1]
• [Case study relevant to them]

Here\'s what I\'m thinking: A quick 15-minute follow-up where I can show you specifically how [similar facility] solved [their pain point]. 60-day results visible.

Can we grab Thursday at 2pm?

[Your Name]`;
    doc.text(email1, 60, y + 5, { width: 480 });
    y += 95;
    
    y = addSectionHeader(doc, 'EMAIL SEQUENCE 2: Nurture (Day 7, No Response)', y);
    
    doc.rect(50, y, 500, 70).fill(ACCENT_GRAY);
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    const email2 = `Subject: Real problem from your facility

Hi [Name], One thing keeps coming back: you mentioned [pain point]. I put together something specific to [facility type] addressing exactly that.

Would a 15-minute conversation be valuable?

[Your Name]`;
    doc.text(email2, 60, y + 5, { width: 480 });
    y += 85;
    
    y = addSectionHeader(doc, 'PHONE SCRIPT: FOLLOW-UP CALL (Day 9)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Hi [Name], [Your Name] from Spartan. I know you\'re busy. I sent you something last week on [pain point]—did you get a chance to look at it?"', 55, y);
    y += 18;
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('IF YES:', 55, y);
    y += 11;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"What stood out to you?" [Listen. Ask: "If I showed you how to implement this, what\'s it worth?"]', 55, y, { width: 430 });
    y = doc.y + 15;
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('IF NO:', 55, y);
    y += 11;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Your facility is missing [revenue impact]/month. Two minutes?" If yes, give 60-second pitch. If no: "I\'ll send a 2-minute video."', 55, y, { width: 430 });
    y = doc.y + 20;
    
    y = addSectionHeader(doc, 'FIRST STRATEGY SESSION: 30-MIN CALL STRUCTURE', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const agenda = [
      '0-2 min: RAPPORT - "Thanks for making time. Any questions from what I sent?"',
      '2-6 min: SITUATION - "Walk me through your current process. Step by step."',
      '6-12 min: VISION - "Here\'s how best facilities handle this. [Describe]. Results: [metrics]."',
      '12-20 min: APPROACH - "Here\'s our exact process. Week 1: training. Week 2: alignment. Week 3: results."',
      '20-28 min: OBJECTIONS - Use prepared responses. If no: "What needs to be true?"',
      '28-30 min: CLOSE - "What does success look like in 90 days?" [Schedule next]'
    ];
    
    agenda.forEach(a => {
      doc.text(a, 55, y);
      y = doc.y;
    });
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createPhysicianPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/physician-strategy.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Physician Engagement Strategy', 'Advanced Framework for Medical Director Alignment');
    y += 15;
    
    y = addSectionHeader(doc, 'THE 5 PHYSICIAN HESITATION BARRIERS', y);
    
    const barriers = [
      { barrier: 'MEDICAL TRAINING CONFLICT', why: 'Trained to fight disease. Hospice feels like abandonment.' },
      { barrier: 'LIABILITY CONCERNS', why: 'Afraid of legal consequences of 6-month certification.' },
      { barrier: 'TIME BURDEN', why: 'Certification + family conversations = 30-60 min per patient.' },
      { barrier: 'REFERRAL LOYALTY', why: 'May have 10-year relationships with existing partners.' },
      { barrier: 'KNOWLEDGE GAPS', why: 'Don\'t know hospice criteria or process deeply.' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    barriers.forEach((b, i) => {
      doc.rect(50, y, 500, 12).fill(SPARTAN_RED);
      doc.fontSize(8).fillColor('white').font('Helvetica-Bold');
      doc.text(`BARRIER ${i + 1}: ${b.barrier}`, 55, y + 2);
      y += 15;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(`${b.why}`, 55, y, { width: 480 });
      y = doc.y + 12;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'THE 5-STEP ENGAGEMENT FRAMEWORK', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    ['1. EDUCATE: CME training on hospice eligibility criteria',
      '2. CREDIBILITY: Share clinical guidelines and protocols',
      '3. SUPPORT: Streamline their certification process',
      '4. PARTNERSHIP: Position as collaborators in outcomes',
      '5. REFINEMENT: Ask for feedback and improvement'].forEach(step => {
      doc.text(step, 55, y);
      y += 12;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'PHYSICIAN OBJECTION RESPONSES', y);
    
    const objections = [
      { obj: '"We already refer to [Competitor]."', resp: '"Many best facilities use multiple providers. We specialize in [area]. Want to explore where we complement?"' },
      { obj: '"Patients always refuse hospice."', resp: '"That changes when families understand it\'s comfort + family time. We handle family conversations—that\'s our strength."' }
    ];
    
    objections.forEach((o, i) => {
      doc.rect(50, y, 500, 12).fill(SPARTAN_RED);
      doc.fontSize(8).fillColor('white').font('Helvetica-Bold');
      doc.text(`Objection ${i + 1}: ${o.obj}`, 55, y + 2);
      y += 15;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(`Response: ${o.resp}`, 55, y, { width: 480 });
      y = doc.y + 13;
    });
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createCaseStudiesPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/case-studies.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Case Studies: Real Results & ROI', 'Documented Transformation Outcomes');
    y += 15;
    
    y = addSectionHeader(doc, 'CASE STUDY 1: SNF TRANSFORMATION', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('120-Bed Regional SNF | 6-Month Engagement | Year-Over-Year Results', 50, y);
    y += 15;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('BASELINE PROBLEM:', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const problems = ['• Monthly referrals: 2-3 (far below 10-15 industry standard)', '• No formal identification process', '• CMS audits flagging unnecessary therapy', '• Family resistance to hospice'];
    problems.forEach(p => {
      doc.text(p, 55, y);
      y += 11;
    });
    
    y += 15;
    doc.rect(50, y, 240, 10).fill('#10B981');
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('RESULTS (6 Months)', 55, y + 1);
    y += 16;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    const snfResults = ['✓ Referrals: 8-10/month (300% increase)', '✓ Time to admission: 14 days (vs 28)', '✓ CMS audit findings: Down 85%', '✓ Revenue: +$45K/month'];
    snfResults.forEach(r => {
      doc.text(r, 55, y);
      y += 11;
    });
    
    y += 25;
    y = addSectionHeader(doc, 'CASE STUDY 2: HOSPITAL DISCHARGE OPTIMIZATION', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('280-Bed Urban Hospital | 3-Month Pilot | Direct Metrics Improvement', 50, y);
    y += 15;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('CHALLENGE:', 50, y);
    y += 12;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const challenges = ['• Referrals dropped to 6-8/month (vs 14 two years prior)', '• 72-hr window missed 60% of time', '• CMS readmissions up 2.1% YoY', '• Risk: $5,000+ penalties per readmission'];
    challenges.forEach(c => {
      doc.text(c, 55, y);
      y += 11;
    });
    
    y += 15;
    doc.rect(50, y, 240, 10).fill('#10B981');
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('RESULTS (90 Days)', 55, y + 1);
    y += 16;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    const hospResults = ['✓ Referrals: 14-16/month (100% increase)', '✓ On-time: 84% within 48-hour window', '✓ LOS reduction: 0.8 days shorter', '✓ Readmissions: Down 2.3%', '✓ Annual savings: $180K+ penalties avoided'];
    hospResults.forEach(r => {
      doc.text(r, 55, y);
      y += 11;
    });
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createDecisionTreesPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/decision-trees.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Decision Trees & Strategic Frameworks', 'Advanced Field Reference Guides');
    y += 15;
    
    y = addSectionHeader(doc, 'OBJECTION HANDLING TREE', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const tree1 = `IS IT REFLEX OBJECTION? ("Not now", "Busy", "Send info")
├─ YES → Respect it. Provide value in email. Nurture in 2-3 weeks.
└─ NO → REAL OBJECTION
     ├─ ASK: "Help me understand what you mean..."
     ├─ LISTEN: Take notes. Don\'t interrupt.
     ├─ ACKNOWLEDGE: "That makes sense because..."
     ├─ RESPOND: Use your Spartan framework
     └─ CONFIRM: "Does that address it?"`;
    
    doc.text(tree1, 55, y, { width: 480 });
    y += 100;
    
    y = addSectionHeader(doc, 'HOSPICE REFERRAL IDENTIFICATION TREE', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const tree2 = `PATIENT ASSESSMENT → TERMINAL DIAGNOSIS?
├─ NO → Standard care pathway
└─ YES → Prognosis < 6 MONTHS?
     ├─ UNCLEAR → Consult physician
     └─ YES → Physician discussion
          ├─ AGREES → Family discussion
          │   └─ Ready? → YES: Admission | NO: Nurture (10 days)
          └─ HESITANT → Engagement framework`;
    
    doc.text(tree2, 55, y, { width: 480 });
    y += 90;
    
    y = addSectionHeader(doc, 'ACCOUNT STRATEGY MATRIX', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('A-PRIORITY: New hospital, no partner, open (40% time, 2x/week, consultative)', 55, y);
    y += 12;
    doc.text('B-PRIORITY: Competitor present, co-existence possible (35% time, 1x/week, complementary)', 55, y);
    y += 12;
    doc.text('C-PRIORITY: Stable partnership (20% time, monthly, maintenance)', 55, y);
    y += 12;
    doc.text('D-PRIORITY: Low potential, competitor locked-in (5% time, quarterly)', 55, y);
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

console.log('Generating expert-level Spartan training PDFs...');
Promise.all([
  createColdCallPDF(),
  createTerritoryPDF(),
  createChecklistPDF(),
  createRegulationsPDF(),
  createFacilityScriptsPDF(),
  createFollowUpPDF(),
  createPhysicianPDF(),
  createCaseStudiesPDF(),
  createDecisionTreesPDF()
]).then(() => {
  console.log('✓ All 9 expert-level PDFs generated successfully');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
