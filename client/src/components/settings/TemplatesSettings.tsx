import React, { useState, useEffect } from "react";
import { Template, templatesApi, GetTemplatesParams } from "../../api/templates.api";
import { useAuth } from "../../context/AuthContext";
import { Plus, Edit, Trash2, Search, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";

const TemplateForm: React.FC<{
  initial: Template | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ initial, onClose, onSave }) => {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<"EMAIL_REPLY" | "CAMPAIGN">(initial?.type || "EMAIL_REPLY");
  const [subject, setSubject] = useState(initial?.subject || "");
  const [content, setContent] = useState(initial?.content || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) { setError("Name and content are required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      if (initial) {
        await templatesApi.updateTemplate(initial.id, { name, type, subject: subject || null, content });
      } else {
        await templatesApi.createTemplate({ name, type, subject: subject || null, content });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">{initial ? "Edit Template" : "Create Template"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <form id="tpl-form" onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Welcome reply" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="EMAIL_REPLY">Email Reply</option>
                <option value="CAMPAIGN">Campaign</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject <span className="text-muted-foreground text-xs">(optional)</span></label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Email subject..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Content *</label>
            <textarea required value={content} onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[150px] p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              placeholder="Template body..." />
          </div>
        </form>
        <div className="p-5 border-t bg-accent/30 flex justify-end gap-3 rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="tpl-form" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const TemplatesSettings: React.FC = () => {
  const { user } = useAuth();
  const canWrite = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "EMAIL_REPLY" | "CAMPAIGN">("");
  const [editing, setEditing] = useState<Template | null | false>(false);

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

  useEffect(() => { fetchTemplates(); }, [search, typeFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await templatesApi.deleteTemplate(id);
      fetchTemplates();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-lg font-bold">Canned Reply Templates</h2>
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
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..." className="w-full pl-10 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
          className="border rounded-md bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Types</option>
          <option value="EMAIL_REPLY">Email Reply</option>
          <option value="CAMPAIGN">Campaign</option>
        </select>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
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
            <tbody className="divide-y">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-accent/10">
                  <td className="px-5 py-3 font-medium">{t.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.type === "EMAIL_REPLY" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {t.type === "EMAIL_REPLY" ? "Email Reply" : "Campaign"}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground truncate max-w-[200px]">{t.subject || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    {canWrite && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditing(t)} className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {templates.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No templates found.</div>}
        </div>
      )}

      {editing !== false && (
        <TemplateForm initial={editing} onClose={() => setEditing(false)} onSave={fetchTemplates} />
      )}
    </div>
  );
};
