'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { ClientForm } from '../_components/client-form';
import { clientsService, type CreateClientDto } from '@/services/clients.service';

export default function NewClientPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (dto: CreateClientDto) => clientsService.create(dto),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push(`/dashboard/clients/${client.id}`);
    },
  });

  async function handleSubmit(data: CreateClientDto) {
    await mutation.mutateAsync(data);
  }

  return (
    <div className="max-w-3xl">
      <Card>
        <div className="mb-6">
          <h2 className="text-base font-semibold text-neutral-900">Nuevo cliente</h2>
          <p className="text-sm text-neutral-500 mt-1">Completa los datos del cliente a registrar.</p>
        </div>
        {mutation.isError && (
          <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-3 text-sm text-danger-600">
            {(mutation.error as any)?.response?.data?.message ?? 'Error al crear el cliente'}
          </div>
        )}
        <ClientForm onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
