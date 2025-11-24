export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

const SITE_NAME = "Spartan Coaching";

export const defaultSEO: SEOConfig = {
  title: `${SITE_NAME} - Expert Hospice Sales Training`,
  description: "Elite coaching for hospice sales professionals. Master discipline, empathy, and strategy with AI-powered tools, playbooks, and expert guidance to transform your career.",
  keywords: "hospice sales, healthcare sales coaching, sales training, AI coaching tools, hospice referrals, healthcare sales strategy",
  ogImage: "/spartan-logo.png"
};

export const seoConfig: Record<string, SEOConfig> = {
  '/': {
    title: `${SITE_NAME} - Expert Hospice Sales Training & Coaching`,
    description: "Transform your hospice sales career with elite coaching. Access AI-powered tools, proven playbooks, and expert guidance to master discipline, empathy, and strategy in healthcare sales.",
    keywords: "hospice sales coaching, healthcare sales training, medical sales expert, hospice referrals, sales professional development, AI coaching tools",
    ogImage: "/spartan-logo.png"
  },
  '/services': {
    title: `Our Services - ${SITE_NAME}`,
    description: "Discover comprehensive hospice sales coaching services including personalized training, AI-powered tools, strategic playbooks, and ongoing support to elevate your sales performance.",
    keywords: "hospice sales services, coaching programs, sales training services, healthcare coaching, professional development",
    ogImage: "/spartan-logo.png"
  },
  '/programs': {
    title: `Training Programs - ${SITE_NAME}`,
    description: "Explore our structured training programs designed for hospice sales professionals at every level. From fundamentals to advanced strategies, we help you master every aspect of healthcare sales.",
    keywords: "sales training programs, hospice training, coaching curriculum, professional development programs, healthcare sales courses",
    ogImage: "/spartan-logo.png"
  },
  '/method': {
    title: `Our Method - ${SITE_NAME}`,
    description: "Learn about the Spartan Method - our proven approach combining discipline, empathy, and strategy to transform hospice sales professionals into industry leaders.",
    keywords: "sales methodology, coaching approach, training method, hospice sales strategy, professional development framework",
    ogImage: "/spartan-logo.png"
  },
  '/tools': {
    title: `AI-Powered Sales Tools - ${SITE_NAME}`,
    description: "Access cutting-edge AI-powered tools designed for hospice sales professionals. From playbook generators to objection handlers, streamline your sales process with intelligent automation.",
    keywords: "AI sales tools, hospice sales software, sales automation, coaching tools, healthcare technology, sales productivity",
    ogImage: "/spartan-logo.png"
  },
  '/tools/playbooks': {
    title: `AI Playbook Generator - ${SITE_NAME}`,
    description: "Generate custom sales playbooks instantly with AI. Create tailored strategies, scripts, and action plans for any hospice sales scenario in seconds.",
    keywords: "sales playbook generator, AI playbook, hospice sales scripts, sales strategy tool, automated playbooks",
    ogImage: "/spartan-logo.png"
  },
  '/tools/objections': {
    title: `Objection Handler - ${SITE_NAME}`,
    description: "Master objection handling with AI-powered responses. Get instant, empathetic, and effective comebacks for common hospice sales objections to close more deals.",
    keywords: "objection handling, sales objections, AI responses, hospice sales tactics, overcoming resistance",
    ogImage: "/spartan-logo.png"
  },
  '/tools/research': {
    title: `Facility Research Tool - ${SITE_NAME}`,
    description: "Research facilities, decision-makers, and market insights instantly. Leverage AI to gather comprehensive intelligence and prepare for high-impact sales conversations.",
    keywords: "facility research, healthcare research, sales intelligence, market analysis, prospect research",
    ogImage: "/spartan-logo.png"
  },
  '/tools/transcribe': {
    title: `Call Transcription & Analysis - ${SITE_NAME}`,
    description: "Transcribe and analyze your sales calls with AI. Get detailed feedback, coaching insights, and actionable recommendations to improve your performance.",
    keywords: "call transcription, sales call analysis, AI coaching feedback, performance review, conversation analysis",
    ogImage: "/spartan-logo.png"
  },
  '/tools/email-templates': {
    title: `Email Templates - ${SITE_NAME}`,
    description: "Access professionally crafted email templates for every stage of the hospice sales cycle. Personalize and send effective communications that get responses.",
    keywords: "email templates, sales emails, hospice communication, follow-up emails, professional templates",
    ogImage: "/spartan-logo.png"
  },
  '/resources': {
    title: `Sales Resources - ${SITE_NAME}`,
    description: "Download free resources including territory templates, weekly planners, objection cards, and metrics dashboards to optimize your hospice sales workflow.",
    keywords: "sales resources, free downloads, sales templates, hospice tools, productivity resources",
    ogImage: "/spartan-logo.png"
  },
  '/resources/weekly-plan': {
    title: `Weekly Planning Template - ${SITE_NAME}`,
    description: "Organize your week for maximum productivity. Use our strategic weekly planning template to prioritize activities, set goals, and track your hospice sales progress.",
    keywords: "weekly planner, sales planning, productivity template, time management, goal setting",
    ogImage: "/spartan-logo.png"
  },
  '/resources/quick-start-guide': {
    title: `Quick Start Guide - ${SITE_NAME}`,
    description: "New to hospice sales? Start here. Our comprehensive quick start guide covers fundamentals, best practices, and essential strategies to launch your career successfully.",
    keywords: "quick start guide, beginner guide, hospice sales basics, getting started, sales fundamentals",
    ogImage: "/spartan-logo.png"
  },
  '/resources/objection-cards': {
    title: `Objection Response Cards - ${SITE_NAME}`,
    description: "Download printable objection response cards with proven comebacks for common hospice sales challenges. Keep them handy for confident, effective responses.",
    keywords: "objection cards, response scripts, sales comebacks, reference cards, objection handling guide",
    ogImage: "/spartan-logo.png"
  },
  '/resources/territory-template': {
    title: `Territory Management Template - ${SITE_NAME}`,
    description: "Organize and optimize your sales territory with our comprehensive management template. Track accounts, plan routes, and maximize your coverage efficiently.",
    keywords: "territory management, sales territory template, account tracking, route planning, territory organization",
    ogImage: "/spartan-logo.png"
  },
  '/resources/metrics-dashboard': {
    title: `Sales Metrics Dashboard - ${SITE_NAME}`,
    description: "Track your performance with our comprehensive metrics dashboard. Monitor KPIs, analyze trends, and make data-driven decisions to improve your results.",
    keywords: "sales metrics, performance dashboard, KPI tracking, sales analytics, data visualization",
    ogImage: "/spartan-logo.png"
  },
  '/about': {
    title: `About Us - ${SITE_NAME}`,
    description: "Learn about Spartan Coaching's mission to elevate hospice sales professionals through expert training, AI-powered tools, and unwavering commitment to excellence.",
    keywords: "about us, company mission, coaching team, our story, hospice sales expertise",
    ogImage: "/spartan-logo.png"
  },
  '/admin': {
    title: `Admin Dashboard - ${SITE_NAME}`,
    description: "Administrative dashboard for managing coaching programs, tracking user progress, and analyzing platform performance.",
    keywords: "admin dashboard, platform management, coaching administration",
    ogImage: "/spartan-logo.png"
  },
  '/testimonials': {
    title: `Success Stories - ${SITE_NAME}`,
    description: "Read real success stories from hospice sales professionals who transformed their careers with Spartan Coaching. See the results that matter.",
    keywords: "testimonials, success stories, client reviews, coaching results, case studies",
    ogImage: "/spartan-logo.png"
  },
  '/articles': {
    title: `Articles & Insights - ${SITE_NAME}`,
    description: "Expert articles on hospice sales strategies, industry trends, coaching tips, and professional development. Stay ahead with actionable insights.",
    keywords: "sales articles, hospice industry insights, coaching blog, sales tips, professional development",
    ogImage: "/spartan-logo.png"
  },
  '/podcasts': {
    title: `Podcasts - ${SITE_NAME}`,
    description: "Listen to the Spartan Coaching podcast featuring industry experts, successful sales professionals, and actionable strategies for hospice sales excellence.",
    keywords: "sales podcast, hospice sales audio, coaching podcast, industry interviews, sales training podcast",
    ogImage: "/spartan-logo.png"
  },
  '/404': {
    title: `Page Not Found - ${SITE_NAME}`,
    description: "The page you're looking for doesn't exist. Return to Spartan Coaching to access expert hospice sales training and tools.",
    keywords: "404, page not found, error page",
    ogImage: "/spartan-logo.png"
  }
};

export function getSEOConfig(path: string): SEOConfig {
  return seoConfig[path] || defaultSEO;
}
