import { z } from "zod";
import { LeadSource, LifecycleStage } from "@prisma/client";

export const linkExistingContactSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
});

export const createAndLinkContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address format"),
  phone: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  leadSource: z.nativeEnum(LeadSource).optional().default(LeadSource.OTHER),
  lifecycleStage: z.nativeEnum(LifecycleStage).optional().default(LifecycleStage.LEAD),
});

export type LinkExistingContactInput = z.infer<typeof linkExistingContactSchema>;
export type CreateAndLinkContactInput = z.infer<typeof createAndLinkContactSchema>;
