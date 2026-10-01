import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NexusMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-primary-600 shadow-sm',
        className,
      )}
      aria-hidden="true"
    >
      <Zap className={cn('text-white', iconClassName)} strokeWidth={2.4} />
    </span>
  );
}

export function NexusBrand({
  className,
  markClassName,
  textClassName,
  label = 'Nexus',
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  label?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <NexusMark className={markClassName ?? 'h-9 w-9'} iconClassName="h-5 w-5" />
      <span className={cn('font-bold tracking-tight text-neutral-900', textClassName)}>
        {label}
      </span>
    </span>
  );
}
