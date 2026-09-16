'use client';

import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Printer } from 'lucide-react';
import { pqrService } from '@/services/pqr.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  new:         'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  closed:      'bg-neutral-100 text-neutral-500',
};
const STATUS_LABELS: Record<string, string> = {
  new: 'Nueva', in_progress: 'En progreso', closed: 'Cerrada',
};

export default function PqrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['pqr', id], queryFn: () => pqrService.findOne(id) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['pqr', id] });

  const respondMutation = useMutation({
    mutationFn: () => pqrService.respond(id, { message: reply.trim() }),
    onSuccess: () => { setReply(''); invalidate(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se pudo enviar'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => pqrService.changeStatus(id, status),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return <div className="space-y-4"><div className="h-8 w-40 bg-neutral-100 rounded animate-pulse" /><div className="h-40 bg-neutral-100 rounded-xl animate-pulse" /></div>;
  }
  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/pqr')}>
          <ArrowLeft className="h-4 w-4" /> Solicitudes
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(pqrService.getPrintUrl(id as string, false), '_blank')}
            title="Constancia de radicación, sin respuestas"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Radicado
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.responses?.length}
            title={
              data.responses?.length
                ? 'Constancia con la respuesta de la empresa'
                : 'Todavía no hay respuestas que imprimir'
            }
            onClick={() => window.open(pqrService.getPrintUrl(id as string, true), '_blank')}
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Con respuesta
          </Button>
        </div>
        <div className="flex gap-2">
          {(['new', 'in_progress', 'closed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => statusMutation.mutate(s)}
              disabled={statusMutation.isPending || data.status === s}
              className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors disabled:opacity-100 ${
                data.status === s ? STATUS_STYLES[s] + ' border-transparent' : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data.subject}</CardTitle>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[data.status]}`}>{STATUS_LABELS[data.status]}</span>
        </CardHeader>
        <p className="text-xs text-neutral-500 mb-3">
          {data.client_name ? `${data.client_name} · ${data.contract}` : 'Sin cliente'} · {formatDate(data.created_at)}
        </p>
        <p className="text-sm text-neutral-800 whitespace-pre-wrap">{data.message}</p>
      </Card>

      <Card padding="none">
        <div className="px-5 pt-5"><CardHeader><CardTitle>Respuestas ({data.responses?.length ?? 0})</CardTitle></CardHeader></div>
        <div className="px-5 pb-5 space-y-3">
          {!data.responses?.length ? (
            <p className="text-sm text-neutral-400">Aún no hay respuestas.</p>
          ) : (
            data.responses.map((r) => (
              <div key={r.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span className="font-medium text-neutral-600">{r.author || 'Soporte'}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
                <p className="text-sm text-neutral-800 whitespace-pre-wrap">{r.message}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      {data.status !== 'closed' && (
        <Card>
          {error && <div className="mb-3 rounded-lg bg-danger-50 border border-red-200 px-4 py-2 text-sm text-danger-600">{error}</div>}
          <div className="flex flex-col gap-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="Escribe una respuesta…"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end">
              <Button loading={respondMutation.isPending} disabled={!reply.trim()} onClick={() => { setError(''); respondMutation.mutate(); }}>
                <Send className="h-3.5 w-3.5" /> Responder
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
