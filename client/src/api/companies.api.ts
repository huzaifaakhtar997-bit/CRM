import { api } from "./axios";
import { Company, ListResponse } from "../types/api.types";

export interface QueryCompanyInput {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
}

export const companiesApi = {
  getCompanies: async (params?: QueryCompanyInput): Promise<ListResponse<Company>['data']> => {
    const res = await api.get<ListResponse<Company>>("/companies", { params });
    return res.data.data;
  },

  getCompanyById: async (id: string): Promise<Company> => {
    const res = await api.get<{ success: boolean; data: { company: Company } }>(`/companies/${id}`);
    return res.data.data.company;
  },

  createCompany: async (data: Partial<Company>): Promise<Company> => {
    const res = await api.post<{ success: boolean; data: { company: Company } }>("/companies", data);
    return res.data.data.company;
  },

  updateCompany: async (id: string, data: Partial<Company>): Promise<Company> => {
    const res = await api.patch<{ success: boolean; data: { company: Company } }>(`/companies/${id}`, data);
    return res.data.data.company;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  }
};
