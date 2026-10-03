# SPARTAN HOSPICE AI
## AUTHORITATIVE EXPERT KNOWLEDGE PLATFORM ENGINEERING MANDATE

REPOSITORY:

`Thordadpool5413/SpartanCoaching`

CANONICAL BRANCH:

`main`

==================================================
0. PURPOSE OF THIS DOCUMENT
==================================================

This document is the governing engineering specification for the Spartan Hospice AI authoritative knowledge platform.

It defines:

- architectural boundaries
- source-of-truth rules
- authoritative knowledge requirements
- clinical safety rules
- data provenance requirements
- implementation sequencing
- model/tool boundaries
- testing requirements
- human-approval requirements
- production-readiness standards

This document is NOT intended to be pasted in full into every routine coding task.

Permanent repository rules should be represented in:

- `AGENTS.md`
- architecture documents
- ADRs
- the active ExecPlan
- security documentation
- clinical AI contracts

Individual implementation agents should receive ONE bounded implementation packet derived from this specification.

This specification is the constitution.

Implementation packets are the work orders.

Do not ask a coding agent to simultaneously interpret this entire specification and implement the entire platform in one uncontrolled change.

==================================================
1. MISSION
==================================================

Build the authoritative knowledge and reasoning infrastructure that allows Spartan Hospice AI to operate as an expert hospice decision-support platform.

This is not a prompt-writing exercise.

This is not an instruction to make a language model memorize hospice.

This is not an instruction to give the model unrestricted internet access.

This is a production knowledge-engineering program.

The governing principle is:

**THE MODEL IS NEVER THE AUTHORITY.**

The model reasons over:

1. patient evidence
2. applicable authoritative regulatory and policy sources
3. approved terminology and code systems
4. authoritative medication knowledge
5. approved clinical evidence
6. deterministic calculations
7. versioned Spartan clinical protocols
8. accountable human clinical judgment

Every material conclusion must be capable of answering:

- What patient evidence supports this?
- Where did that evidence come from?
- What authoritative source applies?
- Why does that source apply?
- Which version was used?
- What service date, payer, jurisdiction, or clinical context was used?
- What is fact versus inference?
- What information is missing?
- What information conflicts?
- What was not checked?
- What human review is required?

If Spartan cannot establish a required component, it must say so.

It must not guess.

==================================================
2. DEVELOPMENT PHI RULE
==================================================

Never use real PHI during:

- development
- testing
- CI
- ChatGPT
- Codex
- Replit
- GitHub
- fixtures
- screenshots
- documentation
- evaluation cases
- PR descriptions

Use synthetic clinical information only.

Real PHI belongs only inside explicitly approved production services and workflows after separate owner/compliance activation.

==================================================
3. ESTABLISH REPOSITORY TRUTH FIRST
==================================================

Before substantial implementation, inspect:

`AGENTS.md`

`.agent/PLANS.md`

`docs/execplans/clinical-cloud-implementation.md`

`docs/architecture/clinical-cloud-2026-10-01/*`

`docs/patient-record-review.md`

`docs/clinical-security-controls.md`

`docs/ai-tools-production-runbook.md`

`docs/repository-truth-audit.md`

`replit.md`

`package.json`

`pnpm-workspace.yaml`

Then inspect:

`artifacts/api-server/src/knowledge/*`

`artifacts/api-server/src/clinical/*`

`artifacts/api-server/src/routes/aiToolRoutes.ts`

`artifacts/api-server/src/routes/patientReviewRoutes.ts`

`artifacts/api-server/src/medicare-intelligence/*`

`lib/spartan-ai-tools/src/*`

`lib/spartan-ai-tools/src/tools/*`

`lib/db/src/schema/*`

`lib/db/migrations/*`

`scripts/*`

`.github/workflows/*`

Inspect actual implementation rather than trusting documentation alone.

Classify every relevant capability as:

`IMPLEMENTED`

`PARTIALLY_IMPLEMENTED`

`ARCHITECTURE_ONLY`

`STALE`

`MISSING`

`REQUIRES_LICENSE`

`REQUIRES_EXTERNAL_CONFIGURATION`

Do not create a duplicate implementation when canonical functionality already exists.

==================================================
4. SYNCHRONIZE GIT
==================================================

Before modification:

```bash
git status
git remote -v
git fetch origin --prune
git checkout main
git pull --ff-only origin main
git rev-parse HEAD
git status
```

Record the starting SHA.

Do not discard human work.

Do not overwrite uncommitted changes.

Create a descriptive feature branch.

Never force-push `main`.

==================================================
5. EXISTING CAPABILITIES MUST BE VERIFIED, NOT REBUILT BLINDLY
==================================================

The repository is expected to already contain some or all of:

- OpenAI Responses API integration
- structured Zod outputs
- `store:false`
- AI tool registry
- admission/eligibility analysis
- documentation-gap analysis
- medical-record/LCD verification
- Medicare LCD advisor
- evidence citation schema
- patient-record PDF/image/DOCX/TXT handling
- basic file-signature checks
- malware-scanning integration points
- temporary GCS clinical storage
- coverage snapshots
- CMS Coverage API synchronization
- curated hospice policy guidance
- NPI lookup
- CMS provider intelligence
- Medicare market intelligence
- PHI runtime gates
- clinical permission controls
- human-review requirements
- Google clinical-cloud architecture
- CI/release/security gates

Verify each against current `main`.

Preserve working canonical implementations.

Improve or replace only where evidence justifies it.

==================================================
6. TARGET SYSTEM
==================================================

The target reasoning architecture is:

```text
PATIENT RECORDS
      |
      v
DOCUMENT EXTRACTION
      |
      v
NORMALIZED PATIENT EVIDENCE
      |
      +------------------------------+
      |                              |
      v                              v
AUTHORITATIVE KNOWLEDGE      DETERMINISTIC SERVICES
      |                              |
      v                              v
LAW / REGULATION             CALCULATIONS
CMS POLICY                   TERMINOLOGY NORMALIZATION
CODING                       UNIT CONVERSION
TERMINOLOGY                  APPLICABILITY
MEDICATION                   VALIDATION
CLINICAL EVIDENCE
      |
      +---------------+
                      v
                AUTHORITY RESOLVER
                      |
                      v
                 OPENAI REASONING
                      |
                      v
               STRUCTURED FINDINGS
                      |
                      v
               EVIDENCE VALIDATOR
                      |
                      v
                  HUMAN REVIEW
                      |
                      v
             APPROVED CLINICAL STATE
```

The reasoning model must not substitute pretrained memory for an available approved authoritative source.

==================================================
7. SEPARATE KNOWLEDGE CONTROL PLANE FROM DATA PLANE
==================================================

Build two distinct layers.

### KNOWLEDGE CONTROL PLANE

Responsible for:

- source registration
- source identity
- licensing
- ingestion
- versioning
- parsing
- normalization
- change detection
- validation
- clinical/compliance review
- approval
- activation
- deactivation
- revocation
- rollback
- freshness
- health
- dependency tracking
- change-impact analysis

