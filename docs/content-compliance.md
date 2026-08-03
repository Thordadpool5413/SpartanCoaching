# Content & compliance review (Phase F)

Public marketing and product copy must stay **honest and under-claimed**. This checklist is for Nick (or counsel) before treating claims as final.

## Rules

1. **No ranking guarantees** — Do not claim “reps who rank at the top” or similar without named, permissioned proof.
2. **No headcount without basis** — Prefer tenure and process (“12+ years hospice-specific”) over “500+ coached” unless you can defend the number.
3. **No outcome guarantees** — No guaranteed referrals, admissions, census, or revenue (see agreements + disclaimer pages).
4. **Dual access paths** — Individuals can self-serve; teams/evaluations request access. Do not imply every visitor must “request → approve.”
5. **Hospice Sales Pro tools ≠ Clinical vault** — HSP tools: no PHI. Clinical vault: authorized only, educational decision support, ephemeral when live.
6. **Canonical domain** — spartanhospicecoaching.com in public SEO, emails, and app config.
7. **Product nouns** — Public UI names **Consulting** and **Hospice Sales Pro**. Do not ship Field Kit or generic Membership as the product label.

## Code sources of truth

| Topic | Location |
|-------|----------|
| PHI / clinical strings | `artifacts/spartan-coaching/src/lib/complianceCopy.ts` |
| Anonymized proof pack | `artifacts/spartan-coaching/src/lib/proof.ts` |
| Trust strip | `artifacts/spartan-coaching/src/components/TrustStrip.tsx` |
| Access Path A/B | `artifacts/spartan-coaching/src/components/AccessPaths.tsx` |
| Field disclaimers | `ToolDisclaimer.tsx`, `ClinicalToolDisclaimer.tsx` |

## Nick approval checklist

```
[ ] PROOF_PACK quotes (proof.ts) — keep anonymized or replace with named permissioned quotes
[ ] PROOF_STATS values — years / ethics OK; no inflated headcount
[ ] Hospice Sales Pro lander + social/trust strip — no ranking language
[ ] Store listing (mobile store/description.txt) — Hospice Sales Pro naming
[ ] Clinical vault hub copy + in-tool banners
[ ] Any new “case study” metrics before publish
```

## Status (code pass)

- Ranking / “500+ coached” marketing strings rewritten to process-based language (Phase F code pass).
- Shared `complianceCopy.ts` for Hospice Sales Pro + clinical vault wording.
- TrustStrip dual-path messaging aligned with Path A/B.
- Elite Phases 1–5 + Phase 6 ship-readiness copy on `main` (Redeploy required for live).
- **Still required:** Nick sign-off on proof pack quotes and any future hard metrics.
