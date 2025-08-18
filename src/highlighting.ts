import { StreamLanguage } from "@codemirror/language";
import {
  CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";

export const highlighting = StreamLanguage.define({
  token(stream, state) {
    // Comments
    if (stream.match(/#.*/)) {
      return "comment";
    }

    // Keywords
    if (
      stream.match(
        /\b(method|temperature|dose|water|start|finish|step|pour|duration|end)\b/,
      )
    ) {
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

function shouldPreventAutocomplete(context: CompletionContext): boolean {
  const lineStart = context.state.doc.lineAt(context.pos).from;
  const textBeforeCursor = context.state.sliceDoc(lineStart, context.pos);

  // no autocomplete in decimal number
  if (/\d+\.\d*$/.test(textBeforeCursor)) {
    return true;
  }

  // no autocomplete after range operator
  if (/\d+\.\.$/.test(textBeforeCursor)) {
    return true;
  }

  // no automcompletion in comments
  if (textBeforeCursor.includes("#")) {
    return true;
  }

  // should not show keyword completions after Keywords that expeect value
  const expectsValueRegex =
    /\b(method|temperature|dose|water|start|finish|pour|duration)\s+\w*$/;
  if (expectsValueRegex.test(textBeforeCursor)) {
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

  if (shouldPreventAutocomplete(context)) {
    return null;
  }

  const options = isInStep(context)
    ? [
        {
          label: "start",
          type: "keyword",
          info: "Specify the step start time eg. start 0:00",
        },
        {
          label: "finish",
          type: "keyword",
          info: "Specify the step finish time eg. finish 0:30",
        },
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
          label: "end",
          type: "keyword",
          info: "End the current step",
        },
      ]
    : [
        {
          label: "method",
          type: "keyword",
          info: "Define a method like V60",
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
          label: "water",
          type: "keyword",
          info: "Set the amount of water eg. 300",
        },
        {
          label: "step",
          type: "keyword",
          info: "Define a step in the brewing process",
        },
      ];

  return {
    from: before ? before.from : context.pos,
    options,
  };
}

function isInStep(context: CompletionContext): boolean {
  const textBeforeCursor = context.state.sliceDoc(0, context.pos);

  // count unclosed steps: +1 for "step", -1 for "end"
  const stepMatches = textBeforeCursor.match(/\bstep\b/g) || [];
  const endMatches = textBeforeCursor.match(/\bend\b/g) || [];

  return stepMatches.length > endMatches.length;
}
