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

function addFooter(doc) {
  const footerY = doc.page.height - 40;
  doc.strokeColor('#E5E7EB').lineWidth(1);
  doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).stroke();
  doc.fontSize(8).fillColor(LIGHT_TEXT).font('Helvetica');
  doc.text('© 2025 Spartan Coaching | Confidential Training Material', 40, footerY + 10);
  doc.text('www.spartan.coach', doc.page.width - 180, footerY + 10);
}

function createFacilityScriptsPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/facility-specific-scripts.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Facility-Type Specific Sales Scripts');
    
    // Hospital Script
    y = addSection(doc, 'HOSPITAL SCRIPT (Shorter Cycle, Higher Acuity)', y + 15);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    y += 12;
    doc.text('Pain Point: Patients discharge quickly; referral windows are SHORT (48-72 hours)', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 15;
    doc.text('"Hi [Name], this is [Your Name] with Spartan Coaching. I know hospital discharge coordination is intense. Quick question: when a patient becomes appropriate for hospice, how many hours from identification to discharge referral are you working with? Most hospitals tell us they have 24-48 hours to get this right, and missing that window costs them."', 50, y, { width: 450 });
    
    y = doc.y + 15;
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Hospital-Specific Talking Points:', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    const hospitalPoints = [
      '• We help you identify eligible patients WITHIN 24 hours of admission',
      '• Faster physician certification = faster discharge (reduces LOS, improves metrics)',
      '• Real-time coordination with discharge planners and social workers',
      '• Reduces 30-day readmissions by getting right level of care sooner'
    ];
    hospitalPoints.forEach(pt => {
      doc.text(pt, 55, y);
      y += 11;
    });
    
    // SNF Script
    y += 15;
    y = addSection(doc, 'SKILLED NURSING FACILITY SCRIPT (Compliance & Revenue Focus)', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    y += 12;
    doc.text('Pain Point: CMS compliance, therapy utilization, appropriate level of care determination', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 15;
    doc.text('"Hi [Name], this is [Your Name] with Spartan Coaching. I work with SNFs on something I think you\'ll relate to: CMS is scrutinizing unnecessary therapy services on patients who should already be on hospice. That\'s not just a quality issue—it affects your reimbursement. Do you have a formal process for identifying when therapy should stop and hospice starts?"', 50, y, { width: 450 });
    
    y = doc.y + 15;
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('SNF-Specific Talking Points:', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    const snfPoints = [
      '• Identify therapy-appropriate vs hospice-appropriate patients (compliance requirement)',
      '• Reduce unnecessary therapy costs (direct impact on bottom line)',
      '• Better outcomes = better quality ratings = better referral source reputation',
      '• Physician collaboration framework (Medicare requires clear documentation)',
      '• Family satisfaction increases when appropriate care level provided'
    ];
    snfPoints.forEach(pt => {
      doc.text(pt, 55, y);
      y += 11;
    });
    
    // Assisted Living Script
    y += 15;
    y = addSection(doc, 'ASSISTED LIVING SCRIPT (Family-Centric, Values-Focused)', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    y += 12;
    doc.text('Pain Point: Family hesitancy, end-of-life conversations, desire to do "everything"', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 15;
    doc.text('"Hi [Name], this is [Your Name] with Spartan Coaching. We work with communities like yours that want to honor residents\' wishes at end of life. Many families struggle with the transition from care to comfort—and it\'s hard to have those conversations without good support. Are you looking to strengthen how your team handles that conversation?"', 50, y, { width: 450 });
    
    y = doc.y + 15;
    doc.fontSize(9).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    doc.text('Assisted Living-Specific Talking Points:', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    const alPoints = [
      '• Support families in dignified end-of-life conversations (brand differentiator)',
      '• Improve family satisfaction scores (directly measurable)',
      '• Reduce unnecessary hospitalizations near end of life',
      '• Train staff in comfort-focused care messaging',
      '• Partnership approach (you + hospice = comprehensive care)'
    ];
    alPoints.forEach(pt => {
      doc.text(pt, 55, y);
      y += 11;
    });
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createFollowUpTemplatesPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/followup-templates.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Follow-Up Communication Templates & Meeting Agendas');
    
    // Email Template 1
    y = addSection(doc, 'EMAIL 1: POST-CALL SUMMARY (Send Within 2 Hours)', y + 15);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    const email1 = `Subject: Great chatting with you—a few resources

Hi [Name],

Thanks for taking time to chat today. I really appreciated learning about [specific detail from call]. 

Here are a few things I promised:
• [Resource 1]
• [Resource 2]

One thing stuck with me from our conversation: You mentioned [their specific pain point]. I think we can help with that.

Could we schedule 20 minutes next [specific day] to walk through [specific solution]? I'll send a calendar invite, but no pressure if timing doesn't work.

Looking forward to connecting soon!

[Your Name]
Spartan Coaching`;
    
    doc.text(email1, 50, y, { width: 450 });
    y = doc.y + 15;
    
    // Email Template 2
    y = addSection(doc, 'EMAIL 2: NURTURE SEQUENCE (No Response After 1 Week)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    const email2 = `Subject: One resource you might find helpful

Hi [Name],

I wanted to follow up on our conversation last week. I know things get busy, so I'm keeping this brief.

I put together something specific to [their facility type] that addresses exactly what you mentioned—[their pain point]. Thought you might find it useful.

Are you still open to a quick 15-minute conversation about how we could help?

Let me know!

[Your Name]`;
    
    doc.text(email2, 50, y, { width: 450 });
    y = doc.y + 15;
    
    // Phone Script
    y = addSection(doc, 'PHONE SCRIPT: NURTURE FOLLOW-UP (Call If No Email Response)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    const phoneScript = `"Hi [Name], it's [Your Name] with Spartan Coaching. Not sure if you got my email—no worries if you did and just didn't have time. I sent over [resource] because I thought you'd find it helpful. Quick question: Is now an okay time for a 2-minute chat?"

If YES: "Great. So last time we talked, you mentioned [their pain point]. I want to show you how [specific solution]. Does that still feel relevant?"

If NO: "Got it. When would be a better time? I promise to keep this quick."`;
    
    doc.text(phoneScript, 50, y, { width: 450 });
    y = doc.y + 15;
    
    // Meeting Agenda
    y = addSection(doc, 'MEETING AGENDA: FIRST STRATEGY SESSION (20-30 min)', y);
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica-Bold');
    y += 12;
    doc.text('[0-2 min] Warm-up: "Thanks for making time. Before we dive in, any questions from my email?"', 40, y);
    y += 10;
    doc.text('[2-8 min] Situation: "Walk me through your current hospice referral process. Where are the gaps?"', 40, y);
    y += 10;
    doc.text('[8-15 min] Vision: "Here\'s how we help [facility type] solve that..." [Present 2-3 specific examples]', 40, y);
    y += 10;
    doc.text('[15-25 min] Approach: "This is what we\'d do for you: [Step 1, 2, 3]" [Timeline & next steps]', 40, y);
    y += 10;
    doc.text('[25-30 min] Close: "What would success look like for you?" [Listen. Schedule next step.]', 40, y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createPhysicianStrategyPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/physician-strategy.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Physician Relationship Building & CME Strategy');
    
    // Understanding Physician Barriers
    y = addSection(doc, 'WHY PHYSICIANS HESITATE ON HOSPICE', y + 15);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    const barriers = [
      ['Fear of "Giving Up"', 'Physicians trained to fight disease. Hospice feels like failure.'],
      ['Liability Concerns', 'Worried about legal implications of certification'],
      ['Time Burden', 'Certification paperwork + family conversations = hours of work'],
      ['Referral Relationships', 'May have existing hospice relationship they\'re loyal to'],
      ['Clinical Knowledge Gaps', 'Don\'t know the specific eligibility criteria']
    ];
    
    doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
    barriers.forEach(([barrier, reason]) => {
      doc.text(`• ${barrier}:`, 50, y);
      y += 10;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(reason, 60, y);
      y += 9;
    });
    
    // Engagement Strategy
    y += 10;
    y = addSection(doc, 'THE ENGAGEMENT FRAMEWORK (Don\'t Go Straight to Sales)', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    const strategy = [
      '1. EDUCATE: Provide CME-eligible hospice training (shows you respect their expertise)',
      '2. CREDIBILITY: Share clinical guidelines and protocols (not a sales pitch)',
      '3. SUPPORT: Offer to streamline their certification process (make their job easier)',
      '4. PARTNERSHIP: Position as collaborators in best patient outcomes (not competitors)',
      '5. REFERRAL: Ask for feedback and refinement (show you value their input)'
    ];
    
    strategy.forEach(s => {
      doc.text(s, 55, y);
      y += 11;
    });
    
    // Physician Objections
    y += 10;
    y = addSection(doc, 'PHYSICIAN-SPECIFIC OBJECTIONS & RESPONSES', y);
    
    const objections = [
      {
        obj: '"We refer to [competitor]. We\'ve got it handled."',
        response: '"I totally respect that. We\'re actually complementary—many physicians we work with manage multiple referral partners. What we do is streamline the certification and documentation process so it\'s less burden on you. Could we show you how that works?"'
      },
      {
        obj: '"I don\'t have time for more referral conversations."',
        response: '"That\'s exactly why we exist. We handle the initial patient identification, family education, and paperwork so that when it comes to you, it\'s just a clinical certification. Two-page form, not a 30-minute conversation."'
      },
      {
        obj: '"Patients always refuse hospice anyway."',
        response: '"That\'s a teaching moment. When families understand hospice is about comfort + family time (not giving up), acceptance goes up significantly. We train your staff on the conversation. Has your team had that training?"'
      }
    ];
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    objections.forEach(o => {
      doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      doc.text(`"${o.obj}`, 50, y);
      y += 12;
      doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      doc.text(o.response, 60, y, { width: 420 });
      y = doc.y + 12;
    });
    
    // CME Opportunity
    y += 8;
    y = addSection(doc, 'CME/LUNCH & LEARN TALKING POINTS', y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    doc.text('"We\'d love to support your physicians with a quick CME-eligible session on hospice eligibility criteria and certification best practices. 30 minutes, lunch provided, and physicians get CME credit. Interested in scheduling something next quarter?"', 50, y, { width: 450 });
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createCaseStudiesPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/case-studies.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Case Studies: Real Results & Success Metrics');
    
    // Case Study 1
    y = addSection(doc, 'CASE STUDY 1: SNF TRANSFORMATION (6-Month Journey)', y + 15);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    y += 12;
    doc.text('Facility: Regional 120-bed SNF, rural setting', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const case1 = [
      'BASELINE (Pre-Spartan):',
      '• Hospice referrals: 2-3 per month (out of 120 beds)',
      '• No formal referral process (ad-hoc, dependent on individual staff)',
      '• Physician frustration with paperwork burden',
      '• Family resistance: "Why hospice? My parent isn\'t dying yet"',
      '',
      'SPARTAN INTERVENTION:',
      '• Trained care team on hospice identification & early referral window',
      '• Streamlined physician certification process (2-page form, pre-filled)',
      '• Created family education materials (framed as "comfort + presence")',
      '• Established weekly interdisciplinary rounds to identify candidates',
      '',
      'RESULTS (6 Months):',
      '✓ Hospice referrals: 8-10 per month (300% increase)',
      '✓ Average time to referral: 14 days (vs 28 days baseline)',
      '✓ Physician satisfaction: "Process is seamless now"',
      '✓ CMS 5-star quality rating: Improved (better appropriate care metrics)',
      '✓ Revenue impact: +$45K/month from appropriate care mix'
    ];
    
    case1.forEach(line => {
      if (line === '') {
        y += 5;
      } else if (line.startsWith('BASELINE') || line.startsWith('SPARTAN') || line.startsWith('RESULTS')) {
        doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
        doc.text(line, 50, y);
        y += 11;
      } else {
        doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
        doc.text(line, 55, y);
        y += 9;
      }
    });
    
    // Case Study 2
    y += 15;
    y = addSection(doc, 'CASE STUDY 2: HOSPITAL DISCHARGE OPTIMIZATION', y);
    
    doc.fontSize(9).fillColor(DARK_TEXT).font('Helvetica-Bold');
    y += 12;
    doc.text('Facility: 280-bed acute care hospital, urban medical center', 40, y);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const case2 = [
      'CHALLENGE:',
      '• Hospice referrals dropped to 6 per month (compliance concerns)',
      '• Discharge planners "scared" to mention hospice (family reactions)',
      '• 72-hour referral window often missed',
      '',
      'SPARTAN SOLUTION:',
      '• Deployed Spartan coach to embed in discharge planning rounds',
      '• Trained 40+ staff on early identification framework',
      '• Created discharge coordinator decision tree (when + how to raise hospice)',
      '• Provided family conversation scripts & education materials',
      '',
      'OUTCOME (3 Months):',
      '✓ Hospice referrals: 14-16 per month',
      '✓ 84% of referrals made within 48-hour discharge window',
      '✓ Staff confidence: "We know exactly when/how to talk about this"',
      '✓ Length of stay decreased 0.8 days (major financial impact)',
      '✓ Hospital readmission rate: Down 2.3%'
    ];
    
    case2.forEach(line => {
      if (line === '') {
        y += 5;
      } else if (line.startsWith('CHALLENGE') || line.startsWith('SPARTAN') || line.startsWith('OUTCOME')) {
        doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
        doc.text(line, 50, y);
        y += 11;
      } else {
        doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
        doc.text(line, 55, y);
        y += 9;
      }
    });
    
    // Key Learnings
    y += 15;
    y = addSection(doc, 'KEY LEARNINGS FROM SUCCESSFUL DEPLOYMENTS', y);
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const learnings = [
      '1. Physician engagement is THE bottleneck. Solve it first.',
      '2. Family education > objection handling. Prevent resistance, don\'t fight it.',
      '3. Process beats willpower. Systems win. Ad-hoc loses.',
      '4. Early identification (days, not weeks) is the game-changer.',
      '5. Documentation is legal protection. Show compliance, not burden.'
    ];
    
    learnings.forEach(l => {
      doc.text(l, 50, y);
      y += 10;
    });
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function createDecisionTreesPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const stream = fs.createWriteStream('public/resources/decision-trees.pdf');
    doc.pipe(stream);
    
    let y = addHeader(doc, 'Visual Decision Trees & Strategic Frameworks');
    
    // Objection Handling Tree
    y = addSection(doc, 'OBJECTION HANDLING DECISION TREE', y + 15);
    
    doc.fontSize(8.5).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const tree1 = [
      'START: You get an objection',
      '↓',
      'ASK: Is it REAL (substance) or REFLEX (not interested)?',
      '├─ REFLEX ("No, not now")',
      '│  └─ RESPONSE: "I understand. This is important though."',
      '│     └─ Provide data, ask permission for follow-up',
      '│        └─ GOAL: Stay on radar (nurture, not push)',
      '│',
      '├─ REAL (specific objection about product/fit)',
      '│  └─ LISTEN: "Help me understand..."',
      '│     └─ ACKNOWLEDGE: "That makes sense"',
      '│        └─ RESPOND: [Use Spartan objection framework]',
      '│           └─ CONFIRM: "Does that address your concern?"',
      '│              └─ ADVANCE: Next step or nurture'
    ];
    
    tree1.forEach(line => {
      if (line.includes('│') || line.includes('└') || line.includes('├')) {
        doc.fontSize(7.5).fillColor(DARK_TEXT).font('Helvetica');
      } else if (line.includes('START') || line.includes('ASK') || line.includes('LISTEN')) {
        doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      } else {
        doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      }
      doc.text(line, 50, y);
      y += 10;
    });
    
    // Referral Process Tree
    y += 15;
    y = addSection(doc, 'HOSPICE REFERRAL DECISION TREE (Patient Identification)', y);
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    const tree2 = [
      'PATIENT ASSESSMENT',
      '↓',
      'Does patient have terminal diagnosis?',
      '├─ NO → Continue standard care pathway',
      '└─ YES → Is prognosis likely <6 months?',
         '├─ UNCLEAR → Consult physician, get clinical opinion',
         '└─ YES → Approach physician for certification discussion',
            '├─ Physician agrees → Proceed to family discussion',
            '└─ Physician hesitant → Use Spartan framework (educate, not push)',
               '└─ Family ready? → YES = Admission → NO = Nurture plan (revisit in X days)'
    ];
    
    tree2.forEach(line => {
      if (line.includes('├') || line.includes('└') || line.includes('↓')) {
        doc.fontSize(7.5).fillColor(DARK_TEXT).font('Helvetica');
      } else if (line.includes('PATIENT') || line.includes('Does')) {
        doc.fontSize(8.5).fillColor(SPARTAN_RED).font('Helvetica-Bold');
      } else {
        doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
      }
      doc.text(line, 50, y);
      y += 10;
    });
    
    // Account Strategy Matrix
    y += 15;
    y = addSection(doc, 'ACCOUNT STRATEGY MATRIX (Effort vs Opportunity)', y);
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    y += 12;
    
    doc.text('HIGH OPPORTUNITY + LOW EFFORT = QUICK WINS (A-Priority)', 50, y);
    y += 10;
    doc.fontSize(7.5).fillColor(LIGHT_TEXT).font('Helvetica');
    doc.text('New hospital opening, no established hospice partner, receptive admin', 50, y);
    y += 8;
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('HIGH OPPORTUNITY + HIGH EFFORT = STRATEGIC FOCUS (B-Priority)', 50, y);
    y += 10;
    doc.fontSize(7.5).fillColor(LIGHT_TEXT).font('Helvetica');
    doc.text('Established competitor relationship but opportunity to co-exist', 50, y);
    y += 8;
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('LOW OPPORTUNITY + LOW EFFORT = MAINTAIN (C-Priority)', 50, y);
    y += 10;
    doc.fontSize(7.5).fillColor(LIGHT_TEXT).font('Helvetica');
    doc.text('Stable account with existing partner; quarterly check-ins', 50, y);
    y += 8;
    
    doc.fontSize(8).fillColor(DARK_TEXT).font('Helvetica');
    doc.text('LOW OPPORTUNITY + HIGH EFFORT = AVOID (D-Priority)', 50, y);
    y += 10;
    doc.fontSize(7.5).fillColor(LIGHT_TEXT).font('Helvetica');
    doc.text('Unsupportive leadership, fully committed to competitor', 50, y);
    
    addFooter(doc);
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

console.log('Generating advanced Spartan training PDFs...');
Promise.all([
  createFacilityScriptsPDF(),
  createFollowUpTemplatesPDF(),
  createPhysicianStrategyPDF(),
  createCaseStudiesPDF(),
  createDecisionTreesPDF()
]).then(() => {
  console.log('✓ All advanced PDFs generated successfully');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
