import { Company, Contact, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryCompanyInput } from "../validators/company.validator";

export interface CompanyListResult {
  companies: (Company & { _count?: { contacts: number; deals: number } })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CompanyRepository {
  async findById(id: string): Promise<Company | null> {
    return prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { contacts: true, deals: true },
        },
      },
    });
  }

  async findByName(name: string): Promise<Company | null> {
    return prisma.company.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  }

  async findAll(query: QueryCompanyInput): Promise<CompanyListResult> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {};

    // Search filter (company name)
    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    // Exact industry filter
    if (query.industry) {
      where.industry = { equals: query.industry, mode: "insensitive" };
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { contacts: true, deals: true },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findCompanyContacts(companyId: string): Promise<Contact[]> {
    return prisma.contact.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async create(data: Prisma.CompanyCreateInput): Promise<Company> {
    return prisma.company.create({
      data,
    });
  }

  async update(id: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return prisma.company.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Company> {
    return prisma.company.delete({
      where: { id },
    });
  }
}

export const companyRepository = new CompanyRepository();
