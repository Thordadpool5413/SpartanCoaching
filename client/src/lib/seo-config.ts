interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

const seoDefaults: Record<string, SEOConfig> = {
  '/': {
    title: 'Spartan Coaching | Elite Hospice Sales Training & AI Tools',
    description: 'Transform your hospice sales team with AI-powered coaching, training resources, and proven methodologies. Get eligible patients into care earlier with the Spartan Method.',
    keywords: 'hospice sales training, hospice marketing, sales coaching, AI sales tools, healthcare sales, hospice referrals',
  },
  '/services': {
    title: 'Coaching Services | Spartan Coaching',
    description: 'Individual and team coaching services designed to elevate hospice sales performance. Build discipline, empathy, and strategy with personalized training programs.',
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
    title: 'AI Sales Tools | Spartan Coaching',
    description: 'AI-powered tools for hospice sales professionals. Generate playbooks, handle objections, research territories, and craft emails instantly.',
    keywords: 'AI sales tools, sales playbook generator, objection handling, territory research, email templates',
  },
  '/tools/playbooks': {
    title: 'AI Playbook Generator | Spartan Coaching',
    description: 'Generate customized hospice sales playbooks with AI. Get step-by-step strategies, talking points, and action plans for any sales scenario.',
    keywords: 'sales playbook generator, AI playbook, hospice sales strategies, talking points',
  },
  '/tools/objections': {
    title: 'AI Objection Handler | Spartan Coaching',
    description: 'Handle hospice sales objections with empathy and confidence. Get AI-generated responses that address concerns and keep conversations moving.',
    keywords: 'objection handling, sales objections, hospice objections, empathetic responses',
  },
  '/tools/research': {
    title: 'Territory Research | Spartan Coaching',
    description: 'Research your sales territory with AI-powered insights. Get data on facilities, demographics, and market opportunities for hospice outreach.',
    keywords: 'territory research, sales territory, market research, hospice demographics, facility research',
  },
  '/tools/transcribe': {
    title: 'Audio Transcription | Spartan Coaching',
    description: 'Transcribe sales calls and meetings instantly with AI. Capture key details, follow-up items, and coaching insights from every conversation.',
    keywords: 'audio transcription, sales call transcription, meeting transcription, AI transcription',
  },
  '/tools/email-templates': {
    title: 'AI Email Templates | Spartan Coaching',
    description: 'Generate professional follow-up emails, thank you notes, and value-add messages for hospice sales outreach. AI-crafted templates that build relationships.',
    keywords: 'email templates, sales emails, follow-up emails, hospice outreach templates',
  },
  '/resources': {
    title: 'Training Resources | Spartan Coaching',
    description: 'Downloadable training materials for hospice sales professionals. Scripts, templates, checklists, and guides to sharpen your skills.',
    keywords: 'training resources, sales scripts, templates, checklists, hospice sales guides',
  },
  '/resources/weekly-plan': {
    title: 'Weekly Action Plan | Spartan Coaching',
    description: 'Structure your hospice sales week with a proven action plan template. Prioritize activities, track progress, and maximize productivity.',
    keywords: 'weekly plan, sales action plan, activity planning, hospice sales productivity',
  },
  '/resources/quick-start-guide': {
    title: 'Quick Start Guide | Spartan Coaching',
    description: 'Get started with hospice sales fundamentals. A step-by-step guide covering essential skills, processes, and best practices.',
    keywords: 'quick start guide, hospice sales basics, getting started, sales fundamentals',
  },
  '/resources/objection-cards': {
    title: 'Objection Response Cards | Spartan Coaching',
    description: 'Ready-to-use objection response cards for common hospice sales challenges. Practice and prepare for every conversation.',
    keywords: 'objection cards, response cards, sales objections, hospice sales practice',
  },
  '/resources/territory-template': {
    title: 'Territory Planning Template | Spartan Coaching',
    description: 'Plan and organize your hospice sales territory with this comprehensive template. Map accounts, track progress, and identify opportunities.',
    keywords: 'territory template, territory planning, account mapping, hospice sales territory',
  },
  '/resources/metrics-dashboard': {
    title: 'Sales Metrics Dashboard | Spartan Coaching',
    description: 'Track your hospice sales performance with key metrics. Monitor referrals, conversions, and growth to measure your progress.',
    keywords: 'sales metrics, performance dashboard, hospice sales KPIs, referral tracking',
  },
  '/articles': {
    title: 'Articles & Insights | Spartan Coaching',
    description: 'Thought leadership articles on hospice sales excellence. Expert insights on strategy, empathy, and building referral partnerships.',
    keywords: 'hospice sales articles, thought leadership, sales insights, industry articles',
  },
  '/podcasts': {
    title: 'Coaching Podcasts | Spartan Coaching',
    description: 'Listen to expert coaching episodes on hospice sales strategies, real-world scenarios, and professional development tips.',
    keywords: 'coaching podcasts, hospice sales podcast, sales training episodes, coaching tips',
  },
  '/testimonials': {
    title: 'Client Testimonials | Spartan Coaching',
    description: 'See results from hospice organizations that have transformed their sales performance with Spartan Coaching. Real stories, real metrics.',
    keywords: 'testimonials, client results, hospice sales success, coaching results',
  },
  '/about': {
    title: 'About | Spartan Coaching',
    description: 'Meet the team behind Spartan Coaching. Over 15 years of hospice sales experience dedicated to helping providers reach more patients.',
    keywords: 'about Spartan Coaching, hospice sales experts, coaching team, mission',
  },
  '/admin': {
    title: 'Admin Dashboard | Spartan Coaching',
    description: 'Admin dashboard for managing content, analytics, and inquiries.',
    keywords: 'admin, dashboard, management',
  },
};

const defaultConfig: SEOConfig = {
  title: 'Spartan Coaching | Hospice Sales Training',
  description: 'AI-enhanced hospice sales training platform. Coaching, tools, and resources to help your team get eligible patients into care earlier.',
  keywords: 'hospice sales, sales training, coaching, AI tools',
};

export function getSEOConfig(path: string): SEOConfig {
  return seoDefaults[path] || defaultConfig;
}
