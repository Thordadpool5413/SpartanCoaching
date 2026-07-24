import assert from "node:assert/strict";
import { test } from "node:test";
import { searchSpartanKnowledge, formatCitationsForPrompt } from "./spartanCorpus.ts";

test("search finds method content for discipline empathy strategy", () => {
  const hits = searchSpartanKnowledge("discipline empathy strategy method", 3);
  assert.ok(hits.length >= 1);
  assert.ok(hits.some((h) => h.id === "method-des" || h.category === "method"));
});

test("search finds objection not ready guidance", () => {
  const hits = searchSpartanKnowledge("family not ready for hospice", 3);
  assert.ok(hits.length >= 1);
  assert.ok(hits[0].category === "objection" || hits.some((h) => h.id.includes("not-ready")));
});

test("formatCitationsForPrompt includes source labels", () => {
  const hits = searchSpartanKnowledge("phi hipaa", 2);
  const text = formatCitationsForPrompt(hits);
  assert.match(text, /Spartan source/);
});

test("empty-ish queries return empty or low noise", () => {
  const hits = searchSpartanKnowledge("zz", 5);
  assert.equal(hits.length, 0);
});
