import { Template, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryTemplateInput } from "../validators/template.validator";

export interface TemplateListResult {
  templates: Template[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const templateInclude = {
  createdBy: {
    select: { id: true, name: true, email: true },
  },
};

export class TemplateRepository {
  async findById(id: string): Promise<Template | null> {
    return prisma.template.findUnique({
      where: { id },
      include: templateInclude,
    });
  }

  async findAll(query: QueryTemplateInput): Promise<TemplateListResult> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TemplateWhereInput = {};

    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }

    if (query.type) {
      where.type = query.type;
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: templateInclude,
      }),
      prisma.template.count({ where }),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: Prisma.TemplateUncheckedCreateInput): Promise<Template> {
    return prisma.template.create({
      data,
      include: templateInclude,
    });
  }

  async update(id: string, data: Prisma.TemplateUpdateInput): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data,
      include: templateInclude,
    });
  }

  async delete(id: string): Promise<Template> {
    return prisma.template.delete({
      where: { id },
    });
  }
}

export const templateRepository = new TemplateRepository();
