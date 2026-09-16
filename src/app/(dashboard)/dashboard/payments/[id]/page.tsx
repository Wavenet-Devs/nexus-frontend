'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, CreditCard, CheckCircle2, Wifi, WifiOff, ChevronDown, Pencil, History } from 'lucide-react';
import { paymentsService } from '@/services/payments.service';
import { catalogsService } from '@/services/catalogs.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency, formatMonth } from '@/lib/utils';
import { usePrinters } from '@/hooks/use-printers';

const PAYMENT_TYPES: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' };
const TYPE_COLORS:   Record<string, string>  = {
  cash:     'bg-green-100 text-green-700',
  transfer: 'bg-blue-100 text-blue-700',
  card:     'bg-purple-100 text-purple-700',
};

/** Centra un texto en los 32 caracteres de una tirilla de 80 mm. */
function centrar(t: string): string {
  const ancho = 32;
  const texto = t.length > ancho ? t.slice(0, ancho) : t;
  return ' '.repeat(Math.max(0, Math.floor((ancho - texto.length) / 2))) + texto;
}

function buildVoucherText(payment: any, empresa?: any): string {
  const line  = '--------------------------------';
  const date  = new Date(payment.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  const type  = PAYMENT_TYPES[payment.payment_type] ?? payment.payment_type;

  const invoicesText = (payment.invoices ?? [])
    .map((i: any) => `  ${formatMonth(i.month, i.year).padEnd(16)}${formatCurrency(i.allocated).padStart(12)}`)
    .join('\n');

  // Encabezado de la empresa: el suscriptor se lleva el papel, tiene que decir
  // quién lo emitió. Sale de Configuración → Datos de la empresa.
  const encabezado = empresa?.companyName
    ? [
        centrar(empresa.companyName),
        empresa.companyNit     ? centrar(`NIT: ${empresa.companyNit}`) : '',
        empresa.companyAddress ? centrar(empresa.companyAddress)       : '',
        empresa.companyPhone   ? centrar(`Tel: ${empresa.companyPhone}`) : '',
        line,
      ].filter(Boolean)
    : [];

  return [
    ...encabezado,
    centrar('RECIBO DE PAGO'),
    line,
    `Ref: ${payment.id?.slice(0, 12).toUpperCase()}`,
    `Fecha: ${date}`,
    line,
    `Cliente:  ${payment.client_name}`,
    `Contrato: ${payment.contract}`,
    line,
    `Forma de pago: ${type}`,
    payment.payment_number ? `Comprobante: ${payment.payment_number}` : '',
    line,
    'FACTURAS APLICADAS:',
    invoicesText,
    line,
    `RECIBIDO:  ${formatCurrency(payment.amount).padStart(14)}`,
    Number(payment.change_amount) > 0
      ? `VUELTO:    ${formatCurrency(payment.change_amount).padStart(14)}`
      : '',
    line,
    '         Gracias por su pago',
  ].filter(Boolean).join('\n');
}

export default function PaymentDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [printerMenuOpen, setPrinterMenuOpen] = useState(false);
  const [printSent, setPrintSent] = useState(false);

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn:  () => paymentsService.findOne(id),
  });

  // El recibo lo conserva el suscriptor: debe decir quién lo emitió.
  const { data: empresa } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn:  catalogsService.getSettings,
  });

  const { printers, connected, requestPrint, lastError } = usePrinters();

  if (isLoading) return <PageSkeleton />;
  if (!payment) return null;

  const [editOpen, setEditOpen] = useState(false);

  const handlePrintThermal = (printerId: string) => {
    if (!payment) return;
    requestPrint(printerId, buildVoucherText(payment, empresa), payment.id);
    setPrintSent(true);
    setPrinterMenuOpen(false);
    setTimeout(() => setPrintSent(false), 3000);
  };

  return (
    <div className="space-y-5 print:max-w-full print:space-y-2">
      {/* Nav — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl px-4 h-9 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a cobros
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Corregir
          </Button>
          {/* Browser print */}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1" />
            Imprimir
          </Button>
          {/* Thermal printer */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrinterMenuOpen((v) => !v)}
              className={connected && printers.length > 0 ? 'border-primary-200 text-primary-700' : ''}
            >
              {connected ? (
                <Wifi className="h-3.5 w-3.5 mr-1 text-primary-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 mr-1 text-neutral-400" />
              )}
              Térmica
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            {printerMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                {!connected && (
                  <p className="px-3 py-2 text-xs text-neutral-400">Sin conexión al servidor</p>
                )}
                {connected && printers.length === 0 && (
                  <p className="px-3 py-2 text-xs text-neutral-400">Sin impresoras conectadas</p>
                )}
                {printers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePrintThermal(p.id)}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback messages */}
      {printSent && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-sm text-primary-700 print:hidden">
          Trabajo de impresión enviado a la impresora.
        </div>
      )}
      {lastError && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg px-3 py-2 text-sm text-danger-700 print:hidden">
          {lastError}
        </div>
      )}

      {/* Receipt */}
      <Card padding="md" className="print:shadow-none print:border-0">
        {/* Encabezado de empresa — solo tiene sentido en el papel */}
        {empresa?.companyName && (
          <div className="hidden print:block text-center mb-3">
            <p className="text-sm font-bold text-neutral-900">{empresa.companyName}</p>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              {empresa.companyNit ? `NIT: ${empresa.companyNit}` : ''}
              {empresa.companyAddress ? ` · ${empresa.companyAddress}` : ''}
              {empresa.companyPhone ? ` · Tel: ${empresa.companyPhone}` : ''}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center pb-4 border-b border-neutral-100 mb-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-base font-bold text-neutral-900">Recibo de pago</h2>
          <p className="text-xs text-neutral-400 font-mono mt-1">{payment.id?.slice(0, 16).toUpperCase()}</p>
        </div>

        {/* Client */}
        <div className="space-y-3 mb-4">
          <ReceiptRow label="Cliente"     value={payment.client_name} />
          <ReceiptRow label="Contrato"    value={payment.contract}    mono />
          <ReceiptRow label="Dirección"   value={payment.address || '—'} />
          <ReceiptRow label="Fecha"       value={new Date(payment.created_at).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })} />
        </div>

        {/* Payment info */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Forma de pago</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[payment.payment_type] ?? 'bg-neutral-100 text-neutral-600'}`}>
              {PAYMENT_TYPES[payment.payment_type] ?? payment.payment_type}
            </span>
          </div>
          {payment.payment_number && (
            <ReceiptRow label="Comprobante" value={payment.payment_number} mono />
          )}
          {payment.notes && !payment.notes.startsWith('{') && (
            <ReceiptRow label="Notas" value={payment.notes} />
          )}
        </div>

        {/* Applied invoices */}
        {payment.invoices?.length > 0 && (
          <div className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle>Facturas aplicadas</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {payment.invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-neutral-800">{formatMonth(inv.month, inv.year)}</span>
                    {inv.status === 'paid' && (
                      <span className="ml-2 text-xs text-green-600 font-medium">✓ Pagada</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold font-mono text-neutral-900">
                    {formatCurrency(inv.allocated)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-neutral-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Total aplicado</span>
            <span className="font-mono">{formatCurrency(payment.invoices?.reduce((s: number, i: any) => s + Number(i.allocated), 0) ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Recibido</span>
            <span className="font-mono">{formatCurrency(payment.amount)}</span>
          </div>
          {Number(payment.change_amount) > 0 && (
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Vuelto</span>
              <span className="font-mono">{formatCurrency(payment.change_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-neutral-900 border-t border-neutral-200 pt-3 mt-1">
            <span>Total recibido</span>
            <span className="font-mono text-primary-700">{formatCurrency(payment.amount)}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <CorregirPagoDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        payment={payment}
      />

      <div className="flex gap-2 print:hidden">
        <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/payments')}>
          <CreditCard className="h-3.5 w-3.5" />
          Ver todos los cobros
        </Button>
        <Button className="flex-1" onClick={() => router.push(`/dashboard/payments/new?clientId=${payment.client_id}`)}>
          Nuevo cobro al cliente
        </Button>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className={`font-medium text-neutral-800 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-32 bg-neutral-100 rounded" />
      <div className="h-96 bg-neutral-100 rounded-xl" />
    </div>
  );
}

