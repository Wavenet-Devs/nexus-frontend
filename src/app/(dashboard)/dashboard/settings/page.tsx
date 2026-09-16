'use client';

import { useRouter } from 'next/navigation';
import { FileText, Sliders, ChevronRight, Key, Building2, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

const SETTINGS_SECTIONS = [
  {
    href:  '/dashboard/settings/company',
    icon:  Building2,
    title: 'Datos de la empresa',
    desc:  'Razón social, NIT, contacto y logo. Es lo que dice la factura.',
  },
  {
    href:  '/dashboard/settings/invoice-template',
    icon:  FileText,
    title: 'Diseño de factura',
    desc:  'Versiones del diseño, borradores, vista previa y publicación.',
  },
  {
    href:  '/dashboard/settings/invoice-banner',
    icon:  ImageIcon,
    title: 'Publicidad en la factura',
    desc:  'Pieza del bloque «Infórmate con…». Cambia cada mes y queda fija en las facturas de ese período.',
  },
  {
    href:  '/dashboard/settings/billing',
    icon:  Sliders,
    title: 'Configuración de facturación',
    desc:  'Umbrales de consumo, prefijo de factura, tasa de interés y moneda.',
  },
  {
    href:  '/dashboard/settings/api-keys',
    icon:  Key,
    title: 'API Keys',
    desc:  'Gestiona las claves de integración para la app móvil y sistemas externos.',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      {SETTINGS_SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.href}
            onClick={() => router.push(s.href)}
            className="w-full text-left"
          >
            <Card padding="md" className="hover:border-primary-200 hover:bg-primary-50/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary-100 text-primary-700 shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{s.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
