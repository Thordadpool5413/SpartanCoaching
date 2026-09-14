# CMS Medicare Knowledge Hub architecture

The Medicare platform is a first-class Spartan Elite capability shared by the website and native iOS app. Both clients use `/api/v1/medicare`; authentication, entitlement, tenant identity, persistence, and alerts stay server-controlled.

## Workspace map

| Workspace | Primary operations | Durable state |
|---|---|---|
| National command | dashboard, provider search, county detail | CMS cache |
| Provider 360 | provider, intelligence, capabilities, history | snapshots |
| Economics | HCRIS, SSVI, county economics | CMS cache |
| Geography | service geography, white space, expansion screening | CMS cache |
| Territory | public map and private deployment | operational truth |
| Referral markets | hospitals, state physicians, Physician 360 | physician warehouse |
| Monitoring | watchlists, manual checks, alerts | tenant/member records |
| Decision room | decision actions and win/loss | tenant/member records |
| Data operations | source health, coverage, diagnostics | system run records |

## Trust boundaries

- All routes require an authenticated Elite seat at the Spartan bridge.
- Private record buckets use `organizationId:memberId`; IDs supplied by a client never select another tenant.
- Public CMS data is cached separately from member decisions and operational truth.
- Missing CMS evidence remains unavailable or limited; it is never converted to zero.
- Alert copy uses Spartan's privacy-safe in-app notification channel.
- Web and iOS render native controls against the same API contract. iOS does not embed the website.

## Source ownership

The CMS query, normalization, scoring, HCRIS, SSVI, geography, monitoring, and physician warehouse modules are maintained under `artifacts/api-server/src/medicare-intelligence`. Spartan-specific runtime integration lives in `runtime.ts` and `routes/medicareIntelligenceRoutes.ts`.
