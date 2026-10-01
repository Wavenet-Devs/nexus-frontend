import { api } from '@/lib/api';

export interface CatalogItem {
  id:      string;
  name:    string;
  code?:   string;
  status:  string;
}

export interface Stratum extends CatalogItem {
  billing_type:   string;
  public_percent: number;
}

export interface Causal {
  id:          string;
  name:        string;
  code?:       number;
  result_mode: 'ZERO_READING' | 'NO_READING' | 'READING_ALLOWED';
  status:      string;
}

export interface Meter {
  id:      string;
  mark:    string;
  factor:  string | null;
  status:  string;
}

export interface UnitCost {
  id:           string;
  generation:   number;
  distribution: number;
  marketing:    number;
  losses:       number;
  cu:           number;
  status:       'active' | 'inactive';
  created_at:   string;
}

export const catalogsService = {
  // ── Estratos ──────────────────────────────────────────────────────────────
  getStratums:     () => api.get<Stratum[]>('/catalogs/stratums').then((r) => r.data),
  createStratum:   (dto: any) => api.post<Stratum>('/catalogs/stratums', dto).then((r) => r.data),
  updateStratum:   (id: string, dto: any) => api.patch<Stratum>(`/catalogs/stratums/${id}`, dto).then((r) => r.data),
  toggleStratum:   (id: string) => api.patch<Stratum>(`/catalogs/stratums/${id}/toggle-status`).then((r) => r.data),

  // ── Causales ──────────────────────────────────────────────────────────────
  getCausals:      () => api.get<Causal[]>('/catalogs/causals').then((r) => r.data),
  createCausal:    (dto: any) => api.post<Causal>('/catalogs/causals', dto).then((r) => r.data),
  updateCausal:    (id: string, dto: any) => api.patch<Causal>(`/catalogs/causals/${id}`, dto).then((r) => r.data),
  toggleCausal:    (id: string) => api.patch<Causal>(`/catalogs/causals/${id}/toggle-status`).then((r) => r.data),

  // ── Medidores ─────────────────────────────────────────────────────────────
  getMeters:       () => api.get<Meter[]>('/catalogs/meters').then((r) => r.data),
  createMeter:     (dto: any) => api.post<Meter>('/catalogs/meters', dto).then((r) => r.data),
  updateMeter:     (id: string, dto: any) => api.patch<Meter>(`/catalogs/meters/${id}`, dto).then((r) => r.data),
  toggleMeter:     (id: string) => api.patch<Meter>(`/catalogs/meters/${id}/toggle-status`).then((r) => r.data),

  // ── Circuitos ─────────────────────────────────────────────────────────────
  getCircuits:     () => api.get<CatalogItem[]>('/catalogs/circuits').then((r) => r.data),
  createCircuit:   (dto: any) => api.post<CatalogItem>('/catalogs/circuits', dto).then((r) => r.data),
  updateCircuit:   (id: string, dto: any) => api.patch<CatalogItem>(`/catalogs/circuits/${id}`, dto).then((r) => r.data),
  toggleCircuit:   (id: string) => api.patch<CatalogItem>(`/catalogs/circuits/${id}/toggle-status`).then((r) => r.data),

  // ── Rutas ─────────────────────────────────────────────────────────────────
  getRoutes:       () => api.get<CatalogItem[]>('/catalogs/routes').then((r) => r.data),
  createRoute:     (dto: any) => api.post<CatalogItem>('/catalogs/routes', dto).then((r) => r.data),
  updateRoute:     (id: string, dto: any) => api.patch<CatalogItem>(`/catalogs/routes/${id}`, dto).then((r) => r.data),
  toggleRoute:     (id: string) => api.patch<CatalogItem>(`/catalogs/routes/${id}/toggle-status`).then((r) => r.data),

  // ── Barrios ───────────────────────────────────────────────────────────────
  getNeighborhoods:    () => api.get<CatalogItem[]>('/catalogs/neighborhoods').then((r) => r.data),
  createNeighborhood:  (dto: any) => api.post<CatalogItem>('/catalogs/neighborhoods', dto).then((r) => r.data),
  updateNeighborhood:  (id: string, dto: any) => api.patch<CatalogItem>(`/catalogs/neighborhoods/${id}`, dto).then((r) => r.data),
  toggleNeighborhood:  (id: string) => api.patch<CatalogItem>(`/catalogs/neighborhoods/${id}/toggle-status`).then((r) => r.data),

  // ── Tipos de identificación ───────────────────────────────────────────────
  getIdentificationTypes:   () => api.get<CatalogItem[]>('/catalogs/identification-types').then((r) => r.data),
  createIdentificationType: (dto: any) => api.post<CatalogItem>('/catalogs/identification-types', dto).then((r) => r.data),
  updateIdentificationType: (id: string, dto: any) => api.patch<CatalogItem>(`/catalogs/identification-types/${id}`, dto).then((r) => r.data),
  toggleIdentificationType: (id: string) => api.patch<CatalogItem>(`/catalogs/identification-types/${id}/toggle-status`).then((r) => r.data),

  // ── Métodos de cálculo ────────────────────────────────────────────────────
  getCalculationMethods:    () => api.get<CatalogItem[]>('/catalogs/calculation-methods').then((r) => r.data),
  createCalculationMethod:  (dto: any) => api.post<CatalogItem>('/catalogs/calculation-methods', dto).then((r) => r.data),
  updateCalculationMethod:  (id: string, dto: any) => api.patch<CatalogItem>(`/catalogs/calculation-methods/${id}`, dto).then((r) => r.data),
  toggleCalculationMethod:  (id: string) => api.patch<CatalogItem>(`/catalogs/calculation-methods/${id}/toggle-status`).then((r) => r.data),

  // ── Costos de proveedor ───────────────────────────────────────────────────
  getUnitCosts:      () => api.get<UnitCost[]>('/catalogs/unit-costs').then((r) => r.data),
  getActiveUnitCost: () => api.get<UnitCost>('/catalogs/unit-costs/active').then((r) => r.data),
  createUnitCost:    (dto: any) => api.post<UnitCost>('/catalogs/unit-costs', dto).then((r) => r.data),

  // ── Configuración ─────────────────────────────────────────────────────────
  getSettings:    () => api.get<any>('/catalogs/settings').then((r) => r.data),
  updateSettings: (dto: any) => api.patch<any>('/catalogs/settings', dto).then((r) => r.data),
};
