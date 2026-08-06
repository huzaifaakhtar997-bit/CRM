import { Request, Response, NextFunction } from "express";
import { taskService, TaskService } from "../services/task.service";
import { createTaskSchema, updateTaskSchema, queryTaskSchema } from "../validators/task.validator";
import { AppError } from "../types/auth.types";

export class TaskController {
  constructor(private taskServ: TaskService) {}

  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const result = createTaskSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const task = await this.taskServ.createTask(result.data, req.user.userId);

      res.status(201).json({
        success: true,
        message: "Task created successfully.",
        data: { task },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = queryTaskSchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Query validation failed: ${errors}`, 400);
      }

      const data = await this.taskServ.getTasks(result.data);

      res.status(200).json({
        success: true,
        message: "Tasks retrieved successfully.",
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const task = await this.taskServ.getTaskById(id);

      res.status(200).json({
        success: true,
        message: "Task retrieved successfully.",
        data: { task },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new AppError(`Validation failed: ${errors}`, 400);
      }

      const task = await this.taskServ.updateTask(id, result.data, req.user.userId);

      res.status(200).json({
        success: true,
        message: "Task updated successfully.",
        data: { task },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.taskServ.deleteTask(id);

      res.status(200).json({
        success: true,
        message: "Task deleted successfully.",
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const taskController = new TaskController(taskService);
