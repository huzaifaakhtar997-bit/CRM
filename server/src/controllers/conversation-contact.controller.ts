import { Request, Response, NextFunction } from "express";
import { conversationContactService, ConversationContactService } from "../services/conversation-contact.service";
import { linkExistingContactSchema, createAndLinkContactSchema } from "../validators/conversation-contact.validator";
import { AppError } from "../types/auth.types";

export class ConversationContactController {
  constructor(private convoContactServ: ConversationContactService) {}

  linkExistingContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const conversationId = Array.isArray(req.params.conversationId)
        ? req.params.conversationId[0]
        : req.params.conversationId;

      const result = linkExistingContactSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const conversation = await this.convoContactServ.linkExistingContact(
        conversationId,
        result.data.contactId,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: "Conversation linked to existing contact successfully.",
        data: { conversation },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  createAndLinkContact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const conversationId = Array.isArray(req.params.conversationId)
        ? req.params.conversationId[0]
        : req.params.conversationId;

      const result = createAndLinkContactSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const { conversation, contact } = await this.convoContactServ.createAndLinkContact(
        conversationId,
        result.data,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Contact created and linked successfully.",
        data: { conversation, contact },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const conversationContactController = new ConversationContactController(conversationContactService);
