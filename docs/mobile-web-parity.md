# Web ↔ iOS Field Kit parity

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

## Parity checklist (every mobile UI PR)

- [ ] Colors from `@workspace/design-tokens` / `useColors()` only
- [ ] Tool listed in `@workspace/field-kit-catalog` with correct `mobile` field
- [ ] Command Center reachable as a primary tab
- [ ] No PHI in tool copy; Field mode banner where AI is used
