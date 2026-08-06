import { Request, Response, NextFunction } from "express";
import { campaignService, CampaignService } from "../services/campaign.service";
import {
  createCampaignSchema,
  updateCampaignSchema,
  queryCampaignSchema,
} from "../validators/campaign.validator";
import { AppError } from "../types/auth.types";

export class CampaignController {
  constructor(private campaignServ: CampaignService) {}

  // ── LIST ──────────────────────────────────────────────────────────────────

  getCampaigns = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = queryCampaignSchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const data = await this.campaignServ.getCampaigns(result.data);

      res.status(200).json({
        success: true,
        message: "Campaigns retrieved successfully.",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  // ── GET BY ID ─────────────────────────────────────────────────────────────

  getCampaignById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const campaign = await this.campaignServ.getCampaignById(id);

      res.status(200).json({
        success: true,
        message: "Campaign retrieved successfully.",
        data: { campaign },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  // ── CREATE ────────────────────────────────────────────────────────────────

  createCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const result = createCampaignSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const campaign = await this.campaignServ.createCampaign(result.data, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Campaign created successfully.",
        data: { campaign },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  // ── UPDATE ────────────────────────────────────────────────────────────────

  updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const result = updateCampaignSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const campaign = await this.campaignServ.updateCampaign(id, result.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Campaign updated successfully.",
        data: { campaign },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────

  deleteCampaign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.campaignServ.deleteCampaign(id, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Campaign deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const campaignController = new CampaignController(campaignService);
