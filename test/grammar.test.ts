import { test, expect } from "vitest";

import { grammar } from "../src/grammar.js";
import { glitchCoffeeOrigamiHot } from "../src/recipes.js";

test("correctly parses full valid recipe", () => {
  const match = grammar.match(glitchCoffeeOrigamiHot);

  expect(match.succeeded(), match.message).toBeTruthy();
});

test("temperature without number", () => {
  const match = grammar.match("temperature");

  expect(
    match.message ===
      `Line 1, col 12:\n> 1 | temperature\n                 ^\nExpected " "`,
  );
});

test("correctly parses single line comment", () => {
  const match = grammar.match("# This is a comment");
  expect(match.succeeded(), match.message).toBeTruthy();
});

test("correctly parses comment with recipe elements", () => {
  const recipe = `# Recipe for great coffee
dose 20
temperature 94
# Add hot water
water 300
`;
  const match = grammar.match(recipe);
  expect(match.succeeded(), match.message).toBeTruthy();
});

test("correctly parses comment inside step", () => {
  const recipe = `at 0:00
  # Start the timer
  pour 60
  # Wait a bit
  duration 0:30
end`;
  const match = grammar.match(recipe);
  expect(match.succeeded(), match.message).toBeTruthy();
});

test("correctly parses inline step format", () => {
  const recipe = `at 0:00 pour 60 duration 0:15 end`;
  const match = grammar.match(recipe);
  expect(match.succeeded(), match.message).toBeTruthy();
});

test("correctly parses mixed inline and multiline step", () => {
  const recipe = `at 0:00 pour 60
  duration 0:30
end`;
  const match = grammar.match(recipe);
  expect(match.succeeded(), match.message).toBeTruthy();
});

test.each(["v60", "origami", "french press", "chemex"])(
  "correctly parses different brewing methods",
  (method) => {
    const match = grammar.match(`method ${method}`);
    expect(match.succeeded(), match.message).toBeTruthy();
  },
);
