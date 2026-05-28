'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Power, AlertCircle, History } from 'lucide-react';
import {
  catalogsService,
  type CatalogItem, type Stratum, type Causal, type Meter, type UnitCost,
} from '@/services/catalogs.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = 'stratums' | 'neighborhoods' | 'routes' | 'circuits' | 'causals' | 'meters' | 'id-types' | 'unit-costs';

const TABS: { key: Tab; label: string }[] = [
  { key: 'stratums',      label: 'Estratos' },
  { key: 'neighborhoods', label: 'Barrios' },
  { key: 'routes',        label: 'Rutas' },
  { key: 'circuits',      label: 'Circuitos' },
  { key: 'causals',       label: 'Causales' },
  { key: 'meters',        label: 'Medidores' },
  { key: 'id-types',      label: 'Tipos de ID' },
  { key: 'unit-costs',    label: 'Costos CU' },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CatalogsPage() {
  const [tab, setTab] = useState<Tab>('stratums');

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="border-b border-neutral-200 overflow-x-auto">
        <div className="flex gap-0.5 min-w-max">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === key
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'stratums'      && <StratumsTab />}
      {tab === 'neighborhoods' && <SimpleTab type="neighborhoods" label="Barrio" />}
      {tab === 'routes'        && <SimpleTab type="routes"        label="Ruta" />}
      {tab === 'circuits'      && <SimpleTab type="circuits"      label="Circuito" />}
      {tab === 'causals'       && <CausalsTab />}
      {tab === 'meters'        && <MetersTab />}
      {tab === 'id-types'      && <SimpleTab type="id-types"      label="Tipo de identificación" />}
      {tab === 'unit-costs'    && <UnitCostsTab />}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
    }`}>
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function ToggleBtn({ active, loading, onClick }: { active: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={active ? 'Desactivar' : 'Activar'}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
        active
          ? 'text-green-600 hover:bg-green-50'
          : 'text-neutral-400 hover:bg-neutral-100'
      }`}
    >
      <Power className="h-3.5 w-3.5" />
    </button>
  );
}

function CatalogShell({ label, onAdd, children }: {
  label: string; onAdd: () => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Agregar {label}
        </Button>
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-sm text-neutral-400">
        Sin registros. Haz clic en "Agregar" para crear el primero.
      </td>
    </tr>
  );
}

// ─── Simple catalogs (neighborhoods, routes, circuits, id-types) ──────────────

type SimpleType = 'neighborhoods' | 'routes' | 'circuits' | 'id-types';

const SIMPLE_CFG: Record<SimpleType, {
  queryKey: string;
  get: () => Promise<CatalogItem[]>;
  create: (dto: any) => Promise<CatalogItem>;
  update: (id: string, dto: any) => Promise<CatalogItem>;
  toggle: (id: string) => Promise<CatalogItem>;
}> = {
  neighborhoods: {
    queryKey: 'neighborhoods',
    get:    catalogsService.getNeighborhoods,
    create: catalogsService.createNeighborhood,
    update: catalogsService.updateNeighborhood,
    toggle: catalogsService.toggleNeighborhood,
  },
  routes: {
    queryKey: 'routes',
    get:    catalogsService.getRoutes,
    create: catalogsService.createRoute,
    update: catalogsService.updateRoute,
    toggle: catalogsService.toggleRoute,
  },
  circuits: {
    queryKey: 'circuits',
    get:    catalogsService.getCircuits,
    create: catalogsService.createCircuit,
    update: catalogsService.updateCircuit,
    toggle: catalogsService.toggleCircuit,
  },
  'id-types': {
    queryKey: 'identification-types',
    get:    catalogsService.getIdentificationTypes,
    create: catalogsService.createIdentificationType,
    update: catalogsService.updateIdentificationType,
    toggle: catalogsService.toggleIdentificationType,
  },
};

