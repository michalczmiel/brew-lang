import { test, expect, describe } from "bun:test";

import grammar from "./grammar.ohm-bundle.js";
import { recipes } from "../recipes.js";

function assertValidGrammar(text: string): void {
  const match = grammar.match(text);

  expect(match.succeeded(), match.message).toBeTruthy();
}

function assertInvalidGrammar(text: string): void {
  const match = grammar.match(text);

  expect(match.succeeded(), match.message).toBeFalsy();
}

test.each(Object.values(recipes))(
  "correctly parses full valid recipe",
  (recipe) => {
    assertValidGrammar(recipe);
  },
);

describe("temperature keyword", () => {
  test.each(["temperature 23", "temperature 94", "temperature 100"])(
    "correctly parses temperature",
    (temperature) => {
      assertValidGrammar(temperature);
    },
  );

  test.each(["temperature", "temperature "])(
    "throws error for invalid temperature",
    (temperature) => {
      assertInvalidGrammar(temperature);
    },
  );
});

describe("comments", () => {
  test("correctly parses single line comment", () => {
    assertValidGrammar("-- This is a comment");
  });

  test("correctly parses comment with recipe elements", () => {
    const recipe = `-- Recipe for great coffee
dose 20
temperature 94
-- Add hot water
at 0:00
  pour 300
end
`;
    assertValidGrammar(recipe);
  });

  test("correctly parses comment inside step", () => {
    const recipe = `at 0:00
  -- Start the timer
  pour 60
  -- Wait a bit
end`;
    assertValidGrammar(recipe);
  });
});

test("correctly parses inline step format", () => {
  assertValidGrammar(`at 0:00 pour 60 end`);
});

test("correctly parses mixed inline and multiline step", () => {
  assertValidGrammar(`at 0:00 pour 60\nend`);
});

test.each(["v60", "origami", "french press", "chemex", "custom"])(
  "correctly parses different brewing methods",
  (method) => {
    assertValidGrammar(`brewer ${method}`);
  },
);

test.each([
  "paper",
  "metal",
  "v60 paper",
  "karita wave",
  "metal mesh",
  "custom",
])("correctly parses different filter types", (filterType) => {
  assertValidGrammar(`filter ${filterType}`);
});

test.each([
  "temperature 90..100 -- depends on roast level",
  "at 0:00 -- Start the timer\nend",
])("allows for inline comment", (statement) => {
  assertValidGrammar(statement);
});

test("correctly parses swirl instruction", () => {
  const recipe = `at 0:00
  swirl
end`;
  assertValidGrammar(recipe);
});

test("correctly parses stir instruction", () => {
  const recipe = `at 0:00 stir end`;
  assertValidGrammar(recipe);
});

test("correctly parses recipe with swirl and stir", () => {
  const recipe = `dose 20
at 0:00
  pour 60
  swirl
  stir
  pour 100
end`;
  assertValidGrammar(recipe);
});

test("correctly parses recipe with more whitespace", () => {
  assertValidGrammar(`dose     20\ntemperature       95\nbrewer    v60`);
});

test("correctly parses step with time range format", () => {
  assertValidGrammar(`at 0:30..1:00
  pour 100
end`);
});

test("correctly parses step with time range inline format", () => {
  assertValidGrammar(`at 0:30..1:00 pour 100 end`);
});

test("correctly parses multiple steps with mixed time formats", () => {
  const recipe = `at 0:00
  pour 50
end

at 1:00..1:30
  pour 100
end`;

  assertValidGrammar(recipe);
});

test("correctly parses steps with more new line", () => {
  const recipe = `at 0:00\n\npour 50\n\nend`;

  assertValidGrammar(recipe);
});

test("correctly parses time range with comments", () => {
  const recipe = `at 0:30..1:00 -- slow pour
  pour 150
end`;
  assertValidGrammar(recipe);
});
