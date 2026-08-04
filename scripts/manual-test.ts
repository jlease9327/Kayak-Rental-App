import { prisma } from "../src/lib/prisma";
import { calculatePricing } from "../src/lib/pricing";

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const locations = await prisma.location.findMany({ where: { active: true } });
  const pickupLocation = locations[0];

  const pickupPricing = calculatePricing({
    durationHours: 2,
    kayakCount: 2,
    fulfillmentType: "PICKUP",
  });
  const pickupBooking = await prisma.booking.create({
    data: {
      customerName: "Alex Pickup",
      customerEmail: "alex@example.com",
      customerPhone: "555-111-2222",
      fulfillmentType: "PICKUP",
      locationId: pickupLocation.id,
      date: new Date(today),
      startTime: "10:00",
      durationHours: 2,
      kayakCount: 2,
      basePrice: pickupPricing.basePrice,
      deliveryFee: pickupPricing.deliveryFee,
      totalPrice: pickupPricing.totalPrice,
      status: "CONFIRMED",
      paymentStatus: "PAID",
    },
  });
  console.log("Created pickup booking:", pickupBooking.id, pickupBooking.totalPrice);

  const deliveryPricing = calculatePricing({
    durationHours: 3,
    kayakCount: 1,
    fulfillmentType: "DELIVERY",
  });
  const deliveryBooking = await prisma.booking.create({
    data: {
      customerName: "Sam Delivery",
      customerEmail: "sam@example.com",
      customerPhone: "555-333-4444",
      fulfillmentType: "DELIVERY",
      deliveryAddress: "77 Lakeshore Dr, Lakeside",
      date: new Date(today),
      startTime: "14:00",
      durationHours: 3,
      kayakCount: 1,
      basePrice: deliveryPricing.basePrice,
      deliveryFee: deliveryPricing.deliveryFee,
      totalPrice: deliveryPricing.totalPrice,
      status: "PENDING",
      paymentStatus: "PAID",
    },
  });
  console.log(
    "Created delivery booking:",
    deliveryBooking.id,
    deliveryBooking.totalPrice
  );

  // Sanity-check pricing math
  if (pickupBooking.totalPrice !== 60) throw new Error("Pickup pricing wrong, expected 60");
  if (deliveryBooking.totalPrice !== 70) throw new Error("Delivery pricing wrong, expected 70 (45 + 25 delivery fee)");
  console.log("Pricing math OK.");

  const gte = new Date(`${today}T00:00:00.000Z`);
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  const allToday = await prisma.booking.count({
    where: { date: { gte, lt } },
  });
  console.log(`Total bookings today: ${allToday}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
