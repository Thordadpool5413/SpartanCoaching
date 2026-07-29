import { getSpartanAiTool, type SpartanAiToolId } from "./registry";

export type SpartanAiToolConnection = {
  from: SpartanAiToolId;
  to: SpartanAiToolId;
  label: string;
  description: string;
};

const CONNECTIONS: readonly SpartanAiToolConnection[] = [
  {
    from: "content-generator",
    to: "content-categorizer",
    label: "Categorize this content",
    description: "Carry the generated draft into categorization and tagging.",
  },
  {
    from: "content-categorizer",
    to: "content-recommender",
    label: "Build recommendations",
    description: "Use the classification to seed a recommendation workflow.",
  },
  {
    from: "content-recommender",
    to: "content-generator",
    label: "Create recommended content",
    description: "Turn the recommendation into a new content brief.",
  },
  {
    from: "content-gap-analyzer",
    to: "content-generator",
    label: "Fill the highest-priority gap",
    description: "Create content from the gaps and priorities just identified.",
  },
  {
    from: "territory-account-discovery",
    to: "email-optimizer",
    label: "Draft account outreach",
    description: "Use discovered account context to prepare outreach.",
  },
  {
    from: "email-optimizer",
    to: "content-categorizer",
    label: "Classify this draft",
    description:
      "Categorize the optimized email for reuse in the content library.",
  },
  {
    from: "development-plan-generator",
    to: "microlearning-generator",
    label: "Create the next practice",
    description: "Turn the development plan into a focused learning activity.",
  },
  {
    from: "microlearning-generator",
    to: "development-plan-generator",
    label: "Update development plan",
    description: "Use this practice result as assessment context.",
  },
  {
    from: "family-meeting-simulator",
    to: "development-plan-generator",
    label: "Build a coaching plan",
    description:
      "Convert simulator feedback into a structured development plan.",
  },
  {
    from: "medical-record-lcd-verifier",
    to: "documentation-gap-analyzer",
    label: "Analyze documentation gaps",
    description: "Carry extracted findings into an ephemeral gap analysis.",
  },
  {
    from: "documentation-gap-analyzer",
    to: "admission-eligibility",
    label: "Review eligibility evidence",
    description:
      "Use documented gaps to prepare a qualified-reviewer assessment.",
  },
  {
    from: "admission-eligibility",
    to: "medicare-lcd-advisor",
    label: "Ask an LCD follow-up",
    description: "Continue with a policy-focused educational question.",
  },
  {
    from: "medicare-lcd-advisor",
    to: "documentation-gap-analyzer",
    label: "Check documentation against guidance",
    description: "Turn the policy guidance into a documentation checklist.",
  },
  {
    from: "medicare-lcd-advisor",
    to: "lcd-policy-sales-playbook",
    label: "Create a compliant playbook",
    description:
      "Translate reviewed policy guidance into education for the field.",
  },
  {
    from: "lcd-policy-sales-playbook",
    to: "medicare-lcd-advisor",
    label: "Verify a policy statement",
    description: "Send a playbook statement back for evidence-bound review.",
  },
] as const;

function outputText(output: unknown): string {
  if (typeof output === "string") return output;
  return JSON.stringify(output, null, 2);
}

function arrayFromOutput(output: unknown): Record<string, unknown>[] {
  return [{ sourceToolOutput: output }];
}

export function getSpartanAiToolConnections(
  toolId: SpartanAiToolId,
): readonly SpartanAiToolConnection[] {
  return CONNECTIONS.filter((connection) => connection.from === toolId);
}

export function buildConnectedToolInput(
  sourceToolId: SpartanAiToolId,
  targetToolId: SpartanAiToolId,
  output: unknown,
): Record<string, unknown> {
  const connection = CONNECTIONS.find(
    (item) => item.from === sourceToolId && item.to === targetToolId,
  );
  const target = getSpartanAiTool(targetToolId);
  if (!connection || !target) {
    throw new Error("The requested AI tool connection is not supported.");
  }

  const input: Record<string, unknown> = {
    ...(target.exampleInput as Record<string, unknown>),
  };
  const text = outputText(output);

  switch (`${sourceToolId}:${targetToolId}`) {
    case "content-generator:content-categorizer":
      input.title = "Generated field content";
      input.content = text;
      break;
    case "content-categorizer:content-recommender":
      input.interactionHistory = arrayFromOutput(output);
      input.referenceContent = { classification: output };
      break;
    case "content-recommender:content-generator":
    case "content-gap-analyzer:content-generator":
      input.brief = `Create the next practical asset from this analysis:\n${text}`;
      break;
    case "territory-account-discovery:email-optimizer":
      input.situation = `Account discovery context:\n${text}`;
      input.previousInteraction = "No prior interaction was supplied.";
      break;
    case "email-optimizer:content-categorizer":
      input.title = "Optimized outreach draft";
      input.content = text;
      break;
    case "development-plan-generator:microlearning-generator":
      input.previousTopics = [text];
      input.category = "development plan priority";
      break;
    case "microlearning-generator:development-plan-generator":
    case "family-meeting-simulator:development-plan-generator":
      input.assessmentData = { sourceTool: sourceToolId, result: output };
      break;
    case "medical-record-lcd-verifier:documentation-gap-analyzer":
      input.clinicalData = { verifierResult: output };
      input.documentedEvidence = arrayFromOutput(output);
      break;
    case "documentation-gap-analyzer:admission-eligibility":
      input.patientCondition = `Documentation gap analysis:\n${text}`;
      input.functionStatus =
        "Use only functional status present in the supplied analysis.";
      input.recentHospitalizations =
        "Use only utilization facts present in the supplied analysis.";
      input.criteria = arrayFromOutput(output);
      break;
    case "admission-eligibility:medicare-lcd-advisor":
      input.context = text;
      input.question =
        "What evidence and documentation should the qualified reviewer verify next?";
      break;
    case "medicare-lcd-advisor:documentation-gap-analyzer":
      input.criteria = arrayFromOutput(output);
      input.clinicalData = { advisorResult: output };
      break;
    case "medicare-lcd-advisor:lcd-policy-sales-playbook":
      input.policyChange = { reviewedGuidance: output };
      input.evidence = arrayFromOutput(output);
      break;
    case "lcd-policy-sales-playbook:medicare-lcd-advisor":
      input.context = text;
      input.question =
        "Which statements in this playbook are supported by the supplied evidence, and what still requires verification?";
      break;
  }

  return target.inputSchema.parse(input) as Record<string, unknown>;
}
