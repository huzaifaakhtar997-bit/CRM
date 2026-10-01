import React, { useEffect, useState } from "react";
import { Lead } from "../../types/api.types";
import { X, Building2, Mail, Phone, Calendar, Loader2, Edit, Trash2, UserCircle, UserCheck, CheckCircle2 } from "lucide-react";
import { getLeadStatusVariant, getLeadSourceLabel } from "./LeadTable";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";
import { leadsApi } from "../../api/leads.api";
import { ConvertLeadModal } from "./ConvertLeadModal";
import { SendLeadEmailModal } from "./SendLeadEmailModal";

interface LeadDetailsProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onConverted?: () => void;
  canWrite: boolean;
}

export const LeadDetails: React.FC<LeadDetailsProps> = ({
  leadId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onConverted,
  canWrite,
}) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && leadId) {
      loadLead();
    } else {
      setLead(null);
      setError(null);
    }
  }, [isOpen, leadId]);

  const loadLead = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadsApi.getLeadById(leadId!);
      setLead(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load lead details.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-foreground">Lead Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                {error}
                <button onClick={loadLead} className="block mt-2 underline hover:no-underline">Retry</button>
              </div>
            </div>
          ) : lead ? (
            <div className="p-6 space-y-8">
              {/* Header section */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
                  {lead.firstName.charAt(0).toUpperCase()}
                </div>
                <div className="pt-1 flex-1">
                  <h3 className="text-xl font-bold text-foreground leading-tight">
                    {lead.firstName} {lead.lastName}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={getLeadStatusVariant(lead.status)}>
                      {lead.status}
                    </Badge>
                    {lead.source && (
                      <Badge variant="neutral">
                        {getLeadSourceLabel(lead.source)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {canWrite && (
                <div className="space-y-2">
                  {lead.status !== "CONVERTED" ? (
                    <Button
                      onClick={() => setIsConvertOpen(true)}
                      className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      Convert to Contact
                    </Button>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>This lead has been successfully converted into a Contact.</span>
                    </div>
                  )}

                  <Button
                    onClick={() => setIsSendEmailOpen(true)}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Mail className="w-4 h-4 text-primary" />
                    Send Email
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit(lead)}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={() => onDelete(lead)}
                      variant="destructive"
                      size="sm"
                      title="Delete Lead"
                      aria-label="Delete Lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Detailed Info */}
              <div className="space-y-6">
                <h4 className="text-sm font-semibold text-foreground border-b pb-2">Contact Details</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.email}</p>
                      <p className="text-xs text-muted-foreground">Email Address</p>
                    </div>
                  </div>
                  {lead.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.phone}</p>
                        <p className="text-xs text-muted-foreground">Phone Number</p>
                      </div>
                    </div>
                  )}
                  {(lead.company || lead.jobTitle) && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {lead.jobTitle ? `${lead.jobTitle} ` : ""}
                          {lead.company ? (lead.jobTitle ? `at ${lead.company}` : lead.company) : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">Work</p>
                      </div>
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-foreground border-b pb-2 pt-2">System Info</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <UserCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      {lead.assignedUser ? (
                        <>
                          <p className="text-sm font-medium text-foreground">{lead.assignedUser.name}</p>
                          <p className="text-xs text-muted-foreground">Assigned To</p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground italic">Unassigned</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(lead.createdAt).toLocaleDateString([], { dateStyle: "medium" })}
                      </p>
                      <p className="text-xs text-muted-foreground">Created At</p>
                    </div>
                  </div>
                </div>

                {lead.notes && (
                  <>
                    <h4 className="text-sm font-semibold text-foreground border-b pb-2 pt-2">Notes</h4>
                    <div className="bg-accent/50 p-4 rounded-lg text-sm text-foreground whitespace-pre-wrap">
                      {lead.notes}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ConvertLeadModal
        lead={lead}
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        onSuccess={() => {
          loadLead();
          if (onConverted) onConverted();
        }}
      />

      <SendLeadEmailModal
        lead={lead}
        isOpen={isSendEmailOpen}
        onClose={() => setIsSendEmailOpen(false)}
        onSuccess={() => {
          loadLead();
          if (onConverted) onConverted();
        }}
      />
    </>
  );
};
