import { z } from 'zod';

export const campaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters").max(100),
  type: z.enum(['PRODUCT_PROMOTION', 'STOREWIDE_OFFER', 'DISCOUNT_CAMPAIGN', 'FLASH_SALE']),
  targetProductIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return val || [];
  }, z.array(z.string()).optional()),
  destinationUrl: z.string().url("Must be a valid URL").optional().nullable(),
  budget: z.coerce.number().min(100, "Minimum budget is ₹100"),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  budget: z.coerce.number().min(100).optional(),
  destinationUrl: z.string().url().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});
