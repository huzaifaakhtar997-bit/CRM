import { CampaignRecipient, ActivityType, Contact } from "@prisma/client";
import { prisma } from "../config/database";
import {
  campaignRecipientRepository,
  CampaignRecipientRepository,
  RecipientListResult,
} from "../repositories/campaign-recipient.repository";
import { campaignRepository } from "../repositories/campaign.repository";
import { AppError } from "../types/auth.types";
import { QueryCampaignRecipientInput } from "../validators/campaign-recipient.validator";

export class CampaignRecipientService {
  constructor(private recipientRepo: CampaignRecipientRepository) {}

  async addRecipient(
    campaignId: string,
    contactId: string,
    currentUserId: string
  ): Promise<CampaignRecipient & { contact: Contact }> {
    // 1. Verify campaign exists
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    // 2. Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      throw new AppError(`Contact with ID '${contactId}' not found.`, 404);
    }

    // 3. Verify not already added to the campaign
    const existing = await this.recipientRepo.findByCampaignAndContact(campaignId, contactId);
    if (existing) {
      throw new AppError(`Contact is already a recipient of this campaign.`, 409);
    }

    // 4. Create record and log activity in transaction
    const newRecipient = await prisma.$transaction(async (tx) => {
      const created = await tx.campaignRecipient.create({
        data: {
          campaignId,
          contactId,
          status: "PENDING",
        },
        include: {
          contact: true,
        },
      });

      const contactName = `${contact.firstName} ${contact.lastName}`;
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Campaign Recipient Added",
          content: `Added contact "${contactName}" to campaign "${campaign.name}"`,
          userId: currentUserId,
          metadata: {
            campaignId,
            campaignName: campaign.name,
            contactId,
            contactName,
            recipientId: created.id,
          },
        },
      });

      return created;
    });

    return newRecipient;
  }

  async bulkAddRecipients(
    campaignId: string,
    contactIds: string[],
    currentUserId: string
  ): Promise<{
    createdCount: number;
    skippedCount: number;
    totalRecipients: number;
  }> {
    // 1. Verify campaign exists
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    // 2. Verify all contacts exist in DB
    const contactsInDb = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true },
    });
    const validContactIds = contactsInDb.map((c) => c.id);

    // Skip any contactId in request that doesn't exist in DB (silent ignore or throw? the spec says "Skip duplicates. Skip non-existent or return total counts". Let's filter input to only valid ones)
    const existingContactIdsOnCampaign = await this.recipientRepo.findExistingContactIds(campaignId, validContactIds);

    const contactIdsToInsert = validContactIds.filter(
      (id) => !existingContactIdsOnCampaign.includes(id)
    );

    const skippedCount = contactIds.length - contactIdsToInsert.length;

    await prisma.$transaction(async (tx) => {
      if (contactIdsToInsert.length > 0) {
        await tx.campaignRecipient.createMany({
          data: contactIdsToInsert.map((contactId) => ({
            campaignId,
            contactId,
            status: "PENDING",
          })),
          skipDuplicates: true,
        });
      }

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Campaign Recipients Added",
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

  async getRecipientDetails(
    campaignId: string,
    recipientId: string
  ): Promise<CampaignRecipient & { contact: Contact }> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    const recipient = await this.recipientRepo.findById(campaignId, recipientId);
    if (!recipient) {
      throw new AppError(`Recipient with ID '${recipientId}' not found in campaign '${campaignId}'.`, 404);
    }

    return recipient;
  }

  async getRecipients(campaignId: string, query: QueryCampaignRecipientInput): Promise<RecipientListResult> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    return this.recipientRepo.getRecipients(campaignId, query);
  }

  async removeRecipient(campaignId: string, recipientId: string, currentUserId: string): Promise<{ id: string }> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${campaignId}' not found.`, 404);
    }

    const recipient = await this.recipientRepo.findById(campaignId, recipientId);
    if (!recipient) {
      throw new AppError(`Recipient with ID '${recipientId}' not found in campaign '${campaignId}'.`, 404);
    }

    const contactName = `${recipient.contact.firstName} ${recipient.contact.lastName}`;

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

export const campaignRecipientService = new CampaignRecipientService(campaignRecipientRepository);