/**
 * Corrige un pago mal registrado. El monto queda fuera a propósito: ya está
 * repartido entre facturas y movió sus saldos, así que cambiarlo aquí
 * descuadraría la cartera. Para eso hay que anular y volver a registrar.
 */
function CorregirPagoDialog({
  open, onClose, payment,
}: {
  open: boolean;
  onClose: () => void;
  payment: any;
}) {
  const qc = useQueryClient();
  const [reason, setReason]   = useState('');
  const [type, setType]       = useState(payment?.payment_type ?? 'cash');
  const [date, setDate]       = useState(
    payment?.created_at ? new Date(payment.created_at).toISOString().slice(0, 10) : '',
  );
  const [number, setNumber]   = useState(payment?.payment_number ?? '');

  const update = useMutation({
    mutationFn: () => paymentsService.update(payment.id, {
      reason,
      paymentType:   type,
      paymentDate:   date ? new Date(`${date}T12:00:00`).toISOString() : undefined,
      paymentNumber: number || undefined,
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payment', payment.id] });
      void qc.invalidateQueries({ queryKey: ['payments'] });
      setReason('');
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Corregir pago">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Puedes corregir la forma de pago, la fecha y el número de comprobante. El monto no
          se puede cambiar porque ya está aplicado a facturas: para eso hay que anular el pago
          y registrarlo de nuevo.
        </p>

        <Select label="Forma de pago" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="card">Tarjeta</option>
          <option value="other">Otro</option>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha del pago"
            type="date"
            hint="La fecha real en que entró el dinero"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="N° de comprobante"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>

        <Input
          label="Motivo de la corrección"
          placeholder="Se registró como efectivo pero fue transferencia"
          hint="Queda en el historial del pago junto con tu nombre"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {update.isError && (
          <p className="text-xs text-danger-600">
            {(() => {
              const msg = (update.error as { response?: { data?: { message?: string | string[] } } })
                ?.response?.data?.message;
              return Array.isArray(msg) ? msg.join(', ') : msg ?? 'No se pudo guardar la corrección';
            })()}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            loading={update.isPending}
            disabled={reason.trim().length < 5}
            onClick={() => update.mutate()}
          >
            Guardar corrección
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
