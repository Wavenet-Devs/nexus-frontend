import { api } from '@/lib/api';
import type { DashboardSummary } from '@/types';

// Download a blob from an authenticated endpoint and trigger browser save
async function downloadXlsx(path: string, filename: string, params?: Record<string, any>) {
  const res = await api.get(path, {
    params,
    responseType: 'blob',
  });
  const url  = URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function periodLabel(month?: number, year?: number) {
  if (month && year) return `${MONTHS[(month - 1) % 12]}-${year}`;
  return 'all';
}

export interface DashboardUsersData {
  totals:          { total: number; active: number; inactive: number };
  byStratum:       { name: string; code: string; count: number }[];
  byNeighborhood:  { name: string; count: number }[];
  byCausal:        { name: string; code: number; count: number }[];
}

export interface BillingTrendPoint {
  year: number; month: number; label: string;
  billed: number; collected: number; pending: number; invoices: number;
}

export interface TariffRecord {
  id: string; generation: number; distribution: number;
  marketing: number; losses: number; cu: number;
  status: string; created_at: string;
}

export interface DashboardPortfolioData {
  totals:         { clients_with_debt: number; invoices_with_debt: number; total_debt: number; avg_aging_days: number };
  byNeighborhood: { neighborhood: string; clients: number; debt: number }[];
  byAging:        { bucket: string; invoices: number; debt: number }[];
  topDebtors:     { contract: string; client_name: string; neighborhood: string; unpaid_invoices: number; total_debt: number; max_aging_days: number }[];
}

export const reportsService = {
  getReadingsPrintUrl: (): string => {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const slug  = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '';
    return `${base}/reports/readings-list/print?token=${token}&slug=${slug}`;
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  getSummary: () =>
    api.get<DashboardSummary>('/reports/summary').then((r) => r.data),

  getDashboardUsers: () =>
    api.get<DashboardUsersData>('/reports/dashboard/users').then((r) => r.data),

  getDashboardBillingTrend: () =>
    api.get<BillingTrendPoint[]>('/reports/dashboard/billing-trend').then((r) => r.data),

  getDashboardTariffs: () =>
    api.get<TariffRecord[]>('/reports/dashboard/tariffs').then((r) => r.data),

  getDashboardPortfolio: () =>
    api.get<DashboardPortfolioData>('/reports/dashboard/portfolio').then((r) => r.data),

  getDashboardCosts: () =>
    api.get<{
      totals:    { total_costo: number; total_subsidio: number; total_kwh: number };
      byMonth:   { label: string; costo_total: number; subsidio: number; sub_total: number; kwh: number }[];
      byStratum: { estrato: string; code: string; costo_total: number; subsidio: number; kwh: number }[];
    }>('/reports/dashboard/costs').then((r) => r.data),

  // ── Billing ──────────────────────────────────────────────────────────────
  getBilling: (month?: number, year?: number) =>
    api.get<any[]>('/reports/billing', { params: { month, year } }).then((r) => r.data),

  exportBilling: (month?: number, year?: number) =>
    downloadXlsx('/reports/billing/export', `facturacion-${periodLabel(month, year)}.xlsx`, { month, year }),

  // ── Payments ─────────────────────────────────────────────────────────────
  getPayments: (from?: string, to?: string) =>
    api.get<any[]>('/reports/payments', { params: { from, to } }).then((r) => r.data),

  exportPayments: (from?: string, to?: string) =>
    downloadXlsx('/reports/payments/export', `pagos-${from ?? 'all'}.xlsx`, { from, to }),

  // ── Collections ──────────────────────────────────────────────────────────
  getCollections: (month?: number, year?: number) =>
    api.get<any[]>('/reports/collections', { params: { month, year } }).then((r) => r.data),

  exportCollections: (month?: number, year?: number) =>
    downloadXlsx('/reports/collections/export', `recaudo-${periodLabel(month, year)}.xlsx`, { month, year }),

  // ── Cut report ───────────────────────────────────────────────────────────
  getCutReport: (neighborhoodId?: string, minDebt?: number) =>
    api.get<any[]>('/reports/cut-report', { params: { neighborhoodId, minDebt } }).then((r) => r.data),

  exportCutReport: (neighborhoodId?: string, minDebt?: number) =>
    downloadXlsx('/reports/cut-report/export', `lista-corte-${new Date().toISOString().slice(0, 10)}.xlsx`, { neighborhoodId, minDebt }),

  // ── Readings planilla ────────────────────────────────────────────────────
  exportReadingsList: () =>
    downloadXlsx('/reports/readings-list/export', `planilla-lecturas-${new Date().toISOString().slice(0, 10)}.xlsx`),

  // ── Clients missing ──────────────────────────────────────────────────────
  getClientsMissing: (month?: number, year?: number) =>
    api.get<any[]>('/reports/clients-missing', { params: { month, year } }).then((r) => r.data),

  exportClientsMissing: (month?: number, year?: number) =>
    downloadXlsx('/reports/clients-missing/export', `faltantes-${periodLabel(month, year)}.xlsx`, { month, year }),
};
