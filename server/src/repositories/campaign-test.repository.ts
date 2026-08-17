import { Campaign } from "@prisma/client";
import { prisma } from "../config/database";

export class CampaignTestRepository {
  async findCampaignById(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
    });
  }
}

export const campaignTestRepository = new CampaignTestRepository();
