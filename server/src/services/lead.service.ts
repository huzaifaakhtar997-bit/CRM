import { Lead, ActivityType } from "@prisma/client";
import { leadRepository, LeadRepository, LeadListResult } from "../repositories/lead.repository";
import { prisma } from "../config/database";
import { CreateLeadInput, UpdateLeadInput, QueryLeadInput } from "../validators/lead.validator";
import { AppError } from "../types/auth.types";

export class LeadService {
  constructor(private leadRepo: LeadRepository) {}

  async createLead(input: CreateLeadInput, currentUserId: string): Promise<Lead> {
    const existing = await this.leadRepo.findByEmail(input.email.toLowerCase());
    if (existing) {
      throw new AppError(`A lead with email address '${input.email}' already exists.`, 400);
    }

    const assignedUserId = input.assignedUserId || currentUserId;

    // Execute Lead creation and Activity log inside Prisma transaction
    const lead = await prisma.$transaction(async (tx) => {
      const newLead = await tx.lead.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email.toLowerCase(),
          phone: input.phone,
          company: input.company,
          jobTitle: input.jobTitle,
          source: input.source,
          status: input.status,
          notes: input.notes,
          assignedUserId,
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      // Automatically create Activity log record for Lead Creation
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Lead Created",
          content: `Created lead ${newLead.firstName} ${newLead.lastName || ""}`.trim() + ` (${newLead.email})`,
          userId: currentUserId,
          leadId: newLead.id,
          metadata: {
            status: newLead.status,
            source: newLead.source,
            company: newLead.company,
            assignedUserId: newLead.assignedUserId,
          },
        },
      });

      return newLead;
    });

    return lead;
  }

  async getLeads(query: QueryLeadInput): Promise<LeadListResult> {
    return this.leadRepo.findAll(query);
  }

  async getLeadById(id: string): Promise<Lead> {
    const lead = await this.leadRepo.findById(id);
    if (!lead) {
      throw new AppError(`Lead with ID '${id}' not found.`, 404);
    }
    return lead;
  }

  async updateLead(id: string, input: UpdateLeadInput, currentUserId: string): Promise<Lead> {
    const existing = await this.leadRepo.findById(id);
    if (!existing) {
      throw new AppError(`Lead with ID '${id}' not found.`, 404);
    }

    if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = await this.leadRepo.findByEmail(input.email.toLowerCase());
      if (emailConflict) {
        throw new AppError(`A lead with email address '${input.email}' already exists.`, 400);
      }
    }

    const updatedLead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          ...input,
          email: input.email !== undefined ? input.email.toLowerCase() : undefined,
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      // Check specific changes to generate targeted Activity logs
      if (input.status && input.status !== existing.status) {
        await tx.activity.create({
          data: {
            type: ActivityType.NOTE,
            title: "Lead Status Changed",
            content: `Changed status for lead ${updated.firstName} from '${existing.status}' to '${updated.status}'`,
            userId: currentUserId,
            leadId: updated.id,
            metadata: {
              previousStatus: existing.status,
              newStatus: updated.status,
            },
          },
        });
      }

      if (input.assignedUserId && input.assignedUserId !== existing.assignedUserId) {
        await tx.activity.create({
          data: {
            type: ActivityType.NOTE,
            title: "Lead Reassigned",
            content: `Reassigned lead ${updated.firstName} to user ID '${updated.assignedUserId}'`,
            userId: currentUserId,
            leadId: updated.id,
            metadata: {
              previousAssignedUserId: existing.assignedUserId,
              newAssignedUserId: updated.assignedUserId,
            },
          },
        });
      }

      // General update activity log
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Lead Updated",
          content: `Updated profile details for lead ${updated.firstName}`,
          userId: currentUserId,
          leadId: updated.id,
          metadata: {
            updatedFields: Object.keys(input),
          },
        },
      });

      return updated;
    });

    return updatedLead;
  }

  async deleteLead(id: string): Promise<{ id: string }> {
    const existing = await this.leadRepo.findById(id);
    if (!existing) {
      throw new AppError(`Lead with ID '${id}' not found.`, 404);
    }

    await this.leadRepo.delete(id);
    return { id };
  }
}

export const leadService = new LeadService(leadRepository);
