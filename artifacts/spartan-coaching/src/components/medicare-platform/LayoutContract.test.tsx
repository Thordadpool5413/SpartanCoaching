import { describe, expect, test } from "vitest";
import fs from "fs";
import path from "path";

describe("Medicare Intelligence Layout CSS Contract", () => {
  const cssPath = path.resolve(__dirname, "platform-enhancements.css");
  const platformEnhancements = fs.readFileSync(cssPath, "utf8");

  test("align-stats container is styled for scanability", () => {
    // Must contain flex/wrap configuration and clear padding
    expect(platformEnhancements).toContain(".align-stats {");
    expect(platformEnhancements).toContain("flex-wrap: wrap;");
  });

  test("grid components wrap rather than overflowing", () => {
    // Rigid grids should be replaced with auto-fit minmax to prevent horizontal overflow
    expect(platformEnhancements).toContain("repeat(auto-fit, minmax(200px, 1fr))");
    expect(platformEnhancements).toContain("repeat(auto-fit, minmax(240px, 1fr))");
  });
  
  test("main content has min-width 0 to prevent grid blowout", () => {
    // Needed to ensure nested grid/flex children can shrink
    expect(platformEnhancements).toContain(".main { width: 100%; min-width: 0; }");
  });

  test("long evidence labels wrap and wide tables scroll locally", () => {
    expect(platformEnhancements).toContain("overflow-wrap: anywhere;");
    expect(platformEnhancements).toContain(".simple-table, .comparison-table, .map-shell { max-width: 100%; overflow-x: auto; }");
  });

  test("narrow screens collapse shared data grids to one column", () => {
    expect(platformEnhancements).toContain(".grid-2 { grid-template-columns: 1fr; }");
    expect(platformEnhancements).toContain(".table b { text-align: left; }");
  });
});
