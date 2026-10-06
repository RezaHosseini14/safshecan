# Agent Autonomy & Execution Rules

- **Autonomy**: Execute all tasks, terminal commands, builds, tests, and file modifications proactively without pausing to ask for permission or user confirmation.
- **Direct Execution**: When given an objective, diagnose and implement the necessary changes, run validations, and report results upon completion. Do not ask "Would you like me to run this?" or "Should I proceed?".
- **No Unnecessary Prompts**: Minimize interactive questions and confirmation dialogs unless an ambiguous architectural decision or critical data-loss ambiguity strictly requires user input.

# Frontend UI & Component Standards (Mandatory shadcn/ui)

- **Mandatory shadcn/ui Components**: When developing, creating, or modifying any page, modal, card, dialog, form, or section in the web application (`apps/web`), **ALL interactive UI elements and form controls MUST use shadcn/ui components** located in `@/components/ui/*`.
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
- **Automatic Scaffolding of Missing Components**: If a required shadcn/ui component does not exist in `apps/web/src/components/ui/`:
  1. Install the required Radix UI dependency (e.g., `pnpm --filter @saf-shekan/web add @radix-ui/react-...`).
  2. Implement the component in `apps/web/src/components/ui/<component>.tsx` with the project's design system (Tailwind CSS, Glassmorphism, Dark/Light mode tokens, and RTL support).
  3. Import and use the shadcn component. **Never fall back to native HTML tags**.
- **Design System Consistency**: Preserve glassmorphism aesthetics, Iranian stock market domain formatting (Yekan Bakh font, RTL, Rial/Toman conversions, Lucide icons), and accessible focus states across all components.
