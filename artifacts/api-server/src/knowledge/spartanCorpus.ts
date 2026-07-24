/**
 * Spartan Method knowledge corpus — curated, citable chunks (no PHI).
 * v1 is in-memory keyword retrieval. Embeddings can replace score() later.
 */

export type KnowledgeChunk = {
  id: string;
  title: string;
  category: "method" | "eligibility" | "objection" | "territory" | "ethics" | "operations";
  body: string;
  tags: string[];
};

export const SPARTAN_CORPUS: KnowledgeChunk[] = [
  {
    id: "method-des",
    title: "Spartan Method triad",
    category: "method",
    tags: ["discipline", "empathy", "strategy", "method", "spartan"],
    body:
      "The Spartan Method rests on three non-negotiables: Discipline (preparation, structure, follow-through), Empathy (hearing what is under the words), and Strategy (value positioning, objections, specific next steps). Every Field Kit tool should reinforce Tuesday behavior—not generic motivation.",
  },
  {
    id: "method-tuesday",
    title: "Tuesday behavior standard",
    category: "method",
    tags: ["execution", "field", "accountability", "weekly"],
    body:
      "Expert hospice growth is measured by Tuesday behavior: better conversations, clearer weeks, and fewer eligible patients without a referral path. Browsing tools without completing a real account cycle does not create evaluation signal.",
  },
  {
    id: "ethics-phi",
    title: "No PHI in tools",
    category: "ethics",
    tags: ["phi", "hipaa", "compliance", "privacy"],
    body:
      "Field Kit tools are for planning and messaging only. Never enter patient names, MRNs, DOBs, addresses, or other identifiers. Describe situations in general clinical and operational terms. Patient access and ethical messaging are non-negotiable.",
  },
  {
    id: "eligibility-six-month",
    title: "Six-month prognosis framing",
    category: "eligibility",
    tags: ["eligibility", "prognosis", "lcd", "hospice", "physician"],
    body:
      "Hospice eligibility is grounded in a physician-certified life expectancy of six months or less if the disease runs its normal course—not a guarantee of death within six months. Sales conversations should educate on criteria and process, never pressure families or override clinical judgment.",
  },
  {
    id: "eligibility-adls",
    title: "Functional decline signals",
    category: "eligibility",
    tags: ["adl", "kps", "pps", "decline", "eligibility"],
    body:
      "Functional decline (ADLs, Karnofsky/PPS trends, weight loss, recurrent infections, increasing ED use) often supports clinical conversation about goals of care. Reps equip referral sources with education; physicians determine eligibility.",
  },
  {
    id: "objection-not-ready",
    title: "Objection: family not ready",
    category: "objection",
    tags: ["objection", "family", "not ready", "grief"],
    body:
      "\"Not ready\" usually means prognosis disbelief, fear of \"giving up,\" or unresolved guilt. Expert response: acknowledge emotion, ask which of the three it is, educate on concurrent support and choice, never argue. Secure a small next step (goals-of-care conversation with clinical team).",
  },
  {
    id: "objection-preferred-hospice",
    title: "Objection: we already have a preferred hospice",
    category: "objection",
    tags: ["objection", "preferred", "competitor", "choice"],
    body:
      "Honor the existing relationship. Position as patient choice and capacity backup—not replacement. Ask about after-hours coverage gaps, complex cases, and response-time friction. Request to be the second call on a specific scenario, not an abstract \"try us.\"",
  },
  {
    id: "objection-giving-up",
    title: "Objection: hospice means giving up",
    category: "objection",
    tags: ["objection", "giving up", "physician", "treatment"],
    body:
      "Reframe hospice as specialized care for quality of life when curative goals no longer fit. Use clinical language: symptom expertise, 24/7 support, physician partnership. Offer one case-based education conversation, not a pitch.",
  },
  {
    id: "territory-account-tiers",
    title: "Account prioritization",
    category: "territory",
    tags: ["territory", "accounts", "priority", "weekly plan"],
    body:
      "Prioritize accounts by referral potential and relationship stage: champions and high-volume facilities early week; re-engagement and new opens mid-to-late week. Every priority account needs a win condition for the visit—not a vague \"check in.\"",
  },
  {
    id: "ops-next-step",
    title: "Specific next-step closes",
    category: "operations",
    tags: ["close", "next step", "follow-up", "commitment"],
    body:
      "Weak closes are vague. Expert closes name a specific next step: 15-minute with the DON, facility in-service date, joint round with case management, or a single complex-case trial. Capture it in the Command Center so the next visit is continuous, not restarting.",
  },
  {
    id: "ops-command-center",
    title: "Sales Command Center as spine",
    category: "operations",
    tags: ["command center", "workflow", "call", "coaching"],
    body:
      "The Sales Command Center is the daily OS: account and contact, pre-call plan, practice, outcome capture, coaching feedback, next appointment. Satellite tools (objections, role-play, email, weekly plan) should feed this spine rather than replace it.",
  },
  {
    id: "method-discovery",
    title: "Discovery before pitch",
    category: "method",
    tags: ["discovery", "questions", "listening"],
    body:
      "Top reps earn the right to educate by discovering process friction, coverage gaps, and what \"good\" looks like for that referral source. Two strong discovery questions beat a monologue about features.",
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/** Simple BM25-ish keyword score for v1 retrieval. */
export function scoreChunk(chunk: KnowledgeChunk, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const hay = tokenize(`${chunk.title} ${chunk.body} ${chunk.tags.join(" ")} ${chunk.category}`);
  const set = new Set(hay);
  let score = 0;
  for (const t of queryTokens) {
    if (set.has(t)) score += 2;
    if (chunk.tags.some((tag) => tag.includes(t) || t.includes(tag))) score += 1.5;
    if (chunk.title.toLowerCase().includes(t)) score += 1;
  }
  return score;
}

export function searchSpartanKnowledge(
  query: string,
  limit = 5,
): Array<KnowledgeChunk & { score: number }> {
  const tokens = tokenize(query);
  const ranked = SPARTAN_CORPUS.map((chunk) => ({
    ...chunk,
    score: scoreChunk(chunk, tokens),
  }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 10)));

  return ranked;
}

export function formatCitationsForPrompt(
  chunks: Array<KnowledgeChunk & { score?: number }>,
): string {
  if (!chunks.length) return "";
  return chunks
    .map(
      (c, i) =>
        `[Spartan source ${i + 1}: ${c.title} | ${c.category}]\n${c.body}`,
    )
    .join("\n\n");
}
