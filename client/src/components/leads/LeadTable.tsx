import React from "react";
import { Lead, LeadStatus, LeadSource } from "../../types/api.types";
import { Edit, Trash2, Phone, Mail, Building2, Users } from "lucide-react";
import { Badge, BadgeVariant } from "../ui/Badge";
import { TableSkeleton } from "../ui/TableSkeleton";
import { EmptyState } from "../ui/EmptyState";

interface LeadTableProps {
  leads: Lead[];
  loading?: boolean;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onView: (lead: Lead) => void;
  onSendEmail?: (lead: Lead) => void;
  canWrite: boolean;
}

export const getLeadStatusVariant = (status: LeadStatus): BadgeVariant => {
  switch (status) {
    case "NEW":
      return "info";
    case "CONTACTED":
      return "warning";
    case "QUALIFIED":
      return "success";
    case "LOST":
      return "neutral";
    default:
      return "neutral";
  }
};

export const getLeadStatusBadge = (status: LeadStatus) => {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "CONTACTED":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "QUALIFIED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "LOST":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const getLeadSourceLabel = (source: LeadSource | null) => {
  if (!source) return "—";
  return source.replace("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onSendEmail,
  canWrite,
}) => {
  return (
    <div className="bg-card border border-border/80 rounded-lg overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/30 text-muted-foreground border-b border-border/70 uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Contact Info</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">Source</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell">Assigned To</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    icon={Users}
                    title="No leads found"
                    description="No leads match your current search and filter criteria."
                  />
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  onClick={() => onView(lead)}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-xs text-foreground group-hover:text-foreground transition-colors">
                      {lead.firstName} {lead.lastName}
                    </div>
                    {lead.jobTitle && lead.company ? (
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-muted-foreground/70" />
                        <span className="truncate max-w-[200px]">{lead.jobTitle} at {lead.company}</span>
                      </div>
                    ) : lead.company ? (
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-muted-foreground/70" />
                        <span className="truncate max-w-[200px]">{lead.company}</span>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[220px]" title={lead.email}>
                        <Mail className="w-3 h-3 shrink-0 text-muted-foreground/70" />
                        <span className="truncate text-xs">{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                          <Phone className="w-3 h-3 shrink-0 text-muted-foreground/70" />
                          <span className="text-[11px]">{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={getLeadStatusVariant(lead.status)}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground text-xs">
                    {getLeadSourceLabel(lead.source)}
                  </td>
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    {lead.assignedUser ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-secondary text-foreground flex items-center justify-center text-[10px] font-semibold shrink-0 border border-border/70">
                          {lead.assignedUser.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-foreground text-xs max-w-[120px]">{lead.assignedUser.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground/60 text-xs italic">
                        <span>Unassigned</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {canWrite && (
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {onSendEmail && (
                          <button
                            onClick={() => onSendEmail(lead)}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                            title="Send Email to Lead"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(lead)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                          title="Edit Lead"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(lead)}
                          className="p-1 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
