const fs = require("node:fs");
const path = require("node:path");

describe("api timeout regression", () => {
  it("uses a fast default timeout and avoids automatic retries on screen loads", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../lib/api.ts"), "utf8");

    expect(source).toContain("const DEFAULT_TIMEOUT_MS = 12_000;");
    expect(source).toContain("retry: options?.retry ?? false");
  });
});
