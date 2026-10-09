---
name: testing-vitest
description: Vitest rules for SafShekan. Use when adding or changing unit tests for fee and queue math, sniper policy, or backend HTTP e2e. Do not use for browser E2E, Jest, or database test containers.
---

# Testing Vitest — صف‌شکن

Vitest only. Tests must not call a live broker or TSETMC host. Use fixtures and the Nest app from `createNestApp()`.

## Where tests live

- Pure math (`calculateBuyFee`, `calculateSellFee`, `calculateBreakEvenPrice`, `estimateQueuePosition`) lives in `packages/core/test`.
- Engine policy that does not touch the network (`broker-response`, `shot-policy`) lives in `apps/backend/test` and imports `src/engine/domain`.
- HTTP behavior (config, brokers, sniper arm/disarm, throttling, secret redaction) is supertest e2e under `apps/backend/test`.
- Frontend secret masking, Zod rejection, and the armed disarm control live in `apps/frontend/test` (jsdom). No Playwright or Cypress.

## What not to add

- No Jest `*.spec.ts` beside controllers.
- No PostgreSQL, Testcontainers, or Prisma test database.
- No coverage gate of 80 percent across every file. Cover the paths above.
- No Playwright or Cypress for this backend.

## Shape

Arrange the input, call the function or endpoint, assert the observable result. A secret cookie or `Authorization` value used in a test must be absent from `GET /api/status`.
