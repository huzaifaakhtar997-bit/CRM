import React from "react";
import { Contact, LifecycleStage } from "../../types/api.types";
import { Edit, Trash2, Eye, Mail, Phone, Clock, Lock, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Badge, BadgeVariant } from "../ui/Badge";
import { TableSkeleton } from "../ui/TableSkeleton";
import { EmptyState } from "../ui/EmptyState";

interface ContactTableProps {
  contacts: Contact[];
  loading: boolean;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
  onCreateNew?: () => void;
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  loading,
  onView,
  onEdit,
  onDelete,
  onSendEmail,
  onCreateNew,
}) => {
  const { user } = useAuth();
  
  // RBAC checks
  const canEdit = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  const getStageVariant = (stage: LifecycleStage | string): BadgeVariant => {
    switch (stage) {
      case "CUSTOMER":
        return "success";
      case "OPPORTUNITY":
        return "warning";
      case "MQL":
      case "SQL":
        return "purple";
      case "CHURNED":
        return "destructive";
      case "LEAD":
      default:
        return "info";
    }
  };

  if (!loading && contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No contacts found"
        description="There are no contacts matching your current search or filters. Create a new contact to get started."
        actionLabel={canEdit && onCreateNew ? "Add Contact" : undefined}
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="w-full bg-card border border-border/80 rounded-lg overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border/70">
            <tr>
              <th className="px-4 py-2 font-medium">Contact Details</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">Company & Title</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell">Lifecycle Stage</th>
              <th className="px-4 py-2 font-medium hidden xl:table-cell">Owner</th>
              <th className="px-4 py-2 font-medium hidden sm:table-cell">Created</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          {loading ? (
            <TableSkeleton columns={6} rows={6} />
          ) : (
            <tbody className="divide-y divide-border/60">
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  onClick={() => onView(contact)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-7 w-7 rounded-md bg-secondary text-foreground flex items-center justify-center font-bold border border-border/70 shrink-0 text-xs">
                        {contact.firstName[0]}
                        {contact.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground group-hover:text-foreground transition-colors truncate max-w-[200px]" title={`${contact.firstName} ${contact.lastName}`}>
                          {contact.firstName} {contact.lastName}
                        </div>
                        {contact.email && (
                          <div className="text-[11px] text-muted-foreground flex items-center mt-0.5 truncate max-w-[200px]" title={contact.email}>
                            <Mail className="w-3 h-3 mr-1 shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="text-[11px] text-muted-foreground flex items-center mt-0.5 sm:hidden">
                            <Phone className="w-3 h-3 mr-1 shrink-0" /> {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <div className="text-foreground font-medium text-xs truncate max-w-[180px]" title={contact.company?.name || contact.companyName || "—"}>
                      {contact.company?.name || contact.companyName || "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                      {contact.jobTitle || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant={getStageVariant(contact.lifecycleStage)}>
                          {contact.lifecycleStage === "CUSTOMER" && Boolean(contact.hasWonDeal || contact.deals?.length) && (
                            <Lock className="w-2.5 h-2.5 shrink-0 opacity-80 mr-0.5" />
                          )}
                          {contact.lifecycleStage?.replace("_", " ")}
                        </Badge>
                        {contact.lead && (
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" title={`Converted from inbound lead (${contact.lead.status || 'CONVERTED'})`}>
                            From Lead
                          </span>
                        )}
                      </div>
                      {contact.status && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-mono bg-muted text-muted-foreground border border-border/60">
                          {contact.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden xl:table-cell">
                    {contact.assignedUser ? (
                      <div className="flex items-center space-x-1.5">
                        <div className="h-5 w-5 rounded-md bg-muted text-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 border border-border/60">
                          {contact.assignedUser.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="text-foreground text-xs font-medium truncate max-w-[120px]" title={contact.assignedUser.name}>
                          {contact.assignedUser.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60 text-xs italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground text-[11px] font-mono tabular-nums">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-muted-foreground/70" />
                      {new Date(contact.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSendEmail?.(contact)}
                        title={contact.email ? `Send email to ${contact.email}` : "No email address"}
                        disabled={!contact.email}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 rounded-md"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(contact)}
                        title="View profile"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(contact)}
                            title="Edit contact"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(contact)}
                            title="Delete contact"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};
