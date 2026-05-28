'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  user:         AuthUser | null;
  accessToken:  string | null;
  refreshToken: string | null;
  tenantSlug:   string | null;
  isAuth:       boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      tenantSlug:   null,
      isAuth:       false,

      setAuth: (user, accessToken, refreshToken) => {
        // Sync con localStorage para el interceptor de axios
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('tenant_slug', user.tenantSlug);
        }
        set({ user, accessToken, refreshToken, tenantSlug: user.tenantSlug, isAuth: true });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('tenant_slug');
        }
        set({ user: null, accessToken: null, refreshToken: null, tenantSlug: null, isAuth: false });
      },
    }),
    {
      name:    'nexus-auth',
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        tenantSlug:   state.tenantSlug,
        isAuth:       state.isAuth,
      }),
    },
  ),
);
