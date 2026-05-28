import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface FinancingPlan {
  id:               string;
  client_id:        string;
  client_name:      string;
  contract:         string;
  name:             string;
  financing_value:  number;
  quotas:           number;
  cancelled_quotas: number;
  actual_quota:     number;
  financed_balance: number;
  invoice_balance:  number;
  quota_amount:     number;
  status:           'active' | 'finished' | 'cancelled';
  created_at:       string;
  updated_at:       string;
  // detail only
  address?:  string;
  phone?:    string;
}

export interface CreateFinancingDto {
  clientId:        string;
  name:            string;
  financingValue:  number;
  quotas:          number;
  cancelledQuotas?: number;
}

export interface PayQuotaDto {
  amount?:           number;
  paymentReference?: string;
}

export interface FinancingFilters {
  clientId?: string;
  status?:   string;
  search?:   string;
  page?:     number;
  limit?:    number;
}

export const financingService = {
  findAll: (filters: FinancingFilters = {}) =>
    api.get<PaginatedResponse<FinancingPlan>>('/financing', { params: filters }).then((r) => r.data),

  findOne: (id: string) =>
    api.get<FinancingPlan>(`/financing/${id}`).then((r) => r.data),

  findByClient: (clientId: string) =>
    api.get<FinancingPlan[]>(`/financing/client/${clientId}`).then((r) => r.data),

  create: (dto: CreateFinancingDto) =>
    api.post<FinancingPlan>('/financing', dto).then((r) => r.data),

  payQuota: (id: string, dto: PayQuotaDto) =>
    api.post<any>(`/financing/${id}/pay-quota`, dto).then((r) => r.data),

  cancel: (id: string) =>
    api.patch<FinancingPlan>(`/financing/${id}/cancel`).then((r) => r.data),
};
