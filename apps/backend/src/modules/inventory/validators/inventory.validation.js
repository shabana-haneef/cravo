import { z } from 'zod';

export const adjustStockSchema = z.object({
  quantity: z.coerce.number().int(), // positive for add, negative for remove
  reason: z.string().max(255).optional().nullable()
}).refine(data => data.quantity !== 0, {
  message: "Quantity cannot be zero",
  path: ["quantity"]
});
