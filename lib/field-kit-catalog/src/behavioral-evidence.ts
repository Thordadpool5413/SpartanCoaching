/**
 * Deliberately local types: this manifest is exported by the catalog barrel,
 * so importing its tool types back from index.ts would create an unnecessary
 * barrel dependency. The structural shape also lets proposed catalog entries
 * be validated without importing either artifact package.
 */
type CatalogToolId =
  | "sales-workflow"
  | "spartan-intelligence"
  | "playbooks"
  | "objections"
  | "research"
  | "transcribe"
  | "email-templates"
  | "role-play"
  | "activity-calculator"
  | "rep-cost"
  | "roi"
  | "branch"
  | "cold-call"
  | "weekly-plan"
  | "brand-video";

type BehavioralTool = {
  id: string;
  requiredStates?: readonly string[];
  requiredActions?: readonly string[];
};

/**
 * A declaration describes what a tool should do. This contract describes the
 * separate proof that a real platform suite exercised it. Keeping the two
 * records independent prevents a catalog edit from becoming "evidence" by
 * virtue of being copied into a declaration.
 */
export type BehavioralEvidencePlatform = "web" | "iphone";
export type BehavioralEvidence = {
  toolId: string;
  platform: BehavioralEvidencePlatform;
  suiteId: string;
  testPath: string;
  states: readonly string[];
  actions: readonly string[];
};

export type BehavioralEvidenceValidationOptions = {
  requirePlatforms?: readonly BehavioralEvidencePlatform[];
};

type ExplicitCoverage = {
  states: readonly string[];
  actions: readonly string[];
};

const CATALOG_BEHAVIORAL_SUITE = {
  web: {
    suiteId: "web_field_kit_catalog_behavioral",
    testPath: "src/lib/field-kit-catalog.behavioral.test.tsx",
  },
  iphone: {
    suiteId: "iphone_field_kit_catalog_behavioral",
    testPath: "__tests__/field-kit-catalog.behavioral.test.tsx",
  },
} as const;

/**
 * This is intentionally a hand-maintained allow-list. Adding a tool, state,
 * or action to the catalog without adding its platform coverage is rejected.
 * The web and iPhone artifact suites own these paths; this package only owns
 * their explicit, reviewable release evidence manifest.
 */
const EXPLICIT_CATALOG_COVERAGE: Record<CatalogToolId, ExplicitCoverage> = {
  "sales-workflow": { states: ["empty", "ready", "loading", "complete", "error"], actions: ["add account", "build plan", "complete call", "approve next step"] },
  "spartan-intelligence": { states: ["empty", "loading", "complete", "error"], actions: ["search provider", "review sources", "copy brief"] },
  playbooks: { states: ["empty", "loading", "complete", "error"], actions: ["generate playbook", "review", "copy or download"] },
  objections: { states: ["empty", "loading", "complete", "error"], actions: ["generate response", "review", "copy"] },
  research: { states: ["empty", "loading", "complete", "error"], actions: ["ask question", "review sources", "copy insight"] },
  transcribe: { states: ["empty", "loading", "complete", "error"], actions: ["upload or paste", "review transcript", "copy coaching moment"] },
  "email-templates": { states: ["empty", "loading", "complete", "error"], actions: ["choose template", "generate draft", "copy or share"] },
  "role-play": { states: ["empty", "loading", "complete", "error"], actions: ["choose scenario", "run role-play", "review feedback"] },
  "activity-calculator": { states: ["empty", "ready", "calculated", "error"], actions: ["enter goal", "calculate", "reset"] },
  "rep-cost": { states: ["empty", "ready", "calculated", "error"], actions: ["enter costs", "calculate", "reset"] },
  roi: { states: ["empty", "ready", "calculated", "error"], actions: ["enter baseline", "calculate", "reset"] },
  branch: { states: ["empty", "ready", "calculated", "error"], actions: ["enter branch inputs", "calculate", "reset"] },
  "cold-call": { states: ["empty", "loading", "complete", "error"], actions: ["describe target", "generate script", "copy or download"] },
  "weekly-plan": { states: ["empty", "loading", "complete", "error"], actions: ["set win condition", "generate plan", "copy or download"] },
  "brand-video": { states: ["ready", "playing", "paused", "error"], actions: ["open video", "play", "copy or share link"] },
};

export const FIELD_KIT_BEHAVIORAL_EVIDENCE: readonly BehavioralEvidence[] =
  (Object.entries(EXPLICIT_CATALOG_COVERAGE) as [CatalogToolId, ExplicitCoverage][])
    .flatMap(([toolId, coverage]) =>
      (["web", "iphone"] as const).map((platform) => ({
        toolId,
        platform,
        suiteId: CATALOG_BEHAVIORAL_SUITE[platform].suiteId,
        testPath: CATALOG_BEHAVIORAL_SUITE[platform].testPath,
        states: coverage.states,
        actions: coverage.actions,
      })),
    );

const includesAll = (required: readonly string[], observed: readonly string[]) =>
  required.every((value) => observed.includes(value));

/**
 * Validates behavioral proof independently of capability declarations.
 * `tools` can be a proposed catalog, making new tools and contract changes
 * rejectable before they reach either artifact.
 */
export function validateBehavioralEvidence(
  tools: readonly BehavioralTool[],
  evidence: readonly BehavioralEvidence[] = FIELD_KIT_BEHAVIORAL_EVIDENCE,
  options: BehavioralEvidenceValidationOptions = {},
): string[] {
  const platforms = options.requirePlatforms ?? ["web", "iphone"];
  const errors: string[] = [];
  for (const tool of tools) {
    for (const platform of platforms) {
      const matches = evidence.filter(
        (item) => item.toolId === tool.id && item.platform === platform,
      );
      if (matches.length === 0) {
        errors.push(`${tool.id} has no explicit ${platform} behavioral evidence`);
        continue;
      }
      if (matches.some((item) => item.suiteId.includes("contract") || !item.testPath)) {
        errors.push(`${tool.id} ${platform} evidence must reference a behavioral suite`);
      }
      const states = matches.flatMap((item) => item.states);
      const actions = matches.flatMap((item) => item.actions);
      if (!includesAll(tool.requiredStates ?? [], states)) {
        errors.push(`${tool.id} ${platform} behavioral evidence does not cover every required state`);
      }
      if (!includesAll(tool.requiredActions ?? [], actions)) {
        errors.push(`${tool.id} ${platform} behavioral evidence does not cover every required action`);
      }
    }
  }
  return errors;
}
