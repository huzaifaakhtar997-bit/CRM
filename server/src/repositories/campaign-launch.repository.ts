import { Campaign, CampaignRecipient, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export interface RecipientProcessResult {
  processedCount: number;
  updatedRecipients: CampaignRecipient[];
}

export class CampaignLaunchRepository {
  async findCampaignById(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
    });
  }

  async getRecipientsCount(campaignId: string): Promise<number> {
    return prisma.campaignRecipient.count({
      where: { campaignId },
    });
  }

  async getPendingRecipients(campaignId: string) {
    return prisma.campaignRecipient.findMany({
      where: {
        campaignId,
        status: "PENDING",
      },
      include: {
        contact: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }
}

export const campaignLaunchRepository = new CampaignLaunchRepository();
