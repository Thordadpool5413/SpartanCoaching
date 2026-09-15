# Hospice Sales Pro workspace system

## Scope and priority

This document governs the authenticated web workspace owned by `data-route-surface="workspace"`, `AppShell`, and `.field-workspace`. Public pages, signed-out previews, locked previews, expired/evaluation previews, and native mobile remain outside the visual redesign.

Decisions resolve in this order: security and privacy, data truth, verified behavior, persistence truth, route/API compatibility, accessibility, existing architecture, design system, visual preference.

## Product principles

1. **Objective first.** The active objective and its real work dominate each screen.
2. **Evidence before inference.** Unknown, unavailable, partial, unresolved, and zero remain distinct.
3. **Continuity must be true.** “Saved,” “synced,” “completed,” and “resumable” appear only when the implementation guarantees them.
4. **One dominant working region.** Context is subordinate and moves to a drawer on narrow web.
5. **Quiet authority.** Spartan identity comes from hierarchy, spacing, typography, decisive actions, restrained red, and explicit state.
6. **Public isolation.** Shared components receive workspace variants or scoped styles; public and preview rendering remains unchanged.

## Information architecture

Primary destinations: Today, Command, Medicare, Tools, Coach, Library, My Work.

Utilities: Search, Notifications, Appearance, Account, Organization, Platform Admin.

| Destination | Purpose | Dominant region |
|---|---|---|
| Today | Daily operating brief | Now / Continue / Next / Waiting rows supported by real state |
| Command | Field execution spine | Chronological active work |
| Medicare | Healthcare intelligence | Provider/market evidence and uncertainty |
| Tools | Outcome-led entry | Current job and appropriate tool |
| Coach | Professional coaching session | Active objective and conversation |
| Library | Editorial resource discovery | Search and browsable resources |
| My Work | Continuity center | Real resumable work and persistence state |
| Account | Calm management | Profile, appearance, notifications, privacy, membership, billing |
| Organization | Tenant administration | Tables, focused forms, inspection |
| Platform Admin | Operational intervention | Critical, actionable, monitor, reference |

## Rendering-mode matrix

`PUBLIC`, `PREVIEW`, `LOCKED`, `WORKSPACE`, and `REDIRECT` are product states, not visual themes. Server authorization remains authoritative.

| Surface | Signed out | Auth / no access | Standard | Elite | Org admin | Platform admin |
|---|---|---|---|---|---|---|
| `/portal*` | Redirect | Workspace with entitlement messaging | Workspace | Workspace | Workspace | Workspace |
| `/tools` | Public | Workspace catalog with locked state | Workspace | Workspace | Workspace | Workspace |
| Standard `/tools/*` | Preview | Locked | Workspace | Workspace | Workspace | Workspace |
| `/tools/intelligence`, `/spartan-intelligence` | Redirect | Locked | Elite gate | Workspace | Contract-dependent Elite gate | Workspace |
| `/resources*`, `/drills`, `/quiz`, `/learn/*` | Public or preview per current route | Locked where gated | Workspace | Workspace | Workspace | Workspace |
| `/my-work*` | Redirect | Locked | Workspace | Workspace | Workspace | Workspace |
| `/account*` | Redirect | Workspace | Workspace | Workspace | Workspace | Workspace |
| `/org/admin*` | Redirect | No access | No access | No access unless role allows | Workspace | Workspace |
| `/admin*` | Redirect | No access | No access | No access | No access | Workspace |

## Lifecycle and capability terms

- **Public:** marketing/editorial access without a session.
- **Preview:** real layout with mutations and private data unavailable.
- **Locked:** authenticated or expired state without required entitlement.
- **Workspace:** authenticated product environment.
- **Redirect:** session required before rendering.
- **Available:** capability is supported and authorized now.
- **Unavailable:** capability cannot be used; never represented as zero.
- **Partial:** some required evidence loaded; explain what is absent.
- **Stale:** evidence loaded but freshness exceeds the accepted window.
- **Resumable:** a durable identifier and retrieval path exist.

## Visual language and semantic tokens

The workspace uses neutral ink/navy structure, warm canvas surfaces, restrained Spartan red for primary action and meaningful attention, and semantic success/warning/danger colors. Decorative gradients, glass, glow, neon, giant imagery, property or healthcare photography, motivational content, oversized KPI strips, and equal-weight card mosaics are excluded.

Light and dark are complete workspace modes:

- **Light:** dark navy navigation, warm off-white canvas, charcoal text, warm-gray separation, restrained red.
- **Dark:** near-black/navy navigation, charcoal work surfaces, warm off-white text, restrained red.

Public route appearance remains route-controlled and cannot overwrite the saved workspace appearance.

## Typography, spacing, and density

- Functional UI uses a readable sans-serif. Condensed display type is limited to short page or work titles.
- Roles: page title, section, work title, body, small body, label, metadata, data/number.
- Navigation, forms, tables, evidence, admin, and long answers never use display type.
- Desktop navigation targets 232–256px expanded and 68–76px collapsed; top utility bar 52–56px.
- Desktop canvas gutter is approximately 24px; narrow web approximately 16px.
- Inspector width is approximately 300–340px when context justifies it.
- Standard contained surfaces use modest 6–10px radii, subtle borders, and spacing-led hierarchy.

