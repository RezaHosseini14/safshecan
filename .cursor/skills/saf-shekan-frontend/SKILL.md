---
name: saf-shekan-frontend
description: >
  SafShekan frontend structure (Next.js 16 App Router, feature folders).
  Use when adding a page, component, or client module under apps/frontend.
---

# SafShekan frontend

## Layout

- `src/app` — routes only (`page.tsx`, `layout.tsx`, `globals.css`)
- `src/features/shell` — frame, header, navigation
- `src/features/console` — clock, arm, cURL, order, timing, network, terminal
- `src/features/watcher` — TSETMC watchlist and live quote
- `src/features/reports` — shot archive
- `src/components/ui` — shadcn primitives
- `src/lib` — HTTP client, socket hook, formatting, secret masking
- Shared order/timing/fee types — `@saf-shekan/core`, not a local duplicate

Features do not import each other.

## Rules

1. Browser talks to the Nest API only. No broker HTTP from the client.
2. Do not introduce ZARVA UI: no `.zarva-*` classes, no Solar icons, no `DomainListPage` / `KpiGrid` / `DashboardPanel` / `StatusBadge`. User-visible copy goes through `@saf-shekan/i18n` (see `.cursor/rules/i18n.mdc`). Do not add a second fa/en catalog.
3. Visual source is the Stitch terminal HTML (dark canvas, monospace figures). Do not invent prices, ranks, or AI scores.
4. Product security in `.cursor/rules/security.mdc` wins over generic JWT or RBAC advice.

## Delegate

| Task | Skill |
| --- | --- |
| Digits vs Yekan Bakh | `saf-shekan-figures` |
| React structure / perf | `vercel-react-best-practices`, `vercel-composition-patterns` |
| React API research | `react-expert` |
| Adding a missing shadcn primitive | `shadcn` |
| Component accessibility | `building-components` |
| Tests | `testing-vitest`, `security-test-generator` |
| Secret rendering / hostile input | `injection-checker`, `api-security-review` |
