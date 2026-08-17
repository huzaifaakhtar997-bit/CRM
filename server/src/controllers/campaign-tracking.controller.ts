import { Request, Response, NextFunction } from "express";
import { campaignTrackingService, CampaignTrackingService } from "../services/campaign-tracking.service";
import { updateRecipientStatusSchema } from "../validators/campaign-tracking.validator";
import { AppError } from "../types/auth.types";

export class CampaignTrackingController {
  constructor(private trackingServ: CampaignTrackingService) {}

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const recipientId = Array.isArray(req.params.recipientId) ? req.params.recipientId[0] : req.params.recipientId;

      const result = updateRecipientStatusSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 422); // 422 for invalid statuses
      }

      const updated = await this.trackingServ.updateRecipientStatus(
        campaignId,
        recipientId,
        result.data.status,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: "Recipient status updated successfully.",
        data: { recipient: updated },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;

      const summary = await this.trackingServ.getTrackingSummary(campaignId);

      res.status(200).json({
        success: true,
        message: "Campaign tracking summary retrieved successfully.",
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const campaignTrackingController = new CampaignTrackingController(campaignTrackingService);
