'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { budgetService, CreateRpDto, BudgetCdp } from '@/services/budget.service';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  cdps: BudgetCdp[];
}

interface ItemRow { id: string; amount: string; }

export function RpForm({ open, onClose, budgetId, cdps }: Props) {
  const queryClient = useQueryClient();

  const [type, setType]                   = useState<'expense' | 'income'>('expense');
  const [supplierId, setSupplierId]       = useState('');
  const [items, setItems]                 = useState<ItemRow[]>([{ id: '', amount: '' }]);
  const [executionTime, setExecutionTime] = useState('');
  const [policy, setPolicy]               = useState('');
  const [description, setDescription]     = useState('');
  const [supporting, setSupporting]       = useState('');
  const [error, setError]                 = useState('');

  const { data: suppliers } = useQuery({
    queryKey: ['budget-suppliers'], queryFn: () => budgetService.listSuppliers(), enabled: open && type === 'expense',
  });
  const { data: categories } = useQuery({
    queryKey: ['budget-categories'], queryFn: () => budgetService.listCategories(), enabled: open && type === 'income',
  });
  const incomeCategories = (categories ?? []).filter((c) => c.type === 'A');
  const availableCdps = cdps.filter((c) => Number(c.available) > 0);

  const mutation = useMutation({
    mutationFn: (dto: CreateRpDto) => budgetService.createRp(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      reset();
      onClose();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se pudo crear el RP'),
  });

  function reset() {
    setType('expense'); setSupplierId(''); setItems([{ id: '', amount: '' }]);
    setExecutionTime(''); setPolicy(''); setDescription(''); setSupporting(''); setError('');
  }

  function updateItem(idx: number, field: keyof ItemRow, value: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }
  function addItem()  { setItems((prev) => [...prev, { id: '', amount: '' }]); }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (type === 'expense' && !supplierId) return setError('Selecciona un proveedor');

    const parsed = items
      .map((it) => ({ id: it.id, amount: parseFloat(it.amount) }))
      .filter((it) => it.id && !isNaN(it.amount) && it.amount > 0);
    if (!parsed.length) return setError('Agrega al menos una partida válida (con valor mayor a cero)');

    mutation.mutate({
      budgetId,
      type,
      supplierId: type === 'expense' ? supplierId : undefined,
      items: parsed,
      executionTime: executionTime || undefined,
      policy: policy ? parseFloat(policy) : undefined,
      description: description || undefined,
      supportingDocuments: supporting || undefined,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo movimiento (RP)" size="lg">
      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-2 text-sm text-danger-600">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setItems([{ id: '', amount: '' }]); }}
              className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${
                type === t ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200'
              }`}
            >
              {t === 'expense' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>

        {type === 'expense' && (
          <Select label="Proveedor / tercero" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Selecciona…</option>
            {suppliers?.map((s) => (
              <option key={s.id} value={s.id}>{s.nit} - {s.name}{s.contract ? ` (${s.contract})` : ''}</option>
            ))}
          </Select>
        )}

        {/* Partidas */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            {type === 'expense' ? 'Partidas (CDP a consumir)' : 'Partidas (rubro de ingreso)'}
          </label>
          {items.map((it, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <Select value={it.id} onChange={(e) => updateItem(idx, 'id', e.target.value)}>
                  <option value="">Selecciona…</option>
                  {type === 'expense'
                    ? availableCdps.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} — {c.category} (disp. {formatCurrency(c.available)})</option>
                      ))
                    : incomeCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                </Select>
              </div>
              <div className="w-40">
                <Input type="number" step="0.01" min="0" placeholder="Valor" value={it.amount} onChange={(e) => updateItem(idx, 'amount', e.target.value)} />
              </div>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} className="h-9 px-2 text-neutral-400 hover:text-danger-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
            <Plus className="h-3.5 w-3.5" /> Agregar partida
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Plazo de ejecución" value={executionTime} onChange={(e) => setExecutionTime(e.target.value)} />
          <Input label="Póliza" type="number" step="0.01" min="0" value={policy} onChange={(e) => setPolicy(e.target.value)} />
        </div>
        <Input label="Objeto / descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Documento soporte (URL)" value={supporting} onChange={(e) => setSupporting(e.target.value)} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Registrar RP</Button>
        </div>
      </form>
    </Dialog>
  );
}