### KNOWLEDGE DATA PLANE

Responsible for runtime:

- source lookup
- authority resolution
- applicability resolution
- terminology resolution
- regulatory retrieval
- coverage retrieval
- medication lookup
- evidence retrieval
- deterministic calculations
- patient-context retrieval

The AI model must never:

- approve
- activate
- revoke
- modify

authoritative knowledge.

==================================================
8. BUILD DOMAIN-SPECIFIC AUTHORITY
==================================================

Do NOT use one simplistic universal authority ladder.

Authority depends on the claim being made.

Implement an explicit domain-specific authority matrix.

Examples:

### LEGAL REQUIREMENT

Applicable statute

Official regulation

Applicable state law/regulation

Official administrative interpretation where appropriate

### MEDICARE COVERAGE

Federal Medicare rules

CMS national policy

Applicable MAC LCD

Applicable billing/coding article

Applicable CMS manual guidance

### MEDICARE PAYMENT

Applicable final rule

CMS payment files

Claims Processing Manual

CMS Change Requests / transmittals

### CODING

Official code set

Official coding guidelines

Applicable instructional notes

Approved licensed terminology where required

### DRUG IDENTITY

RxNorm or approved authoritative medication terminology

### DRUG LABELING

FDA-approved/current submitted product labeling through approved label sources

### DRUG INTERACTION

Approved validated interaction/pharmacology source

### CLINICAL EVIDENCE

Approved clinical guidelines

Systematic reviews/meta-analyses

Other peer-reviewed evidence based on evidence hierarchy

### FHIR SEMANTICS

FHIR R4 specification

Approved implementation guide/profile

### SPARTAN WORKFLOW

Approved Spartan operational/clinical protocol

A source may be highly authoritative for one claim type and irrelevant for another.

Never allow:

FDA labeling
to determine Medicare coverage

or:

an LCD
to substitute for pharmacology

or:

PubMed
to override regulation

or:

general model knowledge
to override applicable authoritative knowledge.

==================================================
9. BUILD A CLAIM-TYPE SYSTEM
==================================================

Every material knowledge claim or AI finding must be classified.

At minimum support categories equivalent to:

`LEGAL_REQUIREMENT`

`MEDICARE_COVERAGE_REQUIREMENT`

`MEDICARE_PAYMENT_RULE`

`MEDICARE_CLAIMS_RULE`

`CODING_RULE`

`CODE_DEFINITION`

`DRUG_IDENTITY`

`DRUG_LABEL_FACT`

`DRUG_INTERACTION_FACT`

`CLINICAL_RESEARCH_EVIDENCE`

`CLINICAL_PROTOCOL_GUIDANCE`

`PATIENT_SOURCE_FACT`

`DERIVED_PATIENT_FACT`

`CLINICAL_INFERENCE`

`WORKFLOW_GUIDANCE`

`QUALITY_REPORTING_RULE`

`COMPLIANCE_GUIDANCE`

The Authority Resolver uses claim type to determine what sources are eligible to support a claim.

==================================================
10. BUILD THE AUTHORITY RESOLVER AS A FIRST-CLASS SERVICE
==================================================

The Authority Resolver is a core production service.

It must not be implicit inside prompts.

Conceptual process:

```text
claim/question
      |
      v
claim type
      |
      v
payer
      |
      v
jurisdiction
      |
      v
service date
      |
      v
provider/setting context
      |
      v
applicable authority domains
      |
      v
approved source versions
      |
      v
authority bundle
```

The service must answer questions equivalent to:

- Which authority governs this type of claim?
- Which approved sources are applicable?
- Which versions were effective?
- Does jurisdiction matter?
- Does payer matter?
- Are required sources missing?
- Are sources conflicting?
- Is human escalation required?

The LLM must not determine authority solely through semantic similarity.

==================================================
11. BUILD THE APPLICABILITY ENGINE
==================================================

Authority alone is insufficient.

A source must also apply.

Implement deterministic applicability using relevant dimensions such as:

- claim type
- payer
- jurisdiction
- state
- MAC
- service date
- effective interval
- provider type
- care setting
- benefit period
- code-set edition
- product/formulation
- patient population where applicable
- source approval status
- source activation status

Runtime applicability states must include equivalent concepts for:

`APPLICABLE`

`NOT_APPLICABLE`

`INSUFFICIENT_CONTEXT`

`SOURCE_UNAVAILABLE`

`SOURCE_EXPIRED`

`SOURCE_REVOKED`

`CONFLICT_REQUIRES_REVIEW`

Never let vector similarity alone decide policy applicability.

==================================================
12. UNKNOWN IS A VALID RESULT
==================================================

Uncertainty is part of the product.

Do not force the AI to produce a conclusion when the evidence or authority is incomplete.

Use explicit semantics such as:

`UNKNOWN`

`NOT_CHECKED`

`SOURCE_UNAVAILABLE`

`NOT_APPLICABLE`

`INSUFFICIENT_EVIDENCE`

`INSUFFICIENT_PATIENT_CONTEXT`

`POLICY_NOT_CONFIGURED`

`PAYER_KNOWLEDGE_NOT_CONFIGURED`

`JURISDICTION_NOT_SUPPORTED`

`CONFLICTING_SOURCES`

`HUMAN_REVIEW_REQUIRED`

`CHECKED_NO_KNOWN_ISSUE`

`ISSUE_FOUND`

These states are not interchangeable.

Never translate:

`NOT_CHECKED`

into:

`NO_ISSUE_FOUND`.

Never translate:

`SOURCE_UNAVAILABLE`

into:

`SUPPORTED`.

A clinically useful system must know when it does not know.

==================================================
13. BUILD THE CANONICAL KNOWLEDGE REGISTRY
==================================================

Extend existing database architecture.

Do not create duplicate registries if canonical equivalents already exist.

Implement or map entities equivalent to:

`knowledge_sources`

`knowledge_documents`

`knowledge_versions`

`knowledge_sections`

`knowledge_claims`

`knowledge_citations`

`knowledge_licenses`

`knowledge_activation_events`

`knowledge_reviewers`

`knowledge_dependencies`

`knowledge_ingestion_runs`

`knowledge_ingestion_errors`

`knowledge_health`

`knowledge_source_alerts`

Each authoritative knowledge version must support appropriate metadata such as:

- publisher
- source type
- authority domain
- supported claim types
- title
- document identifier
- jurisdiction
- MAC
- payer
- source URL
- official publication URL
- edition
- version
- effective from
- effective to
- published at
- retrieved at
- raw content hash
- normalized content hash
- parser version
- license classification
- redistribution permissions
- model/prompt-use permissions
- customer-display permissions
- reviewer
- reviewer role
- approval date
- activation state
- superseded date
- superseding version
- revoked date
- revocation reason

==================================================
14. PRESERVE TRANSFORMATION PROVENANCE
==================================================

Preserve lineage from original source through runtime retrieval.

Conceptually:

