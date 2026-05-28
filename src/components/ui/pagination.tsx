import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page:     number;
  lastPage: number;
  total:    number;
  limit:    number;
  onChange: (page: number) => void;
}

export function Pagination({ page, lastPage, total, limit, onChange }: PaginationProps) {
  if (lastPage <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages: (number | '...')[] = [];
  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3)          pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(lastPage - 1, page + 1); i++) pages.push(i);
    if (page < lastPage - 2) pages.push('...');
    pages.push(lastPage);
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <p className="text-xs text-neutral-500">
        {from}–{to} de {total} registros
      </p>
      <div className="flex items-center gap-1">
        <PagBtn onClick={() => onChange(page - 1)} disabled={page === 1}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </PagBtn>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-xs text-neutral-400">…</span>
          ) : (
            <PagBtn
              key={p}
              onClick={() => onChange(p as number)}
              active={p === page}
            >
              {p}
            </PagBtn>
          ),
        )}
        <PagBtn onClick={() => onChange(page + 1)} disabled={page === lastPage}>
          <ChevronRight className="h-3.5 w-3.5" />
        </PagBtn>
      </div>
    </div>
  );
}

function PagBtn({
  children, onClick, disabled, active,
}: {
  children: React.ReactNode;
  onClick:  () => void;
  disabled?: boolean;
  active?:   boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-7 min-w-7 px-2 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-primary-600 text-white'
          : 'text-neutral-600 hover:bg-neutral-100',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}
