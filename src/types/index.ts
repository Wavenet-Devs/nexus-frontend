// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  sub:        string;
  email:      string;
  name:       string;
  tenantSlug: string;
  roleSlug:   string;
}

export interface LoginResponse {
  accessToken:  string;
  refreshToken: string;
  user:         AuthUser;
}

// ─── Tenant ───────────────────────────────────────────────────────────────────

export interface Tenant {
  id:        string;
  name:      string;
  slug:      string;
  status:    string;
  createdAt: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export interface Client {
  id:             string;
  contract:       string;
  name:           string;
  address:        string;
  phone?:         string;
  email?:         string;
  active:         boolean;
  stratum_name?:  string;
  stratum_code?:  string;
  neighborhood_name?: string;
  meter_serial?:  string;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id:            string;
  client_id:     string;
  client_name:   string;
  contract:      string;
  month:         number;
  year:          number;
  total:         number;
  balance:       number;
  status:        string;
  emission:      string;
  payment_limit: string;
  stratum_name?: string;
  neighborhood_name?: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id:             string;
  client_id:      string;
  client_name:    string;
  contract:       string;
  amount:         number;
  payment_type:   string;
  payment_number?: string;
  created_at:     string;
}

// ─── Reading ──────────────────────────────────────────────────────────────────

export interface Reading {
  id:            string;
  month:         number;
  year:          number;
  total_clients: number;
  status:        string;
  created_at:    string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  billing: {
    total_invoices:  number;
    unpaid:          number;
    paid:            number;
    total_billed:    number;
    total_pending:   number;
  };
  payments: {
    total_payments:   number;
    total_collected:  number;
  };
  debt: {
    clients_with_debt: number;
  };
  financing: {
    active_plans:          number;
    total_financed_balance: number;
  };
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data:     T[];
  total:    number;
  page:     number;
  lastPage: number;
}

// ─── Printer ──────────────────────────────────────────────────────────────────

export interface Printer {
  id:          string;
  name:        string;
  connectedAt: string;
}
