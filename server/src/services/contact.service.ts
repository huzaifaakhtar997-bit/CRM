import { Contact, ActivityType } from "@prisma/client";
import { contactRepository, ContactRepository, ContactListResult } from "../repositories/contact.repository";
import { prisma } from "../config/database";
import { CreateContactInput, UpdateContactInput, QueryContactInput } from "../validators/contact.validator";
import { AppError } from "../types/auth.types";
import { notificationService } from "./notification.service";

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

    const assignedUserId = input.assignedUserId || currentUserId;
    if (assignedUserId !== currentUserId) {
      await notificationService.createNotification({
        userId: assignedUserId,
        title: "New Lead Assigned",
        message: `You have been assigned a new lead: ${contact.firstName} ${contact.lastName}`,
        type: "lead",
        link: `/contacts/${contact.id}`,
      });
    }

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

    if (input.assignedUserId && input.assignedUserId !== existing.assignedUserId && input.assignedUserId !== currentUserId) {
      await notificationService.createNotification({
        userId: input.assignedUserId,
        title: "Lead Reassigned",
        message: `You have been assigned the lead: ${updatedContact.firstName} ${updatedContact.lastName}`,
        type: "lead",
        link: `/contacts/${updatedContact.id}`,
      });
    }

    return updatedContact;
  }

  async exportContacts(query: QueryContactInput): Promise<string> {
    const contacts = await this.contactRepo.findAllForExport(query);

    const headers = [
      "ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Job Title",
      "Lead Source",
      "Lifecycle Stage",
      "Status",
      "Company",
      "Assigned User",
      "Created At",
      "Updated At"
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = contacts.map(c => [
      c.id,
      c.firstName,
      c.lastName,
      c.email,
      c.phone,
      c.jobTitle,
      c.leadSource,
      c.lifecycleStage,
      c.status,
      c.company?.name || "",
      c.assignedUser ? `${c.assignedUser.name} (${c.assignedUser.email})` : "",
      c.createdAt.toISOString(),
      c.updatedAt.toISOString(),
    ]);

    const csvLines = [
      headers.map(escapeCsv).join(","),
      ...rows.map(row => row.map(escapeCsv).join(","))
    ];

    return csvLines.join("\n");
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
