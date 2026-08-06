import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Invalid URL format").nullable().optional(),
  industry: z.string().nullable().optional(),
  size: z.string().nullable().optional(), // Headcount range e.g. "51-200"
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email format").nullable().optional(),
  address: z.string().nullable().optional(),
  logoUrl: z.string().url("Invalid logo URL format").nullable().optional(),
  annualRevenue: z.number().nonnegative().nullable().optional(),
  description: z.string().nullable().optional(),
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
