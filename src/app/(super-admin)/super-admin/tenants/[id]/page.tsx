'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Power, ChevronDown, ChevronUp,
  LogOut, Save,
} from 'lucide-react';
import { tenantsService, type UpdateTenantDto } from '@/services/tenants.service';
import { useSAAuthStore } from '@/store/super-admin-auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { NexusBrand } from '@/components/brand/nexus-logo';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const updateSchema = z.object({
  name:           z.string().min(2, 'Mínimo 2 caracteres'),
  plan:           z.enum(['starter', 'pro', 'enterprise']),
  primaryColor:   z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Formato #rrggbb').optional().or(z.literal('')),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Formato #rrggbb').optional().or(z.literal('')),
  logoUrl:        z.string().url('URL inválida').optional().or(z.literal('')),
  customDomain:   z.string().optional().or(z.literal('')),
  smtpHost:       z.string().optional().or(z.literal('')),
  smtpPort:       z.number().int().min(1).max(65535).optional(),
  smtpUser:       z.string().email().optional().or(z.literal('')),
  smtpPassword:   z.string().optional().or(z.literal('')),
  smtpFromName:   z.string().optional().or(z.literal('')),
  smtpFromEmail:  z.string().email().optional().or(z.literal('')),
});

type UpdateForm = z.infer<typeof updateSchema>;

