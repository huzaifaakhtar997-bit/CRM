import { Task, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { QueryTaskInput } from "../validators/task.validator";

export interface TaskListResult {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const taskInclude = {
  assignedUser: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  contact: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  deal: {
    select: { id: true, title: true, value: true, stageId: true },
  },
};

export class TaskRepository {
  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });
  }

  async findAll(query: QueryTaskInput): Promise<TaskListResult> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    if (query.search) {
      where.title = { contains: query.search, mode: "insensitive" };
    }

    if (query.completed !== undefined) {
      where.completed = query.completed;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.assignedUserId) {
      where.assignedUserId = query.assignedUserId;
    }

    if (query.contactId) {
      where.contactId = query.contactId;
    }

    if (query.dealId) {
      where.dealId = query.dealId;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: "asc" },
        include: taskInclude,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({
      data,
      include: taskInclude,
    });
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
  }

  async delete(id: string): Promise<Task> {
    return prisma.task.delete({
      where: { id },
    });
  }
}

export const taskRepository = new TaskRepository();
