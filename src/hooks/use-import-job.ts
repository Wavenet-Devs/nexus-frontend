import { useQuery } from '@tanstack/react-query';
import { importsService, isImportActive } from '@/services/imports.service';

/** Sigue una importación hasta que termina (consulta cada 1,5 s mientras está activa). */
export function useImportJob(jobId: string | null) {
  return useQuery({
    queryKey: ['import-job', jobId],
    queryFn:  () => importsService.get(jobId!),
    enabled:  !!jobId,
    refetchInterval: (query) => (isImportActive(query.state.data) || !query.state.data ? 1500 : false),
  });
}
