import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/language";

import { grammar } from "./grammar.mjs";
import { glitchCoffeeOrigamiHot } from "./recipes.mjs";

const myLanguage = StreamLanguage.define({
  token(stream, state) {
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

  new EditorView({
    doc: glitchCoffeeOrigamiHot,
    parent: editorContainer,
    extensions: [basicSetup, myLanguage, updateListener],
  });
});
