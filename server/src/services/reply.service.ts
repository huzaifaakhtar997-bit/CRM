import { Message, ActivityType } from "@prisma/client";
import { replyRepository, ReplyRepository } from "../repositories/reply.repository";
import { prisma } from "../config/database";
import { AppError } from "../types/auth.types";
import { ReplyInput } from "../validators/reply.validator";

export class ReplyService {
  constructor(private replyRepo: ReplyRepository) {}

  async sendReply(conversationId: string, input: ReplyInput, currentUserId: string): Promise<Message> {
    // 1. Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError(`Conversation with ID '${conversationId}' not found.`, 404);
    }

    // 2. Fetch current user's profile metadata for sender info
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user) {
      throw new AppError("Sender user profile not found.", 400);
    }

    const replyMessage = await prisma.$transaction(async (tx) => {
      // Create the outbound message record
      const newMessage = await tx.message.create({
        data: {
          content: input.content,
          senderType: "USER",
          isInternalNote: false,
          senderName: user.name,
          senderEmail: user.email,
          conversationId,
        },
      });

      // Update the parent Conversation's timestamps
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Automatically create an Activity log record
      await tx.activity.create({
        data: {
          type: ActivityType.EMAIL,
          title: "Conversation Reply Sent",
          content: `Reply sent in conversation "${conversation.subject || "Conversation Thread"}"`,
          userId: currentUserId,
          ...(conversation.contactId && { contactId: conversation.contactId }),
          metadata: {
            conversationId,
            messageId: newMessage.id,
            senderType: "USER",
            isReply: true,
          },
        },
      });

      return newMessage;
    });

    return replyMessage;
  }

  async sendReplyWithTemplate(
    conversationId: string,
    templateId: string,
    variables: Record<string, string>,
    currentUserId: string
  ): Promise<Message> {
    // 1. Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new AppError(`Conversation with ID '${conversationId}' not found.`, 404);
    }

    // 2. Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new AppError(`Template with ID '${templateId}' not found.`, 404);
    }

    // 3. Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user) {
      throw new AppError("Sender user profile not found.", 400);
    }

    // 4. Generate content by replacing placeholders: {{var}}
    let content = template.content;
    const placeholderRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    content = content.replace(placeholderRegex, (match, variableName) => {
      if (variables[variableName] !== undefined) {
        return variables[variableName];
      }
      return match; // Leave untouched if not defined
    });

    const replyMessage = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          content,
          senderType: "USER",
          isInternalNote: false,
          senderName: user.name,
          senderEmail: user.email,
          conversationId,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.EMAIL,
          title: "Reply Sent Using Template",
          content: `Reply sent using template "${template.name}"`,
          userId: currentUserId,
          ...(conversation.contactId && { contactId: conversation.contactId }),
          metadata: {
            conversationId,
            templateId,
            templateName: template.name,
            messageId: newMessage.id,
            senderType: "USER",
            isReply: true,
          },
        },
      });

      return newMessage;
    });

    return replyMessage;
  }
}

export const replyService = new ReplyService(replyRepository);
