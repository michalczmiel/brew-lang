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
      const sourceString = x.sourceString;

      if (
        sourceString.length > 1 &&
        sourceString.startsWith("0") &&
        !sourceString.startsWith("0.")
      ) {
        return [
          {
            message: "Number cannot start with zero",
            formatted: this.source.getLineAndColumnMessage(),
          },
        ];
      }

      const value = parseFloat(sourceString);
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
    swirl(_keyword) {
      return [];
    },
    stir(_keyword) {
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

  semantics.addOperation("calculateRatio", {
    recipe(lines) {
      let dose: number | null = null;
      let totalWater = 0;

      function collectPours(node: { ctorName?: string; children?: any }): void {
        if (node.ctorName === "pour" && node.children?.[2]) {
          const pourAmount = node.children[2].calculateRatio();
          if (typeof pourAmount === "number") {
            totalWater += pourAmount;
          }
        }

        if (node.children) {
          for (const child of node.children) {
            collectPours(child);
          }
        }
      }

      for (const line of lines.children) {
        if (line.ctorName !== "line") {
          continue;
        }

        const keyword = line.children[0];
        if (keyword?.ctorName === "dose" && keyword.children[2]) {
          dose = keyword.children[2].calculateRatio();
        } else if (keyword?.ctorName === "step") {
          collectPours(keyword);
        }
      }

      if (!dose && !totalWater) {
        return {
          ratio: "Missing dose and water to calculate",
          water: 0,
        };
      }

      if (dose && !totalWater) {
        return {
          ratio: "Missing water to calculate",
          water: 0,
        };
      }

      if (!dose || dose === 0) {
        return {
          ratio: "Missing dose to calculate",
          water: totalWater,
        };
      }

      const ratio = totalWater / dose;
      return {
        ratio: `1:${ratio.toFixed(1)}`,
        water: totalWater,
      };
    },
    _iter(...children) {
      return (
        children.map((c) => c.calculateRatio()).find((r) => r !== null) || null
      );
    },
    number(x) {
      return parseFloat(x.sourceString);
    },
    line(keyword, _space, _comment, _newline) {
      return keyword.calculateRatio();
    },
    newline(_) {
      return null;
    },
    comment(_hash, _content) {
      return null;
    },
    brewer(_keyword, _space, _content) {
      return null;
    },
    dose(_keyword, _space, number) {
      return number.calculateRatio();
    },
    temperature(_keyword, _space, _rangeOrNumbers) {
      return null;
    },
    step(
      _keyword,
      _space,
      _duration,
      _spaces,
      _comment,
      _newline,
      _instructions,
      _end,
    ) {
      return null;
    },
    instruction(_spaces, _content, _terminator) {
      return null;
    },
    duration(_keyword, _space, _duration) {
      return null;
    },
    pour(_keyword, _space, _number) {
      return null;
    },
    swirl(_keyword) {
      return null;
    },
    stir(_keyword) {
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
