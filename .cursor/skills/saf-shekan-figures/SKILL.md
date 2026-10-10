---
name: saf-shekan-figures
description: >
  Splits SafShekan UI type so only digits use JetBrains Mono inside Num, and
  every word, label, unit, placeholder, title, status badge, and table header
  stays Yekan Bakh. Use when editing apps/frontend copy, num-mono, font-mono,
  prices, percents, or Persian digits.
---

# SafShekan figures

Body type is already Yekan Bakh. Do not change `apps/frontend/src/app/layout.tsx` (`--font-yekan-bakh` from `joys-yekan-bakh-vf.woff2`, not the FaNum file) or the `--font-sans` link in `apps/frontend/src/app/globals.css`.

Digits go only in the existing [`Num`](apps/frontend/src/components/num.tsx) (`num-mono`, `dir="ltr"`). Do not add another number component. Do not put `num-mono` or `font-mono` on a tag that also contains a word.

```tsx
<span>سقف <Num>{formatNumber(pMax)}</Num> ریال</span>
<span><Num>{latencyMs}</Num> ms</span>
<span>ISIN: <Num>{isin}</Num></span>
```

Anything that is not a digit is Yekan Bakh: Persian words, labels, units, placeholders, titles, status badges, table headers. Persian digits (`۰-۹`) are forbidden; use English digits inside `Num`.

## Split

If `num-mono` or `font-mono` is on a parent whose children mix words and digits, remove the class from the parent. Leave the word and the unit outside. Only the numeric value goes in `Num`.

Units that stay outside: ریال، تومان، سهم، سقف، کف، حجم، حجم مبنا، `ms`، `OFFSET`، `RTT`، `LEAD-TIME`، `TARGET`، `ISIN:`، and a trailing `%`.

Do not change `formatSignedMs` or `formatPct`. Those strings are also spoken. Strip `ms` and `%` only at render time.

Search `apps/frontend/src` for `num-mono` and `font-mono`, including `components` and `components/ui`. No page is exempt (`/`, `/watcher`, `/reports`).

## Leave alone

- Inputs that accept only digits (price, quantity, target time) may keep `num-mono`.
- The large clock and the countdown, when they are digits only.
- Latin footer `v2.0`, `textarea`, the live terminal, and `pre` of a Latin log or JSON.
- The `CTRL+K` mark stays `font-mono`. On the symbol search `Input`, remove `font-mono` so the Persian placeholder is Yekan Bakh. Do not change `max-h-72`, the select styling, the virtual list, the 10000 catalog cap, `onSelect`, the live price, or the base-volume display.
- Chart axis `fontFamily: 'JetBrains Mono'` stays, because the axis is digits. Do not draw a Persian word (such as سقف) in that canvas font. The HTML label carries the word.
- Do not invent prices. Rial is stored. Toman is divide by 10 with the label تومان.
- Features do not import each other. Controls stay shadcn.

## Check

From the repo root, after a frontend change: `pnpm --filter @saf-shekan/frontend lint` and, when routes or shared UI changed, `pnpm --filter @saf-shekan/frontend build`.
