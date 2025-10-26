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
- PostgreSQL database via Neon serverless (actively used for persistent data)
- Drizzle ORM for type-safe database operations
- LocalStorage for client-side preferences (theme, cached data)

**Database Configuration**
- Neon serverless PostgreSQL with connection pooling via `@neondatabase/serverless`
- Drizzle ORM configured with schema binding in `server/db.ts`
- Migration system using `drizzle-kit` with `npm run db:push` command
- Connection string managed via `DATABASE_URL` environment variable
- WebSocket support for Neon serverless via `ws` package

**Schema Definitions**
- Inquiries table: stores contact form submissions with name, email, phone, company, serviceType, message, and auto-generated timestamp
  - Insert schema omits auto-generated fields (id, submittedAt)
  - Server automatically injects timestamp on creation
  - Results ordered by submission date (newest first)
- AI chat messages (role, content, timestamp)
- Request/response types for AI operations (playbooks, objections, research)
- User model ready for authentication implementation

**Storage Layer Architecture**
- Abstract `IStorage` interface in `server/storage.ts` for flexibility
- `DatabaseStorage` implementation for PostgreSQL persistence
- CRUD operations: createInquiry, getInquiries
- Type-safe operations using Drizzle-generated types (InsertInquiry, SelectInquiry)

### External Dependencies

**AI Integration (Fully Operational)**
- Google Gemini AI (`@google/genai`) integrated and actively powering all coaching tools
- Live AI service implementation in `server/gemini.ts` with:
  - Complex response generation for detailed playbooks (gemini-2.0-flash-exp model)
  - Quick response generation for objection handling (500 token limit, optimized)
  - Grounded search for research queries (note: full grounding requires Vertex AI, API key version provides comprehensive research without web citations)
  - Daily drill generator with rotating curated coaching exercises
  - Chat conversation support with full context history
- All endpoints include comprehensive error handling and logging
- API key managed securely via GEMINI_API_KEY environment variable
- Request/response validation with Zod schemas for type safety
- Active API routes:
  - `POST /api/playbooks` - generates comprehensive sales playbooks
  - `POST /api/objections` - handles sales objections with empathy
  - `POST /api/research` - provides detailed industry research
  - `GET /api/daily-drill` - returns daily training exercises
  - `POST /api/chat` - conversational AI coaching assistant
- System instruction ensures all AI responses follow Spartan Method principles (Discipline, Empathy, Strategy)

**Database (Active)**
- Neon serverless PostgreSQL actively storing inquiry submissions
- Connection pooling via `@neondatabase/serverless`
- Database connection in `server/db.ts` with schema binding
- Migration workflow: `npm run db:push` to sync schema changes
- Session store ready with `connect-pg-simple` for Express sessions (not yet implemented)

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