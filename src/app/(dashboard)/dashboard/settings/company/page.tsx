'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Info } from 'lucide-react';
import { catalogsService } from '@/services/catalogs.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CompanyForm {
  companyName:    string;
  companyNit:     string;
  companyAddress: string;
  companyPhone:   string;
  companyEmail:   string;
  companyWebsite: string;
  companyLogoUrl: string;
  legalFooter:    string;
  bankName:          string;
  bankAccountType:   string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  paymentEmail:      string;
  paymentPhone:      string;
  socialHandle:      string;
}

const EMPTY: CompanyForm = {
  companyName:    '',
  companyNit:     '',
  companyAddress: '',
  companyPhone:   '',
  companyEmail:   '',
  companyWebsite: '',
  companyLogoUrl: '',
  legalFooter:    '',
  bankName:          '',
  bankAccountType:   '',
  bankAccountNumber: '',
  bankAccountHolder: '',
  paymentEmail:      '',
  paymentPhone:      '',
  socialHandle:      '',
};

export default function CompanySettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm]   = useState<CompanyForm>(EMPTY);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn:  catalogsService.getSettings,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      companyName:    settings.companyName    ?? '',
      companyNit:     settings.companyNit     ?? '',
      companyAddress: settings.companyAddress ?? '',
      companyPhone:   settings.companyPhone   ?? '',
      companyEmail:   settings.companyEmail   ?? '',
      companyWebsite: settings.companyWebsite ?? '',
      companyLogoUrl: settings.companyLogoUrl ?? '',
      legalFooter:    settings.legalFooter    ?? '',
      bankName:          settings.bankName          ?? '',
      bankAccountType:   settings.bankAccountType   ?? '',
      bankAccountNumber: settings.bankAccountNumber ?? '',
      bankAccountHolder: settings.bankAccountHolder ?? '',
      paymentEmail:      settings.paymentEmail      ?? '',
      paymentPhone:      settings.paymentPhone      ?? '',
      socialHandle:      settings.socialHandle      ?? '',
    });
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => catalogsService.updateSettings(form),
    onSuccess: (updated) => {
      qc.setQueryData(['tenant-settings'], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const setField = (key: keyof CompanyForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Datos de la empresa</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Lo que dice la factura. El diseño solo decide cómo se ve.
          </p>
        </div>
        <Button
          loading={mutation.isPending || isLoading}
          onClick={() => mutation.mutate()}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? '¡Guardado!' : 'Guardar'}
        </Button>
      </div>

      <div className="flex items-start gap-2.5 p-3 bg-primary-50/60 border border-primary-100 rounded-lg">
        <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-600 leading-relaxed">
          Estos datos se imprimen en todas las facturas y son la única fuente de verdad: no se
          pueden cambiar desde el editor de diseño. Un cambio aquí se refleja también al reimprimir
          facturas antiguas.
        </p>
      </div>

      {mutation.isError && (
        <p className="text-xs text-danger-600">{errorMessage(mutation.error)}</p>
      )}

      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Identificación</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Razón social"
            placeholder="Electronuquí S.A. E.S.P."
            value={form.companyName}
            onChange={(e) => setField('companyName', e.target.value)}
          />
          <Input
            label="NIT"
            placeholder="900.123.456-7"
            value={form.companyNit}
            onChange={(e) => setField('companyNit', e.target.value)}
          />
        </div>
      </Card>

      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Dirección"
            placeholder="Calle 5 # 10-32, Nuquí"
            value={form.companyAddress}
            onChange={(e) => setField('companyAddress', e.target.value)}
          />
          <Input
            label="Teléfono"
            placeholder="(604) 123 4567"
            value={form.companyPhone}
            onChange={(e) => setField('companyPhone', e.target.value)}
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="contacto@empresa.com"
            value={form.companyEmail}
            onChange={(e) => setField('companyEmail', e.target.value)}
          />
          <Input
            label="Sitio web"
            placeholder="www.empresa.com"
            value={form.companyWebsite}
            onChange={(e) => setField('companyWebsite', e.target.value)}
          />
        </div>
      </Card>

      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Datos para el pago</CardTitle>
        </CardHeader>
        <p className="text-xs text-neutral-500 -mt-2 mb-4">
          Se imprimen en el recuadro «Realiza el pago» de la factura. Si dejas la cuenta vacía,
          ese recuadro no aparece.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Banco"
            placeholder="Bancolombia"
            value={form.bankName}
            onChange={(e) => setField('bankName', e.target.value)}
          />
          <Input
            label="Tipo de cuenta"
            placeholder="Cuenta corriente"
            value={form.bankAccountType}
            onChange={(e) => setField('bankAccountType', e.target.value)}
          />
          <Input
            label="Número de cuenta"
            placeholder="53686114970"
            value={form.bankAccountNumber}
            onChange={(e) => setField('bankAccountNumber', e.target.value)}
          />
          <Input
            label="Titular de la cuenta"
            placeholder="Electro Nuquí ESP"
            value={form.bankAccountHolder}
            onChange={(e) => setField('bankAccountHolder', e.target.value)}
          />
          <Input
            label="Correo para comprobantes"
            type="email"
            placeholder="facturacion@empresa.com"
            value={form.paymentEmail}
            onChange={(e) => setField('paymentEmail', e.target.value)}
          />
          <Input
            label="Teléfono / WhatsApp de pagos"
            placeholder="+57 316 010 4010"
            value={form.paymentPhone}
            onChange={(e) => setField('paymentPhone', e.target.value)}
          />
          <Input
            label="Redes sociales"
            placeholder="@empresa"
            hint="Aparece en el pie de la factura"
            value={form.socialHandle}
            onChange={(e) => setField('socialHandle', e.target.value)}
          />
        </div>
      </Card>

      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Marca y pie legal</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="URL del logo"
            placeholder="https://…/logo.png"
            hint="Se imprime en la cabecera de la factura"
            value={form.companyLogoUrl}
            onChange={(e) => setField('companyLogoUrl', e.target.value)}
          />
          {form.companyLogoUrl && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <span className="text-xs text-neutral-500 shrink-0">Vista previa:</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.companyLogoUrl}
                alt="Logo de la empresa"
                className="max-h-12 max-w-[160px] object-contain"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Texto legal al pie
            </label>
            <textarea
              value={form.legalFooter}
              onChange={(e) => setField('legalFooter', e.target.value)}
              rows={3}
              placeholder="Mensaje fijo que aparece al final de cada factura"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function errorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? 'Ocurrió un error inesperado';
}
