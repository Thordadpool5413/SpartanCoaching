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
  doc.text('HOSPICE SALES EXCELLENCE', 50, 50);
  doc.fontSize(18).fillColor(DARK_TEXT).font('Helvetica-Bold');
  doc.text(title, 50, 65, { width: 450 });
  if (subtitle) {
    doc.fontSize(10).fillColor(LIGHT_TEXT).font('Helvetica');
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
  doc.text('© 2025 Spartan Coaching | Confidential Training Material | www.spartan.coach', 50, footerY + 8);
}

function createColdCallPDF() {
  return new Promise((resolve, reject) => {
    const doc = createDocument();
    const stream = fs.createWriteStream('public/resources/cold-call-script.pdf');
    doc.pipe(stream);
    
    let y = addBrandedHeader(doc, 'Cold Call Opening Script', 'Professional phone contact framework');
    y += 15;
    
    y = addSectionHeader(doc, 'THE 30-SECOND OPENING', y);
    
    doc.fontSize(10).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Your Power Opening', 50, y);
    y += 18;
    
    doc.rect(50, y, 500, 70).fill(ACCENT_GRAY);
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Hi [Name], this is [Your Name] with Spartan Coaching. I know you\'re busy, so I\'ll be brief. We work with facilities like yours to improve patient outcomes and family satisfaction by connecting eligible patients with hospice care earlier. Do you have 30 seconds?"', 60, y + 10, { width: 480 });
    y += 85;
    
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Why This Works', 50, y);
    y += 14;
    
    const points = [
      '• Respects their time (validates their biggest concern)',
      '• Names the outcome upfront (better care, satisfaction)',
      '• Removes sales pressure ("not selling anything")',
      '• Creates micro-commitment (30 seconds, not an hour)',
      '• Positions you as helpful, not pushy'
    ];
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    points.forEach(pt => {
      doc.text(pt, 55, y);
      y += 13;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'DISCOVERY QUESTIONS', y);
    
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Tier 1: Initial Assessment', 50, y);
    y += 16;
    
    const tier1 = [
      { q: 'How many patients are in your facility at any time?', p: 'Establish baseline' },
      { q: 'How many would you estimate are appropriate for hospice?', p: 'Gauge awareness' },
      { q: 'Do you have a formal hospice referral process?', p: 'Identify clarity' }
    ];
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    tier1.forEach((item, i) => {
      doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
      doc.text(`${i + 1}. "${item.q}"`, 55, y);
      y += 11;
      doc.fontSize(8.5).fillColor(LIGHT_TEXT).font('Helvetica');
      doc.text(`Purpose: ${item.p}`, 65, y);
      y += 12;
    });
    
    y += 15;
    doc.fontSize(10).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Tier 2: Deeper Opportunity', 50, y);
    y += 16;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('4. "In the last quarter, how many patients transitioned to hospice?" (Get numbers)', 55, y);
    y += 12;
    doc.text('5. "Did any miss the referral window? What happened?" (Uncover barriers)', 55, y);
    y += 20;
    
    y = addSectionHeader(doc, 'OBJECTION HANDLING', y);
    
    doc.rect(50, y, 500, 10).fill(SPARTAN_RED);
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('Objection: "We already work with a partner"', 55, y + 1);
    y += 15;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Response: "I respect that. Many facilities work with multiple partners. Would you be open to discussing how we complement what you\'re doing?"', 55, y, { width: 480 });
    y += 25;
    
    doc.rect(50, y, 500, 10).fill(SPARTAN_RED);
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('Objection: "We don\'t have a need right now"', 55, y + 1);
    y += 15;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Response: "I hear that. Most facilities discover they have a gap when they look at their data. Could I send you a quick assessment?"', 55, y, { width: 480 });
    
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
    
    let y = addBrandedHeader(doc, 'Sales Territory Analysis Template', 'Strategic planning & account management');
    y += 15;
    
    y = addSectionHeader(doc, 'TERRITORY PROFILE', y);
    
    doc.rect(50, y, 500, 12).fill(ACCENT_GRAY);
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Territory Name: ___________________________', 55, y + 1);
    y += 18;
    
    doc.rect(50, y, 500, 12).fill(ACCENT_GRAY);
    doc.text('Territory Manager: ___________________________', 55, y + 1);
    y += 20;
    
    y = addSectionHeader(doc, 'FACILITY INVENTORY & OPPORTUNITY', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Total Facilities by Type', 50, y);
    y += 14;
    
    const facilities = ['Hospitals', 'Skilled Nursing Facilities', 'Assisted Living', 'Memory Care', 'Other'];
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    facilities.forEach(fac => {
      doc.text(`${fac}: ___`, 55, y);
      y += 11;
    });
    
    y += 15;
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Opportunity Assessment', 50, y);
    y += 14;
    
    const metrics = [
      'Average Daily Census (all facilities): ___',
      'Estimated Hospice-Eligible Patients: ___ (typically 5-12% of census)',
      'Current Hospice Referral Rate: ___ (goal: 8-15% per quarter)',
      'Missing Referral Opportunity: ___'
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    metrics.forEach(m => {
      doc.text(m, 55, y);
      y += 12;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'ACCOUNT PRIORITIZATION', y);
    
    doc.rect(50, y, 500, 10).fill(SPARTAN_RED);
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('A-PRIORITY: High-Potential Accounts', 55, y + 1);
    y += 15;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Account: ________________  Decision-Maker: ________________', 55, y);
    y += 11;
    doc.text('Next Steps: ________________________________________________________________', 55, y);
    y += 18;
    
    doc.rect(50, y, 500, 10).fill('#EA580C');
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('B-PRIORITY: Developing Relationships', 55, y + 1);
    y += 15;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Account: ________________  Current Partner: ________________', 55, y);
    y += 18;
    
    doc.rect(50, y, 500, 10).fill('#FBBF24');
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('C-PRIORITY: Mature Relationships', 55, y + 1);
    y += 15;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('Account: ________________  Status: Well-established', 55, y);
    
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
    
    let y = addBrandedHeader(doc, 'Pre-Call Research & Preparation', 'Complete meeting preparation workflow');
    y += 15;
    
    y = addSectionHeader(doc, 'ONE WEEK BEFORE: FACILITY RESEARCH', y);
    
    const research = [
      '☐ Facility name, location, website verified',
      '☐ Current census and bed breakdown documented',
      '☐ CMS ratings and recent performance reviewed',
      '☐ Current hospice partners identified',
      '☐ Decision-maker: name, title, email, phone, LinkedIn',
      '☐ Secondary contacts identified (Care Manager, Social Worker)'
    ];
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    research.forEach(item => {
      doc.text(item, 55, y);
      y += 13;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'THREE DAYS BEFORE: STRATEGIC PREP', y);
    
    const prep = [
      '☐ Talking points customized for facility type',
      '☐ Competitive landscape mapped',
      '☐ 2-3 case studies selected and marked',
      '☐ Objection responses prepared',
      '☐ Discovery questions customized',
      '☐ Their referral process researched',
      '☐ Physician alignment assessed'
    ];
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    prep.forEach(item => {
      doc.text(item, 55, y);
      y += 13;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'ONE DAY BEFORE: MATERIALS & LOGISTICS', y);
    
    const materials = [
      '☐ Spartan overview printed and marked',
      '☐ Case studies highlighted',
      '☐ Contact cards prepared',
      '☐ Facility-specific one-pager created',
      '☐ CRM updated with strategy',
      '☐ Travel time and arrival confirmed (15 min early)',
      '☐ Calendar block: 1 hour meeting + 30 min debrief'
    ];
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    materials.forEach(item => {
      doc.text(item, 55, y);
      y += 13;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'CALL SUCCESS METRICS', y);
    
    const metrics = [
      '✓ 30+ minutes of quality conversation',
      '✓ At least 2 key challenges identified',
      '✓ Specific referral process understood',
      '✓ Next meeting scheduled',
      '✓ Contact information exchanged'
    ];
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    metrics.forEach(item => {
      doc.text(item, 55, y);
      y += 13;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'WITHIN 24 HOURS: POST-CALL FOLLOW-UP', y);
    
    const postCall = [
      '☐ Detailed notes entered in CRM',
      '☐ Promised materials sent',
      '☐ Follow-up date scheduled and confirmed',
      '☐ Next contacts set in calendar'
    ];
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    postCall.forEach(item => {
      doc.text(item, 55, y);
      y += 13;
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
    
    let y = addBrandedHeader(doc, 'Medicare/Medicaid Hospice Regulations', 'Compliance, eligibility, and referral process');
    y += 15;
    
    y = addSectionHeader(doc, 'MEDICARE ELIGIBILITY CRITERIA', y);
    
    const criteria = [
      { num: '1', title: 'Medicare Part A Coverage', desc: 'Patient must have active Medicare Part A (hospital insurance)' },
      { num: '2', title: 'Physician Certification', desc: 'Licensed physician certifies terminal illness (6-month prognosis or less)' },
      { num: '3', title: 'Informed Consent', desc: 'Patient/representative signs Medicare Hospice Election Form (CMS-1525-02)' },
      { num: '4', title: 'Prognosis Documentation', desc: 'Clear documentation that patient meets terminal diagnosis criteria' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    criteria.forEach((c, i) => {
      doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(`${c.num}. ${c.title}`, 55, y);
      y += 11;
      doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(c.desc, 70, y, { width: 430 });
      y = doc.y + 12;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'COMMONLY ELIGIBLE DIAGNOSES', y);
    
    const diagnoses = [
      { disease: 'Advanced Cancer', marker: 'Metastatic with systemic symptoms' },
      { disease: 'COPD', marker: 'FEV1 <25% OR resting hypoxemia' },
      { disease: 'Heart Failure', marker: 'NYHA Class IV, EF <20%' },
      { disease: 'Renal Disease', marker: 'Creatinine >2.5 or GFR <25' },
      { disease: 'Liver Disease', marker: 'Albumin <2.5 or INR >1.5' },
      { disease: 'ALS/Neurological', marker: 'Declining respiratory function' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    diagnoses.forEach(d => {
      doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
      doc.text(`• ${d.disease}`, 55, y);
      y += 11;
      doc.fontSize(8.5).fillColor(LIGHT_TEXT).font('Helvetica');
      doc.text(d.marker, 70, y);
      y = doc.y + 11;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'THE 4-STEP REFERRAL PROCESS', y);
    
    const steps = [
      { step: 'IDENTIFICATION', desc: 'Patient meets criteria; identified as hospice candidate' },
      { step: 'PHYSICIAN CERTIFICATION', desc: 'Physician evaluates and certifies terminal diagnosis' },
      { step: 'PATIENT/FAMILY CONSENT', desc: 'Patient/representative signs election form' },
      { step: 'HOSPICE ADMISSION', desc: 'Hospice accepts; intake and plan of care developed' }
    ];
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    steps.forEach((s, i) => {
      doc.rect(50, y, 500, 10).fill(SPARTAN_RED);
      doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
      doc.text(`STEP ${i + 1}: ${s.step}`, 55, y + 1);
      y += 15;
      doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(s.desc, 55, y, { width: 480 });
      y = doc.y + 14;
    });
    
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
    
    let y = addBrandedHeader(doc, 'Facility-Type Specific Scripts', 'Customized approaches for different facilities');
    y += 15;
    
    y = addSectionHeader(doc, 'HOSPITAL SCRIPT', y);
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Pain Point: 24-48 hour discharge windows', 50, y);
    y += 14;
    
    doc.rect(50, y, 500, 60).fill(ACCENT_GRAY);
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Hi [Name], quick question: when a patient becomes appropriate for hospice, how many hours do you have from identification to discharge? Most hospitals tell us 24-48 hours. Does that resonate?"', 60, y + 10, { width: 480 });
    y += 70;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Key Points:', 50, y);
    y += 12;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    ['Identify eligible patients within 24 hours', 'Faster physician certification = shorter LOS', 'Real-time discharge coordination', 'Reduce 30-day readmissions'].forEach(pt => {
      doc.text(`• ${pt}`, 55, y);
      y += 11;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'SKILLED NURSING FACILITY SCRIPT', y);
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Pain Point: CMS compliance, therapy utilization', 50, y);
    y += 14;
    
    doc.rect(50, y, 500, 60).fill(ACCENT_GRAY);
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Hi [Name], I work with SNFs on CMS scrutiny of unnecessary therapy on patients who should be on hospice. Do you have a formal process for identifying when therapy should stop and hospice should start?"', 60, y + 10, { width: 480 });
    y += 70;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Key Points:', 50, y);
    y += 12;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    ['Identify therapy vs hospice-appropriate patients', 'Reduce unnecessary therapy costs', 'Better CMS compliance and ratings', 'Physician collaboration framework'].forEach(pt => {
      doc.text(`• ${pt}`, 55, y);
      y += 11;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'ASSISTED LIVING SCRIPT', y);
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Pain Point: Family hesitancy, end-of-life conversations', 50, y);
    y += 14;
    
    doc.rect(50, y, 500, 55).fill(ACCENT_GRAY);
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Hi [Name], we work with communities that want to honor residents\' wishes at end of life. Many families struggle with transitions—are you looking to strengthen how your team handles those conversations?"', 60, y + 10, { width: 480 });
    y += 65;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Key Points:', 50, y);
    y += 12;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    ['Support families in dignified conversations', 'Improve family satisfaction', 'Reduce unnecessary hospitalizations', 'Partnership approach'].forEach(pt => {
      doc.text(`• ${pt}`, 55, y);
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
    
    let y = addBrandedHeader(doc, 'Follow-Up Communication Templates', 'Email, phone scripts, and meeting agendas');
    y += 15;
    
    y = addSectionHeader(doc, 'EMAIL 1: POST-CALL SUMMARY (Within 2 Hours)', y);
    
    doc.rect(50, y, 500, 80).fill(ACCENT_GRAY);
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    const email1 = `Subject: Great chatting with you—a few resources

Hi [Name], Thanks for taking time today. I really appreciated learning about [their detail].

Here's what I promised:
• [Resource 1]
• [Resource 2]

One thing stuck with me: You mentioned [pain point]. I think we can help.

Could we schedule 20 minutes next [day] to discuss [solution]?

Looking forward to connecting!
[Your Name]`;
    doc.text(email1, 60, y + 5, { width: 480 });
    y += 95;
    
    y = addSectionHeader(doc, 'EMAIL 2: NURTURE (No Response After 1 Week)', y);
    
    doc.rect(50, y, 500, 65).fill(ACCENT_GRAY);
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    const email2 = `Subject: One resource you might find helpful

Hi [Name], Just following up from our conversation. I put together something specific to [facility type] that addresses [their pain point].

Are you still open to a 15-minute conversation about how we could help?

Let me know!
[Your Name]`;
    doc.text(email2, 60, y + 5, { width: 480 });
    y += 80;
    
    y = addSectionHeader(doc, 'PHONE SCRIPT: FOLLOW-UP', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Hi [Name], it\'s [Your Name] from Spartan. Just wanted to follow up from our conversation. Do you have 2 minutes?"', 55, y);
    y += 15;
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('If YES:', 55, y);
    y += 11;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Great. You mentioned [pain point]. I want to show you how [solution] could help. Does that still feel relevant?"', 55, y);
    y += 18;
    
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('If NO:', 55, y);
    y += 11;
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"Got it. When would be a better time? I promise to keep this brief."', 55, y);
    y += 20;
    
    y = addSectionHeader(doc, 'FIRST MEETING AGENDA (20-30 min)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const agenda = [
      '0-2 min: Warm-up ("Thanks for your time. Any questions?")',
      '2-8 min: Situation ("Walk me through your referral process...")',
      '8-15 min: Vision ("Here\'s how we help [type]..." [Examples])',
      '15-25 min: Approach ("Here\'s our process... Timeline: [X]")',
      '25-30 min: Close ("What would success look like?") [Schedule next]'
    ];
    
    agenda.forEach(a => {
      doc.text(a, 55, y);
      y += 12;
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
    
    let y = addBrandedHeader(doc, 'Physician Relationship Building', 'Engaging medical directors and clinical leadership');
    y += 15;
    
    y = addSectionHeader(doc, 'WHY PHYSICIANS HESITATE', y);
    
    const barriers = [
      { barrier: 'Fear of "Giving Up"', reason: 'Trained to fight disease' },
      { barrier: 'Liability Concerns', reason: 'Worried about legal implications' },
      { barrier: 'Time Burden', reason: 'Certification + family conversations = hours' },
      { barrier: 'Referral Loyalty', reason: 'Existing relationships they\'re loyal to' },
      { barrier: 'Knowledge Gaps', reason: 'Don\'t know specific eligibility criteria' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    barriers.forEach(b => {
      doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(`• ${b.barrier}`, 55, y);
      y += 11;
      doc.fontSize(8.5).fillColor(LIGHT_TEXT).font('Helvetica');
      doc.text(b.reason, 70, y);
      y = doc.y + 11;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'THE ENGAGEMENT FRAMEWORK', y);
    
    const framework = [
      '1. EDUCATE: Provide CME-eligible hospice training',
      '2. CREDIBILITY: Share clinical guidelines and protocols',
      '3. SUPPORT: Streamline their certification process',
      '4. PARTNERSHIP: Position as collaborators in outcomes',
      '5. REFINEMENT: Ask for feedback and improvement'
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    framework.forEach(f => {
      doc.text(f, 55, y);
      y += 13;
    });
    
    y += 20;
    y = addSectionHeader(doc, 'PHYSICIAN OBJECTIONS & RESPONSES', y);
    
    const objections = [
      { obj: '"We refer to [competitor]. We\'ve got it handled."', response: '"I respect that. Many physicians manage multiple partners for better coverage. We\'re complementary—we streamline your certification process. Interested in showing you how?"' },
      { obj: '"I don\'t have time for more referrals."', response: '"That\'s why we exist. We handle identification and paperwork so it\'s just a clinical certification for you—two-page form."' }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    objections.forEach(o => {
      doc.rect(50, y, 500, 10).fill(SPARTAN_RED);
      doc.fontSize(8.5).fillColor('white').font('Helvetica-Bold');
      doc.text(o.obj, 55, y + 1);
      y += 15;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(`Response: ${o.response}`, 55, y, { width: 480 });
      y = doc.y + 14;
    });
    
    y += 15;
    y = addSectionHeader(doc, 'CME/LUNCH & LEARN PROPOSAL', y);
    
    doc.rect(50, y, 500, 50).fill(ACCENT_GRAY);
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('"We\'d love to support your physicians with a CME-eligible session on hospice eligibility criteria and certification best practices. 30 minutes, lunch provided, physicians get CME credit. Interested in scheduling next quarter?"', 60, y + 10, { width: 480 });
    
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
    
    let y = addBrandedHeader(doc, 'Case Studies: Real Results & Metrics', 'Proven transformation outcomes');
    y += 15;
    
    y = addSectionHeader(doc, 'CASE STUDY 1: SNF TRANSFORMATION', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('Regional 120-bed SNF | 6-Month Engagement', 50, y);
    y += 14;
    
    doc.rect(50, y, 240, 10).fill(SPARTAN_RED);
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('BASELINE', 55, y + 1);
    y += 15;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    ['Referrals: 2-3 per month', 'No formal process', 'Physician frustration', 'Family resistance'].forEach(b => {
      doc.text(`• ${b}`, 55, y);
      y += 11;
    });
    
    y += 15;
    doc.rect(50, y, 240, 10).fill('#10B981');
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('RESULTS', 55, y + 1);
    y += 15;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('✓ Referrals: 8-10/month (300% increase)', 55, y);
    y += 11;
    doc.text('✓ Time to Referral: 14 days (vs 28)', 55, y);
    y += 11;
    doc.text('✓ CMS Rating: Improved', 55, y);
    y += 11;
    doc.text('✓ Revenue: +$45K/month', 55, y);
    y += 20;
    
    y = addSectionHeader(doc, 'CASE STUDY 2: HOSPITAL DISCHARGE OPT', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('280-bed Urban Medical Center | 3 Months', 50, y);
    y += 14;
    
    doc.rect(50, y, 240, 10).fill('#DC2626');
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('CHALLENGE', 55, y + 1);
    y += 15;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    ['Referrals dropped to 6/month', 'Discharge planners scared', '72-hr window missed'].forEach(c => {
      doc.text(`• ${c}`, 55, y);
      y += 11;
    });
    
    y += 15;
    doc.rect(50, y, 240, 10).fill('#10B981');
    doc.fontSize(9).fillColor('white').font('Helvetica-Bold');
    doc.text('OUTCOME', 55, y + 1);
    y += 15;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('✓ Referrals: 14-16/month', 55, y);
    y += 11;
    doc.text('✓ On-Time: 84% within 48-hr', 55, y);
    y += 11;
    doc.text('✓ LOS Reduction: 0.8 days', 55, y);
    y += 11;
    doc.text('✓ Readmissions: Down 2.3%', 55, y);
    
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
    
    let y = addBrandedHeader(doc, 'Decision Trees & Frameworks', 'Visual guides for rapid field decisions');
    y += 15;
    
    y = addSectionHeader(doc, 'OBJECTION HANDLING TREE', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const tree1 = `START: You hear an objection
     ↓
Is this REFLEX? ("Not now", "We're busy")
├─ YES → Respect time, provide data, stay on radar
│        → Send nurture email
│        → Follow up in 2-3 weeks
└─ NO → Is this REAL? (Specific concern)
     ├─ ASK: "Help me understand..."
     ├─ LISTEN: Take notes
     ├─ ACKNOWLEDGE: "That makes sense because..."
     ├─ RESPOND: Use Spartan framework
     └─ CONFIRM: "Does that address it?"`;
    
    doc.text(tree1, 55, y, { width: 480 });
    y += 120;
    
    y = addSectionHeader(doc, 'HOSPICE REFERRAL IDENTIFICATION TREE', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    const tree2 = `PATIENT ASSESSMENT
     ↓
TERMINAL DIAGNOSIS?
├─ NO → Standard care
└─ YES → Prognosis < 6 MONTHS?
     ├─ UNCLEAR → Consult physician
     └─ YES → Approach physician
          ├─ Agrees → Family discussion
          └─ Hesitant → Engagement framework
               └─ Family ready?
                    ├─ YES → Admission
                    └─ NO → Nurture (10 days)`;
    
    doc.text(tree2, 55, y, { width: 480 });
    y += 110;
    
    y = addSectionHeader(doc, 'ACCOUNT STRATEGY MATRIX', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('HIGH OPPORTUNITY:', 50, y);
    y += 14;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('A-PRIORITY: New hospital, no partner, receptive admin (Quick wins)', 55, y);
    y += 13;
    doc.text('B-PRIORITY: Competitor present but co-existence possible (Strategic)', 55, y);
    y += 16;
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    doc.text('LOW OPPORTUNITY:', 50, y);
    y += 14;
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('C-PRIORITY: Stable with partner; quarterly touch-ins', 55, y);
    y += 13;
    doc.text('D-PRIORITY: Unsupportive, competitor lock-in (Avoid)', 55, y);
    
    addFooter(doc);
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

console.log('Generating professional Spartan training PDFs...');
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
  console.log('✓ All 9 professional PDFs generated');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
