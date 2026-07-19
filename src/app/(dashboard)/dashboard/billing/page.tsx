'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Search, Filter, Printer } from 'lucide-react';
import { billingService } from '@/services/billing.service';
import { catalogsService } from '@/services/catalogs.service';
import { useDebounce } from '@/hooks/use-debounce';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatMonth } from '@/lib/utils';

const LIMIT = 20;
const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

export default function BillingPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [page,           setPage]           = useState(1);
  const [search,         setSearch]         = useState('');
  const [status,         setStatus]         = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [month,          setMonth]          = useState<number | ''>(CURRENT_MONTH);
  const [year,           setYear]           = useState<number | ''>(CURRENT_YEAR);
  const [showFilters,    setShowFilters]    = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const clientId  = searchParams.get('clientId') ?? undefined;
  const readingId = searchParams.get('readingId') ?? undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, debouncedSearch, status, neighborhoodId, readingId, month, year, clientId],
    queryFn: () => billingService.findAll({
      search:         debouncedSearch || undefined,
      status:         status || undefined,
      neighborhoodId: neighborhoodId || undefined,
      readingId,
      month:          readingId ? undefined : (month || undefined),
      year:           readingId ? undefined : (year || undefined),
      clientId,
      page,
      limit: LIMIT,
    }),
  });

  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn:  catalogsService.getNeighborhoods,
  });

  const hasFilters = !!(status || neighborhoodId);

  return (
    <div className="space-y-5">
      {/* Banner de lote recién generado — impresión masiva */}
      {readingId && (
        <Card padding="md" className="border-primary-200 bg-primary-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary-800">Facturas de este lote</p>
                <p className="text-xs text-primary-600">Imprime todas o filtra por barrio para un PDF más liviano.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={neighborhoodId}
                onChange={(e) => { setNeighborhoodId(e.target.value); setPage(1); }}
                className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los barrios</option>
                {neighborhoods?.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={!neighborhoodId}
                onClick={() => window.open(billingService.getBatchPrintUrl(readingId, { neighborhoodId }), '_blank')}
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir barrio
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(billingService.getBatchPrintUrl(readingId), '_blank')}
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir todas
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por nombre o contrato…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        {/* Período inline */}
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => { setMonth(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los meses</option>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => { setYear(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los años</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className={hasFilters ? 'border-primary-500 text-primary-600' : ''}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Filtros extras */}
      {showFilters && (
        <Card padding="sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Estado"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">Todos los estados</option>
              <option value="unpaid">Sin pagar</option>
              <option value="paid">Pagado</option>
              <option value="partial">Parcial</option>
            </Select>
            <Select
              label="Barrio"
              value={neighborhoodId}
              onChange={(e) => { setNeighborhoodId(e.target.value); setPage(1); }}
            >
              <option value="">Todos los barrios</option>
              {neighborhoods?.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setStatus(''); setNeighborhoodId(''); setPage(1); }}
              className="mt-3 text-xs text-primary-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </Card>
      )}

      {/* Tabla */}
      <Card padding="none">
        {isLoading ? (
          <TableSkeleton />
        ) : !data?.data?.length ? (
          <EmptyState
            icon={FileText}
            title="No se encontraron facturas"
            message="Prueba ajustando el período o los filtros."
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Contrato</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Período</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Total</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Saldo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Vencimiento</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/billing/${inv.id}`)}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-neutral-600">{inv.contract}</td>
                      <td className="px-5 py-3.5 font-medium text-neutral-900">{inv.client_name}</td>
                      <td className="px-5 py-3.5 text-neutral-600">{formatMonth(inv.month, inv.year)}</td>
                      <td className="px-5 py-3.5 text-right text-neutral-700">{formatCurrency(inv.total)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(inv.balance)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-3.5 text-xs text-neutral-500">
                        {inv.payment_limit ? new Date(inv.payment_limit).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(billingService.getPreviewUrl(inv.id), '_blank')}
                        >
                          Ver factura
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-neutral-100">
              {data.data.map((inv) => (
                <div
                  key={inv.id}
                  className="px-4 py-3.5 hover:bg-neutral-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/billing/${inv.id}`)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-900">{inv.client_name}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">{formatMonth(inv.month, inv.year)} · {inv.contract}</span>
                    <span className="text-sm font-bold text-neutral-900">{formatCurrency(inv.balance)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-4">
              <Pagination page={data.page} lastPage={data.lastPage} total={data.total} limit={LIMIT} onChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-neutral-100 animate-pulse" />
      ))}
    </div>
  );
}
