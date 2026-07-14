'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAuthStore } from '@/store/auth.store';

const pageTitles: Record<string, string> = {
  '/dashboard':                                  'Dashboard',
  '/dashboard/clients':                          'Clientes',
  '/dashboard/readings':                         'Lecturas',
  '/dashboard/readings/new':                     'Nuevo lote de lectura',
  '/dashboard/billing':                          'Facturación',
  '/dashboard/payments':                         'Cobros',
  '/dashboard/payments/new':                     'Registrar cobro',
  '/dashboard/financing':                        'Financiación',
  '/dashboard/financing/new':                    'Nuevo plan de financiación',
  '/dashboard/budget':                           'Presupuesto',
  '/dashboard/budget/new':                       'Nueva vigencia presupuestal',
  '/dashboard/budget/catalogs':                  'Catálogos de presupuesto',
  '/dashboard/pqr':                              'PQR / Solicitudes',
  '/dashboard/reports':                          'Reportes',
  '/dashboard/catalogs':                         'Catálogos',
  '/dashboard/settings':                         'Configuración',
  '/dashboard/settings/invoice-template':        'Plantilla de factura',
  '/dashboard/settings/billing':                 'Configuración de facturación',
  '/dashboard/settings/api-keys':               'API Keys',
  '/dashboard/users':                           'Usuarios y roles',
  '/dashboard/clients/import':                  'Importar clientes',
};

function getTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Prefix match for nested routes
  const prefix = Object.keys(pageTitles)
    .filter((k) => k !== '/dashboard' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? pageTitles[prefix] : 'Nexus';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted]         = useState(false);
  const router    = useRouter();
  const pathname  = usePathname();
  const isAuth    = useAuthStore((s) => s.isAuth);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuth) router.replace('/login');
  }, [mounted, isAuth, router]);

  // Mientras hidrata, no renderizar nada (evita flash de redirect)
  if (!mounted) return null;
  if (!isAuth) return null;

  return (
    <div className="flex h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 lg:ml-0">
        <Header
          title={getTitle(pathname)}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto p-6 lg:p-8 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
