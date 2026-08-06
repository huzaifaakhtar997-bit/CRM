import { z } from "zod";
import { TaskType, Priority } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().nullable().optional(),
  taskType: z.nativeEnum(TaskType).optional().default(TaskType.CALL),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
  dueDate: z.string().min(1, "Due date is required").transform((val) => new Date(val)),
  dueTime: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Task title cannot be empty").optional(),
  description: z.string().nullable().optional(),
  taskType: z.nativeEnum(TaskType).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().transform((val) => new Date(val)).optional(),
  dueTime: z.string().nullable().optional(),
  assignedUserId: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  contactId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
});

export const queryTaskSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  completed: z.string().optional().transform((val) => val === "true"),
  priority: z.nativeEnum(Priority).optional(),
  assignedUserId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type QueryTaskInput = z.infer<typeof queryTaskSchema>;
