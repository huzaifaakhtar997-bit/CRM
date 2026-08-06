import { Contact, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryContactInput } from "../validators/contact.validator";

export interface ContactListResult {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ContactRepository {
  async findById(id: string): Promise<Contact | null> {
    return prisma.contact.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<Contact | null> {
    return prisma.contact.findUnique({
      where: { email },
    });
  }

  async findAll(query: QueryContactInput): Promise<ContactListResult> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {};

    // Search filter (first name, last name, or email)
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Exact match filters
    if (query.lifecycleStage) {
      where.lifecycleStage = query.lifecycleStage;
    }
    if (query.assignedUserId) {
      where.assignedUserId = query.assignedUserId;
    }
    if (query.companyId) {
      where.companyId = query.companyId;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          company: {
            select: { id: true, name: true, logoUrl: true },
          },
          assignedUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: Prisma.ContactCreateInput): Promise<Contact> {
    return prisma.contact.create({
      data,
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ContactUpdateInput): Promise<Contact> {
    return prisma.contact.update({
      where: { id },
      data,
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async delete(id: string): Promise<Contact> {
    return prisma.contact.delete({
      where: { id },
    });
  }
}

export const contactRepository = new ContactRepository();
