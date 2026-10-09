# apps/frontend Component Standards (Strict shadcn/ui)

- **Mandatory shadcn/ui**: All pages, layouts, and components in this application MUST use shadcn/ui components (`@/components/ui/*`).
- **No Native HTML Primitives**: Do not use native `<select>`, `<button>`, `<input>`, `<dialog>`, etc. Always use `<Select>`, `<Button>`, `<Input>`, `<Dialog>`, etc.
- **Scaffold Missing shadcn Components**: If a component does not exist in `src/components/ui/`, install the appropriate Radix UI primitive and scaffold it with Tailwind CSS, Glassmorphism, and RTL support. Never fallback to native HTML.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
