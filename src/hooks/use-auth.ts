import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export type AppRole = 'buyer' | 'seller' | 'admin';
export type AppUser = {
  id?: string | number;
  email?: string;
  name?: string;
  role?: string;
  roles?: string[];
  user_metadata?: { full_name?: string };
};

export interface AuthState {
  loading: boolean;
  user: AppUser | null;
  roles: string[];
  primaryRole: AppRole | null;
}

const AUTH_USER_STORAGE_KEY = "scrapify_authenticated_user";

function readCachedUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return value ? (JSON.parse(value) as AppUser) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: AppUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AppUser | null>(() => readCachedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!api.getToken()) {
        if (active) {
          cacheUser(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const response = await api.me();
        const next = (response.user ?? response.data?.user ?? null) as AppUser | null;
        if (active) {
          setUser(next);
          cacheUser(next);
        }
      } catch {
        // api.request already clears the token and emits the auth event for a
        // real 401. Keep the last verified identity for transient refresh or
        // network failures so protected pages do not render anonymous header
        // actions while their data is still on screen.
        if (active) {
          if (api.getToken()) setUser((current) => current ?? readCachedUser());
          else {
            cacheUser(null);
            setUser(null);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    window.addEventListener('scrapify:auth', load);
    return () => {
      active = false;
      window.removeEventListener('scrapify:auth', load);
    };
  }, []);

  const rawRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
  const roles = rawRoles.map((role) => String(role).toLowerCase());
  const internalRoles = ['admin', 'super_admin', 'operations', 'compliance', 'procurement_manager', 'finance_manager', 'technical_evaluator', 'auditor'];
  const primaryRole: AppRole | null = roles.some((role) => internalRoles.includes(role))
    ? 'admin'
    : roles.includes('seller')
      ? 'seller'
      : roles.includes('buyer')
        ? 'buyer'
        : null;

  return { loading, user, roles, primaryRole };
}
