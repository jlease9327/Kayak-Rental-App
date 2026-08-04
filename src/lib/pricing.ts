export const PRICE_PER_KAYAK_PER_HOUR = 15;
export const DELIVERY_FEE = 25;

export const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8] as const;

export function calculatePricing(params: {
  durationHours: number;
  kayakCount: number;
  fulfillmentType: "PICKUP" | "DELIVERY";
}) {
  const basePrice =
    PRICE_PER_KAYAK_PER_HOUR * params.durationHours * params.kayakCount;
  const deliveryFee = params.fulfillmentType === "DELIVERY" ? DELIVERY_FEE : 0;
  const totalPrice = basePrice + deliveryFee;

  return { basePrice, deliveryFee, totalPrice };
}
