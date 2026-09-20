import React, { useState, useEffect } from "react";
import { Contact, LifecycleStage } from "../../types/api.types";
import { Button } from "../ui/button";
import { X, AlertCircle } from "lucide-react";

interface ContactFormProps {
  initialData: Contact | null;
  onSave: (data: Partial<Contact>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  initialData,
  onSave,
  onClose,
  isOpen,
}) => {
  const [formData, setFormData] = useState<Partial<Contact>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    lifecycleStage: LifecycleStage.LEAD,
    leadSource: null,
    status: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasWonDeal = Boolean(
    initialData?.hasWonDeal || (initialData?.deals && initialData.deals.length > 0)
  );

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email || "",
        phone: initialData.phone || "",
        jobTitle: initialData.jobTitle || "",
        lifecycleStage: initialData.hasWonDeal ? LifecycleStage.CUSTOMER : initialData.lifecycleStage,
        leadSource: initialData.leadSource || null,
        status: initialData.status || "",
        notes: initialData.notes || "",
      });
      setError(null);
    } else if (!initialData && isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        lifecycleStage: LifecycleStage.LEAD,
        leadSource: null,
        status: "",
        notes: "",
      });
      setError(null);
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      setError("First and Last name are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save contact.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-xl border shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">
            {initialData ? "Edit Contact" : "Add New Contact"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Lifecycle Stage</label>
                {hasWonDeal && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    🔒 Locked (Won Deal)
                  </span>
                )}
              </div>
              <select
                name="lifecycleStage"
                value={hasWonDeal ? LifecycleStage.CUSTOMER : (formData.lifecycleStage || LifecycleStage.LEAD)}
                onChange={handleChange}
                disabled={hasWonDeal}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {Object.values(LifecycleStage).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage.replace("_", " ")}
                  </option>
                ))}
              </select>
              {hasWonDeal && (
                <p className="text-[11px] text-muted-foreground">
                  Contact has a Won deal — lifecycle status is locked to Customer.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Qualification Tag</label>
            <select
              name="status"
              value={formData.status || ""}
              onChange={handleChange}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">No Qualification Tag</option>
              <option value="MQL">MQL (Marketing Qualified)</option>
              <option value="SQL">SQL (Sales Qualified)</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="UNQUALIFIED">Unqualified</option>
            </select>
            <p className="text-[11px] text-muted-foreground">
              Freely editable manual qualification label (MQL, SQL, etc.) independent of deal progress.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows={3}
              className="w-full flex rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Update Contact" : "Create Contact"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