```text
UPSTREAM RAW BYTES
        |
        v
RAW BYTE HASH
        |
        v
PARSER + VERSION
        |
        v
NORMALIZED DOCUMENT
        |
        v
NORMALIZED HASH
        |
        v
SECTIONS / CHUNKS
        |
        v
SECTION HASHES
        |
        v
KNOWLEDGE CLAIMS
        |
        v
APPROVED KNOWLEDGE BUNDLE
```

If OCR is used, record:

- OCR engine
- OCR version
- extraction timestamp
- page mapping
- quality indicators

A citation must be traceable to actual source content.

==================================================
15. KNOWLEDGE LIFECYCLE
==================================================

Implement a controlled lifecycle equivalent to:

```text
DETECTED
   ↓
FETCHED
   ↓
QUARANTINED
   ↓
PARSED
   ↓
DIFFED
   ↓
VALIDATED
   ↓
REVIEW_PENDING
   ↓
APPROVED
   ↓
ACTIVE
   ↓
SUPERSEDED
```

or:

`REVOKED`

Detection cannot automatically affect production reasoning.

Support rollback to the prior approved source/version/bundle.

==================================================
16. HUMAN APPROVAL ROLES
==================================================

AI cannot establish its own clinical ground truth.

Create explicit approval roles.

Examples:

### HOSPICE PHYSICIAN / MEDICAL DIRECTOR

Approves or reviews:

- physician-level eligibility reasoning standards
- prognosis reasoning frameworks
- physician clinical protocols
- high-risk clinical reasoning gold standards

### HOSPICE CLINICAL LEADER

Approves or reviews:

- documentation expectations
- care-process interpretation
- workflow/protocol relevance
- nursing/clinical operational standards

### PHARMACIST

Approves or reviews:

- medication protocols
- interaction rules
- pharmacology evaluation cases
- medication safety logic

### CERTIFIED CODER / BILLING EXPERT

Approves or reviews:

- coding rules
- coding gold standards
- billing rules
- claim logic
- code sequencing

### COMPLIANCE EXPERT

Approves or reviews:

- Medicare policy interpretation
- documentation/compliance logic
- audit-risk logic
- regulatory policy bundles

The system must store:

- reviewer identity
- reviewer role
- review date
- approved version
- review expiration/review-due date where relevant

The model may draft.

The model may compare.

The model may identify conflicts.

The model may not certify its own clinical truth.

==================================================
17. SOURCE UPDATE MONITORING
==================================================

Implement scheduled source monitoring.

For every source define:

- update mechanism
- expected update cadence
- freshness SLA
- schema contract
- change detector
- last retrieval
- last successful validation
- last approved version
- current active version
- source health
- failure behavior

Do not rely on a developer manually noticing a new CMS file.

==================================================
18. LAST-KNOWN-GOOD AND FAIL-CLOSED BEHAVIOR
==================================================

Do not fail every clinical review because an upstream public API is temporarily unavailable.

Do not silently use stale policy indefinitely either.

Each source must define:

- maximum approved age
- warning threshold
- hard expiration
- last-known-good eligibility
- fail-closed conditions
- degraded-mode behavior

Runtime source states should support:

`CURRENT`

`STALE_ALLOWED_WITH_WARNING`

`STALE_BLOCKED`

`UPSTREAM_UNAVAILABLE`

`REVOKED`

==================================================
19. EMERGENCY SOURCE REVOCATION
==================================================

Implement permission-controlled emergency revocation for:

- incorrect source version
- bad parser result
- incorrect policy interpretation
- terminology corruption
- unsafe medication data
- corrupted knowledge bundle

Revocation must:

- be audited
- not require application redeployment
- identify affected bundles
- mark dependent open reviews stale when required
- permit controlled rollback

==================================================
20. CMS MEDICARE COVERAGE
==================================================

Extend the existing CMS Medicare Coverage implementation.

Use the official Medicare Coverage Database / Coverage API.

Implement policy resolution based on relevant factors such as:

- state
- MAC
- service date
- document type
- document ID
- effective interval
- retirement state
- version
- approval state

Build internal capabilities equivalent to:

`searchMedicareCoverage()`

`getLCD()`

`getCoverageArticle()`

`getCoverageVersion()`

`resolveMacJurisdiction()`

`getApplicableCoverage()`

`getApplicableCoverageBundle()`

The system must answer:

**Which Medicare coverage authority applies to this type of analysis, for this jurisdiction, payer, and service date?**

Do not simply select the newest LCD.

Do not treat a single hospice LCD as universal.

Do not equate an LCD with physician certification.

==================================================
21. FEDERAL HOSPICE REGULATION
==================================================

Build a versioned federal regulatory corpus.

At minimum support relevant portions of:

`42 CFR Part 418`

Distinguish source roles.

### eCFR

Use for current continuously updated regulatory text.

Do not represent it as identical in legal publication status to the official CFR.

### GOVINFO CFR

Use for official published CFR material and historical editions.

### FEDERAL REGISTER

Use for:

- final rules
- proposed rules where relevant to research
- amendments
- effective-date history
- rulemaking provenance

Support:

`searchHospiceRegulation()`

`getRegulationSection()`

`getRegulationAtDate()`

`getOfficialRegulatoryPublication()`

`getAmendmentHistory()`

==================================================
22. CMS MANUALS, TRANSMITTALS AND CHANGE REQUESTS
==================================================

Build controlled ingestion for relevant CMS operational materials.

At minimum evaluate:

Medicare Benefit Policy Manual
Chapter 9

Medicare Claims Processing Manual
Chapter 11

relevant Medicare Program Integrity Manual material

relevant General Information / Eligibility / Entitlement material

CMS hospice transmittals

CMS Change Requests

CMS MLN hospice resources

Hospice regulations/notices

annual hospice final rules

CMS audit/compliance material relevant to hospice

Preserve:

- publication
- revision
- section
- effective date
- supersession
- source URL
- official status

==================================================
23. HHS OIG / COMPLIANCE KNOWLEDGE
==================================================

Create a separate compliance knowledge domain.

Evaluate approved official HHS OIG sources such as:

- General Compliance Program Guidance
- applicable industry guidance
- fraud alerts
- advisory material
- hospice audit reports
- compliance findings
- exclusion-related information where relevant

OIG findings may identify patterns and compliance risks.

Do not treat an OIG audit of one organization as proof that another hospice has the same defect.

Keep:

`COMPLIANCE_INTELLIGENCE`

separate from:

`PATIENT_CLINICAL_FACT`.

==================================================
24. PAYER SCOPE
==================================================

Do not apply Medicare policy universally.

Represent payer explicitly.

At minimum:

`TRADITIONAL_MEDICARE`

`MEDICAID`

`COMMERCIAL`

`OTHER`

`UNKNOWN`

Initial implementation may prioritize Traditional Medicare.

If approved payer knowledge is unavailable, return:

`PAYER_KNOWLEDGE_NOT_CONFIGURED`

Do not substitute Medicare rules for Medicaid/commercial policy.

