import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { vim } from "@replit/codemirror-vim";

import { grammar } from "./grammar.js";
import { glitchCoffeeOrigamiHot } from "./recipes.js";
import { highlighting } from "./highlighting.js";

window.addEventListener("DOMContentLoaded", () => {
  const editorContainer = document.getElementById("editor");
  const consoleContainer = document.getElementById("console");
  const vimToggle = document.getElementById("vim-toggle") as HTMLInputElement;

  if (!editorContainer || !consoleContainer || !vimToggle) {
    console.error("Required elements not found in the DOM.");
    return;
  }

  const vimModeEnabled = localStorage.getItem("vim-mode") === "true";
  vimToggle.checked = vimModeEnabled;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const match = grammar.match(update.state.doc.toString());

      if (match.succeeded()) {
        consoleContainer.textContent = "No errors";
      } else {
        consoleContainer.textContent = match.message ?? "Syntax error";
      }
    }
  });

  let editor: EditorView;

  function createEditor({
    useVim,
    doc,
  }: {
    useVim: boolean;
    doc: string;
  }): EditorView {
    const extensions = [basicSetup, highlighting, updateListener];
    if (useVim) {
      extensions.unshift(vim());
    }

    return new EditorView({
      doc,
      parent: editorContainer!,
      extensions,
    });
  }

  editor = createEditor({
    useVim: vimModeEnabled,
    doc: glitchCoffeeOrigamiHot,
  });
  editor.focus();

  vimToggle.addEventListener("change", (event) => {
    if (!event.target) {
      return;
    }

    const currentDoc = editor.state.doc.toString();
    editor.destroy();

    localStorage.setItem(
      "vim-mode",
      (event.target as HTMLInputElement).checked.toString(),
    );
    editor = createEditor({
      useVim: (event.target as HTMLInputElement).checked,
      doc: currentDoc,
    });
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: currentDoc },
    });
  });
});
