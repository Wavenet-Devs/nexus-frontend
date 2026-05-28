'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet, Download, RefreshCw, FileText,
  CreditCard, Scissors, BookOpen, AlertCircle,
} from 'lucide-react';
import { reportsService } from '@/services/reports.service';
import { catalogsService } from '@/services/catalogs.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatMonth } from '@/lib/utils';

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

type ReportTab = 'billing' | 'payments' | 'collections' | 'cut' | 'missing' | 'readings';

// ─── Period selector ──────────────────────────────────────────────────────────
function PeriodSelect({
  month, year, onMonth, onYear,
}: {
  month: number; year: number;
  onMonth: (v: number) => void; onYear: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      <select
        value={month}
        onChange={(e) => onMonth(Number(e.target.value))}
        className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <select
        value={year}
        onChange={(e) => onYear(Number(e.target.value))}
        className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('billing');

  const TABS: { key: ReportTab; label: string; icon: React.ElementType }[] = [
    { key: 'billing',   label: 'Facturación',     icon: FileText },
    { key: 'payments',  label: 'Pagos',           icon: CreditCard },
    { key: 'collections', label: 'Recaudo',       icon: RefreshCw },
    { key: 'cut',       label: 'Lista de corte',  icon: Scissors },
    { key: 'missing',   label: 'Faltantes',       icon: AlertCircle },
    { key: 'readings',  label: 'Planilla lecturas', icon: BookOpen },
  ];

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="border-b border-neutral-200 overflow-x-auto">
        <div className="flex gap-0.5 min-w-max">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === key
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'billing'     && <BillingReport />}
      {tab === 'payments'    && <PaymentsReport />}
      {tab === 'collections' && <CollectionsReport />}
      {tab === 'cut'         && <CutReport />}
      {tab === 'missing'     && <MissingReport />}
      {tab === 'readings'    && <ReadingsListReport />}
    </div>
  );
}

// ─── 1. Billing ───────────────────────────────────────────────────────────────
function BillingReport() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year,  setYear]  = useState(CURRENT_YEAR);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-billing', month, year],
    queryFn:  () => reportsService.getBilling(month, year),
  });

  const handleExport = async () => {
    setDownloading(true);
    try { await reportsService.exportBilling(month, year); }
    finally { setDownloading(false); }
  };

  const totals = data?.reduce((acc, r) => ({
    total:   acc.total   + Number(r.total   ?? 0),
    balance: acc.balance + Number(r.balance ?? 0),
    consumed: acc.consumed + Number(r.consumed ?? 0),
  }), { total: 0, balance: 0, consumed: 0 });

  return (
    <div className="space-y-4">
      <ReportToolbar
        title={`Facturación — ${formatMonth(month, year)}`}
        subtitle={data ? `${data.length} facturas` : undefined}
        filters={<PeriodSelect month={month} year={year} onMonth={setMonth} onYear={setYear} />}
        onRefresh={() => refetch()}
        onExport={handleExport}
        downloading={downloading}
        loading={isLoading}
      />

      {totals && data?.length ? (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total facturado" value={formatCurrency(totals.total)} />
          <SummaryCard label="Saldo pendiente" value={formatCurrency(totals.balance)} warn />
          <SummaryCard label="Total kWh" value={`${totals.consumed.toLocaleString('es-CO')} kWh`} />
        </div>
      ) : null}

      <DataTable
        loading={isLoading}
        empty={!data?.length}
        cols={['Contrato', 'Cliente', 'kWh', 'Total', 'Saldo', 'Estado', 'Vencimiento']}
        rows={(data ?? []).map((r) => [
          <span className="font-mono text-xs">{r.contract}</span>,
          r.client_name,
          Number(r.consumed).toLocaleString('es-CO'),
          formatCurrency(r.total),
          formatCurrency(r.balance),
          <StatusBadge status={r.status} />,
          r.payment_limit ? new Date(r.payment_limit).toLocaleDateString('es-CO') : '—',
        ])}
      />
    </div>
  );
}

