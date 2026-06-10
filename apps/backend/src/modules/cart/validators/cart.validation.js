import { z } from 'zod';

export const addItemSchema = z.object({
  productVariantId: z.string().cuid("Invalid variant ID"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1")
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be at least 1")
});
