'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Upload, Zap, Users, AlertTriangle,
  CheckCircle2, FileSpreadsheet, Search, Play, X,
} from 'lucide-react';
import { readingsService, type ImportResult } from '@/services/readings.service';
import { billingService } from '@/services/billing.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMonth } from '@/lib/utils';

type Tab = 'tariffs' | 'missing';

export default function ReadingBatchPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const qc       = useQueryClient();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [tab,          setTab]          = useState<Tab>('tariffs');
  const [search,       setSearch]       = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: batch, isLoading } = useQuery({
    queryKey: ['reading-batch', id],
    queryFn:  () => readingsService.findOne(id),
  });

  const { data: tariffs, isLoading: loadingTariffs } = useQuery({
    queryKey: ['reading-tariffs', id],
    queryFn:  () => readingsService.findTariffs(id),
    enabled:  tab === 'tariffs',
  });

  const { data: missing, isLoading: loadingMissing } = useQuery({
    queryKey: ['reading-missing', id],
    queryFn:  () => readingsService.getMissingClients(id),
    enabled:  tab === 'missing',
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => readingsService.importXlsx(id, file),
    onSuccess: (result) => {
      setImportResult(result);
      qc.invalidateQueries({ queryKey: ['reading-batch', id] });
      qc.invalidateQueries({ queryKey: ['reading-tariffs', id] });
      qc.invalidateQueries({ queryKey: ['reading-missing', id] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => billingService.generate(id),
    onSuccess: () => {
      router.push('/dashboard/billing');
    },
  });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) importMutation.mutate(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importMutation.mutate(file);
    e.target.value = '';
  };

  if (isLoading) return <PageSkeleton />;
  if (!batch) return null;

  const totalClients  = Number(batch.total_clients ?? 0);
  const totalConsumed = Number(batch.total_consumed ?? 0);
  const zeroReadings  = Number(batch.zero_readings ?? 0);

  const filteredTariffs = (tariffs ?? []).filter((t) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.contract?.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredMissing = (missing ?? []).filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contract?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a lecturas
        </button>
        <Button
          onClick={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
          disabled={totalClients === 0}
        >
          <Play className="h-3.5 w-3.5" />
          Generar facturas
        </Button>
      </div>

      {/* Header */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{formatMonth(batch.month, batch.year)}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {batch.period_start && batch.period_end
                ? `${new Date(batch.period_start).toLocaleDateString('es-CO')} — ${new Date(batch.period_end).toLocaleDateString('es-CO')}`
                : 'Sin fechas de período'}
            </p>
          </div>
          <div className="text-sm text-neutral-500">
            Vence: <span className="font-medium text-neutral-800">
              {batch.payment_limit ? new Date(batch.payment_limit).toLocaleDateString('es-CO') : '—'}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-100">
          <StatChip icon={Users} label="Clientes" value={totalClients.toLocaleString('es-CO')} />
          <StatChip icon={Zap} label="Consumo total" value={`${totalConsumed.toLocaleString('es-CO')} kWh`} />
          <StatChip icon={AlertTriangle} label="Lectura cero" value={zeroReadings.toLocaleString('es-CO')} warn={zeroReadings > 0} />
          <StatChip icon={FileSpreadsheet} label="CU" value={`$${Number(batch.cu).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`} />
        </div>
      </Card>

      {/* Import result */}
      {importResult && (
        <Card padding="md" className="border-green-200 bg-green-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Importación completada</p>
                <p className="text-sm text-green-700 mt-0.5">
                  {importResult.imported} importados · {importResult.created} clientes nuevos · {importResult.skipped} omitidos
                  {importResult.errors.length > 0 && ` · ${importResult.errors.length} errores`}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-xs text-red-700">
                        Fila {e.row} ({e.contract}): {e.reason}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-xs text-red-600">…y {importResult.errors.length - 5} más</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setImportResult(null)} className="text-green-400 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* XLSX Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          importMutation.isPending
            ? 'border-primary-300 bg-primary-50'
            : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 cursor-pointer'
        }`}
        onClick={() => !importMutation.isPending && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        {importMutation.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            <p className="text-sm text-primary-700 font-medium">Procesando XLSX…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-600">Arrastra el XLSX o haz clic para subir</p>
            <p className="text-xs text-neutral-400">
              Columnas: Contrato · Nombre · Dirección · Medidor · L.anterior · L.actual · Consumo · Ruta · Causal
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-1">
          {(['tariffs', 'missing'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {t === 'tariffs' ? `Lecturas (${totalClients})` : `Sin lectura (${missing?.length ?? '…'})`}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por nombre o contrato…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Tariffs table */}
      {tab === 'tariffs' && (
        <Card padding="none">
          {loadingTariffs ? (
            <TableSkeleton />
          ) : !filteredTariffs.length ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="Sin lecturas"
              message="Sube el archivo XLSX para importar las lecturas de este período."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <Th>Contrato</Th>
                    <Th>Cliente</Th>
                    <Th>Ruta</Th>
                    <Th>Estrato</Th>
                    <Th right>L. Anterior</Th>
                    <Th right>L. Actual</Th>
                    <Th right>Consumo kWh</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTariffs.map((t) => (
                    <tr key={t.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">{t.contract}</td>
                      <td className="px-4 py-3 font-medium text-neutral-900">{t.name}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{t.route || '—'}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{t.stratum_name || '—'}</td>
                      <Td right mono>{Number(t.last_reading).toLocaleString('es-CO')}</Td>
                      <Td right mono>{Number(t.actual_reading).toLocaleString('es-CO')}</Td>
                      <Td right>
                        <span className={`font-semibold ${Number(t.consumed) === 0 ? 'text-amber-600' : 'text-neutral-900'}`}>
                          {Number(t.consumed).toLocaleString('es-CO')}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Missing clients */}
      {tab === 'missing' && (
        <Card padding="none">
          {loadingMissing ? (
            <TableSkeleton />
          ) : !filteredMissing.length ? (
            <EmptyState
              icon={CheckCircle2}
              title="Sin anomalías"
              message="Todos los clientes activos tienen lectura en este período."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <Th>Contrato</Th>
                    <Th>Cliente</Th>
                    <Th>Dirección</Th>
                    <Th>Ruta</Th>
                    <Th>Estrato</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMissing.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-50 hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">{c.contract}</td>
                      <td className="px-4 py-3 font-medium text-neutral-900">{c.name}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{c.address || '—'}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{c.route || '—'}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{c.stratum_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatChip({ icon: Icon, label, value, warn }: { icon: any; label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${warn ? 'bg-amber-50 border border-amber-100' : 'bg-neutral-50 border border-neutral-100'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3.5 w-3.5 ${warn ? 'text-amber-500' : 'text-neutral-400'}`} />
        <span className="text-xs text-neutral-500 uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-base font-bold ${warn ? 'text-amber-700' : 'text-neutral-800'}`}>{value}</span>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function Td({ children, right, mono }: { children: React.ReactNode; right?: boolean; mono?: boolean }) {
  return (
    <td className={`px-4 py-3 text-neutral-700 ${right ? 'text-right' : ''} ${mono ? 'font-mono text-xs' : ''}`}>
      {children}
    </td>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-40 bg-neutral-100 rounded" />
      <div className="h-36 bg-neutral-100 rounded-xl" />
      <div className="h-20 bg-neutral-100 rounded-xl" />
    </div>
  );
}
