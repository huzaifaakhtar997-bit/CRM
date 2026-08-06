import { Lead, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryLeadInput } from "../validators/lead.validator";

export interface LeadListResult {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class LeadRepository {
  async findById(id: string): Promise<Lead | null> {
    return prisma.lead.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        convertedContact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<Lead | null> {
    return prisma.lead.findUnique({
      where: { email },
    });
  }

  async findAll(query: QueryLeadInput): Promise<LeadListResult> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};

    // Search filter (first name, last name, email, or company name)
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { company: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Exact match filters
    if (query.status) {
      where.status = query.status;
    }
    if (query.source) {
      where.source = query.source;
    }
    if (query.assignedUserId) {
      where.assignedUserId = query.assignedUserId;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          convertedContact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: Prisma.LeadCreateInput): Promise<Lead> {
    return prisma.lead.create({
      data,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.LeadUpdateInput): Promise<Lead> {
    return prisma.lead.update({
      where: { id },
      data,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async delete(id: string): Promise<Lead> {
    return prisma.lead.delete({
      where: { id },
    });
  }
}

export const leadRepository = new LeadRepository();
