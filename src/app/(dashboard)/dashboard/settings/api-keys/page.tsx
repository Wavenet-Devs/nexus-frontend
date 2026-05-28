'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Check, Power, Trash2, Key, AlertTriangle } from 'lucide-react';
import { apiKeysService, type CreatedApiKey } from '@/services/api-keys.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

function NewKeyReveal({ apiKey }: { apiKey: CreatedApiKey }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 bg-warning-50 border border-warning-200 rounded-lg p-3">
        <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
        <p className="text-xs text-warning-700">
          Esta es la única vez que verás la clave completa. Guárdala en un lugar seguro ahora.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-neutral-900 rounded-lg px-4 py-3">
        <code className="flex-1 text-sm font-mono text-green-400 break-all select-all">{apiKey.key}</code>
        <button onClick={copy} className="text-neutral-400 hover:text-white transition-colors shrink-0">
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        Incluye la clave en el header <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">X-Api-Key: {apiKey.key.slice(0, 20)}…</code>
      </p>
    </div>
  );
}

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [createOpen,  setCreateOpen]  = useState(false);
  const [newKeyName,  setNewKeyName]  = useState('');
  const [createdKey,  setCreatedKey]  = useState<CreatedApiKey | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn:  apiKeysService.findAll,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => apiKeysService.create(name),
    onSuccess:  (key) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setCreateOpen(false);
      setNewKeyName('');
      setCreatedKey(key);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiKeysService.toggle(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeysService.revoke(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); setRevokeTarget(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-800">API Keys</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Claves para integración con sistemas externos (app móvil, pagos, etc.)
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nueva clave
        </Button>
      </div>

      {/* Clave recién creada */}
      {createdKey && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-primary-600" />
            <p className="text-sm font-semibold text-neutral-800">Clave creada: {createdKey.name}</p>
          </div>
          <NewKeyReveal apiKey={createdKey} />
          <div className="flex justify-end mt-4">
            <Button size="sm" onClick={() => setCreatedKey(null)}>Entendido, ya guardé la clave</Button>
          </div>
        </Card>
      )}

      {/* List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Nombre</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Creada</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {isLoading && (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-neutral-400">Cargando...</td></tr>
              )}
              {!isLoading && keys.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Key className="h-8 w-8 text-neutral-200 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">Sin API keys configuradas</p>
                  </td>
                </tr>
              )}
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium text-neutral-800">{k.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${k.status === 'active' ? 'text-primary-700' : 'text-neutral-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${k.status === 'active' ? 'bg-primary-500' : 'bg-neutral-300'}`} />
                      {k.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-neutral-500">
                    {new Date(k.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        title={k.status === 'active' ? 'Desactivar' : 'Activar'}
                        onClick={() => toggleMutation.mutate(k.id)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Revocar clave"
                        onClick={() => setRevokeTarget(k.id)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-danger-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Usage note */}
      <Card padding="md" className="bg-neutral-50 border-neutral-100">
        <p className="text-xs font-semibold text-neutral-600 mb-2">Uso de la API</p>
        <p className="text-xs text-neutral-500 mb-2">Incluye estos headers en cada request:</p>
        <pre className="text-xs font-mono bg-neutral-900 text-green-400 rounded-lg p-3 overflow-x-auto">{`Authorization: Bearer <token>
X-Api-Key: <tu-api-key>`}</pre>
        <p className="text-xs text-neutral-400 mt-2">
          Base URL: <code className="bg-neutral-100 px-1 rounded">{process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}</code>
        </p>
      </Card>

      {/* Create dialog */}
      {createOpen && (
        <Dialog open onClose={() => setCreateOpen(false)} title="Nueva API key">
          <div className="space-y-4">
            <Input
              label="Nombre de la clave"
              placeholder="ej: App móvil clientes, Sistema de pagos..."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newKeyName.trim()) createMutation.mutate(newKeyName.trim()); }}
            />
            <p className="text-xs text-neutral-400">
              Elige un nombre descriptivo que identifique qué sistema usará esta clave.
            </p>
            <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button
                size="sm"
                disabled={!newKeyName.trim()}
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate(newKeyName.trim())}
              >
                Crear clave
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Revoke confirm */}
      {revokeTarget && (
        <ConfirmDialog
          open
          onClose={() => setRevokeTarget(null)}
          onConfirm={() => revokeMutation.mutate(revokeTarget)}
          title="Revocar API key"
          description="Esta acción es irreversible. Cualquier sistema que use esta clave dejará de tener acceso inmediatamente."
          danger
        />
      )}
    </div>
  );
}
