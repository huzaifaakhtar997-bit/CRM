import { Request, Response, NextFunction } from "express";
import { conversationService, ConversationService } from "../services/conversation.service";
import { createConversationSchema, updateConversationSchema, queryConversationSchema } from "../validators/conversation.validator";
import { AppError } from "../types/auth.types";

export class ConversationController {
  constructor(private convoServ: ConversationService) {}

  createConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const result = createConversationSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const conversation = await this.convoServ.createConversation(result.data, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Conversation created successfully.",
        data: { conversation },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = queryConversationSchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const data = await this.convoServ.getConversations(result.data);

      res.status(200).json({
        success: true,
        message: "Conversations retrieved successfully.",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getConversationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const conversation = await this.convoServ.getConversationById(id);

      res.status(200).json({
        success: true,
        message: "Conversation retrieved successfully.",
        data: { conversation },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError("Authentication required.", 401);

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = updateConversationSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const conversation = await this.convoServ.updateConversation(id, result.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Conversation updated successfully.",
        data: { conversation },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.convoServ.deleteConversation(id);

      res.status(200).json({
        success: true,
        message: "Conversation deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const conversationController = new ConversationController(conversationService);
