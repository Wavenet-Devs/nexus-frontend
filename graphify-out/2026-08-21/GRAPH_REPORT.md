# Graph Report - frontend  (2026-08-21)

## Corpus Check
- 88 files · ~43,757 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 541 nodes · 1145 edges · 24 communities (19 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec335e43`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- card.tsx
- formatCurrency
- page.tsx
- page.tsx
- dependencies
- index.ts
- compilerOptions
- devDependencies
- page.tsx
- budget.service.ts
- page.tsx
- page.tsx
- Nexus Frontend
- layout.tsx
- AGENTS.md
- CLAUDE.md
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- payments.service.ts
- pqr.service.ts

## God Nodes (most connected - your core abstractions)
1. `formatCurrency()` - 40 edges
2. `Button()` - 36 edges
3. `Card()` - 36 edges
4. `Input()` - 25 edges
5. `cn()` - 22 edges
6. `formatMonth()` - 20 edges
7. `CardHeader()` - 17 edges
8. `CardTitle()` - 17 edges
9. `useDebounce()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CostRow()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/billing/[id]/page.tsx → src/lib/utils.ts
- `UnitCostsTab()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/catalogs/page.tsx → src/lib/utils.ts
- `ReadingBatchPage()` --calls--> `formatMonth()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/readings/[id]/page.tsx → src/lib/utils.ts
- `ReadingsPage()` --calls--> `formatMonth()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/readings/page.tsx → src/lib/utils.ts
- `PagBtn()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/pagination.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (24 total, 5 thin omitted)

### Community 0 - "card.tsx"
Cohesion: 0.06
Nodes (41): CostRow(), CreditNoteForm, creditNoteSchema, CURRENT_YEAR, MONTHS, YEARS, BudgetDetailPage(), COLUMNS (+33 more)

### Community 1 - "formatCurrency"
Cohesion: 0.07
Nodes (32): Tab, TABS, CdpForm(), Props, ItemRow, Props, RpForm(), ConfirmDialog() (+24 more)

### Community 2 - "page.tsx"
Cohesion: 0.08
Nodes (19): ChangePasswordForm, changePasswordSchema, CreateRoleForm, createRoleSchema, CreateUserForm, createUserSchema, EditUserForm, editUserSchema (+11 more)

### Community 3 - "page.tsx"
Cohesion: 0.07
Nodes (28): SuperAdminLayout(), FormData, schema, SuperAdminLoginPage(), PLAN_COLORS, PLAN_LABELS, PLAN_STYLES, TenantDetailPage() (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): axios, class-variance-authority, clsx, @hookform/resolvers, js-cookie, lucide-react, next, dependencies (+25 more)

### Community 6 - "index.ts"
Cohesion: 0.09
Nodes (27): FormData, LoginPage(), schema, UsersTab(), DashboardLayout(), getTitle(), pageTitles, Header() (+19 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 8 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/js-cookie (+19 more)

### Community 9 - "page.tsx"
Cohesion: 0.11
Nodes (12): BILLING_TYPES, SIMPLE_CFG, SimpleType, StratumsTab(), Tab, TABS, UnitCostsTab(), CatalogItem (+4 more)

### Community 10 - "budget.service.ts"
Cohesion: 0.06
Nodes (30): errorMessage(), InvoiceTemplatePage(), STATUS_LABEL, api, ApiKey, CreatedApiKey, billingService, InvoiceFilters (+22 more)

### Community 11 - "page.tsx"
Cohesion: 0.06
Nodes (32): InvoiceDetailPage(), BillingPage(), ClientDetailPage(), AGING_COLORS, CountTooltip(), CurrencyTooltip(), DashboardPage(), fmtM() (+24 more)

### Community 12 - "page.tsx"
Cohesion: 0.11
Nodes (14): ReadingBatchPage(), Tab, CURRENT_YEAR, FormValues, MONTHS, num, schema, CreateReadingBatchDto (+6 more)

### Community 13 - "Nexus Frontend"
Cohesion: 0.29
Nodes (6): Autenticación, Comandos, Estructura de páginas, Nexus Frontend, Stack, Variables de entorno

### Community 14 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 24 - "payments.service.ts"
Cohesion: 0.09
Nodes (28): BudgetPage(), STATUS_LABELS, STATUS_OPTS, STATUS_STYLES, ClientsPage(), NewFinancingPage(), FinancingPage(), STATUS_LABELS (+20 more)

### Community 27 - "pqr.service.ts"
Cohesion: 0.26
Nodes (9): ClientForm(), ClientFormProps, FormData, schema, Select(), ClientDetail, ClientFilters, ClientListItem (+1 more)

## Knowledge Gaps
- **215 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+210 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card()` connect `card.tsx` to `formatCurrency`, `page.tsx`, `page.tsx`, `page.tsx`, `budget.service.ts`, `page.tsx`, `page.tsx`, `payments.service.ts`, `pqr.service.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Button()` connect `card.tsx` to `formatCurrency`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `budget.service.ts`, `page.tsx`, `page.tsx`, `payments.service.ts`, `pqr.service.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `page.tsx` to `card.tsx`, `formatCurrency`, `page.tsx`, `page.tsx`, `payments.service.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06315789473684211 - nodes in this community are weakly interconnected._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.06570048309178744 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08465608465608465 - nodes in this community are weakly interconnected._