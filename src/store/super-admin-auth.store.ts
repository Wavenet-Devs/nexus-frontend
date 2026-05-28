'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SAAuthUser {
  sub:        string;
  email:      string;
  name:       string;
  tenantSlug: string;
  roleSlug:   string;
}

interface SAAuthState {
  user:         SAAuthUser | null;
  accessToken:  string | null;
  refreshToken: string | null;
  isAuth:       boolean;
  setAuth: (user: SAAuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useSAAuthStore = create<SAAuthState>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isAuth:       false,

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sa_access_token',  accessToken);
          localStorage.setItem('sa_refresh_token', refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuth: true });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sa_access_token');
          localStorage.removeItem('sa_refresh_token');
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuth: false });
      },
    }),
    {
      name: 'nexus-sa-auth',
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        isAuth:       state.isAuth,
      }),
    },
  ),
);
