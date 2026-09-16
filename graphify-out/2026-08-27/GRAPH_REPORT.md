# Graph Report - frontend  (2026-08-22)

## Corpus Check
- 90 files · ~46,936 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 560 nodes · 1204 edges · 29 communities (24 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec335e43`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- formatCurrency
- page.tsx
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
- api.ts
- payments.service.ts
- page.tsx
- page.tsx
- pqr.service.ts
- utils.ts

## God Nodes (most connected - your core abstractions)
1. `formatCurrency()` - 40 edges
2. `Button()` - 38 edges
3. `Card()` - 38 edges
4. `Input()` - 27 edges
5. `cn()` - 22 edges
6. `formatMonth()` - 20 edges
7. `CardHeader()` - 19 edges
8. `CardTitle()` - 19 edges
9. `useDebounce()` - 17 edges
10. `Dialog()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `UnitCostsTab()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/catalogs/page.tsx → src/lib/utils.ts
- `CurrencyTooltip()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/page.tsx → src/lib/utils.ts
- `PqrDetailPage()` --calls--> `formatDate()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/pqr/[id]/page.tsx → src/lib/utils.ts
- `ReadingsPage()` --calls--> `formatMonth()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/readings/page.tsx → src/lib/utils.ts
- `PaymentsReport()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/reports/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (29 total, 5 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.13
Nodes (14): NewPaymentPage(), PAYMENT_TYPES, Step, CURRENT_YEAR, MONTHS, PAYMENT_TYPES, TYPE_COLORS, ClientDebt (+6 more)

### Community 1 - "formatCurrency"
Cohesion: 0.05
Nodes (37): Props, PqrDetailPage(), STATUS_LABELS, STATUS_STYLES, api, ApiKey, apiKeysService, CreatedApiKey (+29 more)

### Community 2 - "page.tsx"
Cohesion: 0.08
Nodes (20): ChangePasswordForm, changePasswordSchema, CreateRoleForm, createRoleSchema, CreateUserForm, createUserSchema, EditUserForm, editUserSchema (+12 more)

### Community 3 - "page.tsx"
Cohesion: 0.07
Nodes (31): CountTooltip(), SuperAdminLayout(), FormData, schema, SuperAdminLoginPage(), PLAN_COLORS, PLAN_LABELS, PlatformReportsPage() (+23 more)

### Community 4 - "page.tsx"
Cohesion: 0.12
Nodes (19): BudgetPage(), STATUS_LABELS, STATUS_OPTS, STATUS_STYLES, ClientsPage(), NewFinancingPage(), FinancingPage(), STATUS_LABELS (+11 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): axios, class-variance-authority, clsx, @hookform/resolvers, js-cookie, lucide-react, next, dependencies (+25 more)

### Community 6 - "index.ts"
Cohesion: 0.08
Nodes (29): FormData, LoginPage(), schema, buildVoucherText(), PAYMENT_TYPES, PaymentDetailPage(), TYPE_COLORS, DashboardLayout() (+21 more)

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
Cohesion: 0.10
Nodes (16): errorMessage(), MESES, UploadDialog(), errorMessage(), InvoiceTemplatePage(), MESES_CORTOS, STATUS_LABEL, BannerSpec (+8 more)

### Community 11 - "page.tsx"
Cohesion: 0.10
Nodes (12): AGING_COLORS, CurrencyTooltip(), DashboardPage(), fmtM(), STRATA_COLORS, BillingTrendPoint, DashboardPortfolioData, DashboardUsersData (+4 more)

### Community 12 - "page.tsx"
Cohesion: 0.11
Nodes (13): Tab, CURRENT_YEAR, FormValues, MONTHS, num, schema, CreateReadingBatchDto, ImportResult (+5 more)

### Community 13 - "Nexus Frontend"
Cohesion: 0.29
Nodes (6): Autenticación, Comandos, Estructura de páginas, Nexus Frontend, Stack, Variables de entorno

### Community 14 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 23 - "api.ts"
Cohesion: 0.18
Nodes (9): CostRow(), CreditNoteForm, creditNoteSchema, InvoiceDetailPage(), BudgetDetailPage(), ClientDetailPage(), FinancingDetailPage(), formatCurrency() (+1 more)

### Community 24 - "payments.service.ts"
Cohesion: 0.09
Nodes (34): Tab, TABS, CdpForm(), Props, ItemRow, RpForm(), errorMessage(), NewGroupDialog() (+26 more)

### Community 25 - "page.tsx"
Cohesion: 0.13
Nodes (11): ReadingBatchPage(), BillingReport(), CollectionsReport(), CURRENT_YEAR, CutReport(), MissingReport(), MONTHS, PaymentsReport() (+3 more)

### Community 26 - "page.tsx"
Cohesion: 0.20
Nodes (8): BillingPage(), CURRENT_YEAR, MONTHS, YEARS, MONTHS, ReadingsPage(), EmptyState(), EmptyStateProps

### Community 27 - "pqr.service.ts"
Cohesion: 0.14
Nodes (14): ClientForm(), ClientFormProps, FormData, schema, COLUMNS, ClientDetail, ClientFilters, ClientGroup (+6 more)

### Community 28 - "utils.ts"
Cohesion: 0.48
Nodes (5): BadgeProps, SimpleBadgeProps, StatusBadge(), getStatusColor(), getStatusLabel()

## Knowledge Gaps
- **220 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card()` connect `payments.service.ts` to `page.tsx`, `formatCurrency`, `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `budget.service.ts`, `page.tsx`, `page.tsx`, `api.ts`, `page.tsx`, `page.tsx`, `pqr.service.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Button()` connect `payments.service.ts` to `page.tsx`, `formatCurrency`, `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `budget.service.ts`, `page.tsx`, `api.ts`, `page.tsx`, `page.tsx`, `pqr.service.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `api.ts` to `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `page.tsx`, `payments.service.ts`, `page.tsx`, `page.tsx`, `utils.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.05391120507399577 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0812807881773399 - nodes in this community are weakly interconnected._