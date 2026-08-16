import fs from "node:fs";
import path from "node:path";

describe("web tool session boundary", () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, "../app/tool-web.tsx"),
    "utf8",
  );

  it("rejects untrusted initial hosts and navigation", () => {
    expect(source).toContain("url.origin !== trustedOrigin");
    expect(source).toContain("onShouldStartLoadWithRequest={shouldLoad}");
  });

  it("injects authorization only for same origin requests", () => {
    expect(source).toContain("requested.origin === window.location.origin");
  });
});
