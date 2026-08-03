export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  /** Private / app shells should not be indexed */
  noIndex?: boolean;
}

export const SITE_NAME = 'Spartan Coaching';
export const DEFAULT_OG_IMAGE = '/og-image.png';

/** Paths (prefix match) that should never appear in search results */
export const NOINDEX_PREFIXES = [
  '/admin',
  '/portal',
  '/account',
  '/magic-login',
  '/set-password',
  '/forgot-password',
  '/reset-password',
  '/sign/',
  '/assessment/',
  '/assessment-results/',
  '/assess/',
];

export function isNoIndexPath(path: string): boolean {
  const clean = path.split('?')[0].split('#')[0] || '/';
  return NOINDEX_PREFIXES.some((p) => {
    if (p.endsWith('/')) {
      return clean.startsWith(p);
    }
    return clean === p || clean.startsWith(`${p}/`);
  });
}

const seoDefaults: Record<string, SEOConfig> = {
  '/': {
    title: 'Spartan Coaching | Hospice Sales Consulting & Membership',
    description:
      'Practical hospice growth coaching from Nick Lynch. Consulting for teams — and Spartan Membership for tools & resources on web and iPhone ($14.99/week, cancel anytime).',
    keywords:
      'hospice sales consulting, hospice sales coaching, hospice growth coaching, Spartan Membership, Nick Lynch, referral development',
  },
  '/services': {
    title: 'Coaching Services | Spartan Coaching',
    description:
      'Hospice growth consulting: individual coaching, leadership systems, and Spartan Membership tools. Individual membership $14.99/week; team seats under contract.',
    keywords: 'hospice sales coaching, Spartan Membership, leadership coaching, consulting services',
  },
  '/programs': {
    title: 'Training Programs | Spartan Coaching',
    description:
      'Structured hospice sales programs for organizations. Workshops, growth strategy, and one playbook the whole team can run.',
    keywords: 'hospice training programs, sales team training, healthcare sales programs',
  },
  '/method': {
    title: 'The Spartan Method | Spartan Coaching',
    description:
      'Discipline, Empathy, and Strategy — field-tested hospice sales method. Practice it with membership tools between sessions.',
    keywords: 'Spartan Method, sales methodology, hospice sales framework, Spartan Membership',
  },
  '/tools': {
    title: 'Membership Tools | Spartan Coaching',
    description:
      'Preview membership tools free. Subscribe for $14.99/week to run playbooks, objections, role-play, calculators, and weekly planning live. No PHI in consumer tools.',
    keywords: 'hospice membership tools, sales playbooks, objection handling, territory research, AI coaching tools',
  },
  '/welcome': {
    title: 'Welcome | Spartan Coaching',
    description: 'Practical consulting and Spartan Membership tools for hospice growth professionals.',
    keywords: 'Spartan Coaching, hospice sales coaching',
  },
  '/login': {
    title: 'Client Login | Spartan Coaching',
    description: 'Sign in to your Spartan Membership account and portal.',
    keywords: 'client login, membership access, portal',
    noIndex: true,
  },
  '/request-access': {
    title: 'Team & Evaluation Access | Spartan Coaching',
    description:
      'Request team or evaluation access for Spartan Membership. Individuals can create an account and subscribe self-serve for $14.99/week. Teams continue under contract.',
    keywords: 'membership team access, request evaluation, hospice sales tools, company seats, $14.99 week',
  },
  '/portal': {
    title: 'Portal | Spartan Coaching',
    description: 'Your Spartan Membership portal — next action, tools, and resources.',
    keywords: 'portal, membership, client home',
    noIndex: true,
  },
  '/account': {
    title: 'Account | Spartan Coaching',
    description: 'Manage Spartan Membership, subscribe $14.99/week, cancel anytime, and team seats.',
    keywords: 'account, Spartan Membership, cancel subscription',
    noIndex: true,
  },
  '/membership': {
    title: 'Spartan Membership $14.99/week | Spartan Coaching',
    description:
      'Spartan Membership $14.99/week — tools & resources on web and iPhone. Create account, subscribe, cancel anytime. Provider seats weekly under contract. Coaching engagement-based.',
    keywords: 'Spartan Membership, $14.99 week, hospice sales tools, team seats, cancel anytime',
  },
  '/field-kit-membership': {
    title: 'Spartan Membership $14.99/week | Spartan Coaching',
    description:
      'Spartan Membership $14.99/week — create account, subscribe, cancel anytime. Provider seats weekly under contract. Coaching engagement-based.',
    keywords: 'Spartan Membership, $14.99 week, hospice sales tools, team seats, cancel anytime',
  },
  '/pricing/field-kit': {
    title: 'Spartan Membership $14.99/week | Spartan Coaching',
    description:
      'Membership pricing: individuals $14.99/week self-serve; team seats under hospice contract.',
    keywords: 'Spartan Membership pricing, hospice consulting tools, weekly membership',
  },
  '/tools/playbooks': {
    title: 'Sales Playbook Generator | Spartan Coaching',
    description:
      'Generate customized hospice sales playbooks — strategies, talking points, and action plans for field scenarios. Client and evaluator access.',
    keywords: 'sales playbook generator, hospice sales strategies, talking points',
    noIndex: true,
  },
  '/tools/objections': {
    title: 'Objection Handler | Spartan Coaching',
    description:
      'Master hospice sales objections with confident, ethical responses that keep conversations moving.',
    keywords: 'objection handling, hospice objections, empathetic responses',
    noIndex: true,
  },
  '/tools/research': {
    title: 'Territory Research | Spartan Coaching',
    description:
      'Research facilities, demographics, and market opportunities to focus hospice outreach.',
    keywords: 'territory research, hospice demographics, facility research',
    noIndex: true,
  },
  '/tools/transcribe': {
    title: 'Call Transcriber | Spartan Coaching',
    description:
      'Transcribe sales calls for coaching notes and follow-ups. Never enter PHI.',
    keywords: 'call transcriber, sales call notes, coaching transcription',
    noIndex: true,
  },
  '/tools/email-templates': {
    title: 'Email Templates | Spartan Coaching',
    description:
      'Professional hospice outreach emails — follow-ups, thank-yous, and value-adds that build referral relationships.',
    keywords: 'email templates, hospice outreach, follow-up emails',
    noIndex: true,
  },
  '/tools/roi-calculator': {
    title: 'ROI Calculator | Spartan Coaching',
    description:
      'Estimate coaching impact on hospice referrals, conversion, and revenue growth.',
    keywords: 'ROI calculator, hospice ROI, sales coaching ROI',
    noIndex: true,
  },
  '/tools/role-play': {
    title: 'AI Role-Play Practice | Spartan Coaching',
    description:
      'Practice hospice sales conversations with AI role-play and coaching feedback on empathy and strategy.',
    keywords: 'role-play practice, sales simulation, AI coaching',
    noIndex: true,
  },
  '/drills': {
    title: 'Daily Coaching Drills | Spartan Coaching',
    description:
      'Daily practice drills for objection handling, prospecting, and field habits.',
    keywords: 'daily drills, sales practice, hospice sales habits',
    noIndex: true,
  },
  '/resources': {
    title: 'Training Resources | Spartan Coaching',
    description:
      'Downloadable scripts, templates, checklists, and guides for hospice sales teams.',
    keywords: 'training resources, sales scripts, hospice sales guides',
  },
  '/resources/weekly-plan': {
    title: 'Weekly Action Plan | Spartan Coaching',
    description: 'Structure your hospice sales week with a proven action plan template.',
    keywords: 'weekly plan, sales action plan, hospice productivity',
  },
  '/resources/quick-start-guide': {
    title: 'Quick Start Guide | Spartan Coaching',
    description: 'Hospice sales fundamentals — essential skills, processes, and best practices.',
    keywords: 'quick start guide, hospice sales basics',
  },
  '/resources/objection-cards': {
    title: 'Objection Response Cards | Spartan Coaching',
    description: 'Ready-to-use response cards for common hospice sales objections.',
    keywords: 'objection cards, hospice sales practice',
  },
  '/resources/territory-template': {
    title: 'Territory Planning Template | Spartan Coaching',
    description: 'Map accounts, track progress, and prioritize hospice territory opportunities.',
    keywords: 'territory template, account mapping',
  },
  '/resources/metrics-dashboard': {
    title: 'Sales Metrics Dashboard | Spartan Coaching',
    description: 'Track referrals, conversions, and growth metrics for hospice sales performance.',
    keywords: 'sales metrics, hospice KPIs, referral tracking',
  },
  '/articles': {
    title: 'Articles & Insights | Spartan Coaching',
    description: 'Thought leadership on hospice sales excellence, strategy, and referral partnerships.',
    keywords: 'hospice sales articles, sales insights',
  },
  '/podcasts': {
    title: 'Coaching Podcasts | Spartan Coaching',
    description: 'Coaching episodes on hospice sales strategies and real-world field scenarios.',
    keywords: 'coaching podcasts, hospice sales podcast',
  },
  '/testimonials': {
    title: 'Client Testimonials | Spartan Coaching',
    description: 'How hospice organizations improved sales execution with Spartan Coaching.',
    keywords: 'testimonials, client results, hospice coaching',
  },
  '/about': {
    title: 'About Nick Lynch | Spartan Coaching',
    description:
      'Nick Lynch founded Spartan Coaching to close the gap between good intentions and field execution in hospice sales. 12+ years hospice-specific leadership. Ethics and structure in the same room.',
    keywords: 'Nick Lynch, about Spartan Coaching, hospice sales coach, founder',
  },
  '/admin': {
    title: 'Admin | Spartan Coaching',
    description: 'Internal admin.',
    keywords: 'admin',
    noIndex: true,
  },
  '/admin/access-desk': {
    title: 'Access Desk | Spartan Coaching',
    description: 'Membership access operations.',
    keywords: 'admin',
    noIndex: true,
  },
  '/faq': {
    title: 'FAQ | Spartan Coaching',
    description:
      'Spartan Membership access, 24h/72h evaluation trials, $14.99/week individual membership, team contracts, cancel anytime, and no-PHI compliance.',
    keywords: 'hospice coaching FAQ, membership access, evaluation trial, $14.99 week, cancel subscription',
  },
  '/terms': {
    title: 'Terms of Service | Spartan Coaching',
    description: 'Terms governing use of the Spartan Coaching website, membership tools, and consulting services.',
    keywords: 'terms of service, Spartan Coaching terms',
  },
  '/disclaimer': {
    title: 'Disclaimer | Spartan Coaching',
    description:
      'Disclaimers for Spartan Coaching services, AI tools, and educational content. Coaching aids only — not clinical advice.',
    keywords: 'disclaimer, consulting disclaimer',
  },
  '/privacy': {
    title: 'Privacy Policy | Spartan Coaching',
    description:
      'How Spartan Coaching collects and protects information — contact forms, membership accounts, access requests. No PHI in tools.',
    keywords: 'privacy policy, data protection, membership privacy',
  },
  '/baa': {
    title: 'HIPAA Business Associate Agreement | Spartan Coaching',
    description:
      'HIPAA Business Associate Agreement for corporate hospice engagements. Platform does not store PHI; BAA available for procurement.',
    keywords: 'HIPAA BAA, business associate agreement, PHI',
  },
  '/legal': {
    title: 'Legal Agreements | Spartan Coaching',
    description: 'Consulting engagement agreements including BAA, Services Contract, NDA, and related forms.',
    keywords: 'legal agreements, consulting contracts',
  },
  '/contract': {
    title: 'Services Contract | Spartan Coaching',
    description: 'Consulting services contract covering scope, fees, confidentiality, and engagement terms.',
    keywords: 'services contract, consulting agreement',
  },
  '/nda': {
    title: 'Non-Disclosure Agreement | Spartan Coaching',
    description: 'Mutual NDA protecting confidential business information in consulting engagements.',
    keywords: 'NDA, confidentiality agreement',
  },
  '/emr-access': {
    title: 'EMR/Data Access Agreement | Spartan Coaching',
    description: 'Terms for limited consultant access to client systems when required by an engagement.',
    keywords: 'EMR access agreement, data access',
  },
  '/conflict-of-interest': {
    title: 'Conflict of Interest Disclosure | Spartan Coaching',
    description: 'How Spartan manages work across multiple hospice organizations and information barriers.',
    keywords: 'conflict of interest, consulting ethics',
  },
  '/liability-waiver': {
    title: 'Liability Waiver | Spartan Coaching',
    description: 'Hold harmless terms for consulting services and training activities.',
    keywords: 'liability waiver, consulting liability',
  },
  '/testimonial-release': {
    title: 'Testimonial Release | Spartan Coaching',
    description: 'Permission form for client testimonials and case study use in marketing.',
    keywords: 'testimonial release, case study permission',
  },
  '/learn/knowledge-base': {
    title: 'Hospice Knowledge Base | Spartan Coaching',
    description:
      'Reference for hospice terminology, eligibility, Medicare benefit concepts, and sales language. Client and evaluator access.',
    keywords: 'hospice glossary, eligibility criteria, Medicare hospice benefit',
    noIndex: true,
  },
  '/contact': {
    title: 'Contact | Spartan Coaching',
    description:
      'Book a strategy call or ask about consulting and Spartan Membership. No pressure — honest conversation about what would help your team.',
    keywords: 'contact Spartan Coaching, hospice consulting inquiry',
  },
  '/compliance': {
    title: 'Compliance and Ethics | Spartan Coaching',
    description:
      'Ethical boundaries, no-PHI stance, and compliance posture. What we coach — and what we will never train.',
    keywords: 'compliance, ethics, no PHI, HIPAA, ethical coaching',
  },
  '/quiz': {
    title: 'Hospice Knowledge Quiz | Spartan Coaching',
    description: 'Test hospice sales knowledge — eligibility, Medicare benefit, and field terminology.',
    keywords: 'hospice knowledge quiz, sales training quiz',
    noIndex: true,
  },
  '/manifesto': {
    title: 'The Spartan Manifesto | Spartan Coaching',
    description:
      'Principles for Spartan-trained hospice growth professionals: discipline, empathy, and ethical patient advocacy.',
    keywords: 'Spartan Manifesto, hospice sales principles, patient advocacy',
  },
  '/tools/activity-calculator': {
    title: 'Activity Calculator | Spartan Coaching',
    description:
      'Convert census goals into calls, visits, and weekly activity targets for hospice sales teams.',
    keywords: 'activity calculator, hospice census goals',
    noIndex: true,
  },
  '/tools/rep-cost-calculator': {
    title: 'Rep Cost Calculator | Spartan Coaching',
    description: 'Calculate the true fully loaded cost of a hospice sales representative.',
    keywords: 'rep cost calculator, sales headcount cost',
    noIndex: true,
  },
  '/tools/branch-profitability': {
    title: 'Branch Profitability Simulator | Spartan Coaching',
    description: 'Model break-even ADC, staffing, and cash runway for a hospice branch.',
    keywords: 'branch profitability, hospice ADC, staffing model',
    noIndex: true,
  },
  '/tools/cold-call-script': {
    title: 'Cold Call Script Builder | Spartan Coaching',
    description: 'Build ethical, hospice-specific cold call scripts for referral outreach.',
    keywords: 'cold call script, hospice outreach',
    noIndex: true,
  },
  '/tools/weekly-plan-builder': {
    title: 'Weekly Plan Builder | Spartan Coaching',
    description: 'Build a focused weekly sales plan for priority accounts and activities.',
    keywords: 'weekly plan builder, territory planning',
    noIndex: true,
  },
  '/set-password': {
    title: 'Set Password | Spartan Coaching',
    description: 'Set your membership account password.',
    keywords: 'set password',
    noIndex: true,
  },
  '/forgot-password': {
    title: 'Forgot Password | Spartan Coaching',
    description: 'Reset your membership account password.',
    keywords: 'forgot password',
    noIndex: true,
  },
  '/reset-password': {
    title: 'Reset Password | Spartan Coaching',
    description: 'Reset your membership account password.',
    keywords: 'reset password',
    noIndex: true,
  },
  '/magic-login': {
    title: 'Magic Login | Spartan Coaching',
    description: 'Secure sign-in link.',
    keywords: 'login',
    noIndex: true,
  },
};