// ─── 2. Payments ─────────────────────────────────────────────────────────────
function PaymentsReport() {
  const today     = new Date().toISOString().slice(0, 10);
  const firstDay  = new Date(CURRENT_YEAR, CURRENT_MONTH - 1, 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(firstDay);
  const [to,   setTo]   = useState(today);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-payments', from, to],
    queryFn:  () => reportsService.getPayments(from, to),
  });

  const handleExport = async () => {
    setDownloading(true);
    try { await reportsService.exportPayments(from, to); }
    finally { setDownloading(false); }
  };

  const totalReceived = data?.reduce((s, r) => s + Number(r.amount ?? 0), 0) ?? 0;

  const TYPE_LABELS: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' };

  return (
    <div className="space-y-4">
      <ReportToolbar
        title="Reporte de pagos"
        subtitle={data ? `${data.length} registros · ${formatCurrency(totalReceived)} recibidos` : undefined}
        filters={
          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-xs text-neutral-500">Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <label className="text-xs text-neutral-500">Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        }
        onRefresh={() => refetch()}
        onExport={handleExport}
        downloading={downloading}
        loading={isLoading}
      />

      {!!totalReceived && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard label="Total recibido" value={formatCurrency(totalReceived)} accent />
          <SummaryCard label="Nº de pagos" value={String(data?.length ?? 0)} />
          <SummaryCard label="Promedio por pago" value={data?.length ? formatCurrency(totalReceived / data.length) : '—'} />
        </div>
      )}

      <DataTable
        loading={isLoading}
        empty={!data?.length}
        cols={['Fecha', 'Contrato', 'Cliente', 'Tipo', 'Referencia', 'Monto']}
        rows={(data ?? []).map((r) => [
          r.payment_date ? new Date(r.payment_date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—',
          <span className="font-mono text-xs">{r.contract}</span>,
          r.client_name,
          TYPE_LABELS[r.payment_type] ?? r.payment_type,
          r.payment_number || '—',
          formatCurrency(r.amount),
        ])}
      />
    </div>
  );
}

// ─── 3. Collections ───────────────────────────────────────────────────────────
function CollectionsReport() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year,  setYear]  = useState(CURRENT_YEAR);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-collections', month, year],
    queryFn:  () => reportsService.getCollections(month, year),
  });

  const handleExport = async () => {
    setDownloading(true);
    try { await reportsService.exportCollections(month, year); }
    finally { setDownloading(false); }
  };

  const totalCollected = data?.reduce((s, r) => s + Number(r.allocated ?? 0), 0) ?? 0;
  const totalBilled    = data?.reduce((s, r) => s + Number(r.invoice_total ?? 0), 0) ?? 0;
  const pct            = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <div className="space-y-4">
      <ReportToolbar
        title={`Recaudo — ${formatMonth(month, year)}`}
        subtitle={data ? `${data.length} registros · ${pct}% cobrado` : undefined}
        filters={<PeriodSelect month={month} year={year} onMonth={setMonth} onYear={setYear} />}
        onRefresh={() => refetch()}
        onExport={handleExport}
        downloading={downloading}
        loading={isLoading}
      />

      {!!totalCollected && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total facturado" value={formatCurrency(totalBilled)} />
          <SummaryCard label="Total cobrado"   value={formatCurrency(totalCollected)} accent />
          <SummaryCard label="% cobrado">
            <div className="mt-1">
              <div className="flex justify-between text-xs text-neutral-500 mb-0.5">
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </SummaryCard>
        </div>
      )}

      <DataTable
        loading={isLoading}
        empty={!data?.length}
        cols={['Fecha pago', 'Contrato', 'Cliente', 'kWh', 'Total factura', 'Pago aplicado']}
        rows={(data ?? []).map((r) => [
          r.payment_date ? new Date(r.payment_date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—',
          <span className="font-mono text-xs">{r.contract}</span>,
          r.client_name,
          Number(r.consumed).toLocaleString('es-CO'),
          formatCurrency(r.invoice_total),
          formatCurrency(r.allocated),
        ])}
      />
    </div>
  );
}

