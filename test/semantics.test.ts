import { test, expect } from "vitest";

import { grammar } from "../src/grammar.js";
import { newSemantics } from "../src/semantics.js";

test("water amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("water 0");

  const result = semantics(match).checkWater();

  expect(result).toBe("Water amount cannot be zero");
});
