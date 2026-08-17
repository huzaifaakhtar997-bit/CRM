import React from "react";
import { Campaign, CampaignStatus } from "../../types/api.types";
import { Edit, Trash2, Calendar, LayoutTemplate } from "lucide-react";

interface CampaignTableProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  onView: (campaign: Campaign) => void;
  canWrite: boolean;
}

export const getCampaignStatusBadge = (status: CampaignStatus) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "SCHEDULED":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "ACTIVE":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "PAUSED":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns, onEdit, onDelete, onView, canWrite }) => {
  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-accent/50 text-muted-foreground border-b uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">Campaign Name</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold tracking-wider hidden md:table-cell">Objective</th>
              <th className="px-6 py-4 font-semibold tracking-wider hidden lg:table-cell">Schedule/Sent</th>
              <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns.map((campaign) => (
              <tr 
                key={campaign.id} 
                className="hover:bg-accent/20 transition-colors cursor-pointer"
                onClick={() => onView(campaign)}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                    {campaign.name}
                  </div>
                  {campaign.subject && (
                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]" title={campaign.subject}>
                      Subj: {campaign.subject}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${getCampaignStatusBadge(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                  <span className="truncate max-w-[200px] block" title={campaign.objective || ""}>
                    {campaign.objective || "—"}
                  </span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  {campaign.sentAt ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>
                    </div>
                  ) : campaign.scheduledAt ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">Sch: {new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {canWrite && (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(campaign)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        title="Edit Campaign"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this campaign?")) {
                            onDelete(campaign.id);
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete Campaign"
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
        {campaigns.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No campaigns found.
          </div>
        )}
      </div>
    </div>
  );
};
