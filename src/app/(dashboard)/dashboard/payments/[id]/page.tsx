'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, CreditCard, CheckCircle2, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import { paymentsService } from '@/services/payments.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatMonth } from '@/lib/utils';
import { usePrinters } from '@/hooks/use-printers';

const PAYMENT_TYPES: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' };
const TYPE_COLORS:   Record<string, string>  = {
  cash:     'bg-green-100 text-green-700',
  transfer: 'bg-blue-100 text-blue-700',
  card:     'bg-purple-100 text-purple-700',
};

function buildVoucherText(payment: any): string {
  const line  = '--------------------------------';
  const date  = new Date(payment.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  const type  = PAYMENT_TYPES[payment.payment_type] ?? payment.payment_type;

  const invoicesText = (payment.invoices ?? [])
    .map((i: any) => `  ${formatMonth(i.month, i.year).padEnd(16)}${formatCurrency(i.allocated).padStart(12)}`)
    .join('\n');

  return [
    '         RECIBO DE PAGO',
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

  const { printers, connected, requestPrint, lastError } = usePrinters();

  if (isLoading) return <PageSkeleton />;
  if (!payment) return null;

  const handlePrintThermal = (printerId: string) => {
    if (!payment) return;
    requestPrint(printerId, buildVoucherText(payment), payment.id);
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
