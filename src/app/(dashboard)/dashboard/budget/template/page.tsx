'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { budgetService, type BudgetTemplate } from '@/services/budget.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const EMPTY: BudgetTemplate = {
  companyName: '',
  companyNit: '',
  companyAddress: '',
  companyPhone: '',
  city: '',
  signerName: '',
  signerTitle: '',
  logoUrl: '',
  primaryColor: '#1a56db',
};

export default function BudgetTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState<BudgetTemplate>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const query = useQuery({
    queryKey: ['budget-template'],
    queryFn: () => budgetService.getTemplate(),
  });

  useEffect(() => {
    if (query.data) setForm({ ...EMPTY, ...query.data });
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () => budgetService.updateTemplate(form),
    onSuccess: (data) => {
      setForm({ ...EMPTY, ...data });
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'No se pudo guardar la plantilla'),
  });

  const set = (key: keyof BudgetTemplate) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (query.isLoading) {
    return <div className="h-56 rounded-xl bg-neutral-100 animate-pulse" />;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/budget/catalogs')}>
          <ArrowLeft className="h-4 w-4" /> Catálogos
        </Button>
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
          <Save className="h-4 w-4" /> Guardar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plantilla de certificados CDP y RP</CardTitle>
        </CardHeader>

        <p className="text-sm text-neutral-500 mb-5">
          Estos datos aparecen en el encabezado, lugar de expedición y firma de los certificados presupuestales.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-danger-50 border border-red-200 px-4 py-2 text-sm text-danger-600">
            {error}
          </div>
        )}
        {saved && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
            Plantilla guardada correctamente.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre de la entidad" value={form.companyName} onChange={set('companyName')} />
          <Input label="NIT" value={form.companyNit} onChange={set('companyNit')} />
          <Input label="Dirección" value={form.companyAddress} onChange={set('companyAddress')} />
          <Input label="Teléfono" value={form.companyPhone} onChange={set('companyPhone')} />
          <Input label="Ciudad de expedición" value={form.city} onChange={set('city')} />
          <Input label="URL del logo" value={form.logoUrl} onChange={set('logoUrl')} />
          <Input label="Nombre de quien firma" value={form.signerName} onChange={set('signerName')} />
          <Input label="Cargo de quien firma" value={form.signerTitle} onChange={set('signerTitle')} />
          <Input label="Color principal" value={form.primaryColor} onChange={set('primaryColor')} />
        </div>
      </Card>
    </div>
  );
}
