import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FORMAT_LABEL,
  STATE_LABEL,
  cr,
  fmtDate,
  timeLeft,
  type EventState,
} from "@/lib/enterprise";
import { loadEvents } from "@/lib/enterprise-api";
import { Card, PageHead, StateBadge, Table, Pill } from "@/components/console/shell";
import { useTick } from "@/hooks/use-tick";

export const Route = createFileRoute("/console/events/")({
  loader: () => loadEvents(),
  head: () => ({
    meta: [
      { title: "Sourcing Events — Auctions, RFx & Negotiations" },
      {
        name: "description",
        content:
          "Every forward auction, reverse auction, sealed bid, RFQ, RFI, RFP and negotiation in one filterable event register.",
      },
      { property: "og:title", content: "Sourcing Events Register" },
      {
        property: "og:description",
        content: "Filter events by state, direction, format, category and business unit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsList,
});

const GROUPS: { key: "all" | EventState; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
  { key: "live", label: "Live" },
  { key: "evaluation", label: "Evaluation" },
  { key: "awarded", label: "Awarded" },
];

function EventsList() {
  useTick(1000);
  const events = Route.useLoaderData();
  const now = Date.now();
  const [group, setGroup] = useState<"all" | EventState>("all");
  const [dir, setDir] = useState<"all" | "forward" | "reverse">("all");
  const [q, setQ] = useState("");

  const rows = events.filter(
    (e) =>
      (group === "all" || e.state === group) &&
      (dir === "all" || e.direction === dir) &&
      (q === "" ||
        `${e.title} ${e.id} ${e.category} ${e.owner}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <PageHead
        title="Sourcing events"
        subtitle="Forward and reverse auctions, sealed bids, RFQ/RFI/RFP, Dutch and Japanese clock events, BAFO rounds and negotiations."
        actions={
          <Link
            to="/console/events/new"
            className="rounded-full bg-[color:var(--auction)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Create event
          </Link>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setGroup(g.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                group === g.key
                  ? "bg-[color:var(--navy)] text-white"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {g.label}
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
          {(["all", "forward", "reverse"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDir(d)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                dir === d
                  ? "bg-[color:var(--accent-blue)] text-white"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {d === "all" ? "Both directions" : d}
            </button>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, ID, category, owner"
            className="ml-auto w-full rounded-full border border-border bg-background px-4 py-2 text-sm sm:w-72"
          />
        </div>
      </Card>

      <Card title={`${rows.length} event${rows.length === 1 ? "" : "s"}`}>
        <Table
          head={["Event", "Direction / format", "Baseline", "Best price", "Participants", "State", "Closes"]}
        >
          {rows.map((e) => (
            <tr key={e.id}>
              <td className="py-3 pr-4">
                <Link to="/console/events/$id" params={{ id: e.id }} className="font-semibold hover:underline">
                  {e.title}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {e.id} · {e.category} · {e.owner}
                </div>
              </td>
              <td className="py-3 pr-4 text-xs">
                <Pill tone={e.direction === "forward" ? "good" : "warn"}>
                  {e.direction === "forward" ? "Forward" : "Reverse"}
                </Pill>
                <div className="mt-1 text-muted-foreground">{FORMAT_LABEL[e.format]}</div>
              </td>
              <td className="py-3 pr-4">{cr(e.baseline)}</td>
              <td className="py-3 pr-4 font-semibold">{e.value ? cr(e.value) : "—"}</td>
              <td className="py-3 pr-4">
                {e.participants.filter((x) => x.accepted).length}/{e.participants.length}
              </td>
              <td className="py-3 pr-4">
                <StateBadge state={e.state} />
              </td>
              <td className="py-3 text-xs text-muted-foreground">
                {e.state === "live" ? (
                  <span className="font-semibold text-[color:var(--auction)]">{timeLeft(e.endAt, now)}</span>
                ) : (
                  fmtDate(e.endAt)
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                No events match these filters. Adjust the state, direction or search text.
              </td>
            </tr>
          )}
        </Table>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {(["draft", "live", "awarded"] as EventState[]).map((s) => (
          <Card key={s} title={STATE_LABEL[s]}>
            <p className="font-display text-3xl font-bold">
              {events.filter((e) => e.state === s).length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {s === "draft"
                ? "Complete publish validation to release these to vendors."
                : s === "live"
                  ? "Auto-extension and anti-sniping controls are enforced."
                  : "Awarded events flow to finance and fulfilment automatically."}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
