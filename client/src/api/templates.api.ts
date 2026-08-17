import { api } from "./axios";

export interface Template {
  id: string;
  name: string;
  type: "EMAIL_REPLY" | "CAMPAIGN";
  subject: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: { id: string; name: string; email: string };
}

export interface GetTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: "EMAIL_REPLY" | "CAMPAIGN";
}

export const templatesApi = {
  getTemplates: async (params?: GetTemplatesParams) => {
    const res = await api.get<{
      success: boolean;
      data: { templates: Template[]; total: number; page: number; totalPages: number };
    }>("/templates", { params });
    return res.data.data;
  },

  getTemplateById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { template: Template } }>(`/templates/${id}`);
    return res.data.data.template;
  },

  createTemplate: async (data: { name: string; type?: string; subject?: string | null; content: string }) => {
    const res = await api.post<{ success: boolean; data: { template: Template } }>("/templates", data);
    return res.data.data.template;
  },

  updateTemplate: async (id: string, data: { name?: string; type?: string; subject?: string | null; content?: string }) => {
    const res = await api.patch<{ success: boolean; data: { template: Template } }>(`/templates/${id}`, data);
    return res.data.data.template;
  },

  deleteTemplate: async (id: string) => {
    await api.delete(`/templates/${id}`);
  },
};
