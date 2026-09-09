import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ignore = await readFile(new URL("../.replitignore", import.meta.url), "utf8");

assert.match(ignore, /^attached_assets\/$/m, "historical uploads must stay out of Replit deploys");
assert.match(ignore, /^\/SpartanCoaching-\*\.mp4$/m, "superseded root videos must stay out of Replit deploys");
assert.doesNotMatch(
  ignore,
  /^artifacts\/spartan-coaching\/public\/$/m,
  "website runtime media must remain deployable",
);
assert.doesNotMatch(
  ignore,
  /^artifacts\/spartan-coaching-mobile\/assets\/$/m,
  "iOS runtime media must remain available to EAS",
);

console.log("Replit deployment context contract passed");
