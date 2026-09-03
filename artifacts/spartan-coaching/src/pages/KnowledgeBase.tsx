import { AccentText } from "@/components/AccentText";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { CoachingCTA } from "@/components/CoachingCTA";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";
import { Search, BookOpen, ChevronRight, Home, Shield } from "lucide-react";

type Category =
  | "Clinical Terms"
  | "Regulations & Compliance"
  | "Eligibility Criteria"
  | "Sales & Marketing"
  | "Care Services"
  | "Insurance & Billing";

interface GlossaryEntry {
  term: string;
  definition: string;
  category: Category;
}

const categories: Category[] = [
  "Clinical Terms",
  "Regulations & Compliance",
  "Eligibility Criteria",
  "Sales & Marketing",
  "Care Services",
  "Insurance & Billing",
];

const glossaryEntries: GlossaryEntry[] = [
  {
    term: "Palliative Care",
    definition: "Medical care focused on providing relief from symptoms, pain, and stress of a serious illness. Unlike hospice, palliative care can be provided alongside curative treatment at any stage of illness.",
    category: "Clinical Terms",
  },
  {
    term: "Comfort Care",
    definition: "Treatment approach focusing on symptom management rather than curing the underlying disease. Prioritizes quality of life, pain management, and emotional support.",
    category: "Clinical Terms",
  },
  {
    term: "Terminal Prognosis",
    definition: "A medical determination that a patient has a life expectancy of six months or less if the disease runs its normal course, as certified by a physician.",
    category: "Clinical Terms",
  },
  {
    term: "Activities of Daily Living (ADLs)",
    definition: "Basic self-care activities including bathing, dressing, eating, toileting, transferring, and continence. Decline in ADLs is a key indicator for hospice eligibility.",
    category: "Clinical Terms",
  },
  {
    term: "Karnofsky Performance Scale (KPS)",
    definition: "A scoring system (0-100) that measures a patient's functional status and ability to perform ordinary tasks. Scores below 50 often indicate hospice eligibility.",
    category: "Clinical Terms",
  },
  {
    term: "PPS (Palliative Performance Scale)",
    definition: "Assessment tool measuring ambulation, activity level, self-care, intake, and consciousness level. Used to determine hospice appropriateness.",
    category: "Clinical Terms",
  },
  {
    term: "Dyspnea",
    definition: "Difficulty breathing or shortness of breath, a common symptom in end-stage cardiac and pulmonary diseases requiring hospice-level symptom management.",
    category: "Clinical Terms",
  },
  {
    term: "Cachexia",
    definition: "Severe weight loss and muscle wasting associated with serious illness. A key clinical indicator for hospice eligibility in many diagnoses.",
    category: "Clinical Terms",
  },
  {
    term: "Medicare Hospice Benefit (MHB)",
    definition: "The federal program under Medicare Part A that covers hospice services for eligible beneficiaries. Requires a terminal prognosis of 6 months or less and election of comfort-focused care.",
    category: "Regulations & Compliance",
  },
  {
    term: "Conditions of Participation (CoPs)",
    definition: "Federal regulations (42 CFR Part 418) that hospice providers must meet to participate in Medicare. Cover patient rights, care planning, quality assessment, and organizational structure.",
    category: "Regulations & Compliance",
  },
  {
    term: "Certificate of Terminal Illness (CTI)",
    definition: "Written certification by the attending physician and hospice medical director that a patient's prognosis is a life expectancy of 6 months or less.",
    category: "Regulations & Compliance",
  },
  {
    term: "Face-to-Face (F2F) Encounter",
    definition: "Required physician or nurse practitioner visit with the patient before the third benefit period recertification. Must occur within 30 days prior to the start of the benefit period.",
    category: "Regulations & Compliance",
  },
  {
    term: "Hospice Election Statement",
    definition: "The formal document signed by the patient (or representative) electing the Medicare Hospice Benefit. Includes designation of the hospice provider and acknowledgment of palliative care focus.",
    category: "Regulations & Compliance",
  },
  {
    term: "Benefit Periods",
    definition: "Medicare hospice coverage is divided into benefit periods: two 90-day periods followed by unlimited 60-day periods, each requiring physician recertification.",
    category: "Regulations & Compliance",
  },
  {
    term: "PEPPER Report",
    definition: "Program for Evaluating Payment Patterns Electronic Report. Used by CMS to identify hospice providers with claims data that may warrant further review.",
    category: "Regulations & Compliance",
  },
  {
    term: "Hospice CAHPS",
    definition: "Consumer Assessment of Healthcare Providers and Systems survey specific to hospice. Measures family experience with care after patient death.",
    category: "Regulations & Compliance",
  },
  {
    term: "General Hospice Eligibility",
    definition: "Patient must have a terminal illness with a prognosis of 6 months or less (if disease runs its normal course), elect comfort care, and have certification from two physicians.",
    category: "Eligibility Criteria",
  },
  {
    term: "LCD (Local Coverage Determination)",
    definition: "Medicare Administrative Contractor guidelines specifying clinical criteria for hospice eligibility by diagnosis. Key resource for determining if a patient meets hospice criteria.",
    category: "Eligibility Criteria",
  },
  {
    term: "Heart Disease Criteria",
    definition: "NYHA Class IV symptoms despite optimal treatment, ejection fraction \u226420%, refractory angina, or history of cardiac arrest or syncope.",
    category: "Eligibility Criteria",
  },
  {
    term: "Dementia Criteria",
    definition: "FAST Scale Stage 7 or beyond, inability to ambulate, dress, or bathe without assistance, urinary/fecal incontinence, limited meaningful speech, plus a comorbid condition within past 12 months.",
    category: "Eligibility Criteria",
  },
  {
    term: "COPD/Pulmonary Criteria",
    definition: "Disabling dyspnea at rest, FEV1 <30% predicted, progressive disease with increasing ER visits or hospitalizations, cor pulmonale or right heart failure.",
    category: "Eligibility Criteria",
  },
  {
    term: "Cancer Criteria",
    definition: "Metastatic or locally advanced disease, progression despite treatment or patient declines further treatment, declining functional status (KPS \u226450).",
    category: "Eligibility Criteria",
  },
  {
    term: "Renal Disease Criteria",
    definition: "Patient not seeking dialysis or discontinuing dialysis, creatinine clearance <10ml/min, serum creatinine >8.0mg/dl, with comorbid conditions.",
    category: "Eligibility Criteria",
  },
  {
    term: "Referral Source",
    definition: "Any individual or organization that refers patients to hospice services, including physicians, hospitals, skilled nursing facilities, assisted living facilities, and home health agencies.",
    category: "Sales & Marketing",
  },
  {
    term: "Census",
    definition: "The total number of patients currently enrolled in a hospice program. A key performance metric for hospice organizations.",
    category: "Sales & Marketing",
  },
  {
    term: "Average Daily Census (ADC)",
    definition: "The average number of patients receiving hospice care on any given day. Calculated by dividing total patient care days by the number of days in the period.",
    category: "Sales & Marketing",
  },
  {
    term: "Length of Stay (LOS)",
    definition: "The number of days a patient is enrolled in hospice from admission to discharge or death. Median LOS nationally is approximately 18 days, but optimal is 90+ days.",
    category: "Sales & Marketing",
  },
  {
    term: "Conversion Rate",
    definition: "The percentage of referrals that result in hospice admissions. A key sales performance metric typically ranging from 60-80%.",
    category: "Sales & Marketing",
  },
  {
    term: "Territory Management",
    definition: "Strategic planning of geographic or account-based sales coverage to maximize referral development and relationship building.",
    category: "Sales & Marketing",
  },
  {
    term: "Interdisciplinary Group (IDG)",
    definition: "The core hospice care team required by Medicare, including a physician, registered nurse, social worker, and pastoral/spiritual counselor. Meets regularly to review and update patient care plans.",
    category: "Care Services",
  },
  {
    term: "Continuous Care",
    definition: "Intensive nursing care provided during a crisis period, requiring a minimum of 8 hours of predominantly nursing care within a 24-hour period. One of four levels of hospice care.",
    category: "Care Services",
  },
  {
    term: "Respite Care",
    definition: "Short-term inpatient care (up to 5 consecutive days) provided to give the primary caregiver temporary relief. One of four levels of hospice care.",
    category: "Care Services",
  },
  {
    term: "General Inpatient Care (GIP)",
    definition: "Short-term acute care in an inpatient facility for pain control or symptom management that cannot be managed at home. One of four levels of hospice care.",
    category: "Care Services",
  },
  {
    term: "Routine Home Care",
    definition: "The most common level of hospice care, provided in the patient's home (including nursing facilities). Includes nursing visits, aide services, social work, and chaplain support.",
    category: "Care Services",
  },
  {
    term: "Bereavement Services",
    definition: "Counseling and support services provided to the family for up to 13 months after the patient's death. Required under Medicare Conditions of Participation.",
    category: "Care Services",
  },
  {
    term: "Per Diem Rate",
    definition: "The daily rate Medicare pays hospice providers for each day a patient is enrolled. Varies by level of care (routine, continuous, respite, GIP).",
    category: "Insurance & Billing",
  },
  {
    term: "Hospice Cap",
    definition: "The annual per-beneficiary Medicare reimbursement limit (approximately $32,000 annually). Providers exceeding the cap must return excess payments.",
    category: "Insurance & Billing",
  },
  {
    term: "Revenue Per Patient Day (RPPD)",
    definition: "Average revenue generated per patient per day of hospice service. Key financial metric for hospice organizations.",
    category: "Insurance & Billing",
  },
  {
    term: "Room & Board",
    definition: "Payment made by hospice to nursing facilities for patients receiving routine hospice care while residing in the facility. Covers lodging and meals, not clinical services.",
    category: "Insurance & Billing",
  },
  {
    term: "Hospice Revocation",
    definition: "A patient's right to revoke the hospice benefit at any time, returning to standard Medicare coverage. The patient may re-elect hospice later.",
    category: "Insurance & Billing",
  },
  {
    term: "Live Discharge",
    definition: "When a patient is discharged from hospice alive, either due to extended prognosis, revocation, or transfer. High live discharge rates may trigger CMS scrutiny.",
    category: "Insurance & Billing",
  },
  {
    term: "FAST Scale",
    definition: "Functional Assessment Staging Tool used to evaluate the progression of dementia. Stage 7 and beyond, combined with comorbid conditions, is a key indicator for hospice eligibility in Alzheimer's and related dementias.",
    category: "Clinical Terms",
  },
  {
    term: "Prognosis",
    definition: "A medical professional's estimate of the likely course and outcome of a disease. In hospice, a prognosis of six months or less is required for Medicare eligibility.",
    category: "Clinical Terms",
  },
  {
    term: "Symptom Burden",
    definition: "The combined impact of all symptoms a patient experiences, including pain, nausea, fatigue, anxiety, and shortness of breath. High symptom burden often indicates appropriateness for hospice level care.",
    category: "Clinical Terms",
  },
  {
    term: "Edema",
    definition: "Swelling caused by excess fluid trapped in body tissues. Peripheral edema and ascites are common indicators of advanced cardiac, liver, and renal disease in hospice eligible patients.",
    category: "Clinical Terms",
  },
  {
    term: "Do Not Resuscitate (DNR)",
    definition: "A medical order indicating that cardiopulmonary resuscitation should not be performed if a patient's heart or breathing stops. While common among hospice patients, a DNR is not required for hospice admission.",
    category: "Clinical Terms",
  },
  {
    term: "OIG (Office of Inspector General)",
    definition: "The federal agency responsible for investigating fraud, waste, and abuse in Medicare programs including hospice. Publishes annual work plans that identify hospice audit priorities.",
    category: "Regulations & Compliance",
  },
  {
    term: "Anti Kickback Statute",
    definition: "Federal law prohibiting the exchange of anything of value to induce or reward referrals for services covered by federal healthcare programs. Hospice marketing activities must be carefully structured to avoid violations.",
    category: "Regulations & Compliance",
  },
  {
    term: "Stark Law",
    definition: "Federal law prohibiting physician self referrals for designated health services payable by Medicare. Hospice organizations must ensure their physician relationships comply with Stark Law exceptions.",
    category: "Regulations & Compliance",
  },
  {
    term: "Liver Disease Criteria",
    definition: "Prothrombin time more than 5 seconds over control, serum albumin less than 2.5 g/dl, refractory ascites, hepatic encephalopathy, or hepatorenal syndrome despite treatment.",
    category: "Eligibility Criteria",
  },
  {
    term: "Stroke/CVA Criteria",
    definition: "Coma or persistent vegetative state beyond three days, dysphagia preventing adequate food and fluid intake, post stroke dementia with FAST Stage 7 or beyond.",
    category: "Eligibility Criteria",
  },
  {
    term: "HIV/AIDS Criteria",
    definition: "CD4 count less than 25, persistent viral load above 100,000 copies, CNS lymphoma, wasting syndrome, or visceral Kaposi sarcoma unresponsive to treatment.",
    category: "Eligibility Criteria",
  },
  {
    term: "Failure to Thrive (Adult)",
    definition: "A general decline in health without a single identifiable terminal diagnosis. Characterized by BMI under 22, unintentional weight loss exceeding 10% in six months, declining functional status, and serum albumin under 2.5.",
    category: "Eligibility Criteria",
  },
  {
    term: "Value Proposition",
    definition: "The specific, measurable benefits your hospice organization delivers to referral sources and patients that differentiate you from competitors. Goes beyond clinical quality to include responsiveness, communication, and education.",
    category: "Sales & Marketing",
  },
  {
    term: "Account Tiering",
    definition: "The practice of categorizing referral sources into A, B, and C tiers based on referral volume, growth potential, and relationship strength. Determines visit frequency and resource allocation.",
    category: "Sales & Marketing",
  },
  {
    term: "Lunch and Learn",
    definition: "An educational presentation delivered at a referral source, typically during a meal. Effective lunch and learns focus on clinical education rather than company promotion and should last 15 to 20 minutes.",
    category: "Sales & Marketing",
  },
  {
    term: "Ride Along",
    definition: "A field coaching session where a sales manager accompanies a rep on account visits. Most effective when the manager observes, takes notes, and debriefs after each call rather than taking over conversations.",
    category: "Sales & Marketing",
  },
  {
    term: "Advance Directive",
    definition: "A legal document in which a person specifies what actions should be taken for their health if they can no longer make decisions. Includes living wills and durable power of attorney for healthcare.",
    category: "Care Services",
  },
  {
    term: "Plan of Care (POC)",
    definition: "The comprehensive care plan developed by the hospice interdisciplinary team for each patient. Updated at each IDG meeting and must reflect the patient's current condition, goals, and interventions.",
    category: "Care Services",
  },
  {
    term: "Hospice Aide",
    definition: "A trained caregiver who provides personal care services such as bathing, grooming, and light housekeeping under the supervision of a registered nurse. Part of the hospice interdisciplinary team.",
    category: "Care Services",
  },
  {
    term: "Sequestration",
    definition: "Automatic federal budget cuts that reduce Medicare hospice payments by approximately 2%. Affects all four levels of hospice care and has been in effect since 2013.",
    category: "Insurance & Billing",
  },
  {
    term: "Dual Eligible",
    definition: "A patient who qualifies for both Medicare and Medicaid. Hospice billing for dual eligible patients follows Medicare rules, but Medicaid may cover additional services not included in the hospice benefit.",
    category: "Insurance & Billing",
  },
  {
    term: "Service Intensity Add On (SIA)",
    definition: "Additional Medicare payment for registered nurse and social worker visits provided during the last seven days of a patient's life. Designed to support increased care needs at end of life.",
    category: "Insurance & Billing",
  },
];

