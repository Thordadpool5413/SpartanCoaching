# Public launch check

Run this before every public website release:

```sh
pnpm run launch:check
PUBLIC_SITE_URL=https://spartanhospicecoaching.com pnpm run audit:public
```

`launch:check` builds the site, checks its JavaScript, CSS, HTML, desktop hero,
mobile hero, and poster budgets, then starts the production web server locally.
It verifies raw HTTP headers and HTML for every sitemap route: route-specific
title, description, Open Graph and Twitter metadata, canonical URL, and
indexability. It also verifies the no-index treatment for private, gated, and
legal-template routes; the canonical origin; sitemap; robots; and truthful
homepage structured data.

The second command is the post-deploy crawl. It repeats those raw-response
checks against the live site, requests every URL in the public sitemap,
requires an HTML success response, and fails if document responses are slow or
unexpectedly large.

## Evidence expectations

- Review the public funnel card in Admin after a release. CTA clicks and contact
  starts indicate interest; **Successful sends** are server-recorded outcomes.
  A browser is never allowed to report a contact success on its own.
- Use a narrow mobile viewport and a desktop viewport for the homepage and
  contact page. Confirm the hero reserves its layout, keyboard focus remains
  visible, and a contact failure preserves entered data with a retry action.
- Review the social preview of the production homepage after the canonical
  origin is live. The crawler and static check validate markup; social networks
  can cache previews and may need a fresh scrape.

This check intentionally collects no names, emails, form answers, or other
free text. Public-funnel metadata is limited to short source tokens and is
retained under the existing analytics retention policy.