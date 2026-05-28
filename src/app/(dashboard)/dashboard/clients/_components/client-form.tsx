'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { catalogsService } from '@/services/catalogs.service';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import type { ClientDetail, CreateClientDto } from '@/services/clients.service';

const schema = z.object({
  contract:        z.string().min(1, 'Requerido'),
  name:            z.string().min(2, 'Mínimo 2 caracteres'),
  address:         z.string().min(3, 'Requerido'),
  idTypeId:        z.string().optional(),
  idCard:          z.string().optional(),
  causalId:        z.string().optional(),
  phone:           z.string().optional(),
  email:           z.string().email('Email inválido').optional().or(z.literal('')),
  stratumId:       z.string().optional(),
  neighborhoodId:  z.string().optional(),
  circuitId:       z.string().optional(),
  routeId:         z.string().optional(),
  meterId:         z.string().optional(),
  codBar:          z.string().optional(),
  reader:          z.string().optional(),
  deliver:         z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClientFormProps {
  defaultValues?: Partial<ClientDetail>;
  onSubmit:       (data: CreateClientDto) => Promise<void>;
  isEditing?:     boolean;
}

export function ClientForm({ defaultValues, onSubmit, isEditing = false }: ClientFormProps) {
  const { data: stratums }      = useQuery({ queryKey: ['stratums'],       queryFn: catalogsService.getStratums });
  const { data: neighborhoods } = useQuery({ queryKey: ['neighborhoods'],  queryFn: catalogsService.getNeighborhoods });
  const { data: circuits }      = useQuery({ queryKey: ['circuits'],       queryFn: catalogsService.getCircuits });
  const { data: routes }        = useQuery({ queryKey: ['routes'],         queryFn: catalogsService.getRoutes });
  const { data: meters }        = useQuery({ queryKey: ['meters'],         queryFn: catalogsService.getMeters });
  const { data: idTypes }       = useQuery({ queryKey: ['id-types'],       queryFn: catalogsService.getIdentificationTypes });
  const { data: causals }       = useQuery({ queryKey: ['causals'],        queryFn: catalogsService.getCausals });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract:       defaultValues?.contract       ?? '',
      name:           defaultValues?.name           ?? '',
      address:        defaultValues?.address        ?? '',
      idTypeId:       defaultValues?.id_type_id     ?? '',
      idCard:         defaultValues?.id_card        ?? '',
      causalId:       defaultValues?.causal_id      ?? '',
      phone:          defaultValues?.phone          ?? '',
      email:          defaultValues?.email          ?? '',
      stratumId:      defaultValues?.stratum_id     ?? '',
      neighborhoodId: defaultValues?.neighborhood_id ?? '',
      circuitId:      defaultValues?.circuit_id     ?? '',
      routeId:        defaultValues?.route_id       ?? '',
      meterId:        defaultValues?.meter_id       ?? '',
      codBar:         defaultValues?.cod_bar        ?? '',
      reader:         defaultValues?.reader         ?? '',
      deliver:        defaultValues?.deliver        ?? '',
    },
  });

  async function handleFormSubmit(data: FormData) {
    // Normaliza vacíos a undefined para no enviar strings vacíos
    const clean = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v]),
    ) as unknown as CreateClientDto;
    await onSubmit(clean);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Datos principales */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Datos principales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contrato *"
            placeholder="001234"
            error={errors.contract?.message}
            disabled={isEditing}
            {...register('contract')}
          />
          <Input
            label="Nombre completo *"
            placeholder="Juan Pérez"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Dirección *"
            placeholder="Calle 1 # 2-3"
            error={errors.address?.message}
            {...register('address')}
            className="sm:col-span-2"
          />
          <Select label="Tipo de identificación" {...register('idTypeId')}>
            <option value="">Sin especificar</option>
            {idTypes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Input
            label="Número de identificación"
            placeholder="1234567890"
            {...register('idCard')}
          />
          <Select label="Causal" {...register('causalId')}>
            <option value="">Sin causal</option>
            {causals?.filter((c) => c.status === 'active').map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input
            label="Teléfono"
            type="tel"
            placeholder="3001234567"
            {...register('phone')}
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="cliente@correo.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
      </section>

      {/* Clasificación */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Clasificación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Estrato" {...register('stratumId')}>
            <option value="">Sin estrato</option>
            {stratums?.filter((s) => s.status === 'active').map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </Select>
          <Select label="Barrio" {...register('neighborhoodId')}>
            <option value="">Sin barrio</option>
            {neighborhoods?.filter((n) => n.status === 'active').map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </Select>
          <Select label="Circuito" {...register('circuitId')}>
            <option value="">Sin circuito</option>
            {circuits?.filter((c) => c.status === 'active').map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select label="Ruta" {...register('routeId')}>
            <option value="">Sin ruta</option>
            {routes?.filter((r) => r.status === 'active').map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          <Select label="Medidor" {...register('meterId')}>
            <option value="">Sin medidor</option>
            {meters?.filter((m) => m.status === 'active').map((m) => (
              <option key={m.id} value={m.id}>{m.mark}</option>
            ))}
          </Select>
        </div>
      </section>

      {/* Datos operativos */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Datos operativos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Código de barras" {...register('codBar')} />
          <Input label="Lector" {...register('reader')} />
          <Input label="Repartidor" {...register('deliver')} />
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100">
        <Button type="button" variant="outline" size="md" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  );
}
