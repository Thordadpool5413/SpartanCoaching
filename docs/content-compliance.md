# Content & compliance review (Phase F)

Public marketing and product copy must stay **honest and under-claimed**. This checklist is for Nick (or counsel) before treating claims as final.

## Rules

1. **No ranking guarantees** — Do not claim “reps who rank at the top” or similar without named, permissioned proof.
2. **No headcount without basis** — Prefer tenure and process (“12+ years hospice-specific”) over “500+ coached” unless you can defend the number.
3. **No outcome guarantees** — No guaranteed referrals, admissions, census, or revenue (see agreements + disclaimer pages).
4. **Dual access paths** — Individuals can self-serve; teams/evaluations request access. Do not imply every visitor must “request → approve.”
5. **Membership tools ≠ Clinical vault** — Membership tools: no PHI. Clinical vault: authorized only, educational decision support, ephemeral when live.
6. **Canonical domain** — spartanhospicecoaching.com in public SEO, emails, and app config.

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
[ ] Membership hero + membership social strip — no ranking language
[ ] Store listing (mobile store/description.txt)
[ ] Clinical vault hub copy + in-tool banners
[ ] Any new “case study” metrics before publish
```

## Status (code pass)

- Ranking / “500+ coached” marketing strings rewritten to process-based language (Phase F code pass).
- Shared `complianceCopy.ts` for membership + clinical vault wording.
- TrustStrip dual-path messaging aligned with Path A/B.
- **Still required:** Nick sign-off on proof pack quotes and any future hard metrics.
