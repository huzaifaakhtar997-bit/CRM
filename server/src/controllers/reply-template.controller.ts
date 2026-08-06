import { Request, Response, NextFunction } from "express";
import { replyService, ReplyService } from "../services/reply.service";
import { replyWithTemplateSchema } from "../validators/reply-template.validator";
import { AppError } from "../types/auth.types";

export class ReplyTemplateController {
  constructor(private replyServ: ReplyService) {}

  sendReplyWithTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const conversationId = Array.isArray(req.params.conversationId)
        ? req.params.conversationId[0]
        : req.params.conversationId;

      const result = replyWithTemplateSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const message = await this.replyServ.sendReplyWithTemplate(
        conversationId,
        result.data.templateId,
        result.data.variables || {},
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Reply sent successfully using template.",
        data: { message },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const replyTemplateController = new ReplyTemplateController(replyService);
