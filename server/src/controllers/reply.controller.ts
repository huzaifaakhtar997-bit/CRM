import { Request, Response, NextFunction } from "express";
import { replyService, ReplyService } from "../services/reply.service";
import { replySchema } from "../validators/reply.validator";
import { AppError } from "../types/auth.types";

export class ReplyController {
  constructor(private replyServ: ReplyService) {}

  sendReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const conversationId = Array.isArray(req.params.conversationId)
        ? req.params.conversationId[0]
        : req.params.conversationId;

      const result = replySchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const message = await this.replyServ.sendReply(
        conversationId,
        result.data,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Reply sent successfully.",
        data: { message },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const replyController = new ReplyController(replyService);
