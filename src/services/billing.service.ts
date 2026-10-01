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

/**
 * Versión de diseño de factura. El HTML es Handlebars: la información que
 * imprime sale del contexto que arma el backend, no de la plantilla.
 * Las versiones publicadas ('active' / 'archived') son inmutables.
 */
export interface InvoiceTemplate {
  id:             string;
  name:           string;
  version:        number;
  html:           string;
  styles:         Record<string, unknown>;
  origin:         'system' | 'custom';
  status:         'draft' | 'active' | 'archived';
  effectiveFrom:  string;
  notes:          string | null;
  createdAt:      string;
  publishedAt:    string | null;
  archivedAt:     string | null;
}

/** Fila del listado de versiones (sin el HTML). */
export type InvoiceTemplateSummary = Omit<InvoiceTemplate, 'html'>;

export interface InvoiceBanner {
  id:        string;
  title:     string;
  imageUrl:  string;
  mime:      string;
  byteSize:  number;
  width:     number | null;
  height:    number | null;
  month:     number;
  year:      number;
  notes:     string | null;
  createdAt: string;
}

export interface BannerSpec {
  recommendedWidth:  number;
  recommendedHeight: number;
  aspectRatio:       string;
  maxSizeMb:         number;
  formats:           string[];
  description:       string;
}

export interface BatchRecalcResult {
  dryRun:      boolean;
  period:      { month: number; year: number };
  candidates:  number;
  changed:     number;
  unchanged:   number;
  skipped:     number;
  totalBefore: number;
  totalAfter:  number;
  changes: {
    invoiceId: string; contract: string; clientName: string;
    oldTotal: number; newTotal: number; difference: number;
  }[];
}

export interface TemplateContextSchema {
  grupos:  { clave: string; descripcion: string; campos: string[] }[];
  helpers: { nombre: string; uso: string; resultado: string }[];
  bloques: string[];
}

export interface DebtCreditNote {
  id:              string;
  reason:          string;
  amount:          string | number;
  status:          string;
  created_at:      string;
  reverted_at?:    string | null;
  reverted_by?:    string | null;
  revert_reason?:  string | null;
  created_by_name?: string;
  snapshot?:       { applications?: { period: string; applied: number }[] };
}

export interface DebtCreditNoteResult extends DebtCreditNote {
  debtBefore:   number;
  debtAfter:    number;
  applications: { period: string; applied: number; oldBalance: number; newBalance: number }[];
}

