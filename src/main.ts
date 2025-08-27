import { basicSetup } from "codemirror";
import { EditorView, keymap, type Panel, showPanel } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";

import grammar from "./core/grammar.ohm-bundle.js";
import { recipes } from "./recipes.js";
import { highlighting, autocomplete } from "./editor/highlighting.js";
import {
  newSemantics,
  type SemanticError,
  calculateRatioFromAST,
} from "./core/semantics.js";
import { getSharedContentFromURL, shareContentViaURL } from "./editor/share.js";
import { updateDarkMode, isDarkModeEnabled } from "./editor/theme.js";
import { generateSVGDiagram } from "./editor/diagram.js";

const semantics = newSemantics(grammar);

function getRatioLabel(text: string): string | null {
  const match = grammar.match(text);
  if (!match.succeeded()) {
    return "";
  }

  const ast = semantics(match).toAST();
  const result = calculateRatioFromAST(ast);

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
  const diagramContainer = document.getElementById("diagram");
  const vimToggle = document.getElementById("vim-toggle") as HTMLInputElement;
  const darkToggle = document.getElementById("dark-toggle") as HTMLInputElement;
  const recipeSelect = document.getElementById(
    "recipe-select",
  ) as HTMLSelectElement;
  const shareButton = document.getElementById(
    "share-button",
  ) as HTMLButtonElement;

  const outputErrorsButton = document.getElementById(
    "button-output-errors",
  ) as HTMLButtonElement;

  const outputAstButton = document.getElementById(
    "button-output-ast",
  ) as HTMLButtonElement;

  const outputDiagramButton = document.getElementById(
    "button-output-diagram",
  ) as HTMLButtonElement;

  const exportDiagramButton = document.getElementById(
    "export-diagram-button",
  ) as HTMLButtonElement;

  if (
    !editorContainer ||
    !consoleContainer ||
    !diagramContainer ||
    !vimToggle ||
    !darkToggle ||
    !recipeSelect ||
    !shareButton ||
    !outputErrorsButton ||
    !outputAstButton ||
    !outputDiagramButton ||
    !exportDiagramButton
  ) {
    console.error("Required elements not found in the DOM.");
    return;
  }

  const vimModeEnabled = localStorage.getItem("vim-mode") === "true";
  vimToggle.checked = vimModeEnabled;

  const darkModeEnabled = isDarkModeEnabled();

  darkToggle.checked = darkModeEnabled;
  updateDarkMode(darkModeEnabled);

  let editor: EditorView;

  const sharedContent = getSharedContentFromURL();
  const initialContent = sharedContent || recipes.glitchCoffeeOrigamiHot;
  let outputMode = "errors";

  function updateOutput(content: string): void {
    if (!consoleContainer || !diagramContainer) return;

    const match = grammar.match(content);

    if (!match.succeeded()) {
      if (outputMode === "diagram") {
        diagramContainer.innerHTML = `<div style="padding: 20px; color: #666;">Invalid syntax - cannot generate diagram</div>`;
      } else {
        consoleContainer.textContent = match.message ?? "Syntax error";
      }
      return;
    }

    if (outputMode === "diagram") {
      try {
        const ast = semantics(match).toAST();
        const svg = generateSVGDiagram(ast);
        diagramContainer.innerHTML = svg;
        consoleContainer.style.display = "none";
        diagramContainer.style.display = "block";
      } catch (error) {
        diagramContainer.innerHTML = `<div style="padding: 20px; color: #666;">Error generating diagram: ${error}</div>`;
      }
      return;
    }

    consoleContainer.style.display = "block";
    diagramContainer.style.display = "none";

    if (outputMode === "ast") {
      try {
        const ast = semantics(match).toAST();
        consoleContainer.textContent = JSON.stringify(ast, null, 2);
      } catch (error) {
        consoleContainer.textContent = `Error generating AST: ${error}`;
      }
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
  }

  const updateListener = EditorView.updateListener.of((update) => {
    if (!update.docChanged) {
      return;
    }

    const content = update.state.doc.toString();
    updateOutput(content);
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

  updateOutput(initialContent);

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

  outputErrorsButton.addEventListener("click", async () => {
    outputMode = "errors";
    updateOutput(editor.state.doc.toString());

    outputErrorsButton.setAttribute("aria-selected", "true");
    outputAstButton.setAttribute("aria-selected", "false");
    outputDiagramButton.setAttribute("aria-selected", "false");

    exportDiagramButton.style.display = "none";
  });

  outputAstButton.addEventListener("click", async () => {
    outputMode = "ast";
    updateOutput(editor.state.doc.toString());

    outputAstButton.setAttribute("aria-selected", "true");
    outputErrorsButton.setAttribute("aria-selected", "false");
    outputDiagramButton.setAttribute("aria-selected", "false");

    exportDiagramButton.style.display = "none";
  });

  outputDiagramButton.addEventListener("click", async () => {
    outputMode = "diagram";
    updateOutput(editor.state.doc.toString());

    outputDiagramButton.setAttribute("aria-selected", "true");
    outputErrorsButton.setAttribute("aria-selected", "false");
    outputAstButton.setAttribute("aria-selected", "false");

    exportDiagramButton.style.display = "block";
  });

  function downloadSVG(svgContent: string, filename: string): void {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportDiagramButton.addEventListener("click", () => {
    if (outputMode !== "diagram") return;

    const content = editor.state.doc.toString();
    const match = grammar.match(content);

    if (!match.succeeded()) return;

    try {
      const ast = semantics(match).toAST();
      const svg = generateSVGDiagram(ast);
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      downloadSVG(svg, `brew-recipe-diagram-${timestamp}.svg`);
    } catch (error) {
      console.error("Error exporting diagram:", error);
    }
  });
});
