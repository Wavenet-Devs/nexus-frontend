'use client';

import { useQuery } from '@tanstack/react-query';
import {
  FileText, CreditCard, Users, Banknote, AlertCircle,
  TrendingUp, Download, Zap, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { reportsService } from '@/services/reports.service';
import { formatCurrency, formatNumber } from '@/lib/utils';

// ─── Palette ──────────────────────────────────────────────────────────────────
const G1 = '#16a34a'; // primary green
const G2 = '#4ade80'; // light green
const B1 = '#2563eb'; // blue accent
const STRATA_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
const AGING_COLORS  = ['#16a34a', '#f59e0b', '#f97316', '#ef4444'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtM = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`;
const fmtK = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

function StatCard({
  title, value, subtitle, icon: Icon, color = 'primary',
}: {
  title: string; value: string; subtitle: string;
  icon: React.ElementType; color?: 'primary' | 'danger' | 'warning' | 'info';
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    danger:  'bg-red-50 text-red-600',
    warning: 'bg-amber-50 text-amber-500',
    info:    'bg-blue-50 text-blue-600',
  };
  return (
    <Card className="flex items-start gap-4">
      <div className={`p-2.5 rounded-lg shrink-0 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-neutral-900 mt-0.5 truncate">{value}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
      </div>
    </Card>
  );
}

