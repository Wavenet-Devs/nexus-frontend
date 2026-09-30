'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Upload, Zap, Users, AlertTriangle,
  CheckCircle2, FileSpreadsheet, Search, Play, X, Pencil, Printer, Calculator,
} from 'lucide-react';
import {
  readingsService, type ImportResult, type ReadingTariff, type ReadingBatchStatus,
} from '@/services/readings.service';
import {
  BatchStatusBadge, BATCH_STATUS_LABEL, TRANSITION_ACTION, isReopen,
} from '@/components/readings/batch-status-badge';
import { billingService, type BatchRecalcResult, type BillingGenerationRun } from '@/services/billing.service';
import { importsService, isImportActive } from '@/services/imports.service';
import { useImportJob } from '@/hooks/use-import-job';
import { catalogsService } from '@/services/catalogs.service';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMonth } from '@/lib/utils';

type Tab = 'tariffs' | 'missing';

/** Mensaje de error que devuelve el API, o el texto por defecto. */
function apiMessage(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(msg) ? msg.join('. ') : msg ?? fallback;
}

export default function ReadingBatchPage() {
  const [recalcOpen, setRecalcOpen] = useState(false);
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const qc       = useQueryClient();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [tab,          setTab]          = useState<Tab>('tariffs');
  const [search,       setSearch]       = useState('');
  const [printNeighborhoodId, setPrintNeighborhoodId] = useState('');

  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn:  catalogsService.getNeighborhoods,
  });

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

  // ── Importación XLSX en segundo plano ──
  // El backend responde 202 con el job; aquí se sigue su avance y, al recargar,
  // se retoma una importación que siga en curso. El resultado se deriva del job.
  const [trackedImportId, setTrackedImportId] = useState<string | null>(null);
  const [dismissedImportId, setDismissedImportId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { data: recentImports } = useQuery({
    queryKey: ['reading-imports', id],
    queryFn:  () => importsService.list({ type: 'readings', readingId: id }),
  });
  const activeImportId = trackedImportId ?? recentImports?.find(isImportActive)?.id ?? null;
  const { data: importJob } = useImportJob(activeImportId);
  const importing = isImportActive(importJob);

  const importMutation = useMutation({
    mutationFn: (file: File) => readingsService.importXlsx(id, file),
    onMutate: () => setUploadError(null),
    onSuccess: (job) => setTrackedImportId(job.id),
    onError: (e: unknown) => setUploadError(apiMessage(e, 'No se pudo subir el archivo')),
  });

  const finishedJob = importJob && !importing && importJob.id === activeImportId && importJob.id !== dismissedImportId
    ? importJob : null;
  const importResult: ImportResult | null = finishedJob?.status === 'completed'
    ? {
        total:     finishedJob.total,
        processed: finishedJob.processed,
        imported:  finishedJob.created + finishedJob.updated,
        updated:   finishedJob.updated,
        skipped:   finishedJob.skipped,
        created:   finishedJob.clientsCreated,
        errors:    (finishedJob.errors ?? []).map((e) => ({ row: e.row, contract: e.contract ?? '—', reason: e.reason ?? e.message ?? '' })),
        warnings:  (finishedJob.warnings ?? []).map((w) => ({ row: w.row, contract: w.contract ?? '—', reason: w.reason ?? w.message ?? '' })),
        jobId:     finishedJob.id,
        fileName:  finishedJob.fileName,
      }
    : null;
  const importError = uploadError ?? (finishedJob?.status === 'failed' ? finishedJob.failureReason ?? 'La importación falló' : null);
  const dismissImport = () => { setUploadError(null); if (finishedJob) setDismissedImportId(finishedJob.id); };

  // Al terminar, refrescar el lote y sus lecturas
  const finishedImportId = finishedJob?.id ?? null;
  useEffect(() => {
    if (!finishedImportId) return;
    qc.invalidateQueries({ queryKey: ['reading-batch', id] });
    qc.invalidateQueries({ queryKey: ['reading-tariffs', id] });
    qc.invalidateQueries({ queryKey: ['reading-missing', id] });
    qc.invalidateQueries({ queryKey: ['reading-imports', id] });
  }, [finishedImportId, id, qc]);

  const [actionError, setActionError] = useState<string | null>(null);

  // ── Generación de facturas en segundo plano ──
  // El backend responde 202 y procesa en una cola; aquí se sigue el avance.
  // Al recargar la página se retoma la última ejecución del lote.
  const [runId, setRunId] = useState<string | null>(null);

  const { data: latestRun } = useQuery({
    queryKey: ['billing-generation-latest', id],
    queryFn:  () => billingService.getLatestGeneration(id),
  });
  const trackedRunId = runId ?? (latestRun && ['queued', 'running'].includes(latestRun.status) ? latestRun.id : null);

  const { data: run } = useQuery({
    queryKey: ['billing-generation-run', trackedRunId],
    queryFn:  () => billingService.getGenerationRun(trackedRunId!),
    enabled:  !!trackedRunId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 1500;
    },
  });
  const generating = !!run && (run.status === 'queued' || run.status === 'running');

  // Al terminar, refrescar el lote (queda BILLED)
  const finishedRunId = run && !generating ? run.id : null;
  useEffect(() => {
    if (!finishedRunId) return;
    qc.invalidateQueries({ queryKey: ['reading-batch', id] });
    qc.invalidateQueries({ queryKey: ['reading-batches'] });
  }, [finishedRunId, id, qc]);

  const generateMutation = useMutation({
    mutationFn: () => billingService.generate(id),
    onSuccess: (started) => setRunId(started.id),
    onError: (e: unknown) => {
      // Ya hay una ejecución en curso: seguir esa en vez de mostrar error
      const runningId = (e as { response?: { data?: { runId?: string } } })?.response?.data?.runId;
      if (runningId) setRunId(runningId);
      else setActionError(apiMessage(e, 'No se pudieron generar las facturas'));
    },
  });

  // ── Cambio de estado del lote ──
  const [transitionTo, setTransitionTo] = useState<ReadingBatchStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionError, setTransitionError] = useState('');

  const statusMutation = useMutation({
    mutationFn: () => readingsService.changeStatus(id, transitionTo!, transitionReason.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reading-batch', id] });
      qc.invalidateQueries({ queryKey: ['reading-batches'] });
      setTransitionTo(null);
    },
    onError: (e: unknown) => setTransitionError(apiMessage(e, 'No se pudo cambiar el estado')),
  });

  function openTransition(to: ReadingBatchStatus) {
    setTransitionTo(to);
    setTransitionReason('');
    setTransitionError('');
  }

  // ── Edición de una lectura ──
  const [editTariff, setEditTariff] = useState<ReadingTariff | null>(null);
  const [editForm,   setEditForm]   = useState({ lastReading: '', actualReading: '', reason: '' });
  const [editError,  setEditError]  = useState('');
  const [invoiceWarn, setInvoiceWarn] = useState<string | null>(null);

  const { data: tariffHistory } = useQuery({
    queryKey: ['tariff-history', editTariff?.id],
    queryFn:  () => readingsService.getTariffHistory(editTariff!.id),
    enabled:  !!editTariff,
  });

  const editTariffMutation = useMutation({
    mutationFn: () => readingsService.updateTariffReading(editTariff!.id, {
      lastReading:   editForm.lastReading   !== '' ? Number(editForm.lastReading)   : undefined,
      actualReading: editForm.actualReading !== '' ? Number(editForm.actualReading) : undefined,
      reason:        editForm.reason.trim(),
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['reading-tariffs', id] });
      qc.invalidateQueries({ queryKey: ['reading-batch', id] });
      setEditTariff(null);
      if (res.hasInvoice) {
        setInvoiceWarn('Esta lectura ya tenía factura generada. Ve a Facturación y recalcula esa factura para reflejar el cambio.');
      }
    },
    onError: (e: any) => setEditError(e?.response?.data?.message ?? 'No se pudo guardar'),
  });

  function openEdit(t: ReadingTariff) {
    setEditTariff(t);
    setEditForm({ lastReading: String(t.last_reading), actualReading: String(t.actual_reading), reason: '' });
    setEditError('');
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && !importing) importMutation.mutate(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importMutation.mutate(file);
    e.target.value = '';
  };

  if (isLoading) return <PageSkeleton />;
  if (!batch) return null;

  const status: ReadingBatchStatus = batch.status ?? 'COLLECTING';
  const canImport   = status === 'DRAFT' || status === 'COLLECTING';
  const canGenerate = status === 'READY_TO_BILL' || status === 'BILLED';
  const canRecalc   = status === 'BILLED';
  const canEdit     = status !== 'CLOSED';
  const transitions = (batch.allowed_transitions ?? []).filter((t) => TRANSITION_ACTION[status]?.[t]);

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
        <div className="flex flex-wrap items-center gap-2">
          {transitions.map((t) => (
            <Button key={t} variant="outline" onClick={() => openTransition(t)}>
              {TRANSITION_ACTION[status]![t]}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setRecalcOpen(true)}
            disabled={!canRecalc}
            title={canRecalc ? undefined : 'Solo se recalcula un lote facturado'}
          >
            <Calculator className="h-3.5 w-3.5" />
            Recalcular período
          </Button>
          <Button
            onClick={() => { setActionError(null); generateMutation.mutate(); }}
            loading={generateMutation.isPending || generating}
            disabled={totalClients === 0 || !canGenerate || generating}
            title={canGenerate ? undefined : 'Cierra la captura (Listo para facturar) antes de generar facturas'}
          >
            <Play className="h-3.5 w-3.5" />
            Generar facturas
          </Button>
        </div>
      </div>

      {/* Header */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-neutral-900">{formatMonth(batch.month, batch.year)}</h1>
              <BatchStatusBadge status={status} />
            </div>
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

      {/* Facturas del lote — ver / imprimir / descargar PDF */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-neutral-800">Facturas de este lote</p>
              <p className="text-xs text-neutral-500">Imprime o descarga en PDF todas las facturas del lote, o filtra por barrio.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/billing?readingId=${id}`)}>
              Ver facturas
            </Button>
            <select
              value={printNeighborhoodId}
              onChange={(e) => setPrintNeighborhoodId(e.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los barrios</option>
              {neighborhoods?.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <Button
              variant="outline" size="sm"
              disabled={!printNeighborhoodId}
              onClick={() => window.open(billingService.getBatchPrintUrl(id, { neighborhoodId: printNeighborhoodId }), '_blank')}
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir barrio
            </Button>
            <Button
              size="sm"
              onClick={() => window.open(billingService.getBatchPrintUrl(id), '_blank')}
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir todas
            </Button>
          </div>
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
                  {importResult.imported} importados{importResult.updated ? ` (${importResult.updated} reemplazadas)` : ''} · {importResult.created} clientes nuevos · {importResult.skipped} omitidos
                  {importResult.errors.length > 0 && ` · ${importResult.errors.length} errores`}
                  {(importResult.warnings?.length ?? 0) > 0 && ` · ${importResult.warnings!.length} advertencias`}
                </p>
                {(importResult.warnings?.length ?? 0) > 0 && (
                  <div className="mt-2 space-y-1">
                    {importResult.warnings!.slice(0, 5).map((w, i) => (
                      <p key={i} className="text-xs text-amber-700">
                        Fila {w.row} ({w.contract}): {w.reason}
                      </p>
                    ))}
                  </div>
                )}
                {importResult.jobId && (importResult.errors.length > 0 || (importResult.warnings?.length ?? 0) > 0) && (
                  <button
                    onClick={() => importsService.downloadReport({ id: importResult.jobId!, fileName: importResult.fileName ?? '' })}
                    className="mt-1 text-xs font-medium text-primary-700 underline"
                  >
                    Descargar reporte completo (XLSX)
                  </button>
                )}
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
            <button onClick={dismissImport} className="text-green-400 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {importError && (
        <Card padding="md" className="border-red-200 bg-red-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{importError}</p>
            </div>
            <button onClick={dismissImport} className="text-red-400 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Aviso: lectura editada con factura existente */}
      {invoiceWarn && (
        <Card padding="md" className="border-amber-200 bg-amber-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{invoiceWarn}</p>
            </div>
            <button onClick={() => setInvoiceWarn(null)} className="text-amber-400 hover:text-amber-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {actionError && (
        <Card padding="md" className="border-red-200 bg-red-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {run && (run.status !== 'completed' || runId) && (
        <GenerationProgressCard
          run={run}
          onViewInvoices={() => router.push(`/dashboard/billing?readingId=${id}`)}
          onDismiss={() => setRunId(null)}
        />
      )}

      {/* XLSX Upload zone */}
      {canImport ? (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          importMutation.isPending || importing
            ? 'border-primary-300 bg-primary-50'
            : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 cursor-pointer'
        }`}
        onClick={() => !(importMutation.isPending || importing) && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        {importMutation.isPending || importing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            <p className="text-sm text-primary-700 font-medium">
              {importMutation.isPending
                ? 'Subiendo archivo…'
                : importJob?.status === 'queued'
                  ? 'Importación en cola…'
                  : `Importando… ${importJob?.processed.toLocaleString('es-CO') ?? 0} de ${importJob?.total.toLocaleString('es-CO') ?? '…'} filas (${importJob?.percent ?? 0}%)`}
            </p>
            {importing && <p className="text-xs text-neutral-500">Puedes seguir trabajando: el proceso continúa en el servidor.</p>}
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
      ) : (
        <div className="border border-neutral-200 rounded-xl p-4 text-sm text-neutral-500 bg-neutral-50">
          El lote está en estado <span className="font-medium text-neutral-700">{BATCH_STATUS_LABEL[status]}</span>:
          no admite nuevas lecturas.
          {status === 'READY_TO_BILL' && ' Reabre la captura si necesitas importar más.'}
        </div>
      )}

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
                    <Th right>Acción</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTariffs.map((t) => (
                    <tr key={t.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">{t.contract}</td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        <div className="flex items-center gap-2">
                          {t.name}
                          {t.edited && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700" title={`Modificada · v${t.version}`}>
                              Modificada
                            </span>
                          )}
                          {t.causal_name && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600"
                              title={`Causal de esta lectura${t.causal_code ? ` (código ${t.causal_code})` : ''}`}
                            >
                              {t.causal_name}
                            </span>
                          )}
                          {t.source === 'lector_app' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700" title="Capturada en campo con Lector App">
                              Lector App
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{t.route || '—'}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{t.stratum_name || '—'}</td>
                      <Td right mono>{Number(t.last_reading).toLocaleString('es-CO')}</Td>
                      <Td right mono>{Number(t.actual_reading).toLocaleString('es-CO')}</Td>
                      <Td right>
                        <span className={`font-semibold ${Number(t.consumed) === 0 ? 'text-amber-600' : 'text-neutral-900'}`}>
                          {Number(t.consumed).toLocaleString('es-CO')}
                        </span>
                      </Td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(t)}
                          disabled={!canEdit}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                          title={canEdit ? 'Corregir lectura' : 'El período está cerrado'}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
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
      {/* Diálogo: corregir lectura */}
      <Dialog
        open={!!transitionTo}
        onClose={() => setTransitionTo(null)}
        title={transitionTo ? `${TRANSITION_ACTION[status]?.[transitionTo] ?? 'Cambiar estado'} — ${formatMonth(batch.month, batch.year)}` : ''}
        size="sm"
      >
        {transitionTo && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              El lote pasará de <span className="font-medium">{BATCH_STATUS_LABEL[status]}</span> a{' '}
              <span className="font-medium">{BATCH_STATUS_LABEL[transitionTo]}</span>.
              {transitionTo === 'READY_TO_BILL' && ' Dejará de recibir lecturas (importación y Lector App) y podrá facturarse.'}
              {transitionTo === 'CLOSED' && ' No se podrán corregir lecturas ni recalcular facturas del período.'}
            </p>
            <Input
              label={isReopen(status, transitionTo) ? 'Motivo (obligatorio)' : 'Motivo (opcional)'}
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="Queda en el historial del lote"
            />
            {transitionError && <p className="text-sm text-red-600">{transitionError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTransitionTo(null)}>Cancelar</Button>
              <Button
                onClick={() => statusMutation.mutate()}
                loading={statusMutation.isPending}
                disabled={isReopen(status, transitionTo) && !transitionReason.trim()}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!editTariff} onClose={() => setEditTariff(null)} title={`Corregir lectura — ${editTariff?.name ?? ''}`} size="md">
        {editError && <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-2 text-sm text-danger-600">{editError}</div>}
        <form onSubmit={(e) => { e.preventDefault(); setEditError(''); editTariffMutation.mutate(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Lectura anterior" type="number" step="0.01" min="0"
              value={editForm.lastReading} onChange={(e) => setEditForm((f) => ({ ...f, lastReading: e.target.value }))} />
            <Input label="Lectura actual" type="number" step="0.01" min="0"
              value={editForm.actualReading} onChange={(e) => setEditForm((f) => ({ ...f, actualReading: e.target.value }))} />
          </div>
          <Input label="Motivo de la corrección" value={editForm.reason}
            onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))} hint="Queda en el historial" />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditTariff(null)}>Cancelar</Button>
            <Button type="submit" loading={editTariffMutation.isPending} disabled={!editForm.reason.trim()}>Guardar corrección</Button>
          </div>
        </form>

        {!!tariffHistory?.length && (
          <div className="mt-5 pt-4 border-t border-neutral-100">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Historial de cambios</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tariffHistory.map((h, i) => (
                <div key={i} className="text-xs text-neutral-600 rounded-lg bg-neutral-50 border border-neutral-100 p-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{h.changed_by_name || 'Usuario'}</span>
                    <span className="text-neutral-400">{new Date(h.changed_at).toLocaleString('es-CO')}</span>
                  </div>
                  <div>Consumo {Number(h.old_consumed).toLocaleString('es-CO')} → {Number(h.new_consumed).toLocaleString('es-CO')} kWh</div>
                  <div className="text-neutral-400">Motivo: {h.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>

      <RecalcularPeriodoDialog
        open={recalcOpen}
        onClose={() => setRecalcOpen(false)}
        readingId={id as string}
      />
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

/**
 * Recálculo masivo del período, en dos pasos: primero muestra qué cambiaría y
 * solo escribe cuando el operador confirma. Sobre mil y pico de facturas, ver
 * antes de aplicar es la diferencia entre una corrección y un susto.
 */
function RecalcularPeriodoDialog({
  open, onClose, readingId,
}: {
  open: boolean;
  onClose: () => void;
  readingId: string;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<BatchRecalcResult | null>(null);

  const cerrar = () => { setReason(''); setPreview(null); onClose(); };

  const revisar = useMutation({
    mutationFn: () => billingService.recalculateBatch(readingId, reason, true),
    onSuccess:  (r) => setPreview(r),
  });

  const aplicar = useMutation({
    mutationFn: () => billingService.recalculateBatch(readingId, reason, false),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reading', readingId] });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      cerrar();
    },
  });

  const error = revisar.error ?? aplicar.error;

  return (
    <Dialog open={open} onClose={cerrar} title="Recalcular el período" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Vuelve a calcular las facturas de este lote con las tarifas y el costo unitario
          actuales. Solo toca las que están impagas y <strong>sin ningún abono</strong>: si el
          cliente ya pagó algo, la factura se salta para no descuadrar ese pago.
        </p>

        <Input
          label="Motivo del recálculo"
          placeholder="Se corrigió el costo unitario del proveedor"
          hint="Queda en el historial de cada factura recalculada"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setPreview(null); }}
        />

        {preview && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500">Cambiarían</p>
                <p className="text-lg font-semibold text-neutral-900">{preview.changed}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500">Sin cambio</p>
                <p className="text-lg font-semibold text-neutral-900">{preview.unchanged}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-700">Saltadas por tener pagos</p>
                <p className="text-lg font-semibold text-amber-700">{preview.skipped}</p>
              </div>
            </div>

            {preview.changed > 0 ? (
              <>
                <p className="text-sm text-neutral-600">
                  El total del lote pasaría de{' '}
                  <strong>{formatCurrency(preview.totalBefore)}</strong> a{' '}
                  <strong>{formatCurrency(preview.totalAfter)}</strong>.
                </p>
                <div className="border border-neutral-200 rounded-lg max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Contrato</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Cliente</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">Antes</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">Después</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.changes.map((c) => (
                        <tr key={c.invoiceId} className="border-t border-neutral-100">
                          <td className="px-3 py-1.5 font-mono text-xs">{c.contract}</td>
                          <td className="px-3 py-1.5 truncate max-w-[180px]">{c.clientName}</td>
                          <td className="px-3 py-1.5 text-right text-neutral-500">{formatCurrency(c.oldTotal)}</td>
                          <td className={`px-3 py-1.5 text-right font-medium ${c.difference > 0 ? 'text-danger-600' : 'text-primary-600'}`}>
                            {formatCurrency(c.newTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                Ninguna factura cambiaría de valor: el lote ya está al día.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-danger-600">
            {(() => {
              const msg = (error as { response?: { data?: { message?: string | string[] } } })
                ?.response?.data?.message;
              return Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo recalcular';
            })()}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={cerrar}>Cancelar</Button>
          {!preview ? (
            <Button
              loading={revisar.isPending}
              disabled={reason.trim().length < 5}
              onClick={() => revisar.mutate()}
            >
              Revisar cambios
            </Button>
          ) : (
            <Button
              loading={aplicar.isPending}
              disabled={preview.changed === 0}
              onClick={() => aplicar.mutate()}
            >
              Aplicar a {preview.changed} factura{preview.changed === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function GenerationProgressCard({
  run, onViewInvoices, onDismiss,
}: {
  run: BillingGenerationRun;
  onViewInvoices: () => void;
  onDismiss: () => void;
}) {
  const active = run.status === 'queued' || run.status === 'running';
  const failed = run.status === 'failed';
  const tone = failed
    ? 'border-red-200 bg-red-50'
    : active ? 'border-primary-200 bg-primary-50' : 'border-green-200 bg-green-50';

  return (
    <Card padding="md" className={tone}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-800">
            {run.status === 'queued' && 'Facturación en cola…'}
            {run.status === 'running' && `Generando facturas… ${run.percent}%`}
            {run.status === 'completed' && 'Facturación completada'}
            {failed && 'La facturación falló'}
          </p>
          {(active || run.total > 0) && (
            <div className="mt-2 h-2 rounded-full bg-white/70 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${failed ? 'bg-red-500' : 'bg-primary-500'}`}
                style={{ width: `${run.percent}%` }}
              />
            </div>
          )}
          <p className="text-xs text-neutral-600 mt-2">
            {run.processed.toLocaleString('es-CO')} de {run.total.toLocaleString('es-CO')} procesadas ·{' '}
            {run.generated.toLocaleString('es-CO')} generadas · {run.skipped.toLocaleString('es-CO')} ya existían
            {run.errorCount > 0 && ` · ${run.errorCount} con error`}
            {run.status === 'completed' && run.emailsQueued > 0 && ` · ${run.emailsQueued} correos en envío`}
          </p>
          {failed && run.failureReason && <p className="text-xs text-red-700 mt-1">{run.failureReason}</p>}
          {run.errors.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {run.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-red-700">Cliente {e.clientId.slice(0, 8)}…: {e.reason}</p>
              ))}
            </div>
          )}
          {active && (
            <p className="text-xs text-neutral-500 mt-1">
              Puedes seguir trabajando o recargar la página: el proceso continúa en el servidor.
            </p>
          )}
        </div>
        {!active && (
          <div className="flex items-center gap-2 shrink-0">
            {run.status === 'completed' && <Button size="sm" onClick={onViewInvoices}>Ver facturas</Button>}
            <button onClick={onDismiss} className="text-neutral-400 hover:text-neutral-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
