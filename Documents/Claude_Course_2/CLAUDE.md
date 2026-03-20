# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Framework:** Vue.js 3 (Composition API) with Vite
- **Styling:** Tailwind CSS
- **Testing:** Vitest
- **Language:** TypeScript (preferred)

## Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run all tests
npm run test

# Run a single test file
npx vitest run src/path/to/file.test.ts

# Run tests in watch mode
npx vitest

# Lint
npm run lint
```

> Always run linting after making file changes.

## Code Principles

- Follow clean code principles: clear naming, single responsibility, small focused functions.
- Use Vue 3 Composition API (`<script setup>`) exclusively — avoid Options API.
- Keep components small and composable; extract reusable logic into composables (`src/composables/`).