==================================================
25. STATE-SPECIFIC KNOWLEDGE
==================================================

Federal Medicare requirements do not represent the entire hospice regulatory environment.

Create architecture for supported-state knowledge including, where applicable:

- hospice licensure
- state survey requirements
- state Medicaid hospice policy
- professional scope-of-practice requirements
- controlled-substance requirements
- advance-directive requirements
- facility requirements
- reporting requirements

Do not attempt to ingest all 50 states indiscriminately.

Create a supported-jurisdiction registry.

When state-specific knowledge is required but not configured, return an explicit unsupported state.

==================================================
26. HOPE / HQRP
==================================================

Build structured HOPE knowledge.

Support:

- base specification
- item sets
- definitions
- technical specifications
- CSV/data specifications
- edit specifications
- errata
- HOPE Update Visit requirements
- effective dates
- quality-measure relationships where appropriate

Do not model HOPE as only:

`version = X`

Instead support composition:

```text
BASE SPECIFICATION
+
APPLICABLE ERRATA
+
EFFECTIVE DATE
```

Functions may include:

`getHopeItem()`

`searchHopeItems()`

`getHopeDefinition()`

`getHopeEditRule()`

`getHopeTimingRule()`

`getHopeEffectiveSpecification()`

`getHopeVersionForDate()`

==================================================
27. ICD-10-CM
==================================================

Build a versioned ICD-10-CM service using official releases.

Do not ingest only a flat code list.

Where licensing/source structure permits, include:

- Tabular List
- Alphabetic Index
- descriptions
- addenda
- Official Guidelines for Coding and Reporting
- Includes notes
- Excludes1
- Excludes2
- Code First
- Use Additional Code
- Code Also
- manifestation/etiology instructions
- edition/effective dates

Functions approximately:

`searchIcd10()`

`getIcd10Code()`

`getIcd10Instructions()`

`validateIcd10()`

`isIcd10ValidOnDate()`

`getIcd10Edition()`

A valid code is not automatically correct coding.

==================================================
28. HOSPICE CODING SUPPORT
==================================================

Keep separate:

`DOCUMENTED_DIAGNOSIS`

`NORMALIZED_CLINICAL_CONCEPT`

`CANDIDATE_BILLING_CODE`

A coding finding must be capable of including:

- documented diagnosis
- patient evidence
- normalized concept
- candidate code
- code-system version
- coding-rule support
- sequencing considerations
- missing documentation
- coder-review requirement

Never autonomously submit or modify a claim.

==================================================
29. HCPCS
==================================================

Build versioned HCPCS Level II terminology support from official CMS releases.

Support quarterly effective dates.

Functions approximately:

`searchHcpcs()`

`getHcpcsCode()`

`validateHcpcs()`

`isHcpcsValidOnDate()`

Keep this separate from existing HCPCS utilization/market analytics.

==================================================
30. LICENSED BILLING CONTENT
==================================================

Explicitly assess licensing before incorporating:

- CPT
- NUBC
- UB-04 proprietary content
- revenue-code descriptions
- CDT
- other proprietary claim terminology

Do not scrape licensed descriptions from unofficial websites.

Do not commit proprietary source datasets into the public Git repository.

==================================================
31. HOSPICE BILLING / PAYMENT KNOWLEDGE
==================================================

If Spartan is to provide billing expertise, build a separate versioned billing domain.

Evaluate authoritative knowledge for:

- Routine Home Care
- Continuous Home Care
- General Inpatient Care
- Inpatient Respite
- Service Intensity Add-On
- hospice wage index
- annual payment rates
- aggregate cap
- coinsurance where applicable
- Notice of Election rules
- claim timing
- revocation/discharge billing effects
- transfers
- claims-processing rules
- denial-related requirements
- properly licensed claim codes/fields
- relevant annual rule changes

Payment amounts must not be hard-coded permanently into prompts.

==================================================
32. CLINICAL SCALE / INSTRUMENT REGISTRY
==================================================

Create a registry for clinical instruments.

Evaluate at minimum where relevant:

- PPS
- FAST
- NYHA
- ADLs
- other hospice-relevant instruments

For each instrument track:

- owner
- license/copyright
- permitted use
- version
- definition
- scoring rules
- required inputs
- limitations
- deterministic calculation availability
- whether AI extraction is allowed
- whether human confirmation is required

Do not operationalize proprietary/copyrighted scales without appropriate rights.

Do not allow a model to assign a clinical score from vague narrative without approved criteria.

==================================================
33. LOINC
==================================================

Use LOINC for normalized observations and labs.

Do not make production dependent solely on a public terminology endpoint that is not designated for production use.

Prefer:

official versioned LOINC release

→ approved Spartan-controlled terminology service/storage

or another supported production deployment.

Support:

`searchLoinc()`

`resolveLoinc()`

`validateLoinc()`

`getLoincDisplay()`

`getLoincVersion()`

Preserve release version.

==================================================
34. UCUM
==================================================

Add deterministic UCUM validation and unit conversion.

Support:

`validateUcum()`

`normalizeUcum()`

`convertUcum()`

Include dimensional compatibility checks.

Reject invalid conversions.

Do not rely on the LLM for safety-relevant conversion arithmetic.

==================================================
35. SNOMED CT
==================================================

Prepare licensed SNOMED CT US Edition integration.

Do not commit licensed content into the public repository.

Use an approved controlled terminology deployment.

Support:

`searchSnomed()`

`getSnomedConcept()`

`getSnomedParents()`

`getSnomedChildren()`

`mapSnomedToIcd10()`

Mappings must preserve:

- mapping source
- mapping version
- equivalence/relationship
- review requirement

Terminology mapping is not automatically a billing decision.

==================================================
36. UMLS
==================================================

Use UMLS where licensed for cross-terminology operations.

Possible functions:

`searchUmls()`

`resolveCui()`

`crosswalkTerminology()`

`getSemanticTypes()`

Preserve the original vocabulary.

Do not assume UMLS licensing permits unrestricted redistribution of every vocabulary it contains.

==================================================
37. RXNORM
==================================================

Use RxNorm as the medication identity/normalization layer.

Support:

- RxCUI
- ingredient
- strength
- dose form
- brand/generic relationships
- prescribable concepts where appropriate
- active/historical status
- RxClass where useful

Functions approximately:

`normalizeMedication()`

`resolveRxNorm()`

`getRxCui()`

`getMedicationIngredient()`

`getMedicationStrength()`

`getMedicationDoseForm()`

`getMedicationClass()`

Evaluate whether a Spartan-controlled/local terminology deployment is preferable to relying entirely on live external calls.

RxNorm is not a comprehensive interaction engine.

==================================================
38. DAILYMED
==================================================

Use DailyMed for versioned structured labeling.

Support relevant fields such as:

- SET ID
- label version
- label history
- product name
- NDC mapping where available
- RxNorm mapping where available
- indications
- warnings
- boxed warnings
- contraindications
- dosage/administration sections
- renal/hepatic information where explicitly present
- route
- dosage form

