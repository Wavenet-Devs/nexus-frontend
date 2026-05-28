import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface ClientListItem {
  id:               string;
  contract:         string;
  name:             string;
  address:          string;
  phone?:           string;
  active:           boolean;
  stratum_name?:    string;
  stratum_code?:    string;
  neighborhood_name?: string;
}

export interface ClientDetail extends ClientListItem {
  email?:           string;
  id_card?:         string;
  id_type_name?:    string;
  cod_bar?:         string;
  reader?:          string;
  deliver?:         string;
  meter_serial?:    string;
  circuit_name?:    string;
  route_name?:      string;
  stratum_id?:      string;
  neighborhood_id?: string;
  circuit_id?:      string;
  route_id?:        string;
  meter_id?:        string;
  id_type_id?:      string;
}

export interface ClientFilters {
  search?:         string;
  neighborhoodId?: string;
  stratumId?:      string;
  active?:         string;
  page?:           number;
  limit?:          number;
}

export interface CreateClientDto {
  contract:        string;
  name:            string;
  address:         string;
  idTypeId?:       string;
  idCard?:         string;
  phone?:          string;
  email?:          string;
  stratumId?:      string;
  neighborhoodId?: string;
  circuitId?:      string;
  routeId?:        string;
  meterId?:        string;
  codBar?:         string;
  reader?:         string;
  deliver?:        string;
}

export const clientsService = {
  findAll: (filters: ClientFilters = {}) =>
    api.get<PaginatedResponse<ClientListItem>>('/clients', { params: filters }).then((r) => r.data),

  findOne: (id: string) =>
    api.get<ClientDetail>(`/clients/${id}`).then((r) => r.data),

  findByContract: (contract: string) =>
    api.get<ClientDetail>(`/clients/contract/${contract}`).then((r) => r.data),

  search: (q: string) =>
    api.get<ClientListItem[]>('/clients/search', { params: { q } }).then((r) => r.data),

  create: (dto: CreateClientDto) =>
    api.post<ClientDetail>('/clients', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateClientDto>) =>
    api.patch<ClientDetail>(`/clients/${id}`, dto).then((r) => r.data),

  toggleStatus: (id: string) =>
    api.patch<ClientDetail>(`/clients/${id}/toggle-status`).then((r) => r.data),

  importXlsx: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ created: number; updated: number; errors: { row: number; message: string }[] }>(
      '/clients/import-xlsx',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data);
  },
};
