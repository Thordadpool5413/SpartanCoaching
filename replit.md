# Spartan Coaching - Hospice Sales Training Platform

## Overview

Spartan Coaching is an AI-enhanced web platform designed to improve hospice sales effectiveness. It offers a public-facing marketing site detailing services and methodology, alongside AI-powered tools for generating sales playbooks, handling objections, conducting research, and transcribing audio. The platform aims to help hospice sales professionals get eligible patients into care earlier through practical, AI-driven coaching and training. It's built as a full-stack TypeScript application using React, Express, and a design philosophy inspired by professional SaaS platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 19 and TypeScript, using Wouter for client-side routing and Vite as the build tool. UI components leverage Shadcn/ui with Radix UI primitives and Tailwind CSS for styling, adhering to a "New York" style variant. State management primarily uses TanStack Query for server state and local React state for UI interactions. Key design principles include Inter font family, a red primary accent color, and a mobile-first responsive approach with strict typography and spacing hierarchies. Mobile usability is prioritized with 48px touch targets and optimized responsiveness across various screen sizes.

### Backend Architecture

The backend utilizes Express.js with TypeScript and an ESM module system. It features a middleware-based request handling system with Zod schemas for request/response validation. An abstract storage interface (`IStorage`) is implemented with a `DatabaseStorage` for PostgreSQL persistence via Drizzle ORM. The build system uses esbuild for production bundling and tsx for development.

### Data Storage Solutions

The project uses Neon serverless PostgreSQL for persistent data, managed via Drizzle ORM for type-safe operations. A migration system (`drizzle-kit`) is in place. Client-side preferences are stored in LocalStorage. The database schema includes tables for inquiries and is prepared for AI chat messages and user authentication.

### Core Features & Design

*   **Content Strategy**: Focuses on practical execution systems over motivational content, emphasizing clear problem/solution/outcome narratives.
*   **UI/UX Decisions**: Clean design inspired by Linear, Stripe, and Notion. Typography uses Inter font; color system features a red primary accent and neutral grays. Responsive layouts prioritize mobile-first design with consistent spacing and touch targets.
*   **The Spartan Method**: A core philosophical and process framework guiding the platform's approach, structured around Three Pillars (Discipline, Empathy, Strategy), a Four-Stage Healthcare Sales Mastery Model (Discovery, Connecting, Guiding, Commitment), and Five Governing Fundamentals, anchored by specific ethics. Each stage is color-coded with distinct icons and clear visual hierarchy.
*   **Program & Service Details**: Comprehensive pages for various hospice provider programs and strategic services, featuring detailed modals for each with information on business problems, delivery approaches, outcomes, target audience, and deliverables.
*   **Navigation**: Main menu includes Home, Services, Programs, The Spartan Method, AI Field Kit, Resources, Testimonials, and About.
*   **Authentication**: User schema is defined, and the system is prepared for session-based authentication with PostgreSQL session store, though not yet fully implemented.

## External Dependencies

*   **AI Integration**: Google Gemini AI (`@google/genai`) is fully integrated for all AI coaching tools, including playbook generation, objection handling, research, daily drills, and conversational AI chat. It uses different Gemini models based on the task (e.g., `gemini-2.0-flash-exp` for complex responses).
*   **Database**: Neon serverless PostgreSQL is actively used for storing inquiry submissions, with connection pooling via `@neondatabase/serverless` and Drizzle ORM.
*   **UI Libraries**: Radix UI primitives, Lucide React for iconography, cmdk for command palette, and date-fns for date manipulation.
*   **Development Tools**: Vite for frontend, PostCSS with Tailwind CSS and Autoprefixer, esbuild, tsx, and TypeScript with strict mode.