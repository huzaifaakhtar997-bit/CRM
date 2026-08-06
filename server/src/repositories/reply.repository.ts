import { Message, Prisma, SenderType } from "@prisma/client";
import { prisma } from "../config/database";

export class ReplyRepository {
  async createReply(conversationId: string, content: string, senderName: string, senderEmail: string): Promise<Message> {
    return prisma.message.create({
      data: {
        content,
        senderType: SenderType.USER,
        isInternalNote: false,
        senderName,
        senderEmail,
        conversationId,
      },
      include: {
        conversation: {
          select: { id: true, subject: true, contactId: true },
        },
      },
    });
  }
}

export const replyRepository = new ReplyRepository();
