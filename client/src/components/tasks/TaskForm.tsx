import React, { useState, useEffect } from "react";
import { Task, Priority, TaskType } from "../../types/api.types";
import { Button } from "../ui/button";
import { X, AlertCircle } from "lucide-react";
import { api } from "../../api/axios";

interface TaskFormProps {
  initialData: Task | null;
  onSave: (data: Partial<Task>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  onSave,
  onClose,
  isOpen,
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    taskType: TaskType.CALL,
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "",
    priority: Priority.MEDIUM,
    contactId: null,
    dealId: null,
    companyName: "",
    assignedUserId: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data for relations dropdowns
  const [contacts, setContacts] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Load dropdown data
      api.get("/contacts?limit=100").then(res => setContacts(res.data.data.contacts || []));
      api.get("/deals?limit=100").then(res => setDeals(res.data.data.deals || []));
      api.get("/users?limit=100").then(res => setUsers(res.data.data.users || []));

      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description || "",
          taskType: initialData.taskType,
          dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : "",
          dueTime: initialData.dueTime || "",
          priority: initialData.priority,
          contactId: initialData.contactId || null,
          dealId: initialData.dealId || null,
          companyName: initialData.companyName || "",
          assignedUserId: initialData.assignedUserId || null,
        });
      } else {
        setFormData({
          title: "",
          description: "",
          taskType: TaskType.CALL,
          dueDate: new Date().toISOString().split("T")[0],
          dueTime: "",
          priority: Priority.MEDIUM,
          contactId: null,
          dealId: null,
          companyName: "",
          assignedUserId: null,
        });
      }
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
    if (!formData.title || !formData.dueDate) {
      setError("Title and Due Date are required.");
      return;
    }

    const submissionData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate as string).toISOString() : undefined,
    };

    setLoading(true);
    setError(null);
    try {
      await onSave(submissionData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save task.");
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
            {initialData ? "Edit Task" : "Create New Task"}
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
            <label className="text-sm font-medium text-foreground">Task Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title || ""}
              onChange={handleChange}
              placeholder="e.g. Call decision maker to discuss pricing"
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Task Type</label>
              <select
                name="taskType"
                value={formData.taskType || TaskType.CALL}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.values(TaskType).map(t => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Due Date *</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate as string || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Time (Optional)</label>
              <input
                type="time"
                name="dueTime"
                value={formData.dueTime || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t mt-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Associations</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contact</label>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Deal</label>
              <select
                name="dealId"
                value={formData.dealId || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company Name</label>
              <input
                type="text"
                name="companyName"
                placeholder="Free text company name"
                value={formData.companyName || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Assigned User</label>
              <select
                name="assignedUserId"
                value={formData.assignedUserId || ""}
                onChange={handleChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description / Notes</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Any details to remember for this task..."
              className="w-full flex rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t mt-auto">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
