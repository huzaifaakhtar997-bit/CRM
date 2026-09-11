import React from "react";
import { Contact, LifecycleStage } from "../../types/api.types";
import { Edit, Trash2, Eye, Building2, Mail, Phone, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

interface ContactTableProps {
  contacts: Contact[];
  loading: boolean;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  loading,
  onView,
  onEdit,
  onDelete,
  onSendEmail,
}) => {
  const { user } = useAuth();
  
  // RBAC checks
  const canEdit = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  if (loading) {
    return (
      <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-accent/30 flex justify-between">
          <div className="h-5 w-32 bg-accent animate-pulse rounded"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-10 w-10 bg-accent rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-accent rounded w-1/4"></div>
                <div className="h-3 bg-accent rounded w-1/5"></div>
              </div>
              <div className="h-8 w-8 bg-accent rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="w-full bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No contacts found</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          There are no contacts matching your current search or filters. Create a new contact to get started.
        </p>
      </div>
    );
  }

  const getStageColor = (stage: LifecycleStage) => {
    const colors: Record<string, string> = {
      LEAD: "bg-blue-100 text-blue-800 border-blue-200",
      MARKETING_QUALIFIED: "bg-purple-100 text-purple-800 border-purple-200",
      SALES_QUALIFIED: "bg-orange-100 text-orange-800 border-orange-200",
      OPPORTUNITY: "bg-yellow-100 text-yellow-800 border-yellow-200",
      CUSTOMER: "bg-green-100 text-green-800 border-green-200",
      EVANGELIST: "bg-emerald-100 text-emerald-800 border-emerald-200",
      OTHER: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[stage] || colors.OTHER;
  };

  return (
    <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-accent/30 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Contact Details</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Company & Title</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Lifecycle Stage</th>
              <th className="px-6 py-4 font-medium hidden sm:table-cell">Created</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20 flex-shrink-0">
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {contact.firstName} {contact.lastName}
                      </div>
                      {contact.email && (
                        <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1" /> {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="text-xs text-muted-foreground flex items-center mt-0.5 sm:hidden">
                          <Phone className="w-3 h-3 mr-1" /> {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="text-foreground font-medium">
                    {contact.company?.name || contact.companyName || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {contact.jobTitle || "—"}
                  </div>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStageColor(contact.lifecycleStage)}`}>
                    {contact.lifecycleStage.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSendEmail?.(contact)}
                      title={contact.email ? `Send Email to ${contact.email}` : "No email address"}
                      disabled={!contact.email}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary disabled:opacity-30"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(contact)}
                      title="View Details"
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(contact)}
                          title="Edit"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(contact)}
                          title="Delete"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
