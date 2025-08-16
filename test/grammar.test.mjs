import assert from "node:assert/strict";
import { test } from "node:test";

import { grammar } from "../src/grammar.mjs";
import { glitchCoffeeOrigamiHot } from "../src/recipes.mjs";

test("correctly parses full valid recipe", async () => {
  const match = grammar.match(glitchCoffeeOrigamiHot);

  if (!match.succeeded()) {
    assert.fail(match.message);
  }
});

test("temperature without number", () => {
  const match = grammar.match("temperature");

  assert.equal(
    match.message,
    `Line 1, col 12:\n> 1 | temperature\n                 ^\nExpected " "`,
  );
});
