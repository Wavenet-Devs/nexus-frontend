# Graph Report - frontend  (2026-08-22)

## Corpus Check
- 89 files · ~45,520 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 550 nodes · 1174 edges · 25 communities (20 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec335e43`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
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
- pqr.service.ts

## God Nodes (most connected - your core abstractions)
1. `formatCurrency()` - 40 edges
2. `Button()` - 37 edges
3. `Card()` - 37 edges
4. `Input()` - 26 edges
5. `cn()` - 22 edges
6. `formatMonth()` - 20 edges
7. `CardHeader()` - 18 edges
8. `CardTitle()` - 18 edges
9. `useDebounce()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `CostRow()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/billing/[id]/page.tsx → src/lib/utils.ts
- `UnitCostsTab()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/catalogs/page.tsx → src/lib/utils.ts
- `CurrencyTooltip()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/page.tsx → src/lib/utils.ts
- `ReadingsPage()` --calls--> `formatMonth()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/readings/page.tsx → src/lib/utils.ts
- `PagBtn()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/pagination.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (25 total, 5 thin omitted)

### Community 1 - "formatCurrency"
Cohesion: 0.08
Nodes (24): api, ApiKey, apiKeysService, CreatedApiKey, AccountingAccount, Budget, BudgetCategory, BudgetDetail (+16 more)

### Community 2 - "page.tsx"
Cohesion: 0.08
Nodes (19): ChangePasswordForm, changePasswordSchema, CreateRoleForm, createRoleSchema, CreateUserForm, createUserSchema, EditUserForm, editUserSchema (+11 more)

### Community 3 - "page.tsx"
Cohesion: 0.07
Nodes (31): CountTooltip(), SuperAdminLayout(), FormData, schema, SuperAdminLoginPage(), PLAN_COLORS, PLAN_LABELS, PlatformReportsPage() (+23 more)

### Community 4 - "page.tsx"
Cohesion: 0.05
Nodes (53): BillingPage(), CURRENT_YEAR, MONTHS, YEARS, BudgetPage(), STATUS_LABELS, STATUS_OPTS, STATUS_STYLES (+45 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): axios, class-variance-authority, clsx, @hookform/resolvers, js-cookie, lucide-react, next, dependencies (+25 more)

### Community 6 - "index.ts"
Cohesion: 0.08
Nodes (30): FormData, LoginPage(), schema, buildVoucherText(), PAYMENT_TYPES, PaymentDetailPage(), TYPE_COLORS, UsersTab() (+22 more)

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
Cohesion: 0.12
Nodes (13): errorMessage(), InvoiceTemplatePage(), MESES_CORTOS, STATUS_LABEL, BannerSpec, billingService, InvoiceBanner, InvoiceFilters (+5 more)

### Community 11 - "page.tsx"
Cohesion: 0.10
Nodes (12): AGING_COLORS, CurrencyTooltip(), DashboardPage(), fmtM(), STRATA_COLORS, BillingTrendPoint, DashboardPortfolioData, DashboardUsersData (+4 more)

### Community 12 - "page.tsx"
Cohesion: 0.10
Nodes (15): Tab, CURRENT_YEAR, FormValues, MONTHS, num, schema, MONTHS, ReadingsPage() (+7 more)

### Community 13 - "Nexus Frontend"
Cohesion: 0.29
Nodes (6): Autenticación, Comandos, Estructura de páginas, Nexus Frontend, Stack, Variables de entorno

### Community 14 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 23 - "api.ts"
Cohesion: 0.13
Nodes (17): InvoiceDetailPage(), BudgetDetailPage(), FinancingDetailPage(), PqrDetailPage(), STATUS_LABELS, STATUS_STYLES, PqrPage(), STATUS_LABELS (+9 more)

### Community 24 - "payments.service.ts"
Cohesion: 0.07
Nodes (42): CostRow(), CreditNoteForm, creditNoteSchema, Tab, TABS, CdpForm(), Props, ItemRow (+34 more)

### Community 27 - "pqr.service.ts"
Cohesion: 0.19
Nodes (10): ClientForm(), ClientFormProps, FormData, schema, COLUMNS, ClientDetail, ClientFilters, ClientListItem (+2 more)

## Knowledge Gaps
- **218 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+213 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card()` connect `payments.service.ts` to `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `budget.service.ts`, `page.tsx`, `page.tsx`, `api.ts`, `pqr.service.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `Button()` connect `payments.service.ts` to `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `budget.service.ts`, `page.tsx`, `api.ts`, `pqr.service.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `page.tsx` to `page.tsx`, `index.ts`, `page.tsx`, `page.tsx`, `api.ts`, `payments.service.ts`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _218 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.0812807881773399 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08465608465608465 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06763285024154589 - nodes in this community are weakly interconnected._