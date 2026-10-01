'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Printer, FileText, CreditCard,
  AlertCircle, CheckCircle2, Clock, Mail, RefreshCw,
} from 'lucide-react';
import { billingService } from '@/services/billing.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatMonth, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const creditNoteSchema = z.object({
  reason: z.string().min(5, 'Mínimo 5 caracteres'),
  amount: z.string().refine((v) => Number(v) > 0, 'Debe ser positivo'),
});
type CreditNoteForm = z.infer<typeof creditNoteSchema>;

export default function InvoiceDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const router      = useRouter();
  const qc          = useQueryClient();
  const [showCN,       setShowCN]       = useState(false);
  const [emailSent,    setEmailSent]    = useState(false);

  const { data: inv, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn:  () => billingService.findOne(id),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreditNoteForm>({
    resolver: zodResolver(creditNoteSchema),
  });

  const cnMutation = useMutation({
    mutationFn: (dto: CreditNoteForm) =>
      billingService.createCreditNote(id, { reason: dto.reason, amount: Number(dto.amount) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      setShowCN(false);
      reset();
    },
  });

  const approveMutation = useMutation({
    mutationFn: (noteId: string) => billingService.approveCreditNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice', id] }),
  });

  const emailMutation = useMutation({
    mutationFn: () => billingService.sendEmail(id),
    onSuccess:  () => { setEmailSent(true); setTimeout(() => setEmailSent(false), 4000); },
  });

  // ── Recálculo / edición de la factura ──
  const [showRecalc,   setShowRecalc]   = useState(false);
  const [recalcReason, setRecalcReason] = useState('');

  const { data: editHistory } = useQuery({
    queryKey: ['invoice-history', id],
    queryFn:  () => billingService.getHistory(id),
  });

  const recalcMutation = useMutation({
    mutationFn: () => billingService.recalculate(id, recalcReason.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      qc.invalidateQueries({ queryKey: ['invoice-history', id] });
      setShowRecalc(false);
      setRecalcReason('');
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!inv) return null;

  const consumed   = Number(inv.consumed ?? 0);
  const total      = Number(inv.total ?? 0);
  const balance    = Number(inv.balance ?? 0);
  const paid       = total - balance;

  return (
    <div className="space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a facturas
        </button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={emailMutation.isPending}
            onClick={() => emailMutation.mutate()}
            title={inv.email ? `Enviar a ${inv.email}` : 'Cliente sin email registrado'}
            disabled={!inv.email}
          >
            {emailSent ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Mail className="h-3.5 w-3.5" />}
            {emailSent ? 'Enviado' : 'Email'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(billingService.getPreviewUrl(id), '_blank')}
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRecalc(true)}>
            <RefreshCw className="h-3.5 w-3.5" />
            Recalcular
          </Button>
          {inv.status !== 'paid' && (
            <Button size="sm" onClick={() => setShowCN(true)}>
              <CreditCard className="h-3.5 w-3.5" />
              Nota de crédito
            </Button>
          )}
        </div>
      </div>

      {/* Header card */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-primary-600" />
              <h1 className="text-lg font-semibold text-neutral-900">{inv.client_name}</h1>
            </div>
            <p className="text-sm text-neutral-500 font-mono">{inv.contract}</p>
            {inv.neighborhood_name && (
              <p className="text-sm text-neutral-500 mt-0.5">{inv.neighborhood_name}</p>
            )}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <div className="flex items-center gap-2">
              {inv.edited && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700" title={`Ajustada · v${inv.version}`}>
                  Ajustada
                </span>
              )}
              <StatusBadge status={inv.status} />
            </div>
            <span className="text-sm text-neutral-500">{formatMonth(inv.month, inv.year)}</span>
            {inv.payment_limit && (
              <span className="text-xs text-neutral-400">Vence: {formatDate(inv.payment_limit)}</span>
            )}
          </div>
        </div>

        {/* Balance bar */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
            <span>Pagado: {formatCurrency(paid)}</span>
            <span>Total: {formatCurrency(total)}</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: total > 0 ? `${Math.min((paid / total) * 100, 100)}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-neutral-500">Saldo pendiente</span>
            <span className="text-base font-bold text-neutral-900">{formatCurrency(balance)}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lectura */}
        <Card padding="md">
          <CardHeader className="pb-3">
            <CardTitle>Lectura del período</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-3">
            <ReadingBox label="Anterior" value={inv.last_reading ?? '—'} />
            <ReadingBox label="Actual" value={inv.actual_reading ?? '—'} />
            <ReadingBox label="Consumo kWh" value={consumed} accent />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <InfoRow label="Fecha lectura"   value={inv.reading_date ? formatDate(inv.reading_date) : '—'} />
            <InfoRow label="Días facturados" value={inv.days ?? '—'} />
            <InfoRow label="Estrato"         value={inv.stratum_name ? `${inv.stratum_name} (${inv.stratum_code})` : '—'} />
            <InfoRow label="Ruta"            value={inv.route ?? '—'} />
          </dl>
        </Card>

        {/* Costos */}
        <Card padding="md">
          <CardHeader className="pb-3">
            <CardTitle>Desglose de costos</CardTitle>
          </CardHeader>
          <div className="space-y-1.5 text-sm">
            <CostRow label="Energía básica"        value={inv.basic} />
            <CostRow label="Energía complementaria" value={inv.complementary} />
            <CostRow label="Energía suntuaria"      value={inv.suntuary} />
            <CostRow label="Alumbrado público"      value={inv.public} />
            {Number(inv.subsidy) > 0 && (
              <CostRow label="Subsidio" value={-Number(inv.subsidy)} accent="green" />
            )}
            {Number(inv.peso_adjust) !== 0 && (
              <CostRow label="Ajuste al peso" value={inv.peso_adjust} />
            )}
            <div className="border-t border-neutral-200 pt-2 mt-2">
              <CostRow label="TOTAL" value={inv.total} bold />
            </div>
          </div>
        </Card>
      </div>

      {/* Historial de consumo */}
      {inv.history?.length > 0 && (
        <Card padding="md">
          <CardHeader className="pb-3">
            <CardTitle>Historial de consumo</CardTitle>
          </CardHeader>
          <ConsumptionChart data={inv.history} />
        </Card>
      )}

      {/* Notas de crédito */}
      {inv.creditNotes?.length > 0 && (
        <Card padding="md">
          <CardHeader className="pb-3">
            <CardTitle>Notas de crédito</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {inv.creditNotes.map((cn: any) => (
              <div key={cn.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{cn.reason}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{formatDate(cn.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-green-700">-{formatCurrency(cn.amount)}</span>
                  {cn.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(cn.id)}
                      >
                        Aprobar
                      </Button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" /> Aprobada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Historial de ajustes de la factura */}
      {!!editHistory?.length && (
        <Card padding="md">
          <CardHeader className="pb-3"><CardTitle>Historial de ajustes</CardTitle></CardHeader>
          <div className="space-y-2">
            {editHistory.map((h, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <div>
                  <p className="text-sm text-neutral-800">{h.reason}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{h.changed_by_name || 'Usuario'} · {formatDate(h.changed_at)}</p>
                </div>
                <span className="text-xs text-neutral-500 font-mono shrink-0 ml-3">
                  Total anterior: {formatCurrency(Number(h.snapshot?.total ?? 0))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recalcular dialog */}
      <Dialog open={showRecalc} onClose={() => { setShowRecalc(false); setRecalcReason(''); }} title="Recalcular factura">
        <form onSubmit={(e) => { e.preventDefault(); recalcMutation.mutate(); }} className="space-y-4">
          <p className="text-sm text-neutral-600">
            Recalcula la factura desde la lectura corregida (tarifas, subsidios y total). El saldo respeta los pagos ya aplicados. Queda registro en el historial.
          </p>
          <Input
            label="Motivo del ajuste"
            placeholder="Ej: corrección de lectura mal digitada"
            value={recalcReason}
            onChange={(e) => setRecalcReason(e.target.value)}
          />
          {recalcMutation.isError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {(recalcMutation.error as any)?.response?.data?.message ?? 'No se pudo recalcular'}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => { setShowRecalc(false); setRecalcReason(''); }}>Cancelar</Button>
            <Button type="submit" loading={recalcMutation.isPending} disabled={recalcReason.trim().length < 3}>Recalcular</Button>
          </div>
        </form>
      </Dialog>

      {/* Credit note dialog */}
      <Dialog open={showCN} onClose={() => { setShowCN(false); reset(); }} title="Nueva nota de crédito">
        <form onSubmit={handleSubmit((d) => cnMutation.mutate(d))} className="space-y-4">
          <Input
            label="Motivo"
            placeholder="Ej: Error en lectura, ajuste por reclamo…"
            error={errors.reason?.message}
            {...register('reason')}
          />
          <Input
            label="Monto"
            type="number"
            min={0}
            step={0.01}
            placeholder="0"
            error={errors.amount?.message}
            {...register('amount')}
          />
          {cnMutation.isError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Error al crear la nota de crédito
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => { setShowCN(false); reset(); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={cnMutation.isPending}>
              Crear nota
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReadingBox({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center border ${accent ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50 border-neutral-100'}`}>
      <span className="block text-xs text-neutral-500 uppercase tracking-wide mb-1">{label}</span>
      <span className={`block text-xl font-bold ${accent ? 'text-primary-700' : 'text-neutral-800'}`}>
        {typeof value === 'number' ? value.toLocaleString('es-CO') : value}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-800">{value}</dd>
    </>
  );
}

function CostRow({ label, value, bold, accent }: { label: string; value: any; bold?: boolean; accent?: string }) {
  const num = Number(value ?? 0);
  if (num === 0 && !bold) return null;
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold text-neutral-900' : 'text-neutral-600'}`}>
      <span>{label}</span>
      <span className={`font-mono ${accent === 'green' ? 'text-green-700' : ''}`}>
        {formatCurrency(num)}
      </span>
    </div>
  );
}

function ConsumptionChart({ data }: { data: Array<{ consumed: number; month: number; year: number }> }) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const max = Math.max(...data.map((d) => Number(d.consumed)), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => {
        const pct = Math.round((Number(d.consumed) / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
            <span className="text-xs text-neutral-400">{Number(d.consumed).toLocaleString('es-CO')}</span>
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full bg-primary-400 rounded-t transition-all"
                style={{ height: `${pct}%`, minHeight: 4 }}
              />
            </div>
            <span className="text-xs text-neutral-400 leading-tight text-center">
              {months[(d.month - 1) % 12]}<br />{String(d.year).slice(-2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-40 bg-neutral-100 rounded" />
      <div className="h-32 bg-neutral-100 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-48 bg-neutral-100 rounded-xl" />
        <div className="h-48 bg-neutral-100 rounded-xl" />
      </div>
    </div>
  );
}
