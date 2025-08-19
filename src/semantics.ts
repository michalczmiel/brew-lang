import type { Grammar, Semantics } from "ohm-js";

export function newSemantics(grammar: Grammar): Semantics {
  const semantics = grammar.createSemantics();

  semantics.addOperation("validate", {
    _iter(...children) {
      const results = children
        .map((c) => c.validate())
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
      const waterAmount = number.validate();
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
      const doseAmount = number.validate();
      if (doseAmount === 0) {
        return "Dose amount cannot be zero";
      }
      return null;
    },
    temperature(keyword, space, number, newline) {
      const temperatureAmount = number.validate();
      if (temperatureAmount === 0) {
        return "Temperature amount cannot be zero";
      }
      return null;
    },
    step(keyword, newline1, instructions, end, newline2) {
      return instructions.validate();
    },
    instruction(spaces, content, terminator) {
      return content.validate();
    },
    time_instruction(keyword, space, duration) {
      return null;
    },
    pour(keyword, space, number) {
      const pourAmount = number.validate();
      if (pourAmount === 0) {
        return "Pour amount cannot be zero";
      }
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
