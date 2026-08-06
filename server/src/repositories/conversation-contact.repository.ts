import { Conversation } from "@prisma/client";
import { prisma } from "../config/database";

export class ConversationContactRepository {
  async linkContact(conversationId: string, contactId: string): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { contactId },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}

export const conversationContactRepository = new ConversationContactRepository();
