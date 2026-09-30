# Graph Report - frontend  (2026-09-30)

## Corpus Check
- 101 files · ~56,483 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 625 nodes · 1385 edges · 34 communities (29 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f87635c4`
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
- dialog.tsx
- payments.service.ts
- page.tsx
- card.tsx
- page.tsx
- button.tsx
- input.tsx
- utils.ts
- page.tsx
- page.tsx

## God Nodes (most connected - your core abstractions)
1. `formatCurrency()` - 46 edges
2. `Button()` - 43 edges
3. `Card()` - 40 edges
4. `Input()` - 32 edges
5. `cn()` - 24 edges
6. `CardHeader()` - 21 edges
7. `CardTitle()` - 21 edges
8. `formatMonth()` - 20 edges
9. `Dialog()` - 18 edges
10. `useDebounce()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `CurrencyTooltip()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/page.tsx → src/lib/utils.ts
- `PagBtn()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/pagination.tsx → src/lib/utils.ts
- `LoginForm()` --calls--> `useAuthStore`  [EXTRACTED]
  src/app/(auth)/login/page.tsx → src/store/auth.store.ts
- `CostRow()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/billing/[id]/page.tsx → src/lib/utils.ts
- `BillingPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/app/(dashboard)/dashboard/billing/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (34 total, 5 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.17
Nodes (12): PAYMENT_TYPES, Step, ClientDebt, CollectionsImportResult, CreatePaymentDto, DebtInvoice, InvoiceAllocation, PaymentFilters (+4 more)

### Community 1 - "formatCurrency"
Cohesion: 0.07
Nodes (28): AccountingAccount, Budget, BudgetCategory, BudgetDetail, BudgetFilters, BudgetRp, BudgetTemplate, CreateAccountingAccountDto (+20 more)

### Community 2 - "page.tsx"
Cohesion: 0.06
Nodes (36): ChangePasswordForm, changePasswordSchema, CreateRoleForm, createRoleSchema, CreateUserForm, createUserSchema, EditUserForm, editUserSchema (+28 more)

### Community 3 - "page.tsx"
Cohesion: 0.07
Nodes (31): CountTooltip(), SuperAdminLayout(), FormData, schema, SuperAdminLoginPage(), PLAN_COLORS, PLAN_LABELS, PlatformReportsPage() (+23 more)

### Community 4 - "page.tsx"
Cohesion: 0.07
Nodes (33): BillingPage(), CURRENT_YEAR, MONTHS, YEARS, BudgetPage(), STATUS_LABELS, STATUS_OPTS, STATUS_STYLES (+25 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (33): axios, class-variance-authority, clsx, @hookform/resolvers, js-cookie, lucide-react, next, dependencies (+25 more)

### Community 6 - "index.ts"
Cohesion: 0.09
Nodes (23): FormData, schema, FormData, LoginForm(), schema, FormData, schema, ApiKeysPage() (+15 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 8 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/js-cookie (+19 more)

### Community 9 - "page.tsx"
Cohesion: 0.11
Nodes (11): BILLING_TYPES, SIMPLE_CFG, SimpleType, StratumsTab(), Tab, TABS, CatalogItem, Causal (+3 more)

### Community 10 - "budget.service.ts"
Cohesion: 0.18
Nodes (6): errorMessage(), InvoiceTemplatePage(), MESES_CORTOS, STATUS_LABEL, InvoiceTemplate, InvoiceTemplateSummary

### Community 11 - "page.tsx"
Cohesion: 0.10
Nodes (12): AGING_COLORS, CurrencyTooltip(), DashboardPage(), fmtM(), STRATA_COLORS, BillingTrendPoint, DashboardPortfolioData, DashboardUsersData (+4 more)

### Community 12 - "page.tsx"
Cohesion: 0.12
Nodes (15): Tab, MONTHS, BATCH_STATUS_LABEL, BatchStatusBadge(), COLOR, isReopen(), TRANSITION_ACTION, ImportResult (+7 more)

### Community 13 - "Nexus Frontend"
Cohesion: 0.22
Nodes (8): Autenticación, Comandos, Empresa por hostname, Estructura de páginas, Nexus Frontend, Producción, Stack, Variables de entorno

### Community 14 - "layout.tsx"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 23 - "dialog.tsx"
Cohesion: 0.17
Nodes (10): Tab, TABS, errorMessage(), NewGroupDialog(), ConfirmDialog(), ConfirmDialogProps, Dialog(), DialogProps (+2 more)

### Community 24 - "payments.service.ts"
Cohesion: 0.11
Nodes (22): ClientForm(), ClientFormProps, FormData, schema, ClientImportPage(), COLUMNS, apiMessage(), ReadingBatchPage() (+14 more)

### Community 25 - "page.tsx"
Cohesion: 0.06
Nodes (33): CostRow(), CreditNoteForm, creditNoteSchema, InvoiceDetailPage(), BudgetDetailPage(), UnitCostsTab(), ClientDetailPage(), NotaCreditoDeudaDialog() (+25 more)

### Community 26 - "card.tsx"
Cohesion: 0.22
Nodes (8): Step, SettingsForm, SETTINGS_SECTIONS, Card(), CardHeader(), CardProps, CardTitle(), Input()

### Community 27 - "page.tsx"
Cohesion: 0.14
Nodes (14): errorMessage(), MESES, UploadDialog(), BannerSpec, BatchRecalcResult, BillingGenerationRun, billingService, DebtCreditNote (+6 more)

### Community 28 - "button.tsx"
Cohesion: 0.26
Nodes (10): CdpForm(), Props, ItemRow, Props, RpForm(), Button(), ButtonProps, Select() (+2 more)

### Community 29 - "input.tsx"
Cohesion: 0.18
Nodes (5): PAYMENT_TYPES, TYPE_COLORS, InputProps, SelectProps, catalogsService

### Community 30 - "utils.ts"
Cohesion: 0.42
Nodes (7): Badge(), BadgeProps, SimpleBadgeProps, StatusBadge(), cn(), getStatusColor(), getStatusLabel()

### Community 31 - "page.tsx"
Cohesion: 0.25
Nodes (6): CURRENT_YEAR, FormValues, MONTHS, num, schema, CreateReadingBatchDto

### Community 32 - "page.tsx"
Cohesion: 0.50
Nodes (4): CompanyForm, CompanySettingsPage(), EMPTY, errorMessage()

## Knowledge Gaps
- **232 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+227 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `button.tsx` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `budget.service.ts`, `page.tsx`, `dialog.tsx`, `payments.service.ts`, `page.tsx`, `card.tsx`, `page.tsx`, `input.tsx`, `utils.ts`, `page.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `Card()` connect `card.tsx` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `page.tsx`, `budget.service.ts`, `page.tsx`, `page.tsx`, `dialog.tsx`, `payments.service.ts`, `page.tsx`, `page.tsx`, `button.tsx`, `input.tsx`, `utils.ts`, `page.tsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `formatCurrency()` connect `page.tsx` to `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `card.tsx`, `button.tsx`, `input.tsx`, `utils.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _232 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `formatCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.06653225806451613 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06763285024154589 - nodes in this community are weakly interconnected._