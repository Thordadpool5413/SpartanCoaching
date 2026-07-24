import { test, expect } from "vitest";
import { searchSpartanKnowledge, formatCitationsForPrompt } from "./spartanCorpus.ts";

test("search finds method content for discipline empathy strategy", () => {
  const hits = searchSpartanKnowledge("discipline empathy strategy method", 3);
  expect(hits.length >= 1).toBe(true);
  expect(hits.some((h) => h.id === "method-des" || h.category === "method")).toBe(true);
});

test("search finds objection not ready guidance", () => {
  const hits = searchSpartanKnowledge("family not ready for hospice", 3);
  expect(hits.length >= 1).toBe(true);
  expect(hits[0].category === "objection" || hits.some((h) => h.id.includes("not-ready"))).toBe(true);
});

test("formatCitationsForPrompt includes source labels", () => {
  const hits = searchSpartanKnowledge("phi hipaa", 2);
  const text = formatCitationsForPrompt(hits);
  expect(text).toMatch(/Spartan source/);
});

test("empty-ish queries return empty or low noise", () => {
  const hits = searchSpartanKnowledge("zz", 5);
  expect(hits.length).toBe(0);
});
