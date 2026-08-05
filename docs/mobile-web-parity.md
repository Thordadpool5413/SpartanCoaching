# Web ↔ iOS membership parity

## Mobile tools architecture (D4–D5)

- **Catalog:** `(tabs)/tools.tsx` browse mode — `FIELD_KIT_TOOLS` priority, opens native tab / dedicated route / tool-web.
- **Role-Play:** `components/RolePlayTool.tsx` (extracted from monolith).
- **Results:** `components/FieldResultPanel.tsx` — copy, share, save, loading skeleton, PHI disclaimer.
- **Saved:** `components/SavedResponsesSection.tsx`.
- **Tab keys:** `lib/toolTabs.ts`.
- **Clinical vault (D6):** `lib/clinicalVaultTheme.ts` + `ClinicalVaultChrome` — calm amber instrument chrome, no membership marketing language on vault tools.

## Shared packages

| Package | Purpose |
|---------|---------|
| `@workspace/design-tokens` | Colors, radius, spacing, type roles |
| `@workspace/field-kit-catalog` | Tool inventory + `mobile: native \| webview \| missing` |

## Mobile delivery

- **native** — Expo screen / tools tab
- **webview** — `app/tool-web.tsx` loads full membership tool route with session token
- **missing** — treat as a bug; do not ship silently incomplete

## Production API

Set one of:

- `EXPO_PUBLIC_API_URL=https://your-host.example` (preferred)
- `EXPO_PUBLIC_DOMAIN=your-host.example` (https assumed)

## Delivery map (current)

| Area | Website | Mobile |
|------|---------|--------|
| Coaching marketing | Home, Services, Method, About, Contact | Home (coaching-first), Contact tab |
| Sales Command Center | `/tools/sales-workflow` | **Command** tab → native |
| Core Field tools | Tools grid | **Tools** tab catalog (native tabs + secured WebView) |
| Calculators (activity, ROI, rep cost) | Native web pages | **Native** app screens |
| Call Transcriber | Native web page | **WebView** secured session (`/tool-web`) |
| Advanced AI library | `/tools/ai/*` | `/ai-tools/*` native screens |
| Learn | articles, podcasts, resources, drills, quiz, method | Learn tab + WebView shortcuts for method/drills/quiz |
| Account / billing | `/account` Stripe | Account tab + Stripe links |
| Auth | register / login | login + open register on web |

## Parity checklist (every mobile UI PR)

- [ ] Colors from `@workspace/design-tokens` / `useColors()` only
- [ ] Tool listed in `@workspace/field-kit-catalog` with correct `mobile` field
- [ ] Command Center reachable as a primary tab
- [ ] No tool left as `mobile: "missing"`
- [ ] No PHI in tool copy; Field mode banner where AI is used

## Live parity smoke (post-deploy)

After Replit is on `origin/main` and **Published**, prove web + iOS share the host:

```bash
# From repo root (no secrets required)
node scripts/smoke-health.mjs https://spartanhospicecoaching.com
node scripts/smoke-parity.mjs https://spartanhospicecoaching.com
```

`smoke-parity` checks:

1. `/api/healthz` live  
2. Public Learn feeds (`articles` / `podcasts` / `resources`) shaped for mobile Learn  
3. Gated routes return **401/403** without session (`/api/auth/me`, billing, onboarding, AI tools, sales-workflow today, objections, chat)  
4. HTML landers include **Hospice Sales Pro**  
5. Legacy `/membership` and `/field-kit` still resolve (redirect or SPA)

### Authenticated cross-surface (same seat)

**Automated (Bearer token path — same as iOS):**

```bash
SITE_URL=https://spartanhospicecoaching.com \
PARITY_EMAIL=you@your-org.com \
PARITY_PASSWORD='your-password' \
node scripts/smoke-parity-auth.mjs

# Avoid AI quota:
PARITY_SKIP_AI=1 SITE_URL=… PARITY_EMAIL=… PARITY_PASSWORD=… node scripts/smoke-parity-auth.mjs
```

This proves login, `/api/auth/me`, onboarding, billing, Command `today`, AI tools list, optional objection generate, and logout — the contracts **both** web and iOS use after sign-in.

**Manual UI (after automated pass):**

```
[ ] Web login → /portal entitled
[ ] iOS TestFlight login → Home entitled shell
[ ] Same Account status (trial / active / billing) on both
[ ] Objection (or Command today) works on both
[ ] Checklist tick on one surface appears after refresh on the other
```

iOS production builds must set `EXPO_PUBLIC_API_URL=https://spartanhospicecoaching.com` (EAS secret).

### Sign-off matrix

| Layer | Command / action | Owner |
|-------|------------------|--------|
| Public API | `node scripts/smoke-parity.mjs $SITE_URL` | Ops / CI optional |
| Health | `node scripts/smoke-health.mjs $SITE_URL` | Ops post-deploy |
| Entitled seat | `smoke-parity-auth.mjs` with `PARITY_*` | Ops |
| Web UI | `/portal` + one tool | Human |
| iOS UI | TestFlight login + same tool | Human |
