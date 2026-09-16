'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Camera, ShieldCheck, KeyRound } from 'lucide-react';
import { usersService } from '@/services/users.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm]   = useState({ name: '', email: '' });

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn:  usersService.getProfile,
  });

  useEffect(() => {
    if (perfil) setForm({ name: perfil.name ?? '', email: perfil.email ?? '' });
  }, [perfil]);

  const guardar = useMutation({
    mutationFn: () => usersService.updateProfile(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const subirFoto = useMutation({
    mutationFn: (file: File) => usersService.uploadPicture(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-profile'] });
      if (fileRef.current) fileRef.current.value = '';
    },
  });

  const error = guardar.error ?? subirFoto.error;

  const iniciales = (perfil?.name ?? '?')
    .split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Mi perfil</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Tus datos y tu foto. El rol y los permisos los define un administrador.
          </p>
        </div>
        <Button
          loading={guardar.isPending || isLoading}
          onClick={() => guardar.mutate()}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? '¡Guardado!' : 'Guardar'}
        </Button>
      </div>

      {error != null && (
        <p className="text-xs text-danger-600">
          {(() => {
            const msg = (error as { response?: { data?: { message?: string | string[] } } })
              ?.response?.data?.message;
            return Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo guardar';
          })()}
        </p>
      )}

      <Card padding="md">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {perfil?.picture ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={perfil.picture}
                alt={perfil.name}
                className="h-20 w-20 rounded-full object-cover border border-neutral-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-semibold">
                {iniciales}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-primary-600 hover:border-primary-300 transition-colors shadow-sm"
              title="Cambiar foto"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) subirFoto.mutate(f);
              }}
            />
          </div>

          <div className="min-w-0">
            <p className="text-base font-semibold text-neutral-900 truncate">
              {perfil?.name ?? '—'}
            </p>
            <p className="text-sm text-neutral-500 truncate">{perfil?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {perfil?.role_name && (
                <Badge>
                  <ShieldCheck className="h-3 w-3 mr-1 inline" />
                  {perfil.role_name}
                </Badge>
              )}
              <Badge variant={perfil?.status === 'active' ? 'default' : 'ghost'}>
                {perfil?.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              {subirFoto.isPending ? 'Subiendo foto…' : 'JPG, PNG o WEBP · máximo 1 MB'}
            </p>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Correo electrónico"
            type="email"
            hint="Es el correo con el que ingresas"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </Card>

      <Card padding="md">
        <CardHeader className="pb-2">
          <CardTitle>Contraseña</CardTitle>
        </CardHeader>
        <p className="text-sm text-neutral-500 mb-4">
          Se cambia desde la administración de usuarios, donde también puedes ver el resto del
          equipo.
        </p>
        <Button variant="outline" onClick={() => window.location.assign('/dashboard/users')}>
          <KeyRound className="h-3.5 w-3.5 mr-1" />
          Cambiar mi contraseña
        </Button>
      </Card>
    </div>
  );
}