Preserve exact label identity/version.

Do not convert drug labeling into autonomous prescribing.

==================================================
39. DRUG INTERACTION / CLINICAL PHARMACOLOGY
==================================================

Do not pretend RxNorm + DailyMed provide comprehensive medication safety.

Create an adapter contract for an approved validated licensed pharmacology source capable of supporting, where licensed:

- drug-drug interactions
- therapeutic duplication
- contraindications
- allergy relationships
- renal considerations
- hepatic considerations
- route constraints
- dose limits where appropriate
- interaction severity
- supporting evidence

Do not choose a commercial product without explicit licensing/architecture approval.

Until configured, return explicit status:

`NOT_CHECKED`

`SOURCE_UNAVAILABLE`

`INSUFFICIENT_PATIENT_CONTEXT`

`CHECKED_NO_KNOWN_ISSUE`

`ISSUE_FOUND`

`UNKNOWN`

==================================================
40. FDA / OPENFDA
==================================================

Evaluate FDA/openFDA as a supplemental source for appropriate domains such as:

- NDC information
- product identity
- recalls
- enforcement
- label metadata
- safety signals

Do not use spontaneous adverse-event reporting as patient-level causal proof.

==================================================
41. PUBMED / CLINICAL LITERATURE
==================================================

Build PubMed/NCBI retrieval.

Never include patient identifiers in literature queries.

Convert patient-specific questions into deidentified biomedical concepts first.

Support:

`searchPubMed()`

`getPubMedArticle()`

`findSystematicReviews()`

`findRecentEvidence()`

Capture:

- PMID
- PMCID
- DOI
- publication type
- publication date
- rights/full-text status where needed

Peer-reviewed evidence is supporting clinical evidence.

It does not override applicable law, coverage policy, official coding rules, or authoritative drug labeling in their domains.

==================================================
42. CLINICAL GUIDELINE REGISTRY
==================================================

Do not let arbitrary web search become patient-level guidance.

Create a controlled guideline registry.

Potential domains include:

- pain
- dyspnea
- agitation
- delirium
- nausea/vomiting
- constipation
- secretions
- anxiety
- seizures
- wound symptoms
- end-of-life respiratory symptoms

For each guideline record:

- publisher
- source type
- version
- publication date
- review date
- license
- population
- scope
- reviewers
- approval
- citations

==================================================
43. SPARTAN CLINICAL PROTOCOLS
==================================================

Build a versioned protocol framework.

Examples:

`PAIN`

`DYSPNEA`

`DELIRIUM`

`NAUSEA`

`CONSTIPATION`

`SECRETIONS`

Each protocol should track:

- version
- scope
- supporting authorities
- supporting clinical evidence
- clinical reviewer
- pharmacist reviewer where applicable
- approval
- review due date
- activation status

The language model may help draft a proposed protocol.

The model may not approve its own protocol.

==================================================
44. PATIENT CONTEXT TOOLS
==================================================

Build narrow internal patient-context tools.

Do not give the model:

- unrestricted SQL
- unrestricted FHIR search
- arbitrary bucket access
- arbitrary database access

Use functions equivalent to:

`getPatientSummary()`

`getPatientConditions()`

`getPatientMedications()`

`getPatientAllergies()`

`getPatientObservations()`

`getPatientLabs()`

`getPatientEncounters()`

`getPatientDocuments()`

`getDocumentEvidence()`

`getPatientReviewManifest()`

`getPatientSourceVersions()`

Every call must enforce:

authenticated actor

AND

organization membership

AND

clinical permission

AND

patient tenancy

AND

resource tenancy

AND

requested action authorization.

==================================================
45. FHIR
==================================================

Follow approved FHIR architecture.

Do not make FHIR a generic AI-output database.

Use approved semantic mappings for appropriate resources such as:

Patient

Organization

Practitioner

PractitionerRole

Condition

Observation

Encounter

MedicationStatement

MedicationRequest

AllergyIntolerance

DiagnosticReport

ServiceRequest

DocumentReference

CarePlan

ClinicalImpression

RiskAssessment

DetectedIssue

Task

Consent

Provenance

Maintain semantic separation among:

`SOURCE_FACT`

`NORMALIZED_FACT`

`AI_INFERENCE`

`HUMAN_APPROVED_FACT`

AI output does not become clinical truth automatically.

==================================================
46. DOCUMENT EXTRACTION
==================================================

The existing repo already has document-handling logic.

Inspect before replacing it.

For production-scale extraction, implement the approved document architecture.

Target:

```text
SOURCE DOCUMENT
      ↓
VALIDATION
      ↓
MALWARE / FILE SAFETY
      ↓
PAGE-AWARE OCR / LAYOUT
      ↓
TEXT / TABLE / SECTION EXTRACTION
      ↓
EVIDENCE SEGMENTS
      ↓
CLINICAL FACT EXTRACTION
      ↓
TERMINOLOGY NORMALIZATION
      ↓
REASONING
```

Preserve:

- document ID
- document version
- page
- section
- coordinates/offsets where possible
- parser version
- OCR version
- text hash

Do not make the reasoning model simultaneously handle all OCR, extraction, terminology, policy retrieval and clinical analysis in one uncontrolled request.

==================================================
47. KNOWLEDGE INGESTION IS AN UNTRUSTED INPUT PATH
==================================================

Do not trust content merely because the publisher is trusted.

External PDFs, APIs, HTML and guidelines may contain:

- malformed data
- embedded active content
- schema changes
- prompt-like text
- parser edge cases
- corrupted files

Knowledge ingestion must:

- use allowlisted sources
- validate media/schema
- parse in a controlled environment
- remove active content
- normalize
- hash
- quarantine
- diff
- validate
- require appropriate approval

Retrieved text remains DATA.

It never becomes instruction to the AI.

==================================================
48. DETERMINISTIC CLINICAL UTILITIES
==================================================

Use deterministic functions when language-model reasoning is inappropriate.

Examples:

`calculateWeightLossPercent()`

`calculateBmi()`

`calculateDateInterval()`

`countHospitalizations()`

`countEmergencyVisits()`

`normalizeUnits()`

`detectExactMedicationDuplicates()`

`resolveApplicablePolicy()`

Do not add safety-relevant calculators without documenting:

- equation
- required inputs
- units
- population
- limitations
- clinical reviewer
- tests

==================================================
49. SPARTAN CLINICAL KNOWLEDGE GATEWAY
==================================================

Create one Spartan-owned gateway over approved knowledge services.

Domains should include as appropriate:

- regulation
- Medicare coverage
- CMS manuals
- HOPE/HQRP
- coding
- billing
- terminology
- medication
- clinical evidence
- Spartan clinical protocols
- patient evidence

The gateway controls:

- authentication
- authorization
- licensing
- upstream credentials
- version resolution
- effective-date resolution
- jurisdiction filtering
- payer filtering
- caching
- rate limiting
- audit
- response limits
- provenance

==================================================
50. MCP IS OPTIONAL INTERFACE, NOT CORE ARCHITECTURE
==================================================

