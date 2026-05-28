'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Shield, KeyRound, Power, Pencil, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  usersService,
  type UserListItem,
  type Role,
  type RolePermission,
  type SystemModule,
} from '@/services/users.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      active ? 'bg-primary-50 text-primary-700' : 'bg-neutral-100 text-neutral-500'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary-500' : 'bg-neutral-400'}`} />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function RoleBadge({ role }: { role?: { name: string } | null }) {
  if (!role) return <span className="text-xs text-neutral-400 italic">Sin rol</span>;
  return (
    <span className="inline-block px-2 py-0.5 rounded bg-info-50 text-info-700 text-xs font-medium">
      {role.name}
    </span>
  );
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name:     z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  roleId:   z.string().optional(),
});

const editUserSchema = z.object({
  name:   z.string().min(2, 'Mínimo 2 caracteres'),
  email:  z.string().email('Email inválido'),
  roleId: z.string().optional(),
});

const createRoleSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerida'),
  newPassword:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path:    ['confirmPassword'],
});

type CreateUserForm   = z.infer<typeof createUserSchema>;
type EditUserForm     = z.infer<typeof editUserSchema>;
type CreateRoleForm   = z.infer<typeof createRoleSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// ─── Permissions Dialog ───────────────────────────────────────────────────────

function PermissionsDialog({
  role,
  onClose,
}: {
  role: Role;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const { data: modules = [] }     = useQuery({ queryKey: ['modules'],                     queryFn: usersService.findAllModules });
  const { data: perms = [], isLoading } = useQuery({ queryKey: ['role-permissions', role.id], queryFn: () => usersService.getPermissions(role.id) });

  const [local, setLocal] = useState<Record<string, { canAccess: boolean; canEdit: boolean; canAdd: boolean; canDelete: boolean }>>({});

  // Merge fetched perms into local state once loaded
  const merged = (mod: SystemModule) => {
    if (local[mod.id] !== undefined) return local[mod.id];
    const found = perms.find((p) => p.module_id === mod.id);
    return found
      ? { canAccess: found.can_access, canEdit: found.can_edit, canAdd: found.can_add, canDelete: found.can_delete }
      : { canAccess: false, canEdit: false, canAdd: false, canDelete: false };
  };

  const toggle = (modId: string, key: keyof ReturnType<typeof merged>) => {
    const current = merged(modules.find((m) => m.id === modId)!);
    const next = { ...current, [key]: !current[key] };
    // If turning off access, also clear edit/add/delete
    if (key === 'canAccess' && !next.canAccess) {
      next.canEdit = false; next.canAdd = false; next.canDelete = false;
    }
    setLocal((prev) => ({ ...prev, [modId]: next }));
  };

  const saveMutation = useMutation({
    mutationFn: () => usersService.setPermissions(role.id, {
      permissions: modules.map((mod) => ({ moduleId: mod.id, ...merged(mod) })),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['role-permissions', role.id] }); onClose(); },
  });

  const COLS: { key: keyof ReturnType<typeof merged>; label: string }[] = [
    { key: 'canAccess',  label: 'Ver'      },
    { key: 'canAdd',     label: 'Crear'    },
    { key: 'canEdit',    label: 'Editar'   },
    { key: 'canDelete',  label: 'Eliminar' },
  ];

  return (
    <Dialog open onClose={onClose} title={`Permisos: ${role.name}`} size="lg">
      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-sm text-neutral-400">Cargando...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-neutral-500 w-40">Módulo</th>
                  {COLS.map((c) => (
                    <th key={c.key} className="text-center py-2 px-3 text-xs font-semibold text-neutral-500 w-20">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {modules.map((mod) => {
                  const p = merged(mod);
                  return (
                    <tr key={mod.id} className="hover:bg-neutral-50">
                      <td className="py-2.5 pr-4 font-medium text-neutral-700 capitalize">{mod.name}</td>
                      {COLS.map((c) => (
                        <td key={c.key} className="text-center py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={p[c.key]}
                            disabled={c.key !== 'canAccess' && !p.canAccess}
                            onChange={() => toggle(mod.id, c.key)}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            Editar, Crear y Eliminar solo se pueden habilitar si el módulo tiene acceso.
          </p>
          <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-neutral-100">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Guardar permisos
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}

// ─── Reset Password Result Dialog ─────────────────────────────────────────────

function TempPasswordDialog({ tempPassword, onClose }: { tempPassword: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog open onClose={onClose} title="Contraseña temporal generada">
      <p className="text-sm text-neutral-600 mb-4">
        Comparte esta contraseña con el usuario. Solo se muestra una vez.
      </p>
      <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
        <span className="flex-1 font-mono text-sm font-semibold text-neutral-800 select-all">{tempPassword}</span>
        <button onClick={copy} className="text-neutral-400 hover:text-primary-600 transition-colors">
          {copied ? <Check className="h-4 w-4 text-primary-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex justify-end mt-4">
        <Button size="sm" onClick={onClose}>Cerrar</Button>
      </div>
    </Dialog>
  );
}

// ─── Change Password Dialog ───────────────────────────────────────────────────

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      await usersService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      onClose();
    } catch {
      setError('currentPassword', { message: 'Contraseña actual incorrecta' });
    }
  };

  return (
    <Dialog open onClose={onClose} title="Cambiar contraseña">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Input
            label="Contraseña actual"
            type={showCurrent ? 'text' : 'password'}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-8 text-neutral-400 hover:text-neutral-600"
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative">
          <Input
            label="Nueva contraseña"
            type={showNew ? 'text' : 'password'}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-8 text-neutral-400 hover:text-neutral-600"
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Input
          label="Confirmar nueva contraseña"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button type="submit" size="sm" loading={isSubmitting}>Cambiar contraseña</Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const qc       = useQueryClient();
  const selfId   = useAuthStore((s) => s.user?.sub);

  const [createOpen, setCreateOpen]     = useState(false);
  const [editTarget, setEditTarget]     = useState<UserListItem | null>(null);
  const [tempPw, setTempPw]             = useState<string | null>(null);
  const [changePwOpen, setChangePwOpen] = useState(false);

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersService.findAll() });
  const { data: roles  = [] }           = useQuery({ queryKey: ['roles'],  queryFn: usersService.findAllRoles });

  // ── Create form ──
  const createForm = useForm<CreateUserForm>({ resolver: zodResolver(createUserSchema) });
  const createMutation = useMutation({
    mutationFn: (data: CreateUserForm) => usersService.create({ ...data, roleId: data.roleId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setCreateOpen(false); createForm.reset(); },
  });

  // ── Edit form ──
  const editForm = useForm<EditUserForm>({ resolver: zodResolver(editUserSchema) });
  const openEdit = (u: UserListItem) => {
    setEditTarget(u);
    editForm.reset({ name: u.name, email: u.email, roleId: u.role?.id ?? '' });
  };
  const editMutation = useMutation({
    mutationFn: (data: EditUserForm) => usersService.update(editTarget!.id, { ...data, roleId: data.roleId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditTarget(null); },
  });

  // ── Toggle ──
  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersService.toggleStatus(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  // ── Reset password ──
  const resetMutation = useMutation({
    mutationFn: (id: string) => usersService.resetPassword(id),
    onSuccess:  (data) => setTempPw(data.tempPassword),
  });

  const activeRoles = roles.filter((r) => r.status === 'active');

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-500">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setChangePwOpen(true)}>
            <KeyRound className="h-4 w-4 mr-1.5" />
            Mi contraseña
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Nombre</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Correo</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Rol</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Creado</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {isLoading && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-neutral-400">Cargando...</td></tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-neutral-400">Sin usuarios registrados</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium text-neutral-800">{u.name}</td>
                  <td className="py-3 px-4 text-neutral-600">{u.email}</td>
                  <td className="py-3 px-4"><RoleBadge role={u.role} /></td>
                  <td className="py-3 px-4"><StatusChip status={u.status} /></td>
                  <td className="py-3 px-4 text-neutral-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        title="Editar"
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Resetear contraseña"
                        onClick={() => resetMutation.mutate(u.id)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-warning-600 transition-colors"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title={u.status === 'active' ? 'Desactivar' : 'Activar'}
                        disabled={u.id === selfId}
                        onClick={() => toggleMutation.mutate(u.id)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-danger-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create dialog */}
      {createOpen && (
        <Dialog open onClose={() => setCreateOpen(false)} title="Nuevo usuario">
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <Input label="Nombre completo" error={createForm.formState.errors.name?.message} {...createForm.register('name')} />
            <Input label="Correo electrónico" type="email" error={createForm.formState.errors.email?.message} {...createForm.register('email')} />
            <Input label="Contraseña" type="password" error={createForm.formState.errors.password?.message} {...createForm.register('password')} />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Rol</label>
              <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" {...createForm.register('roleId')}>
                <option value="">Sin rol</option>
                {activeRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" loading={createMutation.isPending}>Crear usuario</Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Edit dialog */}
      {editTarget && (
        <Dialog open onClose={() => setEditTarget(null)} title="Editar usuario">
          <form onSubmit={editForm.handleSubmit((d) => editMutation.mutate(d))} className="space-y-4">
            <Input label="Nombre completo" error={editForm.formState.errors.name?.message} {...editForm.register('name')} />
            <Input label="Correo electrónico" type="email" error={editForm.formState.errors.email?.message} {...editForm.register('email')} />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Rol</label>
              <select className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" {...editForm.register('roleId')}>
                <option value="">Sin rol</option>
                {activeRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditTarget(null)}>Cancelar</Button>
              <Button type="submit" size="sm" loading={editMutation.isPending}>Guardar cambios</Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Temp password */}
      {tempPw && <TempPasswordDialog tempPassword={tempPw} onClose={() => setTempPw(null)} />}

      {/* Change own password */}
      {changePwOpen && <ChangePasswordDialog onClose={() => setChangePwOpen(false)} />}
    </>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab() {
  const qc = useQueryClient();

  const [createOpen, setCreateOpen]   = useState(false);
  const [editTarget, setEditTarget]   = useState<Role | null>(null);
  const [permsTarget, setPermsTarget] = useState<Role | null>(null);

  const { data: roles = [], isLoading } = useQuery({ queryKey: ['roles'], queryFn: usersService.findAllRoles });

  const createForm = useForm<CreateRoleForm>({ resolver: zodResolver(createRoleSchema) });
  const editForm   = useForm<CreateRoleForm>({ resolver: zodResolver(createRoleSchema) });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleForm) => usersService.createRole(data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['roles'] }); setCreateOpen(false); createForm.reset(); },
  });

  const openEditRole = (r: Role) => { setEditTarget(r); editForm.reset({ name: r.name, slug: r.slug }); };
  const editMutation = useMutation({
    mutationFn: (data: CreateRoleForm) => usersService.updateRole(editTarget!.id, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['roles'] }); setEditTarget(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersService.toggleRoleStatus(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-500">{roles.length} rol{roles.length !== 1 ? 'es' : ''}</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Shield className="h-4 w-4 mr-1.5" />
          Nuevo rol
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Nombre</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Slug</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500">Estado</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {isLoading && (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-neutral-400">Cargando...</td></tr>
              )}
              {!isLoading && roles.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-neutral-400">Sin roles definidos</td></tr>
              )}
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-medium text-neutral-800">{r.name}</td>
                  <td className="py-3 px-4">
                    <code className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">{r.slug}</code>
                  </td>
                  <td className="py-3 px-4"><StatusChip status={r.status} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        title="Gestionar permisos"
                        onClick={() => setPermsTarget(r)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-primary-600 transition-colors"
                      >
                        <Shield className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Editar"
                        onClick={() => openEditRole(r)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title={r.status === 'active' ? 'Desactivar' : 'Activar'}
                        onClick={() => toggleMutation.mutate(r.id)}
                        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-danger-600 transition-colors"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create role */}
      {createOpen && (
        <Dialog open onClose={() => setCreateOpen(false)} title="Nuevo rol">
          <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <Input label="Nombre" error={createForm.formState.errors.name?.message} {...createForm.register('name')} />
            <div>
              <Input
                label="Slug"
                placeholder="ej: operador-lectura"
                error={createForm.formState.errors.slug?.message}
                {...createForm.register('slug')}
              />
              <p className="text-xs text-neutral-400 mt-1">Solo letras minúsculas, números y guiones.</p>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" loading={createMutation.isPending}>Crear rol</Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Edit role */}
      {editTarget && (
        <Dialog open onClose={() => setEditTarget(null)} title="Editar rol">
          <form onSubmit={editForm.handleSubmit((d) => editMutation.mutate(d))} className="space-y-4">
            <Input label="Nombre" error={editForm.formState.errors.name?.message} {...editForm.register('name')} />
            <div>
              <Input
                label="Slug"
                error={editForm.formState.errors.slug?.message}
                {...editForm.register('slug')}
              />
              <p className="text-xs text-neutral-400 mt-1">Solo letras minúsculas, números y guiones.</p>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-neutral-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditTarget(null)}>Cancelar</Button>
              <Button type="submit" size="sm" loading={editMutation.isPending}>Guardar cambios</Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Permissions dialog */}
      {permsTarget && <PermissionsDialog role={permsTarget} onClose={() => setPermsTarget(null)} />}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = ['Usuarios', 'Roles'] as const;
type Tab = typeof TABS[number];

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('Usuarios');

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Usuarios' && <UsersTab />}
      {tab === 'Roles'    && <RolesTab />}
    </div>
  );
}
