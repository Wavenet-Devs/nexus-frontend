'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { catalogsService } from '@/services/catalogs.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SettingsForm {
  basicThresholdKwh:         string;
  complementaryThresholdKwh: string;
  interestRatePercent:       string;
  invoicePrefix:             string;
  currency:                  string;
}

export default function BillingSettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    basicThresholdKwh:         '130',
    complementaryThresholdKwh: '260',
    interestRatePercent:       '0',
    invoicePrefix:             'FAC',
    currency:                  'COP',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn:  catalogsService.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        basicThresholdKwh:         String(settings.basicThresholdKwh         ?? 130),
        complementaryThresholdKwh: String(settings.complementaryThresholdKwh ?? 260),
        interestRatePercent:       String(settings.interestRatePercent        ?? 0),
        invoicePrefix:             settings.invoicePrefix                     ?? 'FAC',
        currency:                  settings.currency                          ?? 'COP',
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (dto: any) => catalogsService.updateSettings(dto),
    onSuccess: (updated) => {
      qc.setQueryData(['tenant-settings'], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const setField = (key: keyof SettingsForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () =>
    mutation.mutate({
      basicThresholdKwh:         Number(form.basicThresholdKwh),
      complementaryThresholdKwh: Number(form.complementaryThresholdKwh),
      interestRatePercent:       Number(form.interestRatePercent),
      invoicePrefix:             form.invoicePrefix,
      currency:                  form.currency,
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Configuración de facturación</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Parámetros globales del sistema de cobro</p>
        </div>
        <Button
          loading={mutation.isPending || isLoading}
          onClick={handleSave}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? '¡Guardado!' : 'Guardar'}
        </Button>
      </div>

      {/* Consumo residencial */}
      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Umbrales de consumo residencial (kWh)</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="Umbral básico"
            type="number"
            min={0}
            step={1}
            hint="Consumo hasta este valor se cobra a tarifa básica"
            value={form.basicThresholdKwh}
            onChange={(e) => setField('basicThresholdKwh', e.target.value)}
          />
          <Input
            label="Umbral complementario"
            type="number"
            min={0}
            step={1}
            hint="Entre el umbral básico y este valor se cobra a tarifa complementaria"
            value={form.complementaryThresholdKwh}
            onChange={(e) => setField('complementaryThresholdKwh', e.target.value)}
          />
        </div>
        <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-xs text-neutral-500 leading-relaxed">
          Consumo <strong>&gt; {form.complementaryThresholdKwh || '260'} kWh</strong> se cobra a tarifa suntuaria.
          Los estratos comerciales y oficiales no aplican estos umbrales.
        </div>
      </Card>

      {/* Numeración y moneda */}
      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Numeración y moneda</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prefijo de factura"
            placeholder="FAC"
            hint="Ej: FAC-2024-00001"
            value={form.invoicePrefix}
            onChange={(e) => setField('invoicePrefix', e.target.value.toUpperCase())}
          />
          <Input
            label="Moneda"
            placeholder="COP"
            hint="Código ISO 4217"
            value={form.currency}
            onChange={(e) => setField('currency', e.target.value.toUpperCase())}
          />
        </div>
      </Card>

      {/* Interés por mora */}
      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Interés por mora</CardTitle>
        </CardHeader>
        <Input
          label="Tasa de interés mensual (%)"
          type="number"
          min={0}
          max={100}
          step={0.01}
          hint="0 = sin interés por mora"
          value={form.interestRatePercent}
          onChange={(e) => setField('interestRatePercent', e.target.value)}
        />
      </Card>
    </div>
  );
}
