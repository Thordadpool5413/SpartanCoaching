# Spartan Coaching - Hospice Sales Training Platform

## Overview

Spartan Coaching is an AI-enhanced web platform designed to improve hospice sales effectiveness. It offers a public-facing marketing site detailing services and methodology, alongside AI-powered tools for generating sales playbooks, handling objections, conducting research, and transcribing audio. The platform aims to help hospice sales professionals get eligible patients into care earlier through practical, AI-driven coaching and training. It's built as a full-stack TypeScript application using React, Express, and a design philosophy inspired by professional SaaS platforms.

## Recent Changes

### Visual Transformation (October 2025)
Completed comprehensive visual enhancement across all core pages to deliver a "wow" user experience:

**Hero Copy Enhancement (Latest):**
- Restructured homepage hero value proposition for greater impact and specificity
- Multi-layered messaging: bold promise → specific anti-patterns → mission outcome
- Three "No..." statements reject industry fluff with precise language ("rah-rah sessions that wear off by Thursday," "tips that don't survive first contact with a social worker")
- Gradient-highlighted patient care outcome ties execution to mission
- Progressive text opacity creates visual hierarchy (white/95 → white/90 → gradient)
- Responsive line breaks and staggered animations (0.1s-0.4s) for digestibility

**Enhanced Design System:**
- Refined color palette with cleaner whites (#FFFFFF), true blacks (#000000), and premium red gradient
- Sophisticated shadow system for depth and hierarchy (shadow-sm to shadow-2xl)
- Premium animations: fade-in-up, slide-in, scale-in with cubic-bezier easing
- Text gradient utilities for hero headings and emphasis
- Glass morphism effects and glow treatments for CTAs
- Transition-elegant utility for smooth 300ms interactions

**Page-by-Page Enhancements:**
- **Home**: Dramatic hero with radial gradients, "AI-Enhanced" badge, glass buttons, enhanced Daily Drill card with glow effect, upgraded Three Pillars section, Services Preview with gradient overlays
- **Services**: Gradient text headers with animations, large gradient background icons for sections, service cards with hover shadows and gradient overlays, enhanced CTA section with decorative elements
- **Programs**: Gradient text header, program cards with hover shadows and gradient overlays, clean professional layout
- **Method**: Enhanced Mission card with gradient backgrounds, sales stage cards with color-coded borders and shadows, ethics cards with gradient overlays, consistent visual hierarchy

**Mobile Responsive:**
- Explicit grid-cols-1 for mobile stacking on all grid layouts
- Decorative elements appropriately sized (w-64 on mobile vs w-96 on desktop)
- Touch-friendly buttons with min-h-[48px] targets
- No horizontal overflow on any page or device
- Proper text wrapping on CTAs (whitespace-normal on mobile)

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
*   **UI/UX Decisions**: Premium SaaS aesthetic with sophisticated visual design system. Typography uses Inter font family with optimized spacing (-0.02em tracking). Color system features a vibrant red primary accent (#DC2626 to #F87171 gradient) against clean whites and neutral grays. Advanced visual treatments include layered gradients, glassmorphism effects, smooth animations (cubic-bezier transitions), and depth through shadow hierarchy. Responsive layouts prioritize mobile-first design with consistent spacing, 48px touch targets, and no horizontal overflow.
*   **The Spartan Method**: A core philosophical and process framework guiding the platform's approach, structured around Three Pillars (Discipline, Empathy, Strategy), a Four-Stage Healthcare Sales Mastery Model (Discovery, Connecting, Guiding, Commitment), and Five Governing Fundamentals, anchored by specific ethics. Each stage is color-coded with distinct icons and clear visual hierarchy. Enhanced with gradient backgrounds and refined card treatments.
*   **Program & Service Details**: Comprehensive pages for various hospice provider programs and strategic services, featuring detailed modals for each with information on business problems, delivery approaches, outcomes, target audience, and deliverables. All cards feature hover effects, gradient overlays, and premium shadows for enhanced engagement.
*   **Navigation**: Main menu includes Home, Services, Programs, The Spartan Method, AI Field Kit, Resources, Testimonials, and About.
*   **Authentication**: User schema is defined, and the system is prepared for session-based authentication with PostgreSQL session store, though not yet fully implemented.

## External Dependencies

*   **AI Integration**: Google Gemini AI (`@google/genai`) is fully integrated for all AI coaching tools, including playbook generation, objection handling, research, daily drills, and conversational AI chat. It uses different Gemini models based on the task (e.g., `gemini-2.0-flash-exp` for complex responses).
*   **Database**: Neon serverless PostgreSQL is actively used for storing inquiry submissions, with connection pooling via `@neondatabase/serverless` and Drizzle ORM.
*   **UI Libraries**: Radix UI primitives, Lucide React for iconography, cmdk for command palette, and date-fns for date manipulation.
*   **Development Tools**: Vite for frontend, PostCSS with Tailwind CSS and Autoprefixer, esbuild, tsx, and TypeScript with strict mode.