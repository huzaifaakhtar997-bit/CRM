import { Request, Response, NextFunction } from "express";
import { campaignTestService, CampaignTestService } from "../services/campaign-test.service";
import { campaignTestSendSchema } from "../validators/campaign-test.validator";
import { AppError } from "../types/auth.types";

export class CampaignTestController {
  constructor(private testServ: CampaignTestService) {}

  testSend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId) ? req.params.campaignId[0] : req.params.campaignId;
      const result = campaignTestSendSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 422); // Requesting 422 for validation schema matches
      }

      const outcome = await this.testServ.testSendCampaign(campaignId, result.data.email, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Campaign passed validation and test send was recorded.",
        data: outcome,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const campaignTestController = new CampaignTestController(campaignTestService);
