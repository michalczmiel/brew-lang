import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/language";

import { grammar } from "./grammar.mjs";

const myLanguage = StreamLanguage.define({
  token(stream, state) {
    // Keywords
    if (stream.match(/\b(temperature|dose|water|start|end|step|pour)\b/)) {
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

const recipe = `temperature 86..90
dose 14.5
water 260

step {
  start 0:00
  end 0:30
  pour 10
}
`;

window.addEventListener("DOMContentLoaded", () => {
  const editorContainer = document.getElementById("editor");
  const consoleContainer = document.getElementById("console");

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const match = grammar.match(update.state.doc.toString());

      if (match.succeeded()) {
        consoleContainer.textContent = "";
      } else {
        consoleContainer.textContent = match.message;
      }
    }
  });

  const view = new EditorView({
    doc: recipe,
    parent: editorContainer,
    extensions: [basicSetup, myLanguage, updateListener],
  });
});
