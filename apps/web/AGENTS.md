# apps/web Component Standards (Strict shadcn/ui)

- **Mandatory shadcn/ui**: All pages, layouts, and components in this application MUST use shadcn/ui components (`@/components/ui/*`).
- **No Native HTML Primitives**: Do not use native `<select>`, `<button>`, `<input>`, `<dialog>`, etc. Always use `<Select>`, `<Button>`, `<Input>`, `<Dialog>`, etc.
- **Scaffold Missing shadcn Components**: If a component does not exist in `src/components/ui/`, install the appropriate Radix UI primitive and scaffold it with Tailwind CSS, Glassmorphism, and RTL support. Never fallback to native HTML.