## Components and interaction

- Buttons use sentence-case action labels and keep the same verb through feedback.
- Forms preserve input after recoverable failure and expose labels, validation, pending state, and server confirmation.
- Tables remain tables on narrow screens when comparison matters; horizontal containment or focused row inspection is preferred over card conversion.
- Charts include textual context, accessible labels, source/freshness where applicable, and honest unavailable states.
- Modals, drawers, menus, and popovers own elevation; normal work regions do not float.
- State blocks cover loading, empty, filtered empty, no results, error, timeout, partial, stale, locked, no access, rate limited, AI unavailable, network unavailable, sync failure, success, and first use.
- Skeletons approximate final geometry; empty does not render before loading resolves.

## Tool workbench grammar

All tools make header, input, primary action, process, result, review, and next supported action recognizable. Composition varies by category: generative, research, conversational, processing, planning, measurement, and workflow.

Evidence and generated recommendation remain visually distinct. Email tools never imply sending when they only draft. Role-play separates user, simulated contact, and coach feedback. Processing tools expose validation, progress, privacy, errors, and retry. Measurement tools expose grouped inputs, assumptions, result hierarchy, and explanations without giant KPI tiles.

## Persistence matrix

The executor must verify each entry against current behavior before changing copy.

| Surface | Server | Browser | Session-only | Download | My Work | Reload | Logout/account switch | Other device |
|---|---|---|---|---|---|---|---|---|
| Command work | Current API contract | Query cache / limited drafts | Some transient input | Where currently supported | Durable records only | Durable records reload | User-scoped state cleared | Only server-backed records |
| AI tool output | Saved-output API only when explicitly saved | Active result state | Unsaved output | Where supported | Explicit saved outputs | Only saved output | Clear unsaved/private state | Saved outputs only |
| Coach | Conversation API where present | Active conversation state | Unsaved prompt | No implied export | Existing integration only | Server history only | Clear cache and draft | Server history only |
| Resource work | Existing resource-work API | Draft state where implemented | Surface-dependent | Existing download behavior | Server-owned saved work | Per implementation | Clear user-scoped draft/cache | Server-backed only |
| Medicare private work | Tenant/user-scoped API | Active provider/tab/filter | Selection may be ephemeral | Existing export only | Existing records only | URL-safe selection may reload | Clear private cache | Server-backed only |
| Appearance | Existing browser preference | Workspace-global preference | No | No | No | Yes | Shared preference, not private content | No claim |
| Recent | No | Local browser history | No | No | No | Yes | Must be user-scoped or cleared | No |

## Browser-state ownership

| Store | Purpose | Owner/scope | Logout and account change |
|---|---|---|---|
| React Query | Server response cache | User/session | Clear private queries before another account renders |
| Appearance storage | Workspace theme | Workspace global | Preserve safe appearance only |
| Recent workspace storage | Navigation continuity | User-scoped | Clear or namespace by member |
| Tool drafts/results | Active work | User-scoped or ephemeral | Clear private unsaved state |
| URL | Safe navigation state | Route | Never store PHI, prompts, transcripts, notes, credentials, or private generated text |

Malformed or obsolete browser values fail safely. Format migrations support prior valid values, run once, and never leak values across accounts.

## Runtime correctness

- Cancel or ignore stale requests when selection changes.
- Disable duplicate mutations while pending.
- Update existing caches/state after confirmed mutations without clobbering active input.
- Preserve recoverable input.
- Keep real streaming behavior; never simulate it.
- Render generated content safely without raw HTML.

## Focus, responsive behavior, and accessibility

Workspace navigation sets logical focus; query-only changes avoid unnecessary top resets; generated results receive intentional focus; overlays restore focus. Public ScrollToTop behavior remains unchanged.

Required visual checks: 320, 390, 430, 480, 768, 1024, 1366×768, 1440×900, 1920×1080, including constrained heights. Narrow web uses a single dominant flow and moves secondary context into a drawer or sheet.

Applicable WCAG 2.2 AA requirements include keyboard access, visible and unobscured focus, skip navigation, headings, labels, accessible names, non-color status, reduced motion, 200% zoom, 320px reflow, target sizes, and appropriate status announcements.

## Print, export, and performance

Print/export preserves existing data, provenance, hierarchy, and privacy behavior. No new export promise is made.

Use existing budgets. Avoid new heavy dependencies, giant assets, decorative blur, duplicate requests, uncontrolled rerenders, and large unvirtualized collections. Inspect Medicare, Admin, My Work, and Coach interaction performance.

## Contract traceability

Every mandatory contract section maps to this document, the progress ledger, implementation evidence, and final validation:

- Repository/scope/dual-use/preservation: Scope, rendering matrix, progress ledger.
- Data/persistence/browser/privacy: Persistence and browser ownership matrices plus account-switch tests.
- Design system and exclusions: Visual language through component sections.
- Page criteria: Information architecture, tool grammar, route rows in the ledger.
- State/runtime/URL/focus: Interaction and runtime sections.
- Responsive/accessibility/performance: Final system sections and viewport evidence.
- Phases/gates/testing/release language: Progress ledger and final verification.
- Final 33-question review: completion checklist in the progress ledger.
