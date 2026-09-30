import { useQuery } from '@tanstack/react-query';
import { resolveTenant } from '@/lib/tenant';

/** Empresa de esta dirección, resuelta una sola vez por carga de la app. */
export function useTenant() {
  return useQuery({
    queryKey:  ['tenant-resolution'],
    queryFn:   resolveTenant,
    staleTime: Infinity,
    gcTime:    Infinity,
    retry:     1,
  });
}
