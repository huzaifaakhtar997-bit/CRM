import { api } from "./axios";
import { Task, ListResponse } from "../types/api.types";

export interface QueryTaskInput {
  page?: number;
  limit?: number;
  search?: string;
  completed?: boolean;
  priority?: string;
  assignedUserId?: string;
  contactId?: string;
  dealId?: string;
}

export const tasksApi = {
  getTasks: async (params?: QueryTaskInput): Promise<ListResponse<Task>['data']> => {
    const res = await api.get<ListResponse<Task>>("/tasks", { params });
    return res.data.data;
  },

  getTaskById: async (id: string): Promise<Task> => {
    const res = await api.get<{ success: boolean; data: { task: Task } }>(`/tasks/${id}`);
    return res.data.data.task;
  },

  createTask: async (data: Partial<Task>): Promise<Task> => {
    const res = await api.post<{ success: boolean; data: { task: Task } }>("/tasks", data);
    return res.data.data.task;
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const res = await api.patch<{ success: boolean; data: { task: Task } }>(`/tasks/${id}`, data);
    return res.data.data.task;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  }
};