function SectionHeader({ title, icon: Icon, subtitle }: { title: string; icon: React.ElementType; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-3 text-xs space-y-1">
      <p className="font-semibold text-neutral-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-3 text-xs space-y-1">
      <p className="font-semibold text-neutral-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {formatNumber(p.value)}</p>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const summary  = useQuery({ queryKey: ['dashboard-summary'],        queryFn: reportsService.getSummary });
  const users    = useQuery({ queryKey: ['dashboard-users'],           queryFn: reportsService.getDashboardUsers });
  const trend    = useQuery({ queryKey: ['dashboard-billing-trend'],   queryFn: reportsService.getDashboardBillingTrend });
  const tariffs  = useQuery({ queryKey: ['dashboard-tariffs'],         queryFn: reportsService.getDashboardTariffs });
  const portfolio= useQuery({ queryKey: ['dashboard-portfolio'],       queryFn: reportsService.getDashboardPortfolio });
  const costs    = useQuery({ queryKey: ['dashboard-costs'],           queryFn: reportsService.getDashboardCosts });

  if (summary.isLoading) return <DashboardSkeleton />;
  if (summary.isError || !summary.data) return <ErrorState />;

  const { billing, payments, debt, financing } = summary.data;
  const collectionRate = billing.total_billed > 0
    ? Math.round((Number(payments.total_collected) / Number(billing.total_billed)) * 100)
    : 0;

  return (
    <div className="space-y-8">

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total facturado"
          value={formatCurrency(billing.total_billed)}
          subtitle={`${formatNumber(billing.total_invoices)} facturas emitidas`}
          icon={FileText}
        />
        <StatCard
          title="Recaudado"
          value={formatCurrency(payments.total_collected)}
          subtitle={`${collectionRate}% de eficiencia`}
          icon={CreditCard}
        />
        <StatCard
          title="Saldo pendiente"
          value={formatCurrency(billing.total_pending)}
          subtitle={`${formatNumber(debt.clients_with_debt)} clientes con deuda`}
          icon={AlertCircle}
          color="danger"
        />
        <StatCard
          title="Financiaciones activas"
          value={formatNumber(Number(financing.active_plans))}
          subtitle={`${formatCurrency(financing.total_financed_balance)} en saldo`}
          icon={Banknote}
          color="info"
        />
      </div>

      {/* ── Módulo 1: Usuarios ──────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Usuarios" icon={Users} subtitle="Distribución y estado del padrón de usuarios" />
        {users.isLoading ? <ModuleSkeleton rows={2} /> : users.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Totales + activos/inactivos */}
            <Card padding="md">
              <p className="text-xs text-neutral-500 font-medium mb-3">Total usuarios</p>
              <p className="text-4xl font-bold text-neutral-900">{formatNumber(Number(users.data.totals.total))}</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Activos',   value: Number(users.data.totals.active),   color: 'bg-primary-500' },
                  { label: 'Inactivos', value: Number(users.data.totals.inactive), color: 'bg-neutral-300' },
                ].map((item) => {
                  const total = Number(users.data!.totals.total);
                  const pct   = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-500">{item.label}</span>
                        <span className="font-semibold text-neutral-700">{formatNumber(item.value)} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Estrato donut */}
              <p className="text-xs text-neutral-500 font-medium mt-5 mb-2">Por estrato</p>
              <div className="flex items-center gap-3">
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie data={users.data.byStratum} dataKey="count" cx="50%" cy="50%" innerRadius={25} outerRadius={40}>
                      {users.data.byStratum.map((_, i) => (
                        <Cell key={i} fill={STRATA_COLORS[i % STRATA_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any, p: any) => [formatNumber(Number(v)), p.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {users.data.byStratum.map((s, i) => (
                    <div key={s.code} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: STRATA_COLORS[i % STRATA_COLORS.length] }} />
                      <span className="text-neutral-600 flex-1 truncate">{s.name}</span>
                      <span className="font-semibold text-neutral-800">{formatNumber(Number(s.count))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Usuarios por barrio */}
            <Card padding="md" className="lg:col-span-2">
              <p className="text-xs text-neutral-500 font-medium mb-3">Usuarios por barrio (top 12)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[...users.data.byNeighborhood].reverse()}
                  layout="vertical"
                  margin={{ top: 0, right: 40, bottom: 0, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={74} />
                  <Tooltip content={<CountTooltip />} />
                  <Bar dataKey="count" name="Usuarios" fill={G1} radius={[0, 3, 3, 0]} label={{ position: 'right', fontSize: 10, fill: '#6b7280' }} />
                </BarChart>
              </ResponsiveContainer>

              {/* Causales / estado medidor */}
              {users.data.byCausal.length > 0 && (
                <>
                  <p className="text-xs text-neutral-500 font-medium mt-4 mb-2">Por causal / estado medidor</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {users.data.byCausal.slice(0, 6).map((c) => (
                      <div key={c.name} className="flex justify-between items-center px-2.5 py-1.5 bg-neutral-50 rounded-lg text-xs">
                        <span className="text-neutral-600 truncate">{c.name}</span>
                        <span className="font-bold text-neutral-800 ml-2">{formatNumber(Number(c.count))}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        ) : null}
      </section>

      {/* ── Módulo 2: Facturación vs Recaudo ───────────────────────────────── */}
      <section>
        <SectionHeader title="Facturación vs Recaudo" icon={TrendingUp} subtitle="Tendencia mensual de los últimos 12 meses" />
        {trend.isLoading ? <ModuleSkeleton rows={1} height="h-64" /> : trend.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* KPIs laterales */}
            <Card padding="md" className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-neutral-500">Total facturado (histórico)</p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">{formatCurrency(billing.total_billed)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Total recaudado</p>
                <p className="text-2xl font-bold text-primary-700 mt-0.5">{formatCurrency(payments.total_collected)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Tasa de recaudo</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-neutral-900">{collectionRate}%</p>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden mt-2">
                  <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${collectionRate}%` }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Facturas pagadas</p>
                <div className="flex gap-3 mt-1">
                  <div>
                    <p className="text-lg font-bold text-primary-700">{formatNumber(billing.paid)}</p>
                    <p className="text-xs text-neutral-400">Pagadas</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-500">{formatNumber(billing.unpaid)}</p>
                    <p className="text-xs text-neutral-400">Pendientes</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Gráfico tendencia */}
            <Card padding="md" className="lg:col-span-3">
              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary-500 inline-block" />Facturado</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400 inline-block" />Recaudado</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trend.data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gFact" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={G1} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={G1} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={B1} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={B1} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} tickFormatter={fmtM} width={52} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Area type="monotone" dataKey="billed"    name="Facturado"  stroke={G1} strokeWidth={2} fill="url(#gFact)" />
                  <Area type="monotone" dataKey="collected" name="Recaudado"  stroke={B1} strokeWidth={2} fill="url(#gRec)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        ) : null}
      </section>

      {/* ── Módulo 3: Cartera ───────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Cartera" icon={AlertCircle} subtitle="Saldo pendiente por antigüedad, barrio y mayores deudores" />
        {portfolio.isLoading ? <ModuleSkeleton rows={2} /> : portfolio.data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* KPIs cartera */}
            <Card padding="md" className="flex flex-col gap-5">
              <div>
                <p className="text-xs text-neutral-500">Cartera total</p>
                <p className="text-3xl font-bold text-red-600 mt-0.5">{fmtM(Number(portfolio.data.totals.total_debt))}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{formatCurrency(Number(portfolio.data.totals.total_debt))}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-50 rounded-lg p-2.5">
                  <p className="text-xs text-neutral-400">Clientes</p>
                  <p className="text-xl font-bold text-neutral-800">{formatNumber(Number(portfolio.data.totals.clients_with_debt))}</p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-2.5">
                  <p className="text-xs text-neutral-400">Antigüedad prom.</p>
                  <p className="text-xl font-bold text-neutral-800">{Math.round(Number(portfolio.data.totals.avg_aging_days))} días</p>
                </div>
              </div>

              {/* Aging donut */}
              <div>
                <p className="text-xs text-neutral-500 font-medium mb-2">Por antigüedad</p>
                <div className="flex items-center gap-3">
                  <ResponsiveContainer width={80} height={80}>
                    <PieChart>
                      <Pie data={portfolio.data.byAging} dataKey="debt" cx="50%" cy="50%" innerRadius={22} outerRadius={36}>
                        {portfolio.data.byAging.map((_, i) => (
                          <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 flex-1">
                    {portfolio.data.byAging.map((a, i) => (
                      <div key={a.bucket} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: AGING_COLORS[i % AGING_COLORS.length] }} />
                          <span className="text-neutral-500">{a.bucket}</span>
                        </span>
                        <span className="font-semibold text-neutral-700">{fmtM(a.debt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Por barrio */}
            <Card padding="md">
              <p className="text-xs text-neutral-500 font-medium mb-3">Cartera por barrio</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[...portfolio.data.byNeighborhood].reverse()}
                  layout="vertical"
                  margin={{ top: 0, right: 50, bottom: 0, left: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} tickFormatter={fmtM} />
                  <YAxis type="category" dataKey="neighborhood" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={74} />
                  <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Cartera']} />
                  <Bar dataKey="debt" name="Cartera" fill="#ef4444" radius={[0, 3, 3, 0]} label={{ position: 'right', fontSize: 9, fill: '#6b7280', formatter: (v: any) => fmtM(Number(v)) }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top deudores */}
            <Card padding="md">
              <p className="text-xs text-neutral-500 font-medium mb-3">Top 10 mayores deudores</p>
              <div className="space-y-2">
                {portfolio.data.topDebtors.map((d, i) => (
                  <div key={d.contract} className="flex items-center gap-2 py-1.5 border-b border-neutral-50 last:border-0">
                    <span className="text-xs font-bold text-neutral-400 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">{d.client_name}</p>
                      <p className="text-xs text-neutral-400">{d.neighborhood} · {d.unpaid_invoices} fact. · {d.max_aging_days}d</p>
                    </div>
                    <span className="text-xs font-bold text-red-600 shrink-0">{fmtM(d.total_debt)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </section>

      {/* ── Módulo 4: Tarifas y CU ──────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Tarifas y Costo Unitario (CU)" icon={Zap} subtitle="Evolución del CU y componentes tarifarios registrados" />
        {tariffs.isLoading ? <ModuleSkeleton rows={1} height="h-48" /> : (
          <Card padding="md">
            {!tariffs.data || tariffs.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-neutral-400">
                <Zap className="h-8 w-8 text-neutral-200" />
                <p className="text-sm">No hay registros de CU cargados aún.</p>
                <p className="text-xs">Ve a <span className="font-medium text-neutral-500">Catálogos → Costos unitarios</span> para agregar los datos tarifarios.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CU actual */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-neutral-500 font-medium">Último CU registrado</p>
                  <p className="text-4xl font-bold text-primary-700">
                    {tariffs.data[0].cu.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="space-y-2 mt-1">
                    {(['generation','distribution','marketing','losses'] as const).map((k) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-neutral-500 capitalize">{k === 'generation' ? 'Generación' : k === 'distribution' ? 'Distribución' : k === 'marketing' ? 'Comercialización' : 'Pérdidas'}</span>
                        <span className="font-semibold text-neutral-700">{tariffs.data![0][k].toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gráfico línea CU histórico */}
                <div className="lg:col-span-2">
                  <p className="text-xs text-neutral-500 font-medium mb-2">Evolución CU histórico</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart
                      data={[...tariffs.data].reverse().map((r, i) => ({ ...r, idx: i + 1 }))}
                      margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="idx" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} label={{ value: 'Registro', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#a3a3a3' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => [Number(v).toLocaleString('es-CO', { minimumFractionDigits: 2 }), '']} />
                      <Line type="monotone" dataKey="cu"           name="CU total"       stroke={G1} strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="generation"   name="Generación"     stroke={B1} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="distribution" name="Distribución"   stroke={G2} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        )}
      </section>

      {/* ── Módulo 5: Costos ────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Costos operacionales" icon={BarChart3} subtitle="Costo facturado, subsidio y kWh consumidos por mes y estrato" />
        {costs.isLoading ? <ModuleSkeleton rows={2} /> : costs.data ? (
          <div className="space-y-4">
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card padding="md">
                <p className="text-xs text-neutral-500">Total costo facturado</p>
                <p className="text-3xl font-bold text-neutral-900 mt-1">{fmtM(costs.data.totals.total_costo)}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{formatCurrency(costs.data.totals.total_costo)}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-neutral-500">Total subsidio aplicado</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{fmtM(costs.data.totals.total_subsidio)}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{formatCurrency(costs.data.totals.total_subsidio)}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-neutral-500">Total kWh facturados</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{formatNumber(Math.round(costs.data.totals.total_kwh))} kWh</p>
                <p className="text-xs text-neutral-400 mt-0.5">{fmtM(costs.data.totals.total_kwh / 1000)} MWh</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Costo operacional por mes */}
              <Card padding="md" className="lg:col-span-2">
                <p className="text-xs text-neutral-500 font-medium mb-3">Costo operacional por mes</p>
                <div className="flex items-center gap-4 text-xs text-neutral-500 mb-2">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary-500 inline-block" />Costo total</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" />Subsidio</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={costs.data.byMonth} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} tickFormatter={fmtM} width={52} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar dataKey="costo_total" name="Costo total" fill={G1}       radius={[3, 3, 0, 0]} />
                    <Bar dataKey="subsidio"    name="Subsidio"    fill="#fbbf24"  radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Por estrato */}
              <Card padding="md">
                <p className="text-xs text-neutral-500 font-medium mb-3">Por estrato</p>
                <div className="space-y-4">
                  {costs.data.byStratum.map((s, i) => (
                    <div key={s.code} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-neutral-700">{s.estrato}</span>
                        <span className="text-neutral-500">{fmtM(s.costo_total)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-neutral-400">
                        <span>Subsidio: {fmtM(s.subsidio)}</span>
                        <span>kWh: {formatNumber(Math.round(s.kwh))}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${costs.data!.totals.total_costo > 0 ? Math.round((s.costo_total / costs.data!.totals.total_costo) * 100) : 0}%`,
                            background: STRATA_COLORS[i % STRATA_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* kWh por mes */}
                <p className="text-xs text-neutral-500 font-medium mt-5 mb-2">kWh facturados por mes</p>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={costs.data.byMonth} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(v: any) => [`${formatNumber(Math.round(Number(v)))} kWh`, '']} />
                    <Line type="monotone" dataKey="kwh" name="kWh" stroke={B1} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        ) : null}
      </section>

      {/* ── Reportes rápidos ────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Reportes rápidos" icon={Download} />
        <Card padding="md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Lista de corte',       action: () => reportsService.exportCutReport(),    icon: AlertCircle },
              { label: 'Planilla de lecturas',  action: () => reportsService.exportReadingsList(), icon: TrendingUp  },
              { label: 'Facturación del mes',   action: () => reportsService.exportBilling(new Date().getMonth() + 1, new Date().getFullYear()), icon: FileText },
              { label: 'Recaudo del mes',       action: () => reportsService.exportCollections(new Date().getMonth() + 1, new Date().getFullYear()), icon: CreditCard },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors group border border-neutral-100"
              >
                <item.icon className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 transition-colors shrink-0" />
                <span className="flex-1 text-left text-xs font-medium">{item.label}</span>
                <Download className="h-3.5 w-3.5 text-neutral-300 group-hover:text-primary-500 transition-colors" />
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function ModuleSkeleton({ rows = 2, height = 'h-40' }: { rows?: number; height?: string }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4`}>
      {Array.from({ length: rows === 1 ? 1 : 3 }).map((_, i) => (
        <div key={i} className={`${height} rounded-xl bg-neutral-100 animate-pulse ${rows === 1 && i === 0 ? 'lg:col-span-3' : ''}`} />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-neutral-100" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-40 rounded bg-neutral-100" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-48 rounded-xl bg-neutral-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle className="h-10 w-10 text-neutral-300" />
      <p className="text-sm text-neutral-500">Error al cargar el dashboard</p>
    </div>
  );
}
