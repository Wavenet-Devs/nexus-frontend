# Graph Report - frontend  (2026-08-27)

## Corpus Check
- 90 files · ~47,544 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 564 nodes · 1216 edges · 25 communities (20 shown, 5 thin omitted)
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
- payments.service.ts
- page.tsx

## God Nodes (most connected - your core abstractions)
1. `formatCurrency()` - 40 edges
2. `Button()` - 38 edges
3. `Card()` - 38 edges
4. `Input()` - 28 edges
5. `cn()` - 22 edges
6. `formatMonth()` - 20 edges
7. `CardHeader()` - 19 edges
8. `CardTitle()` - 19 edges
9. `Dialog()` - 17 edges
10. `useDebounce()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `UnitCostsTab()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/catalogs/page.tsx → src/lib/utils.ts
- `CurrencyTooltip()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/page.tsx → src/lib/utils.ts
- `ReadingsPage()` --calls--> `formatMonth()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/readings/page.tsx → src/lib/utils.ts
- `UsersTab()` --calls--> `useAuthStore`  [EXTRACTED]
  src/app/(dashboard)/dashboard/users/page.tsx → src/store/auth.store.ts
- `PagBtn()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/pagination.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (25 total, 5 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.08
Nodes (26): PAYMENT_TYPES, Step, api, ApiKey, apiKeysService, CreatedApiKey, CreateFinancingDto, FinancingFilters (+18 more)

### Community 1 - "formatCurrency"
Cohesion: 0.10
Nodes (20): ItemRow, Props, RpForm(), AccountingAccount, Budget, BudgetCategory, BudgetCdp, BudgetDetail (+12 more)

### Community 2 - "page.tsx"
Cohesion: 0.08
Nodes (20): ChangePasswordForm, changePasswordSchema, CreateRoleForm, createRoleSchema, CreateUserForm, createUserSchema, EditUserForm, editUserSchema (+12 more)

### Community 3 - "page.tsx"
Cohesion: 0.07
Nodes (31): CountTooltip(), SuperAdminLayout(), FormData, schema, SuperAdminLoginPage(), PLAN_COLORS, PLAN_LABELS, PlatformReportsPage() (+23 more)

### Community 4 - "page.tsx"
Cohesion: 0.09
Nodes (24): BudgetPage(), STATUS_LABELS, STATUS_OPTS, STATUS_STYLES, ClientsPage(), NewFinancingPage(), FinancingPage(), STATUS_LABELS (+16 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): axios, class-variance-authority, clsx, @hookform/resolvers, js-cookie, lucide-react, next, dependencies (+25 more)

### Community 6 - "index.ts"
Cohesion: 0.10
Nodes (25): FormData, LoginPage(), schema, DashboardLayout(), getTitle(), pageTitles, Header(), HeaderProps (+17 more)

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

### Community 24 - "payments.service.ts"
Cohesion: 0.06
Nodes (54): Tab, TABS, CdpForm(), Props, ClientForm(), ClientFormProps, FormData, schema (+46 more)

### Community 25 - "page.tsx"
Cohesion: 0.06
Nodes (35): CostRow(), CreditNoteForm, creditNoteSchema, InvoiceDetailPage(), BillingPage(), CURRENT_YEAR, MONTHS, YEARS (+27 more)

## Knowledge Gaps
- **222 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+217 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Card()` connect `payments.service.ts` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `budget.service.ts`, `page.tsx`, `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Button()` connect `payments.service.ts` to `page.tsx`, `formatCurrency`, `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `budget.service.ts`, `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `page.tsx` to `page.tsx`, `formatCurrency`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `payments.service.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _222 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08266129032258064 - nodes in this community are weakly interconnected._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.09881422924901186 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0812807881773399 - nodes in this community are weakly interconnected._