"use server";

import { prisma } from "@/lib/prisma";
import { calculatePricing } from "@/lib/pricing";
import { dateOnlyUTC, dayRangeUTC } from "@/lib/dates";
import { revalidatePath } from "next/cache";

export async function getLocations() {
  return prisma.location.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export async function checkAvailability(params: {
  locationId: string;
  date: string;
  startTime: string;
  durationHours: number;
  kayakCount: number;
}) {
  const location = await prisma.location.findUnique({
    where: { id: params.locationId },
  });
  if (!location) return { available: false, remaining: 0 };

  const { gte, lt } = dayRangeUTC(params.date);

  const existing = await prisma.booking.findMany({
    where: {
      locationId: params.locationId,
      date: { gte, lt },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  const reqStart = timeToMinutes(params.startTime);
  const reqEnd = reqStart + params.durationHours * 60;

  const overlapping = existing.filter((b) => {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = bStart + b.durationHours * 60;
    return reqStart < bEnd && bStart < reqEnd;
  });

  const reserved = overlapping.reduce((sum, b) => sum + b.kayakCount, 0);
  const remaining = location.kayakCount - reserved;

  return { available: remaining >= params.kayakCount, remaining };
}

export type BookingInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfillmentType: "PICKUP" | "DELIVERY";
  locationId?: string;
  deliveryAddress?: string;
  date: string;
  startTime: string;
  durationHours: number;
  kayakCount: number;
  notes?: string;
};

export async function createBooking(input: BookingInput) {
  if (input.fulfillmentType === "PICKUP") {
    const availability = await checkAvailability({
      locationId: input.locationId!,
      date: input.date,
      startTime: input.startTime,
      durationHours: input.durationHours,
      kayakCount: input.kayakCount,
    });
    if (!availability.available) {
      throw new Error(
        `Only ${availability.remaining} kayak(s) available for that time.`
      );
    }
  }

  const { basePrice, deliveryFee, totalPrice } = calculatePricing({
    durationHours: input.durationHours,
    kayakCount: input.kayakCount,
    fulfillmentType: input.fulfillmentType,
  });

  const booking = await prisma.booking.create({
    data: {
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      fulfillmentType: input.fulfillmentType,
      locationId: input.fulfillmentType === "PICKUP" ? input.locationId : null,
      deliveryAddress:
        input.fulfillmentType === "DELIVERY" ? input.deliveryAddress : null,
      date: dateOnlyUTC(input.date),
      startTime: input.startTime,
      durationHours: input.durationHours,
      kayakCount: input.kayakCount,
      basePrice,
      deliveryFee,
      totalPrice,
      notes: input.notes,
      // No online payment yet — reservations are auto-confirmed and paid
      // in person (cash/card/Venmo). Once Stripe is wired in, this should
      // go back to PENDING/UNPAID until a checkout session webhook fires.
      status: "CONFIRMED",
      paymentStatus: "UNPAID",
    },
  });

  return booking;
}

/**
 * Stand-in for a real Stripe Checkout Session confirmation webhook.
 * Swap this for `stripe.checkout.sessions.create` + webhook handling
 * when wiring in a live Stripe account.
 */
export async function confirmMockPayment(bookingId: string) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
      stripeSessionId: `demo_${bookingId}`,
    },
  });
  revalidatePath("/dashboard");
  return booking;
}

/** Owner marks a booking as paid after collecting cash/card/Venmo in person. */
export async function markBookingPaid(bookingId: string) {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentStatus: "PAID" },
  });
  revalidatePath("/dashboard");
}

export async function getBookings(filters?: {
  /** Exact calendar date. Takes precedence over dateFrom/dateTo. */
  date?: string;
  /** Inclusive range start. */
  dateFrom?: string;
  /** Inclusive range end. */
  dateTo?: string;
  locationId?: string;
  fulfillmentType?: "PICKUP" | "DELIVERY";
}) {
  let dateWhere: { gte?: Date; lt?: Date } | undefined;
  if (filters?.date) {
    dateWhere = dayRangeUTC(filters.date);
  } else if (filters?.dateFrom || filters?.dateTo) {
    dateWhere = {};
    if (filters.dateFrom) dateWhere.gte = dateOnlyUTC(filters.dateFrom);
    if (filters.dateTo) dateWhere.lt = dayRangeUTC(filters.dateTo).lt;
  }

  return prisma.booking.findMany({
    where: {
      ...(dateWhere ? { date: dateWhere } : {}),
      ...(filters?.locationId ? { locationId: filters.locationId } : {}),
      ...(filters?.fulfillmentType
        ? { fulfillmentType: filters.fulfillmentType }
        : {}),
    },
    include: { location: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function updateBookingStatus(
  bookingId: string,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
) {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });
  revalidatePath("/dashboard");
}
