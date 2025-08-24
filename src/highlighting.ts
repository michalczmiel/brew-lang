import { StreamLanguage } from "@codemirror/language";
import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

export const highlighting = StreamLanguage.define({
  token(stream) {
    // Comments
    if (stream.match(/#.*/)) {
      return "comment";
    }

    // Keywords
    if (stream.match(/\b(brewer|temperature|dose|at|pour|duration|end)\b/)) {
      return "keyword";
    }

    // Numbers
    if (stream.match(/\b\d+(\.\d+)?\b/)) {
      return "number";
    }

    // Skip one character if no match
    stream.next();
    return null;
  },
});

export function shouldPreventAutocomplete(textBeforeCursor: string): boolean {
  // no autocomplete in decimal number
  if (/\d+\.\d*$/.test(textBeforeCursor)) {
    return true;
  }

  // no autocomplete after range operator
  if (/\d+\.\.$/.test(textBeforeCursor)) {
    return true;
  }

  // no autocomplete after duration separator
  if (/\d+:\d*$/.test(textBeforeCursor)) {
    return true;
  }

  // no automcompletion in comments
  if (textBeforeCursor.includes("#")) {
    return true;
  }

  // should not show keyword completions after Keywords that expeect value
  const expectsValueRegex =
    /\b(brewer|temperature|dose|at|pour|duration)\s+\w*$/;
  if (expectsValueRegex.test(textBeforeCursor)) {
    return true;
  }

  // no autocomplete after root level properties that already have values
  const rootLevelWithValueRegex =
    /\b(dose)\s+\d+(\.\d+)?(\s+\w*)?$|temperature\s+(\d+(\.\d+)?|\d+\.\.\d+)(\s+\w*)?$|brewer\s+\w+(\s+\w*)?$/;
  if (rootLevelWithValueRegex.test(textBeforeCursor)) {
    return true;
  }

  return false;
}

export function autocomplete(
  context: CompletionContext,
): CompletionResult | null {
  const before = context.matchBefore(/\w*/);

  if (!context.explicit && !before) {
    return null;
  }

  const lineStart = context.state.doc.lineAt(context.pos).from;
  const textBeforeCursor = context.state.sliceDoc(lineStart, context.pos);

  if (shouldPreventAutocomplete(textBeforeCursor)) {
    return null;
  }

  const options = isInStep(context)
    ? [
        {
          label: "pour",
          type: "keyword",
          info: "Pour water over coffee, eg. pour 100",
        },
        {
          label: "duration",
          type: "keyword",
          info: "Set a duration for a step, eg. duration 0:30",
        },
        {
          label: "temperature",
          type: "keyword",
          info: "Set the temperature for this step, eg. temperature 85",
        },
        {
          label: "end",
          type: "keyword",
          info: "End the current step",
        },
      ]
    : [
        {
          label: "brewer",
          type: "keyword",
          info: "Define a brewer like V60",
        },
        {
          label: "temperature",
          type: "keyword",
          info: "Set the temperature for brewing eg. 95 or 98..100",
        },
        {
          label: "dose",
          type: "keyword",
          info: "Set the amount of coffee eg. 20",
        },
        {
          label: "at",
          type: "keyword",
          info: "Define a step at a specific time, eg. at 0:00",
        },
      ];

  return {
    from: before ? before.from : context.pos,
    options,
  };
}

function isInStep(context: CompletionContext): boolean {
  const textBeforeCursor = context.state.sliceDoc(0, context.pos);

  // count unclosed steps: +1 for "at", -1 for "end"
  const stepMatches = textBeforeCursor.match(/\bat\b/g) || [];
  const endMatches = textBeforeCursor.match(/\bend\b/g) || [];

  return stepMatches.length > endMatches.length;
}
