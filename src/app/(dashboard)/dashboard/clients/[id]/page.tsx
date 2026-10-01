'use client';

import { useState } from 'react';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit, Phone, Mail, MapPin,
  Hash, Zap, CreditCard, FileText, Receipt, RotateCcw,
} from 'lucide-react';
import { clientsService } from '@/services/clients.service';
import { billingService } from '@/services/billing.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Select } from '@/components/ui/input';
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils';
import { api } from '@/lib/api';
import { useQuery as useQ } from '@tanstack/react-query';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-sm font-medium text-neutral-800 mt-0.5">{value}</dd>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [notaOpen, setNotaOpen] = useState(false);
  const { id } = use(params);
  const router  = useRouter();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn:  () => clientsService.findOne(id),
  });

  const { data: invoices } = useQ({
    queryKey: ['client-invoices', id],
    queryFn:  () => api.get(`/billing/invoices/client/${id}`).then((r) => r.data as any[]),
    enabled:  !!id,
  });

  const { data: payments } = useQ({
    queryKey: ['client-payments', id],
    queryFn:  () => api.get(`/payments/client/${id}`).then((r) => r.data as any[]),
    enabled:  !!id,
  });

  if (isLoading) return <DetailSkeleton />;
  if (!client)   return null;

  const totalDebt = invoices
    ?.filter((i: any) => i.status !== 'paid')
    .reduce((sum: number, i: any) => sum + Number(i.balance), 0) ?? 0;

  return (
    <div className="space-y-5">
      {/* Back + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a clientes
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-neutral-900 truncate">{client.name}</h2>
          <p className="text-xs text-neutral-500">Contrato {client.contract}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={client.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/clients/${id}/edit`)}
          >
            <Edit className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNotaOpen(true)}>
            <Receipt className="h-3.5 w-3.5" />
            Nota de crédito
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/dashboard/payments?clientId=${id}`)}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Registrar pago
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info general */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del cliente</CardTitle>
          </CardHeader>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <InfoRow label="Contrato"   value={client.contract} />
            <InfoRow label="Nombre"     value={client.name} />
            <InfoRow label="Estrato"    value={client.stratum_name} />
            <InfoRow label="Barrio"     value={client.neighborhood_name} />
            <InfoRow label="Dirección"  value={client.address} />
            <InfoRow label="Teléfono"   value={client.phone} />
            <InfoRow label="Email"      value={client.email} />
            <InfoRow label="Documento"  value={client.id_card ? `${client.identification_type_name ?? ''} ${client.id_card}`.trim() : undefined} />
            <InfoRow
              label="Medidor"
              value={
                client.meter_mark && client.meter_number
                  ? `${client.meter_mark} · ${client.meter_number}`
                  : client.meter_number ?? client.meter_mark
              }
            />
            <InfoRow label="Circuito"   value={client.circuit_name} />
            <InfoRow label="Ruta"       value={client.route} />
            <InfoRow label="Lector"     value={client.reader} />
            <InfoRow label="Repartidor" value={client.deliver} />
          </dl>
        </Card>

        {/* Resumen financiero */}
        <div className="space-y-4">
          <Card>
            <CardTitle className="mb-3">Saldo pendiente</CardTitle>
            <p className={`text-2xl font-bold ${totalDebt > 0 ? 'text-danger-600' : 'text-primary-600'}`}>
              {formatCurrency(totalDebt)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {invoices?.filter((i: any) => i.status !== 'paid').length ?? 0} facturas sin pagar
            </p>
          </Card>

          <Card>
            <CardTitle className="mb-3">Accesos rápidos</CardTitle>
            <div className="space-y-1.5">
              {[
                { label: 'Ver facturas',  icon: FileText,   action: () => router.push(`/dashboard/billing?clientId=${id}`) },
                { label: 'Ver pagos',     icon: CreditCard, action: () => router.push(`/dashboard/payments?clientId=${id}`) },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <item.icon className="h-4 w-4 text-neutral-400 shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Historial de facturas */}
      {invoices && invoices.length > 0 && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-neutral-100">
            <CardTitle>Historial de facturas</CardTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-50 bg-neutral-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500">Período</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500">Total</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500">Saldo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 12).map((inv: any) => (
                  <tr
                    key={inv.id}
                    className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/billing/${inv.id}`)}
                  >
                    <td className="px-5 py-3 font-medium text-neutral-800">
                      {formatMonth(inv.month, inv.year)}
                    </td>
                    <td className="px-5 py-3 text-right text-neutral-700">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-3 text-right font-medium text-neutral-900">{formatCurrency(inv.balance)}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">
                      {inv.payment_limit ? formatDate(inv.payment_limit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NotaCreditoDeudaDialog
        open={notaOpen}
        onClose={() => setNotaOpen(false)}
        clientId={id as string}
        clientName={client.name}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-12 rounded-xl bg-neutral-200 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 rounded-xl bg-neutral-200 animate-pulse" />
        <div className="space-y-4">
          <div className="h-28 rounded-xl bg-neutral-200 animate-pulse" />
          <div className="h-28 rounded-xl bg-neutral-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Nota de crédito sobre la deuda del cliente.
 *
 * El descuento se reparte entre las facturas pendientes, de la más antigua a
 * la más reciente. Se aplica de inmediato y queda revertible, así que la lista
 * de notas anteriores va en el mismo sitio.
 */
function NotaCreditoDeudaDialog({
  open, onClose, clientId, clientName,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}) {
  const qc = useQueryClient();
  const [motivo, setMotivo] = useState('');
  const [monto, setMonto]   = useState('');
  const [revertir, setRevertir] = useState<string | null>(null);
  const [motivoRevertir, setMotivoRevertir] = useState('');

  const { data: motivos } = useQuery({
    queryKey: ['debt-credit-reasons'],
    queryFn:  billingService.getDebtCreditReasons,
    enabled:  open,
  });

  const { data: notas } = useQuery({
    queryKey: ['debt-credit-notes', clientId],
    queryFn:  () => billingService.findDebtCreditNotes(clientId),
    enabled:  open,
  });

  const refrescar = () => {
    void qc.invalidateQueries({ queryKey: ['debt-credit-notes', clientId] });
    void qc.invalidateQueries({ queryKey: ['client', clientId] });
    void qc.invalidateQueries({ queryKey: ['invoices'] });
  };

  const crear = useMutation({
    mutationFn: () => billingService.createDebtCreditNote({
      clientId, amount: Number(monto), reason: motivo,
    }),
    onSuccess: () => { setMonto(''); setMotivo(''); refrescar(); },
  });

  const revertirNota = useMutation({
    mutationFn: (id: string) => billingService.revertDebtCreditNote(id, motivoRevertir),
    onSuccess: () => { setRevertir(null); setMotivoRevertir(''); refrescar(); },
  });

  const error = crear.error ?? revertirNota.error;
  const mensaje = (e: unknown) => {
    const msg = (e as { response?: { data?: { message?: string | string[] } } })
      ?.response?.data?.message;
    return Array.isArray(msg) ? msg.join(', ') : msg ?? 'Ocurrió un error';
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nota de crédito sobre la deuda" size="lg">
      <div className="space-y-5">
        <p className="text-sm text-neutral-600">
          Descuenta un valor de la deuda de <strong>{clientName}</strong>. Se reparte entre sus
          facturas pendientes, de la más antigua a la más reciente.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="">Selecciona un motivo</option>
            {motivos?.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input
            label="Valor a descontar"
            type="number"
            min={1}
            placeholder="50000"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        {error != null && <p className="text-xs text-danger-600">{mensaje(error)}</p>}

        <div className="flex justify-end">
          <Button
            loading={crear.isPending}
            disabled={!motivo || !monto || Number(monto) <= 0}
            onClick={() => crear.mutate()}
          >
            Aplicar nota de crédito
          </Button>
        </div>

        {!!notas?.length && (
          <div className="border-t border-neutral-100 pt-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
              Notas anteriores
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notas.map((n) => (
                <div key={n.id} className="border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800">
                        {formatCurrency(n.amount)}
                        <span className="ml-2 text-xs font-normal text-neutral-500">{n.reason}</span>
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(n.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                        {n.created_by_name ? ` · ${n.created_by_name}` : ''}
                        {n.snapshot?.applications?.length
                          ? ` · ${n.snapshot.applications.length} factura(s)`
                          : ''}
                      </p>
                    </div>
                    {n.status === 'reverted' ? (
                      <span className="text-xs text-neutral-400 shrink-0">Revertida</span>
                    ) : (
                      <button
                        onClick={() => setRevertir(n.id)}
                        className="text-xs text-neutral-500 hover:text-danger-600 shrink-0 inline-flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Revertir
                      </button>
                    )}
                  </div>

                  {revertir === n.id && (
                    <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                      <Input
                        label="Motivo de la reversión"
                        placeholder="Se aplicó al cliente equivocado"
                        value={motivoRevertir}
                        onChange={(e) => setMotivoRevertir(e.target.value)}
                      />
                      <p className="text-xs text-neutral-500">
                        Las facturas vuelven al valor que tenían. Si alguna cambió después de la
                        nota, la reversión se rechaza para no borrar ese cambio.
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setRevertir(null)}>
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          loading={revertirNota.isPending}
                          disabled={motivoRevertir.trim().length < 5}
                          onClick={() => revertirNota.mutate(n.id)}
                        >
                          Revertir nota
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
