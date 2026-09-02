import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (!api.getToken()) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href, mode: "signin" as const },
      });
    }
    try {
      const response = await api.me();
      return { user: response.user ?? response.data?.user };
    } catch {
      api.setToken(null);
      throw redirect({
        to: "/auth",
        search: { redirect: location.href, mode: "signin" as const },
      });
    }
  },
  component: () => <Outlet />,
});
