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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Campaign Name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const submitData = { ...formData };
      if (!submitData.scheduledAt) {
        submitData.scheduledAt = null as any; // Allow nulling out
      } else {
        submitData.scheduledAt = new Date(submitData.scheduledAt as string).toISOString();
      }
      
      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-foreground">
            {initialData ? "Edit Campaign" : "Create Campaign"}
          </h2>
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
              <label className="text-sm font-medium text-foreground">Campaign Name *</label>
              <input
                type="text"
                required
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="e.g. Q3 Product Launch"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Objective</label>
              <input
                type="text"
                value={formData.objective || ""}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="e.g. Announce new features to existing customers"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Subject</label>
                <input
                  type="text"
                  value={formData.subject || ""}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
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
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CampaignStatus })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  disabled={formData.status === CampaignStatus.ACTIVE || formData.status === CampaignStatus.COMPLETED}
                >
                  {Object.values(CampaignStatus).map((status) => (
                    <option key={status} value={status} disabled={status === "ACTIVE" || status === "COMPLETED"}>{status}</option>
                  ))}
                </select>
                {(formData.status === CampaignStatus.ACTIVE || formData.status === CampaignStatus.COMPLETED) && (
                  <p className="text-xs text-muted-foreground mt-1">Status cannot be changed manually from here.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Scheduled At</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt || ""}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Content (HTML)</label>
              <textarea
                value={formData.content || ""}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full min-h-[150px] font-mono p-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-y"
                placeholder="<html><body><h1>Hello!</h1></body></html>"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-accent/30 flex justify-end gap-3 rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="campaign-form" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {initialData ? "Save Changes" : "Create Campaign"}
          </Button>
        </div>
      </div>
    </div>
  );
};
