import { cn } from '@/lib/utils';
import type { ReadingBatchStatus } from '@/services/readings.service';

export const BATCH_STATUS_LABEL: Record<ReadingBatchStatus, string> = {
  DRAFT:         'Borrador',
  COLLECTING:    'En captura',
  READY_TO_BILL: 'Listo para facturar',
  BILLED:        'Facturado',
  CLOSED:        'Cerrado',
};

const COLOR: Record<ReadingBatchStatus, string> = {
  DRAFT:         'bg-neutral-100 text-neutral-600 border-neutral-200',
  COLLECTING:    'bg-blue-50 text-blue-700 border-blue-200',
  READY_TO_BILL: 'bg-amber-50 text-amber-700 border-amber-200',
  BILLED:        'bg-green-50 text-green-700 border-green-200',
  CLOSED:        'bg-neutral-800 text-white border-neutral-800',
};

/** Qué hace cada acción de cambio de estado, visto desde el estado actual. */
export const TRANSITION_ACTION: Partial<Record<ReadingBatchStatus, Partial<Record<ReadingBatchStatus, string>>>> = {
  DRAFT:         { COLLECTING: 'Abrir captura' },
  COLLECTING:    { READY_TO_BILL: 'Cerrar captura', DRAFT: 'Volver a borrador' },
  READY_TO_BILL: { COLLECTING: 'Reabrir captura' },
  BILLED:        { CLOSED: 'Cerrar período' },
  CLOSED:        { BILLED: 'Reabrir período' },
};

/** Transiciones que devuelven el lote a una etapa anterior: exigen motivo. */
export function isReopen(from: ReadingBatchStatus, to: ReadingBatchStatus) {
  return (from === 'READY_TO_BILL' && to === 'COLLECTING') || (from === 'CLOSED' && to === 'BILLED');
}

export function BatchStatusBadge({ status, className }: { status: ReadingBatchStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        COLOR[status] ?? COLOR.DRAFT,
        className,
      )}
    >
      {BATCH_STATUS_LABEL[status] ?? status}
    </span>
  );
}
