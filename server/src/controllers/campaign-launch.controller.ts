import { Request, Response, NextFunction } from "express";
import { campaignLaunchService, CampaignLaunchService } from "../services/campaign-launch.service";
import { AppError } from "../types/auth.types";

export class CampaignLaunchController {
  constructor(private launchServ: CampaignLaunchService) {}

  launch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;

      const outcome = await this.launchServ.launchCampaign(campaignId, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Campaign launched successfully.",
        data: outcome,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const campaignLaunchController = new CampaignLaunchController(campaignLaunchService);
