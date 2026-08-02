# Spartan Coaching — Design System Master

**Signature:** Field command dark — deep ink / midnight navy, Spartan red as the only high-energy accent, Barlow Condensed display (sparingly), quiet body type, intentional red hairline rail.

## Audiences

- **Reps:** speed to one tool, command-center spine, field-ready results  
- **Directors / companies:** authority, ethics, team path, clear outcomes  
- **Clinical (PHI):** vault calm, no marketing chrome, ephemeral language  

## Surface tiers (quiet / default / emphasis)

Use **one tier per card**. Do not stack glow + rail + noise on every block.

| Tier | Class / usage | When |
|------|----------------|------|
| **Quiet** | `surface-quiet` · plain `bg-card` border | Dense lists, secondary cards, tool form fields, FAQ items |
| **Default** | `shadcn-card` / `Card` · light gradient fill, no top rail | Most marketing and portal cards |
| **Emphasis** | `elite-emphasis` or `elite-panel` | One mission card, primary CTA card, hero proof strip only |

### Surface shells (page-level)

| Shell | Class | Notes |
|-------|--------|--------|
| Page | `surface-page` / `page-persuasion` | Soft primary atmosphere; follows theme tokens |
| Band | `surface-band` | Alternating section strip |
| Inset | `surface-inset` | Tool / membership interiors |
| CTA invert | `surface-cta` | High-contrast band (fg/bg invert); keep white text inside |
| Chrome | `surface-chrome` | Sticky header/footer blur |

## Tokens (source of truth)

| Role | Token / value |
|------|----------------|
| Primary accent | `--primary` Spartan red (`0 85–88% ~48–58%` by mode) |
| Background default | Dark brand / midnight (`theme.ts` `midnight` / `.dark`) |
| Light marketing | `soft` / `warm` / `cool` BG presets — first-class for CEO screenshots |
| Display type | `--font-display` Barlow Condensed — **hero / H1 only** |
| Body type | `--font-sans` Inter (web); **SF Pro on iOS** (system) |
| Mono | JetBrains Mono (IDs, clinical refs) |
| Radius marketing | `rounded-2xl` cards, `rounded-xl` controls |
| Radius tools | Prefer `rounded-xl` / instrument density |
| Shadows | Token shadows; **lighter on `data-theme-mode="light"`** |
| Motion | 150–300ms ease-out; honor `prefers-reduced-motion` |

Web: `artifacts/spartan-coaching/src/index.css`, `lib/theme.ts`  
Shared RN: `lib/design-tokens` (`spartanDark` / `spartanLight`)

## Red usage rules

**Do use Spartan red for:**
- Primary CTAs (`Button` primary)
- Active nav underline / focus rings
- Kickers (`.text-kicker`) and sparse hairline rails on **emphasis** cards only
- Error / destructive actions

**Do not use red for:**
- Every card top rail (no global `shadcn-card::before` rail)
- Body text or large fills behind long copy
- Clinical vault marketing chrome
- Competing accents (one primary accent at a time)

Light mode: prefer slightly deeper primary (`primaryLight` ~48% L) so red text/icons stay readable on paper.

## Typography rules

| Role | Utility / stack | Allowed on |
|------|-----------------|------------|
| Hero | `.text-hero` + display | Marketing hero only |
| H1 | `.text-h1` + display | Page titles |
| H2–H3 | `.text-h2` / `.text-h3` | Prefer sans weight on long pages; display OK for short titles |
| Body | `.text-body` / `.text-body-lg` | Everything else |
| Kicker | `.text-kicker` | Section labels |
| Card titles | `CardTitle` | **Sans semibold** (not condensed) for calmer product UI |

## CTA hierarchy

| Surface | Primary | Secondary |
|---------|---------|-----------|
| Home | Book a strategy call | Preview Field Kit |
| Field Kit | Subscribe / create account | Preview tools |
| Portal | Next checklist / Command Center | All tools |
| Tools | Launch tool | Advanced library (de-emphasized) |
| Services | Book a strategy call | — |

## Do

- One floating chrome element max on a surface  
- Lucide (web) / Feather + SF Symbols (iOS) only — **no emoji icons**  
- Visible focus rings (`:focus-visible`)  
- Empty states with one clear action  
- Result panels: title, body, copy, disclaimer  
- Light mode: token colors (`text-foreground`, `text-muted-foreground`) — avoid hard-coded `text-white` on paper  

## Don't

- Generic blue SaaS rebrand  
- Competing FABs (chat + sticky contact) on Home  
- Equal weight for 13 tools (Command Center is the hero)  
- Sales chrome inside PHI clinical mode  
- Hard-coded pure white body text on light themes  
- Over-decoration: glow + rail + noise on every card  

## Implementation map

- Web tokens: `artifacts/spartan-coaching/src/index.css`, `tailwind.config.ts`, `lib/theme.ts`  
- Shells: `Layout.tsx`, `FieldKitToolLayout.tsx`, `Portal.tsx`, `Tools.tsx`  
- Primitives: `components/ui/button.tsx`, `card.tsx`, `empty.tsx`, `ToolResultPanel.tsx`  
- Advanced library: `AiToolsHub.tsx` (Field AI vs Clinical vault)  
- AI tool run: `AiTool.tsx` (no Field Kit chrome in PHI; vault banner; result panel)  
- Mobile type: `artifacts/spartan-coaching-mobile/lib/typography.ts`  
- Mobile icons: Feather / SF Symbols (no emoji)  

## Phase status

| Phase | Status |
|-------|--------|
| A–B Trust + Home + header | Shipped |
| C Product web craft | Shipped |
| D iOS craft (SF type, icons, short guest home) | Shipped (D1–D3); D4–D5 RolePlay extract + FieldResultPanel |
| E Tokens, light mode, QA checklist | Shipped |
| F Content / compliance (code pass) | Shipped — Nick proof sign-off still open |
| D4–D7 Tools split / TestFlight | Backlog |

## QA matrix (responsive)

Check header + primary CTA at: **375 · 390 · 768 · 1024 · 1280 · 1440**.  
Header brand zone must never collide with nav; utility collapses to sheet &lt; md.

## Production verification

See `docs/production-verification.md` (required per design release).
