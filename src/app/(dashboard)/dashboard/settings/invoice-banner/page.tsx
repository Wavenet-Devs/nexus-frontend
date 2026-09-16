'use client';

import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Image as ImageIcon, AlertTriangle, Info } from 'lucide-react';
import { billingService, type InvoiceBanner } from '@/services/billing.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function InvoiceBannerPage() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [toDelete, setToDelete]     = useState<InvoiceBanner | null>(null);

  const { data: spec }    = useQuery({ queryKey: ['banner-spec'], queryFn: billingService.getBannerSpec });
  const { data: banners, isLoading } = useQuery({ queryKey: ['banners'], queryFn: billingService.listBanners });

  const remove = useMutation({
    mutationFn: (id: string) => billingService.deleteBanner(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['banners'] });
      setToDelete(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Publicidad en la factura</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            La pieza del bloque «Infórmate con…». Cambia mes a mes y queda fija en las facturas
            de ese período.
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="h-3.5 w-3.5" />
          Subir pieza
        </Button>
      </div>

      {spec && (
        <div className="flex items-start gap-2.5 p-3 bg-primary-50/60 border border-primary-100 rounded-lg">
          <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-600 leading-relaxed">
            <p>
              <strong>
                Tamaño recomendado: {spec.recommendedWidth} × {spec.recommendedHeight} px
              </strong>{' '}
              (proporción {spec.aspectRatio}, vertical). Formatos {spec.formats.join(', ')}, máximo{' '}
              {spec.maxSizeMb} MB.
            </p>
            <p className="mt-1">
              La imagen se ajusta al ancho de la columna y no se recorta: si usas otra proporción,
              el bloque cambia de alto y puede descuadrar la página.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !banners?.length ? (
        <EmptyState
          icon={ImageIcon}
          title="Sin piezas cargadas"
          message="Mientras no subas ninguna, el bloque de publicidad no se imprime en la factura."
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {banners.map((b) => (
            <BannerCard key={b.id} banner={b} spec={spec} onDelete={() => setToDelete(b)} />
          ))}
        </div>
      )}

      <UploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        spec={spec}
        onUploaded={() => {
          void qc.invalidateQueries({ queryKey: ['banners'] });
          setShowUpload(false);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Eliminar pieza publicitaria"
        message={
          toDelete
            ? `Se elimina «${toDelete.title}» (${MESES[toDelete.month - 1]} ${toDelete.year}). ` +
              'Las facturas que la tenían pasarán a usar la pieza vigente de su período.'
            : ''
        }
        danger
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}

function BannerCard({
  banner, spec, onDelete,
}: {
  banner: InvoiceBanner;
  spec?: { recommendedWidth: number; recommendedHeight: number };
  onDelete: () => void;
}) {
  // Avisar cuando la proporción se aleja de la del diseño: se verá recortada.
  const offRatio = useMemo(() => {
    if (!spec || !banner.width || !banner.height) return false;
    const target = spec.recommendedWidth / spec.recommendedHeight;
    return Math.abs(banner.width / banner.height - target) > 0.04;
  }, [banner.width, banner.height, spec]);

  return (
    <Card padding="sm" className="overflow-hidden">
      <div className="aspect-[22/27] bg-neutral-50 rounded-lg overflow-hidden mb-2 flex items-start">
        {/* object-contain: la factura ajusta al ancho sin recortar, la miniatura igual */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner.imageUrl} alt={banner.title} className="w-full h-auto object-contain" />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-800 truncate">{banner.title}</p>
          <p className="text-xs text-neutral-500">
            {MESES[banner.month - 1]} {banner.year}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="p-1 rounded text-neutral-400 hover:text-danger-600 hover:bg-neutral-100 transition-colors shrink-0"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {banner.width && banner.height && (
          <Badge variant="ghost">{banner.width}×{banner.height}</Badge>
        )}
        <Badge variant="ghost">{(banner.byteSize / 1024).toFixed(0)} KB</Badge>
      </div>
      {offRatio && (
        <p className="flex items-start gap-1 text-xs text-amber-600 mt-1.5 leading-tight">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
          Proporción distinta: el bloque quedará más {banner.height! / banner.width! > 27 / 22 ? 'alto' : 'bajo'} de lo previsto.
        </p>
      )}
    </Card>
  );
}

function UploadDialog({
  open, onClose, spec, onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  spec?: { recommendedWidth: number; recommendedHeight: number; aspectRatio: string; maxSizeMb: number };
  onUploaded: () => void;
}) {
  const now = new Date();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]   = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dims, setDims]   = useState<{ w: number; h: number } | null>(null);
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const upload = useMutation({
    mutationFn: () => billingService.uploadBanner({ file: file!, title, month, year }),
    onSuccess: () => { reset(); onUploaded(); },
  });

  const reset = () => {
    setFile(null); setPreview(null); setDims(null); setTitle('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const pick = (f: File | null) => {
    setFile(f);
    if (!f) { setPreview(null); setDims(null); return; }
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new window.Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  };

  const offRatio =
    !!dims && !!spec &&
    Math.abs(dims.w / dims.h - spec.recommendedWidth / spec.recommendedHeight) > 0.04;

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} title="Subir pieza publicitaria" size="lg">
      <div className="space-y-4">
        {spec && (
          <p className="text-sm text-neutral-600">
            Usa una imagen vertical de{' '}
            <strong>{spec.recommendedWidth} × {spec.recommendedHeight} px</strong> (proporción{' '}
            {spec.aspectRatio}). Es la medida exacta del espacio en la factura.
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-neutral-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />

        {preview && (
          <div className="flex gap-4">
            <div className="w-32 shrink-0">
              <div className="aspect-[22/27] bg-neutral-50 rounded-lg overflow-hidden border border-neutral-200 flex items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Vista previa" className="w-full h-auto object-contain" />
              </div>
              <p className="text-xs text-neutral-400 text-center mt-1">Como se verá</p>
            </div>
            <div className="text-xs text-neutral-600 space-y-1 pt-1">
              {dims && <p>Dimensiones: <strong>{dims.w} × {dims.h} px</strong></p>}
              {file && <p>Peso: <strong>{(file.size / 1024).toFixed(0)} KB</strong></p>}
              {offRatio && (
                <p className="flex items-start gap-1 text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  La proporción no coincide con la recomendada. No se recorta, pero el bloque
                  quedará más {dims.h / dims.w > 1350 / 1100 ? 'alto' : 'bajo'} y puede descuadrar
                  la página.
                </p>
              )}
            </div>
          </div>
        )}

        <Input
          label="Nombre de la pieza"
          placeholder="Amor y amistad 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Mes" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
          <Input
            label="Año"
            type="number"
            min={2000}
            max={2999}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>

        <p className="text-xs text-neutral-500">
          Si ya existe una pieza para ese mes, se reemplaza. Las facturas ya emitidas conservan
          la que tenían.
        </p>

        {upload.isError && (
          <p className="text-xs text-danger-600">{errorMessage(upload.error)}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button
            loading={upload.isPending}
            disabled={!file || title.trim().length < 3}
            onClick={() => upload.mutate()}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Subir
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function errorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? 'Ocurrió un error inesperado';
}
