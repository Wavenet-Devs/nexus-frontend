'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LoginResponse } from '@/types';

const schema = z.object({
  tenantSlug: z.string().min(1, 'Ingresa el identificador de tu empresa'),
  email:      z.string().email('Email inválido'),
  password:   z.string().min(1, 'Contraseña requerida'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router   = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const res = await api.post<LoginResponse>(
        '/auth/login',
        { email: data.email, password: data.password },
        { headers: { 'X-Tenant-Slug': data.tenantSlug } },
      );
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Credenciales incorrectas';
      setError('root', { message: msg });
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-neutral-900 tracking-tight">Nexus</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-neutral-900">Iniciar sesión</h1>
          <p className="text-sm text-neutral-500 mt-1">Ingresa a tu cuenta de facturación</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Empresa (slug)"
            placeholder="ej: electronuqui"
            error={errors.tenantSlug?.message}
            {...register('tenantSlug')}
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="admin@empresa.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
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
      </div>

      <p className="text-center text-xs text-neutral-400 mt-6">
        Nexus &copy; {new Date().getFullYear()} — Plataforma SaaS de facturación
      </p>
    </div>
  );
}
