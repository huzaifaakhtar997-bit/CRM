import { Conversation, ActivityType } from "@prisma/client";
import { conversationRepository, ConversationRepository, ConversationListResult } from "../repositories/conversation.repository";
import { prisma } from "../config/database";
import { CreateConversationInput, UpdateConversationInput, QueryConversationInput } from "../validators/conversation.validator";
import { AppError } from "../types/auth.types";

export class ConversationService {
  constructor(private convoRepo: ConversationRepository) {}

  async createConversation(input: CreateConversationInput, currentUserId: string): Promise<Conversation> {
    // Validate contact exists if provided
    if (input.contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: input.contactId } });
      if (!contact) throw new AppError(`Contact with ID '${input.contactId}' not found.`, 400);
    }

    // Validate assigned user exists if provided
    if (input.assignedUserId) {
      const user = await prisma.user.findUnique({ where: { id: input.assignedUserId } });
      if (!user) throw new AppError(`User with ID '${input.assignedUserId}' not found.`, 400);
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const newConvo = await tx.conversation.create({
        data: {
          subject: input.subject,
          channel: input.channel,
          status: input.status,
          ...(input.contactId && { contact: { connect: { id: input.contactId } } }),
          ...(input.assignedUserId && { assignedUser: { connect: { id: input.assignedUserId } } }),
        },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Conversation Created",
          content: `Created conversation "${newConvo.subject}" via ${newConvo.channel}`,
          userId: currentUserId,
          ...(newConvo.contactId && { contactId: newConvo.contactId }),
          metadata: {
            conversationId: newConvo.id,
            channel: newConvo.channel,
            status: newConvo.status,
          },
        },
      });

      return newConvo;
    });

    return conversation;
  }

  async getConversations(query: QueryConversationInput): Promise<ConversationListResult> {
    return this.convoRepo.findAll(query);
  }

  async getConversationById(id: string): Promise<Conversation> {
    const convo = await this.convoRepo.findById(id);
    if (!convo) {
      throw new AppError(`Conversation with ID '${id}' not found.`, 404);
    }
    return convo;
  }

  async updateConversation(id: string, input: UpdateConversationInput, currentUserId: string): Promise<Conversation> {
    const existing = await this.convoRepo.findById(id);
    if (!existing) {
      throw new AppError(`Conversation with ID '${id}' not found.`, 404);
    }

    // Validate assigned user if changing assignment
    if (input.assignedUserId) {
      const user = await prisma.user.findUnique({ where: { id: input.assignedUserId } });
      if (!user) throw new AppError(`User with ID '${input.assignedUserId}' not found.`, 400);
    }

    // Validate contact if changing
    if (input.contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: input.contactId } });
      if (!contact) throw new AppError(`Contact with ID '${input.contactId}' not found.`, 400);
    }

    const updatedConvo = await prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.update({
        where: { id },
        data: {
          ...(input.subject !== undefined && { subject: input.subject }),
          ...(input.channel !== undefined && { channel: input.channel }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.contactId !== undefined && {
            contact: input.contactId ? { connect: { id: input.contactId } } : { disconnect: true },
          }),
          ...(input.assignedUserId !== undefined && {
            assignedUser: input.assignedUserId ? { connect: { id: input.assignedUserId } } : { disconnect: true },
          }),
        },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      // Log assignment change
      if (input.assignedUserId && input.assignedUserId !== (existing as any).assignedUserId) {
        await tx.activity.create({
          data: {
            type: ActivityType.NOTE,
            title: "Conversation Assigned",
            content: `Conversation "${updated.subject}" assigned to ${updated.assignedUser?.name || "a user"}`,
            userId: currentUserId,
            ...(updated.contactId && { contactId: updated.contactId }),
            metadata: {
              conversationId: updated.id,
              assignedUserId: input.assignedUserId,
            },
          },
        });
      }

      // Log status change
      if (input.status && input.status !== (existing as any).status) {
        await tx.activity.create({
          data: {
            type: ActivityType.NOTE,
            title: "Conversation Status Changed",
            content: `Conversation "${updated.subject}" status changed from ${(existing as any).status} to ${updated.status}`,
            userId: currentUserId,
            ...(updated.contactId && { contactId: updated.contactId }),
            metadata: {
              conversationId: updated.id,
              previousStatus: (existing as any).status,
              newStatus: updated.status,
            },
          },
        });
      }

      // General update activity
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Conversation Updated",
          content: `Updated conversation "${updated.subject}"`,
          userId: currentUserId,
          ...(updated.contactId && { contactId: updated.contactId }),
          metadata: {
            conversationId: updated.id,
            updatedFields: Object.keys(input),
          },
        },
      });

      return updated;
    });

    return updatedConvo;
  }

  async deleteConversation(id: string): Promise<{ id: string }> {
    const existing = await this.convoRepo.findById(id);
    if (!existing) {
      throw new AppError(`Conversation with ID '${id}' not found.`, 404);
    }
    await this.convoRepo.delete(id);
    return { id };
  }
}

export const conversationService = new ConversationService(conversationRepository);
