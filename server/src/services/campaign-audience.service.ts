import { CampaignRecipient, ActivityType, Contact } from "@prisma/client";
import { prisma } from "../config/database";
import {
  campaignAudienceRepository,
  CampaignAudienceRepository,
  RecipientListResult,
} from "../repositories/campaign-audience.repository";
import { campaignRepository } from "../repositories/campaign.repository";
import { AppError } from "../types/auth.types";
import { QueryCampaignAudienceInput } from "../validators/campaign-audience.validator";

export class CampaignAudienceService {
  constructor(private audienceRepo: CampaignAudienceRepository) {}

  async previewAudience(campaignId: string, filters: any, page: number, limit: number): Promise<{
    contacts: Contact[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    const { contacts, total } = await this.audienceRepo.getContactsByFiltersPaginated(filters, page, limit);

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async applyAudience(campaignId: string, filters: any, currentUserId: string): Promise<{
    createdCount: number;
    skippedCount: number;
    totalRecipients: number;
  }> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    const matchingContacts = await this.audienceRepo.getContactsByFilters(filters);
    const existingContactIds = await this.audienceRepo.getExistingRecipientIds(campaignId);

    const contactIdsToInsert = matchingContacts
      .map((c) => c.id)
      .filter((id) => !existingContactIds.includes(id));

    const skippedCount = matchingContacts.length - contactIdsToInsert.length;

    await prisma.$transaction(async (tx) => {
      if (contactIdsToInsert.length > 0) {
        await tx.campaignRecipient.createMany({
          data: contactIdsToInsert.map((contactId) => ({
            campaignId,
            contactId,
            status: "PENDING",
          })),
          skipDuplicates: true, // Safeguard
        });
      }

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Campaign Audience Applied",
          content: `Added ${contactIdsToInsert.length} recipients to campaign "${campaign.name}"`,
          userId: currentUserId,
          metadata: {
            campaignId,
            campaignName: campaign.name,
            addedCount: contactIdsToInsert.length,
            skippedCount,
          },
        },
      });
    });

    const totalRecipients = await prisma.campaignRecipient.count({
      where: { campaignId },
    });

    return {
      createdCount: contactIdsToInsert.length,
      skippedCount,
      totalRecipients,
    };
  }

  async getAudience(campaignId: string, query: QueryCampaignAudienceInput): Promise<RecipientListResult> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    return this.audienceRepo.getRecipients(campaignId, query);
  }

  async removeRecipient(campaignId: string, recipientId: string, currentUserId: string): Promise<{ id: string }> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    const recipient = await this.audienceRepo.findRecipientById(campaignId, recipientId);
    if (!recipient) {
      throw new AppError(`Recipient with ID '${recipientId}' not found in campaign '${campaignId}'.`, 404);
    }

    const contact = await prisma.contact.findUnique({
      where: { id: recipient.contactId },
      select: { firstName: true, lastName: true },
    });

    const contactName = contact ? `${contact.firstName} ${contact.lastName}` : "Unknown Contact";

    await prisma.$transaction(async (tx) => {
      await tx.campaignRecipient.delete({
        where: { id: recipientId },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Campaign Recipient Removed",
          content: `Removed recipient "${contactName}" from campaign "${campaign.name}"`,
          userId: currentUserId,
          metadata: {
            campaignId,
            campaignName: campaign.name,
            recipientId,
            contactName,
          },
        },
      });
    });

    return { id: recipientId };
  }
}

export const campaignAudienceService = new CampaignAudienceService(campaignAudienceRepository);
