'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Building2, Users, FileText, TrendingUp,
  AlertCircle, Banknote, ArrowLeft, LogOut, ShieldCheck,
} from 'lucide-react';
import { platformReportsService, type TenantStats } from '@/services/platform-reports.service';
import { useSAAuthStore } from '@/store/super-admin-auth.store';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  starter:    '#a3a3a3',
  pro:        '#3b82f6',
  enterprise: '#16a34a',
};

const PLAN_LABELS: Record<string, string> = {
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
};

function StatCard({
  title, value, subtitle, icon: Icon, accent = false,
}: {
  title:    string;
  value:    string;
  subtitle: string;
  icon:     React.ElementType;
  accent?:  boolean;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`p-2.5 rounded-lg shrink-0 ${accent ? 'bg-primary-50 text-primary-600' : 'bg-neutral-100 text-neutral-500'}`}>
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

function SkeletonCard() {
  return <div className="h-28 rounded-xl bg-neutral-200 animate-pulse" />;
}

// ─── Tenant stats table ───────────────────────────────────────────────────────

function TenantRow({ t, router }: { t: TenantStats; router: ReturnType<typeof useRouter> }) {
  const collectionRate = t.billed_total > 0
    ? Math.round((t.collected_total / t.billed_total) * 100)
    : 0;

  return (
    <tr
      className="hover:bg-neutral-50 cursor-pointer"
      onClick={() => router.push(`/super-admin/tenants/${t.id}`)}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="h-6 w-6 rounded shrink-0 border border-neutral-200"
            style={{ backgroundColor: t.primaryColor ?? '#16a34a' }}
          />
          <div>
            <p className="font-medium text-neutral-800 text-sm">{t.name}</p>
            <code className="text-xs text-neutral-400">{t.slug}</code>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize"
          style={{
            backgroundColor: `${PLAN_COLORS[t.plan] ?? '#a3a3a3'}18`,
            color:           PLAN_COLORS[t.plan] ?? '#a3a3a3',
          }}
        >
          {PLAN_LABELS[t.plan] ?? t.plan}
        </span>
      </td>
      <td className="py-3 px-4 text-right text-sm text-neutral-700 tabular-nums">
        {formatNumber(t.clients_count)}
      </td>
      <td className="py-3 px-4 text-right text-sm text-neutral-700 tabular-nums">
        {formatNumber(t.invoices_count)}
      </td>
      <td className="py-3 px-4 text-right text-sm text-neutral-700 tabular-nums">
        {formatCurrency(t.billed_total)}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden min-w-[40px]">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 tabular-nums w-8 text-right">{collectionRate}%</span>
        </div>
      </td>
      <td className="py-3 px-4 text-right text-sm tabular-nums">
        <span className={t.debt_total > 0 ? 'text-danger-600 font-medium' : 'text-neutral-400'}>
          {t.debt_total > 0 ? formatCurrency(t.debt_total) : '—'}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-neutral-400">
        {t.status === 'active'
          ? <span className="inline-flex items-center gap-1 text-primary-700"><span className="h-1.5 w-1.5 rounded-full bg-primary-500" />Activo</span>
          : <span className="inline-flex items-center gap-1 text-neutral-400"><span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />Inactivo</span>
        }
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformReportsPage() {
  const router    = useRouter();
  const clearAuth = useSAAuthStore((s) => s.clearAuth);

  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ['sa-overview'],
    queryFn:  platformReportsService.getOverview,
  });

  const { data: tenantStats = [], isLoading: tsLoading } = useQuery({
    queryKey: ['sa-tenants-stats'],
    queryFn:  platformReportsService.getTenantsStats,
  });

  const { data: growth = [] } = useQuery({
    queryKey: ['sa-growth'],
    queryFn:  platformReportsService.getGrowth,
  });

  const planChartData = overview
    ? Object.entries(overview.tenants.by_plan).map(([plan, count]) => ({
        plan: PLAN_LABELS[plan] ?? plan,
        count,
        color: PLAN_COLORS[plan] ?? '#a3a3a3',
      }))
    : [];

  const collectionRate = overview && overview.billed_total > 0
    ? Math.round((overview.collected_total / overview.billed_total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-neutral-900">Nexus Super Admin</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <button
              onClick={() => router.push('/super-admin/tenants')}
              className="px-3 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Tenants
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-900 font-medium"
            >
              Reportes
            </button>
          </nav>
          <button
            onClick={() => { clearAuth(); router.push('/super-admin/login'); }}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Reportes de plataforma</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Vista consolidada de todos los tenants</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {ovLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : overview ? (
            <>
              <StatCard
                title="Tenants activos"
                value={String(overview.tenants.active)}
                subtitle={`${overview.tenants.total} totales · ${overview.tenants.inactive} inactivos`}
                icon={Building2}
                accent
              />
              <StatCard
                title="Clientes totales"
                value={formatNumber(overview.clients_total)}
                subtitle="En todos los tenants activos"
                icon={Users}
              />
              <StatCard
                title="Facturado total"
                value={formatCurrency(overview.billed_total)}
                subtitle={`${formatNumber(overview.invoices_total)} facturas emitidas`}
                icon={FileText}
              />
              <StatCard
                title="Deuda total plataforma"
                value={formatCurrency(overview.debt_total)}
                subtitle={`${collectionRate}% eficiencia de recaudo`}
                icon={AlertCircle}
              />
            </>
          ) : null}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Crecimiento acumulado */}
          <Card padding="md" className="lg:col-span-2">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-800">Crecimiento de tenants</p>
              <p className="text-xs text-neutral-400 mt-0.5">Acumulado mes a mes</p>
            </div>
            {growth.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={growth} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12 }}
                    formatter={(v, name) => [v, name === 'cumulative' ? 'Acumulado' : 'Nuevos']}
                  />
                  <Area type="monotone" dataKey="cumulative" stroke="#16a34a" strokeWidth={2} fill="url(#gradGrowth)" name="cumulative" />
                  <Bar dataKey="new" fill="#bbf7d0" name="new" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-neutral-300">Sin datos</div>
            )}
          </Card>

          {/* Distribución de planes */}
          <Card padding="md">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-800">Distribución por plan</p>
              <p className="text-xs text-neutral-400 mt-0.5">Tenants por tipo de suscripción</p>
            </div>
            {planChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={planChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="plan" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {planChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {planChartData.map((p) => (
                    <div key={p.plan} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-neutral-600">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.plan}
                      </span>
                      <span className="font-semibold text-neutral-800">{p.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-36 flex items-center justify-center text-sm text-neutral-300">Sin datos</div>
            )}
          </Card>
        </div>

        {/* Recaudo global */}
        {overview && (
          <Card padding="md">
            <p className="text-sm font-semibold text-neutral-800 mb-4">Recaudo global de la plataforma</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Total facturado',  value: overview.billed_total,    color: 'bg-neutral-400' },
                { label: 'Total recaudado',  value: overview.collected_total, color: 'bg-primary-500' },
                { label: 'Saldo pendiente',  value: overview.debt_total,      color: 'bg-danger-500'  },
              ].map((item) => {
                const pct = overview.billed_total > 0
                  ? Math.round((item.value / overview.billed_total) * 100)
                  : 0;
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">{item.label}</span>
                      <span className="text-xs font-semibold text-neutral-600">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <p className="text-lg font-bold text-neutral-900">{formatCurrency(item.value)}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Tabla por tenant */}
        <Card padding="none">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Estadísticas por tenant</p>
            {!tsLoading && (
              <span className="text-xs text-neutral-400">{tenantStats.length} tenants</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Tenant</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Plan</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500">Clientes</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500">Facturas</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500">Facturado</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-500">Recaudo</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500">Deuda</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neutral-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {tsLoading && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-neutral-400">
                      Cargando estadísticas...
                    </td>
                  </tr>
                )}
                {!tsLoading && tenantStats.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Building2 className="h-8 w-8 text-neutral-200 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">Sin tenants registrados</p>
                    </td>
                  </tr>
                )}
                {tenantStats.map((t) => (
                  <TenantRow key={t.id} t={t} router={router} />
                ))}
              </tbody>
              {!tsLoading && tenantStats.length > 0 && (() => {
                const totalBilled    = tenantStats.reduce((s, t) => s + t.billed_total,    0);
                const totalCollected = tenantStats.reduce((s, t) => s + t.collected_total, 0);
                const totalDebt      = tenantStats.reduce((s, t) => s + t.debt_total,      0);
                const totalClients   = tenantStats.reduce((s, t) => s + t.clients_count,   0);
                const totalInvoices  = tenantStats.reduce((s, t) => s + t.invoices_count,  0);
                return (
                  <tfoot>
                    <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-semibold">
                      <td colSpan={2} className="py-3 px-4 text-xs text-neutral-500 uppercase tracking-wide">Total plataforma</td>
                      <td className="py-3 px-4 text-right text-sm text-neutral-800 tabular-nums">{formatNumber(totalClients)}</td>
                      <td className="py-3 px-4 text-right text-sm text-neutral-800 tabular-nums">{formatNumber(totalInvoices)}</td>
                      <td className="py-3 px-4 text-right text-sm text-neutral-800 tabular-nums">{formatCurrency(totalBilled)}</td>
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4 text-right text-sm text-danger-600 tabular-nums">{formatCurrency(totalDebt)}</td>
                      <td />
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
