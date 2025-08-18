import { StreamLanguage } from "@codemirror/language";
import { CompletionContext } from "@codemirror/autocomplete";

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

export function autocomplete(context: CompletionContext) {
  let before = context.matchBefore(/\w*/);
  // If completion wasn't explicitly started and there
  // is no word before the cursor, don't open completions.
  if (!context.explicit && !before) {
    return null;
  }

  return {
    from: before ? before.from : context.pos,
    options: [
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
        label: "step",
        type: "keyword",
        info: "Define a step in the brewing process",
      },
      {
        label: "end",
        type: "keyword",
        info: "End the current step",
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
    ],
  };
}
