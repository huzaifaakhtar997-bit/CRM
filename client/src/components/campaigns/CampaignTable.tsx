import React from "react";
import { Campaign, CampaignStatus } from "../../types/api.types";
import { Edit, Trash2, Calendar, LayoutTemplate, Megaphone } from "lucide-react";
import { Badge, BadgeVariant } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";

interface CampaignTableProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onView: (campaign: Campaign) => void;
  canWrite: boolean;
}

export const getCampaignStatusVariant = (status: CampaignStatus): BadgeVariant => {
  switch (status) {
    case "DRAFT":
      return "neutral";
    case "SCHEDULED":
      return "warning";
    case "ACTIVE":
      return "info";
    case "COMPLETED":
      return "success";
    case "PAUSED":
      return "warning";
    default:
      return "neutral";
  }
};

export const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  onEdit,
  onDelete,
  onView,
  canWrite,
}) => {
  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No campaigns found"
        description="Create your first campaign to engage your contacts with marketing emails."
      />
    );
  }

  return (
    <div className="bg-card border border-border/80 rounded-lg overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-muted-foreground border-b border-border/80 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Campaign Name</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Objective</th>
              <th className="px-4 py-2.5 font-semibold hidden lg:table-cell">Schedule / Sent</th>
              <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="hover:bg-muted/40 transition-colors cursor-pointer group"
                onClick={() => onView(campaign)}
              >
                <td className="px-4 py-2.5">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                    <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[280px]">{campaign.name}</span>
                  </div>
                  {campaign.subject && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[280px]" title={campaign.subject}>
                      Subj: {campaign.subject}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={getCampaignStatusVariant(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground text-xs">
                  <span className="truncate max-w-[200px] block" title={campaign.objective || ""}>
                    {campaign.objective || "—"}
                  </span>
                </td>
                <td className="px-4 py-2.5 hidden lg:table-cell">
                  {campaign.sentAt ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-mono tabular-nums text-xs">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>
                    </div>
                  ) : campaign.scheduledAt ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-mono tabular-nums text-xs">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>Sch: {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {canWrite && (
                    <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(campaign)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        title="Edit Campaign"
                        aria-label="Edit Campaign"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(campaign)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete Campaign"
                        aria-label="Delete Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
