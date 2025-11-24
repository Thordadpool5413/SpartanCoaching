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
- **Resources Library**: Database-backed downloadable resources system for sales templates, scripts, checklists, and guides. Features include:
  - Public-facing Resources page displaying all downloadable materials
  - Admin panel for full CRUD operations (create, edit, delete resources)
  - Object storage integration for PDF files with proper ACL enforcement
  - Resource metadata includes title, description, category, and file URL
  - Fully tested end-to-end workflow verified
- **Podcasts**: Database-backed podcast episodes management system. Features include:
  - Public-facing Podcasts page with embedded audio players
  - Admin panel for creating and deleting podcast episodes
  - Object storage integration for MP3/audio files
  - Episode metadata includes title, description, episode number, and audio URL
  - Fully tested end-to-end functionality

## Recent Changes (November 2025)

### Critical Fixes Applied
- **Public Routing Restored**: Removed authentication gate that was blocking all public pages. All marketing pages (/, /services, /articles, /resources, /podcasts) are now accessible without login.
- **Delete Mutations Fixed**: Corrected JSON parsing issues in admin panel delete operations. Now properly handles both JSON responses and bodyless 204 responses.
- **ObjectUploader Component**: Fixed compatibility with Uppy v5 by switching from DashboardModal to Dashboard inline mode.
- **Admin Authentication**: Simple password-based admin panel (password: 5413) for content management. Adequate for current needs but recommended to upgrade to session-based auth for production.

### Phase 1 Completion Status
✅ Replit Auth integration (Google, GitHub, email/password)
✅ Resources library with admin management
✅ Podcasts page with admin management
✅ Visitor analytics system
✅ Articles management system
✅ AI chatbot with conversation history

### Next Phase Planned
- Enhanced AI features: role-play scenarios, personalized coaching plans, weekly drill reminders
- Discussion forum for sales professionals
- Email automation (SendGrid/Resend integration)
- Web push notifications for coaching reminders

## External Dependencies

- **AI Integration**: Google Gemini AI (`@google/genai`) for all AI coaching tools and conversational AI chat.
- **Database**: Neon serverless PostgreSQL via `@neondatabase/serverless` and Drizzle ORM.
- **Object Storage**: Google Cloud Storage (`@google-cloud/storage`) for PDF resources and audio files.
- **Authentication**: Replit Auth with OpenID Connect via `openid-client`, session management via `express-session` and `connect-pg-simple`.
- **File Uploads**: Uppy v5 (`@uppy/core`, `@uppy/dashboard`, `@uppy/aws-s3`, `@uppy/react`) for client-side file uploads.
- **UI Libraries**: Radix UI primitives, Lucide React for iconography, cmdk for command palette, and date-fns for date manipulation.
- **Development Tools**: Vite, PostCSS with Tailwind CSS and Autoprefixer, esbuild, tsx, and TypeScript.