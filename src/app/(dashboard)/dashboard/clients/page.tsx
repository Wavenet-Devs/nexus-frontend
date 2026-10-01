'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Users, MoreVertical, CheckCircle, XCircle, Upload } from 'lucide-react';
import { clientsService } from '@/services/clients.service';
import { catalogsService } from '@/services/catalogs.service';
import { useDebounce } from '@/hooks/use-debounce';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/dialog';

const LIMIT = 20;

export default function ClientsPage() {
  const router       = useRouter();
  const queryClient  = useQueryClient();

  const [page,           setPage]           = useState(1);
  const [search,         setSearch]         = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [stratumId,      setStratumId]      = useState('');
  const [activeFilter,   setActiveFilter]   = useState('');
  const [showFilters,    setShowFilters]     = useState(false);
  const [toggleTarget,   setToggleTarget]   = useState<{ id: string; name: string; active: boolean } | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, debouncedSearch, neighborhoodId, stratumId, activeFilter],
    queryFn:  () => clientsService.findAll({
      search: debouncedSearch || undefined,
      neighborhoodId: neighborhoodId || undefined,
      stratumId:      stratumId || undefined,
      status:         (activeFilter || undefined) as 'active' | 'inactive' | undefined,
      page,
      limit: LIMIT,
    }),
  });

  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn:  catalogsService.getNeighborhoods,
  });

  const { data: stratums } = useQuery({
    queryKey: ['stratums'],
    queryFn:  catalogsService.getStratums,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => clientsService.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setToggleTarget(null);
    },
  });

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleFilter(key: string, value: string) {
    if (key === 'neighborhood') setNeighborhoodId(value);
    if (key === 'stratum')      setStratumId(value);
    if (key === 'active')       setActiveFilter(value);
    setPage(1);
  }

  const hasFilters = !!(neighborhoodId || stratumId || activeFilter);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por nombre o contrato…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className={hasFilters ? 'border-primary-500 text-primary-600' : ''}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros{hasFilters ? ` (${[neighborhoodId, stratumId, activeFilter].filter(Boolean).length})` : ''}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/clients/groups')}>
            <Users className="h-3.5 w-3.5" />
            Grupos
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/clients/import')}>
            <Upload className="h-3.5 w-3.5" />
            Importar XLSX/CSV
          </Button>
          <Button size="sm" onClick={() => router.push('/dashboard/clients/new')}>
            <Plus className="h-3.5 w-3.5" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Filtros expandibles */}
      {showFilters && (
        <Card padding="sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Barrio"
              value={neighborhoodId}
              onChange={(e) => handleFilter('neighborhood', e.target.value)}
            >
              <option value="">Todos los barrios</option>
              {neighborhoods?.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </Select>
            <Select
              label="Estrato"
              value={stratumId}
              onChange={(e) => handleFilter('stratum', e.target.value)}
            >
              <option value="">Todos los estratos</option>
              {stratums?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select
              label="Estado"
              value={activeFilter}
              onChange={(e) => handleFilter('active', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </Select>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setNeighborhoodId(''); setStratumId(''); setActiveFilter(''); setPage(1); }}
              className="mt-3 text-xs text-primary-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </Card>
      )}

      {/* Tabla */}
      <Card padding="none">
        {isLoading ? (
          <TableSkeleton />
        ) : !data?.data?.length ? (
          <EmptyState
            icon={Users}
            title="No se encontraron clientes"
            message={search ? 'Intenta con otro término de búsqueda.' : 'Aún no hay clientes registrados.'}
            action={
              <Button size="sm" onClick={() => router.push('/dashboard/clients/new')}>
                <Plus className="h-3.5 w-3.5" />
                Nuevo cliente
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Contrato</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Dirección</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Barrio</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Estrato</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Estado</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-neutral-600">{client.contract}</td>
                      <td className="px-5 py-3.5 font-medium text-neutral-900">{client.name}</td>
                      <td className="px-5 py-3.5 text-neutral-600 max-w-[200px] truncate">{client.address}</td>
                      <td className="px-5 py-3.5 text-neutral-600">{client.neighborhood_name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-neutral-600">{client.stratum_name ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                            className="px-2.5 h-7 rounded-md text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setToggleTarget({ id: client.id, name: client.name, active: client.status === 'active' })}
                            className="px-2.5 h-7 rounded-md text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
                          >
                            {client.status === 'active' ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-neutral-100">
              {data.data.map((client) => (
                <div
                  key={client.id}
                  className="px-4 py-3.5 flex items-center gap-3 hover:bg-neutral-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 text-xs font-bold uppercase">
                    {client.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{client.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{client.contract} · {client.neighborhood_name ?? client.address}</p>
                  </div>
                  <StatusBadge status={client.status} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-5 pb-4">
              <Pagination
                page={data.page}
                lastPage={data.lastPage}
                total={data.total}
                limit={LIMIT}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* Confirm toggle */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && toggleMutation.mutate(toggleTarget.id)}
        loading={toggleMutation.isPending}
        title={toggleTarget?.active ? 'Desactivar cliente' : 'Activar cliente'}
        message={`¿Confirmas ${toggleTarget?.active ? 'desactivar' : 'activar'} al cliente "${toggleTarget?.name}"?`}
        danger={toggleTarget?.active}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 rounded-lg bg-neutral-100 animate-pulse" />
      ))}
    </div>
  );
}
