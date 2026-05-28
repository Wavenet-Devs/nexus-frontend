import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?:     LucideIcon;
  title:     string;
  message?:  string;
  action?:   React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-3', className)}>
      {Icon && <Icon className="h-10 w-10 text-neutral-300" />}
      <p className="text-sm font-medium text-neutral-600">{title}</p>
      {message && <p className="text-xs text-neutral-400 text-center max-w-xs">{message}</p>}
      {action}
    </div>
  );
}
