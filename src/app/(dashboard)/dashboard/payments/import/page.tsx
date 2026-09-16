'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import { paymentsService, type CollectionsImportResult } from '@/services/payments.service';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ImportCollectionsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<CollectionsImportResult | null>(null);
  const [result, setResult]   = useState<CollectionsImportResult | null>(null);

  const revisar = useMutation({
    mutationFn: () => paymentsService.importCollections(file!, true),
    onSuccess:  (r) => { setPreview(r); setResult(null); },
  });

  const aplicar = useMutation({
    mutationFn: () => paymentsService.importCollections(file!, false),
    onSuccess:  (r) => { setResult(r); setPreview(null); },
  });

  const elegir = (f: File | null) => {
    setFile(f);
    setPreview(null);
    setResult(null);
  };

  const error = revisar.error ?? aplicar.error;
  const datos = result ?? preview;

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.push('/dashboard/payments')}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a cobros
      </button>

      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Aplicar recaudo en bloque</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Cada fila de la planilla crea un pago y lo aplica a la factura de ese período.
        </p>
      </div>

      <Card padding="md">
        <CardHeader className="pb-3">
          <CardTitle>1 · Descarga la planilla</CardTitle>
        </CardHeader>
        <div className="flex items-start gap-2.5 p-3 bg-primary-50/60 border border-primary-100 rounded-lg mb-3">
          <Info className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-600 leading-relaxed">
            <p>
              Columnas: <strong>Contrato · Mes · Año · Valor · Fecha de pago · Referencia</strong>.
              La fecha es la que entró el dinero, no la de hoy: el informe de Pagos se filtra por ella.
            </p>
            <p className="mt-1">
              Si el valor no alcanza a cubrir la factura, queda el saldo pendiente. Si sobra, se
              aplica solo hasta saldarla y el excedente se reporta.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open(paymentsService.getImportTemplateUrl(), '_blank')}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Descargar planilla
        </Button>
      </Card>

      <Card padding="md">
        <CardHeader className="pb-3">
          <CardTitle>2 · Sube el archivo diligenciado</CardTitle>
        </CardHeader>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          onChange={(e) => elegir(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-neutral-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
        {file && (
          <p className="flex items-center gap-2 text-xs text-neutral-500 mt-2">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
        )}

        {error != null && (
          <p className="text-xs text-danger-600 mt-2">
            {(() => {
              const msg = (error as { response?: { data?: { message?: string | string[] } } })
                ?.response?.data?.message;
              return Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo procesar el archivo';
            })()}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            loading={revisar.isPending}
            disabled={!file}
            onClick={() => revisar.mutate()}
            variant={preview ? 'outline' : 'primary'}
          >
            Revisar archivo
          </Button>
          {preview && preview.applied > 0 && (
            <Button loading={aplicar.isPending} onClick={() => aplicar.mutate()}>
              <Upload className="h-3.5 w-3.5 mr-1" />
              Aplicar {preview.applied} pago{preview.applied === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </Card>

      {datos && (
        <Card padding="md">
          <CardHeader className="pb-3">
            <CardTitle>
              {result ? '3 · Resultado' : '3 · Vista previa'}
              {preview && (
                <span className="ml-2 text-xs font-normal text-amber-600">
                  nada se ha aplicado todavía
                </span>
              )}
            </CardTitle>
          </CardHeader>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Stat label={result ? 'Aplicados' : 'Se aplicarían'} value={String(datos.applied)} tone="ok" />
            <Stat label="Con error" value={String(datos.failed)} tone={datos.failed ? 'warn' : undefined} />
            <Stat label="Total" value={formatCurrency(datos.totalApplied)} />
            <Stat
              label="Excedente"
              value={formatCurrency(datos.totalExcess)}
              tone={datos.totalExcess > 0 ? 'warn' : undefined}
            />
          </div>

          {result && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                {result.applied} pago{result.applied === 1 ? '' : 's'} registrado
                {result.applied === 1 ? '' : 's'} por {formatCurrency(result.totalApplied)}.
              </p>
            </div>
          )}

          {datos.rows.length > 0 && (
            <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Fila</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Contrato</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Cliente</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Período</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">Aplicado</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">Queda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.rows.map((r) => (
                      <tr key={r.row} className="border-t border-neutral-100">
                        <td className="px-3 py-1.5 text-xs text-neutral-400">{r.row}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{r.contract}</td>
                        <td className="px-3 py-1.5 truncate max-w-[180px]">{r.clientName}</td>
                        <td className="px-3 py-1.5 text-neutral-500">{r.period}</td>
                        <td className="px-3 py-1.5 text-right font-medium">
                          {formatCurrency(r.allocated)}
                          {r.excess > 0 && (
                            <span className="block text-xs text-amber-600">
                              sobran {formatCurrency(r.excess)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right text-neutral-500">
                          {r.remaining > 0 ? formatCurrency(r.remaining) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {datos.errors.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700 mb-2">
                <AlertTriangle className="h-4 w-4" />
                {datos.errors.length} fila{datos.errors.length === 1 ? '' : 's'} sin aplicar
              </p>
              <div className="border border-amber-200 bg-amber-50/50 rounded-lg divide-y divide-amber-100 max-h-52 overflow-y-auto">
                {datos.errors.map((e) => (
                  <p key={e.row} className="px-3 py-1.5 text-xs text-neutral-700">
                    <span className="text-neutral-400 mr-2">Fila {e.row}</span>
                    {e.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  const color = tone === 'ok' ? 'text-primary-700' : tone === 'warn' ? 'text-amber-700' : 'text-neutral-900';
  const bg    = tone === 'warn' ? 'bg-amber-50' : 'bg-neutral-50';
  return (
    <div className={`${bg} rounded-lg p-3`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
