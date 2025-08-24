# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Domain Specific Language (DSL) for crafting coffee brew recipes, focused on alternative brewing methods. It's a learning project exploring DSL design and implementation including parsing, linting, evaluation, and error handling, with a simple editor environment featuring syntax highlighting and code completion.

## Commands

**Development:**

- `bun dev` - Start development server with live reload (exposed to local network)
- `bun run build` - Build minified production bundle to ./dist with Vite
- `bun generate` - Generate Ohm.js bundles
- `bun check` - Type check without emitting files
- `bun test` - Run all tests
- `bun lint` - Lint source and test files with Biome
- `bun format` - Format source and test files with Biome

It's imporant that you don't run dev server unless asked. After making changes ensure build, check, lint, test and format are passing.

## Architecture

**Core Components:**

- `src/grammar.ohm` - Ohm.js grammar definition for the brew language DSL
- `src/semantics.ts` - Semantic analysis and validation logic
- `src/highlighting.ts` - CodeMirror syntax highlighting and autocomplete
- `src/main.ts` - Main editor application with CodeMirror integration
- `src/recipes.ts` - Sample brew recipes in the DSL
- `src/share.ts` - Share recipe via URL

**Language Structure:**
The DSL supports brewing instructions with constructs like `brewer`, `dose`, `temperature` and timed steps with `at X:XX ... end` blocks containing `pour` and `duration` instructions. Comments use `#` syntax.

**Editor Features:**

- CodeMirror 6 editor with basic setup
- Vim mode toggle (stored in localStorage)
- Dark/light theme toggle
- Real-time syntax validation and semantic error reporting
- Sample recipe selection
- Share recipe via URL

**Technology Stack:**

- Runtime: Bun
- Parser: Ohm.js for grammar definition and parsing
- Editor: CodeMirror 6 with custom language support
- Linter/Formatter: Biome
- TypeScript with strict configuration

## Rules

- Always prefer less code, avoid unnecessary complexity, and keep it simple
- All TypeScript functions must have type annotations for parameters and return values
- Avoid using 'any' type, prefer specific types or interfaces
- Avoid deep nesting and prefer defensive programming style by using early return
- Avoid comments, use them only for explaining complex logic or non-obvious decisions
- Use declarative and simple test cases for unit testing that tests the logic not the implementation details
