import React, { useEffect } from "react";
import { Contact } from "../../types/api.types";
import { Button } from "../ui/button";
import { Badge } from "../ui/Badge";
import { X, Mail, Phone, Building2, UserCircle, Briefcase, Calendar, Tag, FileText, Lock, Award } from "lucide-react";

interface ContactDetailsProps {
  contact: Contact | null;
  onClose: () => void;
  isOpen: boolean;
  onSendEmail?: (contact: Contact) => void;
}

export const ContactDetails: React.FC<ContactDetailsProps> = ({
  contact,
  onClose,
  isOpen,
  onSendEmail,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !contact) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Contact Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Profile */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold border border-primary/20">
              {contact.firstName[0]}
              {contact.lastName[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {contact.firstName} {contact.lastName}
              </h3>
              <div className="text-sm text-muted-foreground mt-1 flex items-center">
                <Briefcase className="w-4 h-4 mr-1.5" />
                {contact.jobTitle || "No Title"}
              </div>
            </div>
          </div>

          {/* Quick Communication Action */}
          <div>
            <Button
              onClick={() => onSendEmail?.(contact)}
              className="w-full gap-2 shadow-sm font-medium"
              disabled={!contact.email}
            >
              <Mail className="w-4 h-4" />
              {contact.email ? "Send Email / Message" : "No Email Configured"}
            </Button>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              Contact Information
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Email</div>
                  <div className="text-sm text-muted-foreground">
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                        {contact.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Phone</div>
                  <div className="text-sm text-muted-foreground">
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                        {contact.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <Building2 className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Company</div>
                  <div className="text-sm text-muted-foreground">
                    {contact.company?.name || contact.companyName || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              CRM Details
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <Tag className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Lifecycle Stage</div>
                  <div className="mt-1 flex items-center gap-2">
                    {contact.lifecycleStage === "CUSTOMER" && (
                      <Badge variant="success">
                        {Boolean(contact.hasWonDeal || contact.deals?.length) && (
                          <Lock className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                        )}
                        Customer
                      </Badge>
                    )}
                    {contact.lifecycleStage === "OPPORTUNITY" && <Badge variant="purple">Opportunity</Badge>}
                    {contact.lifecycleStage === "SQL" && <Badge variant="info">SQL</Badge>}
                    {contact.lifecycleStage === "MQL" && <Badge variant="warning">MQL</Badge>}
                    {contact.lifecycleStage === "LEAD" && <Badge variant="neutral">Lead</Badge>}
                    {contact.lifecycleStage === "CUSTOMER" && Boolean(contact.hasWonDeal || contact.deals?.length) && (
                      <span className="text-xs text-muted-foreground">
                        (Locked by Won Deal)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {contact.status && (
                <div className="flex items-start">
                  <Award className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Qualification Tag</div>
                    <div className="mt-1">
                      <Badge variant="purple">
                        {contact.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <UserCircle className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Assigned To</div>
                  <div className="text-sm text-muted-foreground">
                    {contact.assignedUser?.name || "Unassigned"}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Created Date</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(contact.notes || contact.tags.length > 0) && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
                Additional Information
              </h4>
              
              {contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map(tag => (
                    <Badge key={tag} variant="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {contact.notes && (
                <div className="flex items-start bg-muted/40 p-3.5 rounded-lg border text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground mr-2.5 mt-0.5 flex-shrink-0" />
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {contact.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
