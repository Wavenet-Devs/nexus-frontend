import { saApi } from '@/lib/super-admin-api';

export interface TenantListItem {
  id:           string;
  slug:         string;
  name:         string;
  plan:         string;
  status:       string;
  primaryColor: string | null;
  logoUrl:      string | null;
  createdAt:    string;
}

export interface TenantDetail extends TenantListItem {
  secondaryColor: string | null;
  customDomain:   string | null;
  smtpHost:       string | null;
  smtpPort:       number | null;
  smtpUser:       string | null;
  smtpFromName:   string | null;
  smtpFromEmail:  string | null;
}

export interface CreateTenantDto {
  slug:            string;
  name:            string;
  adminName:       string;
  adminEmail:      string;
  adminPassword:   string;
  plan?:           'starter' | 'pro' | 'enterprise';
  primaryColor?:   string;
  secondaryColor?: string;
  logoUrl?:        string;
  customDomain?:   string;
  smtpHost?:       string;
  smtpPort?:       number;
  smtpUser?:       string;
  smtpPassword?:   string;
  smtpFromName?:   string;
  smtpFromEmail?:  string;
}

export type UpdateTenantDto = Omit<CreateTenantDto, 'slug' | 'adminName' | 'adminEmail' | 'adminPassword'>;

export const tenantsService = {
  findAll:      () => saApi.get<TenantListItem[]>('/super-admin/tenants').then((r) => r.data),
  findOne:      (id: string) => saApi.get<TenantDetail>(`/super-admin/tenants/${id}`).then((r) => r.data),
  create:       (dto: CreateTenantDto) => saApi.post<TenantDetail>('/super-admin/tenants', dto).then((r) => r.data),
  update:       (id: string, dto: UpdateTenantDto) => saApi.patch<TenantDetail>(`/super-admin/tenants/${id}`, dto).then((r) => r.data),
  toggleStatus: (id: string) => saApi.patch<TenantDetail>(`/super-admin/tenants/${id}/toggle-status`).then((r) => r.data),
};
