'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, ChevronRight, AlertCircle } from 'lucide-react';
import { financingService } from '@/services/financing.service';
import { clientsService } from '@/services/clients.service';
import { paymentsService } from '@/services/payments.service';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

type Step = 'client' | 'form';

export default function NewFinancingPage() {
  const router       = useRouter();
  const qc           = useQueryClient();
  const searchParams = useSearchParams();

  const [step,           setStep]           = useState<Step>('client');
  const [clientSearch,   setClientSearch]   = useState('');
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; contract: string } | null>(null);

  const [name,             setName]             = useState('');
  const [financingValue,   setFinancingValue]   = useState('');
  const [quotas,           setQuotas]           = useState('12');
  const [cancelledQuotas,  setCancelledQuotas]  = useState('0');
  const [submitError,      setSubmitError]      = useState('');

  const debouncedSearch = useDebounce(clientSearch, 350);
  const preClientId     = searchParams.get('clientId');

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['client-search', debouncedSearch],
    queryFn:  () => clientsService.search(debouncedSearch),
    enabled:  debouncedSearch.length >= 2,
  });

  const { data: preClient } = useQuery({
    queryKey: ['client', preClientId],
    queryFn:  () => clientsService.findOne(preClientId!),
    enabled:  !!preClientId,
  });

  const { data: debt } = useQuery({
    queryKey: ['client-debt', selectedClient?.id],
    queryFn:  () => paymentsService.getClientDebt(selectedClient!.id),
    enabled:  !!selectedClient?.id && step === 'form',
  });

  useEffect(() => {
    if (preClient && !selectedClient) {
      setSelectedClient({ id: preClient.id, name: preClient.name, contract: preClient.contract });
      setStep('form');
    }
  }, [preClient, selectedClient]);

  const mutation = useMutation({
    mutationFn: () => financingService.create({
      clientId:       selectedClient!.id,
      name:           name.trim(),
      financingValue: parseFloat(financingValue) || 0,
      quotas:         parseInt(quotas, 10)        || 1,
      cancelledQuotas: parseInt(cancelledQuotas, 10) || undefined,
    }),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['financing'] });
      router.push(`/dashboard/financing/${plan.id}`);
    },
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.message ?? 'Error al crear el plan');
    },
  });

  // Derived
  const fv        = parseFloat(financingValue) || 0;
  const q         = parseInt(quotas, 10) || 1;
  const cq        = parseInt(cancelledQuotas, 10) || 0;
  const quotaAmt  = q > 0 ? fv / q : 0;
  const remaining = q - cq;

  // ── Step 1: select client ────────────────────────────────────────────────
  if (step === 'client') {
    return (
      <div className="space-y-5">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm w-fit">
          <ArrowLeft className="h-4 w-4" />
          Volver a financiación
        </button>

        <Card padding="md">
          <CardHeader className="pb-4">
            <CardTitle>Seleccionar cliente</CardTitle>
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
              {searching && <div className="py-6 text-center text-sm text-neutral-400">Buscando…</div>}
              {!searching && !searchResults?.length && <div className="py-6 text-center text-sm text-neutral-400">Sin resultados</div>}
              {searchResults?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClient(c); setStep('form'); }}
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

  // ── Step 2: plan form ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <button
        onClick={() => { setStep('client'); setSelectedClient(null); }}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Cambiar cliente
      </button>

      {/* Client + debt summary */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{selectedClient?.name}</p>
            <p className="text-xs text-neutral-500 font-mono">{selectedClient?.contract}</p>
          </div>
          {debt && (
            <div className="text-right">
              <p className="text-xs text-neutral-500">Deuda pendiente</p>
              <p className="text-sm font-bold text-red-600">{formatCurrency(debt.totalDebt)}</p>
              {debt.totalDebt > 0 && !financingValue && (
                <button
                  onClick={() => setFinancingValue(String(debt.totalDebt))}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Usar deuda total
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Form */}
      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Configurar plan</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="Nombre del plan"
            placeholder="Ej: Financiación deuda acumulada 2024"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Valor a financiar ($)"
            type="number"
            min={0.01}
            step={0.01}
            placeholder="0"
            value={financingValue}
            onChange={(e) => setFinancingValue(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Número de cuotas"
              type="number"
              min={1}
              step={1}
              value={quotas}
              onChange={(e) => setQuotas(e.target.value)}
            />
            <Input
              label="Cuotas ya pagadas"
              type="number"
              min={0}
              step={1}
              hint="Para migrar planes existentes"
              value={cancelledQuotas}
              onChange={(e) => setCancelledQuotas(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Live preview */}
      {fv > 0 && q > 0 && (
        <Card padding="md" className="border-primary-100 bg-primary-50/40">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-3">Resumen del plan</p>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-neutral-500">Valor total</p>
              <p className="font-bold text-neutral-900">{formatCurrency(fv)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Valor por cuota</p>
              <p className="font-bold text-primary-700">{formatCurrency(quotaAmt)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Cuotas pendientes</p>
              <p className="font-bold text-neutral-900">{remaining} de {q}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Saldo inicial</p>
              <p className="font-bold text-neutral-900">{formatCurrency(fv - cq * quotaAmt)}</p>
            </div>
          </div>
        </Card>
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
          disabled={!name.trim() || fv <= 0 || q < 1 || cq >= q}
          onClick={() => { setSubmitError(''); mutation.mutate(); }}
        >
          Crear plan
        </Button>
      </div>
    </div>
  );
}
