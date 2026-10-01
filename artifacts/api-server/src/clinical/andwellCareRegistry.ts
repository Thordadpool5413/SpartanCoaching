export const ANDWELL_CARE_REGISTRY_VERSION = "andwell-public-2026-10-01-v1" as const;

export type AndwellServiceId =
  | "home-health"
  | "caregivers"
  | "guide"
  | "mobile-wound"
  | "palliative-medicine"
  | "hospice-home-care"
  | "inpatient-hospice"
  | "forget-me-not"
  | "emotional-spiritual-support"
  | "bereavement-support"
  | "behavioral-health-outpatient"
  | "behavioral-health-home-adult"
  | "behavioral-health-home-child"
  | "community-care-team"
  | "home-program"
  | "adult-hcbs"
  | "adult-day"
  | "child-rcs"
  | "adult-therapy"
  | "pediatric-therapy"
  | "audiology"
  | "maternal-child-health";

export type AndwellServiceFamily =
  | "At-Home Care"
  | "Hospice & Palliative"
  | "Community & Behavioral Health"
  | "Therapy & Specialty";

export type AndwellServiceAreaKey =
  | "guide"
  | "caregivers"
  | "home-health"
  | "hospice"
  | "palliative"
  | "therapy"
  | "audiology"
  | "mobile-wound"
  | "community-behavioral";

export type AndwellServiceAvailability = "available" | "not_listed" | "verify";

export interface AndwellCareService {
  id: AndwellServiceId;
  name: string;
  family: AndwellServiceFamily;
  summary: string;
  reviewerRole: string;
  sourceUrl: string;
  serviceAreaKey?: AndwellServiceAreaKey;
  eligibilityChecks: readonly string[];
  hardExclusions?: readonly string[];
}

const SERVICE_AREAS: Record<AndwellServiceAreaKey, readonly string[]> = {
  guide: [
    "Androscoggin", "Aroostook", "Cumberland", "Franklin", "Kennebec",
    "Lincoln", "Oxford", "Sagadahoc", "Somerset",
  ],
  caregivers: [
    "Androscoggin", "Aroostook", "Cumberland", "Franklin", "Kennebec",
    "Oxford", "Penobscot", "Piscataquis", "Somerset", "Washington",
  ],
  "home-health": [
    "Androscoggin", "Aroostook", "Cumberland", "Franklin", "Kennebec",
    "Oxford", "Penobscot", "Piscataquis", "Somerset",
  ],
  hospice: [
    "Androscoggin", "Aroostook", "Cumberland", "Franklin", "Kennebec",
    "Knox", "Lincoln", "Oxford", "Penobscot", "Piscataquis", "Sagadahoc",
    "Somerset", "Waldo", "York",
  ],
  palliative: [
    "Androscoggin", "Aroostook", "Cumberland", "Franklin", "Kennebec",
    "Knox", "Lincoln", "Oxford", "Penobscot", "Piscataquis", "Sagadahoc",
    "Somerset", "Waldo", "York",
  ],
  therapy: ["Androscoggin"],
  audiology: ["Androscoggin"],
  "mobile-wound": ["Androscoggin", "Cumberland", "Franklin", "Oxford", "Sagadahoc"],
  "community-behavioral": [
    "Androscoggin", "Aroostook", "Cumberland", "Franklin", "Hancock", "Kennebec",
    "Knox", "Lincoln", "Oxford", "Penobscot", "Piscataquis", "Sagadahoc",
    "Somerset", "Waldo", "Washington", "York",
  ],
};

