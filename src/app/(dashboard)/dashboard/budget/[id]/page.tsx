'use client';

import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileText, FileSpreadsheet } from 'lucide-react';
import { budgetService } from '@/services/budget.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CdpForm } from '../_components/cdp-form';
import { RpForm } from '../_components/rp-form';

export default function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [cdpOpen, setCdpOpen] = useState(false);
  const [rpOpen, setRpOpen]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => budgetService.findOne(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-neutral-100 rounded animate-pulse" />
        <div className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) return null;
  const { budget, approved, executed, available, cdps, rps } = data;

  function openCertificate(url: string) {
    if (typeof window !== 'undefined') window.open(url, '_blank');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/budget')}>
          <ArrowLeft className="h-4 w-4" /> Presupuestos
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setCdpOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Nuevo CDP
          </Button>
          <Button size="sm" onClick={() => setRpOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Nuevo movimiento (RP)
          </Button>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="sm">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Apropiado — Vigencia {budget.age}</p>
          <p className="text-xl font-bold text-neutral-900 mt-1">{formatCurrency(approved)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Ejecutado</p>
          <p className="text-xl font-bold text-neutral-900 mt-1">{formatCurrency(executed)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Disponible</p>
          <p className={`text-xl font-bold mt-1 ${available < 0 ? 'text-danger-600' : 'text-primary-700'}`}>{formatCurrency(available)}</p>
        </Card>
      </div>

      {/* CDP */}
      <Card padding="none">
        <div className="px-5 pt-5"><CardHeader><CardTitle>CDP — Certificados de Disponibilidad</CardTitle></CardHeader></div>
        {!cdps.length ? (
          <EmptyState title="Sin CDP" message="Crea un CDP para reservar disponibilidad presupuestal." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-400 uppercase border-b border-neutral-100">
                  <th className="px-5 py-2 font-medium">Código</th>
                  <th className="px-5 py-2 font-medium">Rubro</th>
                  <th className="px-5 py-2 font-medium">Cuenta</th>
                  <th className="px-5 py-2 font-medium text-right">Valor</th>
                  <th className="px-5 py-2 font-medium text-right">Ejecutado</th>
                  <th className="px-5 py-2 font-medium text-right">Disponible</th>
                  <th className="px-5 py-2 font-medium text-right">Certificado</th>
                </tr>
              </thead>
              <tbody>
                {cdps.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-5 py-2.5 font-mono text-xs text-neutral-700">{c.code}</td>
                    <td className="px-5 py-2.5 text-neutral-700">{c.category}</td>
                    <td className="px-5 py-2.5 text-neutral-500">{c.account}</td>
                    <td className="px-5 py-2.5 text-right">{formatCurrency(c.amount)}</td>
                    <td className="px-5 py-2.5 text-right text-neutral-500">{formatCurrency(c.executed)}</td>
                    <td className="px-5 py-2.5 text-right font-semibold">{formatCurrency(c.available)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <button onClick={() => openCertificate(budgetService.cdpCertificateUrl(c.id))} className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* RP */}
      <Card padding="none">
        <div className="px-5 pt-5"><CardHeader><CardTitle>RP — Registros Presupuestales</CardTitle></CardHeader></div>
        {!rps.length ? (
          <EmptyState title="Sin RP" message="Registra un movimiento (gasto o ingreso) contra el presupuesto." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-400 uppercase border-b border-neutral-100">
                  <th className="px-5 py-2 font-medium">Código</th>
                  <th className="px-5 py-2 font-medium">Tipo</th>
                  <th className="px-5 py-2 font-medium">CDP / Rubro</th>
                  <th className="px-5 py-2 font-medium">Tercero</th>
                  <th className="px-5 py-2 font-medium">Fecha</th>
                  <th className="px-5 py-2 font-medium text-right">Valor</th>
                  <th className="px-5 py-2 font-medium text-right">Certificado</th>
                </tr>
              </thead>
              <tbody>
                {rps.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-5 py-2.5 font-mono text-xs text-neutral-700">{r.code}</td>
                    <td className="px-5 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-neutral-700">{r.cdp_code ?? r.category ?? '—'}</td>
                    <td className="px-5 py-2.5 text-neutral-500">{r.supplier ?? '—'}</td>
                    <td className="px-5 py-2.5 text-neutral-500">{r.create_date ? formatDate(r.create_date) : '—'}</td>
                    <td className={`px-5 py-2.5 text-right font-semibold ${r.type === 'income' ? 'text-green-600' : ''}`}>
                      {formatCurrency(Math.abs(Number(r.amount)))}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button onClick={() => openCertificate(budgetService.rpCertificateUrl(r.id))} className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CdpForm open={cdpOpen} onClose={() => setCdpOpen(false)} budgetId={id} />
      <RpForm open={rpOpen} onClose={() => setRpOpen(false)} budgetId={id} cdps={cdps} />
    </div>
  );
}
