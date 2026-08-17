import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { importsApi } from "../api/imports.api";
import { ImportJob, ImportType } from "../types/api.types";
import { ImportUploader } from "../components/imports/ImportUploader";
import { ImportHistory } from "../components/imports/ImportHistory";
import { ImportDetails } from "../components/imports/ImportDetails";

export default function Imports() {
  const { user } = useAuth();
  
  // RBAC for uploader: Admin, Manager, Sales Rep
  const canUpload = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await importsApi.getImportJobs({ limit: 50 });
      setJobs(data.importJobs || []);
    } catch (error) {
      console.error("Failed to load import history", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleUpload = async (type: ImportType, file: File) => {
    await importsApi.uploadImport(type, file);
    // Refresh history after a successful upload
    loadHistory();
  };

  const handleViewDetails = async (job: ImportJob) => {
    // Fetch full details to get errorLog
    try {
      const fullJob = await importsApi.getImportJobById(job.id);
      setSelectedJob(fullJob);
    } catch (error) {
      console.error("Failed to fetch import job details", error);
      // Fallback to list version if fetch fails
      setSelectedJob(job);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Data Imports</h1>
        <p className="text-muted-foreground mt-2">
          Bulk import Contacts and Companies into your CRM from CSV or XLSX files.
        </p>
      </div>

      {canUpload && (
        <ImportUploader onUpload={handleUpload} />
      )}

      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Import History</h2>
        <ImportHistory
          jobs={jobs}
          loading={loading}
          onViewDetails={handleViewDetails}
        />
      </div>

      <ImportDetails
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
