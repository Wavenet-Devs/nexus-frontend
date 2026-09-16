'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { CreditCard, Search, Filter, Plus, Upload } from 'lucide-react';
import { paymentsService } from '@/services/payments.service';
import { useDebounce } from '@/hooks/use-debounce';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';

const LIMIT = 20;
const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];
const PAYMENT_TYPES: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' };
const TYPE_COLORS:   Record<string, string> = {
  cash:     'bg-green-100 text-green-700',
  transfer: 'bg-blue-100 text-blue-700',
  card:     'bg-purple-100 text-purple-700',
};

export default function PaymentsPage() {
  const router = useRouter();

  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [month,       setMonth]       = useState<number | ''>(CURRENT_MONTH);
  const [year,        setYear]        = useState<number | ''>(CURRENT_YEAR);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, debouncedSearch, paymentType, month, year],
    queryFn: () => paymentsService.findAll({
      search:      debouncedSearch || undefined,
      paymentType: paymentType    || undefined,
      month:       month          || undefined,
      year:        year           || undefined,
      page,
      limit: LIMIT,
    }),
  });

  return (
    <div className="space-y-5">
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
            {Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}
            className={paymentType ? 'border-primary-500 text-primary-600' : ''}>
            <Filter className="h-3.5 w-3.5" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/payments/import')}>
            <Upload className="h-3.5 w-3.5" />
            Recaudo en bloque
          </Button>
          <Button size="sm" onClick={() => router.push('/dashboard/payments/new')}>
            <Plus className="h-3.5 w-3.5" />
            Registrar cobro
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card padding="sm">
          <div className="flex flex-wrap gap-2">
            {(['', 'cash', 'transfer', 'card'] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setPaymentType(type); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  paymentType === type
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
                }`}
              >
                {type === '' ? 'Todos' : PAYMENT_TYPES[type]}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding="none">
        {isLoading ? (
          <TableSkeleton />
        ) : !data?.data?.length ? (
          <EmptyState
            icon={CreditCard}
            title="Sin cobros registrados"
            message="Registra el primer cobro para verlo aquí."
            action={
              <Button onClick={() => router.push('/dashboard/payments/new')}>
                <Plus className="h-3.5 w-3.5" />
                Registrar cobro
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <Th>Contrato</Th>
                    <Th>Cliente</Th>
                    <Th>Fecha</Th>
                    <Th>Tipo</Th>
                    <Th>Comprobante</Th>
                    <Th right>Monto recibido</Th>
                    <Th right>Vuelto</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/payments/${p.id}`)}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-neutral-600">{p.contract}</td>
                      <td className="px-5 py-3.5 font-medium text-neutral-900">{p.client_name}</td>
                      <td className="px-5 py-3.5 text-neutral-500 text-xs">
                        {new Date(p.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[p.payment_type] ?? 'bg-neutral-100 text-neutral-600'}`}>
                          {PAYMENT_TYPES[p.payment_type] ?? p.payment_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500 text-xs font-mono">{p.payment_number || '—'}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3.5 text-right text-neutral-500">{formatCurrency(p.change_amount ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-neutral-100">
              {data.data.map((p) => (
                <div
                  key={p.id}
                  className="px-4 py-3.5 hover:bg-neutral-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/payments/${p.id}`)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-900">{p.client_name}</span>
                    <span className="text-sm font-bold text-neutral-900">{formatCurrency(p.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {new Date(p.created_at).toLocaleDateString('es-CO')} · {p.contract}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[p.payment_type] ?? 'bg-neutral-100 text-neutral-600'}`}>
                      {PAYMENT_TYPES[p.payment_type] ?? p.payment_type}
                    </span>
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

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
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
