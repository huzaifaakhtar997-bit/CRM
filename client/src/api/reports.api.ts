import { api } from "./axios";
import { ReportAnalyticsData } from "../types/api.types";

export const reportsApi = {
  getReports: async (params?: { timeRange?: string; repId?: string }): Promise<ReportAnalyticsData> => {
    const res = await api.get<{ success: boolean; data: ReportAnalyticsData }>("/reports", { params });
    return res.data.data;
  },
};
