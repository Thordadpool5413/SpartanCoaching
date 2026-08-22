import type { LucideIcon } from "lucide-react";
import {
  Home,
  Info,
  Briefcase,
  GraduationCap,
  Shield,
  MessageSquare,
  FileText,
  Headphones,
  FolderOpen,
  BookOpen,
  Calculator,
  Lightbulb,
  MessageCircle,
  Search,
  Mic,
  Mail,
  Users,
  Flame,
  Phone,
  Video,
  HelpCircle,
  ScrollText,
  ClipboardList,
  Wrench,
  DollarSign,
  CalendarDays,
  Scale,
  Lock,
} from "lucide-react";

export interface SiteNavItem {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface SiteNavSection {
  title: string;
  items: SiteNavItem[];
}

/**
 * Marketing header nav, dual product restraint:
 * Consulting (human) · Hospice Sales Pro (tools product) · Learn
 * Full tool list remains searchable via additionalPages / allSearchablePages.
 */
export const navSections: SiteNavSection[] = [
  {
    title: "Consulting",
    items: [
      {
        path: "/services",
        label: "Services",
        description: "Coaching and consulting for hospice growth",
        icon: Briefcase,
      },
      {
        path: "/programs",
        label: "Programs",
        description: "Team workshops and growth systems",
        icon: GraduationCap,
      },
      {
        path: "/method",
        label: "The Spartan Method",
        description: "Discipline, empathy, and strategy",
        icon: Shield,
      },
      {
        path: "/manifesto",
        label: "The Spartan Ethos",
        description: "What it means to be Spartan",
        icon: Flame,
      },
      {
        path: "/contact",
        label: "Book a strategy call",
        description: "Talk with Nick about coaching",
        icon: Phone,
      },
    ],
  },
  {
    title: "Hospice Sales Pro",
    items: [
      {
        path: "/hospice-sales-pro",
        label: "Hospice Sales Pro",
        description:
          "Elite recommended $19.99/wk · Standard $14.99/wk · web + iOS",
        icon: Wrench,
      },
      {
        path: "/tools",
        label: "Tools",
        description:
          "Start from intent, visits, objections, week plans, numbers",
        icon: Calculator,
      },
      {
        path: "/resources",
        label: "Field resources",
        description:
          "Work aids: templates, scripts, checklists, not only Learn",
        icon: FolderOpen,
      },
      {
        path: "/register",
        label: "Create account",
        description: "Then subscribe to unlock live tools",
        icon: Lock,
      },
      {
        path: "/request-access",
        label: "Team / evaluation",
        description: "Company seats or arranged evaluation",
        icon: Users,
      },
    ],
  },
  {
    title: "Learn",
    items: [
      {
        path: "/articles",
        label: "Articles",
        description: "Industry insights and fundamentals",
        icon: FileText,
      },
      {
        path: "/podcasts",
        label: "Podcasts",
        description: "Coaching conversations",
        icon: Headphones,
      },
      {
        path: "/method",
        label: "The Spartan Method",
        description: "Discipline, empathy, and strategy",
        icon: Shield,
      },
      {
        path: "/drills",
        label: "Daily drills",
        description: "Practice between visits",
        icon: Flame,
      },
      {
        path: "/faq",
        label: "FAQ",
        description: "Common questions",
        icon: HelpCircle,
      },
    ],
  },
];

/** Searchable pages not all shown in marketing dropdowns */
export const additionalPages: SiteNavItem[] = [
  { path: "/", label: "Home", description: "Main landing page", icon: Home },
  {
    path: "/about",
    label: "About",
    description: "About Spartan Coaching and Nick Lynch",
    icon: Info,
  },
  {
    path: "/contact",
    label: "Contact",
    description: "Book a strategy call",
    icon: Phone,
  },
  {
    path: "/portal",
    label: "Portal",
    description: "Hospice Sales Pro home, next action & tools",
    icon: Home,
  },
  {
    path: "/hospice-sales-pro",
    label: "Hospice Sales Pro",
    description: "Elite recommended $19.99/wk · Standard $14.99/wk",
    icon: Wrench,
  },
  {
    path: "/membership",
    label: "Hospice Sales Pro (legacy URL)",
    description: "Redirects to Hospice Sales Pro",
    icon: DollarSign,
  },
  {
    path: "/field-kit",
    label: "Legacy product URL",
    description: "Redirects to Hospice Sales Pro",
    icon: Flame,
  },
  {
    path: "/account",
    label: "Account & billing",
    description: "Subscribe, cancel, manage Hospice Sales Pro",
    icon: DollarSign,
  },
  {
    path: "/login",
    label: "Client Login",
    description: "Sign in to Hospice Sales Pro / portal",
    icon: Lock,
  },
  {
    path: "/tools/sales-workflow",
    label: "Sales Command Center",
    description: "Daily account workflow spine",
    icon: Wrench,
  },
  {
    path: "/tools/ai",
    label: "Advanced library",
    description: "Specialized runs and clinical vault",
    icon: BookOpen,
  },
  {
    path: "/tools/playbooks",
    label: "Sales Playbooks",
    description: "Generate custom sales playbooks",
    icon: Lightbulb,
  },
  {
    path: "/tools/objections",
    label: "Objection Handler",
    description: "Field-ready objection responses",
    icon: MessageCircle,
  },
  {
    path: "/tools/research",
    label: "Territory Research",
    description: "Research facilities and territories",
    icon: Search,
  },
  {
    path: "/tools/email-templates",
    label: "Email Templates",
    description: "Professional follow-up emails",
    icon: Mail,
  },
  {
    path: "/tools/role-play",
    label: "Role-Play Practice",
    description: "Practice hard conversations",
    icon: Users,
  },
  {
    path: "/tools/transcribe",
    label: "Call Transcriber",
    description: "Transcribe and review calls",
    icon: Mic,
  },
  {
    path: "/tools/cold-call-script",
    label: "Cold Call Script Builder",
    description: "Openers and next-step asks",
    icon: Phone,
  },
  {
    path: "/tools/weekly-plan-builder",
    label: "Weekly Plan Builder",
    description: "Monday–Friday territory plan",
    icon: CalendarDays,
  },
  {
    path: "/tools/roi-calculator",
    label: "ROI Calculator",
    description: "Model coaching impact",
    icon: Calculator,
  },
  {
    path: "/tools/activity-calculator",
    label: "Activity Calculator",
    description: "Admission goal to daily targets",
    icon: Calculator,
  },
  {
    path: "/tools/rep-cost-calculator",
    label: "Rep Cost Calculator",
    description: "True cost of a sales rep",
    icon: DollarSign,
  },
  {
    path: "/tools/branch-profitability",
    label: "Branch Profitability Simulator",
    description: "ADC, staffing, runway",
    icon: Calculator,
  },
  {
    path: "/brand-video",
    label: "Brand Video",
    description: "Share the Spartan brand video",
    icon: Video,
  },
  {
    path: "/learn/knowledge-base",
    label: "Knowledge Base",
    description: "Hospice reference",
    icon: BookOpen,
  },
  {
    path: "/quiz",
    label: "Knowledge Quiz",
    description: "Test hospice sales knowledge",
    icon: HelpCircle,
  },
  {
    path: "/drills",
    label: "Daily Drills",
    description: "Daily coaching exercises",
    icon: Flame,
  },
  {
    path: "/resources/weekly-plan",
    label: "Weekly Plan Template",
    description: "Weekly sales planning template",
    icon: ClipboardList,
  },
  {
    path: "/resources/activity-tracker",
    label: "Activity Tracker",
    description: "Track daily sales activity",
    icon: ClipboardList,
  },
  {
    path: "/resources/quick-start-guide",
    label: "Quick Start Guide",
    description: "Get started with Spartan",
    icon: BookOpen,
  },
  {
    path: "/resources/objection-cards",
    label: "Objection Cards",
    description: "Printable objection cards",
    icon: ClipboardList,
  },
  {
    path: "/resources/territory-template",
    label: "Territory Template",
    description: "Territory planning template",
    icon: ClipboardList,
  },
  {
    path: "/resources/metrics-dashboard",
    label: "Metrics Dashboard",
    description: "Key sales metrics",
    icon: ClipboardList,
  },
  {
    path: "/privacy",
    label: "Privacy Policy",
    description: "How we handle data",
    icon: Lock,
  },
  {
    path: "/terms",
    label: "Terms of Service",
    description: "Terms of use",
    icon: ScrollText,
  },
  {
    path: "/disclaimer",
    label: "Disclaimer",
    description: "Important notices",
    icon: ScrollText,
  },
  {
    path: "/legal",
    label: "Legal Agreements",
    description: "Contracts and legal documents",
    icon: Scale,
  },
  {
    path: "/compliance",
    label: "Compliance & Ethics",
    description: "No PHI stance and practices",
    icon: Shield,
  },
];

export const allSearchablePages: SiteNavItem[] = [
  ...navSections.flatMap((s) => s.items),
  ...additionalPages,
].filter(
  (item, index, arr) => arr.findIndex((x) => x.path === item.path) === index,
);
