import { z } from "zod";
import { SenderType } from "@prisma/client";

export const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  senderType: z.nativeEnum(SenderType),
  senderName: z.string().nullable().optional(),
  senderEmail: z.string().email("Invalid sender email format").nullable().optional(),
  isInternalNote: z.boolean().optional().default(false),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
});

export const queryMessageSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 15)),
  search: z.string().optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type QueryMessageInput = z.infer<typeof queryMessageSchema>;
