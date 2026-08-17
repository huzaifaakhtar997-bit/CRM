import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, Loader2 } from "lucide-react";
import { ImportType } from "../../types/api.types";
import { Button } from "../ui/button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImportUploaderProps {
  onUpload: (type: ImportType, file: File) => Promise<void>;
}

export const ImportUploader: React.FC<ImportUploaderProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>("contacts");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && extension !== 'csv' && extension !== 'xlsx') {
      return "Only .csv and .xlsx files are supported.";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "File is too large. Maximum size is 10 MB.";
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
      } else {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(importType, file);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Import Data</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a CSV or XLSX file to bulk import records. Ensure your columns map to standard CRM fields (e.g. FirstName, LastName, Email).
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">Import Destination:</label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as ImportType)}
              disabled={uploading}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="contacts">Contacts</option>
              <option value="companies">Companies</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-full min-h-[160px]",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/50 hover:border-muted-foreground/50"
              )}
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV or XLSX up to 10MB
              </p>
            </div>
          ) : (
            <div className="border rounded-xl p-6 h-full flex flex-col justify-center">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Start Import"
                )}
              </Button>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};
