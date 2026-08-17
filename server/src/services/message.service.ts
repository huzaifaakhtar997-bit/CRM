import { Message, ActivityType } from "@prisma/client";
import { messageRepository, MessageRepository, MessageListResult } from "../repositories/message.repository";
import { prisma } from "../config/database";
import { CreateMessageInput, UpdateMessageInput, QueryMessageInput } from "../validators/message.validator";
import { AppError } from "../types/auth.types";
import { emailService } from "./email.service";
import { config } from "../config/env";

export class MessageService {
  constructor(private messageRepo: MessageRepository) {}

  async createMessage(
    conversationId: string,
    input: CreateMessageInput,
    currentUserId: string
  ): Promise<Message> {
    // Validate conversation existence
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });

    if (!conversation) {
      throw new AppError(`Conversation with ID '${conversationId}' not found.`, 404);
    }

    let providerMessageId: string | null = null;

    // Send real outbound email if it's from a user and not an internal note
    if (input.senderType === "USER" && !input.isInternalNote) {
      if (!conversation.contact?.email) {
        throw new AppError("Cannot send email: Contact has no email address.", 400);
      }

      const sendResult = await emailService.sendEmail({
        from: config.emailFromAddress,
        to: conversation.contact.email,
        subject: conversation.subject || "Re: Your Conversation",
        html: input.content, // Treating content as HTML as per standard email compose
      });
      providerMessageId = sendResult.id;
    }

    const message = await prisma.$transaction(async (tx) => {
      // 1. Create the Message
      const newMessage = await tx.message.create({
        data: {
          content: input.content,
          senderType: input.senderType,
          senderName: input.senderName,
          senderEmail: input.senderEmail,
          isInternalNote: input.isInternalNote,
          providerMessageId,
          conversationId,
        },
      });

      // 2. Update Conversation timestamp and lastMessageAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 3. Create Activity record
      await tx.activity.create({
        data: {
          type: ActivityType.EMAIL, // Fits email/unified inbox conversations best
          title: input.isInternalNote ? "Conversation Note Added" : "Conversation Message Added",
          content: `${input.isInternalNote ? "Note" : "Message"} from ${input.senderName || input.senderType} added to "${conversation.subject || "Conversation"}"`,
          userId: currentUserId,
          ...(conversation.contactId && { contactId: conversation.contactId }),
          metadata: {
            conversationId,
            messageId: newMessage.id,
            providerMessageId,
            senderType: input.senderType,
            isInternalNote: input.isInternalNote,
          },
        },
      });

      return newMessage;
    });

    return message;
  }

  async getMessagesByConversation(
    conversationId: string,
    query: QueryMessageInput
  ): Promise<MessageListResult> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError(`Conversation with ID '${conversationId}' not found.`, 404);
    }

    return this.messageRepo.findByConversation(conversationId, query);
  }

  async getMessageById(id: string): Promise<Message> {
    const message = await this.messageRepo.findById(id);
    if (!message) {
      throw new AppError(`Message with ID '${id}' not found.`, 404);
    }
    return message;
  }

  async updateMessage(
    id: string,
    input: UpdateMessageInput,
    currentUserId: string
  ): Promise<Message> {
    const existing = await this.messageRepo.findById(id);
    if (!existing) {
      throw new AppError(`Message with ID '${id}' not found.`, 404);
    }

    // Business Rule: Standard inbox messages cannot be modified to preserve audit trails.
    // However, if the design allows editing or restricts it, we enforce rules here.
    // For our MVP, we allow updates but enforce validation checks or prevent updates if it's external customer messages.
    if (existing.senderType === "CUSTOMER") {
      throw new AppError("Customer messages cannot be edited.", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedMsg = await tx.message.update({
        where: { id },
        data: {
          content: input.content,
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Message Edited",
          content: `User edited a message in conversation thread`,
          userId: currentUserId,
          metadata: {
            messageId: id,
            conversationId: existing.conversationId,
          },
        },
      });

      return updatedMsg;
    });

    return updated;
  }

  async deleteMessage(id: string, currentUserId: string): Promise<{ id: string }> {
    const existing = await this.messageRepo.findById(id);
    if (!existing) {
      throw new AppError(`Message with ID '${id}' not found.`, 404);
    }

    // Business Rule: Customer messages cannot be deleted.
    if (existing.senderType === "CUSTOMER") {
      throw new AppError("Customer messages cannot be deleted from the audit thread.", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.message.delete({
        where: { id },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Message Deleted",
          content: `User deleted a message from conversation thread`,
          userId: currentUserId,
          metadata: {
            messageId: id,
            conversationId: existing.conversationId,
          },
        },
      });
    });

    return { id };
  }
}

export const messageService = new MessageService(messageRepository);
