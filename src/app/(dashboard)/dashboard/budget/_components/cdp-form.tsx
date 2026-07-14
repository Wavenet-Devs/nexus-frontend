'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService, CreateCdpDto } from '@/services/budget.service';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';

interface Props {
  open: boolean;
  onClose: () => void;
  budgetId: string;
}

export function CdpForm({ open, onClose, budgetId }: Props) {
  const queryClient = useQueryClient();

  const [accountId, setAccountId]     = useState('');
  const [categoryId, setCategoryId]   = useState('');
  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [error, setError]             = useState('');

  const { data: accounts }   = useQuery({ queryKey: ['budget-accounts'],   queryFn: () => budgetService.listAccounts(),   enabled: open });
  const { data: categories } = useQuery({ queryKey: ['budget-categories'], queryFn: () => budgetService.listCategories(), enabled: open });

  const mutation = useMutation({
    mutationFn: (dto: CreateCdpDto) => budgetService.createCdp(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      reset();
      onClose();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se pudo crear el CDP'),
  });

  function reset() {
    setAccountId(''); setCategoryId(''); setAmount(''); setDescription(''); setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amountNum = parseFloat(amount);
    if (!accountId)  return setError('Selecciona una cuenta contable');
    if (!categoryId) return setError('Selecciona un rubro presupuestal');
    if (isNaN(amountNum) || amountNum <= 0) return setError('Ingresa un valor mayor a cero');
    mutation.mutate({ budgetId, accountId, categoryId, amount: amountNum, description });
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo CDP" size="md">
      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-2 text-sm text-danger-600">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Cuenta contable" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Selecciona…</option>
          {accounts?.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
        </Select>
        <Select label="Rubro presupuestal" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Selecciona…</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
        </Select>
        <Input label="Valor a reservar" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input label="Objeto / descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>Crear CDP</Button>
        </div>
      </form>
    </Dialog>
  );
}
