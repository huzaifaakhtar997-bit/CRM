import React, { useState, useEffect } from "react";
import { Template, templatesApi, GetTemplatesParams } from "../../api/templates.api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Plus, Edit, Trash2, Search, X, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/Badge";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { TableSkeleton } from "../ui/TableSkeleton";

const TemplateForm: React.FC<{
  initial: Template | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ initial, onClose, onSave }) => {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<"EMAIL_REPLY" | "CAMPAIGN">(initial?.type || "EMAIL_REPLY");
  const [subject, setSubject] = useState(initial?.subject || "");
  const [content, setContent] = useState(initial?.content || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setError("Name and content are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (initial) {
        await templatesApi.updateTemplate(initial.id, { name, type, subject: subject || null, content });
        toast.success("Template updated successfully.");
      } else {
        await templatesApi.createTemplate({ name, type, subject: subject || null, content });
        toast.success("Template created successfully.");
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save template.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-foreground">{initial ? "Edit Template" : "Create Template"}</h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 hover:bg-accent rounded-full text-muted-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form id="tpl-form" onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Welcome reply"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="EMAIL_REPLY">Email Reply</option>
                <option value="CAMPAIGN">Campaign</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Subject <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Email subject..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Content *</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[150px] p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              placeholder="Template body..."
            />
          </div>
        </form>
        <div className="p-5 border-t bg-accent/30 flex justify-end gap-3 rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="tpl-form" loading={submitting}>
            {initial ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const TemplatesSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canWrite = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "EMAIL_REPLY" | "CAMPAIGN">("");
  const [editing, setEditing] = useState<Template | null | false>(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: GetTemplatesParams = { limit: 50 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const data = await templatesApi.getTemplates(params);
      setTemplates(data.templates);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [search, typeFilter]);

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;
    setDeleting(true);
    try {
      await templatesApi.deleteTemplate(templateToDelete.id);
      toast.success(`Template "${templateToDelete.name}" deleted.`);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete template.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-foreground">Canned Reply Templates</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Reusable templates for inbox replies and campaigns.</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)} className="gap-2">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="border rounded-md bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Types</option>
          <option value="EMAIL_REPLY">Email Reply</option>
          <option value="CAMPAIGN">Campaign</option>
        </select>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates found"
          description="Create canned reply templates to quickly answer customer queries or compose campaigns."
          actionLabel={canWrite ? "New Template" : undefined}
          onAction={canWrite ? () => setEditing(null) : undefined}
        />
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-accent/50 text-muted-foreground border-b text-xs uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Subject</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{t.name}</td>
                  <td className="px-5 py-3">
                    <Badge variant={t.type === "EMAIL_REPLY" ? "info" : "purple"}>
                      {t.type === "EMAIL_REPLY" ? "Email Reply" : "Campaign"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                    {t.subject || "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {canWrite && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(t)}
                          className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit Template"
                          aria-label="Edit Template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTemplateToDelete(t)}
                          className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete Template"
                          aria-label="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== false && (
        <TemplateForm initial={editing} onClose={() => setEditing(false)} onSave={fetchTemplates} />
      )}

      <ConfirmDialog
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        message={`Are you sure you want to delete template "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
};
