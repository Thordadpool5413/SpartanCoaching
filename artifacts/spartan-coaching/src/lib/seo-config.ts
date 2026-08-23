import seoRoutes from "../../public/seo-routes.json";

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  /** Private / app shells should not be indexed */
  noIndex?: boolean;
}

export const SITE_NAME = 'Spartan Coaching';
/** The one public origin used by crawlers, social previews, and iPhone handoff links. */
export const SITE_ORIGIN = 'https://spartanhospicecoaching.com';
export const DEFAULT_OG_IMAGE = '/og-image.png';

/** Paths (prefix match) that should never appear in search results */
export const NOINDEX_PREFIXES = seoRoutes.noindexPrefixes;

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
    title: 'Spartan Coaching | Hospice Sales Consulting & Hospice Sales Pro',
    description:
      'Hospice growth authority and consulting from Nick Lynch. Hospice Sales Pro turns the system into daily execution on web and iPhone. Elite is recommended at $19.99/week; Standard is $14.99/week.',
    keywords:
      'hospice sales consulting, hospice sales coaching, hospice growth coaching, Hospice Sales Pro, Nick Lynch, referral development',
  },
  '/services': {
    title: 'Coaching Services | Spartan Coaching',
    description:
      'Hospice growth consulting, leadership systems, and Hospice Sales Pro. Elite is recommended at $19.99/week; Standard is $14.99/week; team seats are contracted.',
    keywords: 'hospice sales coaching, Hospice Sales Pro, leadership coaching, consulting services',
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
      'Discipline, Empathy, and Strategy — field-tested hospice sales method. Practice it with Hospice Sales Pro tools between sessions.',
    keywords: 'Spartan Method, sales methodology, hospice sales framework, Hospice Sales Pro',
  },
  '/tools': {
    title: 'Hospice Sales Pro Tools | Spartan Coaching',
    description:
      'Preview Hospice Sales Pro tools free. Elite is recommended at $19.99/week and Standard remains available at $14.99/week. Run field tools on web and iPhone.',
    keywords: 'Hospice Sales Pro tools, sales playbooks, objection handling, territory research, AI coaching tools',
  },
  '/welcome': {
    title: 'Welcome | Spartan Coaching',
    description: 'Practical consulting and Hospice Sales Pro tools for hospice growth professionals.',
    keywords: 'Spartan Coaching, hospice sales coaching',
  },
  '/login': {
    title: 'Client Login | Spartan Coaching',
    description: 'Sign in to your Hospice Sales Pro account and portal.',
    keywords: 'client login, Hospice Sales Pro access, portal',
    noIndex: true,
  },
  '/request-access': {
    title: 'Team & Evaluation Access | Spartan Coaching',
    description:
      'Request team or evaluation access for Hospice Sales Pro. Individuals can choose recommended Elite at $19.99/week or Standard at $14.99/week. Teams continue under contract.',
    keywords: 'Hospice Sales Pro team access, request evaluation, hospice sales tools, company seats, $14.99 week',
  },
  '/portal': {
    title: 'Portal | Spartan Coaching',
    description: 'Your Hospice Sales Pro portal — next action, tools, and resources.',
    keywords: 'portal, Hospice Sales Pro, client home',
    noIndex: true,
  },
  '/account': {
    title: 'Account | Spartan Coaching',
    description: 'Manage Hospice Sales Pro, choose recommended Elite at $19.99/week or Standard at $14.99/week, cancel anytime, and manage team seats.',
    keywords: 'account, Hospice Sales Pro, cancel subscription',
    noIndex: true,
  },
  '/hospice-sales-pro': {
    title: 'Hospice Sales Pro Elite $19.99/week | Spartan Coaching',
    description:
      'Hospice Sales Pro Elite is recommended at $19.99/week. Standard remains available at $14.99/week. Use the Spartan system daily on web and iPhone.',
    keywords: 'Hospice Sales Pro, $14.99 week, hospice sales tools, team seats, cancel anytime',
  },
  '/app': {
    title: 'Hospice Sales Pro for iPhone | Spartan Coaching',
    description:
      'Take Hospice Sales Pro into the field on iPhone. Use the same account for Command Center, practice tools, plans, and resources.',
    keywords: 'Hospice Sales Pro iPhone app, hospice sales field tools, hospice sales coaching app',
  },
  '/field-kit-membership': {
    title: 'Hospice Sales Pro Elite $19.99/week | Spartan Coaching',
    description:
      'Choose recommended Hospice Sales Pro Elite at $19.99/week or Standard at $14.99/week. Create an account, subscribe, and cancel anytime.',
    keywords: 'Hospice Sales Pro, $14.99 week, hospice sales tools, team seats, cancel anytime',
  },
  '/pricing/field-kit': {
    title: 'Hospice Sales Pro Elite and Standard | Spartan Coaching',
    description:
      'Hospice Sales Pro pricing: recommended Elite is $19.99/week, Standard is $14.99/week, and team seats use a hospice contract.',
    keywords: 'Hospice Sales Pro pricing, hospice consulting tools, $14.99 week',
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
  '/resources/activity-tracker': {
    title: 'Activity Tracker | Spartan Coaching',
    description: 'Plan and review hospice sales activity with a focused weekly tracker.',
    keywords: 'hospice sales activity tracker, weekly activity planning',
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
    description: 'Hospice Sales Pro access operations.',
    keywords: 'admin',
    noIndex: true,
  },
  '/faq': {
    title: 'FAQ | Spartan Coaching',
    description:
      'Hospice Sales Pro access, evaluation trials, recommended Elite at $19.99/week, Standard at $14.99/week, team contracts, and no PHI compliance.',
    keywords: 'hospice coaching FAQ, Hospice Sales Pro access, evaluation trial, $14.99 week, cancel subscription',
  },
  '/terms': {
    title: 'Terms of Service | Spartan Coaching',
    description: 'Terms governing use of the Spartan Coaching website, Hospice Sales Pro tools, and consulting services.',
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
      'How Spartan Coaching collects and protects information — contact forms, Hospice Sales Pro accounts, access requests. No PHI in tools.',
    keywords: 'privacy policy, data protection, Hospice Sales Pro privacy',
  },
  '/baa': {
    title: 'HIPAA Business Associate Agreement | Spartan Coaching',
    description:
      'HIPAA Business Associate Agreement for corporate hospice engagements. Platform does not store PHI; BAA available for procurement.',
    keywords: 'HIPAA BAA, business associate agreement, PHI',
  },
  '/trust': {
    title: 'Trust Center | Spartan Coaching',
    description:
      'Review Spartan Coaching’s privacy, security, no-PHI stance, and responsible-use commitments.',
    keywords: 'Spartan Coaching trust center, privacy, security, no PHI',
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
      'Book a strategy call or ask about consulting and Hospice Sales Pro. No pressure — honest conversation about what would help your team.',
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
    'Expert hospice sales consulting and Hospice Sales Pro tools. Coaching that holds when the week is hard.',
  keywords: 'hospice sales, sales coaching, consulting, Hospice Sales Pro',
  ogImage: DEFAULT_OG_IMAGE,
};

/** True only when the route has intentional, route-specific crawl metadata. */
export function hasExplicitSEOConfig(path: string): boolean {
  const clean = path.split('?')[0].split('#')[0] || '/';
  return Boolean(seoDefaults[clean]);
}

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
export const PUBLIC_SITEMAP_PATHS = seoRoutes.publicPaths;
