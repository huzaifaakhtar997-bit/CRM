import { CampaignRecipient, CampaignRecipientStatus, ActivityType } from "@prisma/client";
import { prisma } from "../config/database";
import { campaignTrackingRepository, CampaignTrackingRepository, CampaignTrackingSummary } from "../repositories/campaign-tracking.repository";
import { AppError } from "../types/auth.types";
import { emailService } from "./email.service";

export class CampaignTrackingService {
  private statusPriority: Record<CampaignRecipientStatus, number> = {
    PENDING: 0,
    SENT: 1,
    DELIVERED: 2,
    OPENED: 3,
    CLICKED: 4,
    REPLIED: 5,
    BOUNCED: 2, // Bounced can happen after Sent
    FAILED: 2,
  };

  constructor(private trackingRepo: CampaignTrackingRepository) {}

  async updateRecipientStatus(
    campaignId: string,
    recipientId: string,
    newStatus: CampaignRecipientStatus,
    currentUserId: string
  ): Promise<CampaignRecipient> {
    // 1. Verify campaign exists
    const campaign = await this.trackingRepo.findCampaignById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    // 2. Verify recipient exists
    const recipient = await this.trackingRepo.findRecipientById(campaignId, recipientId);
    if (!recipient) {
      throw new AppError(`Recipient with ID '${recipientId}' not found in campaign '${campaignId}'.`, 404);
    }

    const currentStatus = recipient.status;

    // 3. Validate state transitions
    // - PENDING -> SENT -> DELIVERED -> OPENED -> CLICKED (standard progression)
    // - SENT -> BOUNCED (bounced progression)
    // Avoid backwards status or jumping from PENDING directly to DELIVERED/OPENED/CLICKED without going through SENT
    if (newStatus === "BOUNCED") {
      if (currentStatus !== "SENT" && currentStatus !== "PENDING") {
        throw new AppError(`Invalid transition: Cannot move from ${currentStatus} to BOUNCED.`, 409);
      }
    } else {
      const currentPriority = this.statusPriority[currentStatus];
      const newPriority = this.statusPriority[newStatus];

      if (newPriority <= currentPriority) {
        throw new AppError(`Invalid transition: Cannot move backwards from ${currentStatus} to ${newStatus}.`, 409);
      }
      // Ensure it doesn't bypass SENT state
      if (currentStatus === "PENDING" && newStatus !== "SENT") {
        throw new AppError(`Invalid transition: Must transition to SENT from PENDING before moving to ${newStatus}.`, 409);
      }
    }

    // 4. Determine timestamps to set (preserve existing ones)
    const now = new Date();
    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === "SENT" && !recipient.sentAt) {
      updateData.sentAt = now;
    }
    if (newStatus === "DELIVERED" && !recipient.deliveredAt) {
      updateData.deliveredAt = now;
    }
    if (newStatus === "OPENED") {
      if (!recipient.openedAt) updateData.openedAt = now;
      if (!recipient.deliveredAt) updateData.deliveredAt = now; // Auto set delivered if opened
    }
    if (newStatus === "CLICKED") {
      if (!recipient.clickedAt) updateData.clickedAt = now;
      if (!recipient.openedAt) updateData.openedAt = now;      // Auto set opened if clicked
      if (!recipient.deliveredAt) updateData.deliveredAt = now; // Auto set delivered if clicked
    }

    // Fetch contact detail for logging
    const contact = await prisma.contact.findUnique({
      where: { id: recipient.contactId },
      select: { email: true },
    });
    const contactEmail = contact?.email || "unknown@crm.test";