export const ANDWELL_CARE_SERVICES: readonly AndwellCareService[] = [
  {
    id: "home-health",
    name: "Home Healthcare",
    family: "At-Home Care",
    summary: "Skilled home care for recovery, chronic-condition management, rehabilitation and other documented skilled needs.",
    reviewerRole: "Home Health intake / clinical reviewer",
    sourceUrl: "https://andwell.org/health-services/at-home-care/home-health/",
    serviceAreaKey: "home-health",
    eligibilityChecks: ["Homebound status", "Skilled need", "Provider order/referral", "Payer/coverage", "Current service availability"],
  },
  {
    id: "caregivers",
    name: "CareGivers (In-Home Caregiving)",
    family: "At-Home Care",
    summary: "In-home personal care, companionship, respite and practical support when daily living or caregiver needs are documented.",
    reviewerRole: "CareGivers intake",
    sourceUrl: "https://andwell.org/health-services/at-home-care/at-home-care-giving-caregivers/",
    serviceAreaKey: "caregivers",
    eligibilityChecks: ["Requested support", "Patient/caregiver preference", "Payer or private-pay arrangement", "Current service availability"],
  },
  {
    id: "guide",
    name: "GUIDE Dementia Care Management",
    family: "At-Home Care",
    summary: "Dementia care management and caregiver support for patients who may meet GUIDE requirements.",
    reviewerRole: "GUIDE intake / dementia care team",
    sourceUrl: "https://andwell.org/health-services/at-home-care/dementia-care-management-guide/",
    serviceAreaKey: "guide",
    eligibilityChecks: ["Eligible dementia diagnosis", "Traditional Medicare A & B primary", "Residence/program setting", "Service area", "Program exclusions"],
    hardExclusions: ["Medicare Advantage", "PACE", "Active hospice benefit", "Long-term skilled nursing residence"],
  },
  {
    id: "mobile-wound",
    name: "Mobile Wound Care",
    family: "At-Home Care",
    summary: "Assessment and treatment review for acute, chronic, wound, ostomy or continence needs.",
    reviewerRole: "Mobile Wound clinical intake",
    sourceUrl: "https://andwell.org/health-services/at-home-care/wound-care/",
    serviceAreaKey: "mobile-wound",
    eligibilityChecks: ["Wound/ostomy/continence need", "Provider referral as required", "Service area", "Payer/coverage", "Current capacity"],
  },
  {
    id: "palliative-medicine",
    name: "Palliative Medicine",
    family: "Hospice & Palliative",
    summary: "Whole-person support for serious or life-limiting illness, symptom burden, goals of care and caregiver needs.",
    reviewerRole: "Palliative Medicine clinical intake",
    sourceUrl: "https://andwell.org/health-services/hospice-palliative-care/palliative-medicine/",
    serviceAreaKey: "palliative",
    eligibilityChecks: ["Serious-illness clinical fit", "Patient goals/preferences", "Provider referral/order as required", "Payer/coverage", "Current availability"],
  },
  {
    id: "hospice-home-care",
    name: "Hospice Home Care",
    family: "Hospice & Palliative",
    summary: "Hospice clinical review when the record documents terminal illness and decline that may warrant a qualified eligibility assessment.",
    reviewerRole: "Hospice intake / hospice clinician / certifying physician",
    sourceUrl: "https://andwell.org/health-services/hospice-palliative-care/hospice-home-care/",
    serviceAreaKey: "hospice",
    eligibilityChecks: ["Terminal illness and prognosis review", "Hospice physician certification", "Goals/election discussion", "Payer benefit", "Service area/capacity"],
  },
  {
    id: "inpatient-hospice",
    name: "Hospice House / Gosnell Memorial Hospice House",
    family: "Hospice & Palliative",
    summary: "Inpatient hospice review for an existing hospice patient whose intensive symptom-management needs may exceed the current setting.",
    reviewerRole: "Hospice clinical team / level-of-care reviewer",
    sourceUrl: "https://andwell.org/health-services/hospice-palliative-care/",
    eligibilityChecks: ["Current hospice status", "Level-of-care criteria", "Symptom-management need", "Bed/capacity availability", "Patient/family preference"],
  },
  {
    id: "forget-me-not",
    name: "Forget-Me-Not Dementia Program",
    family: "Hospice & Palliative",
    summary: "Dementia-focused support for hospice patients experiencing memory loss, dementia, agitation or confusion.",
    reviewerRole: "Hospice interdisciplinary team",
    sourceUrl: "https://andwell.org/health-services/hospice-palliative-care/hospice-home-care/",
    eligibilityChecks: ["Current Andwell hospice status", "Dementia/memory-loss need", "Patient/family preference", "Program availability"],
  },
  {
    id: "emotional-spiritual-support",
    name: "Emotional & Spiritual Support",
    family: "Hospice & Palliative",
    summary: "Hospice/palliative psychosocial or spiritual review when distress, fear, family conflict or existential suffering is documented.",
    reviewerRole: "Hospice/palliative social work or spiritual-care team",
    sourceUrl: "https://andwell.org/health-services/hospice-palliative-care/emotional-spiritual-support/",
    eligibilityChecks: ["Current care context", "Documented emotional/spiritual need", "Patient/family preference", "Appropriate team assignment"],
  },
  {
    id: "bereavement-support",
    name: "Bereavement Support",
    family: "Hospice & Palliative",
    summary: "Grief and bereavement support review for patients, caregivers or family members when loss-related needs are documented.",
    reviewerRole: "Bereavement team",
    sourceUrl: "https://andwell.org/health-services/hospice-palliative-care/bereavement-support/",
    eligibilityChecks: ["Relationship to loss/care episode", "Requested support", "Age/program fit when applicable", "Program availability"],
  },
  {
    id: "behavioral-health-outpatient",
    name: "Outpatient Mental Health & Co-Occurring Counseling",
    family: "Community & Behavioral Health",
    summary: "Behavioral-health review for documented mental-health, substance-use or co-occurring needs.",
    reviewerRole: "Behavioral Health intake",
    sourceUrl: "https://andwell.org/health-services/behavioral-health-services/",
    serviceAreaKey: "community-behavioral",
    eligibilityChecks: ["Presenting behavioral-health need", "Level-of-care appropriateness", "Payer/coverage", "Scheduling/service availability"],
  },
  {
    id: "behavioral-health-home-adult",
    name: "Behavioral Health Home - Adults",
    family: "Community & Behavioral Health",
    summary: "Integrated adult behavioral-health and care-coordination review when medical, social and behavioral needs intersect.",
    reviewerRole: "Adult Behavioral Health Home intake",
    sourceUrl: "https://andwell.org/health-services/behavioral-health-services/",
    eligibilityChecks: ["Age/program criteria", "Behavioral-health eligibility", "Care-coordination need", "MaineCare/program requirements", "Availability"],
  },
  {
    id: "behavioral-health-home-child",
    name: "Behavioral Health Home - Children",
    family: "Community & Behavioral Health",
    summary: "Integrated child/family behavioral-health care coordination when clinical, school, medical or social needs are documented.",
    reviewerRole: "Children's Behavioral Health Home intake",
    sourceUrl: "https://andwell.org/health-services/behavioral-health-services/",
    eligibilityChecks: ["Age/program criteria", "Behavioral-health eligibility", "Care-coordination need", "MaineCare/program requirements", "Availability"],
  },
  {
    id: "community-care-team",
    name: "Community Care Team",
    family: "Community & Behavioral Health",
    summary: "Care-management review for complex chronic illness, fragmented care, high utilization and social/resource barriers.",
    reviewerRole: "Community Care Team intake / care manager",
    sourceUrl: "https://andwell.org/health-services/behavioral-health-services/",
    eligibilityChecks: ["Program/payer criteria", "Complex care-management need", "Social/resource barriers", "Existing care-management relationships", "Availability"],
  },
  {
    id: "home-program",
    name: "Housing Outreach Member Engagement (H.O.M.E.)",
    family: "Community & Behavioral Health",
    summary: "Specialized care-management review for long-term homelessness or significant housing instability.",
    reviewerRole: "H.O.M.E. / Community Care Team",
    sourceUrl: "https://andwell.org/health-services/behavioral-health-services/",
    eligibilityChecks: ["Housing-status criteria", "Program/payer criteria", "Care-management need", "Service availability"],
  },
  {
    id: "adult-hcbs",
    name: "Adult Home & Community Based Services",
    family: "Community & Behavioral Health",
    summary: "Home/community support review for adults with intellectual disability or autism and documented independent-living needs.",
    reviewerRole: "Adult HCBS intake",
    sourceUrl: "https://andwell.org/health-services/behavioral-health-services/",
    eligibilityChecks: ["Age 18+", "Intellectual disability/autism criteria", "MaineCare Section 21/29 eligibility", "Functional/support need", "Availability"],
  },
  {
    id: "adult-day",
    name: "Adult Day Program",
    family: "Community & Behavioral Health",
    summary: "Structured day/community support review for adults with intellectual/developmental disability who may benefit from supervision, activity and community integration.",
    reviewerRole: "Adult Day program intake",
    sourceUrl: "https://andwell.org/health-services/behavioral-health-services/",
    eligibilityChecks: ["Adult program criteria", "Intellectual/developmental disability", "Functional/support need", "Location/capacity", "Payer/program requirements"],
  },
  {
    id: "child-rcs",
    name: "Rehabilitative & Community Support (RCS)",
    family: "Community & Behavioral Health",
    summary: "Child/youth community-support review when behavioral-health diagnosis and functional skill needs are documented.",
    reviewerRole: "Children's RCS intake",
    sourceUrl: "https://andwell.org/health-services/behavioral-health-services/",
    eligibilityChecks: ["Age through 20", "Qualifying behavioral-health diagnosis", "Functional assessment criteria", "MaineCare Section 28 requirements", "Availability"],
  },
  {
    id: "adult-therapy",
    name: "Adult Therapy Care (PT/OT/Speech)",
    family: "Therapy & Specialty",
    summary: "Therapy review for mobility, functional, swallowing, speech/language or rehabilitation needs.",
    reviewerRole: "Therapy Care intake",
    sourceUrl: "https://andwell.org/health-services/therapycare-specialty-services/",
    serviceAreaKey: "therapy",
    eligibilityChecks: ["Therapy discipline/clinical need", "Order/referral as required", "Payer/coverage", "Service area", "Scheduling availability"],
  },
  {
    id: "pediatric-therapy",
    name: "Pediatric Therapy",
    family: "Therapy & Specialty",
    summary: "Pediatric PT/OT/speech review for developmental, sensory, motor, communication or functional needs.",
    reviewerRole: "Pediatric Therapy intake",
    sourceUrl: "https://andwell.org/health-services/therapycare-specialty-services/pediatric-therapy/",
    eligibilityChecks: ["Age/program criteria", "PT/OT/speech need", "Order/referral as required", "Payer/coverage", "Availability"],
  },
  {
    id: "audiology",
    name: "Audiology",
    family: "Therapy & Specialty",
    summary: "Audiology review when hearing loss, hearing difficulty or hearing-device concerns are documented.",
    reviewerRole: "Audiology intake",
    sourceUrl: "https://andwell.org/health-services/therapycare-specialty-services/audiology/",
    serviceAreaKey: "audiology",
    eligibilityChecks: ["Audiology/hearing need", "Payer/self-pay requirements", "Service area", "Scheduling availability"],
  },
  {
    id: "maternal-child-health",
    name: "Maternal & Child Health",
    family: "Therapy & Specialty",
    summary: "Maternal/pediatric home-health specialty review for high-risk pregnancy or medically fragile children with complex clinical needs.",
    reviewerRole: "Maternal & Child Health clinical intake",
    sourceUrl: "https://andwell.org/health-services/therapycare-specialty-services/maternal-child-health/",
    eligibilityChecks: ["Age/maternal program criteria", "Clinical/skilled need", "Provider order/referral", "Payer/coverage", "Service availability"],
  },
] as const;

const SERVICE_BY_ID = new Map<AndwellServiceId, AndwellCareService>(
  ANDWELL_CARE_SERVICES.map((service) => [service.id, service]),
);

export function getAndwellCareService(id: AndwellServiceId): AndwellCareService {
  const service = SERVICE_BY_ID.get(id);
  if (!service) throw new Error(`Unknown Andwell service: ${id}`);
  return service;
}

function normalizeCounty(value: string): string {
  return value.trim().replace(/\s+county$/i, "").toLowerCase();
}

export function andwellServiceAvailability(
  serviceId: AndwellServiceId,
  county?: string | null,
): AndwellServiceAvailability {
  const service = getAndwellCareService(serviceId);
  if (!service.serviceAreaKey || !county?.trim()) return "verify";
  const normalized = normalizeCounty(county);
  return SERVICE_AREAS[service.serviceAreaKey].some(
    (candidate) => normalizeCounty(candidate) === normalized,
  )
    ? "available"
    : "not_listed";
}
