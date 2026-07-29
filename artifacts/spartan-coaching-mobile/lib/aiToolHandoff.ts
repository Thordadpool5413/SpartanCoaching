import type { SpartanAiToolId } from "@workspace/spartan-ai-tools";

type AiToolHandoff = {
  sourceToolId: SpartanAiToolId;
  targetToolId: SpartanAiToolId;
  output: unknown;
};

let pendingHandoff: AiToolHandoff | null = null;

export function stageAiToolHandoff(handoff: AiToolHandoff): void {
  pendingHandoff = handoff;
}

export function consumeAiToolHandoff(
  targetToolId: SpartanAiToolId,
): AiToolHandoff | null {
  if (pendingHandoff?.targetToolId !== targetToolId) return null;
  const handoff = pendingHandoff;
  pendingHandoff = null;
  return handoff;
}
