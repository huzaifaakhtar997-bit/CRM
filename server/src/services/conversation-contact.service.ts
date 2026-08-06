import { Conversation, Contact, ActivityType } from "@prisma/client";
import { conversationContactRepository, ConversationContactRepository } from "../repositories/conversation-contact.repository";
import { prisma } from "../config/database";
import { AppError } from "../types/auth.types";
import { CreateAndLinkContactInput } from "../validators/conversation-contact.validator";

export class ConversationContactService {
  constructor(private convoContactRepo: ConversationContactRepository) {}

  async linkExistingContact(conversationId: string, contactId: string, currentUserId: string): Promise<Conversation> {
    // 1. Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new AppError(`Conversation with ID '${conversationId}' not found.`, 404);
    }

    // 2. Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      throw new AppError(`Contact with ID '${contactId}' not found.`, 404);
    }

    const updatedConversation = await prisma.$transaction(async (tx) => {
      // Link the contact
      const updated = await tx.conversation.update({
        where: { id: conversationId },
        data: { contactId },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignedUser: { select: { id: true, name: true } },
        },
      });

      // Create Activity log
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Conversation Linked",
          content: `Conversation linked to contact "${contact.firstName} ${contact.lastName || ""}".`,
          userId: currentUserId,
          contactId,
          metadata: {
            conversationId,
            contactId,
          },
        },
      });

      return updated;
    });

    return updatedConversation;
  }

  async createAndLinkContact(
    conversationId: string,
    input: CreateAndLinkContactInput,
    currentUserId: string
  ): Promise<{ conversation: Conversation; contact: Contact }> {
    // 1. Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new AppError(`Conversation with ID '${conversationId}' not found.`, 404);
    }

    // 2. Duplicate Prevention - check if contact with email already exists
    const existingContact = await prisma.contact.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existingContact) {
      throw new AppError("A contact with this email already exists.", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create new Contact
      const newContact = await tx.contact.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName || "",
          email: input.email.toLowerCase(),
          phone: input.phone ?? null,
          companyId: input.companyId ?? null,
          jobTitle: input.jobTitle ?? null,
          assignedUserId: currentUserId,
          leadSource: input.leadSource,
          lifecycleStage: input.lifecycleStage,
        },
      });

      // Link to conversation
      const updatedConversation = await tx.conversation.update({
        where: { id: conversationId },
        data: { contactId: newContact.id },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignedUser: { select: { id: true, name: true } },
        },
      });

      // Create Activity logs
      // Contact Created Activity Log
      await tx.activity.create({
        data: {
          type: ActivityType.CONTACT_CREATED,
          title: "Contact Created From Conversation",
          content: `Contact ${newContact.firstName} ${newContact.lastName || ""} created directly from Conversation.`,
          userId: currentUserId,
          contactId: newContact.id,
          metadata: {
            conversationId,
            lifecycleStage: newContact.lifecycleStage,
          },
        },
      });

      // Conversation Linked Activity Log
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Conversation Linked",
          content: `Conversation linked to contact "${newContact.firstName} ${newContact.lastName || ""}".`,
          userId: currentUserId,
          contactId: newContact.id,
          metadata: {
            conversationId,
            contactId: newContact.id,
          },
        },
      });

      return { conversation: updatedConversation, contact: newContact };
    });

    return result;
  }
}

export const conversationContactService = new ConversationContactService(conversationContactRepository);
