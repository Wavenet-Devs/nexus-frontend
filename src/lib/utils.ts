import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, currency = 'COP'): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CO').format(n);
}

export function formatDate(date: string | Date): string {
  // Los campos SQL DATE pueden serializarse como YYYY-MM-DD o como
  // YYYY-MM-DDT00:00:00.000Z. En ambos casos representan una fecha de
  // calendario, no un instante; usar new Date() en Colombia los mueve al día
  // anterior. Conservamos directamente año/mes/día.
  if (typeof date === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(date);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatMonth(month: number, year: number): string {
  return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    paid:      'bg-primary-50 text-primary-700 border-primary-200',
    unpaid:    'bg-danger-50 text-danger-600 border-red-200',
    partial:   'bg-warning-50 text-warning-500 border-yellow-200',
    active:    'bg-primary-50 text-primary-700 border-primary-200',
    inactive:  'bg-neutral-100 text-neutral-500 border-neutral-200',
    pending:   'bg-warning-50 text-warning-500 border-yellow-200',
    approved:  'bg-primary-50 text-primary-700 border-primary-200',
    finished:  'bg-info-50 text-info-600 border-blue-200',
    cancelled: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  };
  return map[status] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    paid:      'Pagado',
    unpaid:    'Sin pagar',
    partial:   'Parcial',
    active:    'Activo',
    inactive:  'Inactivo',
    pending:   'Pendiente',
    approved:  'Aprobado',
    finished:  'Finalizado',
    cancelled: 'Cancelado',
    cash:      'Efectivo',
    transfer:  'Transferencia',
    card:      'Tarjeta',
  };
  return map[status] ?? status;
}
