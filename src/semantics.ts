import type { Grammar, Semantics } from "ohm-js";

export interface SemanticError {
  message: string;
  formatted: string;
}

export function newSemantics(grammar: Grammar): Semantics {
  const semantics = grammar.createSemantics();

  semantics.addOperation("validate", {
    recipe(lines) {
      const errors = lines.validate().flat();

      function checkDuplicates(type: string, message: string) {
        const typeLines = lines.children.filter(
          (child) =>
            child.ctorName === "line" && child.children[0]?.ctorName === type,
        );

        if (typeLines.length > 1) {
          typeLines.slice(1).forEach((duplicateLine) => {
            errors.push({
              message,
              formatted: duplicateLine.source.getLineAndColumnMessage(),
            });
          });
        }
      }

      checkDuplicates("dose", "Recipe cannot have multiple dose definitions");
      checkDuplicates("water", "Recipe cannot have multiple water definitions");
      checkDuplicates(
        "brewer",
        "Recipe cannot have multiple brewer definitions",
      );

      return errors;
    },
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
            formatted: this.source.getLineAndColumnMessage(),
          },
        ];
      }
      return value;
    },
    line(keyword, _space, _comment, _newline) {
      return keyword.validate();
    },
    newline(_) {
      return [];
    },
    water(_keyword, _space, number) {
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
    brewer(_keyword, _space, _content) {
      return [];
    },
    dose(_keyword, _space, number) {
      const result = number.validate();
      if (Array.isArray(result)) {
        return result.map((error) => ({
          ...error,
          message: error.message.replace("Amount", "Dose amount"),
        }));
      }
      return [];
    },
    temperature(_keyword, _space, rangeOrNumbers) {
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
      _spaces,
      _comment,
      _newline,
      instructions,
      _end,
    ) {
      return instructions.validate();
    },
    instruction(_spaces, content, _terminator) {
      return content.validate();
    },
    duration(_keyword, _space, _duration) {
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
            formatted: this.source.getLineAndColumnMessage(),
          });
        }

        if (startResult === endResult) {
          errors.push({
            message: "Range cannot have lower bound equal to upper bound",
            formatted: this.source.getLineAndColumnMessage(),
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
