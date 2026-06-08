import { z } from 'zod';

export const variantSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  stock: z.coerce.number().int().nonnegative().default(0),
  isActive: z.coerce.boolean().default(true)
});

export const updateVariantSchema = variantSchema.partial();
