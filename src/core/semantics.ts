import type { Grammar, Semantics } from "ohm-js";

export interface SemanticError {
  message: string;
  formatted: string;
}

export interface Duration {
  minutes: number;
  seconds: number;
}

export interface TemperatureRange {
  min: number;
  max: number;
}

export interface CommentAST {
  type: "comment";
  text: string;
}

export interface InstructionAST {
  type: "pour" | "duration" | "swirl" | "stir";
  value?: number | Duration | TemperatureRange;
}

export interface StepAST {
  type: "step";
  time: Duration;
  instructions: InstructionAST[];
  temperature?: TemperatureRange | number;
  comments: CommentAST[];
}

export interface RecipeAST {
  type: "recipe";
  title?: string;
  brewer?: string;
  filter?: string;
  dose?: number;
  temperature?: TemperatureRange | number;
  steps: StepAST[];
  comments: CommentAST[];
}

export interface RatioResult {
  ratio: string;
  water: number;
}

export function calculateRatioFromAST(ast: RecipeAST): RatioResult {
  const dose = ast.dose;

  const totalWater = ast.steps.reduce((sum, step) => {
    return (
      sum +
      step.instructions.reduce((stepSum, instruction) => {
        return instruction.type === "pour" &&
          typeof instruction.value === "number"
          ? stepSum + instruction.value
          : stepSum;
      }, 0)
    );
  }, 0);

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

      checkDuplicates("title", "Recipe cannot have multiple titles");
      checkDuplicates("dose", "Recipe cannot have multiple dose definitions");
      checkDuplicates(
        "brewer",
        "Recipe cannot have multiple brewer definitions",
      );
      checkDuplicates(
        "filter",
        "Recipe cannot have multiple filter definitions",
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
    comment(_dash1, _dash2, _content) {
      return [];
    },
    title(_keyword, _space, _content) {
      return [];
    },
    brewer(_keyword, _space, _content) {
      return [];
    },
    filter(_keyword, _space, _content) {
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

  semantics.addOperation("toAST", {
    recipe(lines): RecipeAST {
      const ast: RecipeAST = {
        type: "recipe",
        steps: [],
        comments: [],
      };

      for (const line of lines.children) {
        if (line.ctorName === "line") {
          const keyword = line.children[0];
          if (!keyword) continue;

          const result = keyword.toAST();
          if (result?.type === "title") {
            ast.title = result.value;
          } else if (result?.type === "brewer") {
            ast.brewer = result.value;
          } else if (result?.type === "filter") {
            ast.filter = result.value;
          } else if (result?.type === "dose") {
            ast.dose = result.value;
          } else if (result?.type === "temperature") {
            ast.temperature = result.value;
          } else if (result?.type === "step") {
            ast.steps.push(result);
          }
        } else if (line.ctorName === "comment") {
          const commentResult = line.toAST();
          if (commentResult) {
            ast.comments.push(commentResult);
          }
        }
      }

      return ast;
    },
    _iter(...children) {
      return children.map((c) => c.toAST()).filter(Boolean);
    },
    line(keyword, _space, _comment, _newline) {
      return keyword.toAST();
    },
    title(_keyword, _space, content) {
      return {
        type: "title",
        value: content.sourceString.trim(),
      };
    },
    brewer(_keyword, _space, content) {
      return {
        type: "brewer",
        value: content.sourceString.trim(),
      };
    },
    filter(_keyword, _space, content) {
      return {
        type: "filter",
        value: content.sourceString.trim(),
      };
    },
    dose(_keyword, _space, number) {
      return {
        type: "dose",
        value: number.toAST(),
      };
    },
    temperature(_keyword, _space, rangeOrNumbers) {
      const values = rangeOrNumbers.toAST();
      return {
        type: "temperature",
        value: Array.isArray(values) ? values[0] : values,
      };
    },
    step(
      _keyword,
      _space,
      duration,
      _spaces,
      comment,
      _newline,
      instructions,
      _end,
    ): StepAST {
      const comments: CommentAST[] = [];

      if (comment.sourceString) {
        // comment is an _iter that may contain a comment node
        const commentResults = comment.toAST();
        if (Array.isArray(commentResults) && commentResults.length > 0) {
          const commentAST = commentResults[0];
          if (commentAST && commentAST.type === "comment") {
            comments.push(commentAST);
          }
        }
      }

      let temperature: number | undefined;
      const instructionAstList = [];

      for (const instruction of instructions.toAST()) {
        if (instruction.type === "temperature") {
          temperature = instruction.value;
        } else if (instruction.type === "comment") {
          comments.push(instruction);
        } else {
          instructionAstList.push(instruction);
        }
      }

      return {
        type: "step",
        time: duration.toAST(),
        comments,
        instructions: instructionAstList,
        ...(temperature && { temperature }),
      };
    },
    instruction(_spaces, content, _terminator) {
      return content.toAST();
    },
    duration(_keyword, _space, duration): InstructionAST {
      return {
        type: "duration",
        value: duration.toAST(),
      };
    },
    pour(_keyword, _space, number): InstructionAST {
      return {
        type: "pour",
        value: number.toAST(),
      };
    },
    swirl(_keyword): InstructionAST {
      return {
        type: "swirl",
      };
    },
    stir(_keyword): InstructionAST {
      return {
        type: "stir",
      };
    },
    range(start, _dot1, _dot2, end): TemperatureRange {
      return {
        min: start.toAST(),
        max: end.toAST(),
      };
    },
    duration_number(minutes, _colon, seconds): Duration {
      return {
        minutes: minutes.toAST(),
        seconds: seconds.toAST(),
      };
    },
    number(x) {
      return parseFloat(x.sourceString);
    },
    whole_number(_digits) {
      return parseFloat(this.sourceString);
    },
    real_number(_whole, _dot, _decimal) {
      return parseFloat(this.sourceString);
    },
    newline(_) {
      return null;
    },
    comment(_dash1, _dash2, content): CommentAST {
      return {
        type: "comment",
        text: content.sourceString.trim(),
      };
    },
  });

  return semantics;
}
