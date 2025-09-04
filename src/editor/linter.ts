import { linter, type Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import type { MatchResult } from "ohm-js";

import grammar from "../core/grammar.ohm-bundle.js";
import { newSemantics, type SemanticError } from "../core/semantics.js";

const semantics = newSemantics(grammar);

function grammarErrorToDiagnostic(match: MatchResult): Diagnostic {
  const interval = match.getInterval();
  const from = interval.startIdx;
  const to = interval.endIdx;

  let message = "Syntax error";

  if (match.message) {
    const shortMessage = match.message.split("\n").at(-1)?.trim();

    if (shortMessage) {
      message = shortMessage;
    }
  }

  return {
    from,
    to,
    severity: "error",
    message,
  };
}

export const brewLinter = linter(
  (view: EditorView): Diagnostic[] => {
    const content = view.state.doc.toString();
    const match: MatchResult = grammar.match(content);

    if (!match.succeeded()) {
      return [grammarErrorToDiagnostic(match)];
    }

    const semanticErrors: SemanticError[] = semantics(match).validate();

    return semanticErrors.map((error) => ({
      from: error.startIdx,
      to: error.endIdx,
      severity: "warning",
      message: error.message,
    }));
  },
  { autoPanel: true },
);
