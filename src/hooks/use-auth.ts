import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "seller" | "admin";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadRoles = async (userId: string | undefined) => {
      if (!userId) {
        if (active) setRoles([]);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (active) setRoles((data ?? []).map((r: { role: AppRole }) => r.role));
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // defer role fetch to avoid deadlocks in the callback
      setTimeout(() => loadRoles(s?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      loadRoles(data.session?.user?.id).finally(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const primaryRole: AppRole | null = roles.includes("admin")
    ? "admin"
    : roles.includes("seller")
      ? "seller"
      : roles.includes("buyer")
        ? "buyer"
        : null;

  return { loading, session, user: session?.user ?? null, roles, primaryRole };
}