import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        getStatusColor(status),
        className,
      )}
    >
      {label ?? getStatusLabel(status)}
    </span>
  );
}

interface SimpleBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: SimpleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-primary-50 text-primary-700',
        variant === 'outline' && 'border border-neutral-200 text-neutral-600',
        variant === 'ghost'   && 'bg-neutral-100 text-neutral-600',
        className,
      )}
    >
      {children}
    </span>
  );
}
