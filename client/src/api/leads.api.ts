import { api } from "./axios";
import { Lead, Contact, Deal, ListResponse, LeadStatus, LeadSource } from "../types/api.types";

export interface GetLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  assignedUserId?: string;
}

export interface ConvertLeadParams {
  companyId?: string | null;
  createCompany?: boolean;
  companyName?: string;
  createDeal?: boolean;
  dealTitle?: string;
  dealValue?: number;
  stageId?: string;
}

export interface ConvertLeadResult {
  lead: Lead;
  contact: Contact;
  deal?: Deal;
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

  convertLead: async (id: string, data: ConvertLeadParams): Promise<ConvertLeadResult> => {
    const res = await api.post<{ success: boolean; data: ConvertLeadResult }>(`/leads/${id}/convert`, data);
    return res.data.data;
  },

  deleteLead: async (id: string) => {
    await api.delete(`/leads/${id}`);
  }
};

