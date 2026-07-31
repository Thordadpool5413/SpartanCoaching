import { readFileSync, writeFileSync } from "node:fs";

const s = readFileSync(
  new URL("../src/routes/aiToolRoutes.ts", import.meta.url),
  "utf8",
);
const dataUrlCount = (s.match(/data:application\/pdf;base64/g) || []).length;
const placeholderCount = (s.match(/PDF attachment removed/g) || []).length;
const report = [
  `dataUrlCount=${dataUrlCount}`,
  `placeholderCount=${placeholderCount}`,
  `includesAppPdf=${s.includes("application/pdf;base64")}`,
].join("\n");
writeFileSync(new URL("./.pdf-check.txt", import.meta.url), `${report}\n`);
console.log(report);