// ─── Plan + status helpers ────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  starter:    'bg-neutral-100 text-neutral-600',
  pro:        'bg-info-50 text-info-700',
  enterprise: 'bg-primary-50 text-primary-700',
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-semibold capitalize ${PLAN_STYLES[plan] ?? PLAN_STYLES.starter}`}>
      {plan}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const qc        = useQueryClient();
  const clearAuth = useSAAuthStore((s) => s.clearAuth);

  const [smtpOpen,   setSmtpOpen]   = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [saved,      setSaved]      = useState(false);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['sa-tenant', id],
    queryFn:  () => tenantsService.findOne(id),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    values: tenant
      ? {
          name:           tenant.name,
          plan:           (tenant.plan as 'starter' | 'pro' | 'enterprise') ?? 'starter',
          primaryColor:   tenant.primaryColor   ?? '',
          secondaryColor: tenant.secondaryColor ?? '',
          logoUrl:        tenant.logoUrl        ?? '',
          customDomain:   tenant.customDomain   ?? '',
          smtpHost:       tenant.smtpHost       ?? '',
          smtpPort:       tenant.smtpPort       ?? undefined,
          smtpUser:       tenant.smtpUser       ?? '',
          smtpFromName:   tenant.smtpFromName   ?? '',
          smtpFromEmail:  tenant.smtpFromEmail  ?? '',
          smtpPassword:   '',
        }
      : undefined,
  });

  const primaryColor   = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');
  const logoUrl        = watch('logoUrl');

  const updateMutation = useMutation({
    mutationFn: (data: UpdateForm) => {
      const dto: UpdateTenantDto = {
        name:           data.name,
        plan:           data.plan,
        primaryColor:   data.primaryColor   || undefined,
        secondaryColor: data.secondaryColor || undefined,
        logoUrl:        data.logoUrl        || undefined,
        customDomain:   data.customDomain   || undefined,
        smtpHost:       data.smtpHost       || undefined,
        smtpPort:       data.smtpPort,
        smtpUser:       data.smtpUser       || undefined,
        smtpPassword:   data.smtpPassword   || undefined,
        smtpFromName:   data.smtpFromName   || undefined,
        smtpFromEmail:  data.smtpFromEmail  || undefined,
      };
      return tenantsService.update(id, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-tenant', id] });
      qc.invalidateQueries({ queryKey: ['sa-tenants'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => tenantsService.toggleStatus(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['sa-tenant', id] });
      qc.invalidateQueries({ queryKey: ['sa-tenants'] });
      setToggleOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Cargando...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-neutral-500">Tenant no encontrado</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const isActive = tenant.status === 'active';

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NexusBrand label="Nexus Super Admin" markClassName="h-8 w-8 rounded-lg" textClassName="text-sm font-semibold" />
          </div>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <button
              onClick={() => router.push('/super-admin/tenants')}
              className="px-3 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
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

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/super-admin/tenants')}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tenants
          </button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setToggleOpen(true)}
              className={isActive ? 'text-danger-600 border-danger-200 hover:bg-danger-50' : ''}
            >
              <Power className="h-3.5 w-3.5 mr-1.5" />
              {isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </div>

        {/* Header card */}
        <Card className="flex items-start gap-4">
          {/* Color preview */}
          <div
            className="h-14 w-14 rounded-xl shrink-0 border border-neutral-200 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: tenant.primaryColor ?? '#16a34a' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={tenant.name} className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-white font-bold text-xl">{tenant.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-neutral-900">{tenant.name}</h1>
              <PlanBadge plan={tenant.plan} />
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${isActive ? 'text-primary-700' : 'text-neutral-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-primary-500' : 'bg-neutral-400'}`} />
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <code className="text-xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded mt-1 inline-block">{tenant.slug}</code>
            <p className="text-xs text-neutral-400 mt-0.5">
              Creado {new Date(tenant.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </Card>

        {/* Edit form */}
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
          {/* General */}
          <Card padding="md">
            <h2 className="text-sm font-semibold text-neutral-700 mb-4">Información general</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre de la empresa"
                error={errors.name?.message}
                {...register('name')}
              />
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
              <Input
                label="Dominio personalizado"
                placeholder="app.miempresa.com"
                error={errors.customDomain?.message}
                {...register('customDomain')}
              />
              <Input
                label="URL del logo"
                placeholder="https://..."
                error={errors.logoUrl?.message}
                {...register('logoUrl')}
              />
            </div>
          </Card>

          {/* Colors */}
          <Card padding="md">
            <h2 className="text-sm font-semibold text-neutral-700 mb-4">Apariencia</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Color primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor || '#16a34a'}
                    className="h-9 w-14 rounded border border-neutral-200 cursor-pointer p-0.5"
                    {...register('primaryColor')}
                  />
                  <Input
                    placeholder="#16a34a"
                    error={errors.primaryColor?.message}
                    {...register('primaryColor')}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Color secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor || '#15803d'}
                    className="h-9 w-14 rounded border border-neutral-200 cursor-pointer p-0.5"
                    {...register('secondaryColor')}
                  />
                  <Input
                    placeholder="#15803d"
                    error={errors.secondaryColor?.message}
                    {...register('secondaryColor')}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            {/* Color preview */}
            <div
              className="mt-4 rounded-lg h-10 flex items-center justify-center text-white text-sm font-semibold transition-colors"
              style={{ background: `linear-gradient(135deg, ${primaryColor || '#16a34a'}, ${secondaryColor || '#15803d'})` }}
            >
              Vista previa de colores
            </div>
          </Card>

          {/* SMTP — collapsible */}
          <Card padding="md">
            <button
              type="button"
              className="flex items-center justify-between w-full text-left"
              onClick={() => setSmtpOpen((v) => !v)}
            >
              <h2 className="text-sm font-semibold text-neutral-700">Configuración SMTP</h2>
              {smtpOpen
                ? <ChevronUp className="h-4 w-4 text-neutral-400" />
                : <ChevronDown className="h-4 w-4 text-neutral-400" />
              }
            </button>

            {smtpOpen && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Host"
                  placeholder="smtp.gmail.com"
                  {...register('smtpHost')}
                />
                <Input
                  label="Puerto"
                  type="number"
                  placeholder="587"
                  error={errors.smtpPort?.message}
                  {...register('smtpPort', { valueAsNumber: true })}
                />
                <Input
                  label="Usuario (email)"
                  type="email"
                  placeholder="correo@empresa.com"
                  error={errors.smtpUser?.message}
                  {...register('smtpUser')}
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="Dejar vacío para no cambiar"
                  {...register('smtpPassword')}
                />
                <Input
                  label="Nombre del remitente"
                  placeholder="Nexus Facturación"
                  {...register('smtpFromName')}
                />
                <Input
                  label="Email del remitente"
                  type="email"
                  placeholder="noreply@empresa.com"
                  error={errors.smtpFromEmail?.message}
                  {...register('smtpFromEmail')}
                />
              </div>
            )}
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            {saved && (
              <span className="self-center text-sm text-primary-600 font-medium">¡Guardado!</span>
            )}
            <Button
              type="submit"
              disabled={!isDirty && !updateMutation.isPending}
              loading={updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1.5" />
              Guardar cambios
            </Button>
          </div>
        </form>
      </main>

      {toggleOpen && (
        <ConfirmDialog
          open
          onClose={() => setToggleOpen(false)}
          onConfirm={() => toggleMutation.mutate()}
          title={isActive ? 'Desactivar tenant' : 'Activar tenant'}
          message={
            isActive
              ? `Al desactivar "${tenant.name}" sus usuarios no podrán iniciar sesión ni acceder al sistema.`
              : `Al activar "${tenant.name}" sus usuarios podrán volver a acceder al sistema.`
          }
          danger={isActive}
        />
      )}
    </div>
  );
}
