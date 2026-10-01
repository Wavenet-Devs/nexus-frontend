import { cn } from '@/lib/utils';

export function NexusMark({
  className,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    // Exact Nexus droplet used by the public Nexus ESP website.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/nexus-mark.png"
      alt=""
      aria-hidden="true"
      className={cn('object-contain', className ?? 'h-9 w-auto')}
    />
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
      <NexusMark className={markClassName ?? 'h-9 w-auto'} />
      <span className={cn('font-bold tracking-tight text-neutral-900', textClassName)}>
        {label}
      </span>
    </span>
  );
}
