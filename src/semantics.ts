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
    water(_keyword, _space, number, _newline) {
      const waterAmount = number.validate();
      if (waterAmount === 0) {
        return "Water amount cannot be zero";
      }
      return null;
    },
    comment(_hash, _content) {
      return null;
    },
    method(_keyword, _space, _content, _newline) {
      return null;
    },
    dose(_keyword, _space, number, _newline) {
      const doseAmount = number.validate();
      if (doseAmount === 0) {
        return "Dose amount cannot be zero";
      }
      return null;
    },
    temperature(_keyword, _space, number, _newline) {
      const temperatureAmount = number.validate();
      if (temperatureAmount === 0) {
        return "Temperature amount cannot be zero";
      }
      return null;
    },
    step(
      _keyword,
      _space,
      _duration,
      _newline1,
      instructions,
      _end,
      _newline2,
    ) {
      return instructions.validate();
    },
    instruction(_spaces, content, _terminator) {
      return content.validate();
    },
    time_instruction(_keyword, _space, _duration) {
      return null;
    },
    pour(_keyword, _space, number) {
      const pourAmount = number.validate();
      if (pourAmount === 0) {
        return "Pour amount cannot be zero";
      }
      return null;
    },
    range(_start, _dot1, _dot2, _end) {
      return null;
    },
    duration_number(_minutes, _colon, _seconds) {
      return null;
    },
    whole_number(_digits) {
      return parseFloat(this.sourceString);
    },
    real_number(_whole, _dot, _decimal) {
      return parseFloat(this.sourceString);
    },
  });

  return semantics;
}
