import { basicSetup } from "codemirror";
import { EditorView, keymap, type Panel, showPanel } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

import { grammar } from "./grammar.js";
import { recipes } from "./recipes.js";
import { highlighting, autocomplete } from "./highlighting.js";
import { newSemantics, type SemanticError } from "./semantics.js";
import { getSharedContentFromURL, shareContentViaURL } from "./share.js";

const semantics = newSemantics(grammar);

function updateDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function getRatioLabel(text: string): string | null {
  const match = grammar.match(text);
  if (!match.succeeded()) {
    return "";
  }

  const result: null | { ratio: string; water: number } =
    semantics(match).calculateRatio();

  if (!result) {
    return "";
  }

  return `Ratio: ${result.ratio} | Water: ${result.water}`;
}

function ratioPanel(view: EditorView): Panel {
  const dom = document.createElement("div");

  dom.textContent = getRatioLabel(view.state.doc.toString());

  return {
    dom,
    update(update) {
      dom.textContent = getRatioLabel(update.view.state.doc.toString());
    },
  };
}

window.addEventListener("DOMContentLoaded", async () => {
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

  let editor: EditorView;

  const sharedContent = getSharedContentFromURL();
  const initialContent = sharedContent || recipes.glitchCoffeeOrigamiHot;

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

  async function createEditor({
    useVim,
    useDark,
    doc,
    parent,
  }: {
    useVim: boolean;
    useDark: boolean;
    doc: string;
    parent: Element;
  }): Promise<EditorView> {
    const extensions = [
      basicSetup,
      keymap.of([indentWithTab]),
      highlighting,
      highlighting.data.of({
        autocomplete,
      }),
      showPanel.of(ratioPanel),
      updateListener,
    ];
    if (useVim) {
      const { vim } = await import("@replit/codemirror-vim");
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

  editor = await createEditor({
    useVim: vimModeEnabled,
    useDark: darkModeEnabled,
    doc: initialContent,
    parent: editorContainer,
  });
  editor.focus();

  vimToggle.addEventListener("change", async (event) => {
    if (!event.target) {
      return;
    }

    const currentDoc = editor.state.doc.toString();
    editor.destroy();

    localStorage.setItem(
      "vim-mode",
      (event.target as HTMLInputElement).checked.toString(),
    );
    editor = await createEditor({
      useVim: (event.target as HTMLInputElement).checked,
      useDark: darkToggle.checked,
      doc: currentDoc,
      parent: editorContainer,
    });
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: currentDoc },
    });
  });

  darkToggle.addEventListener("change", async (event) => {
    if (!event.target) {
      return;
    }

    const isDark = (event.target as HTMLInputElement).checked;
    const currentDoc = editor.state.doc.toString();
    editor.destroy();

    localStorage.setItem("dark-mode", isDark.toString());
    updateDarkMode(isDark);

    editor = await createEditor({
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

    const recipeContent = recipes[selectedValue as keyof typeof recipes];

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
    await shareContentViaURL(currentContent);
  });
});
