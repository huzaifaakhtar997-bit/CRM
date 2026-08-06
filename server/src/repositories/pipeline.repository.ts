import { PipelineStage } from "@prisma/client";
import { prisma } from "../config/database";

export class PipelineRepository {
  async findAllStages(): Promise<PipelineStage[]> {
    return prisma.pipelineStage.findMany({
      orderBy: { order: "asc" },
      include: {
        deals: {
          orderBy: { createdAt: "desc" },
          include: {
            assignedUser: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            contact: {
              select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
            },
            company: {
              select: { id: true, name: true, logoUrl: true },
            },
          },
        },
      },
    });
  }
}

export const pipelineRepository = new PipelineRepository();
