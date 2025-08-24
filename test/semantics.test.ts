import { test, expect } from "bun:test";

import { grammar } from "../src/grammar.js";
import { newSemantics, type SemanticError } from "../src/semantics.js";

test("water amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("water 0");

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe("Water amount cannot be zero");
});

test("dose amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("dose 0");

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe("Dose amount cannot be zero");
});

test("pour amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("at 0:00\n  pour 0\nend");

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe("Pour amount cannot be zero");
});

test("temperature amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("temperature 0");

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe("Temperature amount cannot be zero");
});

test("temperature range cannot have lower bound greater than upper bound", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("temperature 100..50");

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe(
    "Range cannot have lower bound greater than upper bound",
  );
});

test("temperature range cannot have lower bound equal to upper bound", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("temperature 100..100");

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe(
    "Range cannot have lower bound equal to upper bound",
  );
});

test.each([
  ["dose 15\ndose 20", "Recipe cannot have multiple dose definitions"],
  ["water 200\nwater 250", "Recipe cannot have multiple water definitions"],
  [
    "brewer origami\nbrewer origami dripper",
    "Recipe cannot have multiple brewer definitions",
  ],
])("recipe cannot have multiple dose definitions", (recipe, message) => {
  const semantics = newSemantics(grammar);
  const match = grammar.match(recipe);

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe(message);
});

test.each([
  ["dose 15\nwater 200", "1:13.3"],
  ["water 200\ndose 15", "1:13.3"],
  ["dose 16.5\nwater 330", "1:20.0"],
  ["dose 16.5", null],
  ["water 260", null],
  ["", null],
])("calculate coffee ratio", (recipe, expectedRatio) => {
  const semantics = newSemantics(grammar);
  const match = grammar.match(recipe);

  const ratio = semantics(match).calculateRatio();

  expect(ratio).toEqual(expectedRatio);
});
