import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(resolve(process.cwd(), "src/routes/medicareIntelligenceRoutes.ts"), "utf8");
const app = readFileSync(resolve(process.cwd(), "src/app.ts"), "utf8");

describe("Medicare Intelligence route bridge", () => {
  it("mounts the engine behind Elite authentication", () => {
    expect(app).toContain("registerMedicareIntelligenceRoutes(app)");
    expect(route).toContain('app.use("/api/v1/medicare", requireElite');
  });

  it("maps platform paths and scopes private data to organization and member", () => {
    expect(route).toContain('path: `/api${request.path');
    expect(route).toContain('`${member.organizationId}:${request.clientMemberId}`');
  });

  it("forwards rejected runtime work to the Express error boundary", () => {
    expect(route).toContain("catch (error)");
    expect(route).toContain("next(error)");
  });
});
