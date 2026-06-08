import { z } from 'zod';

export const productSchema = z.object({
  categoryId: z.string().cuid("Invalid category ID"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  shortDescription: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
  // Initial variant data
  variantName: z.string().min(1, "Variant name is required"),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  initialStock: z.coerce.number().int().nonnegative().default(0)
});

export const updateProductSchema = z.object({
  categoryId: z.string().cuid("Invalid category ID").optional(),
  name: z.string().min(2).max(100).optional(),
  shortDescription: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isFeatured: z.coerce.boolean().optional()
});
