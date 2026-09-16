'use client';

import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm:     z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path:    ['confirm'],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get('token') ?? '';
  const slug   = params.get('slug')  ?? '';

  // 'checking' evita pedir la contraseña para luego decir que el enlace no vale.
  const [estado, setEstado] = useState<'checking' | 'valid' | 'invalid' | 'done'>('checking');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token || !slug) { setEstado('invalid'); return; }
    let cancelado = false;
    void (async () => {
      try {
        const res = await api.get<{ valid: boolean }>('/auth/reset-password/check', {
          params:  { token },
          headers: { 'X-Tenant-Slug': slug },
        });
        if (!cancelado) setEstado(res.data.valid ? 'valid' : 'invalid');
      } catch {
        if (!cancelado) setEstado('invalid');
      }
    })();
    return () => { cancelado = true; };
  }, [token, slug]);

  async function onSubmit(data: FormData) {
    try {
      await api.post(
        '/auth/reset-password',
        { token, newPassword: data.newPassword },
        { headers: { 'X-Tenant-Slug': slug } },
      );
      setEstado('done');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setError('root', {
        message: Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo cambiar la contraseña',
      });
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="p-2 rounded-xl bg-primary-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-neutral-900 tracking-tight">Nexus</span>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
        {estado === 'checking' && (
          <p className="text-sm text-neutral-500 text-center py-6">Comprobando el enlace…</p>
        )}

        {estado === 'invalid' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <h1 className="text-lg font-semibold text-neutral-900">Enlace no válido</h1>
            <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
              Este enlace ya se usó o venció. Pide uno nuevo desde la pantalla de ingreso.
            </p>
            <Button className="mt-6 w-full" onClick={() => router.push('/forgot-password')}>
              Pedir un enlace nuevo
            </Button>
          </div>
        )}

        {estado === 'done' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-lg font-semibold text-neutral-900">Contraseña actualizada</h1>
            <p className="text-sm text-neutral-500 mt-2">Ya puedes ingresar con la nueva.</p>
            <Button className="mt-6 w-full" onClick={() => router.push('/login')}>
              Ir al ingreso
            </Button>
          </div>
        )}

        {estado === 'valid' && (
          <>
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-neutral-900">Elige tu contraseña</h1>
              <p className="text-sm text-neutral-500 mt-1">Debe tener al menos 8 caracteres.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Contraseña nueva"
                type="password"
                placeholder="••••••••"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <Input
                label="Repite la contraseña"
                type="password"
                placeholder="••••••••"
                error={errors.confirm?.message}
                {...register('confirm')}
              />

              {errors.root && (
                <p className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">
                  {errors.root.message}
                </p>
              )}

              <Button type="submit" loading={isSubmitting} size="lg" className="mt-2 w-full">
                Guardar contraseña
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Cargando…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
