'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { budgetService, CreateBudgetDto } from '@/services/budget.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewBudgetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [age, setAge]           = useState('');
  const [approved, setApproved] = useState('');
  const [error, setError]       = useState('');

  const mutation = useMutation({
    mutationFn: (dto: CreateBudgetDto) => budgetService.create(dto),
    onSuccess: (budget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      router.push(`/dashboard/budget/${budget.id}`);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se pudo crear el presupuesto'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const approvedNum = parseFloat(approved);
    if (!age.trim() || age.trim().length < 4) return setError('Ingresa una vigencia válida (ej. 2026)');
    if (isNaN(approvedNum) || approvedNum < 0) return setError('Ingresa un valor apropiado válido');
    mutation.mutate({ age: age.trim(), approved: approvedNum });
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <Card>
        <CardHeader><CardTitle>Nueva vigencia presupuestal</CardTitle></CardHeader>

        {error && (
          <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-2 text-sm text-danger-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Vigencia (año fiscal)"
            placeholder="2026"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <Input
            label="Valor apropiado (aprobado)"
            type="number"
            step="0.01"
            min="0"
            placeholder="100000000"
            value={approved}
            onChange={(e) => setApproved(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={mutation.isPending}>Crear presupuesto</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
