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
}

export const campaignLaunchService = new CampaignLaunchService(campaignLaunchRepository);
