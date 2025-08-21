# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning project for a domain-specific language (DSL) for coffee brewing recipes called "BrewLang". It's a web-based editor with real-time syntax validation and highlighting.

## Development Commands

- **Run tests**: `bun test` (uses Bun test runner to run tests in `test/` directory)
- **Build project**: `bun run build` (uses Bun bundler for bundling)
- **Type check**: `bun run check` (uses TypeScript for type checking)
- **Lint**: `bun run lint` (uses Biome for linting)
- **Format**: `bun run format` (uses Biome for formatting)

## Architecture

The project consists of these key files:

1. **HTML Interface** (`index.html`): Main application interface featuring a responsive two-panel layout with editor section and error sidebar. Includes CSS custom properties for light/dark themes, controls for vim mode and dark mode toggles, and mobile-responsive design. Loads the TypeScript module and provides the DOM structure for the BrewLang editor.

2. **Grammar Definition** (`src/grammar.ts`): Uses Ohm.js to define the BrewLang syntax with rules for recipes, methods, steps, temperatures, doses, water amounts, timing instructions, and comments. Supports ranges (e.g., `86..90`), duration notation (`0:30`), and nested step instructions.

3. **Syntax Highlighting** (`src/highlighting.ts`): CodeMirror stream language definition that highlights keywords (method, temperature, dose, water, start, finish, step, pour, duration, end) and numbers. Also includes autocomplete functionality with helpful descriptions for each keyword.

4. **Semantics** (`src/semantics.ts`): Semantic analysis and validation for BrewLang recipes. Currently implements water amount validation (prevents zero water amounts) with extensible architecture for additional semantic checks.

5. **Editor Interface** (`src/main.ts`): Sets up a CodeMirror editor with vim mode toggle, tab indentation, real-time grammar validation, and semantic error checking. Shows parse errors and semantic errors in a console div below the editor. Persists vim mode preference in localStorage.

6. **Sample Recipes** (`src/recipes.ts`): Contains example brewing recipes written in BrewLang syntax, including the "Glitch Coffee Origami Hot" recipe demonstrating method, temperature ranges, dose, water amounts, and multi-step brewing process.
