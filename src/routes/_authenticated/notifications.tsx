import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notification centre — Scrapify Auctions" }] }),
  component: NotificationsPage,
});

type Notice = {
  id: string | number;
  title?: string;
  message?: string;
  body?: string;
  created_at?: string;
  at?: string;
  read?: boolean;
  is_read?: boolean;
  link?: string;
  action_url?: string;
};

function NotificationsPage() {
  const [items, setItems] = useState<Notice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const response = await api.getNotifications({ per_page: "50" });
      const data = response?.data;
      setItems(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load notifications.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    setItems(
      (current) => current?.map((item) => ({ ...item, read: true, is_read: true })) ?? current,
    );
  };

  const markRead = async (item: Notice) => {
    if (item.read || item.is_read) return;
    await api.markNotificationRead(item.id);
    setItems(
      (current) =>
        current?.map((entry) =>
          entry.id === item.id ? { ...entry, read: true, is_read: true } : entry,
        ) ?? current,
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Account and auction updates from the platform.
            </p>
          </div>
          <button
            onClick={() => void markAllRead()}
            disabled={!items?.length}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> Mark all read
          </button>
        </div>
        <div className="mt-6 card-soft overflow-hidden">
          {items === null && !error ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={() => void load()}
                className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-semibold"
              >
                Retry
              </button>
            </div>
          ) : !items?.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto h-6 w-6" />
              <p className="mt-2">No notifications yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const href = item.link ?? item.action_url;
                const content = (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">
                        {item.title ?? "Notification"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(item.created_at ?? item.at)
                          ? new Date(item.created_at ?? item.at ?? "").toLocaleString("en-IN")
                          : "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.message ?? item.body ?? ""}
                    </p>
                  </>
                );
                return (
                  <li
                    key={item.id}
                    onClick={() => void markRead(item)}
                    className={`px-5 py-4 ${item.read || item.is_read ? "" : "bg-[color:var(--auction)]/5"}`}
                  >
                    {href?.startsWith("/") ? <Link to={href as any}>{content}</Link> : content}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
