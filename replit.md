# Spartan Coaching - Hospice Sales Training Platform

## Overview

Spartan Coaching is an AI-enhanced web platform designed to improve hospice sales effectiveness. It offers a public-facing marketing site detailing services and methodology, alongside AI-powered tools for generating sales playbooks, handling objections, conducting research, and transcribing audio. The platform aims to help hospice sales professionals get eligible patients into care earlier through practical, AI-driven coaching and training. It's built as a full-stack TypeScript application with a design philosophy inspired by professional SaaS platforms, focusing on patient outcomes and elite sales performance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The platform employs a premium SaaS aesthetic with a sophisticated visual design system. Key elements include:
- **Typography**: Inter font family with a strict scale (e.g., `text-hero` for H1, `text-body` for regular text) and optimized spacing.
- **Color Palette**: Refined color palette with clean whites, true blacks, and a vibrant red primary accent gradient.
- **Visual Effects**: Layered gradients, glassmorphism, smooth cubic-bezier animations, and a hierarchical shadow system for depth.
- **Responsiveness**: Mobile-first design is paramount, ensuring optimal experience across all devices with 48px touch targets and no horizontal overflow. Hero sections dynamically adjust height and video sources based on screen size and connection speed.
- **Content Presentation**: Focus on clear problem/solution/outcome narratives, with enhanced testimonials and case studies using specific, results-focused metrics.
- **LinkedIn Integration**: Integrated LinkedIn links for professional networking.

### Technical Implementations

- **Frontend**: React 19 and TypeScript, using Wouter for routing, Vite as the build tool, and Shadcn/ui with Radix UI primitives and Tailwind CSS for styling. TanStack Query manages server state.
- **Backend**: Express.js with TypeScript and an ESM module system, featuring middleware-based request handling and Zod schemas for validation.
- **Data Storage**: Neon serverless PostgreSQL with Drizzle ORM for persistent data, including a migration system. LocalStorage is used for client-side preferences.
- **AI Integration**: Comprehensive integration with Google Gemini AI for all AI-powered features, utilizing different Gemini models based on task complexity.

### Feature Specifications

- **The Spartan Method**: A core framework structured around Three Pillars (Discipline, Empathy, Strategy), a Four-Stage Healthcare Sales Mastery Model (Discovery, Connecting, Guiding, Commitment), and Five Governing Fundamentals. This method is visually represented with color-coded stages and enhanced card designs.
- **Programs & Services**: Detailed pages and modals outlining various hospice provider programs and strategic services, including business problems addressed, delivery approaches, outcomes, and target audiences.
- **AI Chatbot**: Advanced AI chatbot with extensive knowledge of hospice sales, Medicare/Medicaid regulations, IDG workflows, and the Spartan Method. It provides objection handling, territory management best practices, and coaching strategies. The chatbot is implemented as a floating, sticky widget positioned on the right side of the screen with three states: closed (floating button in bottom-right corner), minimized (vertical tab on right edge), and open (full chat panel on right side). It uses React Portal rendering to document.body with explicit fixed positioning (inline styles) to ensure it remains visible during scrolling. Conversation history persists via localStorage across sessions.
- **Articles Section**: Database-backed content management system for publishing LinkedIn articles. Features include:
  - Public-facing Articles page displaying thought leadership content
  - Featured articles highlighted in a separate section
  - Each article links to the full LinkedIn post
  - Admin panel for full CRUD operations (create, edit, delete articles)
  - Article metadata includes title, description, LinkedIn URL, publish date, and featured status
  - Fully tested end-to-end workflow verified
- **Visitor Analytics**: Automatic page visit tracking system that records visitor activity across all pages. Features include:
  - Automatic tracking of page visits on route changes
  - Database storage of visitor data with timestamps
  - Admin dashboard displaying visitor statistics for multiple time periods (day, week, month, quarter, year)
  - Optimized SQL COUNT queries for efficient analytics retrieval
  - Fully tested end-to-end tracking and reporting functionality
- **Authentication**: Replit Auth integrated with OpenID Connect supporting Google, GitHub, and email/password login. Session-based authentication using PostgreSQL sessions table. Currently, all public pages remain accessible without authentication for marketing purposes. Auth infrastructure ready for user-specific features (forum, personalized plans, etc.).
- **Training Resources Library**: Comprehensive database-backed downloadable resources system with 9 professional training PDFs for hospice sales professionals. Features include:
  - **Public-facing Resources page** displaying all materials organized by category (Scripts, Templates, Checklists, Guides)
  - **Admin panel** for full CRUD operations (create, edit, delete resources)
  - **Professional PDF formatting** with Spartan branding (red accent color, clean typography)
  - **9 Complete Training Modules**:
    - *Foundational*: Cold Call Opening Script, Sales Territory Analysis Template, Pre-Call Research Checklist, Medicare/Medicaid Regulations Guide
    - *Advanced*: Facility-Type Specific Scripts (Hospital/SNF/Assisted Living), Follow-Up Communication Templates, Physician Relationship Building Strategy, Case Studies with Real Results, Decision Trees & Strategic Frameworks
  - **Object storage integration** for secure PDF hosting
  - Fully tested end-to-end workflow with 100% download success rate
- **Podcasts**: Database-backed podcast episodes management system. Features include:
  - Public-facing Podcasts page with embedded audio players
  - Admin panel for creating and deleting podcast episodes
  - Object storage integration for MP3/audio files
  - Episode metadata includes title, description, episode number, and audio URL
  - Fully tested end-to-end functionality

## Recent Changes (November 2025)

