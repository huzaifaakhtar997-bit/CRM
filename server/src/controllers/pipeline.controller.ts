import { Request, Response, NextFunction } from "express";
import { pipelineService, PipelineService } from "../services/pipeline.service";
import { moveDealStageSchema } from "../validators/pipeline.validator";
import { AppError } from "../types/auth.types";

export class PipelineController {
  constructor(private pipelineServ: PipelineService) {}

  getPipelineStages = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stages = await this.pipelineServ.getPipelineStages();
      res.status(200).json({
        success: true,
        message: "Pipeline stages with deals retrieved successfully.",
        data: { stages },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  moveDealStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validationResult = moveDealStageSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const deal = await this.pipelineServ.moveDealStage(id, validationResult.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Deal pipeline stage updated successfully.",
        data: { deal },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const pipelineController = new PipelineController(pipelineService);
