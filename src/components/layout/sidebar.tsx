'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, CreditCard, BarChart2,
  Settings, LogOut, Zap, BookOpen, Gauge, Banknote, Wallet, MessageSquare, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Clientes',     href: '/dashboard/clients',  icon: Users           },
  { label: 'Lecturas',     href: '/dashboard/readings', icon: Gauge           },
  { label: 'Facturación',  href: '/dashboard/billing',  icon: FileText        },
  { label: 'Cobros',       href: '/dashboard/payments', icon: CreditCard      },
  { label: 'Financiación', href: '/dashboard/financing',icon: Banknote        },
  { label: 'Presupuesto',  href: '/dashboard/budget',   icon: Wallet          },
  { label: 'PQR',          href: '/dashboard/pqr',      icon: MessageSquare   },
  { label: 'Reportes',     href: '/dashboard/reports',  icon: BarChart2       },
  { label: 'Catálogos',    href: '/dashboard/catalogs', icon: BookOpen        },
  { label: 'Usuarios',     href: '/dashboard/users',    icon: Users           },
  { label: 'Configuración',href: '/dashboard/settings', icon: Settings        },
];

interface SidebarProps {
  open:    boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, tenantSlug, clearAuth } = useAuthStore();

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-68 flex-col bg-white border-r border-neutral-200',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto lg:w-68',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ width: '272px', minWidth: '272px' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-neutral-100 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-neutral-900 text-base tracking-tight">Nexus</span>
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tenant badge */}
        {tenantSlug && (
          <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-0.5">Empresa</p>
            <p className="text-sm font-semibold text-neutral-700 truncate">{tenantSlug}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    )}
                  >
                    <item.icon className={cn('h-5 w-5 shrink-0', active ? 'text-white' : 'text-neutral-400')} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-100 p-4 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-bold uppercase">
              {user?.name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-800 truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate capitalize">{user?.roleSlug}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
