import { CampaignStatus, ActivityType, CampaignRecipientStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { campaignLaunchRepository, CampaignLaunchRepository } from "../repositories/campaign-launch.repository";
import { AppError } from "../types/auth.types";
import { emailService } from "./email.service";
import { config } from "../config/env";

export interface LaunchOutcome {
  campaignId: string;
  status: CampaignStatus;
  processedRecipients: number;
  queuedRecipients: number;
  failedRecipients: number;
}

export class CampaignLaunchService {
  constructor(private launchRepo: CampaignLaunchRepository) {}

  async launchCampaign(campaignId: string, currentUserId: string): Promise<LaunchOutcome> {
    // 1. Retrieve Campaign
    const campaign = await this.launchRepo.findCampaignById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    // 2. State & validation rules
    if (campaign.status === "ACTIVE" || campaign.status === "COMPLETED") {
      throw new AppError(`Campaign has already been launched (status: ${campaign.status}).`, 409);
    }
    if (campaign.status === "PAUSED") {
      throw new AppError("Paused campaigns cannot be launched directly.", 409);
    }

    // 3. Campaign completeness validations
    if (!campaign.name || !campaign.subject || !campaign.content) {
      throw new AppError(
        "Campaign is incomplete. Name, subject, and content/body are required before launching.",
        422
      );
    }

    // 4. Ensure recipient list size > 0
    const recipientsCount = await this.launchRepo.getRecipientsCount(campaignId);
    if (recipientsCount === 0) {
      throw new AppError("Campaign must have at least one recipient assigned before launch.", 422);
    }

    // 5. Query pending recipients
    const pendingRecipients = await this.launchRepo.getPendingRecipients(campaignId);

    // 6. Pre-flight transition to ACTIVE to signify launch has started
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "ACTIVE",
        sentAt: new Date(),
      },
    });

    let successCount = 0;
    let failCount = 0;

    // 7. Process dispatch sequentially to avoid provider rate-limits (basic control for MVP)
    for (const recipient of pendingRecipients) {
      const emailAddress = recipient.contact?.email;

      if (!emailAddress) {
        // Missing email
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "FAILED",
            errorMessage: "Contact has no email address",
          },
        });
        failCount++;
        continue;
      }

      try {
        // Dispatch to Resend
        const result = await emailService.sendEmail({
          from: config.emailFromAddress,
          to: emailAddress,
          subject: campaign.subject,
          html: campaign.content,
        });

        // Provider accepted the email
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            providerMessageId: result.id, // Store real tracking ID
          },
        });
        successCount++;
      } catch (err: any) {
        // Provider rejected or network failed
        const safeErrorMessage = err.message || "Unknown provider error";
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "FAILED",
            errorMessage: safeErrorMessage.substring(0, 255), // Safe truncation
          },
        });
        failCount++;
      }
    }

    // 8. Log Launched activity
    await prisma.activity.create({
      data: {
        type: ActivityType.NOTE,
        title: "Campaign Launched",
        content: `Campaign "${campaign.name}" dispatched. Successful: ${successCount}. Failed: ${failCount}.`,
        userId: currentUserId,
        metadata: {
          campaignId,
          campaignName: campaign.name,
          successCount,
          failCount,
        },
      },
    });

    // 9. If everything failed, we could revert to PAUSED or leave ACTIVE (depends on CRM logic).
    // Usually leaving ACTIVE with FAILED recipients is correct so user can see errors.

    // Return status outputs
    return {
      campaignId,
      status: "ACTIVE",
      processedRecipients: pendingRecipients.length,
      queuedRecipients: successCount,
      failedRecipients: failCount,
    };
  }

  async processScheduledCampaigns(): Promise<number> {
    const now = new Date();
    // Find campaigns that are SCHEDULED whose scheduledAt is <= now
    const dueCampaigns = await prisma.campaign.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { not: null, lte: now },
      },
      include: {
        recipients: { select: { id: true } },
      },
    });

    if (dueCampaigns.length === 0) return 0;

    console.log(`[Scheduler] Found ${dueCampaigns.length} scheduled campaign(s) due for launch.`);

    let launchedCount = 0;
    for (const campaign of dueCampaigns) {
      try {
        // If the campaign has 0 recipients, automatically assign all contacts with emails
        if (campaign.recipients.length === 0) {
          const contacts = await prisma.contact.findMany({
            where: { email: { not: null } },
            select: { id: true },
          });
          if (contacts.length > 0) {
            await prisma.campaignRecipient.createMany({
              data: contacts.map((c) => ({
                campaignId: campaign.id,
                contactId: c.id,
                status: "PENDING",
              })),
              skipDuplicates: true,
            });
            console.log(`[Scheduler] Auto-assigned ${contacts.length} recipient(s) to scheduled campaign "${campaign.name}"`);
          }
        }

        // Launch campaign
        await this.launchCampaign(campaign.id, campaign.ownerId || "system");
        launchedCount++;
        console.log(`[Scheduler] Successfully launched scheduled campaign "${campaign.name}" (${campaign.id})`);
      } catch (err: any) {
        console.error(`[Scheduler] Failed to launch scheduled campaign ${campaign.id}:`, err?.message || err);
      }
    }

    return launchedCount;
  }
}

export const campaignLaunchService = new CampaignLaunchService(campaignLaunchRepository);
