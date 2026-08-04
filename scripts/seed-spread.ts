import { prisma } from "../src/lib/prisma";
import { calculatePricing } from "../src/lib/pricing";
import { addDaysISO, todayISO } from "../src/lib/dates";

async function main() {
  await prisma.booking.deleteMany();

  const locations = await prisma.location.findMany({ where: { active: true } });
  const today = todayISO();

  const specs = [
    { daysOffset: 0, name: "Alex Pickup", type: "PICKUP" as const, time: "10:00", hours: 2, kayaks: 2 },
    { daysOffset: 0, name: "Sam Delivery", type: "DELIVERY" as const, time: "14:00", hours: 3, kayaks: 1 },
    { daysOffset: 1, name: "Jordan Tomorrow", type: "PICKUP" as const, time: "09:00", hours: 4, kayaks: 3 },
    { daysOffset: 3, name: "Casey ThreeOut", type: "DELIVERY" as const, time: "11:00", hours: 2, kayaks: 2 },
    { daysOffset: 7, name: "Riley WeekOut", type: "PICKUP" as const, time: "13:00", hours: 1, kayaks: 1 },
    { daysOffset: 14, name: "Morgan TwoWeeks", type: "DELIVERY" as const, time: "15:00", hours: 3, kayaks: 4 },
    { daysOffset: -2, name: "Past TwoDaysAgo", type: "PICKUP" as const, time: "10:00", hours: 2, kayaks: 1 },
    { daysOffset: -10, name: "Past TenDaysAgo", type: "DELIVERY" as const, time: "12:00", hours: 2, kayaks: 2 },
    { daysOffset: -40, name: "Past LastMonth", type: "PICKUP" as const, time: "16:00", hours: 1, kayaks: 1 },
  ];

  for (const spec of specs) {
    const date = addDaysISO(today, spec.daysOffset);
    const pricing = calculatePricing({
      durationHours: spec.hours,
      kayakCount: spec.kayaks,
      fulfillmentType: spec.type,
    });
    await prisma.booking.create({
      data: {
        customerName: spec.name,
        customerEmail: `${spec.name.split(" ")[0].toLowerCase()}@example.com`,
        customerPhone: "555-000-0000",
        fulfillmentType: spec.type,
        locationId: spec.type === "PICKUP" ? locations[0].id : null,
        deliveryAddress: spec.type === "DELIVERY" ? "12 Test Delivery Rd" : null,
        date: new Date(`${date}T00:00:00.000Z`),
        startTime: spec.time,
        durationHours: spec.hours,
        kayakCount: spec.kayaks,
        basePrice: pricing.basePrice,
        deliveryFee: pricing.deliveryFee,
        totalPrice: pricing.totalPrice,
        status: spec.daysOffset < 0 ? "COMPLETED" : "CONFIRMED",
        paymentStatus: "PAID",
      },
    });
  }

  console.log(`Seeded ${specs.length} bookings spread across past and future.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
