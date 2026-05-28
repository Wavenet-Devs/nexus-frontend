import { api } from '@/lib/api';

export interface ApiKey {
  id:        string;
  name:      string;
  status:    string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface CreatedApiKey extends ApiKey {
  key: string; // solo presente en la respuesta de creación
}

export const apiKeysService = {
  findAll: () =>
    api.get<ApiKey[]>('/api-keys').then((r) => r.data),

  create: (name: string) =>
    api.post<CreatedApiKey>('/api-keys', { name }).then((r) => r.data),

  toggle: (id: string) =>
    api.patch<ApiKey>(`/api-keys/${id}/toggle`).then((r) => r.data),

  revoke: (id: string) =>
    api.delete<ApiKey>(`/api-keys/${id}`).then((r) => r.data),
};
