# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning project for a domain-specific language (DSL) for coffee brewing recipes called "BrewLang". It's a web-based editor with real-time syntax validation and highlighting.

## Development Commands

- **Run tests**: `pnpm test` (uses Vitest run tests in `test/` directory)
- **Build project**: `pnpm build` (uses Vite for bundling)
- **Type check**: `pnpm typecheck` (uses TypeScript for type checking)

## Architecture

The project consists of these key files:

1. **Grammar Definition** (`src/grammar.ts`): Uses Ohm.js to define the BrewLang syntax with rules for recipes, steps, temperatures, doses, water amounts, and timing instructions.
2. **Syntax Highlighting** (`src/highlighting.ts`): CodeMirror stream language definition that highlights keywords (temperature, dose, water, start, finish, step, pour, duration) and numbers.
3. **Semantics** (`src/semantics.ts`): Semantic analysis and validation for BrewLang recipes, providing meaning and interpretation of the parsed syntax.
4. **Editor Interface** (`src/main.ts`): Sets up a CodeMirror editor with real-time grammar validation. Shows parse errors in a console div below the editor.
5. **Sample Recipes** (`src/recipes.ts`): Contains example brewing recipes written in BrewLang syntax.
