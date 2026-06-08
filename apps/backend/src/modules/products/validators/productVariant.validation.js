import { z } from 'zod';

export const variantSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  initialStock: z.coerce.number().int().nonnegative().default(0),
  isActive: z.coerce.boolean().default(true)
});

export const updateVariantSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  price: z.coerce.number().positive().optional(),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  isActive: z.coerce.boolean().optional()
});
