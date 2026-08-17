import { Request, Response, NextFunction } from "express";
import { campaignAudienceService, CampaignAudienceService } from "../services/campaign-audience.service";
import {
  previewAudienceSchema,
  applyAudienceSchema,
  queryCampaignAudienceSchema,
} from "../validators/campaign-audience.validator";
import { AppError } from "../types/auth.types";

export class CampaignAudienceController {
  constructor(private audienceServ: CampaignAudienceService) {}

  previewAudience = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const result = previewAudienceSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const { filters, page, limit } = result.data;
      const preview = await this.audienceServ.previewAudience(campaignId, filters, page, limit);

      res.status(200).json({
        success: true,
        message: "Audience preview retrieved successfully.",
        data: preview,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  applyAudience = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const result = applyAudienceSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const outcome = await this.audienceServ.applyAudience(campaignId, result.data.filters, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Audience applied to campaign successfully.",
        data: outcome,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getAudience = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const result = queryCampaignAudienceSchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const data = await this.audienceServ.getAudience(campaignId, result.data);

      res.status(200).json({
        success: true,
        message: "Campaign audience retrieved successfully.",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  removeRecipient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const recipientId = Array.isArray(req.params.recipientId) ? req.params.recipientId[0] : req.params.recipientId;

      const outcome = await this.audienceServ.removeRecipient(campaignId, recipientId, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Recipient removed from campaign successfully.",
        data: outcome,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const campaignAudienceController = new CampaignAudienceController(campaignAudienceService);
