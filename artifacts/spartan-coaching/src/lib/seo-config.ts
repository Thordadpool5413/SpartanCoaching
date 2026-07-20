interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

const seoDefaults: Record<string, SEOConfig> = {
  '/': {
    title: 'Spartan Coaching | Expert Hospice Sales Consulting & Training',
    description: 'Transform your hospice sales team with expert consulting and hands-on coaching. Get eligible patients into care earlier using the proven Spartan Method.',
    keywords: 'hospice sales consulting, hospice sales training, hospice marketing, sales coaching, healthcare sales, hospice referrals',
  },
  '/services': {
    title: 'Coaching Services | Spartan Coaching',
    description: 'Elevate your hospice sales performance with personalized coaching. Individual and team programs build discipline, empathy, and winning strategies. Start today.',
    keywords: 'hospice sales coaching, individual coaching, team coaching, sales training services',
  },
  '/programs': {
    title: 'Training Programs | Spartan Coaching',
    description: 'Structured hospice sales training programs for organizations of all sizes. From onboarding to advanced strategies, accelerate your team\'s performance.',
    keywords: 'hospice training programs, sales team training, healthcare sales programs, onboarding',
  },
  '/method': {
    title: 'The Spartan Method | Spartan Coaching',
    description: 'Discover the Spartan Method framework built on three pillars: Discipline, Empathy, and Strategy. A proven approach to hospice sales mastery.',
    keywords: 'Spartan Method, sales methodology, hospice sales framework, discipline empathy strategy',
  },
  '/tools': {
    title: 'Field Kit | Spartan Coaching',
    description: 'Private AI Field Kit for Spartan clients and approved evaluators. Playbooks, objections, role-play, calculators, and weekly planning for hospice growth.',
    keywords: 'hospice sales tools, sales playbook generator, objection handling, territory research, email templates, Field Kit',
  },
  '/welcome': {
    title: 'Welcome | Spartan Coaching',
    description: 'Practical coaching and a private Field Kit for hospice growth professionals.',
    keywords: 'Spartan Coaching, hospice sales coaching',
  },
  '/login': {
    title: 'Client Login | Spartan Coaching',
    description: 'Sign in to your Spartan Field Kit account.',
    keywords: 'client login, Field Kit access',
  },
  '/request-access': {
    title: 'Request Field Kit Access | Spartan Coaching',
    description: 'Request evaluation access to the private Spartan Field Kit for hospice growth professionals and organizations.',
    keywords: 'Field Kit access, hospice sales tools evaluation',
  },
  '/portal': {
    title: 'Field Kit Home | Spartan Coaching',
    description: 'Your private Spartan Field Kit command center.',
    keywords: 'Field Kit, client portal',
  },
  '/account': {
    title: 'Account | Spartan Coaching',
    description: 'Manage your Spartan Field Kit access and team seats.',
    keywords: 'account, Field Kit membership',
  },
  '/tools/playbooks': {
    title: 'Sales Playbook Generator | Spartan Coaching',
    description: 'Generate customized hospice sales playbooks instantly. Get proven strategies, talking points, and action plans for any sales scenario. Try free.',
    keywords: 'sales playbook generator, hospice sales strategies, talking points, sales playbook',
  },
  '/tools/objections': {
    title: 'Objection Handler | Spartan Coaching',
    description: 'Master hospice sales objections with confidence. Get expert responses that address concerns and keep conversations moving. Win more deals.',
    keywords: 'objection handling, sales objections, hospice objections, empathetic responses',
  },
  '/tools/research': {
    title: 'Territory Research | Spartan Coaching',
    description: 'Research your territory with expert insights. Get data on facilities, demographics, and market opportunities to maximize hospice outreach.',
    keywords: 'territory research, sales territory, market research, hospice demographics, facility research',
  },
  '/tools/transcribe': {
    title: 'Call Transcriber | Spartan Coaching',
    description: 'Transcribe hospice sales calls instantly with AI. Capture details, follow-ups, and coaching insights to improve every conversation. Try free.',
    keywords: 'call transcriber, sales call transcription, hospice call notes, AI transcription, meeting transcription',
  },
  '/tools/email-templates': {
    title: 'Email Templates | Spartan Coaching',
    description: 'Generate professional hospice sales emails instantly. Expert-crafted follow-ups, thank yous, and value-adds that build relationships. Start today.',
    keywords: 'email templates, sales emails, follow-up emails, hospice outreach templates',
  },
  '/tools/roi-calculator': {
    title: 'ROI Calculator | Spartan Coaching',
    description: 'Calculate ROI from Spartan Coaching for your hospice organization. Estimate revenue growth, referral increases, and improved conversion rates.',
    keywords: 'ROI calculator, hospice ROI, sales coaching ROI, revenue calculator, hospice revenue growth',
  },
  '/tools/role-play': {
    title: 'AI Role-Play Practice | Spartan Coaching',
    description: 'Practice hospice sales conversations with AI-powered role-play scenarios. Get real-time coaching feedback on your approach, empathy, and strategy.',
    keywords: 'role-play practice, sales simulation, AI coaching, conversation practice, hospice sales training',
  },
  '/drills': {
    title: 'Daily Coaching Drills | Spartan Coaching',
    description: 'Sharpen your hospice sales skills with daily practice drills. Build habits that lead to consistent performance with exercises in objection handling, prospecting, and more.',
    keywords: 'daily drills, sales practice, coaching exercises, hospice sales habits, daily training',
  },
  '/resources': {
    title: 'Training Resources | Spartan Coaching',
    description: 'Download proven training materials for hospice sales. Scripts, templates, checklists, and guides to accelerate your team\'s success.',
    keywords: 'training resources, sales scripts, templates, checklists, hospice sales guides',
  },
  '/resources/weekly-plan': {
    title: 'Weekly Action Plan | Spartan Coaching',
    description: 'Structure your hospice sales week with a proven action plan. Prioritize activities, track progress, and maximize results. Download now.',
    keywords: 'weekly plan, sales action plan, activity planning, hospice sales productivity',
  },
  '/resources/quick-start-guide': {
    title: 'Quick Start Guide | Spartan Coaching',
    description: 'Master hospice sales fundamentals fast. Step-by-step guide covering essential skills, processes, and best practices. Start today.',
    keywords: 'quick start guide, hospice sales basics, getting started, sales fundamentals',
  },
  '/resources/objection-cards': {
    title: 'Objection Response Cards | Spartan Coaching',
    description: 'Master objections with ready-to-use response cards for common hospice sales challenges. Practice and win more deals. Download now.',
    keywords: 'objection cards, response cards, sales objections, hospice sales practice',
  },
  '/resources/territory-template': {
    title: 'Territory Planning Template | Spartan Coaching',
    description: 'Organize your hospice territory strategically. Map accounts, track progress, identify opportunities, and maximize results. Try now.',
    keywords: 'territory template, territory planning, account mapping, hospice sales territory',
  },
  '/resources/metrics-dashboard': {
    title: 'Sales Metrics Dashboard | Spartan Coaching',
    description: 'Track your hospice sales performance in real-time. Monitor referrals, conversions, and growth. Measure progress and improve results.',
    keywords: 'sales metrics, performance dashboard, hospice sales KPIs, referral tracking',
  },
  '/articles': {
    title: 'Articles & Insights | Spartan Coaching',
    description: 'Expert thought leadership on hospice sales excellence. Get insights on strategy, empathy, and building referral partnerships.',
    keywords: 'hospice sales articles, thought leadership, sales insights, industry articles',
  },
  '/podcasts': {
    title: 'Coaching Podcasts | Spartan Coaching',
    description: 'Learn from expert coaching episodes on hospice sales strategies and real-world scenarios. Listen and grow your skills.',
    keywords: 'coaching podcasts, hospice sales podcast, sales training episodes, coaching tips',
  },
  '/testimonials': {
    title: 'Client Testimonials | Spartan Coaching',
    description: 'See how hospice organizations transformed sales performance with Spartan Coaching. Real results, proven success, measurable growth.',
    keywords: 'testimonials, client results, hospice sales success, coaching results',
  },
  '/about': {
    title: 'About | Spartan Coaching',
    description: 'Meet our team of hospice sales experts. 15+ years of experience helping providers reach more patients and grow revenue.',
    keywords: 'about Spartan Coaching, hospice sales experts, coaching team, mission',
  },
  '/admin': {
    title: 'Admin Dashboard | Spartan Coaching',
    description: 'Manage Spartan Coaching content, analytics, and customer inquiries in one centralized dashboard. Monitor platform performance and engagement.',
    keywords: 'admin dashboard, content management, analytics dashboard, inquiry management',
  },
  '/faq': {
    title: 'Frequently Asked Questions | Spartan Coaching',
    description: 'Get answers to common questions about hospice sales coaching, program details, pricing, and how Spartan Coaching helps transform sales performance.',
    keywords: 'hospice coaching FAQ, sales training questions, coaching cost, hospice sales coaching process',
  },
  '/terms': {
    title: 'Terms of Service | Spartan Coaching',
    description: 'Terms of Service for Spartan Coaching hospice sales consulting platform. Review our terms governing use of our website, tools, and services.',
    keywords: 'terms of service, legal terms, Spartan Coaching terms',
  },
  '/disclaimer': {
    title: 'Disclaimer | Spartan Coaching',
    description: 'Important disclaimers regarding Spartan Coaching services, AI tools, and educational content. Our services are for informational purposes.',
    keywords: 'disclaimer, legal disclaimer, consulting disclaimer, AI tools disclaimer',
  },
  '/privacy': {
    title: 'Privacy Policy | Spartan Coaching',
    description: 'Privacy Policy for Spartan Coaching. Learn how we collect, use, and protect your personal information on our hospice sales consulting platform.',
    keywords: 'privacy policy, data protection, Spartan Coaching privacy',
  },
  '/baa': {
    title: 'HIPAA Business Associate Agreement | Spartan Coaching',
    description: 'Review our HIPAA Business Associate Agreement. Spartan Coaching safeguards Protected Health Information with full HIPAA and HITECH Act compliance.',
    keywords: 'HIPAA BAA, business associate agreement, PHI protection, HIPAA compliance, hospice data security',
  },
  '/legal': {
    title: 'Legal Agreements | Spartan Coaching',
    description: 'Review and digitally sign consulting engagement agreements including HIPAA BAA, Services Contract, NDA, EMR Access, and more.',
    keywords: 'legal agreements, consulting contracts, HIPAA BAA, NDA, hospice consulting agreements',
  },
  '/contract': {
    title: 'Services Contract Agreement | Spartan Coaching',
    description: 'Review our consulting services contract covering scope, fees, confidentiality, and terms for hospice sales coaching and training engagements.',
    keywords: 'services contract, consulting agreement, hospice consulting terms, coaching contract',
  },
  '/nda': {
    title: 'Non-Disclosure Agreement | Spartan Coaching',
    description: 'Mutual Non-Disclosure Agreement protecting confidential business information exchanged during hospice sales consulting engagements.',
    keywords: 'NDA, non-disclosure agreement, confidentiality agreement, mutual NDA, hospice consulting',
  },
  '/emr-access': {
    title: 'EMR/Data Access Agreement | Spartan Coaching',
    description: 'Terms governing consultant access to your EMR system including security requirements, permitted use, and credential management policies.',
    keywords: 'EMR access agreement, data access, electronic medical records, hospice EMR, system access terms',
  },
  '/conflict-of-interest': {
    title: 'Conflict of Interest Disclosure | Spartan Coaching',
    description: 'Transparency disclosure about working with multiple hospice organizations, information barriers, and conflict management policies.',
    keywords: 'conflict of interest, disclosure, consulting ethics, information barriers, hospice consulting',
  },
  '/liability-waiver': {
    title: 'Liability Waiver | Spartan Coaching',
    description: 'Hold harmless agreement covering consulting services, on-site activities, and implementation responsibility for hospice sales training.',
    keywords: 'liability waiver, hold harmless, indemnification, consulting liability, risk acknowledgment',
  },
  '/testimonial-release': {
    title: 'Testimonial / Case Study Release | Spartan Coaching',
    description: 'Permission form for using client testimonials and case study results in marketing materials with review, approval, and anonymity options.',
    keywords: 'testimonial release, case study permission, marketing consent, client testimonial agreement',
  },
  '/learn/knowledge-base': {
    title: 'Hospice Knowledge Base | Spartan Coaching',
    description: 'The definitive reference for hospice terminology, regulations, eligibility criteria, clinical concepts, and sales terminology. Searchable glossary for hospice professionals.',
    keywords: 'hospice glossary, hospice terminology, hospice eligibility criteria, Medicare hospice benefit, hospice regulations, clinical terms',
  },
  '/contact': {
    title: 'Contact Us | Spartan Coaching',
    description: 'Reach out to Spartan Coaching for hospice sales consulting, team training, or coaching. No pressure, no obligation. Tell us what you need and we will get back to you.',
    keywords: 'contact Spartan Coaching, hospice consulting inquiry, sales coaching contact, get in touch',
  },
  '/compliance': {
    title: 'Compliance and Ethics | Spartan Coaching',
    description: 'Our ethical boundaries, compliance posture, and what we will never train. Spartan Coaching operates within clear guidelines to protect patients, providers, and the profession.',
    keywords: 'compliance, ethics, hospice compliance, sales ethics, PHI protection, HIPAA, ethical coaching',
  },
  '/quiz': {
    title: 'Hospice Knowledge Quiz | Spartan Coaching',
    description: 'Test your hospice sales knowledge with our interactive quiz. Covers eligibility, Medicare benefit, regulations, and clinical terminology. See how you score.',
    keywords: 'hospice knowledge quiz, hospice sales test, Medicare hospice benefit quiz, hospice eligibility quiz, sales training quiz',
  },
  '/manifesto': {
    title: 'The Spartan Manifesto | Spartan Coaching',
    description: 'The principles that guide every Spartan-trained hospice sales professional. Our commitment to discipline, empathy, and ethical patient advocacy.',
    keywords: 'Spartan Manifesto, hospice sales principles, sales ethics, patient advocacy, Spartan Coaching values',
  },
  '/tools/activity-calculator': {
    title: 'Activity Calculator | Spartan Coaching',
    description: 'Calculate the exact number of calls, visits, and touches needed to hit your hospice census goals. Build a data-driven weekly activity plan.',
    keywords: 'activity calculator, hospice sales activity, sales goal calculator, census calculator, weekly sales plan',
  },
};

const defaultConfig: SEOConfig = {
  title: 'Spartan Coaching | Hospice Sales Training',
  description: 'Expert hospice sales consulting and training. Coaching, tools, and resources to help your team get eligible patients into care earlier.',
  keywords: 'hospice sales, sales training, consulting, coaching',
  ogImage: '/hero-poster.jpg',
};

export function getSEOConfig(path: string): SEOConfig {
  return seoDefaults[path] || defaultConfig;
}
