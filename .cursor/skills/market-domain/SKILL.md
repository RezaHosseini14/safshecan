---
name: market-domain
description: >
  Tehran stock sniper domain rules for SafShekan (prices, fees, time sync,
  queue, broker presets). Use when changing orders, timing, fees, or broker payloads.
  This is the project domain skill — not ZARVA jewelry gold-domain.
---

# Market domain

Ledger of a shot, not a jewelry invoice. Follow `.cursor/rules/market-domain.mdc`.

- Rial stored, Toman displayed as `/ 10`
- No invented prices, NAV, or queue rank
- Fees only via `@saf-shekan/core`
- Clock offset only via time-sync
- Engine state enum is closed
- One confirmed fill stops the logical order when `stopOnFirstSuccess` or `antiDoubleSpend` says so
