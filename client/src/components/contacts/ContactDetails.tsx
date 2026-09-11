import React from "react";
import { Contact } from "../../types/api.types";
import { Button } from "../ui/button";
import { X, Mail, Phone, Building2, UserCircle, Briefcase, Calendar, Tag, FileText } from "lucide-react";

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
  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
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
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {contact.lifecycleStage.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

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
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {contact.notes && (
                <div className="flex items-start bg-accent/30 p-3 rounded-lg">
                  <FileText className="w-4 h-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground whitespace-pre-wrap">
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
