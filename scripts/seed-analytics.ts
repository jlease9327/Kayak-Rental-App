import { prisma } from "../src/lib/prisma";
import { calculatePricing } from "../src/lib/pricing";
import { currentMonthISO, dateOnlyUTC } from "../src/lib/dates";

async function main() {
  await prisma.booking.deleteMany();

  const locations = await prisma.location.findMany({ where: { active: true } });
  const [sunset, harbor, pine] = locations;
  const month = currentMonthISO();

  type Spec = {
    day: number;
    name: string;
    type: "PICKUP" | "DELIVERY";
    locationId?: string;
    time: string;
    hours: number;
    kayaks: number;
    status?: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  };

  const specs: Spec[] = [
    // Sunset Cove is clearly the hottest pickup spot this month
    { day: 2, name: "A Adams", type: "PICKUP", locationId: sunset.id, time: "10:00", hours: 2, kayaks: 2 },
    { day: 3, name: "B Baker", type: "PICKUP", locationId: sunset.id, time: "10:00", hours: 2, kayaks: 1 },
    { day: 5, name: "C Chen", type: "PICKUP", locationId: sunset.id, time: "11:00", hours: 3, kayaks: 2 },
    { day: 6, name: "D Diaz", type: "PICKUP", locationId: sunset.id, time: "10:00", hours: 1, kayaks: 1 },
    { day: 8, name: "E Evans", type: "PICKUP", locationId: sunset.id, time: "09:00", hours: 2, kayaks: 3 },
    { day: 9, name: "F Frank", type: "PICKUP", locationId: harbor.id, time: "13:00", hours: 2, kayaks: 2 },
    { day: 11, name: "G Green", type: "PICKUP", locationId: harbor.id, time: "13:00", hours: 1, kayaks: 1 },
    { day: 12, name: "H Hill", type: "PICKUP", locationId: pine.id, time: "16:00", hours: 1, kayaks: 1 },
    { day: 14, name: "I Ito", type: "DELIVERY", time: "14:00", hours: 3, kayaks: 2 },
    { day: 15, name: "J James", type: "DELIVERY", time: "14:00", hours: 2, kayaks: 1 },
    { day: 16, name: "K Kim", type: "DELIVERY", time: "15:00", hours: 2, kayaks: 2 },
    { day: 18, name: "L Lopez", type: "PICKUP", locationId: sunset.id, time: "10:00", hours: 2, kayaks: 2 },
    { day: 19, name: "M Moore", type: "PICKUP", locationId: sunset.id, time: "10:00", hours: 2, kayaks: 1 },
    { day: 20, name: "N Nguyen", type: "DELIVERY", time: "14:00", hours: 4, kayaks: 3 },
    { day: 21, name: "O Ortiz", type: "PICKUP", locationId: harbor.id, time: "13:00", hours: 2, kayaks: 2 },
    { day: 22, name: "P Patel", type: "PICKUP", locationId: pine.id, time: "16:00", hours: 1, kayaks: 1 },
    { day: 23, name: "Q Quinn", type: "PICKUP", locationId: sunset.id, time: "09:00", hours: 3, kayaks: 2 },
    { day: 24, name: "R Ruiz", type: "DELIVERY", time: "15:00", hours: 2, kayaks: 1 },
    { day: 25, name: "S Smith", type: "PICKUP", locationId: sunset.id, time: "10:00", hours: 2, kayaks: 2, status: "CANCELLED" },
    { day: 26, name: "T Tran", type: "PICKUP", locationId: harbor.id, time: "13:00", hours: 1, kayaks: 1, status: "CANCELLED" },
    { day: 27, name: "U Underwood", type: "PICKUP", locationId: sunset.id, time: "10:00", hours: 2, kayaks: 2 },
    { day: 28, name: "V Vega", type: "DELIVERY", time: "14:00", hours: 2, kayaks: 2 },
  ];

  for (const spec of specs) {
    const pricing = calculatePricing({
      durationHours: spec.hours,
      kayakCount: spec.kayaks,
      fulfillmentType: spec.type,
    });
    const dateStr = `${month}-${String(spec.day).padStart(2, "0")}`;
    await prisma.booking.create({
      data: {
        customerName: spec.name,
        customerEmail: `${spec.name.split(" ")[0].toLowerCase()}@example.com`,
        customerPhone: "555-000-0000",
        fulfillmentType: spec.type,
        locationId: spec.type === "PICKUP" ? spec.locationId : null,
        deliveryAddress: spec.type === "DELIVERY" ? "12 Test Delivery Rd" : null,
        date: dateOnlyUTC(dateStr),
        startTime: spec.time,
        durationHours: spec.hours,
        kayakCount: spec.kayaks,
        basePrice: pricing.basePrice,
        deliveryFee: pricing.deliveryFee,
        totalPrice: pricing.totalPrice,
        status: spec.status ?? "CONFIRMED",
        paymentStatus: spec.status === "CANCELLED" ? "REFUNDED" : "PAID",
      },
    });
  }

  console.log(`Seeded ${specs.length} bookings across ${month} for analytics testing.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
