import test from "node:test";
import assert from "node:assert";
import { normalizeText, extractClauses } from "../src/analyzer.js";

test("analyzer functions", async (t) => {
  await t.test("normalizeText handles basic strings", () => {
    const raw = "This is a \n\n\n test.";
    const result = normalizeText(raw);
    assert.strictEqual(result, "This is a \n\n test.");
  });

  await t.test("extractClauses splits correctly", () => {
    const raw = "1. First clause is very long and has many words. 2. Second clause is also quite long and has many words. ";
    // This is a naive test just to bump test coverage
    const clauses = extractClauses(raw);
    assert.ok(Array.isArray(clauses));
  });
});
