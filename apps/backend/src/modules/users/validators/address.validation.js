import { z } from "zod";

export const addressSchema = z.object({
  label: z.enum(["HOME", "OFFICE", "OTHER"]).default("HOME"),
  fullName: z.string().min(2, "Full name must be at least 2 characters long").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
  addressLine1: z.string().min(5, "Address Line 1 is required").max(255),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().min(2, "City is required").max(100),
  district: z.string().max(100).optional().nullable(),
  state: z.string().min(2, "State is required").max(100),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, "Must be a valid 6-digit Indian PIN code"),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().default(false),
});
