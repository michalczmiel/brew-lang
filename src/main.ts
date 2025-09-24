import {
  EditorView,
  keymap,
  type Panel,
  showPanel,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  indentWithTab,
  history,
  defaultKeymap,
  historyKeymap,
} from "@codemirror/commands";
import { indentOnInput, foldKeymap, foldGutter } from "@codemirror/language";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";

import grammar from "./core/grammar.ohm-bundle.js";
import { recipes } from "./recipes.js";
import { highlighting, autocomplete } from "./editor/highlighting.js";
import { newSemantics, calculateRatioFromAST } from "./core/semantics.js";
import { getSharedContentFromURL, shareContentViaURL } from "./editor/share.js";
import {
  updateTheme,
  getCurrentTheme,
  isDarkModeEnabled,
  type ThemeOption,
} from "./editor/theme.js";
import { generateSVGDiagram } from "./editor/diagram.js";
import { brewLinter } from "./editor/linter.js";
import { createTimerInterface } from "./editor/timer.js";

import "./main.css";

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
  const timerContainer = document.getElementById("timer");
  const keymapSelect = document.getElementById(
    "keymap-select",
  ) as HTMLSelectElement;
  const themeSelect = document.getElementById(
    "theme-select",
  ) as HTMLSelectElement;
  const fontSizeSelect = document.getElementById(
    "font-size-select",
  ) as HTMLSelectElement;
  const recipeSelect = document.getElementById(
    "recipe-select",
  ) as HTMLSelectElement;
  const shareButton = document.getElementById(
    "share-button",
  ) as HTMLButtonElement;
  const settingsButton = document.getElementById(
    "settings-button",
  ) as HTMLButtonElement;
  const newRecipeButton = document.getElementById(
    "new-recipe-button",
  ) as HTMLButtonElement;
  const preferencesDialog = document.getElementById(
    "preferences-dialog",
  ) as HTMLDialogElement;

  const outputAstButton = document.getElementById(
    "button-output-ast",
  ) as HTMLButtonElement;

  const outputDiagramButton = document.getElementById(
    "button-output-diagram",
  ) as HTMLButtonElement;

  const outputTimerButton = document.getElementById(
    "button-output-timer",
  ) as HTMLButtonElement;

  const exportDiagramButton = document.getElementById(
    "export-diagram-button",
  ) as HTMLButtonElement;

  if (
    !editorContainer ||
    !consoleContainer ||
    !diagramContainer ||
    !timerContainer ||
    !keymapSelect ||
    !themeSelect ||
    !fontSizeSelect ||
    !recipeSelect ||
    !shareButton ||
    !settingsButton ||
    !newRecipeButton ||
    !preferencesDialog ||
    !outputAstButton ||
    !outputDiagramButton ||
    !outputTimerButton ||
    !exportDiagramButton
  ) {
    console.error("Required elements not found in the DOM.");
    return;
  }

  const storedKeymap = localStorage.getItem("keymap") || "default";
  keymapSelect.value = storedKeymap;
  const vimModeEnabled = storedKeymap === "vim";

  const currentTheme = getCurrentTheme();
  const darkModeEnabled = isDarkModeEnabled();

  themeSelect.value = currentTheme;
  updateTheme(currentTheme);

  const storedFontSize = localStorage.getItem("fontSize") || "16";
  fontSizeSelect.value = storedFontSize;

  function updateEditorFontSize(fontSize: string): void {
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${fontSize}px`,
    );
  }

  updateEditorFontSize(storedFontSize);

  let editor: EditorView;

  const sharedContent = getSharedContentFromURL();
  const initialContent = sharedContent || recipes.glitchCoffeeOrigamiHot;
  let outputMode: "ast" | "diagram" | "timer" = "timer";

  function updateOutput(content: string): void {
    if (!consoleContainer || !diagramContainer || !timerContainer) return;

    const match = grammar.match(content);

    if (!match.succeeded()) {
      if (outputMode === "diagram") {
        diagramContainer.innerHTML = `<div style="padding: 20px; color: #666;">Invalid syntax - cannot generate diagram</div>`;
      } else if (outputMode === "timer") {
        timerContainer.innerHTML = `<div style="padding: 20px; color: #666;">Invalid syntax - cannot create timer</div>`;
      } else {
        consoleContainer.textContent = match.message ?? "Syntax error";
      }
      return;
    }

    // Hide all containers first
    consoleContainer.style.display = "none";
    diagramContainer.style.display = "none";
    timerContainer.style.display = "none";

    if (outputMode === "diagram") {
      try {
        const ast = semantics(match).toAST();
        const svg = generateSVGDiagram(ast);
        diagramContainer.innerHTML = svg;
        diagramContainer.style.display = "block";
      } catch (error) {
        diagramContainer.innerHTML = `<div style="padding: 20px; color: #666;">Error generating diagram: ${error}</div>`;
        diagramContainer.style.display = "block";
      }
      return;
    }

    if (outputMode === "timer") {
      try {
        const ast = semantics(match).toAST();
        createTimerInterface(timerContainer, ast);
        timerContainer.style.display = "block";
      } catch (error) {
        timerContainer.innerHTML = `<div style="padding: 20px; color: #666;">Error creating timer: ${error}</div>`;
        timerContainer.style.display = "block";
      }
      return;
    }

    // Default to AST mode
    consoleContainer.style.display = "block";
    if (outputMode === "ast") {
      try {
        const ast = semantics(match).toAST();
        consoleContainer.textContent = JSON.stringify(ast, null, 2);
      } catch (error) {
        consoleContainer.textContent = `Error generating AST: ${error}`;
      }
      return;
    }
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
      lineNumbers(),
      foldGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
      ]),
      highlighting,
      highlighting.data.of({
        autocomplete,
      }),
      showPanel.of(ratioPanel),
      updateListener,
      brewLinter,
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

  keymapSelect.addEventListener("change", async (event) => {
    if (!event.target) {
      return;
    }

    const selectedKeymap = (event.target as HTMLSelectElement).value;
    const currentDoc = editor.state.doc.toString();
    editor.destroy();

    localStorage.setItem("keymap", selectedKeymap);

    editor = await createEditor({
      useVim: selectedKeymap === "vim",
      useDark: isDarkModeEnabled(),
      doc: currentDoc,
      parent: editorContainer,
    });
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: currentDoc },
    });
  });

  themeSelect.addEventListener("change", async (event) => {
    if (!event.target) {
      return;
    }

    const selectedTheme = (event.target as HTMLSelectElement)
      .value as ThemeOption;
    const currentDoc = editor.state.doc.toString();
    editor.destroy();

    updateTheme(selectedTheme);
    const isDark = isDarkModeEnabled();

    editor = await createEditor({
      useVim: keymapSelect.value === "vim",
      useDark: isDark,
      doc: currentDoc,
      parent: editorContainer,
    });
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: currentDoc },
    });
  });

  fontSizeSelect.addEventListener("change", (event) => {
    if (!event.target) {
      return;
    }

    const selectedFontSize = (event.target as HTMLSelectElement).value;
    localStorage.setItem("fontSize", selectedFontSize);
    updateEditorFontSize(selectedFontSize);
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

  newRecipeButton.addEventListener("click", () => {
    const emptyRecipe = `# New Recipe\n`;

    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: emptyRecipe,
      },
    });

    editor.focus();

    // Reset recipe selector to show no selection
    recipeSelect.value = "";
  });

  settingsButton.addEventListener("click", () => {
    // Close any open selects before opening dialog (iOS Safari fix)
    // Multiple methods needed due to iOS Safari blur() limitations

    // Method 1: Blur all select elements
    document.querySelectorAll("select").forEach((select) => {
      select.blur();
    });

    // Method 2: Blur active element if it's a select
    if (document.activeElement && document.activeElement.tagName === "SELECT") {
      (document.activeElement as HTMLElement).blur();
    }

    // Method 3: Focus a temporary dummy element to force blur
    const tempButton = document.createElement("button");
    tempButton.style.position = "absolute";
    tempButton.style.left = "-9999px";
    tempButton.style.opacity = "0";
    tempButton.style.pointerEvents = "none";
    document.body.appendChild(tempButton);
    tempButton.focus();
    setTimeout(() => {
      document.body.removeChild(tempButton);
      preferencesDialog.showModal();
    }, 10);
  });

  preferencesDialog.addEventListener("click", (event) => {
    if (event.target === preferencesDialog) {
      preferencesDialog.close();
    }
  });

  outputAstButton.addEventListener("click", async () => {
    outputMode = "ast";
    updateOutput(editor.state.doc.toString());

    outputAstButton.setAttribute("aria-selected", "true");
    outputDiagramButton.setAttribute("aria-selected", "false");
    outputTimerButton.setAttribute("aria-selected", "false");

    exportDiagramButton.style.display = "none";
  });

  outputDiagramButton.addEventListener("click", async () => {
    outputMode = "diagram";
    updateOutput(editor.state.doc.toString());

    outputDiagramButton.setAttribute("aria-selected", "true");
    outputAstButton.setAttribute("aria-selected", "false");
    outputTimerButton.setAttribute("aria-selected", "false");

    exportDiagramButton.style.display = "block";
  });

  outputTimerButton.addEventListener("click", async () => {
    outputMode = "timer";
    updateOutput(editor.state.doc.toString());

    outputTimerButton.setAttribute("aria-selected", "true");
    outputAstButton.setAttribute("aria-selected", "false");
    outputDiagramButton.setAttribute("aria-selected", "false");

    exportDiagramButton.style.display = "none";
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
