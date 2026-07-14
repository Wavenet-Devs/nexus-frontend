import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

// ─── Tipos de lectura (snake_case — como los devuelve el backend) ────────────

export interface Budget {
  id:         string;
  age:        string;
  approved:   number;
  executed:   number;
  diff:       number;
  status:     'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface BudgetCdp {
  id:          string;
  code:        string;
  account:     string;
  category:    string;
  amount:      number;
  executed:    number;
  available:   number;
  description: string;
  create_date: string;
}

export interface BudgetRp {
  id:                   string;
  code:                 string;
  amount:               number;
  type:                 'expense' | 'income';
  execution_time:       string;
  policy:               number;
  description:          string;
  create_date:          string;
  supporting_documents: string;
  cdp_code:             string | null;
  category:             string | null;
  supplier:             string | null;
  supplier_nit:         string | null;
}

export interface BudgetDetail {
  budget:    Budget;
  approved:  number;
  executed:  number;
  available: number;
  diff:      number;
  cdps:      BudgetCdp[];
  rps:       BudgetRp[];
}

export interface BudgetCategory {
  id: string; code: string; name: string; type: 'M' | 'A'; group: 'I' | 'G'; service: string;
}
export interface AccountingAccount { id: string; code: string; name: string; }
export interface Supplier { id: string; name: string; nit: string; contract: string; }

// ─── DTOs de escritura (camelCase — lo que espera el API) ─────────────────────

export interface CreateBudgetDto { age: string; approved: number; }
export interface UpdateBudgetDto { age?: string; approved?: number; status?: string; }

export interface CreateCdpDto {
  budgetId: string; accountId: string; categoryId: string;
  amount: number; description: string; createDate?: string;
}

export interface RpItem { id: string; amount: number; }
export interface CreateRpDto {
  budgetId: string;
  type: 'expense' | 'income';
  supplierId?: string;
  items: RpItem[];
  executionTime?: string;
  policy?: number;
  description?: string;
  createDate?: string;
  supportingDocuments?: string;
}

export interface CreateBudgetCategoryDto { code: string; name: string; type: string; group: string; service?: string; }
export interface CreateAccountingAccountDto { code: string; name: string; }
export interface CreateSupplierDto { name: string; nit: string; contract?: string; }

export interface BudgetFilters { search?: string; status?: string; page?: number; limit?: number; }

export interface BudgetTemplate {
  companyName: string; companyNit: string; companyAddress: string; companyPhone: string;
  city: string; signerName: string; signerTitle: string; logoUrl: string; primaryColor: string;
}

function certificateUrl(path: string): string {
  const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
  const slug  = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '';
  return `${base}${path}?token=${token}&slug=${slug}`;
}

export const budgetService = {
  // Presupuestos
  findAll: (filters: BudgetFilters = {}) =>
    api.get<PaginatedResponse<Budget>>('/budget', { params: filters }).then((r) => r.data),
  findOne: (id: string) =>
    api.get<BudgetDetail>(`/budget/${id}`).then((r) => r.data),
  create: (dto: CreateBudgetDto) =>
    api.post<Budget>('/budget', dto).then((r) => r.data),
  update: (id: string, dto: UpdateBudgetDto) =>
    api.patch<Budget>(`/budget/${id}`, dto).then((r) => r.data),

  // Rubros
  listCategories: () =>
    api.get<BudgetCategory[]>('/budget/categories').then((r) => r.data),
  createCategory: (dto: CreateBudgetCategoryDto) =>
    api.post<BudgetCategory>('/budget/categories', dto).then((r) => r.data),
  updateCategory: (id: string, dto: Partial<CreateBudgetCategoryDto>) =>
    api.patch<BudgetCategory>(`/budget/categories/${id}`, dto).then((r) => r.data),
  deleteCategory: (id: string) =>
    api.delete(`/budget/categories/${id}`).then((r) => r.data),

  // Cuentas contables
  listAccounts: () =>
    api.get<AccountingAccount[]>('/budget/accounts').then((r) => r.data),
  createAccount: (dto: CreateAccountingAccountDto) =>
    api.post<AccountingAccount>('/budget/accounts', dto).then((r) => r.data),
  updateAccount: (id: string, dto: Partial<CreateAccountingAccountDto>) =>
    api.patch<AccountingAccount>(`/budget/accounts/${id}`, dto).then((r) => r.data),
  deleteAccount: (id: string) =>
    api.delete(`/budget/accounts/${id}`).then((r) => r.data),

  // Proveedores
  listSuppliers: () =>
    api.get<Supplier[]>('/budget/suppliers').then((r) => r.data),
  createSupplier: (dto: CreateSupplierDto) =>
    api.post<Supplier>('/budget/suppliers', dto).then((r) => r.data),
  updateSupplier: (id: string, dto: Partial<CreateSupplierDto>) =>
    api.patch<Supplier>(`/budget/suppliers/${id}`, dto).then((r) => r.data),
  deleteSupplier: (id: string) =>
    api.delete(`/budget/suppliers/${id}`).then((r) => r.data),

  // CDP / RP
  createCdp: (dto: CreateCdpDto) =>
    api.post('/budget/cdp', dto).then((r) => r.data),
  createRp: (dto: CreateRpDto) =>
    api.post('/budget/rp', dto).then((r) => r.data),
  cdpCertificateUrl: (id: string) => certificateUrl(`/budget/cdp/${id}/certificate`),
  rpCertificateUrl:  (id: string) => certificateUrl(`/budget/rp/${id}/certificate`),

  // Plantilla del certificado
  getTemplate: () =>
    api.get<BudgetTemplate>('/budget/template').then((r) => r.data),
  updateTemplate: (dto: Partial<BudgetTemplate>) =>
    api.put<BudgetTemplate>('/budget/template', dto).then((r) => r.data),
};
