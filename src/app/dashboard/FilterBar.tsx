"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Location = { id: string; name: string };

export function FilterBar({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const date = searchParams.get("date") ?? "";
  const view = searchParams.get("view") === "history" ? "history" : "upcoming";
  const range = searchParams.get("range") ?? "week";
  const locationId = searchParams.get("locationId") ?? "";
  const type = searchParams.get("type") ?? "";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <TabButton
          active={!date && view === "upcoming"}
          onClick={() => setParams({ view: "", date: "", range: "" })}
        >
          Upcoming
        </TabButton>
        <TabButton
          active={!date && view === "history"}
          onClick={() => setParams({ view: "history", date: "" })}
        >
          History
        </TabButton>
      </div>

      {!date && view === "history" && (
        <div className="flex gap-2">
          <RangeButton
            active={range === "week"}
            onClick={() => setParams({ range: "week" })}
          >
            This week
          </RangeButton>
          <RangeButton
            active={range === "month"}
            onClick={() => setParams({ range: "month" })}
          >
            This month
          </RangeButton>
          <RangeButton
            active={range === "all"}
            onClick={() => setParams({ range: "all" })}
          >
            All time
          </RangeButton>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setParams({ date: e.target.value })}
          className="rounded-lg border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {date && (
          <button
            onClick={() => setParams({ date: "" })}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Clear date
          </button>
        )}
        <select
          value={locationId}
          onChange={(e) => setParams({ locationId: e.target.value })}
          className="rounded-lg border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setParams({ type: e.target.value })}
          className="rounded-lg border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Pickup & delivery</option>
          <option value="PICKUP">Pickup only</option>
          <option value="DELIVERY">Delivery only</option>
        </select>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function RangeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-sky-600 text-white"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}
