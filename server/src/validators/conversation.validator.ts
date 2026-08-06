import { z } from "zod";
import { ConversationChannel, ConversationStatus } from "@prisma/client";

export const createConversationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  channel: z.nativeEnum(ConversationChannel).optional().default(ConversationChannel.EMAIL),
  status: z.nativeEnum(ConversationStatus).optional().default(ConversationStatus.OPEN),
  contactId: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export const updateConversationSchema = z.object({
  subject: z.string().min(1, "Subject cannot be empty").optional(),
  channel: z.nativeEnum(ConversationChannel).optional(),
  status: z.nativeEnum(ConversationStatus).optional(),
  contactId: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
});

export const queryConversationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  status: z.nativeEnum(ConversationStatus).optional(),
  channel: z.nativeEnum(ConversationChannel).optional(),
  assignedUserId: z.string().optional(),
  contactId: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type QueryConversationInput = z.infer<typeof queryConversationSchema>;
