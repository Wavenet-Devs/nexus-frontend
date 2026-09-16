import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface PaymentListItem {
  id:             string;
  client_id:      string;
  client_name:    string;
  contract:       string;
  amount:         number;
  change_amount:  number;
  payment_type:   string;
  payment_number: string | null;
  notes:          string | null;
  created_at:     string;
}

export interface DebtInvoice {
  id:            string;
  month:         number;
  year:          number;
  total:         number;
  balance:       number;
  status:        string;
  payment_limit: string;
  emission:      string;
}

export interface ClientDebt {
  client:    { id: string; name: string; contract: string };
  invoices:  DebtInvoice[];
  totalDebt: number;
}

export interface InvoiceAllocation {
  invoiceId: string;
  amount:    number;
}

export interface CreatePaymentDto {
  clientId:      string;
  amount:        number;
  paymentType:   'cash' | 'transfer' | 'card';
  paymentNumber?: string;
  changeAmount?:  number;
  notes?:         string;
  allocations:   InvoiceAllocation[];
}

export interface PaymentFilters {
  clientId?:    string;
  paymentType?: string;
  search?:      string;
  month?:       number;
  year?:        number;
  page?:        number;
  limit?:       number;
}

export interface UpdatePaymentDto {
  reason:         string;
  paymentType?:   string;
  paymentDate?:   string;
  paymentNumber?: string;
  notes?:         string;
}

export interface PaymentHistoryEntry {
  id:              string;
  snapshot:        Record<string, unknown>;
  reason:          string;
  changed_by:      string;
  changed_by_name: string;
  changed_at:      string;
}

export interface CollectionsImportResult {
  dryRun:       boolean;
  processed:    number;
  applied:      number;
  failed:       number;
  totalApplied: number;
  totalExcess:  number;
  rows: {
    row: number; contract: string; clientName: string; period: string;
    amount: number; allocated: number; excess: number; remaining: number;
  }[];
  errors: { row: number; message: string }[];
}

export const paymentsService = {
  importCollections: (file: File, dryRun: boolean) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<CollectionsImportResult>(`/payments/import-xlsx?dryRun=${dryRun}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /** URL de descarga de la planilla; el token va por query porque es una navegación directa. */
  getImportTemplateUrl: (): string => {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const slug  = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '';
    return `${base}/payments/import-template?token=${token}&slug=${slug}`;
  },

  update: (id: string, dto: UpdatePaymentDto) =>
    api.patch<Record<string, unknown>>(`/payments/${id}`, dto).then((r) => r.data),

  getHistory: (id: string) =>
    api.get<PaymentHistoryEntry[]>(`/payments/${id}/history`).then((r) => r.data),

  findAll: (filters: PaymentFilters = {}) =>
    api.get<PaginatedResponse<PaymentListItem>>('/payments', { params: filters }).then((r) => r.data),

  findOne: (id: string) =>
    api.get<any>(`/payments/${id}`).then((r) => r.data),

  findByClient: (clientId: string) =>
    api.get<any[]>(`/payments/client/${clientId}`).then((r) => r.data),

  getClientDebt: (clientId: string) =>
    api.get<ClientDebt>(`/payments/client/${clientId}/debt`).then((r) => r.data),

  create: (dto: CreatePaymentDto) =>
    api.post<any>('/payments', dto).then((r) => r.data),
};
