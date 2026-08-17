import { api } from "./axios";
import { Contact, Company, Deal, Task, ListResponse, UnreadCountResponse } from "../types/api.types";

export const dashboardApi = {
  getContactsCount: async (): Promise<number> => {
    const res = await api.get<ListResponse<Contact>>("/contacts?limit=1");
    return res.data.data.total;
  },
  
  getCompaniesCount: async (): Promise<number> => {
    const res = await api.get<ListResponse<Company>>("/companies?limit=1");
    return res.data.data.total;
  },
  
  getDealsCount: async (): Promise<number> => {
    const res = await api.get<ListResponse<Deal>>("/deals?limit=1");
    return res.data.data.total;
  },
  
  getPendingTasksCount: async (): Promise<number> => {
    const res = await api.get<ListResponse<Task>>("/tasks?limit=1&completed=false");
    return res.data.data.total;
  },
  
  getUnreadNotificationsCount: async (): Promise<number> => {
    const res = await api.get<UnreadCountResponse>("/notifications/unread-count");
    return res.data.data.count;
  },

  getRecentContacts: async (): Promise<Contact[]> => {
    const res = await api.get<ListResponse<Contact>>("/contacts?limit=5");
    return res.data.data.contacts;
  },

  getRecentDeals: async (): Promise<Deal[]> => {
    const res = await api.get<ListResponse<Deal>>("/deals?limit=5");
    return res.data.data.deals;
  },

  getRecentTasks: async (): Promise<Task[]> => {
    const res = await api.get<ListResponse<Task>>("/tasks?limit=5&completed=false");
    return res.data.data.tasks;
  }
};
