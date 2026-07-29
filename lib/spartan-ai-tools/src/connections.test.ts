import { describe, expect, it } from "vitest";
import {
  buildConnectedToolInput,
  getSpartanAiToolConnections,
} from "./connections";
import { getSpartanAiTool, SPARTAN_AI_TOOLS } from "./registry";

describe("AI tool connections", () => {
  it("only points to registered tools and produces valid target input", () => {
    for (const source of SPARTAN_AI_TOOLS) {
      for (const connection of getSpartanAiToolConnections(source.id)) {
        const target = getSpartanAiTool(connection.to);
        expect(target).toBeDefined();
        const input = buildConnectedToolInput(source.id, connection.to, {
          summary: "Reviewed result",
          citations: [],
        });
        expect(target!.inputSchema.safeParse(input).success).toBe(true);
      }
    }
  });

  it("exposes connected workflows in all four operating clusters", () => {
    expect(getSpartanAiToolConnections("content-generator")).not.toHaveLength(
      0,
    );
    expect(
      getSpartanAiToolConnections("development-plan-generator"),
    ).not.toHaveLength(0);
    expect(
      getSpartanAiToolConnections("territory-account-discovery"),
    ).not.toHaveLength(0);
    expect(
      getSpartanAiToolConnections("medical-record-lcd-verifier"),
    ).not.toHaveLength(0);
  });
});
