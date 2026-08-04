"use client";

import { useMemo, useState, useTransition } from "react";
import { createBooking } from "@/lib/actions";
import { calculatePricing, DURATION_OPTIONS } from "@/lib/pricing";

type Location = {
  id: string;
  name: string;
  address: string;
  kayakCount: number;
};

type FulfillmentType = "PICKUP" | "DELIVERY";

const STEPS = ["Type", "Details", "Schedule", "Contact", "Confirm"] as const;

const TIME_SLOTS = [
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

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function BookingWizard({ locations }: { locations: Location[] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    totalPrice: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType | null>(null);
  const [locationId, setLocationId] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [kayakCount, setKayakCount] = useState(1);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const pricing = useMemo(
    () =>
      calculatePricing({
        durationHours,
        kayakCount,
        fulfillmentType: fulfillmentType ?? "PICKUP",
      }),
    [durationHours, kayakCount, fulfillmentType]
  );

  const selectedLocation = locations.find((l) => l.id === locationId);

  function goNext() {
    setError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function canProceedFromType() {
    return fulfillmentType !== null;
  }
  function canProceedFromDetails() {
    if (fulfillmentType === "PICKUP") return !!locationId;
    return deliveryAddress.trim().length > 5;
  }
  function canProceedFromSchedule() {
    return !!date && !!startTime && durationHours > 0 && kayakCount >= 1;
  }
  function canProceedFromContact() {
    return (
      customerName.trim().length > 1 &&
      /\S+@\S+\.\S+/.test(customerEmail) &&
      customerPhone.trim().length > 6
    );
  }
  function handleReserve() {
    if (!fulfillmentType) return;
    setError(null);
    startTransition(async () => {
      try {
        const booking = await createBooking({
          customerName,
          customerEmail,
          customerPhone,
          fulfillmentType,
          locationId: fulfillmentType === "PICKUP" ? locationId : undefined,
          deliveryAddress:
            fulfillmentType === "DELIVERY" ? deliveryAddress : undefined,
          date,
          startTime,
          durationHours,
          kayakCount,
          notes: notes || undefined,
        });
        setConfirmedBooking({
          id: booking.id,
          totalPrice: booking.totalPrice,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  if (confirmedBooking) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-zinc-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-7 w-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          You&apos;re booked!
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Save your booking ref for reference:{" "}
          <span className="font-mono">{confirmedBooking.id.slice(-8)}</span>
        </p>

        <div className="mt-6 space-y-2 rounded-xl bg-zinc-50 p-4 text-left text-sm dark:bg-zinc-800">
          <Row label="Type" value={fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"} />
          <Row
            label={fulfillmentType === "PICKUP" ? "Location" : "Delivery address"}
            value={
              fulfillmentType === "PICKUP"
                ? selectedLocation?.name ?? ""
                : deliveryAddress
            }
          />
          <Row label="Date" value={date} />
          <Row label="Time" value={`${formatTime(startTime)} · ${durationHours}h`} />
          <Row label="Kayaks" value={String(kayakCount)} />
          <Row
            label="Due at pickup/delivery"
            value={`$${confirmedBooking.totalPrice.toFixed(2)}`}
            strong
          />
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          Cash, card, or Venmo accepted — payment is collected in person.
        </p>

        <a
          href="/book"
          className="mt-6 inline-block text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
        >
          Book another rental
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 sm:p-8">
      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium text-zinc-400">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={i <= stepIndex ? "text-sky-600 dark:text-sky-400" : ""}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-1.5 rounded-full bg-sky-600 transition-all"
            style={{
              width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {stepIndex === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            How would you like your kayak?
          </h2>
          <button
            onClick={() => setFulfillmentType("PICKUP")}
            className={`w-full rounded-xl border-2 p-4 text-left transition ${
              fulfillmentType === "PICKUP"
                ? "border-sky-600 bg-sky-50 dark:bg-sky-950/40"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              Pickup
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Grab it from one of our launch locations
            </p>
          </button>
          <button
            onClick={() => setFulfillmentType("DELIVERY")}
            className={`w-full rounded-xl border-2 p-4 text-left transition ${
              fulfillmentType === "DELIVERY"
                ? "border-sky-600 bg-sky-50 dark:bg-sky-950/40"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              Delivery (+${25})
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              We&apos;ll drop the kayak(s) at your address
            </p>
          </button>
        </div>
      )}

      {stepIndex === 1 && fulfillmentType === "PICKUP" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Choose a pickup location
          </h2>
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setLocationId(loc.id)}
              className={`w-full rounded-xl border-2 p-4 text-left transition ${
                locationId === loc.id
                  ? "border-sky-600 bg-sky-50 dark:bg-sky-950/40"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                {loc.name}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {loc.address}
              </p>
            </button>
          ))}
        </div>
      )}

      {stepIndex === 1 && fulfillmentType === "DELIVERY" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Where should we deliver?
          </h2>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Street address, city, any access notes"
            rows={3}
            className="w-full rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      )}

      {stepIndex === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Pick your date & time
          </h2>
          <div>
            <label className="text-xs font-medium text-zinc-500">Date</label>
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Start time
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Duration
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => setDurationHours(h)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    durationHours === h
                      ? "bg-sky-600 text-white"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Number of kayaks
            </label>
            <div className="mt-1 flex items-center gap-3">
              <button
                onClick={() => setKayakCount((n) => Math.max(1, n - 1))}
                className="h-9 w-9 rounded-full bg-zinc-100 text-lg font-semibold dark:bg-zinc-800"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold">
                {kayakCount}
              </span>
              <button
                onClick={() => setKayakCount((n) => Math.min(8, n + 1))}
                className="h-9 w-9 rounded-full bg-zinc-100 text-lg font-semibold dark:bg-zinc-800"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {stepIndex === 3 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Your contact info
          </h2>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone"
            type="tel"
            className="w-full rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else we should know? (optional)"
            rows={2}
            className="w-full rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      )}

      {stepIndex === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Review & reserve
          </h2>

          <div className="space-y-1.5 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-800">
            <Row label="Type" value={fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"} />
            <Row
              label={fulfillmentType === "PICKUP" ? "Location" : "Address"}
              value={
                fulfillmentType === "PICKUP"
                  ? selectedLocation?.name ?? ""
                  : deliveryAddress
              }
            />
            <Row label="When" value={`${date} · ${formatTime(startTime)} · ${durationHours}h`} />
            <Row label="Kayaks" value={String(kayakCount)} />
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
            <Row label="Rental" value={`$${pricing.basePrice.toFixed(2)}`} />
            {pricing.deliveryFee > 0 && (
              <Row label="Delivery fee" value={`$${pricing.deliveryFee.toFixed(2)}`} />
            )}
            <Row label="Total due" value={`$${pricing.totalPrice.toFixed(2)}`} strong />
          </div>

          <p className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No payment needed to reserve — we collect cash, card, or Venmo
            when you {fulfillmentType === "DELIVERY" ? "receive your delivery" : "pick up"}.
          </p>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={handleReserve}
            disabled={isPending}
            className="w-full rounded-full bg-sky-600 py-3 text-base font-semibold text-white transition hover:bg-sky-700 disabled:opacity-40"
          >
            {isPending ? "Reserving…" : "Reserve My Kayak"}
          </button>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        {stepIndex > 0 ? (
          <button
            onClick={goBack}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {stepIndex < STEPS.length - 1 && (
          <button
            onClick={goNext}
            disabled={
              (stepIndex === 0 && !canProceedFromType()) ||
              (stepIndex === 1 && !canProceedFromDetails()) ||
              (stepIndex === 2 && !canProceedFromSchedule()) ||
              (stepIndex === 3 && !canProceedFromContact())
            }
            className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition disabled:opacity-30 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span
        className={
          strong
            ? "font-semibold text-zinc-900 dark:text-zinc-50"
            : "text-zinc-700 dark:text-zinc-200"
        }
      >
        {value}
      </span>
    </div>
  );
}
