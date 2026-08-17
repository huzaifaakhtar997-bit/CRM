import { z } from "zod";

// Supported import entity types
export const IMPORT_TYPES = ["contacts", "companies"] as const;
export type ImportType = (typeof IMPORT_TYPES)[number];

// Supported file extensions
export const SUPPORTED_EXTENSIONS = [".csv", ".xlsx"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

// Supported MIME types accepted by multer
export const SUPPORTED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream", // Some OS/browsers send this for .csv
  "text/plain",
] as const;

// Route param validation — :type must be "contacts" or "companies"
export const importTypeParamSchema = z.object({
  type: z
    .string()
    .refine((v) => IMPORT_TYPES.includes(v as ImportType), {
      message: `Import type must be one of: ${IMPORT_TYPES.join(", ")}`,
    })
    .transform((v) => v as ImportType),
});

// Optional column mapping sent alongside the file as a JSON body field
// e.g. { "First Name": "firstName", "Company": "name" }
export const columnMappingSchema = z
  .record(z.string(), z.string())
  .optional();

// Query param validation for GET /imports (pagination)
export const importListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20)),
});

export type ImportTypeParam = z.infer<typeof importTypeParamSchema>;
export type ColumnMapping = z.infer<typeof columnMappingSchema>;
export type ImportListQuery = z.infer<typeof importListQuerySchema>;

// ─── Contact field canonical names ──────────────────────────────────────────
export const CONTACT_CANONICAL_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "jobTitle",
] as const;

// ─── Company field canonical names ───────────────────────────────────────────
export const COMPANY_CANONICAL_FIELDS = [
  "name",
  "website",
  "industry",
  "phone",
  "email",
  "address",
  "size",
  "annualRevenue",
  "description",
] as const;

// ─── Flexible header alias maps ───────────────────────────────────────────────
// All keys are lowercased for case-insensitive matching.
export const CONTACT_HEADER_ALIASES: Record<string, string> = {
  firstname: "firstName",
  first_name: "firstName",
  "first name": "firstName",
  fname: "firstName",
  lastname: "lastName",
  last_name: "lastName",
  "last name": "lastName",
  lname: "lastName",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  jobtitle: "jobTitle",
  job_title: "jobTitle",
  "job title": "jobTitle",
  title: "jobTitle",
  position: "jobTitle",
};

export const COMPANY_HEADER_ALIASES: Record<string, string> = {
  name: "name",
  "company name": "name",
  company: "name",
  "organization name": "name",
  organization: "name",
  website: "website",
  url: "website",
  "website url": "website",
  domain: "website",
  industry: "industry",
  sector: "industry",
  phone: "phone",
  "phone number": "phone",
  "company phone": "phone",
  email: "email",
  "company email": "email",
  address: "address",
  "company address": "address",
  location: "address",
  size: "size",
  "company size": "size",
  employees: "size",
  annualrevenue: "annualRevenue",
  annual_revenue: "annualRevenue",
  "annual revenue": "annualRevenue",
  revenue: "annualRevenue",
  description: "description",
  about: "description",
};
