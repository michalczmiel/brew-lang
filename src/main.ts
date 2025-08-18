import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { vim } from "@replit/codemirror-vim";
import { indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

import { grammar } from "./grammar.js";
import { glitchCoffeeOrigamiHot } from "./recipes.js";
import { highlighting, autocomplete } from "./highlighting.js";
import { newSemantics } from "./semantics.js";

window.addEventListener("DOMContentLoaded", () => {
  const editorContainer = document.getElementById("editor");
  const consoleContainer = document.getElementById("console");
  const vimToggle = document.getElementById("vim-toggle") as HTMLInputElement;
  const darkToggle = document.getElementById("dark-toggle") as HTMLInputElement;

  if (!editorContainer || !consoleContainer || !vimToggle || !darkToggle) {
    console.error("Required elements not found in the DOM.");
    return;
  }

  const vimModeEnabled = localStorage.getItem("vim-mode") === "true";
  vimToggle.checked = vimModeEnabled;

  // Detect system dark mode preference
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const storedDarkMode = localStorage.getItem("dark-mode");
  const darkModeEnabled = storedDarkMode ? storedDarkMode === "true" : systemPrefersDark;
  darkToggle.checked = darkModeEnabled;

  // Function to update body dark class
  function updateDarkMode(isDark: boolean) {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

  // Set initial dark mode
  updateDarkMode(darkModeEnabled);

  const semantics = newSemantics(grammar);

  let editor: EditorView;

  const updateListener = EditorView.updateListener.of((update) => {
    if (!update.docChanged) {
      return;
    }

    const content = update.state.doc.toString();
    const match = grammar.match(content);
    if (!match.succeeded()) {
      consoleContainer.textContent = match.message ?? "Syntax error";
      return;
    }

    const semanticError = semantics(match).checkWater();
    if (semanticError) {
      const head = editor.state.selection.main.head;
      const cursor = editor.state.doc.lineAt(head);

      const line = cursor.number;
      const col = head - cursor.from;

      consoleContainer.textContent = `Line ${line}, col ${col}:\n${semanticError}`;
      return;
    }

    consoleContainer.textContent = "No errors";
  });

  function createEditor({
    useVim,
    useDark,
    doc,
  }: {
    useVim: boolean;
    useDark: boolean;
    doc: string;
  }): EditorView {
    const extensions = [
      basicSetup,
      keymap.of([indentWithTab]),
      highlighting,
      highlighting.data.of({
        autocomplete,
      }),
      updateListener,
    ];
    if (useVim) {
      extensions.unshift(vim());
    }
    if (useDark) {
      extensions.push(oneDark);
    }

    return new EditorView({
      doc,
      parent: editorContainer!,
      extensions,
    });
  }

  editor = createEditor({
    useVim: vimModeEnabled,
    useDark: darkModeEnabled,
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
      useDark: darkToggle.checked,
      doc: currentDoc,
    });
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: currentDoc },
    });
  });

  darkToggle.addEventListener("change", (event) => {
    if (!event.target) {
      return;
    }

    const isDark = (event.target as HTMLInputElement).checked;
    const currentDoc = editor.state.doc.toString();
    editor.destroy();

    localStorage.setItem("dark-mode", isDark.toString());
    updateDarkMode(isDark);
    
    editor = createEditor({
      useVim: vimToggle.checked,
      useDark: isDark,
      doc: currentDoc,
    });
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: currentDoc },
    });
  });
});
