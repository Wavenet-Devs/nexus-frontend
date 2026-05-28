'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { saApi } from '@/lib/super-admin-api';
import { useSAAuthStore } from '@/store/super-admin-auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SA_TENANT_SLUG = process.env.NEXT_PUBLIC_SA_TENANT_SLUG ?? 'super-admin';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Requerida'),
});

type FormData = z.infer<typeof schema>;

export default function SuperAdminLoginPage() {
  const setAuth   = useSAAuthStore((s) => s.setAuth);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await saApi.post('/auth/login', data, {
        headers: { 'X-Tenant-Slug': SA_TENANT_SLUG },
      });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
    } catch {
      setError('password', { message: 'Credenciales incorrectas' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Nexus Super Admin</h1>
          <p className="text-sm text-neutral-400 mt-1">Panel de gestión de tenants</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="admin@nexus.app"
              error={errors.email?.message}
              className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
              {...register('email')}
            />
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPw ? 'text' : 'password'}
                error={errors.password?.message}
                className="bg-neutral-800 border-neutral-700 text-white"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-8 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full mt-2" loading={isSubmitting}>
              Iniciar sesión
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-600 mt-6">
          Nexus · Panel de administración
        </p>
      </div>
    </div>
  );
}
