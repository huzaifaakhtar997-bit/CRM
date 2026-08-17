import React from "react";
import { ImportJob, ImportJobStatus } from "../../types/api.types";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

interface ImportDetailsProps {
  job: ImportJob | null;
  onClose: () => void;
  isOpen: boolean;
}

export const ImportDetails: React.FC<ImportDetailsProps> = ({ job, onClose, isOpen }) => {
  if (!isOpen || !job) return null;

  const isFailed = job.status === ImportJobStatus.FAILED || job.failedRecords > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Import Details</h2>
            <p className="text-sm text-muted-foreground mt-1">ID: {job.id}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">File Name</span>
              <p className="text-sm font-medium text-foreground truncate" title={job.fileName}>{job.fileName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Import Type</span>
              <p className="text-sm font-medium text-foreground uppercase">{job.importType}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
              <p className="text-sm font-medium text-foreground">{job.status}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed At</span>
              <p className="text-sm font-medium text-foreground">
                {job.completedAt ? new Date(job.completedAt).toLocaleString() : "Processing..."}
              </p>
            </div>
          </div>

          <div className="bg-accent/30 rounded-xl p-6 border">
            <h3 className="text-sm font-bold text-foreground mb-4">Summary</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">{job.totalRecords}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{job.successfulRecords}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">Success</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{job.skippedRecords}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">Skipped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{job.failedRecords}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">Failed</div>
              </div>
            </div>
          </div>

          {isFailed && job.errorLog && job.errorLog.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Error Log
              </h3>
              <div className="border rounded-md overflow-hidden text-sm">
                <div className="bg-destructive/10 text-destructive font-medium p-3 grid grid-cols-[80px_1fr] border-b border-destructive/20">
                  <div>Row</div>
                  <div>Error Message</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto bg-card">
                  {job.errorLog.map((error, idx) => (
                    <div key={idx} className="p-3 grid grid-cols-[80px_1fr] border-b last:border-0 hover:bg-accent/50">
                      <div className="font-medium text-muted-foreground">{error.row}</div>
                      <div className="text-foreground">{error.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
