# Spartan Coaching Website - Design Guidelines

## Design Approach

**Reference-Based Approach**: Draw inspiration from professional coaching platforms and SaaS products that balance authority with approachability:
- **Primary References**: Linear (clean typography, subtle interactions), Stripe (minimal elegance, strong hierarchy), Notion (clarity, information architecture)
- **Secondary Influence**: Military/tactical aesthetics without being overly aggressive - think West Point academy branding or professional sports coaching platforms
- **Core Principle**: Authoritative expertise meets human connection - serious about results, approachable in delivery

## Typography System

**Font Family**: Inter (already established via Google Fonts)

**Hierarchy**:
- **Hero Headlines**: text-5xl to text-7xl, font-black (900 weight), tight leading (leading-tight)
- **Page Titles**: text-4xl, font-black
- **Section Headings**: text-3xl, font-bold (700 weight)
- **Subsection Headings**: text-xl to text-2xl, font-bold
- **Body Text**: text-base to text-lg, font-normal (400 weight)
- **Small Text/Captions**: text-sm, font-medium

**Special Treatments**:
- Use gradient text for hero headlines: `text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400`
- All-caps treatment for labels and CTAs: `uppercase tracking-wide text-sm font-bold`
- Maintain generous line-height (1.6-1.8) for body text readability

## Layout & Spacing System

**Tailwind Spacing Primitives**: Use 4, 6, 8, 12, 16, 20, 24, 32 units consistently
- **Component Padding**: p-6 for cards, p-8 for larger sections
- **Vertical Section Spacing**: py-16 to py-24 on desktop, py-12 on mobile
- **Grid Gaps**: gap-6 for card grids, gap-4 for tighter layouts
- **Container**: max-w-7xl mx-auto px-6 for all content areas

**Grid Systems**:
- **Service/Program Cards**: 3-column on desktop (lg:grid-cols-3), 2-column tablet (md:grid-cols-2), single on mobile
- **Feature Showcases**: 2-column layouts for text+visual pairings
- **Pricing Cards**: Flexible 2-4 columns based on number of tiers

## Component Library

### Navigation
- **Sticky Header**: 80px min-height, glass morphism effect (`bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-lg`)
- **Logo Placement**: Left-aligned with Spartan helmet logo (48px) + wordmark
- **Nav Items**: Horizontal on desktop, full-width stacked on mobile
- **Active State**: Red background for current page, subtle hover states

### Cards & Surfaces
- **Base Card**: White/dark-surface background, rounded-2xl, subtle border, shadow-sm
- **Pricing Cards**: Elevated shadows, clear tier hierarchy, featured tier gets red accent border
- **Program Cards**: Icon/image at top, title, deliverables list, CTA at bottom
- **Hover States**: Subtle lift effect (transform scale-105) with shadow increase

### Buttons & CTAs
- **Primary (Brand)**: Red background, white text, bold font
- **Secondary (Ghost)**: Transparent with border, red on hover
- **Sizes**: Large for hero CTAs (px-8 py-4), standard for in-content (px-5 py-3)
- **Icons**: Use Heroicons for consistency, 20px standard size

### Forms & Inputs
- **Input Fields**: Rounded-lg, border, focus ring in red, p-3
- **Textarea**: Minimum 6 rows for message fields
- **Submit Buttons**: Always primary brand style
- **Email Capture**: Inline horizontal layout on desktop, stacked on mobile

### Data Display
- **Stats/Metrics**: Large numbers (text-4xl font-black), small labels below
- **Lists**: Checkmark bullets in red, generous spacing (space-y-3)
- **Testimonials**: Quote marks, italic body, author with title below

### AI Tool Interfaces
- **Chat Widget**: Fixed bottom-right on desktop, full-screen modal on mobile
- **Loading States**: Spinning red icon, skeleton screens for content generation
- **Generated Content**: White/dark-surface container, prose styling, print-friendly
- **Audio Controls**: Clean player interface with waveform visualization

## Page-Specific Layouts

### Homepage
- **Hero**: Full-width, 80vh height, Spartan logo prominently featured with fiery background image, gradient text headline, two-CTA layout (primary + ghost)
- **Daily Drill Card**: Gradient red background, prominent placement below hero
- **Value Pillars**: 3-column grid showcasing Discipline, Empathy, Strategy with custom icons
- **Services Preview**: Card grid teasing main offerings with "Learn More" links

### Coaching Services & Programs
- **Pricing Cards Layout**: Side-by-side comparison with clear tier differentiation
- **Program Grids**: 2-3 columns showcasing each program with deliverables as bulleted lists
- **Booking CTAs**: Persistent throughout, never more than one scroll away

### The Spartan Method
- **Philosophy Narrative**: Long-form content with max-w-3xl for readability
- **Pillar Deep-Dives**: Each pillar gets dedicated section with icon, heading, detailed explanation
- **Visual Breaks**: Use subtle dividers, pull quotes in red accent

### AI Field Kit (Tools)
- **Tool Grid**: 2x2 or single column layout showcasing each AI tool
- **Interactive Panels**: Collapsible/expandable sections for each tool
- **Clear Instructions**: Step-by-step numbered lists for using each feature

### Resources
- **Download Cards**: PDF preview thumbnails, file size, description, download button
- **Email Capture**: Prominent newsletter signup with value proposition
- **Resource Categories**: Tabbed or sectioned organization

### About
- **Founder Bio**: 2-column layout (image + text), personal story narrative
- **Credentials**: Visual timeline or grid of experience highlights
- **Testimonials**: Carousel or stacked quotes from clients

## Images

**Logo Usage**: 
- Use the provided Spartan helmet logo with fiery background throughout
- Header: 48px size, alongside "Spartan Coaching" wordmark
- Favicon: Helmet only, simplified for small sizes

**Hero Image**: 
- Homepage hero should feature dramatic, high-quality image: battle-ready Spartan warrior (silhouette/artistic) or motivational coaching scene
- Alternative: Abstract geometric patterns with red accents and metallic gold tones echoing the logo's fire
- Image should be darkened/overlaid to ensure text contrast

**Supporting Images**:
- Founder headshot for About page (professional, approachable)
- Program illustrations: Icon-based rather than photography for consistency
- Testimonial photos: Authentic client headshots where available
- Resource thumbnails: PDF cover previews for downloads

**Image Treatment**: 
- Subtle overlays on hero images for text readability
- Rounded corners (rounded-xl) for inline images
- Maintain aspect ratios: 16:9 for hero, 4:3 for cards, 1:1 for profiles

## Special Considerations

**Dark Mode Excellence**: This is a dark-first design - dark mode should be the superior experience with rich blacks, vibrant reds, and crisp whites. Light mode is clean and professional but dark mode embodies the Spartan warrior aesthetic.

**Print-Friendly AI Content**: Generated playbooks and tools must be printer-optimized with clean black text, removed backgrounds, and proper page breaks.

**Mobile-First Interactions**: Collapsible navigation, touch-friendly button sizes (min 44px), full-screen modals for AI tools on small screens.

**Performance**: Lazy-load images, optimize hero image delivery, minimize animation overhead - speed conveys professionalism.