    // 5. Update state and log activity in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.campaignRecipient.update({
        where: { id: recipientId },
        data: updateData,
      });

      // Map enum state into custom activity log title/messages
      let activityTitle = "Campaign Recipient Status Changed";
      let activityContent = `Recipient ${contactEmail} status marked as ${newStatus}.`;

      if (newStatus === "DELIVERED") {
        activityTitle = "Campaign Recipient Delivered";
        activityContent = `Recipient ${contactEmail} marked as DELIVERED.`;
      } else if (newStatus === "OPENED") {
        activityTitle = "Campaign Recipient Opened";
        activityContent = `Recipient ${contactEmail} opened campaign.`;
      } else if (newStatus === "CLICKED") {
        activityTitle = "Campaign Recipient Clicked";
        activityContent = `Recipient ${contactEmail} clicked campaign link.`;
      } else if (newStatus === "BOUNCED") {
        activityTitle = "Campaign Recipient Bounced";
        activityContent = `Recipient ${contactEmail} bounced.`;
      }

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: activityTitle,
          content: activityContent,
          userId: currentUserId,
          metadata: {
            campaignId,
            recipientId,
            contactEmail,
            status: newStatus,
          },
        },
      });

      return result;
    });

    return updated;
  }

  async syncWithProvider(campaignId: string): Promise<void> {
    const recipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId,
        providerMessageId: { not: null },
        status: { in: [CampaignRecipientStatus.PENDING, CampaignRecipientStatus.SENT, CampaignRecipientStatus.DELIVERED, CampaignRecipientStatus.OPENED] },
      },
    });

    if (recipients.length === 0) return;

    await Promise.allSettled(
      recipients.map(async (recipient) => {
        if (!recipient.providerMessageId) return;
        try {
          const emailData = await emailService.getEmail(recipient.providerMessageId);
          if (!emailData || !emailData.last_event) return;

          const lastEvent = String(emailData.last_event).toLowerCase();
          let newStatus: CampaignRecipientStatus | null = null;

          if (lastEvent === "clicked") newStatus = CampaignRecipientStatus.CLICKED;
          else if (lastEvent === "opened") newStatus = CampaignRecipientStatus.OPENED;
          else if (lastEvent === "delivered") newStatus = CampaignRecipientStatus.DELIVERED;
          else if (lastEvent === "bounced" || lastEvent === "complained") newStatus = CampaignRecipientStatus.BOUNCED;
          else if (lastEvent === "failed") newStatus = CampaignRecipientStatus.FAILED;

          if (!newStatus) return;

          const currentPriority = this.statusPriority[recipient.status] ?? 0;
          const newPriority = this.statusPriority[newStatus] ?? 0;

          if (newPriority > currentPriority || newStatus === CampaignRecipientStatus.BOUNCED || newStatus === CampaignRecipientStatus.FAILED) {
            const now = new Date();
            const updateData: any = { status: newStatus };
            if (newStatus === CampaignRecipientStatus.DELIVERED && !recipient.deliveredAt) updateData.deliveredAt = now;
            if (newStatus === CampaignRecipientStatus.OPENED) {
              if (!recipient.openedAt) updateData.openedAt = now;
              if (!recipient.deliveredAt) updateData.deliveredAt = now;
            }
            if (newStatus === CampaignRecipientStatus.CLICKED) {
              if (!recipient.clickedAt) updateData.clickedAt = now;
              if (!recipient.openedAt) updateData.openedAt = now;
              if (!recipient.deliveredAt) updateData.deliveredAt = now;
            }

            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: updateData,
            });
            console.log(`[Tracking] Recipient ${recipient.id} synced to ${newStatus} from Resend.`);
          }
        } catch (err: any) {
          // ignore individual sync errors
        }
      })
    );
  }

  async getTrackingSummary(campaignId: string): Promise<CampaignTrackingSummary> {
    const campaign = await this.trackingRepo.findCampaignById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    try {
      await this.syncWithProvider(campaignId);
    } catch (err) {
      console.warn(`[Tracking] Live sync with Resend failed:`, err);
    }

    return this.trackingRepo.getTrackingSummary(campaignId);
  }
}

export const campaignTrackingService = new CampaignTrackingService(campaignTrackingRepository);
