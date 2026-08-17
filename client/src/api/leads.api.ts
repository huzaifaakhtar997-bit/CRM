import { api } from "./axios";
import { Lead, ListResponse, LeadStatus, LeadSource } from "../types/api.types";

export interface GetLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedUserId?: string;
}

export const leadsApi = {
  getLeads: async (params?: GetLeadsParams) => {
    const res = await api.get<ListResponse<Lead>>("/leads", { params });
    return res.data;
  },

  getLeadById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { lead: Lead } }>(`/leads/${id}`);
    return res.data.data.lead;
  },

  createLead: async (data: Partial<Lead>) => {
    const res = await api.post<{ success: boolean; data: { lead: Lead } }>("/leads", data);
    return res.data.data.lead;
  },

  updateLead: async (id: string, data: Partial<Lead>) => {
    const res = await api.patch<{ success: boolean; data: { lead: Lead } }>(`/leads/${id}`, data);
    return res.data.data.lead;
  },

  deleteLead: async (id: string) => {
    await api.delete(`/leads/${id}`);
  }
};
