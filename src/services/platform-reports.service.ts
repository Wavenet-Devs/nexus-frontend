import { saApi } from '@/lib/super-admin-api';

export interface PlatformOverview {
  tenants: {
    total:    number;
    active:   number;
    inactive: number;
    by_plan:  Record<string, number>;
  };
  clients_total:   number;
  invoices_total:  number;
  billed_total:    number;
  collected_total: number;
  debt_total:      number;
}

export interface TenantStats {
  id:              string;
  slug:            string;
  name:            string;
  plan:            string;
  status:          string;
  primaryColor:    string | null;
  createdAt:       string;
  clients_count:   number;
  invoices_count:  number;
  billed_total:    number;
  collected_total: number;
  debt_total:      number;
}

export interface GrowthPoint {
  month:      string;
  new:        number;
  cumulative: number;
}

export const platformReportsService = {
  getOverview:     () => saApi.get<PlatformOverview>('/super-admin/reports/overview').then((r) => r.data),
  getTenantsStats: () => saApi.get<TenantStats[]>('/super-admin/reports/tenants-stats').then((r) => r.data),
  getGrowth:       () => saApi.get<GrowthPoint[]>('/super-admin/reports/growth').then((r) => r.data),
};