function SimpleTab({ type, label }: { type: SimpleType; label: string }) {
  const cfg = SIMPLE_CFG[type];
  const qc  = useQueryClient();

  const [open,     setOpen]     = useState(false);
  const [editing,  setEditing]  = useState<CatalogItem | null>(null);
  const [nameVal,  setNameVal]  = useState('');
  const [err,      setErr]      = useState('');

  const { data, isLoading } = useQuery({ queryKey: [cfg.queryKey], queryFn: cfg.get });

  const invalidate = () => qc.invalidateQueries({ queryKey: [cfg.queryKey] });

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? cfg.update(editing.id, { name: nameVal.trim() })
      : cfg.create({ name: nameVal.trim() }),
    onSuccess: () => { invalidate(); setOpen(false); },
    onError: (e: any) => setErr(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => cfg.toggle(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setEditing(null); setNameVal(''); setErr(''); setOpen(true); };
  const openEdit   = (item: CatalogItem) => { setEditing(item); setNameVal(item.name); setErr(''); setOpen(true); };

  return (
    <CatalogShell label={label} onAdd={openCreate}>
      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center"><div className="h-4 w-32 bg-neutral-100 rounded animate-pulse mx-auto" /></td></tr>}
            {!isLoading && !data?.length && <EmptyRow cols={3} />}
            {data?.map((item) => (
              <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-900">{item.name}</td>
                <td className="px-4 py-3"><StatusChip status={item.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <ToggleBtn
                      active={item.status === 'active'}
                      loading={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(item.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? `Editar ${label}` : `Nuevo ${label}`} size="sm">
        <div className="space-y-4">
          <Input
            label="Nombre"
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveMutation.mutate()}
          />
          {err && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button loading={saveMutation.isPending} disabled={!nameVal.trim()} onClick={() => { setErr(''); saveMutation.mutate(); }}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Dialog>
    </CatalogShell>
  );
}

// ─── Estratos ─────────────────────────────────────────────────────────────────

const BILLING_TYPES = [
  { value: 'residential', label: 'Residencial (escalonado)' },
  { value: 'commercial',  label: 'Comercial (tasa única)' },
  { value: 'official',    label: 'Oficial (tasa única)' },
];

function StratumsTab() {
  const qc = useQueryClient();
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Stratum | null>(null);
  const [form,    setForm]    = useState({ name: '', code: '', billingType: 'residential', publicPercent: '0' });
  const [err,     setErr]     = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['stratums'], queryFn: catalogsService.getStratums });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['stratums'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const dto = { ...form, publicPercent: parseFloat(form.publicPercent) || 0 };
      return editing
        ? catalogsService.updateStratum(editing.id, dto)
        : catalogsService.createStratum(dto);
    },
    onSuccess: () => { invalidate(); setOpen(false); },
    onError: (e: any) => setErr(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => catalogsService.toggleStratum(id),
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', billingType: 'residential', publicPercent: '0' });
    setErr(''); setOpen(true);
  };
  const openEdit = (s: Stratum) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code ?? '', billingType: s.billing_type, publicPercent: String(s.public_percent) });
    setErr(''); setOpen(true);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <CatalogShell label="Estrato" onAdd={openCreate}>
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <Th>Nombre</Th><Th>Código</Th><Th>Tipo facturación</Th><Th>% Alumbrado</Th><Th>Estado</Th><Th />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center"><LoadingCell /></td></tr>}
              {!isLoading && !data?.length && <EmptyRow cols={6} />}
              {data?.map((s) => (
                <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-neutral-900">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-600">{s.code}</td>
                  <td className="px-4 py-3 text-neutral-600">{BILLING_TYPES.find((b) => b.value === s.billing_type)?.label ?? s.billing_type}</td>
                  <td className="px-4 py-3 text-neutral-600">{s.public_percent}%</td>
                  <td className="px-4 py-3"><StatusChip status={s.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <ToggleBtn active={s.status === 'active'} loading={toggleMutation.isPending} onClick={() => toggleMutation.mutate(s.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? 'Editar estrato' : 'Nuevo estrato'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input label="Código" value={form.code} onChange={(e) => set('code', e.target.value)} hint="Ej: R1, C2, OF" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de facturación</label>
            <select
              value={form.billingType}
              onChange={(e) => set('billingType', e.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {BILLING_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <p className="text-xs text-neutral-400 mt-1">
              Residencial aplica tarifas escalonadas según los umbrales configurados. Comercial/Oficial usan tasa única.
            </p>
          </div>
          <Input
            label="% Subsidio alumbrado público"
            type="number" min={0} max={100} step={0.01}
            hint="Porcentaje de descuento en cargo de alumbrado"
            value={form.publicPercent}
            onChange={(e) => set('publicPercent', e.target.value)}
          />
          {err && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button loading={saveMutation.isPending} disabled={!form.name.trim() || !form.code.trim()} onClick={() => { setErr(''); saveMutation.mutate(); }}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Dialog>
    </CatalogShell>
  );
}

// ─── Causales ─────────────────────────────────────────────────────────────────

function CausalsTab() {
  const qc = useQueryClient();
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Causal | null>(null);
  const [form,    setForm]    = useState({ name: '', code: '' });
  const [err,     setErr]     = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['causals'], queryFn: catalogsService.getCausals });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['causals'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const dto = { name: form.name.trim(), code: form.code ? parseInt(form.code, 10) : undefined };
      return editing
        ? catalogsService.updateCausal(editing.id, dto)
        : catalogsService.createCausal(dto);
    },
    onSuccess: () => { invalidate(); setOpen(false); },
    onError: (e: any) => setErr(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => catalogsService.toggleCausal(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '' }); setErr(''); setOpen(true); };
  const openEdit   = (c: Causal) => { setEditing(c); setForm({ name: c.name, code: c.code ? String(c.code) : '' }); setErr(''); setOpen(true); };

  return (
    <CatalogShell label="Causal" onAdd={openCreate}>
      <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
        Los códigos <strong>2 y 3</strong> generan consumo cero automáticamente al importar lecturas.
      </div>
      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <Th>Nombre</Th><Th>Código</Th><Th>Estado</Th><Th />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center"><LoadingCell /></td></tr>}
            {!isLoading && !data?.length && <EmptyRow cols={4} />}
            {data?.map((c) => (
              <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-900">{c.name}</td>
                <td className="px-4 py-3">
                  {c.code ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                      (c.code === 2 || c.code === 3) ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>{c.code}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3"><StatusChip status={c.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <ToggleBtn active={c.status === 'active'} loading={toggleMutation.isPending} onClick={() => toggleMutation.mutate(c.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? 'Editar causal' : 'Nueva causal'} size="sm">
        <div className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input
            label="Código numérico"
            type="number" min={1} step={1}
            hint="Códigos 2 y 3 generan lectura cero"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          {err && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button loading={saveMutation.isPending} disabled={!form.name.trim()} onClick={() => { setErr(''); saveMutation.mutate(); }}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Dialog>
    </CatalogShell>
  );
}

// ─── Medidores ────────────────────────────────────────────────────────────────

function MetersTab() {
  const qc = useQueryClient();
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Meter | null>(null);
  const [form,    setForm]    = useState({ mark: '', factor: '' });
  const [err,     setErr]     = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['meters'], queryFn: catalogsService.getMeters });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['meters'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const dto = { mark: form.mark.trim(), factor: form.factor.trim() || undefined };
      return editing
        ? catalogsService.updateMeter(editing.id, dto)
        : catalogsService.createMeter(dto);
    },
    onSuccess: () => { invalidate(); setOpen(false); },
    onError: (e: any) => setErr(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => catalogsService.toggleMeter(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setEditing(null); setForm({ mark: '', factor: '' }); setErr(''); setOpen(true); };
  const openEdit   = (m: Meter) => { setEditing(m); setForm({ mark: m.mark, factor: m.factor ?? '' }); setErr(''); setOpen(true); };

  return (
    <CatalogShell label="Medidor" onAdd={openCreate}>
      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <Th>Marca</Th><Th>Factor</Th><Th>Estado</Th><Th />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center"><LoadingCell /></td></tr>}
            {!isLoading && !data?.length && <EmptyRow cols={4} />}
            {data?.map((m) => (
              <tr key={m.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-900">{m.mark}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-600">{m.factor ?? '—'}</td>
                <td className="px-4 py-3"><StatusChip status={m.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <ToggleBtn active={m.status === 'active'} loading={toggleMutation.isPending} onClick={() => toggleMutation.mutate(m.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? 'Editar medidor' : 'Nuevo medidor'} size="sm">
        <div className="space-y-4">
          <Input label="Marca / Modelo" value={form.mark} onChange={(e) => setForm((f) => ({ ...f, mark: e.target.value }))} />
          <Input
            label="Factor de conversión"
            hint="Ej: 1.0, 10, 100 — dejar vacío si es 1:1"
            value={form.factor}
            onChange={(e) => setForm((f) => ({ ...f, factor: e.target.value }))}
          />
          {err && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button loading={saveMutation.isPending} disabled={!form.mark.trim()} onClick={() => { setErr(''); saveMutation.mutate(); }}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Dialog>
    </CatalogShell>
  );
}

// ─── Costos CU ────────────────────────────────────────────────────────────────

function UnitCostsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ generation: '', distribution: '', marketing: '', losses: '', cu: '' });
  const [err,  setErr]  = useState('');

  const { data: history, isLoading } = useQuery({ queryKey: ['unit-costs'], queryFn: catalogsService.getUnitCosts });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['unit-costs'] });

  const saveMutation = useMutation({
    mutationFn: () => catalogsService.createUnitCost({
      generation:   parseFloat(form.generation)   || 0,
      distribution: parseFloat(form.distribution) || 0,
      marketing:    parseFloat(form.marketing)     || 0,
      losses:       parseFloat(form.losses)        || 0,
      cu:           parseFloat(form.cu)            || 0,
    }),
    onSuccess: () => { invalidate(); setOpen(false); },
    onError: (e: any) => setErr(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const active = history?.find((c) => c.active);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => {
    setForm(active
      ? { generation: String(active.generation), distribution: String(active.distribution), marketing: String(active.marketing), losses: String(active.losses), cu: String(active.cu) }
      : { generation: '', distribution: '', marketing: '', losses: '', cu: '' }
    );
    setErr(''); setOpen(true);
  };

  const cu = parseFloat(form.cu) || 0;

  return (
    <div className="space-y-4">
      {/* Active CU card */}
      {active && (
        <Card padding="md" className="border-primary-100 bg-primary-50/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">CU activo</p>
            <span className="text-xs text-neutral-500">{new Date(active.created_at).toLocaleDateString('es-CO')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Generación',      value: active.generation },
              { label: 'Distribución',    value: active.distribution },
              { label: 'Comercialización', value: active.marketing },
              { label: 'Pérdidas',        value: active.losses },
              { label: 'CU total',        value: active.cu },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-white border border-primary-100 p-2.5 text-center">
                <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-primary-700">${Number(value).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" />
          Registrar nuevo CU
        </Button>
      </div>

      {/* History */}
      <Card padding="none">
        <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          <History className="h-3.5 w-3.5" />
          Historial
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <Th>Fecha</Th><Th>Generación</Th><Th>Distribución</Th><Th>Comercial.</Th><Th>Pérdidas</Th><Th>CU total</Th><Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center"><LoadingCell /></td></tr>}
            {!isLoading && !history?.length && <EmptyRow cols={7} />}
            {history?.map((c) => (
              <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(c.created_at).toLocaleDateString('es-CO')}</td>
                <td className="px-4 py-3 font-mono text-xs">{formatCurrency(c.generation)}</td>
                <td className="px-4 py-3 font-mono text-xs">{formatCurrency(c.distribution)}</td>
                <td className="px-4 py-3 font-mono text-xs">{formatCurrency(c.marketing)}</td>
                <td className="px-4 py-3 font-mono text-xs">{formatCurrency(c.losses)}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-900">{formatCurrency(c.cu)}</td>
                <td className="px-4 py-3">
                  {c.active
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Activo</span>
                    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">Histórico</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* New CU dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar nuevo costo de proveedor">
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">Al guardar, este CU se activará y el anterior quedará como histórico.</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Generación ($/kWh)"     type="number" step="0.01" min={0} value={form.generation}   onChange={(e) => set('generation',   e.target.value)} />
            <Input label="Distribución ($/kWh)"   type="number" step="0.01" min={0} value={form.distribution} onChange={(e) => set('distribution', e.target.value)} />
            <Input label="Comercialización ($/kWh)" type="number" step="0.01" min={0} value={form.marketing}   onChange={(e) => set('marketing',    e.target.value)} />
            <Input label="Pérdidas ($/kWh)"       type="number" step="0.01" min={0} value={form.losses}       onChange={(e) => set('losses',       e.target.value)} />
          </div>
          <Input
            label="CU total ($/kWh)"
            type="number" step="0.01" min={0}
            hint="Debe coincidir con la suma de los componentes"
            value={form.cu}
            onChange={(e) => set('cu', e.target.value)}
          />
          {cu > 0 && (
            <div className="p-2 rounded-lg bg-neutral-50 text-xs text-neutral-500">
              Suma componentes: <strong>${(
                (parseFloat(form.generation) || 0) +
                (parseFloat(form.distribution) || 0) +
                (parseFloat(form.marketing) || 0) +
                (parseFloat(form.losses) || 0)
              ).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong>
              {' · '}CU ingresado: <strong>${cu.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong>
            </div>
          )}
          {err && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button loading={saveMutation.isPending} disabled={cu <= 0} onClick={() => { setErr(''); saveMutation.mutate(); }}>
              Activar nuevo CU
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ─── Mini shared ──────────────────────────────────────────────────────────────
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">{children}</th>;
}
function LoadingCell() {
  return <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse mx-auto" />;
}
