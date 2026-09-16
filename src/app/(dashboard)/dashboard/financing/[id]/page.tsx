'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle,
  Landmark, User, CreditCard, Pencil,
} from 'lucide-react';
import { financingService } from '@/services/financing.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_CONFIG = {
  active:    { label: 'Activo',      bg: 'bg-blue-100',    text: 'text-blue-700',    icon: Landmark },
  finished:  { label: 'Finalizado',  bg: 'bg-green-100',   text: 'text-green-700',   icon: CheckCircle2 },
  cancelled: { label: 'Cancelado',   bg: 'bg-neutral-100', text: 'text-neutral-500', icon: XCircle },
} as const;

export default function FinancingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc     = useQueryClient();

  const [showPayModal,    setShowPayModal]    = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customAmount,    setCustomAmount]    = useState('');
  const [payRef,          setPayRef]          = useState('');
  const [payError,        setPayError]        = useState('');

  const { data: plan, isLoading } = useQuery({
    queryKey: ['financing-plan', id],
    queryFn:  () => financingService.findOne(id),
  });

  const payMutation = useMutation({
    mutationFn: () => financingService.payQuota(id, {
      amount:           customAmount ? parseFloat(customAmount) : undefined,
      paymentReference: payRef       || undefined,
    }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['financing-plan', id] });
      qc.invalidateQueries({ queryKey: ['financing'] });
      setShowPayModal(false);
      setCustomAmount('');
      setPayRef('');
      setPayError('');
    },
    onError: (err: any) => {
      setPayError(err?.response?.data?.message ?? 'Error al registrar el pago');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => financingService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financing-plan', id] });
      qc.invalidateQueries({ queryKey: ['financing'] });
      setShowCancelModal(false);
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (!plan) return null;

  const statusCfg  = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.active;
  const StatusIcon = statusCfg.icon;
  const pct        = plan.quotas > 0 ? Math.round((plan.cancelled_quotas / plan.quotas) * 100) : 0;
  const quotaAmt   = Number(plan.quota_amount);
  const remaining  = plan.quotas - plan.cancelled_quotas;
  const isActive   = plan.status === 'active';

  // Dots representing each quota
  const dots = Array.from({ length: Math.min(plan.quotas, 36) }, (_, i) => i);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm w-fit">
        <ArrowLeft className="h-4 w-4" />
        Volver a financiación
      </button>

      {/* Header card */}
      <Card padding="md">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                <StatusIcon className="h-3 w-3" />
                {statusCfg.label}
              </span>
            </div>
            <h1 className="text-base font-bold text-neutral-900 leading-tight">{plan.name}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500">
              <User className="h-3.5 w-3.5" />
              {plan.client_name}
              <span className="text-neutral-300">·</span>
              <span className="font-mono text-xs">{plan.contract}</span>
            </div>
          </div>
          {isActive && (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setShowEditModal(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Corregir
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setShowCancelModal(true)}>
                Cancelar plan
              </Button>
              <Button size="sm" onClick={() => setShowPayModal(true)}>
                <CreditCard className="h-3.5 w-3.5" />
                Pagar cuota
              </Button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
            <span>{plan.cancelled_quotas} cuotas pagadas de {plan.quotas}</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                plan.status === 'finished'  ? 'bg-green-500' :
                plan.status === 'cancelled' ? 'bg-neutral-400' :
                'bg-primary-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Quota dots */}
        {plan.quotas <= 36 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {dots.map((i) => (
              <div
                key={i}
                title={`Cuota ${i + 1}`}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                  i < plan.cancelled_quotas
                    ? (plan.status === 'cancelled' ? 'bg-neutral-300 text-neutral-500' : 'bg-primary-500 text-white')
                    : i === plan.cancelled_quotas && isActive
                    ? 'bg-primary-100 border-2 border-primary-400 text-primary-600'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}
        {plan.quotas > 36 && (
          <p className="text-xs text-neutral-400">{remaining} cuotas restantes</p>
        )}
      </Card>

      {/* Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Valor total"    value={formatCurrency(plan.financing_value)} />
        <StatCard label="Valor cuota"    value={formatCurrency(quotaAmt)} accent />
        <StatCard label="Saldo pendiente" value={formatCurrency(plan.financed_balance)} warn={Number(plan.financed_balance) > 0 && isActive} />
        <StatCard label="Próxima cuota"   value={isActive ? `N° ${plan.actual_quota}` : '—'} />
      </div>

      {/* Client detail */}
      <Card padding="md">
        <CardHeader className="pb-3">
          <CardTitle>Datos del cliente</CardTitle>
        </CardHeader>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <InfoRow label="Cliente"   value={plan.client_name} />
          <InfoRow label="Contrato"  value={plan.contract} mono />
          {plan.address && <InfoRow label="Dirección" value={plan.address} />}
          {plan.phone   && <InfoRow label="Teléfono"  value={plan.phone} />}
          <InfoRow label="Creado"    value={formatDate(plan.created_at)} />
          <InfoRow label="Actualizado" value={formatDate(plan.updated_at)} />
        </dl>
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <button
            onClick={() => router.push(`/dashboard/clients/${plan.client_id}`)}
            className="text-sm text-primary-600 hover:underline"
          >
            Ver ficha del cliente →
          </button>
        </div>
      </Card>

      {/* Pay quota dialog */}
      <Dialog
        open={showPayModal}
        onClose={() => { setShowPayModal(false); setCustomAmount(''); setPayRef(''); setPayError(''); }}
        title="Registrar pago de cuota"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-primary-50 border border-primary-100 text-sm">
            <p className="font-semibold text-primary-800">Cuota N° {plan.actual_quota} de {plan.quotas}</p>
            <p className="text-primary-600 mt-0.5">
              Valor estándar: <strong>{formatCurrency(quotaAmt)}</strong>
              {' · '}Saldo restante: <strong>{formatCurrency(plan.financed_balance)}</strong>
            </p>
          </div>

          <Input
            label="Monto a pagar ($)"
            type="number"
            min={0.01}
            step={0.01}
            placeholder={String(Math.min(quotaAmt, Number(plan.financed_balance)))}
            hint="Dejar vacío para aplicar el valor estándar de la cuota"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
          <Input
            label="Referencia de pago"
            placeholder="N° recibo o transferencia (opcional)"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />

          {payError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {payError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => { setShowPayModal(false); setCustomAmount(''); setPayRef(''); setPayError(''); }}>
              Cancelar
            </Button>
            <Button
              loading={payMutation.isPending}
              onClick={() => { setPayError(''); payMutation.mutate(); }}
            >
              Registrar pago
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Cancel confirm dialog */}
      <ConfirmDialog
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => cancelMutation.mutate()}
        loading={cancelMutation.isPending}
        title="Cancelar plan"
        message={`¿Seguro que quieres cancelar el plan "${plan.name}"? Esta acción no se puede deshacer.`}
        danger
      />

      <CorregirPlanDialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        plan={plan}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${
      warn   ? 'bg-amber-50 border-amber-100' :
      accent ? 'bg-primary-50 border-primary-100' :
      'bg-neutral-50 border-neutral-100'
    }`}>
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-bold ${
        warn   ? 'text-amber-700' :
        accent ? 'text-primary-700' :
        'text-neutral-900'
      }`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-neutral-500">{label}</dt>
      <dd className={`font-medium text-neutral-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-32 bg-neutral-100 rounded" />
      <div className="h-48 bg-neutral-100 rounded-xl" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-neutral-100 rounded-xl" />)}
      </div>
      <div className="h-32 bg-neutral-100 rounded-xl" />
    </div>
  );
}

/**
 * Corrige un plan activo. Las cuotas ya abonadas no se pierden: el backend
 * recalcula el saldo descontándolas del valor nuevo, y no deja dejar el plan
 * con menos cuotas de las que el suscriptor ya pagó.
 */
function CorregirPlanDialog({
  open, onClose, plan,
}: {
  open: boolean;
  onClose: () => void;
  plan: any;
}) {
  const qc = useQueryClient();
  const [name, setName]     = useState('');
  const [valor, setValor]   = useState('');
  const [cuotas, setCuotas] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(plan?.name ?? '');
    setValor(String(plan?.financing_value ?? ''));
    setCuotas(String(plan?.quotas ?? ''));
  }, [open, plan]);

  const guardar = useMutation({
    mutationFn: () => financingService.update(plan.id, {
      name:           name.trim() || undefined,
      financingValue: valor  ? Number(valor)  : undefined,
      quotas:         cuotas ? Number(cuotas) : undefined,
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['financing', plan.id] });
      void qc.invalidateQueries({ queryKey: ['financing'] });
      onClose();
    },
  });

  const pagadas = Number(plan?.cancelled_quotas ?? 0);
  const abonado = Number(plan?.financing_value ?? 0) - Number(plan?.financed_balance ?? 0);
  const nuevoSaldo = valor ? Math.max(0, Number(valor) - abonado) : null;

  return (
    <Dialog open={open} onClose={onClose} title="Corregir el plan">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          El suscriptor ya abonó <strong>{pagadas}</strong> cuota{pagadas === 1 ? '' : 's'} por{' '}
          <strong>{formatCurrency(abonado)}</strong>. Eso no se toca: el saldo se recalcula
          sobre el valor que dejes aquí.
        </p>

        <Input
          label="Nombre del plan"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valor financiado"
            type="number"
            min={1}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <Input
            label="Número de cuotas"
            type="number"
            min={Math.max(1, pagadas)}
            hint={pagadas > 0 ? `No puede ser menor que ${pagadas}` : undefined}
            value={cuotas}
            onChange={(e) => setCuotas(e.target.value)}
          />
        </div>

        {nuevoSaldo !== null && (
          <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2">
            Saldo pendiente tras la corrección: <strong>{formatCurrency(nuevoSaldo)}</strong>
          </p>
        )}

        {guardar.isError && (
          <p className="text-xs text-danger-600">
            {(() => {
              const msg = (guardar.error as { response?: { data?: { message?: string | string[] } } })
                ?.response?.data?.message;
              return Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo guardar';
            })()}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            loading={guardar.isPending}
            disabled={!valor || !cuotas || Number(cuotas) < pagadas}
            onClick={() => guardar.mutate()}
          >
            Guardar corrección
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
