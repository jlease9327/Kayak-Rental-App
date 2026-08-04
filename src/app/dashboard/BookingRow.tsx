"use client";

import { useTransition } from "react";
import { updateBookingStatus, markBookingPaid } from "@/lib/actions";
import { formatTime } from "@/lib/dates";

type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fulfillmentType: "PICKUP" | "DELIVERY";
  deliveryAddress: string | null;
  location: { name: string; address: string } | null;
  date: Date;
  startTime: string;
  durationHours: number;
  kayakCount: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  notes: string | null;
};


const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  CONFIRMED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  COMPLETED: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function BookingRow({ booking }: { booking: Booking }) {
  const [isPending, startTransition] = useTransition();

  function setStatus(status: "CONFIRMED" | "CANCELLED" | "COMPLETED") {
    startTransition(async () => {
      await updateBookingStatus(booking.id, status);
    });
  }

  function markPaid() {
    startTransition(async () => {
      await markBookingPaid(booking.id);
    });
  }

  const isDelivery = booking.fulfillmentType === "DELIVERY";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isDelivery
          ? "border-orange-200 bg-orange-50/60 dark:border-orange-900/50 dark:bg-orange-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {formatTime(booking.startTime)}
            </span>
            <span className="text-sm text-zinc-400">
              · {booking.durationHours}h · {booking.kayakCount} kayak
              {booking.kayakCount > 1 ? "s" : ""}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                isDelivery
                  ? "bg-orange-200 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300"
                  : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
              }`}
            >
              {isDelivery ? "🚚 Delivery" : "Pickup"}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {booking.customerName}
          </p>
          <p className="text-xs text-zinc-400">
            {booking.customerPhone} · {booking.customerEmail}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {isDelivery ? booking.deliveryAddress : booking.location?.name}
          </p>
          {booking.notes && (
            <p className="mt-1 text-xs italic text-zinc-400">
              &ldquo;{booking.notes}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            ${booking.totalPrice.toFixed(2)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[booking.status]}`}
          >
            {booking.status}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              booking.paymentStatus === "PAID"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {booking.paymentStatus}
          </span>
        </div>
      </div>

      {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
        <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {booking.status === "PENDING" && (
            <button
              disabled={isPending}
              onClick={() => setStatus("CONFIRMED")}
              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
            >
              Confirm
            </button>
          )}
          {booking.paymentStatus === "UNPAID" && (
            <button
              disabled={isPending}
              onClick={markPaid}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-40 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              Mark as paid
            </button>
          )}
          <button
            disabled={isPending}
            onClick={() => setStatus("COMPLETED")}
            className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 dark:bg-zinc-200 dark:text-zinc-900"
          >
            Mark completed
          </button>
          <button
            disabled={isPending}
            onClick={() => setStatus("CANCELLED")}
            className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 disabled:opacity-40 dark:bg-red-950/40 dark:text-red-400"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
