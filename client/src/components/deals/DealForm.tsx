import React, { useState, useEffect } from "react";
import { Deal, Priority, PipelineStage } from "../../types/api.types";
import { Button } from "../ui/button";
import { X, AlertCircle } from "lucide-react";
import { api } from "../../api/axios";

interface DealFormProps {
  initialData: Deal | null;
  stages: PipelineStage[];
  onSave: (data: Partial<Deal>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export const DealForm: React.FC<DealFormProps> = ({
  initialData,
  stages,
  onSave,
  onClose,
  isOpen,
}) => {
  const [formData, setFormData] = useState<Partial<Deal>>({
    title: "",
    value: 0,
    currency: "USD",
    probability: 50,
    expectedCloseDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    priority: Priority.MEDIUM,
    stageId: "",
    notes: "",
    companyId: null,
    contactId: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lists for dropdowns (loaded when modal opens)
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Load quick lists
      api.get("/companies?limit=100").then(res => setCompanies(res.data.data.companies || []));
      api.get("/contacts?limit=100").then(res => setContacts(res.data.data.contacts || []));

      if (initialData) {
        setFormData({
          title: initialData.title,
          value: initialData.value,
          currency: initialData.currency,
          probability: initialData.probability,
          expectedCloseDate: new Date(initialData.expectedCloseDate).toISOString().split("T")[0],
          priority: initialData.priority,
          stageId: initialData.stageId,
          notes: initialData.notes || "",
          companyId: initialData.companyId || null,
          contactId: initialData.contactId || null,
        });
      } else {
        setFormData({
          title: "",
          value: 0,
          currency: "USD",
          probability: stages.length > 0 ? stages[0].probability : 50,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default 30 days out
          priority: Priority.MEDIUM,
          stageId: stages.length > 0 ? stages[0].id : "",
          notes: "",
          companyId: null,
          contactId: null,
        });
      }
      setError(null);
    }
  }, [initialData, isOpen, stages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Auto-update probability when stage changes
    if (name === "stageId") {
      const selectedStage = stages.find(s => s.id === value);
      if (selectedStage) {
        setFormData(prev => ({
          ...prev,
          stageId: value,
          probability: selectedStage.probability
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : (value === "" ? null : value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.stageId) {
      setError("Title and Stage are required.");
      return;
    }

    // Convert date string back to full ISO string to pass validation
    const submissionData = {
      ...formData,
      expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate as string).toISOString() : undefined
    };

    setLoading(true);
    setError(null);
    try {
      await onSave(submissionData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save deal.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-xl rounded-xl border shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">
            {initialData ? "Edit Deal" : "Create New Deal"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Deal Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title || ""}
              onChange={handleChange}
              placeholder="e.g. Acme Corp Enterprise License"
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  name="value"
                  min="0"
                  value={formData.value || ""}
                  onChange={handleChange}
                  className="w-full flex h-10 rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pipeline Stage *</label>
              <select
                name="stageId"
                value={formData.stageId || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="" disabled>Select stage...</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name} ({stage.probability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Expected Close Date *</label>
              <input
                type="date"
                name="expectedCloseDate"
                value={formData.expectedCloseDate as string || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <select
                name="priority"
                value={formData.priority || Priority.MEDIUM}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.values(Priority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Associated Company</label>
              <select
                name="companyId"
                value={formData.companyId || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Associated Contact</label>
              <select
                name="contactId"
                value={formData.contactId || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Internal deal notes..."
              className="w-full flex rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t mt-auto">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Update Deal" : "Create Deal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
