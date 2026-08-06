import { Request, Response, NextFunction } from "express";
import { messageService, MessageService } from "../services/message.service";
import { createMessageSchema, updateMessageSchema, queryMessageSchema } from "../validators/message.validator";
import { AppError } from "../types/auth.types";

export class MessageController {
  constructor(private messageServ: MessageService) {}

  createMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const conversationId = Array.isArray(req.params.conversationId)
        ? req.params.conversationId[0]
        : req.params.conversationId;

      const result = createMessageSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const message = await this.messageServ.createMessage(
        conversationId,
        result.data,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Message created successfully.",
        data: { message },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getMessagesByConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = Array.isArray(req.params.conversationId)
        ? req.params.conversationId[0]
        : req.params.conversationId;

      const result = queryMessageSchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const data = await this.messageServ.getMessagesByConversation(conversationId, result.data);

      res.status(200).json({
        success: true,
        message: "Messages retrieved successfully.",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getMessageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const message = await this.messageServ.getMessageById(id);

      res.status(200).json({
        success: true,
        message: "Message retrieved successfully.",
        data: { message },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = updateMessageSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const message = await this.messageServ.updateMessage(id, result.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Message updated successfully.",
        data: { message },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.messageServ.deleteMessage(id, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Message deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const messageController = new MessageController(messageService);
