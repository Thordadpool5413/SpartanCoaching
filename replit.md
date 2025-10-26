# Spartan Coaching - Hospice Sales Training Platform

## Overview

Spartan Coaching is a web application designed to provide AI-enhanced hospice sales coaching and training. The platform combines traditional coaching services with AI-powered tools to help hospice sales professionals improve their effectiveness. It features a public-facing marketing site with information about services, programs, and methodology, alongside a suite of AI-powered tools for generating playbooks, handling objections, conducting research, and transcribing audio.

The application is built as a full-stack TypeScript application using React for the frontend and Express for the backend, with a focus on clean design inspired by professional SaaS platforms like Linear, Stripe, and Notion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- React 19 with TypeScript for UI components
- Wouter for client-side routing (lightweight alternative to React Router)
- Vite as the build tool and development server
- File-based architecture with pages in `client/src/pages/`

**UI Component System**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Custom theme system supporting light/dark modes with localStorage persistence
- Design follows "New York" style variant of Shadcn components

**State Management**
- TanStack Query (React Query) for server state management
- Local React state for UI interactions
- Custom hooks for common patterns (theme, mobile detection)

**Key Design Principles**
- Typography: Inter font family with strict hierarchy (text-5xl to text-7xl for heroes, consistent spacing)
- Color System: Red primary accent (#dc2626), neutral grays, gradient treatments for emphasis
- Spacing: Tailwind's 4/6/8/12/16/20/24/32 unit system
- Responsive: Mobile-first with specific breakpoints for tablet (md) and desktop (lg)

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- ESM module system (type: "module")
- Middleware-based request handling with logging
- Development server with Vite integration for HMR

**Storage Layer**
- Abstract storage interface (`IStorage`) for flexibility
- In-memory storage implementation (`MemStorage`) for development
- Prepared for database integration via Drizzle ORM
- Schema definitions in `shared/schema.ts` for type safety

**API Structure**
- RESTful endpoints prefixed with `/api`
- Zod schemas for request/response validation
- Shared types between client and server via `@shared` alias
- Request validation with JSON body parsing

**Build System**
- esbuild for server bundling (production)
- tsx for development with hot reload
- Separate build outputs: `dist/public` for client, `dist` for server

### Data Storage Solutions

**Current Implementation**
- In-memory storage for users and application state
- LocalStorage for client-side preferences (theme, cached data)

**Prepared Database Integration**
- Drizzle ORM configured for PostgreSQL via `@neondatabase/serverless`
- Migration system ready (`drizzle-kit`) with migrations output to `./migrations`
- Schema definitions use Zod for validation and type inference
- Connection string via `DATABASE_URL` environment variable

**Schema Definitions**
- AI chat messages (role, content, timestamp)
- Request/response types for AI operations (playbooks, objections, research)
- User model ready for authentication implementation

### External Dependencies

**AI Integration**
- Google Gemini AI (`@google/genai`) for content generation, grounding, and text-to-speech
- Configured for multiple AI capabilities:
  - Complex response generation (playbooks)
  - Grounded search with web sources (research tool)
  - Quick responses (objection handling)
  - Text-to-speech for audio playback
- API key managed via environment variables

**Database**
- Neon serverless PostgreSQL (configured but not yet actively used)
- Connection pooling via `@neondatabase/serverless`
- Session store ready with `connect-pg-simple` for Express sessions

**UI Libraries**
- Radix UI primitives for accessible components (dialogs, dropdowns, tooltips, etc.)
- Lucide React for consistent iconography
- cmdk for command palette functionality
- date-fns for date manipulation
- class-variance-authority for variant-based component styling

**Development Tools**
- Replit-specific plugins for error overlay and development experience
- TypeScript with strict mode enabled
- Path aliases configured: `@/` for client, `@shared/` for shared code, `@assets/` for static files

**Build & Deployment**
- Vite for frontend bundling with React plugin
- PostCSS with Tailwind CSS and Autoprefixer
- Production build creates static assets in `dist/public`
- Server runs as standalone Node.js application in production

### Authentication & Authorization

**Current State**
- User schema defined but authentication not yet implemented
- Prepared for session-based authentication with PostgreSQL session store
- Cookie-based credentials included in fetch requests

**Prepared Implementation**
- User model with id, username fields
- Storage interface includes user lookup methods
- Session middleware ready for integration