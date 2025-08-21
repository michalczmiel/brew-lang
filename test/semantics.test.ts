import { test, expect } from "bun:test";

import { grammar } from "../src/grammar.js";
import { newSemantics } from "../src/semantics.js";

test("water amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("water 0");

  const result = semantics(match).validate();

  expect(result).toBe("Water amount cannot be zero");
});

test("dose amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("dose 0");

  const result = semantics(match).validate();

  expect(result).toBe("Dose amount cannot be zero");
});

test("pour amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("at 0:00\n  pour 0\nend");

  const result = semantics(match).validate();

  expect(result).toBe("Pour amount cannot be zero");
});

test("temperature amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("temperature 0");

  const result = semantics(match).validate();

  expect(result).toBe("Temperature amount cannot be zero");
});

test("temperature range cannot have lower bound greater than upper bound", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("temperature 100..50");

  const result = semantics(match).validate();

  expect(result).toBe("Range cannot have lower bound greater than upper bound");
});

test("temperature range cannot have lower bound equal to upper bound", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("temperature 100..100");

  const result = semantics(match).validate();

  expect(result).toBe("Range cannot have lower bound equal to upper bound");
});
