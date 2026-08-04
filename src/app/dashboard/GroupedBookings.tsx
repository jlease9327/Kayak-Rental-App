"use client";

import { useState } from "react";
import { BookingRow } from "./BookingRow";
import { formatDayLabel } from "@/lib/dates";

type Booking = Parameters<typeof BookingRow>[0]["booking"];

export function GroupedBookings({
  bookings,
  defaultExpandedDates,
  emptyMessage,
}: {
  bookings: Booking[];
  defaultExpandedDates: string[];
  emptyMessage: string;
}) {
  const groups = groupByDate(bookings);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(defaultExpandedDates)
  );

  function toggle(date: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(({ date, items }) => {
        const isOpen = expanded.has(date);
        const deliveries = items.filter(
          (b) => b.fulfillmentType === "DELIVERY"
        ).length;

        return (
          <div
            key={date}
            className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
          >
            <button
              onClick={() => toggle(date)}
              className="flex w-full items-center justify-between bg-white p-4 text-left dark:bg-zinc-900"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatDayLabel(date)}
                </span>
                <span className="text-sm text-zinc-400">
                  {items.length} booking{items.length !== 1 ? "s" : ""}
                  {deliveries > 0
                    ? ` · ${deliveries} deliver${deliveries !== 1 ? "ies" : "y"}`
                    : ""}
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isOpen && (
              <div className="space-y-2 bg-zinc-50 p-3 dark:bg-zinc-950/40">
                {items.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function groupByDate(bookings: Booking[]) {
  const map = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = new Date(b.date).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}
