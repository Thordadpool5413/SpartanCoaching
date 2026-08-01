# Spartan Coaching — Design System Master

**Signature:** Field command dark — deep ink / midnight navy, Spartan red as the only high-energy accent, Barlow Condensed display, quiet body type, red hairline rail.

## Audiences

- **Reps:** speed to one tool, command-center spine, field-ready results  
- **Directors / companies:** authority, ethics, team path, clear outcomes  
- **Clinical (PHI):** vault calm, no marketing chrome, ephemeral language  

## Tokens (source of truth)

| Role | Token / value |
|------|----------------|
| Primary accent | `--primary` Spartan red (`0 85–88% ~56%`) |
| Background default | Dark brand / midnight (`theme.ts` `default` / `.dark`) |
| Surfaces | `surface-page`, `surface-band`, `page-persuasion` only for section bands |
| Display type | `--font-display` Barlow Condensed |
| Body type | `--font-sans` Inter |
| Mono | JetBrains Mono (IDs, clinical refs) |
| Radius marketing | `rounded-2xl` cards, `rounded-xl` controls |
| Radius tools | Prefer `rounded-xl` / instrument density |
| Shadows | `shadow-elite`, `shadow-elite-red` |
| Motion | 150–300ms ease-out; honor `prefers-reduced-motion` |

## Typography scale (CSS utilities)

- `.text-hero` — marketing hero only  
- `.text-h1` / `.text-h2` / `.text-h3`  
- `.text-body` / `.text-body-lg`  
- `.text-kicker` — uppercase tracking label  

## CTA hierarchy

| Surface | Primary | Secondary |
|---------|---------|-----------|
| Home | Book a strategy call | Preview Field Kit |
| Field Kit | Subscribe / create account | Preview tools |
| Portal | Next checklist / Command Center | All tools |
| Tools | Launch tool | Advanced library (de-emphasized) |

## Do

- One floating chrome element max on a surface  
- Lucide icons only (no emoji icons)  
- Visible focus rings (`:focus-visible`)  
- Empty states with one clear action  
- Result panels: title, body, copy, disclaimer  

## Don't

- Generic blue SaaS rebrand  
- Competing FABs (chat + sticky contact) on Home  
- Equal weight for 13 tools (Command Center is the hero)  
- Sales chrome inside PHI clinical mode  
- Hard-coded pure white body text on light themes  

## Implementation map

- Web tokens: `artifacts/spartan-coaching/src/index.css`, `tailwind.config.ts`, `lib/theme.ts`  
- Shells: `Layout.tsx`, `FieldKitToolLayout.tsx`, `Portal.tsx`, `Tools.tsx`  
- Primitives: `components/ui/button.tsx`, `card.tsx`, `empty.tsx`, `ToolResultPanel.tsx`  
