'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { clientsService } from '@/services/clients.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const COLUMNS = [
  { col: 'A', header: 'Contrato *',        example: '001-2024',           note: 'Obligatorio. Si ya existe, actualiza.' },
  { col: 'B', header: 'Documento *',        example: '12345678',           note: 'Obligatorio para clientes nuevos.' },
  { col: 'C', header: 'Nombre completo *',  example: 'Juan Pérez',         note: 'Obligatorio.' },
  { col: 'D', header: 'Dirección',          example: 'Calle 1 # 2-3',      note: 'Opcional.' },
  { col: 'E', header: 'Teléfono',           example: '3001234567',         note: 'Opcional.' },
  { col: 'F', header: 'Correo',             example: 'j@correo.com',       note: 'Opcional.' },
  { col: 'G', header: 'Ruta',               example: 'RUTA-01',            note: 'Opcional.' },
  { col: 'H', header: 'Código de barras',   example: '001234',             note: 'Opcional.' },
];

function downloadTemplate() {
  // Genera un CSV simple como plantilla
  const header = COLUMNS.map((c) => c.header.replace(' *', '')).join(',');
  const example = COLUMNS.map((c) => c.example).join(',');
  const csv = `${header}\n${example}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'plantilla-clientes.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClientImportPage() {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const importMutation = useMutation({
    mutationFn: (f: File) => clientsService.importXlsx(f),
  });

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) return;
    setFile(f);
    importMutation.reset();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = () => {
    if (file) importMutation.mutate(file);
  };

  const result = importMutation.data;
  const isDone = importMutation.isSuccess;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/clients')}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Clientes
        </button>
      </div>

      {/* Instructions */}
      <Card padding="md">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">Formato del archivo</h2>
            <p className="text-xs text-neutral-500 mt-0.5">XLSX o CSV · Fila 1 = encabezados · Sin filas vacías</p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Plantilla CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left py-2 pr-3 text-neutral-500 font-semibold w-6">Col</th>
                <th className="text-left py-2 pr-3 text-neutral-500 font-semibold">Encabezado</th>
                <th className="text-left py-2 pr-3 text-neutral-500 font-semibold">Ejemplo</th>
                <th className="text-left py-2 text-neutral-500 font-semibold">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {COLUMNS.map((c) => (
                <tr key={c.col}>
                  <td className="py-2 pr-3 font-mono font-bold text-neutral-400">{c.col}</td>
                  <td className="py-2 pr-3 font-medium text-neutral-700">{c.header}</td>
                  <td className="py-2 pr-3 font-mono text-neutral-500">{c.example}</td>
                  <td className="py-2 text-neutral-400">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neutral-400 mt-3 border-t border-neutral-100 pt-3">
          Si el contrato ya existe, se actualiza nombre/dirección/teléfono/email/ruta/código de barras.
          Si no existe, se crea como nuevo cliente activo.
        </p>
      </Card>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-primary-400 bg-primary-50'
            : file
            ? 'border-primary-300 bg-primary-50/50'
            : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="h-10 w-10 text-primary-500" />
            <p className="text-sm font-semibold text-neutral-800">{file.name}</p>
            <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB · Haz clic para cambiar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-600">Arrastra tu archivo aquí o haz clic para seleccionar</p>
            <p className="text-xs text-neutral-400">Formatos aceptados: .xlsx, .xls, .csv</p>
          </div>
        )}
      </div>

      {/* Result */}
      {isDone && result && (
        <Card padding="md">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-800 mb-2">Importación completada</p>
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div className="bg-primary-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary-700">{result.created}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Creados</p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-neutral-700">{result.updated}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Actualizados</p>
                </div>
                <div className={`rounded-lg p-3 ${result.errors.length > 0 ? 'bg-danger-50' : 'bg-neutral-50'}`}>
                  <p className={`text-2xl font-bold ${result.errors.length > 0 ? 'text-danger-700' : 'text-neutral-400'}`}>
                    {result.errors.length}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">Errores</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  {result.errors.slice(0, 10).map((e: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-danger-700">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Fila {e.row}: {e.message}</span>
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-xs text-neutral-400">… y {result.errors.length - 10} errores más</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {importMutation.isError && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg px-4 py-3 text-sm text-danger-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Error al procesar el archivo. Verifica que sea un XLSX o CSV válido.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard/clients')}>
          Cancelar
        </Button>
        <Button
          disabled={!file || importMutation.isPending}
          loading={importMutation.isPending}
          onClick={handleImport}
        >
          <Upload className="h-4 w-4 mr-1.5" />
          {importMutation.isPending ? 'Importando...' : 'Importar clientes'}
        </Button>
        {isDone && (
          <Button variant="outline" onClick={() => router.push('/dashboard/clients')}>
            Ver clientes
          </Button>
        )}
      </div>
    </div>
  );
}
