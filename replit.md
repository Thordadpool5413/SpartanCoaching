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
- **AI Integration**: Comprehensive integration with Google Gemini AI for all AI-powered features, utilizing different Gemini models based on task complexity.

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
- **Homepage Authority Positioning**: Hero messaging positions Spartan as "The Authority in Hospice Excellence — Expert-Driven. Results-Proven." with Spartan Coaching Tools showcase section and "Why Spartan" credibility section covering sales mastery, clinical knowledge, strategic consulting, and technology & innovation. Spartan is a consulting business — AI is a supporting tool, not the brand identity.
- **Legal Documents Suite**: Complete set of digitally signable legal agreements at /baa, /contract, /nda, /emr-access, /conflict-of-interest, /liability-waiver, /testimonial-release. Each uses the reusable AgreementSignatureForm component with name, title, organization, email, date, and checkbox. Signed agreements stored in signedAgreements database table and emailed to both the signer and nicholas.lynch@spartan-coaching-schools.org via Resend.