const defaultConfig: SEOConfig = {
  title: 'Spartan Coaching | Hospice Sales Consulting',
  description:
    'Expert hospice sales consulting and membership tools. Coaching that holds when the week is hard.',
  keywords: 'hospice sales, sales coaching, consulting, Spartan Membership',
  ogImage: DEFAULT_OG_IMAGE,
};

export function getSEOConfig(path: string): SEOConfig {
  const clean = path.split('?')[0].split('#')[0] || '/';
  const exact = seoDefaults[clean];
  if (exact) {
    return {
      ...exact,
      ogImage: exact.ogImage || DEFAULT_OG_IMAGE,
      noIndex: exact.noIndex || isNoIndexPath(clean),
    };
  }
  return {
    ...defaultConfig,
    noIndex: isNoIndexPath(clean),
  };
}

/** Public URLs for sitemap generation (relative paths). */
export const PUBLIC_SITEMAP_PATHS = [
  '/',
  '/welcome',
  '/about',
  '/contact',
  '/services',
  '/programs',
  '/method',
  '/manifesto',
  '/tools',
  '/request-access',
  '/field-kit-membership',
  '/pricing/field-kit',
  '/resources',
  '/resources/weekly-plan',
  '/resources/quick-start-guide',
  '/resources/objection-cards',
  '/resources/territory-template',
  '/resources/metrics-dashboard',
  '/resources/activity-tracker',
  '/articles',
  '/podcasts',
  '/testimonials',
  '/faq',
  '/compliance',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/legal',
  '/login',
] as const;
