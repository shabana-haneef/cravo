import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  isActive: z.coerce.boolean().default(true),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional()
});
