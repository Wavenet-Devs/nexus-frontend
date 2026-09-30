'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TenantGate } from '@/components/auth/tenant-gate';
import { resolvedName, resolvedSlug, type TenantResolution } from '@/lib/tenant';
import type { LoginResponse } from '@/types';

const schema = z.object({
  // Solo se pide en desarrollo (localhost sin NEXT_PUBLIC_DEV_TENANT_SLUG)
  tenantSlug: z.string().optional(),
  email:      z.string().email('Email inválido'),
  password:   z.string().min(1, 'Contraseña requerida'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  return <TenantGate>{(tenant) => <LoginForm tenant={tenant} />}</TenantGate>;
}

function LoginForm({ tenant }: { tenant: TenantResolution }) {
  const router   = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const manual   = tenant.mode === 'manual';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const slug = manual ? data.tenantSlug?.trim().toLowerCase() : resolvedSlug(tenant);
    if (!slug) {
      setError('tenantSlug', { message: 'Ingresa el identificador de tu empresa' });
      return;
    }
    try {
      // En producción el backend identifica la empresa por el hostname; el
      // header coincide con él y sirve para desarrollo.
      const res = await api.post<LoginResponse>(
        '/auth/login',
        { email: data.email, password: data.password },
        { headers: { 'X-Tenant-Slug': slug } },
      );
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken, resolvedName(tenant));
      router.replace('/dashboard');
    } catch (err) {
      const body = (err as { response?: { data?: { message?: string | string[]; code?: string } } })?.response?.data;
      const msg = body?.code === 'TENANT_NOT_CONFIGURED'
        ? 'No encontramos esa empresa'
        : Array.isArray(body?.message) ? body.message.join('. ') : body?.message ?? 'Credenciales incorrectas';
      setError('root', { message: msg });
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">Iniciar sesión</h1>
        <p className="text-sm text-neutral-500 mt-1">Ingresa a tu cuenta de facturación</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {manual && (
          <Input
            label="Empresa (slug) — solo desarrollo"
            placeholder="ej: electronuqui"
            error={errors.tenantSlug?.message}
            {...register('tenantSlug')}
          />
        )}
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="admin@empresa.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {errors.root && (
          <p className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} size="lg" className="mt-2 w-full">
          Ingresar
        </Button>

        <button
          type="button"
          onClick={() => router.push('/forgot-password')}
          className="text-xs text-neutral-500 hover:text-primary-600 transition-colors mt-1"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </>
  );
}
