import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface PqrResponse {
  id: string; message: string; author: string; created_at: string;
}

export interface Pqr {
  id:              string;
  subject:         string;
  message:         string;
  status:          'new' | 'in_progress' | 'closed';
  created_at:      string;
  updated_at:      string;
  client_id:       string | null;
  client_name:     string | null;
  contract:        string | null;
  responses_count?: number;
  responses?:      PqrResponse[];
}

export interface CreatePqrDto { clientId?: string; subject: string; message: string; }
export interface RespondPqrDto { message: string; author?: string; }
export interface PqrFilters { status?: string; search?: string; page?: number; limit?: number; }

export const pqrService = {
  /** URL del documento imprimible; el token va por query porque es navegación directa. */
  getPrintUrl: (id: string, withResponses: boolean): string => {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const slug  = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '';
    const params = new URLSearchParams({ token: token ?? '', slug: slug ?? '' });
    if (withResponses) params.set('responses', 'true');
    return `${base}/pqr/${id}/print?${params.toString()}`;
  },

  findAll: (filters: PqrFilters = {}) =>
    api.get<PaginatedResponse<Pqr>>('/pqr', { params: filters }).then((r) => r.data),
  findOne: (id: string) =>
    api.get<Pqr>(`/pqr/${id}`).then((r) => r.data),
  create: (dto: CreatePqrDto) =>
    api.post<Pqr>('/pqr', dto).then((r) => r.data),
  respond: (id: string, dto: RespondPqrDto) =>
    api.post<Pqr>(`/pqr/${id}/responses`, dto).then((r) => r.data),
  changeStatus: (id: string, status: string) =>
    api.patch<Pqr>(`/pqr/${id}/status`, { status }).then((r) => r.data),
};
