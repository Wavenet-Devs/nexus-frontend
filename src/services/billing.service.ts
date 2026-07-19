import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface InvoiceListItem {
  id:               string;
  client_id:        string;
  client_name:      string;
  contract:         string;
  month:            number;
  year:             number;
  total:            number;
  balance:          number;
  status:           string;
  emission:         string;
  payment_limit:    string;
  stratum_name?:    string;
  neighborhood_name?: string;
}

export interface InvoiceFilters {
  status?:         string;
  neighborhoodId?: string;
  readingId?:      string;
  month?:          number;
  year?:           number;
  search?:         string;
  clientId?:       string;
  page?:           number;
  limit?:          number;
}

export interface InvoiceHistoryEntry {
  snapshot:        Record<string, any>;
  reason:          string;
  changed_by_name: string;
  changed_at:      string;
}

export interface TemplateModule {
  id:      string;
  label:   string;
  enabled: boolean;
  order:   number;
}

export interface InvoiceTemplate {
  companyName:    string;
  companyNit:     string;
  companyAddress: string;
  companyPhone:   string;
  companyEmail:   string;
  logoUrl:        string;
  primaryColor:   string;
  accentColor:    string;
  footerText:     string;
  modules:        TemplateModule[];
}

export const billingService = {
  findAll: (filters: InvoiceFilters = {}) =>
    api.get<PaginatedResponse<InvoiceListItem>>('/billing/invoices', { params: filters }).then((r) => r.data),

  findOne: (id: string) =>
    api.get<any>(`/billing/invoices/${id}`).then((r) => r.data),

  findByClient: (clientId: string) =>
    api.get<any[]>(`/billing/invoices/client/${clientId}`).then((r) => r.data),

  generate: (readingId: string) =>
    api.post<any>(`/billing/generate/${readingId}`).then((r) => r.data),

  createCreditNote: (invoiceId: string, dto: { reason: string; amount: number }) =>
    api.post<any>(`/billing/invoices/${invoiceId}/credit-note`, dto).then((r) => r.data),

  approveCreditNote: (noteId: string) =>
    api.patch<any>(`/billing/credit-notes/${noteId}/approve`).then((r) => r.data),

  getTemplate: () =>
    api.get<InvoiceTemplate>('/billing/template').then((r) => r.data),

  updateTemplate: (dto: Partial<InvoiceTemplate>) =>
    api.put<InvoiceTemplate>('/billing/template', dto).then((r) => r.data),

  sendEmail: (invoiceId: string) =>
    api.post<{ queued: boolean }>(`/billing/invoices/${invoiceId}/send-email`).then((r) => r.data),

  getPreviewUrl: (invoiceId: string): string => {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const slug  = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '';
    return `${base}/billing/invoices/${invoiceId}/preview?token=${token}&slug=${slug}`;
  },

  recalculate: (invoiceId: string, reason: string) =>
    api.post<any>(`/billing/invoices/${invoiceId}/recalculate`, { reason }).then((r) => r.data),

  getHistory: (invoiceId: string) =>
    api.get<InvoiceHistoryEntry[]>(`/billing/invoices/${invoiceId}/history`).then((r) => r.data),

  getBatchPrintUrl: (readingId: string, opts: { neighborhoodId?: string; route?: string } = {}): string => {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const slug  = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '';
    const params = new URLSearchParams({ token: token ?? '', slug: slug ?? '' });
    if (opts.neighborhoodId) params.set('neighborhoodId', opts.neighborhoodId);
    if (opts.route) params.set('route', opts.route);
    return `${base}/billing/batch/${readingId}/print?${params.toString()}`;
  },
};
