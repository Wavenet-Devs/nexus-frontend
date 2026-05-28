import { cn } from '@/lib/utils';

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  padding?:   'sm' | 'md' | 'lg' | 'none';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-neutral-200 shadow-sm',
        padding === 'sm'   && 'p-4',
        padding === 'md'   && 'p-6',
        padding === 'lg'   && 'p-8',
        padding === 'none' && '',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-5', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-semibold text-neutral-800', className)}>{children}</h3>;
}
