'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Save, ExternalLink, RefreshCw } from 'lucide-react';
import { billingService, type InvoiceTemplate, type TemplateModule } from '@/services/billing.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function InvoiceTemplatePage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<Partial<InvoiceTemplate>>({});
  const refreshPreviewRef = useRef<(() => void) | null>(null);

  const { data: template, isLoading } = useQuery({
    queryKey: ['invoice-template'],
    queryFn:  billingService.getTemplate,
  });

  useEffect(() => {
    if (template) setDraft(template);
  }, [template]);

  const mutation = useMutation({
    mutationFn: (dto: Partial<InvoiceTemplate>) => billingService.updateTemplate(dto),
    onSuccess: (updated) => {
      qc.setQueryData(['invoice-template'], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Refrescar preview automáticamente tras guardar
      refreshPreviewRef.current?.();
    },
  });

  const setField = <K extends keyof InvoiceTemplate>(key: K, value: InvoiceTemplate[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleModule = (id: string) =>
    setDraft((d) => ({
      ...d,
      modules: (d.modules ?? []).map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m),
    }));

  const moveModule = (id: string, dir: -1 | 1) => {
    setDraft((d) => {
      const mods = [...(d.modules ?? [])].sort((a, b) => a.order - b.order);
      const idx  = mods.findIndex((m) => m.id === id);
      const next = idx + dir;
      if (next < 0 || next >= mods.length) return d;
      [mods[idx], mods[next]] = [mods[next], mods[idx]];
      return { ...d, modules: mods.map((m, i) => ({ ...m, order: i + 1 })) };
    });
  };

  if (isLoading) return <TemplateSkeleton />;

  const modules = [...(draft.modules ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Plantilla de factura</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Personaliza el diseño y los módulos de tus facturas</p>
        </div>
        <Button
          loading={mutation.isPending}
          onClick={() => mutation.mutate(draft)}
          className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? '¡Guardado!' : 'Guardar cambios'}
        </Button>
      </div>

      {/* Empresa */}
      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Información de la empresa</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre de la empresa"
            value={draft.companyName ?? ''}
            onChange={(e) => setField('companyName', e.target.value)}
          />
          <Input
            label="NIT / Identificación"
            value={draft.companyNit ?? ''}
            onChange={(e) => setField('companyNit', e.target.value)}
          />
          <Input
            label="Dirección"
            value={draft.companyAddress ?? ''}
            onChange={(e) => setField('companyAddress', e.target.value)}
          />
          <Input
            label="Teléfono"
            value={draft.companyPhone ?? ''}
            onChange={(e) => setField('companyPhone', e.target.value)}
          />
          <Input
            label="Correo electrónico"
            type="email"
            value={draft.companyEmail ?? ''}
            onChange={(e) => setField('companyEmail', e.target.value)}
          />
          <Input
            label="URL del logo"
            placeholder="https://…/logo.png"
            value={draft.logoUrl ?? ''}
            onChange={(e) => setField('logoUrl', e.target.value)}
          />
        </div>
        {draft.logoUrl && (
          <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-100 inline-flex items-center gap-3">
            <img
              src={draft.logoUrl}
              alt="Logo preview"
              className="max-h-12 max-w-[120px] object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-xs text-neutral-500">Vista previa del logo</span>
          </div>
        )}
      </Card>

      {/* Diseño */}
      <Card padding="md">
        <CardHeader className="pb-4">
          <CardTitle>Diseño y colores</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorPicker
            label="Color principal"
            hint="Encabezados, botones, totales"
            value={draft.primaryColor ?? '#16a34a'}
            onChange={(v) => setField('primaryColor', v)}
          />
          <ColorPicker
            label="Color acento"
            hint="Período y detalles secundarios"
            value={draft.accentColor ?? '#15803d'}
            onChange={(v) => setField('accentColor', v)}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Texto de pie de página
          </label>
          <textarea
            rows={2}
            value={draft.footerText ?? ''}
            onChange={(e) => setField('footerText', e.target.value)}
            placeholder="Ej: Gracias por su pago puntual. Ante dudas comuníquese al…"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </Card>

      {/* Módulos */}
      <Card padding="md">
        <CardHeader className="pb-2">
          <CardTitle>Módulos de la factura</CardTitle>
        </CardHeader>
        <p className="text-xs text-neutral-500 mb-4">
          Activa, desactiva y reordena las secciones que aparecerán en la factura.
        </p>
        <div className="space-y-2">
          {modules.map((mod, idx) => (
            <ModuleRow
              key={mod.id}
              mod={mod}
              isFirst={idx === 0}
              isLast={idx === modules.length - 1}
              onToggle={() => toggleModule(mod.id)}
              onMoveUp={() => moveModule(mod.id, -1)}
              onMoveDown={() => moveModule(mod.id, 1)}
            />
          ))}
        </div>
      </Card>

      {/* Vista previa en vivo */}
      <InvoicePreview onRegisterRefresh={(fn) => { refreshPreviewRef.current = fn; }} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InvoicePreview({ onRegisterRefresh }: { onRegisterRefresh: (fn: () => void) => void }) {
  // Usamos un key numérico en el iframe para forzar recarga real del HTML
  const [iframeKey, setIframeKey]   = useState(0);
  const [hasLoaded, setHasLoaded]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const invoiceIdRef                = useRef<string | null>(null);

  const { data: invoices } = useQuery({
    queryKey: ['invoices-preview-pick'],
    queryFn:  () => billingService.findAll({ limit: 1, page: 1 }),
  });

  const firstInvoiceId = invoices?.data?.[0]?.id ?? null;
  invoiceIdRef.current = firstInvoiceId;

  // Función que fuerza recarga del iframe con URL nueva (timestamp evita caché)
  const refresh = useCallback(() => {
    if (!invoiceIdRef.current) return;
    setLoading(true);
    setIframeKey((k) => k + 1); // cambia el key → React destruye y recrea el iframe
  }, []);

  // Registrar la función de refresh en el padre al montar
  useEffect(() => {
    onRegisterRefresh(refresh);
  }, [refresh, onRegisterRefresh]);

  const previewUrl = firstInvoiceId
    ? `${billingService.getPreviewUrl(firstInvoiceId)}&_t=${iframeKey}`
    : null;

  return (
    <Card padding="md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Vista previa de la factura</CardTitle>
          <div className="flex items-center gap-2">
            {firstInvoiceId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(billingService.getPreviewUrl(firstInvoiceId), '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Abrir en nueva pestaña
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setHasLoaded(true); refresh(); }}
              disabled={!firstInvoiceId}
              loading={loading}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {hasLoaded ? 'Actualizar' : 'Cargar vista previa'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!firstInvoiceId && (
        <p className="text-sm text-neutral-400 text-center py-6">
          No hay facturas generadas aún. Genera facturas para poder previsualizar la plantilla.
        </p>
      )}

      {firstInvoiceId && !hasLoaded && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
          <p className="text-sm">Haz clic en "Cargar vista previa" para ver cómo quedan tus facturas.</p>
        </div>
      )}

      {firstInvoiceId && hasLoaded && previewUrl && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden" style={{ height: '720px' }}>
          <iframe
            key={iframeKey}
            src={previewUrl}
            className="w-full h-full"
            title="Vista previa de factura"
            onLoad={() => setLoading(false)}
          />
        </div>
      )}
    </Card>
  );
}

function ColorPicker({
  label, hint, value, onChange,
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-9 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
          />
        </div>
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-28 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
          />
        </div>
        <div
          className="flex-1 h-9 rounded-lg border border-neutral-100"
          style={{ background: value }}
        />
      </div>
      <p className="text-xs text-neutral-400 mt-1">{hint}</p>
    </div>
  );
}

function ModuleRow({
  mod, isFirst, isLast, onToggle, onMoveUp, onMoveDown,
}: {
  mod: TemplateModule;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
      mod.enabled ? 'bg-white border-neutral-200' : 'bg-neutral-50 border-neutral-100 opacity-60'
    }`}>
      <GripVertical className="h-4 w-4 text-neutral-300 shrink-0" />

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${mod.enabled ? 'text-neutral-800' : 'text-neutral-500'}`}>
          {mod.label}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Subir"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Bajar"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
            mod.enabled
              ? 'text-primary-700 bg-primary-50 hover:bg-primary-100'
              : 'text-neutral-500 bg-neutral-100 hover:bg-neutral-200'
          }`}
        >
          {mod.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {mod.enabled ? 'Activo' : 'Oculto'}
        </button>
      </div>
    </div>
  );
}

function TemplateSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-neutral-100 rounded" />
          <div className="h-4 w-64 bg-neutral-100 rounded" />
        </div>
        <div className="h-9 w-36 bg-neutral-100 rounded-lg" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-neutral-100 rounded-xl" />
      ))}
    </div>
  );
}
