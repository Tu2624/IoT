# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Framework:** Vue.js 3 (Composition API) with Vite
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- **Charts:** Chart.js 4 + vue-chartjs 5 (register modules locally per component, not globally)
- **State Management:** Pinia (setup-store syntax)
- **Testing:** Vitest + @vue/test-utils
- **Language:** TypeScript (strict mode)

## Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Lint (run after every file change)
npm run lint

# Run all tests
npm run test

# Run a single test file
npx vitest run src/path/to/file.test.ts
```

## Source Layout

```
src/
├── views/        # Page-level components (one per route/screen)
├── components/   # Reusable UI components
├── stores/       # Pinia stores (dashboardStore.ts); tests in stores/__tests__/
├── data/         # Static mock data (mockData.ts)
├── types/        # Shared TypeScript interfaces (dashboard.ts)
└── composables/  # Reusable Composition API logic
```

## Architecture

**Layout shell** — `AppLayout.vue` owns sidebar toggle state and exposes a `<slot>` inside `<main>`. Page views slot directly into it; they do not manage layout state.

**Dashboard** — `BentoDashboard.vue` (`src/views/`) assembles the bento grid using a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` container. Cell spans:
- `KpiCard` — `col-span-1` (4 per row on desktop)
- `RevenueChart` — `col-span-1 sm:col-span-2 lg:col-span-4` (full width)
- `ActivityFeed` / `GoalsPanel` — `col-span-1 sm:col-span-2 lg:col-span-2` (half width)

**Data flow** — Mock data in `src/data/mockData.ts` seeds the Pinia store (`src/stores/dashboardStore.ts`), which is the single source of truth for views. Use `storeToRefs` to destructure reactive state. Static chart config (`revenueChartSeries`) is imported directly in views — it is not transactional state. Components are purely presentational (props-in, no emits except UI events).

**Chart registration** — Import and register only the Chart.js modules each component uses. Never call `Chart.register()` globally in `main.ts`.

## Code Principles

- Use `<script setup lang="ts">` exclusively — avoid Options API.
- Keep components presentational; own data only at the view/page level.
- Extract shared logic into `src/composables/`.
