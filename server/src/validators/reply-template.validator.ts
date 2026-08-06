import { z } from "zod";

export const replyWithTemplateSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  variables: z.record(z.string(), z.string()).optional().default({}),
});

export type ReplyWithTemplateInput = z.infer<typeof replyWithTemplateSchema>;
