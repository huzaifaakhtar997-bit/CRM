import React from "react";
import { Deal } from "../../types/api.types";
import { Button } from "../ui/button";
import { X, DollarSign, Calendar, Building2, User, FileText, CheckCircle2, Clock, Flag } from "lucide-react";

interface DealDetailsProps {
  deal: Deal | null;
  onClose: () => void;
  isOpen: boolean;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
  canEdit?: boolean;
}

export const DealDetails: React.FC<DealDetailsProps> = ({
  deal,
  onClose,
  isOpen,
  onEdit,
  onDelete,
  canEdit = false,
}) => {
  if (!isOpen || !deal) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "text-red-600 bg-red-100";
      case "HIGH": return "text-orange-600 bg-orange-100";
      case "MEDIUM": return "text-blue-600 bg-blue-100";
      case "LOW": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Deal Details</h2>
          <div className="flex items-center space-x-2">
            {canEdit && onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(deal)}>
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header Profile */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider ${getPriorityColor(deal.priority)}`}>
                <Flag className="w-3 h-3 mr-1" />
                {deal.priority}
              </span>
              <span 
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold tracking-wider text-white"
                style={{ backgroundColor: deal.stage?.color || '#94a3b8' }}
              >
                {deal.stage?.name}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-foreground leading-tight">
              {deal.title}
            </h3>
            
            <div className="text-3xl font-bold text-primary mt-3 flex items-center">
              <DollarSign className="w-6 h-6 mr-1" />
              {deal.value.toLocaleString()} <span className="text-lg text-muted-foreground ml-2">{deal.currency}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground border-b pb-2">
              Key Information
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Expected Close Date</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(deal.expectedCloseDate).toLocaleDateString()}
                    {new Date(deal.expectedCloseDate) < new Date() && !deal.closedAt && (
                      <span className="ml-2 text-destructive font-medium">(Overdue)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Probability</div>
                  <div className="text-sm text-muted-foreground">
                    {deal.probability}% Win Probability
                  </div>
                </div>
              </div>

              {deal.closedAt && (
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Closed At</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(deal.closedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground border-b pb-2">
              Associations
            </h4>
            
            <div className="space-y-4">
              {deal.company ? (
                <div className="flex items-start bg-accent/20 p-3 rounded-lg border">
                  <Building2 className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Associated Company</div>
                    <div className="text-sm text-primary font-medium">{deal.company.name}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No company associated</div>
              )}

              {deal.contact ? (
                <div className="flex items-start bg-accent/20 p-3 rounded-lg border">
                  <User className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Primary Contact</div>
                    <div className="text-sm text-primary font-medium">{deal.contact.firstName} {deal.contact.lastName}</div>
                    {deal.contact.email && <div className="text-xs text-muted-foreground">{deal.contact.email}</div>}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No contact associated</div>
              )}

              <div className="flex items-start bg-accent/20 p-3 rounded-lg border">
                <User className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Deal Owner</div>
                  <div className="text-sm text-foreground">
                    {deal.assignedUser ? deal.assignedUser.name : "Unassigned"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {deal.notes && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground border-b pb-2">
                Notes
              </h4>
              <div className="flex items-start bg-accent/10 p-4 rounded-lg border border-accent">
                <FileText className="w-4 h-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {deal.notes}
                </p>
              </div>
            </div>
          )}

          {deal.lostReason && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-destructive uppercase tracking-wider border-b pb-2 border-destructive/20">
                Lost Reason
              </h4>
              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 text-destructive text-sm">
                {deal.lostReason}
              </div>
            </div>
          )}
          
          {canEdit && onDelete && (
            <div className="pt-8 flex justify-center">
              <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-white border-destructive/30" onClick={() => onDelete(deal)}>
                Delete Deal
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
