import { api } from "./axios";
import { ImportJob, ListResponse } from "../types/api.types";

export interface QueryImportInput {
  page?: number;
  limit?: number;
}

export const importsApi = {
  uploadImport: async (type: "contacts" | "companies", file: File): Promise<{
    importJob: ImportJob;
    summary: {
      totalRows: number;
      successfulRows: number;
      skippedRows: number;
      failedRows: number;
    };
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post(`/imports/${type}`, formData, {
      headers: {
        // Let browser set the multipart boundary boundary automatically
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  },

  getImportJobs: async (params?: QueryImportInput): Promise<ListResponse<ImportJob>["data"]> => {
    const res = await api.get<ListResponse<ImportJob>>("/imports", { params });
    return res.data.data;
  },

  getImportJobById: async (jobId: string): Promise<ImportJob> => {
    const res = await api.get(`/imports/${jobId}`);
    return res.data.data.importJob;
  },
};
