import { z } from 'zod';
import { LEAD_STATUSES } from '@/types/leads';

export const leadFormSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .transform(val => val.trim()),

  email: z.string()
    .email("Invalid email address")
    .max(150, "Email is too long")
    .transform(val => val.toLowerCase().trim()),

  phone: z.string()
    .min(1, "Phone number is required")
    .max(20, "Phone number is too long")
    .transform(val => val.replace(/\\s+/g, '')),

  originCountry: z.string()
    .length(2, "Must be a valid 2-letter country code")
    .toUpperCase(),

  destinationCountry: z.string()
    .length(2, "Must be a valid 2-letter country code")
    .toUpperCase(),

  parcelType: z.string()
    .min(1, "Parcel type is required")
    .max(100, "Parcel type is too long")
    .transform(val => val.trim()),

  weight: z.number()
    .positive("Weight must be positive")
    .max(999999.99, "Weight is too large"),

  notes: z.string()
    .optional()
    .transform(val => val || ""),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const leadUpdateSchema = leadFormSchema.partial();

export const leadStatusSchema = z.object({
  status: z.enum([
    LEAD_STATUSES.NEW,
    LEAD_STATUSES.CONTACTED,
    LEAD_STATUSES.QUALIFIED,
    LEAD_STATUSES.CONVERTED,
    LEAD_STATUSES.REJECTED
  ]),
  assignedTo: z.string().optional(),
});

export type LeadStatusUpdate = z.infer<typeof leadStatusSchema>;
