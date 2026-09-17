import React, { useState, useEffect } from "react";
import { Campaign, CampaignStatus } from "../../types/api.types";
import { X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface CampaignFormProps {
  initialData?: Campaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Campaign>) => Promise<void>;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({ initialData, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: "",
    objective: "",
    subject: "",
    previewText: "",
    content: "",
    status: CampaignStatus.DRAFT,
    scheduledAt: "",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name,
        objective: initialData.objective || "",
        subject: initialData.subject || "",
        previewText: initialData.previewText || "",
        content: initialData.content || "",
        status: initialData.status,
        scheduledAt: initialData.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : "",
      });
    } else if (isOpen) {
      setFormData({
        name: "",
        objective: "",
        subject: "",
        previewText: "",
        content: "",
        status: CampaignStatus.DRAFT,
        scheduledAt: "",
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isNameValid = Boolean(formData.name?.trim());
  const isObjectiveValid = Boolean(formData.objective?.trim());
  const isSubjectValid = Boolean(formData.subject?.trim());
  const isContentValid = Boolean(formData.content?.trim());
  const isScheduled = formData.status === CampaignStatus.SCHEDULED || Boolean(formData.scheduledAt);
  const isScheduleValid = !isScheduled || (Boolean(formData.scheduledAt) && new Date(formData.scheduledAt as string) > new Date());

  const isValid = isNameValid && isObjectiveValid && isSubjectValid && isContentValid && isScheduleValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      if (!isNameValid) setError("Campaign Name is required.");
      else if (!isObjectiveValid) setError("Campaign Objective is required.");
      else if (!isSubjectValid) setError("Email Subject is required.");
      else if (!isContentValid) setError("Email Content is required.");
      else if (isScheduled && !formData.scheduledAt) setError("Scheduled Date & Time is required when scheduling a campaign.");
      else if (isScheduled && new Date(formData.scheduledAt as string) <= new Date()) setError("Scheduled Date & Time must be in the future.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const submitData = { ...formData };
      if (!submitData.scheduledAt) {
        submitData.scheduledAt = null as any;
      } else {
        submitData.scheduledAt = new Date(submitData.scheduledAt as string).toISOString();
        submitData.status = CampaignStatus.SCHEDULED;
      }
      
      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduledAtChange = (val: string) => {
    const updated = { ...formData, scheduledAt: val };
    if (val) {
      updated.status = CampaignStatus.SCHEDULED;
    } else if (formData.status === CampaignStatus.SCHEDULED) {
      updated.status = CampaignStatus.DRAFT;
    }
    setFormData(updated);
  };

  const handleStatusChange = (newStatus: CampaignStatus) => {
    const updated: Partial<Campaign> = { ...formData, status: newStatus };
    if (newStatus !== CampaignStatus.SCHEDULED && !initialData?.scheduledAt) {
      updated.scheduledAt = "";
    }
    setFormData(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {initialData ? "Edit Campaign" : "Create Campaign"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All marked (<span className="text-destructive">*</span>) fields must be completed before creating.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <form id="campaign-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                Campaign Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm ${
                  !isNameValid && formData.name !== undefined ? "border-amber-300 dark:border-amber-700" : ""
                }`}
                placeholder="e.g. Q3 Product Launch"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                Objective <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.objective || ""}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className={`w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm ${
                  !isObjectiveValid && formData.objective !== undefined ? "border-amber-300 dark:border-amber-700" : ""
                }`}
                placeholder="e.g. Announce new features to existing customers"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  Email Subject <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject || ""}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm ${
                    !isSubjectValid && formData.subject !== undefined ? "border-amber-300 dark:border-amber-700" : ""
                  }`}
                  placeholder="Introducing our new features!"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preview Text</label>
                <input
                  type="text"
                  value={formData.previewText || ""}
                  onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="See what's new in this release..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value as CampaignStatus)}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  disabled={formData.status === CampaignStatus.ACTIVE || formData.status === CampaignStatus.COMPLETED}
                >
                  {Object.values(CampaignStatus).map((status) => (
                    <option key={status} value={status} disabled={status === "ACTIVE" || status === "COMPLETED"}>
                      {status}
                    </option>
                  ))}
                </select>
                {(formData.status === CampaignStatus.ACTIVE || formData.status === CampaignStatus.COMPLETED) && (
                  <p className="text-xs text-muted-foreground mt-1">Status cannot be changed manually from here.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  Scheduled At {isScheduled && <span className="text-destructive">*</span>}
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt || ""}
                  onChange={(e) => handleScheduledAtChange(e.target.value)}
                  className={`w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm ${
                    isScheduled && !isScheduleValid ? "border-amber-300 dark:border-amber-700" : ""
                  }`}
                />
                {isScheduled && !formData.scheduledAt && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">Please choose date and time to schedule.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                Email Content (HTML) <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                value={formData.content || ""}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className={`w-full min-h-[150px] font-mono p-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-y ${
                  !isContentValid && formData.content !== undefined ? "border-amber-300 dark:border-amber-700" : ""
                }`}
                placeholder="<p>Hello valued customer,</p><p>We have exciting news...</p>"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-accent/30 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-xl">
          <div className="text-xs text-muted-foreground">
            {!isValid && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Fill all required fields ({[!isNameValid && "Name", !isObjectiveValid && "Objective", !isSubjectValid && "Subject", !isContentValid && "Content", isScheduled && !isScheduleValid && "Valid Future Time"].filter(Boolean).join(", ")}) to enable.
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="campaign-form"
              disabled={submitting || !isValid}
              className={!isValid ? "opacity-50 cursor-not-allowed" : ""}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {initialData ? "Save Changes" : "Create Campaign"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
