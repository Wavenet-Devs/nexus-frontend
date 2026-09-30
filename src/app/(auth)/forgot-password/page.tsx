'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TenantGate } from '@/components/auth/tenant-gate';
import { resolvedSlug, type TenantResolution } from '@/lib/tenant';

const schema = z.object({
  // Solo se pide en desarrollo (localhost sin NEXT_PUBLIC_DEV_TENANT_SLUG)
  tenantSlug: z.string().optional(),
  email:      z.string().email('Correo inválido'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  return <TenantGate>{(tenant) => <ForgotPasswordForm tenant={tenant} />}</TenantGate>;
}

function ForgotPasswordForm({ tenant }: { tenant: TenantResolution }) {
  const router = useRouter();
  const manual = tenant.mode === 'manual';
  const [enviado, setEnviado] = useState(false);

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
      await api.post(
        '/auth/forgot-password',
        { email: data.email },
        { headers: { 'X-Tenant-Slug': slug } },
      );
      // La respuesta es la misma exista o no la cuenta: no revelamos quién
      // está registrado, así que siempre se muestra el mismo mensaje.
      setEnviado(true);
    } catch {
      setError('root', {
        message: 'No pudimos procesar la solicitud. Intenta de nuevo en unos minutos.',
      });
    }
  }

  return (
    <>
        {enviado ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <MailCheck className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-lg font-semibold text-neutral-900">Revisa tu correo</h1>
            <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
              Si el correo corresponde a un usuario activo, le llegará un enlace para elegir
              una contraseña nueva. El enlace vence en 30 minutos.
            </p>
            <Button
              variant="outline"
              className="mt-6 w-full"
              onClick={() => router.push('/login')}
            >
              Volver al ingreso
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-lg font-semibold text-neutral-900">Recuperar contraseña</h1>
              <p className="text-sm text-neutral-500 mt-1">
                Te enviaremos un enlace para elegir una nueva.
              </p>
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
                placeholder="tu@empresa.com"
                error={errors.email?.message}
                {...register('email')}
              />

              {errors.root && (
                <p className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">
                  {errors.root.message}
                </p>
              )}

              <Button type="submit" loading={isSubmitting} size="lg" className="mt-2 w-full">
                Enviar enlace
              </Button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-primary-600 transition-colors mt-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Volver al ingreso
              </button>
            </form>
          </>
        )}
    </>
  );
}
