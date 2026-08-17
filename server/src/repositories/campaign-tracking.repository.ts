import { Campaign, CampaignRecipient, CampaignRecipientStatus } from "@prisma/client";
import { prisma } from "../config/database";

export interface CampaignTrackingSummary {
  campaignId: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
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

    const [sent, delivered, opened, clicked, bounced] = await Promise.all([
      prisma.campaignRecipient.count({ where: { campaignId, status: "SENT" } }),
      prisma.campaignRecipient.count({ where: { campaignId, status: "DELIVERED" } }),
      prisma.campaignRecipient.count({ where: { campaignId, status: "OPENED" } }),
      prisma.campaignRecipient.count({ where: { campaignId, status: "CLICKED" } }),
      prisma.campaignRecipient.count({ where: { campaignId, status: "BOUNCED" } }),
    ]);

    // Note: status is an enum of current status. So a recipient might be 'CLICKED' (previously opened, delivered, sent).
    // The objective mentions "sent: 120, delivered: 118, opened: 63, clicked: 24, bounced: 2".
    // Since in Prisma status is a single enum value, we calculate cumulative aggregates:
    // - bounced counts BOUNCED
    // - clicked counts CLICKED
    // - opened counts OPENED + CLICKED
    // - delivered counts DELIVERED + OPENED + CLICKED
    // - sent counts SENT + DELIVERED + OPENED + CLICKED
    // Let's implement this logic to align with standard funnel progression:
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
      REPLIED: 0, // from schema (unused in spec)
      BOUNCED: 0,
      FAILED: 0,  // from schema (unused in spec)
    };

    statusCounts.forEach((group) => {
      counts[group.status] = group._count;
    });

    const bouncedCount = counts.BOUNCED;
    const clickedCount = counts.CLICKED;
    const openedCount = counts.OPENED + clickedCount;
    const deliveredCount = counts.DELIVERED + openedCount;
    const sentCount = counts.SENT + deliveredCount + bouncedCount;

    return {
      campaignId,
      totalRecipients,
      sent: sentCount,
      delivered: deliveredCount,
      opened: openedCount,
      clicked: clickedCount,
      bounced: bouncedCount,
    };
  }
}

export const campaignTrackingRepository = new CampaignTrackingRepository();
