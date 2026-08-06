import { Template, ActivityType } from "@prisma/client";
import { templateRepository, TemplateRepository, TemplateListResult } from "../repositories/template.repository";
import { prisma } from "../config/database";
import { CreateTemplateInput, UpdateTemplateInput, QueryTemplateInput } from "../validators/template.validator";
import { AppError } from "../types/auth.types";

export class TemplateService {
  constructor(private templateRepo: TemplateRepository) {}

  async createTemplate(input: CreateTemplateInput, currentUserId: string): Promise<Template> {
    const template = await prisma.$transaction(async (tx) => {
      const newTemplate = await tx.template.create({
        data: {
          name: input.name,
          type: input.type,
          subject: input.subject,
          content: input.content,
          createdById: currentUserId,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Template Created",
          content: `Created reply template "${newTemplate.name}"`,
          userId: currentUserId,
          metadata: {
            templateId: newTemplate.id,
            templateName: newTemplate.name,
            templateType: newTemplate.type,
          },
        },
      });

      return newTemplate;
    });

    return template;
  }

  async getTemplates(query: QueryTemplateInput): Promise<TemplateListResult> {
    return this.templateRepo.findAll(query);
  }

  async getTemplateById(id: string): Promise<Template> {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw new AppError(`Template with ID '${id}' not found.`, 404);
    }
    return template;
  }

  async updateTemplate(id: string, input: UpdateTemplateInput, currentUserId: string): Promise<Template> {
    const existing = await this.templateRepo.findById(id);
    if (!existing) {
      throw new AppError(`Template with ID '${id}' not found.`, 404);
    }

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const updated = await tx.template.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.type !== undefined && { type: input.type }),
          ...(input.subject !== undefined && { subject: input.subject }),
          ...(input.content !== undefined && { content: input.content }),
        },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Template Updated",
          content: `Updated reply template "${updated.name}"`,
          userId: currentUserId,
          metadata: {
            templateId: updated.id,
            templateName: updated.name,
            updatedFields: Object.keys(input),
          },
        },
      });

      return updated;
    });

    return updatedTemplate;
  }

  async deleteTemplate(id: string, currentUserId: string): Promise<{ id: string }> {
    const existing = await this.templateRepo.findById(id);
    if (!existing) {
      throw new AppError(`Template with ID '${id}' not found.`, 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.template.delete({
        where: { id },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Template Deleted",
          content: `Deleted reply template "${existing.name}"`,
          userId: currentUserId,
          metadata: {
            templateId: id,
            templateName: existing.name,
          },
        },
      });
    });

    return { id };
  }
}

export const templateService = new TemplateService(templateRepository);
