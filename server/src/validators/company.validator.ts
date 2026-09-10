import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val.trim() === "") return null;
      const trimmed = val.trim();
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    }),
  industry: z.string().optional().nullable().transform((v) => (!v || v.trim() === "" ? null : v.trim())),
  size: z.string().optional().nullable().transform((v) => (!v || v.trim() === "" ? null : v.trim())),
  phone: z.string().optional().nullable().transform((v) => (!v || v.trim() === "" ? null : v.trim())),
  email: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim()))
    .refine((val) => val === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid email format",
    }),
  address: z.string().optional().nullable().transform((v) => (!v || v.trim() === "" ? null : v.trim())),
  logoUrl: z.string().optional().nullable().transform((v) => (!v || v.trim() === "" ? null : v.trim())),
  annualRevenue: z
    .union([z.number(), z.string().transform((v) => (v.trim() === "" ? null : Number(v)))])
    .optional()
    .nullable(),
  description: z.string().optional().nullable().transform((v) => (!v || v.trim() === "" ? null : v.trim())),
});

export const updateCompanySchema = createCompanySchema.partial();

export const queryCompanySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  industry: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type QueryCompanyInput = z.infer<typeof queryCompanySchema>;
