import * as z from "zod";

export const leadFormSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .transform(val => val.trim()),

  email: z.string()
    .email("Invalid email address")
    .toLowerCase()
    .transform(val => val.trim()),

  phone: z.string()
    .regex(/^\+?[\d\s-()]{8,20}$/, "Invalid phone number format")
    .transform(val => val.replace(/\s+/g, '')),

  originCountry: z.string()
    .length(2, "Please use 2-letter country code")
    .toUpperCase(),

  destinationCountry: z.string()
    .length(2, "Please use 2-letter country code")
    .toUpperCase(),

  parcelType: z.string()
    .min(2, "Parcel type must be at least 2 characters")
    .max(100, "Parcel type is too long")
    .transform(val => val.trim()),

  weight: z.number()
    .positive("Weight must be positive")
    .max(999999.99, "Weight too large")
    .transform(val => Number(val.toFixed(2))),

  notes: z.string()
    .max(1000, "Notes too long")
    .transform(val => val.trim())
    .optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
