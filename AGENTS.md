# Agent Autonomy & Execution Rules

- **Autonomy**: Execute all tasks, terminal commands, builds, tests, and file modifications proactively without pausing to ask for permission or user confirmation.
- **Direct Execution**: When given an objective, diagnose and implement the necessary changes, run validations, and report results upon completion. Do not ask "Would you like me to run this?" or "Should I proceed?".
- **No Unnecessary Prompts**: Minimize interactive questions and confirmation dialogs unless an ambiguous architectural decision or critical data-loss ambiguity strictly requires user input.

# Rules and skills

Structure only. Frontend visual source is the Stitch terminal. Do not port ZARVA layouts, icons, or page anatomy.

**Rules:** `.cursor/rules/core.mdc` and `zero-nextjs-issues.mdc` (always). On demand: `architecture`, `components`, `frontend`, `typescript`, `security`, `testing`, `market-domain`, `documentation`.

**Frontend skills:** `saf-shekan-frontend`, then `vercel-react-best-practices`, `vercel-composition-patterns`, `building-components`, `react-expert`. `shadcn` only when adding a missing primitive. Security and tests: `testing-vitest`, `security-test-generator`, `injection-checker`, `api-security-review`.

**Backend skills:** `saf-shekan-backend`, then `nestjs-architecture-principles`, `nestjs-best-practices`, `nestjs-oop-design-patterns`, `nestjs-features-performance`, `nestjs-code-audit`. Security: `api-security-review`, `injection-checker`, `openapi-hardener`, `security-test-generator`. Tests: `testing-vitest`.

**Cross-cutting:** `market-domain`.

# Frontend UI & Component Standards (Mandatory shadcn/ui)

- **Mandatory shadcn/ui Components**: When developing, creating, or modifying any page, modal, card, dialog, form, or section in the web application (`apps/frontend`), **ALL interactive UI elements and form controls MUST use shadcn/ui components** located in `@/components/ui/*`.
- **Zero Tolerance for Native HTML Primitives**: Never use raw native HTML tags when a corresponding shadcn/ui component exists:
  - **Selects**: Always use `<Select>`, `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>`, `<SelectValue>`. NEVER use raw `<select>` or `<option>`.
  - **Buttons**: Always use `<Button variant="..." size="...">`. Do not use plain `<button>` unless it is an unstyled Radix trigger/primitive slot.
  - **Inputs**: Always use `<Input>` from `@/components/ui/input`.
  - **Labels**: Always use `<Label>` from `@/components/ui/label`.
  - **Dialogs & Modals**: Always use `<Dialog>`, `<DialogContent>`, `<DialogHeader>`, `<DialogTitle>`, `<DialogDescription>` from `@/components/ui/dialog`.
  - **Switches & Checkboxes**: Always use `<Switch>` and `<Checkbox>` from `@/components/ui/*`.
  - **Tabs**: Always use `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`.
  - **Tables**: Always use `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableBody>`, `<TableCell>`.
  - **Badges**: Always use `<Badge>` from `@/components/ui/badge`.
  - **Dropdowns**: Always use `<DropdownMenu>`, `<DropdownMenuTrigger>`, `<DropdownMenuContent>`, `<DropdownMenuItem>`.
- **Automatic Scaffolding of Missing Components**: If a required shadcn/ui component does not exist in `apps/frontend/src/components/ui/`:
  1. Install the required Radix UI dependency (e.g., `pnpm --filter @saf-shekan/frontend add @radix-ui/react-...`).
  2. Implement the component in `apps/frontend/src/components/ui/<component>.tsx` with the project's design system (Tailwind CSS, Glassmorphism, Dark/Light mode tokens, and RTL support).
  3. Import and use the shadcn component. **Never fall back to native HTML tags**.
- **Design System Consistency**: Stitch terminal tokens (dark canvas, hairline borders, emerald/cyan/amber/rose), RTL, Rial stored and Toman shown as `/ 10`, JetBrains Mono for figures, Lucide icons, and accessible focus states.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
