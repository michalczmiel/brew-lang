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
    comment(hash, content) {
      return null;
    },
    method(keyword, space, content, newline) {
      return null;
    },
    dose(keyword, space, number, newline) {
      return null;
    },
    temperature(keyword, space, value, newline) {
      return null;
    },
    step(keyword, newline1, instructions, end, newline2) {
      return null;
    },
    instruction(spaces, content, terminator) {
      return null;
    },
    time_instruction(keyword, space, duration) {
      return null;
    },
    pour(keyword, space, number) {
      return null;
    },
    range(start, dot1, dot2, end) {
      return null;
    },
    duration_number(minutes, colon, seconds) {
      return null;
    },
    whole_number(digits) {
      return parseFloat(this.sourceString);
    },
    real_number(whole, dot, decimal) {
      return parseFloat(this.sourceString);
    },
  });

  return semantics;
}
