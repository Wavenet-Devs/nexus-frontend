'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, ExternalLink, RefreshCw, Plus, Rocket, Trash2, Lock, FileCode, BookOpen,
} from 'lucide-react';
import {
  billingService,
  type InvoiceTemplate,
  type InvoiceTemplateSummary,
} from '@/services/billing.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const STATUS_LABEL: Record<InvoiceTemplate['status'], string> = {
  draft:    'Borrador',
  active:   'Vigente',
  archived: 'Archivada',
};

export default function InvoiceTemplatePage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [html, setHtml]             = useState('');
  const [name, setName]             = useState('');
  const [saved, setSaved]           = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [showNew, setShowNew]       = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [showTokens, setShowTokens]   = useState(false);
  const [bannerId, setBannerId]       = useState('');

  const { data: versions, isLoading } = useQuery({
    queryKey: ['invoice-templates'],
    queryFn:  billingService.listTemplates,
  });

  // Al cargar, seleccionar el borrador en curso o, si no hay, la vigente.
  useEffect(() => {
    if (!versions?.length || selectedId) return;
    const draft = versions.find((v) => v.status === 'draft');
    setSelectedId((draft ?? versions.find((v) => v.status === 'active') ?? versions[0]).id);
  }, [versions, selectedId]);

  const { data: selected } = useQuery({
    queryKey: ['invoice-template', selectedId],
    queryFn:  () => billingService.getTemplate(selectedId!),
    enabled:  !!selectedId,
  });

  useEffect(() => {
    if (selected) {
      setHtml(selected.html);
      setName(selected.name);
    }
  }, [selected]);

  // Primera factura disponible: da una vista previa con datos reales.
  const { data: invoices } = useQuery({
    queryKey: ['invoices-preview-pick'],
    queryFn:  () => billingService.findAll({ limit: 1, page: 1 }),
  });
  const sampleInvoiceId: string | undefined = invoices?.data?.[0]?.id;

  // Piezas publicitarias para poder verlas en la vista previa antes de su mes.
  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn:  billingService.listBanners,
  });

  const isDraft = selected?.status === 'draft';
  const dirty   = !!selected && (html !== selected.html || name !== selected.name);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['invoice-templates'] });
    void qc.invalidateQueries({ queryKey: ['invoice-template'] });
  };

  const saveDraft = useMutation({
    mutationFn: () => billingService.updateTemplateDraft(selectedId!, { html, name }),
    onSuccess: (updated) => {
      qc.setQueryData(['invoice-template', updated.id], updated);
      invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setPreviewKey((k) => k + 1);
    },
  });

  const createDraft = useMutation({
    mutationFn: (dto: { name: string; fromTemplateId: string }) =>
      billingService.createTemplateDraft(dto),
    onSuccess: (created) => {
      invalidate();
      setSelectedId(created.id);
      setShowNew(false);
    },
  });

  const publish = useMutation({
    mutationFn: (effectiveFrom: string) => billingService.publishTemplate(selectedId!, effectiveFrom),
    onSuccess: () => { invalidate(); setShowPublish(false); },
  });

  const removeDraft = useMutation({
    mutationFn: () => billingService.deleteTemplateDraft(selectedId!),
    onSuccess: () => { invalidate(); setSelectedId(null); setShowDelete(false); },
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // El token viaja por query y dura 15 minutos, así que se renueva antes de
  // construir la URL: si no, al rato el iframe empieza a devolver 401.
  useEffect(() => {
    if (!selectedId) { setPreviewUrl(null); return; }
    let cancelled = false;
    void (async () => {
      await billingService.ensureFreshToken();
      if (cancelled) return;
      const url = billingService.getTemplatePreviewUrl(
        selectedId,
        sampleInvoiceId,
        bannerId || undefined,
      );
      setPreviewUrl(`${url}&_t=${previewKey}`);
    })();
    return () => { cancelled = true; };
  }, [selectedId, sampleInvoiceId, bannerId, previewKey]);

  /** Abrir en pestaña nueva pide token fresco en el momento del clic. */
  const openInNewTab = async () => {
    if (!selectedId) return;
    await billingService.ensureFreshToken();
    window.open(
      billingService.getTemplatePreviewUrl(selectedId, sampleInvoiceId, bannerId || undefined),
      '_blank',
    );
  };

  if (isLoading) return <TemplateSkeleton />;

  const activeVersion = versions?.find((v) => v.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Diseño de factura</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            El diseño define cómo se ve la factura. La información que imprime —razón social, NIT,
            dirección— sale de{' '}
            <a href="/dashboard/settings/company" className="text-primary-600 hover:underline">
              Datos de la empresa
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowTokens(true)}>
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            Tokens
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNew(true)}
            disabled={versions?.some((v) => v.status === 'draft')}
            title={versions?.some((v) => v.status === 'draft') ? 'Ya existe un borrador en curso' : undefined}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nuevo borrador
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Historial de versiones */}
        <Card padding="md" className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle>Versiones</CardTitle>
          </CardHeader>
          <div className="space-y-1.5">
            {versions?.map((v) => (
              <VersionRow
                key={v.id}
                version={v}
                selected={v.id === selectedId}
                onSelect={() => setSelectedId(v.id)}
              />
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
            Las versiones publicadas no se editan. Las facturas ya emitidas conservan la suya
            para siempre.
          </p>
        </Card>

        <div className="space-y-6">
          {/* Editor */}
          <Card padding="md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{isDraft ? 'Editar borrador' : 'HTML de la versión'}</CardTitle>
                <div className="flex items-center gap-2">
                  {isDraft ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDelete(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Descartar
                      </Button>
                      <Button
                        size="sm"
                        loading={saveDraft.isPending}
                        disabled={!dirty}
                        onClick={() => saveDraft.mutate()}
                        className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {saved ? '¡Guardado!' : 'Guardar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={dirty}
                        title={dirty ? 'Guarda los cambios antes de publicar' : undefined}
                        onClick={() => setShowPublish(true)}
                      >
                        <Rocket className="h-3.5 w-3.5 mr-1" />
                        Publicar
                      </Button>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Lock className="h-3.5 w-3.5" />
                      Solo lectura
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            {isDraft && (
              <div className="mb-3">
                <Input
                  label="Nombre de la versión"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {saveDraft.isError && (
              <p className="mb-2 text-xs text-danger-600">
                {errorMessage(saveDraft.error)}
              </p>
            )}

            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              readOnly={!isDraft}
              spellCheck={false}
              className={`w-full h-[420px] rounded-lg border border-neutral-300 bg-white p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                isDraft ? '' : 'bg-neutral-50 text-neutral-600'
              }`}
            />
            <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5" />
              HTML con tokens Handlebars. Los datos salen del contexto que arma el sistema.
            </p>
          </Card>

          {/* Vista previa */}
          <Card padding="md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>
                  Vista previa
                  <span className="ml-2 text-xs font-normal text-neutral-400">
                    {sampleInvoiceId ? 'con una factura real' : 'con datos de ejemplo'}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!!banners?.length && (
                    <Select
                      value={bannerId}
                      onChange={(e) => { setBannerId(e.target.value); setPreviewKey((k) => k + 1); }}
                      className="h-9 text-xs"
                    >
                      <option value="">Publicidad del período</option>
                      {banners.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} · {MESES_CORTOS[b.month - 1]} {b.year}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!previewUrl}
                    onClick={() => void openInNewTab()}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Nueva pestaña
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!previewUrl}
                    onClick={() => setPreviewKey((k) => k + 1)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Actualizar
                  </Button>
                </div>
              </div>
            </CardHeader>

            {dirty && (
              <p className="mb-2 text-xs text-amber-600">
                Tienes cambios sin guardar — la vista previa muestra la última versión guardada.
              </p>
            )}

            {previewUrl && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden" style={{ height: '720px' }}>
                <iframe
                  key={previewKey}
                  src={previewUrl}
                  className="w-full h-full"
                  title="Vista previa de la factura"
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      <NewDraftDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        baseVersion={activeVersion}
        loading={createDraft.isPending}
        error={createDraft.isError ? errorMessage(createDraft.error) : null}
        onCreate={(newName) =>
          activeVersion && createDraft.mutate({ name: newName, fromTemplateId: activeVersion.id })
        }
      />

      <PublishDialog
        open={showPublish}
        onClose={() => setShowPublish(false)}
        loading={publish.isPending}
        error={publish.isError ? errorMessage(publish.error) : null}
        onPublish={(date) => publish.mutate(date)}
      />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Descartar borrador"
        message="Se elimina el borrador y su HTML. Las versiones publicadas no se ven afectadas."
        danger
        loading={removeDraft.isPending}
        onConfirm={() => removeDraft.mutate()}
      />

      <TokensDialog open={showTokens} onClose={() => setShowTokens(false)} />
    </div>
  );
}

function VersionRow({
  version, selected, onSelect,
}: {
  version: InvoiceTemplateSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
        selected
          ? 'border-primary-300 bg-primary-50/60'
          : 'border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-800 truncate">
          v{version.version} · {version.name}
        </span>
        <Badge variant={version.status === 'active' ? 'default' : 'ghost'}>
          {STATUS_LABEL[version.status]}
        </Badge>
      </div>
      <p className="text-xs text-neutral-400 mt-0.5">
        {version.status === 'draft'
          ? 'Sin publicar'
          : `Vigente desde ${version.effectiveFrom}`}
      </p>
    </button>
  );
}

function NewDraftDialog({
  open, onClose, baseVersion, loading, error, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  baseVersion?: InvoiceTemplateSummary;
  loading: boolean;
  error: string | null;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');
  useEffect(() => { if (open) setName(''); }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo borrador de diseño">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Se crea una copia editable de{' '}
          <strong>v{baseVersion?.version} · {baseVersion?.name}</strong>. La versión vigente
          sigue intacta hasta que publiques.
        </p>
        <Input
          label="Nombre de la versión"
          placeholder="Rediseño 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="text-xs text-danger-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={loading} disabled={name.trim().length < 3} onClick={() => onCreate(name.trim())}>
            Crear borrador
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function PublishDialog({
  open, onClose, loading, error, onPublish,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  onPublish: (effectiveFrom: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  useEffect(() => { if (open) setDate(today); }, [open, today]);

  return (
    <Dialog open={open} onClose={onClose} title="Publicar diseño">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          La versión vigente pasa a archivada y esta queda en producción. Las facturas ya
          emitidas <strong>conservan el diseño con el que se generaron</strong>.
        </p>
        <Input
          label="Vigente desde"
          type="date"
          hint="Las facturas generadas a partir de esta fecha usarán el diseño nuevo"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {error && <p className="text-xs text-danger-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button loading={loading} onClick={() => onPublish(date)}>
            <Rocket className="h-3.5 w-3.5 mr-1" />
            Publicar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function TokensDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['invoice-template-tokens'],
    queryFn:  billingService.getTemplateContextSchema,
    enabled:  open,
  });

  return (
    <Dialog open={open} onClose={onClose} title="Tokens disponibles" size="xl">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto">
        <p className="text-sm text-neutral-600">
          Estos son los únicos datos que el diseño puede imprimir. Se escriben como{' '}
          <code className="px-1 py-0.5 bg-neutral-100 rounded font-mono text-xs">
            {'{{grupo.campo}}'}
          </code>
          .
        </p>

        {data?.grupos.map((g) => (
          <div key={g.clave}>
            <p className="text-sm font-semibold text-neutral-800">{g.clave}</p>
            <p className="text-xs text-neutral-500 mb-1.5">{g.descripcion}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.campos.map((c) => (
                <code key={c} className="px-1.5 py-0.5 bg-neutral-100 rounded font-mono text-xs text-neutral-700">
                  {`{{${g.clave}.${c}}}`}
                </code>
              ))}
            </div>
          </div>
        ))}

        {data?.helpers && (
          <div>
            <p className="text-sm font-semibold text-neutral-800 mb-1.5">Helpers de formato</p>
            <div className="space-y-1">
              {data.helpers.map((h) => (
                <div key={h.nombre} className="flex items-center gap-2 text-xs">
                  <code className="px-1.5 py-0.5 bg-neutral-100 rounded font-mono text-neutral-700">{h.uso}</code>
                  <span className="text-neutral-400">→</span>
                  <span className="text-neutral-600">{h.resultado}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function errorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? 'Ocurrió un error inesperado';
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
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="h-64 bg-neutral-100 rounded-xl" />
        <div className="space-y-6">
          <div className="h-96 bg-neutral-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
