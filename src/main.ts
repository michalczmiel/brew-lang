import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { vim } from "@replit/codemirror-vim";
import { indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

import { grammar } from "./grammar.js";
import { glitchCoffeeOrigamiHot, jamesHoffmannAeropress } from "./recipes.js";
import { highlighting, autocomplete } from "./highlighting.js";
import { newSemantics, type SemanticError } from "./semantics.js";

function decodeContentFromURL(encodedContent: string): string {
  try {
    return decodeURIComponent(encodedContent);
  } catch (error) {
    console.error("Failed to decode URL content:", error);
    return "";
  }
}

function getSharedContentFromURL(): string | null {
  const hash = window.location.hash;
  if (hash.startsWith("#src=")) {
    // remove "#src=" prefix
    return decodeContentFromURL(hash.substring(5));
  }
  return null;
}

function encodeContentToUrl(content: string): string {
  const encodedContent = encodeURIComponent(content);
  return `${window.location.pathname}${window.location.search}#src=${encodedContent}`;
}

function updateDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const editorContainer = document.getElementById("editor");
  const consoleContainer = document.getElementById("console");
  const vimToggle = document.getElementById("vim-toggle") as HTMLInputElement;
  const darkToggle = document.getElementById("dark-toggle") as HTMLInputElement;
  const recipeSelect = document.getElementById(
    "recipe-select",
  ) as HTMLSelectElement;
  const shareButton = document.getElementById(
    "share-button",
  ) as HTMLButtonElement;

  if (
    !editorContainer ||
    !consoleContainer ||
    !vimToggle ||
    !darkToggle ||
    !recipeSelect ||
    !shareButton
  ) {
    console.error("Required elements not found in the DOM.");
    return;
  }

  const vimModeEnabled = localStorage.getItem("vim-mode") === "true";
  vimToggle.checked = vimModeEnabled;

  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const storedDarkMode = localStorage.getItem("dark-mode");
  const darkModeEnabled = storedDarkMode
    ? storedDarkMode === "true"
    : systemPrefersDark;
  darkToggle.checked = darkModeEnabled;

  updateDarkMode(darkModeEnabled);

  const semantics = newSemantics(grammar);

  let editor: EditorView;

  const sharedContent = getSharedContentFromURL();
  const initialContent = sharedContent || glitchCoffeeOrigamiHot;

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

    const semanticErrors: SemanticError[] = semantics(match).validate();
    if (semanticErrors.length > 0) {
      const errorMessages = semanticErrors
        .map((error) => `${error.formatted}${error.message}`)
        .join("\n\n");

      consoleContainer.textContent = errorMessages;
      return;
    }

    consoleContainer.textContent = "No errors";
  });

  function createEditor({
    useVim,
    useDark,
    doc,
    parent,
  }: {
    useVim: boolean;
    useDark: boolean;
    doc: string;
    parent: Element;
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
      parent,
      extensions: [
        ...extensions,
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" },
        }),
      ],
    });
  }

  editor = createEditor({
    useVim: vimModeEnabled,
    useDark: darkModeEnabled,
    doc: initialContent,
    parent: editorContainer,
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
      parent: editorContainer,
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
      parent: editorContainer,
    });
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: currentDoc },
    });
  });

  recipeSelect.addEventListener("change", (event) => {
    const selectedValue = (event.target as HTMLSelectElement).value;
    if (!selectedValue) return;

    let recipeContent = "";
    switch (selectedValue) {
      case "glitchCoffeeOrigamiHot":
        recipeContent = glitchCoffeeOrigamiHot;
        break;
      case "jamesHoffmannAeropress":
        recipeContent = jamesHoffmannAeropress;
        break;
    }

    if (recipeContent) {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: recipeContent,
        },
      });
    }
  });

  shareButton.addEventListener("click", async () => {
    const currentContent = editor.state.doc.toString();
    const newURL = encodeContentToUrl(currentContent);
    window.history.replaceState(null, "", newURL);

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(newURL);
      } catch (error) {
        console.error("Failed to copy URL to clipboard:", error);
      }
    }
  });
});
