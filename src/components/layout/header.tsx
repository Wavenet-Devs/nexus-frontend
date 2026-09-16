'use client';

import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/store/auth.store';

interface HeaderProps {
  title:       string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const user   = useAuthStore((s) => s.user);
  const router = useRouter();

  // La foto vive en el perfil, no en el token: se lee aparte.
  const { data: perfil } = useQuery({
    queryKey: ['my-profile'],
    queryFn:  usersService.getProfile,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-neutral-200 bg-white px-6 lg:px-8 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      <h1 className="text-lg font-semibold text-neutral-900 flex-1">{title}</h1>

      <button
        onClick={() => router.push('/dashboard/profile')}
        className="flex items-center gap-3 rounded-xl px-2 py-1 -mr-2 hover:bg-neutral-100 transition-colors"
        title="Mi perfil"
      >
        {perfil?.picture ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={perfil.picture}
            alt={perfil.name}
            className="h-9 w-9 rounded-full object-cover border border-neutral-200"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-bold uppercase">
            {user?.name?.[0] ?? '?'}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-neutral-800 leading-tight">{user?.name}</p>
          <p className="text-xs text-neutral-500 capitalize">{user?.roleSlug}</p>
        </div>
      </button>
    </header>
  );
}
