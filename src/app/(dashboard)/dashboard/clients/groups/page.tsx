'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Trash2, ChevronRight, Gauge } from 'lucide-react';
import { clientsService, type ClientGroup } from '@/services/clients.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';

export default function ClientGroupsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch]     = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [openId, setOpenId]     = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ClientGroup | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ['client-groups', search],
    queryFn:  () => clientsService.listGroups(search || undefined),
  });

  const remove = useMutation({
    mutationFn: (id: string) => clientsService.deleteGroup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['client-groups'] });
      void qc.invalidateQueries({ queryKey: ['clients'] });
      setToDelete(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Grupos de titular</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Varios medidores que responden a la misma persona — condominios, locales de un
            mismo dueño. Cada medidor conserva su contrato y su factura.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" />
          Nuevo grupo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por titular o documento…"
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !groups?.length ? (
        <EmptyState
          icon={Users}
          title={search ? 'Sin resultados' : 'Aún no hay grupos'}
          message={
            search
              ? 'Ningún titular coincide con la búsqueda.'
              : 'Crea un grupo para registrar los medidores de un condominio bajo un mismo titular.'
          }
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Card key={g.id} padding="md" className="hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary-100 text-primary-700 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{g.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {g.idCard ? `Documento ${g.idCard}` : 'Sin documento'}
                    {g.phone ? ` · ${g.phone}` : ''}
                  </p>
                </div>
                <Badge variant={g.members ? 'default' : 'ghost'}>
                  <Gauge className="h-3 w-3 mr-1 inline" />
                  {g.members} medidor{g.members === 1 ? '' : 'es'}
                </Badge>
                <button
                  onClick={() => setToDelete(g)}
                  className="p-1.5 rounded text-neutral-400 hover:text-danger-600 hover:bg-neutral-100 transition-colors"
                  title="Eliminar grupo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpenId(g.id)}
                  className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  title="Ver medidores"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewGroupDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => {
          void qc.invalidateQueries({ queryKey: ['client-groups'] });
          setShowNew(false);
        }}
      />

      <GroupDetailDialog
        groupId={openId}
        onClose={() => setOpenId(null)}
        onOpenClient={(id) => { setOpenId(null); router.push(`/dashboard/clients/${id}`); }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminar grupo"
        message={
          toDelete
            ? `Se elimina el grupo «${toDelete.name}». Sus ${toDelete.members} medidor(es) NO se ` +
              'borran: quedan como clientes sueltos, con su contrato e historial intactos.'
            : ''
        }
        danger
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}

function NewGroupDialog({
  open, onClose, onCreated,
}: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [name, setName]     = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone]   = useState('');

  const create = useMutation({
    mutationFn: () => clientsService.createGroup({
      name, idCard: idCard.trim() || undefined, phone: phone.trim() || undefined,
    }),
    onSuccess: () => { setName(''); setIdCard(''); setPhone(''); onCreated(); },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo grupo de titular">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          El grupo identifica a quien responde por varios medidores. La facturación no cambia:
          cada medidor sigue generando su propia factura.
        </p>
        <Input
          label="Nombre del titular o copropiedad"
          placeholder="Condominio Los Robles"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Documento"
            placeholder="12345678"
            hint="Opcional. No puede repetirse en otro grupo."
            value={idCard}
            onChange={(e) => setIdCard(e.target.value)}
          />
          <Input
            label="Teléfono"
            placeholder="300 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {create.isError && <p className="text-xs text-danger-600">{errorMessage(create.error)}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={create.isPending} disabled={name.trim().length < 3} onClick={() => create.mutate()}>
            Crear grupo
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function GroupDetailDialog({
  groupId, onClose, onOpenClient,
}: {
  groupId: string | null;
  onClose: () => void;
  onOpenClient: (clientId: string) => void;
}) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['client-group', groupId],
    queryFn:  () => clientsService.findGroup(groupId!),
    enabled:  !!groupId,
  });

  const detach = useMutation({
    mutationFn: (clientId: string) => clientsService.setClientGroup(clientId, null),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['client-group', groupId] });
      void qc.invalidateQueries({ queryKey: ['client-groups'] });
    },
  });

  return (
    <Dialog open={!!groupId} onClose={onClose} title={data?.name ?? 'Grupo'} size="lg">
      <div className="space-y-4">
        <div className="text-sm text-neutral-600">
          {data?.idCard && <p>Documento: <strong>{data.idCard}</strong></p>}
          {data?.phone && <p>Teléfono: {data.phone}</p>}
        </div>

        {!data?.clients.length ? (
          <p className="text-sm text-neutral-400 py-4 text-center">
            Este grupo todavía no tiene medidores. Asígnalos desde la ficha de cada cliente.
          </p>
        ) : (
          <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100">
            {data.clients.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{c.name}</p>
                  <p className="text-xs text-neutral-500">
                    {c.contract}{c.address ? ` · ${c.address}` : ''}
                    {c.neighborhood_name ? ` · ${c.neighborhood_name}` : ''}
                  </p>
                </div>
                <Badge variant={c.status === 'active' ? 'default' : 'ghost'}>
                  {c.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
                <button
                  onClick={() => onOpenClient(c.id)}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Ver
                </button>
                <button
                  onClick={() => detach.mutate(c.id)}
                  className="text-xs text-neutral-400 hover:text-danger-600"
                  title="Quitar del grupo"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function errorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? 'Ocurrió un error inesperado';
}
