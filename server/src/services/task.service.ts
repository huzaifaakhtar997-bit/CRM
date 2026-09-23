import { Task, ActivityType } from "@prisma/client";
import { taskRepository, TaskRepository, TaskListResult } from "../repositories/task.repository";
import { prisma } from "../config/database";
import { CreateTaskInput, UpdateTaskInput, QueryTaskInput } from "../validators/task.validator";
import { AppError } from "../types/auth.types";
import { notificationService } from "./notification.service";

export class TaskService {
  constructor(private taskRepo: TaskRepository) {}

  async createTask(input: CreateTaskInput, currentUserId: string): Promise<Task> {
    let assignedUserId: string | null = null;
    if (input.isAnnouncement) {
      assignedUserId = input.assignedUserId || null;
    } else {
      assignedUserId = input.assignedUserId || currentUserId;
    }

    // Verify assigned user exists if specified
    if (assignedUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: assignedUserId } });
      if (!userExists) {
        throw new AppError(`Assigned user with ID '${assignedUserId}' not found.`, 400);
      }
    }

    // Verify contact connection if provided
    if (input.contactId) {
      const contactExists = await prisma.contact.findUnique({ where: { id: input.contactId } });
      if (!contactExists) {
        throw new AppError(`Contact with ID '${input.contactId}' not found.`, 400);
      }
    }

    // Verify deal connection if provided
    if (input.dealId) {
      const dealExists = await prisma.deal.findUnique({ where: { id: input.dealId } });
      if (!dealExists) {
        throw new AppError(`Deal with ID '${input.dealId}' not found.`, 400);
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          title: input.title,
          description: input.description,
          taskType: input.taskType,
          priority: input.priority,
          dueDate: input.dueDate,
          dueTime: input.dueTime,
          companyName: input.companyName,
          isAnnouncement: Boolean(input.isAnnouncement),
          ...(input.contactId && { contact: { connect: { id: input.contactId } } }),
          ...(input.dealId && { deal: { connect: { id: input.dealId } } }),
          ...(assignedUserId ? { assignedUser: { connect: { id: assignedUserId } } } : {}),
        },
        include: {
          assignedUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
        },
      });

      // Automatically create Activity log record
      await tx.activity.create({
        data: {
          type: ActivityType.TASK_COMPLETED,
          title: newTask.isAnnouncement ? "Company Announcement Created" : "Task Created",
          content: newTask.isAnnouncement
            ? `Company Announcement "${newTask.title}" broadcast to all employees`
            : `Task "${newTask.title}" was created and assigned to ${newTask.assignedUser?.name || "unassigned"}`,
          userId: currentUserId,
          ...(newTask.contactId && { contactId: newTask.contactId }),
          ...(newTask.dealId && { dealId: newTask.dealId }),
          metadata: {
            taskId: newTask.id,
            dueDate: newTask.dueDate,
            priority: newTask.priority,
            isAnnouncement: newTask.isAnnouncement,
          },
        },
      });

      return newTask;
    });

    // Notify users
    if (input.isAnnouncement) {
      const allUsers = await prisma.user.findMany({
        where: { status: "ACTIVE", id: { not: currentUserId } },
        select: { id: true },
      });
      for (const u of allUsers) {
        await notificationService.createNotification({
          userId: u.id,
          title: "Company Announcement",
          message: `📢 Company Announcement: "${task.title}"`,
          type: "task",
          link: `/tasks`,
        });
      }
    } else if (assignedUserId && assignedUserId !== currentUserId) {
      await notificationService.createNotification({
        userId: assignedUserId,
        title: "New Task Assigned",
        message: `You have been assigned a new task: "${task.title}"`,
        type: "task",
        link: `/tasks/${task.id}`,
      });
    }

    return task;
  }

  async getTasks(
    query: QueryTaskInput,
    currentUser?: { userId: string; role: string }
  ): Promise<TaskListResult> {
    const effectiveQuery: any = { ...query };

    if (currentUser?.role === "SALES_REP") {
      if (effectiveQuery.assignedUserId === "unassigned" || effectiveQuery.assignedUserId === "none") {
        effectiveQuery.assignedUserId = "unassigned";
      } else if (effectiveQuery.assignedUserId === "announcements" || effectiveQuery.isAnnouncement === true) {
        effectiveQuery.isAnnouncement = true;
        delete effectiveQuery.assignedUserId;
      } else {
        // Default for Sales Rep: show their tasks OR company announcements!
        effectiveQuery.userScopedId = currentUser.userId;
        delete effectiveQuery.assignedUserId;
      }
    } else {
      // ADMIN or MANAGER
      if (effectiveQuery.assignedUserId === "mine" && currentUser?.userId) {
        effectiveQuery.assignedUserId = currentUser.userId;
      }
    }

    return this.taskRepo.findAll(effectiveQuery);
  }

  async getTaskById(id: string): Promise<Task> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new AppError(`Task with ID '${id}' not found.`, 404);
    }
    return task;
  }

  async updateTask(id: string, input: UpdateTaskInput, currentUserId: string): Promise<Task> {
    const existing = await this.taskRepo.findById(id);
    if (!existing) {
      throw new AppError(`Task with ID '${id}' not found.`, 404);
    }

    if (input.assignedUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: input.assignedUserId } });
      if (!userExists) {
        throw new AppError(`Assigned user with ID '${input.assignedUserId}' not found.`, 400);
      }
    }

    let completedAt: Date | null = undefined as any;
    if (input.completed !== undefined) {
      if (input.completed && !existing.completed) {
        completedAt = new Date();
      } else if (!input.completed && existing.completed) {
        completedAt = null;
      }
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          taskType: input.taskType,
          priority: input.priority,
          dueDate: input.dueDate,
          dueTime: input.dueTime,
          companyName: input.companyName,
          completed: input.completed,
          completedAt,
          ...(input.isAnnouncement !== undefined && { isAnnouncement: input.isAnnouncement }),
          ...(input.assignedUserId !== undefined && {
            assignedUser: input.assignedUserId ? { connect: { id: input.assignedUserId } } : { disconnect: true },
          }),
          ...(input.contactId !== undefined && {
            contact: input.contactId ? { connect: { id: input.contactId } } : { disconnect: true },
          }),
          ...(input.dealId !== undefined && {
            deal: input.dealId ? { connect: { id: input.dealId } } : { disconnect: true },
          }),
        },
        include: {
          assignedUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } },
        },
      });

      // Log specific task completion / reopen activities
      if (input.completed !== undefined) {
        if (input.completed && !existing.completed) {
          await tx.activity.create({
            data: {
              type: ActivityType.TASK_COMPLETED,
              title: "Task Completed",
              content: `Marked task "${updated.title}" as completed`,
              userId: currentUserId,
              ...(updated.contactId && { contactId: updated.contactId }),
              ...(updated.dealId && { dealId: updated.dealId }),
              metadata: { taskId: updated.id },
            },
          });
        } else if (!input.completed && existing.completed) {
          await tx.activity.create({
            data: {
              type: ActivityType.NOTE,
              title: "Task Reopened",
              content: `Reopened task "${updated.title}"`,
              userId: currentUserId,
              ...(updated.contactId && { contactId: updated.contactId }),
              ...(updated.dealId && { dealId: updated.dealId }),
              metadata: { taskId: updated.id },
            },
          });
        }
      }

      return updated;
    });

    // Notify newly assigned user if it changed and it's not the current user
    if (input.assignedUserId && input.assignedUserId !== existing.assignedUserId && input.assignedUserId !== currentUserId) {
      await notificationService.createNotification({
        userId: input.assignedUserId,
        title: "Task Reassigned",
        message: `You have been assigned the task: "${updatedTask.title}"`,
        type: "task",
        link: `/tasks/${updatedTask.id}`,
      });
    }

    return updatedTask;
  }

  async deleteTask(id: string): Promise<{ id: string }> {
    const existing = await this.taskRepo.findById(id);
    if (!existing) {
      throw new AppError(`Task with ID '${id}' not found.`, 404);
    }
    await this.taskRepo.delete(id);
    return { id };
  }
}

export const taskService = new TaskService(taskRepository);
