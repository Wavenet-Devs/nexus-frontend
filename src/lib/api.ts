import axios from 'axios';

/** Relativa (/api/v1) en producción same-origin; absoluta en desarrollo. */
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Inyectar token y tenant en cada request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const slug = localStorage.getItem('tenant_slug');
    if (slug) config.headers['X-Tenant-Slug'] = slug;
  }
  return config;
});

// Refresh token automático en 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Un 401 de login/recuperación es "credenciales inválidas", no una sesión
    // vencida: se devuelve tal cual para que el formulario muestre el error.
    const isAuthCall = /\/auth\/(login|refresh|forgot-password|reset-password)/.test(original?.url ?? '');
    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('no refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('access_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