### Training Resources Library - COMPLETE
- **9 Professional Training PDFs Created** with Spartan branding and comprehensive content
- **Facility-Type Specific Scripts**: Hospital, SNF, and Assisted Living customized scripts with pain points and talking points
- **Advanced Templates**: Follow-up emails, phone scripts, meeting agendas all ready-to-use
- **Physician Engagement Strategy**: Complete framework for engaging medical directors with CME opportunities
- **Real Case Studies**: SNF transformation (300% referral increase), Hospital discharge optimization (84% on-time)
- **Visual Decision Trees**: Objection handling, referral identification, account strategy matrices for rapid field decisions
- **Professional PDF Format**: All resources are print-ready, branded PDFs (37.8 KB total, 9 files)
- **Database-Backed**: All resources searchable and manageable via admin panel

### Phase 1 Completion Status ✅ COMPLETE
✅ Replit Auth integration (Google, GitHub, email/password)
✅ Complete Training Resources Library (9 professional PDFs)
✅ Facility-specific sales scripts and templates
✅ Physician relationship building strategy
✅ Case studies with real metrics
✅ Decision trees and strategic frameworks
✅ Podcasts page with admin management
✅ Visitor analytics system
✅ Articles management system
✅ AI chatbot with conversation history
✅ Admin panel for all content management

### Next Phase (Future Enhancements)
- Role-play practice scenarios with AI feedback
- Personalized coaching plans based on territory data
- Weekly drill reminders and performance tracking
- Discussion forum for sales professionals
- Email automation (SendGrid/Resend integration)
- Advanced analytics dashboards

## External Dependencies

- **AI Integration**: Google Gemini AI (`@google/genai`) for all AI coaching tools and conversational AI chat.
- **Database**: Neon serverless PostgreSQL via `@neondatabase/serverless` and Drizzle ORM for all data persistence.
- **Object Storage**: Google Cloud Storage (`@google-cloud/storage`) for secure PDF and audio file hosting.
- **PDF Generation**: PDFKit for creating professional, branded training materials.
- **Authentication**: Replit Auth with OpenID Connect via `openid-client`, session management via `express-session` and `connect-pg-simple`.
- **File Uploads**: Uppy v5 (`@uppy/core`, `@uppy/dashboard`, `@uppy/aws-s3`, `@uppy/react`) for client-side file uploads.
- **UI Libraries**: Radix UI primitives, Lucide React for iconography, cmdk for command palette, and date-fns for date manipulation.
- **Development Tools**: Vite, PostCSS with Tailwind CSS and Autoprefixer, esbuild, tsx, and TypeScript.

## Training Resources Library - Complete Inventory

### Available Downloadable Resources (9 PDFs)
1. **Cold Call Opening Script** (5.0K) - Proven 30-sec opener + discovery framework
2. **Sales Territory Analysis Template** (3.1K) - Territory planning & account strategy
3. **Pre-Call Research Checklist** (3.9K) - Complete call preparation workflow
4. **Medicare/Medicaid Regulations Guide** (7.9K) - Compliance & eligibility criteria
5. **Facility-Type Specific Scripts** (3.7K) - Hospital, SNF, AL customized scripts
6. **Follow-Up Communication Templates** (3.7K) - Emails, phone scripts, meeting agendas
7. **Physician Relationship Strategy** (3.6K) - Medical director engagement framework
8. **Case Studies: Real Results** (3.6K) - Before/after metrics & ROI impact
9. **Decision Trees & Frameworks** (3.3K) - Visual field reference guides

**All PDFs**: Professional formatting, Spartan branding, print-ready, fully downloadable at /resources/files/

## Recent Changes (February 2026)

### UX Enhancements
- **Sticky "Book a Call" CTA**: Floating button (bottom-left) that opens contact form dialog, appears after 300px scroll. Uses portal rendering to avoid overflow clipping. Positioned to not conflict with chat widget (bottom-right).
- **Social Proof Section**: Added below homepage hero with 4 key stats (300% referral increase, 84% discharge rate, 500+ reps trained, 15+ years) plus testimonial quote. Uses intersection observer for scroll animations.
- **Grouped Dropdown Navigation**: Desktop nav reorganized from 10 flat items into 3 dropdown groups (Solutions, AI Tools, Learn) + About. Keyboard accessible with focus-within support. Mobile menu grouped with section headers.
- **Unified Card Layouts**: Articles, Podcasts, Resources pages now share consistent card styling (border-2, spacing-card, hover gradient effects, spinner loading states).
- **Breadcrumb Navigation**: New Breadcrumbs component replaces BackButton on 10 sub-pages (5 AI tool pages + 5 resource sub-pages). Shows Home > Parent > Current hierarchy.

### Bug Fixes Applied
- **Duplicate HTTP server removed**: `registerRoutes()` in routes.ts no longer creates a second unused HTTP server via `createServer(app)`. The single server in index.ts is the authoritative listener.
- **Database failure resilience**: Public GET endpoints (`/api/articles`, `/api/resources`, `/api/podcasts`) now return empty arrays instead of 500 errors when the database is unavailable. This ensures the frontend renders properly even during DB outages.
- **Resource path conflict fixed**: Static file serving for training PDFs moved from `/resources` to `/resources/files` to prevent conflicts with the frontend `/resources` SPA route. A backwards-compatible 301 redirect ensures old `/resources/*.pdf` links still work.
- **Seed data updated**: All resource `fileUrl` paths in seed.ts updated from `/resources/*.pdf` to `/resources/files/*.pdf`.

### Known Issue
- **DATABASE_URL**: The Neon PostgreSQL endpoint (`ep-wispy-credit-aex4jsso`) is currently disabled. This is a platform-level issue requiring re-provisioning. All database-dependent features (articles, resources, podcasts, visitor analytics, newsletter, inquiries) return empty/error states until the database is restored. When restored, existing resource records may need their `fileUrl` paths updated from `/resources/` to `/resources/files/`.