import React, { useState, useEffect } from "react";
import { Send, Shield, Loader2, FileText, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { templatesApi, Template } from "../../api/templates.api";
import { useAuth } from "../../context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MessageComposerProps {
  onSend: (content: string, isInternal: boolean) => Promise<void>;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, disabled }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  // Template selector state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load EMAIL_REPLY templates when role has access (ADMIN, MANAGER, SUPPORT)
  const canUseTemplates = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SUPPORT";

  useEffect(() => {
    if (!canUseTemplates) return;
    setLoadingTemplates(true);
    templatesApi.getTemplates({ type: "EMAIL_REPLY", limit: 50 })
      .then((data) => setTemplates(data.templates))
      .catch(() => {}) // non-critical
      .finally(() => setLoadingTemplates(false));
  }, [canUseTemplates]);

  const handleTemplateSelect = (template: Template) => {
    setContent(template.content);
    setShowTemplates(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || disabled || sending) return;

    setSending(true);
    try {
      await onSend(content, isInternal);
      setContent("");
      setIsInternal(false);
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-card border-t border-border">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative rounded-lg border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInternal ? "Write an internal note..." : "Type your reply..."}
            className={cn(
              "w-full p-3 min-h-[100px] resize-none bg-transparent outline-none text-sm rounded-lg",
              isInternal ? "bg-amber-50/30 placeholder:text-amber-700/50" : "placeholder:text-muted-foreground"
            )}
            disabled={disabled || sending}
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* Internal note toggle */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="sr-only"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                disabled={disabled || sending}
              />
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isInternal
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "border-input group-hover:border-amber-400 bg-white"
                )}
              >
                {isInternal && <Shield className="w-3 h-3" />}
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Internal Note
              </span>
            </label>

            {/* Template selector */}
            {canUseTemplates && templates.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTemplates((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border rounded-md px-2.5 py-1.5 hover:bg-accent transition-colors"
                  disabled={disabled || sending}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Templates
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showTemplates && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                    <div className="absolute bottom-full mb-1 left-0 z-20 w-64 bg-card border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="p-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b bg-accent/30 px-3">
                        Select a template
                      </div>
                      <ul className="max-h-52 overflow-y-auto">
                        {loadingTemplates ? (
                          <li className="flex items-center justify-center p-4">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </li>
                        ) : templates.map((t) => (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => handleTemplateSelect(t)}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                            >
                              <p className="font-medium truncate">{t.name}</p>
                              {t.subject && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">Subj: {t.subject}</p>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
              Press <kbd className="font-sans px-1 py-0.5 bg-accent rounded border">Ctrl</kbd> + <kbd className="font-sans px-1 py-0.5 bg-accent rounded border">Enter</kbd> to send
            </span>
            <button
              type="submit"
              disabled={!content.trim() || disabled || sending}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors",
                isInternal
                  ? "bg-amber-500 hover:bg-amber-600 text-white disabled:bg-amber-300"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-primary/50"
              )}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isInternal ? "Save Note" : "Send Reply"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
