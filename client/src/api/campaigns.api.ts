import { api } from "./axios";
import {
  Campaign,
  CampaignStatus,
  CampaignRecipient,
  CampaignRecipientStatus,
  CampaignTrackingSummary,
  ListResponse,
} from "../types/api.types";

export interface GetCampaignsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CampaignStatus;
}

export interface AudienceFilters {
  lifecycleStage?: string;
  companyId?: string;
  assignedUserId?: string;
  tags?: string[];
  status?: string;
  search?: string;
}

export interface GetAudienceParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const campaignsApi = {
  // ── Core CRUD ─────────────────────────────────────────────────────────────
  
  getCampaigns: async (params?: GetCampaignsParams) => {
    const res = await api.get<ListResponse<Campaign>>("/campaigns", { params });
    return res.data;
  },

  getCampaignById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { campaign: Campaign } }>(`/campaigns/${id}`);
    return res.data.data.campaign;
  },

  createCampaign: async (data: Partial<Campaign>) => {
    const res = await api.post<{ success: boolean; data: { campaign: Campaign } }>("/campaigns", data);
    return res.data.data.campaign;
  },

  updateCampaign: async (id: string, data: Partial<Campaign>) => {
    const res = await api.patch<{ success: boolean; data: { campaign: Campaign } }>(`/campaigns/${id}`, data);
    return res.data.data.campaign;
  },

  deleteCampaign: async (id: string) => {
    await api.delete(`/campaigns/${id}`);
  },

  // ── Audience & Recipients ──────────────────────────────────────────────────
  
  previewAudience: async (campaignId: string, filters: AudienceFilters, page = 1, limit = 20) => {
    const res = await api.post(`/campaigns/${campaignId}/audience/preview`, { filters, page, limit });
    return res.data;
  },

  applyAudience: async (campaignId: string, filters: AudienceFilters) => {
    const res = await api.post(`/campaigns/${campaignId}/audience/apply`, { filters });
    return res.data;
  },

  getRecipients: async (campaignId: string, params?: GetAudienceParams) => {
    const res = await api.get<ListResponse<CampaignRecipient>>(`/campaigns/${campaignId}/recipients`, { params });
    return res.data;
  },

  addRecipient: async (campaignId: string, contactId: string) => {
    const res = await api.post<{ success: boolean; data: { recipient: CampaignRecipient } }>(
      `/campaigns/${campaignId}/recipients`,
      { contactId }
    );
    return res.data.data.recipient;
  },

  removeRecipient: async (campaignId: string, recipientId: string) => {
    await api.delete(`/campaigns/${campaignId}/recipients/${recipientId}`);
  },

  // ── Launch & Tracking ─────────────────────────────────────────────────────

  launchCampaign: async (campaignId: string) => {
    const res = await api.post(`/campaigns/${campaignId}/launch`);
    return res.data.data;
  },

  getTrackingSummary: async (campaignId: string) => {
    const res = await api.get<{ success: boolean; data: CampaignTrackingSummary }>(
      `/campaigns/${campaignId}/tracking`
    );
    return res.data.data;
  },

  updateRecipientStatus: async (campaignId: string, recipientId: string, status: CampaignRecipientStatus) => {
    const res = await api.patch<{ success: boolean; data: { recipient: CampaignRecipient } }>(
      `/campaigns/${campaignId}/recipients/${recipientId}/status`,
      { status }
    );
    return res.data.data.recipient;
  },
};
