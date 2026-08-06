import { Deal, ActivityType } from "@prisma/client";
import { dealRepository, DealRepository, DealListResult } from "../repositories/deal.repository";
import { prisma } from "../config/database";
import { CreateDealInput, UpdateDealInput, QueryDealInput } from "../validators/deal.validator";
import { AppError } from "../types/auth.types";

export class DealService {
  constructor(private dealRepo: DealRepository) {}

  async createDeal(input: CreateDealInput, currentUserId: string): Promise<Deal> {
    // Verify pipeline stage exists
    const stage = await prisma.pipelineStage.findUnique({ where: { id: input.stageId } });
    if (!stage) {
      throw new AppError(`Pipeline stage with ID '${input.stageId}' not found.`, 400);
    }

    // Verify company exists if provided
    if (input.companyId) {
      const company = await prisma.company.findUnique({ where: { id: input.companyId } });
      if (!company) throw new AppError(`Company with ID '${input.companyId}' not found.`, 400);
    }

    // Verify contact exists if provided
    if (input.contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: input.contactId } });
      if (!contact) throw new AppError(`Contact with ID '${input.contactId}' not found.`, 400);
    }

    const deal = await prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: {
          title: input.title,
          value: input.value ?? 0,
          currency: input.currency ?? "USD",
          probability: input.probability ?? stage.probability,
          expectedCloseDate: input.expectedCloseDate,
          priority: input.priority,
          notes: input.notes,
          lostReason: input.lostReason,
          stage: { connect: { id: input.stageId } },
          ...(input.companyId && { company: { connect: { id: input.companyId } } }),
          ...(input.contactId && { contact: { connect: { id: input.contactId } } }),
          ...(input.assignedUserId
            ? { assignedUser: { connect: { id: input.assignedUserId } } }
            : { assignedUser: { connect: { id: currentUserId } } }),
        },
        include: {
          stage: { select: { id: true, name: true, color: true, isWon: true, isLost: true } },
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.DEAL_CREATED,
          title: "Deal Created",
          content: `Created deal "${newDeal.title}" worth ${newDeal.currency} ${newDeal.value.toLocaleString()} in stage "${stage.name}"`,
          userId: currentUserId,
          dealId: newDeal.id,
          metadata: {
            stageId: newDeal.stageId,
            stageName: stage.name,
            value: newDeal.value,
            currency: newDeal.currency,
          },
        },
      });

      return newDeal;
    });

    return deal;
  }

  async getDeals(query: QueryDealInput): Promise<DealListResult> {
    return this.dealRepo.findAll(query);
  }

  async getDealById(id: string): Promise<Deal> {
    const deal = await this.dealRepo.findById(id);
    if (!deal) {
      throw new AppError(`Deal with ID '${id}' not found.`, 404);
    }
    return deal;
  }

  async updateDeal(id: string, input: UpdateDealInput, currentUserId: string): Promise<Deal> {
    const existing = await this.dealRepo.findById(id);
    if (!existing) {
      throw new AppError(`Deal with ID '${id}' not found.`, 404);
    }

    if (input.stageId && input.stageId !== (existing as any).stageId) {
      const stage = await prisma.pipelineStage.findUnique({ where: { id: input.stageId } });
      if (!stage) throw new AppError(`Pipeline stage with ID '${input.stageId}' not found.`, 400);
    }

    const updatedDeal = await prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.value !== undefined && { value: input.value }),
          ...(input.currency !== undefined && { currency: input.currency }),
          ...(input.probability !== undefined && { probability: input.probability }),
          ...(input.expectedCloseDate !== undefined && { expectedCloseDate: input.expectedCloseDate }),
          ...(input.closedAt !== undefined && { closedAt: input.closedAt }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.lostReason !== undefined && { lostReason: input.lostReason }),
          ...(input.stageId !== undefined && { stage: { connect: { id: input.stageId } } }),
          ...(input.companyId !== undefined && {
            company: input.companyId ? { connect: { id: input.companyId } } : { disconnect: true },
          }),
          ...(input.contactId !== undefined && {
            contact: input.contactId ? { connect: { id: input.contactId } } : { disconnect: true },
          }),
          ...(input.assignedUserId !== undefined && {
            assignedUser: input.assignedUserId ? { connect: { id: input.assignedUserId } } : { disconnect: true },
          }),
        },
        include: {
          stage: { select: { id: true, name: true, color: true, isWon: true, isLost: true } },
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
        },
      });

      // Stage change specific activity
      if (input.stageId && input.stageId !== (existing as any).stageId) {
        await tx.activity.create({
          data: {
            type: ActivityType.STAGE_CHANGE,
            title: "Deal Stage Changed",
            content: `Moved deal "${updated.title}" to stage "${updated.stage?.name}"`,
            userId: currentUserId,
            dealId: updated.id,
            metadata: {
              previousStageId: (existing as any).stageId,
              newStageId: updated.stageId,
              newStageName: updated.stage?.name,
            },
          },
        });
      }

      // General update activity log
      await tx.activity.create({
        data: {
          type: ActivityType.NOTE,
          title: "Deal Updated",
          content: `Updated deal "${updated.title}"`,
          userId: currentUserId,
          dealId: updated.id,
          metadata: { updatedFields: Object.keys(input) },
        },
      });

      return updated;
    });

    return updatedDeal;
  }

  async deleteDeal(id: string): Promise<{ id: string }> {
    const existing = await this.dealRepo.findById(id);
    if (!existing) {
      throw new AppError(`Deal with ID '${id}' not found.`, 404);
    }

    await this.dealRepo.delete(id);
    return { id };
  }
}

export const dealService = new DealService(dealRepository);
