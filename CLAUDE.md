# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a learning project for a domain-specific language (DSL) for coffee brewing recipes called "BrewLang". It's a web-based editor with real-time syntax validation and highlighting.

## Development Commands

- **Run tests**: `pnpm test` (uses Node.js built-in test runner to run tests in `test/` directory)
- **Build project**: `pnpm build` (uses Vite for bundling)

## Architecture

The project consists of four main components:

1. **Grammar Definition** (`src/grammar.mjs`): Uses Ohm.js to define the BrewLang syntax with rules for recipes, steps, temperatures, doses, water amounts, and timing instructions.
2. **Syntax Highlighting** (`src/highlighting.mjs`): CodeMirror stream language definition that highlights keywords (temperature, dose, water, start, finish, step, pour, duration) and numbers.
3. **Editor Interface** (`src/main.mjs`): Sets up a CodeMirror editor with real-time grammar validation. Shows parse errors in a console div below the editor.
4. **Sample Recipes** (`src/recipes.mjs`): Contains example brewing recipes written in BrewLang syntax.