function categorySlug(cat: string): string {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

type SpartanHit = {
  id: string;
  title: string;
  category: string;
  body: string;
  score?: number;
};

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [spartanHits, setSpartanHits] = useState<SpartanHit[]>([]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return glossaryEntries.filter((entry) => {
      const matchesCategory = !selectedCategory || entry.category === selectedCategory;
      const matchesSearch =
        !query ||
        entry.term.toLowerCase().includes(query) ||
        entry.definition.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSpartanHits([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/knowledge/search?q=${encodeURIComponent(q)}&limit=4`, {
        credentials: "include",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.results) setSpartanHits(data.results);
          else setSpartanHits([]);
        })
        .catch(() => setSpartanHits([]));
    }, 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  return (
    <div className="flex flex-col" data-testid="section-knowledge-base">
      <SEO
        title="Hospice Knowledge Base - Glossary & Reference | Spartan Coaching"
        description="The definitive reference for hospice terminology, regulations, eligibility criteria, and clinical concepts. Searchable glossary for hospice professionals."
        keywords="hospice glossary, hospice terminology, hospice eligibility, Medicare hospice benefit, hospice regulations, palliative care definitions"
      />

      <section className="spacing-section">
        <div className="max-w-7xl mx-auto spacing-container">
          <FadeIn>
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap" aria-label="Breadcrumb">
              <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>Learn</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">Knowledge Base</span>
            </nav>

            <div className="text-center mb-12 sm:mb-16">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-spartan-gradient rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              <h1 className="text-h2 text-gradient-elegant mb-4"><AccentText>Hospice Knowledge Base</AccentText></h1>
              <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
                The definitive reference for hospice terminology, regulations, eligibility criteria, and clinical concepts
              </p>
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-knowledge"
                  type="text"
                  placeholder="Search terms, definitions, or concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {spartanHits.length > 0 && (
              <div className="max-w-3xl mx-auto mb-10" data-testid="spartan-knowledge-hits">
                <Card className="border border-primary/30 bg-primary/5 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="text-xs font-bold tracking-widest uppercase text-primary">
                      Spartan Method sources (membership)
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {spartanHits.map((hit) => (
                      <li key={hit.id} className="text-sm">
                        <p className="font-bold text-foreground">{hit.title}</p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                          {hit.category}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">{hit.body}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted-foreground">
                    Sign in with Hospice Sales Pro access to retrieve these live. Glossary terms below remain public.
                  </p>
                </Card>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
              <Badge
                data-testid="badge-category-all"
                variant={selectedCategory === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  data-testid={`badge-category-${categorySlug(cat)}`}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mb-8" data-testid="text-result-count">
              Showing {filteredEntries.length} of {glossaryEntries.length} entries
            </p>
          </FadeIn>

          {filteredEntries.length === 0 ? (
            <FadeIn>
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-body-lg text-muted-foreground mb-2">No entries found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or category filter
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-cards">
              {filteredEntries.map((entry, index) => (
                <StaggerItem key={entry.term}>
                  <Card
                    data-testid={`card-term-${index}`}
                    className="h-full"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <h3 className="text-lg font-bold text-foreground leading-snug"><AccentText>{entry.term}</AccentText></h3>
                        <Badge variant="secondary" className="no-default-hover-elevate shrink-0">
                          {entry.category}
                        </Badge>
                      </div>
                      <p className="text-body text-muted-foreground leading-relaxed">
                        {entry.definition}
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Quiz CTA */}
          <FadeIn>
            <div className="mt-14 mb-4">
              <Card className="border-2" data-testid="card-quiz-cta">
                <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground mb-1"><AccentText>Ready to test yourself?</AccentText></h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Put your hospice knowledge to work with our interactive quiz. Covers eligibility, Medicare benefit rules, clinical terms, and compliance.
                    </p>
                  </div>
                  <Button asChild className="flex-shrink-0" data-testid="button-take-quiz-cta">
                    <Link href="/quiz">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Take the Quiz
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </FadeIn>

          <FadeIn>
            <CoachingCTA className="mt-6" />
          </FadeIn>
        </div>
      </section>
    </div>
  );
}