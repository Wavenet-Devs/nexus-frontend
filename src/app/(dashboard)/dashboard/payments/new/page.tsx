'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, ArrowLeft, Zap, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { paymentsService, type DebtInvoice, type InvoiceAllocation } from '@/services/payments.service';
import { clientsService } from '@/services/clients.service';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatMonth } from '@/lib/utils';

type Step = 'client' | 'payment';

const PAYMENT_TYPES = [
  { value: 'cash',     label: 'Efectivo',       emoji: '💵' },
  { value: 'transfer', label: 'Transferencia',  emoji: '🏦' },
  { value: 'card',     label: 'Tarjeta',        emoji: '💳' },
] as const;

export default function NewPaymentPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [step,          setStep]          = useState<Step>('client');
  const [clientSearch,  setClientSearch]  = useState('');
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; contract: string } | null>(null);

  // Payment form state
  const [receivedAmount, setReceivedAmount] = useState('');
  const [paymentType,    setPaymentType]    = useState<'cash' | 'transfer' | 'card'>('cash');
  const [paymentNumber,  setPaymentNumber]  = useState('');
  const [notes,          setNotes]          = useState('');
  const [allocations,    setAllocations]    = useState<Record<string, string>>({}); // invoiceId → amount string
  const [submitError,    setSubmitError]    = useState('');

  const debouncedSearch = useDebounce(clientSearch, 350);

  // Pre-select client from query param
  const preClientId = searchParams.get('clientId');

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['client-search', debouncedSearch],
    queryFn:  () => clientsService.search(debouncedSearch),
    enabled:  debouncedSearch.length >= 2,
  });

  const { data: debt, isLoading: loadingDebt } = useQuery({
    queryKey: ['client-debt', selectedClient?.id],
    queryFn:  () => paymentsService.getClientDebt(selectedClient!.id),
    enabled:  !!selectedClient?.id,
  });

  // Pre-load client from query param
  const { data: preClient } = useQuery({
    queryKey: ['client', preClientId],
    queryFn:  () => clientsService.findOne(preClientId!),
    enabled:  !!preClientId,
  });

  useEffect(() => {
    if (preClient && !selectedClient) {
      setSelectedClient({ id: preClient.id, name: preClient.name, contract: preClient.contract });
      setStep('payment');
    }
  }, [preClient, selectedClient]);

  // Auto-allocate: distributes received amount across invoices oldest-first
  const autoAllocate = useCallback(() => {
    if (!debt?.invoices?.length) return;
    const total = parseFloat(receivedAmount) || 0;
    if (total <= 0) return;

    let remaining = total;
    const newAllocs: Record<string, string> = {};

    for (const inv of debt.invoices) {
      if (remaining <= 0) break;
      const apply = Math.min(remaining, Number(inv.balance));
      const rounded = Math.round(apply * 100) / 100;
      newAllocs[inv.id] = rounded > 0 ? String(rounded) : '0';
      remaining = Math.round((remaining - rounded) * 100) / 100;
    }

    setAllocations(newAllocs);
  }, [debt, receivedAmount]);

  // Recalculate when amount changes
  useEffect(() => {
    if (Object.keys(allocations).length > 0) autoAllocate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receivedAmount]);

  const mutation = useMutation({
    mutationFn: () => {
      const allocs: InvoiceAllocation[] = Object.entries(allocations)
        .map(([invoiceId, amt]) => ({ invoiceId, amount: parseFloat(amt) || 0 }))
        .filter((a) => a.amount > 0);

      return paymentsService.create({
        clientId:      selectedClient!.id,
        amount:        parseFloat(receivedAmount) || 0,
        paymentType,
        paymentNumber: paymentNumber || undefined,
        changeAmount:  Math.max(0, (parseFloat(receivedAmount) || 0) - totalAllocated),
        notes:         notes || undefined,
        allocations:   allocs,
      });
    },
    onSuccess: (result) => {
      router.push(`/dashboard/payments/${result.payment.id}`);
    },
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.message ?? 'Error al registrar el cobro');
    },
  });

  // Derived values
  const received      = parseFloat(receivedAmount) || 0;
  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const change        = Math.max(0, received - totalAllocated);
  const totalDebt     = debt?.totalDebt ?? 0;

  const isOverAllocated = Math.round(totalAllocated * 100) > Math.round(received * 100);
  const canSubmit = received > 0 && totalAllocated > 0 && !isOverAllocated && !!selectedClient;

  const selectClient = (c: { id: string; name: string; contract: string }) => {
    setSelectedClient(c);
    setAllocations({});
    setStep('payment');
  };

  // ── Step 1: Select client ────────────────────────────────────────────────
  if (step === 'client') {
    return (
      <div className="space-y-5">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm w-fit">
          <ArrowLeft className="h-4 w-4" />
          Volver a cobros
        </button>

        <Card padding="md">
          <CardHeader className="pb-4">
            <CardTitle>Buscar cliente</CardTitle>
          </CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              autoFocus
              type="search"
              placeholder="Nombre o número de contrato…"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {debouncedSearch.length >= 2 && (
            <div className="mt-3 space-y-1">
              {searching && (
                <div className="py-6 text-center text-sm text-neutral-400">Buscando…</div>
              )}
              {!searching && !searchResults?.length && (
                <div className="py-6 text-center text-sm text-neutral-400">Sin resultados</div>
              )}
              {searchResults?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectClient(c)}
                  className="w-full text-left flex items-center justify-between px-3 py-3 rounded-lg hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{c.name}</p>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">{c.contract}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-300" />
                </button>
              ))}
            </div>
          )}

          {debouncedSearch.length < 2 && (
            <p className="mt-4 text-center text-sm text-neutral-400">Escribe al menos 2 caracteres para buscar</p>
          )}
        </Card>
      </div>
    );
  }

  // ── Step 2: Payment form ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <button
        onClick={() => { setStep('client'); setSelectedClient(null); setAllocations({}); }}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Cambiar cliente
      </button>

      {/* Client summary */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{selectedClient?.name}</p>
            <p className="text-xs text-neutral-500 font-mono">{selectedClient?.contract}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Deuda total</p>
            <p className={`text-base font-bold ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalDebt)}
            </p>
          </div>
        </div>
      </Card>

      {loadingDebt ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-neutral-100 rounded-xl" />
          <div className="h-32 bg-neutral-100 rounded-xl" />
        </div>
      ) : !debt?.invoices?.length ? (
        <Card padding="md">
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-800">Sin deuda pendiente</p>
            <p className="text-xs text-neutral-500 mt-1">Este cliente no tiene facturas sin pagar.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Amount + payment type */}
          <Card padding="md">
            <CardHeader className="pb-4">
              <CardTitle>Monto recibido</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Monto recibido ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-lg font-semibold placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Payment type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Forma de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setPaymentType(t.value)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        paymentType === t.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-xl">{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="N° de comprobante"
                  placeholder="Opcional"
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                />
                <Input
                  label="Notas"
                  placeholder="Opcional"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Invoice allocation */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Distribución por factura</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={autoAllocate}
                disabled={!received}
              >
                <Zap className="h-3.5 w-3.5" />
                Auto-distribuir
              </Button>
            </div>

            <div className="space-y-3">
              {debt.invoices.map((inv: DebtInvoice) => {
                const allocated = parseFloat(allocations[inv.id] ?? '0') || 0;
                const isFullyPaid = allocated >= Number(inv.balance);
                return (
                  <div key={inv.id} className={`rounded-xl border p-3 transition-colors ${
                    isFullyPaid ? 'border-green-200 bg-green-50' : 'border-neutral-200 bg-white'
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-800">{formatMonth(inv.month, inv.year)}</span>
                          <StatusBadge status={inv.status} />
                        </div>
                        <span className="text-xs text-neutral-500 mt-0.5 block">
                          Saldo: <strong>{formatCurrency(inv.balance)}</strong>
                          {inv.payment_limit && ` · Vence: ${new Date(inv.payment_limit).toLocaleDateString('es-CO')}`}
                        </span>
                      </div>
                      {isFullyPaid && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 shrink-0">Aplicar $</span>
                      <input
                        type="number"
                        min={0}
                        max={Number(inv.balance)}
                        step={0.01}
                        placeholder="0"
                        value={allocations[inv.id] ?? ''}
                        onChange={(e) =>
                          setAllocations((prev) => ({ ...prev, [inv.id]: e.target.value }))
                        }
                        className={`flex-1 h-8 rounded-lg border px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          isFullyPaid ? 'border-green-300 bg-green-50' : 'border-neutral-300 bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setAllocations((p) => ({ ...p, [inv.id]: String(inv.balance) }))}
                        className="text-xs text-primary-600 hover:underline shrink-0"
                      >
                        Máx
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Recibido</span>
                <span className="font-mono">{formatCurrency(received)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Total aplicado</span>
                <span className={`font-mono ${isOverAllocated ? 'text-red-600 font-semibold' : ''}`}>
                  {formatCurrency(totalAllocated)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-neutral-900 border-t border-neutral-100 pt-2">
                <span>Vuelto</span>
                <span className="font-mono">{formatCurrency(change)}</span>
              </div>
            </div>
          </Card>

          {isOverAllocated && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              El total aplicado supera el monto recibido
            </div>
          )}

          {submitError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-2 pb-6">
            <Button variant="ghost" onClick={() => router.back()}>Cancelar</Button>
            <Button
              loading={mutation.isPending}
              disabled={!canSubmit}
              onClick={() => { setSubmitError(''); mutation.mutate(); }}
            >
              Registrar cobro
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