Do not build patient-level production reasoning around arbitrary third-party MCP servers.

Implement core knowledge services as Spartan-controlled server functionality.

Expose them to OpenAI production through narrow function tools.

Optionally expose the same internal gateway through one Spartan-owned MCP server for:

- approved ChatGPT workflows
- Codex
- engineering research
- controlled non-production use

Do not create separate logic for:

- MCP
- REST
- production OpenAI functions

The same knowledge service should back all approved interfaces.

ChatGPT plugins/connectors used during development are not automatically production dependencies.

==================================================
51. NO GENERIC SUPER-TOOLS
==================================================

Do not create:

`searchEverything()`

`browseWeb()`

`fetchAnyUrl()`

`queryDatabase()`

`runSql()`

`fhirSearch(anyQuery)`

for clinical reasoning.

Use narrow typed functions.

Examples:

`getApplicableHospiceCoverage()`

`getRegulationSection()`

`validateIcd10()`

`resolveMedication()`

`getDrugLabelWarnings()`

`checkDrugInteractions()`

`resolveLoinc()`

`convertUcum()`

`searchPubMedEvidence()`

Narrow functions reduce:

- prompt injection
- hallucination
- data leakage
- cross-tenant risk
- untraceable reasoning

==================================================
52. OPENAI ORCHESTRATION
==================================================

Continue using server-side OpenAI Responses integration where appropriate.

Never expose the API key to clients.

The orchestration should conceptually:

1. establish authorized patient context
2. retrieve relevant patient evidence
3. normalize terminology
4. classify proposed claim types
5. ask Authority Resolver which source domains apply
6. ask Applicability Engine which versions apply
7. retrieve approved knowledge
8. perform deterministic calculations
9. reason across patient + knowledge evidence
10. create structured proposed findings
11. validate evidence/citations server-side
12. route to appropriate human review

Do not dump the entire knowledge corpus into every request.

==================================================
53. PROMPT-INJECTION DEFENSE
==================================================

Treat all of the following as untrusted data:

- patient documents
- OCR output
- regulations
- CMS manuals
- guideline text
- PubMed abstracts
- MCP responses
- API text
- uploaded content

None may alter:

- system instructions
- developer instructions
- authentication
- authorization
- tenant identity
- tool permissions
- output schema
- destination services
- security rules
- retention rules

Add adversarial tests.

==================================================
54. REMOVE UNCALIBRATED AI CONFIDENCE SCORES
==================================================

The existing system may contain numeric 0–1 confidence fields.

Do not expose arbitrary model confidence percentages as clinical certainty.

Migrate toward explicit categorical states.

Examples:

### evidenceType

`DIRECT_SOURCE_FACT`

`DERIVED_FACT`

`CLINICAL_INFERENCE`

### evidenceCompleteness

`COMPLETE`

`PARTIAL`

`INSUFFICIENT`

### sourceAgreement

`CONSISTENT`

`CONFLICTING`

`UNKNOWN`

### authorityState

`APPLICABLE`

`NOT_APPLICABLE`

`UNAVAILABLE`

`EXPIRED`

### reviewRequirement

`CLINICAL_REVIEW`

`PHYSICIAN_REVIEW`

`CODER_REVIEW`

`PHARMACIST_REVIEW`

`COMPLIANCE_REVIEW`

Only expose calibrated probability/confidence values if a separately validated calibration methodology exists.

Maintain migration compatibility where necessary.

==================================================
55. EXPERT FINDING CONTRACT
==================================================

Every material finding should include equivalent fields for:

- finding ID
- claim type
- statement
- patient evidence
- authority evidence
- applicability explanation
- fact/inference state
- missing context
- conflicting evidence
- unresolved uncertainty
- review requirement
- review status
- model version
- prompt version
- tool-contract version
- knowledge bundle version
- created timestamp

No unsupported material assertion should appear as established fact.

==================================================
56. SERVER-SIDE EVIDENCE VALIDATOR
==================================================

Do not trust model-generated citation fields.

Validate:

- patient document exists
- correct tenant
- correct patient
- document version exists
- page/span exists
- cited text matches source or approved normalized transformation
- knowledge source exists
- knowledge version exists
- knowledge version is approved
- knowledge version is active/applicable
- jurisdiction applies
- service date applies
- payer applies
- claim type is supported by the cited authority
- model did not invent IDs or citations

Unsupported findings must:

fail validation

or

be downgraded to an explicitly unsupported question/inference.

==================================================
57. KNOWLEDGE BUNDLES
==================================================

Create immutable runtime knowledge bundles.

A bundle may include references to:

- CFR/regulatory versions
- CMS manual versions
- coverage-policy versions
- HOPE effective specification
- ICD edition
- HCPCS edition
- LOINC edition
- SNOMED edition
- UMLS release
- RxNorm version
- DailyMed labels used
- pharmacology source version
- guideline versions
- Spartan protocol versions

Every clinical analysis must record the knowledge bundle used.

Historical signed reviews must not silently change after source updates.

==================================================
58. STALE ANALYSIS AND CHANGE IMPACT
==================================================

Whenever relevant dependencies change, identify:

- tools affected
- evals affected
- open reviews affected
- knowledge bundles affected

Dependencies include:

- document version
- patient fact version
- FHIR resource version
- policy version
- terminology version
- medication source
- model version
- prompt version
- tool schema
- normalization engine
- OCR engine

Open reviews may become:

`STALE`

Historical signed reviews remain tied to their original bundle.

Do not automatically rewrite historical clinical reasoning.

==================================================
59. HUMAN REVIEW
==================================================

Human review must be finding-level and substantive.

Support:

`APPROVE`

`REJECT`

`MODIFY`

`NEEDS_MORE_INFORMATION`

`ESCALATE`

Store:

- reviewer
- role
- qualification type where appropriate
- timestamp
- reason
- edited result
- evidence considered

AI cannot approve itself.

==================================================
60. MEDICATION FINDING CONTRACT
==================================================

Medication findings must distinguish:

- symptom/problem
- patient evidence
- current therapy
- normalized medication identity
- product/formulation
- possible consideration
- allergy status
- renal context
- hepatic context
- interaction status
- duplication status
- route status
- contraindication status
- missing context
- source/version
- pharmacist/prescriber review requirement

Never autonomously:

- prescribe
- order
- discontinue
- change dose
- change route
- certify safety

==================================================
61. BILLING / CODING FINDING CONTRACT
==================================================

Keep separate:

- clinical fact
- coverage requirement
- coding rule
- payment rule
- claim-field requirement

A billing/coding finding should identify:

- patient/document evidence
- payer
- service date
- code-set edition
- candidate code/rule
- applicable authority
- support status
- missing documentation
- coder/compliance review requirement

Never submit or modify claims autonomously.

==================================================
62. CLINICAL EVALUATION PROGRAM
==================================================

Build a first-class clinical evaluation program.

Do not rely solely on unit tests.

Create:

### DEVELOPMENT SET

Visible to engineering.

