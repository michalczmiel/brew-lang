import type { Grammar, Semantics } from "ohm-js";

export interface SemanticError {
  message: string;
  start: number;
  end: number;
}

export function newSemantics(grammar: Grammar): Semantics {
  const semantics = grammar.createSemantics();

  semantics.addOperation("validate", {
    _iter(...children) {
      const results = children
        .map((c) => c.validate())
        .filter((result) => result !== null && result.length > 0);
      return results.flat();
    },
    number(x) {
      const value = parseFloat(x.sourceString);
      if (value === 0) {
        return [
          {
            message: "Amount cannot be zero",
            start: this.source.startIdx,
            end: this.source.endIdx,
          },
        ];
      }
      return value;
    },
    newline(_) {
      return [];
    },
    water(_keyword, _space, number, _newline) {
      const result = number.validate();
      if (Array.isArray(result)) {
        return result.map((error) => ({
          ...error,
          message: error.message.replace("Amount", "Water amount"),
        }));
      }
      return [];
    },
    comment(_hash, _content) {
      return [];
    },
    method(_keyword, _space, _content, _newline) {
      return [];
    },
    dose(_keyword, _space, number, _newline) {
      const result = number.validate();
      if (Array.isArray(result)) {
        return result.map((error) => ({
          ...error,
          message: error.message.replace("Amount", "Dose amount"),
        }));
      }
      return [];
    },
    temperature(_keyword, _space, rangeOrNumbers, _newline) {
      const result = rangeOrNumbers.validate();
      return result.map((error: SemanticError) => ({
        ...error,
        message: error.message.replace("Amount", "Temperature amount"),
      }));
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
      return [];
    },
    pour(_keyword, _space, number) {
      const result = number.validate();
      if (Array.isArray(result)) {
        return result.map((error) => ({
          ...error,
          message: error.message.replace("Amount", "Pour amount"),
        }));
      }
      return [];
    },
    range(start, _dot1, _dot2, end) {
      const startResult = start.validate();
      const endResult = end.validate();
      const errors: SemanticError[] = [];

      if (Array.isArray(startResult)) {
        errors.push(...startResult);
      }
      if (Array.isArray(endResult)) {
        errors.push(...endResult);
      }

      if (!Array.isArray(startResult) && !Array.isArray(endResult)) {
        if (startResult > endResult) {
          errors.push({
            message: "Range cannot have lower bound greater than upper bound",
            start: this.source.startIdx,
            end: this.source.endIdx,
          });
        }

        if (startResult === endResult) {
          errors.push({
            message: "Range cannot have lower bound equal to upper bound",
            start: this.source.startIdx,
            end: this.source.endIdx,
          });
        }
      }

      return errors;
    },
    duration_number(_minutes, _colon, _seconds) {
      return [];
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
