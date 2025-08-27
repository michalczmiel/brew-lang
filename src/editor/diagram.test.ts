import { test, expect } from "bun:test";

import grammar from "../core/grammar.ohm-bundle.js";
import { newSemantics, type RecipeAST } from "../core/semantics.js";
import { recipes } from "../recipes.js";
import { generateSVGDiagram } from "./diagram.js";

function getAST(content: string): RecipeAST {
  const semantics = newSemantics(grammar);
  const match = grammar.match(content);

  return semantics(match).toAST();
}

test.each(Object.entries(recipes))(
  "generateSVGDiagram with %s",
  async (recipe, content) => {
    const ast = getAST(content);

    const svg = generateSVGDiagram(ast);
    await Bun.write(`testdata/${recipe}.svg`, svg);

    expect(svg).toMatchSnapshot(recipe);
  },
);
