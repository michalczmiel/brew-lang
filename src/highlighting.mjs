import { StreamLanguage } from "@codemirror/language";

export const highlighting = StreamLanguage.define({
  token(stream, state) {
    // Comments
    if (stream.match(/#.*/)) {
      return "comment";
    }

    // Keywords
    if (
      stream.match(
        /\b(temperature|dose|water|start|finish|step|pour|duration)\b/,
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
