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

export const paymentsService = {
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
