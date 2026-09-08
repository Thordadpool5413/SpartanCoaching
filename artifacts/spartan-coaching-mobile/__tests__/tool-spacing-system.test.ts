import fs from "fs";
import path from "path";

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");
}

describe("shared tool spacing system", () => {
  test("gives tool headings and guidance room to breathe", () => {
    const source = read("../components/tools/ToolShell.tsx");
    expect(source).toContain("paddingTop: 22");
    expect(source).toContain("marginTop: 20");
    expect(source).toContain("marginBottom: 16");
    expect(source).toContain("borderRadius: 16");
  });

  test("uses generous spacing inside field ready results", () => {
    const source = read("../components/FieldResultPanel.tsx");
    expect(source).toContain("resultBody: { paddingHorizontal: 22, paddingVertical: 26, gap: 20 }");
    expect(source).toContain("paragraph: { fontSize: 15, lineHeight: 25 }");
    expect(source).toContain("paddingHorizontal: 16");
    expect(source).toContain("paddingVertical: 17");
  });

  test("separates supporting tool sections", () => {
    const source = read("../components/ToolAnatomy.tsx");
    expect(source).toContain("block: { marginTop: 24 }");
    expect(source).toContain("padding: 16");
  });
});
