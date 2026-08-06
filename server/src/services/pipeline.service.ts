import { PipelineStage, Deal, ActivityType } from "@prisma/client";
import { pipelineRepository, PipelineRepository } from "../repositories/pipeline.repository";
import { prisma } from "../config/database";
import { AppError } from "../types/auth.types";
import { MoveDealStageInput } from "../validators/pipeline.validator";

export class PipelineService {
  constructor(private pipelineRepo: PipelineRepository) {}

  async getPipelineStages(): Promise<PipelineStage[]> {
    return this.pipelineRepo.findAllStages();
  }

  async moveDealStage(
    dealId: string,
    input: MoveDealStageInput,
    currentUserId: string
  ): Promise<Deal> {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { stage: true },
    });

    if (!deal) {
      throw new AppError(`Deal with ID '${dealId}' not found.`, 404);
    }

    const targetStage = await prisma.pipelineStage.findUnique({
      where: { id: input.stageId },
    });

    if (!targetStage) {
      throw new AppError(`Pipeline stage with ID '${input.stageId}' not found.`, 400);
    }

    // Determine state changes
    let closedAt: Date | null = null;
    let lostReason: string | null = null;
    let probability = targetStage.probability;

    if (targetStage.isWon || targetStage.isLost) {
      closedAt = new Date();
      if (targetStage.isLost) {
        lostReason = input.lostReason || "No reason provided";
      }
    }

    const updatedDeal = await prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id: dealId },
        data: {
          stageId: targetStage.id,
          probability,
          closedAt,
          lostReason,
        },
        include: {
          stage: { select: { id: true, name: true, color: true, isWon: true, isLost: true } },
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
        },
      });

      // Log the STAGE_CHANGE activity
      await tx.activity.create({
        data: {
          type: ActivityType.STAGE_CHANGE,
          title: "Deal Stage Changed",
          content: `Moved deal "${updated.title}" from "${deal.stage.name}" to "${targetStage.name}"${
            lostReason ? ` (Reason: ${lostReason})` : ""
          }`,
          userId: currentUserId,
          dealId: updated.id,
          metadata: {
            previousStageId: deal.stage.id,
            previousStageName: deal.stage.name,
            newStageId: targetStage.id,
            newStageName: targetStage.name,
            lostReason,
          },
        },
      });

      return updated;
    });

    return updatedDeal;
  }
}

export const pipelineService = new PipelineService(pipelineRepository);
