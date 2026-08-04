import Link from "next/link";
import { getBookings, getLocations } from "@/lib/actions";
import { FilterBar } from "./FilterBar";
import { BookingRow } from "./BookingRow";
import { GroupedBookings } from "./GroupedBookings";
import {
  addDaysISO,
  firstOfMonthISO,
  formatTime,
  todayISO,
} from "@/lib/dates";

type SearchParams = {
  view?: string;
  range?: string;
  date?: string;
  locationId?: string;
  type?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const today = todayISO();
  const locationId = params.locationId;
  const fulfillmentType = params.type as "PICKUP" | "DELIVERY" | undefined;

  const isExactDate = !!params.date;
  const view = params.view === "history" ? "history" : "upcoming";
  const range = params.range ?? "week";

  let bookings;
  let mode: "flat" | "grouped";
  let groupOrder: "asc" | "desc" = "asc";
  let emptyMessage = "No bookings match these filters.";

  if (isExactDate) {
    bookings = await getBookings({
      date: params.date,
      locationId,
      fulfillmentType,
    });
    mode = "flat";
  } else if (view === "history") {
    const dateTo = addDaysISO(today, -1);
    const dateFrom =
      range === "week"
        ? addDaysISO(today, -7)
        : range === "month"
          ? firstOfMonthISO(today)
          : undefined;
    bookings = await getBookings({
      dateFrom,
      dateTo,
      locationId,
      fulfillmentType,
    });
    mode = "grouped";
    groupOrder = "desc";
    emptyMessage = "No past bookings in this range.";
  } else {
    bookings = await getBookings({
      dateFrom: today,
      locationId,
      fulfillmentType,
    });
    mode = "grouped";
    groupOrder = "asc";
    emptyMessage = "Nothing booked yet.";
  }

  const orderedBookings =
    mode === "grouped" && groupOrder === "desc"
      ? [...bookings].reverse()
      : bookings;

  const [locations, todaysDeliveries] = await Promise.all([
    getLocations(),
    getBookings({ date: today, fulfillmentType: "DELIVERY" }),
  ]);

  const activeDeliveriesToday = todaysDeliveries.filter(
    (b) => b.status !== "CANCELLED"
  );

  const revenue = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const deliveryCount = bookings.filter(
    (b) => b.fulfillmentType === "DELIVERY"
  ).length;

  return (
    <div className="flex-1 bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Owner Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Full rental schedule, delivery logistics, and booking status.
        </p>

        <div className="mt-6 flex gap-2">
          <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
            Schedule
          </span>
          <Link
            href="/dashboard/analytics"
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-600 transition dark:bg-zinc-800 dark:text-zinc-300"
          >
            Analytics
          </Link>
        </div>

        {activeDeliveriesToday.length > 0 && (
          <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/30">
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
              🚚 Today&apos;s deliveries ({activeDeliveriesToday.length})
            </p>
            <div className="mt-2 space-y-1.5">
              {activeDeliveriesToday.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-baseline gap-x-2 text-sm text-orange-900 dark:text-orange-200"
                >
                  <span className="font-semibold">{formatTime(d.startTime)}</span>
                  <span>—</span>
                  <span>{d.deliveryAddress}</span>
                  <span className="text-orange-600 dark:text-orange-400">
                    ({d.customerName}, {d.kayakCount} kayak
                    {d.kayakCount > 1 ? "s" : ""})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard label="Bookings shown" value={String(bookings.length)} />
          <StatCard label="Deliveries" value={String(deliveryCount)} />
          <StatCard label="Revenue (paid)" value={`$${revenue.toFixed(2)}`} />
        </div>

        <div className="mt-6">
          <FilterBar locations={locations} />
        </div>

        <div className="mt-4">
          {mode === "flat" ? (
            <div className="space-y-3">
              {bookings.length === 0 && (
                <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
                  {emptyMessage}
                </p>
              )}
              {bookings.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          ) : (
            <GroupedBookings
              bookings={orderedBookings}
              defaultExpandedDates={
                view === "upcoming"
                  ? [today, addDaysISO(today, 1)]
                  : []
              }
              emptyMessage={emptyMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
