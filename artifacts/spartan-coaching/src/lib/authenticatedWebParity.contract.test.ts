import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FIELD_KIT_TOOLS } from "@workspace/field-kit-catalog";
import { SPARTAN_AI_TOOLS } from "@workspace/spartan-ai-tools";
import { allSearchablePages } from "@/lib/navigation";

const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("authenticated website capability parity", () => {
  it("registers a working web destination for every shared field tool", () => {
    for (const tool of FIELD_KIT_TOOLS) {
      expect(tool.path.startsWith("/"), `${tool.id} needs a web path`).toBe(true);
      expect(
        app.includes(`path="${tool.path}"`) || tool.public === true,
        `${tool.id} is in the shared catalog but is not routed on web`,
      ).toBe(true);
    }
  });

  it("serves every advanced tool through the authenticated dynamic workspace", () => {
    expect(app).toContain('<Route path="/tools/ai/:toolId" component={GatedAiTool} />');
    for (const tool of SPARTAN_AI_TOOLS) {
      expect(tool.webPath).toBe(`/tools/ai/${tool.id}`);
    }
  });

  it("keeps the complete member system discoverable from workspace search", () => {
    const paths = new Set(allSearchablePages.map((item) => item.path));
    for (const path of [
      "/portal",
      "/tools/sales-workflow",
      "/tools/intelligence",
      "/tools/ai",
      "/resources",
      "/portal/learn",
      "/portal/coach",
      "/my-work",
      "/account",
    ]) {
      expect(paths.has(path), `${path} is missing from workspace search`).toBe(true);
    }
  });
});
