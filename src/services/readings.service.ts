import { api } from '@/lib/api';

export type ReadingBatchStatus = 'DRAFT' | 'COLLECTING' | 'READY_TO_BILL' | 'BILLED' | 'CLOSED';

export interface ReadingStatusHistoryEntry {
  from_status:     ReadingBatchStatus | null;
  to_status:       ReadingBatchStatus;
  reason:          string;
  changed_by_name: string;
  changed_at:      string;
}

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
  status:         ReadingBatchStatus;
  status_changed_at?: string | null;
  /** Solo en el detalle: estados a los que se puede pasar desde el actual. */
  allowed_transitions?: ReadingBatchStatus[];
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
  edited:         boolean;
  version:        number;
  edited_at:      string | null;
  /** Causal/novedad de esta lectura (no la del cliente). */
  causal_id?:          string | null;
  causal_code?:        number | null;
  causal_name?:        string | null;
  causal_result_mode?: 'ZERO_READING' | 'NO_READING' | 'READING_ALLOWED' | null;
  source?:             'manual' | 'xlsx' | 'lector_app' | 'etl' | 'legacy';
}

export interface TariffHistoryEntry {
  old_last_reading:   number;
  old_actual_reading: number;
  old_consumed:       number;
  new_last_reading:   number;
  new_actual_reading: number;
  new_consumed:       number;
  reason:             string;
  changed_by_name:    string;
  changed_at:         string;
}

export interface UpdateTariffReadingDto {
  lastReading?:   number;
  actualReading?: number;
  reason:         string;
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
  warnings?: { row: number; contract: string; reason: string }[];
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

  updateTariffReading: (tariffId: string, dto: UpdateTariffReadingDto) =>
    api.patch<{ tariff: ReadingTariff; hasInvoice: boolean; invoiceId: string | null }>(
      `/readings/tariffs/${tariffId}`, dto,
    ).then((r) => r.data),

  changeStatus: (id: string, status: ReadingBatchStatus, reason?: string) =>
    api.patch<ReadingBatch>(`/readings/${id}/status`, { status, reason }).then((r) => r.data),

  getStatusHistory: (id: string) =>
    api.get<ReadingStatusHistoryEntry[]>(`/readings/${id}/status-history`).then((r) => r.data),

  getTariffHistory: (tariffId: string) =>
    api.get<TariffHistoryEntry[]>(`/readings/tariffs/${tariffId}/history`).then((r) => r.data),
};
