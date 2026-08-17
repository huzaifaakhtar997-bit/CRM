import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import {
  getNotificationsSchema,
  notificationIdSchema,
} from "../validators/notification.validator";
import { AppError } from "../types/auth.types";

export class NotificationController {
  public getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const { query } = getNotificationsSchema.parse(req);
      const { page, limit, unreadOnly } = query;

      const result = await notificationService.getNotifications(
        userId,
        page,
        limit,
        unreadOnly
      );

      res.status(200).json({
        success: true,
        data: {
          notifications: result.data,
          total: result.total,
          page,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const count = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  };

  public markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const { params } = notificationIdSchema.parse(req);

      const notification = await notificationService.markAsRead(params.id, userId);

      if (!notification) {
        throw new AppError("Notification not found", 404);
      }

      res.status(200).json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      next(error);
    }
  };

  public markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const updatedCount = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: { updatedCount },
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const { params } = notificationIdSchema.parse(req);

      const deleted = await notificationService.deleteNotification(params.id, userId);

      if (!deleted) {
        throw new AppError("Notification not found", 404);
      }

      res.status(200).json({
        success: true,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
