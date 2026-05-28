import { api } from '@/lib/api';

export interface ReadingBatch {
  id:             string;
  month:          number;
  year:           number;
  basic:          number;
  complementary:  number;
  plain:          number;
  business:       number;
  official:       number;
  generation:     number;
  distribution:   number;
  marketing:      number;
  losses:         number;
  cu:             number;
  days:           number;
  public_amount:  number;
  peso_adjust:    number;
  period_start:   string;
  period_end:     string;
  payment_limit:  string;
  total_clients:  string;
  total_consumed?: string;
  zero_readings?:  string;
  created_at:     string;
}

export interface ReadingTariff {
  id:             string;
  client_id:      string;
  contract:       string;
  name:           string;
  address:        string;
  route:          string;
  stratum_name:   string;
  stratum_code:   string;
  last_reading:   number;
  actual_reading: number;
  consumed:       number;
}

export interface CreateReadingBatchDto {
  month:        number;
  year:         number;
  basic:        number;
  complementary: number;
  plain:        number;
  business:     number;
  official:     number;
  generation:   number;
  distribution: number;
  marketing:    number;
  losses:       number;
  cu:           number;
  days:         number;
  publicAmount: number;
  pesoAdjust:   number;
  periodStart:  string;
  periodEnd:    string;
  paymentLimit: string;
}

export interface ImportResult {
  imported: number;
  skipped:  number;
  created:  number;
  errors:   { row: number; contract: string; reason: string }[];
}

export const readingsService = {
  findAll: () =>
    api.get<ReadingBatch[]>('/readings').then((r) => r.data),

  findOne: (id: string) =>
    api.get<ReadingBatch>(`/readings/${id}`).then((r) => r.data),

  create: (dto: CreateReadingBatchDto) =>
    api.post<ReadingBatch>('/readings', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateReadingBatchDto>) =>
    api.patch<ReadingBatch>(`/readings/${id}`, dto).then((r) => r.data),

  importXlsx: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ImportResult>(`/readings/${id}/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  findTariffs: (id: string) =>
    api.get<ReadingTariff[]>(`/readings/${id}/tariffs`).then((r) => r.data),

  getMissingClients: (id: string) =>
    api.get<any[]>(`/readings/${id}/missing`).then((r) => r.data),
};
