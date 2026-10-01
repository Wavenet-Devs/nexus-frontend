'use client';

import type { CSSProperties, ReactNode } from 'react';
import { AlertTriangle, Building2, Loader2, WifiOff } from 'lucide-react';
import { useTenant } from '@/hooks/use-tenant';
import { Button } from '@/components/ui/button';
import type { TenantResolution } from '@/lib/tenant';
import { NexusBrand } from '@/components/brand/nexus-logo';

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Pantallas públicas del tenant (login, recuperar contraseña): resuelve la
 * empresa por el hostname, muestra su marca y cubre los estados cargando /
 * no configurada / inactiva / sin conexión. `children` recibe la resolución
 * cuando se puede continuar (host, dev o manual).
 */
export function TenantGate({ children }: { children: (r: TenantResolution) => ReactNode }) {
  const { data, isLoading, isError, refetch } = useTenant();

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-6 text-neutral-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Cargando empresa…</p>
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <Notice
          icon={<WifiOff className="h-6 w-6 text-amber-600" />}
          title="No pudimos conectar con el servidor"
          message="Revisa tu conexión e intenta de nuevo."
          action={<Button variant="outline" className="mt-6 w-full" onClick={() => refetch()}>Reintentar</Button>}
        />
      </Shell>
    );
  }

  if (data.mode === 'not-configured') {
    return (
      <Shell>
        <Notice
          icon={<Building2 className="h-6 w-6 text-neutral-500" />}
          title="Empresa no configurada"
          message={`No hay una empresa configurada para ${data.host}. Verifica la dirección de acceso o contacta a soporte.`}
        />
      </Shell>
    );
  }

  if (data.mode === 'inactive') {
    return (
      <Shell tenant={data.tenant}>
        <Notice
          icon={<AlertTriangle className="h-6 w-6 text-amber-600" />}
          title="Empresa inactiva"
          message={`El acceso de ${data.tenant.name} está suspendido temporalmente. Contacta a soporte.`}
        />
      </Shell>
    );
  }

  return <Shell tenant={data.mode === 'host' ? data.tenant : undefined} devSlug={data.mode === 'dev' ? data.slug : undefined}>{children(data)}</Shell>;
}

/** Marca de la empresa y colores aplicados solo a esta pantalla. */
function Shell({
  tenant, devSlug, children,
}: {
  tenant?: { name: string; logoUrl: string | null; primaryColor: string | null };
  devSlug?: string;
  children: ReactNode;
}) {
  const color = tenant?.primaryColor && HEX.test(tenant.primaryColor) ? tenant.primaryColor : null;
  // Las utilidades bg-primary-* leen estas variables: la marca aplica a botones y enlaces.
  const style = color
    ? ({ '--color-primary-500': color, '--color-primary-600': color, '--color-primary-700': color } as CSSProperties)
    : undefined;

  return (
    <div className="w-full max-w-sm" style={style}>
      <div className="flex flex-col items-center gap-2 mb-8">
        {tenant?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logoUrl} alt={tenant.name} className="h-14 max-w-[220px] object-contain" />
        ) : (
          <NexusBrand textClassName="text-xl" />
        )}
        {tenant && <p className="text-sm font-medium text-neutral-600 text-center">{tenant.name}</p>}
        {devSlug && <p className="text-xs text-neutral-400">Desarrollo · {devSlug}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">{children}</div>

      <p className="text-center text-xs text-neutral-400 mt-6">
        Nexus &copy; {new Date().getFullYear()} — Plataforma SaaS de facturación
      </p>
    </div>
  );
}

function Notice({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100 mb-4">{icon}</div>
      <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{message}</p>
      {action}
    </div>
  );
}
