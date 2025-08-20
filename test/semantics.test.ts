import { test, expect } from "vitest";

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
