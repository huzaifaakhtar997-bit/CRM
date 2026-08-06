import { Campaign, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryCampaignInput } from "../validators/campaign.validator";

// ---------------------------------------------------------------------------
// Return shape for list queries
// ---------------------------------------------------------------------------
export interface CampaignListResult {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Prisma include clause – owner details returned with every campaign
// ---------------------------------------------------------------------------
const campaignInclude = {
  owner: {
    select: { id: true, name: true, email: true },
  },
};

// ---------------------------------------------------------------------------
// Repository – ONLY Prisma operations, zero business logic
// ---------------------------------------------------------------------------
export class CampaignRepository {
  // ── READ ──────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Campaign | null> {
    return prisma.campaign.findUnique({
      where: { id },
      include: campaignInclude,
    });
  }

  async findByName(name: string): Promise<Campaign | null> {
    return prisma.campaign.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  }

  async findAll(query: QueryCampaignInput): Promise<CampaignListResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CampaignWhereInput = {};

    // Search across name and subject (case-insensitive)
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { subject: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: campaignInclude,
      }),
      prisma.campaign.count({ where }),
    ]);

    return {
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ── WRITE ─────────────────────────────────────────────────────────────────

  async create(data: Prisma.CampaignUncheckedCreateInput): Promise<Campaign> {
    return prisma.campaign.create({
      data,
      include: campaignInclude,
    });
  }

  async update(id: string, data: Prisma.CampaignUpdateInput): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data,
      include: campaignInclude,
    });
  }

  async delete(id: string): Promise<Campaign> {
    return prisma.campaign.delete({
      where: { id },
    });
  }
}

export const campaignRepository = new CampaignRepository();
