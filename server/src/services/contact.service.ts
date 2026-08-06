import { Contact, ActivityType } from "@prisma/client";
import { contactRepository, ContactRepository, ContactListResult } from "../repositories/contact.repository";
import { prisma } from "../config/database";
import { CreateContactInput, UpdateContactInput, QueryContactInput } from "../validators/contact.validator";
import { AppError } from "../types/auth.types";

export class ContactService {
  constructor(private contactRepo: ContactRepository) {}

  async createContact(input: CreateContactInput, currentUserId: string): Promise<Contact> {
    if (input.email) {
      const existing = await this.contactRepo.findByEmail(input.email.toLowerCase());
      if (existing) {
        throw new AppError("A contact with this email address already exists.", 400);
      }
    }

    // Execute Contact creation and Activity logging inside a Prisma transaction
    const contact = await prisma.$transaction(async (tx) => {
      const newContact = await tx.contact.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email ? input.email.toLowerCase() : null,
          phone: input.phone,
          jobTitle: input.jobTitle,
          companyId: input.companyId,
          assignedUserId: input.assignedUserId || currentUserId,
          leadSource: input.leadSource,
          lifecycleStage: input.lifecycleStage,
          status: input.status,
          notes: input.notes,
          tags: input.tags,
        },
        include: {
          company: {
            select: { id: true, name: true, logoUrl: true },
          },
          assignedUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      // Automatically create Activity log record
      await tx.activity.create({
        data: {
          type: ActivityType.CONTACT_CREATED,
          title: "Contact Created",
          content: `Created contact ${newContact.firstName} ${newContact.lastName} (${newContact.email || "No email"})`,
          userId: currentUserId,
          contactId: newContact.id,
          metadata: {
            lifecycleStage: newContact.lifecycleStage,
            leadSource: newContact.leadSource,
          },
        },
      });

      return newContact;
    });

    return contact;
  }

  async getContacts(query: QueryContactInput): Promise<ContactListResult> {
    return this.contactRepo.findAll(query);
  }

  async getContactById(id: string): Promise<Contact> {
    const contact = await this.contactRepo.findById(id);
    if (!contact) {
      throw new AppError(`Contact with ID '${id}' not found.`, 404);
    }
    return contact;
  }

  async updateContact(id: string, input: UpdateContactInput, currentUserId: string): Promise<Contact> {
    const existing = await this.contactRepo.findById(id);
    if (!existing) {
      throw new AppError(`Contact with ID '${id}' not found.`, 404);
    }

    if (input.email && input.email.toLowerCase() !== existing.email) {
      const emailConflict = await this.contactRepo.findByEmail(input.email.toLowerCase());
      if (emailConflict) {
        throw new AppError("A contact with this email address already exists.", 400);
      }
    }

    const updatedContact = await prisma.$transaction(async (tx) => {
      const updated = await tx.contact.update({
        where: { id },
        data: {
          ...input,
          email: input.email !== undefined ? (input.email ? input.email.toLowerCase() : null) : undefined,
        },
        include: {
          company: {
            select: { id: true, name: true, logoUrl: true },
          },
          assignedUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      // Automatically create Activity log record for update
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Contact Updated",
          content: `Updated profile details for contact ${updated.firstName} ${updated.lastName}`,
          userId: currentUserId,
          contactId: updated.id,
          metadata: {
            updatedFields: Object.keys(input),
          },
        },
      });

      return updated;
    });

    return updatedContact;
  }

  async deleteContact(id: string): Promise<{ id: string }> {
    const existing = await this.contactRepo.findById(id);
    if (!existing) {
      throw new AppError(`Contact with ID '${id}' not found.`, 404);
    }

    await this.contactRepo.delete(id);
    return { id };
  }
}

export const contactService = new ContactService(contactRepository);
