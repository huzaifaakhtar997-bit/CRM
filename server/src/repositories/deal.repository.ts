import { Deal, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryDealInput } from "../validators/deal.validator";

export interface DealListResult {
  deals: Deal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Standard relations included on every Deal response
const dealInclude = {
  stage: {
    select: { id: true, name: true, order: true, color: true, probability: true, isWon: true, isLost: true },
  },
  contact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      assignedUserId: true,
      conversations: {
        select: { assignedUserId: true },
      },
    },
  },
  company: {
    select: { id: true, name: true, logoUrl: true },
  },
  assignedUser: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
};

export class DealRepository {
  async findById(id: string): Promise<Deal | null> {
    return prisma.deal.findUnique({
      where: { id },
      include: dealInclude,
    });
  }

  async findAll(query: QueryDealInput): Promise<DealListResult> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DealWhereInput = {};

    // Search by deal title, contact name, contact email, or company name (case-insensitive)
    const searchTerm = query.search?.trim();
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        {
          contact: {
            OR: [
              { firstName: { contains: searchTerm, mode: "insensitive" } },
              { lastName: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
        {
          company: {
            name: { contains: searchTerm, mode: "insensitive" },
          },
        },
      ];
    }

    // Exact-match filters
    if (query.stageId) where.stageId = query.stageId;
    if (query.assignedUserId) {
      if (query.assignedUserId === "unassigned" || query.assignedUserId === "none") {
        const unassignedFilter: Prisma.DealWhereInput = {
          AND: [
            { assignedUserId: null },
            {
              OR: [
                { contactId: null },
                {
                  contact: {
                    assignedUserId: null,
                    conversations: { none: { assignedUserId: { not: null } } },
                  },
                },
              ],
            },
          ],
        };
        where.AND = [
          ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
          unassignedFilter,
        ];
      } else {
        const userFilter: Prisma.DealWhereInput = {
          OR: [
            { assignedUserId: query.assignedUserId },
            { contact: { assignedUserId: query.assignedUserId } },
            { contact: { conversations: { some: { assignedUserId: query.assignedUserId } } } },
          ],
        };
        where.AND = [
          ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
          userFilter,
        ];
      }
    }
    if (query.companyId) where.companyId = query.companyId;
    if (query.contactId) where.contactId = query.contactId;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: dealInclude,
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      deals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: Prisma.DealCreateInput): Promise<Deal> {
    return prisma.deal.create({
      data,
      include: dealInclude,
    });
  }

  async update(id: string, data: Prisma.DealUpdateInput): Promise<Deal> {
    return prisma.deal.update({
      where: { id },
      data,
      include: dealInclude,
    });
  }

  async delete(id: string): Promise<Deal> {
    return prisma.deal.delete({
      where: { id },
    });
  }
}

export const dealRepository = new DealRepository();
