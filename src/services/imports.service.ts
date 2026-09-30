import { api } from '@/lib/api';

export interface ImportIssue {
  row:       number;
  contract?: string;
  reason?:   string;
  message?:  string;
}

/** Importación XLSX procesada en segundo plano (cola bulk-import). */
export interface ImportJob {
  id:             string;
  type:           'readings' | 'clients';
  readingId:      string | null;
  status:         'queued' | 'running' | 'completed' | 'failed';
  fileName:       string;
  total:          number;
  processed:      number;
  created:        number;
  updated:        number;
  clientsCreated: number;
  skipped:        number;
  errorCount:     number;
  warningCount:   number;
  errors?:        ImportIssue[];
  warnings?:      ImportIssue[];
  percent:        number;
  failureReason:  string | null;
  createdAt:      string;
  finishedAt:     string | null;
}

export const isImportActive = (job?: ImportJob | null) =>
  !!job && (job.status === 'queued' || job.status === 'running');

export const importsService = {
  get: (id: string) =>
    api.get<ImportJob>(`/imports/${id}`).then((r) => r.data),

  list: (params: { type?: 'readings' | 'clients'; readingId?: string }) =>
    api.get<ImportJob[]>('/imports', { params }).then((r) => r.data),

  /** Descarga el reporte XLSX de errores y advertencias. */
  downloadReport: async (job: Pick<ImportJob, 'id' | 'fileName'>) => {
    const res = await api.get<Blob>(`/imports/${job.id}/report`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(job.fileName || 'importacion').replace(/\.[^.]+$/, '')}-resultado.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
