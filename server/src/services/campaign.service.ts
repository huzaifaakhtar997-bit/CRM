import { Campaign, ActivityType } from "@prisma/client";
import {
  campaignRepository,
  CampaignRepository,
  CampaignListResult,
} from "../repositories/campaign.repository";
import { prisma } from "../config/database";
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  QueryCampaignInput,
} from "../validators/campaign.validator";
import { AppError } from "../types/auth.types";

export class CampaignService {
  constructor(private campaignRepo: CampaignRepository) {}

  // ── CREATE ────────────────────────────────────────────────────────────────

  async createCampaign(input: CreateCampaignInput, currentUserId: string): Promise<Campaign> {
    // Duplicate name detection (case-insensitive)
    const existing = await this.campaignRepo.findByName(input.name);
    if (existing) {
      throw new AppError(
        `A campaign named "${input.name}" already exists. Please choose a unique name.`,
        409
      );
    }

    const campaign = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.campaign.create({
        data: {
          name: input.name,
          objective: input.objective ?? null,
          subject: input.subject ?? null,
          previewText: input.previewText ?? null,
          content: input.content ?? null,
          scheduledAt: input.scheduledAt ?? null,
          // status defaults to DRAFT via the Prisma schema
          ownerId: currentUserId,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Campaign Created",
          content: `Created campaign "${newCampaign.name}"`,
          userId: currentUserId,
          metadata: {
            campaignId: newCampaign.id,
            campaignName: newCampaign.name,
            status: newCampaign.status,
          },
        },
      });

      return newCampaign;
    });

    return campaign;
  }

  // ── READ (list) ───────────────────────────────────────────────────────────

  async getCampaigns(query: QueryCampaignInput): Promise<CampaignListResult> {
    return this.campaignRepo.findAll(query);
  }

  // ── READ (single) ─────────────────────────────────────────────────────────

  async getCampaignById(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findById(id);
    if (!campaign) {
      throw new AppError(`Campaign with ID '${id}' not found.`, 404);
    }
    return campaign;
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  async updateCampaign(
    id: string,
    input: UpdateCampaignInput,
    currentUserId: string
  ): Promise<Campaign> {
    // Guard — must exist
    const existing = await this.campaignRepo.findById(id);
    if (!existing) {
      throw new AppError(`Campaign with ID '${id}' not found.`, 404);
    }

    // Duplicate name check only when name is being changed
    if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      const nameConflict = await this.campaignRepo.findByName(input.name);
      if (nameConflict) {
        throw new AppError(
          `A campaign named "${input.name}" already exists. Please choose a unique name.`,
          409
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedCampaign = await tx.campaign.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.objective !== undefined && { objective: input.objective }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.subject !== undefined && { subject: input.subject }),
          ...(input.previewText !== undefined && { previewText: input.previewText }),
          ...(input.content !== undefined && { content: input.content }),
          ...(input.scheduledAt !== undefined && { scheduledAt: input.scheduledAt }),
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Campaign Updated",
          content: `Updated campaign "${updatedCampaign.name}"`,
          userId: currentUserId,
          metadata: {
            campaignId: updatedCampaign.id,
            campaignName: updatedCampaign.name,
            updatedFields: Object.keys(input),
          },
        },
      });

      return updatedCampaign;
    });

    return updated;
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  async deleteCampaign(id: string, currentUserId: string): Promise<{ id: string }> {
    const existing = await this.campaignRepo.findById(id);
    if (!existing) {
      throw new AppError(`Campaign with ID '${id}' not found.`, 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.campaign.delete({ where: { id } });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Campaign Deleted",
          content: `Deleted campaign "${existing.name}"`,
          userId: currentUserId,
          metadata: {
            campaignId: id,
            campaignName: existing.name,
          },
        },
      });
    });

    return { id };
  }
}

export const campaignService = new CampaignService(campaignRepository);
