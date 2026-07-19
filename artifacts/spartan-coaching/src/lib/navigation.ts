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

// Single source of truth for the site's navigable pages.
// Header dropdowns, the mobile menu, site search, and the command palette
// all derive from these lists so they can't drift apart.

export const navSections: SiteNavSection[] = [
  {
    title: "Solutions",
    items: [
      { path: "/services", label: "Services", description: "Strategic services and consulting", icon: Briefcase },
      { path: "/programs", label: "Programs", description: "Training programs for hospice providers", icon: GraduationCap },
      { path: "/method", label: "The Spartan Method", description: "Our proven sales methodology", icon: Shield },
      { path: "/manifesto", label: "The Spartan Ethos", description: "What it means to be Spartan", icon: Flame },
    ],
  },
  {
    title: "AI Tools",
    items: [
      { path: "/tools", label: "AI Field Kit", description: "Expert sales tools", icon: Wrench },
      { path: "/tools/playbooks", label: "Sales Playbooks", description: "Generate custom sales playbooks", icon: Lightbulb },
      { path: "/tools/objections", label: "Objection Handler", description: "Get strategies for handling objections", icon: MessageCircle },
      { path: "/tools/research", label: "Territory Research", description: "Research facilities and territories", icon: Search },
      { path: "/tools/email-templates", label: "Email Templates", description: "Create professional email templates", icon: Mail },
      { path: "/tools/role-play", label: "Role-Play Practice", description: "Practice sales conversations with AI", icon: Users },
      { path: "/tools/transcribe", label: "Call Transcriber", description: "Transcribe and summarize sales calls and meetings", icon: Mic },
      { path: "/tools/cold-call-script", label: "Cold Call Script Builder", description: "Build a tailored cold call script", icon: Phone },
      { path: "/tools/weekly-plan-builder", label: "Weekly Plan Builder", description: "Build your weekly sales plan", icon: CalendarDays },
      { path: "/brand-video", label: "Brand Video", description: "Share the Spartan brand video with prospects", icon: Video },
    ],
  },
  {
    title: "Calculators",
    items: [
      { path: "/tools/roi-calculator", label: "ROI Calculator", description: "Estimate coaching impact on revenue", icon: Calculator },
      { path: "/tools/activity-calculator", label: "Activity Calculator", description: "Convert your admission goal into daily conversation targets", icon: Calculator },
      { path: "/tools/rep-cost-calculator", label: "Rep Cost Calculator", description: "Calculate the true cost of a sales rep", icon: DollarSign },
      { path: "/tools/branch-profitability", label: "Branch Profitability Simulator", description: "Model break-even ADC, staffing, and cash runway for your branch", icon: Calculator },
    ],
  },
  {
    title: "Learn",
    items: [
      { path: "/learn/knowledge-base", label: "Knowledge Base", description: "Hospice terminology and regulations reference", icon: BookOpen },
      { path: "/quiz", label: "Knowledge Quiz", description: "Test your hospice sales knowledge with 20 questions", icon: HelpCircle },
      { path: "/resources", label: "Training Resources", description: "Downloadable templates, scripts, checklists, and guides", icon: FolderOpen },
      { path: "/drills", label: "Daily Drills", description: "Daily coaching exercises", icon: Flame },
      { path: "/podcasts", label: "Podcasts", description: "Coaching podcasts and expert insights", icon: Headphones },
      { path: "/articles", label: "Articles", description: "Industry insights and thought leadership", icon: FileText },
      { path: "/testimonials", label: "Testimonials", description: "Client success stories", icon: MessageSquare },
      { path: "/faq", label: "FAQ", description: "Common questions answered", icon: HelpCircle },
    ],
  },
  {
    title: "Company",
    items: [
      { path: "/about", label: "About", description: "Learn about Spartan Coaching", icon: Info },
      { path: "/contact", label: "Contact", description: "Get in touch with Spartan Coaching", icon: Phone },
    ],
  },
];

// Navigable pages that aren't in the header menus but should still be searchable.
export const additionalPages: SiteNavItem[] = [
  { path: "/", label: "Home", description: "Main landing page", icon: Home },
  { path: "/resources/weekly-plan", label: "Weekly Plan Template", description: "Weekly sales planning template", icon: ClipboardList },
  { path: "/resources/activity-tracker", label: "Activity Tracker", description: "Track your daily sales activity", icon: ClipboardList },
  { path: "/resources/quick-start-guide", label: "Quick Start Guide", description: "Get started with Spartan Coaching", icon: BookOpen },
  { path: "/resources/objection-cards", label: "Objection Cards", description: "Printable objection handling cards", icon: ClipboardList },
  { path: "/resources/territory-template", label: "Territory Template", description: "Territory planning template", icon: ClipboardList },
  { path: "/resources/metrics-dashboard", label: "Metrics Dashboard", description: "Track your key sales metrics", icon: ClipboardList },
  { path: "/privacy", label: "Privacy Policy", description: "How we handle your data", icon: Lock },
  { path: "/terms", label: "Terms of Service", description: "Terms governing use of our services", icon: ScrollText },
  { path: "/disclaimer", label: "Disclaimer", description: "Important disclaimers and notices", icon: ScrollText },
  { path: "/legal", label: "Legal Agreements", description: "Contracts, NDAs, and legal documents", icon: Scale },
  { path: "/compliance", label: "HIPAA Compliance", description: "Compliance and data practices", icon: Shield },
  { path: "/admin", label: "Admin", description: "Admin dashboard", icon: Lock },
];

function dedupeByPath(items: SiteNavItem[]): SiteNavItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
}

// Every navigable page, deduped — this is the site search index.
export const allSearchablePages: SiteNavItem[] = dedupeByPath([
  ...additionalPages.filter((p) => p.path === "/"),
  ...navSections.flatMap((section) => section.items),
  ...additionalPages.filter((p) => p.path !== "/"),
]);
