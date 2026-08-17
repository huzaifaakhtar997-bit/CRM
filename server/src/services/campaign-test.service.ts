import { ActivityType } from "@prisma/client";
import { prisma } from "../config/database";
import { campaignTestRepository, CampaignTestRepository } from "../repositories/campaign-test.repository";
import { AppError } from "../types/auth.types";
import { emailService } from "./email.service";
import { config } from "../config/env";

export interface TestSendOutcome {
  campaignId: string;
  recipientEmail: string;
  status: "QUEUED_FOR_SMTP" | "SENT" | "FAILED";
}

export class CampaignTestService {
  constructor(private testRepo: CampaignTestRepository) {}

  async testSendCampaign(
    campaignId: string,
    recipientEmail: string,
    currentUserId: string
  ): Promise<TestSendOutcome> {
    // 1. Retrieve Campaign
    const campaign = await this.testRepo.findCampaignById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    // 2. Validate readiness: Campaign contains name, subject, and content/body
    if (!campaign.name || !campaign.subject || !campaign.content) {
      throw new AppError(
        "Campaign is incomplete. Name, subject, and content/body are required before running a test send.",
        422
      );
    }

    // 3. Dispatch Real Email
    try {
      await emailService.sendEmail({
        from: config.emailFromAddress,
        to: recipientEmail,
        subject: `[TEST] ${campaign.subject}`,
        html: campaign.content,
      });
      
      // Record Campaign Test Send Request activity
      await prisma.activity.create({
        data: {
          type: ActivityType.EMAIL,
          title: "Campaign Test Send Successful",
          content: `Test send delivered for campaign "${campaign.name}" to ${recipientEmail}`,
          userId: currentUserId,
          metadata: {
            campaignId,
            campaignName: campaign.name,
            recipientEmail,
            status: "SENT",
          },
        },
      });

      return {
        campaignId,
        recipientEmail,
        status: "SENT",
      };
    } catch (err: any) {
      // Record failure
      await prisma.activity.create({
        data: {
          type: ActivityType.EMAIL,
          title: "Campaign Test Send Failed",
          content: `Test send failed for campaign "${campaign.name}" to ${recipientEmail}: ${err.message}`,
          userId: currentUserId,
          metadata: {
            campaignId,
            campaignName: campaign.name,
            recipientEmail,
            status: "FAILED",
            error: err.message,
          },
        },
      });

      throw new AppError(`Test send failed: ${err.message}`, 400);
    }
  }
}

export const campaignTestService = new CampaignTestService(campaignTestRepository);
