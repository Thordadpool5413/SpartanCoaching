import fs from "node:fs";
import path from "node:path";

/**
 * Ensures Phase 5 harden artifacts stay in the repo (craft program).
 * Does not claim TestFlight was run.
 */
describe("craft Phase 5 operator pack", () => {
  const storeDir = path.join(__dirname, "..", "store");
  const craftDir = path.join(__dirname, "..", "..", "..", "docs", "product-craft");

  it("includes TestFlight feel checklist and smoke", () => {
    expect(fs.existsSync(path.join(storeDir, "testflight-feel-checklist.md"))).toBe(true);
    expect(fs.existsSync(path.join(storeDir, "testflight-smoke.md"))).toBe(true);
    expect(fs.existsSync(path.join(storeDir, "screenshot-shot-list.md"))).toBe(true);
  });

  it("includes day-in-the-life script and DoD", () => {
    expect(fs.existsSync(path.join(craftDir, "15-day-in-the-life-script.md"))).toBe(true);
    expect(fs.existsSync(path.join(craftDir, "14-phase5-harden-pack.md"))).toBe(true);
    expect(fs.existsSync(path.join(craftDir, "07-premium-definition-of-done.md"))).toBe(true);
  });

  it("feel checklist covers mission purity and paywall", () => {
    const feel = fs.readFileSync(path.join(storeDir, "testflight-feel-checklist.md"), "utf8");
    expect(feel).toMatch(/Immediate clarity/i);
    expect(feel).toMatch(/My Work/i);
    expect(feel).toMatch(/Paywall/i);
    expect(feel).toMatch(/Value receipt/i);
    expect(feel).toMatch(/same seat/i);
  });

  it("shot list matches the current five destination product and rejects mockups", () => {
    const shots = fs.readFileSync(path.join(storeDir, "screenshot-shot-list.md"), "utf8");
    expect(shots).toMatch(/01-home-next-move\.png/);
    expect(shots).toMatch(/02-private-spartan-coach\.png/);
    expect(shots).toMatch(/03-explore\.png/);
    expect(shots).toMatch(/04-my-work\.png/);
    expect(shots).toMatch(/05-library\.png/);
    expect(shots).toMatch(/Home, Coach, Explore, My Work, and Account/i);
    expect(shots).toMatch(/Never upload legacy generated mockups/i);
    expect(shots).toMatch(/Do not generate, redraw, or compose product UI screenshots/i);
  });
});
