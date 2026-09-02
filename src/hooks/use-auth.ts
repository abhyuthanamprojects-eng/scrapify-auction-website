import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export type AppRole = 'buyer' | 'seller' | 'admin';
export type AppUser = {
  id?: string | number;
  email?: string;
  name?: string;
  role?: AppRole;
  roles?: AppRole[];
  user_metadata?: { full_name?: string };
};

export interface AuthState {
  loading: boolean;
  user: AppUser | null;
  roles: AppRole[];
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

  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
  const primaryRole: AppRole | null = roles.includes('admin')
    ? 'admin'
    : roles.includes('seller')
      ? 'seller'
      : roles.includes('buyer')
        ? 'buyer'
        : null;

  return { loading, user, roles, primaryRole };
}
