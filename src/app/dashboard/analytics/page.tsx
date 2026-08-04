import Link from "next/link";
import { getBookings } from "@/lib/actions";
import {
  addMonthsISO,
  currentMonthISO,
  monthLabel,
  monthRange,
} from "@/lib/dates";
import { SplitBar, RankedBarList, TimeOfDayChart, DataTable } from "./Charts";

const TIME_BUCKETS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function formatHourLabel(t: string) {
  const h = Number(t.split(":")[0]);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${period}`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = params.month || currentMonthISO();
  const { dateFrom, dateTo } = monthRange(month);

  const bookings = await getBookings({ dateFrom, dateTo });
  const active = bookings.filter((b) => b.status !== "CANCELLED");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");
  const paid = active.filter((b) => b.paymentStatus === "PAID");

  const revenue = paid.reduce((sum, b) => sum + b.totalPrice, 0);
  const avgBookingValue = paid.length > 0 ? revenue / paid.length : 0;
  const cancellationRate =
    bookings.length > 0 ? (cancelled.length / bookings.length) * 100 : 0;

  const pickupCount = active.filter((b) => b.fulfillmentType === "PICKUP").length;
  const deliveryCount = active.filter(
    (b) => b.fulfillmentType === "DELIVERY"
  ).length;

  const locationCounts = new Map<string, number>();
  for (const b of active) {
    const key = b.fulfillmentType === "DELIVERY" ? "Delivery" : b.location?.name ?? "Unknown";
    locationCounts.set(key, (locationCounts.get(key) ?? 0) + 1);
  }
  const locationRows = Array.from(locationCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const timeCounts = new Map(TIME_BUCKETS.map((t) => [t, 0]));
  for (const b of active) {
    if (timeCounts.has(b.startTime)) {
      timeCounts.set(b.startTime, (timeCounts.get(b.startTime) ?? 0) + 1);
    }
  }
  const timeBars = TIME_BUCKETS.map((t) => ({
    label: formatHourLabel(t),
    value: timeCounts.get(t) ?? 0,
  }));

  const isCurrentMonth = month === currentMonthISO();

  return (
    <div className="flex-1 bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Owner Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Monthly performance — pickup vs. delivery mix, peak times, and
          location demand.
        </p>

        <div className="mt-6 flex gap-2">
          <Link
            href="/dashboard"
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-600 transition dark:bg-zinc-800 dark:text-zinc-300"
          >
            Schedule
          </Link>
          <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
            Analytics
          </span>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <Link
            href={`/dashboard/analytics?month=${addMonthsISO(month, -1)}`}
            className="rounded-full px-3 py-1 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ← Prev
          </Link>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {monthLabel(month)}
          </span>
          {isCurrentMonth ? (
            <span className="px-3 py-1 text-sm text-zinc-300 dark:text-zinc-700">
              Next →
            </span>
          ) : (
            <Link
              href={`/dashboard/analytics?month=${addMonthsISO(month, 1)}`}
              className="rounded-full px-3 py-1 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Next →
            </Link>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Bookings" value={String(active.length)} />
          <StatCard label="Revenue (paid)" value={`$${revenue.toFixed(0)}`} />
          <StatCard
            label="Avg. booking"
            value={`$${avgBookingValue.toFixed(0)}`}
          />
          <StatCard
            label="Cancellation rate"
            value={`${cancellationRate.toFixed(0)}%`}
          />
        </div>

        <Section title="Pickup vs. delivery">
          <SplitBar
            segments={[
              { label: "Pickup", value: pickupCount, color: "blue" },
              { label: "Delivery", value: deliveryCount, color: "orange" },
            ]}
          />
          <DataTable
            headers={["Type", "Bookings"]}
            rows={[
              ["Pickup", pickupCount],
              ["Delivery", deliveryCount],
            ]}
          />
        </Section>

        <Section title="Hottest locations">
          <RankedBarList rows={locationRows} />
          <DataTable
            headers={["Location", "Bookings"]}
            rows={locationRows.map((r) => [r.label, r.value])}
          />
        </Section>

        <Section title="Busiest times">
          <TimeOfDayChart bars={timeBars} />
          <DataTable
            headers={["Start time", "Bookings"]}
            rows={timeBars.map((b) => [b.label, b.value])}
          />
        </Section>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
