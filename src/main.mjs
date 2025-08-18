import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { vim } from "@replit/codemirror-vim";

import { grammar } from "./grammar.mjs";
import { glitchCoffeeOrigamiHot } from "./recipes.mjs";
import { highlighting } from "./highlighting.mjs";

window.addEventListener("DOMContentLoaded", () => {
  const editorContainer = document.getElementById("editor");
  const consoleContainer = document.getElementById("console");
  const vimToggle = document.getElementById("vim-toggle");

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const match = grammar.match(update.state.doc.toString());

      if (match.succeeded()) {
        consoleContainer.textContent = "No errors";
      } else {
        consoleContainer.textContent = match.message;
      }
    }
  });

  let editor;

  function createEditor({ useVim, doc }) {
    const extensions = [basicSetup, highlighting, updateListener];
    if (useVim) {
      extensions.unshift(vim());
    }

    return new EditorView({
      doc,
      parent: editorContainer,
      extensions,
    });
  }

  editor = createEditor({ useVim: false, doc: glitchCoffeeOrigamiHot });

  vimToggle.addEventListener("change", (event) => {
    const currentDoc = editor.state.doc.toString();
    editor.destroy();

    editor = createEditor({ useVim: event.target.checked, doc: currentDoc });
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: currentDoc },
    });
  });
});
