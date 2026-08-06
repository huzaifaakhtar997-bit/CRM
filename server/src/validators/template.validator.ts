import { z } from "zod";
import { TemplateType } from "@prisma/client";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.nativeEnum(TemplateType).optional().default(TemplateType.EMAIL_REPLY),
  subject: z.string().nullable().optional(),
  content: z.string().min(1, "Template content is required"),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, "Template name cannot be empty").optional(),
  type: z.nativeEnum(TemplateType).optional(),
  subject: z.string().nullable().optional(),
  content: z.string().min(1, "Template content cannot be empty").optional(),
});

export const queryTemplateSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  type: z.nativeEnum(TemplateType).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type QueryTemplateInput = z.infer<typeof queryTemplateSchema>;
