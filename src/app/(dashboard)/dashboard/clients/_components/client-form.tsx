'use client';

import { useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { catalogsService } from '@/services/catalogs.service';
import { clientsService } from '@/services/clients.service';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import type { ClientDetail, CreateClientDto } from '@/services/clients.service';

const schema = z.object({
  contract:        z.string().min(1, 'Requerido'),
  name:            z.string().min(2, 'Mínimo 2 caracteres'),
  address:         z.string().min(3, 'Requerido'),
  identificationTypeId: z.string().optional(),
  idCard:          z.string().optional(),
  causalId:        z.string().optional(),
  phone:           z.string().optional(),
  email:           z.string().email('Email inválido').optional().or(z.literal('')),
  stratumId:       z.string().optional(),
  neighborhoodId:  z.string().optional(),
  circuitId:       z.string().optional(),
  route:           z.string().optional(),
  meterNumber:     z.string().optional(),
  meterId:         z.string().optional(),
  codBar:          z.string().optional(),
  reader:          z.string().max(10, 'Máximo 10 caracteres').optional(),
  deliver:         z.string().max(10, 'Máximo 10 caracteres').optional(),
  groupId:         z.string().optional(),
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
  const { data: groups }        = useQuery({ queryKey: ['client-groups'],  queryFn: () => clientsService.listGroups() });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract:       defaultValues?.contract       ?? '',
      name:           defaultValues?.name           ?? '',
      address:        defaultValues?.address        ?? '',
      identificationTypeId: defaultValues?.identification_type_id ?? '',
      idCard:         defaultValues?.id_card        ?? '',
      causalId:       defaultValues?.causal_id      ?? '',
      phone:          defaultValues?.phone          ?? '',
      email:          defaultValues?.email          ?? '',
      stratumId:      defaultValues?.stratum_id     ?? '',
      neighborhoodId: defaultValues?.neighborhood_id ?? '',
      circuitId:      defaultValues?.circuit_id     ?? '',
      route:          defaultValues?.route          ?? '',
      meterNumber:    defaultValues?.meter_number   ?? '',
      meterId:        defaultValues?.meter_id       ?? '',
      codBar:         defaultValues?.cod_bar        ?? '',
      reader:         defaultValues?.reader         ?? '',
      deliver:        defaultValues?.deliver        ?? '',
      groupId:        defaultValues?.group_id       ?? '',
    },
  });

  async function handleFormSubmit(data: FormData) {
    // Normaliza vacíos a undefined para no enviar strings vacíos
    const clean = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v]),
    ) as unknown as CreateClientDto;

    // El contrato identifica el punto de servicio y no se puede modificar.
    // En edición se muestra deshabilitado, pero react-hook-form conserva su
    // valor; hay que retirarlo explícitamente antes de hacer PATCH.
    if (isEditing) {
      delete (clean as Partial<CreateClientDto>).contract;
    }

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
          <Select label="Tipo de identificación" {...register('identificationTypeId')}>
            <option value="">Sin especificar</option>
            {idTypes?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <div>
            <Input
              label="Número de identificación"
              placeholder="1234567890"
              hint="Puede repetirse: una persona puede tener varios medidores"
              {...register('idCard')}
            />
            <IdCardHint control={control} />
          </div>
          <Select label="Grupo de titular" {...register('groupId')}>
            <option value="">Sin grupo</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}{g.idCard ? ` · ${g.idCard}` : ''} ({g.members})
              </option>
            ))}
          </Select>
          <p className="text-xs text-neutral-400 -mt-3 sm:col-span-2">
            El grupo agrupa los medidores que responden a la misma persona, como los
            apartamentos de un condominio. Cada medidor conserva su contrato y su factura.
          </p>
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
          <Select label="Ruta" {...register('route')}>
            <option value="">Sin ruta</option>
            {routes?.filter((r) => r.status === 'active').map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </Select>
          <Select label="Tipo / marca de medidor" {...register('meterId')}>
            <option value="">Sin medidor</option>
            {meters?.filter((m) => m.status === 'active').map((m) => (
              <option key={m.id} value={m.id}>{m.mark}</option>
            ))}
          </Select>
          <Input
            label="Número / serial del medidor"
            placeholder="MED-000123"
            {...register('meterNumber')}
          />
        </div>
      </section>

      {/* Datos operativos */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
          Datos operativos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Código de barras" {...register('codBar')} />
          <Input
            label="Lector"
            hint="Código de hasta 10 caracteres"
            error={errors.reader?.message}
            {...register('reader')}
          />
          <Input
            label="Repartidor"
            hint="Código de hasta 10 caracteres"
            error={errors.deliver?.message}
            {...register('deliver')}
          />
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

/**
 * Avisa qué hay ya registrado con ese documento en lugar de bloquear el alta.
 * Antes el backend devolvía 409 y no se podían registrar los medidores de un
 * condominio; ahora se informa para que el operador decida.
 */
function IdCardHint({ control }: { control: Control<FormData> }) {
  const idCard = useWatch({ control, name: 'idCard' });
  const clean  = (idCard ?? '').trim();

  const { data } = useQuery({
    queryKey: ['id-card-lookup', clean],
    queryFn:  () => clientsService.lookupIdCard(clean),
    enabled:  clean.length >= 5,
  });

  if (!data?.clients.length) return null;

  return (
    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-2">
      <Users className="h-3.5 w-3.5 shrink-0 mt-0.5 text-neutral-400" />
      <div>
        <p>
          Ya hay {data.clients.length} medidor{data.clients.length > 1 ? 'es' : ''} con este
          documento{data.group ? <> en el grupo <strong>{data.group.name}</strong></> : null}.
        </p>
        <p className="text-neutral-500 mt-0.5">
          {data.clients.map((c) => c.contract).join(' · ')}
        </p>
      </div>
    </div>
  );
}
