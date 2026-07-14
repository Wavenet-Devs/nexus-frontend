'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Plus, ChevronRight } from 'lucide-react';
import { pqrService, CreatePqrDto } from '@/services/pqr.service';
import { useDebounce } from '@/hooks/use-debounce';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

const LIMIT = 20;

const STATUS_OPTS = [
  { value: '',            label: 'Todas' },
  { value: 'new',         label: 'Nuevas' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'closed',      label: 'Cerradas' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  new:         'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  closed:      'bg-neutral-100 text-neutral-500',
};
const STATUS_LABELS: Record<string, string> = {
  new: 'Nueva', in_progress: 'En progreso', closed: 'Cerrada',
};

export default function PqrPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [open,   setOpen]   = useState(false);
  const [form,   setForm]   = useState({ subject: '', message: '' });
  const [error,  setError]  = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['pqr', page, debouncedSearch, status],
    queryFn: () => pqrService.findAll({ search: debouncedSearch || undefined, status: status || undefined, page, limit: LIMIT }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreatePqrDto) => pqrService.create(dto),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pqr'] }); setOpen(false); setForm({ subject: '', message: '' }); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se pudo crear'),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por asunto o cliente…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value); setPage(1); }}
              className={`h-9 px-3 rounded-lg text-sm font-medium border transition-colors ${
                status === opt.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <Button size="sm" onClick={() => { setError(''); setOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> Nueva solicitud
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />)}</div>
      ) : !data?.data?.length ? (
        <Card padding="none">
          <EmptyState icon={MessageSquare} title="Sin solicitudes" message="Registra una PQR o solicitud de un cliente." />
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.data.map((q) => (
              <button key={q.id} onClick={() => router.push(`/dashboard/pqr/${q.id}`)} className="w-full text-left">
                <Card padding="sm" className="hover:border-primary-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-neutral-900">{q.subject}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[q.status]}`}>{STATUS_LABELS[q.status]}</span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {q.client_name ? `${q.client_name} · ${q.contract}` : 'Sin cliente'} · {formatDate(q.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-neutral-400">{q.responses_count ?? 0} resp.</span>
                      <ChevronRight className="h-4 w-4 text-neutral-300" />
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
          <Card padding="none"><div className="px-5 py-3">
            <Pagination page={data.page} lastPage={data.lastPage} total={data.total} limit={LIMIT} onChange={setPage} />
          </div></Card>
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva solicitud" size="md">
        {error && <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-2 text-sm text-danger-600">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <Input label="Asunto" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-neutral-700">Mensaje</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending} disabled={!form.subject.trim() || !form.message.trim()}>Crear</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
