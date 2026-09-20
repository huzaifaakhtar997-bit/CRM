import { Campaign, CampaignRecipient, CampaignRecipientStatus } from "@prisma/client";
import { prisma } from "../config/database";

export interface CampaignTrackingSummary {
  campaignId: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied?: number;
  bounced: number;
}

export class CampaignTrackingRepository {
  async findCampaignById(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
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

  async getTrackingSummary(campaignId: string): Promise<CampaignTrackingSummary> {
    const totalRecipients = await prisma.campaignRecipient.count({
      where: { campaignId },
    });

    const statusCounts = await prisma.campaignRecipient.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: true,
    });

    const counts: Record<CampaignRecipientStatus, number> = {
      PENDING: 0,
      SENT: 0,
      DELIVERED: 0,
      OPENED: 0,
      CLICKED: 0,
      REPLIED: 0,
      BOUNCED: 0,
      FAILED: 0,
    };

    statusCounts.forEach((group) => {
      counts[group.status] = group._count;
    });

    const bouncedCount = counts.BOUNCED;
    const repliedCount = counts.REPLIED;
    const clickedCount = counts.CLICKED;
    // An email that was replied to was delivered, opened, and sent
    const openedCount = counts.OPENED + clickedCount + repliedCount;
    const deliveredCount = counts.DELIVERED + openedCount;
    const sentCount = counts.SENT + deliveredCount + bouncedCount;

    return {
      campaignId,
      totalRecipients,
      sent: sentCount,
      delivered: deliveredCount,
      opened: openedCount,
      clicked: clickedCount,
      replied: repliedCount,
      bounced: bouncedCount,
    };
  }
}

export const campaignTrackingRepository = new CampaignTrackingRepository();
