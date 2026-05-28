import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const saApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

saApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sa_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // Super-admin routes bypass tenant resolution — no X-Tenant-Slug header
  }
  return config;
});

saApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('sa_refresh_token');
        if (!refreshToken) throw new Error('no refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('sa_access_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return saApi(original);
      } catch {
        localStorage.removeItem('sa_access_token');
        localStorage.removeItem('sa_refresh_token');
        window.location.href = '/super-admin/login';
      }
    }
    return Promise.reject(error);
  },
);
