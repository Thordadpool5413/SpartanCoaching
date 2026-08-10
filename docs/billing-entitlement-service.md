# Billing vs product entitlement (HSP-08 Slice A)

Canonical module: `artifacts/api-server/src/billing/entitlementService.ts`.

## Rules

1. **Product access** (`productAccess` / `fieldKit.allowed`) is decided only on the server via `evaluateFieldKitAccess` + org lifecycle — never by web or iOS payment SDKs.
2. **Billing source** (`trial_evaluation` | `stripe_individual` | `stripe_corporate` | `offline_contract` | `comp` | …) is metadata about how access is funded.
3. Clients read `entitlement` on `GET /api/auth/me` and `GET /api/billing/status`.
4. Individual Checkout is blocked when already subscribed (`ALREADY_SUBSCRIBED`), comp, corporate, or platform.

## App Store note

Native StoreKit IAP is **not** implemented. Digital membership is sold through **web Stripe** (Account / portal). Do not ship alternate in-app iOS payment for the same digital unlock until IAP + receipt validation maps into `resolveProductEntitlement`.

## Follow-up slices

- B: StoreKit IAP + server receipt → same entitlement path  
- C: Configurable past_due grace days that keep productAccess  
- D: Automated seat-removal when billable seats drop  
