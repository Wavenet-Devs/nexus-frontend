import axios from 'axios';
import { BASE_URL } from '@/lib/api';

/** Metadata pública del tenant (GET /public/tenant/resolve). Nunca trae secretos. */
export interface PublicTenant {
  slug:           string;
  name:           string;
  logoUrl:        string | null;
  primaryColor:   string | null;
  secondaryColor: string | null;
  status:         string;
}

/**
 * Cómo se identificó la empresa en esta dirección:
 *   host            spone.nexus-esp.com o un custom domain → tenant resuelto por el backend
 *   inactive        el hostname corresponde a un tenant desactivado
 *   not-configured  ningún tenant usa este hostname
 *   dev             localhost con NEXT_PUBLIC_DEV_TENANT_SLUG (configuración explícita)
 *   manual          localhost sin configuración: se pide el slug (solo desarrollo)
 */
export type TenantResolution =
  | { mode: 'host'; tenant: PublicTenant }
  | { mode: 'inactive'; tenant: PublicTenant }
  | { mode: 'not-configured'; host: string }
  | { mode: 'dev'; slug: string }
  | { mode: 'manual' };

/** localhost, *.localhost o una IP: entornos de desarrollo sin subdominio de tenant. */
export function isDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost') || /^[\d.]+$/.test(hostname) || hostname.includes(':');
}

export async function resolveTenant(): Promise<TenantResolution> {
  const { hostname, host } = window.location;

  if (isDevHost(hostname)) {
    const devSlug = process.env.NEXT_PUBLIC_DEV_TENANT_SLUG?.trim();
    return devSlug ? { mode: 'dev', slug: devSlug } : { mode: 'manual' };
  }

  try {
    // Sin el interceptor de `api`: esta consulta no debe llevar un X-Tenant-Slug
    // guardado de antes, el hostname es la única fuente.
    const { data } = await axios.get<PublicTenant>(`${BASE_URL}/public/tenant/resolve`, {
      params: { host },
    });
    return data.status === 'active' ? { mode: 'host', tenant: data } : { mode: 'inactive', tenant: data };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return { mode: 'not-configured', host: hostname };
    }
    throw err;
  }
}

/** Slug con el que operar según la resolución (null si no se puede iniciar sesión). */
export function resolvedSlug(r: TenantResolution | undefined): string | null {
  if (!r) return null;
  if (r.mode === 'host') return r.tenant.slug;
  if (r.mode === 'dev') return r.slug;
  return null;
}

/** Nombre visible de la empresa (el slug en desarrollo). */
export function resolvedName(r: TenantResolution | undefined): string | null {
  if (!r) return null;
  if (r.mode === 'host' || r.mode === 'inactive') return r.tenant.name;
  if (r.mode === 'dev') return r.slug;
  return null;
}
