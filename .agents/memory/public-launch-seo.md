---
name: Public launch SEO
description: Durable rules for Spartan Coaching crawl metadata and public funnel integrity.
---

Spartan Coaching’s public launch checks must exercise the production web server, not just Vite’s SPA shell. Crawl-facing canonical URLs, Open Graph URLs, and no-index directives are enforced before JavaScript by the production server, while client metadata remains a hydration fallback.

**Why:** A static SPA rewrite can return homepage HTML to every deep link. Client-only Helmet updates are not enough to prevent private routes from being indexed or to give crawlers a route-specific canonical URL.

**How to apply:** Keep the route manifest as the shared source for sitemap/public paths and no-index prefixes. Run the production-server verification as part of the launch gate and repeat the live crawl after deployment. Treat the server-owned contact-success event as non-client-writeable; public funnel inputs remain an allowlisted, fixed vocabulary with no free text.