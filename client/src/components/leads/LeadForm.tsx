import React, { useState, useEffect } from "react";
import { Lead, LeadStatus, LeadSource } from "../../types/api.types";
import { X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface LeadFormProps {
  initialData?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Lead>) => Promise<void>;
}

export const LeadForm: React.FC<LeadFormProps> = ({ initialData, isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    status: LeadStatus.NEW,
    source: null,
    notes: "",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName || "",
        email: initialData.email,
        phone: initialData.phone || "",
        company: initialData.company || "",
        jobTitle: initialData.jobTitle || "",
        status: initialData.status,
        source: initialData.source,
        notes: initialData.notes || "",
      });
    } else if (isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        status: LeadStatus.NEW,
        source: null,
        notes: "",
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email) {
      setError("First Name and Email are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-foreground">
            {initialData ? "Edit Lead" : "Add New Lead"}
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

          <form id="lead-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName || ""}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName || ""}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company</label>
                <input
                  type="text"
                  value={formData.company || ""}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Job Title</label>
                <input
                  type="text"
                  value={formData.jobTitle || ""}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="CEO"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                >
                  {Object.values(LeadStatus).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Source</label>
                <select
                  value={formData.source || ""}
                  onChange={(e) => setFormData({ ...formData, source: (e.target.value as LeadSource) || null })}
                  className="w-full h-10 px-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                >
                  <option value="">-- Unknown Source --</option>
                  {Object.values(LeadSource).map((source) => (
                    <option key={source} value={source}>{source.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Notes</label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full min-h-[100px] p-3 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-y"
                placeholder="Initial context, requirements, or qualification notes..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-accent/30 flex justify-end gap-3 rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="lead-form" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {initialData ? "Save Changes" : "Create Lead"}
          </Button>
        </div>
      </div>
    </div>
  );
};
