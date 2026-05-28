'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Landmark, Search, Plus, ChevronRight } from 'lucide-react';
import { financingService } from '@/services/financing.service';
import { useDebounce } from '@/hooks/use-debounce';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';

const LIMIT = 20;

const STATUS_OPTS = [
  { value: '',          label: 'Todos' },
  { value: 'active',    label: 'Activos' },
  { value: 'finished',  label: 'Finalizados' },
  { value: 'cancelled', label: 'Cancelados' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-blue-100 text-blue-700',
  finished:  'bg-green-100 text-green-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
};
const STATUS_LABELS: Record<string, string> = {
  active:    'Activo',
  finished:  'Finalizado',
  cancelled: 'Cancelado',
};

export default function FinancingPage() {
  const router = useRouter();

  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['financing', page, debouncedSearch, status],
    queryFn: () => financingService.findAll({
      search: debouncedSearch || undefined,
      status: status         || undefined,
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
            placeholder="Buscar por cliente o contrato…"
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
                status === opt.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <Button size="sm" onClick={() => router.push('/dashboard/financing/new')}>
            <Plus className="h-3.5 w-3.5" />
            Nuevo plan
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <Card padding="none">
          <EmptyState
            icon={Landmark}
            title="Sin planes de financiación"
            message="Crea un plan para financiar la deuda de un cliente."
            action={
              <Button onClick={() => router.push('/dashboard/financing/new')}>
                <Plus className="h-3.5 w-3.5" />
                Nuevo plan
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.data.map((plan) => {
              const pct = plan.quotas > 0
                ? Math.round((plan.cancelled_quotas / plan.quotas) * 100)
                : 0;
              return (
                <button
                  key={plan.id}
                  onClick={() => router.push(`/dashboard/financing/${plan.id}`)}
                  className="w-full text-left"
                >
                  <Card padding="sm" className="hover:border-primary-200 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-neutral-900">{plan.client_name}</span>
                          <span className="text-xs text-neutral-400 font-mono">{plan.contract}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[plan.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                            {STATUS_LABELS[plan.status] ?? plan.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 truncate">{plan.name}</p>

                        {/* Progress bar */}
                        <div className="mt-2.5">
                          <div className="flex justify-between text-xs text-neutral-400 mb-1">
                            <span>Cuota {plan.cancelled_quotas} de {plan.quotas}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                plan.status === 'finished'  ? 'bg-green-500' :
                                plan.status === 'cancelled' ? 'bg-neutral-300' :
                                'bg-primary-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-xs text-neutral-400">Saldo</span>
                        <span className={`text-sm font-bold ${plan.status === 'finished' ? 'text-green-600' : 'text-neutral-900'}`}>
                          {formatCurrency(plan.financed_balance)}
                        </span>
                        <span className="text-xs text-neutral-400">
                          Cuota: {formatCurrency(plan.quota_amount)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-neutral-300 mt-1" />
                      </div>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>

          <Card padding="none">
            <div className="px-5 py-3">
              <Pagination page={data.page} lastPage={data.lastPage} total={data.total} limit={LIMIT} onChange={setPage} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
