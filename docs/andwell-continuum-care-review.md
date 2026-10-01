# Andwell Continuum Care Review

## Purpose

The Andwell Continuum Care Review extends the protected patient-record workflow with a screening layer that asks one additional question after the clinical evidence draft is created:

> Based on documented needs already surfaced from the record, are there additional Andwell services that a qualified reviewer should consider?

The feature does **not** determine eligibility, coverage, level of care, admission, treatment, orders, or enrollment. It produces potential care opportunities for human review.

## Runtime boundary

The workflow remains inside the existing protected patient-review path:

1. Authorized clinician starts a protected review session.
2. Patient records are uploaded, scanned, extracted, and processed under the existing clinical controls.
3. The Medical Record LCD Verifier creates the deidentified clinical evidence draft.
4. If `ANDWELL_CONTINUUM_REVIEW_ENABLED=true`, the server runs the deterministic Andwell screening rules over that draft.
5. Potential services are returned in the same one-time response.
6. Uploaded clinical objects are purged before the response is returned.
7. No continuum opportunity is automatically saved to sales history, CRM, referral history, or a patient enrollment workflow.

The screening layer never receives a separate copy of the raw chart. It works only from the already-produced clinical output.

## Registry

Source: `artifacts/api-server/src/clinical/andwellCareRegistry.ts`

Current registry version: `andwell-public-2026-10-01-v1`

The MVP registry contains Andwell programs and services identified from Andwell's public service pages, including:

- Home Healthcare
- CareGivers / In-Home Caregiving
- GUIDE Dementia Care Management
- Mobile Wound Care
- Palliative Medicine
- Hospice Home Care
- Hospice House / Gosnell Memorial Hospice House
- Forget-Me-Not Dementia Program
- Emotional & Spiritual Support
- Bereavement Support
- Outpatient Mental Health / Co-Occurring Counseling
- Adult and Children's Behavioral Health Homes
- Community Care Team
- H.O.M.E.
- Adult HCBS
- Adult Day Program
- Children's RCS
- Adult Therapy Care
- Pediatric Therapy
- Audiology
- Maternal & Child Health

Each registry entry contains a stable service ID, service family, public description, responsible review role, public source URL, screening checks, and optional public service-area mapping.

The public registry is a **starter catalog**, not Andwell's authoritative eligibility policy. Before production activation for an Andwell deployment, Andwell clinical/operations owners should approve a versioned internal registry containing current inclusion criteria, exclusions, payer rules, geography, capacity, required orders/referrals, program compatibility, and routing ownership.

## Opportunity contract

Each potential service includes:

- service ID and name
- service family
- why the service surfaced
- supporting draft evidence and source path
- checks that remain unresolved
- county availability status when county context is supplied
- responsible review role
- Andwell source URL
- `humanReviewRequired: true`
- `eligibilityDetermined: false`

Availability values are deliberately limited to:

- `available`: county appears in the current registry
- `not_listed`: county is not listed for that service in the current registry
- `verify`: geography is unknown or the program is not county-mapped in the registry

`not_listed` is not a clinical or coverage denial.

## Screening behavior

The MVP matcher is deterministic. It looks for documented signal groups in the deidentified clinical output. Some service pathways require multiple independent signal categories before they are surfaced.

Examples:

- serious illness + symptom burden can surface Palliative Medicine
- terminal/advanced illness + documented decline can surface Hospice Home Care for clinical review
- dementia evidence can surface GUIDE review
- chronic/non-healing wound evidence can surface Mobile Wound Care
- ADL dependence or caregiver strain can surface CareGivers
- complex utilization + social barriers can surface Community Care Team
- homelessness/housing instability can surface H.O.M.E.
- pediatric status + developmental/therapy needs can surface Pediatric Therapy

The matcher does **not** interpret missing information as a negative finding. No flag means only that the facts in the current draft did not satisfy a screening rule.

## Optional context

Web and iOS clients can supply:

- patient county
- current Andwell service

The current service is suppressed from additional-service suggestions. County is used only to label public service-area availability.

Future organization-specific deployment should obtain these values from authoritative patient/encounter context rather than relying on manual entry.

## Governance before production

Before an Andwell production rollout:

1. Replace or approve the public registry with Andwell-owned program criteria.
2. Assign a clinical/operational owner to every service definition.
3. Version effective dates and changes.
4. Add payer/coverage rules only from approved authoritative sources.
5. Add live capacity/accepting-referrals status from an Andwell-controlled system.
6. Add explicit compatibility/exclusion rules between programs.
7. Validate screening performance against synthetic/expert-adjudicated cases.
8. Establish review queues, routing SLAs, dispositions, and escalation ownership.
9. Decide the approved write-back/referral workflow after human review.
10. Keep patient preference and normal consent/referral processes outside autonomous AI control.

## Feature flag

`ANDWELL_CONTINUUM_REVIEW_ENABLED=true`

When disabled:

- the service catalog endpoint returns `enabled: false`
- no Andwell opportunity matcher runs
- existing patient-review behavior remains unchanged

## Tests

`artifacts/api-server/src/clinical/andwellContinuumReview.test.ts` covers:

- multi-signal Palliative Medicine screening
- dementia/GUIDE screening
- suppression of an already-current service
- wound-care screening
- hospice minimum-signal threshold
- missing-information behavior
- county availability behavior
- registry uniqueness and review ownership
