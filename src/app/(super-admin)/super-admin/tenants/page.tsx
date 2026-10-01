'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Power, ChevronRight, LogOut, Building2 } from 'lucide-react';
import { tenantsService, type TenantListItem } from '@/services/tenants.service';
import { useSAAuthStore } from '@/store/super-admin-auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { NexusBrand } from '@/components/brand/nexus-logo';

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  starter:    'bg-neutral-100 text-neutral-600',
  pro:        'bg-info-50 text-info-700',
  enterprise: 'bg-primary-50 text-primary-700',
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${PLAN_STYLES[plan] ?? PLAN_STYLES.starter}`}>
      {plan}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? 'text-primary-700' : 'text-neutral-400'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary-500' : 'bg-neutral-400'}`} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

// ─── Create schema ────────────────────────────────────────────────────────────

const createSchema = z.object({
  slug:          z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  name:          z.string().min(2, 'Mínimo 2 caracteres'),
  plan:          z.enum(['starter', 'pro', 'enterprise']),
  adminName:     z.string().min(2, 'Requerido'),
  adminEmail:    z.string().email('Email inválido'),
  adminPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  primaryColor:  z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Formato #rrggbb').optional().or(z.literal('')),
});

type CreateForm = z.infer<typeof createSchema>;

// ─── Create dialog ────────────────────────────────────────────────────────────

function CreateTenantDialog({ onClose }: { onClose: () => void }) {
  const qc     = useQueryClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    setValue,
  } = useForm<CreateForm>({
    resolver:      zodResolver(createSchema),
    defaultValues: { plan: 'starter', primaryColor: '#16a34a' },
  });

  const primaryColor = watch('primaryColor');

  const mutation = useMutation({
    mutationFn: (data: CreateForm) =>
      tenantsService.create({
        ...data,
        primaryColor: data.primaryColor || undefined,
      }),
    onSuccess: (tenant) => {
      qc.invalidateQueries({ queryKey: ['sa-tenants'] });
      onClose();
      router.push(`/super-admin/tenants/${tenant.id}`);
    },
    onError: () => {
      setError('slug', { message: 'El slug ya está en uso o los datos son inválidos' });
    },
  });

  return (
    <Dialog open onClose={onClose} title="Nuevo tenant" size="lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        {/* Identity */}
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Identidad</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Slug *"
                placeholder="mi-empresa"
                error={errors.slug?.message}
                {...register('slug')}
              />
              <p className="text-xs text-neutral-400 mt-1">Identificador único. No se puede cambiar después.</p>
            </div>
            <Input
              label="Nombre de la empresa *"
              placeholder="Mi Empresa S.A."
              error={errors.name?.message}
              {...register('name')}
            />
          </div>
        </section>

        {/* Plan + color */}
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Plan y apariencia</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Plan</label>
              <select
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('plan')}
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Color primario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor || '#16a34a'}
                  onChange={(e) =>
                    setValue('primaryColor', e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className="h-9 w-14 rounded border border-neutral-200 cursor-pointer p-0.5"
                  aria-label="Seleccionar color primario"
                />
                <Input
                  placeholder="#16a34a"
                  error={errors.primaryColor?.message}
                  {...register('primaryColor')}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Admin account */}
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Cuenta de administrador inicial</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              placeholder="Juan Pérez"
              error={errors.adminName?.message}
              {...register('adminName')}
            />
            <Input
              label="Correo *"
              type="email"
              placeholder="admin@empresa.com"
              error={errors.adminEmail?.message}
              {...register('adminEmail')}
            />
            <Input
              label="Contraseña *"
              type="password"
              error={errors.adminPassword?.message}
              {...register('adminPassword')}
              className="sm:col-span-2"
            />
          </div>
        </section>

        <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button type="submit" size="sm" loading={isSubmitting || mutation.isPending}>
            Crear tenant
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const router    = useRouter();
  const clearAuth = useSAAuthStore((s) => s.clearAuth);
  const saUser    = useSAAuthStore((s) => s.user);
  const qc        = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['sa-tenants'],
    queryFn:  tenantsService.findAll,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => tenantsService.toggleStatus(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['sa-tenants'] }),
  });

  const active   = tenants.filter((t) => t.status === 'active').length;
  const inactive = tenants.length - active;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <NexusBrand label="Nexus Super Admin" markClassName="h-8 w-8 rounded-lg" textClassName="text-sm font-semibold" />
              {saUser && (
                <span className="text-xs text-neutral-400 ml-2">· {saUser.email}</span>
              )}
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <button
              className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-900 font-medium"
            >
              Tenants
            </button>
            <button
              onClick={() => router.push('/super-admin/reports')}
              className="px-3 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Reportes
            </button>
          </nav>
          <button
            onClick={() => { clearAuth(); router.push('/super-admin/login'); }}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Stats + action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-neutral-900">{tenants.length}</p>
              <p className="text-xs text-neutral-500">Tenants totales</p>
            </div>
            <div className="h-8 w-px bg-neutral-200" />
            <div>
              <p className="text-2xl font-bold text-primary-700">{active}</p>
              <p className="text-xs text-neutral-500">Activos</p>
            </div>
            {inactive > 0 && (
              <>
                <div className="h-8 w-px bg-neutral-200" />
                <div>
                  <p className="text-2xl font-bold text-neutral-400">{inactive}</p>
                  <p className="text-xs text-neutral-500">Inactivos</p>
                </div>
              </>
            )}
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo tenant
          </Button>
        </div>

        {/* Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Empresa</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Slug</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Estado</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Creado</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {isLoading && (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-neutral-400">Cargando...</td></tr>
                )}
                {!isLoading && tenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Building2 className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
                      <p className="text-sm text-neutral-400">No hay tenants registrados</p>
                      <button
                        onClick={() => setCreateOpen(true)}
                        className="mt-2 text-sm text-primary-600 hover:underline"
                      >
                        Crear el primero
                      </button>
                    </td>
                  </tr>
                )}
                {tenants.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-neutral-50 cursor-pointer"
                    onClick={() => router.push(`/super-admin/tenants/${t.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {/* Color swatch */}
                        <div
                          className="h-6 w-6 rounded shrink-0 border border-neutral-200"
                          style={{ backgroundColor: t.primaryColor ?? '#16a34a' }}
                        />
                        <span className="font-medium text-neutral-800">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">{t.slug}</code>
                    </td>
                    <td className="py-3 px-4"><PlanBadge plan={t.plan} /></td>
                    <td className="py-3 px-4"><StatusDot status={t.status} /></td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">
                      {new Date(t.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          title={t.status === 'active' ? 'Desactivar' : 'Activar'}
                          onClick={() => toggleMutation.mutate(t.id)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-danger-600 transition-colors"
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-neutral-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {createOpen && <CreateTenantDialog onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