// ─── 4. Cut report ────────────────────────────────────────────────────────────
function CutReport() {
  const [minDebt,        setMinDebt]        = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [downloading, setDownloading] = useState(false);

  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn:  catalogsService.getNeighborhoods,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-cut', neighborhoodId, minDebt],
    queryFn:  () => reportsService.getCutReport(
      neighborhoodId || undefined,
      minDebt ? parseFloat(minDebt) : undefined,
    ),
  });

  const handleExport = async () => {
    setDownloading(true);
    try { await reportsService.exportCutReport(neighborhoodId || undefined, minDebt ? parseFloat(minDebt) : undefined); }
    finally { setDownloading(false); }
  };

  const totalDebt = data?.reduce((s, r) => s + Number(r.total_debt ?? 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <ReportToolbar
        title="Lista de corte"
        subtitle={data ? `${data.length} clientes · ${formatCurrency(totalDebt)} adeudado` : undefined}
        filters={
          <div className="flex gap-2 flex-wrap">
            <select
              value={neighborhoodId}
              onChange={(e) => setNeighborhoodId(e.target.value)}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los barrios</option>
              {neighborhoods?.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
            <input
              type="number"
              min={0}
              placeholder="Deuda mínima $"
              value={minDebt}
              onChange={(e) => setMinDebt(e.target.value)}
              className="h-9 w-36 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        }
        onRefresh={() => refetch()}
        onExport={handleExport}
        downloading={downloading}
        loading={isLoading}
      />

      <DataTable
        loading={isLoading}
        empty={!data?.length}
        cols={['#', 'Contrato', 'Cliente', 'Barrio', 'Ruta', 'Fact. pend.', 'Deuda total', 'Períodos']}
        rows={(data ?? []).map((r, i) => [
          <span className="text-neutral-400">{i + 1}</span>,
          <span className="font-mono text-xs">{r.contract}</span>,
          r.client_name,
          r.neighborhood || '—',
          r.route        || '—',
          r.unpaid_invoices,
          <span className="font-semibold text-red-600">{formatCurrency(r.total_debt)}</span>,
          <span className="text-xs text-neutral-500">{r.periods}</span>,
        ])}
      />
    </div>
  );
}

// ─── 5. Clients missing ───────────────────────────────────────────────────────
function MissingReport() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year,  setYear]  = useState(CURRENT_YEAR);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report-missing', month, year],
    queryFn:  () => reportsService.getClientsMissing(month, year),
  });

  const handleExport = async () => {
    setDownloading(true);
    try { await reportsService.exportClientsMissing(month, year); }
    finally { setDownloading(false); }
  };

  return (
    <div className="space-y-4">
      <ReportToolbar
        title={`Clientes sin factura — ${formatMonth(month, year)}`}
        subtitle={data ? `${data.length} clientes` : undefined}
        filters={<PeriodSelect month={month} year={year} onMonth={setMonth} onYear={setYear} />}
        onRefresh={() => refetch()}
        onExport={handleExport}
        downloading={downloading}
        loading={isLoading}
      />

      <DataTable
        loading={isLoading}
        empty={!data?.length}
        cols={['Contrato', 'Cliente', 'Dirección', 'Barrio', 'Estrato']}
        rows={(data ?? []).map((r) => [
          <span className="font-mono text-xs">{r.contract}</span>,
          r.client_name,
          r.address      || '—',
          r.neighborhood || '—',
          r.stratum_name || '—',
        ])}
      />
    </div>
  );
}

// ─── 6. Readings planilla ─────────────────────────────────────────────────────
function ReadingsListReport() {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try { await reportsService.exportReadingsList(); }
    finally { setDownloading(false); }
  };

  return (
    <div className="space-y-4">
      <Card padding="md" className="max-w-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-50 text-primary-600 shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Planilla de lecturas</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Genera un archivo XLSX con una hoja por barrio. Incluye nombre, dirección, medidor, contrato, ruta y lectura anterior. Lista para que el lector registre la lectura actual en campo.
            </p>
            <Button loading={downloading} onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Descargar planilla
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ReportToolbar({
  title, subtitle, filters, onRefresh, onExport, downloading, loading,
}: {
  title: string;
  subtitle?: string;
  filters?: React.ReactNode;
  onRefresh: () => void;
  onExport: () => void;
  downloading: boolean;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 transition-colors"
          title="Actualizar"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <Button
          size="sm"
          variant="outline"
          loading={downloading}
          onClick={onExport}
          disabled={loading}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Exportar XLSX
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent, warn, children }: {
  label: string; value?: string; accent?: boolean; warn?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? 'bg-primary-50 border-primary-100' : warn ? 'bg-amber-50 border-amber-100' : 'bg-neutral-50 border-neutral-100'}`}>
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
      {value && <p className={`text-sm font-bold ${accent ? 'text-primary-700' : warn ? 'text-amber-700' : 'text-neutral-900'}`}>{value}</p>}
      {children}
    </div>
  );
}

function DataTable({ loading, empty, cols, rows }: {
  loading: boolean;
  empty: boolean;
  cols: string[];
  rows: React.ReactNode[][];
}) {
  if (loading) {
    return (
      <Card padding="none">
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (empty) {
    return (
      <Card padding="none">
        <div className="py-12 text-center">
          <FileSpreadsheet className="h-8 w-8 text-neutral-200 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">Sin datos para los filtros seleccionados</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {cols.map((c) => (
                <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
