import { z } from "zod";

const allowedRadii = [1, 2, 3, 5, 10, 15, 20, 25, 50];

export const createShopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional().nullable(),
  shopType: z.enum([
    "HOME_MADE", "FARMER", "BAKERY", "GROCERY", "FISH_SELLER", "MEAT_SELLER", "LOCAL_SHOP", "OTHER"
  ]),
  deliveryRadiusKm: z.coerce.number().refine(val => allowedRadii.includes(val), {
    message: `Delivery radius must be one of: ${allowedRadii.join(', ')}`
  }).default(5),
  isPickupEnabled: z.coerce.boolean().default(true),
  isDeliveryEnabled: z.coerce.boolean().default(true),
});

export const updateShopSchema = createShopSchema.partial();

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24-hour format

const timingSchema = z.object({
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  openTime: z.string().regex(timeRegex, "Invalid open time. Must be HH:MM").optional().nullable(),
  closeTime: z.string().regex(timeRegex, "Invalid close time. Must be HH:MM").optional().nullable(),
  isClosed: z.boolean().default(false)
}).refine(data => {
  if (!data.isClosed && (!data.openTime || !data.closeTime)) {
    return false;
  }
  return true;
}, {
  message: "openTime and closeTime are required if the shop is not closed on this day."
});

export const updateTimingsSchema = z.object({
  timings: z.array(timingSchema).length(7, "Must provide timings for all 7 days of the week.")
});
