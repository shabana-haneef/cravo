import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long").max(100, "Full name must be at most 100 characters long"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number"),
  avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
});
