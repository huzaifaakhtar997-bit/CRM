import { api } from "./axios";
import { Deal, PipelineStage, ListResponse } from "../types/api.types";

export interface QueryDealInput {
  page?: number;
  limit?: number;
  search?: string;
  stageId?: string;
  assignedUserId?: string;
  companyId?: string;
  contactId?: string;
}

export const dealsApi = {
  getDeals: async (params?: QueryDealInput): Promise<ListResponse<Deal>['data']> => {
    const res = await api.get<ListResponse<Deal>>("/deals", { params });
    return res.data.data;
  },

  getDealById: async (id: string): Promise<Deal> => {
    const res = await api.get<{ success: boolean; data: { deal: Deal } }>(`/deals/${id}`);
    return res.data.data.deal;
  },

  createDeal: async (data: Partial<Deal>): Promise<Deal> => {
    const res = await api.post<{ success: boolean; data: { deal: Deal } }>("/deals", data);
    return res.data.data.deal;
  },

  updateDeal: async (id: string, data: Partial<Deal>): Promise<Deal> => {
    const res = await api.patch<{ success: boolean; data: { deal: Deal } }>(`/deals/${id}`, data);
    return res.data.data.deal;
  },

  updateDealStage: async (id: string, stageId: string): Promise<Deal> => {
    const res = await api.patch<{ success: boolean; data: { deal: Deal } }>(`/deals/${id}/stage`, { stageId });
    return res.data.data.deal;
  },

  deleteDeal: async (id: string): Promise<void> => {
    await api.delete(`/deals/${id}`);
  },

  getPipelineStages: async (): Promise<PipelineStage[]> => {
    const res = await api.get<{ success: boolean; data: { stages: PipelineStage[] } }>("/pipeline/stages");
    return res.data.data.stages;
  }
};
