import { Request, Response, NextFunction } from "express";
import { campaignReplyService, CampaignReplyService } from "../services/campaign-reply.service";
import { campaignIncomingReplySchema } from "../validators/campaign-reply.validator";
import { AppError } from "../types/auth.types";

export class CampaignReplyController {
  constructor(private replyServ: CampaignReplyService) {}

  processReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const campaignId = Array.isArray(req.params.campaignId)
        ? req.params.campaignId[0]
        : req.params.campaignId;

      const result = campaignIncomingReplySchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new AppError(`Validation failed: ${errors}`, 422);
      }

      const { recipientEmail, subject, content } = result.data;

      const outcome = await this.replyServ.processIncomingReply(
        campaignId,
        recipientEmail,
        subject,
        content,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: "Campaign reply processed successfully.",
        data: outcome,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const campaignReplyController = new CampaignReplyController(campaignReplyService);
