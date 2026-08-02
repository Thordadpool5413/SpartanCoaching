# Web ↔ iOS Field Kit parity

## Mobile tools architecture (D4–D5)

- **Catalog:** `(tabs)/tools.tsx` browse mode — `FIELD_KIT_TOOLS` priority, opens native tab / dedicated route / tool-web.
- **Role-Play:** `components/RolePlayTool.tsx` (extracted from monolith).
- **Results:** `components/FieldResultPanel.tsx` — copy, share, save, loading skeleton, PHI disclaimer.
- **Saved:** `components/SavedResponsesSection.tsx`.
- **Tab keys:** `lib/toolTabs.ts`.
- **Clinical vault (D6):** `lib/clinicalVaultTheme.ts` + `ClinicalVaultChrome` — calm amber instrument chrome, no Field Kit marketing language on vault tools.

## Shared packages

| Package | Purpose |
|---------|---------|
| `@workspace/design-tokens` | Colors, radius, spacing, type roles |
| `@workspace/field-kit-catalog` | Tool inventory + `mobile: native \| webview \| missing` |

## Mobile delivery

- **native** — Expo screen / tools tab
- **webview** — `app/tool-web.tsx` loads full Field Kit route with session token
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
