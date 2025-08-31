import { test, expect } from "bun:test";

import grammar from "./grammar.ohm-bundle.js";
import {
  newSemantics,
  type SemanticError,
  calculateRatioFromAST,
} from "./semantics.js";
import { recipes } from "../recipes.js";

test.each([
  ["dose 0", "Dose amount cannot be zero"],
  ["dose 090", "Number cannot start with zero"],
])("validate dose", (input, expectedMessage) => {
  const semantics = newSemantics(grammar);
  const match = grammar.match(input);

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe(expectedMessage);
});

test("pour amount cannot be zero", () => {
  const semantics = newSemantics(grammar);
  const match = grammar.match("at 0:00\n  pour 0\nend");

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe("Pour amount cannot be zero");
});

test.each([
  ["temperature 0", "Temperature amount cannot be zero"],
  [
    "temperature 100..50",
    "Range cannot have lower bound greater than upper bound",
  ],
  [
    "temperature 100..100",
    "Range cannot have lower bound equal to upper bound",
  ],
  ["temperature 090", "Number cannot start with zero"],
])("validate temperature", (input, expectedMessage) => {
  const semantics = newSemantics(grammar);
  const match = grammar.match(input);

  const result: SemanticError[] = semantics(match).validate();

  expect(result).toHaveLength(1);
  expect(result[0]?.message).toBe(expectedMessage);
});

test.each([
  ["dose 15\ndose 20", "Recipe cannot have multiple dose definitions"],
  [
    "brewer origami\nbrewer origami dripper",
    "Recipe cannot have multiple brewer definitions",
  ],
  [
    "filter paper\nfilter metal",
    "Recipe cannot have multiple filter definitions",
  ],
])("recipe cannot have multiple definitions", (recipe, message) => {
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

  const ast = semantics(match).toAST();
  const result = calculateRatioFromAST(ast);

  expect(result).toEqual(expected);
});

test("complex recipe with multiple steps converts to AST", () => {
  const semantics = newSemantics(grammar);

  const match = grammar.match(recipes.jamesHoffmannAeropress);
  const result = semantics(match).toAST();

  expect(result).toMatchInlineSnapshot(`
    {
      "brewer": "aeropress",
      "comments": [
        {
          "text": "James Hoffmann Ultimate AeroPress",
          "type": "comment",
        },
      ],
      "dose": 11,
      "filter": "paper",
      "steps": [
        {
          "comments": [
            {
              "text": "don't rinse paper",
              "type": "comment",
            },
            {
              "text": "after pouring, place the plunger on top",
              "type": "comment",
            },
          ],
          "instructions": [
            {
              "type": "pour",
              "value": 200,
            },
          ],
          "time": {
            "minutes": 0,
            "seconds": 0,
          },
          "type": "step",
        },
        {
          "comments": [],
          "instructions": [
            {
              "type": "swirl",
            },
          ],
          "time": {
            "minutes": 2,
            "seconds": 0,
          },
          "type": "step",
        },
        {
          "comments": [
            {
              "text": "press",
              "type": "comment",
            },
          ],
          "instructions": [],
          "time": {
            "minutes": 2,
            "seconds": 30,
          },
          "type": "step",
        },
      ],
      "temperature": {
        "max": 99,
        "min": 85,
      },
      "type": "recipe",
    }
  `);
});

test("complex recipe with temperature inside step to AST", () => {
  const semantics = newSemantics(grammar);

  const match = grammar.match(recipes.tetsuKasuyaHybridMethod);
  const result = semantics(match).toAST();

  expect(result).toMatchInlineSnapshot(`
    {
      "brewer": "hario switch",
      "comments": [
        {
          "text": "Tetsu Kasuya Hybrid method",
          "type": "comment",
        },
      ],
      "dose": 20,
      "filter": "paper",
      "steps": [
        {
          "comments": [
            {
              "text": "open switch",
              "type": "comment",
            },
          ],
          "instructions": [
            {
              "type": "pour",
              "value": 60,
            },
          ],
          "temperature": 90,
          "time": {
            "minutes": 0,
            "seconds": 0,
          },
          "type": "step",
        },
        {
          "comments": [],
          "instructions": [
            {
              "type": "pour",
              "value": 60,
            },
          ],
          "temperature": 90,
          "time": {
            "minutes": 0,
            "seconds": 30,
          },
          "type": "step",
        },
        {
          "comments": [
            {
              "text": "close switch",
              "type": "comment",
            },
          ],
          "instructions": [
            {
              "type": "pour",
              "value": 160,
            },
          ],
          "temperature": 70,
          "time": {
            "minutes": 1,
            "seconds": 15,
          },
          "type": "step",
        },
        {
          "comments": [
            {
              "text": "open switch",
              "type": "comment",
            },
          ],
          "instructions": [],
          "time": {
            "minutes": 1,
            "seconds": 45,
          },
          "type": "step",
        },
      ],
      "type": "recipe",
    }
  `);
});
