import { test, expect } from "bun:test";

import { grammar } from "../src/grammar.js";
import { newSemantics, type SemanticError } from "../src/semantics.js";

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
  [
    "dose 15\nat 0:00\n  pour 100\nend\nat 1:00\n  pour 100\nend",
    { ratio: "1:13.3", water: 200 },
  ],
  [
    "dose 16.5\nat 0:00\n  pour 150\nend\nat 1:00\n  pour 180\nend",
    { ratio: "1:20.0", water: 330 },
  ],
  [
    "dose 20\nat 0:00\n  pour 60\nend\nat 0:30\n  pour 60\nend\nat 1:15\n  pour 140\nend",
    { ratio: "1:13.0", water: 260 },
  ],
  ["dose 16.5", { ratio: "Missing water to calculate", water: 0 }],
  [
    "at 0:00\n  pour 100\nend",
    { ratio: "Missing dose to calculate", water: 100 },
  ],
  ["", { ratio: "Missing dose and water to calculate", water: 0 }],
])("calculate coffee ratio and water from pour amounts", (recipe, expected) => {
  const semantics = newSemantics(grammar);
  const match = grammar.match(recipe);

  const result = semantics(match).calculateRatio();

  expect(result).toEqual(expected);
});
