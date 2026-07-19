# Graph Report - frontend  (2026-07-14)

## Corpus Check
- 87 files · ~41,521 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 529 nodes · 1112 edges · 28 communities (23 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6e57733b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- card.tsx
- formatCurrency
- page.tsx
- page.tsx
- utils.ts
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
- index.ts
- payments.service.ts
- api.ts
- financing.service.ts
- pqr.service.ts

## God Nodes (most connected - your core abstractions)
1. `formatCurrency()` - 40 edges
2. `Button()` - 35 edges
3. `Card()` - 35 edges
4. `Input()` - 23 edges
5. `cn()` - 22 edges
6. `formatMonth()` - 20 edges
7. `CardHeader()` - 17 edges
8. `CardTitle()` - 17 edges
9. `useDebounce()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `UnitCostsTab()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/catalogs/page.tsx → src/lib/utils.ts
- `CurrencyTooltip()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/page.tsx → src/lib/utils.ts
- `PqrDetailPage()` --calls--> `formatDate()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/pqr/[id]/page.tsx → src/lib/utils.ts
- `ReadingBatchPage()` --calls--> `formatMonth()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/readings/[id]/page.tsx → src/lib/utils.ts
- `Badge()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/badge.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (28 total, 5 thin omitted)

### Community 0 - "card.tsx"
Cohesion: 0.07
Nodes (35): Tab, TABS, CdpForm(), Props, COLUMNS, STATUS_CONFIG, Step, PqrDetailPage() (+27 more)

### Community 1 - "formatCurrency"
Cohesion: 0.08
Nodes (31): CostRow(), CreditNoteForm, creditNoteSchema, InvoiceDetailPage(), ItemRow, Props, RpForm(), BudgetDetailPage() (+23 more)

### Community 2 - "page.tsx"
Cohesion: 0.08
Nodes (19): ChangePasswordForm, changePasswordSchema, CreateRoleForm, createRoleSchema, CreateUserForm, createUserSchema, EditUserForm, editUserSchema (+11 more)

### Community 3 - "page.tsx"
Cohesion: 0.05
Nodes (36): AGING_COLORS, CountTooltip(), CurrencyTooltip(), DashboardPage(), fmtM(), STRATA_COLORS, SuperAdminLayout(), FormData (+28 more)

### Community 4 - "utils.ts"
Cohesion: 0.07
Nodes (34): BillingPage(), CURRENT_YEAR, MONTHS, YEARS, BudgetPage(), STATUS_LABELS, STATUS_OPTS, STATUS_STYLES (+26 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): axios, class-variance-authority, clsx, @hookform/resolvers, js-cookie, lucide-react, next, dependencies (+25 more)

### Community 6 - "index.ts"
Cohesion: 0.10
Nodes (24): FormData, LoginPage(), schema, buildVoucherText(), PAYMENT_TYPES, PaymentDetailPage(), TYPE_COLORS, UsersTab() (+16 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 8 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/js-cookie (+19 more)

### Community 9 - "page.tsx"
Cohesion: 0.08
Nodes (21): BILLING_TYPES, SIMPLE_CFG, SimpleType, StratumsTab(), Tab, TABS, UnitCostsTab(), ClientForm() (+13 more)

### Community 10 - "budget.service.ts"
Cohesion: 0.12
Nodes (15): AccountingAccount, Budget, BudgetCategory, BudgetDetail, BudgetFilters, BudgetRp, BudgetTemplate, CreateAccountingAccountDto (+7 more)

### Community 11 - "page.tsx"
Cohesion: 0.20
Nodes (7): BillingTrendPoint, DashboardPortfolioData, DashboardUsersData, MONTHS, reportsService, TariffRecord, DashboardSummary

### Community 12 - "page.tsx"
Cohesion: 0.10
Nodes (12): ReadingBatchPage(), Tab, billingService, InvoiceFilters, InvoiceListItem, InvoiceTemplate, TemplateModule, CreateReadingBatchDto (+4 more)

### Community 13 - "Nexus Frontend"
Cohesion: 0.29
Nodes (6): Autenticación, Comandos, Estructura de páginas, Nexus Frontend, Stack, Variables de entorno

### Community 14 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 23 - "index.ts"
Cohesion: 0.25
Nodes (7): Client, Invoice, LoginResponse, Payment, Printer, Reading, Tenant

### Community 24 - "payments.service.ts"
Cohesion: 0.29
Nodes (6): ClientDebt, CreatePaymentDto, DebtInvoice, InvoiceAllocation, PaymentFilters, PaymentListItem

### Community 25 - "api.ts"
Cohesion: 0.47
Nodes (4): api, ApiKey, apiKeysService, CreatedApiKey

### Community 26 - "financing.service.ts"
Cohesion: 0.33
Nodes (5): CreateFinancingDto, FinancingFilters, FinancingPlan, PayQuotaDto, PaginatedResponse

### Community 27 - "pqr.service.ts"
Cohesion: 0.33
Nodes (5): CreatePqrDto, Pqr, PqrFilters, PqrResponse, RespondPqrDto

## Knowledge Gaps
- **209 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card()` connect `card.tsx` to `formatCurrency`, `page.tsx`, `page.tsx`, `utils.ts`, `index.ts`, `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Button()` connect `card.tsx` to `formatCurrency`, `page.tsx`, `page.tsx`, `utils.ts`, `index.ts`, `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `formatCurrency` to `card.tsx`, `page.tsx`, `utils.ts`, `index.ts`, `page.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07115384615384615 - nodes in this community are weakly interconnected._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.07510204081632653 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08465608465608465 - nodes in this community are weakly interconnected._