export const billingService = {
  // ─── Notas de crédito sobre deuda ─────────────────────────────────────────

  getDebtCreditReasons: () =>
    api.get<string[]>('/billing/credit-notes/reasons').then((r) => r.data),

  findDebtCreditNotes: (clientId: string) =>
    api.get<DebtCreditNote[]>(`/billing/credit-notes/client/${clientId}`).then((r) => r.data),

  createDebtCreditNote: (dto: { clientId: string; amount: number; reason: string }) =>
    api.post<DebtCreditNoteResult>('/billing/credit-notes/debt', dto).then((r) => r.data),

  revertDebtCreditNote: (id: string, reason: string) =>
    api.patch<DebtCreditNote>(`/billing/credit-notes/${id}/revert`, { reason }).then((r) => r.data),

  findAll: (filters: InvoiceFilters = {}) =>
    api.get<PaginatedResponse<InvoiceListItem>>('/billing/invoices', { params: filters }).then((r) => r.data),

  findOne: (id: string) =>
    api.get<any>(`/billing/invoices/${id}`).then((r) => r.data),

  findByClient: (clientId: string) =>
    api.get<any[]>(`/billing/invoices/client/${clientId}`).then((r) => r.data),

  /** Encola la generación del lote (202). El avance se consulta con getGenerationRun. */
  generate: (readingId: string) =>
    api.post<BillingGenerationRun>(`/billing/generate/${readingId}`).then((r) => r.data),

  getGenerationRun: (runId: string) =>
    api.get<BillingGenerationRun>(`/billing/generation-runs/${runId}`).then((r) => r.data),

  /** Última ejecución del lote (null si nunca se facturó por este flujo). */
  getLatestGeneration: (readingId: string) =>
    api.get<BillingGenerationRun | null>(`/billing/generate/${readingId}/latest`).then((r) => r.data || null),

  createCreditNote: (invoiceId: string, dto: { reason: string; amount: number }) =>
    api.post<any>(`/billing/invoices/${invoiceId}/credit-note`, dto).then((r) => r.data),

  approveCreditNote: (noteId: string) =>
    api.patch<any>(`/billing/credit-notes/${noteId}/approve`).then((r) => r.data),

  discardCreditNote: (noteId: string) =>
    api.delete<{ deleted: true }>(`/billing/credit-notes/${noteId}`).then((r) => r.data),

  // ─── Diseño de factura ────────────────────────────────────────────────────

  getActiveTemplate: () =>
    api.get<InvoiceTemplate>('/billing/template').then((r) => r.data),

  listTemplates: () =>
    api.get<InvoiceTemplateSummary[]>('/billing/templates').then((r) => r.data),

  getTemplate: (id: string) =>
    api.get<InvoiceTemplate>(`/billing/templates/${id}`).then((r) => r.data),

  getTemplateContextSchema: () =>
    api.get<TemplateContextSchema>('/billing/templates/context-schema').then((r) => r.data),

  createTemplateDraft: (dto: {
    name: string;
    html?: string;
    fromTemplateId?: string;
    notes?: string;
  }) => api.post<InvoiceTemplate>('/billing/templates', dto).then((r) => r.data),

  updateTemplateDraft: (id: string, dto: { name?: string; html?: string; notes?: string }) =>
    api.patch<InvoiceTemplate>(`/billing/templates/${id}`, dto).then((r) => r.data),

  publishTemplate: (id: string, effectiveFrom?: string) =>
    api.post<InvoiceTemplate>(`/billing/templates/${id}/publish`, { effectiveFrom })
       .then((r) => r.data),

  deleteTemplateDraft: (id: string) =>
    api.delete<{ deleted: true }>(`/billing/templates/${id}`).then((r) => r.data),

  // ─── Publicidad de la factura ─────────────────────────────────────────────

  getBannerSpec: () =>
    api.get<BannerSpec>('/billing/banners/spec').then((r) => r.data),

  listBanners: () =>
    api.get<InvoiceBanner[]>('/billing/banners').then((r) => r.data),

  uploadBanner: (dto: { file: File; title: string; month: number; year: number; notes?: string }) => {
    const form = new FormData();
    form.append('file', dto.file);
    form.append('title', dto.title);
    form.append('month', String(dto.month));
    form.append('year', String(dto.year));
    if (dto.notes) form.append('notes', dto.notes);
    return api
      .post<InvoiceBanner>('/billing/banners', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  deleteBanner: (id: string) =>
    api.delete<{ deleted: true; invoicesAffected: number }>(`/billing/banners/${id}`)
       .then((r) => r.data),

  /**
   * Fuerza que el access token esté vigente antes de construir una URL que lo
   * lleva por query. Un GET autenticado dispara el interceptor de refresh de
   * axios si el token caducó; sin esto, la URL nace con un token muerto (duran
   * 15 minutos) y el iframe o la pestaña nueva devuelven 401.
   */
  ensureFreshToken: async (): Promise<void> => {
    try {
      await api.get('/auth/me');
    } catch {
      // Si el refresh falla, el interceptor ya redirige a /login.
    }
  },

  /** URL para el iframe de vista previa; el token va por query porque el iframe no manda headers. */
  getTemplatePreviewUrl: (templateId: string, invoiceId?: string, bannerId?: string): string => {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const slug  = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '';
    const params = new URLSearchParams({ token: token ?? '', slug: slug ?? '' });
    if (invoiceId) params.set('invoiceId', invoiceId);
    if (bannerId) params.set('bannerId', bannerId);
    return `${base}/billing/templates/${templateId}/preview?${params.toString()}`;
  },

  sendEmail: (invoiceId: string) =>
    api.post<{ queued: boolean }>(`/billing/invoices/${invoiceId}/send-email`).then((r) => r.data),

  getPreviewUrl: (invoiceId: string): string => {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    const slug  = typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : '';
    return `${base}/billing/invoices/${invoiceId}/preview?token=${token}&slug=${slug}`;
  },

  /** Vista previa (dryRun) o aplicación del recálculo masivo de un período. */
  recalculateBatch: (readingId: string, reason: string, dryRun: boolean) =>
    api.post<BatchRecalcResult>(`/billing/batch/${readingId}/recalculate`, { reason, dryRun })
       .then((r) => r.data),

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

export interface BillingGenerationRun {
  id:           string;
  readingId:    string;
  period:       { month: number; year: number };
  status:       'queued' | 'running' | 'completed' | 'failed';
  total:        number;
  processed:    number;
  generated:    number;
  skipped:      number;
  errorCount:   number;
  errors:       { clientId: string; reason: string }[];
  emailsQueued: number;
  percent:      number;
  failureReason: string | null;
  startedBy:    string;
  createdAt:    string;
  finishedAt:   string | null;
}
