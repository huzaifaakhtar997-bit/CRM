import React from "react";
import { ImportJob, ImportJobStatus } from "../../types/api.types";
import { CheckCircle2, XCircle, Clock, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface ImportHistoryProps {
  jobs: ImportJob[];
  loading: boolean;
  onViewDetails: (job: ImportJob) => void;
}

export const ImportHistory: React.FC<ImportHistoryProps> = ({ jobs, loading, onViewDetails }) => {
  const getStatusIcon = (status: ImportJobStatus) => {
    switch (status) {
      case ImportJobStatus.COMPLETED:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case ImportJobStatus.FAILED:
        return <XCircle className="w-4 h-4 text-destructive" />;
      case ImportJobStatus.PROCESSING:
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: ImportJobStatus) => {
    switch (status) {
      case ImportJobStatus.COMPLETED:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case ImportJobStatus.FAILED:
        return "bg-destructive/10 text-destructive border-destructive/20";
      case ImportJobStatus.PROCESSING:
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-10 w-10 bg-accent rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-accent rounded w-1/3"></div>
                <div className="h-3 bg-accent rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="w-full bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No Import History</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          You haven't run any imports yet. Upload a file above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-accent/30 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">File / Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-center">Total</th>
              <th className="px-6 py-4 font-medium text-center text-emerald-600">Success</th>
              <th className="px-6 py-4 font-medium text-center text-amber-600 hidden sm:table-cell">Skipped</th>
              <th className="px-6 py-4 font-medium text-center text-destructive hidden sm:table-cell">Failed</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground truncate max-w-[200px]" title={job.fileName}>
                        {job.fileName}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                        {job.importType}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold border ${getStatusClass(job.status)}`}>
                    {getStatusIcon(job.status)}
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-medium">
                  {job.totalRecords}
                </td>
                <td className="px-6 py-4 text-center text-emerald-600 font-medium">
                  {job.successfulRecords}
                </td>
                <td className="px-6 py-4 text-center text-amber-600 font-medium hidden sm:table-cell">
                  {job.skippedRecords}
                </td>
                <td className="px-6 py-4 text-center hidden sm:table-cell">
                  {job.failedRecords > 0 ? (
                    <span className="text-destructive font-bold flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {job.failedRecords}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                  {new Date(job.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(job)}>
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
