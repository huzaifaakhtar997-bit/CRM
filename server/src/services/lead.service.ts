import { Lead, Contact, Deal, ActivityType, LeadStatus, LifecycleStage } from "@prisma/client";
import { leadRepository, LeadRepository, LeadListResult } from "../repositories/lead.repository";
import { prisma } from "../config/database";
import { CreateLeadInput, UpdateLeadInput, QueryLeadInput, ConvertLeadInput } from "../validators/lead.validator";
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

  async convertLead(
    id: string,
    input: ConvertLeadInput,
    currentUserId: string
  ): Promise<{ lead: Lead; contact: Contact; deal?: Deal }> {
    const lead = await this.leadRepo.findById(id);
    if (!lead) {
      throw new AppError(`Lead with ID '${id}' not found.`, 404);
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new AppError("This lead has already been converted.", 400);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Resolve Company
      let companyId: string | null = input.companyId || null;

      if (!companyId && input.createCompany) {
        const companyName = (input.companyName || lead.company || "").trim();
        if (companyName) {
          let existingCompany = await tx.company.findFirst({
            where: { name: { equals: companyName, mode: "insensitive" } },
          });
          if (!existingCompany) {
            existingCompany = await tx.company.create({
              data: {
                name: companyName,
              },
            });
          }
          companyId = existingCompany.id;
        }
      } else if (!companyId && lead.company) {
        const matchedCompany = await tx.company.findFirst({
          where: { name: { equals: lead.company.trim(), mode: "insensitive" } },
        });
        if (matchedCompany) {
          companyId = matchedCompany.id;
        }
      }

      // 2. Check if a Contact with this email already exists
      let contact = await tx.contact.findFirst({
        where: { email: { equals: lead.email.toLowerCase(), mode: "insensitive" } },
      });

      if (!contact) {
        contact = await tx.contact.create({
          data: {
            firstName: lead.firstName,
            lastName: lead.lastName || "",
            email: lead.email.toLowerCase(),
            phone: lead.phone,
            jobTitle: lead.jobTitle,
            leadSource: lead.source,
            lifecycleStage: input.createDeal ? LifecycleStage.OPPORTUNITY : LifecycleStage.LEAD,
            assignedUserId: lead.assignedUserId || currentUserId,
            companyId,
            notes: lead.notes,
          },
        });
      } else if (companyId && !contact.companyId) {
        contact = await tx.contact.update({
          where: { id: contact.id },
          data: { companyId },
        });
      }

      // 3. Create Deal if requested
      let deal: Deal | undefined;
      if (input.createDeal && input.dealTitle) {
        let stageId = input.stageId;
        if (!stageId) {
          const defaultStage = await tx.pipelineStage.findFirst({
            orderBy: { order: "asc" },
          });
          if (defaultStage) {
            stageId = defaultStage.id;
          }
        }

        if (stageId) {
          deal = await tx.deal.create({
            data: {
              title: input.dealTitle,
              value: input.dealValue || 0,
              currency: "USD",
              probability: 20,
              expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              priority: "MEDIUM",
              stageId,
              contactId: contact.id,
              companyId,
              assignedUserId: contact.assignedUserId || currentUserId,
            },
          });
        }
      }

      // 4. Update Lead to CONVERTED and link contact
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.CONVERTED,
          convertedContactId: contact.id,
        },
      });

      // 5. Link any existing unlinked Conversations from this email to the new Contact
      await tx.conversation.updateMany({
        where: {
          contactId: null,
          messages: {
            some: {
              senderEmail: { equals: lead.email.toLowerCase(), mode: "insensitive" },
            },
          },
        },
        data: {
          contactId: contact.id,
        },
      });

      // 6. Record Activity
      await tx.activity.create({
        data: {
          type: ActivityType.LEAD_CONVERTED,
          title: "Lead Converted",
          content: `Converted lead ${lead.firstName} ${lead.lastName || ""}`.trim() + ` to Contact (${contact.email})` + (deal ? ` and created deal "${deal.title}"` : ""),
          userId: currentUserId,
          contactId: contact.id,
          leadId: lead.id,
          dealId: deal?.id,
          metadata: {
            contactId: contact.id,
            companyId,
            dealId: deal?.id,
          },
        },
      });

      return {
        lead: updatedLead,
        contact,
        deal,
      };
    });
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
