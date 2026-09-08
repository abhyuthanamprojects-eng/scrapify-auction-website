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

export function useAuth(): AuthState {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!api.getToken()) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const response = await api.me();
        const next = (response.user ?? response.data?.user ?? null) as AppUser | null;
        if (active) setUser(next);
      } catch {
        api.setToken(null);
        if (active) setUser(null);
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