### REGRESSION SET

Used repeatedly to detect known failures.

### HIDDEN HOLDOUT SET

Not exposed to routine prompt/model development.

### SAFETY SENTINEL SET

High-risk failure cases.

### TEMPORAL POLICY SET

Tests correct historical policy/version selection.

### OCR / FORMAT ROBUSTNESS SET

Tests scans, poor OCR, tables, long files and formatting differences.

Gold standards must be independently grounded.

Do not allow the same model to invent both a case and its authoritative answer without external validation.

Use relevant experts to adjudicate:

- clinician
- physician
- pharmacist
- coder
- billing expert
- compliance reviewer

==================================================
63. EVALUATION DIMENSIONS
==================================================

Measure separately:

- fact extraction precision
- fact extraction recall
- evidence attribution
- citation validity
- wrong-patient rate
- cross-tenant rate
- unsupported-claim rate
- contradiction recall
- abstention quality
- policy applicability accuracy
- temporal version accuracy
- coding support accuracy
- medication safety
- human-review agreement
- cost
- latency

Do not hide dangerous failures inside aggregate averages.

==================================================
64. SAFETY SENTINELS
==================================================

Include synthetic cases for at least:

- same name/different patient
- incorrect patient merge
- multiple MRNs
- conflicting diagnoses
- conflicting medication lists
- medication allergy
- renal impairment
- hepatic impairment
- interaction
- therapeutic duplication
- route limitation
- missing dose
- outdated ICD code
- wrong LCD jurisdiction
- wrong service date
- superseded policy
- HOPE errata boundary
- malformed PDF
- OCR digit transposition
- prompt injection
- unsupported diagnosis
- missing evidence

High-severity failures block promotion even if aggregate metrics improve.

==================================================
65. KNOWLEDGE HEALTH
==================================================

Create PHI-free operational visibility for:

- source status
- current/stale state
- active version
- last retrieval
- last successful validation
- last approval
- upstream error
- schema drift
- license expiry
- reviewer due date
- knowledge bundle status
- revoked sources

Clinical functionality that depends on unhealthy required knowledge must follow explicitly defined degraded/fail-closed behavior.

==================================================
66. LICENSING REGISTRY
==================================================

Maintain machine-readable licensing information.

Track:

- owner
- license
- version
- commercial-use permission
- redistribution permission
- internal-storage permission
- model-input permission
- prompt-use permission
- output/display permission
- expiration
- approval owner

Do not commit licensed datasets into the public Git repository unless permitted.

Add CI/review protections against accidental inclusion.

==================================================
67. EXTERNAL KNOWLEDGE SERVICES AND PHI
==================================================

External terminology/literature services generally do not need patient identity.

Send:

- codes
- drug identifiers
- non-identifying concepts

rather than:

- patient name
- DOB
- MRN
- address
- chart narrative

unless the service is explicitly approved for PHI.

PubMed queries must be deidentified.

Terminology lookups should generally use concepts/codes rather than free-text patient records.

==================================================
68. LOGGING / TELEMETRY
==================================================

Knowledge operations may log metadata such as:

- tool
- source
- source version
- knowledge bundle
- request ID
- duration
- cache state
- result state

Do not log:

- patient narrative
- source document text
- full prompts
- full clinical model responses
- PHI-bearing exceptions

Add synthetic sentinel PHI leakage tests.

==================================================
69. SOURCE ADAPTER CONTRACT TESTS
==================================================

Every external adapter requires tests against schema drift.

Detect:

- missing fields
- renamed fields
- type changes
- unexpected response shapes
- pagination changes
- authentication changes
- error-format changes
- rate-limit changes

Do not silently reinterpret an upstream schema.

Fail safely and alert.

==================================================
70. CACHING
==================================================

Cache public authoritative knowledge where safe.

Cache keys must include relevant applicability dimensions such as:

- source
- version
- jurisdiction
- MAC
- payer
- effective period
- service date where required
- code edition
- label version

Never allow:

`latest cached`

to automatically mean:

`applicable`.

==================================================
71. COST / RESILIENCE
==================================================

Do not make unnecessary external requests for stable release data.

Where licensing permits, prefer locally controlled versioned corpora for stable datasets.

Use live APIs when freshness or query behavior justifies them.

Implement:

- timeouts
- bounded retries
- circuit breakers where appropriate
- rate limiting
- caches
- deduplication
- content hashes
- token budgets
- document-page targeting
- reuse of normalized evidence

Do not repeatedly analyze unchanged data.

==================================================
72. PRESERVE EXISTING NONCLINICAL INTELLIGENCE
==================================================

Do not break or unnecessarily rebuild:

- NPI lookup
- CMS hospice/provider intelligence
- quality/CAHPS
- Medicare utilization
- service-area intelligence
- physician intelligence
- sales tooling
- billing
- subscriptions
- entitlements
- authentication

Do not use provider-market intelligence as patient-level clinical evidence.

==================================================
73. IMPLEMENTATION PACKETS
==================================================

Use bounded implementation packets.

### K0
Current repository and knowledge inventory

### K1
Knowledge foundation:
- registry
- licensing
- control-plane lifecycle
- claim types
- domain authority model
- Authority Resolver
- Applicability Engine
- unknown-state model
- basic knowledge health

### K2
CMS Coverage applicability + MAC/service-date resolution

### K3
Federal regulation:
- eCFR
- GovInfo
- Federal Register

### K4
CMS manuals, transmittals, Change Requests, OIG/compliance

### K5
HOPE/HQRP composition engine

### K6
ICD-10-CM + Official Guidelines + coding instructions

### K7
HCPCS + hospice billing/payment framework

### K8
LOINC local/versioned terminology + UCUM

### K9
RxNorm/RxClass + DailyMed

### K10
SNOMED/UMLS licensed terminology

### K11
Drug-interaction / pharmacology provider interface

### K12
Clinical scales / instrument registry

### K13
PubMed + guideline registry

### K14
Spartan clinical protocol framework

### K15
Patient-context / FHIR functions

### K16
Document extraction/provenance hardening

### K17
Unified Spartan Clinical Knowledge Gateway

### K18
OpenAI tool orchestration

### K19
Evidence validator + human review

### K20
Clinical evaluation / holdout / safety-sentinel suite

### K21
Source update monitoring + knowledge health + revocation

### K22
Web/iOS knowledge and review presentation

### K23
Synthetic staging + production-readiness review

Do not implement all packets in one pull request.

==================================================
74. CRITICAL FIRST EXECUTION BOUNDARY
==================================================

The first execution of this mandate is intentionally bounded.

DO NOT begin full K2-K23 implementation in the first run.

The first run must:

1. synchronize `main`
2. record starting SHA
3. complete K0 repository/knowledge audit
4. map current implementation to K0-K23
5. identify stale/duplicate/missing knowledge components
6. update the ExecPlan
7. design the claim-type model
8. design the domain-specific authority matrix
9. design the Authority Resolver
10. design the Applicability Engine
11. design explicit unknown-state semantics
12. design the knowledge registry
13. design source lifecycle/activation model
14. design licensing metadata
15. design knowledge health model
16. implement the safe foundational portions of K1
17. add database migrations if required
18. add unit/integration tests
19. update architecture documentation
20. run relevant repository verification
21. create a bounded branch/PR

