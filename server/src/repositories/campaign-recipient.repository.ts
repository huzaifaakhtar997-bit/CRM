import { CampaignRecipient, Contact, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryCampaignRecipientInput } from "../validators/campaign-recipient.validator";

export interface RecipientListResult {
  recipients: (CampaignRecipient & { contact: Contact })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CampaignRecipientRepository {
  async findById(campaignId: string, recipientId: string): Promise<(CampaignRecipient & { contact: Contact }) | null> {
    return prisma.campaignRecipient.findFirst({
      where: {
        id: recipientId,
        campaignId,
      },
      include: {
        contact: true,
      },
    });
  }

  async findByCampaignAndContact(campaignId: string, contactId: string): Promise<CampaignRecipient | null> {
    return prisma.campaignRecipient.findUnique({
      where: {
        campaignId_contactId: {
          campaignId,
          contactId,
        },
      },
    });
  }

  async findExistingContactIds(campaignId: string, contactIds: string[]): Promise<string[]> {
    const existing = await prisma.campaignRecipient.findMany({
      where: {
        campaignId,
        contactId: { in: contactIds },
      },
      select: { contactId: true },
    });
    return existing.map((r) => r.contactId);
  }

  async create(campaignId: string, contactId: string): Promise<CampaignRecipient & { contact: Contact }> {
    return prisma.campaignRecipient.create({
      data: {
        campaignId,
        contactId,
        status: "PENDING",
      },
      include: {
        contact: true,
      },
    });
  }

  async getRecipients(campaignId: string, query: QueryCampaignRecipientInput): Promise<RecipientListResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignRecipientWhereInput = {
      campaignId,
    };

    if (query.status) {
      where.status = query.status;
    }

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
        orderBy: { sentAt: "desc" },
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

  async delete(campaignId: string, recipientId: string): Promise<CampaignRecipient> {
    return prisma.campaignRecipient.delete({
      where: {
        id: recipientId,
        campaignId,
      },
    });
  }
}

export const campaignRecipientRepository = new CampaignRecipientRepository();
