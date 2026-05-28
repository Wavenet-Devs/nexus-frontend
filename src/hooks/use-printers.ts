'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';

export interface PrinterInfo {
  id:          string;
  name:        string;
  connectedAt: string;
}

export interface UsePrintersReturn {
  printers:    PrinterInfo[];
  connected:   boolean;
  requestPrint: (printerId: string, text: string, paymentId?: string) => void;
  lastError:   string | null;
}

export function usePrinters(): UsePrintersReturn {
  const tenantSlug = useAuthStore((s) => s.tenantSlug);
  const [printers,  setPrinters]  = useState<PrinterInfo[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantSlug) return;

    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit('get-printers', { tenantSlug });
    };
    const onDisconnect = () => { setConnected(false); setPrinters([]); };
    const onPrinterList = (list: PrinterInfo[]) => setPrinters(list);
    const onPrintError  = (data: { message: string }) => setLastError(data.message);

    socket.on('connect',      onConnect);
    socket.on('disconnect',   onDisconnect);
    socket.on('printer-list', onPrinterList);
    socket.on('print-error',  onPrintError);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect',      onConnect);
      socket.off('disconnect',   onDisconnect);
      socket.off('printer-list', onPrinterList);
      socket.off('print-error',  onPrintError);
    };
  }, [tenantSlug]);

  const requestPrint = useCallback((printerId: string, text: string, paymentId?: string) => {
    if (!tenantSlug) return;
    setLastError(null);
    getSocket().emit('request-print', { tenantSlug, printerId, text, paymentId });
  }, [tenantSlug]);

  return { printers, connected, requestPrint, lastError };
}
