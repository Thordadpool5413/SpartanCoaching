export type SectionBlock = {
  heading: string;
  body: string[];
};

export type ContentPage = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  highlights: string[];
  sections: SectionBlock[];
};

export type RoleplayScenario = {
  id: string;
  title: string;
  subtitle: string;
  context: string;
};

export const CONTENT_PAGES: Record<string, ContentPage> = {
  about: {
    slug: "about",
    title: "About Spartan Coaching",
    kicker: "Who we are",
    summary:
      "A coaching system built for hospice sales reps, leaders, and operators who want a clearer system and a stronger day-to-day rhythm.",
    highlights: [
      "Built for hospice and healthcare sales realities",
      "Strong enough for beta admins, simple enough for field reps",
      "Designed for mobile-first use on real devices",
    ],
    sections: [
      {
        heading: "What the app does",
        body: [
          "The mobile app gathers coaching tools, practice workflows, calculators, and review surfaces into one native iPhone experience.",
          "TestFlight users get full access so the beta can be used like a real working product instead of a demo shell.",
        ],
      },
      {
        heading: "Why it matters",
        body: [
          "Reps need fast access to coaching, not a browser full of scattered tabs.",
          "Leaders need a place to review submissions, insights, and field activity without switching contexts.",
        ],
      },
    ],
  },
  method: {
    slug: "method",
    title: "The Spartan Method",
    kicker: "Discipline, empathy, strategy",
    summary:
      "A simple operating philosophy for coaching hospice sales with clarity and consistency.",
    highlights: [
      "Discipline: a repeatable cadence that survives a busy week",
      "Empathy: messaging that respects family emotion and referral-source pressure",
      "Strategy: territory decisions grounded in outcomes, not vibes",
    ],
    sections: [
      {
        heading: "How the method shows up",
        body: [
          "Every workflow should make the next action obvious.",
          "Every conversation should be able to answer: what value did we add, what changed, and what comes next?",
        ],
      },
      {
        heading: "What the app reinforces",
        body: [
          "Practice tools reinforce deliberate preparation.",
          "Analytics show whether the system is producing momentum instead of just activity.",
        ],
      },
    ],
  },
  services: {
    slug: "services",
    title: "Services",
    kicker: "What the product supports",
    summary:
      "Coaching tools, roleplay practice, assessments, calculators, content publishing, and review workflows.",
    highlights: [
      "AI coaching and objection handling",
      "Drills, roleplay, and assessment workflows",
      "Publishing, review, and analytics for beta admins",
    ],
    sections: [
      {
        heading: "Field reps",
        body: [
          "Get quick coaching prompts, territory planning, daily drills, and calculators that help turn a conversation into a next step.",
        ],
      },
      {
        heading: "Leaders",
        body: [
          "Review submissions, publish content, track usage, and spot gaps in field execution without leaving the app.",
        ],
      },
    ],
  },
  programs: {
    slug: "programs",
    title: "Programs",
    kicker: "How the coaching is packaged",
    summary:
      "Field coaching, new hire onboarding, leadership support, and territory planning programs.",
    highlights: [
      "Onboarding programs for new hires",
      "Territory planning for reps and managers",
      "Leadership reviews that turn usage into coaching",
    ],
    sections: [
      {
        heading: "Field onboarding",
        body: [
          "The app can be used as a daily operating system for new hires: drill, roleplay, assessment, review, repeat.",
        ],
      },
      {
        heading: "Leadership support",
        body: [
          "Leaders can use admin review surfaces to publish assets and respond to field patterns faster.",
        ],
      },
    ],
  },
  manifesto: {
    slug: "manifesto",
    title: "Manifesto",
    kicker: "What we believe",
    summary:
      "Hospice sales should be disciplined, humane, and grounded in service.",
    highlights: [
      "No gimmicks",
      "No browser-first compromises",
      "No hidden state that breaks on refresh",
    ],
    sections: [
      {
        heading: "Our stance",
        body: [
          "Good coaching should be easy to access when the rep is in the field, not only when they are at a desk.",
          "The app should make the strongest behavior the easiest behavior.",
        ],
      },
    ],
  },
  faq: {
    slug: "faq",
    title: "FAQ",
    kicker: "Beta expectations",
    summary:
      "Answers for TestFlight users, admins, and anyone testing the first release.",
    highlights: [
      "No login gate for beta testers",
      "State persists offline and resumes on reopen",
      "Browser-specific assumptions have been removed from the product path",
    ],
    sections: [
      {
        heading: "Do I need an account?",
        body: [
          "Not for the beta release. TestFlight users are treated like trusted admins so the product can be evaluated end to end.",
        ],
      },
      {
        heading: "Will my drafts survive refreshes?",
        body: [
          "Yes. Drafts, favorites, streaks, and recent activity are stored locally on device.",
        ],
      },
    ],
  },
  compliance: {
    slug: "compliance",
    title: "Compliance",
    kicker: "How the app stays safe",
    summary:
      "Public submissions stay rate-limited and the server still owns secrets and email delivery.",
    highlights: [
      "Public paths stay rate-limited",
      "Sensitive actions stay server-side",
      "Beta access is build-scoped rather than browser-scoped",
    ],
    sections: [
      {
        heading: "What the app does not do",
        body: [
          "It does not rely on browser cookies or localStorage as an identity system.",
          "It does not expose secrets in UI copy or keep them in unsecured browser-only state.",
        ],
      },
    ],
  },
  agreements: {
    slug: "agreements",
    title: "Agreements",
    kicker: "What users can review",
    summary:
      "Common service and compliance agreements surfaced in a cleaner mobile format.",
    highlights: [
      "HIPAA BAA request path",
      "NDA and services contract reference material",
      "Signed agreement tracking in the admin area",
    ],
    sections: [
      {
        heading: "Mobile value",
        body: [
          "Agreements are easier to skim and share when they are presented in clean sections instead of long browser pages.",
        ],
      },
    ],
  },
  testimonials: {
    slug: "testimonials",
    title: "Testimonials",
    kicker: "Social proof",
    summary:
      "A place to surface proof points, stories, and wins that support the coaching product.",
    highlights: [
      "Field examples",
      "Manager praise",
      "Outcome snapshots",
    ],
    sections: [
      {
        heading: "How to use this area",
        body: [
          "Use the library to review social proof before a sales conversation or a stakeholder update.",
        ],
      },
    ],
  },
  podcasts: {
    slug: "podcasts",
    title: "Podcasts",
    kicker: "Long-form content",
    summary:
      "Episodes and audio resources can be reviewed from a mobile-native library screen.",
    highlights: [
      "Episode summaries",
      "Audio links",
      "Quick capture for notes and follow-up",
    ],
    sections: [
      {
        heading: "Field listening",
        body: [
          "Use podcasts for reinforcement during travel or after a difficult visit.",
        ],
      },
    ],
  },
};

export const CONTENT_PAGES_LIST = Object.values(CONTENT_PAGES);

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: "family-not-ready",
    title: "Family says they are not ready",
    subtitle: "Practice the compassionate, non-pushy response",
    context:
      "A daughter says the family is not ready to talk about hospice and wants to keep the conversation short.",
  },
  {
    id: "facility-competitor",
    title: "Facility already has a hospice",
    subtitle: "Practice differentiation without attacking",
    context:
      "A discharge planner says they already work with another hospice and do not want to switch.",
  },
  {
    id: "detailed-admissions",
    title: "Admissions are slipping",
    subtitle: "Practice a recovery conversation with a branch leader",
    context:
      "A branch leader wants a real plan for increasing admissions without adding more noise to the week.",
  },
];

