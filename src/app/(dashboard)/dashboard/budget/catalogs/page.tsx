'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { budgetService } from '@/services/budget.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';

type Tab = 'categories' | 'accounts' | 'suppliers';

const TABS: { key: Tab; label: string }[] = [
  { key: 'categories', label: 'Rubros' },
  { key: 'accounts',   label: 'Cuentas contables' },
  { key: 'suppliers',  label: 'Proveedores' },
];

export default function BudgetCatalogsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('categories');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<any | null>(null);
  const [form, setForm]             = useState<Record<string, string>>({});
  const [error, setError]           = useState('');
  const [toDelete, setToDelete]     = useState<any | null>(null);

  const categories = useQuery({ queryKey: ['budget-categories'], queryFn: () => budgetService.listCategories(), enabled: tab === 'categories' });
  const accounts   = useQuery({ queryKey: ['budget-accounts'],   queryFn: () => budgetService.listAccounts(),   enabled: tab === 'accounts' });
  const suppliers  = useQuery({ queryKey: ['budget-suppliers'],  queryFn: () => budgetService.listSuppliers(),  enabled: tab === 'suppliers' });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [`budget-${tab}`] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (tab === 'categories') {
        const dto = { code: form.code, name: form.name, type: form.type || 'A', group: form.group || 'G', service: form.service };
        return editing ? budgetService.updateCategory(editing.id, dto) : budgetService.createCategory(dto);
      }
      if (tab === 'accounts') {
        const dto = { code: form.code, name: form.name };
        return editing ? budgetService.updateAccount(editing.id, dto) : budgetService.createAccount(dto);
      }
      const dto = { name: form.name, nit: form.nit, contract: form.contract };
      return editing ? budgetService.updateSupplier(editing.id, dto) : budgetService.createSupplier(dto);
    },
    onSuccess: () => { invalidate(); closeDialog(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se pudo guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (tab === 'categories') return budgetService.deleteCategory(id);
      if (tab === 'accounts')   return budgetService.deleteAccount(id);
      return budgetService.deleteSupplier(id);
    },
    onSuccess: () => { invalidate(); setToDelete(null); },
    onError: () => setToDelete(null),
  });

  function openCreate() { setEditing(null); setForm({}); setError(''); setDialogOpen(true); }
  function openEdit(row: any) {
    setEditing(row);
    setForm(tab === 'categories'
      ? { code: row.code, name: row.name, type: row.type, group: row.group, service: row.service ?? '' }
      : tab === 'accounts'
        ? { code: row.code, name: row.name }
        : { name: row.name, nit: row.nit, contract: row.contract ?? '' });
    setError('');
    setDialogOpen(true);
  }
  function closeDialog() { setDialogOpen(false); setEditing(null); setForm({}); setError(''); }
  const set = (k: string) => (e: any) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const rows = tab === 'categories' ? categories.data : tab === 'accounts' ? accounts.data : suppliers.data;
  const isLoading = tab === 'categories' ? categories.isLoading : tab === 'accounts' ? accounts.isLoading : suppliers.isLoading;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/budget')}>
          <ArrowLeft className="h-4 w-4" /> Presupuestos
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Nuevo
        </Button>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${
              tab === t.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 pt-5"><CardHeader><CardTitle>{TABS.find((t) => t.key === tab)!.label}</CardTitle></CardHeader></div>
        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />)}</div>
        ) : !rows?.length ? (
          <EmptyState title="Sin registros" message="Crea el primer registro con el botón «Nuevo»." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-400 uppercase border-b border-neutral-100">
                  {tab === 'suppliers'
                    ? (<><th className="px-5 py-2 font-medium">NIT</th><th className="px-5 py-2 font-medium">Nombre</th><th className="px-5 py-2 font-medium">Contrato</th></>)
                    : (<><th className="px-5 py-2 font-medium">Código</th><th className="px-5 py-2 font-medium">Nombre</th>{tab === 'categories' && <th className="px-5 py-2 font-medium">Tipo/Grupo</th>}</>)}
                  <th className="px-5 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    {tab === 'suppliers' ? (
                      <>
                        <td className="px-5 py-2.5 font-mono text-xs">{row.nit}</td>
                        <td className="px-5 py-2.5 text-neutral-700">{row.name}</td>
                        <td className="px-5 py-2.5 text-neutral-500">{row.contract || '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-2.5 font-mono text-xs">{row.code}</td>
                        <td className="px-5 py-2.5 text-neutral-700">{row.name}</td>
                        {tab === 'categories' && (
                          <td className="px-5 py-2.5 text-neutral-500">
                            {row.type === 'A' ? 'Analítico' : 'Mayor'} · {row.group === 'I' ? 'Ingreso' : 'Gasto'}
                          </td>
                        )}
                      </>
                    )}
                    <td className="px-5 py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded text-neutral-400 hover:text-primary-600 hover:bg-neutral-100"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setToDelete(row)} className="p-1.5 rounded text-neutral-400 hover:text-danger-600 hover:bg-neutral-100"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onClose={closeDialog} title={editing ? 'Editar' : 'Nuevo'} size="md">
        {error && <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-2 text-sm text-danger-600">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          {tab === 'suppliers' ? (
            <>
              <Input label="Nombre" value={form.name ?? ''} onChange={set('name')} />
              <Input label="NIT" value={form.nit ?? ''} onChange={set('nit')} />
              <Input label="Contrato" value={form.contract ?? ''} onChange={set('contract')} />
            </>
          ) : (
            <>
              <Input label="Código" value={form.code ?? ''} onChange={set('code')} />
              <Input label="Nombre" value={form.name ?? ''} onChange={set('name')} />
              {tab === 'categories' && (
                <div className="grid grid-cols-3 gap-3">
                  <Select label="Tipo" value={form.type ?? 'A'} onChange={set('type')}>
                    <option value="A">Analítico</option>
                    <option value="M">Mayor</option>
                  </Select>
                  <Select label="Grupo" value={form.group ?? 'G'} onChange={set('group')}>
                    <option value="G">Gasto</option>
                    <option value="I">Ingreso</option>
                  </Select>
                  <Input label="Servicio" value={form.service ?? ''} onChange={set('service')} />
                </div>
              )}
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>Cancelar</Button>
            <Button type="submit" loading={saveMutation.isPending}>Guardar</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        title="Eliminar registro"
        message="¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer."
        loading={deleteMutation.isPending}
        danger
      />
    </div>
  );
}
