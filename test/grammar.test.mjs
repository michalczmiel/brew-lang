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

test("correctly parses single line comment", () => {
  const match = grammar.match("# This is a comment");
  assert.ok(match.succeeded(), match.message);
});

test("correctly parses comment with recipe elements", () => {
  const recipe = `# Recipe for great coffee
dose 20
temperature 94
# Add hot water
water 300
`;
  const match = grammar.match(recipe);
  assert.ok(match.succeeded(), match.message);
});

test("correctly parses comment inside step", () => {
  const recipe = `step {
  # Start the timer
  start 0:00
  pour 60
  # Wait a bit
  duration 0:30
}`;
  const match = grammar.match(recipe);
  assert.ok(match.succeeded(), match.message);
});

test(
  "correctly parses different brewing methods",
  { concurrency: true },
  (t) => {
    const methods = ["v60", "origami", "french press", "chemex"];
    for (const method of methods) {
      t.test(`method ${method}`, () => {
        const match = grammar.match(`method ${method}`);
        assert.ok(match.succeeded(), match.message);
      });
    }
  },
);
