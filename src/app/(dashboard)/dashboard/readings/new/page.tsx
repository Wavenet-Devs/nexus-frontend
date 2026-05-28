'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { readingsService, type CreateReadingBatchDto } from '@/services/readings.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const num = z.number().min(0);
const schema = z.object({
  month:         z.number().int().min(1).max(12),
  year:          z.number().int().min(2000).max(2100),
  basic:         num,
  complementary: num,
  plain:         num,
  business:      num,
  official:      num,
  generation:    num,
  distribution:  num,
  marketing:     num,
  losses:        num,
  cu:            num,
  days:          z.number().int().min(1).max(31),
  publicAmount:  num,
  pesoAdjust:    z.number(),
  periodStart:   z.string().min(1),
  periodEnd:     z.string().min(1),
  paymentLimit:  z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

export default function NewReadingBatchPage() {
  const router = useRouter();
  const qc     = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      month:        CURRENT_MONTH,
      year:         CURRENT_YEAR,
      days:         30,
      pesoAdjust:   0,
      publicAmount: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (dto: CreateReadingBatchDto) => readingsService.create(dto),
    onSuccess: (batch) => {
      qc.invalidateQueries({ queryKey: ['reading-batches'] });
      router.push(`/dashboard/readings/${batch.id}`);
    },
  });

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a lecturas
      </button>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {/* Período */}
        <Card padding="md">
          <CardHeader className="pb-4">
            <CardTitle>Período de facturación</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Mes</label>
              <select
                {...register('month', { valueAsNumber: true })}
                className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              {errors.month && <p className="text-xs text-red-500 mt-1">{errors.month.message}</p>}
            </div>
            <Input
              label="Año"
              type="number"
              min={2000}
              max={2100}
              error={errors.year?.message}
              {...register('year', { valueAsNumber: true })}
            />
            <Input
              label="Inicio del período"
              type="date"
              error={errors.periodStart?.message}
              {...register('periodStart')}
            />
            <Input
              label="Fin del período"
              type="date"
              error={errors.periodEnd?.message}
              {...register('periodEnd')}
            />
            <Input
              label="Fecha límite de pago"
              type="date"
              error={errors.paymentLimit?.message}
              {...register('paymentLimit')}
            />
            <Input
              label="Días facturados"
              type="number"
              min={1}
              max={31}
              error={errors.days?.message}
              {...register('days', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {/* Tarifas residenciales */}
        <Card padding="md">
          <CardHeader className="pb-1">
            <CardTitle>Tarifas residenciales ($/kWh)</CardTitle>
          </CardHeader>
          <p className="text-xs text-neutral-500 mb-4">
            Según los umbrales configurados: básico → complementario → suntuario
          </p>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Básica"
              type="number"
              step="0.01"
              min={0}
              hint="Hasta umbral básico"
              error={errors.basic?.message}
              {...register('basic', { valueAsNumber: true })}
            />
            <Input
              label="Complementaria"
              type="number"
              step="0.01"
              min={0}
              hint="Rango medio"
              error={errors.complementary?.message}
              {...register('complementary', { valueAsNumber: true })}
            />
            <Input
              label="Suntuaria"
              type="number"
              step="0.01"
              min={0}
              hint="Alto consumo"
              error={errors.plain?.message}
              {...register('plain', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {/* Tarifas especiales */}
        <Card padding="md">
          <CardHeader className="pb-4">
            <CardTitle>Tarifas especiales ($/kWh)</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Comercial"
              type="number"
              step="0.01"
              min={0}
              error={errors.business?.message}
              {...register('business', { valueAsNumber: true })}
            />
            <Input
              label="Oficial"
              type="number"
              step="0.01"
              min={0}
              error={errors.official?.message}
              {...register('official', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {/* Componentes del costo de energía */}
        <Card padding="md">
          <CardHeader className="pb-1">
            <CardTitle>Componentes del costo unitario (CU)</CardTitle>
          </CardHeader>
          <p className="text-xs text-neutral-500 mb-4">Desagregación del CU para el desglose de la factura</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input
              label="Generación"
              type="number"
              step="0.01"
              min={0}
              error={errors.generation?.message}
              {...register('generation', { valueAsNumber: true })}
            />
            <Input
              label="Distribución"
              type="number"
              step="0.01"
              min={0}
              error={errors.distribution?.message}
              {...register('distribution', { valueAsNumber: true })}
            />
            <Input
              label="Comercialización"
              type="number"
              step="0.01"
              min={0}
              error={errors.marketing?.message}
              {...register('marketing', { valueAsNumber: true })}
            />
            <Input
              label="Pérdidas"
              type="number"
              step="0.01"
              min={0}
              error={errors.losses?.message}
              {...register('losses', { valueAsNumber: true })}
            />
            <Input
              label="CU total"
              type="number"
              step="0.01"
              min={0}
              hint="Suma de componentes"
              error={errors.cu?.message}
              {...register('cu', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {/* Cargos fijos */}
        <Card padding="md">
          <CardHeader className="pb-4">
            <CardTitle>Cargos fijos por factura</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Alumbrado público ($)"
              type="number"
              step="0.01"
              min={0}
              hint="Cargo fijo por suscriptor"
              error={errors.publicAmount?.message}
              {...register('publicAmount', { valueAsNumber: true })}
            />
            <Input
              label="Ajuste al peso ($)"
              type="number"
              step="0.01"
              hint="Puede ser negativo"
              error={errors.pesoAdjust?.message}
              {...register('pesoAdjust', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {mutation.isError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {(mutation.error as any)?.response?.data?.message ?? 'Error al crear el lote'}
          </div>
        )}

        <div className="flex justify-end gap-2 pb-6">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear lote de lectura
          </Button>
        </div>
      </form>
    </div>
  );
}
