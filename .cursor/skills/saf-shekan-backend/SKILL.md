---
name: saf-shekan-backend
description: >
  SafShekan NestJS 12 backend playbook (sniper engine, brokers, time-sync,
  connection pool). Use when building apps/backend APIs, DTOs, or the trading engine.
---

# SafShekan backend

## Stack

- NestJS 12, class-validator, Helmet, Throttler, Swagger, `ws`
- Domain types from `@saf-shekan/core`
- Config file on disk (broker cookies and tokens). No Prisma in this app

## Always

1. Controller → service. Broker I/O stays in the brokers module
2. DTOs with class-validator; shapes match core interfaces
3. Do not log cookies, Authorization headers, or raw cURL
4. Order timing and fee math stay in core or the sniper service — not in controllers
5. Load `nestjs-architecture-principles` and `nestjs-best-practices` for Nest structure. Load `testing-vitest` for tests. Product security in `.cursor/rules/security.mdc` wins over generic OWASP auth advice.

## Delegate

| Task | Skill |
| --- | --- |
| Nest structure | `nestjs-architecture-principles` |
| Nest patterns | `nestjs-best-practices` |
| API review | `api-security-review` |
| Tests | `testing-vitest` |
