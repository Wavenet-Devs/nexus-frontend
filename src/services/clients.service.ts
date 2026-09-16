import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface ClientGroup {
  id:                   string;
  name:                 string;
  idCard?:              string | null;
  identificationTypeId?: string | null;
  phone?:               string | null;
  email?:               string | null;
  address?:             string | null;
  notes?:               string | null;
  status:               string;
  members:              number;
  activeMembers:        number;
  createdAt:            string;
}

export interface ClientGroupMember {
  id:            string;
  contract:      string;
  name:          string;
  address?:      string;
  meter_number?: string;
  status:        string;
  neighborhood_name?: string;
  last_balance?: string | number | null;
}

export interface ClientGroupDetail extends ClientGroup {
  clients: ClientGroupMember[];
}

/** Qué hay ya registrado con un documento — para avisar, no para bloquear. */
export interface IdCardLookup {
  clients: {
    id: string; contract: string; name: string;
    address?: string; group_id?: string | null; group_name?: string | null;
  }[];
  group: { id: string; name: string } | null;
}

export interface ClientListItem {
  id:               string;
  contract:         string;
  group_id?:        string | null;
  group_name?:      string | null;
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
  causal_id?:       string;
  group_name?:      string | null;
  group_id_card?:   string | null;
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
  groupId?:        string | null;
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

  // ─── Grupos de titular ────────────────────────────────────────────────────

  listGroups: (search?: string) =>
    api.get<ClientGroup[]>('/clients/groups', { params: search ? { search } : {} })
       .then((r) => r.data),

  findGroup: (id: string) =>
    api.get<ClientGroupDetail>(`/clients/groups/${id}`).then((r) => r.data),

  createGroup: (dto: Partial<ClientGroup>) =>
    api.post<ClientGroup>('/clients/groups', dto).then((r) => r.data),

  updateGroup: (id: string, dto: Partial<ClientGroup>) =>
    api.patch<ClientGroup>(`/clients/groups/${id}`, dto).then((r) => r.data),

  deleteGroup: (id: string) =>
    api.delete<{ deleted: true; clientsReleased: number }>(`/clients/groups/${id}`)
       .then((r) => r.data),

  setClientGroup: (clientId: string, groupId: string | null) =>
    api.patch<{ id: string; contract: string; group_id: string | null }>(
      `/clients/groups/members/${clientId}`, { groupId },
    ).then((r) => r.data),

  lookupIdCard: (idCard: string) =>
    api.get<IdCardLookup>(`/clients/groups/by-id-card/${encodeURIComponent(idCard)}`)
       .then((r) => r.data),

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
