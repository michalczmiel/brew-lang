import type { Grammar, Semantics } from "ohm-js";

export function newSemantics(grammar: Grammar): Semantics {
  const semantics = grammar.createSemantics();

  semantics.addOperation("checkWater", {
    _iter(...children) {
      const results = children
        .map((c) => c.checkWater())
        .filter((result) => result !== null);
      return results.length > 0 ? results[0] : null;
    },
    number(x) {
      return parseFloat(x.sourceString);
    },
    newline(_) {
      return null;
    },
    water(keyword, space, number, newline) {
      const waterAmount = number.checkWater();
      if (waterAmount === 0) {
        return "Water amount cannot be zero";
      }
      return null;
    },
  });

  return semantics;
}
