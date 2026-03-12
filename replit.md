# Spartan Coaching - Hospice Sales Consulting Platform

## Overview

Spartan Coaching is a hospice sales consulting firm's web platform designed to improve hospice sales effectiveness. It offers a public-facing marketing site and expert tools for generating sales playbooks, handling objections, conducting research, and transcribing audio. The platform aims to help hospice sales professionals get eligible patients into care earlier through practical, expert-driven coaching and consulting, focusing on patient outcomes and elite sales performance. Note: Spartan Coaching is a consulting business, NOT an AI company — AI is used as a supporting tool, not the core identity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The platform features a premium SaaS aesthetic with a sophisticated visual design system. Key elements include: Inter font family typography, a refined color palette with a vibrant red primary accent, layered gradients, glassmorphism, smooth animations, and a hierarchical shadow system for depth. It adheres to a mobile-first responsive design, ensuring optimal experience across all devices. Content presentation focuses on clear problem/solution/outcome narratives with enhanced testimonials, and LinkedIn integration is included for professional networking.

### Technical Implementations

- **Frontend**: Built with React 19 and TypeScript, using Wouter for routing, Vite as the build tool, and Shadcn/ui with Radix UI primitives and Tailwind CSS for styling. TanStack Query manages server state.
- **Backend**: Implemented with Express.js in TypeScript with an ESM module system, featuring middleware-based request handling and Zod schemas for validation.
- **Data Storage**: Uses Neon serverless PostgreSQL with Drizzle ORM for persistent data, including a migration system. LocalStorage is used for client-side preferences.
- **AI Integration**: OpenAI GPT-4o via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`). All 7 functions in `server/openai.ts`: complex responses (gpt-4o), quick responses (gpt-4o-mini), research, drills, chatbot, roleplay response, and roleplay feedback. `server/gemini.ts` kept as deprecated backup. Client is created fresh per call (no caching, tokens expire).

### Feature Specifications

- **The Spartan Method**: A core framework structured around Three Pillars (Discipline, Empathy, Strategy), a Four-Stage Healthcare Sales Mastery Model, and Five Governing Fundamentals, visually represented with color-coded stages.
- **Programs & Services**: Detailed pages outlining various hospice provider programs and strategic services.
- **AI Chatbot**: An advanced AI chatbot with extensive knowledge of hospice sales, regulations, and the Spartan Method, offering objection handling, territory management, and coaching strategies. It's implemented as a floating, sticky widget with conversation history persistence via localStorage.
- **Articles Section**: A database-backed content management system for publishing LinkedIn articles, including an admin panel for CRUD operations.
- **Visitor Analytics**: An automatic page visit tracking system that records visitor activity and stores data in a database, with an admin dashboard for statistics.
- **Authentication**: Removed. The site is fully public with no user accounts or login system.
- **Training Resources Library**: A comprehensive database-backed downloadable resources system with 9 professional training PDFs for hospice sales professionals, categorized and manageable via an admin panel. Features professional PDF formatting and object storage integration.
- **Role-Play Practice**: Interactive AI-powered roleplay practice with 6 pre-built scenarios, real-time messaging, and detailed coaching analysis based on the Spartan Method. Sessions and transcripts are persisted in the database.
- **Daily Coaching Drills**: Daily practice exercises categorized into 20 types, with daily rotation, completion tracking, and a streak counter.
- **Email Send Integration**: Enhanced Email Templates tool supporting direct email sending via Resend.
- **Podcasts**: A database-backed podcast episodes management system with public-facing pages and an admin panel, integrating object storage for audio files.
- **Knowledge Base / Glossary**: Searchable reference page (`/learn/knowledge-base`) with 40+ entries covering hospice terminology, regulations, eligibility criteria, clinical concepts, sales terms, and billing. Client-side search and category filtering.
- **Ask Spartan AI**: Prominent AI-powered question bar on the homepage ("Ask a Hospice Expert") where visitors can ask any hospice question and get instant expert answers. Includes suggestion chips for common questions.
- **ROI Calculator**: Interactive tool (`/tools/roi-calculator`) where hospice providers input team size and current metrics to estimate Spartan Coaching's impact on referrals, revenue, and patient care.
- **Activity Calculator**: Interactive tool (`/tools/activity-calculator`) that converts a monthly admission goal into exact referral source conversation targets (monthly, weekly, daily). Supports tenured reps (uses personal last-cycle conversion rate) and new hires (uses team baseline rate with 4-week ramp plan at 50/70/85/100%). Includes buffer conversations, animated results dashboard with metric cards, visual ramp bar chart, and plain English coaching summary.
- **Candidate Assessment Tool**: Structured hiring assessment system for evaluating hospice sales rep candidates. Admins create named assessments with quiz (multiple choice) and scenario (written response) questions via the admin panel Assessments tab, then share a public link (`/assessment/:id`). Candidates enter name/email, complete all questions, and receive instant scoring. Quiz questions scored for accuracy; scenario responses evaluated by AI (OpenAI GPT-4.1) for hospice sales aptitude. Composite score displayed to candidates immediately. Admin results dashboard shows all submissions with scores, candidate info, and expandable AI feedback per candidate. Confirmation email sent to candidates via Resend with score summary. **Invite links**: Admins can send personalized assessment invites from the admin panel — enters candidate name+email, system generates a unique token URL (`/assessment/:id?token=UUID`), sends branded invite email via Resend, and pre-fills candidate info on the assessment page (read-only fields). Invites tracked with sent/used status; token marked used on submission. Admin sees invite list with pending/completed badges and copy-link buttons. Database tables: `assessments`, `assessment_questions`, `assessment_submissions`, `assessment_invites`.

## External Dependencies

- **AI Integration**: Google Gemini AI (`@google/genai`) for all AI coaching tools and conversational AI.
- **Database**: Neon serverless PostgreSQL via `@neondatabase/serverless` and Drizzle ORM.
- **Object Storage**: Google Cloud Storage (`@google-cloud/storage`) for secure file hosting.
- **PDF Generation**: PDFKit for creating branded training materials.
- **Markdown Rendering**: `react-markdown` with `remark-gfm` for professional AI content display via `MarkdownContent` component.
- **File Uploads**: Uppy v5 (`@uppy/core`, `@uppy/dashboard`, `@uppy/aws-s3`, `@uppy/react`) for client-side file uploads.
- **Animations**: Framer Motion for scroll-triggered animations, animated counters, progress rings, and page transitions.
- **UI Libraries**: Radix UI primitives, Lucide React for iconography, cmdk for command palette, and date-fns for date manipulation.

## Enhanced UX Features (February 2026)

- **Scroll Animations**: All pages use framer-motion based scroll-reveal animations (FadeIn, SlideUp, StaggerContainer/StaggerItem, ScaleIn) via `@/components/animations.tsx`
- **Enhanced Role-Play UI**: Avatar-based chat bubbles, animated typing indicator (3 bouncing dots), conversation header with live indicator, and animated radial score gauge in feedback view with color-coded ratings
- **Enhanced Drills UI**: GitHub-style activity heatmap calendar (90 days), animated stats row (streak, total, weekly), AnimatePresence transitions for completion flow, motivational quote footer
- **Command Palette**: Ctrl+K / Cmd+K global keyboard shortcut for quick navigation across all pages and tools, using cmdk library
- **Animated Homepage Stats**: Stats count up from zero when scrolled into view using AnimatedCounter
- **Tools Page Search**: Real-time search/filter bar with category badges and staggered card entrance animations
- **Navigation**: "Learn" dropdown and mobile menu for content discovery
- **Homepage Structure**: Hero section, Ask Spartan AI bar, trust stack with credibility bullets, problem/promise section, "What You Get" deliverables list, "Hospice Realities We Train For" bullets, "How It Works" numbered steps, "What Changes Look Like" real outcome cards, compliance/ethics block (5 required points), "Who This Is For / Not For" section, "Why Spartan" brand explanation, tools showcase, "What Makes This Different" credibility section, and closing section. No "Apply Now" buttons. Primary visitor action is Contact page (/contact). Spartan is a consulting business, AI is a supporting tool, not the brand identity.
- **Legal Documents Suite**: Complete set of digitally signable legal agreements accessible via /legal landing page, with individual pages at /baa, /contract, /nda, /emr-access, /conflict-of-interest, /liability-waiver, /testimonial-release. Each uses the reusable AgreementSignatureForm component with name, title, organization, email, date, drawn signature canvas, and checkbox. Signed agreements stored in signedAgreements database table and emailed to both the signer and nick@spartanhospicecoaching.com via Resend.
- **Enhanced E-Sign Agreement Flow**: Full closed-loop agreement signing workflow. Admin can send signing requests to specific leads via the Agreements tab in Admin dashboard. Requests are stored in `agreement_requests` table with secure tokenized links. Leads receive branded Resend email with a link to `/sign/:token` page showing only requested documents. Signature capture includes a drawn signature canvas (SignaturePad component). On signing, both the signer and admin receive a branded PDF (via PDFKit) containing signer details and drawn signature image. Admin panel shows per-request status (pending/completed) with per-document signed/pending badges and resend capability.
- **Compliance and Ethics Page**: Dedicated page at /compliance covering clear boundaries (what Spartan will not train), PHI/AI tool usage rules, ethical education-based relationship building principles, and no-guarantees statement.
- **Founder Bio**: Verbatim multi-paragraph bio for Nick Lynch used on About page, covering field experience, coaching approach, leader development, and market clarity. Must not be summarized or rewritten.
- **Services "Work With Us" Page**: Restructured with application process steps and buying-decision FAQs. Organized by Individual Reps, Sales Leadership, and Corporate Providers. No "Apply Now" buttons.
- **Contact Page**: Dedicated contact page at /contact with inline form (name, email, phone, company, service interest, message). Replaces all popup contact forms and "Apply Now" CTAs across the site.
- **Master Prompt Compliance**: All copy follows master prompt rules: no dashes of any kind (em dashes, en dashes, or punctuation hyphens), Contact as primary CTA, compliance posture visible on homepage and dedicated page, practical/grounded tone, no hype or guarantees. All year references use 2026.