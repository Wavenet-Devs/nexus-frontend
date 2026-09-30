'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, ChevronRight, Users, Zap } from 'lucide-react';
import { readingsService } from '@/services/readings.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMonth } from '@/lib/utils';
import { BatchStatusBadge } from '@/components/readings/batch-status-badge';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function ReadingsPage() {
  const router = useRouter();

  const { data: batches, isLoading } = useQuery({
    queryKey: ['reading-batches'],
    queryFn:  readingsService.findAll,
  });

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => router.push('/dashboard/readings/new')}>
          <Plus className="h-3.5 w-3.5" />
          Nuevo lote
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !batches?.length ? (
        <Card padding="none">
          <EmptyState
            icon={BookOpen}
            title="Sin lotes de lectura"
            message="Crea el primer lote para comenzar a registrar lecturas de medidores."
            action={
              <Button onClick={() => router.push('/dashboard/readings/new')}>
                <Plus className="h-3.5 w-3.5" />
                Crear lote
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() => router.push(`/dashboard/readings/${b.id}`)}
              className="w-full text-left"
            >
              <Card padding="sm" className="hover:border-primary-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  {/* Month badge */}
                  <div className="shrink-0 w-14 h-14 rounded-xl bg-primary-50 border border-primary-100 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-primary-600 uppercase">
                      {MONTHS[(b.month - 1) % 12]}
                    </span>
                    <span className="text-lg font-bold text-primary-800 leading-tight">{b.year}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900">{formatMonth(b.month, b.year)}</p>
                      {b.status && <BatchStatusBadge status={b.status} />}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Users className="h-3 w-3" />
                        {Number(b.total_clients).toLocaleString('es-CO')} clientes
                      </span>
                      {b.total_consumed && (
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Zap className="h-3 w-3" />
                          {Number(b.total_consumed).toLocaleString('es-CO')} kWh
                        </span>
                      )}
                      <span className="text-xs text-neutral-400">
                        CU: ${Number(b.cu).toLocaleString('es-CO', { minimumFractionDigits: 2 })} / kWh
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="hidden sm:flex flex-col items-end shrink-0 text-xs text-neutral-400">
                    <span>Vence: {b.payment_limit ? new Date(b.payment_limit).toLocaleDateString('es-CO') : '—'}</span>
                    <span className="mt-0.5">{b.days} días</span>
                  </div>

                  <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
