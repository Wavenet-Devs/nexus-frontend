'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { ClientForm } from '../../_components/client-form';
import { clientsService, type CreateClientDto } from '@/services/clients.service';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router      = useRouter();
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn:  () => clientsService.findOne(id),
  });

  const mutation = useMutation({
    mutationFn: (dto: Partial<CreateClientDto>) => clientsService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push(`/dashboard/clients/${id}`);
    },
  });

  if (isLoading) {
    return <div className="max-w-3xl h-96 rounded-xl bg-neutral-200 animate-pulse" />;
  }

  if (!client) return null;

  return (
    <div className="max-w-3xl">
      <Card>
        <div className="mb-6">
          <h2 className="text-base font-semibold text-neutral-900">Editar cliente</h2>
          <p className="text-sm text-neutral-500 mt-1">{client.name} · Contrato {client.contract}</p>
        </div>
        {mutation.isError && (
          <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-3 text-sm text-danger-600">
            {(mutation.error as any)?.response?.data?.message ?? 'Error al actualizar'}
          </div>
        )}
        <ClientForm
          defaultValues={client}
          onSubmit={async (data) => { await mutation.mutateAsync(data); }}
          isEditing
        />
      </Card>
    </div>
  );
}
