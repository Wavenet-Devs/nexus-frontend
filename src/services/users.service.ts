import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface UserListItem {
  id:         string;
  name:       string;
  email:      string;
  status:     string;
  created_at: string;
  role?:      { id: string; name: string; slug: string } | null;
}

export interface Role {
  id:          string;
  name:        string;
  slug:        string;
  status:      string;
  user_count?: number;
}

export interface SystemModule {
  id:   string;
  name: string;
  slug: string;
}

export interface RolePermission {
  module_id:   string;
  module_name: string;
  module_slug: string;
  can_access:  boolean;
  can_edit:    boolean;
  can_add:     boolean;
  can_delete:  boolean;
}

export interface CreateUserDto {
  name:     string;
  email:    string;
  password: string;
  roleId?:  string;
}

export interface UpdateUserDto {
  name?:   string;
  email?:  string;
  roleId?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword:     string;
}

export interface SetPermissionsDto {
  permissions: {
    moduleId:   string;
    canAccess:  boolean;
    canEdit:    boolean;
    canAdd:     boolean;
    canDelete:  boolean;
  }[];
}

export const usersService = {
  // ── Usuarios ──────────────────────────────────────────────────────────────
  findAll:        (page = 1, limit = 50) =>
    api.get<PaginatedResponse<UserListItem>>('/users', { params: { page, limit } }).then((r) => r.data.data),
  findOne:        (id: string) =>
    api.get<UserListItem>(`/users/${id}`).then((r) => r.data),
  create:         (dto: CreateUserDto) =>
    api.post<UserListItem>('/users', dto).then((r) => r.data),
  update:         (id: string, dto: UpdateUserDto) =>
    api.patch<UserListItem>(`/users/${id}`, dto).then((r) => r.data),
  toggleStatus:   (id: string) =>
    api.patch<UserListItem>(`/users/${id}/toggle-status`).then((r) => r.data),
  resetPassword:  (id: string) =>
    api.patch<{ tempPassword: string }>(`/users/${id}/reset-password`).then((r) => r.data),
  changePassword: (dto: ChangePasswordDto) =>
    api.patch('/users/me/change-password', dto).then((r) => r.data),

  // ── Roles ─────────────────────────────────────────────────────────────────
  findAllRoles:   () =>
    api.get<Role[]>('/roles').then((r) => r.data),
  createRole:     (dto: { name: string; slug: string }) =>
    api.post<Role>('/roles', dto).then((r) => r.data),
  updateRole:     (id: string, dto: { name?: string; slug?: string }) =>
    api.patch<Role>(`/roles/${id}`, dto).then((r) => r.data),
  toggleRoleStatus: (id: string) =>
    api.patch<Role>(`/roles/${id}/toggle-status`).then((r) => r.data),

  // ── Permisos ──────────────────────────────────────────────────────────────
  getPermissions:  (roleId: string) =>
    api.get<RolePermission[]>(`/roles/${roleId}/permissions`).then((r) => r.data),
  setPermissions:  (roleId: string, dto: SetPermissionsDto) =>
    api.patch(`/roles/${roleId}/permissions`, dto).then((r) => r.data),

  // ── Módulos ───────────────────────────────────────────────────────────────
  findAllModules: () =>
    api.get<SystemModule[]>('/modules').then((r) => r.data),
};
