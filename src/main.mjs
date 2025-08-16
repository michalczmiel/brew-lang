import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";

import { grammar } from "./grammar.mjs";
import { glitchCoffeeOrigamiHot } from "./recipes.mjs";
import { highlighting } from "./highlighting.mjs";

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
    extensions: [basicSetup, highlighting, updateListener],
  });
});