STOP after K0 and the approved safe implementation scope of K1.

Do not begin adding every external API simply because they are listed in this specification.

K1 is foundational.

If K1 is wrong, most later integrations will require rework.

The plan is not the deliverable, but neither is uncontrolled scope expansion.

Complete the bounded K0/K1 implementation and verification.

==================================================
75. K1 REQUIRED OUTCOMES
==================================================

K1 should establish a stable semantic contract for later sources.

At minimum, design/implement approved equivalents for:

### CLAIM TYPE

What kind of statement is being supported?

### AUTHORITY DOMAIN

What kind of authority can support that claim?

### APPLICABILITY

Why does this source apply?

### KNOWLEDGE SOURCE

Who published it?

### KNOWLEDGE VERSION

Which exact release/version is used?

### EFFECTIVE WINDOW

When does it apply?

### JURISDICTION

Where does it apply?

### PAYER

Which payer context applies?

### LICENSE

What may Spartan legally do with it?

### APPROVAL

Who reviewed/approved it?

### ACTIVATION

Is it available to runtime reasoning?

### HEALTH

Is the source current and usable?

### UNCERTAINTY

What happens when Spartan cannot establish an answer?

Later packets must consume these shared abstractions instead of inventing their own.

==================================================
76. EXTERNAL / OWNER-ONLY REQUIREMENTS
==================================================

Track separately anything requiring:

- Google production configuration
- BAA verification
- external API credentials
- UMLS agreement
- SNOMED licensing
- CPT/NUBC licensing
- pharmacology vendor contract
- clinical-scale rights
- clinical expert review
- physician approval
- pharmacist approval
- coding approval
- compliance approval
- production secrets
- production Terraform
- real PHI activation

Do not claim these are complete unless verified.

Code adapters/interfaces with synthetic tests where safe.

==================================================
77. PRODUCTION AUTHORITY
==================================================

Engineering agents may implement and verify code when authorized.

They may not autonomously:

- activate real PHI
- apply destructive production migrations
- apply production infrastructure
- create/rotate production credentials
- sign clinical approval
- accept licensing agreements
- enter commercial contracts
- perform customer rollout
- submit material App Store releases

Code completeness is not production authorization.

==================================================
78. REQUIRED TESTING
==================================================

Run relevant existing repository checks.

At minimum where applicable:

```bash
pnpm install --frozen-lockfile

pnpm run typecheck

pnpm --filter @workspace/spartan-ai-tools test

pnpm --filter @workspace/api-server test

pnpm --filter @workspace/spartan-coaching test

pnpm --filter @workspace/spartan-coaching-mobile exec jest --runInBand

pnpm run build

pnpm run test:e2e

pnpm run release-gate
```

Also run applicable:

- database migration equivalence
- source adapter contract tests
- licensing tests
- PHI sentinel tests
- clinical evals
- security tests
- secret scans
- infrastructure validation

Do not disable legitimate checks to achieve green CI.

==================================================
79. GIT / CI FAILURE RECOVERY LOOP
==================================================

Treat every implementation-caused CI failure as a root-cause investigation.

For each failure:

1. inspect the exact failed workflow/check
2. reproduce locally when possible
3. identify root cause
4. determine whether failure is:
   - implementation defect
   - migration defect
   - environment issue
   - dependency issue
   - stale test
   - pre-existing defect
5. fix the actual cause
6. run targeted verification
7. run required broader verification
8. commit
9. push
10. inspect CI
11. repeat until required checks are green or a genuine external blocker remains

Do not:

- disable CI
- skip tests
- remove security gates
- weaken secret detection
- bypass branch protection
- force merge red code

==================================================
80. DEFINITION OF EXPERT KNOWLEDGE
==================================================

Do not call Spartan expert merely because many APIs are connected.

A material clinical or regulatory conclusion is expert-grounded only when Spartan can establish:

```text
PATIENT EVIDENCE
        +
CLAIM TYPE
        +
CORRECT AUTHORITY DOMAIN
        +
APPLICABLE SOURCE
        +
SOURCE VERSION
        +
PAYER
        +
JURISDICTION
        +
SERVICE DATE / EFFECTIVE DATE
        +
DETERMINISTIC VALIDATION WHERE REQUIRED
        +
FACT VS INFERENCE
        +
MISSING / CONFLICTING INFORMATION
        +
REQUIRED HUMAN REVIEW
```

If a required component is unavailable:

Spartan must expose the limitation.

It must not manufacture certainty.

==================================================
81. DEFINITION OF DONE FOR EACH SOURCE
==================================================

An integration is not complete merely because its API returns HTTP 200.

For every source require:

- source identity
- authority domain
- claim types
- provenance
- version
- effective-date semantics
- applicability rules
- license status
- ingestion validation
- approval state
- activation state
- source health
- bounded retrieval
- safe failure behavior
- tests
- documentation
- runtime tool contract
- evaluation impact

==================================================
82. FINAL REPORT FORMAT
==================================================

Report:

### STARTING MAIN SHA

### REPOSITORY KNOWLEDGE AUDIT

### EXISTING CAPABILITIES PRESERVED

### STALE IMPLEMENTATIONS FOUND

### DUPLICATE IMPLEMENTATIONS FOUND

### MISSING KNOWLEDGE DOMAINS

### K0 RESULT

### K1 RESULT

### CLAIM TYPES

### AUTHORITY MATRIX

### AUTHORITY RESOLVER

### APPLICABILITY ENGINE

### UNKNOWN-STATE CONTRACT

### KNOWLEDGE REGISTRY

### DATABASE MIGRATIONS

### LICENSING MODEL

### SOURCE LIFECYCLE

### KNOWLEDGE HEALTH

### SECURITY CONTROLS

### CLINICAL SAFETY CONTROLS

### TESTS RUN

### EXACT RESULTS

### COMMITS

### PR

### CI STATUS

### FINAL MAIN SHA
Only if merged.

### OWNER ACTIONS REQUIRED

### EXTERNAL LICENSES / CREDENTIALS REQUIRED

### ARCHITECTURE BLOCKERS

### ITEMS NOT VERIFIED

### NEXT BOUNDED PACKET

Do not claim completion if required validation remains outstanding.

==================================================
83. FINAL GOVERNING PRINCIPLE
==================================================

Spartan Hospice AI does not become expert because the language model knows more.

Spartan becomes expert because every important answer is built from:

the right patient evidence,

the right claim type,

the right authority,

the right source,

the right version,

the right payer,

the right jurisdiction,

the right service date,

the right deterministic validation,

the correct distinction between fact and inference,

explicit handling of what is unknown,

and accountable human review.

The language model is the reasoning engine.

It is not the source of truth.

Build the system accordingly.