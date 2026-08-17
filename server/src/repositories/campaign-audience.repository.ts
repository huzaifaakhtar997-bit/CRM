import { CampaignRecipient, Contact, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryCampaignAudienceInput } from "../validators/campaign-audience.validator";

export interface RecipientListResult {
  recipients: (CampaignRecipient & { contact: Contact })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CampaignAudienceRepository {
  async getContactsByFilters(filters: any): Promise<Contact[]> {
    const where: Prisma.ContactWhereInput = {};

    if (filters.lifecycleStage) {
      where.lifecycleStage = filters.lifecycleStage;
    }
    if (filters.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters.assignedUserId) {
      where.assignedUserId = filters.assignedUserId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasEvery: filters.tags };
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.contact.findMany({
      where,
    });
  }

  async getContactsByFiltersPaginated(filters: any, page: number, limit: number): Promise<{ contacts: Contact[]; total: number }> {
    const where: Prisma.ContactWhereInput = {};
    const skip = (page - 1) * limit;

    if (filters.lifecycleStage) {
      where.lifecycleStage = filters.lifecycleStage;
    }
    if (filters.companyId) {
      where.companyId = filters.companyId;
    }
    if (filters.assignedUserId) {
      where.assignedUserId = filters.assignedUserId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasEvery: filters.tags };
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contact.count({ where }),
    ]);

    return { contacts, total };
  }

  async getExistingRecipientIds(campaignId: string): Promise<string[]> {
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId },
      select: { contactId: true },
    });
    return recipients.map((r) => r.contactId);
  }

  async getRecipients(campaignId: string, query: QueryCampaignAudienceInput): Promise<RecipientListResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignRecipientWhereInput = {
      campaignId,
    };

    if (query.search) {
      where.contact = {
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" } },
          { lastName: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const [recipients, total] = await Promise.all([
      prisma.campaignRecipient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: "desc" }, // or just standard order
        include: {
          contact: true,
        },
      }),
      prisma.campaignRecipient.count({ where }),
    ]);

    return {
      recipients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async deleteRecipient(campaignId: string, recipientId: string): Promise<CampaignRecipient> {
    return prisma.campaignRecipient.delete({
      where: {
        id: recipientId,
        campaignId, // verify ownership
      },
    });
  }

  async findRecipientById(campaignId: string, recipientId: string): Promise<CampaignRecipient | null> {
    return prisma.campaignRecipient.findFirst({
      where: {
        id: recipientId,
        campaignId,
      },
    });
  }
}

export const campaignAudienceRepository = new CampaignAudienceRepository();
